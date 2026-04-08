'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, TrendingUp, ExternalLink } from 'lucide-react'
import { HealthScoreRing, getHealthEmoji, getHealthLevel } from './health-score-ring'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ThesisPillar {
  id: number
  name: string
  coreAssumption: string
  conviction: number
  monitorIndicators: Array<{
    name: string
    type: string
    frequency: string
  }>
  bullishSignal: string
  riskTrigger: string
  impactWeight?: number
}

interface Thesis {
  id: string
  title: string
  summary: string
  healthScore: number | null
  investmentStyle: string
  holdingPeriod: string
  createdAt: string
  pillarsJson: string | null
  position: {
    id: string
    symbol: string
    assetName: string
  }
}

export default function ThesisCard() {
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
      const data = await response.json()

      // /api/thesis 返回 { theses: [...] }，也兼容 { success: true, data: { theses: [...] } }
      const allTheses = data.success ? (data.data?.theses || data.theses || []) : (data.theses || [])
      setTheses(allTheses.slice(0, 3))
    } catch (err) {
      console.error('Failed to fetch theses:', err)
      setError(err instanceof Error ? err.message : '未知错误')
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

  // 解析 pillars
  const parsePillars = (pillarsJson: string | null): ThesisPillar[] => {
    if (!pillarsJson) return []
    try {
      return JSON.parse(pillarsJson)
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            持仓论题
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            持仓论题
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            加载失败: {error}
          </div>
          <Button variant="outline" size="sm" onClick={fetchTheses} className="w-full">
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (theses.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            持仓论题
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            暂无投资论题
          </div>
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href="/positions/batch-regenerate">生成论题</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          持仓论题
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/theses">查看全部</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {theses.map((thesis) => {
            const pillars = parsePillars(thesis.pillarsJson)
            const healthScore = thesis.healthScore || 80
            const healthEmoji = getHealthEmoji(healthScore)
            const healthLevel = getHealthLevel(healthScore)

            return (
              <div
                key={thesis.id}
                className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* 健康度指示器 */}
                  <HealthScoreRing score={healthScore} size={56} strokeWidth={6} />

                  <div className="flex-1 min-w-0">
                    {/* 标题行 */}
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/theses/${thesis.id}`}
                        className="font-semibold hover:text-primary flex items-center gap-1"
                      >
                        {thesis.position.symbol}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        {thesis.position.assetName}
                      </span>
                      <span className={healthLevel.color + ' text-xs font-medium'}>
                        {healthEmoji} {healthLevel.label}
                      </span>
                    </div>

                    {/* 摘要 */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {thesis.summary}
                    </p>

                    {/* 关键监控指标 */}
                    {pillars.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {pillars.slice(0, 2).map((pillar) => (
                          <Badge key={pillar.id} variant="secondary" className="text-xs">
                            {pillar.name}
                          </Badge>
                        ))}
                        {pillars.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{pillars.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* 底部标签 */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {investmentStyleLabels[thesis.investmentStyle] || thesis.investmentStyle}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {holdingPeriodLabels[thesis.holdingPeriod] || thesis.holdingPeriod}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
