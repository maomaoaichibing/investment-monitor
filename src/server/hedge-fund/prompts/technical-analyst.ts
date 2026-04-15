/**
 * 技术分析师 Prompt
 *
 * 价格/成交量/均线/趋势分析。
 * 基于 K 线数据生成技术信号。
 */

import type { AnalysisContext } from '../types';

export function buildTechnicalAnalystPrompt(context: AnalysisContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { symbol, assetName, currentPrice, changePercent, klineData } = context;

  // 取最近30个交易日的K线数据摘要
  let klineSummary = '无K线数据';
  if (klineData && klineData.length > 0) {
    const recent = klineData.slice(-30);
    const closes = recent.map(k => k.close);
    const volumes = recent.map(k => k.volume);
    const highs = recent.map(k => k.high);
    const lows = recent.map(k => k.low);

    const avg20 = closes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, closes.length);
    const avg5 = closes.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, closes.length);
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length);
    const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, volumes.length);
    const high20 = Math.max(...highs);
    const low20 = Math.min(...lows);

    const trend5d = ((closes[closes.length - 1] - closes[Math.max(0, closes.length - 6)]) / closes[Math.max(0, closes.length - 6)] * 100).toFixed(2);
    const trend20d = ((closes[closes.length - 1] - closes[0]) / closes[0] * 100).toFixed(2);

    klineSummary = `最近30日K线摘要:
- 当前价: ${currentPrice} (今日${changePercent > 0 ? '+' : ''}${changePercent}%)
- 5日均线: ${avg5.toFixed(2)} | 20日均线: ${avg20.toFixed(2)}
- 5日趋势: ${trend5d}% | 20日趋势: ${trend20d}%
- 20日最高: ${high20} | 20日最低: ${low20}
- 5日均量: ${Math.round(recentVolume)} | 20日均量: ${Math.round(avgVolume)} (量比: ${(recentVolume / avgVolume).toFixed(2)})
- 价格位置: ${((currentPrice - low20) / (high20 - low20) * 100).toFixed(0)}% (20日区间)
- 近5日K线: ${recent.slice(-5).map(k => `${k.date}: ${k.open}→${k.close} (${((k.close - k.open) / k.open * 100).toFixed(1)}%)`).join(' | ')}`;
  }

  return {
    systemPrompt: `你扮演一位专业的技术分析师，精通港股技术分析方法。

【分析维度】
1. 趋势判断: 价格与均线关系（5/10/20/60日均线）
2. 支撑阻力: 关键价格位和成交密集区
3. 动量分析: 涨跌速度和力度变化
4. 成交量验证: 上涨是否有量配合，下跌是否缩量
5. 形态识别: 常见K线组合和技术形态

【港股技术面特殊考量】
- 港股受A股和美股双重影响，注意跳空缺口
- 港股下午3:30-4:00有尾盘特征
- 大型蓝筹（如腾讯、阿里）技术面参考性较强
- 小型股可能受庄家操纵，技术信号可靠性下降

【信号规则】
- bullish: 上升趋势 + 放量确认 + 突破阻力
- bearish: 下降趋势 + 放量下跌 + 跌破支撑
- neutral: 震荡整理或信号矛盾

【置信度等级】
- 90-100: 多重技术信号共振，趋势明确
- 70-89: 主要趋势清晰，成交量配合
- 50-69: 信号混杂，方向不确定
- 30-49: 技术面恶化但未完全破位
- 10-29: 技术面全面恶化

推理不超过120字。只返回JSON。`,

    userPrompt: `分析股票 ${assetName} (${symbol}) 技术面

${klineSummary}

请返回以下JSON格式:
{
  "signal": "bullish|bearish|neutral",
  "confidence": 0-100,
  "reasoning": "简洁理由（<120字）"
}`,
  };
}
