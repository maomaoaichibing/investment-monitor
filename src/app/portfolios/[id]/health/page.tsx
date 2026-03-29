'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'

interface PositionHealth {
  id: string
  symbol: string
  assetName: string
  healthScore?: number
  alertCount: number
  lastAlert?: {
    level: string
    message: string
  }
}

interface PortfolioHealth {
  id: string
  name: string
  avgHealthScore: number
  positions: PositionHealth[]
}

export default function PortfolioHealthPage({ params }: { params: { id: string } }) {
  const [portfolio, setPortfolio] = useState<PortfolioHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // 获取组合信息
        const portfolioRes = await fetch(`/api/portfolios/${params.id}`)
        const portfolioData = await portfolioRes.json()
        if (!portfolioData.success) throw new Error(portfolioData.error)

        const portfolioInfo = portfolioData.data

        // 获取持仓列表
        const positionsRes = await fetch(`/api/positions?portfolioId=${params.id}`)
        const positionsData = await positionsRes.json()
        const positions = positionsData.data || []

        // 获取每个持仓的thesis和alert信息
        const positionsWithHealth: PositionHealth[] = await Promise.all(
          positions.map(async (pos: any) => {
            try {
              const thesisRes = await fetch(`/api/theses?positionId=${pos.id}`)
              const thesisData = await thesisRes.json()
              const thesis = thesisData.data?.[0]

              // 获取该持仓的最新alert
              const alertsRes = await fetch(`/api/alerts?positionId=${pos.id}&limit=1`)
              const alertsData = await alertsRes.json()
              const alerts = alertsData.data || []
              const lastAlert = alerts[0]

              return {
                id: pos.id,
                symbol: pos.symbol,
                assetName: pos.assetName,
                healthScore: thesis?.healthScore,
                alertCount: alertsData.total || 0,
                lastAlert: lastAlert ? {
                  level: lastAlert.level,
                  message: lastAlert.message?.substring(0, 50) + '...'
                } : undefined
              }
            } catch {
              return {
                id: pos.id,
                symbol: pos.symbol,
                assetName: pos.assetName,
                healthScore: undefined,
                alertCount: 0,
                lastAlert: undefined
              }
            }
          })
        )

        // 计算平均健康度
        const validScores = positionsWithHealth
          .map(p => p.healthScore)
          .filter((s): s is number => s !== undefined)

        const avgScore = validScores.length > 0
          ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
          : 0

        setPortfolio({
          id: params.id,
          name: portfolioInfo.name,
          avgHealthScore: avgScore,
          positions: positionsWithHealth
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="text-red-500">加载失败: {error || '未知错误'}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getHealthColor = (score?: number) => {
    if (score === undefined) return 'bg-gray-400'
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getHealthLabel = (score?: number) => {
    if (score === undefined) return '未评估'
    if (score >= 80) return '优秀'
    if (score >= 60) return '良好'
    if (score >= 40) return '预警'
    return '危机'
  }

  const getAlertBadge = (level?: string) => {
    if (!level) return null
    const variants: Record<string, string> = {
      watch: 'bg-blue-500',
      important: 'bg-orange-500',
      urgent: 'bg-red-500',
      info: 'bg-gray-500'
    }
    const labels: Record<string, string> = {
      watch: '观察',
      important: '重要',
      urgent: '紧急',
      info: '信息'
    }
    return (
      <Badge className={variants[level] || 'bg-gray-500'}>
        {labels[level] || level}
      </Badge>
    )
  }

  // 按健康度排序
  const sortedPositions = [...portfolio.positions].sort((a, b) =>
    (b.healthScore || 0) - (a.healthScore || 0)
  )

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/portfolios/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回组合
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{portfolio.name} - 健康度分析</h1>
          <p className="text-muted-foreground">投资组合健康度总览</p>
        </div>
      </div>

      {/* 总体健康度 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            组合健康度
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(portfolio.avgHealthScore / 100) * 352} 352`}
                  className={portfolio.avgHealthScore >= 70 ? 'text-green-500' :
                              portfolio.avgHealthScore >= 40 ? 'text-yellow-500' : 'text-red-500'}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{portfolio.avgHealthScore}</span>
                <span className="text-xs text-muted-foreground">健康度</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-lg font-medium">{getHealthLabel(portfolio.avgHealthScore)}</div>
              <p className="text-sm text-muted-foreground mb-4">
                基于 {portfolio.positions.length} 个持仓的综合评分
              </p>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {portfolio.positions.filter(p => (p.healthScore || 0) >= 70).length}
                  </div>
                  <div className="text-xs text-muted-foreground">健康</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    {portfolio.positions.filter(p => (p.healthScore || 0) >= 40 && (p.healthScore || 0) < 70).length}
                  </div>
                  <div className="text-xs text-muted-foreground">预警</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {portfolio.positions.filter(p => (p.healthScore || 0) < 40).length}
                  </div>
                  <div className="text-xs text-muted-foreground">危机</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">
                    {portfolio.positions.filter(p => p.healthScore === undefined).length}
                  </div>
                  <div className="text-xs text-muted-foreground">未评估</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 持仓列表 */}
      <Card>
        <CardHeader>
          <CardTitle>持仓健康度详情</CardTitle>
          <CardDescription>
            按健康度排序，显示每个持仓的论题健康度和最新提醒
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedPositions.map((position) => (
              <div
                key={position.id}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${getHealthColor(position.healthScore)}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{position.assetName}</span>
                    <Badge variant="outline">{position.symbol}</Badge>
                  </div>
                  {position.lastAlert && (
                    <div className="flex items-center gap-2 mt-1">
                      {getAlertBadge(position.lastAlert.level)}
                      <span className="text-xs text-muted-foreground">{position.lastAlert.message}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {position.healthScore !== undefined ? (
                      <>
                        <span className="text-2xl font-bold">{position.healthScore}</span>
                        <Badge variant="secondary">{getHealthLabel(position.healthScore)}</Badge>
                      </>
                    ) : (
                      <Badge variant="secondary">未评估</Badge>
                    )}
                  </div>
                  {position.alertCount > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3 w-3" />
                      {position.alertCount} 条提醒
                    </div>
                  )}
                </div>
                <Link href={`/positions/${position.id}`}>
                  <Button size="sm" variant="ghost">详情</Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
