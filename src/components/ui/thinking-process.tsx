'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Brain
} from 'lucide-react'

// ==================== 类型定义 ====================

export type ThinkingStepStatus = 'pending' | 'running' | 'done' | 'error'

export interface ThinkingStep {
  id: string
  label: string
  status: ThinkingStepStatus
  result?: unknown
  duration?: number // 耗时（毫秒）
  children?: ThinkingStep[] // 子步骤（缩进显示）
}

export interface ThinkingProcessProps {
  steps: ThinkingStep[]
  title: string
  progress: number // 0-100 进度百分比
  variant?: 'fullpage' | 'card' | 'inline'
  onComplete?: () => void
  defaultExpanded?: boolean // 默认是否展开
}

// ==================== 工具函数 ====================

const formatDuration = (ms?: number): string => {
  if (!ms) return ''
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ==================== 单个步骤组件 ====================

interface StepItemProps {
  step: ThinkingStep
  isLast: boolean
  variant: 'fullpage' | 'card' | 'inline'
}

function StepItem({ step, isLast, variant }: StepItemProps) {
  const [expanded, setExpanded] = useState(false)

  // 状态图标
  const getStatusIcon = () => {
    switch (step.status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
      default:
        return <Circle className="h-5 w-5 text-muted-foreground/40" />
    }
  }

  // 状态文本样式
  const getLabelClass = () => {
    switch (step.status) {
      case 'done':
        return 'text-foreground'
      case 'running':
        return 'font-medium text-foreground'
      case 'error':
        return 'text-red-600'
      case 'pending':
      default:
        return 'text-muted-foreground/60'
    }
  }

  // 步骤文本样式
  const labelClass = getLabelClass()

  // 结果是否可展开（done 状态且有 result）
  const hasResult = !!step.result
  const isExpandable = step.status === 'done' && hasResult

  // 是否默认展开（running 状态）
  const shouldExpandByDefault = step.status === 'running'

  return (
    <div className="relative">
      {/* 竖线时间线 */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-[18px] top-8 w-0.5 h-full',
            step.status === 'done' ? 'bg-green-600' : 'bg-muted'
          )}
          style={{ minHeight: '24px' }}
        />
      )}

      {/* 步骤内容 */}
      <div className="flex items-start gap-3 py-1">
        {/* 状态图标 */}
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>

        {/* 标签 + 结果 */}
        <div className="flex-1 min-w-0">
          {/* 标签行 */}
          <div className="flex items-center gap-2">
            <span className={cn(labelClass, 'transition-colors')}>
              {step.label}
            </span>

            {/* 耗时 */}
            {step.duration && step.status === 'done' && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(step.duration)}
              </span>
            )}

            {/* 展开/收起按钮 */}
            {isExpandable && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {expanded ? '收起' : '展开'}
              </button>
            )}
          </div>

          {/* 展开的结果内容 */}
          {(expanded || shouldExpandByDefault) && hasResult && (
            <div
              className={cn(
                'mt-2 rounded-md p-3 border-l-2',
                'bg-muted/50 border-primary/30',
                'transition-all duration-300 ease-out',
                'animate-in fade-in slide-in-from-top-2'
              )}
            >
              {typeof step.result === 'string' ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {step.result}
                </p>
              ) : Array.isArray(step.result) ? (
                <div className="space-y-1">
                  {step.result.map((item: any, idx: number) => (
                    <p key={idx} className="text-sm text-foreground/80 whitespace-pre-wrap">
                      {typeof item === 'string' ? item : JSON.stringify(item)}
                    </p>
                  ))}
                </div>
              ) : step.result ? (
                <div className="text-sm text-foreground/80">
                  {(step.result as any)}
                </div>
              ) : null}
            </div>
          )}

          {/* 子步骤 */}
          {step.children && step.children.length > 0 && (
            <div className="mt-2 space-y-2 pl-4">
              {step.children.map((child, idx) => (
                <div key={child.id} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">→</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-xs',
                          child.status === 'done' ? 'text-foreground' : 'text-muted-foreground/60'
                        )}
                      >
                        {child.label}
                      </span>
                      {child.duration && child.status === 'done' && (
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(child.duration)}
                        </span>
                      )}
                    </div>
                    {child.status === 'done' && typeof child.result === 'string' && child.result ? (
                      <div className="mt-1 text-xs text-muted-foreground/80">
                        {child.result}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== 主组件 ====================

export function ThinkingProcess({
  steps,
  title,
  progress,
  variant = 'fullpage',
  onComplete,
  defaultExpanded = false
}: ThinkingProcessProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  // 计算是否有任何步骤在运行
  const isRunning = steps.some((s) => s.status === 'running')

  // 进度条动画
  const getProgressBarClass = () => {
    if (!isRunning && progress === 100) {
      return 'bg-green-500' // 完成状态
    }
    return 'bg-primary'
  }

  // 三种 variant 的样式配置
  const variantStyles = {
    fullpage: {
      container: 'max-w-2xl mx-auto p-6',
      title: 'text-lg',
      padding: 'p-6'
    },
    card: {
      container: '',
      title: 'text-base',
      padding: 'p-4'
    },
    inline: {
      container: '',
      title: 'text-sm',
      padding: 'p-2'
    }
  }

  const styles = variantStyles[variant]

  // 过滤显示的步骤（inline 模式只显示 running 和最近 1 个 done）
  const displaySteps =
    variant === 'inline'
      ? steps.filter((s) => s.status === 'running' || s.status === 'done').slice(-2)
      : steps

  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        variant !== 'inline' && styles.container,
        variant === 'inline' && 'border-transparent bg-transparent shadow-none'
      )}
    >
      {/* 可折叠头部 */}
      {variant !== 'inline' && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Brain
              className={cn(
                'h-5 w-5',
                isRunning && 'animate-pulse text-primary',
                !isRunning && 'text-muted-foreground'
              )}
            />
            <span className={cn('font-medium', styles.title)}>
              {title}
            </span>
            {!isRunning && progress === 100 && (
              <span className="text-green-600 text-sm ml-2">✅ 分析完成</span>
            )}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              expanded ? '' : '-rotate-90'
            )}
          />
        </button>
      )}

      {/* 展开内容 */}
      {variant === 'inline' || expanded ? (
        <div className={styles.padding}>
          {/* inline 模式的头部 */}
          {variant === 'inline' && (
            <div className="flex items-center gap-2 mb-3">
              <Brain
                className={cn(
                  'h-4 w-4',
                  isRunning && 'animate-pulse text-primary'
                )}
              />
              <span className={textClass}>{title}</span>
            </div>
          )}

          {/* 步骤列表 */}
          <div className="space-y-1">
            {displaySteps.map((step, idx) => (
              <StepItem
                key={step.id}
                step={step}
                isLast={idx === displaySteps.length - 1}
                variant={variant}
              />
            ))}
          </div>

          {/* 进度条 */}
          {variant !== 'inline' && (
            <div className="mt-4">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500 ease-out',
                    getProgressBarClass()
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">分析进度</span>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
            </div>
          )}
        </div>
      ) : variant === 'card' || variant === 'fullpage' ? (
        /* 折叠时只显示进度条 */
        <div className="px-4 pb-3">
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                getProgressBarClass()
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* 完成回调 */}
      {!isRunning && progress === 100 && onComplete && (
        <div className="hidden" onAnimationEnd={onComplete} />
      )}
    </div>
  )
}

// ==================== 辅助文本函数 ====================

const textClass = 'text-sm font-medium'
