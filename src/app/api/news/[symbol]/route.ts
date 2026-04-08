/**
 * GET /api/news/[symbol]
 * 获取指定股票的新闻（实时抓取）
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchNewsForSymbol, ruleBasedSentiment } from '@/server/services/newsService'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = decodeURIComponent(params.symbol)
    const { searchParams } = new URL(request.url)
    const market = searchParams.get('market') || 'US'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 30)
    
    // 实时抓取新闻
    const result = await fetchNewsForSymbol(symbol, market, { limit })
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        source: result.source
      }, { status: 200 })
    }
    
    // 添加情感分析
    const newsWithSentiment = (result.data || []).map(item => ({
      ...item,
      ...ruleBasedSentiment(item.title + ' ' + item.content)
    }))
    
    // 获取持仓关联信息
    const position = await db.position.findFirst({
      where: { symbol },
      select: { id: true, assetName: true, market: true }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        symbol,
        market,
        position: position ? { id: position.id, assetName: position.assetName } : null,
        news: newsWithSentiment,
        source: result.source,
        fetchedAt: result.fetchedAt
      }
    })
  } catch (error) {
    console.error('[API/news/[symbol]] error:', error)
    return NextResponse.json(
      { success: false, error: '获取新闻失败' },
      { status: 500 }
    )
  }
}
