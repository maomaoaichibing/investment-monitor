import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import { db } from '@/lib/db'
import PillarsTree from '@/components/thesis/pillars-tree'
import MonitorPlanView from '@/components/monitor-plan/MonitorPlanView'
import { HealthScoreRing } from '@/components/dashboard/health-score-ring'
import { ThinkingProcess } from '@/components/ui/thinking-process'
import { thesisToThinkingSteps, pillarsToHealthScoreSteps } from '@/lib/thesis-thinking-steps'

interface ThesisDetailPageProps {
  params: {
    id: string
  }
}

export default async function ThesisDetailPage({ params }: ThesisDetailPageProps) {
  // 从数据库获取Thesis详情
  const thesis = await db.thesis.findUnique({
    where: { id: params.id },
    include: {
      position: {
        select: {
          id: true,
          symbol: true,
          assetName: true,
          market: true,
          costPrice: true,
          quantity: true
        }
      },
      portfolio: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  // 如果Thesis不存在，返回404
  if (!thesis) {
    notFound()
  }

  // 获取该持仓的最近 alerts
  const alerts = await db.alert.findMany({
    where: {
      positionId: thesis.positionId
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  // 解析JSON字段
  let pillars: any[] = []
  try {
    pillars = thesis.pillarsJson ? JSON.parse(thesis.pillarsJson) : []
  } catch {
    pillars = []
  }

  // 生成思维过程步骤
  const thinkingSteps = thesisToThinkingSteps({
    id: thesis.id,
    summary: thesis.summary || '',
    healthScore: thesis.healthScore || 80,
    pillarsJson: thesis.pillarsJson || '[]',
    fragilePointsJson: thesis.fragilePointsJson || '[]',
    coreThesisJson: thesis.coreThesisJson || '[]',
    pricePhasesJson: thesis.pricePhasesJson || '[]',
    position: thesis.position
  })

  // 生成健康度评分分解步骤
  const healthScoreSteps = pillarsToHealthScoreSteps(pillars, thesis.healthScore || 80)

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  const healthScore = thesis.healthScore || 80
  // 获取健康度等级
  const getHealthLevel = (score: number) => {
    if (score >= 70) return { label: '健康', color: 'text-green-500' }
    if (score >= 40) return { label: '预警', color: 'text-yellow-500' }
    return { label: '危机', color: 'text-red-500' }
  }
  // 获取健康度图标
  const getHealthEmoji = (score: number) => {
    if (score >= 70) return '🟢'
    if (score >= 40) return '🟡'
    return '🔴'
  }
  const healthLevel = getHealthLevel(healthScore)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部导航 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/theses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回论题列表
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/portfolios/${thesis.portfolio.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回组合
          </Link>
        </Button>
      </div>

      {/* 顶部区域 - 股票信息 + 健康度 */}
      <Card className="mb-6 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* 左侧：股票信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  {thesis.position.assetName}
                  <Badge variant="outline" className="text-lg px-2">
                    {thesis.position.symbol}
                  </Badge>
                </h1>
                <Badge variant="secondary">{thesis.position.market}</Badge>
              </div>

              <p className="text-lg text-muted-foreground mb-4">
                {thesis.summary}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {investmentStyleLabels[thesis.investmentStyle] || thesis.investmentStyle}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {holdingPeriodLabels[thesis.holdingPeriod] || thesis.holdingPeriod}
                </span>
                <span>·</span>
                <span>生成于 {formatDate(thesis.createdAt)}</span>
                <Badge variant={thesis.status === 'generated' ? 'default' : 'outline'}>
                  {thesis.status === 'generated' ? '已生成' : thesis.status}
                </Badge>
              </div>
            </div>

            {/* 右侧：健康度大号显示 */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <HealthScoreRing score={healthScore} size={80} strokeWidth={8} />
              <div>
                <div className="text-sm text-muted-foreground">论点健康度</div>
                <div className={`text-2xl font-bold ${healthLevel.color}`}>
                  {getHealthEmoji(healthScore)} {healthScore}
                </div>
                <div className="text-sm text-muted-foreground">
                  {pillars.length} 个议题
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 分析过程回放 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            🧠 AI 分析过程
          </CardTitle>
          <CardDescription>
            查看 AI 生成此论题时的完整分析思路
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThinkingProcess
            steps={thinkingSteps}
            title={`AI 分析 ${thesis.position.assetName} 的投资论题`}
            progress={100}
            variant="card"
            defaultExpanded={false}
          />
        </CardContent>
      </Card>

      {/* 健康度评分分解 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            📊 评分分解
          </CardTitle>
          <CardDescription>
            各投资支柱对综合健康度的贡献分析
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThinkingProcess
            steps={healthScoreSteps}
            title="健康度评分详情"
            progress={100}
            variant="card"
            defaultExpanded={true}
          />
        </CardContent>
      </Card>

      {/* 议题树区域 */}
      <div className="mb-6">
        <PillarsTree pillars={pillars} thesisId={thesis.id} />
      </div>

      {/* Monitor Plan 区域 */}
      <div className="mb-6">
        <MonitorPlanView thesisId={thesis.id} />
      </div>

      {/* 时间线区域 - 最近事件 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            最近动态
          </CardTitle>
          <CardDescription>
            该论题的最新事件和提醒
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无相关动态
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className={`mt-1 ${
                    alert.level === 'urgent' || alert.level === 'important'
                      ? 'text-red-500'
                      : alert.level === 'watch'
                        ? 'text-yellow-500'
                        : 'text-blue-500'
                  }`}>
                    {alert.level === 'urgent' || alert.level === 'important' ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{alert.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          alert.level === 'urgent' ? 'bg-red-100 text-red-800' :
                          alert.level === 'important' ? 'bg-orange-100 text-orange-800' :
                          alert.level === 'watch' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {alert.level === 'urgent' ? '紧急' :
                         alert.level === 'important' ? '重要' :
                         alert.level === 'watch' ? '观察' : '信息'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.summary}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 右侧边栏信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 持仓信息 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">持仓信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">持仓数量</span>
                <span className="font-medium">{thesis.position.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">成本价</span>
                <span className="font-medium">¥{thesis.position.costPrice?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">所属组合</span>
                <Link
                  href={`/portfolios/${thesis.portfolio.id}`}
                  className="font-medium hover:text-primary flex items-center gap-1"
                >
                  {thesis.portfolio.name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">状态信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">生成状态</span>
                <div className="flex items-center gap-2">
                  {thesis.status === 'generated' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">生成成功</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-600 font-medium">生成失败</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">创建时间</span>
                <span className="font-medium">{formatDate(thesis.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">最后更新</span>
                <span className="font-medium">{formatDate(thesis.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
