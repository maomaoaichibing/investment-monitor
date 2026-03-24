import { NextRequest, NextResponse } from 'next/server'
import { positionService } from '@/server/services/positionService'
import { CreatePositionSchema } from '@/lib/schemas'

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
    const position = await positionService.getPositionDetail(params.id)
    return NextResponse.json(position)
  } catch (error) {
    console.error('Error fetching position:', error)
    
    if (error instanceof Error && error.message === 'Position not found') {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch position' },
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
    const validatedData = CreatePositionSchema.partial().parse(body)
    
    const position = await positionService.updatePosition(params.id, validatedData)
    return NextResponse.json(position)
  } catch (error) {
    console.error('Error updating position:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message === 'Position not found') {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update position' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await positionService.deletePosition(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting position:', error)
    
    if (error instanceof Error && error.message === 'Position not found') {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete position' },
      { status: 500 }
    )
  }
}