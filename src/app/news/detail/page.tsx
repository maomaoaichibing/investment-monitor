'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp, TrendingDown, Minus, ArrowLeft, ExternalLink,
  Globe, Clock, ChevronRight, Loader2, AlertCircle, FileText,
  Zap, Database, Wifi, CheckCircle2, RefreshCw
} from 'lucide-react'

interface NewsDetail {
  id?: string
  symbol?: string
  title?: string
  titleZh?: string
  content?: string
  url?: string
  source?: string
  newsSource?: string
  publishedAt?: string
  eventTime?: string
  sentiment?: string
  sentimentScore?: number
  tags?: string[]
  isFromRss?: boolean
}

function sentConf(s?: string, sc?: number) {
  const score = sc || 0
  if ((s === 'positive' || score > 0.3) && score >= 0) {
    return { icon: TrendingUp, color: 'text-green-600', badge: 'bg-green-100 text-green-700 border-green-200', label: score > 0 ? `+${Math.round(score * 100)}%` : '利好' }
  }
  if (s === 'negative' || score < -0.3) {
    return { icon: TrendingDown, color: 'text-red-600', badge: 'bg-red-100 text-red-700 border-red-200', label: score < 0 ? `${Math.round(score * 100)}%` : '利空' }
  }
  return { icon: Minus, color: 'text-gray-500', badge: 'bg-gray-100 text-gray-600 border-gray-200', label: '中性' }
}

function timeStr(d?: string) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return d }
}

function ContentBlock({ label, content, icon: Icon, className = '' }: {
  label: string; content: string; icon: any; className?: string
}) {
  const paragraphs = content.split('\n').filter(l => l.trim())
  if (paragraphs.length === 0) return null
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-primary">{label}</h3>
      </div>
      <div className="space-y-2">
        {paragraphs.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {line.trim()}
          </p>
        ))}
      </div>
    </div>
  )
}

function NewsDetailContent() {
  const params = useSearchParams()
  const router = useRouter()

  // 状态
  const [news, setNews] = useState<NewsDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [translating, setTranslating] = useState(false)
  const [translatedContent, setTranslatedContent] = useState<string>('')
  const [transError, setTransError] = useState('')
  const [contentFetchError, setContentFetchError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [fetchedFullContent, setFetchedFullContent] = useState<string>('')
  const [source, setSource] = useState<'db' | 'url' | 'param'>('db')

  // 解析 URL 参数（后备）
  const fallbackData: NewsDetail = {
    symbol: params.get('symbol') || undefined,
    title: params.get('title') ? decodeURIComponent(params.get('title')!) : undefined,
    titleZh: params.get('titleZh') ? decodeURIComponent(params.get('titleZh')!) : undefined,
    content: params.get('content') ? decodeURIComponent(params.get('content')!) : undefined,
    url: params.get('url') ? decodeURIComponent(params.get('url')!) : undefined,
    source: params.get('source') ? decodeURIComponent(params.get('source')!) : undefined,
    newsSource: params.get('newsSource') ? decodeURIComponent(params.get('newsSource')!) : undefined,
    publishedAt: params.get('time') || undefined,
    sentiment: (params.get('sentiment') as any) || undefined,
    sentimentScore: params.get('score') ? parseFloat(params.get('score')!) : undefined,
  }

  // 从数据库加载
  async function loadFromDb() {
    const eventId = params.get('eventId')
    const symbol = params.get('symbol')
    const title = params.get('title')

    if (eventId) {
      const r = await fetch(`/api/news/event?id=${encodeURIComponent(eventId)}`)
      const d = await r.json()
      if (d.success) {
        setNews(d.data)
        setSource('db')
        return true
      }
    }
    if (symbol && title) {
      const r = await fetch(`/api/news/event?symbol=${encodeURIComponent(symbol)}&title=${encodeURIComponent(title)}`)
      const d = await r.json()
      if (d.success) {
        setNews(d.data)
        setSource('db')
        return true
      }
    }
    return false
  }

  // 翻译内容
  async function doTranslate(content: string, title?: string) {
    if (!content || content.trim().length < 10) return
    setTranslating(true)
    setTransError('')
    try {
      const r = await fetch('/api/news/translate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title: title || news?.titleZh || news?.title })
      })
      const d = await r.json()
      if (d.success) {
        setTranslatedContent(d.data.translated)
      } else {
        setTransError(d.error || '翻译失败')
        setTranslatedContent(content)
      }
    } catch (e: any) {
      setTransError('翻译请求失败：' + e.message)
      setTranslatedContent(content)
    }
    setTranslating(false)
  }

  // 从原文 URL 抓取全文
  async function fetchFullContent() {
    if (!news?.url) return
    setRefreshing(true)
    setContentFetchError('')
    try {
      const r = await fetch('/api/news/translate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: news.url, title: news.titleZh || news.title })
      })
      const d = await r.json()
      if (d.success && d.data.translated) {
        setFetchedFullContent(d.data.translated)
        setTranslatedContent(d.data.translated)
        // 更新源标记
        setSource('url')
      } else {
        setContentFetchError(d.error || '无法获取原文内容')
      }
    } catch (e: any) {
      setContentFetchError('抓取失败：' + e.message)
    }
    setRefreshing(false)
  }

  // 主加载逻辑
  useEffect(() => {
    async function init() {
      setLoading(true)
      setLoadError('')
      setTranslatedContent('')
      setFetchedFullContent('')

      // 1. 优先从数据库加载
      const found = await loadFromDb()

      if (!found) {
        // 2. 回退到 URL 参数
        setNews(fallbackData)
        setSource('param')
        if (fallbackData.content) {
          await doTranslate(fallbackData.content, fallbackData.titleZh || fallbackData.title)
        }
      }

      setLoading(false)
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 翻译数据库内容（当 news 更新后）
  useEffect(() => {
    if (news?.content && source === 'db') {
      doTranslate(news.content, news.titleZh || news.title)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [news?.id, news?.content])

  const displayNews = news || fallbackData
  const displayTitle = displayNews.titleZh || displayNews.title || '新闻详情'
  const enTitle = displayNews.titleZh ? displayNews.title : null
  const displayTime = displayNews.eventTime || displayNews.publishedAt || ''
  const sc = sentConf(displayNews.sentiment, displayNews.sentimentScore)
  const Icon = sc.icon

  // 判断内容质量
  const rawContentLen = (displayNews.content || '').length
  const isShortRss = rawContentLen > 0 && rawContentLen < 300
  const hasFullContent = fetchedFullContent.length > 0
  const showRefreshButton = !hasFullContent && !!displayNews.url && !contentFetchError

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-6 w-40 mb-6" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />返回
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold truncate">{displayTitle}</h1>
            </div>
            {/* 缓存来源标记 */}
            <Badge variant="outline" className="text-xs">
              {source === 'db' && <Database className="h-3 w-3 mr-1 inline text-green-600" />}
              {source === 'url' && <Wifi className="h-3 w-3 mr-1 inline text-blue-600" />}
              {source === 'param' && <FileText className="h-3 w-3 mr-1 inline text-gray-400" />}
              {source === 'db' ? '数据库' : source === 'url' ? '已抓全文' : 'URL参数'}
            </Badge>
            {displayNews.url && (
              <Button variant="outline" size="sm" asChild>
                <a href={displayNews.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />原文
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* 元信息卡片 */}
        <Card className="mb-5 border-l-4"
          style={{
            borderLeftColor: sc.icon === TrendingUp ? '#22c55e' : sc.icon === TrendingDown ? '#ef4444' : '#9ca3af'
          }}>
          <CardContent className="pt-4 pb-4">
            {/* 中文标题 */}
            <h2 className="text-xl font-bold mb-3 leading-snug">
              {enTitle && (
                <span className="block text-xs font-normal text-muted-foreground mb-1">
                  原文：{enTitle}
                </span>
              )}
              {displayTitle}
            </h2>

            {/* 标签行 */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {displayNews.symbol && (
                <Badge variant="outline" className="font-mono text-xs font-bold">{displayNews.symbol}</Badge>
              )}
              <Badge className={`text-xs ${sc.badge}`}>
                <Icon className="h-3 w-3 mr-1" />{sc.label}
              </Badge>
              {(displayNews.newsSource || displayNews.source) && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {displayNews.newsSource || displayNews.source}
                </span>
              )}
              {displayTime && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeStr(displayTime)}
                </span>
              )}
              {isShortRss && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">
                  ⚡ RSS摘要（较短）
                </Badge>
              )}
            </div>

            {/* 内容来源说明 */}
            {source === 'db' && rawContentLen > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span>内容来自数据库 · 共 {rawContentLen} 字符</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 内容区域 */}
        <Card className="mb-5">
          <CardContent className="pt-5 pb-5">
            {/* 加载状态 */}
            {translating && (
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <h3 className="text-sm font-semibold text-primary">正在翻译全文...</h3>
                </div>
                {[1,2,3,4,5,6,7,8].map(i => (
                  <Skeleton key={i} className="h-4 w-full" style={{ width: `${100 - i * 3}%` }} />
                ))}
              </div>
            )}

            {/* 已翻译内容 */}
            {!translating && translatedContent && (
              <ContentBlock
                label="📖 中文全文"
                content={translatedContent}
                icon={FileText}
              />
            )}

            {/* 仅RSS摘要提示 */}
            {!translating && isShortRss && !hasFullContent && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 mb-1">⚡ 当前展示为 RSS 摘要</p>
                    <p className="text-xs text-amber-700 mb-3">
                      新闻来源仅提供了简短摘要（约 {rawContentLen} 字符）。点击下方按钮可尝试抓取原文全文。
                    </p>
                    {showRefreshButton && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={fetchFullContent}
                        disabled={refreshing}
                      >
                        {refreshing ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />抓取中...</>
                        ) : (
                          <><RefreshCw className="h-3.5 w-3.5 mr-1" />尝试抓取原文全文</>
                        )}
                      </Button>
                    )}
                    {contentFetchError && (
                      <p className="text-xs text-red-600 mt-2">抓取失败：{contentFetchError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 翻译错误提示 */}
            {transError && !translating && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-700">
                    <p className="font-medium">翻译受限：{transError}</p>
                    {displayNews.url && (
                      <p className="mt-1">您可以点击顶部「原文」按钮查看英文原文</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 无内容提示 */}
            {!translatedContent && !translating && !loadError && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无内容详情</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 标签 */}
        {displayNews.tags && displayNews.tags.length > 0 && (
          <Card className="mb-5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {displayNews.tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 原文链接 */}
        {displayNews.url && (
          <Card className="border-dashed mb-6">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">阅读完整英文原文</p>
              <Button variant="outline" asChild>
                <a href={displayNews.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {displayNews.url.length > 60 ? displayNews.url.substring(0, 60) + '...' : displayNews.url}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 返回按钮 */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />返回舆情监控
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function NewsDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    }>
      <NewsDetailContent />
    </Suspense>
  )
}
