import { z } from 'zod'
import { 
  monitorPlanWatchItemSchema,
  monitorPlanTriggerConditionSchema,
  monitorPlanDisconfirmSignalSchema,
  monitorPlanActionHintSchema,
  MonitorPlan,
  monitorPlanSchema as businessMonitorPlanSchema
} from '@/lib/schemas/monitorPlanSchema'

// LLM专用的简化schema，只保留提示信息
export const monitorPlanSchema = businessMonitorPlanSchema.extend({
  watchItems: businessMonitorPlanSchema.shape.watchItems.describe('需要监控的关键指标和观察点，至少3项'),
  triggerConditions: businessMonitorPlanSchema.shape.triggerConditions.describe('触发行动的条件，至少2项'),
  reviewFrequency: businessMonitorPlanSchema.shape.reviewFrequency.describe('定期复盘频率'),
  disconfirmSignals: businessMonitorPlanSchema.shape.disconfirmSignals.describe('可能否定投资论题的信号，至少2项'),
  actionHints: businessMonitorPlanSchema.shape.actionHints.describe('行动提示，至少2项'),
  notes: businessMonitorPlanSchema.shape.notes.describe('总体备注说明'),
})

// 重新导出类型
export type { MonitorPlan }

// 监控计划生成提示词
export const generateMonitorPlanPrompt = (thesisData: {
  summary: string
  pricePhases: any[]
  coreThesis: any[]
  fragilePoints: string[]
  monitorTargets: any[]
  symbol: string
  assetName: string
  market: string
}) => {
  return `
你是一个专业的投资监控系统。请基于以下投资论题生成一个详细的监控计划。

## 投资标的信息
- 股票代码：${thesisData.symbol}
- 资产名称：${thesisData.assetName}
- 市场：${thesisData.market}

## 投资论题摘要
${thesisData.summary}

## 价格阶段分析
${JSON.stringify(thesisData.pricePhases, null, 2)}

## 核心论题
${JSON.stringify(thesisData.coreThesis, null, 2)}

## 脆弱点
${JSON.stringify(thesisData.fragilePoints, null, 2)}

## 监控目标
${JSON.stringify(thesisData.monitorTargets, null, 2)}

## 监控计划生成要求
请生成一个结构化、可执行的监控计划，包含以下部分：

### 1. Watch Items (监控项)
- 针对核心论题和脆弱点的关键指标
- 包括技术指标、基本面指标、市场情绪指标等
- 每个监控项需要明确阈值条件和数据来源

### 2. Trigger Conditions (触发条件)
- 基于价格阶段分析和监控目标的触发点
- 当特定条件满足时应采取的行动
- 区分不同优先级和确认方式

### 3. Review Frequency (复盘频率)
- 根据投资风格（长期、中期、短期）确定合适的复盘周期

### 4. Disconfirm Signals (否定信号)
- 可能推翻投资论题的关键信号
- 需要重点监控的风险因素
- 不同严重程度对应的应对措施

### 5. Action Hints (行动提示)
- 在特定场景下的建议行动
- 包括加仓、减仓、止损、止盈等操作建议

## 输出格式
请严格输出JSON格式，不要包含任何其他文本。JSON必须符合以下schema：

\`\`\`json
{
  "watchItems": [
    {
      "title": "股价技术位监控",
      "metric": "股价",
      "threshold": "跌破关键支撑位100元",
      "source": "交易所行情",
      "frequency": "realtime",
      "priority": "high",
      "notes": "重点关注突破或跌破关键价位"
    }
  ],
  "triggerConditions": [
    {
      "condition": "股价突破阻力位",
      "description": "当股价突破120元阻力位时",
      "action": "考虑加仓或持有",
      "priority": "high",
      "requiresConfirmation": true,
      "confirmationMethod": "manual"
    }
  ],
  "reviewFrequency": "weekly",
  "disconfirmSignals": [
    {
      "signal": "关键业绩指标恶化",
      "description": "季度ROE连续两个季度下降超过10%",
      "severity": "critical",
      "response": "立即减仓并重新评估投资论题"
    }
  ],
  "actionHints": [
    {
      "scenario": "股价在支撑位获得支撑",
      "suggestedAction": "在支撑位附近加仓",
      "rationale": "技术面确认支撑有效",
      "priority": "medium"
    }
  ],
  "notes": "根据市场变化动态调整监控计划"
}
\`\`\`

请基于以上投资论题生成一个具体、实用的监控计划。
`.trim()
}