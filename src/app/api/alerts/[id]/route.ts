import { NextRequest, NextResponse } from 'next/server'
import { alertService } from '@/server/services/alertService'
import {
  updateAlertRequestSchema,
  updateAlertStatusRequestSchema,
  GetAlertResponse,
  UpdateAlertResponse,
  DeleteAlertResponse,
} from '@/lib/schemas/alertSchema'

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
    const alert = await alertService.getAlert(params.id)

    if (!alert) {
      const response: GetAlertResponse = {
        success: false,
        error: 'Alert不存在',
        data: { alert: null },
      }
      return NextResponse.json(response, { status: 404 })
    }

    const response: GetAlertResponse = {
      success: true,
      data: {
        alert,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching alert:', error)

    const response: GetAlertResponse = {
      success: false,
      error: '获取Alert失败',
      data: { alert: null },
    }

    return NextResponse.json(response, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json()
    const validatedData = updateAlertRequestSchema.parse(body)

    const alert = await alertService.updateAlert(params.id, validatedData)

    const response: UpdateAlertResponse = {
      success: true,
      data: {
        alert,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating alert:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      const response: UpdateAlertResponse = {
        success: false,
        error: 'Invalid input data',
        data: { alert: null as any },
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (error instanceof Error && error.message === 'Alert不存在') {
      const response: UpdateAlertResponse = {
        success: false,
        error: 'Alert不存在',
        data: { alert: null as any },
      }
      return NextResponse.json(response, { status: 404 })
    }

    const response: UpdateAlertResponse = {
      success: false,
      error: '更新Alert失败',
      data: { alert: null as any },
    }

    return NextResponse.json(response, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await alertService.deleteAlert(params.id)

    const response: DeleteAlertResponse = {
      success: true,
      data: {
        deleted: true,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting alert:', error)

    if (error instanceof Error && error.message === 'Alert不存在') {
      const response: DeleteAlertResponse = {
        success: false,
        error: 'Alert不存在',
        data: { deleted: false },
      }
      return NextResponse.json(response, { status: 404 })
    }

    const response: DeleteAlertResponse = {
      success: false,
      error: '删除Alert失败',
      data: { deleted: false },
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// PATCH endpoint for status updates
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json()
    const validatedData = updateAlertStatusRequestSchema.parse(body)

    const alert = await alertService.updateAlertStatus(params.id, validatedData)

    const response: UpdateAlertResponse = {
      success: true,
      data: {
        alert,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating alert status:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      const response: UpdateAlertResponse = {
        success: false,
        error: 'Invalid input data',
        data: { alert: null as any },
      }
      return NextResponse.json(response, { status: 400 })
    }

    if (error instanceof Error && error.message === 'Alert不存在') {
      const response: UpdateAlertResponse = {
        success: false,
        error: 'Alert不存在',
        data: { alert: null as any },
      }
      return NextResponse.json(response, { status: 404 })
    }

    const response: UpdateAlertResponse = {
      success: false,
      error: '更新Alert状态失败',
      data: { alert: null as any },
    }

    return NextResponse.json(response, { status: 500 })
  }
}
