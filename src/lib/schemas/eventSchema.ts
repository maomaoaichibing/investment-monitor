import { z } from 'zod';

// Event类型枚举
export const EventType = {
  EARNINGS: 'earnings',
  GUIDANCE_CHANGE: 'guidance_change',
  POLICY: 'policy',
  INDUSTRY_DATA: 'industry_data',
  PRICE_BREAK: 'price_break',
  MANAGEMENT_COMMENT: 'management_comment',
  REGULATION: 'regulation',
  NEWS: 'news'
} as const;

export const EventSource = {
  MANUAL: 'manual',
  AUTO: 'auto',
  API: 'api'
} as const;

// 事件元数据结构
export const EventMetadataSchema = z.object({
  // 价格相关元数据
  priceBefore: z.number().optional(),
  priceAfter: z.number().optional(),
  priceChangePercent: z.number().optional(),
  
  // 财务数据相关
  actualValue: z.string().optional(),
  expectedValue: z.string().optional(),
  beatMiss: z.enum(['beat', 'miss', 'in-line']).optional(),
  
  // 新闻相关
  newsSource: z.string().optional(),
  newsUrl: z.string().url().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  
  // 政策相关
  policyImpact: z.enum(['positive', 'negative', 'neutral']).optional(),
  policyLevel: z.enum(['central', 'local', 'industry']).optional(),
  
  // 通用标签
  tags: z.array(z.string()).optional().default([])
}).optional().default({});

// 创建事件Schema
export const CreateEventSchema = z.object({
  symbol: z.string().min(1, '股票代码不能为空'),
  eventType: z.enum([
    EventType.EARNINGS,
    EventType.GUIDANCE_CHANGE,
    EventType.POLICY,
    EventType.INDUSTRY_DATA,
    EventType.PRICE_BREAK,
    EventType.MANAGEMENT_COMMENT,
    EventType.REGULATION,
    EventType.NEWS
  ]),
  title: z.string().min(1, '事件标题不能为空').max(200, '标题不能超过200字'),
  content: z.string().min(1, '事件内容不能为空'),
  eventTime: z.string().datetime().optional(),
  source: z.enum([EventSource.MANUAL, EventSource.AUTO, EventSource.API]).default(EventSource.MANUAL),
  metadataJson: EventMetadataSchema
});

// 更新事件Schema
export const UpdateEventSchema = z.object({
  symbol: z.string().optional(),
  eventType: z.enum([
    EventType.EARNINGS,
    EventType.GUIDANCE_CHANGE,
    EventType.POLICY,
    EventType.INDUSTRY_DATA,
    EventType.PRICE_BREAK,
    EventType.MANAGEMENT_COMMENT,
    EventType.REGULATION,
    EventType.NEWS
  ]).optional(),
  title: z.string().min(1, '事件标题不能为空').max(200, '标题不能超过200字').optional(),
  content: z.string().min(1, '事件内容不能为空').optional(),
  eventTime: z.string().datetime().optional(),
  source: z.enum([EventSource.MANUAL, EventSource.AUTO, EventSource.API]).optional(),
  metadataJson: EventMetadataSchema
});

// 查询事件Schema
export const QueryEventSchema = z.object({
  symbol: z.string().optional(),
  eventType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  source: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10)
});

// Event响应Schema
export const EventResponseSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  eventType: z.string(),
  title: z.string(),
  content: z.string(),
  eventTime: z.string(),
  source: z.string(),
  metadataJson: z.any(),
  createdAt: z.string(),
  updatedAt: z.string(),
  eventAnalysisCount: z.number().default(0),
  alertCount: z.number().default(0)
});

// 列表响应Schema
export const EventListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(EventResponseSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

// 单条响应Schema
export const EventDetailResponseSchema = z.object({
  success: z.boolean(),
  data: EventResponseSchema
});

// 创建响应Schema
export const EventCreateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    event: EventResponseSchema
  })
});

// 导出类型
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type QueryEventInput = z.infer<typeof QueryEventSchema>;
export type EventResponse = z.infer<typeof EventResponseSchema>;
export type EventListResponse = z.infer<typeof EventListResponseSchema>;
export type EventDetailResponse = z.infer<typeof EventDetailResponseSchema>;
export type EventCreateResponse = z.infer<typeof EventCreateResponseSchema>;
export type EventMetadata = z.infer<typeof EventMetadataSchema>;

// Event类型（从const推断）
export type EventTypeKey = typeof EventType[keyof typeof EventType];
export type EventSourceKey = typeof EventSource[keyof typeof EventSource];