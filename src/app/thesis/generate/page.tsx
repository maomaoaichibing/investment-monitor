'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, ArrowLeft, FileText } from 'lucide-react'

export default function GenerateThesisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const positionId = searchParams.get('positionId')
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [thesisId, setThesisId] = useState<string | null>(null)
  const [generatedThesis, setGeneratedThesis] = useState<any>(null)

  useEffect(() => {
    if (!positionId) {
      setError('缺少持仓ID参数')
      return
    }

    // 自动开始生成Thesis
    generateThesis()
  }, [positionId])

  const generateThesis = async () => {
    if (!positionId) return

    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/thesis/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ positionId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || '生成失败')
      }

      // 生成成功
      setIsSuccess(true)
      setGeneratedThesis(data.data)
      setThesisId(data.data.id)
      
      // 3秒后自动跳转到Thesis详情页
      setTimeout(() => {
        if (data.data.id) {
          router.push(`/thesis/${data.data.id}`)
        }
      }, 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : '生成投资论题时发生错误')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isGenerating ? (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            ) : isSuccess ? (
              <CheckCircle className="h-12 w-12 text-green-600" />
            ) : error ? (
              <XCircle className="h-12 w-12 text-red-600" />
            ) : (
              <FileText className="h-12 w-12 text-primary" />
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {isGenerating ? '生成投资论题中...' : 
             isSuccess ? '投资论题生成成功！' : 
             error ? '生成失败' : 
             '准备生成投资论题'}
          </CardTitle>
          
          <CardDescription>
            {isGenerating ? '正在分析持仓信息并生成结构化投资论题，请稍候...' : 
             isSuccess ? '投资论题已成功生成并保存到数据库' : 
             error ? error : 
             '点击按钮开始生成投资论题'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isGenerating && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">获取持仓信息</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '30%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">收集背景数据</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">生成结构化分析</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '90%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">验证并保存结果</span>
                  <span className="text-xs text-muted-foreground">等待中...</span>
                </div>
                <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          )}

          {isSuccess && generatedThesis && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  投资论题已成功生成！3秒后将自动跳转到详情页。
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">标的代码</div>
                  <div className="font-semibold">{generatedThesis.position?.symbol}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">资产名称</div>
                  <div className="font-semibold">{generatedThesis.position?.assetName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">摘要</div>
                  <div className="text-sm mt-1">{generatedThesis.summary}</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            
            {!isGenerating && !isSuccess && positionId && (
              <Button
                onClick={generateThesis}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                开始生成投资论题
              </Button>
            )}
            
            {isSuccess && thesisId && (
              <Button
                onClick={() => router.push(`/thesis/${thesisId}`)}
                className="flex-1"
              >
                立即查看论题
              </Button>
            )}
            
            {error && (
              <Button
                onClick={generateThesis}
                className="flex-1"
              >
                重试生成
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}