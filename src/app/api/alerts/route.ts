import { NextRequest, NextResponse } from 'next/server'
import { alertService } from '@/server/services/alertService'
import {
  createAlertRequestSchema,
  filterAlertsQuerySchema,
  CreateAlertResponse,
  GetAlertsResponse,
} from '@/lib/schemas/alertSchema'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 解析和验证查询参数
    const queryParams: any = {}
    if (searchParams.get('positionId')) queryParams.positionId = searchParams.get('positionId')
    if (searchParams.get('level')) queryParams.level = searchParams.get('level')
    if (searchParams.get('status')) queryParams.status = searchParams.get('status')
    if (searchParams.get('limit')) queryParams.limit = searchParams.get('limit')
    if (searchParams.get('offset')) queryParams.offset = searchParams.get('offset')

    const validatedQuery = filterAlertsQuerySchema.parse(queryParams)
    const { alerts, total } = await alertService.getAlerts(validatedQuery)

    const response: GetAlertsResponse = {
      success: true,
      data: {
        alerts,
        total,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching alerts:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          data: { alerts: [], total: 0 },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts',
        data: { alerts: [], total: 0 },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createAlertRequestSchema.parse(body)

    const alert = await alertService.createAlert(validatedData)

    const response: CreateAlertResponse = {
      success: true,
      data: {
        alert,
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating alert:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          data: { alert: null as any },
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          data: { alert: null as any },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create alert',
        data: { alert: null as any },
      },
      { status: 500 }
    )
  }
}
