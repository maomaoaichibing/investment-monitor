'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Position {
  id: string
  symbol: string
  assetName: string
  market: string
  healthScore?: number
  thesisId?: string
}

interface RegenerateResult {
  positionId: string
  success: boolean
  thesisId?: string
  healthScore?: number
  error?: string
}

export default function BatchRegeneratePage() {
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [results, setResults] = useState<RegenerateResult[]>([])
  const [error, setError] = useState<string | null>(null)

  // 加载组合和持仓
  useEffect(() => {
    async function loadData() {
      try {
        // 加载所有组合
        const portfoliosRes = await fetch('/api/portfolios')
        const portfoliosData = await portfoliosRes.json()
        setPortfolios(portfoliosData.data || [])

        // 加载所有持仓
        const positionsRes = await fetch('/api/positions')
        const positionsData = await positionsRes.json()
        const allPositions = positionsData.data || []

        // 获取每个持仓的thesis信息
        const positionsWithThesis = await Promise.all(
          allPositions.map(async (pos: any) => {
            try {
              const thesisRes = await fetch(`/api/theses?positionId=${pos.id}`)
              const thesisData = await thesisRes.json()
              const thesis = thesisData.data?.[0]
              return {
                ...pos,
                healthScore: thesis?.healthScore,
                thesisId: thesis?.id
              }
            } catch {
              return { ...pos, healthScore: undefined, thesisId: undefined }
            }
          })
        )

        setPositions(positionsWithThesis)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === positions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(positions.map(p => p.id)))
    }
  }

  const handleRegenerate = async () => {
    if (selectedIds.size === 0) return

    setIsRegenerating(true)
    setResults([])

    const idsArray = Array.from(selectedIds)
    const resultsArr: RegenerateResult[] = []

    for (const positionId of idsArray) {
      try {
        const res = await fetch(`/api/theses/regenerate/${positionId}`, {
          method: 'POST'
        })
        const data = await res.json()

        if (data.success) {
          resultsArr.push({
            positionId,
            success: true,
            thesisId: data.data.thesis.id,
            healthScore: data.data.thesis.healthScore
          })
        } else {
          resultsArr.push({
            positionId,
            success: false,
            error: data.error || '未知错误'
          })
        }
      } catch (err: any) {
        resultsArr.push({
          positionId,
          success: false,
          error: err.message
        })
      }

      setResults([...resultsArr])

      // 等待1秒避免API限流
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setIsRegenerating(false)
  }

  const getHealthBadge = (score?: number) => {
    if (score === undefined) return <Badge variant="secondary">未生成</Badge>
    if (score >= 80) return <Badge className="bg-green-500">{score}</Badge>
    if (score >= 60) return <Badge className="bg-yellow-500">{score}</Badge>
    if (score >= 40) return <Badge className="bg-orange-500">{score}</Badge>
    return <Badge className="bg-red-500">{score}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" asChild>
          <Link href="/positions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回持仓
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">批量重新生成投资论题</h1>
          <p className="text-muted-foreground">为选中的持仓重新生成AI投资论题</p>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作栏 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedIds.size === positions.length && positions.length > 0}
                onCheckedChange={selectAll}
              />
              <span>
                已选择 {selectedIds.size} / {positions.length} 个持仓
              </span>
            </div>
            <Button
              onClick={handleRegenerate}
              disabled={selectedIds.size === 0 || isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  重新生成中...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重新生成 ({selectedIds.size})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 结果显示 */}
      {results.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">重新生成结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((r) => {
                const pos = positions.find(p => p.id === r.positionId)
                return (
                  <div key={r.positionId} className="flex items-center gap-3">
                    {r.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{pos?.assetName}</span>
                    <span className="text-muted-foreground">({pos?.symbol})</span>
                    {r.success ? (
                      <Badge className="ml-auto">健康度: {r.healthScore}</Badge>
                    ) : (
                      <Badge variant="destructive" className="ml-auto">{r.error}</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 持仓列表 */}
      <Card>
        <CardHeader>
          <CardTitle>所有持仓</CardTitle>
          <CardDescription>
            选择要重新生成投资论题的持仓。已生成的论题会被新论题替换。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {positions.map((position) => {
              const result = results.find(r => r.positionId === position.id)
              return (
                <div
                  key={position.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border",
                    result?.success === true && "bg-green-50 border-green-200",
                    result?.success === false && "bg-red-50 border-red-200"
                  )}
                >
                  <Checkbox
                    checked={selectedIds.has(position.id)}
                    onCheckedChange={() => toggleSelect(position.id)}
                    disabled={isRegenerating}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{position.assetName}</span>
                      <Badge variant="outline">{position.symbol}</Badge>
                      <Badge variant="secondary">{position.market}</Badge>
                    </div>
                  </div>
                  {getHealthBadge(position.healthScore)}
                  {result?.success && (
                    <Link href={`/theses/${result.thesisId}`}>
                      <Button size="sm" variant="ghost">查看</Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
