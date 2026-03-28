/**
 * GET /api/stock/quote/[symbol]?market=HK
 * 获取单个股票实时行情
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStockQuote } from '@/server/services/stockService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const searchParams = request.nextUrl.searchParams
    const market = searchParams.get('market') || 'HK'

    const result = await getStockQuote(symbol, market)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
