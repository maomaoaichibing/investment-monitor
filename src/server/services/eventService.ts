import { db } from '@/lib/db'
import { CreateEventInput, UpdateEventInput, QueryEventInput } from '@/lib/schemas/eventSchema';

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
   * 自动抓取事件（模拟）
   * TODO: 接入真实的新闻API或公告API
   */
  async autoFetchEvents(symbol: string, days = 7) {
    // 这里模拟从外部源抓取事件
    // 实际实现时需要接入真实的API
    const mockEvents = [
      {
        symbol,
        eventType: 'news' as const,
        title: `重要新闻：${symbol} 获得政策支持`,
        content: `据最新报道，${symbol} 所在行业获得政策支持，预计将推动行业发展。`,
        eventTime: new Date(),
        source: 'auto' as const,
        metadataJson: {
          newsSource: '财经媒体',
          newsUrl: 'https://example.com/news',
          sentiment: 'positive' as const,
          tags: ['政策', '行业利好']
        }
      },
      {
        symbol,
        eventType: 'price_break' as const,
        title: `${symbol} 突破关键价位`,
        content: `${symbol} 今日价格上涨，突破前期重要阻力位。`,
        eventTime: new Date(Date.now() - 86400000), // 1天前
        source: 'auto' as const,
        metadataJson: {
          priceBefore: 100,
          priceAfter: 105,
          priceChangePercent: 5,
          tags: ['技术突破', '价格上涨']
        }
      }
    ];

    const results = [];
    for (const eventData of mockEvents) {
      const existing = await db.event.findFirst({
        where: {
          symbol: eventData.symbol,
          title: eventData.title,
          eventTime: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          }
        }
      });

      if (!existing) {
        const event = await db.event.create({
          data: {
            symbol: eventData.symbol,
            eventType: eventData.eventType,
            title: eventData.title,
            content: eventData.content,
            eventTime: eventData.eventTime,
            source: eventData.source,
            metadataJson: JSON.stringify(eventData.metadataJson)
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
        results.push(this.transformEvent(event));
      }
    }

    return results;
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