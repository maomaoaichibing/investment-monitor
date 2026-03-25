'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Bell, CheckCircle, Clock, Eye, Filter, RotateCw, Trash2, XCircle } from 'lucide-react'
import { AlertApiResponse } from '@/lib/schemas/alertSchema'
import { getAlertLevelColor, formatDateTime } from '@/lib/utils'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertApiResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: 'all',
    level: 'all',
  })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAlerts()
  }, [filters])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.level !== 'all') params.append('level', filters.level)
      params.append('limit', '50')
      
      const response = await fetch(`/api/alerts?${params}`)
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
      setError(err instanceof Error ? err.message : 'Unknown error')
      setAlerts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshAlerts = () => {
    setRefreshing(true)
    fetchAlerts()
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      })
      
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
        setAlerts(alerts.map(a => a.id === id ? data.data.alert : a))
      }
    } catch (error) {
      console.error('Failed to mark alert as read:', error)
    }
  }

  const dismissAlert = async (id: string) => {
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      })
      
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
        setAlerts(alerts.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'dismissed':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'read':
        return '已读'
      case 'dismissed':
        return '已忽略'
      default:
        return '未读'
    }
  }

  const filterOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'unread', label: '未读' },
    { value: 'read', label: '已读' },
    { value: 'dismissed', label: '已忽略' },
  ]

  const levelOptions = [
    { value: 'all', label: '全部级别' },
    { value: 'urgent', label: '紧急' },
    { value: 'important', label: '重要' },
    { value: 'watch', label: '关注' },
    { value: 'info', label: '信息' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            提醒
          </h1>
          <p className="text-muted-foreground">
            监控投资提醒和通知
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAlerts}
            disabled={refreshing}
          >
            <RotateCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-1 border rounded-md text-sm bg-background"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            className="px-3 py-1 border rounded-md text-sm bg-background"
          >
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">加载提醒失败</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={refreshAlerts}>
              <RotateCw className="mr-2 h-4 w-4" />
              重试
            </Button>
          </CardContent>
        </Card>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无提醒</h3>
            <p className="text-muted-foreground mb-6">
              当重要事件发生时，系统将自动生成提醒
            </p>
            <Button variant="outline" onClick={refreshAlerts}>
              <RotateCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getAlertLevelColor(alert.level)}`}
                      >
                        {alert.level}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(alert.status)}
                        <span className="text-xs text-muted-foreground">
                          {getStatusText(alert.status)}
                        </span>
                      </div>
                    </div>
                    
                    <CardDescription className="mb-3">
                      {alert.summary}
                    </CardDescription>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium">
                        {alert.position?.symbol || '未知'}
                      </span>
                      <span>{alert.position?.assetName || '未知资产'}</span>
                      <span>{formatDateTime(alert.sentAt)}</span>
                      
                      {alert.event && (
                        <span className="flex items-center gap-1">
                          <span>事件:</span>
                          <span className="font-medium">{alert.event.title}</span>
                        </span>
                      )}
                      
                      {alert.eventAnalysis && (
                        <span className="flex items-center gap-1">
                          <span>影响:</span>
                          <span className="font-medium">{alert.eventAnalysis.impactLevel}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(alert.id)}
                      disabled={alert.status === 'read'}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    
                    {alert.status !== 'dismissed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/alerts/${alert.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
