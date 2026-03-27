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

// 监控指标Schema
export const MonitorIndicatorSchema = z.object({
  name: z.string(),
  type: z.enum(['fundamental', 'industry', 'macro', 'technical', 'sentiment', 'price']),
  frequency: z.enum(['realtime', 'daily', 'weekly', 'monthly', 'quarterly']),
  dataSource: z.string().optional(),
})

// 议题支柱Schema（核心新增）
export const ThesisPillarSchema = z.object({
  id: z.number(),
  name: z.string(),
  coreAssumption: z.string(),
  conviction: z.number().min(1).max(10),
  monitorIndicators: z.array(MonitorIndicatorSchema),
  bullishSignal: z.string(),
  riskTrigger: z.string(),
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