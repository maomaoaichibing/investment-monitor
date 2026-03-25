'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { getAlertLevelColor } from '@/lib/utils'
import { AlertApiResponse } from '@/lib/schemas/alertSchema'
import { useEffect, useState } from 'react'

export default function RecentAlerts() {
  const [alerts, setAlerts] = useState<AlertApiResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/alerts?limit=4')
      let data: any
      
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Invalid JSON response')
      }

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`)
      }

      if (data.success) {
        setAlerts(data.data.alerts)
      } else {
        throw new Error(data?.error || 'Failed to fetch alerts')
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
      setError(err instanceof Error ? err.message : '未知错误')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">最近提醒</CardTitle>
          <Button variant="ghost" size="sm">
            查看全部
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start justify-between rounded-lg border p-3">
                <div className="space-y-2 w-full">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">最近提醒</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchAlerts}>
            重试
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            加载提醒失败: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">最近提醒</CardTitle>
        <Button variant="ghost" size="sm">
          查看全部
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无提醒
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between rounded-lg border p-3 hover:bg-muted/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{alert.title}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getAlertLevelColor(alert.level)}`}
                    >
                      {alert.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {alert.position?.symbol || '未知'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {alert.summary}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {new Date(alert.sentAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}