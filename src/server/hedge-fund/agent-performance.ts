/**
 * Agent Performance Tracker
 *
 * 追踪每个 Agent 的历史准确率，为动态权重提供数据基础。
 * Self Driving Portfolio 的核心组件。
 *
 * 准确率计算逻辑：
 * - 预测 bullish → 实际上涨 → 正确
 * - 预测 bearish → 实际下跌 → 正确
 * - 预测 neutral → 任何方向 → 忽略（不计入准确率）
 *
 * 准确率窗口：7天 / 30天 / 90天
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// 准确率计算
// ============================================================

export interface AgentAccuracy {
  agentId: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number; // 0-1
  window: string; // 7d / 30d / 90d
  avgConfidence: number;
}

/**
 * 获取单个 Agent 的准确率
 */
export async function getAgentAccuracy(
  agentId: string,
  window: string = '30d'
): Promise<AgentAccuracy> {
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[window] || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const records = await prisma.agentPerformance.findMany({
    where: {
      agentId,
      verified: true,
      verifiedAt: { gte: since },
      predictedSignal: { not: 'neutral' }, // neutral 不计入
    },
  });

  if (records.length === 0) {
    return {
      agentId,
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0.5, // 无数据时默认 0.5（中性）
      window,
      avgConfidence: 50,
    };
  }

  const correct = records.filter(r => {
    const predicted = r.predictedSignal;
    const actual = r.actualChange || 0;
    if (predicted === 'bullish') return actual > 0;
    if (predicted === 'bearish') return actual < 0;
    return false;
  }).length;

  const avgConf = records.reduce((sum, r) => sum + (r.predictedConfidence || 50), 0) / records.length;

  return {
    agentId,
    totalPredictions: records.length,
    correctPredictions: correct,
    accuracy: correct / records.length,
    window,
    avgConfidence: Math.round(avgConf),
  };
}

/**
 * 获取所有 Agent 的准确率
 */
export async function getAllAgentAccuracy(
  window: string = '30d'
): Promise<AgentAccuracy[]> {
  const agentIds = ['value-investor', 'growth-investor', 'technical-analyst', 'sentiment-analyst'];
  return Promise.all(agentIds.map(id => getAgentAccuracy(id, window)));
}

// ============================================================
// 分析记录持久化
// ============================================================

/**
 * 保存一次分析结果
 */
export async function saveAnalysisRecord(data: {
  symbol: string;
  market?: string;
  action: string;
  confidence: number;
  reasoning: string;
  agentSignals: Array<{
    agentId: string;
    signal: string;
    confidence: number;
    reasoning: string;
  }>;
  signalSummary: {
    bullish: number;
    bearish: number;
    neutral: number;
    avgConfidence: number;
    weightedScore: number;
  };
  weightedScore?: number;
  analyzedAt: string;
}): Promise<string> {
  const record = await prisma.analysisRecord.create({
    data: {
      symbol: data.symbol,
      market: data.market || 'HK',
      action: data.action,
      confidence: data.confidence,
      reasoning: data.reasoning,
      agentSignalsJson: JSON.stringify(data.agentSignals),
      signalSummaryJson: JSON.stringify(data.signalSummary),
      weightedScore: data.weightedScore,
      analyzedAt: new Date(data.analyzedAt),
    },
  });

  // 同时保存每个 Agent 的预测记录
  for (const agent of data.agentSignals) {
    try {
      await prisma.agentPerformance.create({
        data: {
          agentId: agent.agentId,
          symbol: data.symbol,
          predictedSignal: agent.signal,
          predictedConfidence: agent.confidence,
          analysisRecordId: record.id,
        },
      });
    } catch {
      // unique constraint 可能触发（同一 agent + symbol + 时间），忽略
    }
  }

  return record.id;
}

// ============================================================
// 验证（对比预测 vs 实际涨跌）
// ============================================================

/**
 * 验证未验证的分析记录
 * 调用外部 API 获取实际涨跌幅，更新 AgentPerformance
 */
export async function verifyPendingRecords(
  getActualChange: (symbol: string, window: string) => Promise<number | null>
): Promise<{
  verified: number;
  total: number;
}> {
  const pending = await prisma.analysisRecord.findMany({
    where: { verified: false },
    orderBy: { analyzedAt: 'asc' },
    take: 50, // 每次最多验证 50 条
  });

  let verified = 0;

  for (const record of pending) {
    const daysSinceAnalysis = Math.floor(
      (Date.now() - record.analyzedAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    // 至少 7 天后才验证
    if (daysSinceAnalysis < 7) continue;

    const window = daysSinceAnalysis >= 90 ? '90d' : daysSinceAnalysis >= 30 ? '30d' : '7d';

    try {
      const actualChange = await getActualChange(record.symbol, window);
      if (actualChange === null) continue;

      // 更新 AnalysisRecord
      await prisma.analysisRecord.update({
        where: { id: record.id },
        data: {
          verified: true,
          actualChange,
          verifyWindow: window,
        },
      });

      // 更新对应的 AgentPerformance 记录
      const signals = JSON.parse(record.agentSignalsJson || '[]');
      for (const signal of signals) {
        await prisma.agentPerformance.updateMany({
          where: {
            agentId: signal.agentId,
            symbol: record.symbol,
            analysisRecordId: record.id,
            verified: false,
          },
          data: {
            verified: true,
            actualChange,
            verifyWindow: window,
            verifiedAt: new Date(),
          },
        });
      }

      verified++;
    } catch (err) {
      console.error(`[AgentPerformance] 验证 ${record.symbol} 失败:`, err);
    }
  }

  return { verified, total: pending.length };
}

// ============================================================
// 动态权重计算
// ============================================================

const BASE_WEIGHTS: Record<string, number> = {
  'value-investor': 1.3,
  'growth-investor': 1.2,
  'technical-analyst': 0.8,
  'sentiment-analyst': 0.7,
};

/**
 * 基于准确率计算动态权重
 *
 * accuracy_factor: 0.3 ~ 2.0
 * - accuracy > 60% → factor > 1（加权）
 * - accuracy = 50% → factor = 1（不变）
 * - accuracy < 40% → factor < 1（降权）
 * - 无数据 → factor = 1（使用基础权重）
 */
export async function getDynamicWeights(
  window: string = '30d'
): Promise<Record<string, number>> {
  const accuracies = await getAllAgentAccuracy(window);
  const weights: Record<string, number> = {};

  for (const acc of accuracies) {
    const base = BASE_WEIGHTS[acc.agentId] || 1.0;

    if (acc.totalPredictions < 5) {
      // 数据不足，使用基础权重
      weights[acc.agentId] = base;
      continue;
    }

    // accuracy_factor = 0.3 + (accuracy - 0.3) * 1.4，clamp 到 [0.3, 2.0]
    const factor = Math.max(0.3, Math.min(2.0, 0.3 + (acc.accuracy - 0.3) * 1.4));
    weights[acc.agentId] = Math.round(base * factor * 100) / 100;
  }

  return weights;
}
