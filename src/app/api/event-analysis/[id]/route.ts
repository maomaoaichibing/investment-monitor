import { NextRequest, NextResponse } from 'next/server'
import { eventAnalysisService } from '@/server/services/eventAnalysisService'
import { UpdateEventAnalysisSchema } from '@/lib/schemas/eventAnalysisSchema'
import { ZodError } from 'zod'

/**
 * GET /api/event-analysis/:id
 * 获取单个事件分析详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Event analysis ID is required'
      }, { status: 400 })
    }

    const eventAnalysis = await eventAnalysisService.getEventAnalysisById(id)

    return NextResponse.json({
      success: true,
      data: eventAnalysis
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching event analysis:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Event analysis not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch event analysis'
    }, { status: 500 })
  }
}

/**
 * PUT /api/event-analysis/:id
 * 更新事件分析
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Event analysis ID is required'
      }, { status: 400 })
    }

    const body = await request.json()

    // 验证请求体
    const validatedData = UpdateEventAnalysisSchema.parse(body)

    // 更新事件分析
    const eventAnalysis = await eventAnalysisService.updateEventAnalysis(id, validatedData)

    return NextResponse.json({
      success: true,
      message: 'Event analysis updated successfully',
      data: { eventAnalysis }
    }, { status: 200 })

  } catch (error) {
    console.error('Error updating event analysis:', error)

    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Event analysis not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update event analysis'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/event-analysis/:id
 * 删除事件分析
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Event analysis ID is required'
      }, { status: 400 })
    }

    const eventAnalysis = await eventAnalysisService.deleteEventAnalysis(id)

    return NextResponse.json({
      success: true,
      message: 'Event analysis deleted successfully',
      data: { eventAnalysis }
    }, { status: 200 })

  } catch (error) {
    console.error('Error deleting event analysis:', error)

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Event analysis not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete event analysis'
    }, { status: 500 })
  }
}
