import { NextRequest, NextResponse } from 'next/server'
import { dataIntegrationService } from '@/server/services/dataIntegrationService'

/**
 * GET /api/data-integration/industry
 * 获取行业数据
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const industry = searchParams.get('industry') || 'technology'
    const period = searchParams.get('period') || '2024Q1'

    // 获取行业数据
    const industryData = await dataIntegrationService.fetchIndustryData(industry, period)

    return NextResponse.json({
      success: true,
      data: { industryData }
    })
  } catch (error) {
    console.error('获取行业数据失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取行业数据失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}