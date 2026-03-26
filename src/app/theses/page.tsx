'use client'

import { useEffect, useState } from 'react'
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
  TrendingUp,
  Calendar,
  Briefcase,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface Thesis {
  id: string
  title: string
  summary: string
  investmentStyle: string
  holdingPeriod: string
  status: string
  createdAt: string
  updatedAt: string
  position: {
    id: string
    symbol: string
    assetName: string
  }
  portfolio: {
    id: string
    name: string
  }
}

export default function ThesesPage() {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchTheses()
  }, [])

  const fetchTheses = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/thesis')
      if (!response.ok) {
        throw new Error('获取投资论题列表失败')
      }

      const data = await response.json()
      setTheses(data.theses || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 过滤论题
  const filteredTheses = theses.filter(thesis => {
    const matchesSearch =
      thesis.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thesis.position.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thesis.position.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thesis.summary.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || thesis.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  // 状态映射
  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    generated: { label: '已生成', variant: 'default' },
    pending: { label: '生成中', variant: 'secondary' },
    failed: { label: '失败', variant: 'destructive' }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部 */}
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

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索论题、股票代码或名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">全部状态</option>
                <option value="generated">已生成</option>
                <option value="pending">生成中</option>
                <option value="failed">失败</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">加载中...</span>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 论题列表 */}
      {!loading && !error && (
        <>
          {filteredTheses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">暂无投资论题</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm || filterStatus !== 'all'
                      ? '没有找到匹配的投资论题'
                      : '为持仓生成投资论题，开始建立投资逻辑体系'}
                  </p>
                  {!searchTerm && filterStatus === 'all' && (
                    <Button asChild>
                      <Link href="/portfolios">
                        <Plus className="mr-2 h-4 w-4" />
                        添加持仓并生成论题
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTheses.map((thesis) => (
                <Card key={thesis.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* 左侧：基本信息 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/positions/${thesis.position.id}`}
                            className="font-semibold text-lg hover:text-primary"
                          >
                            {thesis.position.symbol}
                          </Link>
                          <span className="text-muted-foreground">
                            {thesis.position.assetName}
                          </span>
                          <Badge variant="outline">
                            {investmentStyleLabels[thesis.investmentStyle] || thesis.investmentStyle}
                          </Badge>
                          <Badge variant="outline">
                            {holdingPeriodLabels[thesis.holdingPeriod] || thesis.holdingPeriod}
                          </Badge>
                        </div>

                        <h3 className="font-medium mb-2">{thesis.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {thesis.summary}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            <Link
                              href={`/portfolios/${thesis.portfolio.id}`}
                              className="hover:text-primary"
                            >
                              {thesis.portfolio.name}
                            </Link>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(thesis.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* 右侧：状态和操作 */}
                      <div className="flex flex-col items-end gap-3">
                        <Badge
                          variant={statusLabels[thesis.status]?.variant || 'outline'}
                        >
                          {statusLabels[thesis.status]?.label || thesis.status}
                        </Badge>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/thesis/${thesis.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              查看详情
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 统计信息 */}
          {filteredTheses.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              共 {filteredTheses.length} 个投资论题
              {searchTerm && ` (匹配 "${searchTerm}")`}
            </div>
          )}
        </>
      )}
    </div>
  )
}
