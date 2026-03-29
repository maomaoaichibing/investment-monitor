/**
 * GET /api/stock/history/[symbol]?market=HK&count=30
 * 获取股票历史K线数据
 *
 * 数据源: 腾讯财经 → 新浪财经 → Yahoo Finance (多数据源容灾)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getKLineData } from '@/server/services/klineService'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const searchParams = request.nextUrl.searchParams
    const market = searchParams.get('market') || 'HK'
    const count = Math.min(parseInt(searchParams.get('count') || '30'), 365)

    // 检查缓存 (30分钟)
    const cacheKey = `kline:${makeCacheKey(symbol, market)}:${count}`
    const cached = getCache<{ symbol: string; name: string; market: string; klines: KLine[] }>(cacheKey, 30 * 60 * 1000)

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        source: 'cache',
        cachedAt: new Date().toISOString()
      })
    }

    // 获取K线数据 (多数据源容灾)
    const result = await getKLineData(symbol, market, count)

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || '获取K线数据失败',
          message: 'K线数据暂时不可用，请稍后重试'
        },
        { status: 500 }
      )
    }

    // 缓存结果
    setCache(cacheKey, result.data)

    return NextResponse.json({
      success: true,
      data: result.data,
      source: result.source,
      cachedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('[KLine API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
