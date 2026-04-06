'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface IndustryData {
  name: string
  value: number
  percentage: number
}

interface PositionPieChartProps {
  data: IndustryData[]
  title?: string
  description?: string
  centerLabel?: string
  centerValue?: string
}

const COLORS = [
  '#3B82F6', // 蓝色
  '#10B981', // 绿色
  '#F59E0B', // 黄色
  '#EF4444', // 红色
  '#8B5CF6', // 紫色
  '#EC4899', // 粉色
  '#06B6D4', // 青色
  '#F97316', // 橙色
]

export function IndustryPieChart({
  data,
  title = '行业分布',
  description = '按行业分类的持仓市值占比',
  centerLabel = '总市值',
  centerValue
}: PositionPieChartProps) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            ¥{item.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm font-medium text-blue-600">
            占比 {item.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                labelLine={true}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={(value, entry: any) => {
                  const item = data.find(d => d.name === value)
                  return (
                    <span className="text-sm text-foreground">
                      {value} ({item?.percentage.toFixed(1)}%)
                    </span>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          总持仓市值: ¥{totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </div>
      </CardContent>
    </Card>
  )
}

export function MarketPieChart({
  data,
  title = '市场分布',
  description = '按交易市场分类的持仓占比',
}: Omit<PositionPieChartProps, 'centerLabel' | 'centerValue'>) {
  const marketColors: Record<string, string> = {
    HK: '#EF4444',
    US: '#3B82F6',
    A股: '#10B981',
    CN: '#10B981',
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            ¥{item.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm font-medium text-blue-600">
            占比 {item.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                labelLine={true}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={marketColors[entry.name] || COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={(value, entry: any) => {
                  const item = data.find(d => d.name === value)
                  return (
                    <span className="text-sm text-foreground">
                      {value} ({item?.percentage.toFixed(1)}%)
                    </span>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function HoldingStylePieChart({
  data,
  title = '持有风格分布',
  description = '按投资风格分类的持仓占比',
}: Omit<PositionPieChartProps, 'centerLabel' | 'centerValue'>) {
  const styleColors: Record<string, string> = {
    短线: '#EF4444',
    波段: '#F59E0B',
    长线: '#10B981',
    short_term: '#EF4444',
    swing: '#F59E0B',
    long_term: '#10B981',
  }

  const styleLabels: Record<string, string> = {
    短线: '短线交易',
    波段: '波段操作',
    长线: '长期持有',
    short_term: '短线交易',
    swing: '波段操作',
    long_term: '长期持有',
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{styleLabels[item.name] || item.name}</p>
          <p className="text-sm text-muted-foreground">
            ¥{item.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm font-medium text-blue-600">
            占比 {item.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                labelLine={true}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={styleColors[entry.name] || COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={(value, entry: any) => {
                  const item = data.find(d => d.name === value)
                  return (
                    <span className="text-sm text-foreground">
                      {styleLabels[value] || value} ({item?.percentage.toFixed(1)}%)
                    </span>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
