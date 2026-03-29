'use client'

import { TrendingUp, TrendingDown, Wallet, PieChart, Activity, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PortfolioAnalyticsProps {
  totalValue: number       // 总市值
  totalCost: number         // 总成本
  dailyChange: number       // 今日涨跌
  dailyChangePercent: number // 今日涨跌%
  positionCount: number     // 持仓数量
  sectorDistribution: { name: string; value: number; percent: number }[]  // 行业分布
}

export default function PortfolioAnalytics({
  totalValue = 0,
  totalCost = 0,
  dailyChange = 0,
  dailyChangePercent = 0,
  positionCount = 0,
  sectorDistribution = []
}: PortfolioAnalyticsProps) {
  const profit = totalValue - totalCost
  const profitPercent = totalCost > 0 ? (profit / totalCost * 100) : 0
  const isProfit = profit >= 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 总市值 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总市值</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ¥{totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            成本 ¥{totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      {/* 总收益 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总收益</CardTitle>
          {isProfit ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {isProfit ? '+' : ''}¥{profit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className={`text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {isProfit ? '+' : ''}{profitPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      {/* 今日涨跌 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今日涨跌</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {dailyChange >= 0 ? '+' : ''}¥{Math.abs(dailyChange).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className={`text-xs ${dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {dailyChange >= 0 ? '+' : ''}{dailyChangePercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      {/* 持仓分散度 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">持仓分散</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{positionCount}</div>
          <p className="text-xs text-muted-foreground">只股票</p>
        </CardContent>
      </Card>

      {/* 行业分布 */}
      {sectorDistribution.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              行业分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sectorDistribution.map((sector, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted"
                >
                  <span className="text-sm font-medium">{sector.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {sector.value.toLocaleString()} ({sector.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
