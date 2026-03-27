import { db } from '@/lib/db'
import { llmService } from '@/server/llm/llmService'
import { generateMonitorPlanPrompt, monitorPlanSchema as promptMonitorPlanSchema } from '@/server/llm/prompts/monitorPlanPrompt'
import { 
  MonitorPlan, 
  monitorPlanSchema as zodMonitorPlanSchema,
  MonitorPlanApiResponse,
  monitorPlanApiResponseSchema,
  UpdateMonitorPlanRequest,
  updateMonitorPlanStatusRequestSchema
} from '@/lib/schemas/monitorPlanSchema'
import { Prisma } from '@prisma/client'

export interface GenerateMonitorPlanResult {
  monitorPlan: MonitorPlanApiResponse
  created: boolean
  source: 'new' | 'existing'
}

export class MonitorPlanService {
  /**
   * 为投资论题生成监控计划
   * 幂等性：同一thesis只生成一个monitor plan
   */
  async generateMonitorPlanForThesis(thesisId: string): Promise<GenerateMonitorPlanResult> {
    // 1. 检查是否已存在监控计划
    const existingMonitorPlan = await db.monitorPlan.findFirst({
      where: {
        thesisId,
      },
    })

    if (existingMonitorPlan) {
    // 解析数据库存储的JSON，转换为统一对外结构
    let watchItems = []
    let triggerConditions = []
    let reviewFrequency = 'weekly'
    let notes: string | undefined = undefined
    
    try {
      const monitorData = JSON.parse(existingMonitorPlan.monitorItemsJson)
      watchItems = monitorData.watchItems || []
      reviewFrequency = monitorData.reviewFrequency || 'weekly'
      notes = monitorData.notes
      
      // 从单独的triggerConditionsJson字段读取触发条件
      if (existingMonitorPlan.triggerConditionsJson) {
        triggerConditions = JSON.parse(existingMonitorPlan.triggerConditionsJson)
      }
    } catch (error) {
      console.error('Failed to parse existing monitor plan JSON:', error)
    }

    const apiResponse: MonitorPlanApiResponse = {
      id: existingMonitorPlan.id,
      positionId: existingMonitorPlan.positionId,
      thesisId: existingMonitorPlan.thesisId,
      title: existingMonitorPlan.title,
      description: existingMonitorPlan.description || undefined,
      priority: existingMonitorPlan.priority as 'high' | 'medium' | 'low',
      status: existingMonitorPlan.status as 'active' | 'paused' | 'completed',
      createdAt: existingMonitorPlan.createdAt.toISOString(),
      updatedAt: existingMonitorPlan.updatedAt.toISOString(),
      watchItems: watchItems,
      triggerConditions: triggerConditions,
      reviewFrequency: reviewFrequency as 'daily' | 'weekly' | 'biweekly' | 'monthly',
      disconfirmSignals: existingMonitorPlan.disconfirmSignals ? JSON.parse(existingMonitorPlan.disconfirmSignals) : [],
      actionHints: existingMonitorPlan.actionHints ? JSON.parse(existingMonitorPlan.actionHints) : [],
      notes: notes ?? null,
    }

      return {
        monitorPlan: apiResponse,
        created: false,
        source: 'existing',
      }
    }

    // 2. 获取thesis详情
    const thesis = await db.thesis.findUnique({
      where: { id: thesisId },
      include: {
        position: {
          select: {
            id: true,
            symbol: true,
            assetName: true,
            market: true,
          },
        },
      },
    })

    if (!thesis) {
      throw new Error(`Thesis with id ${thesisId} not found`)
    }

    // 3. 解析thesis的JSON字段
    let pricePhases = []
    let coreThesis = []
    let fragilePoints = []
    let monitorTargets = []

    try {
      pricePhases = JSON.parse(thesis.pricePhasesJson)
      coreThesis = JSON.parse(thesis.coreThesisJson)
      fragilePoints = JSON.parse(thesis.fragilePointsJson)
      monitorTargets = JSON.parse(thesis.monitorTargetsJson)
    } catch (error) {
      console.error('Failed to parse thesis JSON fields:', error)
      throw new Error('Invalid thesis data format')
    }

    // 4. 构建prompt数据
    const promptData = {
      summary: thesis.summary,
      pricePhases,
      coreThesis,
      fragilePoints,
      monitorTargets,
      symbol: thesis.position.symbol,
      assetName: thesis.position.assetName,
      market: thesis.position.market,
    }

    // 5. 调用LLM生成真实的监控计划
    console.log(`[MonitorPlan] Generating real monitor plan for ${thesis.position.assetName} (${thesis.position.symbol})...`)
    const monitorPlanData = await llmService.generateMonitorPlan(promptData)
    console.log(`[MonitorPlan] Generated monitor plan with ${monitorPlanData.watchItems?.length || 0} watch items`)

    // 6. 将监控计划保存到数据库
    const monitorPlanJson = JSON.stringify(monitorPlanData)

    const newMonitorPlan = await db.monitorPlan.create({
      data: {
        positionId: thesis.positionId,
        thesisId,
        title: `${thesis.position.assetName}监控计划`,
        description: `监控${thesis.position.symbol}的关键指标和风险信号`,
        priority: 'medium', // 默认优先级
        reviewFrequency: monitorPlanData.reviewFrequency,
        monitorItemsJson: JSON.stringify({
          watchItems: monitorPlanData.watchItems,
          reviewFrequency: monitorPlanData.reviewFrequency,
          notes: monitorPlanData.notes
        }),
        triggerConditionsJson: JSON.stringify(monitorPlanData.triggerConditions),
        disconfirmSignals: JSON.stringify(monitorPlanData.disconfirmSignals),
        actionHints: JSON.stringify(monitorPlanData.actionHints),
        notes: monitorPlanData.notes,
        status: 'active',
      },
    })

    // 7. 转换为统一对外结构
    const apiResponse: MonitorPlanApiResponse = {
      id: newMonitorPlan.id,
      positionId: newMonitorPlan.positionId,
      thesisId: newMonitorPlan.thesisId,
      title: newMonitorPlan.title,
      description: newMonitorPlan.description || undefined,
      priority: newMonitorPlan.priority as 'high' | 'medium' | 'low',
      status: newMonitorPlan.status as 'active' | 'paused' | 'completed',
      createdAt: newMonitorPlan.createdAt.toISOString(),
      updatedAt: newMonitorPlan.updatedAt.toISOString(),
      watchItems: monitorPlanData.watchItems || [],
      triggerConditions: monitorPlanData.triggerConditions || [],
      reviewFrequency: monitorPlanData.reviewFrequency || 'weekly',
      disconfirmSignals: monitorPlanData.disconfirmSignals || [],
      actionHints: monitorPlanData.actionHints || [],
      notes: monitorPlanData.notes ?? null,
    }

    return {
      monitorPlan: apiResponse,
      created: true,
      source: 'new',
    }
  }

  /**
   * 获取thesis的监控计划
   * 返回统一对外结构
   */
  async getMonitorPlanByThesis(thesisId: string): Promise<MonitorPlanApiResponse | null> {
    const monitorPlan = await db.monitorPlan.findFirst({
      where: {
        thesisId,
      },
    })

    if (!monitorPlan) {
      return null
    }

    // 解析数据库存储的JSON，转换为统一对外结构
    let watchItems = []
    let triggerConditions = []
    let reviewFrequency = 'weekly'
    let notes: string | undefined = undefined
    
    try {
      const monitorData = JSON.parse(monitorPlan.monitorItemsJson)
      watchItems = monitorData.watchItems || []
      reviewFrequency = monitorData.reviewFrequency || 'weekly'
      notes = monitorData.notes
      
      // 从单独的triggerConditionsJson字段读取触发条件
      if (monitorPlan.triggerConditionsJson) {
        triggerConditions = JSON.parse(monitorPlan.triggerConditionsJson)
      }
    } catch (error) {
      console.error('Failed to parse monitor plan JSON:', error)
    }

    const apiResponse: MonitorPlanApiResponse = {
      id: monitorPlan.id,
      positionId: monitorPlan.positionId,
      thesisId: monitorPlan.thesisId,
      title: monitorPlan.title,
      description: monitorPlan.description || undefined,
      priority: monitorPlan.priority as 'high' | 'medium' | 'low',
      status: monitorPlan.status as 'active' | 'paused' | 'completed',
      createdAt: monitorPlan.createdAt.toISOString(),
      updatedAt: monitorPlan.updatedAt.toISOString(),
      watchItems: watchItems,
      triggerConditions: triggerConditions,
      reviewFrequency: reviewFrequency as 'daily' | 'weekly' | 'biweekly' | 'monthly',
      disconfirmSignals: monitorPlan.disconfirmSignals ? JSON.parse(monitorPlan.disconfirmSignals) : [],
      actionHints: monitorPlan.actionHints ? JSON.parse(monitorPlan.actionHints) : [],
      notes: notes ?? null,
    }

    return apiResponse
  }

  /**
   * 批量获取监控计划
   */
  async getMonitorPlansByTheses(thesisIds: string[]) {
    const monitorPlans = await db.monitorPlan.findMany({
      where: {
        thesisId: {
          in: thesisIds,
        },
      },
      include: {
        position: {
          select: {
            id: true,
            symbol: true,
            assetName: true,
          },
        },
      },
    })

    return monitorPlans.map(plan => {
      let monitorPlanData = null
      try {
        monitorPlanData = JSON.parse(plan.monitorItemsJson)
      } catch (error) {
        console.error('Failed to parse monitor plan JSON:', error)
        monitorPlanData = {}
      }

      return {
        ...plan,
        monitorPlanData,
      }
    })
  }

  /**
   * 更新监控计划（部分更新）
   * 支持更新：watchItems, triggerConditions, reviewFrequency, disconfirmSignals, actionHints, notes
   */
  async updateMonitorPlan(
    id: string,
    data: UpdateMonitorPlanRequest
  ): Promise<MonitorPlanApiResponse> {
    // 1. 查询现有记录
    const existingPlan = await db.monitorPlan.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      throw new Error('监控计划不存在')
    }

    // 2. 处理 monitorItemsJson（包含 watchItems 和 reviewFrequency）
    let monitorData: { watchItems?: any[]; reviewFrequency?: string } = {}
    try {
      monitorData = JSON.parse(existingPlan.monitorItemsJson)
    } catch (error) {
      console.error('Failed to parse monitorItemsJson:', error)
    }

    // 3. 构建更新数据
    const updateData: Prisma.MonitorPlanUpdateInput = {}

    // 3.1 更新 watchItems（如果提供了）
    if (data.watchItems !== undefined) {
      if (data.watchItems.length === 0) {
        throw new Error('watchItems 至少需要包含一个监控项')
      }
      monitorData.watchItems = data.watchItems
      updateData.monitorItemsJson = JSON.stringify(monitorData)
    }

    // 3.2 更新 reviewFrequency（如果提供了）
    if (data.reviewFrequency !== undefined) {
      monitorData.reviewFrequency = data.reviewFrequency
      updateData.monitorItemsJson = JSON.stringify(monitorData)
    }

    // 3.3 更新 triggerConditions（如果提供了）
    if (data.triggerConditions !== undefined) {
      if (data.triggerConditions.length === 0) {
        throw new Error('triggerConditions 至少需要包含一个触发条件')
      }
      updateData.triggerConditionsJson = JSON.stringify(data.triggerConditions)
    }

    // 3.4 更新 disconfirmSignals（如果提供了）
    if (data.disconfirmSignals !== undefined) {
      updateData.disconfirmSignals = JSON.stringify(data.disconfirmSignals)
    }

    // 3.5 更新 actionHints（如果提供了）
    if (data.actionHints !== undefined) {
      updateData.actionHints = JSON.stringify(data.actionHints)
    }

    // 3.6 更新 notes（如果提供了，包括 null）
    if (data.notes !== undefined) {
      updateData.notes = data.notes
    }

    // 4. 执行更新
    const updatedPlan = await db.monitorPlan.update({
      where: { id },
      data: updateData,
    })

    // 5. 转换为 API 响应格式
    return this.parseMonitorPlan(updatedPlan)
  }

  /**
   * 更新监控计划状态
   * 支持幂等更新和状态流转验证
   */
  async updateMonitorPlanStatus(
    id: string,
    targetStatus: 'active' | 'paused' | 'completed'
  ): Promise<MonitorPlanApiResponse> {
    // 1. 查询现有记录
    const existingPlan = await db.monitorPlan.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      throw new Error('监控计划不存在')
    }

    const currentStatus = existingPlan.status as 'active' | 'paused' | 'completed'

    // 2. 验证状态流转
    if (!this.validateStatusTransition(currentStatus, targetStatus)) {
      throw new Error(`状态流转非法：${currentStatus} 不能变为 ${targetStatus}`)
    }

    // 3. 幂等性处理：如果状态相同，直接返回现有数据，不更新数据库
    if (currentStatus === targetStatus) {
      return this.parseMonitorPlan(existingPlan)
    }

    // 4. 执行状态更新
    const updatedPlan = await db.monitorPlan.update({
      where: { id },
      data: {
        status: targetStatus,
      },
    })

    // 5. 返回更新后的数据
    return this.parseMonitorPlan(updatedPlan)
  }

  /**
   * 验证状态流转是否合法
   * 规则：
   * - active -> paused, completed ✅
   * - paused -> active, completed ✅
   * - completed -> active, paused ❌
   * - same status -> ✅ (幂等)
   */
  private validateStatusTransition(
    current: 'active' | 'paused' | 'completed',
    target: 'active' | 'paused' | 'completed'
  ): boolean {
    // 相同状态总是允许（幂等）
    if (current === target) {
      return true
    }

    // 状态流转矩阵
    const allowedTransitions: Record<string, string[]> = {
      active: ['paused', 'completed'],
      paused: ['active', 'completed'],
      completed: [], // completed 不能变为任何状态
    }

    return allowedTransitions[current].includes(target)
  }

  /**
   * 删除监控计划
   */
  async deleteMonitorPlan(id: string) {
    return await db.monitorPlan.delete({
      where: { id },
    })
  }

  /**
   * 解析数据库记录为 API 响应格式
   */
  private parseMonitorPlan(plan: any): MonitorPlanApiResponse {
    // 解析 monitorItemsJson
    const monitorData = JSON.parse(plan.monitorItemsJson || '{}')
    
    // 从 triggerConditionsJson 解析
    const triggerConditions = plan.triggerConditionsJson 
      ? JSON.parse(plan.triggerConditionsJson)
      : []

    // 从顶层 notes 读取（唯一真相源）
    const notes = plan.notes ?? null

    return {
      id: plan.id,
      positionId: plan.positionId,
      thesisId: plan.thesisId,
      title: plan.title,
      description: plan.description || undefined,
      priority: plan.priority as 'high' | 'medium' | 'low',
      status: plan.status as 'active' | 'paused' | 'completed',
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      watchItems: monitorData.watchItems || [],
      triggerConditions,
      reviewFrequency: monitorData.reviewFrequency || 'weekly',
      disconfirmSignals: plan.disconfirmSignals ? JSON.parse(plan.disconfirmSignals) : [],
      actionHints: plan.actionHints ? JSON.parse(plan.actionHints) : [],
      notes,
    }
  }
}

export const monitorPlanService = new MonitorPlanService()