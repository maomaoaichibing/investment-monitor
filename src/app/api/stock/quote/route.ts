import { NextRequest, NextResponse } from 'next/server'
import { getStockQuote, getBatchQuotes } from '@/server/services/stockService'

// GET /api/stock/quote?symbol=000001&market=A
// GET /api/stock/quote?symbols=000001,600519&markets=A,A
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const market = searchParams.get('market') || 'A'
    const symbols = searchParams.get('symbols')
    const markets = searchParams.get('markets')

    // 批量查询
    if (symbols && markets) {
      const symbolList = symbols.split(',')
      const marketList = markets.split(',')

      const stocks = symbolList.map((s, i) => ({
        symbol: s,
        market: marketList[i] || market
      }))

      const quotes = await getBatchQuotes(stocks)
      return NextResponse.json({ success: true, data: { quotes } })
    }

    // 单个查询
    if (!symbol) {
      return NextResponse.json(
        { success: false, error: '缺少symbol参数' },
        { status: 400 }
      )
    }

    const result = await getStockQuote(symbol, market)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Stock quote error:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
