'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThinkingProcess, ThinkingStep } from '@/components/ui/thinking-process'
import { Brain, Loader2, CheckCircle2 } from 'lucide-react'

interface ThesisGenerationLiveProps {
  positionId: string
  symbol: string
  assetName: string
  onComplete?: (thesisId: string) => void
}

// 初始步骤定义
const INITIAL_STEPS: ThinkingStep[] = [
  { id: 'fetch_position', label: '检索持仓和公司数据...', status: 'pending' },
  { id: 'analyze_fundamentals', label: '分析公司基本面...', status: 'pending' },
  { id: 'analyze_industry', label: '分析行业竞争格局...', status: 'pending' },
  { id: 'identify_pillars', label: '识别核心投资支柱...', status: 'pending' },
  { id: 'set_risk_triggers', label: '设定风险触发条件...', status: 'pending' },
  { id: 'identify_fragile_points', label: '识别脆弱点...', status: 'pending' },
  { id: 'calculate_health', label: '计算健康评分...', status: 'pending' },
]

// SSE 事件类型
interface SSEMessage {
  event: string
  stepId?: string
  status?: string
  label?: string
  result?: string
  duration?: number
  timestamp?: number
  positionId?: string
  thesisId?: string
  symbol?: string
  assetName?: string
  healthScore?: number
  error?: string
}

export function ThesisGenerationLive({
  positionId,
  symbol,
  assetName,
  onComplete
}: ThesisGenerationLiveProps) {
  const [steps, setSteps] = useState<ThinkingStep[]>(INITIAL_STEPS)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [finalResult, setFinalResult] = useState<{
    healthScore: number
    thesisId: string
  } | null>(null)

  // 更新步骤状态
  const updateStep = useCallback((stepId: string, updates: Partial<ThinkingStep>) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }, [])

  // 计算进度
  const calculateProgress = useCallback(() => {
    const doneCount = steps.filter(s => s.status === 'done').length
    return Math.round((doneCount / steps.length) * 100)
  }, [steps])

  // 开始生成
  const startGeneration = async () => {
    setIsGenerating(true)
    setIsComplete(false)
    setFinalResult(null)
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' as const })))

    try {
      const response = await fetch('/api/theses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('无法获取响应流')
      }

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
                status: data.status as ThinkingStep['status'],
                label: data.label || steps.find(s => s.id === data.stepId)?.label || '',
                result: data.result,
                duration: data.duration
              })
            }

            if (data.event === 'complete') {
              setIsComplete(true)
              const thesisId = data.thesisId || data.positionId || positionId
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
            console.error('解析 SSE 数据失败:', parseError)
          }
        }
      }
    } catch (error) {
      console.error('论题生成失败:', error)
      // 将所有 running 步骤标记为 error
      setSteps(prev => prev.map(step =>
        step.status === 'running' ? { ...step, status: 'error' as const } : step
      ))
    } finally {
      setIsGenerating(false)
    }
  }

  // 渲染按钮或进行中状态
  if (!isGenerating && !isComplete) {
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
        <CardContent>
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
        <CardContent>
          <div className="space-y-4">
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
              <Button variant="outline" onClick={startGeneration}>
                重新生成
              </Button>
            </div>

            <ThinkingProcess
              steps={steps}
              title={`AI 分析 ${assetName} 的投资论题`}
              progress={100}
              variant="card"
              defaultExpanded={false}
            />
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
      <CardContent>
        <ThinkingProcess
          steps={steps}
          title={`AI 正在分析 ${assetName}...`}
          progress={calculateProgress()}
          variant="fullpage"
        />

        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>AI 正在思考中，请勿关闭页面...</span>
        </div>
      </CardContent>
    </Card>
  )
}
