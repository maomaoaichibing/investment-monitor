import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/data-integration/stats
 * 获取数据集成统计信息
 */
export async function GET() {
  try {
    // 这里简化处理，实际应该从各个数据表统计
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 模拟统计数据
    const stats = {
      news: {
        total: 1250,
        today: 45
      },
      announcements: {
        total: 380,
        today: 12
      },
      socialMedia: {
        total: 2150,
        today: 89
      },
      industryData: {
        total: 150,
        lastUpdate: new Date().toISOString()
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('获取数据集成统计失败:', error)
    return NextResponse.json(
      {
        error: '获取统计信息失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}