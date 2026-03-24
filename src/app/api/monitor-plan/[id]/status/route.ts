import { NextRequest, NextResponse } from 'next/server'
import { monitorPlanService } from '@/server/services/monitorPlanService'
import { updateMonitorPlanStatusRequestSchema } from '@/lib/schemas/monitorPlanSchema'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // 1. 验证请求体
    const body = await request.json()
    const validationResult = updateMonitorPlanStatusRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `请求体格式错误：${validationResult.error.errors.map(e => e.message).join(', ')}`,
        },
        { status: 400 }
      )
    }

    const { status } = validationResult.data

    // 2. 调用 service 层
    const monitorPlan = await monitorPlanService.updateMonitorPlanStatus(id, status)

    // 3. 返回成功响应
    return NextResponse.json({
      success: true,
      data: { monitorPlan },
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'

    // 4. 错误处理
    if (message.includes('监控计划不存在')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 404 }
      )
    }

    if (message.includes('状态流转非法')) {
      return NextResponse.json(
        { success: false, error: message },
        { status: 422 }
      )
    }

    // 5. 未知错误
    console.error('Failed to update monitor plan status:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
