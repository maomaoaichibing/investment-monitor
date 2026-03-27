'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

// AI 动态项类型
interface AIFeedItem {
  id: string
  type: 'critical' | 'warning' | 'info' | 'routine'
  stockName: string
  stockSymbol: string
  message: string
  timestamp: string
}

export default function AIFeed() {
  const [feedItems, setFeedItems] = useState<AIFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAIFeed()
  }, [])

  const fetchAIFeed = async () => {
    try {
      setLoading(true)
      setError(null)

      // 从 API 获取提醒作为 AI 动态源
      const response = await fetch('/api/alerts?limit=8')
      const data = await response.json()

      if (data.success) {
        // 将 alerts 转换为 AI feed items
        const items: AIFeedItem[] = (data.data.alerts || []).map((alert: any) => {
          let type: AIFeedItem['type'] = 'info'
          if (alert.level === 'urgent' || alert.level === 'important') {
            type = 'critical'
          } else if (alert.level === 'watch') {
            type = 'warning'
          } else {
            type = 'info'
          }

          return {
            id: alert.id,
            type,
            stockName: alert.position?.assetName || '未知',
            stockSymbol: alert.position?.symbol || '',
            message: alert.summary,
            timestamp: alert.sentAt
          }
        })

        // 如果没有数据，显示例行分析
        if (items.length === 0) {
          items.push({
            id: 'routine-1',
            type: 'routine',
            stockName: '系统',
            stockSymbol: '',
            message: '所有持仓论点健康，AI 持续监控中',
            timestamp: new Date().toISOString()
          })
        }

        setFeedItems(items)
      }
    } catch (err) {
      console.error('Failed to fetch AI feed:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  // 获取类型的样式
  const getTypeStyles = (type: AIFeedItem['type']) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-l-red-500',
          icon: AlertTriangle,
          iconColor: 'text-red-500',
          badge: 'bg-red-500 text-white'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/30',
          border: 'border-l-yellow-500',
          icon: AlertTriangle,
          iconColor: 'text-yellow-500',
          badge: 'bg-yellow-500 text-white'
        }
      case 'info':
        return {
          bg: 'bg-green-50 dark:bg-green-950/30',
          border: 'border-l-green-500',
          icon: Info,
          iconColor: 'text-green-500',
          badge: 'bg-green-500 text-white'
        }
      case 'routine':
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/30',
          border: 'border-l-gray-400',
          icon: CheckCircle,
          iconColor: 'text-gray-400',
          badge: 'bg-gray-500 text-white'
        }
    }
  }

  // 获取类型标签
  const getTypeLabel = (type: AIFeedItem['type']) => {
    switch (type) {
      case 'critical': return '紧急'
      case 'warning': return '预警'
      case 'info': return '信息'
      case 'routine': return '例行'
      default: return '信息'
    }
  }

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI 动态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI 动态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            加载失败: {error}
          </div>
          <Button variant="outline" size="sm" onClick={fetchAIFeed} className="w-full">
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI 动态
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <a href="/alerts">查看全部</a>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {feedItems.map((item) => {
            const styles = getTypeStyles(item.type)
            const Icon = styles.icon

            return (
              <div
                key={item.id}
                className={`rounded-lg border-l-4 p-3 ${styles.bg} ${styles.border}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 mt-0.5 ${styles.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {item.stockSymbol && <span className="text-muted-foreground">{item.stockSymbol}</span>}
                        {item.stockName}
                      </span>
                      <Badge className={`text-xs ${styles.badge}`}>
                        {getTypeLabel(item.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.message}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
