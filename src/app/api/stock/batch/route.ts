/**
 * POST /api/stock/batch
 * 批量获取股票行情
 *
 * Body: { "stocks": [{ "symbol": "00700", "market": "HK" }, ...] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBatchQuotes } from '@/server/services/stockService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stocks } = body

    if (!stocks || !Array.isArray(stocks)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: stocks array required' },
        { status: 400 }
      )
    }

    // 限制批量大小
    if (stocks.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Too many stocks: max 50' },
        { status: 400 }
      )
    }

    const results = await getBatchQuotes(stocks)

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
