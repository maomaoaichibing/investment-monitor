import { NextRequest, NextResponse } from 'next/server'
import { thesisService } from '@/server/services/thesisService'

interface RouteParams {
  params: {
    positionId: string
  }
}

/**
 * 兼容接口 - 建议使用主接口：GET /api/thesis?positionId=xxx
 * 此接口保留用于向后兼容，但最终建议废弃
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 兼容接口：直接调用 service，避免递归调用自身 API
    
    const thesis = await thesisService.getThesisByPosition(params.positionId)
    
    if (!thesis) {
      return NextResponse.json(
        { error: 'Thesis not found for this position' },
        { status: 404 }
      )
    }
    
    // 解析JSON字段
    const thesisWithParsedFields = {
      ...thesis,
      pricePhases: JSON.parse(thesis.pricePhasesJson),
      coreThesis: JSON.parse(thesis.coreThesisJson),
      fragilePoints: JSON.parse(thesis.fragilePointsJson),
      monitorTargets: JSON.parse(thesis.monitorTargetsJson)
    }
    
    return NextResponse.json(thesisWithParsedFields)
  } catch (error) {
    console.error('Error fetching thesis:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch thesis', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}