'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, X } from 'lucide-react'
import { HoldingStyleSchema } from '@/lib/schemas'

interface CreatePositionFormProps {
  portfolioId: string
  onSuccess?: () => void
  onCancel?: () => void
}

const holdingStyleOptions = HoldingStyleSchema.options

export default function CreatePositionForm({ portfolioId, onSuccess, onCancel }: CreatePositionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    portfolioId,
    symbol: '',
    assetName: '',
    market: 'SSE',
    quantity: '',
    costPrice: '',
    positionWeight: '',
    holdingStyle: 'long_term' as const,
    note: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // 验证输入
      const numericData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        costPrice: parseFloat(formData.costPrice),
        positionWeight: parseFloat(formData.positionWeight),
      }

      // 发送API请求
      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(numericData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建持仓失败')
      }

      // 成功处理
      if (onSuccess) {
        onSuccess()
      } else {
        // 刷新页面
        router.refresh()
      }
      
      // 重置表单
      setFormData({
        portfolioId,
        symbol: '',
        assetName: '',
        market: 'SSE',
        quantity: '',
        costPrice: '',
        positionWeight: '',
        holdingStyle: 'long_term',
        note: '',
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : '创建持仓时发生错误')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">新增持仓</h3>
          <p className="text-sm text-muted-foreground">为此投资组合添加新的持仓</p>
        </div>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            <p className="text-xs text-muted-foreground">交易所标准代码，如 000001.SZ、AAPL</p>
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
            <Select
              value={formData.market}
              onValueChange={(value) => handleSelectChange('market', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue>选择市场</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SSE">上海证券交易所</SelectItem>
                <SelectItem value="SZSE">深圳证券交易所</SelectItem>
                <SelectItem value="HKEX">香港交易所</SelectItem>
                <SelectItem value="NASDAQ">纳斯达克</SelectItem>
                <SelectItem value="NYSE">纽约证券交易所</SelectItem>
                <SelectItem value="OTHER">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 持仓样式 */}
          <div className="space-y-2">
            <Label htmlFor="holdingStyle">持仓样式 *</Label>
            <Select
              value={formData.holdingStyle}
              onValueChange={(value) => handleSelectChange('holdingStyle', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue>选择持仓样式</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {holdingStyleOptions.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style === 'short_term' ? '短期' : 
                     style === 'swing' ? '波段' : 
                     '长期'}
                  </SelectItem>
                ))}
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
            <p className="text-xs text-muted-foreground">持仓数量，必须为正数</p>
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
            <p className="text-xs text-muted-foreground">每股成本价，必须为正数</p>
          </div>

          {/* 持仓权重 */}
          <div className="space-y-2">
            <Label htmlFor="positionWeight">持仓权重 *</Label>
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
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">0-100%，表示在组合中的权重</p>
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
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              取消
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                创建持仓
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}