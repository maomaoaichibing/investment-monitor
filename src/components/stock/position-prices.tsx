'use client'

import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  open: number
  prevClose: number
  high: number
  low: number
  volume: number
  amount: number
  market: string
  updateTime: string
}

interface PositionPrice {
  symbol: string
  name: string
  market: string
  quantity: number
  costPrice: number
  positionWeight: number
}

interface PositionPricesProps {
  positions: PositionPrice[]
  autoRefresh?: boolean
  refreshInterval?: number
}

export function PositionPrices({
  positions,
  autoRefresh = true,
  refreshInterval = 60
}: PositionPricesProps) {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllQuotes = useCallback(async () => {
    if (positions.length === 0) return

    try {
      setError(null)
      setLoading(true)
      const symbols = positions.map(p => p.symbol).join(',')
      const markets = positions.map(p => p.market).join(',')

      const response = await fetch(`/api/stock/quote?symbols=${symbols}&markets=${markets}`)
      const data = await response.json()

      if (data.success && data.data?.quotes) {
        setQuotes(data.data.quotes)
      } else {
        setError(data.error || '获取失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败')
    } finally {
      setLoading(false)
    }
  }, [positions])

  useEffect(() => {
    fetchAllQuotes()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchAllQuotes, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [fetchAllQuotes, autoRefresh, refreshInterval])

  // 计算盈亏
  const calculatePnL = (position: PositionPrice, quote?: StockQuote) => {
    if (!quote) return { pnl: 0, pnlPercent: 0 }
    const pnl = (quote.price - position.costPrice) * position.quantity
    const pnlPercent = position.costPrice > 0 ? ((quote.price - position.costPrice) / position.costPrice) * 100 : 0
    return { pnl, pnlPercent }
  }

  // 格式化数字
  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals)
  }

  // 格式化盈亏金额
  const formatPnL = (pnl: number) => {
    const prefix = pnl > 0 ? '+' : ''
    return prefix + '¥' + Math.abs(pnl).toFixed(2)
  }

  // 涨跌幅颜色（中国市场：红涨绿跌）
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-500'
    if (change < 0) return 'text-green-500'
    return 'text-gray-500'
  }

  // 持仓样式映射
  const holdingStyleLabels: Record<string, string> = {
    short_term: '短期',
    swing: '波段',
    long_term: '长期'
  }

  if (loading && Object.keys(quotes).length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">实时行情</CardTitle>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {positions.map((p, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && Object.keys(quotes).length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">实时行情</CardTitle>
          <button
            onClick={fetchAllQuotes}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <RefreshCw className="h-4 w-4" />
            重试
          </button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            加载失败: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">实时行情</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {loading ? '更新中...' : `更新时间: ${new Date().toLocaleTimeString()}`}
          </span>
          <button
            onClick={fetchAllQuotes}
            className="p-1 hover:bg-accent rounded"
            title="刷新"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            暂无持仓
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((position) => {
              const quote = quotes[position.symbol]
              const { pnl, pnlPercent } = calculatePnL(position, quote)

              return (
                <div
                  key={position.symbol}
                  className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                >
                  {/* 左侧：股票信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{position.symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {position.name}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                        {holdingStyleLabels[position.market] || position.market}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>成本: ¥{position.costPrice}</span>
                      <span>持仓: {position.quantity}</span>
                      <span>权重: {position.positionWeight}%</span>
                    </div>
                  </div>

                  {/* 右侧：实时价格 */}
                  <div className="text-right">
                    {quote ? (
                      <>
                        <div className="text-xl font-bold">
                          ¥{formatNumber(quote.price)}
                        </div>
                        <div className={`flex items-center justify-end gap-1 text-sm ${getChangeColor(quote.change)}`}>
                          {quote.change > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : quote.change < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                          <span>
                            {quote.change > 0 ? '+' : ''}{formatNumber(quote.change)}
                          </span>
                          <span className="text-xs">
                            ({quote.change > 0 ? '+' : ''}{formatNumber(quote.changePercent)}%)
                          </span>
                        </div>
                        {/* 盈亏 */}
                        <div className={`text-sm mt-1 ${pnl >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {formatPnL(pnl)} ({pnlPercent >= 0 ? '+' : ''}{formatNumber(pnlPercent)}%)
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">--</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PositionPrices
