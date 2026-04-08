'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Bell, RefreshCw } from 'lucide-react'

interface UpcomingEvent {
  id: string
  date: string
  title: string
  description: string
  relatedPositions: string[]
  importance: 'high' | 'medium' | 'low'
  importanceLabel: string
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const r = await fetch('/api/dashboard/overview')
      const d = await r.json()
      if (d.success && d.data?.upcomingEvents) {
        setEvents(d.data.upcomingEvents)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const getImportanceStyles = (importance: UpcomingEvent['importance']) => {
    switch (importance) {
      case 'high':
        return { bg: 'bg-red-100 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800', badge: 'bg-red-500 text-white', text: 'text-red-700 dark:text-red-400' }
      case 'medium':
        return { bg: 'bg-yellow-100 dark:bg-yellow-950/40', border: 'border-yellow-200 dark:border-yellow-800', badge: 'bg-yellow-500 text-white', text: 'text-yellow-700 dark:text-yellow-400' }
      default:
        return { bg: 'bg-blue-100 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-500 text-white', text: 'text-blue-700 dark:text-blue-400' }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-500" />
          即将到来的事件
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">未来7天</span>
          <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无预定事件</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const styles = getImportanceStyles(event.importance)
              return (
                <div key={event.id} className={`rounded-lg border p-3 ${styles.bg} ${styles.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-4 w-4 ${styles.text}`} />
                      <span className={`font-medium text-sm ${styles.text}`}>{event.date}</span>
                    </div>
                    <Badge className={`text-xs ${styles.badge}`}>{event.importanceLabel}</Badge>
                  </div>
                  <div className="font-medium text-sm mb-1">{event.title}</div>
                  <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                  {event.relatedPositions.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Bell className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">关联:</span>
                      {event.relatedPositions.map((pos, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs h-5 px-1.5">{pos}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

