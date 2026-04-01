import { z } from 'zod'

// LLM提供商
export const LLMProvider = {
  KIMI: 'kimi',
  OPENAI: 'openai',
  CLAUDE: 'claude',
  DEEPSEEK: 'deepseek',
  LOCAL: 'local'
} as const

// 模型类型
export const ModelType = {
  THESIS_GENERATION: 'thesis_generation',
  EVENT_ANALYSIS: 'event_analysis',
  ALERT_IMPACT: 'alert_impact',
  DAILY_SUMMARY: 'daily_summary',
  RISK_ASSESSMENT: 'risk_assessment',
  CUSTOM: 'custom'
} as const

// LLM配置
export const LLMConfigSchema = z.object({
  provider: z.nativeEnum(LLMProvider),
  model: z.string(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().min(100).max(128000).default(2000),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  timeout: z.number().min(1000).max(60000).default(30000)
})

export type LLMConfig = z.infer<typeof LLMConfigSchema>

// Prompt模板
export const PromptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  modelType: z.nativeEnum(ModelType),
  provider: z.nativeEnum(LLMProvider),
  template: z.string(),
  variables: z.array(z.string()),
  examples: z.array(z.object({
    input: z.record(z.any()),
    output: z.record(z.any())
  })).optional(),
  version: z.string().default('1.0'),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>

// 创建Prompt模板
export const CreatePromptTemplateSchema = PromptTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreatePromptTemplateInput = z.infer<typeof CreatePromptTemplateSchema>

// 更新Prompt模板
export const UpdatePromptTemplateSchema = CreatePromptTemplateSchema.partial()
export type UpdatePromptTemplateInput = z.infer<typeof UpdatePromptTemplateSchema>

// Prompt变量
export const PromptVariableSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  description: z.string(),
  required: z.boolean().default(true),
  defaultValue: z.any().optional()
})

export type PromptVariable = z.infer<typeof PromptVariableSchema>

// LLM请求
export const LLMRequestSchema = z.object({
  provider: z.nativeEnum(LLMProvider),
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(100).max(128000).optional(),
  responseFormat: z.enum(['text', 'json']).default('text'),
  stream: z.boolean().default(false)
})

export type LLMRequest = z.infer<typeof LLMRequestSchema>

// LLM响应
export const LLMResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    content: z.string(),
    usage: z.object({
      promptTokens: z.number(),
      completionTokens: z.number(),
      totalTokens: z.number()
    }).optional(),
    model: z.string(),
    provider: z.nativeEnum(LLMProvider)
  }).optional(),
  error: z.string().optional(),
  cost: z.number().optional()
})

export type LLMResponse = z.infer<typeof LLMResponseSchema>

// 批量分析请求
export const BatchAnalysisRequestSchema = z.object({
  modelType: z.nativeEnum(ModelType),
  items: z.array(z.record(z.any())),
  batchSize: z.number().min(1).max(100).default(10),
  parallel: z.boolean().default(false),
  config: LLMConfigSchema.partial().optional()
})

export type BatchAnalysisRequest = z.infer<typeof BatchAnalysisRequestSchema>

// 批量分析结果
export const BatchAnalysisResultSchema = z.object({
  total: z.number(),
  success: z.number(),
  failed: z.number(),
  results: z.array(z.object({
    item: z.record(z.any()),
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional()
  })),
  cost: z.number(),
  duration: z.number()
})

export type BatchAnalysisResult = z.infer<typeof BatchAnalysisResultSchema>

// Prompt调优请求
export const PromptOptimizationRequestSchema = z.object({
  template: z.string(),
  variables: z.record(z.any()),
  testCases: z.array(z.object({
    input: z.record(z.any()),
    expected: z.record(z.any())
  })),
  iterations: z.number().min(1).max(10).default(3),
  metric: z.enum(['accuracy', 'relevance', 'completeness']).default('accuracy')
})

export type PromptOptimizationRequest = z.infer<typeof PromptOptimizationRequestSchema>

// LLM性能指标
export const LLMPerformanceMetricsSchema = z.object({
  provider: z.nativeEnum(LLMProvider),
  model: z.string(),
  totalRequests: z.number(),
  successRate: z.number(),
  avgLatency: z.number(),
  avgTokens: z.number(),
  totalCost: z.number(),
  errors: z.record(z.number())
})

export type LLMPerformanceMetrics = z.infer<typeof LLMPerformanceMetricsSchema>

// 导出类型
export type LLMProvider = typeof LLMProvider[keyof typeof LLMProvider]
export type ModelType = typeof ModelType[keyof typeof ModelType]