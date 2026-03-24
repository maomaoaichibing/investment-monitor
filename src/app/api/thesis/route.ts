import { NextRequest, NextResponse } from 'next/server'
import { thesisService } from '@/server/services/thesisService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const positionId = searchParams.get('positionId')
    
    if (positionId) {
      // 获取指定持仓的Thesis
      const thesis = await thesisService.getThesisByPosition(positionId)
      
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
    }
    
    // 如果没有positionId，返回错误
    return NextResponse.json(
      { error: 'positionId parameter is required' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Error fetching thesis:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch thesis', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}