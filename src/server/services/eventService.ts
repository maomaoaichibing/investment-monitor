import { db } from '@/lib/db'
import { CreateEventInput, UpdateEventInput, QueryEventInput } from '@/lib/schemas/eventSchema';
import { fetchNewsForSymbol } from './newsService';

/**
 * 事件服务层
 * 处理事件的CRUD操作和业务逻辑
 */
export class EventService {
  /**
   * 创建事件
   */
  async createEvent(data: CreateEventInput) {
    const event = await db.event.create({
      data: {
        symbol: data.symbol,
        eventType: data.eventType,
        title: data.title,
        content: data.content,
        eventTime: data.eventTime ? new Date(data.eventTime) : new Date(),
        source: data.source,
        metadataJson: JSON.stringify(data.metadataJson || {})
      },
      include: {
        _count: {
          select: {
            eventAnalyses: true,
            alerts: true
          }
        }
      }
    });

    return this.transformEvent(event);
  }

  /**
   * 获取事件列表（支持分页和筛选）
   */
  async getEvents(query: QueryEventInput) {
    const { page, pageSize, symbol, eventType, startDate, endDate, source } = query;
    const skip = (page - 1) * pageSize;

    // 构建筛选条件
    const where: any = {};
    
    if (symbol) {
      where.symbol = symbol;
    }
    
    if (eventType) {
      where.eventType = eventType;
    }
    
    if (startDate || endDate) {
      where.eventTime = {};
      if (startDate) {
        where.eventTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.eventTime.lte = new Date(endDate);
      }
    }
    
    if (source) {
      where.source = source;
    }

    // 查询总数
    const total = await db.event.count({ where });

    // 查询数据
    const events = await db.event.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        eventTime: 'desc'
      },
      include: {
        _count: {
          select: {
            eventAnalyses: true,
            alerts: true
          }
        }
      }
    });

    return {
      events: events.map(event => this.transformEvent(event)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * 获取单个事件详情
   */
  async getEventById(id: string) {
    const event = await db.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            eventAnalyses: true,
            alerts: true
          }
        }
      }
    });

    if (!event) {
      throw new Error(`Event with id ${id} not found`);
    }

    return this.transformEvent(event);
  }

  /**
   * 更新事件
   */
  async updateEvent(id: string, data: UpdateEventInput) {
    const event = await db.event.update({
      where: { id },
      data: {
        symbol: data.symbol,
        eventType: data.eventType,
        title: data.title,
        content: data.content,
        eventTime: data.eventTime ? new Date(data.eventTime) : undefined,
        source: data.source,
        metadataJson: data.metadataJson ? JSON.stringify(data.metadataJson) : undefined
      },
      include: {
        _count: {
          select: {
            eventAnalyses: true,
            alerts: true
          }
        }
      }
    });

    return this.transformEvent(event);
  }

  /**
   * 删除事件
   */
  async deleteEvent(id: string) {
    const event = await db.event.delete({
      where: { id },
      include: {
        _count: {
          select: {
            eventAnalyses: true,
            alerts: true
          }
        }
      }
    });

    return this.transformEvent(event);
  }

  /**
   * 获取某只股票的所有事件
   */
  async getEventsBySymbol(symbol: string, limit = 20) {
    const events = await db.event.findMany({
      where: { symbol },
      take: limit,
      orderBy: {
        eventTime: 'desc'
      },
      include: {
        _count: {
          select: {
            eventAnalyses: true,
            alerts: true
          }
        }
      }
    });

    return events.map(event => this.transformEvent(event));
  }

  /**
   * 自动抓取事件（真实数据）
   * 从 newsService 和 EastMoney 抓取真实新闻，存入数据库
   */
  async autoFetchEvents(symbol: string, days = 7) {
    const results: any[] = []
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // 数据源 1：newsService（Yahoo Finance + 新浪 + EastMoney）
    try {
      const newsResult = await fetchNewsForSymbol(symbol, 'US', { limit: 20 })
      if (newsResult.success && newsResult.data && newsResult.data.length > 0) {
        for (const item of newsResult.data) {
          const eventTime = new Date(item.publishedAt)
          if (eventTime < cutoff) continue

          const existing = await db.event.findFirst({
            where: { symbol: item.symbol, title: item.title, source: 'news' }
          })
          if (!existing) {
            const event = await db.event.create({
              data: {
                symbol: item.symbol,
                eventType: 'news',
                title: item.title,
                content: item.content,
                eventTime,
                source: 'news',
                metadataJson: JSON.stringify({
                  url: item.url,
                  newsSource: item.source,
                  sentiment: item.sentiment || 'neutral',
                  sentimentScore: item.sentimentScore,
                  tags: item.tags || []
                })
              },
              include: { _count: { select: { eventAnalyses: true, alerts: true } } }
            })
            results.push(this.transformEvent(event))
            console.log(`[EventService] ✅ 保存新闻: ${item.title.substring(0, 40)}`)
          }
        }
      }
    } catch (err) {
      console.error(`[EventService] newsService 调用失败 ${symbol}:`, err)
    }

    // 数据源 2：东方财富公告（A股）
    try {
      let secid: string
      if (symbol.startsWith('6')) secid = `1.${symbol}`
      else if (symbol.startsWith('0') || symbol.startsWith('3')) secid = `0.${symbol}`
      else if (symbol.startsWith('4') || symbol.startsWith('8')) secid = `0.${symbol}`
      else return results // 非A股不查东方财富

      const emUrl = `https://np-anotice-stock.eastmoney.com/api/security/ann?sr=-1&page_size=10&page_index=1&ann_type=SHA,SZA&secid=${secid}&stock=${symbol}`
      const response = await fetch(emUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.eastmoney.com' },
        signal: AbortSignal.timeout(8000)
      })

      if (response.ok) {
        const json: any = await response.json()
        const list = json?.data?.list || []
        for (const item of list.slice(0, 10)) {
          const eventTime = new Date(item.notice_date || item.display_time || Date.now())
          if (eventTime < cutoff) continue

          const existing = await db.event.findFirst({
            where: { symbol, title: item.title, source: 'announcement' }
          })
          if (!existing) {
            const event = await db.event.create({
              data: {
                symbol,
                eventType: 'announcement',
                title: item.title,
                content: item.summary || '',
                eventTime,
                source: 'announcement',
                metadataJson: JSON.stringify({
                  url: item.art_code ? `https://www.eastmoney.com/news/${item.art_code}` : '',
                  newsSource: '东方财富',
                  tags: [item.column_name || '公告']
                })
              },
              include: { _count: { select: { eventAnalyses: true, alerts: true } } }
            })
            results.push(this.transformEvent(event))
            console.log(`[EventService] ✅ 保存公告: ${item.title.substring(0, 40)}`)
          }
        }
      }
    } catch (err) {
      console.error(`[EventService] 东方财富公告获取失败 ${symbol}:`, err)
    }

    return results
  }

  /**
   * 数据转换：将Prisma模型转换为响应格式
   */
  private transformEvent(event: any) {
    return {
      id: event.id,
      symbol: event.symbol,
      eventType: event.eventType,
      title: event.title,
      content: event.content,
      eventTime: event.eventTime.toISOString(),
      source: event.source,
      metadataJson: JSON.parse(event.metadataJson || '{}'),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      eventAnalysisCount: event._count.eventAnalyses,
      alertCount: event._count.alerts
    };
  }
}

// 导出单例
export const eventService = new EventService();