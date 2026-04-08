'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface PositionData {
  id: string
  portfolioId: string
  symbol: string
  assetName: string
  market: string
  quantity: number
  costPrice: number
  positionWeight: number
  holdingStyle: string
  investmentThesis: string
  portfolio?: { id: string; name: string }
}

interface Portfolio {
  id: string
  name: string
}

interface EditPositionClientProps {
  positionId: string
}

export function EditPositionClient({ positionId }: EditPositionClientProps) {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])

  const [formData, setFormData] = useState({
    portfolioId: '',
    symbol: '',
    assetName: '',
    market: 'A',
    quantity: '',
    costPrice: '',
    positionWeight: '',
    holdingStyle: 'long_term',
    investmentThesis: '',
  })

  const fetchPosition = async () => {
    try {
      const res = await fetch(`/api/positions/${positionId}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error('未找到该持仓')
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      const pos: PositionData = data.data || data

      setFormData({
        portfolioId: pos.portfolioId || pos.portfolio?.id || '',
        symbol: pos.symbol,
        assetName: pos.assetName,
        market: pos.market || 'A',
        quantity: String(pos.quantity),
        costPrice: String(pos.costPrice),
        positionWeight: String(pos.positionWeight || 0),
        holdingStyle: pos.holdingStyle || 'long_term',
        investmentThesis: pos.investmentThesis || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载持仓失败')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPortfolios = async () => {
    try {
      setIsLoadingPortfolios(true)
      const res = await fetch('/api/portfolios')
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.data?.portfolios || [])
        setPortfolios(list)
      }
    } catch {
      // 忽略错误
    } finally {
      setIsLoadingPortfolios(false)
    }
  }

  useEffect(() => {
    fetchPortfolios()
    fetchPosition()
  }, [positionId])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaveSuccess(false)
    setError(null)
  }

  const validate = () => {
    if (!formData.portfolioId) return '请选择所属投资组合'
    if (!formData.symbol.trim()) return '请输入股票代码'
    if (!formData.assetName.trim()) return '请输入资产名称'
    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) return '请输入有效的持仓数量'
    if (!formData.costPrice || isNaN(Number(formData.costPrice)) || Number(formData.costPrice) < 0) return '请输入有效的成本价'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/positions/${positionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: formData.portfolioId,
          symbol: formData.symbol.trim().toUpperCase(),
          assetName: formData.assetName.trim(),
          market: formData.market,
          quantity: Number(formData.quantity),
          costPrice: Number(formData.costPrice),
          positionWeight: Number(formData.positionWeight) || 0,
          holdingStyle: formData.holdingStyle,
          investmentThesis: formData.investmentThesis.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.message || `保存失败 (HTTP ${res.status})`)
      }

      setSaveSuccess(true)
      setTimeout(() => {
        router.push(`/positions/${positionId}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">加载持仓数据...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>编辑持仓信息</CardTitle>
        <CardDescription>修改 {formData.assetName || ''} ({formData.symbol || ''}) 的详细信息</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {saveSuccess && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">保存成功！正在跳转...</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="portfolioId">所属投资组合 *</Label>
            {isLoadingPortfolios ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载组合中...
              </div>
            ) : (
              <Select value={formData.portfolioId} onValueChange={(v) => handleChange('portfolioId', v)}>
                <SelectTrigger>
                  <SelectValue>
                    {portfolios.find(p => p.id === formData.portfolioId)?.name || '选择投资组合'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">股票代码 *</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => handleChange('symbol', e.target.value)}
                placeholder="如 300750"
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetName">资产名称 *</Label>
              <Input
                id="assetName"
                value={formData.assetName}
                onChange={(e) => handleChange('assetName', e.target.value)}
                placeholder="如 宁德时代"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="market">市场</Label>
              <Select value={formData.market} onValueChange={(v) => handleChange('market', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A股</SelectItem>
                  <SelectItem value="HK">港股</SelectItem>
                  <SelectItem value="US">美股</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="holdingStyle">持仓风格</Label>
              <Select value={formData.holdingStyle} onValueChange={(v) => handleChange('holdingStyle', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_term">短期</SelectItem>
                  <SelectItem value="swing">波段</SelectItem>
                  <SelectItem value="long_term">长期</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">持仓数量 *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="1"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">成本价 (¥) *</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => handleChange('costPrice', e.target.value)}
                placeholder="150.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="positionWeight">持仓权重 (%)</Label>
            <Input
              id="positionWeight"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.positionWeight}
              onChange={(e) => handleChange('positionWeight', e.target.value)}
              placeholder="20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="investmentThesis">投资备注</Label>
            <Textarea
              id="investmentThesis"
              value={formData.investmentThesis}
              onChange={(e) => handleChange('investmentThesis', e.target.value)}
              placeholder="记录该持仓的投资逻辑、买入理由等..."
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSaving || isLoadingPortfolios} className="flex-1">
              {isSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />保存中...</>
              ) : '保存修改'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/positions/${positionId}`}>取消</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
