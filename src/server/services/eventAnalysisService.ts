import { db } from '@/lib/db'
import { CreateEventAnalysisInput, UpdateEventAnalysisInput, QueryEventAnalysisInput } from '@/lib/schemas/eventAnalysisSchema'
import { buildEventAnalysisPrompt } from '@/lib/llm/prompts/eventAnalysisPrompt'
import { AIEventAnalysisResult } from '@/lib/schemas/eventAnalysisSchema'

// Kimi API 配置
const KIMI_API_KEY = process.env.KIMI_API_KEY || 'sk-5lKs7u9Q5FTWUpRd8SHneXmNt9ER51puxbyv7rY5I5YjY3oX'
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'
const KIMI_MODEL = 'moonshot-v1-8k'

/**
 * 事件分析服务层
 * 处理事件分析的CRUD操作和AI分析
 */
export class EventAnalysisService {
  /**
   * 创建事件分析（手动或AI生成）
   */
  async createEventAnalysis(data: CreateEventAnalysisInput) {
    // 检查是否已存在相同事件的分析
    const existing = await db.eventAnalysis.findFirst({
      where: {
        eventId: data.eventId,
        thesisId: data.thesisId
      }
    })

    if (existing) {
      throw new Error(`事件分析已存在: eventId=${data.eventId}, thesisId=${data.thesisId}`)
    }

    const eventAnalysis = await db.eventAnalysis.create({
      data: {
        eventId: data.eventId,
        positionId: data.positionId,
        thesisId: data.thesisId,
        relevanceScore: data.relevanceScore,
        thesisImpact: data.thesisImpact,
        impactLevel: data.impactLevel,
        reasoning: data.reasoning,
        evidenceJson: JSON.stringify(data.evidenceJson || []),
        actionFramework: data.actionFramework
      },
      include: {
        _count: {
          select: {
            alerts: true
          }
        },
        event: true,
        thesis: true,
        position: true
      }
    })

    return this.transformEventAnalysis(eventAnalysis)
  }

  /**
   * AI自动生成事件分析
   */
  async generateEventAnalysis(eventId: string, thesisId: string) {
    // 检查是否已存在
    const existing = await db.eventAnalysis.findFirst({
      where: { eventId, thesisId }
    })

    if (existing) {
      return this.transformEventAnalysis(existing)
    }

    // 获取事件、论题和持仓信息
    const event = await db.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      throw new Error(`Event not found: ${eventId}`)
    }

    const thesis = await db.thesis.findUnique({
      where: { id: thesisId },
      include: {
        position: true
      }
    })

    if (!thesis) {
      throw new Error(`Thesis not found: ${thesisId}`)
    }

    // 构建Prompt
    const prompt = buildEventAnalysisPrompt({
      event,
      thesis,
      position: thesis.position
    })

    // 调用Kimi API
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的投资事件分析师。你的任务是分析特定事件对投资论题的影响，提供客观、基于证据的分析。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`)
    }

    const result = await response.json()
    const aiResult = result.choices[0].message.content

    // 解析AI结果
    let analysisData: AIEventAnalysisResult
    try {
      analysisData = JSON.parse(aiResult)
    } catch (error) {
      console.error('Failed to parse AI result:', aiResult)
      throw new Error('AI返回结果格式错误')
    }

    // 验证结果
    if (!analysisData.relevanceScore || !analysisData.thesisImpact || 
        !analysisData.impactLevel || !analysisData.reasoning || 
        !analysisData.actionFramework) {
      throw new Error('AI分析结果不完整')
    }

    // 创建事件分析记录
    const eventAnalysis = await db.eventAnalysis.create({
      data: {
        eventId,
        positionId: thesis.positionId,
        thesisId,
        relevanceScore: analysisData.relevanceScore,
        thesisImpact: analysisData.thesisImpact,
        impactLevel: analysisData.impactLevel,
        reasoning: analysisData.reasoning,
        evidenceJson: JSON.stringify(analysisData.evidence || []),
        actionFramework: analysisData.actionFramework
      },
      include: {
        _count: {
          select: {
            alerts: true
          }
        },
        event: true,
        thesis: true,
        position: true
      }
    })

    return this.transformEventAnalysis(eventAnalysis)
  }

  /**
   * 获取事件分析列表
   */
  async getEventAnalyses(query: QueryEventAnalysisInput) {
    const { page, pageSize, eventId, positionId, thesisId, thesisImpact, impactLevel } = query
    const skip = (page - 1) * pageSize

    // 构建筛选条件
    const where: any = {}

    if (eventId) where.eventId = eventId
    if (positionId) where.positionId = positionId
    if (thesisId) where.thesisId = thesisId
    if (thesisImpact) where.thesisImpact = thesisImpact
    if (impactLevel) where.impactLevel = impactLevel

    // 查询总数
    const total = await db.eventAnalysis.count({ where })

    // 查询数据
    const eventAnalyses = await db.eventAnalysis.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            alerts: true
          }
        },
        event: true,
        thesis: true,
        position: true
      }
    })

    return {
      eventAnalyses: eventAnalyses.map(analysis => this.transformEventAnalysis(analysis)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  }

  /**
   * 获取单个事件分析
   */
  async getEventAnalysisById(id: string) {
    const eventAnalysis = await db.eventAnalysis.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            alerts: true
          }
        },
        event: true,
        thesis: true,
        position: true
      }
    })

    if (!eventAnalysis) {
      throw new Error(`EventAnalysis with id ${id} not found`)
    }

    return this.transformEventAnalysis(eventAnalysis)
  }

  /**
   * 获取事件相关的所有分析
   */
  async getAnalysesByEvent(eventId: string) {
    const analyses = await db.eventAnalysis.findMany({
      where: { eventId },
      include: {
        _count: {
          select: {
            alerts: true
          }
        },
        event: true,
        thesis: true,
        position: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return analyses.map(analysis => this.transformEventAnalysis(analysis))
  }

  /**
   * 获取论题相关的所有分析
   */
  async getAnalysesByThesis(thesisId: string) {
    const analyses = await db.eventAnalysis.findMany({
      where: { thesisId },
      include: {
        _count: {
          select: {
            alerts: true
          }
        },
        event: true,
        thesis: true,
        position: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return analyses.map(analysis => this.transformEventAnalysis(analysis))
  }

  /**
   * 更新事件分析
   */
  async updateEventAnalysis(id: string, data: UpdateEventAnalysisInput) {
    const eventAnalysis = await db.eventAnalysis.update({
      where: { id },
      data: {
        relevanceScore: data.relevanceScore,
        thesisImpact: data.thesisImpact,
        impactLevel: data.impactLevel,
        reasoning: data.reasoning,
        evidenceJson: data.evidenceJson ? JSON.stringify(data.evidenceJson) : undefined,
        actionFramework: data.actionFramework
      },
      include: {
        _count: {
          select: {
            alerts: true
          }
        },
        event: true,
        thesis: true,
        position: true
      }
    })

    return this.transformEventAnalysis(eventAnalysis)
  }

  /**
   * 删除事件分析
   */
  async deleteEventAnalysis(id: string) {
    const eventAnalysis = await db.eventAnalysis.delete({
      where: { id },
      include: {
        _count: {
          select: {
            alerts: true
          }
        },
        event: true,
        thesis: true,
        position: true
      }
    })

    return this.transformEventAnalysis(eventAnalysis)
  }

  /**
   * 数据转换：将Prisma模型转换为响应格式
   */
  private transformEventAnalysis(analysis: any) {
    return {
      id: analysis.id,
      eventId: analysis.eventId,
      positionId: analysis.positionId,
      thesisId: analysis.thesisId,
      relevanceScore: analysis.relevanceScore,
      thesisImpact: analysis.thesisImpact,
      impactLevel: analysis.impactLevel,
      reasoning: analysis.reasoning,
      evidenceJson: JSON.parse(analysis.evidenceJson || '[]'),
      actionFramework: analysis.actionFramework,
      createdAt: analysis.createdAt.toISOString(),
      updatedAt: analysis.updatedAt.toISOString(),
      alertCount: analysis._count.alerts,
      event: analysis.event ? {
        id: analysis.event.id,
        symbol: analysis.event.symbol,
        title: analysis.event.title,
        eventType: analysis.event.eventType
      } : null,
      thesis: analysis.thesis ? {
        id: analysis.thesis.id,
        title: analysis.thesis.title,
        healthScore: analysis.thesis.healthScore
      } : null,
      position: analysis.position ? {
        id: analysis.position.id,
        symbol: analysis.position.symbol,
        assetName: analysis.position.assetName
      } : null
    }
  }
}

// 导出单例
export const eventAnalysisService = new EventAnalysisService()