import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, TrendingUp, AlertTriangle, FileText } from 'lucide-react'
import { db } from '@/lib/db'

export default async function DashboardStats() {
  // 从数据库获取真实统计数据
  const [
    portfolioCount,
    positionCount,
    thesisCount,
    alertCount
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
    })
  ])

  const stats = [
    {
      title: '投资组合',
      value: portfolioCount.toString(),
      icon: Briefcase,
      description: '活跃的投资组合',
      change: portfolioCount > 0 ? '已激活' : '暂无组合',
    },
    {
      title: '持仓总数',
      value: positionCount.toString(),
      icon: TrendingUp,
      description: '单个持仓数量',
      change: positionCount > 0 ? '跨所有组合' : '暂无持仓',
    },
    {
      title: '活跃提醒',
      value: alertCount.toString(),
      icon: AlertTriangle,
      description: '需要关注',
      change: alertCount > 0 ? `${alertCount} 未读` : '全部已读',
    },
    {
      title: '投资逻辑',
      value: thesisCount.toString(),
      icon: FileText,
      description: '投资逻辑文档',
      change: thesisCount > 0 ? '分析完成' : '暂无逻辑',
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
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
            <p className={`text-xs mt-1 ${
              stat.title === 'Active Alerts' && parseInt(stat.value) > 0 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}