'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Brain } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PositionWarning {
  symbol: string; name: string; reason: string
}

interface DashboardStats {
  portfolioCount: number
  positionCount: number
  avgHealthScore: number
  healthyCount: number
  warningCount: number
  weeklyAnalysisCount: number
}

interface ProfitSummary {
  amount: number
  percent: number
  changePercent: number
}

interface DecisionStatsProps {
  initialStats?: DashboardStats
  initialProfit?: ProfitSummary
}

export default function DecisionStats({ initialStats, initialProfit }: DecisionStatsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(initialStats || null)
  const [profit, setProfit] = useState<ProfitSummary | null>(initialProfit || null)
  const [loading, setLoading] = useState(!initialStats)

  useEffect(() => {
    if (initialStats) return
    async function load() {
      setLoading(true)
      try {
        const r = await fetch('/api/dashboard/overview')
        const d = await r.json()
        if (d.success) {
          setStats(d.data.stats)
          setProfit(d.data.profitSummary)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  // Health ring SVG component
  const HealthRing = ({ score }: { score: number }) => {
    const getArcColor = (s: number) => {
      if (s >= 70) return 'text-green-500'
      if (s >= 40) return 'text-yellow-500'
      return 'text-red-500'
    }
    const getTextColor = (s: number) => {
      if (s >= 70) return 'text-green-600'
      if (s >= 40) return 'text-yellow-600'
      return 'text-red-600'
    }
    return (
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={`${score}, 100`} strokeLinecap="round" className={getArcColor(score)} />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${getTextColor(score)}`}>
          {score}
        </span>
      </div>
    )
  }

  const formatAmount = (amount: number) => {
    const prefix = amount >= 0 ? '+' : '-'
    return `${prefix}¥${Math.abs(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const cards = [
    {
      title: '今日盈亏',
      value: profit ? formatAmount(profit.amount) : '—',
      subValue: profit ? `${profit.percent >= 0 ? '+' : ''}${profit.percent}%` : '—',
      subText: profit ? `较昨日 ${profit.changePercent >= 0 ? '+' : ''}${profit.changePercent}%` : '加载中...',
      icon: profit && profit.amount >= 0 ? TrendingUp : TrendingDown,
      iconColor: profit && profit.amount >= 0 ? 'text-red-500' : 'text-green-500',
      bgColor: profit && profit.amount >= 0 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20',
      valueColor: profit && profit.amount >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
      isProfit: true
    },
    {
      title: '需关注持仓',
      value: stats ? (stats.warningCount > 0 ? stats.warningCount.toString() : '0') : '—',
      subValue: stats ? (stats.warningCount > 0 ? '需要关注' : '全部健康') : '—',
      subText: stats ? `${stats.warningCount}个持仓有异常信号` : '—',
      icon: AlertTriangle,
      iconColor: stats && stats.warningCount > 0 ? 'text-orange-500' : 'text-green-500',
      bgColor: stats && stats.warningCount > 0 ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-green-50 dark:bg-green-950/20',
      valueColor: stats && stats.warningCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400',
      isWarning: true
    },
    {
      title: '论点健康度',
      value: stats ? stats.avgHealthScore.toString() : '—',
      subValue: stats ? `${stats.healthyCount}个健康 / ${stats.warningCount}个需关注` : '—',
      subText: '平均分数',
      icon: Shield,
      iconColor: stats ? (stats.avgHealthScore >= 70 ? 'text-green-500' : stats.avgHealthScore >= 40 ? 'text-yellow-500' : 'text-red-500') : 'text-gray-500',
      bgColor: 'bg-slate-50 dark:bg-slate-950/20',
      valueColor: stats ? (stats.avgHealthScore >= 70 ? 'text-green-600' : stats.avgHealthScore >= 40 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-600',
      isHealthScore: true,
      healthScore: stats?.avgHealthScore || 85,
      healthRing: <HealthRing score={stats?.avgHealthScore || 85} />
    },
    {
      title: 'AI 本周分析',
      value: stats ? stats.weeklyAnalysisCount.toString() : '—',
      subValue: '本周累计',
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
      {cards.map((stat) => (
        <Card key={stat.title} className={stat.bgColor}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {stat.isHealthScore && stat.healthRing}
              {!stat.isHealthScore && (
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-2xl font-bold ${stat.valueColor}`}>
                  {loading ? '—' : stat.value}
                </div>
                <p className={`text-xs font-medium ${stat.valueColor} opacity-80`}>
                  {stat.subValue}
                </p>
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
