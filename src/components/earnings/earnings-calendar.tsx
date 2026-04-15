'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calendar, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react'

export interface EarningsItem {
  symbol: string
  assetName: string
  market: string
  period: string
  fiscalYear: number | null
  earningsDate: string
  earningsDateLabel: string
  diffDays: number
  epsActual: number | null
  epsEstimate: number | null
  revenueActual: number | null
  revenueEstimate: number | null
  hour: string | null
  status: 'past' | 'today' | 'upcoming'
}

interface Props {
  upcoming: EarningsItem[]
  past: EarningsItem[]
}

function MarketBadge({ market }: { market: string }) {
  const colors: Record<string, string> = {
    US: 'bg-blue-900 text-blue-300 border-blue-700',
    HK: 'bg-orange-900 text-orange-300 border-orange-700',
    'A-share': 'bg-red-900 text-red-300 border-red-700',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${colors[market] ?? 'bg-zinc-800 text-zinc-300 border-zinc-600'}`}>
      {market}
    </span>
  )
}

function TrendIcon({ status }: { status: 'past' | 'today' | 'upcoming' }) {
  if (status === 'today') return <Calendar className="w-4 h-4 text-yellow-400" />
  if (status === 'upcoming') return <ChevronRight className="w-4 h-4 text-zinc-500" />
  return null
}

function EarningsRow({ item }: { item: EarningsItem }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`border-b border-zinc-800 last:border-0 py-2.5 px-1 hover:bg-zinc-800/40 rounded transition-colors cursor-pointer ${item.status === 'today' ? 'bg-yellow-900/10' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <TrendIcon status={item.status} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm text-white truncate">{item.assetName}</span>
              <span className="text-xs text-zinc-500">{item.symbol}</span>
              <MarketBadge market={item.market} />
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              {item.fiscalYear ? `${item.fiscalYear}年` : ''}{item.period}
              {item.hour && <span className="ml-1 text-zinc-600">· {item.hour}</span>}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className={`text-sm font-medium ${item.status === 'today' ? 'text-yellow-400' : item.status === 'upcoming' ? 'text-zinc-300' : 'text-zinc-500'}`}>
            {item.earningsDateLabel}
          </div>
          <div className="text-xs text-zinc-600">{item.earningsDate}</div>
        </div>
      </div>

      {expanded && (item.epsActual !== null || item.epsEstimate !== null || item.revenueActual !== null || item.revenueEstimate !== null) && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {item.epsActual !== null && (
            <div className="bg-zinc-800 rounded px-2 py-1">
              <span className="text-zinc-500">EPS实际</span>
              <span className="ml-2 text-white font-medium">${item.epsActual.toFixed(2)}</span>
            </div>
          )}
          {item.epsEstimate !== null && (
            <div className="bg-zinc-800 rounded px-2 py-1">
              <span className="text-zinc-500">EPS预期</span>
              <span className="ml-2 text-zinc-300">${item.epsEstimate.toFixed(2)}</span>
            </div>
          )}
          {item.revenueActual !== null && (
            <div className="bg-zinc-800 rounded px-2 py-1">
              <span className="text-zinc-500">营收实际</span>
              <span className="ml-2 text-white font-medium">${(item.revenueActual / 1e9).toFixed(1)}B</span>
            </div>
          )}
          {item.revenueEstimate !== null && (
            <div className="bg-zinc-800 rounded px-2 py-1">
              <span className="text-zinc-500">营收预期</span>
              <span className="ml-2 text-zinc-300">${(item.revenueEstimate / 1e9).toFixed(1)}B</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EarningsCalendar({ upcoming, past }: Props) {
  const hasData = upcoming.length > 0 || past.length > 0

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-yellow-500" />
              财报日历
            </CardTitle>
            <CardDescription className="text-xs">
              {upcoming.length > 0 ? `近 ${upcoming.length} 个待公布` : '近期财报'}
            </CardDescription>
          </div>
          {upcoming.filter(e => e.status === 'today').length > 0 && (
            <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-700">
              今天发布！
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-6 text-zinc-500 text-sm gap-1">
            <Calendar className="w-8 h-8 text-zinc-700 mb-1" />
            <span>暂无财报数据</span>
            <span className="text-xs">持仓股票财报日历将在此显示</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 即将公布 */}
            {upcoming.length > 0 && (
              <div>
                {upcoming.filter(e => e.status === 'today').length > 0 && (
                  <p className="text-xs font-semibold text-yellow-500 mb-1.5 uppercase tracking-wide">⏰ 今天</p>
                )}
                {upcoming.filter(e => e.status === 'upcoming').length > 0 && (
                  <p className="text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">📅 即将公布</p>
                )}
                <div>
                  {upcoming
                    .sort((a, b) => a.diffDays - b.diffDays)
                    .map((item, idx) => (
                      <EarningsRow key={`${item.symbol}-${item.earningsDate}-${idx}`} item={item} />
                    ))}
                </div>
              </div>
            )}

            {/* 历史公布 */}
            {past.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wide">✅ 历史公布</p>
                <div>
                  {past.map((item, idx) => (
                    <EarningsRow key={`past-${item.symbol}-${item.earningsDate}-${idx}`} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
