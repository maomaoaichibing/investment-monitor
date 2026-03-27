/**
 * #2 Prompt: 数据异常触发时 → AI 分析对论点影响的 Prompt
 *
 * 当检测到数据变化时，分析该变化对投资论点的影响
 */

export function buildAlertImpactPrompt(params: {
  stockCode: string
  stockName: string
  direction: string
  thesisSummary: string
  currentHealthScore: number
  pillarName: string
  coreAssumption: string
  bullishSignal: string
  riskTrigger: string
  indicatorName: string
  changeDescription: string
  dataSource: string
  dataTime: string
}): string {
  const {
    stockCode,
    stockName,
    direction,
    thesisSummary,
    currentHealthScore,
    pillarName,
    coreAssumption,
    bullishSignal,
    riskTrigger,
    indicatorName,
    changeDescription,
    dataSource,
    dataTime
  } = params

  return `# 角色
你是一位投资逻辑审计员，专门判断新数据对用户投资论点的影响。

# 背景
用户持有以下股票，并建立了投资逻辑框架。现在有新的数据变化被检测到，请分析该变化对投资论点的影响。

# 用户的投资论点
- 股票：${stockName}（${stockCode}）
- 持仓方向：${direction}
- 论点摘要：${thesisSummary}
- 当前论点健康度：${currentHealthScore}/100

# 被触发的议题
- 议题名称：${pillarName}
- 核心假设：${coreAssumption}
- 看多条件：${bullishSignal}
- 风险条件：${riskTrigger}

# 触发的数据变化
- 指标名称：${indicatorName}
- 变化内容：${changeDescription}
- 数据来源：${dataSource}
- 数据时间：${dataTime}

# 请输出以下分析

严格按以下 JSON 格式输出：

{
  "impact_direction": "bullish / neutral / bearish",
  "impact_score": 7,
  "reasoning": "2-3句话的推理过程，说明为什么这个数据变化会影响该议题",
  "assumption_status": "intact / weakened / falsified",
  "suggested_action": "继续持有 / 密切关注 / 考虑减仓 / 建议止损",
  "new_health_score": 65,
  "health_score_change": -17,
  "follow_up_watch": "接下来需要重点关注的下一个数据节点是什么",
  "alert_level": "info / warning / critical"
}

# 评分标准
- impact_score: 1-10，10为影响最大
- alert_level:
  - info: 常规信息，论点未受实质影响
  - warning: 值得关注，论点有被削弱的风险
  - critical: 紧急，核心假设可能被证伪
- assumption_status:
  - intact: 假设仍然成立
  - weakened: 假设被削弱但未证伪
  - falsified: 假设已被证伪

# 注意事项
- 保持客观，不要过度解读单一数据点
- reasoning 要具体引用触发的数据，不要泛泛而谈
- 如果数据变化与该议题关联度低，impact_score 应该给低分`
}

/**
 * 验证 AI 返回的影响分析结果
 */
export const alertImpactResultSchema = {
  impact_direction: ['bullish', 'neutral', 'bearish'],
  impact_score: { min: 1, max: 10 },
  assumption_status: ['intact', 'weakened', 'falsified'],
  suggested_action: ['继续持有', '密切关注', '考虑减仓', '建议止损', '加仓'],
  alert_level: ['info', 'warning', 'critical']
}
