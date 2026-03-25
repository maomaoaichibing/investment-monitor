import { db } from '@/lib/db'
import { CreatePortfolioInput } from '@/lib/schemas'

export class PortfolioService {
  async createPortfolio(data: CreatePortfolioInput) {
    // 如果有持仓，先创建组合再添加持仓
    if (data.positions && data.positions.length > 0) {
      const portfolio = await db.portfolio.create({
        data: {
          name: data.name,
          description: data.description || '',
        },
      })
      
      // 创建持仓
      await db.position.createMany({
        data: data.positions.map((p, index) => ({
          portfolioId: portfolio.id,
          symbol: p.symbol,
          assetName: p.assetName,
          market: 'A', // 默认A股
          quantity: p.quantity,
          costPrice: p.costPrice,
          positionWeight: 0, // 默认权重，之后可计算
          holdingStyle: 'long_term' as const,
        })),
      })
      
      // 返回完整的组合信息
      return this.getPortfolioDetail(portfolio.id)
    }
    
    // 无持仓时直接创建
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