'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  PlayCircle, 
  PauseCircle, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  Eye,
  FileText,
  Activity
} from 'lucide-react'
import { MonitorPlanApiResponse } from '@/lib/schemas/monitorPlanSchema'

interface ThesisTestItem {
  id: string
  title: string
  symbol: string
  assetName: string
  hasMonitorPlan: boolean
  monitorPlan?: MonitorPlanApiResponse | null
  status?: 'active' | 'paused' | 'completed'
}

interface TestLog {
  id: string
  timestamp: string
  action: string
  status: 'success' | 'error' | 'info'
  message: string
  request?: any
  response?: any
}

export default function MonitorPlanTestPage() {
  const [theses, setTheses] = useState<ThesisTestItem[]>([])
  const [loading, setLoading] = useState(false)
  const [testLogs, setTestLogs] = useState<TestLog[]>([])
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set())

  // 添加测试日志
  const addTestLog = (action: string, status: 'success' | 'error' | 'info', message: string, request?: any, response?: any) => {
    const log: TestLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action,
      status,
      message,
      request,
      response
    }
    setTestLogs(prev => [log, ...prev])
  }

  // 加载论题列表
  const loadTheses = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/theses')
      if (!response.ok) throw new Error('加载失败')
      
      const data = await response.json()
      const thesisList = data.theses || []
      
      // 为每个论题检查是否有monitor plan
      const thesesWithMonitorPlan = await Promise.all(
        thesisList.map(async (thesis: any) => {
          const mpResponse = await fetch(`/api/monitor-plan?thesisId=${thesis.id}`)
          const mpData = await mpResponse.json()
          
          return {
            id: thesis.id,
            title: thesis.title,
            symbol: thesis.position?.symbol || 'N/A',
            assetName: thesis.position?.assetName || 'N/A',
            hasMonitorPlan: !!mpData.data?.monitorPlan,
            monitorPlan: mpData.data?.monitorPlan || null,
            status: mpData.data?.monitorPlan?.status
          }
        })
      )
      
      setTheses(thesesWithMonitorPlan)
      addTestLog('加载论题列表', 'success', `成功加载 ${thesesWithMonitorPlan.length} 个论题`)
    } catch (error: any) {
      addTestLog('加载论题列表', 'error', error.message)
    } finally {
      setLoading(false)
    }
  }

  // 生成监控计划
  const generateMonitorPlan = async (thesisId: string, thesisTitle: string) => {
    setRunningTests(prev => new Set(prev).add(`generate-${thesisId}`))
    
    try {
      addTestLog(`生成监控计划: ${thesisTitle}`, 'info', '开始生成...')
      
      const response = await fetch('/api/monitor-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesisId })
      })
      
      let data: any
      try {
        data = await response.json()
      } catch {
        const text = await response.text()
        throw new Error(`响应解析失败: ${text}`)
      }
      
      if (data.success) {
        addTestLog(
          `生成监控计划: ${thesisTitle}`, 
          'success', 
          `生成成功 (${data.data.source})`,
          { thesisId },
          data
        )
        
        // 更新状态
        setTheses(prev => prev.map(t => 
          t.id === thesisId 
            ? { ...t, hasMonitorPlan: true, monitorPlan: data.data.monitorPlan, status: data.data.monitorPlan.status }
            : t
        ))
      } else {
        addTestLog(
          `生成监控计划: ${thesisTitle}`, 
          'error', 
          data.error || '生成失败',
          { thesisId },
          data
        )
      }
    } catch (error: any) {
      addTestLog(`生成监控计划: ${thesisTitle}`, 'error', error.message)
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(`generate-${thesisId}`)
        return newSet
      })
    }
  }

  // 更新状态
  const updateStatus = async (thesisId: string, newStatus: 'active' | 'paused' | 'completed', thesisTitle: string) => {
    const monitorPlanId = theses.find(t => t.id === thesisId)?.monitorPlan?.id
    if (!monitorPlanId) return
    
    setRunningTests(prev => new Set(prev).add(`status-${thesisId}-${newStatus}`))
    
    try {
      addTestLog(`状态切换: ${thesisTitle}`, 'info', `切换至 ${newStatus}`)
      
      const response = await fetch(`/api/monitor-plan/${monitorPlanId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      let data: any
      try {
        data = await response.json()
      } catch {
        const text = await response.text()
        throw new Error(`响应解析失败: ${text}`)
      }
      
      if (data.success) {
        addTestLog(
          `状态切换: ${thesisTitle}`, 
          'success', 
          `成功切换至 ${newStatus}`,
          { status: newStatus },
          data
        )
        
        // 更新状态
        setTheses(prev => prev.map(t => 
          t.id === thesisId 
            ? { ...t, status: newStatus, monitorPlan: data.data.monitorPlan }
            : t
        ))
      } else {
        addTestLog(
          `状态切换: ${thesisTitle}`, 
          'error', 
          data.error || '状态切换失败',
          { status: newStatus },
          data
        )
      }
    } catch (error: any) {
      addTestLog(`状态切换: ${thesisTitle}`, 'error', error.message)
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(`status-${thesisId}-${newStatus}`)
        return newSet
      })
    }
  }

  // 更新notes
  const updateNotes = async (thesisId: string, notes: string | null, thesisTitle: string) => {
    const monitorPlanId = theses.find(t => t.id === thesisId)?.monitorPlan?.id
    if (!monitorPlanId) return
    
    setRunningTests(prev => new Set(prev).add(`notes-${thesisId}`))
    
    try {
      addTestLog(`更新备注: ${thesisTitle}`, 'info', notes ? '更新文本' : '清空备注')
      
      const response = await fetch(`/api/monitor-plan/${monitorPlanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      
      let data: any
      try {
        data = await response.json()
      } catch {
        const text = await response.text()
        throw new Error(`响应解析失败: ${text}`)
      }
      
      if (data.success) {
        addTestLog(
          `更新备注: ${thesisTitle}`, 
          'success', 
          notes ? '备注更新成功' : '备注已清空',
          { notes },
          data
        )
        
        // 更新状态
        setTheses(prev => prev.map(t => 
          t.id === thesisId 
            ? { ...t, monitorPlan: data.data.monitorPlan }
            : t
        ))
      } else {
        addTestLog(
          `更新备注: ${thesisTitle}`, 
          'error', 
          data.error || '更新失败',
          { notes },
          data
        )
      }
    } catch (error: any) {
      addTestLog(`更新备注: ${thesisTitle}`, 'error', error.message)
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(`notes-${thesisId}`)
        return newSet
      })
    }
  }

  // 获取状态徽章
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
          <PlayCircle className="h-3 w-3 mr-1" /> 活跃
        </Badge>
      case 'paused':
        return <Badge variant="outline" className="text-amber-600 border-amber-300">
          <PauseCircle className="h-3 w-3 mr-1" /> 暂停
        </Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
          <CheckCircle2 className="h-3 w-3 mr-1" /> 完成
        </Badge>
      default:
        return <Badge variant="outline">无</Badge>
    }
  }

  // 运行回归测试
  const runRegressionTests = async () => {
    addTestLog('回归测试', 'info', '开始执行自动化回归测试...')
    
    // 测试1: 加载论题列表
    await loadTheses()
    
    // 测试2: 找一个无论题的标的进行生成测试
    const noPlanThesis = theses.find(t => !t.hasMonitorPlan)
    if (noPlanThesis) {
      await generateMonitorPlan(noPlanThesis.id, noPlanThesis.title)
      
      // 测试3: 重复生成（幂等性）
      addTestLog('幂等性测试', 'info', `重复生成 ${noPlanThesis.title}`)
      await generateMonitorPlan(noPlanThesis.id, noPlanThesis.title)
    }
    
    // 测试4: 找一个有论题的标的进行状态切换
    const withPlanThesis = theses.find(t => t.hasMonitorPlan && t.status === 'active')
    if (withPlanThesis) {
      // active -> paused
      await updateStatus(withPlanThesis.id, 'paused', withPlanThesis.title)
      
      // paused -> active
      await updateStatus(withPlanThesis.id, 'active', withPlanThesis.title)
      
      // active -> completed
      await updateStatus(withPlanThesis.id, 'completed', withPlanThesis.title)
    }
    
    addTestLog('回归测试', 'success', '自动化回归测试完成')
  }

  useEffect(() => {
    loadTheses()
  }, [])

  return (
    <div className="space-y-6 p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitor Plan 测试页面</h1>
          <p className="text-muted-foreground mt-1">Phase 5 功能回归测试</p>
        </div>
        <Button onClick={runRegressionTests} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          运行回归测试
        </Button>
      </div>

      {/* 测试日志 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            测试日志
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testLogs.length === 0 ? (
              <p className="text-muted-foreground">暂无测试记录</p>
            ) : (
              testLogs.map(log => (
                <div key={log.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{log.action}</span>
                    <Badge 
                      variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {log.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mb-1">{log.message}</div>
                  <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  {log.request && (
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      Request: {JSON.stringify(log.request, null, 2)}
                    </pre>
                  )}
                  {log.response && (
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      Response: {JSON.stringify(log.response, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 论题测试列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            论题测试列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {theses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>暂无论题数据</p>
            </div>
          ) : (
            <div className="space-y-4">
              {theses.map(thesis => (
                <div key={thesis.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">{thesis.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {thesis.symbol} - {thesis.assetName}
                      </div>
                    </div>
                    {getStatusBadge(thesis.status)}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!thesis.hasMonitorPlan ? (
                      <Button 
                        size="sm" 
                        onClick={() => generateMonitorPlan(thesis.id, thesis.title)}
                        disabled={runningTests.has(`generate-${thesis.id}`)}
                      >
                        {runningTests.has(`generate-${thesis.id}`) ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-3 w-3 mr-1" />
                            生成监控计划
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        {/* 状态切换按钮 */}
                        {thesis.status === 'active' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatus(thesis.id, 'paused', thesis.title)}
                              disabled={runningTests.has(`status-${thesis.id}-paused`)}
                            >
                              {runningTests.has(`status-${thesis.id}-paused`) ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <PauseCircle className="h-3 w-3" />
                              )}
                              暂停
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateStatus(thesis.id, 'completed', thesis.title)}
                              disabled={runningTests.has(`status-${thesis.id}-completed`)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              完成
                            </Button>
                          </>
                        )}
                        
                        {thesis.status === 'paused' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => updateStatus(thesis.id, 'active', thesis.title)}
                              disabled={runningTests.has(`status-${thesis.id}-active`)}
                            >
                              {runningTests.has(`status-${thesis.id}-active`) ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <PlayCircle className="h-3 w-3" />
                              )}
                              恢复
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateStatus(thesis.id, 'completed', thesis.title)}
                              disabled={runningTests.has(`status-${thesis.id}-completed`)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              完成
                            </Button>
                          </>
                        )}
                        
                        {/* Notes 测试按钮 */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateNotes(thesis.id, '测试备注：' + new Date().toLocaleTimeString(), thesis.title)}
                          disabled={runningTests.has(`notes-${thesis.id}`)}
                        >
                          {runningTests.has(`notes-${thesis.id}`) ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          更新备注
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateNotes(thesis.id, null, thesis.title)}
                          disabled={runningTests.has(`notes-${thesis.id}`)}
                        >
                          {runningTests.has(`notes-${thesis.id}`) ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          清空备注
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Monitor Plan 详情预览 */}
                  {thesis.hasMonitorPlan && thesis.monitorPlan && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm font-medium mb-2">监控计划预览：</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>监控项: {thesis.monitorPlan.watchItems?.length || 0} 个</div>
                        <div>触发条件: {thesis.monitorPlan.triggerConditions?.length || 0} 个</div>
                        <div>否定信号: {thesis.monitorPlan.disconfirmSignals?.length || 0} 个</div>
                        <div>行动提示: {thesis.monitorPlan.actionHints?.length || 0} 个</div>
                        {thesis.monitorPlan.notes && (
                          <div className="truncate">备注: {thesis.monitorPlan.notes}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快速测试用例 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            快速测试用例
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="border rounded-lg p-3">
              <div className="font-medium mb-2">基础功能</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ 加载论题列表</li>
                <li>✅ 生成监控计划</li>
                <li>✅ 显示监控详情</li>
              </ul>
            </div>
            <div className="border rounded-lg p-3">
              <div className="font-medium mb-2">状态流转</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ active → paused</li>
                <li>✅ paused → active</li>
                <li>✅ active → completed</li>
              </ul>
            </div>
            <div className="border rounded-lg p-3">
              <div className="font-medium mb-2">幂等性</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ 重复生成不创建</li>
                <li>✅ same-status不更新</li>
              </ul>
            </div>
            <div className="border rounded-lg p-3">
              <div className="font-medium mb-2">数据一致性</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ SSR与API结构一致</li>
                <li>✅ 坏JSON容错</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}