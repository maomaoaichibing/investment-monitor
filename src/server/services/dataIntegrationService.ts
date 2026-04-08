import { db } from '@/lib/db'
import { fetchNewsForSymbol } from './newsService'

export interface NewsArticle {
  title: string
  content: string
  source: string
  url: string
  publishedAt: Date
  symbol?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  summary?: string
}

export interface CompanyAnnouncement {
  title: string
  content: string
  type: 'earnings' | 'dividend' | 'merger' | 'acquisition' | 'management' | 'other'
  symbol: string
  publishedAt: Date
  url?: string
  fileUrl?: string
}

export interface SocialMediaPost {
  platform: 'weibo' | 'twitter' | 'stocktwits'
  author: string
  content: string
  publishedAt: Date
  symbol?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  likes?: number
  shares?: number
  comments?: number
}

export interface IndustryData {
  industry: string
  metric: string
  value: number
  unit: string
  period: string
  source: string
  publishedAt: Date
}

// ============ 真实数据源辅助函数 ============

/**
 * 从东方财富抓取真实公告
 */
async function fetchEastMoneyAnnouncements(symbol: string): Promise<CompanyAnnouncement[]> {
  try {
    let secid: string
    if (symbol.startsWith('6')) {
      secid = `1.${symbol}`
    } else if (symbol.startsWith('0') || symbol.startsWith('3')) {
      secid = `0.${symbol}`
    } else if (symbol.startsWith('4') || symbol.startsWith('8')) {
      secid = `0.${symbol}`
    } else {
      secid = `116.${symbol}`
    }

    const url = `https://np-anotice-stock.eastmoney.com/api/security/ann?sr=-1&page_size=20&page_index=1&ann_type=SHA,SZA&secid=${secid}&stock=${symbol}`

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.eastmoney.com' },
      signal: AbortSignal.timeout(8000)
    })

    if (!response.ok) return []

    const json: any = await response.json()
    const list = json?.data?.list || []

    return list.slice(0, 20).map((item: any) => {
      let type: CompanyAnnouncement['type'] = 'other'
      const tl = (item.title || '').toLowerCase()
      if (tl.includes('年度') || tl.includes('季度') || tl.includes('半年') || tl.includes('业绩') || tl.includes('财报')) type = 'earnings'
      else if (tl.includes('分红') || tl.includes('派息') || tl.includes('股息') || tl.includes('红利')) type = 'dividend'
      else if (tl.includes('收购') || tl.includes('并购') || tl.includes('合并')) type = 'merger'
      else if (tl.includes('任命') || tl.includes('董事') || tl.includes('高管') || tl.includes('辞职')) type = 'management'

      return {
        title: item.title || '',
        content: item.summary || '',
        type,
        symbol,
        publishedAt: new Date(item.notice_date || item.display_time || Date.now()),
        url: item.art_code ? `https://www.eastmoney.com/news/${item.art_code}` : undefined
      }
    })
  } catch (error) {
    console.error(`[DataIntegration] 东方财富公告获取失败 ${symbol}:`, error)
    return []
  }
}

/**
 * 从新浪财经抓取股票相关新闻
 */
async function fetchSinaNewsForSymbol(symbol: string): Promise<NewsArticle[]> {
  try {
    const url = `https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=${encodeURIComponent(symbol)}&num=10&page=1&r=${Math.random()}`

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://finance.sina.com.cn' },
      signal: AbortSignal.timeout(8000)
    })

    if (!response.ok) return []

    const json: any = await response.json()
    const data = json?.result?.data || []

    return data.slice(0, 10).map((item: any) => ({
      title: item.title || '',
      content: item.summary || item.intro || '',
      source: item.media_name || '新浪财经',
      url: item.url || '',
      publishedAt: new Date(item.ctime ? item.ctime * 1000 : Date.now()),
      symbol,
      sentiment: 'neutral' as const,
      summary: (item.summary || '').substring(0, 100)
    }))
  } catch (error) {
    console.error(`[DataIntegration] 新浪新闻获取失败 ${symbol}:`, error)
    return []
  }
}

/**
 * 数据集成服务
 * 从多个真实数据源抓取和整合数据
 */
export class DataIntegrationService {
  /**
   * 抓取新闻数据（真实来源：Yahoo Finance + 新浪财经）
   */
  async fetchNews(symbol?: string, limit: number = 20): Promise<NewsArticle[]> {
    if (!symbol) {
      const events = await db.event.findMany({
        where: { source: 'news' },
        orderBy: { eventTime: 'desc' },
        take: limit
      })
      return events.map(e => {
        const meta = JSON.parse(e.metadataJson || '{}')
        return {
          title: e.title,
          content: e.content,
          source: e.source,
          url: meta.url || '',
          publishedAt: e.eventTime,
          symbol: e.symbol,
          sentiment: (meta.sentiment || 'neutral') as 'positive' | 'neutral' | 'negative',
          summary: e.content.substring(0, 100)
        }
      })
    }

    // 优先使用 newsService（Yahoo Finance 多源）
    const newsResult = await fetchNewsForSymbol(symbol, 'US', { limit })
    if (newsResult.success && newsResult.data && newsResult.data.length > 0) {
      return newsResult.data.map(item => ({
        title: item.title,
        content: item.content,
        source: item.source,
        url: item.url,
        publishedAt: new Date(item.publishedAt),
        symbol: item.symbol,
        sentiment: item.sentiment || 'neutral',
        summary: item.content.substring(0, 100)
      }))
    }

    // 降级：新浪财经
    const sinaNews = await fetchSinaNewsForSymbol(symbol)
    if (sinaNews.length > 0) return sinaNews.slice(0, limit)

    // 终极降级：从数据库读取
    const dbEvents = await db.event.findMany({
      where: { symbol, source: 'news' },
      orderBy: { eventTime: 'desc' },
      take: limit
    })
    return dbEvents.map(e => {
      const meta = JSON.parse(e.metadataJson || '{}')
      return {
        title: e.title,
        content: e.content,
        source: e.source,
        url: meta.url || '',
        publishedAt: e.eventTime,
        symbol: e.symbol,
        sentiment: 'neutral' as const,
        summary: e.content.substring(0, 100)
      }
    })
  }

  /**
   * 抓取公司公告（真实来源：东方财富）
   */
  async fetchAnnouncements(symbol: string, limit: number = 10): Promise<CompanyAnnouncement[]> {
    const announcements = await fetchEastMoneyAnnouncements(symbol)
    if (announcements.length > 0) return announcements.slice(0, limit)

    // 降级：数据库已有事件
    const dbEvents = await db.event.findMany({
      where: { symbol, eventType: { in: ['earnings', 'announcement', 'dividend', 'management'] } },
      orderBy: { eventTime: 'desc' },
      take: limit
    })
    return dbEvents.map(e => {
      let type: CompanyAnnouncement['type'] = 'other'
      const tl = e.title.toLowerCase()
      if (tl.includes('年度') || tl.includes('季度') || tl.includes('业绩')) type = 'earnings'
      else if (tl.includes('分红') || tl.includes('派息') || tl.includes('股息')) type = 'dividend'
      else if (tl.includes('收购') || tl.includes('并购')) type = 'merger'
      else if (tl.includes('任命') || tl.includes('董事') || tl.includes('高管')) type = 'management'

      const meta = JSON.parse(e.metadataJson || '{}')
      return {
        title: e.title,
        content: e.content,
        type,
        symbol: e.symbol,
        publishedAt: e.eventTime,
        url: meta.url || undefined
      }
    })
  }

  /**
   * 抓取财经社交媒体（新浪财经滚动新闻）
   */
  async fetchSocialMedia(symbol?: string, limit: number = 30): Promise<SocialMediaPost[]> {
    if (!symbol) return []

    try {
      const url = `https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=${encodeURIComponent(symbol)}&num=${limit}&page=1&r=${Math.random()}`
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://finance.sina.com.cn' },
        signal: AbortSignal.timeout(8000)
      })

      if (response.ok) {
        const json: any = await response.json()
        const data = json?.result?.data || []
        return data.slice(0, limit).map((item: any) => ({
          platform: 'weibo' as const,
          author: item.media_name || '财经媒体',
          content: item.title + (item.summary ? ' ' + item.summary : ''),
          publishedAt: new Date(item.ctime ? item.ctime * 1000 : Date.now()),
          symbol,
          sentiment: 'neutral' as const,
          likes: 0, shares: 0, comments: 0
        }))
      }
    } catch (error) {
      console.error(`[DataIntegration] 社交媒体获取失败:`, error)
    }
    return []
  }

  /**
   * 抓取行业数据（从持仓数据实时生成）
   */
  async fetchIndustryData(industry: string, period: string = 'latest'): Promise<IndustryData[]> {
    const positions = await db.position.findMany({ include: { portfolio: { select: { name: true } } } })
    return positions.slice(0, 10).map(p => ({
      industry: industry || 'diversified',
      metric: 'market_value',
      value: p.marketValue ?? 0,
      unit: 'CNY',
      period,
      source: '持仓系统',
      publishedAt: new Date()
    }))
  }

  /**
   * 整合所有数据源
   */
  async integrateData(symbol?: string, options?: {
    includeNews?: boolean
    includeAnnouncements?: boolean
    includeSocialMedia?: boolean
    includeIndustryData?: boolean
    limit?: number
  }): Promise<{
    news: NewsArticle[]
    announcements: CompanyAnnouncement[]
    socialMedia: SocialMediaPost[]
    industryData: IndustryData[]
  }> {
    const {
      includeNews = true,
      includeAnnouncements = true,
      includeSocialMedia = true,
      includeIndustryData = true,
      limit = 20
    } = options || {}

    const [news, announcements, socialMedia, industryData] = await Promise.all([
      includeNews ? this.fetchNews(symbol, limit) : Promise.resolve([]),
      includeAnnouncements && symbol ? this.fetchAnnouncements(symbol, limit) : Promise.resolve([]),
      includeSocialMedia ? this.fetchSocialMedia(symbol, limit) : Promise.resolve([]),
      includeIndustryData ? this.fetchIndustryData('technology', 'latest') : Promise.resolve([])
    ])

    return { news, announcements, socialMedia, industryData }
  }
}

export const dataIntegrationService = new DataIntegrationService()
