'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import Link from 'next/link'

// AI 动态项类型
interface AIFeedItem {
  id: string
  type: 'critical' | 'warning' | 'info' | 'routine'
  stockName: string
  stockSymbol: string
  message: string
  timestamp: string
}

// Mock 数据 - 按 prompt 要求填充至少5条示例动态
// TODO: Replace with API call: GET /api/ai-feed 或 GET /api/alerts
const mockFeedItems: AIFeedItem[] = [
  {
    id: '1',
    type: 'critical',
    stockName: '蔚来',
    stockSymbol: 'NIO',
    message: '月交付量环比下降23%，核心假设"交付量持续增长"面临挑战',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1小时前
  },
  {
    id: '2',
    type: 'warning',
    stockName: '中国海洋石油',
    stockSymbol: '00883',
    message: '布伦特原油跌破$70，接近风险触发价$65',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3小时前
  },
  {
    id: '3',
    type: 'info',
    stockName: '拼多多',
    stockSymbol: 'PDD',
    message: 'Q4财报发布，营收增速32%，符合预期',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5小时前
  },
  {
    id: '4',
    type: 'routine',
    stockName: '美光科技',
    stockSymbol: 'MU',
    message: '例行分析完成，论点健康度 82/100，无异常',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6小时前
  },
  {
    id: '5',
    type: 'routine',
    stockName: '系统',
    stockSymbol: '',
    message: '每日数据抓取完成，10个持仓数据已更新',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8小时前
  }
]

export default function AIFeedV2() {
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

  const feedItems = mockFeedItems

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
        {feedItems.length === 0 ? (
          // 无事件时显示持续监控状态
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

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border-l-4 p-3 bg-slate-50/50 dark:bg-slate-900/50 ${styles.border} hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors`}
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
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}