import { NextRequest, NextResponse } from 'next/server'
import { portfolioService } from '@/server/services/portfolioService'
import { CreatePortfolioSchema } from '@/lib/schemas'

export async function GET() {
  try {
    const portfolios = await portfolioService.getPortfolioList()
    return NextResponse.json(portfolios)
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolios' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreatePortfolioSchema.parse(body)
    
    const portfolio = await portfolioService.createPortfolio(validatedData)
    return NextResponse.json(portfolio, { status: 201 })
  } catch (error) {
    console.error('Error creating portfolio:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create portfolio' },
      { status: 500 }
    )
  }
}