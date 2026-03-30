'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Monitor, 
  EyeOff, 
  Calendar, 
  AlertCircle, 
  PlayCircle, 
  PauseCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
  Shield,
  Target,
  Bell,
  Activity,
  Edit,
  Save,
  X
} from 'lucide-react'
import { MonitorPlanApiResponse, UpdateMonitorPlanRequest } from '@/lib/schemas/monitorPlanSchema'
import EditMonitorPlanForm from '@/components/monitor-plan/EditMonitorPlanForm'

interface MonitorPlanViewProps {
  thesisId: string
  initialMonitorPlan?: MonitorPlanApiResponse | null
}

export default function MonitorPlanView({ thesisId, initialMonitorPlan }: MonitorPlanViewProps) {
  const [monitorPlan, setMonitorPlan] = useState<MonitorPlanApiResponse | null>(initialMonitorPlan || null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionStatus, setActionStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
  const [isEditing, setIsEditing] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  // 检查是否有monitor plan - 使用统一的API响应结构
  const hasMonitorPlan = monitorPlan && monitorPlan.id
  
  // 调试信息
  console.log('[MonitorPlan] Debug info:', {
    thesisId,
    monitorPlan,
    hasMonitorPlan,
    monitorPlanId: monitorPlan?.id,
    loading,
    generating,
    actionStatus
  })

  // 获取监控计划详情 - 使用useCallback避免无限重渲染
  const fetchMonitorPlan = useCallback(async () => {
    console.log('[MonitorPlan] fetchMonitorPlan called for thesisId:', thesisId)
    setLoading(true)
    setError(null)
    
    try {
      const url = `/api/monitor-plan?thesisId=${thesisId}`
      console.log('[MonitorPlan] Fetching from:', url)
      const response = await fetch(url)
      console.log('[MonitorPlan] Response status:', response.status)
      const data = await response.json()
      console.log('[MonitorPlan] Response data:', data)
      
      if (data.success) {
        // 直接使用API返回的结构化数据
        console.log('[MonitorPlan] Setting monitorPlan:', data.data.monitorPlan)
        setMonitorPlan(data.data.monitorPlan)
      } else {
        console.log('[MonitorPlan] No monitor plan found')
        setMonitorPlan(null)
        if (data.error) {
          setError(data.error)
        }
      }
    } catch (error: any) {
      console.error('[MonitorPlan] Failed to fetch monitor plan:', error)
      setError('获取监控计划失败')
    } finally {
      setLoading(false)
    }
  }, [thesisId])

  // 页面加载时获取最新数据
  useEffect(() => {
    console.log('[MonitorPlan] useEffect triggered, thesisId:', thesisId)
    fetchMonitorPlan()
  }, [thesisId, fetchMonitorPlan])

  // 生成监控计划（幂等）
  const handleGenerateMonitorPlan = async () => {
    console.log('[MonitorPlan] handleGenerateMonitorPlan called for thesis:', thesisId)
    console.log('[MonitorPlan] Current monitorPlan:', monitorPlan)
    console.log('[MonitorPlan] Current hasMonitorPlan:', hasMonitorPlan)
    
    if (hasMonitorPlan) {
      console.log('[MonitorPlan] Already has monitor plan, returning...')
      return
    }
    
    setGenerating(true)
    setActionStatus('generating')
    setError(null)
    
    try {
      console.log('[MonitorPlan] Sending POST request to /api/monitor-plan/generate')
      const response = await fetch('/api/monitor-plan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ thesisId }),
      })
      
      console.log('[MonitorPlan] Response status:', response.status)
      const data = await response.json()
      console.log('[MonitorPlan] Response data:', data)
      
      if (data.success) {
        // 使用API返回的统一结构化数据
        setMonitorPlan(data.data.monitorPlan)
        setActionStatus('success')
        console.log('[MonitorPlan] Monitor plan generated successfully:', data.data.monitorPlan)
        
        // 3秒后重置状态
        setTimeout(() => setActionStatus('idle'), 3000)
      } else {
        const errorMsg = data.error || '生成失败'
        console.error('[MonitorPlan] Generate failed:', errorMsg)
        setError(errorMsg)
        setActionStatus('error')
      }
    } catch (error: any) {
      console.error('[MonitorPlan] Exception during generate:', error)
      setError('生成监控计划失败: ' + (error.message || '网络错误'))
      setActionStatus('error')
    } finally {
      setGenerating(false)
    }
  }

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <PlayCircle className="h-3 w-3 mr-1" />
            活跃
          </Badge>
        )
      case 'paused':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <PauseCircle className="h-3 w-3 mr-1" />
            暂停
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            完成
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  // 获取优先级徽章
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
            高优先级
          </Badge>
        )
      case 'medium':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            中优先级
          </Badge>
        )
      case 'low':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">
            低优先级
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">{priority}</Badge>
        )
    }
  }

  // 获取严重程度徽章
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
            严重
          </Badge>
        )
      case 'major':
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            重大
          </Badge>
        )
      case 'minor':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
            轻微
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">{severity}</Badge>
        )
    }
  }

  // 使用API返回的统一结构化数据
  const monitorPlanData = monitorPlan || {}

  // 编辑监控计划
  const handleEdit = async (updatedData: UpdateMonitorPlanRequest) => {
    if (!monitorPlan?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/monitor-plan/${monitorPlan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMonitorPlan(result.data.monitorPlan)
        setIsEditing(false)
      } else {
        setError(result.error || '更新失败')
      }
    } catch (error: any) {
      console.error('Failed to update monitor plan:', error)
      setError('更新监控计划失败')
    } finally {
      setLoading(false)
    }
  }

  // 更新状态
  const handleStatusUpdate = async (newStatus: 'active' | 'paused' | 'completed') => {
    if (!monitorPlan?.id) return
    
    setStatusUpdating(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/monitor-plan/${monitorPlan.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMonitorPlan(result.data.monitorPlan)
      } else {
        setError(result.error || '状态更新失败')
      }
    } catch (error: any) {
      console.error('Failed to update status:', error)
      setError('更新状态失败')
    } finally {
      setStatusUpdating(false)
    }
  }

  // 状态流转按钮配置
  const StatusActionButtons = () => {
    if (!monitorPlan?.status) return null
    
    const currentStatus = monitorPlan.status
    
    // completed 状态不允许任何操作
    if (currentStatus === 'completed') {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          已完成
        </Badge>
      )
    }
    
    return (
      <div className="flex items-center gap-2">
        {currentStatus === 'active' && (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleStatusUpdate('paused')}
              disabled={statusUpdating}
            >
              {statusUpdating ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <PauseCircle className="h-3 w-3 mr-1" />
              )}
              暂停
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => handleStatusUpdate('completed')}
              disabled={statusUpdating}
            >
              标记完成
            </Button>
          </>
        )}
        
        {currentStatus === 'paused' && (
          <>
            <Button 
              size="sm" 
              variant="default" 
              onClick={() => handleStatusUpdate('active')}
              disabled={statusUpdating}
            >
              {statusUpdating ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <PlayCircle className="h-3 w-3 mr-1" />
              )}
              恢复
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => handleStatusUpdate('completed')}
              disabled={statusUpdating}
            >
              标记完成
            </Button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部控制区域 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{monitorPlan?.title || '监控计划'}</h2>
          </div>
          
          {hasMonitorPlan && monitorPlan?.status && (
            <div className="ml-2">
              {getStatusBadge(monitorPlan.status)}
            </div>
          )}
        </div>
        
        {!hasMonitorPlan ? (
          <Button 
            onClick={handleGenerateMonitorPlan} 
            className="gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : actionStatus === 'success' ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                已生成
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                生成监控计划
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {/* 编辑按钮 */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Edit className="h-3 w-3" />
              编辑
            </Button>
            
            {/* 状态切换按钮 */}
            <StatusActionButtons />
            
            <Button 
              variant="outline" 
              onClick={fetchMonitorPlan} 
              disabled={loading}
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              已生成 {new Date(monitorPlan.createdAt).toLocaleDateString('zh-CN')}
            </Badge>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 编辑表单 Modal */}
      {isEditing && monitorPlan && (
        <EditMonitorPlanForm
          monitorPlan={monitorPlan}
          onSave={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* 如果没有监控计划 */}
      {!hasMonitorPlan && !loading && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <EyeOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无监控计划</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                尚未为此投资论题生成监控计划。监控计划包含具体的监控指标、触发条件和行动建议。
              </p>
              <Button 
                onClick={handleGenerateMonitorPlan} 
                size="lg"
                className="gap-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    生成监控计划
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 加载状态 */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">加载监控计划中...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 监控计划内容 */}
      {hasMonitorPlan && (
        <div className="space-y-6">
          {/* Watch Items (监控项) */}
          {monitorPlan.watchItems && monitorPlan.watchItems.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Watch Items (监控项)
                </CardTitle>
                <CardDescription>
                  需要持续监控的关键指标和观察点
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monitorPlan.watchItems.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">{item.title}</div>
                          {item.priority && getPriorityBadge(item.priority)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.frequency === 'realtime' ? '实时' : 
                           item.frequency === 'daily' ? '每日' : 
                           item.frequency === 'weekly' ? '每周' : 
                           item.frequency === 'monthly' ? '每月' : 
                           item.frequency === 'quarterly' ? '每季度' : item.frequency}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">监控指标</div>
                          <div className="font-medium">{item.metric}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">阈值条件</div>
                          <div className="font-medium">{item.threshold}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <div className="text-muted-foreground">数据来源：</div>
                          <div>{item.source}</div>
                        </div>
                        {item.currentValue && (
                          <div>
                            <div className="text-muted-foreground">当前值：</div>
                            <div className="font-medium">{item.currentValue}</div>
                          </div>
                        )}
                      </div>
                      
                      {item.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm text-muted-foreground italic">备注：{item.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trigger Conditions (触发条件) */}
          {monitorPlan.triggerConditions && monitorPlan.triggerConditions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-600" />
                  Trigger Conditions (触发条件)
                </CardTitle>
                <CardDescription>
                  满足条件时应触发的行动
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monitorPlan.triggerConditions.map((condition: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold">{condition.condition}</div>
                        {condition.priority && getPriorityBadge(condition.priority)}
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-sm font-medium text-muted-foreground mb-1">条件说明</div>
                        <div>{condition.description}</div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-sm font-medium text-muted-foreground mb-1">触发行动</div>
                        <div className="font-medium bg-amber-50 p-3 rounded-md border border-amber-200">
                          {condition.action}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="text-muted-foreground">确认方式：</div>
                          <Badge variant="outline" className="text-xs">
                            {condition.confirmationMethod === 'manual' ? '人工确认' : 
                             condition.confirmationMethod === 'auto' ? '自动确认' : 'AI确认'}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground">
                          {condition.requiresConfirmation ? '需要确认' : '无需确认'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Frequency (复盘频率) */}
          {monitorPlan.reviewFrequency && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Review Frequency (复盘频率)
                </CardTitle>
                <CardDescription>
                  定期复盘和评估计划
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="text-4xl font-bold">
                      {monitorPlan.reviewFrequency === 'daily' ? '每日' : 
                       monitorPlan.reviewFrequency === 'weekly' ? '每周' : 
                       monitorPlan.reviewFrequency === 'biweekly' ? '每两周' : 
                       monitorPlan.reviewFrequency === 'monthly' ? '每月' : 
                       monitorPlan.reviewFrequency}
                    </div>
                    <div className="text-muted-foreground">复盘一次</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    建议在此频率下重新评估投资论题的有效性和监控计划的适用性
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disconfirm Signals (否定信号) */}
          {monitorPlan.disconfirmSignals && monitorPlan.disconfirmSignals.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Disconfirm Signals (否定信号)
                </CardTitle>
                <CardDescription>
                  可能推翻投资论题的关键信号
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monitorPlan.disconfirmSignals.map((signal: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold text-red-700 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {signal.signal}
                        </div>
                        {signal.severity && getSeverityBadge(signal.severity)}
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-sm font-medium text-muted-foreground mb-1">信号说明</div>
                        <div>{signal.description}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">应对措施</div>
                        <div className="font-medium bg-red-50 p-3 rounded-md border border-red-200">
                          {signal.response}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Hints (行动提示) */}
          {monitorPlan.actionHints && monitorPlan.actionHints.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Action Hints (行动提示)
                </CardTitle>
                <CardDescription>
                  特定场景下的建议行动
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monitorPlan.actionHints.map((hint: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold">{hint.scenario}</div>
                        {hint.priority && getPriorityBadge(hint.priority)}
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-sm font-medium text-muted-foreground mb-1">建议行动</div>
                        <div className="font-medium bg-green-50 p-3 rounded-md border border-green-200">
                          {hint.suggestedAction}
                        </div>
                      </div>
                      
                      {hint.rationale && (
                        <div className="text-sm text-muted-foreground italic">
                          逻辑：{hint.rationale}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes (备注) */}
          {monitorPlan.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-600" />
                  Notes (备注)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-muted-foreground">{monitorPlan.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}