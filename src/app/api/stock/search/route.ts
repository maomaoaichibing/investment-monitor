/**
 * GET /api/stock/search?q=关键词&market=HK
 * 搜索股票
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStockQuote } from '@/server/services/stockService'

// 热门股票列表
const HOT_STOCKS: Record<string, Array<{ symbol: string; name: string; market: string }>> = {
  A: [
    { symbol: '600519', name: '贵州茅台', market: 'A' },
    { symbol: '600036', name: '招商银行', market: 'A' },
    { symbol: '601318', name: '中国平安', market: 'A' },
    { symbol: '000858', name: '五粮液', market: 'A' },
    { symbol: '300750', name: '宁德时代', market: 'A' },
    { symbol: '002594', name: '比亚迪', market: 'A' },
    { symbol: '600900', name: '长江电力', market: 'A' },
    { symbol: '601012', name: '隆基绿能', market: 'A' },
    { symbol: '600276', name: '恒瑞医药', market: 'A' },
    { symbol: '000333', name: '美的集团', market: 'A' },
  ],
  HK: [
    { symbol: '00700', name: '腾讯控股', market: 'HK' },
    { symbol: '09988', name: '阿里巴巴', market: 'HK' },
    { symbol: '03690', name: '美团', market: 'HK' },
    { symbol: '00941', name: '中国移动', market: 'HK' },
    { symbol: '00939', name: '建设银行', market: 'HK' },
    { symbol: '00883', name: '中国海洋石油', market: 'HK' },
    { symbol: '00388', name: '香港交易所', market: 'HK' },
    { symbol: '00688', name: '中海外发展', market: 'HK' },
    { symbol: '01093', name: '中国平安', market: 'HK' },
    { symbol: '02318', name: '友邦保险', market: 'HK' },
  ],
  US: [
    { symbol: 'AAPL', name: '苹果', market: 'US' },
    { symbol: 'GOOGL', name: '谷歌', market: 'US' },
    { symbol: 'MSFT', name: '微软', market: 'US' },
    { symbol: 'AMZN', name: '亚马逊', market: 'US' },
    { symbol: 'TSLA', name: '特斯拉', market: 'US' },
    { symbol: 'NVDA', name: '英伟达', market: 'US' },
    { symbol: 'META', name: 'Meta', market: 'US' },
    { symbol: 'JPM', name: '摩根大通', market: 'US' },
    { symbol: 'V', name: 'Visa', market: 'US' },
    { symbol: 'JNJ', name: '强生', market: 'US' },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const market = searchParams.get('market') || ''

    // 如果没有查询词，返回热门股票
    if (!query) {
      let stocks = [...HOT_STOCKS.A, ...HOT_STOCKS.HK, ...HOT_STOCKS.US]

      if (market) {
        stocks = HOT_STOCKS[market.toUpperCase()] || []
      }

      // 获取实时价格
      const results = await Promise.all(
        stocks.slice(0, 10).map(async (s) => {
          const quote = await getStockQuote(s.symbol, s.market)
          return {
            symbol: s.symbol,
            name: s.name,
            market: s.market,
            price: quote.data?.price || 0,
            changePercent: quote.data?.changePercent || 0
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: results,
        type: 'hot'
      })
    }

    // 搜索逻辑：根据查询词匹配
    const allStocks = [
      ...HOT_STOCKS.A,
      ...HOT_STOCKS.HK,
      ...HOT_STOCKS.US
    ]

    const q = query.toLowerCase()
    const matched = allStocks.filter(s =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)
    )

    // 如果有市场过滤
    let filtered = matched
    if (market) {
      filtered = matched.filter(s => s.market.toUpperCase() === market.toUpperCase())
    }

    // 获取实时价格
    const results = await Promise.all(
      filtered.slice(0, 20).map(async (s) => {
        const quote = await getStockQuote(s.symbol, s.market)
        return {
          symbol: s.symbol,
          name: s.name,
          market: s.market,
          price: quote.data?.price || 0,
          changePercent: quote.data?.changePercent || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: results,
      type: 'search'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
