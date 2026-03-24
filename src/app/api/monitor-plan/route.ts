import { NextRequest, NextResponse } from 'next/server'
import { monitorPlanService } from '@/server/services/monitorPlanService'
import { z } from 'zod'

// 查询参数schema
const querySchema = z.object({
  thesisId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // 1. 解析查询参数
    const { searchParams } = new URL(request.url)
    const thesisId = searchParams.get('thesisId')
    
    // 2. 验证参数
    const validationResult = querySchema.safeParse({ thesisId })
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
      }, { status: 400 })
    }

    // 3. 根据参数查询
    if (thesisId) {
      // 查询特定thesis的监控计划
      const monitorPlan = await monitorPlanService.getMonitorPlanByThesis(thesisId)
      
      if (!monitorPlan) {
        return NextResponse.json({
          success: true,
          data: { monitorPlan: null },
          message: 'No monitor plan found for this thesis',
        }, { status: 200 })
      }

      return NextResponse.json({
        success: true,
        data: { monitorPlan },
      }, { status: 200 })
      
    } else {
      // 如果没有thesisId参数，返回错误
      return NextResponse.json({
        success: false,
        error: 'thesisId query parameter is required',
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Failed to fetch monitor plan:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 })
  }
}