'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Activity, Settings } from 'lucide-react'

interface LLMProviderInfo {
  provider: string
  name: string
  models: string[]
  isConfigured: boolean
  isConnected?: boolean
}

interface LLMRequest {
  provider: string
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost?: number
}

export default function LLMManagementPage() {
  const [providers, setProviders] = useState<LLMProviderInfo[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [testMessage, setTestMessage] = useState<string>('请介绍一下你自己')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<LLMResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 加载提供商列表
  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/llm/providers')
      if (!response.ok) throw new Error('加载失败')
      const data = await response.json()
      setProviders(data.providers || [])
    } catch (error) {
      setErrorMessage('无法加载LLM提供商列表')
    }
  }

  const testConnection = async (provider: string) => {
    setSelectedProvider(provider)
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      })

      if (!response.ok) throw new Error('测试失败')

      const result = await response.json()
      
      setProviders(prev => prev.map(p => 
        p.provider === provider ? { ...p, isConnected: result.success } : p
      ))

      setErrorMessage(result.message)
    } catch (error) {
      setErrorMessage('无法连接到提供商')
    } finally {
      setIsTesting(false)
    }
  }

  const sendTestMessage = async () => {
    if (!selectedProvider || !testMessage.trim()) {
      setErrorMessage('请选择提供商并输入测试消息')
      return
    }

    setIsTesting(true)

    try {
      const request: LLMRequest = {
        provider: selectedProvider,
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'user',
            content: testMessage
          }
        ],
        temperature: 0.3,
        maxTokens: 1000
      }

      const response = await fetch('/api/llm/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) throw new Error('调用失败')

      const result = await response.json()
      setTestResult(result.data)
    } catch (error) {
      setErrorMessage('无法调用LLM服务')
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusBadge = (provider: LLMProviderInfo) => {
    if (!provider.isConfigured) {
      return <Badge variant="secondary" className="ml-2">未配置</Badge>
    }
    if (provider.isConnected === undefined) {
      return <Badge variant="outline" className="ml-2">未知</Badge>
    }
    if (provider.isConnected) {
      return <Badge className="ml-2 bg-green-500 hover:bg-green-600">已连接</Badge>
    }
    return <Badge variant="destructive" className="ml-2">连接失败</Badge>
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI模型管理</h1>
        <p className="text-muted-foreground">
          管理多个AI模型提供商，测试连接状态，优化模型配置
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}

      {/* 提供商列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            LLM提供商
          </CardTitle>
          <CardDescription>
            查看和管理所有支持的LLM提供商配置
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {providers.map((provider) => (
              <div key={provider.provider} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <h3 className="font-medium">{provider.name}</h3>
                    {getStatusBadge(provider)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    可用模型: {provider.models.join(', ')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testConnection(provider.provider)}
                  disabled={isTesting && selectedProvider === provider.provider}
                >
                  {isTesting && selectedProvider === provider.provider ? '测试中...' : '测试连接'}
                </Button>
              </div>
            ))}
            
            {providers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                加载中...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 测试工具 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            模型测试
          </CardTitle>
          <CardDescription>
            发送测试消息到选定的LLM提供商
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">选择提供商</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              <option value="">请选择...</option>
              {providers
                .filter(p => p.isConfigured)
                .map((provider) => (
                  <option key={provider.provider} value={provider.provider}>
                    {provider.name}
                  </option>
                ))
              }
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">测试消息</label>
            <textarea
              className="w-full p-2 border rounded-md min-h-[100px]"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="输入测试消息..."
            />
          </div>

          <Button
            onClick={sendTestMessage}
            disabled={isTesting || !selectedProvider}
          >
            {isTesting ? '发送中...' : '发送测试'}
          </Button>

          {testResult && (
            <div className="mt-6 p-4 border rounded-lg bg-muted">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">测试结果</h4>
                {testResult.cost !== undefined && (
                  <Badge variant="secondary">成本: ¥{testResult.cost.toFixed(4)}</Badge>
                )}
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{testResult.content}</p>
              </div>
              {testResult.usage && (
                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  Token使用: 输入 {testResult.usage.promptTokens} + 输出 {testResult.usage.completionTokens} = 总计 {testResult.usage.totalTokens}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}