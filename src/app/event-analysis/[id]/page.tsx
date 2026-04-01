import React from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, CheckCircle, Clock, TrendingDown, TrendingUp, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// 影响方向标签映射
const thesisImpactLabels: Record<string, string> = {
  strengthen: '强化',
  maintain: '维持',
  weaken: '弱化',
  reverse: '反转'
}

// 影响方向颜色映射
const thesisImpactColors: Record<string, string> = {
  strengthen: 'bg-green-100 text-green-800',
  maintain: 'bg-blue-100 text-blue-800',
  weaken: 'bg-yellow-100 text-yellow-800',
  reverse: 'bg-red-100 text-red-800'
}

// 影响等级颜色映射
const impactLevelColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
}

// 影响等级图标映射
const impactLevelIcons: Record<string, React.ReactNode> = {
  high: <TrendingDown className="h-4 w-4 text-red-600" />,
  medium: <AlertCircle className="h-4 w-4 text-yellow-600" />,
  low: <TrendingUp className="h-4 w-4 text-green-600" />
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取相关度颜色
const getRelevanceColor = (score: number) => {
  if (score >= 0.8) return 'text-green-600'
  if (score >= 0.5) return 'text-yellow-600'
  return 'text-red-600'
}

async function getEventAnalysis(id: string) {
  try {
    const response = await fetch(`http://localhost:4001/api/event-analysis/${id}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.success ? result.data : null
  } catch (error) {
    console.error('Error fetching event analysis:', error)
    return null
  }
}

export default async function EventAnalysisDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { id } = params
  const analysis = await getEventAnalysis(id)

  if (!analysis) {
    notFound()
  }

  // 获取影响方向标签
  const getThesisImpactLabel = (impact: string) => {
    return thesisImpactLabels[impact] || impact
  }

  // 获取影响方向颜色
  const getThesisImpactColor = (impact: string) => {
    return thesisImpactColors[impact] || 'bg-gray-100 text-gray-800'
  }

  // 获取影响等级颜色
  const getImpactLevelColor = (level: string) => {
    return impactLevelColors[level] || 'bg-gray-100 text-gray-800'
  }

  // 获取影响等级图标
  const getImpactLevelIcon = (level: string) => {
    return impactLevelIcons[level] || <AlertCircle className="h-4 w-4" />
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回事件列表
          </Link>
        </Button>
      </div>

      {/* 分析概览卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <Badge className={getThesisImpactColor(analysis.thesisImpact)}>
                {getThesisImpactLabel(analysis.thesisImpact)}
              </Badge>
              <Badge className={getImpactLevelColor(analysis.impactLevel)}>
                {getImpactLevelIcon(analysis.impactLevel)}
                <span className="ml-1">
                  {analysis.impactLevel === 'high' ? '高' :
                   analysis.impactLevel === 'medium' ? '中' : '低'}影响
                </span>
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              ID: {analysis.id}
            </div>
          </div>

          <CardTitle className="text-2xl mb-2">
            事件影响分析
          </CardTitle>

          <CardDescription>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">{analysis.event?.symbol}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`font-bold ${getRelevanceColor(analysis.relevanceScore)}`}>
                  相关度: {(analysis.relevanceScore * 100).toFixed(0)}%
                </span>
              </div>
              {analysis.alertCount > 0 && (
                <div className="flex items-center gap-1 text-destructive">
                  <XCircle className="h-4 w-4" />
                  {analysis.alertCount} 提醒
                </div>
              )}
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">事件</div>
              <div className="font-medium">{analysis.event?.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {analysis.event?.eventType}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">持仓</div>
              <div className="font-medium">{analysis.position?.assetName}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {analysis.position?.symbol}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">论题</div>
              <div className="font-medium">{analysis.thesis?.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                健康度: {analysis.thesis?.healthScore}%
              </div>
            </div>
          </div>

          {/* 推理分析 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              推理分析
            </h3>
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-gray max-w-none">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {analysis.reasoning}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 证据列表 */}
          {analysis.evidenceJson && analysis.evidenceJson.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                证据支持
              </h3>
              <Card>
                <CardContent className="pt-6">
                  <ul className="space-y-2">
                    {analysis.evidenceJson.map((evidence: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 行动框架 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              行动框架
            </h3>
            <Card>
              <CardContent className="pt-6">
                <Alert>
                  <AlertTitle>投资建议</AlertTitle>
                  <AlertDescription>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {analysis.actionFramework}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* 时间信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>创建时间: {formatDateTime(analysis.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>更新时间: {formatDateTime(analysis.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href={`/alerts?eventAnalysisId=${analysis.id}`}>
            <AlertCircle className="h-4 w-4 mr-2" />
            查看相关提醒 ({analysis.alertCount})
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/theses/${analysis.thesisId}`}>
            查看论题详情
          </Link>
        </Button>
      </div>
    </div>
  )
}

// 404页面
export function generateStaticParams() {
  return []
}
