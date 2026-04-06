'use client'

import { useEffect, useState } from 'react'
import { IndustryPieChart, MarketPieChart, HoldingStylePieChart } from '@/components/charts/position-pie-chart'
import { ReturnCurveChart, HealthScoreChart } from '@/components/charts/return-curve-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'

interface Position {
  id: string
  symbol: string
  assetName: string
  market: string
  quantity: number
  costPrice: number
  positionWeight: number
  holdingStyle: string
  industry: string | null
  marketValue: number | null
  portfolio: { name: string }
}

interface ChartData {
  name: string
  value: number
  percentage: number
}

interface AnalyticsData {
  positions: Position[]
  industryDistribution: ChartData[]
  marketDistribution: ChartData[]
  styleDistribution: ChartData[]
  totalValue: number
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics/positions')
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.error)
        }
      } catch (err) {
        setError('获取数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error || '暂无数据'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 格式化市值显示
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `¥${(value / 1000000).toFixed(2)}M`
    }
    return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">数据分析</h1>
        <p className="text-muted-foreground mt-2">
          投资组合可视化分析 - 行业分布、市场分布、收益曲线
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总持仓市值</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(data.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              共 {data.positions.length} 个持仓
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">持仓数量</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.positions.length}</div>
            <p className="text-xs text-muted-foreground">
              分布在 {data.industryDistribution.length} 个行业
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">行业集中度</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.industryDistribution[0]?.percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              最大行业: {data.industryDistribution[0]?.name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">收益表现</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+12.5%</div>
            <p className="text-xs text-muted-foreground">
              今年收益 (模拟数据)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 饼图区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <IndustryPieChart
          data={data.industryDistribution}
          title="行业分布"
          description="按行业分类的持仓市值占比"
          centerLabel="总市值"
          centerValue={formatValue(data.totalValue)}
        />
        <MarketPieChart
          data={data.marketDistribution}
          title="市场分布"
          description="按交易市场分类的持仓占比"
        />
        <HoldingStylePieChart
          data={data.styleDistribution}
          title="持有风格"
          description="按投资风格分类的持仓占比"
        />
      </div>

      {/* 收益曲线 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ReturnCurveChart
          data={[
            { date: '01-01', portfolio: 0, benchmark: 0 },
            { date: '01-08', portfolio: 2.5, benchmark: 1.2 },
            { date: '01-15', portfolio: 4.8, benchmark: 2.1 },
            { date: '01-22', portfolio: 3.2, benchmark: 1.8 },
            { date: '01-29', portfolio: 5.1, benchmark: 2.5 },
            { date: '02-05', portfolio: 7.3, benchmark: 3.2 },
            { date: '02-12', portfolio: 6.8, benchmark: 3.0 },
            { date: '02-19', portfolio: 9.2, benchmark: 3.8 },
            { date: '02-26', portfolio: 8.5, benchmark: 3.5 },
            { date: '03-05', portfolio: 11.2, benchmark: 4.2 },
            { date: '03-12', portfolio: 10.5, benchmark: 4.0 },
            { date: '03-19', portfolio: 12.8, benchmark: 4.8 },
          ]}
          title="收益曲线"
          description="组合收益 vs 沪深300 对比 (模拟数据)"
          showBenchmark={true}
          benchmarkName="沪深300"
          portfolioName="组合收益"
        />

        <HealthScoreChart
          data={[
            { date: '01-01', healthScore: 82, thesisTitle: '腾讯控股论题' },
            { date: '01-15', healthScore: 80, thesisTitle: '腾讯控股论题' },
            { date: '02-01', healthScore: 78, thesisTitle: '腾讯控股论题' },
            { date: '02-15', healthScore: 81, thesisTitle: '腾讯控股论题' },
            { date: '03-01', healthScore: 79, thesisTitle: '腾讯控股论题' },
            { date: '03-15', healthScore: 80, thesisTitle: '腾讯控股论题' },
          ]}
          title="健康度趋势"
          description="论题健康度变化跟踪"
        />
      </div>

      {/* 持仓明细 */}
      <Card>
        <CardHeader>
          <CardTitle>持仓明细</CardTitle>
          <CardDescription>按市值排序的完整持仓列表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium">股票</th>
                  <th className="text-left py-3 px-2 text-sm font-medium">市场</th>
                  <th className="text-left py-3 px-2 text-sm font-medium">行业</th>
                  <th className="text-right py-3 px-2 text-sm font-medium">持仓数量</th>
                  <th className="text-right py-3 px-2 text-sm font-medium">成本价</th>
                  <th className="text-right py-3 px-2 text-sm font-medium">市值</th>
                  <th className="text-right py-3 px-2 text-sm font-medium">占比</th>
                  <th className="text-center py-3 px-2 text-sm font-medium">风格</th>
                </tr>
              </thead>
              <tbody>
                {data.positions.map((position) => {
                  const marketValue = position.marketValue || (position.costPrice * position.quantity)
                  const marketLabel = position.market === 'HK' ? '港股' : position.market === 'US' ? '美股' : 'A股'
                  const styleLabel = position.holdingStyle === 'short_term' ? '短线' :
                                   position.holdingStyle === 'swing' ? '波段' : '长线'
                  const styleColor = position.holdingStyle === 'short_term' ? 'bg-red-100 text-red-700' :
                                    position.holdingStyle === 'swing' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'

                  return (
                    <tr key={position.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="font-medium">{position.assetName}</div>
                        <div className="text-xs text-muted-foreground">{position.symbol}</div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">{marketLabel}</Badge>
                      </td>
                      <td className="py-3 px-2 text-sm">{position.industry || '其他'}</td>
                      <td className="py-3 px-2 text-right text-sm">
                        {position.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-sm">
                        ¥{position.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-sm font-medium">
                        ¥{marketValue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-right text-sm">
                        {position.positionWeight.toFixed(2)}%
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge className={styleColor}>{styleLabel}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
