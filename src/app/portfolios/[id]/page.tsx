import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase as PortfolioIcon,
  Plus,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  Percent,
  Hash,
  FileText,
  Eye,
  Trash2
} from 'lucide-react'
import { db } from '@/lib/db'
import PositionPrices from '@/components/stock/position-prices'

interface PortfolioDetailPageProps {
  params: {
    id: string
  }
}

export default async function PortfolioDetailPage({ params }: PortfolioDetailPageProps) {
  // 从数据库获取组合详情
  const portfolio = await db.portfolio.findUnique({
    where: { id: params.id },
    include: {
      positions: {
        orderBy: {
          positionWeight: 'desc',
        },
        include: {
          thesis: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          _count: {
            select: {
              alerts: {
                where: {
                  status: 'unread'
                }
              },
              thesis: true,
              eventAnalyses: true
            }
          }
        }
      },
      _count: {
        select: {
          positions: true
        }
      }
    }
  })

  // 如果组合不存在，返回404
  if (!portfolio) {
    notFound()
  }

  // 计算总持仓价值
  const totalValue = portfolio.positions.reduce((sum, position) => {
    return sum + (position.quantity * position.costPrice)
  }, 0)

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 持仓样式映射
  const holdingStyleLabels: Record<string, string> = {
    short_term: '短期',
    swing: '波段',
    long_term: '长期'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <PortfolioIcon className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{portfolio.name}</h1>
            <Badge variant="outline" className="text-sm">
              {portfolio._count.positions} 持仓
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {portfolio.description || '暂无描述'}
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>创建于 {formatDate(portfolio.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>持仓总值: ¥{totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/portfolios/${params.id}/health`}>
              <TrendingUp className="mr-2 h-4 w-4" />
              健康度
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/portfolios">
              ← 返回列表
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/portfolios/${params.id}/positions/new`}>
              <Plus className="mr-2 h-4 w-4" />
              新增持仓
            </Link>
          </Button>
        </div>
      </div>

      {/* 持仓列表 */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              持仓列表
            </CardTitle>
            <CardDescription>
              按持仓权重排序，显示所有持仓详情
            </CardDescription>
          </CardHeader>
          <CardContent>
            {portfolio.positions.length > 0 ? (
              <div className="space-y-4">
                {portfolio.positions.map((position) => {
                  const positionValue = position.quantity * position.costPrice
                  const valuePercent = totalValue > 0 ? (positionValue / totalValue * 100).toFixed(1) : '0'
                  
                  return (
                    <div key={position.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* 左侧：基本信息 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="font-semibold text-lg">{position.symbol}</div>
                            <div className="font-medium">{position.assetName}</div>
                            <Badge variant="secondary">{position.market}</Badge>
                            <Badge variant="outline">
                              {holdingStyleLabels[position.holdingStyle] || position.holdingStyle}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-muted-foreground">数量</div>
                                <div className="font-medium">{position.quantity.toLocaleString('zh-CN')}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-muted-foreground">成本价</div>
                                <div className="font-medium">¥{position.costPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-muted-foreground">持仓权重</div>
                                <div className="font-medium">{position.positionWeight}%</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-muted-foreground">持仓价值</div>
                                <div className="font-medium">
                                  ¥{positionValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({valuePercent}%)
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {position.investmentThesis && (
                            <div className="mt-3 text-sm text-muted-foreground">
                              <div className="font-medium mb-1">投资理由:</div>
                              <div>{position.investmentThesis}</div>
                            </div>
                          )}
                        </div>
                        
                        {/* 右侧：操作和状态 */}
                        <div className="flex flex-col gap-2">
                          {/* 状态标签 */}
                          <div className="flex flex-wrap gap-2">
                            {position._count.thesis > 0 && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                <FileText className="h-3 w-3 mr-1" />
                                {position._count.thesis} 个投资论题
                              </Badge>
                            )}
                            
                            {position._count.alerts > 0 ? (
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {position._count.alerts} 个未读提醒
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                无未读提醒
                              </Badge>
                            )}
                          </div>
                          
                        {/* 操作按钮 */}
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/positions/${position.id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                详情
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/portfolios/${params.id}/positions/${position.id}/edit`}>
                                编辑
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-300">
                              <Trash2 className="h-3 w-3 mr-1" />
                              删除
                            </Button>
                          </div>
                          
                          {/* 生成Thesis按钮 */}
                          {position._count.thesis === 0 ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700 hover:border-green-300"
                              asChild
                            >
                              <Link href={`/thesis/generate?positionId=${position.id}`}>
                                <FileText className="h-3 w-3 mr-1" />
                                生成投资论题
                              </Link>
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                              asChild
                            >
                              <Link href={`/theses/${position.thesis[0]?.id || ''}`}>
                                <FileText className="h-3 w-3 mr-1" />
                                查看投资论题
                              </Link>
                            </Button>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无持仓</h3>
                <p className="text-muted-foreground mb-6">
                  此投资组合还没有任何持仓，添加第一个持仓开始监控
                </p>
                <Button asChild>
                  <Link href={`/portfolios/${params.id}/positions/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加第一个持仓
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总持仓数量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio._count.positions}</div>
              <p className="text-xs text-muted-foreground mt-1">个持仓</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总持仓价值</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">人民币</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">平均持仓权重</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portfolio.positions.length > 0
                  ? (portfolio.positions.reduce((sum, p) => sum + p.positionWeight, 0) / portfolio.positions.length).toFixed(1)
                  : '0'}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">平均每个持仓</p>
            </CardContent>
          </Card>
        </div>

        {/* 实时行情 */}
        {portfolio.positions.length > 0 && (
          <PositionPrices
            positions={portfolio.positions.map(p => ({
              symbol: p.symbol,
              name: p.assetName,
              market: p.market,
              quantity: p.quantity,
              costPrice: p.costPrice,
              positionWeight: p.positionWeight
            }))}
            autoRefresh={true}
            refreshInterval={60}
          />
        )}
      </div>
    </div>
  )
}