'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
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

interface PositionPriceCardProps {
  symbol: string
  name: string
  market: string
  quantity: number
  costPrice: number
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function PositionPriceCard({
  symbol,
  name,
  market,
  quantity,
  costPrice,
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 60
}: PositionPriceCardProps) {
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuote()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchQuote, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [symbol, market, autoRefresh, refreshInterval])

  const fetchQuote = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/stock/quote?symbol=${symbol}&market=${market}`)
      const data = await response.json()

      if (data.success && data.data) {
        setQuote(data.data)
      } else {
        setError(data.error || '获取失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败')
    } finally {
      setLoading(false)
    }
  }

  // 计算盈亏
  const calculatePnL = () => {
    if (!quote) return { pnl: 0, pnlPercent: 0 }
    const pnl = (quote.price - costPrice) * quantity
    const pnlPercent = costPrice > 0 ? ((quote.price - costPrice) / costPrice) * 100 : 0
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

  // 格式化成交量
  const formatVolume = (vol: number) => {
    if (vol >= 100000000) {
      return (vol / 100000000).toFixed(2) + '亿'
    } else if (vol >= 10000) {
      return (vol / 10000).toFixed(2) + '万'
    }
    return vol.toLocaleString()
  }

  // 涨跌幅颜色（中国市场：红涨绿跌）
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-500'
    if (change < 0) return 'text-green-500'
    return 'text-gray-500'
  }

  // 盈亏颜色
  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-red-500'
    if (pnl < 0) return 'text-green-500'
    return 'text-gray-500'
  }

  // 市场标签
  const marketLabels: Record<string, string> = {
    A: 'A股',
    HK: '港股',
    US: '美股'
  }

  if (loading && !quote) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">加载行情中...</span>
        </CardContent>
      </Card>
    )
  }

  if (error && !quote) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={fetchQuote}
            className="p-1 hover:bg-accent rounded"
            title="重试"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </CardContent>
      </Card>
    )
  }

  const { pnl, pnlPercent } = calculatePnL()

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{name}</CardTitle>
            <span className="text-sm text-muted-foreground">{symbol}</span>
            <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
              {marketLabels[market] || market}
            </span>
          </div>
          <button
            onClick={fetchQuote}
            className="p-1 hover:bg-accent rounded"
            title="刷新"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {quote ? (
          <div className="space-y-4">
            {/* 价格和涨跌幅 */}
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">
                  ¥{formatNumber(quote.price)}
                </span>
                <div className={`flex items-center gap-1 ${getChangeColor(quote.change)}`}>
                  {quote.change > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : quote.change < 0 ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {quote.change > 0 ? '+' : ''}{formatNumber(quote.change)}
                  </span>
                  <span className="text-sm">
                    ({quote.change > 0 ? '+' : ''}{formatNumber(quote.changePercent)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* 盈亏信息 */}
            <div className={`flex items-center gap-2 text-lg font-semibold ${getPnLColor(pnl)}`}>
              <span>浮动盈亏:</span>
              <span>{formatPnL(pnl)}</span>
              <span className="text-sm font-medium">
                ({pnlPercent >= 0 ? '+' : ''}{formatNumber(pnlPercent)}%)
              </span>
            </div>

            {/* 详细信息 */}
            {showDetails && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">成本价:</span>
                  <span>¥{formatNumber(costPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">持仓数量:</span>
                  <span>{quantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">持仓市值:</span>
                  <span>¥{(quote.price * quantity).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">持仓成本:</span>
                  <span>¥{(costPrice * quantity).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">开盘:</span>
                  <span>{formatNumber(quote.open)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">昨收:</span>
                  <span>{formatNumber(quote.prevClose)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最高:</span>
                  <span className="text-red-500">{formatNumber(quote.high)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最低:</span>
                  <span className="text-green-500">{formatNumber(quote.low)}</span>
                </div>
              </div>
            )}

            {/* 更新时间 */}
            <div className="text-xs text-muted-foreground">
              更新: {new Date(quote.updateTime).toLocaleString('zh-CN')}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            暂无行情数据
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PositionPriceCard