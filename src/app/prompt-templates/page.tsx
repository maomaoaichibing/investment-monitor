'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Edit, Plus, Trash2, Copy } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PromptTemplate {
  id: string
  name: string
  description: string
  modelType: string
  provider: string
  template: string
  variables: string
  examples?: string
  version: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function PromptTemplatePage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    modelType: '',
    provider: 'kimi',
    template: '',
    variables: '',
    examples: '',
    version: '1.0'
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/prompt-templates')
      if (!response.ok) throw new Error('加载失败')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      setErrorMessage('无法加载Prompt模板列表')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingId('new')
    setFormData({
      name: '',
      description: '',
      modelType: '',
      provider: 'kimi',
      template: '',
      variables: '',
      examples: '',
      version: '1.0'
    })
  }

  const handleEdit = (template: PromptTemplate) => {
    setEditingId(template.id)
    setFormData({
      name: template.name,
      description: template.description,
      modelType: template.modelType,
      provider: template.provider,
      template: template.template,
      variables: template.variables,
      examples: template.examples || '',
      version: template.version
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      modelType: '',
      provider: 'kimi',
      template: '',
      variables: '',
      examples: '',
      version: '1.0'
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个模板吗？')) return

    try {
      const response = await fetch(`/api/prompt-templates/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('删除失败')

      setErrorMessage('Prompt模板已删除')
      loadTemplates()
    } catch (error) {
      setErrorMessage('无法删除Prompt模板')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = editingId && editingId !== 'new'
      ? `/api/prompt-templates/${editingId}`
      : '/api/prompt-templates'

    const method = editingId && editingId !== 'new' ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('保存失败')

      setErrorMessage(editingId && editingId !== 'new' ? '更新成功' : '创建成功')
      setEditingId(null)
      loadTemplates()
    } catch (error) {
      setErrorMessage('无法保存Prompt模板')
    }
  }

  const handleCopyTemplate = (template: PromptTemplate) => {
    const text = `模板名称: ${template.name}\n版本: ${template.version}\n提供商: ${template.provider}\n类型: ${template.modelType}\n\n模板内容:\n${template.template}`
    navigator.clipboard.writeText(text)
    setErrorMessage('Prompt模板已复制到剪贴板')
  }

  const getProviderBadge = (provider: string) => {
    const providerColors: Record<string, string> = {
      kimi: 'bg-blue-500',
      openai: 'bg-emerald-500',
      claude: 'bg-purple-500',
      deepseek: 'bg-orange-500',
      local: 'bg-gray-500'
    }
    return providerColors[provider] || 'bg-gray-500'
  }

  const getModelTypeBadge = (modelType: string) => {
    const typeColors: Record<string, string> = {
      thesis_generation: 'bg-indigo-500',
      event_analysis: 'bg-amber-500',
      alert_impact: 'bg-red-500',
      daily_summary: 'bg-sky-500',
      risk_assessment: 'bg-violet-500',
      custom: 'bg-gray-500'
    }
    return typeColors[modelType] || 'bg-gray-500'
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt模板管理</h1>
          <p className="text-muted-foreground">
            管理AI模型的Prompt模板，优化生成效果
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建模板
        </Button>
      </div>

      {/* 模板列表 */}
      <Card>
        <CardHeader>
          <CardTitle>模板列表</CardTitle>
          <CardDescription>
            所有可用的Prompt模板，点击编辑或删除
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              加载中...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无Prompt模板
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{template.name}</h3>
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? '启用' : '禁用'}
                        </Badge>
                        <Badge className={getProviderBadge(template.provider)}>
                          {template.provider}
                        </Badge>
                        <Badge className={getModelTypeBadge(template.modelType)}>
                          {template.modelType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>版本: {template.version}</span>
                        <span>变量: {template.variables}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyTemplate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑模板表单 */}
      {editingId && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              {editingId === 'new' ? '创建模板' : '编辑模板'}
            </CardTitle>
            <CardDescription>
              定义Prompt模板的名称、描述、内容和变量
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">模板名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述 *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelType">模型类型 *</Label>
                <Select
                  value={formData.modelType}
                  onValueChange={(value) => setFormData({ ...formData, modelType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thesis_generation">投资论题生成</SelectItem>
                    <SelectItem value="event_analysis">事件分析</SelectItem>
                    <SelectItem value="alert_impact">提醒影响分析</SelectItem>
                    <SelectItem value="daily_summary">每日摘要</SelectItem>
                    <SelectItem value="risk_assessment">风险评估</SelectItem>
                    <SelectItem value="custom">自定义</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">提供商 *</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kimi">Kimi (月之暗面)</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                    <SelectItem value="local">本地模型</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">模板内容 *</Label>
              <Textarea
                id="template"
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                required
                className="min-h-[200px] font-mono text-sm"
                placeholder={`示例: 你是一个专业的投资分析师。请分析以下内容：{content}\n\n要求：\n1. ...\n2. ...`}
              />
              <p className="text-xs text-muted-foreground">
                使用 {'{variable}'} 格式定义变量，例如: {'{content}'}, {'{symbol}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variables">变量列表</Label>
              <Input
                id="variables"
                value={formData.variables}
                onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                placeholder="content, symbol, position"
              />
              <p className="text-xs text-muted-foreground">
                用逗号分隔的变量名列表
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="examples">示例 (可选)</Label>
              <Textarea
                id="examples"
                value={formData.examples}
                onChange={(e) => setFormData({ ...formData, examples: e.target.value })}
                className="min-h-[100px] font-mono text-sm"
                placeholder={`示例输入和输出...`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">版本</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="1.0"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button type="submit">
                {editingId === 'new' ? '创建' : '更新'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  )
}