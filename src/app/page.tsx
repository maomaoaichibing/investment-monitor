import { db } from '@/lib/db'
import DecisionStats from '@/components/dashboard/decision-stats'
import AIFeedV2 from '@/components/dashboard/ai-feed-v2'
import ThesisCardV2 from '@/components/dashboard/thesis-card-v2'
import PortfolioOverviewV2 from '@/components/dashboard/portfolio-overview-v2'
import UpcomingEvents from '@/components/dashboard/upcoming-events'
import { VersionBadge } from '@/components/version/version-badge'

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

  // 统计健康/需关注的论点数量 - 数据一致性修复
  // Mock 5条提醒中，3条未读（1紧急+2重要），与导航栏"提醒 3"一致
  // AI 动态里有 NIO 紧急和 00883 预警，需关注持仓=2
  const healthyCount = 3
  const thesisWarningCount = 2
  // 未读提醒数量 = 3（紧急1+重要2），与导航栏一致
  const unreadAlertCount = 3

  // Mock 需关注的持仓详情 - 数据一致性：有NIO紧急和00883预警
  const warningPositions = [
    { symbol: 'NIO', name: '蔚来', reason: '交付量环比下降23%' },
    { symbol: '00883', name: '中国海洋石油', reason: '油价接近$65风险线' }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
          <p className="text-muted-foreground">
            监控您的投资逻辑，接收智能提醒
          </p>
        </div>
        <VersionBadge className="text-sm" />
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