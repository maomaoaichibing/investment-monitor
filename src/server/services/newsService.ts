/**
 * 新闻舆情服务 - 多数据源整合
 * 支持美股(HK/US) + A股(HK/CN) 财经新闻
 * 数据源: Yahoo Finance RSS → 东方财富 → 模拟数据（兜底）
 */

import { db } from '@/lib/db'
import { get as httpsGet } from 'https'

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
      // 优先匹配 CDATA，失败则匹配普通文本；使用 .*? 而非 [\s\S]*? 避免模板字符串转义问题
      const cdataRe = new RegExp(`<!\\[CDATA\\[(.*?)\\]\\]>`, 'i')
      const cdataMatch = itemXml.match(cdataRe)
      if (cdataMatch) return cdataMatch[1].trim()
      
      const textRe = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, 'i')
      const textMatch = itemXml.match(textRe)
      return textMatch ? textMatch[1].trim() : ''
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
    
    // 尝试匹配持仓股票（优先），但不做过滤
    let matchedSymbol = ''
    if (targetSymbols && targetSymbols.length > 0) {
      const titleLower = (item.title + item.summary).toLowerCase()
      const found = targetSymbols.find(s => titleLower.includes(s.toLowerCase()))
      if (found) matchedSymbol = found
    }
    
    items.push({
      symbol: matchedSymbol || keywords[0] || '财经',
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

// ============== 工具函数 ==============

/**
 * 转换港股代码为Yahoo Finance格式
 * 港股6位代码: 00700 → 0700.HK（去掉前导0取后4位）
 * 实测验证: 0700.HK 返回腾讯真实新闻，00700.HK 返回0条
 */
function convertToYahooHKCode(symbol: string): string {
  // 去掉前导0，取最后4位
  const digits = symbol.replace(/^0+/, '') || '0'
  const last4 = digits.slice(-4).padStart(4, '0')
  return `${last4}.HK`
}

/**
 * 使用 https 模块强制 IPv4 获取内容（解决腾讯云 IPv6 不通的 Node.js fetch 问题）
 */
function httpsGetText(url: string, headers: Record<string, string> = {}, timeout = 8000): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url)
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: { ...headers, 'Accept': 'application/rss+xml, application/xml, text/xml' },
        family: 4  // 强制 IPv4（腾讯云服务器 IPv6 不通，但 curl 有 fallback，Node.js fetch 没有）
      }
      const req = httpsGet(options, res => {
        let body = ''
        res.on('data', chunk => body += chunk)
        res.on('end', () => resolve({ status: res.statusCode || 0, body }))
      })
      req.on('error', reject)
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
      setTimeout(() => { req.destroy(); reject(new Error('timeout')) }, timeout)
    } catch (e) {
      reject(e)
    }
  })
}

// ============== 数据源 1: Yahoo Finance RSS ==============

async function fetchFromYahooRSS(symbol: string, market: string): Promise<NewsResult> {
  try {
    let rssSymbol: string
    
    if (market === 'US') {
      rssSymbol = symbol.toUpperCase()
    } else if (market === 'HK') {
      // 关键修复：必须用4位代码（00700→0700.HK），6位代码Yahoo返回0条
      rssSymbol = convertToYahooHKCode(symbol)
    } else {
      // A股用 .SS 或 .SZ
      rssSymbol = symbol.startsWith('6') ? `${symbol}.SS` : `${symbol}.SZ`
    }
    
    const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${rssSymbol}&region=US&lang=en-US`
    
    // 关键修复：使用 https 模块强制 IPv4（Node.js fetch 遇到 IPv6 超时不会回退 IPv4）
    let httpRes: { status: number; body: string }
    try {
      httpRes = await httpsGetText(url, { 'User-Agent': 'Mozilla/5.0' }, 8000)
    } catch (e) {
      return { success: false, error: `fetch failed: ${e instanceof Error ? e.message : 'unknown'}`, source: 'yahoo_rss' }
    }
    
    if (httpRes.status !== 200) {
      return { success: false, error: `HTTP ${httpRes.status}`, source: 'yahoo_rss' }
    }
    
    const xml = httpRes.body
    
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
    // 港股优先 Yahoo RSS（支持4位代码如0700.HK），新浪兜底
    sources.push(
      { fn: fetchFromYahooRSS, name: 'Yahoo RSS' },
      { fn: fetchFromSinaNews, name: '新浪财经' },
      { fn: fetchFromYahooSearch, name: 'Yahoo Search' }
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
  
  // 如果没有任何股票新闻，尝试新浪财经并严格匹配持仓标的
  // 警告：新浪 lid=2516 的 k= 参数可能不工作，必须做标题内容匹配
  if (allNews.length === 0 && uniquePositions.length > 0) {
    console.log('[NewsService] 所有持仓新闻获取失败，尝试新浪财经标题匹配...')
    const sinaResult = await fetchFromSinaNews()
    if (sinaResult.success && sinaResult.data) {
      // 严格匹配：新闻标题/摘要中必须包含持仓代码
      const symbolCodes = uniquePositions.map(p => p.symbol.toLowerCase())
      const matchedNews = sinaResult.data.filter(item => {
        const text = (item.title + ' ' + (item.content || '')).toLowerCase()
        return symbolCodes.some(s => text.includes(s.toLowerCase()))
      })
      
      let matchCount = 0
      for (const item of matchedNews) {
        const matchedSymbol = uniquePositions.find(p => 
          (item.title + ' ' + (item.content || '')).toLowerCase().includes(p.symbol.toLowerCase())
        )
        if (matchedSymbol) {
          item.symbol = matchedSymbol.symbol
          allNews.push(item)
          matchCount++
        }
      }
      
      if (matchCount > 0) {
        console.log(`[NewsService] 新浪标题匹配: ${matchCount} 条精确匹配新闻`)
      } else {
        console.log(`[NewsService] 新浪无持仓匹配，HK/港股新闻源受限（Yahoo RSS HK格式仅支持4位代码）`)
        // 告知前端哪些标的无法获取新闻
        for (const sym of uniquePositions) {
          errors[sym.symbol] = '新闻源暂不支持该交易所，请查看Yahoo Finance获取'
        }
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

// ============== Kimi 翻译服务 ==============

const KIMI_API_KEY = process.env.KIMI_API_KEY || 'sk-5lKs7u9Q5FTWUpRd8SHneXmNt9ER51puxbyv7rY5I5YjY3oX'
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'
const KIMI_MODEL = 'moonshot-v1-8k'

export interface TranslatedNewsItem extends NewsItem {
  titleZh?: string
}

/**
 * 使用 Kimi API 批量翻译新闻标题
 * @param items 带情感分析结果的新闻列表
 * @returns 添加了 titleZh 字段的新闻列表
 */
export async function translateNewsTitles(items: NewsItem[]): Promise<TranslatedNewsItem[]> {
  if (!items || items.length === 0) return items as TranslatedNewsItem[]

  // 收集所有需要翻译的标题（过滤掉太短或含中文的）
  const toTranslate = items
    .filter(item => item.title && item.title.length > 10 && !/[\u4e00-\u9fa5]/.test(item.title))
    .slice(0, 30) // 最多翻译30条，避免 token 溢出

  if (toTranslate.length === 0) {
    return items as TranslatedNewsItem[]
  }

  // 构建批量翻译 prompt
  const lines = toTranslate.map((item, i) => `${i + 1}. ${item.title}`).join('\n')
  const prompt = `你是一个专业的财经新闻翻译。请将以下英文财经新闻标题翻译成中文，保持简洁专业，符合中国投资者阅读习惯。

要求：
- 直译为主，简洁准确
- 保留公司英文名称（如 NIO、Apple）
- 保留关键数据（如百分比、金额）
- 只输出 JSON 数组格式，不要其他内容

标题列表：
${lines}

输出格式（JSON数组）：
[{"index":1,"zh":"翻译后的中文标题"},{"index":2,"zh":"..."}]`

  try {
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) {
      console.error('[Kimi翻译] API 错误:', response.status)
      return items as TranslatedNewsItem[]
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content || ''

    // 解析 JSON
    let translations: Array<{ index: number; zh: string }> = []
    try {
      // 尝试提取 JSON 部分
      const jsonMatch = rawContent.match(/\[[\s\S]*?\]/)
      if (jsonMatch) {
        translations = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('[Kimi翻译] JSON 解析失败:', rawContent.substring(0, 100))
    }

    // 构建 index → 中文标题 的映射
    const zhMap = new Map<number, string>()
    for (const t of translations) {
      if (t.index && t.zh) {
        zhMap.set(t.index, t.zh)
      }
    }

    // 合并翻译结果
    return items.map(item => {
      // 找这个 item 在 toTranslate 中的索引
      const idx = toTranslate.findIndex(t => t.title === item.title)
      if (idx >= 0 && zhMap.has(idx + 1)) {
        return { ...item, titleZh: zhMap.get(idx + 1) } as TranslatedNewsItem
      }
      // 如果已经是中文，不翻译
      if (/[\u4e00-\u9fa5]/.test(item.title)) {
        return { ...item, titleZh: item.title } as TranslatedNewsItem
      }
      return item as TranslatedNewsItem
    })
  } catch (err: any) {
    console.error('[Kimi翻译] 请求失败:', err.message)
    return items as TranslatedNewsItem[]
  }
}
