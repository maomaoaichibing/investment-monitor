/**
 * 股票行情服务 - 腾讯财经/新浪财经
 * 支持A股、港股、美股实时行情
 */

export interface StockQuote {
  symbol: string      // 股票代码
  name: string        // 股票名称
  price: number        // 当前价格
  change: number       // 涨跌额
  changePercent: number // 涨跌幅(%)
  open: number         // 开盘价
  prevClose: number    // 昨收价
  high: number         // 最高价
  low: number          // 最低价
  volume: number       // 成交量
  amount: number       // 成交额
  market: string       // 市场 (SH/SZ/HK/US)
  updateTime: string   // 更新时间
}

export interface StockServiceResult {
  success: boolean
  data?: StockQuote
  error?: string
}

/**
 * 转换股票代码为腾讯格式
 * A股: sz000001 -> sz000001
 * 港股: 00700 -> hk00700
 * 美股: AAPL -> usAAPL
 */
function toTencentCode(symbol: string, market: string): string {
  const m = market.toUpperCase()
  if (m === 'HK') {
    return `hk${symbol.padStart(5, '0')}`
  } else if (m === 'US') {
    return `us${symbol.toUpperCase()}`
  } else {
    // A股
    return `${symbol.startsWith('6') ? 'sh' : 'sz'}${symbol}`
  }
}

/**
 * 从腾讯财经获取实时行情
 * 腾讯格式: v_sz000001="51~平安银行~000001~10.98~10.94~10.91~..."
 */
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

    const text = await response.text()
    // 格式: v_sz000001="51~平安银行~000001~10.98~..."
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
    const volume = parseInt(fields[6]) || 0  // 成交量(手)
    const amount = parseFloat(fields[37]) || 0 // 成交额(万)
    const high = parseFloat(fields[33]) || 0
    const low = parseFloat(fields[34]) || 0
    const change = price - prevClose
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

    return {
      success: true,
      data: {
        symbol: fields[2] || symbol,
        name: fields[1] || '',
        price,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        open,
        prevClose,
        high,
        low,
        volume,
        amount: amount * 10000, // 万转元
        market,
        updateTime: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    }
  }
}

/**
 * 从新浪财经获取实时行情
 * 新浪格式: var hq_str_sz000001="平安银行,10.910,10.940,10.980,..."
 */
async function fetchFromSina(symbol: string, market: string): Promise<StockServiceResult> {
  try {
    let code: string
    const m = market.toUpperCase()

    if (m === 'HK') {
      code = `hk${symbol.padStart(5, '0')}`
    } else if (m === 'US') {
      code = `us${symbol.toUpperCase()}`
    } else {
      code = `${symbol.startsWith('6') ? 'sh' : 'sz'}${symbol}`
    }

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

    const text = await response.text()
    // 格式: var hq_str_sz000001="平安银行,10.910,10.940,..."
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
    const volume = parseInt(fields[8]) || 0  // 成交量(股)
    const amount = parseFloat(fields[9]) || 0 // 成交额
    const updateTime = fields[30] || fields[31] || ''

    const change = price - prevClose
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

    return {
      success: true,
      data: {
        symbol,
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
        updateTime: updateTime ? `2026-${updateTime.replace(/-/g, '/')}` : new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    }
  }
}

/**
 * 获取单个股票实时行情
 * 优先使用腾讯财经，失败则尝试新浪
 */
export async function getStockQuote(symbol: string, market: string = 'A'): Promise<StockServiceResult> {
  // 先尝试腾讯
  const tencentResult = await fetchFromTencent(symbol, market)
  if (tencentResult.success) {
    return tencentResult
  }

  // 腾讯失败，尝试新浪
  const sinaResult = await fetchFromSina(symbol, market)
  if (sinaResult.success) {
    return sinaResult
  }

  // 都失败
  return {
    success: false,
    error: tencentResult.error || sinaResult.error || '获取失败'
  }
}

/**
 * 批量获取股票行情
 */
export async function getBatchQuotes(
  stocks: Array<{ symbol: string; market: string }>
): Promise<Record<string, StockQuote>> {
  const results: Record<string, StockQuote> = {}

  // 并行获取（限制并发数）
  const batchSize = 10
  for (let i = 0; i < stocks.length; i += batchSize) {
    const batch = stocks.slice(i, i + batchSize)
    const promises = batch.map(async (stock) => {
      const result = await getStockQuote(stock.symbol, stock.market)
      return { stock, result }
    })

    const batchResults = await Promise.all(promises)
    batchResults.forEach(({ stock, result }) => {
      if (result.success && result.data) {
        results[stock.symbol] = result.data
      }
    })
  }

  return results
}
