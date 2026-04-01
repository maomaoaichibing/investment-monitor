import { NextRequest, NextResponse } from 'next/server'
import { riskService } from '@/server/services/riskService'

/**
 * GET /api/risks/exposure
 * 计算投资组合的风险暴露
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

    // 计算风险暴露
    const exposure = await riskService.calculateRiskExposure(portfolioId)

    return NextResponse.json({
      success: true,
      data: { exposure }
    })
  } catch (error) {
    console.error('计算风险暴露失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '计算风险暴露失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}