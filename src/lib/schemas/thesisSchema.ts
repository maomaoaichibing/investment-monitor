import { z } from 'zod'

// 价格阶段分析Schema
export const PricePhaseSchema = z.object({
  period: z.string().optional(),
  phase: z.string().optional(), // 兼容旧格式
  description: z.string().min(1, "阶段描述不能为空"),
  keyLevels: z.array(z.string()).optional(),
  drivers: z.array(z.string()).optional(),
  evidence: z.array(z.string()).optional(),
})

// 数据类型枚举（按#1 Prompt要求）
export const DataTypeEnum = z.enum([
  'stock_price',      // 股票价格
  'financial_report', // 财务报告
  'industry_stats',   // 行业统计
  'commodity_price',  // 大宗商品价格
  'news_event',       // 新闻事件
  'analyst_estimate', // 分析师预期
  'valuation',        // 估值指标
  'fund_flow'         // 资金流向
])

// 监控指标Schema（增强版）
export const MonitorIndicatorSchema = z.object({
  name: z.string(),
  type: z.enum(['fundamental', 'industry', 'macro', 'technical', 'sentiment', 'price']),
  frequency: z.enum(['realtime', 'daily', 'weekly', 'monthly', 'quarterly', 'event']),
  dataSource: z.string().optional(),
  dataType: DataTypeEnum.optional(), // 数据类型
})

// 议题支柱Schema（核心增强版 - 按#1 Prompt）
export const ThesisPillarSchema = z.object({
  id: z.number(),
  name: z.string(),
  coreAssumption: z.string(), // 必须可证伪、具体、包含数字
  conviction: z.number().min(1).max(10),
  monitorIndicators: z.array(MonitorIndicatorSchema),
  bullishSignal: z.string(),
  riskTrigger: z.string(),
  impactWeight: z.number().min(0).max(100).optional(), // 权重，所有议题之和=100
})

// 核心论题Schema（兼容旧格式）
export const CoreThesisSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  conviction: z.number().min(1).max(10).optional(),
})

// 监控目标Schema（兼容旧格式）
export const MonitorTargetSchema = z.object({
  type: z.enum(['price', 'fundamental', 'technical', 'event', 'other']).optional(),
  condition: z.string().optional(),
  action: z.string().optional(),
  name: z.string().optional(),
  why: z.string().optional(),
})

// Thesis输出Schema（用于校验LLM输出 - 增强版）
export const ThesisSchema = z.object({
  thesisSummary: z.string().optional(), // 新格式：一句话总结
  overallHealthScore: z.number().min(0).max(100).optional(), // 论点健康度(0-100)
  pillars: z.array(ThesisPillarSchema).optional(), // 新格式：议题树
  summary: z.string().optional(), // 兼容旧格式
  pricePhases: z.array(PricePhaseSchema).optional(),
  coreThesis: z.array(CoreThesisSchema).optional(), // 兼容旧格式
  fragilePoints: z.array(z.string()).optional(),
  monitorTargets: z.array(MonitorTargetSchema).optional(), // 兼容旧格式
})

// Thesis数据库Schema（扩展字段）
export const ThesisDbSchema = z.object({
  id: z.string().optional(),
  positionId: z.string(),
  portfolioId: z.string(),
  summary: z.string(),
  healthScore: z.number().min(0).max(100).optional(), // 论点健康度
  pricePhases: z.array(PricePhaseSchema).optional(),
  coreThesis: z.array(CoreThesisSchema).optional(),
  fragilePoints: z.array(z.string()).optional(),
  monitorTargets: z.array(MonitorTargetSchema).optional(),
  pillars: z.array(ThesisPillarSchema).optional(), // 新增议题树
  pillarsJson: z.string().optional(), // 数据库JSON存储
  status: z.enum(['generated', 'pending', 'failed']).default('generated'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

// 生成Thesis的输入Schema
export const GenerateThesisInputSchema = z.object({
  positionId: z.string().min(1, "持仓ID不能为空")
})

// 类型导出
export type PricePhase = z.infer<typeof PricePhaseSchema>
export type CoreThesis = z.infer<typeof CoreThesisSchema>
export type MonitorTarget = z.infer<typeof MonitorTargetSchema>
export type ThesisPillar = z.infer<typeof ThesisPillarSchema>
export type Thesis = z.infer<typeof ThesisSchema>
export type ThesisDb = z.infer<typeof ThesisDbSchema>
export type GenerateThesisInput = z.infer<typeof GenerateThesisInputSchema>