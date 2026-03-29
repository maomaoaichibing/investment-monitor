/**
 * K线数据服务 - 多数据源整合
 * 优先级: 腾讯财经 → 新浪财经 → Yahoo Finance
 */

import { getCache, setCache, makeCacheKey } from './stockCache'

// ============== 类型定义 ==============

export interface KLine {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  amount: number
}

export interface KLineResult {
  success: boolean
  data?: {
    symbol: string
    name: string
    market: string
    klines: KLine[]
  }
  error?: string
  source?: string
}

// ============== 腾讯财经K线 ==============

async function fetchKLineFromTencent(symbol: string, market: string, count: number): Promise<KLineResult> {
  try {
    const m = market.toUpperCase()
    let code: string
    let name = symbol

    if (m === 'HK') {
      code = `hk${symbol.padStart(5, '0')}`
    } else if (m === 'US') {
      code = `us${symbol.toUpperCase()}`
    } else {
      // A股
      code = `${symbol.startsWith('6') ? 'sh' : 'sz'}${symbol}`
    }

    // 腾讯财经日K线接口
    const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_dayqfq&param=${code},day,,,${count},qfq`

    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.qq.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const text = await response.text()
    // 解析 var=kline_dayqfq={...} 格式
    const jsonStr = text.replace(/^[^=]+=/, '')
    const json = JSON.parse(jsonStr)

    const data = json?.data?.[code]
    if (!data) {
      return { success: false, error: '无数据' }
    }

    // 获取日K线数据
    const dayData = data.qfqday || data.day || []
    if (!dayData || dayData.length === 0) {
      return { success: false, error: 'K线数据为空' }
    }

    // 取最近的count条
    const klines = dayData.slice(-count).map((item: any[]) => {
      const dateStr = item[0]
      // 转换日期格式 YYYYMMDD -> YYYY-MM-DD
      const date = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
      return {
        date,
        open: parseFloat(item[1]) || 0,
        high: parseFloat(item[2]) || 0,
        low: parseFloat(item[3]) || 0,
        close: parseFloat(item[4]) || 0,
        volume: parseInt(item[5]) || 0,
        amount: parseFloat(item[6]) || 0
      }
    })

    // 获取股票名称
    const stockName = data.qfqday?.name || data.day?.name || data.name || symbol

    return {
      success: true,
      source: 'tencent',
      data: {
        symbol,
        name: stockName,
        market,
        klines
      }
    }
  } catch (error) {
    console.error('[KLineService] 腾讯财经K线获取失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    }
  }
}

// ============== 新浪财经K线 ==============

async function fetchKLineFromSina(symbol: string, market: string, count: number): Promise<KLineResult> {
  try {
    const m = market.toUpperCase()
    let code: string
    let name = symbol

    if (m === 'HK') {
      code = `hk${symbol.padStart(5, '0')}`
    } else if (m === 'US') {
      code = `gb_${symbol.toUpperCase()}`
    } else {
      code = `${symbol.startsWith('6') ? 'sh' : 'sz'}${symbol}`
    }

    // 新浪财经K线接口
    const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${code}&scale=240&ma=5&datalen=${count}`

    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.sina.com.cn',
        'User-Agent': 'Mozilla/5.0'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: '无数据' }
    }

    const klines = data.map((item: any) => ({
      date: item.day,
      open: parseFloat(item.open) || 0,
      high: parseFloat(item.high) || 0,
      low: parseFloat(item.low) || 0,
      close: parseFloat(item.close) || 0,
      volume: parseInt(item.volume) || 0,
      amount: 0
    }))

    return {
      success: true,
      source: 'sina',
      data: {
        symbol,
        name,
        market,
        klines
      }
    }
  } catch (error) {
    console.error('[KLineService] 新浪财经K线获取失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    }
  }
}

// ============== Yahoo Finance K线 (备用) ==============

async function fetchKLineFromYahoo(symbol: string, market: string, count: number): Promise<KLineResult> {
  try {
    const m = market.toUpperCase()
    let yahooSymbol: string

    if (m === 'HK') {
      yahooSymbol = `${symbol}.HK`
    } else if (m === 'US') {
      yahooSymbol = symbol.toUpperCase()
    } else {
      yahooSymbol = `${symbol}.SS`
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=${count}d`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    })

    if (response.status === 429) {
      return {
        success: false,
        error: '请求被限流'
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const json = await response.json()
    const result = json?.chart?.result?.[0]

    if (!result) {
      return { success: false, error: '无数据' }
    }

    const timestamps = result.timestamp || []
    const quote = result.indicators?.quote?.[0] || {}
    const adjclose = result.indicators?.adjclose?.[0] || {}

    const klines: KLine[] = timestamps.map((ts: number, i: number) => {
      const date = new Date(ts * 1000).toISOString().split('T')[0]
      return {
        date,
        open: quote.open?.[i] || 0,
        high: quote.high?.[i] || 0,
        low: quote.low?.[i] || 0,
        close: adjclose.adjclose?.[i] || quote.close?.[i] || 0,
        volume: quote.volume?.[i] || 0,
        amount: 0
      }
    })

    return {
      success: true,
      source: 'yahoo',
      data: {
        symbol,
        name: result.meta?.shortName || symbol,
        market,
        klines
      }
    }
  } catch (error) {
    console.error('[KLineService] Yahoo Finance K线获取失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    }
  }
}

// ============== 主函数：获取K线数据 ==============

/**
 * 获取股票K线数据 (多数据源容灾)
 * @param symbol 股票代码
 * @param market 市场 (HK/US/CN)
 * @param count 数据条数 (默认30)
 */
export async function getKLineData(symbol: string, market: string = 'HK', count: number = 30): Promise<KLineResult> {
  const cacheKey = `kline:${makeCacheKey(symbol, market)}:${count}`

  // 检查缓存 (30分钟)
  const cached = getCache<KLineResult['data']>(cacheKey, 30 * 60 * 1000)
  if (cached) {
    return {
      success: true,
      data: cached,
      source: 'cache'
    }
  }

  // 按优先级尝试各数据源
  const sources = [
    { fn: fetchKLineFromTencent, name: '腾讯财经', priority: 1 },
    { fn: fetchKLineFromSina, name: '新浪财经', priority: 2 },
    { fn: fetchKLineFromYahoo, name: 'Yahoo Finance', priority: 3 }
  ]

  for (const source of sources) {
    console.log(`[KLineService] 尝试 ${source.name}...`)
    const result = await source.fn(symbol, market, count)

    if (result.success && result.data) {
      // 缓存结果
      setCache(cacheKey, result.data)
      console.log(`[KLineService] ✅ ${source.name} 成功`)
      return {
        ...result,
        source: result.source || source.name
      }
    }

    console.log(`[KLineService] ⚠️ ${source.name} 失败: ${result.error}`)
  }

  return {
    success: false,
    error: '所有数据源均不可用'
  }
}

/**
 * 获取指定周期的K线
 * @param symbol 股票代码
 * @param market 市场
 * @param period 周期 (daily/weekly/monthly)
 * @param count 数据条数
 */
export async function getKLineDataByPeriod(
  symbol: string,
  market: string = 'HK',
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  count: number = 30
): Promise<KLineResult> {
  // 目前主要数据源只支持日K，weekly/monthly需要转换
  return getKLineData(symbol, market, count)
}
