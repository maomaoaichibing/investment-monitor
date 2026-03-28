import { ThinkingStep } from '@/components/ui/thinking-process'

// ==================== Thesis 数据结构 ====================

interface ThesisCoreData {
  id: string
  summary: string
  healthScore: number
  pillarsJson: string
  fragilePointsJson: string
  coreThesisJson: string
  pricePhasesJson: string
  position: {
    symbol: string
    assetName: string
  }
}

// ==================== 工具函数 ====================

/**
 * 将论题数据转换为思维过程步骤
 */
export function thesisToThinkingSteps(thesis: ThesisCoreData): ThinkingStep[] {
  // 解析 JSON 字段
  let pillars: any[] = []
  let fragilePoints: any[] = []
  let coreThesis: any[] = []

  try {
    pillars = thesis.pillarsJson ? JSON.parse(thesis.pillarsJson) : []
  } catch {
    pillars = []
  }

  try {
    fragilePoints = thesis.fragilePointsJson ? JSON.parse(thesis.fragilePointsJson) : []
  } catch {
    fragilePoints = []
  }

  try {
    coreThesis = thesis.coreThesisJson ? JSON.parse(thesis.coreThesisJson) : []
  } catch {
    coreThesis = []
  }

  // 构建步骤列表
  const steps: ThinkingStep[] = [
    // 步骤1: 检索公司基本面数据
    {
      id: 'fetch_position',
      label: '检索公司基本面数据',
      status: 'done',
      result: `${thesis.position.symbol} ${thesis.position.assetName}`,
      duration: 120
    },

    // 步骤2: 分析行业竞争格局
    {
      id: 'analyze_industry',
      label: '分析行业竞争格局',
      status: 'done',
      result: thesis.summary,
      duration: 850
    },

    // 步骤3: 识别核心投资支柱
    {
      id: 'identify_pillars',
      label: '识别核心投资支柱',
      status: 'done',
      result: pillars.length > 0 ? pillars.map((p, i) => ({
        id: `pillar_${i}`,
        label: `${p.name}（权重 ${p.impactWeight || 30}%）`,
        status: 'done' as const,
        result: `核心假设: ${p.coreAssumption || '未提供'}\n看多信号: ${p.bullishSignal || '未提供'}\n风险触发: ${p.riskTrigger || '未提供'}`,
        children: p.conviction ? [{
          id: `pillar_${i}_conviction`,
          label: `信念度评分: ${p.conviction}/10`,
          status: 'done' as const,
          duration: 50
        }] : undefined
      })) : '未识别到投资支柱',
      duration: 1200,
      children: pillars.map((p, i) => ({
        id: `pillar_${i}`,
        label: `${p.name}（权重 ${p.impactWeight || 30}%）`,
        status: 'done' as const,
        result: `核心假设: ${p.coreAssumption || '未提供'}`
      }))
    },

    // 步骤4: 设定风险触发条件
    {
      id: 'set_risk_triggers',
      label: '设定风险触发条件',
      status: 'done',
      result: pillars.length > 0
        ? pillars.map(p => `• ${p.name}: ${p.riskTrigger || '未设定'}`).join('\n')
        : '未设定风险触发条件',
      duration: 380
    },

    // 步骤5: 识别脆弱点
    {
      id: 'identify_fragile_points',
      label: '识别脆弱点',
      status: 'done',
      result: fragilePoints.length > 0
        ? fragilePoints.map((fp, i) => `${i + 1}. ${fp.description || fp.name || '脆弱点'}`).join('\n')
        : '未识别到明显脆弱点',
      duration: 520
    },

    // 步骤6: 计算健康评分
    {
      id: 'calculate_health',
      label: '计算健康评分',
      status: 'done',
      result: `综合评分: ${thesis.healthScore || 80}/100`,
      duration: 150
    }
  ]

  return steps
}

/**
 * 将支柱数据转换为健康度评分分解步骤
 */
export function pillarsToHealthScoreSteps(
  pillars: any[],
  healthScore: number
): ThinkingStep[] {
  if (!pillars || pillars.length === 0) {
    return [{
      id: 'no_pillars',
      label: '无投资支柱数据',
      status: 'done',
      result: '该论题尚未识别到投资支柱'
    }]
  }

  // 计算加权总分
  const weightedSum = pillars.reduce((sum, p) => {
    const conviction = p.conviction || 5
    const weight = p.impactWeight || 30
    return sum + (conviction * weight)
  }, 0)

  const steps: ThinkingStep[] = pillars.map((pillar, idx) => {
    // conviction 1-10 映射到 0-100%
    const convictionPercent = ((pillar.conviction || 5) / 10) * 100

    return {
      id: `health_pillar_${idx}`,
      label: `${pillar.name}（权重 ${pillar.impactWeight || 30}%）`,
      status: 'done' as const,
      result: (
        <div className="space-y-2">
          {/* 信念度进度条 */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">信念度</span>
              <span className="font-medium">{pillar.conviction || 5}/10</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${convictionPercent}%` }}
              />
            </div>
          </div>

          {/* 核心假设 */}
          {pillar.coreAssumption && (
            <div className="text-xs">
              <span className="text-muted-foreground">核心假设：</span>
              <span className="text-foreground/80">{pillar.coreAssumption}</span>
            </div>
          )}

          {/* 看多信号 */}
          {pillar.bullishSignal && (
            <div className="text-xs">
              <span className="text-green-600">看多信号：</span>
              <span className="text-green-600/80">{pillar.bullishSignal}</span>
            </div>
          )}

          {/* 风险触发 */}
          {pillar.riskTrigger && (
            <div className="text-xs">
              <span className="text-red-600">风险触发：</span>
              <span className="text-red-600/80">{pillar.riskTrigger}</span>
            </div>
          )}
        </div>
      ),
      duration: 80 + idx * 40
    }
  })

  // 添加加权计算步骤
  const calculationStep: ThinkingStep = {
    id: 'weighted_calculation',
    label: '加权总分计算',
    status: 'done',
    result: (
      <div className="space-y-1 text-sm">
        {pillars.map((p, idx) => {
          const conviction = p.conviction || 5
          const weight = p.impactWeight || 30
          return (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {p.name}: {conviction} × {weight}%
              </span>
              <span>{(conviction * weight / 10).toFixed(1)}</span>
            </div>
          )
        })}
        <div className="border-t pt-1 mt-1 flex justify-between font-medium">
          <span>综合评分</span>
          <span className={healthScore >= 70 ? 'text-green-600' : healthScore >= 40 ? 'text-yellow-600' : 'text-red-600'}>
            {healthScore}/100
          </span>
        </div>
      </div>
    ),
    duration: 100
  }

  return [...steps, calculationStep]
}
