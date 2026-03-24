import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  ShieldAlert,
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  Monitor,
  EyeOff,
  Calendar,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { db } from '@/lib/db'
import MonitorPlanView from './MonitorPlanView'

interface ThesisDetailPageProps {
  params: {
    thesisId: string
  }
}

export default async function ThesisDetailPage({ params }: ThesisDetailPageProps) {
  // 从数据库获取Thesis详情，包括关联的Monitor Plan
  const thesis = await db.thesis.findUnique({
    where: { id: params.thesisId },
    include: {
      position: {
        select: {
          id: true,
          symbol: true,
          assetName: true,
          market: true
        }
      },
      portfolio: {
        select: {
          id: true,
          name: true
        }
      },
      // 注意：我们不在服务器端预加载 monitor plan
      // 因为页面是客户端组件，API调用统一在客户端进行
    }
  })

  // 如果Thesis不存在，返回404
  if (!thesis) {
    notFound()
  }

  // 解析JSON字段
  const pricePhases = JSON.parse(thesis.pricePhasesJson)
  const coreThesis = JSON.parse(thesis.coreThesisJson)
  const fragilePoints = JSON.parse(thesis.fragilePointsJson)
  const monitorTargets = JSON.parse(thesis.monitorTargetsJson)

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 置信度颜色映射
  const getConvictionColor = (conviction: number) => {
    if (conviction >= 9) return 'bg-green-100 text-green-800 border-green-300'
    if (conviction >= 7) return 'bg-blue-100 text-blue-800 border-blue-300'
    if (conviction >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-red-100 text-red-800 border-red-300'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部导航 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/portfolios/${thesis.portfolio.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回组合
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              投资论题分析
            </h1>
            <div className="flex items-center gap-3 mt-2 text-muted-foreground">
              <Badge variant="outline">{thesis.position.symbol}</Badge>
              <span>{thesis.position.assetName}</span>
              <Badge variant="secondary">{thesis.position.market}</Badge>
              <span className="text-sm">·</span>
              <span className="text-sm">生成于 {formatDate(thesis.createdAt)}</span>
              <Badge variant={thesis.status === 'generated' ? 'default' : 'outline'}>
                {thesis.status === 'generated' ? '已生成' : thesis.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 摘要卡片 */}
      <Card className="mb-6 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            摘要
          </CardTitle>
          <CardDescription>
            核心投资逻辑概述
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-lg leading-relaxed">{thesis.summary}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：价格阶段分析和核心论题 */}
        <div className="space-y-6">
          {/* 价格阶段分析 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                价格阶段分析
              </CardTitle>
              <CardDescription>
                当前价格阶段和技术位分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricePhases.map((phase: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{phase.phase}</h4>
                      <Badge variant="outline">阶段 {index + 1}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{phase.description}</p>
                    
                    {phase.keyLevels && phase.keyLevels.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">关键价位：</div>
                        <div className="flex flex-wrap gap-2">
                          {phase.keyLevels.map((level: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {level}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 核心论题 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                核心论题
              </CardTitle>
              <CardDescription>
                主要投资逻辑和置信度评估
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coreThesis.map((item: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">{item.title}</h4>
                      <Badge className={getConvictionColor(item.conviction)}>
                        置信度: {item.conviction}/10
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{item.description}</p>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <div className="text-sm font-medium">评估：</div>
                      <div className="flex">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 mx-px rounded-full ${
                              i < item.conviction 
                                ? item.conviction >= 9 ? 'bg-green-500' 
                                : item.conviction >= 7 ? 'bg-blue-500'
                                : item.conviction >= 5 ? 'bg-yellow-500'
                                : 'bg-red-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：脆弱点和监控目标 */}
        <div className="space-y-6">
          {/* 脆弱点 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                脆弱点
              </CardTitle>
              <CardDescription>
                主要风险和不确定性
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fragilePoints.map((point: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{point}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        需要持续监控此风险因素
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 监控目标 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                监控目标
              </CardTitle>
              <CardDescription>
                关键指标和触发行动
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monitorTargets.map((target: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{target.type}</Badge>
                        <span className="font-medium">{target.condition}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <div className="text-sm font-medium">建议行动：</div>
                      <div className="flex-1 bg-accent p-2 rounded text-sm">
                        {target.action}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        待监控
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monitor Plan 区域 */}
      <div className="mt-8">
        <MonitorPlanView thesisId={thesis.id} />
      </div>

      {/* 底部信息 */}
      <div className="mt-8 pt-6 border-t">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div>
            <div className="font-medium mb-1">投资组合</div>
            <div>{thesis.portfolio.name}</div>
          </div>
          <div>
            <div className="font-medium mb-1">生成状态</div>
            <div className="flex items-center gap-2">
              {thesis.status === 'generated' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>生成成功</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>生成失败</span>
                </>
              )}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">最后更新</div>
            <div>{formatDate(thesis.updatedAt)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}