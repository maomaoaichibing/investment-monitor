import { z } from 'zod';

// 风险类型
export const RiskType = {
  MARKET: 'market',              // 市场风险
  INDUSTRY: 'industry',          // 行业风险
  COMPANY: 'company',            // 公司风险
  FINANCIAL: 'financial',        // 财务风险
  REGULATORY: 'regulatory',      // 监管风险
  LIQUIDITY: 'liquidity',        // 流动性风险
  CONCENTRATION: 'concentration', // 集中度风险
  CORRELATION: 'correlation',    // 相关性风险
  CURRENCY: 'currency',          // 汇率风险
  VOLATILITY: 'volatility'       // 波动率风险
} as const;

export const RiskLevel = {
  LOW: 'low',                    // 低风险
  MEDIUM: 'medium',              // 中等风险
  HIGH: 'high',                  // 高风险
  CRITICAL: 'critical'           // 严重风险
} as const;

export const RiskStatus = {
  ACTIVE: 'active',              // 活跃风险
  MONITORING: 'monitoring',      // 监控中
  MITIGATED: 'mitigated',        // 已缓解
  RESOLVED: 'resolved'           // 已解决
} as const;

// 风险指标
export const RiskMetricSchema = z.object({
  name: z.string(),               // 指标名称
  value: z.number(),              // 指标值
  unit: z.string().optional(),    // 单位
  threshold: z.number().optional(), // 阈值
  description: z.string().optional() // 描述
});

export type RiskMetric = z.infer<typeof RiskMetricSchema>;

// 风险因子
export const RiskFactorSchema = z.object({
  name: z.string(),               // 因子名称
  weight: z.number().min(0).max(1), // 权重（0-1）
  score: z.number().min(0).max(10), // 风险评分（0-10）
  description: z.string().optional() // 描述
});

export type RiskFactor = z.infer<typeof RiskFactorSchema>;

// 风险缓解措施
export const RiskMitigationSchema = z.object({
  action: z.string(),             // 缓解措施
  status: z.enum(['planned', 'in_progress', 'completed']), // 状态
  effectiveness: z.number().min(0).max(1).optional(), // 有效性（0-1）
  cost: z.number().optional(),    // 成本
  timeline: z.string().optional() // 时间线
});

export type RiskMitigation = z.infer<typeof RiskMitigationSchema>;

// 创建风险输入
export const CreateRiskInputSchema = z.object({
  portfolioId: z.string(),        // 投资组合ID
  positionId: z.string().optional(), // 持仓ID（可选）
  thesisId: z.string().optional(), // 论题ID（可选）
  riskType: z.nativeEnum(RiskType), // 风险类型
  riskLevel: z.nativeEnum(RiskLevel), // 风险等级
  title: z.string().min(1).max(200), // 风险标题
  description: z.string().min(1), // 风险描述
  impact: z.enum(['positive', 'negative']), // 影响方向
  probability: z.number().min(0).max(1), // 发生概率（0-1）
  factors: z.array(RiskFactorSchema).optional(), // 风险因子
  metrics: z.array(RiskMetricSchema).optional(), // 风险指标
  mitigations: z.array(RiskMitigationSchema).optional(), // 缓解措施
  correlationData: z.record(z.any()).optional(), // 相关性数据
  alertTriggered: z.boolean().default(false), // 是否触发提醒
  metadata: z.record(z.any()).optional() // 元数据
});

export type CreateRiskInput = z.infer<typeof CreateRiskInputSchema>;

// 更新风险输入
export const UpdateRiskInputSchema = CreateRiskInputSchema.partial().extend({
  status: z.nativeEnum(RiskStatus).optional() // 风险状态
});

export type UpdateRiskInput = z.infer<typeof UpdateRiskInputSchema>;

// 查询风险输入
export const QueryRiskInputSchema = z.object({
  portfolioId: z.string().optional(), // 投资组合ID
  positionId: z.string().optional(), // 持仓ID
  thesisId: z.string().optional(), // 论题ID
  riskType: z.nativeEnum(RiskType).optional(), // 风险类型
  riskLevel: z.nativeEnum(RiskLevel).optional(), // 风险等级
  status: z.nativeEnum(RiskStatus).optional(), // 状态
  page: z.coerce.number().min(1).default(1), // 页码
  limit: z.coerce.number().min(1).max(100).default(10) // 每页数量
});

export type QueryRiskInput = z.infer<typeof QueryRiskInputSchema>;

// 风险响应
export const RiskResponseSchema = z.object({
  id: z.string(),
  portfolioId: z.string(),
  positionId: z.string().nullable(),
  thesisId: z.string().nullable(),
  riskType: z.nativeEnum(RiskType),
  riskLevel: z.nativeEnum(RiskLevel),
  status: z.nativeEnum(RiskStatus),
  title: z.string(),
  description: z.string(),
  impact: z.enum(['positive', 'negative']),
  probability: z.number(),
  riskScore: z.number(), // 综合风险评分 = probability * impact_score
  factors: z.array(RiskFactorSchema),
  metrics: z.array(RiskMetricSchema),
  mitigations: z.array(RiskMitigationSchema),
  correlationData: z.record(z.any()),
  alertTriggered: z.boolean(),
  metadata: z.record(z.any()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type RiskResponse = z.infer<typeof RiskResponseSchema>;

// 风险列表响应
export const RiskListResponseSchema = z.object({
  risks: z.array(RiskResponseSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean()
  })
});

export type RiskListResponse = z.infer<typeof RiskListResponseSchema>;

// 风险统计
export const RiskStatsSchema = z.object({
  totalRisks: z.number(),          // 总风险数量
  activeRisks: z.number(),         // 活跃风险数量
  criticalRisks: z.number(),       // 严重风险数量
  riskByType: z.record(z.number()), // 按类型统计
  riskByLevel: z.record(z.number()), // 按等级统计
  avgRiskScore: z.number(),        // 平均风险评分
  topRiskFactors: z.array(z.object({
    name: z.string(),
    count: z.number()
  })) // 主要风险因子
});

export type RiskStats = z.infer<typeof RiskStatsSchema>;

// 风险暴露分析
export const RiskExposureSchema = z.object({
  portfolioId: z.string(),
  totalValue: z.number(), // 组合总价值
  atRiskValue: z.number(), // 风险暴露价值
  riskExposureRatio: z.number(), // 风险暴露比例 = atRiskValue / totalValue
  positionExposures: z.array(z.object({
    positionId: z.string(),
    symbol: z.string(),
    value: z.number(),
    riskValue: z.number(),
    riskRatio: z.number()
  })) // 个券风险暴露
});

export type RiskExposure = z.infer<typeof RiskExposureSchema>;

// 相关性分析
export const CorrelationAnalysisSchema = z.object({
  portfolioId: z.string(),
  correlationMatrix: z.record(z.record(z.number())), // 相关性矩阵
  highCorrelationPairs: z.array(z.object({
    symbol1: z.string(),
    symbol2: z.string(),
    correlation: z.number()
  })), // 高相关性配对
  concentrationRisk: z.object({
    topPositions: z.array(z.object({
      symbol: z.string(),
      weight: z.number(),
      value: z.number()
    })), // 集中度分析
    concentrationRatio: z.number()
  })
});

export type CorrelationAnalysis = z.infer<typeof CorrelationAnalysisSchema>;

// 情景分析
export const ScenarioAnalysisSchema = z.object({
  scenario: z.enum(['optimistic', 'base', 'pessimistic']), // 情景类型
  impact: z.object({
    portfolioValue: z.number(), // 组合价值影响
    returnChange: z.number(),    // 收益变化
    riskChange: z.number()       // 风险变化
  }),
  assumptions: z.array(z.string()), // 假设条件
  probability: z.number() // 概率
});

export type ScenarioAnalysis = z.infer<typeof ScenarioAnalysisSchema>;

// 导出类型
export type RiskType = typeof RiskType[keyof typeof RiskType];
export type RiskLevel = typeof RiskLevel[keyof typeof RiskLevel];
export type RiskStatus = typeof RiskStatus[keyof typeof RiskStatus];