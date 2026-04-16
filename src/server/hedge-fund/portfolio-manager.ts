/**
 * Portfolio Manager — 信号聚合 + 最终决策
 *
 * 借鉴 ai-hedge-fund 的 portfolio_manager.py，
 * 但用 TypeScript 重写，适配港股场景。
 *
 * 核心逻辑：
 * 1. 收集所有 Agent 信号
 * 2. 统计多/空/中性数量
 * 3. 计算加权信号得分（支持动态权重）
 * 4. 生成最终决策
 *
 * v2: 支持 Self Driving Portfolio — 动态权重基于历史准确率
 */

import type {
  AgentSignal,
  PortfolioAction,
  PortfolioDecision,
  SignalSummary,
} from './types';

/**
 * 默认信号权重配置
 * 当动态权重不可用时使用
 */
const DEFAULT_SIGNAL_WEIGHTS: Record<string, number> = {
  'value-investor': 1.3,    // 价值投资权重略高
  'growth-investor': 1.2,   // 成长投资权重略高
  'technical-analyst': 0.8,  // 技术面作为辅助参考
  'sentiment-analyst': 0.7,  // 情绪面权重最低
};

export { DEFAULT_SIGNAL_WEIGHTS };

/**
 * 聚合所有 Agent 信号，生成最终投资决策
 *
 * @param signals Agent 信号数组
 * @param symbol 目标股票
 * @param dynamicWeights 可选的动态权重（来自 AgentPerformanceTracker）
 */
export function aggregateSignals(
  signals: AgentSignal[],
  symbol: string,
  dynamicWeights?: Record<string, number>
): PortfolioDecision {
  const weights = dynamicWeights || DEFAULT_SIGNAL_WEIGHTS;
  const summary = computeSignalSummary(signals, weights);
  const action = determineAction(summary);
  const reasoning = generateReasoning(summary, action, symbol, weights);
  const confidence = computeDecisionConfidence(summary, action);

  return {
    action,
    confidence,
    reasoning,
    signals,
    signalSummary: summary,
    analyzedAt: new Date().toISOString(),
    symbol,
  };
}

/**
 * 计算信号统计摘要
 */
function computeSignalSummary(
  signals: AgentSignal[],
  weights: Record<string, number>
): SignalSummary {
  const bullish = signals.filter(s => s.signal === 'bullish').length;
  const bearish = signals.filter(s => s.signal === 'bearish').length;
  const neutral = signals.filter(s => s.signal === 'neutral').length;

  // 加权得分：bullish=+1, bearish=-1, neutral=0 * weight * confidence/100
  let weightedScore = 0;
  let totalWeight = 0;
  for (const s of signals) {
    const weight = weights[s.agentId] || 1.0;
    const signalValue = s.signal === 'bullish' ? 1 : s.signal === 'bearish' ? -1 : 0;
    weightedScore += signalValue * weight * (s.confidence / 100);
    totalWeight += weight;
  }
  weightedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  const avgConfidence =
    signals.length > 0
      ? Math.round(signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length)
      : 0;

  return {
    bullish,
    bearish,
    neutral,
    avgConfidence,
    weightedScore: Math.round(weightedScore * 100) / 100,
  };
}

/**
 * 基于信号统计确定行动
 *
 * 决策规则：
 * - 加权得分 > 0.2 → buy
 * - 加权得分 < -0.2 → sell
 * - 其他 → hold
 *
 * 特殊规则：
 * - 全部中性 → hold
 * - Agent 信号严重分裂（多空各占40%+）→ hold（不确定性太高）
 */
function determineAction(summary: SignalSummary): PortfolioAction {
  const { bullish, bearish, neutral, weightedScore } = summary;
  const total = bullish + bearish + neutral;

  if (total === 0) return 'hold';

  // 全部中性
  if (neutral === total) return 'hold';

  // 信号严重分裂
  if (bullish >= 2 && bearish >= 2) return 'hold';

  // 基于加权得分决策
  if (weightedScore > 0.2) return 'buy';
  if (weightedScore < -0.2) return 'sell';
  return 'hold';
}

/**
 * 计算决策置信度
 *
 * 越多 Agent 意见一致，置信度越高
 */
function computeDecisionConfidence(
  summary: SignalSummary,
  action: PortfolioAction
): number {
  const { bullish, bearish, neutral, avgConfidence } = summary;
  const total = bullish + bearish + neutral;
  if (total === 0) return 30;

  // 一致性比例（与决策方向一致的 Agent 比例）
  let agreementRatio: number;
  if (action === 'buy') {
    agreementRatio = bullish / total;
  } else if (action === 'sell') {
    agreementRatio = bearish / total;
  } else {
    agreementRatio = neutral / total;
  }

  // 综合置信度 = 一致性 * 平均置信度
  return Math.round(agreementRatio * avgConfidence);
}

/**
 * 生成决策理由
 */
function generateReasoning(
  summary: SignalSummary,
  action: PortfolioAction,
  symbol: string,
  weights: Record<string, number>
): string {
  const { bullish, bearish, neutral, weightedScore } = summary;
  const total = bullish + bearish + neutral;

  if (total === 0) {
    return `${symbol}: 无Agent信号，无法生成决策`;
  }

  // 找出最强信号
  const strongest = action === 'buy' ? `${bullish}/${total}` : action === 'sell' ? `${bearish}/${total}` : `${neutral}/${total}`;

  const actionMap: Record<PortfolioAction, string> = {
    buy: '建议买入',
    sell: '建议卖出',
    hold: '建议持有',
  };

  const reasons: string[] = [];

  if (action === 'hold' && bullish >= 2 && bearish >= 2) {
    reasons.push('多空分歧较大');
  } else if (action === 'hold') {
    reasons.push('信号不够强烈');
  }

  if (Math.abs(weightedScore) > 0.5) {
    reasons.push('多Agent共识较强');
  }

  reasons.push(`加权得分 ${weightedScore > 0 ? '+' : ''}${weightedScore.toFixed(2)}`);

  return `${symbol}: ${actionMap[action]}（${strongest} Agent共识${reasons.length > 0 ? '，' + reasons.join('，') : ''}）`;
}
