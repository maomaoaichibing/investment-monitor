'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase as PortfolioIcon, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

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
    sparklineData: [
      { value: 100 },
      { value: 102 },
      { value: 98 },
      { value: 105 },
      { value: 108 },
      { value: 106 },
      { value: 115 }
    ],
    isUp: true
  },
  {
    id: 2,
    name: '防御性收入组合',
    description: '股息股票和防御性板块',
    positionCount: 5,
    alertCount: 0,
    performance: '+8.7%',
    performanceLabel: '持有以来',
    sparklineData: [
      { value: 100 },
      { value: 101 },
      { value: 102 },
      { value: 101 },
      { value: 103 },
      { value: 105 },
      { value: 109 }
    ],
    isUp: true
  },
  {
    id: 3,
    name: '中国复苏组合',
    description: '具复苏潜力的中国股票',
    positionCount: 4,
    alertCount: 1,
    performance: '+5.3%',
    performanceLabel: '持有以来',
    sparklineData: [
      { value: 100 },
      { value: 97 },
      { value: 95 },
      { value: 98 },
      { value: 102 },
      { value: 104 },
      { value: 105 }
    ],
    isUp: true
  }
]

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

              {/* recharts Sparkline 迷你折线图 */}
              <div className="ml-4 shrink-0 w-[100px] h-[32px]">
                {mounted && (
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