import { NextRequest, NextResponse } from 'next/server'
import { riskService } from '@/server/services/riskService'

/**
 * GET /api/risks/correlation
 * 计算投资组合的相关性分析
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const portfolioId = searchParams.get('portfolioId')

    if (!portfolioId) {
      return NextResponse.json(
        {
          success: false,
          error: 'portfolioId参数不能为空'
        },
        { status: 400 }
      )
    }

    // 计算相关性分析
    const correlation = await riskService.calculateCorrelation(portfolioId)

    return NextResponse.json({
      success: true,
      data: { correlation }
    })
  } catch (error) {
    console.error('计算相关性分析失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '计算相关性分析失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}