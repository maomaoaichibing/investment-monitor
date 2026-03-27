import { z } from 'zod'

// Portfolio Schemas
export const CreatePortfolioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  positions: z.array(z.object({
    symbol: z.string().min(1),
    assetName: z.string().min(1),
    quantity: z.number().positive(),
    costPrice: z.number().positive(),
  })).optional(),
})

export type CreatePortfolioInput = z.infer<typeof CreatePortfolioSchema>

// Position Schemas
export const CreatePositionSchema = z.object({
  portfolioId: z.string(),
  symbol: z.string().min(1, 'Symbol is required'),
  assetName: z.string().min(1, 'Asset name is required'),
  market: z.string().min(1, 'Market is required'),
  quantity: z.number().positive('Quantity must be positive'),
  costPrice: z.number().positive('Cost price must be positive'),
  positionWeight: z.number().min(0).max(100, 'Position weight must be between 0-100'),
  holdingStyle: z.enum(['short_term', 'swing', 'long_term']),
  investmentThesis: z.string().optional(),  // 投资理由
})

export type CreatePositionInput = z.infer<typeof CreatePositionSchema>

// Thesis JSON Schemas - 议题树结构

// 单个议题支柱
export const ThesisPillarSchema = z.object({
  id: z.number(),
  name: z.string(),                    // 议题名称，如"欧洲储能需求"
  coreAssumption: z.string(),          // 核心假设（可证伪的具体陈述）
  conviction: z.number().min(1).max(10), // 信心度 1-10
  monitorIndicators: z.array(z.object({
    name: z.string(),                  // 指标名称
    type: z.enum(['fundamental', 'industry', 'macro', 'technical', 'sentiment', 'price']),
    frequency: z.enum(['realtime', 'daily', 'weekly', 'monthly', 'quarterly']),
    dataSource: z.string().optional(), // 数据来源建议
  })),
  bullishSignal: z.string(),          // 看多信号条件
  riskTrigger: z.string(),            // 风险触发条件
})

// 价格阶段
export const PricePhaseSchema = z.object({
  period: z.string(),
  direction: z.enum(['up', 'down', 'neutral']),
  drivers: z.array(z.string()),
  evidence: z.array(z.string()),
})

export const MonitorTargetSchema = z.object({
  name: z.string(),
  type: z.enum(['fundamental', 'industry', 'macro', 'technical', 'sentiment']),
  why: z.string(),
})

// 增强版Thesis输出 - 包含议题树
export const ThesisOutputSchema = z.object({
  thesisSummary: z.string(),          // 核心投资逻辑一句话总结
  pillars: z.array(ThesisPillarSchema), // 议题树
  pricePhases: z.array(PricePhaseSchema).optional(),
  coreThesis: z.array(z.string()).optional(),    // 兼容旧格式
  fragilePoints: z.array(z.string()).optional(),   // 兼容旧格式
  monitorTargets: z.array(MonitorTargetSchema).optional(), // 兼容旧格式
})

export type ThesisOutput = z.infer<typeof ThesisOutputSchema>

// Monitor Plan JSON Schemas
export const MonitorItemSchema = z.object({
  target: z.string(),
  category: z.string(),
  trigger: z.string(),
  impact: z.enum(['logic_strengthen', 'logic_maintain', 'logic_weaken', 'logic_reverse']),
  severity: z.enum(['low', 'medium', 'high']),
})

export const MonitorPlanOutputSchema = z.object({
  priority: z.enum(['low', 'medium', 'high']),
  monitorItems: z.array(MonitorItemSchema),
})

export type MonitorPlanOutput = z.infer<typeof MonitorPlanOutputSchema>

// Event Analysis JSON Schemas
export const EventAnalysisOutputSchema = z.object({
  relevanceScore: z.number().min(0).max(1),
  thesisImpact: z.enum(['strengthen', 'maintain', 'weaken', 'reverse']),
  impactLevel: z.enum(['low', 'medium', 'high']),
  reasoning: z.array(z.string()),
  evidence: z.array(z.string()),
  actionFramework: z.string(),
})

export type EventAnalysisOutput = z.infer<typeof EventAnalysisOutputSchema>

// Alert Level Mapping
export const AlertLevelSchema = z.enum(['info', 'watch', 'important', 'urgent'])

// Event Type Enum
export const EventTypeSchema = z.enum([
  'earnings',
  'guidance_change',
  'policy',
  'industry_data',
  'price_break',
  'management_comment',
  'regulation',
  'news',
])

// Holding Style Enum
export const HoldingStyleSchema = z.enum(['short_term', 'swing', 'long_term'])