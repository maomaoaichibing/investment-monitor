/**
 * AI Hedge Fund — 核心类型定义
 *
 * 借鉴 virattt/ai-hedge-fund 的信号格式，
 * 完全适配 TypeScript / smart-investment 技术栈。
 */

// ============================================================
// Agent 信号
// ============================================================

export type SignalType = 'bullish' | 'bearish' | 'neutral';

export interface AgentSignal {
  /** Agent 唯一标识 (e.g. 'value-investor') */
  agentId: string;
  /** 信号方向 */
  signal: SignalType;
  /** 置信度 0-100 */
  confidence: number;
  /** 决策理由（简洁，<120字） */
  reasoning: string;
  /** 分析时间戳 */
  timestamp: string;
  /** Agent 执行耗时(ms) */
  durationMs?: number;
}

// ============================================================
// Agent 配置（注册表）
// ============================================================

export type AgentType = 'philosophy' | 'analytical' | 'special';

export interface AgentConfig {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  displayName: string;
  /** 简短描述 */
  description: string;
  /** 投资风格说明 */
  investingStyle: string;
  /** Agent 类型 */
  type: AgentType;
  /** 执行顺序（越小越先） */
  order: number;
  /** 是否启用 */
  enabled: boolean;
}

// ============================================================
// Agent 函数签名
// ============================================================

/** Agent 输入数据（从 stockService/klineService 聚合） */
export interface AnalysisContext {
  /** 股票代码 (e.g. '00700.HK') */
  symbol: string;
  /** 股票名称 */
  assetName: string;
  /** 市场标识 */
  market: string;
  /** 当前价格 */
  currentPrice: number;
  /** 涨跌幅(%) */
  changePercent: number;
  /** 基本面数据（来自 stockService） */
  fundamentals?: Record<string, any>;
  /** K线数据（来自 klineService） */
  klineData?: KlineDataPoint[];
  /** 新闻列表（来自 newsService） */
  news?: NewsItem[];
}

export interface KlineDataPoint {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface NewsItem {
  title: string;
  summary?: string;
  source?: string;
  publishedAt?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

/** Agent 执行函数 */
export type AgentFunction = (context: AnalysisContext) => Promise<AgentSignal>;

/** Agent 注册条目（配置 + 执行函数） */
export type AgentEntry = {
  config: AgentConfig;
  fn: AgentFunction;
};

// ============================================================
// Portfolio Manager
// ============================================================

export type PortfolioAction = 'buy' | 'sell' | 'hold';

export interface PortfolioDecision {
  /** 最终行动 */
  action: PortfolioAction;
  /** 决策置信度 0-100 */
  confidence: number;
  /** 综合理由 */
  reasoning: string;
  /** 所有Agent的原始信号 */
  signals: AgentSignal[];
  /** 信号统计 */
  signalSummary: SignalSummary;
  /** 分析时间 */
  analyzedAt: string;
  /** 目标股票 */
  symbol: string;
}

export interface SignalSummary {
  bullish: number;
  bearish: number;
  neutral: number;
  avgConfidence: number;
  /** 加权信号得分（看多+1/看空-1/中性0 * confidence/100） */
  weightedScore: number;
}

// ============================================================
// 分析请求/响应
// ============================================================

export interface AnalyzeRequest {
  symbol: string;
  /** 可选：指定要启用的Agent列表（默认全部启用） */
  agents?: string[];
}

export interface AnalyzeResponse {
  symbol: string;
  assetName: string;
  decision: PortfolioDecision;
  /** 各Agent的详细分析过程 */
  agentAnalyses: AgentAnalysisDetail[];
}

export interface AgentAnalysisDetail {
  agentId: string;
  displayName: string;
  signal: AgentSignal;
  /** Agent 使用的 prompt（脱敏后） */
  promptUsed?: string;
}

// ============================================================
// Agent 列表响应
// ============================================================

export interface AgentListResponse {
  agents: AgentConfig[];
  total: number;
}

// ============================================================
// Zod Schema（用于API验证）
// ============================================================

// 注意：Zod schemas 在对应的 API route 中定义，
// 这里只放类型，保持 types.ts 纯净。
