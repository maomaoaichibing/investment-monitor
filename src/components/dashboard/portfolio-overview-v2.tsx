'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase as PortfolioIcon, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// Mock 组合数据
// TODO: Replace with API call: GET /api/portfolios
const mockPortfolios = [
  {
    id: 1,
    name: '科技成长组合',
    description: 'AI相关高增长科技股',
    positionCount: 6,
    alertCount: 2,
    performance: '+15.2%',
    performanceLabel: '持有以来',
    // 7天迷你走势数据
    sparklineData: [100, 102, 101, 105, 108, 112, 115]
  },
  {
    id: 2,
    name: '防御性收入组合',
    description: '股息股票和防御性板块',
    positionCount: 5,
    alertCount: 0,
    performance: '+8.7%',
    performanceLabel: '持有以来',
    sparklineData: [100, 101, 103, 102, 104, 106, 109]
  },
  {
    id: 3,
    name: '中国复苏组合',
    description: '具复苏潜力的中国股票',
    positionCount: 4,
    alertCount: 1,
    performance: '+5.3%',
    performanceLabel: '持有以来',
    sparklineData: [100, 98, 97, 99, 101, 103, 105]
  }
]

// 简单的 Sparkline 组件
function Sparkline({ data, width = 120, height = 40, color = '#22c55e' }: {
  data: number[]
  width?: number
  height?: number
  color?: string
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const isUp = data[data.length - 1] >= data[0]
  const lineColor = isUp ? '#22c55e' : '#ef4444' // green for up, red for down

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* 背景网格线 */}
      <line
        x1={0}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="currentColor"
        strokeWidth="0.5"
        className="text-muted-foreground/20"
      />
      {/* 走势线 */}
      <polyline
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* 最后一个点 */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={lineColor}
      />
    </svg>
  )
}

export default function PortfolioOverviewV2() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const portfolios = mockPortfolios

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">组合概览</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portfolios">
            查看全部
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* 图标 */}
                <div className="rounded-full bg-primary/10 p-2 shrink-0">
                  <PortfolioIcon className="h-4 w-4 text-primary" />
                </div>

                {/* 组合信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{portfolio.name}</div>
                    {/* 提醒数量红色 Badge */}
                    {portfolio.alertCount > 0 && (
                      <Badge variant="destructive" className="text-xs h-5 px-1.5">
                        {portfolio.alertCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {portfolio.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {portfolio.positionCount} 个持仓
                    </Badge>
                    {/* 收益率 + 时间标注 */}
                    <span className={`text-sm font-medium flex items-center gap-1 ${
                      portfolio.performance.startsWith('+')
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      <TrendingUp className="h-3 w-3" />
                      {portfolio.performance}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {portfolio.performanceLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sparkline 迷你折线图 */}
              <div className="ml-4 shrink-0">
                {mounted && (
                  <Sparkline
                    data={portfolio.sparklineData}
                    width={100}
                    height={36}
                  />
                )}
              </div>

              {/* 查看按钮 */}
              <Button variant="ghost" size="sm" className="ml-4 shrink-0" asChild>
                <Link href={`/portfolios/${portfolio.id}`}>
                  查看
                </Link>
              </Button>
            </div>
          ))}

          {/* 创建新组合按钮 */}
          <Button variant="outline" className="w-full" asChild>
            <Link href="/portfolios/new">
              <Plus className="mr-2 h-4 w-4" />
              创建新组合
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}