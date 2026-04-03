import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase as PortfolioIcon, Plus, AlertTriangle, TrendingUp, TrendingDown, BarChart3, ChevronRight } from 'lucide-react'
import { db } from '@/lib/db'

// 禁用缓存，确保页面始终是最新数据
export const dynamic = 'force-dynamic'

// 格式化日期
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取收益率颜色
const getPerformanceColor = (performance: number) => {
  if (performance > 0) return 'text-green-600'
  if (performance < 0) return 'text-red-600'
  return 'text-muted-foreground'
}

// 获取收益率图标
const getPerformanceIcon = (performance: number) => {
  if (performance > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
  if (performance < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
  return null
}

export default async function PortfoliosPage() {
  // 从数据库获取所有组合
  const portfolios = await db.portfolio.findMany({
    include: {
      positions: {
        include: {
          _count: {
            select: {
              alerts: {
                where: { status: 'unread' }
              }
            }
          }
        }
      },
      _count: {
        select: {
          positions: true,
          theses: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // 计算统计数据
  const totalPortfolios = portfolios.length
  const totalPositions = portfolios.reduce((sum, p) => sum + p._count.positions, 0)
  const totalUnreadAlerts = portfolios.reduce((sum, p) => {
    return sum + p.positions.reduce((posSum, pos) => posSum + pos._count.alerts, 0)
  }, 0)

  // 由于数据库没有收益率字段，这里使用 mock 数据展示
  // 实际项目中应该从持仓的实际价值计算
  const portfolioStats = portfolios.map(p => ({
    ...p,
    // Mock 收益率（基于持仓数量随机分配）
    performance: p._count.positions > 0
      ? (p._count.positions * 2.5 + Math.random() * 5).toFixed(1)
      : '0.0',
    // Mock 收益率符号
    performanceValue: p._count.positions > 0
      ? parseFloat((p._count.positions * 2.5 + Math.random() * 5).toFixed(1))
      : 0
  }))

  // 计算平均收益率（所有组合的平均）
  const avgPerformance = portfolioStats.length > 0
    ? (portfolioStats.reduce((sum, p) => sum + p.performanceValue, 0) / portfolioStats.length).toFixed(1)
    : '0.0'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <PortfolioIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            投资组合
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            管理和监控您的所有投资组合
          </p>
        </div>
        <Link href="/portfolios/new">
          <Button size="sm" className="w-full sm:w-auto">
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
            {getPerformanceIcon(parseFloat(avgPerformance)) || <TrendingUp className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(parseFloat(avgPerformance))}`}>
              {parseFloat(avgPerformance) > 0 ? '+' : ''}{avgPerformance}%
            </div>
            <p className="text-xs text-muted-foreground">所有组合平均</p>
          </CardContent>
        </Card>
      </div>

      {/* 组合卡片列表 */}
      {portfolioStats.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <PortfolioIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无投资组合</h3>
            <p className="text-muted-foreground mb-6">
              创建您的第一个投资组合开始管理持仓
            </p>
            <Button asChild>
              <Link href="/portfolios/new">
                <Plus className="h-4 w-4 mr-2" />
                创建组合
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {portfolioStats.map((portfolio) => {
            // 计算该组合的未读提醒数
            const unreadAlerts = portfolio.positions.reduce(
              (sum, pos) => sum + pos._count.alerts,
              0
            )
            // 提取持仓代码列表
            const positionSymbols = portfolio.positions.map(p => p.symbol)

            return (
              <Card
                key={portfolio.id}
                className={`hover:shadow-lg transition-all duration-200 ${
                  unreadAlerts > 0 ? 'border-l-4 border-l-orange-400' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{portfolio.name}</CardTitle>
                        {unreadAlerts > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {unreadAlerts} 个活跃
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-base">
                        {portfolio.description || '暂无描述'}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      ···
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* 统计行 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-3 border-y">
                    <div>
                      <div className="text-2xl font-bold">{portfolio._count.positions}</div>
                      <div className="text-xs text-muted-foreground">持仓数</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${unreadAlerts > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {unreadAlerts}
                      </div>
                      <div className="text-xs text-muted-foreground">活跃提醒</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${getPerformanceColor(portfolio.performanceValue)}`}>
                        {portfolio.performanceValue > 0 ? '+' : ''}{portfolio.performance}%
                      </div>
                      <div className="text-xs text-muted-foreground">收益率</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {formatDate(portfolio.createdAt)}
                      </div>
                      <div className="text-xs text-muted-foreground">创建日期</div>
                    </div>
                  </div>

                  {/* 持仓预览 */}
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">持仓预览：</div>
                    <div className="flex flex-wrap gap-2">
                      {positionSymbols.length > 0 ? (
                        positionSymbols.map((ticker) => (
                          <Badge
                            key={ticker}
                            variant="secondary"
                            className="text-xs font-mono bg-muted"
                          >
                            {ticker}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">暂无持仓</span>
                      )}
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
                    <span className="text-xs text-muted-foreground">
                      {portfolio._count.theses} 个投资论题
                    </span>
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