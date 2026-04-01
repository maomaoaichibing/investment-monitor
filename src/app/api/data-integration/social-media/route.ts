import { NextRequest, NextResponse } from 'next/server'
import { dataIntegrationService } from '@/server/services/dataIntegrationService'

/**
 * GET /api/data-integration/social-media
 * 获取社交媒体数据
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol') || undefined
    const limit = parseInt(searchParams.get('limit') || '30')

    // 获取社交媒体数据
    const socialMedia = await dataIntegrationService.fetchSocialMedia(symbol, limit)

    return NextResponse.json({
      success: true,
      data: { socialMedia }
    })
  } catch (error) {
    console.error('获取社交媒体数据失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取社交媒体数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}