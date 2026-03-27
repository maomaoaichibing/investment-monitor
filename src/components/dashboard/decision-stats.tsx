'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Brain } from 'lucide-react'
import { useEffect, useState } from 'react'

// Mock 今日盈亏数据
// TODO: Replace with API call: GET /api/dashboard/profit-summary
const mockProfitData = {
  amount: 2340.50,
  percent: 1.2,
  changePercent: 0.3
}

// Mock AI 本周分析次数
// TODO: Replace with API call: GET /api/analytics/weekly-count
const mockAICountData = {
  weeklyCount: 12,
  lastAnalysisTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2小时前
}

// 持仓预警数据
interface PositionWarning {
  symbol: string
  name: string
  reason: string
}

interface DashboardStatsProps {
  portfolioCount: number
  positionCount: number
  avgHealthScore: number
  healthyCount: number
  warningCount: number
  warningPositions: PositionWarning[]
}

export default function DecisionStats({
  portfolioCount,
  positionCount,
  avgHealthScore,
  healthyCount,
  warningCount,
  warningPositions
}: DashboardStatsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 格式化相对时间
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  // 格式化金额
  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount)
    const prefix = amount >= 0 ? '+' : '-'
    return `${prefix}¥${absAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // 健康度环形进度条 - 使用用户提供的SVG实现
  const HealthRing = ({ score }: { score: number }) => {
    const getColor = (s: number) => {
      if (s >= 70) return 'text-green-500'
      if (s >= 40) return 'text-yellow-500'
      return 'text-red-500'
    }

    const color = getColor(score)

    if (!mounted) {
      return (
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-4 border-muted animate-pulse" />
        </div>
      )
    }

    return (
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
          {/* 灰色底圈 */}
          <path
            className="text-muted stroke-current"
            fill="none"
            strokeWidth="3"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* 进度弧 */}
          <path
            className={`${color} stroke-current`}
            fill="none"
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        {/* 中间数字 */}
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${color}`}>
          {score}
        </span>
      </div>
    )
  }

  // 数据一致性修复：需关注持仓显示2（因为AI动态有NIO紧急和00883预警）
  const hasWarnings = warningCount > 0

  const stats = [
    // 卡片1：今日盈亏
    {
      title: '今日盈亏',
      value: formatAmount(mockProfitData.amount),
      subValue: `${mockProfitData.amount >= 0 ? '+' : ''}${mockProfitData.percent}%`,
      subText: `较昨日 ${mockProfitData.changePercent >= 0 ? '+' : ''}${mockProfitData.changePercent}%`,
      icon: mockProfitData.amount >= 0 ? TrendingUp : TrendingDown,
      iconColor: mockProfitData.amount >= 0 ? 'text-red-500' : 'text-green-500',
      bgColor: mockProfitData.amount >= 0 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20',
      valueColor: mockProfitData.amount >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
      isProfit: true
    },
    // 卡片2：需关注持仓 - 数据一致性修复
    {
      title: '需关注持仓',
      value: hasWarnings ? warningCount.toString() : '0',
      subValue: hasWarnings ? '需要关注' : '全部健康',
      subText: hasWarnings ? `${warningPositions.length}个持仓有异常信号` : '无异常信号',
      icon: AlertTriangle,
      iconColor: hasWarnings ? 'text-orange-500' : 'text-green-500',
      bgColor: hasWarnings ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-green-50 dark:bg-green-950/20',
      valueColor: hasWarnings ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400',
      isWarning: hasWarnings
    },
    // 卡片3：论点健康度 - 数据一致性修复
    {
      title: '论点健康度',
      value: avgHealthScore.toString(),
      subValue: `${healthyCount}个健康 / ${warningCount}个需关注`,
      subText: '平均分数',
      icon: Shield,
      iconColor: avgHealthScore >= 70 ? 'text-green-500' : avgHealthScore >= 40 ? 'text-yellow-500' : 'text-red-500',
      bgColor: 'bg-slate-50 dark:bg-slate-950/20',
      valueColor: avgHealthScore >= 70 ? 'text-green-600' : avgHealthScore >= 40 ? 'text-yellow-600' : 'text-red-600',
      isHealthScore: true,
      healthScore: avgHealthScore,
      healthRing: <HealthRing score={avgHealthScore} />
    },
    // 卡片4：AI 本周分析
    {
      title: 'AI 本周分析',
      value: mockAICountData.weeklyCount.toString(),
      subValue: `最近分析 ${formatRelativeTime(mockAICountData.lastAnalysisTime)}`,
      subText: '让系统持续运转',
      icon: Brain,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      valueColor: 'text-purple-600 dark:text-purple-400',
      isAI: true
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className={stat.bgColor}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {/* 健康度环形进度条 */}
              {stat.isHealthScore && stat.healthRing}
              {/* 图标 */}
              {!stat.isHealthScore && (
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {/* 主要数值 */}
                <div className={`text-2xl font-bold ${stat.valueColor}`}>
                  {stat.value}
                </div>
                {/* 副标题 */}
                <p className={`text-xs font-medium ${stat.valueColor} opacity-80`}>
                  {stat.subValue}
                </p>
                {/* 底部说明 */}
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subText}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}