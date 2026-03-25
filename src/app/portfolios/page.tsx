'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase as PortfolioIcon, Plus, AlertTriangle, TrendingUp, Loader2, FileText } from 'lucide-react'

interface Portfolio {
  id: string
  name: string
  description: string
  createdAt: string
  _count?: {
    positions: number
    alerts?: number
  }
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPortfolios()
  }, [])

  const loadPortfolios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/portfolios')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '加载失败')
      }
      
      setPortfolios(data.portfolios || data)
    } catch (err: any) {
      setError(err.message || '加载投资组合失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadPortfolios}>
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PortfolioIcon className="h-6 w-6" />
          投资组合
        </h1>
        <Link href="/portfolios/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建组合
          </Button>
        </Link>
      </div>

      {/* 组合列表 */}
      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PortfolioIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-medium mb-2">暂无投资组合</h3>
            <p className="text-muted-foreground mb-4">创建你的第一个投资组合来开始追踪</p>
            <Link href="/portfolios/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建组合
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <Link key={portfolio.id} href={`/portfolios/${portfolio.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{portfolio.name}</span>
                    <Badge variant="secondary">
                      {portfolio._count?.positions || 0} 持仓
                    </Badge>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {portfolio.description || '暂无描述'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>创建于 {new Date(portfolio.createdAt).toLocaleDateString('zh-CN')}</span>
                    {(portfolio._count?.alerts || 0) > 0 && (
                      <Badge variant="outline" className="text-orange-500">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {portfolio._count.alerts} 提醒
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
