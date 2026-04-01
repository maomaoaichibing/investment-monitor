import { NextRequest, NextResponse } from 'next/server'
import { dataIntegrationService } from '@/server/services/dataIntegrationService'

/**
 * GET /api/data-integration/integrate
 * 整合所有数据源
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const symbol = searchParams.get('symbol') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')

    const options = {
      includeNews: searchParams.get('includeNews') !== 'false',
      includeAnnouncements: searchParams.get('includeAnnouncements') !== 'false',
      includeSocialMedia: searchParams.get('includeSocialMedia') !== 'false',
      includeIndustryData: searchParams.get('includeIndustryData') !== 'false',
      limit
    }

    // 整合所有数据源
    const integratedData = await dataIntegrationService.integrateData(symbol, options)

    return NextResponse.json({
      success: true,
      data: integratedData
    })
  } catch (error) {
    console.error('数据整合失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '数据整合失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}