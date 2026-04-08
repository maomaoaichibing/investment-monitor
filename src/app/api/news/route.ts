/**
 * GET /api/news
 * 获取新闻列表（支持按持仓筛选）
 * 
 * 查询参数:
 * - symbol?: 按股票代码筛选
 * - limit?: 返回数量（默认20）
 * - source?: news=仅新闻, all=全部事件
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const source = searchParams.get('source') || 'news'
    
    const where: any = {}
    
    if (symbol) {
      where.symbol = symbol
    }
    
    if (source === 'news') {
      where.source = 'news'
    }
    
    const events = await db.event.findMany({
      where,
      orderBy: { eventTime: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { alerts: true, eventAnalyses: true }
        }
      }
    })
    
    const news = events.map(event => {
      const metadata = JSON.parse(event.metadataJson || '{}')
      return {
        id: event.id,
        symbol: event.symbol,
        title: event.title,
        content: event.content,
        eventType: event.eventType,
        eventTime: event.eventTime.toISOString(),
        source: event.source,
        url: metadata.url || '',
        newsSource: metadata.newsSource || event.source,
        sentiment: metadata.sentiment || 'neutral',
        sentimentScore: metadata.sentimentScore || 0,
        tags: metadata.tags || [],
        imageUrl: metadata.imageUrl || undefined,
        alertCount: event._count.alerts,
        analysisCount: event._count.eventAnalyses
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        news,
        total: news.length,
        fetchedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[API/news] GET error:', error)
    return NextResponse.json(
      { success: false, error: '获取新闻失败', detail: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
