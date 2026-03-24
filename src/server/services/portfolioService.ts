import { db } from '@/lib/db'
import { CreatePortfolioInput } from '@/lib/schemas'

export class PortfolioService {
  async createPortfolio(data: CreatePortfolioInput) {
    return await db.portfolio.create({
      data: {
        name: data.name,
        description: data.description || '',
      },
    })
  }

  async getPortfolioList() {
    return await db.portfolio.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
      _count: {
        select: {
          positions: true,
        },
      },
      },
    })
  }

  async getPortfolioDetail(id: string) {
    const portfolio = await db.portfolio.findUnique({
      where: { id },
      include: {
        positions: {
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
            _count: {
              select: {
                alerts: true,
              },
            },
          },
        },

      },
    })

    if (!portfolio) {
      throw new Error('Portfolio not found')
    }

    return portfolio
  }

  async deletePortfolio(id: string) {
    // First, delete all related positions and their dependencies
    const positions = await db.position.findMany({
      where: { portfolioId: id },
    })

    for (const position of positions) {
      await db.position.delete({
        where: { id: position.id },
      })
    }

    // Then delete the portfolio
    return await db.portfolio.delete({
      where: { id },
    })
  }

  async updatePortfolio(id: string, data: Partial<CreatePortfolioInput>) {
    return await db.portfolio.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    })
  }
}

export const portfolioService = new PortfolioService()