import { db } from '@/lib/db'
import { llmService } from '@/server/llm/llmService'
import { z } from 'zod'
import { ThesisSchema } from '@/lib/schemas/thesisSchema'

export interface ThesisInput {
  symbol: string
  assetName: string
  market: string
  note?: string | null
}

export interface ThesisOutput {
  summary: string
  pricePhases: {
    phase: string
    description: string
    keyLevels?: string[]
  }[]
  coreThesis: {
    title: string
    description: string
    conviction: number // 1-10
  }[]
  fragilePoints: string[]
  monitorTargets: {
    type: string
    condition: string
    action: string
  }[]
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
      note: position.note
    }

    // 5. 调用LLM生成论题
    const rawOutput = await llmService.generateThesis(thesisInput)
    
    // 6. 使用Zod校验输出
    const validatedThesis = ThesisSchema.parse(rawOutput)

    // 7. 存入数据库
    const newThesis = await db.thesis.create({
      data: {
        positionId: position.id,
        portfolioId: position.portfolioId,
        title: `${position.symbol}投资论题`,
        summary: validatedThesis.summary,
        content: validatedThesis.summary, // 暂时使用summary作为content
        investmentStyle: 'growth',
        holdingPeriod: 'long_term',
        pricePhasesJson: JSON.stringify(validatedThesis.pricePhases),
        coreThesisJson: JSON.stringify(validatedThesis.coreThesis),
        fragilePointsJson: JSON.stringify(validatedThesis.fragilePoints),
        monitorTargetsJson: JSON.stringify(validatedThesis.monitorTargets),
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
   * 获取组合的所有论题
   */
  async getThesesByPortfolio(portfolioId: string): Promise<any[]> {
    const theses = await db.thesis.findMany({
      where: { portfolioId },
      orderBy: { createdAt: 'desc' },
      include: {
        position: {
          select: {
            symbol: true,
            assetName: true
          }
        }
      }
    })

    return theses
  }
}

export const thesisService = new ThesisService()