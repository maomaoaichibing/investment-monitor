'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Bell } from 'lucide-react'

// 事件类型
interface UpcomingEvent {
  id: string
  date: string // 格式: 3月28日
  title: string
  description: string
  relatedPositions: string[]
  importance: 'high' | 'medium' | 'low'
  importanceLabel: string
}

// Mock 数据 - 未来7天的重要事件
// TODO: Replace with API call: GET /api/events/upcoming
const mockEvents: UpcomingEvent[] = [
  {
    id: '1',
    date: '3月28日',
    title: '美光科技(MU) Q2财报发布',
    description: '核心验证节点',
    relatedPositions: ['MU'],
    importance: 'high',
    importanceLabel: '重要'
  },
  {
    id: '2',
    date: '3月31日',
    title: '中国PMI数据公布',
    description: '影响中国复苏组合',
    relatedPositions: ['00883', 'NIO'],
    importance: 'medium',
    importanceLabel: '一般'
  },
  {
    id: '3',
    date: '4月2日',
    title: 'OPEC+会议',
    description: '影响油价走势，关联中国海洋石油',
    relatedPositions: ['00883'],
    importance: 'medium',
    importanceLabel: '一般'
  }
]

// 重要性颜色
const getImportanceStyles = (importance: UpcomingEvent['importance']) => {
  switch (importance) {
    case 'high':
      return {
        bg: 'bg-red-100 dark:bg-red-950/40',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-500 text-white',
        text: 'text-red-700 dark:text-red-400'
      }
    case 'medium':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-950/40',
        border: 'border-yellow-200 dark:border-yellow-800',
        badge: 'bg-yellow-500 text-white',
        text: 'text-yellow-700 dark:text-yellow-400'
      }
    case 'low':
    default:
      return {
        bg: 'bg-blue-100 dark:bg-blue-950/40',
        border: 'border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-500 text-white',
        text: 'text-blue-700 dark:text-blue-400'
      }
  }
}

export default function UpcomingEvents() {
  const events = mockEvents

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-500" />
          即将到来的事件
        </CardTitle>
        <span className="text-xs text-muted-foreground">未来7天</span>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无预定事件</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const styles = getImportanceStyles(event.importance)

              return (
                <div
                  key={event.id}
                  className={`rounded-lg border p-3 ${styles.bg} ${styles.border}`}
                >
                  {/* 日期 + 重要性标签 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-4 w-4 ${styles.text}`} />
                      <span className={`font-medium text-sm ${styles.text}`}>
                        {event.date}
                      </span>
                    </div>
                    <Badge className={`text-xs ${styles.badge}`}>
                      {event.importanceLabel}
                    </Badge>
                  </div>

                  {/* 事件标题 */}
                  <div className="font-medium text-sm mb-1">
                    {event.title}
                  </div>

                  {/* 描述 */}
                  <p className="text-xs text-muted-foreground mb-2">
                    {event.description}
                  </p>

                  {/* 关联持仓 */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <Bell className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">关联:</span>
                    {event.relatedPositions.map((pos, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs h-5 px-1.5"
                      >
                        {pos}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}