import { NextRequest, NextResponse } from 'next/server'
import { dataIntegrationService } from '@/server/services/dataIntegrationService'

export const dynamic = 'force-dynamic'

/**
 * GET /api/data-integration/news
 * 获取新闻数据
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')

    // 获取新闻数据
    const news = await dataIntegrationService.fetchNews(symbol, limit)

    return NextResponse.json({
      success: true,
      data: { news }
    })
  } catch (error) {
    console.error('获取新闻数据失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取新闻数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}