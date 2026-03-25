'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Plus, Loader2, Briefcase } from 'lucide-react'
import Link from 'next/link'

interface Portfolio {
  id: string
  name: string
  description?: string
  _count?: { positions: number }
}

interface PositionFormData {
  portfolioId: string
  symbol: string
  assetName: string
  market: string
  quantity: string
  costPrice: string
  positionWeight: string
  holdingStyle: string
  note: string
}

interface NewPortfolioData {
  name: string
  description: string
}

export default function NewPositionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('')
  const [showNewPortfolio, setShowNewPortfolio] = useState(false)
  const [formData, setFormData] = useState<PositionFormData>({
    portfolioId: '',
    symbol: '',
    assetName: '',
    market: 'A',
    quantity: '',
    costPrice: '',
    positionWeight: '',
    holdingStyle: 'long_term',
    note: '',
  })
  const [newPortfolioData, setNewPortfolioData] = useState<NewPortfolioData>({
    name: '',
    description: '',
  })
  const [creatingPortfolio, setCreatingPortfolio] = useState(false)

  // 加载投资组合列表
  useEffect(() => {
    fetchPortfolios()
  }, [])

  const fetchPortfolios = async () => {
    try {
      const response = await fetch('/api/portfolios')
      if (response.ok) {
        const data = await response.json()
        setPortfolios(data)
        if (data.length > 0) {
          setSelectedPortfolioId(data[0].id)
          setFormData(prev => ({ ...prev, portfolioId: data[0].id }))
        }
      }
    } catch (err) {
      console.error('获取组合列表失败:', err)
    } finally {
      setIsLoadingPortfolios(false)
    }
  }

  // 创建新组合
  const handleCreatePortfolio = async () => {
    if (!newPortfolioData.name.trim()) {
      setError('请输入组合名称')
      return
    }

    setCreatingPortfolio(true)
    setError(null)

    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPortfolioData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建组合失败')
      }

      // 刷新组合列表并选择新创建的组合
      await fetchPortfolios()
      setSelectedPortfolioId(data.id)
      setFormData(prev => ({ ...prev, portfolioId: data.id }))
      setShowNewPortfolio(false)
      setNewPortfolioData({ name: '', description: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建组合失败')
    } finally {
      setCreatingPortfolio(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePortfolioChange = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId)
    setFormData(prev => ({ ...prev, portfolioId }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.portfolioId) {
      setError('请选择或创建一个投资组合')
      return
    }

    if (!formData.symbol || !formData.assetName || !formData.quantity || !formData.costPrice) {
      setError('请填写必填字段')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const numericData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        costPrice: parseFloat(formData.costPrice),
        positionWeight: formData.positionWeight ? parseFloat(formData.positionWeight) : 0,
      }

      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(numericData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建持仓失败')
      }

      // 成功跳转到组合详情页
      router.push(`/portfolios/${formData.portfolioId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建持仓时发生错误')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 页面标题 */}
      <div className="mb-8">
        <Link href="/portfolios" className="flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回组合列表
        </Link>
        <h1 className="text-3xl font-bold">新建标的</h1>
        <p className="text-muted-foreground mt-2">添加新的投资标的到您的组合中</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* 组合选择 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              选择投资组合
            </CardTitle>
            <CardDescription>
              选择要添加标的的投资组合，或创建新组合
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 切换按钮 */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={showNewPortfolio ? "outline" : "default"}
                size="sm"
                onClick={() => setShowNewPortfolio(false)}
              >
                选择已有组合
              </Button>
              <Button
                variant={showNewPortfolio ? "default" : "outline"}
                size="sm"
                onClick={() => setShowNewPortfolio(true)}
              >
                创建新组合
              </Button>
            </div>

            {/* 选择已有组合 */}
            {!showNewPortfolio && (
              <div>
                {isLoadingPortfolios ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : portfolios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>暂无可用组合</p>
                    <Button variant="link" onClick={() => setShowNewPortfolio(true)}>
                      创建第一个组合
                    </Button>
                  </div>
                ) : (
                  <Select value={selectedPortfolioId} onValueChange={handlePortfolioChange}>
                    <SelectTrigger>
                      <SelectValue>选择投资组合</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{portfolio.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {portfolio._count?.positions || 0} 个持仓
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* 创建新组合 */}
            {showNewPortfolio && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portfolioName">组合名称 *</Label>
                  <Input
                    id="portfolioName"
                    value={newPortfolioData.name}
                    onChange={(e) => setNewPortfolioData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="如：我的科技组合"
                    disabled={creatingPortfolio}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolioDescription">组合描述</Label>
                  <Input
                    id="portfolioDescription"
                    value={newPortfolioData.description}
                    onChange={(e) => setNewPortfolioData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="组合的投资目标和策略（可选）"
                    disabled={creatingPortfolio}
                  />
                </div>
                <Button onClick={handleCreatePortfolio} disabled={creatingPortfolio}>
                  {creatingPortfolio && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  创建组合
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 标的表单 */}
        <Card>
          <CardHeader>
            <CardTitle>标的详情</CardTitle>
            <CardDescription>
              填写投资标的的基本信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 股票代码 */}
                <div className="space-y-2">
                  <Label htmlFor="symbol">股票代码 *</Label>
                  <Input
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="如: 000001.SZ"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">交易所标准代码</p>
                </div>

                {/* 资产名称 */}
                <div className="space-y-2">
                  <Label htmlFor="assetName">资产名称 *</Label>
                  <Input
                    id="assetName"
                    name="assetName"
                    value={formData.assetName}
                    onChange={handleInputChange}
                    placeholder="如: 平安银行"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* 市场 */}
                <div className="space-y-2">
                  <Label htmlFor="market">市场 *</Label>
                  <Select value={formData.market} onValueChange={(v) => handleSelectChange('market', v)} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue>选择市场</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A股</SelectItem>
                      <SelectItem value="HK">港股</SelectItem>
                      <SelectItem value="US">美股</SelectItem>
                      <SelectItem value="OTHER">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 持仓样式 */}
                <div className="space-y-2">
                  <Label htmlFor="holdingStyle">持仓样式 *</Label>
                  <Select value={formData.holdingStyle} onValueChange={(v) => handleSelectChange('holdingStyle', v)} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue>选择持仓样式</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long_term">长期</SelectItem>
                      <SelectItem value="swing">波段</SelectItem>
                      <SelectItem value="short_term">短期</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 数量 */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">数量 *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="如: 1000"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* 成本价 */}
                <div className="space-y-2">
                  <Label htmlFor="costPrice">成本价 *</Label>
                  <Input
                    id="costPrice"
                    name="costPrice"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    placeholder="如: 15.50"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* 持仓权重 */}
                <div className="space-y-2">
                  <Label htmlFor="positionWeight">持仓权重</Label>
                  <Input
                    id="positionWeight"
                    name="positionWeight"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.positionWeight}
                    onChange={handleInputChange}
                    placeholder="如: 25.5"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">0-100%，可选</p>
                </div>
              </div>

              {/* 备注 */}
              <div className="space-y-2">
                <Label htmlFor="note">备注</Label>
                <Textarea
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="持仓理由、投资逻辑等..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              {/* 按钮 */}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                  取消
                </Button>
                <Button type="submit" disabled={isLoading || !formData.portfolioId}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      创建标的
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
