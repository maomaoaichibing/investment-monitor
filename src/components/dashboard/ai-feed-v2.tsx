'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, AlertTriangle, Info, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertApiResponse } from '@/lib/schemas/alertSchema'

// AI 动态项类型
interface AIFeedItem {
  id: string
  type: 'critical' | 'warning' | 'info' | 'routine'
  stockName: string
  stockSymbol: string
  message: string
  timestamp: string
}

export default function AIFeedV2() {
  const [feedItems, setFeedItems] = useState<AIFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/alerts?limit=10')
      if (!response.ok) throw new Error('获取提醒失败')
      const data = await response.json()

      if (data.success && data.data.alerts) {
        // 将 alerts 转换为 AI 动态格式
        const items: AIFeedItem[] = data.data.alerts.map((alert: AlertApiResponse) => {
          let type: AIFeedItem['type'] = 'info'
          if (alert.level === 'urgent') type = 'critical'
          else if (alert.level === 'important' || alert.level === 'watch') type = 'warning'

          return {
            id: alert.id,
            type,
            stockName: alert.position?.assetName || '未知',
            stockSymbol: alert.position?.symbol || '',
            message: alert.summary || alert.title,
            timestamp: alert.sentAt || alert.createdAt
          }
        })
        setFeedItems(items)
      } else {
        setFeedItems([])
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
      setError(err instanceof Error ? err.message : '未知错误')
      setFeedItems([])
    } finally {
      setLoading(false)
    }
  }

  // 获取类型的样式
  const getTypeStyles = (type: AIFeedItem['type']) => {
    switch (type) {
      case 'critical':
        return {
          dot: 'bg-red-500',
          border: 'border-l-red-500',
          icon: AlertTriangle,
          iconColor: 'text-red-500',
          badge: 'bg-red-500 text-white',
          label: '紧急'
        }
      case 'warning':
        return {
          dot: 'bg-yellow-500',
          border: 'border-l-yellow-500',
          icon: AlertTriangle,
          iconColor: 'text-yellow-500',
          badge: 'bg-yellow-500 text-white',
          label: '预警'
        }
      case 'info':
        return {
          dot: 'bg-green-500',
          border: 'border-l-green-500',
          icon: Info,
          iconColor: 'text-green-500',
          badge: 'bg-green-500 text-white',
          label: '信息'
        }
      case 'routine':
      default:
        return {
          dot: 'bg-gray-400',
          border: 'border-l-gray-400',
          icon: CheckCircle,
          iconColor: 'text-gray-400',
          badge: 'bg-gray-500 text-white',
          label: '例行'
        }
    }
  }

  // 格式化相对时间
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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
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
          <Link href="/alerts">查看全部</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-6">
            <p className="text-sm text-red-500">加载失败: {error}</p>
            <Button variant="ghost" size="sm" onClick={fetchAlerts} className="mt-2">
              重试
            </Button>
          </div>
        ) : feedItems.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              所有持仓论点健康，AI 持续监控中
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              最近检查：10分钟前
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedItems.map((item) => {
              const styles = getTypeStyles(item.type)
              const Icon = styles.icon

              // 生成链接：直接链接到 alerts 列表页（包含该 alert 的详情）
              const linkHref = `/alerts`

              return (
                <Link
                  key={item.id}
                  href={linkHref}
                  className={`block rounded-lg border-l-4 p-3 bg-slate-50/50 dark:bg-slate-900/50 ${styles.border} hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    {/* 彩色圆点 */}
                    <div className={`w-2 h-2 rounded-full mt-2 ${styles.dot}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* 股票代码和名称 */}
                        {item.stockSymbol && (
                          <span className="font-medium text-sm">
                            {item.stockSymbol}
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {item.stockName}
                        </span>
                        {/* 级别标签 */}
                        <Badge className={`text-xs ${styles.badge}`}>
                          {styles.label}
                        </Badge>
                      </div>
                      {/* 消息内容 */}
                      <p className="text-sm text-foreground leading-relaxed">
                        {item.message}
                      </p>
                      {/* 时间 */}
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}