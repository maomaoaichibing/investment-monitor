import { db } from '@/lib/db'
import { llmService } from '@/server/llm/llmService'
import { z } from 'zod'
import { ThesisSchema } from '@/lib/schemas/thesisSchema'

export interface ThesisInput {
  symbol: string
  assetName: string
  market: string
  investmentThesis?: string | null // 投资理由
  note?: string | null // 兼容旧字段
  direction?: string // 持仓方向：做多/做空
  buyPrice?: number | null // 买入价格
  holdingPeriod?: string // 持有周期
}

export class ThesisService {
  /**
   * 为指定持仓生成投资论题（幂等实现）
   * 策略：如果该持仓已存在thesis，直接返回已有记录；否则创建新的
   * MVP阶段：一持仓一thesis，无版本管理，不重复创建
   */
  async generateThesisForPosition(positionId: string): Promise<{
    thesis: any;
    created: boolean;
    source: 'existing' | 'new';
  }> {
    // 1. 首先检查是否已存在thesis（幂等检查）
    const existingThesis = await db.thesis.findFirst({
      where: { positionId },
      orderBy: { createdAt: 'desc' },
      include: {
        position: {
          select: {
            symbol: true,
            assetName: true,
            market: true
          }
        }
      }
    })

    // 2. 如果已存在，直接返回（幂等）
    if (existingThesis) {
      return {
        thesis: existingThesis,
        created: false,
        source: 'existing'
      }
    }

    // 3. 获取持仓信息（只有不存在时才需要）
    const position = await db.position.findUnique({
      where: { id: positionId },
      include: {
        portfolio: true
      }
    })

    if (!position) {
      throw new Error('Position not found')
    }

    // 4. 构建输入数据
    const thesisInput: ThesisInput = {
      symbol: position.symbol,
      assetName: position.assetName,
      market: position.market,
      investmentThesis: position.investmentThesis,
      direction: '做多', // 默认做多
      buyPrice: position.costPrice,
      holdingPeriod: position.holdingStyle || 'long_term'
    }

    // 5. 调用LLM生成论题
    console.log(`[Thesis] Generating thesis for ${position.assetName} (${position.symbol})...`)
    const rawOutput = await llmService.generateThesis(thesisInput)
    console.log(`[Thesis] Generated thesis with ${rawOutput.pillars?.length || 0} pillars, health score: ${rawOutput.overallHealthScore || 'N/A'}`)

    // 6. 使用Zod校验输出
    const validatedThesis = ThesisSchema.parse(rawOutput)

    // 7. 存入数据库
    const newThesis = await db.thesis.create({
      data: {
        positionId: position.id,
        portfolioId: position.portfolioId,
        title: `${position.assetName}(${position.symbol})投资议题`,
        summary: rawOutput.thesisSummary || rawOutput.summary || `${position.assetName}投资分析`,
        content: rawOutput.thesisSummary || rawOutput.summary || '',
        healthScore: rawOutput.overallHealthScore || 80, // 存入健康度分数
        investmentStyle: 'growth',
        holdingPeriod: position.holdingStyle || 'long_term',
        pricePhasesJson: JSON.stringify(rawOutput.pricePhases || []),
        coreThesisJson: JSON.stringify(rawOutput.pillars || rawOutput.coreThesis || []),
        fragilePointsJson: JSON.stringify(rawOutput.fragilePoints || []),
        monitorTargetsJson: JSON.stringify(rawOutput.monitorTargets || []),
        pillarsJson: JSON.stringify(rawOutput.pillars || null),
        status: 'generated'
      }
    })

    return {
      thesis: {
        ...newThesis,
        position: {
          id: position.id,
          symbol: position.symbol,
          assetName: position.assetName
        }
      },
      created: true,
      source: 'new'
    }
  }

  /**
   * 获取持仓的投资论题
   */
  async getThesisByPosition(positionId: string): Promise<any | null> {
    const thesis = await db.thesis.findFirst({
      where: { positionId },
      orderBy: { createdAt: 'desc' },
      include: {
        position: {
          select: {
            id: true,
            symbol: true,
            assetName: true,
            market: true
          }
        }
      }
    })

    return thesis
  }

  /**
   * 重新生成指定持仓的投资论题（删除旧的，创建新的）
   */
  async regenerateThesisForPosition(positionId: string): Promise<{
    thesis: any;
    created: boolean;
    source: 'regenerated';
  }> {
    // 1. 获取持仓信息
    const position = await db.position.findUnique({
      where: { id: positionId },
      include: {
        portfolio: true
      }
    })

    if (!position) {
      throw new Error('Position not found')
    }

    // 2. 先删除关联数据（避免外键约束）
    // 查询旧的thesis
    const oldTheses = await db.thesis.findMany({
      where: { positionId },
      select: { id: true }
    })

    // 删除关联的MonitorPlan和EventAnalysis
    for (const thesis of oldTheses) {
      await db.monitorPlan.deleteMany({ where: { thesisId: thesis.id } })
      await db.eventAnalysis.deleteMany({ where: { thesisId: thesis.id } })
    }

    // 3. 删除旧的thesis
    await db.thesis.deleteMany({
      where: { positionId }
    })
    console.log(`[Thesis] Deleted old thesis for ${position.assetName}`)

    // 4. 构建输入数据，根据持仓方向设置正确的做多/做空
    let direction = '做多'
    // 从holdingStyle或symbol判断做空标的
    if (position.holdingStyle?.includes('short') ||
        position.symbol.toUpperCase().includes('SQQQ') ||
        position.symbol.toUpperCase().includes('SOXS') ||
        position.symbol.toUpperCase().includes('JDST')) {
      direction = '做空'
    }

    const thesisInput: ThesisInput = {
      symbol: position.symbol,
      assetName: position.assetName,
      market: position.market,
      investmentThesis: position.investmentThesis,
      direction,
      buyPrice: position.costPrice,
      holdingPeriod: position.holdingStyle || 'long_term'
    }

    // 5. 调用LLM重新生成论题
    console.log(`[Thesis] Regenerating thesis for ${position.assetName} (${position.symbol}), direction: ${direction}...`)
    const rawOutput = await llmService.generateThesis(thesisInput)
    console.log(`[Thesis] Regenerated thesis with ${rawOutput.pillars?.length || 0} pillars, health score: ${rawOutput.overallHealthScore || 'N/A'}`)

    // 6. 使用Zod校验输出
    const validatedThesis = ThesisSchema.parse(rawOutput)

    // 7. 存入数据库
    const newThesis = await db.thesis.create({
      data: {
        positionId: position.id,
        portfolioId: position.portfolioId,
        title: `${position.assetName}(${position.symbol})投资议题`,
        summary: rawOutput.thesisSummary || rawOutput.summary || `${position.assetName}投资分析`,
        content: rawOutput.thesisSummary || rawOutput.summary || '',
        healthScore: rawOutput.overallHealthScore || 80,
        investmentStyle: 'growth',
        holdingPeriod: position.holdingStyle || 'long_term',
        pricePhasesJson: JSON.stringify(rawOutput.pricePhases || []),
        coreThesisJson: JSON.stringify(rawOutput.pillars || rawOutput.coreThesis || []),
        fragilePointsJson: JSON.stringify(rawOutput.fragilePoints || []),
        monitorTargetsJson: JSON.stringify(rawOutput.monitorTargets || []),
        pillarsJson: JSON.stringify(rawOutput.pillars || null),
        status: 'generated'
      }
    })

    return {
      thesis: {
        ...newThesis,
        position: {
          id: position.id,
          symbol: position.symbol,
          assetName: position.assetName
        }
      },
      created: true,
      source: 'regenerated'
    }
  }

  /**
   * 获取组合的所有论题
   */
  async getThesesByPortfolio(portfolioId: string): Promise<any[]> {
    const theses = await db.thesis.findMany({
      where: { portfolioId },
      orderBy: { createdAt: 'desc' },
      include: {
        position: {
          select: {
            id: true,
            symbol: true,
            assetName: true
          }
        }
      }
    })

    return theses
  }

  /**
   * 获取所有论题（用于测试页面）
   */
  async getAllTheses(): Promise<any[]> {
    const theses = await db.thesis.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        position: {
          select: {
            id: true,
            symbol: true,
            assetName: true
          }
        },
        portfolio: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return theses
  }
}

export const thesisService = new ThesisService()