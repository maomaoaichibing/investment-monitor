import { NextRequest, NextResponse } from 'next/server'
import { eventAnalysisService } from '@/server/services/eventAnalysisService'

/**
 * POST /api/event-analysis/generate
 * AI自动生成事件分析
 *
 * Body参数:
 * {
 *   eventId: string - 事件ID
 *   thesisId: string - 论题ID
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { eventId, thesisId } = body

    if (!eventId || !thesisId) {
      return NextResponse.json({
        success: false,
        error: 'eventId and thesisId are required'
      }, { status: 400 })
    }

    // AI生成事件分析
    const eventAnalysis = await eventAnalysisService.generateEventAnalysis(eventId, thesisId)

    return NextResponse.json({
      success: true,
      message: 'Event analysis generated successfully',
      data: { eventAnalysis }
    }, { status: 201 })

  } catch (error) {
    console.error('Error generating event analysis:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 404 })
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 409 })
      }
      if (error.message.includes('AI') || error.message.includes('分析')) {
        return NextResponse.json({
          success: false,
          error: 'AI分析失败: ' + error.message
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate event analysis'
    }, { status: 500 })
  }
}
