'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Briefcase, 
  ArrowLeft, 
  Upload, 
  Camera, 
  Loader2, 
  Check,
  X,
  Trash2,
  Plus,
  FileText,
  Scan
} from 'lucide-react'

interface PositionData {
  symbol: string
  assetName: string
  quantity: number
  costPrice: number
}

export default function NewPortfolioPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [positions, setPositions] = useState<PositionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // OCR 状态
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setOcrError('')
    setPreviewImage(URL.createObjectURL(file))
    await processOCR(file)
  }

  // 处理相机拍照
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setOcrError('')
    setPreviewImage(URL.createObjectURL(file))
    await processOCR(file)
  }

  // 调用 OCR API 识别持仓
  const processOCR = async (file: File) => {
    setOcrLoading(true)
    setOcrError('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/ocr/recognize', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'OCR识别失败')
      }
      
      // 解析识别结果并添加到持仓列表
      if (result.positions && result.positions.length > 0) {
        const newPositions = result.positions.map((p: any) => ({
          symbol: p.symbol || '',
          assetName: p.name || p.assetName || '',
          quantity: parseFloat(p.quantity) || 0,
          costPrice: parseFloat(p.price) || parseFloat(p.costPrice) || 0
        }))
        
        setPositions(prev => [...prev, ...newPositions.filter((p: PositionData) => p.symbol)])
        setPreviewImage(null) // 识别成功后清除预览
      } else {
        setOcrError('未识别到持仓信息，请确保图片清晰')
      }
      
    } catch (err: any) {
      setOcrError(err.message || 'OCR识别失败，请重试')
    } finally {
      setOcrLoading(false)
    }
  }

  // 添加手动持仓
  const addManualPosition = () => {
    setPositions(prev => [...prev, {
      symbol: '',
      assetName: '',
      quantity: 0,
      costPrice: 0
    }])
  }

  // 更新持仓信息
  const updatePosition = (index: number, field: keyof PositionData, value: any) => {
    setPositions(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ))
  }

  // 删除持仓
  const removePosition = (index: number) => {
    setPositions(prev => prev.filter((_, i) => i !== index))
  }

  // 提交创建组合
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('请输入组合名称')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          positions: positions.filter(p => p.symbol && p.quantity > 0)
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '创建失败')
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.push(`/portfolios/${result.portfolio.id}`)
      }, 1500)
      
    } catch (err: any) {
      setError(err.message || '创建组合失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            组合创建成功！正在跳转到详情页...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/portfolios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">新建投资组合</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* 基本信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                基本信息
              </CardTitle>
              <CardDescription>
                输入投资组合的基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">组合名称 *</Label>
                <Input
                  id="name"
                  placeholder="例如：科技成长组合"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">组合描述</Label>
                <Textarea
                  id="description"
                  placeholder="描述这个投资组合的投资策略和目标..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* OCR 识别卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                OCR 识别持仓
              </CardTitle>
              <CardDescription>
                上传持仓截图或拍照，自动识别股票信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 图片预览 */}
              {previewImage && (
                <div className="relative mb-4">
                  <img 
                    src={previewImage} 
                    alt="预览" 
                    className="max-h-48 rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {/* 上传按钮 */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ocrLoading}
                >
                  {ocrLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  上传图片
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={ocrLoading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  拍照识别
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
              
              {/* OCR 错误提示 */}
              {ocrError && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>{ocrError}</AlertDescription>
                </Alert>
              )}
              
              {/* 识别说明 */}
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-1">支持识别以下内容：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>券商APP持仓截图</li>
                  <li>股票代码、数量、成本价</li>
                  <li>表格形式的持仓明细</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 持仓列表卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  持仓列表 ({positions.length})
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addManualPosition}>
                  <Plus className="h-4 w-4 mr-1" />
                  手动添加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>暂无持仓</p>
                  <p className="text-sm">通过OCR识别或手动添加持仓</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {positions.map((position, index) => (
                    <div 
                      key={index}
                      className="flex items-end gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">股票代码</Label>
                            <Input
                              placeholder="例如：600519"
                              value={position.symbol}
                              onChange={(e) => updatePosition(index, 'symbol', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">股票名称</Label>
                            <Input
                              placeholder="例如：贵州茅台"
                              value={position.assetName}
                              onChange={(e) => updatePosition(index, 'assetName', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">持仓数量</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={position.quantity || ''}
                              onChange={(e) => updatePosition(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">成本价</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={position.costPrice || ''}
                              onChange={(e) => updatePosition(index, 'costPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePosition(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              创建组合
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
