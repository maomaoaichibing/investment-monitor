import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { llmService } from '@/server/llm/llmService'

// 禁用缓存，每次请求实时生成
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const todayStr = new Date().toISOString().split('T')[0]
  try {
    // 获取所有持仓及其 Thesis
    const positions = await db.position.findMany({
      include: {
        thesis: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    // 构建持仓列表 JSON
    const portfoliosJson = JSON.stringify(
      positions.map((p) => {
        const thesis = p.thesis[0]
        let pillars = []
        try {
          pillars = thesis?.pillarsJson ? JSON.parse(thesis.pillarsJson) : []
        } catch {}

        return {
          stock_code: p.symbol,
          stock_name: p.assetName,
          direction: 'long',
          thesis_summary: thesis?.summary || '',
          health_score: thesis?.healthScore || 80,
          pillars,
        }
      }),
      null,
      2
    )

    // 获取今日的数据变化（从 Alert 获取）
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const recentAlerts = await db.alert.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
      include: {
        position: true,
        event: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // 构建今日数据变化 JSON
    const todayDataChangesJson = JSON.stringify(
      recentAlerts.map((a) => ({
        stock_code: a.position?.symbol || '',
        indicator: a.event?.eventType || 'general',
        change: a.summary,
        related_pillar: 'general',
      })),
      null,
      2
    )

    // 调用 LLM 生成每日摘要（传入今日日期确保日期正确）
    console.log('[DailySummary] Generating daily summary for', todayStr)
    const summary = await llmService.generateDailySummary({
      portfoliosJson,
      todayDataChangesJson,
      date: todayStr,
    })

    return NextResponse.json({
      success: true,
      data: summary,
    })
  } catch (error) {
    console.error('[DailySummary] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '生成每日摘要失败',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
