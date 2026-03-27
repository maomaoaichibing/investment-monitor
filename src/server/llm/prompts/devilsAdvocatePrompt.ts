/**
 * #6 Prompt: 反向论证（Devil's Advocate）功能 Prompt
 *
 * 生成反向投资论点的 Prompt
 */

export function buildDevilsAdvocatePrompt(params: {
  stockCode: string
  stockName: string
  direction: string
  thesisSummary: string
  pillarsJson: string  // JSON string of pillars
}): string {
  const { stockCode, stockName, direction, thesisSummary, pillarsJson } = params

  let pillars
  try {
    pillars = JSON.parse(pillarsJson)
  } catch {
    pillars = []
  }

  // 构建核心假设列表
  const assumptionsList = pillars.map((p: any, i: number) =>
    `${i + 1}. ${p.name}: ${p.coreAssumption}`
  ).join('\n')

  return `# 角色
你是一位专业的投资"魔鬼代言人"（Devil's Advocate）。你的任务是找到反对用户投资论点的最强证据和逻辑。

# 用户的投资论点
- 股票：${stockName}（${stockCode}）
- 持仓方向：${direction}
- 论点摘要：${thesisSummary}
- 核心假设列表：
${assumptionsList || '暂无核心假设数据'}

# 任务
请站在对立面，系统性地挑战用户的每一个核心假设。

# 输出格式

严格按以下 JSON 格式输出：

{
  "overall_counter_thesis": "一句话总结反对观点",
  "risk_score": 65,
  "challenges": [
    {
      "target_assumption": "被挑战的核心假设原文",
      "counter_argument": "反对理由（2-3句话，要具体、有数据支撑）",
      "counter_evidence": "支持反对观点的具体证据或历史案例",
      "probability": "该假设失效的概率估计（低/中/高）",
      "worst_case_impact": "如果该假设失效，对股价的潜在影响"
    }
  ],
  "blind_spots": [
    "用户可能忽略的风险点1",
    "用户可能忽略的风险点2"
  ],
  "key_question": "如果只能问一个问题来验证这个投资论点，应该问什么？"
}

# 注意事项
- 不要为了反对而反对，每个 counter_argument 必须有逻辑支撑
- counter_evidence 尽量引用具体数据、行业事实或历史案例
- blind_spots 要找用户论点中完全没提到但可能很重要的风险
- key_question 要一针见血，帮用户找到验证论点的最关键切入点`
}

/**
 * 验证反向论证结果
 */
export const devilsAdvocateResultSchema = {
  overall_counter_thesis: 'string',
  risk_score: { min: 0, max: 100 },
  challenges: 'array',
  blind_spots: 'array',
  key_question: 'string'
}
