/**
 * 新闻舆情服务 - 多数据源整合
 * 支持美股(HK/US) + A股(HK/CN) 财经新闻
 * 数据源: Finnhub News → Yahoo Finance RSS → 东方财富
 */

import { db } from '@/lib/db'
import { get as httpsGet } from 'https'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || ''

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
 * 关键词相关性过滤表（用于 Yahoo RSS 港股去噪）
 * 包含：中文名、英文名、Yahoo代码、常见缩写
 */
const HK_SYMBOL_KEYWORDS: Record<string, string[]> = {
  '00700': ['腾讯', 'Tencent', '0700.HK', 'SEHK:700'],
  '09988': ['阿里', 'Alibaba', 'BABA', '9988.HK', '阿里巴巴'],
  '03690': ['美团', 'Meituan', '3690.HK', '3690.HK'],
  '09866': ['蔚来', 'Nio', 'NIO Inc', '9866.HK', '蔚来汽车'],
  '01810': ['小米', 'Xiaomi', '1810.HK', '01810.HK'],
  '00772': ['中国电信', 'China Telecom', 'CHA', '00772.HK'],
  '002594': ['比亚迪', 'BYD', '2594.HK', '002594.SZ'],
  '03606': ['平安', 'Ping An', '2318.HK'],
  '02382': ['舜宇', 'Sunny Optical', '2382.HK'],
  '01024': ['快手', 'Kuaishou', '1024.HK', 'KS'],
  '00992': ['联想', 'Lenovo', '992.HK'],
  '00941': ['中国移动', 'China Mobile', '0941.HK', 'CHL'],
  '00728': ['中国铁塔', 'China Tower', '0728.HK'],
  '00913': ['比亚迪电子', 'BYD Electronic', '0285.HK'],
}

/**
 * 判断单条新闻是否与目标股票相关
 * 宽松匹配：标题或摘要中出现公司名/代码即视为相关
 */
function isNewsRelevant(title: string, content: string, symbol: string): boolean {
  const text = (title + ' ' + content).toLowerCase()
  const keywords = HK_SYMBOL_KEYWORDS[symbol]
  if (!keywords) return true // 未知股票，全部保留
  return keywords.some(kw => text.includes(kw.toLowerCase()))
}

/**
 * 解析 Yahoo Finance RSS XML
 */
function parseYahooRSS(xml: string, symbol: string, market: string = 'US'): NewsItem[] {
  const items: NewsItem[] = []
  
  // 匹配 <item>...</item>
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let match
  
  while ((match = itemRegex.exec(xml)) !== null && items.length < 50) {
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
    
    // 港股：相关性过滤，去掉 Paramount/Pony AI 等无关条目
    if (market === 'HK' && !isNewsRelevant(title, description, symbol)) {
      console.log(`[NewsService] Yahoo RSS 港股过滤无关条目: "${title.substring(0, 60)}"`)
      continue
    }
    
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
    
    const items = parseYahooRSS(xml, symbol, market)
    
    if (items.length === 0) {
      return { success: false, error: 'Yahoo RSS 无相关新闻（已过滤无关条目）', source: 'yahoo_rss' }
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

// ============== 数据源 4: 东方财富快讯（多市场分类） ==============

/**
 * 东方财富快讯 - 按市场分类的实时财经新闻
 * category 103 = 港股, 104 = 美股, 105 = A股
 * 无需认证，免费稳定
 */
async function fetchFromEastMoneyKuaixun(symbol: string, market: string): Promise<NewsResult> {
  try {
    // 确定快讯分类
    let category: string
    if (market === 'HK') {
      category = '103' // 港股
    } else if (market === 'US') {
      category = '104' // 美股
    } else {
      category = '105' // A股
    }

    const url = `https://newsapi.eastmoney.com/kuaixun/v1/getlist_${category}_ajaxResult_20_1_.html`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120',
        'Accept': 'text/plain, */*',
        'Referer': 'https://www.eastmoney.com'
      },
      signal: AbortSignal.timeout(8000)
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, source: 'eastmoney_kuaixun' }
    }

    const rawText = await response.text()

    // 解析 var ajaxResult={...} 格式
    const jsonMatch = rawText.match(/ajaxResult\s*=\s*(\{[\s\S]*?\})\s*;?\s*$/m)
    if (!jsonMatch) {
      return { success: false, error: '东方财富快讯响应格式异常', source: 'eastmoney_kuaixun' }
    }

    let json: any
    try {
      json = JSON.parse(jsonMatch[1])
    } catch {
      return { success: false, error: '东方财富快讯 JSON 解析失败', source: 'eastmoney_kuaixun' }
    }

    const lives: any[] = json?.LivesList || []
    if (lives.length === 0) {
      return { success: false, error: '东方财富快讯无数据', source: 'eastmoney_kuaixun' }
    }

    // 关键词匹配表
    const matchKeywords: Record<string, string[]> = {
      '00700': ['腾讯', '0700', '00700', 'Tencent'],
      '09988': ['阿里', '09988', '9988', 'Alibaba', '阿里巴巴', 'BABA'],
      '03690': ['美团', '03690', '3690', 'Meituan'],
      '09866': ['蔚来', '09866', '9866', 'Nio', 'NIO', '蔚来汽车'],
      '01810': ['小米', '01810', '1810', 'Xiaomi', '雷军'],
      '002594': ['比亚迪', '002594', '2594', 'BYD'],
      '00772': ['中国电信', '00772', 'China Telecom'],
      'FUTU': ['富途', 'FUTU', '01729', '1729'],
      'MU': ['美光', 'Micron', 'MU', '内存'],
      'PDD': ['拼多多', 'PDD', 'Pinduoduo', 'Temu'],
      'NVDA': ['英伟达', 'NVIDIA', 'NVDA', 'GPU', '黄仁勋'],
      'AAPL': ['苹果', 'Apple', 'AAPL', 'iPhone'],
      'TSLA': ['特斯拉', 'Tesla', 'TSLA', '马斯克'],
      'TSM': ['台积电', 'TSMC', 'TSM', '半导体'],
      'BABA': ['阿里', 'Alibaba', 'BABA', '阿里巴巴'],
      '600519': ['茅台', '600519', '贵州茅台', '酱香'],
      '300750': ['宁德', '300750', 'CATL', '电池'],
    }

    // 目标关键词（大小写不敏感）
    const targetKw = matchKeywords[symbol] || [symbol]
    const symbolLower = symbol.toLowerCase()

    // 过滤：保留包含目标关键词的条目，或（如果没有持仓指定）取前20条
    const filtered = lives.filter(item => {
      const text = ((item.title || '') + ' ' + (item.summary || '')).toLowerCase()
      return targetKw.some(kw => text.includes(kw.toLowerCase()))
    })

    // 如果过滤后条目太少（<3条），放宽条件：只要有匹配就保留，否则用全量
    const itemsToUse = filtered.length >= 3 ? filtered : lives.slice(0, 20)

    const newsItems: NewsItem[] = itemsToUse.map(item => ({
      symbol: symbol,
      title: item.title || '',
      content: item.summary || '',
      url: item.url_w || item.url_m || item.url || '',
      source: item.media_source || item.from_source || '东方财富',
      publishedAt: item.showtime || new Date().toISOString(),
      tags: []
    }))

    if (newsItems.length === 0) {
      return { success: false, error: '东方财富快讯无匹配新闻', source: 'eastmoney_kuaixun' }
    }

    console.log(`[NewsService] 东方财富快讯 ${market}: ${filtered.length}/${lives.length} 条匹配 "${symbol}"`)

    return {
      success: true,
      data: newsItems,
      source: 'eastmoney_kuaixun',
      fetchedAt: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '东方财富快讯获取失败',
      source: 'eastmoney_kuaixun'
    }
  }
}

// ============== 数据源 5: Yahoo Finance Web Search (已禁用) ==============
// Yahoo Search API 已全面返回 403，2026-04-11 确认失效，保留函数但不启用

/**
 * Yahoo Finance Web Search - 已全面禁用（2026-04-11 返回403）
 * 保留函数签名，永久返回失败
 */
async function fetchFromYahooSearch(symbol: string, market: string): Promise<NewsResult> {
  return { success: false, error: 'Yahoo Search 已禁用（返回403）', source: 'yahoo_search' }
}

/* 原函数已禁用
async function _fetchFromYahooSearch(symbol: string, market: string): Promise<NewsResult> {
  // 2026-04-11: Yahoo Search API 全面返回403，已禁用
  return { success: false, error: '已禁用', source: 'yahoo_search' }
}
*/
// ============== Finnhub News ==============

/**
 * Finnhub 实时财经新闻（无需认证也可获取部分数据）
 * 免费 tier: company news / market news
 * API: https://finnhub.io/docs/api#company-news
 */
async function fetchFromFinnhubNews(symbol: string, market: string): Promise<NewsResult> {
  if (!FINNHUB_API_KEY) {
    return { success: false, error: 'FINNHUB_API_KEY 未配置', source: 'finnhub_news' }
  }

  try {
    let symbolForNews: string

    if (market === 'US') {
      symbolForNews = symbol.toUpperCase()
    } else if (market === 'HK') {
      // 港股用4位代码
      const digits = symbol.replace(/^0+/, '') || '0'
      const last4 = digits.slice(-4).padStart(4, '0')
      symbolForNews = last4 // Finnhub 港股也用4位
    } else {
      // A股用完整代码
      symbolForNews = symbol
    }

    // 公司新闻：获取该股票最新新闻
    const to = Math.floor(Date.now() / 1000)
    const from = to - 7 * 24 * 60 * 60 // 过去7天
    const url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, source: 'finnhub_news' }
    }

    const json: any[] = await response.json()
    if (!Array.isArray(json) || json.length === 0) {
      return { success: false, error: '无数据', source: 'finnhub_news' }
    }

    // 如果有指定股票，尝试找相关公司新闻
    let items: NewsItem[] = []
    const lowerSymbol = symbolForNews.toLowerCase()

    // Finnhub 公司新闻接口（需要 token，可精确匹配）
    const companyNewsUrl = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbolForNews)}&from=${new Date(from * 1000).toISOString().split('T')[0]}&to=${new Date(to * 1000).toISOString().split('T')[0]}&token=${FINNHUB_API_KEY}`

    let companyNews: any[] = []
    try {
      const cnRes = await fetch(companyNewsUrl, { signal: AbortSignal.timeout(8000) })
      if (cnRes.ok) {
        const cnJson: any[] = await cnRes.json()
        if (Array.isArray(cnJson) && cnJson.length > 0) {
          companyNews = cnJson
        }
      }
    } catch (e) {
      console.log(`[newsService] Finnhub company-news 获取失败: ${e instanceof Error ? e.message : 'unknown'}`)
    }

    if (companyNews.length > 0) {
      items = companyNews.slice(0, 20).map((item) => ({
        symbol,
        title: item.headline || '',
        content: (item.summary || '').substring(0, 300),
        url: item.url || '',
        source: item.source || 'Finnhub',
        publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : new Date().toISOString(),
        tags: item.related?.split(',').filter(Boolean).slice(0, 5) || [],
        imageUrl: item.image || undefined
      }))
    } else {
      // 无公司新闻时，用通用财经新闻并做标题匹配
      items = json.slice(0, 50).map((item) => ({
        symbol,
        title: item.headline || '',
        content: (item.summary || '').substring(0, 300),
        url: item.url || '',
        source: item.source || 'Finnhub',
        publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : new Date().toISOString(),
        tags: item.keywords?.split(',').filter(Boolean).slice(0, 5) || [],
        imageUrl: item.image || undefined
      }))
    }

    if (items.length === 0) {
      return { success: false, error: '无新闻', source: 'finnhub_news' }
    }

    return {
      success: true,
      data: items,
      source: 'finnhub_news',
      fetchedAt: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Finnhub新闻获取失败',
      source: 'finnhub_news'
    }
  }
}

// ============== 主函数 ==============

/**
 * 获取单只股票的新闻
 * 数据源优先级（已更新，2026-04-11）:
 * - Yahoo Search 已全面禁用（返回403）
 * - Yahoo RSS 港股增加了相关性过滤（去掉 Paramount/Pony AI 等）
 * - 东方财富快讯作为补充源（覆盖港股/美股/A股三市场）
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
      { fn: fetchFromFinnhubNews, name: 'Finnhub News' },
      { fn: fetchFromYahooRSS, name: 'Yahoo RSS' },
      { fn: fetchFromEastMoneyKuaixun, name: '东方财富快讯' },
      { fn: fetchFromSinaNews, name: '新浪财经' }
    )
  } else if (market === 'HK') {
    sources.push(
      { fn: fetchFromFinnhubNews, name: 'Finnhub News' },
      { fn: fetchFromYahooRSS, name: 'Yahoo RSS' },
      { fn: fetchFromEastMoneyKuaixun, name: '东方财富快讯' },
      { fn: fetchFromSinaNews, name: '新浪财经' }
    )
  } else {
    // A股：东方财富公告 + 快讯 + 新浪财经 + Finnhub
    sources.push(
      { fn: fetchFromEastMoney, name: '东方财富公告' },
      { fn: fetchFromEastMoneyKuaixun, name: '东方财富快讯' },
      { fn: fetchFromSinaNews, name: '新浪财经' },
      { fn: fetchFromFinnhubNews, name: 'Finnhub News' }
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
            imageUrl: item.imageUrl,
            titleZh: (item as any).titleZh || null  // 中文标题（翻译后）
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

/**
 * 使用 Kimi API 翻译新闻全文
 * @param content 原文内容（英文）
 * @param title 可选标题，用于上下文
 * @returns 中文翻译结果
 */
export async function translateArticleContent(
  content: string,
  title?: string
): Promise<{ translated: string; original: string }> {
  if (!content || content.trim().length === 0) {
    return { translated: content, original: content }
  }

  // 如果内容已含大量中文，直接返回
  if (/[\u4e00-\u9fa5]/.test(content) && content.match(/[\u4e00-\u9fa5]/g)?.length! > content.length * 0.3) {
    return { translated: content, original: content }
  }

  // 截取前 4000 字符（8k 模型限制 + prompt开销）
  const truncated = content.length > 4000 ? content.substring(0, 4000) + '...[原文有截断]' : content
  const context = title ? `新闻标题：${title}\n\n` : ''

  const prompt = `你是一个专业的财经新闻翻译。请将以下英文财经新闻翻译成流畅自然的中文，符合中国投资者阅读习惯。

要求：
- 直译为主，语义准确，专业流畅
- 保留公司英文名称（如 NIO、Apple、Microsoft）
- 保留关键数据、百分比、金额、日期
- 如有专业术语给出通用译法
- 分段清晰，保持原文结构

${context}英文原文：
${truncated}

请输出翻译后的完整中文内容（只需输出翻译，无需其他说明）：`

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
        temperature: 0.3,
        max_tokens: 3000
      }),
      signal: AbortSignal.timeout(60000)
    })

    if (!response.ok) {
      console.error('[Kimi全文翻译] API 错误:', response.status)
      return { translated: content, original: content }
    }

    const data = await response.json()
    const translated = data.choices?.[0]?.message?.content || content
    return { translated: translated.trim(), original: content }
  } catch (err: any) {
    console.error('[Kimi全文翻译] 请求失败:', err.message)
    return { translated: content, original: content }
  }
}

/**
 * 从 HTML 中提取正文内容（简单文本提取）
 */
export function extractArticleText(html: string): string {
  if (!html) return ''
  // 移除脚本和样式
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  // 移除 HTML 标签
  text = text.replace(/<[^>]+>/g, ' ')
  // 清理多余空格
  text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

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
