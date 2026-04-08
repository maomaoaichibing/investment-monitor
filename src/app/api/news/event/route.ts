/**
 * GET /api/news/event?id=xxx
 * 获取单条新闻事件的完整内容（含数据库原始内容）
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')
    const symbol = searchParams.get('symbol')
    const title = searchParams.get('title')

    let event: any = null

    if (eventId) {
      // 按 ID 精确查找
      event = await db.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { alerts: true, eventAnalyses: true } } }
      })
    } else if (symbol && title) {
      // 按 symbol + title 查找
      event = await db.event.findFirst({
        where: { symbol, title: decodeURIComponent(title), source: 'news' },
        include: { _count: { select: { alerts: true, eventAnalyses: true } } }
      })
    }

    if (!event) {
      return NextResponse.json({ success: false, error: '未找到该新闻' }, { status: 404 })
    }

    const metadata = JSON.parse(event.metadataJson || '{}')

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        symbol: event.symbol,
        title: event.title,
        titleZh: metadata.titleZh || undefined,
        content: event.content,
        eventType: event.eventType,
        eventTime: event.eventTime.toISOString(),
        source: event.source,
        url: metadata.url || '',
        newsSource: metadata.newsSource || event.source,
        sentiment: metadata.sentiment || 'neutral',
        sentimentScore: metadata.sentimentScore || 0,
        tags: metadata.tags || [],
        alertCount: event._count.alerts,
        analysisCount: event._count.eventAnalyses,
        isFromRss: (event.content || '').length < 300 // RSS摘要通常很短
      }
    })
  } catch (error) {
    console.error('[API/news/event] error:', error)
    return NextResponse.json(
      { success: false, error: '获取新闻详情失败' },
      { status: 500 }
    )
  }
}
