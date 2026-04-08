'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp, TrendingDown, Minus, ArrowLeft, ExternalLink,
  Globe, Clock, ChevronRight, Loader2, AlertCircle
} from 'lucide-react'

interface NewsData {
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
    return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return d }
}

function NewsDetailContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [translating, setTranslating] = useState(true)
  const [translatedContent, setTranslatedContent] = useState<string>('')
  const [originalContent, setOriginalContent] = useState<string>('')
  const [fetchError, setFetchError] = useState('')
  const [transError, setTransError] = useState('')

  // 从 URL 参数解析新闻数据
  const rawData: NewsData = {
    symbol: params.get('symbol') || undefined,
    title: params.get('title') ? decodeURIComponent(params.get('title')!) : undefined,
    titleZh: params.get('titleZh') ? decodeURIComponent(params.get('titleZh')!) : undefined,
    content: params.get('content') ? decodeURIComponent(params.get('content')!) : undefined,
    url: params.get('url') ? decodeURIComponent(params.get('url')!) : undefined,
    source: params.get('source') ? decodeURIComponent(params.get('source')!) : undefined,
    newsSource: params.get('newsSource') ? decodeURIComponent(params.get('newsSource')!) : undefined,
    publishedAt: params.get('time') || undefined,
    sentiment: params.get('sentiment') as any || undefined,
    sentimentScore: params.get('score') ? parseFloat(params.get('score')!) : undefined,
  }

  const displayTitle = rawData.titleZh || rawData.title || '新闻详情'
  const displayTime = rawData.eventTime || rawData.publishedAt || ''
  const sc = sentConf(rawData.sentiment, rawData.sentimentScore)
  const Icon = sc.icon

  useEffect(() => {
    async function translate() {
      setTranslating(true)
      setTransError('')
      setFetchError('')

      // 优先使用摘要内容翻译
      if (rawData.content && rawData.content.trim().length > 0) {
        setOriginalContent(rawData.content)
        try {
          const res = await fetch('/api/news/translate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: rawData.content,
              title: rawData.titleZh || rawData.title
            })
          })
          const d = await res.json()
          if (d.success) {
            setTranslatedContent(d.data.translated)
          } else {
            setTransError(d.error || '翻译失败')
            setTranslatedContent(rawData.content)
          }
        } catch (e: any) {
          setTransError('翻译请求失败：' + e.message)
          setTranslatedContent(rawData.content)
        }
      } else if (rawData.url) {
        // 无摘要，通过URL抓取并翻译全文
        try {
          const res = await fetch('/api/news/translate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: rawData.url,
              title: rawData.titleZh || rawData.title
            })
          })
          const d = await res.json()
          if (d.success) {
            setOriginalContent(d.data.original)
            setTranslatedContent(d.data.translated)
          } else {
            setFetchError(d.error || '抓取失败')
            // 降级：显示标题作为内容
            setTranslatedContent(`（无法获取文章全文）\n\n原文标题：${rawData.title || '无标题'}`)
          }
        } catch (e: any) {
          setFetchError('抓取请求失败：' + e.message)
          setTranslatedContent(`（无法获取文章内容）\n\n原文标题：${rawData.title || '无标题'}`)
        }
      } else {
        setTranslating(false)
        setTranslatedContent('（无内容）')
      }

      setTranslating(false)
    }

    translate()
  }, [])

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
            {rawData.url && (
              <Button variant="outline" size="sm" asChild>
                <a href={rawData.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />原文
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* 元信息卡片 */}
        <Card className="mb-6 border-l-4"
          style={{
            borderLeftColor: sc.icon === TrendingUp ? '#22c55e' : sc.icon === TrendingDown ? '#ef4444' : '#9ca3af'
          }}>
          <CardContent className="pt-4 pb-4">
            {/* 标题 */}
            <h2 className="text-xl font-bold mb-4 leading-snug">
              {rawData.titleZh && rawData.title && (
                <span className="block text-sm font-normal text-muted-foreground mb-1">
                  原文：{rawData.title}
                </span>
              )}
              {displayTitle}
            </h2>

            {/* 标签行 */}
            <div className="flex items-center gap-3 flex-wrap">
              {rawData.symbol && (
                <Badge variant="outline" className="font-mono text-xs">{rawData.symbol}</Badge>
              )}
              <Badge className={`text-xs ${sc.badge}`}>
                <Icon className="h-3 w-3 mr-1" />{sc.label}
              </Badge>
              {(rawData.newsSource || rawData.source) && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {rawData.newsSource || rawData.source}
                </span>
              )}
              {displayTime && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeStr(displayTime)}
                </span>
              )}
              {translating && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />翻译中...
                </Badge>
              )}
              {!translating && !transError && !fetchError && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                  ✓ 已翻译
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 中文正文 */}
        <Card className="mb-6">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b">
              <h3 className="text-sm font-semibold text-primary">📖 中文全文</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            {translating ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">正在翻译全文，请稍候...</span>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {translatedContent.split('\n').map((line, i) => (
                    line.trim() ? (
                      <p key={i} className="mb-2">{line}</p>
                    ) : (
                      <br key={i} />
                    )
                  ))}
                </div>
              </div>
            )}

            {(transError || fetchError) && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium">⚠️ 翻译受限</p>
                  <p className="mt-1">{fetchError || transError}</p>
                  {rawData.url && (
                    <p className="mt-2">
                      您可以点击下方「原文链接」查看完整英文内容
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 原文链接 */}
        {rawData.url && (
          <Card className="border-dashed">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">阅读完整原文（英文）</p>
              <Button variant="outline" asChild>
                <a href={rawData.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {rawData.url.length > 50 ? rawData.url.substring(0, 50) + '...' : rawData.url}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 返回按钮 */}
        <div className="mt-6 text-center">
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
