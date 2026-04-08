'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, ExternalLink, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Indicator {
  name: string
  value: string
  trend: 'up' | 'down' | 'stable'
  status: 'healthy' | 'warning'
}

interface ThesisCardData {
  id: string
  title: string
  summary: string
  healthScore: number
  investmentStyle: string
  holdingPeriod: string
  updatedAt: string
  position: {
    id: string
    symbol: string
    assetName: string
  }
  indicators: Indicator[]
  aiComment: string
}

function ThesisCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

export default function ThesisCardV2() {
  const [theses, setTheses] = useState<ThesisCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const r = await fetch('/api/dashboard/overview')
      const d = await r.json()
      if (d.success && d.data?.thesisCards) {
        setTheses(d.data.thesisCards)
      } else {
        setError('获取数据失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const investmentStyleLabels: Record<string, string> = {
    growth: '成长', value: '价值', quality: '质量', momentum: '趋势'
  }

  const holdingPeriodLabels: Record<string, string> = {
    short_term: '短期', medium_term: '中期', long_term: '长期'
  }

  const getHealthColor = (score: number) => {
    if (score >= 70) return { dot: 'bg-green-500', text: 'text-green-600', label: '健康' }
    if (score >= 40) return { dot: 'bg-yellow-500', text: 'text-yellow-600', label: '预警' }
    return { dot: 'bg-red-500', text: 'text-red-600', label: '危机' }
  }

  const getTrendStyle = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return { icon: '↑', color: 'text-red-500' }
      case 'down': return { icon: '↓', color: 'text-green-500' }
      default: return { icon: '→', color: 'text-gray-500' }
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          持仓论题
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/theses">查看全部</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <ThesisCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>{error}</p>
            <Button variant="ghost" size="sm" onClick={loadData} className="mt-2">重试</Button>
          </div>
        ) : theses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>暂无持仓论题，请先添加持仓并生成投资论题</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {theses.map((thesis) => {
              const health = getHealthColor(thesis.healthScore)
              const indicators = thesis.indicators || []

              return (
                <div
                  key={thesis.id}
                  className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${health.dot}`} />
                      <span className={`font-bold ${health.text}`}>
                        {thesis.healthScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {investmentStyleLabels[thesis.investmentStyle] || thesis.investmentStyle}
                      </Badge>
                      <span>·</span>
                      <Badge variant="outline" className="text-xs">
                        {holdingPeriodLabels[thesis.holdingPeriod] || thesis.holdingPeriod}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-2">
                    <Link
                      href={`/theses/${thesis.id}`}
                      className="font-bold text-base hover:text-primary flex items-center gap-1"
                    >
                      {thesis.position.symbol}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Link>
                    <span className="text-sm text-muted-foreground ml-2">
                      {thesis.position.assetName}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {thesis.summary}
                  </p>

                  {indicators.length > 0 && (
                    <div className="mb-3 text-xs">
                      <div className="grid gap-1">
                        {indicators.map((indicator, idx) => {
                          const trend = getTrendStyle(indicator.trend)
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-muted-foreground w-20 truncate">
                                {indicator.name}
                              </span>
                              <span className={`font-medium ${trend.color}`}>
                                {indicator.value}
                              </span>
                              <span className={trend.color}>{trend.icon}</span>
                              {indicator.status === 'healthy' ? (
                                <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-orange-500 ml-auto" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-xs italic text-muted-foreground mb-3">
                    🤖 {thesis.aiComment}
                  </p>

                  <div className="text-xs text-muted-foreground">
                    更新于 {formatTime(thesis.updatedAt)}
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
