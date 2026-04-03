'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, TrendingUp, Shield, Activity, BarChart3, PieChart } from 'lucide-react'

// 风险等级颜色映射
const riskLevelColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
}

const riskLevelTextColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600'
}

const riskTypeLabels = {
  market: '市场风险',
  industry: '行业风险',
  company: '公司风险',
  financial: '财务风险',
  regulatory: '监管风险',
  liquidity: '流动性风险',
  concentration: '集中度风险',
  correlation: '相关性风险',
  currency: '汇率风险',
  volatility: '波动率风险'
}

interface Risk {
  id: string
  title: string
  description: string
  riskType: keyof typeof riskTypeLabels
  riskLevel: keyof typeof riskLevelColors
  riskScore: number
  probability: number
  status: string
  position: {
    symbol: string
    assetName: string
  } | null
}

interface RiskStats {
  totalRisks: number
  activeRisks: number
  criticalRisks: number
  riskByType: Record<string, number>
  riskByLevel: Record<string, number>
  avgRiskScore: number
  topRiskFactors: Array<{ name: string; count: number }>
}

interface RiskExposure {
  totalValue: number
  atRiskValue: number
  riskExposureRatio: number
  positionExposures: Array<{
    symbol: string
    value: number
    riskValue: number
    riskRatio: number
  }>
}

export default function RiskDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const portfolioId = searchParams.get('portfolioId') || 'cmn89mcmv0000yxwftq9bnzzc' // 默认投资组合

  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'correlation' | 'scenarios'>('overview')
  const [stats, setStats] = useState<RiskStats | null>(null)
  const [exposure, setExposure] = useState<RiskExposure | null>(null)
  const [recentRisks, setRecentRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载风险统计
  const loadRiskStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/risks/stats?portfolioId=${portfolioId}`)
      const result = await response.json()

      if (result.success) {
        setStats(result.data.stats)
      } else {
        throw new Error(result.error || '加载风险统计失败')
      }
    } catch (err) {
      console.error('加载风险统计失败:', err)
      setError(err instanceof Error ? err.message : '加载风险统计失败')
    }
  }, [portfolioId])

  // 加载风险暴露
  const loadRiskExposure = useCallback(async () => {
    try {
      const response = await fetch(`/api/risks/exposure?portfolioId=${portfolioId}`)
      const result = await response.json()

      if (result.success) {
        setExposure(result.data.exposure)
      } else {
        throw new Error(result.error || '加载风险暴露失败')
      }
    } catch (err) {
      console.error('加载风险暴露失败:', err)
    }
  }, [portfolioId])

  // 加载最近的风险
  const loadRecentRisks = useCallback(async () => {
    try {
      const response = await fetch(`/api/risks?portfolioId=${portfolioId}&page=1&limit=5`)
      const result = await response.json()

      if (result.success) {
        setRecentRisks(result.data.risks)
      }
    } catch (err) {
      console.error('加载风险列表失败:', err)
    }
  }, [portfolioId])

  // 初始化加载
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        loadRiskStats(),
        loadRiskExposure(),
        loadRecentRisks()
      ])
      setLoading(false)
    }

    loadData()
  }, [loadRiskStats, loadRiskExposure, loadRecentRisks])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">加载风险数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>暂无数据</AlertTitle>
          <AlertDescription>未能加载风险数据，请稍后重试</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">风险管理</h1>
          <p className="text-gray-500 mt-1">监控和管理投资组合风险</p>
        </div>
        <Button onClick={() => router.push('/risks/new')}>
          创建风险评估
        </Button>
      </div>

      {/* 风险统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总风险数</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRisks}</div>
            <p className="text-xs text-muted-foreground">
              监控中的风险点
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃风险</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRisks}</div>
            <p className="text-xs text-muted-foreground">
              需要关注的风险
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">严重风险</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.criticalRisks}</div>
            <p className="text-xs text-muted-foreground">
              需要立即处理
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均风险评分</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRiskScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              满分100分
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 风险暴露分析 */}
      {exposure && (
        <Card>
          <CardHeader>
            <CardTitle>风险暴露分析</CardTitle>
            <CardDescription>投资组合的风险暴露情况</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">组合总价值</p>
                <p className="text-xl font-bold">¥{(exposure.totalValue / 10000).toFixed(2)}万</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-500">风险暴露价值</p>
                <p className="text-xl font-bold text-red-500">¥{(exposure.atRiskValue / 10000).toFixed(2)}万</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-500">风险暴露比例</p>
                <p className="text-xl font-bold text-yellow-600">{(exposure.riskExposureRatio * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>风险暴露</span>
                <span>{(exposure.riskExposureRatio * 100).toFixed(1)}%</span>
              </div>
              <Progress value={exposure.riskExposureRatio * 100} className="h-2" />
              <p className="text-xs text-gray-500">
                {exposure.riskExposureRatio < 0.3 ? '风险暴露较低，组合相对安全' :
                 exposure.riskExposureRatio < 0.6 ? '风险暴露适中，需要关注' :
                 '风险暴露较高，建议调整仓位'}
              </p>
            </div>

            {exposure.positionExposures.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">个券风险暴露</h4>
                <div className="space-y-2">
                  {exposure.positionExposures
                    .filter(pos => pos.riskValue > 0)
                    .sort((a, b) => b.riskValue - a.riskValue)
                    .map((position, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{position.symbol}</p>
                          <p className="text-sm text-gray-500">
                            持仓价值: ¥{(position.value / 10000).toFixed(2)}万
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-500">
                            ¥{(position.riskValue / 10000).toFixed(2)}万
                          </p>
                          <p className="text-sm text-gray-500">
                            {(position.riskRatio * 100).toFixed(0)}% 风险
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 主要风险因子 */}
      {stats.topRiskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>主要风险因子</CardTitle>
            <CardDescription>需要重点关注的风险因素</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topRiskFactors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">{factor.name}</span>
                  </div>
                  <Badge variant="secondary">{factor.count} 次</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最近的风险提醒 */}
      {recentRisks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近风险提醒</CardTitle>
            <CardDescription>需要关注的风险事件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRisks.map((risk) => (
                <div key={risk.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{risk.title}</h4>
                      <Badge 
                        className={`${riskLevelColors[risk.riskLevel]} text-white`}
                      >
                        {risk.riskLevel === 'critical' ? '严重' :
                         risk.riskLevel === 'high' ? '高' :
                         risk.riskLevel === 'medium' ? '中' : '低'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>股票: {risk.position?.symbol || '组合级别'}</span>
                      <span>类型: {riskTypeLabels[risk.riskType]}</span>
                      <span>评分: {risk.riskScore.toFixed(0)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/risks/${risk.id}`)}
                  >
                    查看详情
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 风险分布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 按类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle>风险类型分布</CardTitle>
            <CardDescription>按风险类型统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.riskByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span>{riskTypeLabels[type as keyof typeof riskTypeLabels]}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 按等级分布 */}
        <Card>
          <CardHeader>
            <CardTitle>风险等级分布</CardTitle>
            <CardDescription>按风险等级统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.riskByLevel).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${riskLevelColors[level as keyof typeof riskLevelColors]}`}></div>
                    <span className={`font-medium ${riskLevelTextColors[level as keyof typeof riskLevelTextColors]}`}>
                      {level === 'critical' ? '严重' :
                       level === 'high' ? '高' :
                       level === 'medium' ? '中等' : '低'}
                    </span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作建议 */}
      <Card>
        <CardHeader>
          <CardTitle>操作建议</CardTitle>
          <CardDescription>基于当前风险状况的建议</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.criticalRisks > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>严重风险警告</AlertTitle>
                <AlertDescription>
                  发现 {stats.criticalRisks} 个严重风险，建议立即审查并采取措施。
                </AlertDescription>
              </Alert>
            )}

            {exposure && exposure.riskExposureRatio > 0.6 && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>风险暴露过高</AlertTitle>
                <AlertDescription>
                  风险暴露比例达到 {(exposure.riskExposureRatio * 100).toFixed(1)}%，建议调整仓位配置，降低高风险持仓。
                </AlertDescription>
              </Alert>
            )}

            {stats.avgRiskScore > 60 && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>平均风险评分较高</AlertTitle>
                <AlertDescription>
                  平均风险评分为 {stats.avgRiskScore.toFixed(1)} 分，建议加强风险监控和预警。
                </AlertDescription>
              </Alert>
            )}

            {stats.criticalRisks === 0 && exposure && exposure.riskExposureRatio < 0.6 && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>风险状况良好</AlertTitle>
                <AlertDescription>
                  当前风险状况在可控范围内，继续保持监控即可。
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}