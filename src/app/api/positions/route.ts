import { NextRequest, NextResponse } from 'next/server'
import { positionService } from '@/server/services/positionService'
import { CreatePositionSchema } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const portfolioId = searchParams.get('portfolioId')

    // 如果有portfolioId，获取该组合的所有持仓
    if (portfolioId) {
      const positions = await positionService.getPositionsByPortfolio(portfolioId)
      return NextResponse.json(positions)
    }

    // 否则获取所有持仓（带thesis）
    const positions = await positionService.getPositionsWithThesis()
    return NextResponse.json(positions)
  } catch (error) {
    console.error('Error fetching positions:', error)
    
    if (error instanceof Error && error.message === 'Portfolio not found') {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreatePositionSchema.parse(body)
    
    const position = await positionService.createPosition(validatedData)
    return NextResponse.json(position, { status: 201 })
  } catch (error) {
    console.error('Error creating position:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message === 'Portfolio not found') {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create position' },
      { status: 500 }
    )
  }
}