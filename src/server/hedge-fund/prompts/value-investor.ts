/**
 * 价值投资分析师 Prompt
 *
 * 融合巴菲特护城河 + 格雷厄姆安全边际思维。
 * 适配港股基本面数据。
 */

import type { AnalysisContext } from '../types';

export function buildValueInvestorPrompt(context: AnalysisContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { symbol, assetName, fundamentals, currentPrice } = context;

  const fundamentalsStr = fundamentals
    ? Object.entries(fundamentals)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    : '无基本面数据';

  return {
    systemPrompt: `你扮演一位融合巴菲特和格雷厄姆智慧的价值投资分析师。

【投资决策清单】
1. 护城河 (Competitive Moat): 公司是否有可持续的竞争优势？
2. 财务实力 (Financial Strength): ROE、负债率、现金流是否健康？
3. 安全边际 (Margin of Safety): 当前价格是否显著低于内在价值？
4. 管理层质量: 公司治理和管理层可信度
5. 长期前景: 行业趋势是否有利于公司

【港股特殊考量】
- 港股常有流动性折价，不要因此低估优质公司
- 注意港股通资金流向对个股的影响
- 关注公司回购和分红政策（港股优质公司特征）

【信号规则】
- bullish: 优质业务 + 明显安全边际 (>25%)
- bearish: 业务恶化 + 高估或财务风险
- neutral: 业务一般或安全边际不足

【置信度等级】
- 90-100: 能力圈内卓越业务，价格极具吸引力
- 70-89: 良好业务，估值合理偏低
- 50-69: 信号混杂，需要更多信息
- 30-49: 超出评估范围或基本面令人担忧
- 10-29: 业务差或严重高估

推理不超过120字。只返回JSON。`,

    userPrompt: `分析股票 ${assetName} (${symbol})

当前价格: ${currentPrice}
基本面数据:
${fundamentalsStr}

请返回以下JSON格式:
{
  "signal": "bullish|bearish|neutral",
  "confidence": 0-100,
  "reasoning": "简洁理由（<120字）"
}`,
  };
}
