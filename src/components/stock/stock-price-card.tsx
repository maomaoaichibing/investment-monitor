'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

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

interface StockPriceCardProps {
  symbol: string
  market?: string
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number // 秒
  onPriceUpdate?: (quote: StockQuote) => void
}

export function StockPriceCard({
  symbol,
  market = 'A',
  showDetails = false,
  autoRefresh = false,
  refreshInterval = 60,
  onPriceUpdate
}: StockPriceCardProps) {
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
        onPriceUpdate?.(data.data)
      } else {
        setError(data.error || '获取失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败')
    } finally {
      setLoading(false)
    }
  }

  // 格式化数字
  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals)
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
  const getChangeColor = () => {
    if (!quote) return ''
    if (quote.change > 0) return 'text-red-500' // 涨（红色）
    if (quote.change < 0) return 'text-green-500' // 跌（绿色）
    return 'text-gray-500' // 不变
  }

  // 涨跌图标
  const getChangeIcon = () => {
    if (!quote) return <Minus className="h-4 w-4" />
    if (quote.change > 0) return <TrendingUp className="h-4 w-4" />
    if (quote.change < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  if (loading && !quote) {
    return (
      <div className="flex items-center justify-center p-4 bg-card rounded-lg border">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
      </div>
    )
  }

  if (error && !quote) {
    return (
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-red-200">
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
      </div>
    )
  }

  if (!quote) return null

  return (
    <div className="bg-card rounded-lg border">
      {/* 头部：名称和代码 */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{quote.name}</span>
          <span className="text-sm text-muted-foreground">{quote.symbol}</span>
        </div>
        <button
          onClick={fetchQuote}
          className="p-1 hover:bg-accent rounded"
          title="刷新"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* 价格区域 */}
      <div className="p-3">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold">
            ¥{formatNumber(quote.price)}
          </span>
          <div className={`flex items-center gap-1 ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="font-medium">
              {quote.change > 0 ? '+' : ''}{formatNumber(quote.change)}
            </span>
            <span className="text-sm">
              ({quote.change > 0 ? '+' : ''}{formatNumber(quote.changePercent)}%)
            </span>
          </div>
        </div>

        {/* 详细信息 */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-sm">
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">成交量:</span>
              <span>{formatVolume(quote.volume)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">成交额:</span>
              <span>¥{formatVolume(quote.amount)}</span>
            </div>
          </div>
        )}

        {/* 更新时间 */}
        <div className="mt-2 text-xs text-muted-foreground">
          更新: {new Date(quote.updateTime).toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  )
}

export default StockPriceCard
