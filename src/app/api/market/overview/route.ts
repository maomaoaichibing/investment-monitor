/**
 * GET /api/market/overview
 * 获取A股、港股、美股主要指数
 */

import { NextResponse } from 'next/server'
import { getMarketOverview } from '@/server/services/marketOverview'

export async function GET() {
  try {
    const result = await getMarketOverview()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
