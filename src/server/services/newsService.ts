/**
 * 新闻舆情服务 - 多数据源整合
 * 支持美股(HK/US) + A股(HK/CN) 财经新闻
 * 数据源: Yahoo Finance RSS → 东方财富 → 模拟数据（兜底）
 */

import { db } from '@/lib/db'

// ============== 类型定义 ==============

export interface NewsItem {
  id?: string
  symbol: string          // 股票代码
  title: string           // 标题
  content: string         // 内容摘要
  url: string             // 原文链接
  source: string          // 来源媒体
  publishedAt: string     // 发布时间 (ISO)
  sentiment?: 'positive' | 'negative' | 'neutral'  // 情感倾向
  sentimentScore?: number // 情感分 (-1~1)
  tags?: string[]         // 标签
  relatedSymbols?: string[] // 相关股票
  imageUrl?: string       // 封面图
}

export interface NewsResult {
  success: boolean
  data?: NewsItem[]
  error?: string
  source?: string
  fetchedAt?: string
}

// ============== 工具函数 ==============

/**
 * 解析 Yahoo Finance RSS XML
 */
function parseYahooRSS(xml: string, symbol: string): NewsItem[] {
  const items: NewsItem[] = []
  
  // 匹配 <item>...</item>
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let match
  
  while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
    const itemXml = match[1]
    
    const getTag = (tag: string) => {
      const re = new RegExp(`<${tag}[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/${tag}|<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i')
      const m = itemXml.match(re)
      return m ? (m[1] || m[2] || '').trim() : ''
    }
    
    const title = getTag('title')
    const link = getTag('link')
    const description = getTag('description')
    const pubDate = getTag('pubDate')
    const source = getTag('source') || 'Yahoo Finance'
    
    if (!title || !link) continue
    
    // 解析日期
    let publishedAt = new Date().toISOString()
    if (pubDate) {
      const d = new Date(pubDate)
      if (!isNaN(d.getTime())) publishedAt = d.toISOString()
    }
    
    items.push({
      symbol,
      title: title.replace(/<!\[CDATA\[|\]\]>/g, ''),
      content: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').substring(0, 300),
      url: link,
      source,
      publishedAt,
      tags: []
    })
  }
  
  return items
}

/**
 * 解析东方财富新闻（JSON API）
 * 数据格式: data.list[].title, data.list[].notice_date, data.list[].art_code
 */
function parseEastMoneyNews(json: any, symbol: string): NewsItem[] {
  const items: NewsItem[] = []
  
  if (!json || !json.data) return items
  
  // 支持两种格式: data.list[] 或 data[]
  const list = json.data.list || json.data || []
  const arr = Array.isArray(list) ? list : [list]
  
  for (const item of arr.slice(0, 20)) {
    if (!item.title) continue
    
    // 构造公告链接
    const url = item.art_code 
      ? `https://www.eastmoney.com/news/${item.art_code}`
      : ''
    
    items.push({
      symbol,
      title: item.title || '',
      content: item.summary || item.desc || item.content || '',
      url,
      source: item.media_name || item.column_name || '东方财富',
      publishedAt: item.notice_date || item.display_time || item.eiTime || new Date().toISOString(),
      tags: item.labels || item.column_name ? [item.column_name] : []
    })
  }
  
  return items
}

/**
 * 解析新浪财经滚动新闻（通用财经新闻）
 */
function parseSinaNews(json: any, targetSymbols?: string[]): NewsItem[] {
  const items: NewsItem[] = []
  
  const data = json?.result?.data || json?.data || []
  if (!Array.isArray(data)) return items
  
  for (const item of data.slice(0, 30)) {
    if (!item.title) continue
    
    // 发布时间
    const ctime = item.ctime ? new Date(item.ctime * 1000).toISOString() : new Date().toISOString()
    
    // 从关键词提取相关股票
    const keywords: string[] = []
    if (item.ext_0) keywords.push(...item.ext_0.split(',').filter(Boolean))
    if (item.keywords) keywords.push(...item.keywords.split(',').filter(Boolean).slice(0, 3))
    
    // 如果指定了目标股票，过滤
    if (targetSymbols && targetSymbols.length > 0) {
      const titleLower = (item.title + item.summary).toLowerCase()
      const matched = targetSymbols.filter(s => titleLower.includes(s.toLowerCase()))
      if (matched.length === 0) continue
    }
    
    items.push({
      symbol: keywords[0] || targetSymbols?.[0] || '',
      title: item.title || '',
      content: item.summary || item.intro || '',
      url: item.url || item.wapurl || '',
      source: item.media_name || item.author || '新浪财经',
      publishedAt: ctime,
      tags: Array.from(new Set([...(item.keywords?.split(',').filter(Boolean).slice(0, 5) || []), ...keywords]))
    })
  }
  
  return items
}

/**
 * 格式化日期字符串
 */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return new Date().toISOString()
    return d.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

// ============== 数据源 1: Yahoo Finance RSS ==============

async function fetchFromYahooRSS(symbol: string, market: string): Promise<NewsResult> {
  try {
    // Yahoo Finance RSS feed
    let rssSymbol: string
    
    if (market === 'US') {
      rssSymbol = symbol.toUpperCase()
    } else if (market === 'HK') {
      // Yahoo HK codes: 0700.HK for 腾讯
      rssSymbol = `${symbol}.HK`
    } else {
      // A股用 .SS 或 .SZ
      rssSymbol = symbol.startsWith('6') ? `${symbol}.SS` : `${symbol}.SZ`
    }
    
    const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${rssSymbol}&region=US&lang=en-US`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      signal: AbortSignal.timeout(8000)
    })
    
    if (!response.ok && response.status !== 200) {
      // RSS 可能返回 404，降级
      return { success: false, error: `HTTP ${response.status}`, source: 'yahoo_rss' }
    }
    
    const xml = await response.text()
    
    if (!xml || xml.includes('<description>Invalid Ticker Symbol</description>')) {
      return { success: false, error: '无效股票代码', source: 'yahoo_rss' }
    }
    
    const items = parseYahooRSS(xml, symbol)
    
    if (items.length === 0) {
      return { success: false, error: '未找到新闻', source: 'yahoo_rss' }
    }
    
    return {
      success: true,
      data: items,
      source: 'yahoo_rss',
      fetchedAt: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'RSS获取失败',
      source: 'yahoo_rss'
    }
  }
}

// ============== 数据源 2: 东方财富新闻API ==============

async function fetchFromEastMoney(symbol: string, market: string): Promise<NewsResult> {
  try {
    // 东方财富 A股 新闻接口（无认证）
    // https://np-anotice-stock.eastmoney.com/api/security/ann?sr=-1&page_size=20&page_index=1&ann_type=SHA
    
    let secid: string
    
    if (market === 'CN' || market === 'A') {
      if (symbol.startsWith('6')) {
        secid = `1.${symbol}` // 上海
      } else {
        secid = `0.${symbol}` // 深圳
      }
    } else if (market === 'HK') {
      // 港股用 116+代码
      secid = `116.${symbol}`
    } else {
      return { success: false, error: '东方财富不支持该市场', source: 'eastmoney' }
    }
    
    const url = `https://np-anotice-stock.eastmoney.com/api/security/ann?sr=-1&page_size=20&page_index=1&ann_type=SHA,SZA&secid=${secid}&stock=${symbol}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.eastmoney.com'
      },
      signal: AbortSignal.timeout(8000)
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, source: 'eastmoney' }
    }
    
    const json = await response.json()
    const items = parseEastMoneyNews(json, symbol)
    
    if (items.length === 0) {
      return { success: false, error: '未找到公告', source: 'eastmoney' }
    }
    
    return {
      success: true,
      data: items,
      source: 'eastmoney',
      fetchedAt: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '东方财富获取失败',
      source: 'eastmoney'
    }
  }
}

// ============== 数据源 3: 新浪财经滚动新闻 ==============

/**
 * 从新浪财经获取滚动新闻（通用财经，匹配目标股票）
 * 适合国内服务器访问，覆盖A股/港股财经新闻
 */
async function fetchFromSinaNews(symbol?: string, market?: string): Promise<NewsResult> {
  try {
    // 财经要闻滚动
    const url = `https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=&num=20&page=1&r=${Math.random()}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://finance.sina.com.cn'
      },
      signal: AbortSignal.timeout(8000)
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, source: 'sina_news' }
    }
    
    const json = await response.json()
    
    // 如果指定了股票，只返回相关新闻
    const targetSymbols = symbol ? [symbol] : undefined
    const items = parseSinaNews(json, targetSymbols)
    
    if (items.length === 0) {
      return { success: false, error: '未找到新闻', source: 'sina_news' }
    }
    
    return {
      success: true,
      data: items,
      source: 'sina_news',
      fetchedAt: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '新浪财经获取失败',
      source: 'sina_news'
    }
  }
}

// ============== 数据源 4: Yahoo Finance Web Search (兜底) ==============

async function fetchFromYahooSearch(symbol: string, market: string): Promise<NewsResult> {
  try {
    let querySymbol = symbol
    if (market === 'US') {
      querySymbol = symbol.toUpperCase()
    } else if (market === 'HK') {
      querySymbol = `${symbol}.HK`
    }
    
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(querySymbol)}&newsCount=10&enableFuzzyQuery=false`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(8000)
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, source: 'yahoo_search' }
    }
    
    const json = await response.json()
    const news: any[] = json.news || []
    
    if (news.length === 0) {
      return { success: false, error: '未找到新闻', source: 'yahoo_search' }
    }
    
    const items: NewsItem[] = news.map((item) => {
      const publishedAt = item.published_at
        ? new Date(item.published_at * 1000).toISOString()
        : new Date().toISOString()
      
      return {
        symbol,
        title: item.title || '',
        content: (item.summary || '').substring(0, 300),
        url: item.link || item.url || '',
        source: item.publisher || 'Yahoo Finance',
        publishedAt,
        tags: item.related_tickers || [],
        imageUrl: item.thumbnail?.resolutions?.[0]?.url || item.thumbnail?.url || undefined
      }
    })
    
    return {
      success: true,
      data: items,
      source: 'yahoo_search',
      fetchedAt: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Yahoo搜索失败',
      source: 'yahoo_search'
    }
  }
}

// ============== 主函数 ==============

/**
 * 获取单只股票的新闻
 */
export async function fetchNewsForSymbol(
  symbol: string,
  market: string = 'US',
  options: { useCache?: boolean; limit?: number } = {}
): Promise<NewsResult> {
  const { limit = 20 } = options
  
  // 按优先级尝试各数据源
  const sources: Array<{ fn: (sym: string, mkt: string) => Promise<NewsResult>; name: string }> = []
  
  if (market === 'US') {
    sources.push(
      { fn: fetchFromYahooSearch, name: 'Yahoo Search' },
      { fn: fetchFromYahooRSS, name: 'Yahoo RSS' },
      { fn: fetchFromSinaNews, name: '新浪财经' }
    )
  } else if (market === 'HK') {
    sources.push(
      { fn: fetchFromSinaNews, name: '新浪财经' },
      { fn: fetchFromYahooSearch, name: 'Yahoo Search' },
      { fn: fetchFromYahooRSS, name: 'Yahoo RSS' }
    )
  } else {
    // A股：新浪财经 + 东方财富
    sources.push(
      { fn: fetchFromSinaNews, name: '新浪财经' },
      { fn: fetchFromEastMoney, name: '东方财富' }
    )
  }
  
  for (const source of sources) {
    const result = await source.fn(symbol, market)
    
    if (result.success && result.data && result.data.length > 0) {
      console.log(`[NewsService] ✅ ${source.name} 成功获取 ${symbol} 新闻 ${result.data.length} 条`)
      return {
        ...result,
        data: result.data.slice(0, limit)
      }
    }
    
    console.log(`[NewsService] ⚠️ ${source.name} 获取 ${symbol} 失败: ${result.error}`)
  }
  
  return {
    success: false,
    error: '所有数据源均不可用',
    source: 'none'
  }
}

/**
 * 批量获取持仓新闻（从数据库持仓列表）
 */
export async function fetchNewsForAllPositions(
  options: { useCache?: boolean; limitPerSymbol?: number } = {}
): Promise<{
  news: NewsItem[]
  bySymbol: Record<string, NewsItem[]>
  errors: Record<string, string>
}> {
  // 获取所有持仓
  const positions = await db.position.findMany({
    select: { symbol: true, market: true, assetName: true }
  })
  
  const uniquePositions = Array.from(
    new Map(positions.map(p => [p.symbol, p])).values()
  )
  
  const bySymbol: Record<string, NewsItem[]> = {}
  const allNews: NewsItem[] = []
  const errors: Record<string, string> = {}
  
  // 并行获取每只股票的新闻
  const results = await Promise.allSettled(
    uniquePositions.map(async (pos) => {
      const result = await fetchNewsForSymbol(pos.symbol, pos.market, {
        limit: options.limitPerSymbol || 10
      })
      return { symbol: pos.symbol, result }
    })
  )
  
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const { symbol, result } = r.value
      if (result.success && result.data) {
        bySymbol[symbol] = result.data
        allNews.push(...result.data)
      } else {
        errors[symbol] = result.error || '未知错误'
      }
    }
  }
  
  // 如果没有任何股票新闻，尝试获取新浪财经综合新闻
  if (allNews.length === 0 && uniquePositions.length > 0) {
    console.log('[NewsService] 所有持仓新闻获取失败，尝试新浪财经综合新闻...')
    const sinaResult = await fetchFromSinaNews()
    if (sinaResult.success && sinaResult.data) {
      // 匹配持仓股票
      const symbolCodes = uniquePositions.map(p => p.symbol.toLowerCase())
      const matchedNews = sinaResult.data.filter(item => {
        const text = (item.title + item.content).toLowerCase()
        return symbolCodes.some(s => text.includes(s.toLowerCase()))
      })
      
      for (const item of matchedNews) {
        const matchedSymbol = uniquePositions.find(p => 
          (item.title + item.content).toLowerCase().includes(p.symbol.toLowerCase())
        )
        if (matchedSymbol) {
          item.symbol = matchedSymbol.symbol
        }
        allNews.push(item)
      }
      
      // 即使没有匹配，也添加前5条综合新闻
      if (allNews.length === 0 && sinaResult.data.length > 0) {
        const symbols = uniquePositions.map(p => p.symbol)
        const generalNews = sinaResult.data.slice(0, 5).map(item => ({
          ...item,
          symbol: `财经(${symbols.join(',')})`
        }))
        allNews.push(...generalNews)
      }
      
      if (allNews.length > 0) {
        console.log(`[NewsService] 新浪财经补充新闻 ${allNews.length} 条`)
      }
    }
  }
  
  // 按时间排序（最新在前）
  allNews.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  
  return {
    news: allNews,
    bySymbol,
    errors
  }
}

/**
 * 存储新闻到数据库（Event 表）
 */
export async function saveNewsToEvents(newsItems: NewsItem[]): Promise<{
  saved: number
  skipped: number
  errors: string[]
}> {
  let saved = 0
  let skipped = 0
  const errors: string[] = []
  
  for (const item of newsItems) {
    try {
      // 检查是否已存在（同一标题 + 同一时间 近似）
      const existing = await db.event.findFirst({
        where: {
          symbol: item.symbol,
          title: item.title,
          source: 'news'
        }
      })
      
      if (existing) {
        skipped++
        continue
      }
      
      await db.event.create({
        data: {
          symbol: item.symbol,
          eventType: 'news',
          title: item.title,
          content: item.content,
          eventTime: new Date(item.publishedAt),
          source: 'news',
          metadataJson: JSON.stringify({
            url: item.url,
            newsSource: item.source,
            sentiment: item.sentiment || 'neutral',
            sentimentScore: item.sentimentScore || 0,
            tags: item.tags || [],
            imageUrl: item.imageUrl
          })
        }
      })
      
      saved++
    } catch (error) {
      errors.push(`保存 "${item.title.substring(0, 30)}..." 失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  return { saved, skipped, errors }
}

/**
 * 情感分析（轻量规则版，备用 AI 版）
 */
export function ruleBasedSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral', score: number } {
  const lower = text.toLowerCase()
  
  const positiveWords = [
    'beat', 'exceed', 'growth', 'surge', 'rally', 'upgrade', 'buy', 'outperform',
    '上涨', '增长', '超预期', '突破', '利好', '增持', '买入', '业绩', '盈利',
    '营收增长', '净利润', '订单', '合作', '签约', '发布', '创新', '领跑',
    'bullish', 'strong', 'profit', 'revenue', 'earnings beat', 'guidance raise'
  ]
  
  const negativeWords = [
    'miss', 'warn', 'drop', 'fall', 'cut', 'downgrade', 'sell', 'underperform',
    '下跌', '亏损', '风险', '降级', '裁员', '调查', '诉讼', '违约', '预警',
    'bearish', 'weak', 'loss', 'decline', 'guidance cut', 'concern', 'risk',
    'SEC investigation', 'lawsuit', 'fraud', 'bankruptcy'
  ]
  
  let score = 0
  let matched = 0
  
  for (const word of positiveWords) {
    if (lower.includes(word)) {
      score += word.length > 5 ? 2 : 1
      matched++
    }
  }
  
  for (const word of negativeWords) {
    if (lower.includes(word)) {
      score -= word.length > 5 ? 2 : 1
      matched++
    }
  }
  
  // 归一化到 -1 ~ 1
  const normalizedScore = matched > 0 
    ? Math.max(-1, Math.min(1, score / matched))
    : 0
  
  const sentiment: 'positive' | 'negative' | 'neutral' =
    normalizedScore > 0.3 ? 'positive' :
    normalizedScore < -0.3 ? 'negative' :
    'neutral'
  
  return { sentiment, score: Math.round(normalizedScore * 100) / 100 }
}
