import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, TrendingUp, AlertTriangle, FileText, Sparkles } from 'lucide-react'
import { HealthScoreRing } from './health-score-ring'
import { db } from '@/lib/db'

export default async function DashboardStats() {
  // 从数据库获取真实统计数据
  const [
    portfolioCount,
    positionCount,
    thesisCount,
    alertCount,
    theses
  ] = await Promise.all([
    // 组合数量
    db.portfolio.count(),

    // 持仓数量
    db.position.count(),

    // 投资论题数量
    db.thesis.count(),

    // 未读提醒数量
    db.alert.count({
      where: {
        status: 'unread'
      }
    }),

    // 获取所有 thesis 用于计算平均健康度
    db.thesis.findMany({
      select: {
        healthScore: true
      }
    })
  ])

  // 计算平均健康度
  const validHealthScores = theses
    .map(t => t.healthScore)
    .filter((s): s is number => s !== null && s !== undefined)

  const avgHealthScore = validHealthScores.length > 0
    ? Math.round(validHealthScores.reduce((a, b) => a + b, 0) / validHealthScores.length)
    : 0

  // 需关注的持仓（有 warning 或 critical 级别 alert 的）
  const warningAlertCount = await db.alert.count({
    where: {
      status: 'unread',
      level: {
        in: ['important', 'urgent', 'watch']
      }
    }
  })

  const stats = [
    {
      title: '投资组合',
      value: portfolioCount.toString(),
      icon: Briefcase,
      description: '活跃的投资组合',
      subtext: portfolioCount > 0 ? '已激活' : '暂无组合',
    },
    {
      title: '持仓总数',
      value: positionCount.toString(),
      icon: TrendingUp,
      description: '单个持仓数量',
      subtext: positionCount > 0 ? '跨所有组合' : '暂无持仓',
    },
    {
      title: '论点健康度',
      value: avgHealthScore.toString(),
      icon: Sparkles,
      description: 'AI 分析平均分数',
      subtext: avgHealthScore >= 70 ? '🟢 健康' : avgHealthScore >= 40 ? '🟡 预警' : '🔴 危机',
      isHealthScore: true,
    },
    {
      title: '需关注',
      value: warningAlertCount.toString(),
      icon: AlertTriangle,
      description: '需关注的持仓',
      subtext: warningAlertCount > 0 ? '有未处理提醒' : '全部正常',
      isWarning: warningAlertCount > 0,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${
              stat.isWarning ? 'text-red-500' : 'text-muted-foreground'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {stat.isHealthScore ? (
                <HealthScoreRing score={avgHealthScore} size={48} strokeWidth={5} showLabel={false} />
              ) : null}
              <div className="flex-1">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <p className={`text-xs mt-1 ${
                  stat.isWarning
                    ? 'text-red-600 dark:text-red-400'
                    : stat.isHealthScore
                      ? avgHealthScore >= 70
                        ? 'text-green-600 dark:text-green-400'
                        : avgHealthScore >= 40
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                }`}>
                  {stat.subtext}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
