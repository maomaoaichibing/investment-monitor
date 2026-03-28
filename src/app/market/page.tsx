'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react'

interface MarketIndex {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  market: string
  updateTime: string
}

interface HotStock {
  symbol: string
  name: string
  market: string
  price: number
  changePercent: number
}

export default function MarketPage() {
  const [indices, setIndices] = useState<Record<string, Record<string, MarketIndex>> | null>(null)
  const [hotStocks, setHotStocks] = useState<HotStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // 获取大盘指数
      const indexRes = await fetch('/api/market/overview')
      const indexData = await indexRes.json()

      if (indexData.success) {
        setIndices(indexData.data)
        setLastUpdate(new Date().toLocaleTimeString('zh-CN'))
      } else {
        setError('获取大盘数据失败')
      }

      // 获取热门股票
      const stockRes = await fetch('/api/stock/search')
      const stockData = await stockRes.json()

      if (stockData.success) {
        setHotStocks(stockData.data)
      }
    } catch (err) {
      setError('网络请求失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60 * 1000) // 60秒刷新
    return () => clearInterval(interval)
  }, [])

  const renderIndexCard = (name: string, index: MarketIndex) => {
    const isUp = index.change >= 0
    return (
      <Card key={name} className="min-w-[180px]">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">{name}</div>
          <div className="text-xl font-bold mt-1">{index.price.toLocaleString()}</div>
          <div className={`flex items-center gap-1 mt-1 ${isUp ? 'text-red-500' : 'text-green-500'}`}>
            {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm">
              {isUp ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderStockCard = (stock: HotStock) => {
    const isUp = stock.changePercent >= 0
    const marketColor = stock.market === 'A' ? 'bg-blue-500' : stock.market === 'HK' ? 'bg-orange-500' : 'bg-purple-500'

    return (
      <Card key={`${stock.symbol}-${stock.market}`} className="min-w-[150px]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`${marketColor} text-white text-xs`}>{stock.market}</Badge>
            <span className="text-sm font-medium">{stock.symbol}</span>
          </div>
          <div className="text-lg font-bold">{stock.name}</div>
          <div className="text-xl font-bold mt-1">{stock.price.toLocaleString()}</div>
          <div className={`flex items-center gap-1 mt-1 ${isUp ? 'text-red-500' : 'text-green-500'}`}>
            {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm">
              {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading && !indices) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">行情看板</h1>
          <p className="text-muted-foreground mt-1">
            市场概览 · 最后更新: {lastUpdate}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Market Tabs */}
      <Tabs defaultValue="A股" className="space-y-4">
        <TabsList>
          <TabsTrigger value="A股">A股</TabsTrigger>
          <TabsTrigger value="港股">港股</TabsTrigger>
          <TabsTrigger value="美股">美股</TabsTrigger>
        </TabsList>

        {/* A股 */}
        <TabsContent value="A股" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-3">大盘指数</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {indices?.A股 && Object.entries(indices.A股).map(([name, idx]) => renderIndexCard(name, idx))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3">热门A股</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {hotStocks.filter(s => s.market === 'A').slice(0, 10).map(renderStockCard)}
            </div>
          </div>
        </TabsContent>

        {/* 港股 */}
        <TabsContent value="港股" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-3">大盘指数</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {indices?.港股 && Object.entries(indices.港股).map(([name, idx]) => renderIndexCard(name, idx))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3">热门港股</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {hotStocks.filter(s => s.market === 'HK').slice(0, 10).map(renderStockCard)}
            </div>
          </div>
        </TabsContent>

        {/* 美股 */}
        <TabsContent value="美股" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-3">大盘指数</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {indices?.美股 && Object.entries(indices.美股).map(([name, idx]) => renderIndexCard(name, idx))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3">热门美股</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {hotStocks.filter(s => s.market === 'US').slice(0, 10).map(renderStockCard)}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
