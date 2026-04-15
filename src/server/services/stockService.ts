/**
 * 股票行情服务 - 多数据源整合
 * 支持A股、港股、美股实时行情
 * 数据源: Finnhub → 腾讯财经 → 新浪财经
 */

import { getCache, setCache, makeCacheKey } from './stockCache'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || ''

// ============== 类型定义 ==============

export interface EnhancedStockQuote {
  // 基础字段
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  open: number
  prevClose: number
  high: number
  low: number
  volume: number
  amount: number
  market: string
  updateTime: string

  // 增强字段
  week52High?: number
  week52Low?: number
  marketCap?: number
  pe?: number
  dividend?: number
  amplitude?: number
  preMarketPrice?: number
  afterHoursPrice?: number
  status?: 'trading' | 'closed' | 'pre' | 'after'
  source?: string
}

export interface StockServiceResult {
  success: boolean
  data?: EnhancedStockQuote
  error?: string
  source?: string
}

// ============== 工具函数 ==============

function toTencentCode(symbol: string, market: string): string {
  const m = market.toUpperCase()
  if (m === 'HK') {
    return `hk${symbol.padStart(5, '0')}`
  } else if (m === 'US') {
    return `us${symbol.toUpperCase()}`
  } else {
    return `${symbol.startsWith('6') ? 'sh' : 'sz'}${symbol}`
  }
}

function toSinaCode(symbol: string, market: string): string {
  const m = market.toUpperCase()
  if (m === 'HK') {
    return `hk${symbol.padStart(5, '0')}`
  } else if (m === 'US') {
    return `us${symbol.toUpperCase()}`
  } else {
    return `${symbol.startsWith('6') ? 'sh' : 'sz'}${symbol}`
  }
}

function toYahooSymbol(symbol: string, market: string): string {
  const m = market.toUpperCase()
  if (m === 'HK') {
    return `${symbol}.HK`
  } else if (m === 'US') {
    return symbol.toUpperCase()
  } else {
    return `${symbol}.SS` // Shanghai
  }
}

// ============== Finnhub 符号转换 ==============

function toFinnhubSymbol(symbol: string, market: string): string {
  const m = market.toUpperCase()
  if (m === 'US') {
    return symbol.toUpperCase()
  } else if (m === 'HK') {
    // 港股：去掉前导0，Finnhub 支持如 0700.HK
    const digits = symbol.replace(/^0+/, '') || '0'
    const last4 = digits.slice(-4).padStart(4, '0')
    return `${last4}.HK`
  } else {
    // A股：上海=SH，深圳=SZ
    return symbol.startsWith('6') ? `SH:${symbol}` : `SZ:${symbol}`
  }
}

// ============== 腾讯财经 ==============

async function fetchFromTencent(symbol: string, market: string): Promise<StockServiceResult> {
  try {
    const code = toTencentCode(symbol, market)
    const url = `https://qt.gtimg.cn/q=${code}`

    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.qq.com',
        'User-Agent': 'Mozilla/5.0'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // 腾讯财经返回 GBK 编码，需用 TextDecoder 转码为 UTF-8
    const arrayBuffer = await response.arrayBuffer()
    const text = new TextDecoder('gbk').decode(arrayBuffer)
    const match = text.match(/="([^"]+)"/)
    if (!match) {
      return { success: false, error: '解析失败: 无法匹配数据' }
    }

    const fields = match[1].split('~')
    if (fields.length < 50) {
      return { success: false, error: '数据格式错误' }
    }

    const price = parseFloat(fields[3]) || 0
    const prevClose = parseFloat(fields[4]) || 0
    const open = parseFloat(fields[5]) || 0
    const volume = parseInt(fields[6]) || 0
    const amount = parseFloat(fields[37]) || 0
    const high = parseFloat(fields[33]) || 0
    const low = parseFloat(fields[34]) || 0
    const change = price - prevClose
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0
    let amplitude = prevClose > 0 ? ((high - low) / prevClose) * 100 : 0

    // 港股特有字段解析
    let week52High: number | undefined
    let week52Low: number | undefined
    let marketCap: number | undefined
    let pe: number | undefined
    let dividend: number | undefined

    if (market.toUpperCase() === 'HK' && fields.length > 50) {
      // 字段33=52周最高, 34=52周最低
      week52High = parseFloat(fields[48]) || undefined
      week52Low = parseFloat(fields[49]) || undefined
      // 字段37=成交额(万), 38=额(万)
      // 市值估算: 成交额/换手率 * 10000
      marketCap = parseFloat(fields[37]) ? parseFloat(fields[37]) * 100000000 / 0.02 : undefined
      // 市盈率字段39
      pe = parseFloat(fields[39]) || undefined
      // 股息率字段57
      dividend = parseFloat(fields[57]) || undefined
      // 振幅字段43
      amplitude = parseFloat(fields[43]) || 0
    }

    // 美股特有字段解析
    if (market.toUpperCase() === 'US' && fields.length > 50) {
      week52High = parseFloat(fields[33]) || undefined
      week52Low = parseFloat(fields[34]) || undefined
      pe = parseFloat(fields[52]) || undefined
      marketCap = parseFloat(fields[44]) ? parseFloat(fields[44]) * 1000000000 : undefined
    }

    const cleanSymbol = (fields[2] || symbol).replace(/\.[A-Z]+$/, '')
    const name = fields[1] || ''

    return {
      success: true,
      source: 'tencent',
      data: {
        symbol: cleanSymbol,
        name,
        price,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        open,
        prevClose,
        high,
        low,
        volume,
        amount: amount * 10000,
        market,
        updateTime: new Date().toISOString(),
        week52High,
        week52Low,
        marketCap,
        pe,
        dividend,
        amplitude: parseFloat(amplitude.toFixed(2)),
        status: 'trading',
        source: 'tencent'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败',
      source: 'tencent'
    }
  }
}

// ============== 新浪财经 ==============

async function fetchFromSina(symbol: string, market: string): Promise<StockServiceResult> {
  try {
    const code = toSinaCode(symbol, market)
    const url = `https://hq.sinajs.cn/list=${code}`

    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.sina.com.cn',
        'User-Agent': 'Mozilla/5.0'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // 新浪财经返回 GBK 编码，需用 TextDecoder 转码为 UTF-8
    const arrayBuffer = await response.arrayBuffer()
    const text = new TextDecoder('gbk').decode(arrayBuffer)
    const match = text.match(/"([^"]+)"/)
    if (!match) {
      return { success: false, error: '解析失败: 无法匹配数据' }
    }

    const fields = match[1].split(',')
    if (fields.length < 32) {
      return { success: false, error: '数据格式错误' }
    }

    const name = fields[0]
    const open = parseFloat(fields[1]) || 0
    const prevClose = parseFloat(fields[2]) || 0
    const price = parseFloat(fields[3]) || 0
    const high = parseFloat(fields[4]) || 0
    const low = parseFloat(fields[5]) || 0
    const volume = parseInt(fields[8]) || 0
    const amount = parseFloat(fields[9]) || 0
    const updateTime = fields[30] || fields[31] || ''

    const change = price - prevClose
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0
    const amplitude = prevClose > 0 ? ((high - low) / prevClose) * 100 : 0

    const cleanSymbol = symbol.replace(/\.[A-Z]+$/, '')

    return {
      success: true,
      source: 'sina',
      data: {
        symbol: cleanSymbol,
        name,
        price,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        open,
        prevClose,
        high,
        low,
        volume,
        amount,
        market,
        amplitude: parseFloat(amplitude.toFixed(2)),
        updateTime: updateTime ? `2026-${updateTime.replace(/-/g, '/')}` : new Date().toISOString(),
        status: 'trading',
        source: 'sina'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败',
      source: 'sina'
    }
  }
}

// ============== Yahoo Finance ==============

async function fetchFromYahoo(symbol: string, market: string): Promise<StockServiceResult> {
  try {
    const yahooSymbol = toYahooSymbol(symbol, market)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const json = await response.json()
    const result = json?.chart?.result?.[0]

    if (!result) {
      return { success: false, error: '无数据' }
    }

    const meta = result.meta
    const quote = result.timestamp && result.indicators?.quote?.[0]

    if (!meta || !quote) {
      return { success: false, error: '数据格式错误' }
    }

    const price = meta.regularMarketPrice || 0
    const prevClose = meta.previousClose || meta.chartPreviousClose || 0
    const open = meta.regularMarketOpen || 0
    const high = meta.regularMarketDayHigh || 0
    const low = meta.regularMarketDayLow || 0
    const volume = meta.regularMarketVolume || 0
    const amount = meta.regularMarketDayVolume || 0

    const change = price - prevClose
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0
    const amplitude = prevClose > 0 ? ((high - low) / prevClose) * 100 : 0

    // 提取52周数据
    const week52High = meta.fiftyTwoWeekHigh || undefined
    const week52Low = meta.fiftyTwoWeekLow || undefined
    const marketCap = meta.marketCap || undefined
    const pe = meta.trailingPE || undefined
    const dividend = meta.dividendYield ? meta.dividendYield * 100 : undefined

    // 盘前盘后
    const preMarketPrice = meta.preMarketPrice || undefined
    const afterHoursPrice = meta.postMarketPrice || undefined

    // 判断状态
    let status: 'trading' | 'closed' | 'pre' | 'after' = 'closed'
    if (preMarketPrice) status = 'pre'
    else if (afterHoursPrice) status = 'after'
    else if (price > 0 && open > 0) status = 'trading'

    return {
      success: true,
      source: 'yahoo',
      data: {
        symbol: symbol,
        name: meta.shortName || meta.symbol || symbol,
        price,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        open,
        prevClose,
        high,
        low,
        volume,
        amount,
        market,
        updateTime: new Date().toISOString(),
        week52High,
        week52Low,
        marketCap,
        pe,
        dividend,
        amplitude: parseFloat(amplitude.toFixed(2)),
        preMarketPrice,
        afterHoursPrice,
        status,
        source: 'yahoo'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败',
      source: 'yahoo'
    }
  }
}

// ============== Finnhub Finance ==============

async function fetchFromFinnhub(symbol: string, market: string): Promise<StockServiceResult> {
  if (!FINNHUB_API_KEY) {
    return { success: false, error: 'FINNHUB_API_KEY 未配置', source: 'finnhub' }
  }
  try {
    const finnhubSym = toFinnhubSymbol(symbol, market)
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSym)}&token=${FINNHUB_API_KEY}`

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, source: 'finnhub' }
    }

    const json = await response.json()
    if (!json || (json.c === 0 && json.d === 0 && json.pc === 0)) {
      return { success: false, error: '无数据', source: 'finnhub' }
    }

    const price = json.c || 0
    const prevClose = json.pc || 0
    const open = json.o || 0
    const high = json.h || 0
    const low = json.l || 0
    const volume = json.v || 0

    const change = price - prevClose
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0
    const amplitude = prevClose > 0 ? ((high - low) / prevClose) * 100 : 0

    // Finnhub 基础数据用 symbol 字段，后续可扩展 fundamentals API
    const cleanSymbol = symbol.replace(/\.[A-Z]+$/, '')

    return {
      success: true,
      source: 'finnhub',
      data: {
        symbol: cleanSymbol,
        name: symbol,
        price,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        open,
        prevClose,
        high,
        low,
        volume,
        amount: 0,
        market,
        amplitude: parseFloat(amplitude.toFixed(2)),
        updateTime: new Date().toISOString(),
        status: 'trading',
        source: 'finnhub'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败',
      source: 'finnhub'
    }
  }
}

// ============== 主函数 ==============

/**
 * 获取单个股票实时行情（多数据源容灾）
 * 优先级: Finnhub → 腾讯财经 → 新浪财经
 */
export async function getStockQuote(
  symbol: string,
  market: string = 'A',
  useCache: boolean = true
): Promise<StockServiceResult> {
  const cacheKey = makeCacheKey(symbol, market)

  // 检查缓存
  if (useCache) {
    const cached = getCache<EnhancedStockQuote>(cacheKey)
    if (cached) {
      return { success: true, data: cached, source: 'cache' }
    }
  }

  let lastError = ''

  // Finnhub（主数据源，免费支持美/港/A股）
  if (FINNHUB_API_KEY) {
    const result = await fetchFromFinnhub(symbol, market)
    if (result.success && result.data) {
      setCache(cacheKey, result.data)
      return result
    }
    lastError = result.error || ''
    console.log(`[stockService] ⚠️ Finnhub 获取 ${symbol} 失败: ${lastError}`)
  }

  // 腾讯财经（备用）
  const tencentResult = await fetchFromTencent(symbol, market)
  if (tencentResult.success && tencentResult.data) {
    setCache(cacheKey, tencentResult.data)
    return tencentResult
  }

  // 新浪财经（兜底）
  const sinaResult = await fetchFromSina(symbol, market)
  if (sinaResult.success && sinaResult.data) {
    setCache(cacheKey, sinaResult.data)
    return sinaResult
  }

  // 全部失败
  return {
    success: false,
    error: lastError || tencentResult.error || sinaResult.error || '获取失败',
    source: 'none'
  }
}

/**
 * 批量获取股票行情
 */
export async function getBatchQuotes(
  stocks: Array<{ symbol: string; market: string }>,
  useCache: boolean = true
): Promise<Record<string, EnhancedStockQuote | null>> {
  const results: Record<string, EnhancedStockQuote | null> = {}
  const toFetch: Array<{ symbol: string; market: string }> = []

  // 检查缓存
  for (const stock of stocks) {
    const cacheKey = makeCacheKey(stock.symbol, stock.market)
    if (useCache) {
      const cached = getCache<EnhancedStockQuote>(cacheKey)
      if (cached) {
        results[stock.symbol] = cached
        continue
      }
    }
    toFetch.push(stock)
  }

  // 并行获取未缓存的
  const batchSize = 10
  for (let i = 0; i < toFetch.length; i += batchSize) {
    const batch = toFetch.slice(i, i + batchSize)
    const promises = batch.map(async (stock) => {
      const result = await getStockQuote(stock.symbol, stock.market, false)
      return { stock, result }
    })

    const batchResults = await Promise.all(promises)
    batchResults.forEach(({ stock, result }) => {
      if (result.success && result.data) {
        results[stock.symbol] = result.data
      } else {
        results[stock.symbol] = null
      }
    })
  }

  return results
}

/**
 * 刷新单个股票缓存
 */
export async function refreshStockQuote(
  symbol: string,
  market: string
): Promise<StockServiceResult> {
  return getStockQuote(symbol, market, false)
}
