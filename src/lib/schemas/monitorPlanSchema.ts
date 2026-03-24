import { z } from 'zod'

// Monitor Plan Watch Item Schema
export const monitorPlanWatchItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, '监控项标题不能为空'),
  metric: z.string().min(1, '监控指标不能为空'),
  currentValue: z.string().optional(),
  threshold: z.string().min(1, '阈值条件不能为空'),
  source: z.string().min(1, '数据来源不能为空'),
  frequency: z.enum(['realtime', 'daily', 'weekly', 'monthly', 'quarterly']).default('daily'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  notes: z.string().optional(),
})

// Monitor Plan Trigger Condition Schema
export const monitorPlanTriggerConditionSchema = z.object({
  id: z.string().optional(),
  condition: z.string().min(1, '触发条件不能为空'),
  description: z.string().min(1, '条件描述不能为空'),
  action: z.string().min(1, '触发动作不能为空'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  requiresConfirmation: z.boolean().default(true),
  confirmationMethod: z.enum(['manual', 'auto', 'ai']).default('manual'),
})

// Monitor Plan Disconfirm Signal Schema
export const monitorPlanDisconfirmSignalSchema = z.object({
  id: z.string().optional(),
  signal: z.string().min(1, '否定信号不能为空'),
  description: z.string().min(1, '信号描述不能为空'),
  severity: z.enum(['critical', 'major', 'minor']).default('major'),
  response: z.string().min(1, '应对措施不能为空'),
})

// Monitor Plan Action Hint Schema
export const monitorPlanActionHintSchema = z.object({
  id: z.string().optional(),
  scenario: z.string().min(1, '场景描述不能为空'),
  suggestedAction: z.string().min(1, '建议行动不能为空'),
  rationale: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
})

// Main Monitor Plan Schema
export const monitorPlanSchema = z.object({
  watchItems: z.array(monitorPlanWatchItemSchema).min(1, '至少需要一个监控项'),
  triggerConditions: z.array(monitorPlanTriggerConditionSchema).min(1, '至少需要一个触发条件'),
  reviewFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).default('weekly'),
  disconfirmSignals: z.array(monitorPlanDisconfirmSignalSchema).min(1, '至少需要一个否定信号'),
  actionHints: z.array(monitorPlanActionHintSchema).min(1, '至少需要一个行动提示'),
  notes: z.string().optional(),
})

export type MonitorPlanWatchItem = z.infer<typeof monitorPlanWatchItemSchema>
export type MonitorPlanTriggerCondition = z.infer<typeof monitorPlanTriggerConditionSchema>
export type MonitorPlanDisconfirmSignal = z.infer<typeof monitorPlanDisconfirmSignalSchema>
export type MonitorPlanActionHint = z.infer<typeof monitorPlanActionHintSchema>
export type MonitorPlan = z.infer<typeof monitorPlanSchema>

// Database Monitor Plan Schema
export const dbMonitorPlanSchema = z.object({
  id: z.string(),
  positionId: z.string(),
  thesisId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']),
  reviewFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  monitorItemsJson: z.string(),
  triggerConditionsJson: z.string(),
  disconfirmSignals: z.string().optional(),
  actionHints: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed']),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type DbMonitorPlan = z.infer<typeof dbMonitorPlanSchema>

// API Request/Response Schemas
export const generateMonitorPlanRequestSchema = z.object({
  thesisId: z.string().min(1, 'thesisId不能为空'),
})

// PATCH 更新请求 Schema
export const updateMonitorPlanRequestSchema = z.object({
  watchItems: z.array(monitorPlanWatchItemSchema).min(1).optional(),
  triggerConditions: z.array(monitorPlanTriggerConditionSchema).min(1).optional(),
  reviewFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  disconfirmSignals: z.array(monitorPlanDisconfirmSignalSchema).optional(),
  actionHints: z.array(monitorPlanActionHintSchema).optional(),
  notes: z.string().nullable().optional(),
}).strict()

export type UpdateMonitorPlanRequest = z.infer<typeof updateMonitorPlanRequestSchema>

// PATCH 状态更新请求 Schema
export const updateMonitorPlanStatusRequestSchema = z.object({
  status: z.enum(['active', 'paused', 'completed']),
})

export type UpdateMonitorPlanStatusRequest = z.infer<typeof updateMonitorPlanStatusRequestSchema>

// Monitor Plan API Response Schema (统一对外结构)
export const monitorPlanApiResponseSchema = z.object({
  id: z.string(),
  positionId: z.string(),
  thesisId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['active', 'paused', 'completed']),
  createdAt: z.string(),
  updatedAt: z.string(),
  watchItems: z.array(monitorPlanWatchItemSchema),
  triggerConditions: z.array(monitorPlanTriggerConditionSchema),
  reviewFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  disconfirmSignals: z.array(monitorPlanDisconfirmSignalSchema),
  actionHints: z.array(monitorPlanActionHintSchema),
  notes: z.string().nullable(),
})

export type MonitorPlanApiResponse = z.infer<typeof monitorPlanApiResponseSchema>

export const generateMonitorPlanResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    monitorPlan: monitorPlanApiResponseSchema,
    created: z.boolean(),
    source: z.enum(['new', 'existing']),
  }),
  error: z.string().optional(),
})

export const getMonitorPlanResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    monitorPlan: monitorPlanApiResponseSchema.nullable()
  }),
  error: z.string().optional(),
})