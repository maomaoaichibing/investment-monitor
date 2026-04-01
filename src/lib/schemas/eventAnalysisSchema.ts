import { z } from 'zod';

// Thesis Impact枚举
export const ThesisImpact = {
  STRENGTHEN: 'strengthen',
  MAINTAIN: 'maintain',
  WEAKEN: 'weaken',
  REVERSE: 'reverse'
} as const;

// Impact Level枚举
export const ImpactLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

// 创建事件分析Schema
export const CreateEventAnalysisSchema = z.object({
  eventId: z.string().min(1, '事件ID不能为空'),
  positionId: z.string().min(1, '持仓ID不能为空'),
  thesisId: z.string().min(1, '论题ID不能为空'),
  relevanceScore: z.number().min(0).max(1),
  thesisImpact: z.enum([
    ThesisImpact.STRENGTHEN,
    ThesisImpact.MAINTAIN,
    ThesisImpact.WEAKEN,
    ThesisImpact.REVERSE
  ]),
  impactLevel: z.enum([
    ImpactLevel.HIGH,
    ImpactLevel.MEDIUM,
    ImpactLevel.LOW
  ]),
  reasoning: z.string().min(1, '推理分析不能为空'),
  evidenceJson: z.any().optional().default([]),
  actionFramework: z.string().min(1, '行动框架不能为空')
});

// 更新事件分析Schema
export const UpdateEventAnalysisSchema = z.object({
  relevanceScore: z.number().min(0).max(1).optional(),
  thesisImpact: z.enum([
    ThesisImpact.STRENGTHEN,
    ThesisImpact.MAINTAIN,
    ThesisImpact.WEAKEN,
    ThesisImpact.REVERSE
  ]).optional(),
  impactLevel: z.enum([
    ImpactLevel.HIGH,
    ImpactLevel.MEDIUM,
    ImpactLevel.LOW
  ]).optional(),
  reasoning: z.string().min(1, '推理分析不能为空').optional(),
  evidenceJson: z.any().optional(),
  actionFramework: z.string().min(1, '行动框架不能为空').optional()
});

// 查询事件分析Schema
export const QueryEventAnalysisSchema = z.object({
  eventId: z.string().optional(),
  positionId: z.string().optional(),
  thesisId: z.string().optional(),
  thesisImpact: z.string().optional(),
  impactLevel: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10)
});

// 事件分析响应Schema
export const EventAnalysisResponseSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  positionId: z.string(),
  thesisId: z.string(),
  relevanceScore: z.number(),
  thesisImpact: z.string(),
  impactLevel: z.string(),
  reasoning: z.string(),
  evidenceJson: z.any(),
  actionFramework: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  alertCount: z.number().default(0)
});

// 列表响应Schema
export const EventAnalysisListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(EventAnalysisResponseSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

// 单条响应Schema
export const EventAnalysisDetailResponseSchema = z.object({
  success: z.boolean(),
  data: EventAnalysisResponseSchema
});

// 创建响应Schema
export const EventAnalysisCreateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    eventAnalysis: EventAnalysisResponseSchema
  })
});

// AI分析结果Schema
export const AIEventAnalysisResultSchema = z.object({
  relevanceScore: z.number().min(0).max(1),
  thesisImpact: z.enum([
    ThesisImpact.STRENGTHEN,
    ThesisImpact.MAINTAIN,
    ThesisImpact.WEAKEN,
    ThesisImpact.REVERSE
  ]),
  impactLevel: z.enum([
    ImpactLevel.HIGH,
    ImpactLevel.MEDIUM,
    ImpactLevel.LOW
  ]),
  reasoning: z.string(),
  evidence: z.array(z.string()),
  actionFramework: z.string()
});

// 导出类型
export type CreateEventAnalysisInput = z.infer<typeof CreateEventAnalysisSchema>;
export type UpdateEventAnalysisInput = z.infer<typeof UpdateEventAnalysisSchema>;
export type QueryEventAnalysisInput = z.infer<typeof QueryEventAnalysisSchema>;
export type EventAnalysisResponse = z.infer<typeof EventAnalysisResponseSchema>;
export type EventAnalysisListResponse = z.infer<typeof EventAnalysisListResponseSchema>;
export type EventAnalysisDetailResponse = z.infer<typeof EventAnalysisDetailResponseSchema>;
export type EventAnalysisCreateResponse = z.infer<typeof EventAnalysisCreateResponseSchema>;
export type AIEventAnalysisResult = z.infer<typeof AIEventAnalysisResultSchema>;

// Impact类型
export type ThesisImpactKey = typeof ThesisImpact[keyof typeof ThesisImpact];
export type ImpactLevelKey = typeof ImpactLevel[keyof typeof ImpactLevel];

// 影响方向标签映射
export const thesisImpactLabels: Record<string, string> = {
  strengthen: '强化',
  maintain: '维持',
  weaken: '弱化',
  reverse: '反转'
};

// 影响方向颜色映射
export const thesisImpactColors: Record<string, string> = {
  strengthen: 'bg-green-100 text-green-800',
  maintain: 'bg-blue-100 text-blue-800',
  weaken: 'bg-yellow-100 text-yellow-800',
  reverse: 'bg-red-100 text-red-800'
};

// 影响等级颜色映射
export const impactLevelColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
};