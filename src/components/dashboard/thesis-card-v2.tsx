'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, TrendingUp, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

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

// Mock 数据 - 4张持仓论题卡片
// TODO: Replace with API call: GET /api/thesis 或 GET /api/dashboard/thesis-cards
const mockTheses: ThesisCardData[] = [
  {
    id: '1',
    title: '美光科技投资论题',
    summary: '基于HBM和AI服务器存储需求的爆发式增长',
    healthScore: 82,
    investmentStyle: 'growth',
    holdingPeriod: 'long_term',
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
    aiComment: '存储周期上行确认，HBM需求超预期，论点健康'
  },
  {
    id: '2',
    title: '蔚来投资论题',
    summary: '看好中国新能源车渗透率提升和品牌向上突破',
    healthScore: 35,
    investmentStyle: 'growth',
    holdingPeriod: 'medium_term',
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    position: {
      id: '2',
      symbol: 'NIO',
      assetName: '蔚来'
    },
    indicators: [
      { name: '月交付量', value: '1.2万', trend: 'down', status: 'warning' },
      { name: '毛利率', value: '9.8%', trend: 'down', status: 'warning' },
      { name: '现金储备', value: '$45亿', trend: 'stable', status: 'healthy' }
    ],
    aiComment: '交付量连续2月下滑，核心假设承压，建议密切关注'
  },
  {
    id: '3',
    title: '中国海洋石油投资论题',
    summary: '受益于全球能源需求和高股息回报',
    healthScore: 58,
    investmentStyle: 'value',
    holdingPeriod: 'long_term',
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    position: {
      id: '3',
      symbol: '00883',
      assetName: '中国海洋石油'
    },
    indicators: [
      { name: '布伦特原油', value: '$69.5', trend: 'down', status: 'warning' },
      { name: '产量达标率', value: '95%', trend: 'stable', status: 'healthy' },
      { name: '股息率', value: '7.2%', trend: 'stable', status: 'healthy' }
    ],
    aiComment: '油价走弱接近$65风险线，但高股息提供安全垫'
  },
  {
    id: '4',
    title: '拼多多投资论题',
    summary: '电商平台受益消费复苏，Temu打开海外增量空间',
    healthScore: 78,
    investmentStyle: 'growth',
    holdingPeriod: 'medium_term',
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    position: {
      id: '4',
      symbol: 'PDD',
      assetName: '拼多多'
    },
    indicators: [
      { name: '季度营收增速', value: '32%', trend: 'up', status: 'healthy' },
      { name: '年活跃用户', value: '8.7亿', trend: 'up', status: 'healthy' },
      { name: 'Temu海外GMV', value: '$20亿', trend: 'up', status: 'healthy' }
    ],
    aiComment: '财报超预期，海外业务成为第二增长曲线'
  }
]

export default function ThesisCardV2() {
  const theses = mockTheses

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
    if (score >= 70) return { dot: 'bg-green-500', text: 'text-green-600', label: '健康' }
    if (score >= 40) return { dot: 'bg-yellow-500', text: 'text-yellow-600', label: '预警' }
    return { dot: 'bg-red-500', text: 'text-red-600', label: '危机' }
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
        {/* 2x2 网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {theses.map((thesis) => {
            const health = getHealthColor(thesis.healthScore || 50)
            const indicators = thesis.indicators || []

            return (
              <div
                key={thesis.id}
                className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                {/* 顶部行：健康度圆点+分数，右侧 标签Badge */}
                <div className="flex items-center justify-between mb-2">
                  {/* 健康度圆点 + 分数 */}
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${health.dot}`} />
                    <span className={`font-bold ${health.text}`}>
                      {thesis.healthScore}
                    </span>
                  </div>

                  {/* 投资类型·持有周期 标签 */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {investmentStyleLabels[thesis.investmentStyle] || thesis.investmentStyle}
                    </Badge>
                    <span>·</span>
                    <Badge variant="outline" className="text-xs">
                      {holdingPeriodLabels[thesis.holdingPeriod] || thesis.holdingPeriod}
                    </Badge>
                  </div>
                </div>

                {/* 标题行：股票代码（加粗）+ 名称 */}
                <div className="mb-2">
                  <Link
                    href={`/theses/${thesis.id}`}
                    className="font-bold text-base hover:text-primary flex items-center gap-1"
                  >
                    {thesis.position.symbol}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                  <span className="text-sm text-muted-foreground ml-2">
                    {thesis.position.assetName}
                  </span>
                </div>

                {/* 投资理由：一句话（最多2行，overflow hidden） */}
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {thesis.summary}
                </p>

                {/* 关键指标区域：3行小字表格样式 */}
                {indicators.length > 0 && (
                  <div className="mb-3 text-xs">
                    <div className="grid gap-1">
                      {indicators.map((indicator, idx) => {
                        const trend = getTrendStyle(indicator.trend)
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-muted-foreground w-20 truncate">
                              {indicator.name}
                            </span>
                            <span className={`font-medium ${trend.color}`}>
                              {indicator.value}
                            </span>
                            <span className={`${trend.color}`}>
                              {trend.icon}
                            </span>
                            {indicator.status === 'healthy' ? (
                              <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-orange-500 ml-auto" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* AI观点：斜体灰色小字，前面加🤖 */}
                <p className="text-xs italic text-muted-foreground mb-3">
                  🤖 {thesis.aiComment}
                </p>

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