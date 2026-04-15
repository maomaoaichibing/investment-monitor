/**
 * 市场情绪分析师 Prompt
 *
 * 新闻情绪 + 市场热度分析。
 * 基于新闻数据生成情绪信号。
 */

import type { AnalysisContext } from '../types';

export function buildSentimentAnalystPrompt(context: AnalysisContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { symbol, assetName, changePercent } = context;
  const news = context.news || [];

  const newsStr =
    news.length > 0
      ? news
          .slice(0, 10)
          .map((n, i) => `${i + 1}. [${n.source || '未知'}] ${n.title}${n.summary ? '\n   ' + n.summary.slice(0, 100) : ''}`)
          .join('\n')
      : '暂无相关新闻数据';

  return {
    systemPrompt: `你扮演一位专业的市场情绪分析师，擅长从新闻和舆论中提取投资信号。

【分析维度】
1. 新闻情绪: 近期新闻整体偏正面还是负面？
2. 市场共识: 分析师和机构对该股的普遍看法
3. 事件驱动: 是否有重大催化剂或利空事件
4. 舆论热度: 市场关注度是否异常升高或降低
5. 逆向信号: 极端乐观/悲观是否构成反向信号？

【港股情绪分析特殊考量】
- 港股受内地政策影响大，关注政策新闻
- 南向资金流向是重要的情绪指标
- 港股存在"杀估值"周期性特征
- 外资撤离/回流对情绪有放大效应

【信号规则】
- bullish: 正面新闻主导 + 有明确催化剂
- bearish: 负面新闻密集 + 重大利空事件
- neutral: 新闻中性或信号矛盾

【置信度等级】
- 90-100: 强烈正面/负面共识 + 重大事件确认
- 70-89: 新闻方向明确，多个来源佐证
- 50-69: 新闻混合，无法判断主导方向
- 30-49: 有负面信号但影响不确定
- 10-29: 重大负面事件，但可能是过度反应

推理不超过120字。只返回JSON。`,

    userPrompt: `分析股票 ${assetName} (${symbol}) 市场情绪

当前涨跌幅: ${changePercent}%

近期新闻:
${newsStr}

请返回以下JSON格式:
{
  "signal": "bullish|bearish|neutral",
  "confidence": 0-100,
  "reasoning": "简洁理由（<120字）"
}`,
  };
}
