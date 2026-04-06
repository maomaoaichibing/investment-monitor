'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DataPoint {
  date: string
  portfolio: number
  benchmark?: number
}

interface ReturnCurveChartProps {
  data: DataPoint[]
  title?: string
  description?: string
  showBenchmark?: boolean
  benchmarkName?: string
  portfolioName?: string
}

export function ReturnCurveChart({
  data,
  title = '收益曲线',
  description = '组合收益 vs 基准对比',
  showBenchmark = true,
  benchmarkName = '沪深300',
  portfolioName = '组合收益',
}: ReturnCurveChartProps) {
  // 计算最大最小值用于Y轴范围
  const allValues = data.flatMap(d => [d.portfolio, d.benchmark].filter(Boolean) as number[])
  const minValue = Math.min(...allValues)
  const maxValue = Math.max(...allValues)
  const padding = (maxValue - minValue) * 0.1

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name}: {item.value >= 0 ? '+' : ''}{item.value.toFixed(2)}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
                interval="preserveStartEnd"
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
                domain={[minValue - padding, maxValue + padding]}
                tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
              {minValue < 0 && (
                <ReferenceLine
                  y={0}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-muted-foreground"
                />
              )}
              <Line
                type="monotone"
                dataKey="portfolio"
                name={portfolioName}
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3B82F6' }}
              />
              {showBenchmark && (
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name={benchmarkName}
                  stroke="#94A3B8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4, fill: '#94A3B8' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500 rounded" />
            <span>{portfolioName}</span>
          </div>
          {showBenchmark && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-gray-400 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #94A3B8 2px, #94A3B8 4px)' }} />
              <span>{benchmarkName}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface HealthScoreChartProps {
  data: Array<{
    date: string
    healthScore: number
    thesisId?: string
    thesisTitle?: string
  }>
  title?: string
  description?: string
}

export function HealthScoreChart({
  data,
  title = '健康度趋势',
  description = '论题健康度变化跟踪',
}: HealthScoreChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium mb-1">{label}</p>
          <p className="text-sm text-blue-600">
            健康度: {item.healthScore}分
          </p>
          {item.thesisTitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {item.thesisTitle}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // 根据分数返回颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981' // 绿色
    if (score >= 60) return '#F59E0B' // 黄色
    return '#EF4444' // 红色
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
                interval="preserveStartEnd"
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickLine={{ stroke: 'currentColor' }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}分`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={() => <span className="text-sm text-foreground">健康度</span>}
              />
              <ReferenceLine y={80} stroke="#10B981" strokeDasharray="3 3" />
              <ReferenceLine y={60} stroke="#F59E0B" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="healthScore"
                name="健康度"
                stroke={getScoreColor(data[data.length - 1]?.healthScore || 80)}
                strokeWidth={2}
                dot={{ fill: getScoreColor(data[data.length - 1]?.healthScore || 80), strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">优秀 (≥80分)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">良好 (60-79分)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">关注 (&lt;60分)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
