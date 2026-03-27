import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Percent,
  Hash,
  Calendar,
  Eye,
  Plus,
  Briefcase
} from 'lucide-react'
import { db } from '@/lib/db'
import { PositionPriceCard } from '@/components/stock/position-price-card'

interface PositionDetailPageProps {
  params: {
    id: string
  }
}

export default async function PositionDetailPage({ params }: PositionDetailPageProps) {
  // 从数据库获取持仓详情
  const position = await db.position.findUnique({
    where: { id: params.id },
    include: {
      portfolio: {
        select: {
          id: true,
          name: true
        }
      },
      thesis: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      _count: {
        select: {
          alerts: {
            where: { status: 'unread' }
          },
          thesis: true,
          eventAnalyses: true
        }
      }
    }
  })

  // 如果持仓不存在，返回404
  if (!position) {
    notFound()
  }

  // 计算持仓价值
  const positionValue = position.quantity * position.costPrice

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

  // 市场映射
  const marketLabels: Record<string, string> = {
    A: 'A股',
    HK: '港股',
    US: '美股'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部导航 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/portfolios/${position.portfolio.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回组合
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              {position.assetName}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-muted-foreground">
              <Badge variant="outline" className="text-base px-3 py-1">
                {position.symbol}
              </Badge>
              <Badge variant="secondary">
                {marketLabels[position.market] || position.market}
              </Badge>
              <Badge variant="outline">
                {holdingStyleLabels[position.holdingStyle] || position.holdingStyle}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/portfolios/${position.portfolio.id}/positions/${position.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              编辑
            </Link>
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:border-red-300">
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      {/* 基本信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              持仓数量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {position.quantity.toLocaleString('zh-CN')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              成本价
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{position.costPrice.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              持仓权重
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {position.positionWeight}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              持仓价值
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{positionValue.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 实时行情卡片 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          实时行情
        </h2>
        <PositionPriceCard
          symbol={position.symbol}
          name={position.assetName}
          market={position.market}
          quantity={position.quantity}
          costPrice={position.costPrice}
          showDetails={true}
          autoRefresh={true}
          refreshInterval={60}
        />
      </div>

      {/* 详细信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 持仓信息 */}
        <Card>
          <CardHeader>
            <CardTitle>持仓信息</CardTitle>
            <CardDescription>持仓的基本信息和交易详情</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">所属组合</div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <Link
                    href={`/portfolios/${position.portfolio.id}`}
                    className="text-primary hover:underline"
                  >
                    {position.portfolio.name}
                  </Link>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">持仓风格</div>
                <div>{holdingStyleLabels[position.holdingStyle] || position.holdingStyle}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">市场</div>
                <div>{marketLabels[position.market] || position.market}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">创建时间</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(position.createdAt)}
                </div>
              </div>
            </div>

            {position.investmentThesis && (
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-1">备注</div>
                <div className="bg-accent/50 rounded-lg p-3 text-sm">
                  {position.investmentThesis}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 统计概览 */}
        <Card>
          <CardHeader>
            <CardTitle>统计概览</CardTitle>
            <CardDescription>与该持仓相关的活动统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">
                  {position._count.thesis}
                </div>
                <div className="text-sm text-muted-foreground mt-1">投资论题</div>
              </div>

              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-3xl font-bold text-amber-600">
                  {position._count.alerts}
                </div>
                <div className="text-sm text-muted-foreground mt-1">未读提醒</div>
              </div>

              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {position._count.eventAnalyses}
                </div>
                <div className="text-sm text-muted-foreground mt-1">事件分析</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 投资论题区域 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                投资论题
              </CardTitle>
              <CardDescription>该持仓的投资逻辑和核心分析</CardDescription>
            </div>

            {position._count.thesis === 0 ? (
              <Button asChild>
                <Link href={`/thesis/generate?positionId=${position.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  生成投资论题
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={`/thesis/${position.thesis[0]?.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  查看详情
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {position._count.thesis === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无投资论题</h3>
              <p className="text-muted-foreground mb-4">
                为该持仓生成投资论题，建立完整的投资逻辑体系
              </p>
              <Button asChild>
                <Link href={`/thesis/generate?positionId=${position.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  生成投资论题
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {position.thesis.map((thesis) => (
                <div key={thesis.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={thesis.status === 'generated' ? 'default' : 'outline'}>
                        {thesis.status === 'generated' ? '已生成' : thesis.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        生成于 {formatDate(thesis.createdAt)}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/thesis/${thesis.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        查看详情
                      </Link>
                    </Button>
                  </div>

                  <h4 className="font-semibold text-lg mb-2">{thesis.title}</h4>
                  <p className="text-muted-foreground line-clamp-3">{thesis.summary}</p>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>投资风格: {thesis.investmentStyle}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>持仓周期: {thesis.holdingPeriod}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提醒区域 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                提醒
              </CardTitle>
              <CardDescription>与该持仓相关的监控提醒</CardDescription>
            </div>

            {position._count.alerts > 0 && (
              <Button variant="outline" asChild>
                <Link href={`/alerts?positionId=${position.id}`}>
                  查看全部 ({position._count.alerts})
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {position._count.alerts === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无提醒</h3>
              <p className="text-muted-foreground">
                该持仓目前没有活跃的监控提醒，一切运行正常
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                有 {position._count.alerts} 条未读提醒
              </p>
              <Button variant="outline" className="mt-2" asChild>
                <Link href={`/alerts?positionId=${position.id}`}>
                  查看提醒详情
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
