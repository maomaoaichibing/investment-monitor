import { ThesisInput } from '@/server/services/thesisService'

export function buildThesisPrompt(input: ThesisInput): string {
  const { symbol, assetName, market, investmentThesis, direction, buyPrice, holdingPeriod } = input

  return `# 角色
你是一位资深投资研究员，擅长构建投资逻辑监控框架。

# 任务
用户刚添加了一个新持仓，请基于以下信息，生成一份结构化的「投资逻辑监控框架」。

# 用户输入
- 股票代码/名称：${symbol} ${assetName}
- 持仓方向：${direction || '做多'}
- 买入价格：${buyPrice || '未指定'}
- 投资理由：${investmentThesis || '用户未提供详细理由'}
- 预期持有周期：${holdingPeriod || '长期持有'}

# 输出要求
请生成 3-5 个核心议题（Pillar），每个议题必须包含以下字段：

1. **pillar_name**：议题名称（简短，如"行业需求增长"）
2. **core_assumption**：核心假设（必须是一句可证伪的具体陈述，包含数字或明确条件，如"2025年营收增速>20%"）
3. **monitor_indicators**：需要监控的关键指标列表，每个指标包含：
   - indicator_name：指标名称
   - data_source：建议数据来源（如 AKShare、Tushare、东方财富、新闻爬虫等）
   - frequency：监控频率（实时/日度/周度/月度/季度/事件驱动）
   - data_type：数据类型（stock_price / financial_report / industry_stats / commodity_price / news_event / analyst_estimate / valuation / fund_flow）
4. **bullish_signal**：看多验证条件（什么数据出现说明逻辑成立）
5. **risk_trigger**：风险触发条件（什么数据出现说明逻辑可能失效）
6. **impact_weight**：该议题对整体论点的权重（所有议题权重之和=100%）

# 输出格式
严格按以下 JSON 格式输出，不要输出任何多余文字：

{
  "stock_code": "${symbol}",
  "stock_name": "${assetName}",
  "thesis_summary": "一句话总结投资逻辑",
  "overall_health_score": 80,
  "pillars": [
    {
      "pillar_id": 1,
      "pillar_name": "",
      "core_assumption": "",
      "monitor_indicators": [
        {
          "indicator_name": "",
          "data_source": "",
          "frequency": "",
          "data_type": ""
        }
      ],
      "bullish_signal": "",
      "risk_trigger": "",
      "impact_weight": 30
    }
  ]
}

# 注意事项
- core_assumption 必须具体、可量化、可证伪，不要写"看好增长"这种模糊表述
- monitor_indicators 优先推荐可自动化获取的数据源（AKShare、Tushare 优先）
- 每个议题的 monitor_indicators 控制在 2-4 个，不要太多
- impact_weight 根据该议题对投资逻辑的重要程度分配`
}