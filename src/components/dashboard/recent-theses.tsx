'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Thesis {
  id: string
  title: string
  summary: string
  investmentStyle: string
  holdingPeriod: string
  status: string
  createdAt: string
  position: {
    id: string
    symbol: string
    assetName: string
  }
}

export default function RecentTheses() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTheses()
  }, [])

  const fetchTheses = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/thesis')
      let data: any

      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Invalid JSON response')
      }

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`)
      }

      // 取最新的4个thesis
      const allTheses = data.theses || []
      setTheses(allTheses.slice(0, 4))
    } catch (err) {
      console.error('Failed to fetch theses:', err)
      setError(err instanceof Error ? err.message : '未知错误')
      setTheses([])
    } finally {
      setLoading(false)
    }
  }

  // 投资风格映射
  const investmentStyleLabels: Record<string, string> = {
    growth: '成长',
    value: '价值',
    quality: '质量',
    momentum: '趋势'
  }

  // 持仓周期映射
  const holdingPeriodLabels: Record<string, string> = {
    short_term: '短期',
    medium_term: '中期',
    long_term: '长期'
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">最近投资论题</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/theses">查看全部</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start justify-between rounded-lg border p-3">
                <div className="space-y-2 w-full">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">最近投资论题</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchTheses}>
            重试
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            加载投资论题失败: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">最近投资论题</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/theses">查看全部</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {theses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无投资论题
            </div>
          ) : (
            theses.map((thesis) => (
              <div
                key={thesis.id}
                className="flex items-start justify-between rounded-lg border p-3 hover:bg-muted/50"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Link
                      href={`/thesis/${thesis.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {thesis.position.symbol}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {thesis.position.assetName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {investmentStyleLabels[thesis.investmentStyle] || thesis.investmentStyle}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {thesis.summary}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {holdingPeriodLabels[thesis.holdingPeriod] || thesis.holdingPeriod}
                    </span>
                    <span>{formatDate(thesis.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
