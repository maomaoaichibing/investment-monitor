'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, TrendingUp, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react'
import { HealthScoreRing } from './health-score-ring'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// 关键指标类型
interface Indicator {
  name: string
  value: string
  trend: 'up' | 'down' | 'stable'
  status: 'healthy' | 'warning'
}

// 论题卡片类型
interface ThesisCardData {
  id: string
  title: string
  summary: string
  healthScore: number | null
  investmentStyle: string
  holdingPeriod: string
  updatedAt: string
  position: {
    id: string
    symbol: string
    assetName: string
  }
  indicators: Indicator[]
  aiComment: string
}

// Mock 数据 - 为现有持仓生成合理的指标数据
// TODO: Replace with API call: GET /api/thesis 或 GET /api/dashboard/thesis-cards
const mockTheses: ThesisCardData[] = [
  {
    id: '1',
    title: '美光科技投资论题',
    summary: '投资美光科技基于其在存储器市场的增长潜力，以及HBM技术带来的竞争优势',
    healthScore: 82,
    investmentStyle: 'growth',
    holdingPeriod: 'long_term',
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
    position: {
      id: '1',
      symbol: 'MU',
      assetName: '美光科技'
    },
    indicators: [
      { name: 'HBM市场份额', value: '28%', trend: 'up', status: 'healthy' },
      { name: 'DRAM均价', value: '$3.2', trend: 'stable', status: 'healthy' },
      { name: '季度营收增速', value: '15%', trend: 'up', status: 'healthy' }
    ],
    aiComment: '存储周期上行，论点健康'
  },
  {
    id: '2',
    title: '中国海洋石油投资论题',
    summary: '投资中国海洋石油基于其稳定的油气产量和受益于高油价的盈利能力',
    healthScore: 65,
    investmentStyle: 'value',
    holdingPeriod: 'medium_term',
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3小时前
    position: {
      id: '2',
      symbol: '00883',
      assetName: '中国海洋石油'
    },
    indicators: [
      { name: '布伦特原油', value: '$68', trend: 'down', status: 'warning' },
      { name: '日产量', value: '95万桶', trend: 'stable', status: 'healthy' },
      { name: '股息收益率', value: '5.2%', trend: 'stable', status: 'healthy' }
    ],
    aiComment: '油价接近风险触发价，需密切关注'
  },
  {
    id: '3',
    title: '蔚来投资论题',
    summary: '投资蔚来基于其在高端电动车市场的品牌定位和换电模式的差异化竞争',
    healthScore: 35,
    investmentStyle: 'momentum',
    holdingPeriod: 'short_term',
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1小时前
    position: {
      id: '3',
      symbol: 'NIO',
      assetName: '蔚来'
    },
    indicators: [
      { name: '月交付量', value: '1.2万', trend: 'down', status: 'warning' },
      { name: '市占率', value: '2.1%', trend: 'down', status: 'warning' },
      { name: '电池成本', value: '-8%', trend: 'down', status: 'healthy' }
    ],
    aiComment: '交付量环比下降23%，核心假设面临挑战'
  },
  {
    id: '4',
    title: '拼多多投资论题',
    summary: '投资拼多多基于其下沉市场的用户增长和跨境电商TEMU的全球扩张潜力',
    healthScore: 78,
    investmentStyle: 'growth',
    holdingPeriod: 'long_term',
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5小时前
    position: {
      id: '4',
      symbol: 'PDD',
      assetName: '拼多多'
    },
    indicators: [
      { name: '营收增速', value: '32%', trend: 'up', status: 'healthy' },
      { name: '活跃买家', value: '9亿', trend: 'up', status: 'healthy' },
      { name: 'TEMU增速', value: '85%', trend: 'up', status: 'healthy' }
    ],
    aiComment: 'Q4财报符合预期，论点稳固'
  }
]

export default function ThesisCardV2() {
  const [theses, setTheses] = useState<ThesisCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟加载
    setTimeout(() => {
      setTheses(mockTheses)
      setLoading(false)
    }, 300)
  }, [])

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

  // 健康度颜色
  const getHealthColor = (score: number) => {
    if (score >= 70) return { bg: 'bg-green-500', text: 'text-green-500', label: '健康' }
    if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-500', label: '预警' }
    return { bg: 'bg-red-500', text: 'text-red-500', label: '危机' }
  }

  // 趋势图标和颜色
  const getTrendStyle = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return { icon: '↑', color: 'text-green-500' }
      case 'down':
        return { icon: '↓', color: 'text-red-500' }
      case 'stable':
      default:
        return { icon: '→', color: 'text-gray-500' }
    }
  }

  // 格式化相对时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
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
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
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
            const health = getHealthColor(thesis.healthScore || 50)
            const indicators = thesis.indicators || []

            return (
              <div
                key={thesis.id}
                className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                {/* 顶部行：健康度 + 标签 */}
                <div className="flex items-center justify-between mb-3">
                  {/* 健康度指示器 + 分数 */}
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${health.bg}`} />
                    <span className={`font-bold ${health.text}`}>
                      {thesis.healthScore}/100
                    </span>
                    <span className={`text-xs ${health.text}`}>
                      {health.label}
                    </span>
                  </div>

                  {/* 投资风格 + 持有周期标签 */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {investmentStyleLabels[thesis.investmentStyle] || thesis.investmentStyle}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {holdingPeriodLabels[thesis.holdingPeriod] || thesis.holdingPeriod}
                    </Badge>
                  </div>
                </div>

                {/* 股票代码 + 名称 */}
                <div className="mb-2">
                  <Link
                    href={`/thesis/${thesis.id}`}
                    className="font-bold text-lg hover:text-primary flex items-center gap-1"
                  >
                    {thesis.position.symbol}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                  <span className="text-sm text-muted-foreground ml-2">
                    {thesis.position.assetName}
                  </span>
                </div>

                {/* 投资理由摘要 */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {thesis.summary}
                </p>

                {/* 关键指标区域 */}
                {indicators.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      关键指标
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {indicators.map((indicator, idx) => {
                        const trend = getTrendStyle(indicator.trend)
                        return (
                          <div
                            key={idx}
                            className="bg-slate-100 dark:bg-slate-800 rounded px-2 py-1.5"
                          >
                            <div className="text-xs text-muted-foreground truncate">
                              {indicator.name}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-sm font-medium ${trend.color}`}>
                                {indicator.value}
                              </span>
                              <span className={`text-xs ${trend.color}`}>
                                {trend.icon}
                              </span>
                              {indicator.status === 'healthy' ? (
                                <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-orange-500 ml-auto" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* AI 评论 */}
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded px-3 py-2 mb-3">
                  <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mb-0.5">
                    <FileText className="h-3 w-3" />
                    AI
                  </div>
                  <p className="text-sm italic text-purple-700 dark:text-purple-300">
                    {thesis.aiComment}
                  </p>
                </div>

                {/* 底部更新时间 */}
                <div className="text-xs text-muted-foreground">
                  更新于 {formatTime(thesis.updatedAt)}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}