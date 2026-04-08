'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Brain,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Hash,
  DollarSign,
  Calendar,
  Briefcase,
  ExternalLink
} from 'lucide-react'

interface PositionInfo {
  id: string
  symbol: string
  assetName: string
  market: string
  costPrice: number
  quantity: number
  positionWeight: number
  portfolio: {
    id: string
    name: string
  }
}

interface ThesisGenerationLiveProps {
  positionId: string
  symbol: string
  assetName: string
  onComplete?: (thesisId: string) => void
}

interface Step {
  id: string
  label: string
  status: string
  result?: string
  duration?: number
}

const INITIAL_STEPS: Step[] = [
  { id: 'fetch_position', label: '检索持仓和公司数据...', status: 'pending' },
  { id: 'analyze_fundamentals', label: '分析公司基本面...', status: 'pending' },
  { id: 'analyze_industry', label: '分析行业竞争格局...', status: 'pending' },
  { id: 'identify_pillars', label: '识别核心投资支柱...', status: 'pending' },
  { id: 'set_risk_triggers', label: '设定风险触发条件...', status: 'pending' },
  { id: 'identify_fragile_points', label: '识别脆弱点...', status: 'pending' },
  { id: 'calculate_health', label: '计算健康评分...', status: 'pending' },
]

interface SSEMessage {
  event: string
  stepId?: string
  status?: string
  label?: string
  result?: string
  duration?: number
  positionId?: string
  symbol?: string
  assetName?: string
  healthScore?: number
  error?: string
}

function ThesisGenerationLive({
  positionId,
  symbol,
  assetName,
  onComplete
}: ThesisGenerationLiveProps) {
  const [steps, setSteps] = useState(INITIAL_STEPS)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [finalResult, setFinalResult] = useState<{
    healthScore: number
    thesisId: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateStep = (stepId: string, updates: { status: string; label?: string; result?: string; duration?: number }) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }

  const calculateProgress = () => {
    const doneCount = steps.filter(s => s.status === 'done').length
    return Math.round((doneCount / steps.length) * 100)
  }

  const startGeneration = async () => {
    setIsGenerating(true)
    setIsComplete(false)
    setFinalResult(null)
    setError(null)
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' as const })))

    try {
      const response = await fetch('/api/theses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('无法获取响应流')

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data: SSEMessage = JSON.parse(line.slice(6))

            if (data.event === 'step' && data.stepId && data.status) {
              updateStep(data.stepId, {
                status: data.status,
                label: data.label || steps.find(s => s.id === data.stepId)?.label || '',
                result: data.result,
                duration: data.duration
              })
            }

            if (data.event === 'complete') {
              setIsComplete(true)
              const thesisId = data.positionId || positionId
              setFinalResult({
                healthScore: data.healthScore || 0,
                thesisId
              })
              if (onComplete && thesisId) {
                onComplete(thesisId)
              }
            }

            if (data.event === 'error') {
              throw new Error(data.error || '生成失败')
            }
          } catch (parseError) {
            // Ignore parse errors for partial JSON
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      setSteps(prev => prev.map(step =>
        step.status === 'running' ? { ...step, status: 'error' as const } : step
      ))
    } finally {
      setIsGenerating(false)
    }
  }

  // 初始状态：显示开始按钮
  if (!isGenerating && !isComplete && !error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            生成投资论题
          </CardTitle>
          <CardDescription>
            为 {symbol} {assetName} 生成结构化投资分析论题
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">AI 将分析以下内容：</span>
            </div>
            <ul className="space-y-1 text-muted-foreground ml-6 list-disc">
              <li>公司基本面与财务数据</li>
              <li>行业竞争格局与市场地位</li>
              <li>核心投资支柱识别</li>
              <li>风险触发条件设定</li>
              <li>综合健康评分计算</li>
            </ul>
          </div>
          <Button onClick={startGeneration} className="w-full">
            <Brain className="h-4 w-4 mr-2" />
            开始 AI 分析
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 完成状态
  if (isComplete && finalResult) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            论题生成完成
          </CardTitle>
          <CardDescription className="text-green-600">
            已为 {symbol} {assetName} 生成完整的投资论题
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div>
              <div className="text-sm text-muted-foreground">综合健康评分</div>
              <div className={`text-2xl font-bold ${
                finalResult.healthScore >= 70 ? 'text-green-600' :
                finalResult.healthScore >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {finalResult.healthScore}/100
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={startGeneration}>
                重新生成
              </Button>
              <Button asChild>
                <Link href={`/theses/${finalResult.thesisId}`}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  查看论题
                </Link>
              </Button>
            </div>
          </div>

          {/* 步骤状态 */}
          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                {step.status === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : step.status === 'running' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted shrink-0" />
                )}
                <span className={step.status === 'done' ? 'text-green-700' : step.status === 'running' ? 'text-blue-700' : 'text-muted-foreground'}>
                  {step.label.replace('...', '')}
                </span>
                {step.result && (
                  <span className="text-xs text-muted-foreground ml-2">{step.result.split('\n')[0]}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 错误状态
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            生成失败
          </CardTitle>
          <CardDescription className="text-red-600">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={startGeneration}>
              <Brain className="h-4 w-4 mr-2" />
              重试
            </Button>
            <Button variant="outline" asChild>
              <Link href="/portfolios">
                返回组合
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 进行中状态
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 animate-pulse" />
          AI 正在分析中
        </CardTitle>
        <CardDescription>
          正在为 {symbol} {assetName} 生成投资论题，请稍候...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">分析进度</span>
            <span className="font-medium">{calculateProgress()}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        {/* 步骤状态 */}
        <div className="space-y-2">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 text-sm">
              {step.status === 'done' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              ) : step.status === 'running' ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
              ) : step.status === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted shrink-0" />
              )}
              <span className={step.status === 'done' ? 'text-green-700' : step.status === 'running' ? 'text-blue-700' : 'text-muted-foreground'}>
                {step.label}
              </span>
              {step.result && (
                <span className="text-xs text-muted-foreground ml-2 truncate">{step.result.split('\n')[0]}</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>AI 正在思考中，请勿关闭页面...</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ThesisGenerateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const positionId = searchParams.get('positionId')

  const [position, setPosition] = useState<PositionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!positionId) {
      setError('缺少 positionId 参数')
      setLoading(false)
      return
    }

    fetchPosition()
  }, [positionId])

  const fetchPosition = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/positions/${positionId}`)
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('未找到该持仓，请检查持仓是否已删除')
        }
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      const posData = data.data || data
      setPosition({
        id: posData.id,
        symbol: posData.symbol,
        assetName: posData.assetName,
        market: posData.market,
        costPrice: posData.costPrice,
        quantity: posData.quantity,
        positionWeight: posData.positionWeight,
        portfolio: posData.portfolio || { id: '', name: '未知组合' }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取持仓信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = (thesisId: string) => {
    // 3秒后自动跳转到论题详情
    setTimeout(() => {
      router.push(`/theses/${thesisId}`)
    }, 3000)
  }

  if (!positionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">缺少持仓参数</h3>
              <p className="text-muted-foreground mb-6">
                请从持仓详情页进入投资论题生成页面
              </p>
              <Button asChild>
                <Link href="/portfolios">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回投资组合
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">加载持仓信息...</span>
        </div>
      </div>
    )
  }

  if (error || !position) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">加载失败</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={fetchPosition}>
                  重试
                </Button>
                <Button asChild>
                  <Link href="/portfolios">
                    返回组合
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/positions/${position.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回持仓详情
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4" />
          <Link href={`/portfolios/${position.portfolio.id}`} className="hover:text-primary">
            {position.portfolio.name}
          </Link>
        </div>
      </div>

      {/* 持仓信息卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-2">{position.symbol}</Badge>
            <span>{position.assetName}</span>
          </CardTitle>
          <CardDescription>生成投资论题前确认持仓信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">持仓数量</span>
              <span className="font-medium ml-auto">{position.quantity.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">成本价</span>
              <span className="font-medium ml-auto">¥{position.costPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">市场</span>
              <Badge variant="secondary" className="ml-auto">{position.market}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">权重</span>
              <span className="font-medium ml-auto">{position.positionWeight}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 生成组件 */}
      <ThesisGenerationLive
        positionId={position.id}
        symbol={position.symbol}
        assetName={position.assetName}
        onComplete={handleComplete}
      />
    </div>
  )
}

export default function ThesisGeneratePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">加载中...</span>
        </div>
      </div>
    }>
      <ThesisGenerateContent />
    </Suspense>
  )
}
