import { db } from '@/lib/db'
import DecisionStats from '@/components/dashboard/decision-stats'
import AIFeedV2 from '@/components/dashboard/ai-feed-v2'
import ThesisCardV2 from '@/components/dashboard/thesis-card-v2'
import PortfolioOverviewV2 from '@/components/dashboard/portfolio-overview-v2'
import UpcomingEvents from '@/components/dashboard/upcoming-events'

export default async function HomePage() {
  // 从数据库获取真实统计数据
  const [
    portfolioCount,
    positionCount,
    thesisCount,
    theses
  ] = await Promise.all([
    // 组合数量
    db.portfolio.count(),

    // 持仓数量
    db.position.count(),

    // 投资论题数量
    db.thesis.count(),

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

  // 统计健康/需关注的论点数量
  const healthyCount = validHealthScores.filter(s => s >= 70).length
  const thesisWarningCount = validHealthScores.filter(s => s < 70).length

  // Mock 需关注的持仓详情（实际应从数据库查询）
  // TODO: 后续从 API 获取真实数据
  const warningPositions = warningAlertCount > 0
    ? [
        { symbol: 'NIO', name: '蔚来', reason: '交付量环比下降' },
        { symbol: '00883', name: '中国海洋石油', reason: '油价波动风险' }
      ]
    : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">
          监控您的投资逻辑，接收智能提醒
        </p>
      </div>

      <div className="grid gap-6">
        {/* 顶部统计卡片 - 4张有决策价值的卡片 */}
        <DecisionStats
          portfolioCount={portfolioCount}
          positionCount={positionCount}
          avgHealthScore={avgHealthScore}
          healthyCount={healthyCount}
          warningCount={thesisWarningCount}
          warningPositions={warningPositions}
        />

        {/* 主要内容区：AI动态 | 论题卡片 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AIFeedV2 />
          <ThesisCardV2 />
        </div>

        {/* 第二行：组合概览 + 即将到来的事件 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PortfolioOverviewV2 />
          </div>
          <div>
            <UpcomingEvents />
          </div>
        </div>
      </div>
    </div>
  )
}