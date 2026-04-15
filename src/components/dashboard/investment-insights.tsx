'use client'

import { useState, useEffect } from 'react'
import { SentimentTrendChart } from '@/components/charts/sentiment-trend-chart'
import { EarningsCalendar } from '@/components/earnings/earnings-calendar'
import type { SentimentTrendData } from '@/components/charts/sentiment-trend-chart'
import type { EarningsItem } from '@/components/earnings/earnings-calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart2, Calendar } from 'lucide-react'

export default function InvestmentInsights() {
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrendData[]>([])
  const [earningsUpcoming, setEarningsUpcoming] = useState<EarningsItem[]>([])
  const [earningsPast, setEarningsPast] = useState<EarningsItem[]>([])
  const [loadingSentiment, setLoadingSentiment] = useState(true)
  const [loadingEarnings, setLoadingEarnings] = useState(true)

  useEffect(() => {
    fetch('/api/sentiment/trend?days=90')
      .then(r => r.json())
      .then(d => { if (d.success) setSentimentTrends(d.data.trends) })
      .catch(() => {})
      .finally(() => setLoadingSentiment(false))
  }, [])

  useEffect(() => {
    fetch('/api/earnings/calendar?days=90')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setEarningsUpcoming(d.data.upcoming)
          setEarningsPast(d.data.past)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEarnings(false))
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-blue-400" />
        <h2 className="text-base font-semibold text-white">舆情与财报</h2>
        <span className="text-xs text-zinc-500">Sentiment & Earnings</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* 情感趋势图 — 左侧，占3列 */}
        <div className="lg:col-span-3 space-y-3">
          {loadingSentiment ? (
            <div className="space-y-2">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : sentimentTrends.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-zinc-500 text-sm">
                近90天暂无情感数据
              </CardContent>
            </Card>
          ) : (
            sentimentTrends.slice(0, 3).map(trend => (
              <SentimentTrendChart key={trend.symbol} data={trend} height={160} />
            ))
          )}
        </div>

        {/* 财报日历 — 右侧，占2列 */}
        <div className="lg:col-span-2">
          {loadingEarnings ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <EarningsCalendar upcoming={earningsUpcoming} past={earningsPast} />
          )}
        </div>
      </div>
    </div>
  )
}
