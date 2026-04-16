/**
 * Hedge Fund Service — 主编排层
 *
 * 负责数据采集 + Agent 调度 + 信号聚合的完整流程。
 * 是整个 AI Hedge Fund 模块的入口。
 */

import type {
  AnalysisContext,
  AnalyzeRequest,
  AnalyzeResponse,
  AgentAnalysisDetail,
  AgentConfig,
  AgentListResponse,
} from './types';
import { getAllAgents, getAgent } from './agents';
import { getEnabledAgents, AGENT_CONFIGS } from './registry';
import { aggregateSignals } from './portfolio-manager';
import { getStockQuote } from '@/server/services/stockService';
import { getKLineData } from '@/server/services/klineService';
import { fetchNewsForSymbol } from '@/server/services/newsService';
import { getDynamicWeights, saveAnalysisRecord } from './agent-performance';

/**
 * 获取所有 Agent 列表
 */
export function listAgents(): AgentListResponse {
  const agents = AGENT_CONFIGS.map(c => ({
    id: c.id,
    displayName: c.displayName,
    description: c.description,
    investingStyle: c.investingStyle,
    type: c.type,
    order: c.order,
    enabled: c.enabled,
  }));

  return {
    agents,
    total: agents.length,
  };
}

/**
 * 获取单个 Agent 详情
 */
export function getAgentDetail(id: string): AgentConfig | null {
  const config = AGENT_CONFIGS.find(c => c.id === id);
  if (!config) return null;

  return {
    id: config.id,
    displayName: config.displayName,
    description: config.description,
    investingStyle: config.investingStyle,
    type: config.type,
    order: config.order,
    enabled: config.enabled,
  };
}

/**
 * 分析单只股票 — 完整流程
 *
 * 1. 采集数据（行情 + K线 + 新闻）
 * 2. 并行执行所有 Agent
 * 3. 聚合信号生成最终决策
 */
export async function analyzeSymbol(
  request: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const startTime = Date.now();
  const symbol = request.symbol;
  const market = inferMarket(symbol);

  // Step 1: 数据采集（并行）
  const [quoteResult, klineResult, newsResult] = await Promise.allSettled([
    getStockQuote(symbol, market),
    getKLineData(symbol, market, 30),
    fetchNewsForSymbol(symbol, market, { limit: 10 }),
  ]);

  // 构建分析上下文
  const context = buildAnalysisContext(
    symbol,
    market,
    quoteResult.status === 'fulfilled' ? quoteResult.value : null,
    klineResult.status === 'fulfilled' ? klineResult.value : null,
    newsResult.status === 'fulfilled' ? newsResult.value : null,
  );

  // Step 2: 确定要执行的 Agent
  const allAgents = getAllAgents();
  const targetAgents = request.agents
    ? allAgents.filter(a => request.agents!.includes(a.config.id))
    : allAgents.filter(a => a.config.enabled);

  if (targetAgents.length === 0) {
    return {
      symbol,
      assetName: context.assetName,
      decision: {
        action: 'hold',
        confidence: 0,
        reasoning: `${symbol}: 无可用的分析Agent`,
        signals: [],
        signalSummary: { bullish: 0, bearish: 0, neutral: 0, avgConfidence: 0, weightedScore: 0 },
        analyzedAt: new Date().toISOString(),
        symbol,
      },
      agentAnalyses: [],
    };
  }

  // Step 3: 并行执行所有 Agent
  const agentResults = await Promise.allSettled(
    targetAgents.map(async (entry): Promise<AgentAnalysisDetail> => {
      try {
        const signal = await entry.fn(context);
        return {
          agentId: entry.config.id,
          displayName: entry.config.displayName,
          signal,
        };
      } catch (error) {
        console.error(`[HedgeFund] Agent ${entry.config.id} failed:`, error);
        return {
          agentId: entry.config.id,
          displayName: entry.config.displayName,
          signal: {
            agentId: entry.config.id,
            signal: 'neutral' as const,
            confidence: 30,
            reasoning: `Agent执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
            timestamp: new Date().toISOString(),
          },
        };
      }
    })
  );

  const agentAnalyses: AgentAnalysisDetail[] = agentResults
    .filter((r): r is PromiseFulfilledResult<AgentAnalysisDetail> => r.status === 'fulfilled')
    .map(r => r.value);

  const signals = agentAnalyses.map(a => a.signal);

  // Step 3.5: 获取动态权重（基于历史准确率）
  let dynamicWeights: Record<string, number> | undefined;
  try {
    dynamicWeights = await getDynamicWeights('30d');
    console.log('[HedgeFund] 使用动态权重:', dynamicWeights);
  } catch (err) {
    console.warn('[HedgeFund] 动态权重获取失败，使用默认权重:', err);
  }

  // Step 4: 聚合信号生成最终决策
  const decision = aggregateSignals(signals, symbol, dynamicWeights);

  // Step 4.5: 持久化分析记录（异步，不阻塞返回）
  try {
    await saveAnalysisRecord({
      symbol,
      market,
      action: decision.action,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      agentSignals: signals.map(s => ({
        agentId: s.agentId,
        signal: s.signal,
        confidence: s.confidence,
        reasoning: s.reasoning,
      })),
      signalSummary: decision.signalSummary,
      weightedScore: decision.signalSummary.weightedScore,
      analyzedAt: decision.analyzedAt,
    });
  } catch (err) {
    console.warn('[HedgeFund] 分析记录保存失败（非阻塞）:', err);
  }

  console.log(
    `[HedgeFund] 分析完成 ${symbol}: ${decision.action} (置信度${decision.confidence}%) ` +
    `耗时 ${Date.now() - startTime}ms, ${signals.length}个Agent`
  );

  return {
    symbol,
    assetName: context.assetName,
    decision,
    agentAnalyses,
  };
}

// ============================================================
// 内部辅助函数
// ============================================================

/**
 * 推断市场
 */
function inferMarket(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s.endsWith('.HK') || /^\d{4,5}$/.test(s.replace('.HK', ''))) return 'HK';
  if (s.endsWith('.US') || /^[A-Z]+$/.test(s)) return 'US';
  if (/^\d{6}$/.test(s)) return 'A';
  return 'HK'; // 默认港股
}

/**
 * 构建分析上下文
 */
function buildAnalysisContext(
  symbol: string,
  market: string,
  quoteResult: any,
  klineResult: any,
  newsResult: any,
): AnalysisContext {
  // 行情数据
  const quote = quoteResult?.data;
  const currentPrice = quote?.price || 0;
  const changePercent = quote?.changePercent || 0;

  // 基本面数据（从行情中提取）
  const fundamentals: Record<string, any> = {};
  if (quote) {
    if (quote.pe !== undefined) fundamentals.PE = quote.pe;
    if (quote.marketCap !== undefined) fundamentals.marketCap = quote.marketCap;
    if (quote.dividend !== undefined) fundamentals.dividendYield = quote.dividend;
    if (quote.week52High !== undefined) fundamentals['52WeekHigh'] = quote.week52High;
    if (quote.week52Low !== undefined) fundamentals['52WeekLow'] = quote.week52Low;
    if (quote.volume !== undefined) fundamentals.volume = quote.volume;
    if (quote.amount !== undefined) fundamentals.amount = quote.amount;
  }

  // K线数据
  const klineData = klineResult?.data?.klines?.map((k: any) => ({
    date: k.date,
    open: k.open,
    close: k.close,
    high: k.high,
    low: k.low,
    volume: k.volume,
  })) || [];

  // 新闻数据
  const news = newsResult?.data?.map((n: any) => ({
    title: n.title || '',
    summary: n.content || n.summary || '',
    source: n.source || '',
    publishedAt: n.publishedAt || '',
    sentiment: n.sentiment || 'neutral',
  })) || [];

  return {
    symbol,
    assetName: quote?.name || symbol,
    market,
    currentPrice,
    changePercent,
    fundamentals: Object.keys(fundamentals).length > 0 ? fundamentals : undefined,
    klineData: klineData.length > 0 ? klineData : undefined,
    news: news.length > 0 ? news : undefined,
  };
}
