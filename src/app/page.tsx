import DashboardStats from '@/components/dashboard/dashboard-stats'
import AIFeed from '@/components/dashboard/ai-feed'
import ThesisCard from '@/components/dashboard/thesis-card'
import PortfolioOverview from '@/components/dashboard/portfolio-overview'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">
          监控您的投资逻辑，接收智能提醒
        </p>
      </div>

      <div className="grid gap-6">
        {/* 顶部统计卡片 */}
        <DashboardStats />

        {/* 主要内容区：AI动态 | 论题卡片 | 组合概览 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AIFeed />
          <ThesisCard />
        </div>

        {/* 组合概览 */}
        <PortfolioOverview />
      </div>
    </div>
  )
}
