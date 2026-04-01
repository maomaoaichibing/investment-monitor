import { NextRequest, NextResponse } from 'next/server'
import { riskService } from '@/server/services/riskService'

/**
 * GET /api/risks/stats
 * 获取投资组合的风险统计
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

    // 获取风险统计
    const stats = await riskService.getRiskStats(portfolioId)

    return NextResponse.json({
      success: true,
      data: { stats }
    })
  } catch (error) {
    console.error('获取风险统计失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取风险统计失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}