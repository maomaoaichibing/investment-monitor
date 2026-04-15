/**
 * GET /api/earnings/calendar
 * 获取持仓股票的财报日历（基于 Finnhub Earnings Calendar API）
 *
 * Query 参数:
 * - days?: number  - 向前/后查找的天数（默认 90，含历史）
 * - symbol?: string - 限定某只股票
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || ''

interface FinnhubEarningsItem {
  symbol: string
  date: string           // YYYY-MM-DD
  hour: string | null    // e.g. "before-open" | "after-close" | null
  eps: number | null
  epsEstimated: boolean
  revenue: number | null
  revenueEstimated: boolean
  period: string        // e.g. "2024Q4"
}

function periodLabel(period: string): { period: string; fiscalYear: number | null } {
  // period like "2024Q4"
  const match = period.match(/^(\d{4})Q(\d)$/)
  if (match) {
    return { period: `Q${match[2]}`, fiscalYear: parseInt(match[1]) }
  }
  return { period, fiscalYear: null }
}

function toMarket(symbol: string): string {
  if (/^\d{4,6}\.HK$/i.test(symbol)) return 'HK'
  if (/^(SH|SZ)\w/.test(symbol)) return 'A-share'
  return 'US'
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === -1) return '昨天'
  if (diff > 0) return `${diff}天后`
  return `${Math.abs(diff)}天前`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') || '90'), 365)
    const symbol = searchParams.get('symbol') || undefined

    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - Math.min(days, 30)) // 历史保留30天

    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from.toISOString().split('T')[0]}&to=${to.toISOString().split('T')[0]}&token=${FINNHUB_API_KEY}`

    let rawEarnings: FinnhubEarningsItem[] = []
    if (FINNHUB_API_KEY) {
      try {
        const resp = await fetch(url, { next: { revalidate: 3600 } })
        if (resp.ok) {
          rawEarnings = await resp.json()
        } else {
          console.warn(`[earnings/calendar] Finnhub returned ${resp.status}`)
        }
      } catch (e) {
        console.warn('[earnings/calendar] Finnhub fetch failed:', e)
      }
    }

    // 获取持仓列表
    const positions = await db.position.findMany({
      select: { symbol: true, assetName: true, market: true },
    })
    const tracked = symbol ? [positions.find(p => p.symbol === symbol)].filter(Boolean) : positions

    // 匹配持仓的财报事件
    const earningsData = rawEarnings
      .filter(e => tracked.some(p => {
        const s = p!.symbol.toUpperCase().replace(/\.HK$/i, '')
        return s === e.symbol.toUpperCase() || s === e.symbol.replace(/\.HK$/i, '').toUpperCase()
      }))
      .map(e => {
        const pos = tracked.find(p => {
          const s = p!.symbol.toUpperCase().replace(/\.HK$/i, '')
          return s === e.symbol.toUpperCase()
        })
        const { period: periodStr, fiscalYear } = periodLabel(e.period)
        const diff = Math.round((new Date(e.date + 'T12:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
        return {
          symbol: e.symbol,
          assetName: pos?.assetName ?? e.symbol,
          market: toMarket(e.symbol),
          period: periodStr,
          fiscalYear,
          earningsDate: e.date,
          earningsDateLabel: dayLabel(e.date),
          diffDays: diff,
          epsActual: e.eps ?? null,
          epsEstimate: e.epsEstimated ? null : null,
          revenueActual: e.revenue ?? null,
          revenueEstimate: e.revenueEstimated ? null : null,
          hour: e.hour,
          status: diff < 0 ? 'past' : diff === 0 ? 'today' : 'upcoming',
        }
      })
      .sort((a, b) => a.earningsDate.localeCompare(b.earningsDate))

    // 如 Finnhub 无数据（未配置 key），从 DB 中补充 Event.earnings 类型记录
    const dbEvents = await db.event.findMany({
      where: {
        eventType: 'earnings',
        eventTime: {
          gte: from,
          lte: to,
        },
        ...(symbol ? { symbol } : {}),
      },
      orderBy: { eventTime: 'asc' },
    })

    const dbEarnings = dbEvents.map(e => {
      const pos = positions.find(p => p.symbol === e.symbol)
      const meta = JSON.parse(e.metadataJson || '{}')
      const diff = Math.round((e.eventTime.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
      return {
        symbol: e.symbol,
        assetName: pos?.assetName ?? e.symbol,
        market: pos?.market ?? 'US',
        period: meta.period ?? 'Q?',
        fiscalYear: meta.fiscalYear ?? null,
        earningsDate: e.eventTime.toISOString().split('T')[0],
        earningsDateLabel: dayLabel(e.eventTime.toISOString().split('T')[0]),
        diffDays: diff,
        epsActual: meta.eps ?? null,
        epsEstimate: meta.epsEstimate ?? null,
        revenueActual: meta.revenue ?? null,
        revenueEstimate: meta.revenueEstimate ?? null,
        hour: null,
        status: diff < 0 ? 'past' : diff === 0 ? 'today' : 'upcoming',
      }
    })

    // 合并去重（优先 Finnhub 数据）
    const symbolSet = new Set(earningsData.map(e => e.symbol))
    const merged = [
      ...earningsData,
      ...dbEarnings.filter(e => !symbolSet.has(e.symbol)),
    ].sort((a, b) => a.earningsDate.localeCompare(b.earningsDate))

    // 分桶
    const upcoming = merged.filter(e => e.status === 'today' || e.diffDays > 0)
    const past = merged.filter(e => e.diffDays < 0).slice(-5)

    return NextResponse.json(
      {
        success: true,
        data: {
          upcoming,
          past,
          source: FINNHUB_API_KEY ? 'finnhub+db' : 'db',
          fetchedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[earnings/calendar] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch earnings calendar' },
      { status: 500 }
    )
  }
}
