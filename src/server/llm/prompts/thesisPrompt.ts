import { ThesisInput } from '@/server/services/thesisService'

export function buildThesisPrompt(input: ThesisInput): string {
  const { symbol, assetName, market, investmentThesis, direction, buyPrice, holdingPeriod } = input

  // 判断是做多还是做空
  const isLong = !direction || direction.toLowerCase().includes('多') || direction.toLowerCase().includes('long') || direction.toLowerCase().includes('buy')
  const positionType = isLong ? '做多' : '做空'

  // 根据方向设置信号描述
  const signalLabel = isLong ? 'bullish_signal' : 'bearish_signal'
  const signalDesc = isLong
    ? '看多验证条件（什么数据出现说明做多逻辑成立）'
    : '看空验证条件（什么数据出现说明做空逻辑成立）'
  const signalExample = isLong
    ? '"纳指100指数持续上涨，季度营收增速超过20%"'
    : '"纳指100指数下跌超过20%，科技股泡沫破裂"'
  const riskExample = isLong
    ? '"公司核心业务增速放缓，竞争对手超越"'
    : '"纳指不跌反涨，流动性涌入推动指数创新高"'
  const summaryExample = isLong
    ? '看好公司核心业务持续增长' : '看空纳指高估值泡沫将通过业绩下调实现均值回归'

  return `# 角色
你是一位资深投资研究员，擅长构建投资逻辑监控框架。

# 任务
用户刚添加了一个新持仓，请基于以下信息，生成一份结构化的「投资逻辑监控框架」。

# 用户输入
- 股票代码/名称：${symbol} ${assetName}
- 持仓方向：${positionType}（重要：这是${positionType}仓位！）
- 买入价格：${buyPrice || '未指定'}
- 投资理由：${investmentThesis || '用户未提供详细理由'}
- 预期持有周期：${holdingPeriod || '长期持有'}

# ⚠️ 重要：这个持仓是 ${positionType}！

请务必根据持仓方向生成符合逻辑的分析：
- **做多仓位**：分析上涨驱动因素，寻找做多信号
- **做空仓位**：分析下跌驱动因素，寻找做空信号（注意：做空产品的涨跌方向与标的资产相反！）

# 输出要求
请生成 3-5 个核心议题（Pillar），每个议题必须包含以下字段：

1. **pillar_name**：议题名称（简短，如"${isLong ? '行业需求增长' : '指数高估泡沫'}"）
2. **core_assumption**：核心假设（必须是一句可证伪的具体陈述，包含数字或明确条件，如"${isLong ? '2025年营收增速>20%' : '纳指动态市盈率>40倍时，泡沫破裂概率>60%'}"）
3. **monitor_indicators**：需要监控的关键指标列表，每个指标包含：
   - indicator_name：指标名称
   - data_source：建议数据来源（如 AKShare、Tushare、东方财富、Yahoo Finance 等）
   - frequency：监控频率（实时/日度/周度/月度/季度/事件驱动）
   - data_type：数据类型（stock_price / financial_report / industry_stats / commodity_price / news_event / analyst_estimate / valuation / fund_flow）
4. **${signalLabel}**：${signalDesc}
5. **risk_trigger**：风险触发条件（什么数据出现说明逻辑可能失效）
   - 做多风险：${isLong ? '"公司核心业务增速放缓，竞争对手超越"' : '"纳指不跌反涨，流动性涌入推动指数创新高"'}
6. **impact_weight**：该议题对整体论点的权重（所有议题权重之和=100%）

# 输出格式
严格按以下 JSON 格式输出，不要输出任何多余文字：

{
  "stock_code": "${symbol}",
  "stock_name": "${assetName}",
  "position_direction": "${positionType}",
  "thesis_summary": "${summaryExample}",
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
      "${signalLabel}": "",
      "risk_trigger": "",
      "impact_weight": 30
    }
  ]
}

# 注意事项
- core_assumption 必须具体、可量化、可证伪
- **做空仓位**的核心假设应该是看空逻辑，如"纳指下跌"、"高估值回归"、"业绩下调"等
- **做空仓位**的信号应该是看空信号，不是看多信号！
- monitor_indicators 优先推荐可自动化获取的数据源
- 每个议题的 monitor_indicators 控制在 2-4 个
- impact_weight 根据该议题对投资逻辑的重要程度分配`
}