import { NextRequest, NextResponse } from 'next/server'
import { alertService } from '@/server/services/alertService'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'read') {
      const alert = await alertService.updateAlertStatus(params.id, { status: 'read' })
      return NextResponse.json({ success: true, data: alert })
    } else if (action === 'dismiss') {
      const alert = await alertService.updateAlertStatus(params.id, { status: 'dismissed' })
      return NextResponse.json({ success: true, data: alert })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}