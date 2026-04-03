'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

type Period = 'daily' | 'weekly' | 'monthly'
type PeriodLabel = { label: string; value: Period }

const PERIODS: PeriodLabel[] = [
  { label: '日K', value: 'daily' },
  { label: '周K', value: 'weekly' },
  { label: '月K', value: 'monthly' },
]

export function KLineChart({ symbol, name, market, count = 30 }: KLineChartProps) {
  const [klines, setKlines] = useState<KLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string>('')
  const [period, setPeriod] = useState<Period>('daily')
  const [hoveredKline, setHoveredKline] = useState<KLine | null>(null)
  const [mouseX, setMouseX] = useState<number>(0)
  const chartRef = useRef<HTMLDivElement>(null)

  const fetchKLine = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // period参数暂时只用count控制，API支持period扩展
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
  }, [symbol, market, count])

  useEffect(() => {
    fetchKLine()
    // 30分钟自动刷新
    const interval = setInterval(fetchKLine, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchKLine])

  // 计算MA均线
  const calculateMA = (period: number, data: KLine[]): (number | null)[] => {
    return data.map((_, index) => {
      if (index < period - 1) return null
      const sum = data.slice(index - period + 1, index + 1).reduce((acc, k) => acc + k.close, 0)
      return sum / period
    })
  }

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

  // 渲染K线图
  const renderChart = () => {
    if (klines.length === 0) return null

    const stats = getStats()
    if (!stats) return null

    const { high, low, avgVolume } = stats
    const range = high - low || 1
    const chartHeight = 180
    const chartWidth = 100
    const barWidth = Math.min(18, (chartWidth / klines.length) * 0.8)

    const ma5 = calculateMA(5, klines)
    const ma10 = calculateMA(10, klines)
    const ma20 = calculateMA(20, klines)

    const maxVolume = Math.max(...klines.map(k => k.volume), avgVolume * 2)
    const volumeHeight = 50
    const volumePadding = chartHeight + 10

    return (
      <div ref={chartRef} className="relative">
        {/* Tooltip */}
        {hoveredKline && (
          <div
            className="absolute z-10 bg-background/95 border rounded-lg shadow-lg p-2 text-xs pointer-events-none"
            style={{
              left: `${mouseX}%`,
              top: '10px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold mb-1">{hoveredKline.date}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-muted-foreground">开:</span>
              <span>¥{hoveredKline.open.toFixed(2)}</span>
              <span className="text-muted-foreground">高:</span>
              <span className="text-green-600">¥{hoveredKline.high.toFixed(2)}</span>
              <span className="text-muted-foreground">低:</span>
              <span className="text-red-600">¥{hoveredKline.low.toFixed(2)}</span>
              <span className="text-muted-foreground">收:</span>
              <span>¥{hoveredKline.close.toFixed(2)}</span>
              <span className="text-muted-foreground">量:</span>
              <span>{(hoveredKline.volume / 10000).toFixed(0)}万</span>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + volumeHeight + 20}`}
          className="w-full h-56"
          preserveAspectRatio="none"
        >
          {/* MA5 均线 */}
          <path
            d={ma5
              .map((ma, i) => {
                if (ma === null) return ''
                const x = (i / klines.length) * chartWidth + barWidth / 2
                const y = chartHeight - ((ma - low) / range) * chartHeight
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
              })
              .filter(Boolean)
              .join(' ')}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="0.4"
            opacity="0.8"
          />

          {/* MA10 均线 */}
          <path
            d={ma10
              .map((ma, i) => {
                if (ma === null) return ''
                const x = (i / klines.length) * chartWidth + barWidth / 2
                const y = chartHeight - ((ma - low) / range) * chartHeight
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
              })
              .filter(Boolean)
              .join(' ')}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="0.4"
            opacity="0.8"
          />

          {/* MA20 均线 */}
          <path
            d={ma20
              .map((ma, i) => {
                if (ma === null) return ''
                const x = (i / klines.length) * chartWidth + barWidth / 2
                const y = chartHeight - ((ma - low) / range) * chartHeight
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
              })
              .filter(Boolean)
              .join(' ')}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="0.4"
            opacity="0.8"
          />

          {/* K线蜡烛 */}
          {klines.map((k, i) => {
            const x = (i / klines.length) * chartWidth
            const openY = chartHeight - ((k.open - low) / range) * chartHeight
            const closeY = chartHeight - ((k.close - low) / range) * chartHeight
            const highY = chartHeight - ((k.high - low) / range) * chartHeight
            const lowY = chartHeight - ((k.low - low) / range) * chartHeight

            const isGreen = k.close >= k.open
            const color = isGreen ? '#22c55e' : '#ef4444'

            return (
              <g
                key={k.date}
                onMouseEnter={(e) => {
                  setHoveredKline(k)
                  setMouseX((i / klines.length) * 100)
                }}
                onMouseLeave={() => setHoveredKline(null)}
                className="cursor-crosshair"
              >
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
                  fill={color}
                  opacity={hoveredKline?.date === k.date ? 1 : 0.8}
                />
              </g>
            )
          })}

          {/* 成交量柱状图 */}
          {klines.map((k, i) => {
            const x = (i / klines.length) * chartWidth
            const barH = (k.volume / maxVolume) * volumeHeight
            const y = chartHeight + volumePadding - barH
            const isGreen = k.close >= k.open
            const color = isGreen ? '#22c55e' : '#ef4444'

            return (
              <rect
                key={`vol-${k.date}`}
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={color}
                opacity={0.5}
              />
            )
          })}

          {/* 成交量均线 */}
          <line
            x1="0"
            y1={chartHeight + volumePadding - (avgVolume / maxVolume) * volumeHeight}
            x2={chartWidth}
            y2={chartHeight + volumePadding - (avgVolume / maxVolume) * volumeHeight}
            stroke="#666"
            strokeWidth="0.2"
            strokeDasharray="1,1"
          />
        </svg>

        {/* MA图例 */}
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-amber-500 rounded" />
            <span className="text-muted-foreground">MA5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-violet-500 rounded" />
            <span className="text-muted-foreground">MA10</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-cyan-500 rounded" />
            <span className="text-muted-foreground">MA20</span>
          </div>
        </div>
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
          <div className="flex items-center justify-center h-56">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            K线走势
            <span className="text-muted-foreground font-normal ml-2">
              {klines.length > 0 ? `${klines[0]?.date} ~ ${klines[klines.length - 1]?.date}` : ''}
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* 时间周期选择 */}
            <div className="flex bg-muted rounded-lg p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    period === p.value
                      ? 'bg-background shadow-sm font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {source && (
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                {source}
              </Badge>
            )}
            <button
              onClick={fetchKLine}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="刷新"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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

        {/* 成交量标签 */}
        {klines.length > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>成交量</span>
            <span>均量: {(stats?.avgVolume || 0 / 10000).toFixed(0)}万</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
