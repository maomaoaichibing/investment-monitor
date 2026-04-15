'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export interface SentimentDataPoint {
  date: string
  sentimentScore: number
  newsCount?: number
}

export interface SentimentTrendData {
  symbol: string
  assetName: string
  market: string
  dataPoints: SentimentDataPoint[]
  avgScore: number | null
  trend: 'bullish' | 'bearish' | 'neutral'
}

interface Props {
  data: SentimentTrendData
  height?: number
}

function getScoreColor(score: number): string {
  if (score >= 0.3) return '#ef4444'   // 红色（看多，中国市场惯例）
  if (score <= -0.3) return '#22c55e'  // 绿色（看空）
  return '#f59e0b'                      // 黄色（中性）
}

function getScoreLabel(score: number): string {
  if (score >= 0.5) return '强烈看多'
  if (score >= 0.3) return '看多'
  if (score >= -0.3 && score < 0.3) return '中性'
  if (score > -0.5) return '看空'
  return '强烈看空'
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: SentimentDataPoint }>; label?: string }) {
  if (!active || !payload?.length) return null
  const score = payload[0].value
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-white font-semibold">情感分: {score.toFixed(3)}</p>
      <p style={{ color: getScoreColor(score) }}>{getScoreLabel(score)}</p>
      {payload[0].payload.newsCount !== undefined && (
        <p className="text-zinc-500 mt-1">新闻数: {payload[0].payload.newsCount}</p>
      )}
    </div>
  )
}

export function SentimentTrendChart({ data, height = 200 }: Props) {
  const { dataPoints, symbol, assetName, trend, avgScore } = data

  if (!dataPoints.length) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>{assetName} ({symbol})</span>
            <span className="text-xs text-zinc-500">暂无情感数据</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center text-zinc-500 text-sm" style={{ height }}>
            近90天内无新闻数据
          </div>
        </CardContent>
      </Card>
    )
  }

  const trendLabel = trend === 'bullish' ? '📈 看多' : trend === 'bearish' ? '📉 看空' : '➡️ 中性'
  const trendColor = trend === 'bullish' ? 'text-red-500' : trend === 'bearish' ? 'text-green-500' : 'text-yellow-500'

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              {assetName} ({symbol})
            </CardTitle>
            <CardDescription className="text-xs">
              近{dataPoints.length} 天情感趋势
            </CardDescription>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold ${trendColor}`}>{trendLabel}</p>
            {avgScore !== null && (
              <p className="text-xs text-zinc-400">
                均值 <span style={{ color: getScoreColor(avgScore) }}>{avgScore.toFixed(3)}</span>
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={dataPoints} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={(v) => {
                const d = new Date(v)
                return `${d.getMonth() + 1}/${d.getDate()}`
              }}
            />
            <YAxis
              domain={[-1, 1]}
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="3 3" />
            <ReferenceLine y={0.3} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={-0.3} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.4} />
            <Area
              type="monotone"
              dataKey="sentimentScore"
              fill="url(#sentimentGradient)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="sentimentScore"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#f59e0b' }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* 图例说明 */}
        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            &gt;0.3 看多
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
            -0.3~0.3 中性
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            &lt;-0.3 看空
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
