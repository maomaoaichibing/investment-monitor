'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase as PortfolioIcon, Plus, AlertTriangle, TrendingUp, BarChart3, Loader2, ChevronRight } from 'lucide-react'

// Mock 组合数据
const mockPortfolios = [
  {
    id: '1',
    name: '科技成长组合',
    description: 'AI相关高增长科技股',
    positionCount: 6,
    alertCount: 2,
    performance: '+15.2%',
    createdDate: '2024-01-15',
    positions: ['NVDA', 'MSFT', 'GOOGL', 'AMZN', 'TSM', 'MU']
  },
  {
    id: '2',
    name: '防御性收入组合',
    description: '股息股票和防御性板块',
    positionCount: 5,
    alertCount: 0,
    performance: '+8.7%',
    createdDate: '2024-02-20',
    positions: ['JNJ', 'PG', 'KO', 'PEP', 'VZ']
  },
  {
    id: '3',
    name: '中国复苏组合',
    description: '具复苏潜力的中国股票',
    positionCount: 4,
    alertCount: 1,
    performance: '+5.3%',
    createdDate: '2024-03-10',
    positions: ['BABA', 'PDD', 'NIO', '0883.HK']
  }
]

export default function PortfoliosPage() {
  // 计算统计数据
  const totalPortfolios = mockPortfolios.length
  const totalPositions = mockPortfolios.reduce((sum, p) => sum + p.positionCount, 0)
  const totalAlerts = mockPortfolios.reduce((sum, p) => sum + p.alertCount, 0)
  const hasAlerts = totalAlerts > 0

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <PortfolioIcon className="h-8 w-8 text-primary" />
            投资组合
          </h1>
          <p className="text-muted-foreground mt-2">
            管理和监控您的所有投资组合
          </p>
        </div>
        <Link href="/portfolios/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建组合
          </Button>
        </Link>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总组合数
            </CardTitle>
            <PortfolioIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPortfolios}</div>
            <p className="text-xs text-muted-foreground">个投资组合</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总持仓数
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositions}</div>
            <p className="text-xs text-muted-foreground">个持仓</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总收益率
            </CardTitle>
            <TrendingUp className={`h-4 w-4 ${hasAlerts ? 'text-red-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasAlerts ? 'text-red-600' : 'text-green-600'}`}>
              +10.4%
            </div>
            <p className="text-xs text-muted-foreground">所有组合平均</p>
          </CardContent>
        </Card>
      </div>

      {/* 组合卡片列表 */}
      <div className="grid gap-6">
        {mockPortfolios.map((portfolio) => (
          <Card
            key={portfolio.id}
            className={`hover:shadow-lg transition-all duration-200 ${
              portfolio.alertCount > 0 ? 'border-l-4 border-l-orange-400' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{portfolio.name}</CardTitle>
                    {portfolio.alertCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {portfolio.alertCount} 个活跃
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {portfolio.description}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  ···
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* 统计行 */}
              <div className="grid grid-cols-4 gap-4 mb-4 py-3 border-y">
                <div>
                  <div className="text-2xl font-bold">{portfolio.positionCount}</div>
                  <div className="text-xs text-muted-foreground">持仓数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {portfolio.alertCount}
                  </div>
                  <div className="text-xs text-muted-foreground">活跃提醒</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {portfolio.performance}
                  </div>
                  <div className="text-xs text-muted-foreground">收益率</div>
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {new Date(portfolio.createdDate).toLocaleDateString('zh-CN')}
                  </div>
                  <div className="text-xs text-muted-foreground">创建日期</div>
                </div>
              </div>

              {/* 持仓预览 */}
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">持仓预览：</div>
                <div className="flex flex-wrap gap-2">
                  {portfolio.positions.map((ticker) => (
                    <Badge
                      key={ticker}
                      variant="secondary"
                      className="text-xs font-mono bg-muted"
                    >
                      {ticker}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 操作 */}
              <div className="flex items-center justify-between">
                <Link href={`/portfolios/${portfolio.id}`}>
                  <Button variant="outline" size="sm">
                    查看详情
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}