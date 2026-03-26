import DashboardStats from '@/components/dashboard/dashboard-stats'
import RecentAlerts from '@/components/dashboard/recent-alerts'
import RecentTheses from '@/components/dashboard/recent-theses'
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
        <DashboardStats />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RecentAlerts />
          <RecentTheses />
          <PortfolioOverview />
        </div>
      </div>
    </div>
  )
}