/**
 * GET /api/stock/history/[symbol]?market=HK&period=daily&count=30
 * 获取股票历史K线数据
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
}> {
  try {
    const yahooSymbol = toYahooSymbol(symbol, market)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=${count}d`

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

    // 检查缓存
    const cached = getCache<{ symbol: string; name: string; klines: KLine[] }>(cacheKey, 5 * 60 * 1000)
    if (cached) {
      return NextResponse.json({ success: true, data: cached, source: 'cache' })
    }

    // 获取数据
    const result = await fetchKLineFromYahoo(symbol, market, count)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    // 缓存结果
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
