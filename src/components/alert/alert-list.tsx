'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThinkingProcess, ThinkingStep } from '@/components/ui/thinking-process'
import { AlertTriangle, Bell, CheckCircle, Clock, Eye, Filter, RotateCw, Trash2, XCircle, AlertCircle, Info, Brain, ChevronDown, ChevronUp } from 'lucide-react'

// Alert 类型
interface Alert {
  id: string
  level: string
  title: string
  summary: string
  status: string
  symbol?: string
  assetName?: string
  position?: { symbol: string; assetName: string }
  portfolio?: { id: string; name: string }
  sentAt: string
  event?: { title: string } | null
  // TODO: 后续添加 analysisJson 字段存储完整分析链
}

// 获取级别颜色和图标配置
function getLevelConfig(level: string) {
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

function getStatusIcon(status: string) {
  switch (status) {
    case 'read':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'dismissed':
      return <XCircle className="h-4 w-4 text-gray-600" />
    default:
      return <Clock className="h-4 w-4 text-blue-600" />
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'read': return '已读'
    case 'dismissed': return '已忽略'
    default: return '未读'
  }
}

// 格式化相对时间
function formatRelativeTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return `${Math.floor(diff / (1000 * 60))}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

/**
 * 根据提醒数据生成 AI 分析步骤
 * TODO: 后续使用 alert.analysisJson 字段替代此函数
 */
function generateAlertThinkingSteps(alert: Alert): ThinkingStep[] {
  const symbol = alert.position?.symbol || alert.symbol || 'N/A'
  const assetName = alert.position?.assetName || alert.assetName || '未知'

  // 基于提醒内容生成分析
  const steps: ThinkingStep[] = [
    {
      id: 'event_recognition',
      label: '事件识别',
      status: 'done',
      result: `${alert.title}\n\n${alert.summary}`,
      duration: 150
    },
    {
      id: 'affected_pillars',
      label: '影响评估',
      status: 'done',
      result: `受影响标的: ${symbol} ${assetName}\n影响级别: ${alert.level === 'urgent' ? '紧急 ⚠️' : alert.level === 'important' ? '重要' : '关注'}\n影响描述: ${alert.summary}`,
      duration: 320,
      children: [
        {
          id: 'pillar_impact',
          label: `对 ${symbol} 持仓的影响`,
          status: 'done',
          result: alert.event?.title
            ? `触发事件: ${alert.event.title}`
            : '正在分析对投资论题的影响...'
        }
      ]
    },
    {
      id: 'cross_validation',
      label: '交叉验证',
      status: 'done',
      result: `关联投资论题: ${assetName}\n当前论题健康度: 需结合论题详情页分析\n相关风险触发条件: 检查中...`,
      duration: 280
    },
    {
      id: 'generate_suggestion',
      label: '生成建议',
      status: 'done',
      result: getSuggestionByLevel(alert.level, alert.summary),
      duration: 200
    }
  ]

  return steps
}

/**
 * 根据级别生成建议
 */
function getSuggestionByLevel(level: string, summary: string): string {
  switch (level) {
    case 'urgent':
      return `⚠️ 紧急处理建议:\n1. 立即查看 ${summary}\n2. 评估是否需要调整持仓\n3. 考虑设置止损或对冲`
    case 'important':
      return `📋 重要操作建议:\n1. 关注价格走势变化\n2. 核实信息来源可靠性\n3. 准备应对方案`
    case 'watch':
      return `👀 观察建议:\n1. 持续关注相关动态\n2. 记录关键价格点位\n3. 评估事态发展方向`
    default:
      return `ℹ️ 信息提示:\n1. 了解事件背景\n2. 保持常规关注\n3. 如有异常及时报告`
  }
}

export default function AlertList({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [filters, setFilters] = useState({
    status: 'all',
    level: 'all',
  })
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedAlerts)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedAlerts(newExpanded)
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filters.status === 'all' || alert.status === filters.status
    const matchesLevel = filters.level === 'all' || alert.level === filters.level
    return matchesStatus && matchesLevel
  })

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' })
      })
      setAlerts(alerts.map(a =>
        a.id === id ? { ...a, status: 'read' } : a
      ))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const dismissAlert = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' })
      })
      setAlerts(alerts.map(a =>
        a.id === id ? { ...a, status: 'dismissed' } : a
      ))
    } catch (error) {
      console.error('Failed to dismiss:', error)
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

  if (filteredAlerts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">暂无提醒</h3>
          <p className="text-muted-foreground mb-6">
            当投资逻辑触发条件时，提醒会显示在这里
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
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
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const levelConfig = getLevelConfig(alert.level)
          const LevelIcon = levelConfig.icon
          const isExpanded = expandedAlerts.has(alert.id)
          const thinkingSteps = generateAlertThinkingSteps(alert)

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
                        {alert.position?.symbol || alert.symbol || 'N/A'}
                      </span>
                      <span>{alert.position?.assetName || alert.assetName || '未知'}</span>
                      <span>|</span>
                      {alert.portfolio?.id ? (
                        <Link
                          href={`/portfolios/${alert.portfolio.id}`}
                          className="hover:text-primary"
                        >
                          {alert.portfolio?.name || '未知组合'}
                        </Link>
                      ) : (
                        <span>{alert.portfolio?.name || '未知组合'}</span>
                      )}
                      <span>|</span>
                      <span>{formatRelativeTime(new Date(alert.sentAt))}</span>
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

              {/* AI 分析过程展开区域 */}
              <CardContent className="pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(alert.id)}
                  className="w-full justify-center text-muted-foreground hover:text-primary border-t pt-3 mt-2"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {isExpanded ? '收起 AI 分析过程' : '查看 AI 分析过程'}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </Button>

                {isExpanded && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <ThinkingProcess
                      steps={thinkingSteps}
                      title={`AI 对 "${alert.title}" 的分析过程`}
                      progress={100}
                      variant="card"
                      defaultExpanded={true}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
