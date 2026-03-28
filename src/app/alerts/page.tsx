import { Bell } from 'lucide-react'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import AlertList from '@/components/alert/alert-list'

export default async function AlertsPage() {
  // 从数据库获取提醒
  const alerts = await db.alert.findMany({
    include: {
      position: {
        include: {
          portfolio: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      event: {
        select: {
          title: true
        }
      }
    },
    orderBy: {
      sentAt: 'desc'
    }
  })

  // 转换数据格式以适配 AlertList 组件
  const formattedAlerts = alerts.map(alert => ({
    id: alert.id,
    level: alert.level,
    title: alert.title,
    summary: alert.summary,
    status: alert.status,
    symbol: alert.position.symbol,
    assetName: alert.position.assetName,
    portfolio: alert.position.portfolio,
    sentAt: alert.sentAt.toISOString(),
    event: alert.event
  }))

  const unreadCount = alerts.filter(a => a.status === 'unread').length

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            提醒
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} 未读
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            监控投资提醒和通知
          </p>
        </div>
      </div>

      {/* 提醒列表 */}
      <AlertList initialAlerts={formattedAlerts} />
    </div>
  )
}