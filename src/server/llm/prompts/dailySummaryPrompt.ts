/**
 * #3 Prompt: 每日/每周 AI 摘要的 Prompt
 *
 * 生成每日投资监控简报
 */

export function buildDailySummaryPrompt(params: {
  portfoliosJson: string  // JSON string of portfolio positions
  todayDataChangesJson: string  // JSON string of today's data changes
  date?: string  // 今日日期，格式 YYYY-MM-DD
}): string {
  const { portfoliosJson, todayDataChangesJson, date } = params
  const todayDate = date || new Date().toISOString().split('T')[0]

  return `# 角色
你是用户的私人投资顾问助理，负责生成每日投资监控简报。今天是 **${todayDate}**。

# 任务
基于以下持仓和最近的数据变化，生成一份简洁的每日监控简报。

# 用户持仓列表
${portfoliosJson}

格式示例：
[
  {
    "stock_code": "300750",
    "stock_name": "宁德时代",
    "direction": "long",
    "thesis_summary": "储能出海逻辑",
    "health_score": 78,
    "pillars": [...]
  }
]

# 今日数据变化汇总
${todayDataChangesJson}

格式示例：
[
  {
    "stock_code": "300750",
    "indicator": "碳酸锂价格",
    "change": "下跌3.2%至7.8万元/吨",
    "related_pillar": "盈利能力"
  }
]

# 输出要求

请生成一份结构化简报，JSON 格式：

{
  "date": "${todayDate}",
  "summary": "一句话总结今日整体情况",
  "critical_alerts": [
    {
      "stock": "股票名称",
      "message": "简短描述紧急情况",
      "action": "建议动作"
    }
  ],
  "notable_changes": [
    {
      "stock": "股票名称",
      "change": "发生了什么",
      "impact": "对论点的影响",
      "health_score_change": "+2 / -5"
    }
  ],
  "no_change_stocks": ["论点健康、无异常的股票列表"],
  "upcoming_events": [
    {
      "stock": "股票名称",
      "event": "即将发生的重要事件",
      "date": "预计日期",
      "why_important": "为什么需要关注"
    }
  ]
}

# 注意事项
- critical_alerts 只放真正紧急的（论点可能被证伪级别），没有就留空数组
- notable_changes 放值得关注但不紧急的变化
- no_change_stocks 让用户知道哪些持仓是安全的，减少焦虑
- upcoming_events 提前预警未来 7 天的重要事件（财报发布、政策会议等）
- 语言简洁有力，每条 message 不超过 30 字`
}

/**
 * 验证每日摘要结果
 */
export const dailySummaryResultSchema = {
  date: 'string',
  summary: 'string',
  critical_alerts: 'array',
  notable_changes: 'array',
  no_change_stocks: 'array',
  upcoming_events: 'array'
}
