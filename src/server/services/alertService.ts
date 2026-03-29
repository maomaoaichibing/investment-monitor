import { db } from '@/lib/db'
import {
  CreateAlertRequest,
  UpdateAlertRequest,
  UpdateAlertStatusRequest,
  FilterAlertsQuery,
  AlertApiResponse,
  alertApiResponseSchema,
} from '@/lib/schemas/alertSchema'
import { sendAlertNotifications } from './emailSubscriptionService'

export interface AlertWithRelations {
  id: string
  positionId: string
  eventId: string | null
  eventAnalysisId: string | null
  level: string
  title: string
  summary: string
  status: string
  sentAt: Date
  createdAt: Date
  updatedAt: Date
  position: {
    id: string
    symbol: string
    assetName: string
  } | null
  event: {
    id: string
    symbol: string
    eventType: string
    title: string
  } | null
  eventAnalysis: {
    id: string
    eventId: string
    positionId: string
    thesisId: string
    relevanceScore: number
    thesisImpact: string
    impactLevel: string
  } | null
}

export class AlertService {
  /**
   * 创建Alert
   */
  async createAlert(data: CreateAlertRequest): Promise<AlertApiResponse> {
    // Validate position exists
    const position = await db.position.findUnique({
      where: { id: data.positionId },
      select: { id: true, symbol: true, assetName: true },
    })

    if (!position) {
      throw new Error('持仓不存在')
    }

    // Validate event exists if provided
    if (data.eventId) {
      const event = await db.event.findUnique({
        where: { id: data.eventId },
      })
      if (!event) {
        throw new Error('事件不存在')
      }
    }

    // Validate eventAnalysis exists if provided
    if (data.eventAnalysisId) {
      const eventAnalysis = await db.eventAnalysis.findUnique({
        where: { id: data.eventAnalysisId },
      })
      if (!eventAnalysis) {
        throw new Error('事件分析不存在')
      }
    }

    const alert = await db.alert.create({
      data: {
        positionId: data.positionId,
        eventId: data.eventId || null,
        eventAnalysisId: data.eventAnalysisId || null,
        level: data.level,
        title: data.title,
        summary: data.summary,
        status: 'unread',
      },
      include: {
        position: {
          select: {
            id: true,
            symbol: true,
            assetName: true,
          },
        },
        event: {
          select: {
            id: true,
            symbol: true,
            eventType: true,
            title: true,
          },
        },
        eventAnalysis: {
          select: {
            id: true,
            eventId: true,
            positionId: true,
            thesisId: true,
            relevanceScore: true,
            thesisImpact: true,
            impactLevel: true,
          },
        },
      },
    })

    return this.formatAlertResponse(alert)
  }

  /**
   * 查询Alerts，支持筛选
   */
  async getAlerts(query: FilterAlertsQuery): Promise<{
    alerts: AlertApiResponse[]
    total: number
  }> {
    const where: any = {}

    if (query.positionId) {
      where.positionId = query.positionId
    }

    if (query.level) {
      where.level = query.level
    }

    if (query.status) {
      where.status = query.status
    }

    const [alerts, total] = await Promise.all([
      db.alert.findMany({
        where,
        include: {
          position: {
            select: {
              id: true,
              symbol: true,
              assetName: true,
            },
          },
          event: {
            select: {
              id: true,
              symbol: true,
              eventType: true,
              title: true,
            },
          },
          eventAnalysis: {
            select: {
              id: true,
              eventId: true,
              positionId: true,
              thesisId: true,
              relevanceScore: true,
              thesisImpact: true,
              impactLevel: true,
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
        take: query.limit,
        skip: query.offset,
      }),
      db.alert.count({ where }),
    ])

    return {
      alerts: alerts.map(alert => this.formatAlertResponse(alert)),
      total,
    }
  }

  /**
   * 获取单个Alert详情
   */
  async getAlert(id: string): Promise<AlertApiResponse | null> {
    const alert = await db.alert.findUnique({
      where: { id },
      include: {
        position: {
          select: {
            id: true,
            symbol: true,
            assetName: true,
          },
        },
        event: {
          select: {
            id: true,
            symbol: true,
            eventType: true,
            title: true,
          },
        },
        eventAnalysis: {
          select: {
            id: true,
            eventId: true,
            positionId: true,
            thesisId: true,
            relevanceScore: true,
            thesisImpact: true,
            impactLevel: true,
          },
        },
      },
    })

    if (!alert) {
      return null
    }

    return this.formatAlertResponse(alert)
  }

  /**
   * 更新Alert
   */
  async updateAlert(id: string, data: UpdateAlertRequest): Promise<AlertApiResponse> {
    const existingAlert = await db.alert.findUnique({
      where: { id },
    })

    if (!existingAlert) {
      throw new Error('Alert不存在')
    }

    const alert = await db.alert.update({
      where: { id },
      data: {
        level: data.level || existingAlert.level,
        title: data.title || existingAlert.title,
        summary: data.summary || existingAlert.summary,
        status: data.status || existingAlert.status,
      },
      include: {
        position: {
          select: {
            id: true,
            symbol: true,
            assetName: true,
          },
        },
        event: {
          select: {
            id: true,
            symbol: true,
            eventType: true,
            title: true,
          },
        },
        eventAnalysis: {
          select: {
            id: true,
            eventId: true,
            positionId: true,
            thesisId: true,
            relevanceScore: true,
            thesisImpact: true,
            impactLevel: true,
          },
        },
      },
    })

    return this.formatAlertResponse(alert)
  }

  /**
   * 更新Alert状态
   */
  async updateAlertStatus(id: string, data: UpdateAlertStatusRequest): Promise<AlertApiResponse> {
    const existingAlert = await db.alert.findUnique({
      where: { id },
    })

    if (!existingAlert) {
      throw new Error('Alert不存在')
    }

    const alert = await db.alert.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        position: {
          select: {
            id: true,
            symbol: true,
            assetName: true,
          },
        },
        event: {
          select: {
            id: true,
            symbol: true,
            eventType: true,
            title: true,
          },
        },
        eventAnalysis: {
          select: {
            id: true,
            eventId: true,
            positionId: true,
            thesisId: true,
            relevanceScore: true,
            thesisImpact: true,
            impactLevel: true,
          },
        },
      },
    })

    return this.formatAlertResponse(alert)
  }

  /**
   * 删除Alert
   */
  async deleteAlert(id: string): Promise<boolean> {
    const existingAlert = await db.alert.findUnique({
      where: { id },
    })

    if (!existingAlert) {
      throw new Error('Alert不存在')
    }

    await db.alert.delete({
      where: { id },
    })

    return true
  }

  /**
   * 根据EventAnalysis自动创建Alert
   * 当EventAnalysis生成时，如果impactLevel为high或medium，自动创建Alert
   */
  async createAlertFromEventAnalysis(eventAnalysisId: string): Promise<AlertApiResponse | null> {
    const eventAnalysis = await db.eventAnalysis.findUnique({
      where: { id: eventAnalysisId },
      include: {
        event: true,
        thesis: {
          include: {
            position: true,
          },
        },
      },
    })

    if (!eventAnalysis) {
      throw new Error('事件分析不存在')
    }

    // 只对high和medium级别的impact创建Alert
    if (eventAnalysis.impactLevel !== 'high' && eventAnalysis.impactLevel !== 'medium') {
      return null
    }

    // 检查是否已经为这个EventAnalysis创建过Alert
    const existingAlert = await db.alert.findFirst({
      where: {
        eventAnalysisId: eventAnalysisId,
      },
    })

    if (existingAlert) {
      return this.formatAlertResponse(existingAlert as any)
    }

    // 生成Alert标题和摘要
    const title = `${eventAnalysis.event.title}`
    const summary = `事件影响：${eventAnalysis.thesisImpact}（置信度：${eventAnalysis.relevanceScore}），建议关注持仓${eventAnalysis.thesis.position.symbol}`

    // 确定Alert级别
    const level = eventAnalysis.impactLevel === 'high' ? 'important' : 'watch'

    return await this.createAlert({
      positionId: eventAnalysis.positionId,
      eventId: eventAnalysis.eventId,
      eventAnalysisId: eventAnalysisId,
      level,
      title,
      summary,
    })
  }

  /**
   * 格式化Alert响应数据
   */
  private formatAlertResponse(alert: any): AlertApiResponse {
    return {
      id: alert.id,
      positionId: alert.positionId,
      eventId: alert.eventId || null,
      eventAnalysisId: alert.eventAnalysisId || null,
      level: alert.level as AlertApiResponse['level'],
      title: alert.title,
      summary: alert.summary,
      status: alert.status as AlertApiResponse['status'],
      sentAt: alert.sentAt.toISOString(),
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
      position: alert.position || undefined,
      event: alert.event || null,
      eventAnalysis: alert.eventAnalysis || null,
    }
  }
}

export const alertService = new AlertService()
