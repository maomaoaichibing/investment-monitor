'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, Newspaper, Bell, Clock, Globe } from 'lucide-react'

interface NewsItem {
  symbol: string; title: string; titleZh?: string; content: string; url?: string
  source: string; publishedAt: string; sentiment?: string; sentimentScore?: number
  tags?: string[]; newsSource?: string; alertCount?: number; eventTime?: string
}
interface StoredItem {
  id: string; symbol: string; title: string; titleZh?: string; content: string; eventTime: string
  source: string; url?: string; newsSource?: string; sentiment?: string
  sentimentScore?: number; tags?: string[]; alertCount?: number
}

function sentConf(s?: string, sc?: number) {
  const score = sc || 0
  if ((s === 'positive' || score > 0.3) && score >= 0) {
    return { icon: TrendingUp, color: 'text-green-600', badge: 'bg-green-100 text-green-700', label: score > 0 ? `+${Math.round(score*100)}%` : '利好' }
  }
  if (s === 'negative' || score < -0.3) {
    return { icon: TrendingDown, color: 'text-red-600', badge: 'bg-red-100 text-red-700', label: score < 0 ? `${Math.round(score*100)}%` : '利空' }
  }
  return { icon: Minus, color: 'text-gray-500', badge: 'bg-gray-100 text-gray-600', label: '中性' }
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const h = Math.floor(diff / 3.6e6)
  const m = Math.floor(diff / 6e4)
  if (m < 60) return `${m}分钟前`
  if (h < 24) return `${h}小时前`
  return new Date(d).toLocaleDateString('zh-CN')
}

function NewsCard({ item }: { item: NewsItem | StoredItem }) {
  const sc = sentConf(item.sentiment, item.sentimentScore)
  const Icon = sc.icon
  const t = (item as any).eventTime || (item as any).publishedAt || new Date().toISOString()
  const zhTitle = (item as any).titleZh || item.title
  const enTitle = (item as any).titleZh ? item.title : null
  return (
    <div className={`rounded-lg border p-4 hover:shadow-sm transition ${sc.icon === TrendingUp ? 'bg-green-50/50 border-green-100' : sc.icon === TrendingDown ? 'bg-red-50/50 border-red-100' : 'bg-white'}`}>
      <div className="flex gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${sc.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className="font-medium text-sm leading-snug line-clamp-2"
              title={enTitle || ''}
            >
              {item.url
                ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{zhTitle}</a>
                : zhTitle}
            </h3>
            {item.url && <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
          </div>
          {item.content && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.content}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-xs font-mono">{item.symbol}</Badge>
            <Badge variant="outline" className={`text-xs ${sc.badge}`}><Icon className="h-3 w-3 mr-1" />{sc.label}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" />{item.newsSource || item.source}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(t)}</span>
            {(item.alertCount || 0) > 0 && <span className="text-xs text-orange-600 flex items-center gap-1"><Bell className="h-3 w-3" />已触发提醒</span>}
            {item.tags?.slice(0,2).map((tg,i) => <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">{tg}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function SymbolCard({ symbol, news }: { symbol: string; news: NewsItem[] }) {
  const [open, setOpen] = useState(false)
  const pos = news.filter(n => (n.sentimentScore||0) > 0.3).length
  const neg = news.filter(n => (n.sentimentScore||0) < -0.3).length
  const shown = open ? news : news.slice(0, 3)
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-mono">{symbol}</CardTitle>
            {pos > 0 && <Badge className="bg-green-100 text-green-700 text-xs"><TrendingUp className="h-3 w-3 mr-1"/>{pos}利好</Badge>}
            {neg > 0 && <Badge className="bg-red-100 text-red-700 text-xs"><TrendingDown className="h-3 w-3 mr-1"/>{neg}利空</Badge>}
          </div>
          <span className="text-xs text-muted-foreground">{news.length}条</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {shown.map((item, i) => <NewsCard key={`${item.title}-${i}`} item={item} />)}
        {news.length > 3 && (
          <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} className="w-full">
            {open ? '收起' : `展开全部 ${news.length} 条`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function NewsPage() {
  const [stored, setStored] = useState<StoredItem[]>([])
  const [live, setLive] = useState<Record<string, NewsItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [tab, setTab] = useState<'live' | 'stored'>('live')
  const [result, setResult] = useState<any>(null)

  useEffect(() => { loadStored() }, [])

  async function loadStored() {
    setLoading(true)
    try {
      const r = await fetch('/api/news?limit=50')
      const d = await r.json()
      if (d.success) setStored(d.data.news)
    } finally { setLoading(false) }
  }

  async function handleFetch() {
    setFetching(true)
    setResult(null)
    try {
      const r = await fetch('/api/news/fetch', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) })
      const d = await r.json()
      setResult(d.data)
      if (d.data?.bySymbol) setLive(d.data.bySymbol)
      if (d.data?.saved) await loadStored()
    } finally { setFetching(false) }
  }

  const allSymbols = Object.keys(live)
  const totalNews = allSymbols.reduce((s, k) => s + (live[k]?.length || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">舆情监控</h1>
                <p className="text-xs text-muted-foreground">持仓相关财经新闻 · 实时情感分析</p>
              </div>
            </div>
            <Button onClick={handleFetch} disabled={fetching} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
              {fetching ? '抓取中...' : '刷新新闻'}
            </Button>
          </div>
          {result && (
            <div className="flex gap-4 mt-3 text-sm">
              <span>实时新闻: <b className="text-primary">{totalNews}</b> 条</span>
              <span>覆盖: <b>{allSymbols.length}</b> 只</span>
              {result.saved !== undefined && <span>存入: <b>{result.saved}</b> 条</span>}
              {(result.alertsCreated || 0) > 0 && <span className="text-orange-600">触发提醒: <b>{result.alertsCreated}</b> 条</span>}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tab切换 */}
        <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
          <button onClick={() => setTab('live')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === 'live' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>
            实时抓取 ({totalNews}条)
          </button>
          <button onClick={() => setTab('stored')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === 'stored' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}>
            历史新闻 ({stored.length}条)
          </button>
        </div>

        {tab === 'live' && (
          <div>
            {fetching ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1,2,3].map(i => <Card key={i}><CardHeader><Skeleton className="h-5 w-20" /></CardHeader><CardContent className="space-y-3">{[1,2,3].map(j => <Skeleton key={j} className="h-20 w-full" />)}</CardContent></Card>)}
              </div>
            ) : allSymbols.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allSymbols.map(sym => <SymbolCard key={sym} symbol={sym} news={live[sym]} />)}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">暂无新闻</h3>
                  <p className="text-muted-foreground mb-4">点击「刷新新闻」从财经媒体获取最新资讯</p>
                  <Button onClick={handleFetch} disabled={fetching}>
                    <RefreshCw className="h-4 w-4 mr-2" />立即抓取
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === 'stored' && (
          <div>
            {loading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : stored.length > 0 ? (
              <div className="space-y-3">{stored.map(item => <NewsCard key={item.id} item={item} />)}</div>
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">暂无历史新闻，请先点击「刷新新闻」</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 说明 */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-medium mb-2">使用说明</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <b>实时抓取</b>：从 Yahoo Finance 和东方财富获取持仓相关财经新闻</li>
            <li>• <b>情感分析</b>：基于关键词规则自动判断利好/利空/中性（+正面分/-负面分）</li>
            <li>• <b>自动提醒</b>：高情感得分（|score| ≥ 0.5）的新闻自动生成 Alert</li>
            <li>• <b>历史新闻</b>：已存储的新闻可在「提醒」页面查看完整分析</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
