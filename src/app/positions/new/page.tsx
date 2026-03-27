'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Plus, Loader2, Briefcase, Upload, Camera, Scan, X } from 'lucide-react'
import Link from 'next/link'

interface OcrResult {
  symbol: string
  name: string
  quantity: number
  price: number
}

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
  investmentThesis: string
}

interface NewPortfolioData {
  name: string
  description: string
}

export default function NewPositionPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // OCR 状态
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState('')
  const [ocrSuccess, setOcrSuccess] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [ocrResults, setOcrResults] = useState<OcrResult[]>([])
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
    investmentThesis: '',
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

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOcrError('')
    setOcrSuccess(false)
    setPreviewImage(URL.createObjectURL(file))
    await processOCR(file)
  }

  // 处理相机拍照
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOcrError('')
    setOcrSuccess(false)
    setPreviewImage(URL.createObjectURL(file))
    await processOCR(file)
  }

  // 调用 OCR API 识别持仓
  const processOCR = async (file: File) => {
    setOcrLoading(true)
    setOcrError('')

    try {
      const formDataOCR = new FormData()
      formDataOCR.append('file', file)

      const response = await fetch('/api/ocr/recognize', {
        method: 'POST',
        body: formDataOCR
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'OCR识别失败')
      }

      // 解析识别结果
      if (result.positions && result.positions.length > 0) {
        setOcrResults(result.positions)
        setOcrSuccess(true)

        // 如果只识别到一个标的，自动填充表单
        if (result.positions.length === 1) {
          const p = result.positions[0]
          setFormData(prev => ({
            ...prev,
            symbol: p.symbol || '',
            assetName: p.name || p.assetName || '',
            quantity: p.quantity?.toString() || '',
            costPrice: p.price || p.costPrice || '',
          }))
        }
      } else {
        setOcrError('未识别到持仓信息，请确保图片清晰或手动输入')
        setOcrResults([])
      }

    } catch (err: any) {
      setOcrError(err.message || 'OCR识别失败，请重试')
      setOcrResults([])
    } finally {
      setOcrLoading(false)
    }
  }

  // 选择OCR识别结果填充表单
  const selectOcrResult = (result: OcrResult) => {
    setFormData(prev => ({
      ...prev,
      symbol: result.symbol || '',
      assetName: result.name || '',
      quantity: result.quantity?.toString() || '',
      costPrice: result.price?.toString() || '',
    }))
    setOcrSuccess(false)
    setPreviewImage(null)
    setOcrResults([])
  }

  // 清除OCR结果
  const clearOcrResults = () => {
    setOcrSuccess(false)
    setPreviewImage(null)
    setOcrResults([])
    setOcrError('')
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

        {/* OCR 识别卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              OCR 识别标的
            </CardTitle>
            <CardDescription>
              上传持仓截图或拍照，自动识别股票代码和名称
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
                  onClick={clearOcrResults}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* OCR 识别结果 */}
            {ocrSuccess && ocrResults.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-green-800">
                    识别到 {ocrResults.length} 个标的
                  </p>
                  <Button variant="ghost" size="sm" onClick={clearOcrResults}>
                    清除
                  </Button>
                </div>
                <div className="space-y-2">
                  {ocrResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white rounded p-2 cursor-pointer hover:bg-green-100"
                      onClick={() => selectOcrResult(result)}
                    >
                      <div>
                        <span className="font-medium">{result.symbol}</span>
                        <span className="ml-2 text-muted-foreground">{result.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.quantity > 0 && <span>数量: {result.quantity}</span>}
                        {result.price > 0 && <span className="ml-2">价格: {result.price}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                {ocrResults.length > 1 && (
                  <p className="text-xs text-green-700 mt-2">
                    点击选择一个标的填充到表单，或手动编辑后创建
                  </p>
                )}
              </div>
            )}

            {/* OCR 加载状态 */}
            {ocrLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-muted-foreground">正在识别...</span>
              </div>
            )}

            {/* OCR 错误提示 */}
            {ocrError && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>{ocrError}</AlertDescription>
              </Alert>
            )}

            {/* 上传按钮 */}
            {!ocrLoading && (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上传图片
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  拍照识别
                </Button>
              </div>
            )}

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

            {/* 识别说明 */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">支持识别以下内容：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>券商APP持仓截图</li>
                <li>股票代码和名称</li>
                <li>持仓数量和成本价</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 标的表单 */}
        <Card>
          <CardHeader>
            <CardTitle>标的详情</CardTitle>
            <CardDescription>
              填写投资标的的基本信息（可从上方OCR识别或手动输入）
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

              {/* 投资理由 */}
              <div className="space-y-2">
                <Label htmlFor="investmentThesis">投资理由 <span className="text-xs text-muted-foreground">(AI分析核心输入)</span></Label>
                <Textarea
                  id="investmentThesis"
                  name="investmentThesis"
                  value={formData.investmentThesis}
                  onChange={handleInputChange}
                  placeholder="描述您的投资逻辑，例如：看好储能出海逻辑，欧洲需求爆发，公司市占率持续提升..."
                  rows={4}
                  disabled={isLoading}
                  className="border-primary/50"
                />
                <p className="text-xs text-muted-foreground">请详细描述您的投资理由，这将帮助AI生成更精准的监控框架</p>
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
