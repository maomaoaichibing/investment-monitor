import { NextRequest, NextResponse } from 'next/server'
import { monitorPlanService } from '@/server/services/monitorPlanService'
import { generateMonitorPlanRequestSchema } from '@/lib/schemas/monitorPlanSchema'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // 1. 解析和验证请求体
    const body = await request.json()
    const validationResult = generateMonitorPlanRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: validationResult.error.errors[0]?.message || 'Invalid request body',
      }, { status: 400 })
    }

    const { thesisId } = validationResult.data

    // 2. 检查thesis是否存在
    const thesis = await db.thesis.findUnique({
      where: { id: thesisId },
    })

    if (!thesis) {
      return NextResponse.json({
        success: false,
        error: `Thesis with id ${thesisId} not found`,
      }, { status: 404 })
    }

    // 3. 生成监控计划（幂等）
    const result = await monitorPlanService.generateMonitorPlanForThesis(thesisId)

    // 4. 根据是否新建返回不同状态码
    if (result.created) {
      return NextResponse.json({
        success: true,
        message: 'Monitor plan created successfully',
        data: {
          monitorPlan: result.monitorPlan,
          created: result.created,
          source: result.source,
        },
      }, { status: 201 })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Monitor plan already exists',
        data: {
          monitorPlan: result.monitorPlan,
          created: result.created,
          source: result.source,
        },
      }, { status: 200 })
    }

  } catch (error: any) {
    console.error('Failed to generate monitor plan:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 })
  }
}