'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, RefreshCw, Loader2 } from 'lucide-react'

interface KLine {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface KLineChartProps {
  symbol: string
  name: string
  market: string
  count?: number
}

export function KLineChart({ symbol, name, market, count = 30 }: KLineChartProps) {
  const [klines, setKlines] = useState<KLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string>('')

  const fetchKLine = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/stock/history/${symbol}?market=${market}&count=${count}`)
      const data = await res.json()

      if (data.success && data.data) {
        setKlines(data.data.klines || [])
        setSource(data.source || '')
      } else {
        setError(data.error || '获取K线数据失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKLine()
    // 30分钟自动刷新
    const interval = setInterval(fetchKLine, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [symbol, market, count])

  // 计算统计数据
  const getStats = () => {
    if (klines.length < 2) return null

    const first = klines[0]
    const last = klines[klines.length - 1]
    const change = last.close - first.open
    const changePercent = first.open > 0 ? (change / first.open) * 100 : 0
    const high = Math.max(...klines.map(k => k.high))
    const low = Math.min(...klines.map(k => k.low))
    const avgVolume = klines.reduce((sum, k) => sum + k.volume, 0) / klines.length

    return { first, last, change, changePercent, high, low, avgVolume }
  }

  // 渲染简单K线图
  const renderChart = () => {
    if (klines.length === 0) return null

    const stats = getStats()
    if (!stats) return null

    const { high, low } = stats
    const range = high - low || 1
    const chartHeight = 200
    const chartWidth = 100 // 百分比
    const barWidth = Math.min(20, chartWidth / klines.length)

    return (
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-48"
          preserveAspectRatio="none"
        >
          {klines.map((k, i) => {
            const x = (i / klines.length) * chartWidth
            const openY = chartHeight - ((k.open - low) / range) * chartHeight
            const closeY = chartHeight - ((k.close - low) / range) * chartHeight
            const highY = chartHeight - ((k.high - low) / range) * chartHeight
            const lowY = chartHeight - ((k.low - low) / range) * chartHeight

            const isGreen = k.close >= k.open
            const color = isGreen ? '#22c55e' : '#ef4444'

            return (
              <g key={k.date}>
                {/* 影线 */}
                <line
                  x1={x + barWidth / 2}
                  y1={highY}
                  x2={x + barWidth / 2}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="0.3"
                />
                {/* 实体 */}
                <rect
                  x={x}
                  y={Math.min(openY, closeY)}
                  width={barWidth}
                  height={Math.max(Math.abs(closeY - openY), 0.5)}
                  fill={isGreen ? color : color}
                  opacity={0.8}
                />
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  if (loading && klines.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            K线走势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && klines.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            K线走势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-muted-foreground mb-2">{error}</p>
            <Badge variant="outline" className="text-xs">
              数据源: {source || '未知'}
            </Badge>
            <button
              onClick={fetchKLine}
              className="mt-2 text-primary hover:underline text-sm"
            >
              重试
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stats = getStats()

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            K线走势
          </CardTitle>
          <div className="flex items-center gap-2">
            {source && (
              <Badge variant="outline" className="text-xs">
                {source}
              </Badge>
            )}
            <button
              onClick={fetchKLine}
              className="p-1 hover:bg-accent rounded"
              title="刷新"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 统计概览 */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">最新价</div>
              <div className="font-semibold">¥{stats.last.close.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">涨跌</div>
              <div className={`font-semibold flex items-center justify-center gap-1 ${
                stats.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {stats.change >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">最高</div>
              <div className="font-semibold text-green-600">¥{stats.high.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">最低</div>
              <div className="font-semibold text-red-600">¥{stats.low.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* K线图 */}
        {renderChart()}

        {/* 日期范围 */}
        {klines.length > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{klines[0]?.date}</span>
            <span>近{klines.length}日</span>
            <span>{klines[klines.length - 1]?.date}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
