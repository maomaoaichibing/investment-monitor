'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Briefcase as PortfolioIcon, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface PortfolioOverview {
  id: number
  name: string
  description: string
  positionCount: number
  alertCount: number
  totalValue: number
  totalCost: number
  performance: number
  performanceLabel: string
  sparklineData: Array<{ value: number }>
  isUp: boolean
}

export default function PortfolioOverviewV2() {
  const [portfolios, setPortfolios] = useState<PortfolioOverview[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const r = await fetch('/api/dashboard/overview')
      const d = await r.json()
      if (d.success && d.data?.portfolioOverview) {
        setPortfolios(d.data.portfolioOverview)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">组合概览</CardTitle>
        <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
          查看全部
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-6 text-muted-foreground text-sm">
              暂无投资组合
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="rounded-full bg-primary/10 p-2 shrink-0">
                    <PortfolioIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{portfolio.name}</div>
                      {portfolio.alertCount > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 px-1.5">
                          {portfolio.alertCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {portfolio.description || '暂无描述'}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {portfolio.positionCount} 个持仓
                      </Badge>
                      <span className={`text-sm font-medium flex items-center gap-1 ${
                        portfolio.isUp ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        <TrendingUp className="h-3 w-3" />
                        {portfolio.performance > 0 ? '+' : ''}{portfolio.performance}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {portfolio.performanceLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sparkline */}
                {portfolio.sparklineData && portfolio.sparklineData.length > 0 && (
                  <div className="ml-4 shrink-0 w-[100px] h-[32px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={portfolio.sparklineData}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={portfolio.isUp ? '#ef4444' : '#22c55e'}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <Button variant="ghost" size="sm" className="ml-4 shrink-0" asChild>
                  <Link href={`/portfolios/${portfolio.id}`}>查看</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link href="/portfolios/new">
            <Plus className="mr-2 h-4 w-4" />
            创建新组合
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
