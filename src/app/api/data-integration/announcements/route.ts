import { NextRequest, NextResponse } from 'next/server'
import { dataIntegrationService } from '@/server/services/dataIntegrationService'

export const dynamic = 'force-dynamic'

/**
 * GET /api/data-integration/announcements
 * 获取公司公告数据
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: 'symbol参数不能为空'
        },
        { status: 400 }
      )
    }

    // 获取公告数据
    const announcements = await dataIntegrationService.fetchAnnouncements(symbol, limit)

    return NextResponse.json({
      success: true,
      data: { announcements }
    })
  } catch (error) {
    console.error('获取公告数据失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取公告数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}