import { NextRequest, NextResponse } from 'next/server'
import { thesisService } from '@/server/services/thesisService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const positionId = searchParams.get('positionId')
    const portfolioId = searchParams.get('portfolioId')
    
    // 如果指定了positionId，返回单个论题
    if (positionId) {
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
    
    // 如果指定了portfolioId，返回该组合的所有论题
    if (portfolioId) {
      const theses = await thesisService.getThesesByPortfolio(portfolioId)
      
      // 解析JSON字段
      const thesesWithParsedFields = theses.map(thesis => ({
        ...thesis,
        pricePhases: JSON.parse(thesis.pricePhasesJson),
        coreThesis: JSON.parse(thesis.coreThesisJson),
        fragilePoints: JSON.parse(thesis.fragilePointsJson),
        monitorTargets: JSON.parse(thesis.monitorTargetsJson)
      }))
      
      return NextResponse.json({ theses: thesesWithParsedFields })
    }
    
    // 如果没有参数，返回所有论题（用于测试页面）
    const allTheses = await thesisService.getAllTheses()
    
    return NextResponse.json({ theses: allTheses })
    
  } catch (error) {
    console.error('Error fetching thesis:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch thesis', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}