import { db } from '@/lib/db'
import { CreatePositionInput } from '@/lib/schemas'

export class PositionService {
  async createPosition(data: CreatePositionInput) {
    // Validate portfolio exists
    const portfolio = await db.portfolio.findUnique({
      where: { id: data.portfolioId },
    })

    if (!portfolio) {
      throw new Error('Portfolio not found')
    }

    return await db.position.create({
      data: {
        portfolioId: data.portfolioId,
        symbol: data.symbol,
        assetName: data.assetName,
        market: data.market,
        quantity: data.quantity,
        costPrice: data.costPrice,
        positionWeight: data.positionWeight,
        holdingStyle: data.holdingStyle,
        note: data.note || '',
      },
    })
  }

  async getPositionsByPortfolio(portfolioId: string) {
    return await db.position.findMany({
      where: { portfolioId },
      orderBy: {
        positionWeight: 'desc',
      },
      include: {
        thesis: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        monitorPlans: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            alerts: true,
            eventAnalyses: true,
          },
        },
      },
    })
  }

  async getPositionDetail(id: string) {
    const position = await db.position.findUnique({
      where: { id },
      include: {
        portfolio: true,
        thesis: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        monitorPlans: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        eventAnalyses: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            event: true,
          },
        },
        alerts: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            event: true,
            eventAnalysis: true,
          },
        },
      },
    })

    if (!position) {
      throw new Error('Position not found')
    }

    return position
  }

  async updatePosition(id: string, data: Partial<CreatePositionInput>) {
    return await db.position.update({
      where: { id },
      data: {
        symbol: data.symbol,
        assetName: data.assetName,
        market: data.market,
        quantity: data.quantity,
        costPrice: data.costPrice,
        positionWeight: data.positionWeight,
        holdingStyle: data.holdingStyle,
        note: data.note,
      },
    })
  }

  async deletePosition(id: string) {
    // Delete all related data first
    await db.thesis.deleteMany({
      where: { positionId: id },
    })

    await db.monitorPlan.deleteMany({
      where: { positionId: id },
    })

    await db.eventAnalysis.deleteMany({
      where: { positionId: id },
    })

    await db.alert.deleteMany({
      where: { positionId: id },
    })

    // Then delete the position
    return await db.position.delete({
      where: { id },
    })
  }

  async getPositionsWithThesis(portfolioId?: string) {
    const where = portfolioId ? { portfolioId } : {}
    
    return await db.position.findMany({
      where,
      include: {
        portfolio: true,
        thesis: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        positionWeight: 'desc',
      },
    })
  }
}

export const positionService = new PositionService()