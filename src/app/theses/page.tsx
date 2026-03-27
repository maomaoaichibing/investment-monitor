'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Search,
  Filter,
  Eye,
  Plus,
  Calendar,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

// Mock 论题数据
const mockTheses = [
  {
    id: 'thesis-1',
    position: { id: 'pos-1', symbol: 'NVDA', assetName: 'NVIDIA 英伟达' },
    portfolio: { id: '1', name: '科技成长组合' },
    title: 'AI 算力需求持续爆发',
    summary: '数据中心 GPU 需求在 AI 训练和推理双轮驱动下持续增长，H100 市占率超 90%',
    healthScore: 85,
    investmentStyle: 'growth',
    holdingPeriod: 'long_term',
    status: 'generated',
    pillars: [
      { name: 'AI 算力需求', status: 'healthy' },
      { name: 'H100 市占率', status: 'healthy' },
      { name: '数据中心营收增长', status: 'healthy' }
    ],
    lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'thesis-2',
    position: { id: 'pos-2', symbol: 'MU', assetName: '美光科技' },
    portfolio: { id: '1', name: '科技成长组合' },
    title: 'HBM 存储周期上行',
    summary: 'HBM3e 供不应求，美光份额从 10% 提升到 28%，存储周期确认上行',
    healthScore: 72,
    investmentStyle: 'growth',
    holdingPeriod: 'medium_term',
    status: 'generated',
    pillars: [
      { name: 'HBM 份额', status: 'healthy' },
      { name: 'DRAM 均价', status: 'warning' },
      { name: '营收增速', status: 'healthy' }
    ],
    lastUpdate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'thesis-3',
    position: { id: 'pos-3', symbol: 'NIO', assetName: '蔚来' },
    portfolio: { id: '3', name: '中国复苏组合' },
    title: '中国电动车市场份额争夺',
    summary: '品牌高端定位 + 换电网络构建护城河，但面临价格战和交付量压力',
    healthScore: 35,
    investmentStyle: 'growth',
    holdingPeriod: 'medium_term',
    status: 'generated',
    pillars: [
      { name: '月交付量', status: 'critical' },
      { name: '毛利率', status: 'critical' },
      { name: '现金储备', status: 'healthy' }
    ],
    lastUpdate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'thesis-4',
    position: { id: 'pos-4', symbol: 'BABA', assetName: '阿里巴巴' },
    portfolio: { id: '3', name: '中国复苏组合' },
    title: '中国消费复苏 + 云业务分拆',
    summary: '核心电商稳定 + 云智能独立后估值重塑，回购 250 亿美元提振信心',
    healthScore: 68,
    investmentStyle: 'value',
    holdingPeriod: 'long_term',
    status: 'generated',
    pillars: [
      { name: 'GMV 增速', status: 'warning' },
      { name: '云营收增速', status: 'healthy' },
      { name: '回购计划', status: 'healthy' }
    ],
    lastUpdate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'thesis-5',
    position: { id: 'pos-5', symbol: 'TSM', assetName: '台积电' },
    portfolio: { id: '1', name: '科技成长组合' },
    title: '全球先进制程垄断',
    summary: '3nm/2nm 独家供应 Apple + NVIDIA，竞争对手差距持续拉大',
    healthScore: 90,
    investmentStyle: 'growth',
    holdingPeriod: 'long_term',
    status: 'generated',
    pillars: [
      { name: '先进制程占比', status: 'healthy' },
      { name: '产能利用率', status: 'healthy' },
      { name: '毛利率', status: 'healthy' }
    ],
    lastUpdate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const investmentStyleLabels: Record<string, string> = {
  growth: '成长', value: '价值', quality: '质量', momentum: '趋势'
}

const holdingPeriodLabels: Record<string, string> = {
  short_term: '短期', medium_term: '中期', long_term: '长期'
}

const getHealthColor = (score: number) => {
  if (score >= 70) return { dot: 'bg-green-500', text: 'text-green-600', ring: 'text-green-500' }
  if (score >= 40) return { dot: 'bg-yellow-500', text: 'text-yellow-600', ring: 'text-yellow-500' }
  return { dot: 'bg-red-500', text: 'text-red-600', ring: 'text-red-500' }
}

const HealthRing = ({ score }: { score: number }) => {
  const color = getHealthColor(score)
  const circumference = 2 * Math.PI * 12
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="12" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
        <circle cx="18" cy="18" r="12" fill="none" stroke="currentColor" strokeWidth="3"
          strokeDasharray={`${strokeDashoffset} ${circumference}`} strokeLinecap="round"
          className={color.ring} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${color.text}`}>
        {score}
      </span>
    </div>
  )
}

const TrendIcon = ({ status }: { status: string }) => {
  if (status === 'healthy') return <TrendingUp className="h-4 w-4 text-green-600" />
  if (status === 'warning') return <Minus className="h-4 w-4 text-yellow-600" />
  return <TrendingDown className="h-4 w-4 text-red-600" />
}

export default function ThesesPage() {
  const [theses] = useState(mockTheses)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredTheses = theses.filter(thesis => {
    const matchesSearch =
      thesis.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thesis.position.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thesis.position.assetName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || thesis.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            投资论题
          </h1>
          <p className="text-muted-foreground mt-2">
            管理所有持仓的投资逻辑和核心分析
          </p>
        </div>
        <Button asChild>
          <Link href="/portfolios">
            <Plus className="mr-2 h-4 w-4" />
            添加持仓
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索论题、股票代码或名称..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="all">全部状态</option>
                <option value="generated">已生成</option>
                <option value="pending">生成中</option>
                <option value="failed">失败</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredTheses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无投资论题</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterStatus !== 'all' ? '没有找到匹配的投资论题' : '为持仓生成投资论题，开始建立投资逻辑体系'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTheses.map((thesis) => {
            const healthColor = getHealthColor(thesis.healthScore)

            return (
              <Card key={thesis.id}
                className={`hover:bg-accent/50 transition-colors ${thesis.healthScore < 40 ? 'border-l-4 border-l-red-400 bg-red-50/30' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <HealthRing score={thesis.healthScore} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-bold text-xl">{thesis.position.symbol}</span>
                          <span className="text-muted-foreground">{thesis.position.assetName}</span>
                          <Badge variant="outline">{investmentStyleLabels[thesis.investmentStyle]}</Badge>
                          <Badge variant="outline">{holdingPeriodLabels[thesis.holdingPeriod]}</Badge>
                        </div>
                        <h3 className="font-medium mb-2">{thesis.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{thesis.summary}</p>

                        {/* 关键指标 */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {thesis.pillars.map((pillar, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm bg-muted/50 rounded px-2 py-1">
                              <TrendIcon status={pillar.status} />
                              <span className="truncate">{pillar.name}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <Link href={`/portfolios/${thesis.portfolio.id}`} className="flex items-center gap-1 hover:text-primary">
                            <Briefcase className="h-4 w-4" />
                            {thesis.portfolio.name}
                          </Link>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>更新于 {formatDate(thesis.lastUpdate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={thesis.status === 'generated' ? 'default' : 'secondary'} className={thesis.status === 'generated' ? 'bg-green-100 text-green-700' : ''}>
                        {thesis.status === 'generated' ? '✓ 已生成' : thesis.status === 'pending' ? '生成中' : '失败'}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/theses/${thesis.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          查看详情
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}