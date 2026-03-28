import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/theses - 获取所有论题
export async function GET() {
  try {
    const theses = await db.thesis.findMany({
      include: {
        position: {
          select: {
            id: true,
            symbol: true,
            assetName: true,
            market: true
          }
        },
        portfolio: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            monitorPlans: true,
            eventAnalyses: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        theses,
        total: theses.length
      }
    })
  } catch (error) {
    console.error('Error fetching theses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch theses' },
      { status: 500 }
    )
  }
}