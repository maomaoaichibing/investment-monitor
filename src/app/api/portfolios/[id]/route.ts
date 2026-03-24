import { NextRequest, NextResponse } from 'next/server'
import { portfolioService } from '@/server/services/portfolioService'
import { CreatePortfolioSchema } from '@/lib/schemas'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const portfolio = await portfolioService.getPortfolioDetail(params.id)
    return NextResponse.json(portfolio)
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    
    if (error instanceof Error && error.message === 'Portfolio not found') {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json()
    const validatedData = CreatePortfolioSchema.partial().parse(body)
    
    const portfolio = await portfolioService.updatePortfolio(params.id, validatedData)
    return NextResponse.json(portfolio)
  } catch (error) {
    console.error('Error updating portfolio:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update portfolio' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await portfolioService.deletePortfolio(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting portfolio:', error)
    
    if (error instanceof Error && error.message === 'Portfolio not found') {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete portfolio' },
      { status: 500 }
    )
  }
}