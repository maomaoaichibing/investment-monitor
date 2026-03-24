import { z } from 'zod'

// 价格阶段分析Schema
export const PricePhaseSchema = z.object({
  phase: z.string().min(1, "阶段名称不能为空"),
  description: z.string().min(1, "阶段描述不能为空"),
  keyLevels: z.array(z.string()).optional()
})

// 核心论题Schema
export const CoreThesisSchema = z.object({
  title: z.string().min(1, "论题标题不能为空"),
  description: z.string().min(1, "论题描述不能为空"),
  conviction: z.number().min(1).max(10, "置信度必须是1-10的数字")
})

// 监控目标Schema
export const MonitorTargetSchema = z.object({
  type: z.enum(['price', 'fundamental', 'technical', 'event', 'other']),
  condition: z.string().min(1, "触发条件不能为空"),
  action: z.string().min(1, "建议行动不能为空")
})

// Thesis输出Schema（用于校验LLM输出）
export const ThesisSchema = z.object({
  summary: z.string().min(10, "摘要至少10个字符"),
  pricePhases: z.array(PricePhaseSchema).min(1, "至少需要一个价格阶段分析"),
  coreThesis: z.array(CoreThesisSchema).min(1, "至少需要一个核心论题").max(3, "最多三个核心论题"),
  fragilePoints: z.array(z.string()).min(1, "至少需要一个脆弱点"),
  monitorTargets: z.array(MonitorTargetSchema).min(1, "至少需要一个监控目标")
})

// Thesis数据库Schema（扩展字段）
export const ThesisDbSchema = z.object({
  id: z.string().optional(),
  positionId: z.string(),
  portfolioId: z.string(),
  summary: z.string(),
  pricePhases: z.array(PricePhaseSchema),
  coreThesis: z.array(CoreThesisSchema),
  fragilePoints: z.array(z.string()),
  monitorTargets: z.array(MonitorTargetSchema),
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
export type Thesis = z.infer<typeof ThesisSchema>
export type ThesisDb = z.infer<typeof ThesisDbSchema>
export type GenerateThesisInput = z.infer<typeof GenerateThesisInputSchema>