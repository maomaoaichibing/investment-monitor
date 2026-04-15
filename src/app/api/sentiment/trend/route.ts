/**
 * GET /api/sentiment/trend
 * 获取持仓股票的情感趋势数据（基于历史 Event 记录的日均情感分）
 *
 * Query 参数:
 * - symbol?: string - 股票代码（可选，不传则返回所有持仓）
 * - days?: number  - 统计天数（默认 90）
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol') || undefined
    const days = Math.min(parseInt(searchParams.get('days') || '90'), 365)

    const since = new Date()
    since.setDate(since.getDate() - days)

    // 获取所有持仓符号（用于无 symbol 参数时）
    const positions = await db.position.findMany({
      select: { symbol: true, assetName: true, market: true },
    })
    const trackedSymbols = symbol ? [symbol] : positions.map(p => p.symbol)

    // 批量查询每个 symbol 的情感数据
    const trendResults = await Promise.all(
      trackedSymbols.map(async (sym) => {
        const events = await db.event.findMany({
          where: {
            symbol: sym,
            createdAt: { gte: since },
          },
          select: {
            createdAt: true,
            metadataJson: true,
            title: true,
          },
          orderBy: { createdAt: 'asc' },
        })

        // 按日期聚合，计算每日平均情感分
        const dailyMap = new Map<string, { total: number; count: number }>()

        for (const event of events) {
          let meta: Record<string, unknown> | null = null
          try { meta = event.metadataJson ? JSON.parse(event.metadataJson) : null } catch { continue }
          if (!meta || meta.sentimentScore === undefined) continue

          const score = Number(meta.sentimentScore)
          if (isNaN(score)) continue

          const dateKey = event.createdAt.toISOString().split('T')[0]
          const existing = dailyMap.get(dateKey) ?? { total: 0, count: 0 }
          dailyMap.set(dateKey, {
            total: existing.total + score,
            count: existing.count + 1,
          })
        }

        const dataPoints = Array.from(dailyMap.entries())
          .map(([date, { total, count }]) => ({
            date,
            sentimentScore: parseFloat((total / count).toFixed(3)),
            newsCount: count,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        // 计算综合统计
        if (dataPoints.length === 0) {
          return {
            symbol: sym,
            assetName: positions.find(p => p.symbol === sym)?.assetName ?? sym,
            market: positions.find(p => p.symbol === sym)?.market ?? 'US',
            dataPoints: [],
            avgScore: null,
            trend: 'neutral' as const,
          }
        }

        const avgScore = parseFloat(
          (dataPoints.reduce((s, d) => s + d.sentimentScore, 0) / dataPoints.length).toFixed(3)
        )

        // 趋势判断：最近 7 天均值 vs 前 7 天均值
        const recent = dataPoints.slice(-7)
        const older = dataPoints.slice(-14, -7)
        let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral'
        if (recent.length > 0 && older.length > 0) {
          const recentAvg = recent.reduce((s, d) => s + d.sentimentScore, 0) / recent.length
          const olderAvg = older.reduce((s, d) => s + d.sentimentScore, 0) / older.length
          if (recentAvg - olderAvg > 0.15) trend = 'bullish'
          else if (olderAvg - recentAvg > 0.15) trend = 'bearish'
        } else if (recent.length > 1) {
          const first = recent[0].sentimentScore
          const last = recent[recent.length - 1].sentimentScore
          if (last - first > 0.3) trend = 'bullish'
          else if (first - last > 0.3) trend = 'bearish'
        }

        return {
          symbol: sym,
          assetName: positions.find(p => p.symbol === sym)?.assetName ?? sym,
          market: positions.find(p => p.symbol === sym)?.market ?? 'US',
          dataPoints,
          avgScore,
          trend,
        }
      })
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          trends: trendResults,
          fetchedAt: new Date().toISOString(),
          days,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[sentiment/trend] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sentiment trend' },
      { status: 500 }
    )
  }
}
