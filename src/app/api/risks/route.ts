import { NextRequest, NextResponse } from 'next/server'
import { riskService } from '@/server/services/riskService'
import { CreateRiskInputSchema, QueryRiskInputSchema } from '@/lib/schemas/riskSchema'
import { z } from 'zod'

/**
 * GET /api/risks
 * 查询风险列表（支持分页和筛选）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // 解析查询参数
    const queryInput = {
      portfolioId: searchParams.get('portfolioId') || undefined,
      positionId: searchParams.get('positionId') || undefined,
      thesisId: searchParams.get('thesisId') || undefined,
      riskType: searchParams.get('riskType') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10'
    }

    // 验证查询参数
    const validatedQuery = QueryRiskInputSchema.parse(queryInput)

    // 获取风险列表
    const result = await riskService.getRisks(validatedQuery)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '参数验证失败',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('查询风险列表失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '查询风险列表失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/risks
 * 创建新风险记录
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入数据
    const validatedData = CreateRiskInputSchema.parse(body)

    // 创建风险记录
    const risk = await riskService.createRisk(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: { risk },
        message: '风险记录创建成功'
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '数据验证失败',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('创建风险记录失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '创建风险记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}