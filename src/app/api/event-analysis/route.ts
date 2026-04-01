import { NextRequest, NextResponse } from 'next/server'
import { eventAnalysisService } from '@/server/services/eventAnalysisService'
import { CreateEventAnalysisSchema, QueryEventAnalysisSchema } from '@/lib/schemas/eventAnalysisSchema'
import { ZodError } from 'zod'

/**
 * GET /api/event-analysis
 * 获取事件分析列表（支持分页和筛选）
 *
 * Query参数:
 * - eventId?: string - 事件ID
 * - positionId?: string - 持仓ID
 * - thesisId?: string - 论题ID
 * - thesisImpact?: string - 影响方向 (strengthen/maintain/weaken/reverse)
 * - impactLevel?: string - 影响等级 (high/medium/low)
 * - page?: number - 页码 (默认1)
 * - pageSize?: number - 每页数量 (默认10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 构建查询参数
    const queryData = {
      eventId: searchParams.get('eventId') || undefined,
      positionId: searchParams.get('positionId') || undefined,
      thesisId: searchParams.get('thesisId') || undefined,
      thesisImpact: searchParams.get('thesisImpact') || undefined,
      impactLevel: searchParams.get('impactLevel') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '10'
    }

    // 验证查询参数
    const validatedQuery = QueryEventAnalysisSchema.parse(queryData)

    // 获取事件分析列表
    const { eventAnalyses, pagination } = await eventAnalysisService.getEventAnalyses(validatedQuery)

    return NextResponse.json({
      success: true,
      data: eventAnalyses,
      pagination
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching event analyses:', error)

    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch event analyses'
    }, { status: 500 })
  }
}

/**
 * POST /api/event-analysis
 * 创建新的事件分析
 *
 * Body参数:
 * {
 *   eventId: string - 事件ID
 *   positionId: string - 持仓ID
 *   thesisId: string - 论题ID
 *   relevanceScore: number - 相关度分数 (0-1)
 *   thesisImpact: string - 影响方向
 *   impactLevel: string - 影响等级
 *   reasoning: string - 推理分析
 *   evidenceJson?: array - 证据列表
 *   actionFramework: string - 行动框架
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证请求体
    const validatedData = CreateEventAnalysisSchema.parse(body)

    // 创建事件分析
    const eventAnalysis = await eventAnalysisService.createEventAnalysis(validatedData)

    return NextResponse.json({
      success: true,
      message: 'Event analysis created successfully',
      data: { eventAnalysis }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating event analysis:', error)

    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 409 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create event analysis'
    }, { status: 500 })
  }
}