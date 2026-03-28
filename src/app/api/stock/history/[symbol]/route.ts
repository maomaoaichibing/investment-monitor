/**
 * GET /api/stock/history/[symbol]?market=HK&period=daily&count=30
 * 获取股票历史K线数据
 *
 * 数据源: Yahoo Finance
 * 注意: K线数据需要服务器能访问 Yahoo Finance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCache, setCache, makeCacheKey } from '@/server/services/stockCache'

export interface KLine {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  amount: number
}

function toYahooSymbol(symbol: string, market: string): string {
  const m = market.toUpperCase()
  if (m === 'HK') {
    return `${symbol}.HK`
  } else if (m === 'US') {
    return symbol.toUpperCase()
  } else {
    return `${symbol}.SS`
  }
}

async function fetchKLineFromYahoo(symbol: string, market: string, count: number): Promise<{
  success: boolean
  data?: {
    symbol: string
    name: string
    klines: KLine[]
  }
  error?: string
  retryAfter?: number
}> {
  try {
    const yahooSymbol = toYahooSymbol(symbol, market)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=${count}d`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    })

    // 如果被限流，返回retryAfter
    if (response.status === 429) {
      return {
        success: false,
        error: '请求过于频繁，请稍后重试',
        retryAfter: 60 // 1分钟后重试
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
    const indicators = result.indicators?.adjclose?.[0] || {}

    const klines: KLine[] = timestamps.map((ts: number, i: number) => {
      const date = new Date(ts * 1000).toISOString().split('T')[0]
      return {
        date,
        open: quote.open?.[i] || 0,
        high: quote.high?.[i] || 0,
        low: quote.low?.[i] || 0,
        close: indicators.adjclose?.[i] || quote.close?.[i] || 0,
        volume: quote.volume?.[i] || 0,
        amount: 0
      }
    })

    return {
      success: true,
      data: {
        symbol,
        name: result.meta?.shortName || symbol,
        klines
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const searchParams = request.nextUrl.searchParams
    const market = searchParams.get('market') || 'HK'
    const count = Math.min(parseInt(searchParams.get('count') || '30'), 365)

    const cacheKey = `history:${makeCacheKey(symbol, market)}:${count}`

    // 检查缓存 (30分钟缓存)
    const cached = getCache<{ symbol: string; name: string; klines: KLine[] }>(cacheKey, 30 * 60 * 1000)
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        source: 'cache',
        cachedAt: new Date().toISOString()
      })
    }

    // 获取数据
    const result = await fetchKLineFromYahoo(symbol, market, count)

    if (!result.success || !result.data) {
      // 如果被限流，返回429状态码和retryAfter头
      if (result.retryAfter) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            retryAfter: result.retryAfter,
            message: 'K线数据暂时不可用，请稍后重试或联系管理员配置备用数据源'
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: 'K线数据暂时不可用。Yahoo Finance 在部分服务器上有限制访问，请联系管理员配置备用数据源（如腾讯财经、新浪财经）'
        },
        { status: 500 }
      )
    }

    // 缓存结果 (30分钟)
    setCache(cacheKey, result.data)

    return NextResponse.json({
      success: true,
      data: result.data,
      source: 'yahoo'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
