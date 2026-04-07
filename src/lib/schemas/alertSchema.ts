import { z } from 'zod'

// Alert Level Schema
export const alertLevelSchema = z.enum(['info', 'watch', 'important', 'urgent'])
export type AlertLevel = z.infer<typeof alertLevelSchema>

// Alert Status Schema
export const alertStatusSchema = z.enum(['unread', 'read', 'dismissed'])
export type AlertStatus = z.infer<typeof alertStatusSchema>

// Database Alert Schema
export const dbAlertSchema = z.object({
  id: z.string(),
  positionId: z.string(),
  eventId: z.string().nullable(),
  eventAnalysisId: z.string().nullable(),
  level: alertLevelSchema,
  title: z.string(),
  summary: z.string(),
  status: alertStatusSchema,
  sentAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type DbAlert = z.infer<typeof dbAlertSchema>

// Alert API Response Schema (with related data)
export const alertApiResponseSchema = z.object({
  id: z.string(),
  positionId: z.string(),
  eventId: z.string().nullable(),
  eventAnalysisId: z.string().nullable(),
  level: alertLevelSchema,
  title: z.string(),
  summary: z.string(),
  status: alertStatusSchema,
  sentAt: z.string(), // ISO string
  createdAt: z.string(), // ISO string
  updatedAt: z.string(), // ISO string
  position: z.object({
    id: z.string(),
    symbol: z.string(),
    assetName: z.string(),
  }).optional(),
  event: z.object({
    id: z.string(),
    symbol: z.string(),
    eventType: z.string(),
    title: z.string(),
  }).optional().nullable(),
  eventAnalysis: z.object({
    id: z.string(),
    eventId: z.string(),
    positionId: z.string(),
    thesisId: z.string(),
    relevanceScore: z.number(),
    thesisImpact: z.string(),
    impactLevel: z.string(),
  }).optional().nullable(),
})

export type AlertApiResponse = z.infer<typeof alertApiResponseSchema>

// Create Alert Request Schema
export const createAlertRequestSchema = z.object({
  positionId: z.string().min(1, '持仓ID不能为空'),
  eventId: z.string().optional(),
  eventAnalysisId: z.string().optional(),
  level: alertLevelSchema,
  title: z.string().min(1, 'Alert标题不能为空'),
  summary: z.string().min(1, 'Alert摘要不能为空'),
}).strict()

export type CreateAlertRequest = z.infer<typeof createAlertRequestSchema>

// Update Alert Request Schema
export const updateAlertRequestSchema = z.object({
  level: alertLevelSchema.optional(),
  title: z.string().min(1, 'Alert标题不能为空').optional(),
  summary: z.string().min(1, 'Alert摘要不能为空').optional(),
  status: alertStatusSchema.optional(),
}).strict()

export type UpdateAlertRequest = z.infer<typeof updateAlertRequestSchema>

// Update Alert Status Request Schema
export const updateAlertStatusRequestSchema = z.object({
  status: alertStatusSchema,
}).strict()

export type UpdateAlertStatusRequest = z.infer<typeof updateAlertStatusRequestSchema>

// Filter Alerts Query Schema
export const filterAlertsQuerySchema = z.object({
  positionId: z.string().optional(),
  level: z.enum(['info', 'watch', 'important', 'urgent', 'all']).optional(),
  status: z.enum(['unread', 'read', 'dismissed', 'all']).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100).default(20)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0).default(0)).optional(),
})

export type FilterAlertsQuery = z.infer<typeof filterAlertsQuerySchema>

// API Response Schemas
export const createAlertResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    alert: alertApiResponseSchema,
  }),
  error: z.string().optional(),
})

export type CreateAlertResponse = z.infer<typeof createAlertResponseSchema>

export const getAlertsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    alerts: z.array(alertApiResponseSchema),
    total: z.number(),
  }),
  error: z.string().optional(),
})

export type GetAlertsResponse = z.infer<typeof getAlertsResponseSchema>

export const getAlertResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    alert: alertApiResponseSchema.nullable(),
  }),
  error: z.string().optional(),
})

export type GetAlertResponse = z.infer<typeof getAlertResponseSchema>

export const updateAlertResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    alert: alertApiResponseSchema,
  }),
  error: z.string().optional(),
})

export type UpdateAlertResponse = z.infer<typeof updateAlertResponseSchema>

export const deleteAlertResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    deleted: z.boolean(),
  }),
  error: z.string().optional(),
})

export type DeleteAlertResponse = z.infer<typeof deleteAlertResponseSchema>
