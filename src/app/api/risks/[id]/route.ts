import { NextRequest, NextResponse } from 'next/server'
import { riskService } from '@/server/services/riskService'
import { UpdateRiskInputSchema } from '@/lib/schemas/riskSchema'
import { z } from 'zod'

/**
 * GET /api/risks/:id
 * 获取风险详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '风险ID不能为空'
        },
        { status: 400 }
      )
    }

    // 获取风险详情
    const risk = await riskService.getRiskById(id)

    return NextResponse.json({
      success: true,
      data: { risk }
    })
  } catch (error) {
    console.error('获取风险详情失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取风险详情失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: error instanceof Error && error.message === '风险记录不存在' ? 404 : 500 }
    )
  }
}

/**
 * PUT /api/risks/:id
 * 更新风险记录
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '风险ID不能为空'
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    // 验证输入数据
    const validatedData = UpdateRiskInputSchema.parse(body)

    // 更新风险记录
    const risk = await riskService.updateRisk(id, validatedData)

    return NextResponse.json({
      success: true,
      data: { risk },
      message: '风险记录更新成功'
    })
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

    console.error('更新风险记录失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '更新风险记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: error instanceof Error && error.message === '风险记录不存在' ? 404 : 500 }
    )
  }
}

/**
 * DELETE /api/risks/:id
 * 删除风险记录
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '风险ID不能为空'
        },
        { status: 400 }
      )
    }

    // 删除风险记录
    await riskService.deleteRisk(id)

    return NextResponse.json({
      success: true,
      message: '风险记录删除成功'
    })
  } catch (error) {
    console.error('删除风险记录失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '删除风险记录失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: error instanceof Error && error.message === '风险记录不存在' ? 404 : 500 }
    )
  }
}