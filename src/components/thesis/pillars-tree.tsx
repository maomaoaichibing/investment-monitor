'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react'

interface MonitorIndicator {
  name: string
  type: string
  frequency: string
  dataSource?: string
  dataType?: string
}

interface ThesisPillar {
  id: number
  name: string
  coreAssumption: string
  conviction: number
  monitorIndicators: MonitorIndicator[]
  bullishSignal: string
  riskTrigger: string
  impactWeight?: number
}

interface PillarsTreeProps {
  pillars: ThesisPillar[]
  thesisId: string
}

export default function PillarsTree({ pillars }: PillarsTreeProps) {
  const [openPillars, setOpenPillars] = useState<number[]>([1]) // 默认展开第一个

  const togglePillar = (id: number) => {
    setOpenPillars(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  // 获取置信度颜色
  const getConvictionColor = (conviction: number) => {
    if (conviction >= 8) return 'text-green-600'
    if (conviction >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 获取指标类型颜色
  const getIndicatorTypeColor = (type: string) => {
    switch (type) {
      case 'fundamental': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'industry': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'macro': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'technical': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'sentiment': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
      case 'price': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  // 获取频率标签
  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'realtime': return '实时'
      case 'daily': return '日度'
      case 'weekly': return '周度'
      case 'monthly': return '月度'
      case 'quarterly': return '季度'
      case 'event': return '事件'
      default: return frequency
    }
  }

  if (!pillars || pillars.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            议题树
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            暂无议题数据
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          议题树
        </CardTitle>
        <CardDescription>
          投资逻辑拆解为 {pillars.length} 个核心议题，每个议题包含可量化的核心假设和监控指标
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pillars.map((pillar) => {
          const isOpen = openPillars.includes(pillar.id)
          const impactWeight = pillar.impactWeight || Math.floor(100 / pillars.length)

          return (
            <div key={pillar.id} className="border rounded-lg overflow-hidden">
              {/* 议题卡片头部 */}
              <div
                onClick={() => togglePillar(pillar.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* 议题状态指示 */}
                  <div>
                    {pillar.conviction >= 7 ? '🟢' : pillar.conviction >= 4 ? '🟡' : '🔴'}
                  </div>

                  {/* 议题信息 */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg">{pillar.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        权重 {impactWeight}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {pillar.coreAssumption}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* 置信度 */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getConvictionColor(pillar.conviction)}`}>
                      {pillar.conviction}/10
                    </div>
                    <div className="text-xs text-muted-foreground">置信度</div>
                  </div>

                  {/* 展开/收起图标 */}
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* 议题详情 */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-4 border-t">
                  {/* 核心假设 */}
                  <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary mt-4">
                    <div className="text-xs font-medium text-muted-foreground mb-1">核心假设</div>
                    <div className="text-sm">{pillar.coreAssumption}</div>
                  </div>

                  {/* 监控指标 */}
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      监控指标 ({pillar.monitorIndicators?.length || 0})
                    </div>
                    <div className="space-y-2">
                      {pillar.monitorIndicators?.map((indicator, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-card border rounded"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getIndicatorTypeColor(indicator.type)}`}
                            >
                              {indicator.type === 'fundamental' ? '基本面' :
                               indicator.type === 'industry' ? '行业' :
                               indicator.type === 'macro' ? '宏观' :
                               indicator.type === 'technical' ? '技术' :
                               indicator.type === 'sentiment' ? '情绪' :
                               indicator.type === 'price' ? '价格' : indicator.type}
                            </Badge>
                            <span className="text-sm font-medium">{indicator.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {indicator.dataSource && (
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                {indicator.dataSource}
                              </span>
                            )}
                            <span className="text-xs font-medium text-muted-foreground">
                              {getFrequencyLabel(indicator.frequency)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 看多信号和风险触发 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 看多信号 */}
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-800 dark:text-green-200">
                          看多信号
                        </span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {pillar.bullishSignal || '暂无'}
                      </p>
                    </div>

                    {/* 风险触发 */}
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium text-red-800 dark:text-red-200">
                          风险触发
                        </span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {pillar.riskTrigger || '暂无'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
