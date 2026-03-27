'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Bell, CheckCircle, Clock, Eye, Filter, RotateCw, Trash2, XCircle, AlertCircle, Info } from 'lucide-react'

// Alert 类型
type AlertLevel = 'urgent' | 'important' | 'watch' | 'info'
type AlertStatus = 'unread' | 'read' | 'dismissed'

interface Alert {
  id: string
  level: AlertLevel
  title: string
  summary: string
  status: AlertStatus
  position: { symbol: string; assetName: string }
  portfolio: { id: string; name: string }
  sentAt: string
  event?: { title: string }
  eventAnalysis?: { impactLevel: string }
}

// Mock 提醒数据
const mockAlerts: Alert[] = [
  {
    id: '1',
    level: 'urgent' as const,
    title: 'NVDA 跌破关键支撑位',
    summary: 'NVIDIA 股价跌破 $850 支撑位，触发止损预警。当前价格 $842，建议立即关注。',
    status: 'unread' as const,
    position: { symbol: 'NVDA', assetName: 'NVIDIA' },
    portfolio: { id: '1', name: '科技成长组合' },
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
    event: { title: '技术面破位' },
    eventAnalysis: { impactLevel: 'high' }
  },
  {
    id: '2',
    level: 'important' as const,
    title: 'NIO 交付数据低于预期',
    summary: '蔚来3月交付量 12,000 辆，低于市场预期的 15,000 辆。核心论点"交付量持续增长"受到挑战。',
    status: 'unread' as const,
    position: { symbol: 'NIO', assetName: '蔚来' },
    portfolio: { id: '3', name: '中国复苏组合' },
    sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5小时前
    event: { title: '交付量数据' },
    eventAnalysis: { impactLevel: 'medium' }
  },
  {
    id: '3',
    level: 'important' as const,
    title: 'MU 财报即将发布',
    summary: '美光科技将于下周三盘后发布Q2财报，市场预期 EPS $1.05。HBM 产能扩张进度是关键看点。',
    status: 'unread' as const,
    position: { symbol: 'MU', assetName: '美光科技' },
    portfolio: { id: '1', name: '科技成长组合' },
    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1天前
    event: { title: '财报发布' },
    eventAnalysis: { impactLevel: 'medium' }
  },
  {
    id: '4',
    level: 'watch' as const,
    title: 'PDD 海外业务 Temu 监管风险',
    summary: '欧盟拟对 Temu 实施更严格的产品安全审查，可能影响拼多多海外增长预期。',
    status: 'read' as const,
    position: { symbol: 'PDD', assetName: '拼多多' },
    portfolio: { id: '3', name: '中国复苏组合' },
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2天前
    event: { title: '监管动态' },
    eventAnalysis: { impactLevel: 'low' }
  },
  {
    id: '5',
    level: 'info' as const,
    title: '组合月度回顾已生成',
    summary: '科技成长组合3月回顾报告已自动生成，本月收益率 +3.2%，跑赢标普500 1.5个百分点。',
    status: 'read' as const,
    position: { symbol: 'NVDA', assetName: 'NVIDIA' },
    portfolio: { id: '1', name: '科技成长组合' },
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
    event: { title: '月度报告' },
    eventAnalysis: { impactLevel: 'info' }
  }
]

// 格式化相对时间
const formatRelativeTime = (timestamp: string) => {
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return `${Math.floor(diff / (1000 * 60))}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 获取级别颜色和图标
const getLevelConfig = (level: string) => {
  switch (level) {
    case 'urgent':
      return {
        color: 'border-l-red-500 bg-red-50/50',
        icon: AlertTriangle,
        iconColor: 'text-red-600',
        badgeColor: 'bg-red-100 text-red-700 border-red-200'
      }
    case 'important':
      return {
        color: 'border-l-orange-500 bg-orange-50/50',
        icon: AlertCircle,
        iconColor: 'text-orange-600',
        badgeColor: 'bg-orange-100 text-orange-700 border-orange-200'
      }
    case 'watch':
      return {
        color: 'border-l-blue-500 bg-blue-50/50',
        icon: Info,
        iconColor: 'text-blue-600',
        badgeColor: 'bg-blue-100 text-blue-700 border-blue-200'
      }
    default:
      return {
        color: 'border-l-gray-400 bg-gray-50/50',
        icon: Bell,
        iconColor: 'text-gray-600',
        badgeColor: 'bg-gray-100 text-gray-700 border-gray-200'
      }
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
    case 'read': return '已读'
    case 'dismissed': return '已忽略'
    default: return '未读'
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(mockAlerts)
  const [filters, setFilters] = useState({
    status: 'all',
    level: 'all',
  })

  // 过滤
  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filters.status === 'all' || alert.status === filters.status
    const matchesLevel = filters.level === 'all' || alert.level === filters.level
    return matchesStatus && matchesLevel
  })

  const unreadCount = alerts.filter(a => a.status === 'unread').length

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(a =>
      a.id === id ? { ...a, status: 'read' } : a
    ))
  }

  const dismissAlert = (id: string) => {
    setAlerts(alerts.map(a =>
      a.id === id ? { ...a, status: 'dismissed' } : a
    ))
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
        <Button variant="outline" size="sm">
          <RotateCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 筛选器 */}
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

      {/* 提醒列表 */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无提醒</h3>
            <p className="text-muted-foreground mb-6">
              当重要事件发生时，系统将自动生成提醒
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const levelConfig = getLevelConfig(alert.level)
            const LevelIcon = levelConfig.icon

            return (
              <Card
                key={alert.id}
                className={`hover:shadow-lg transition-all duration-200 border-l-4 ${levelConfig.color} ${
                  alert.status === 'read' ? 'opacity-75' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* 标题行 */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <LevelIcon className={`h-5 w-5 ${levelConfig.iconColor}`} />
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <Badge className={`text-xs ${levelConfig.badgeColor}`}>
                          {alert.level === 'urgent' ? '紧急' :
                           alert.level === 'important' ? '重要' :
                           alert.level === 'watch' ? '关注' : '信息'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(alert.status)}
                          <span className="text-xs text-muted-foreground">
                            {getStatusText(alert.status)}
                          </span>
                        </div>
                      </div>

                      {/* 内容摘要 */}
                      <CardDescription className="mb-3 text-base">
                        {alert.summary}
                      </CardDescription>

                      {/* 元信息 */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="font-medium bg-muted px-2 py-0.5 rounded">
                          {alert.position.symbol}
                        </span>
                        <span>{alert.position.assetName}</span>
                        <span>|</span>
                        <Link
                          href={`/portfolios/${alert.portfolio.id}`}
                          className="hover:text-primary"
                        >
                          {alert.portfolio.name}
                        </Link>
                        <span>|</span>
                        <span>{formatRelativeTime(alert.sentAt)}</span>
                        {alert.event && (
                          <>
                            <span>|</span>
                            <span>事件: {alert.event.title}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 ml-4">
                      {alert.status !== 'read' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                          title="标记已读"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {alert.status !== 'dismissed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissAlert(alert.id)}
                          title="忽略"
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
            )
          })}
        </div>
      )}
    </div>
  )
}