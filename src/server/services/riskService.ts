import { db } from '@/lib/db'
import {
  CreateRiskInput,
  UpdateRiskInput,
  QueryRiskInput,
  RiskStats,
  RiskExposure,
  CorrelationAnalysis
} from '@/lib/schemas/riskSchema'

/**
 * 风险服务类
 * 提供风险评估、风险计算、风险分析等功能
 */
export class RiskService {
  /**
   * 创建风险记录
   */
  async createRisk(data: CreateRiskInput) {
    // 计算风险评分
    const riskScore = this.calculateRiskScore(data.probability, data.riskLevel)

    const risk = await db.risk.create({
      data: {
        ...data,
        riskScore,
        factorsJson: data.factors ? JSON.stringify(data.factors) : '[]',
        metricsJson: data.metrics ? JSON.stringify(data.metrics) : '[]',
        mitigationsJson: data.mitigations ? JSON.stringify(data.mitigations) : '[]',
        correlationData: data.correlationData ? JSON.stringify(data.correlationData) : '{}',
        metadata: data.metadata ? JSON.stringify(data.metadata) : '{}'
      }
    })

    return risk
  }

  /**
   * 获取风险列表（支持分页和筛选）
   */
  async getRisks(query: QueryRiskInput) {
    const { page, limit, portfolioId, positionId, thesisId, riskType, riskLevel, status } = query
    const skip = (page - 1) * limit

    const where: any = {}
    if (portfolioId) where.portfolioId = portfolioId
    if (positionId) where.positionId = positionId
    if (thesisId) where.thesisId = thesisId
    if (riskType) where.riskType = riskType
    if (riskLevel) where.riskLevel = riskLevel
    if (status) where.status = status

    const [risks, total] = await Promise.all([
      db.risk.findMany({
        where,
        orderBy: { riskScore: 'desc' }, // 按风险评分降序排列
        skip,
        take: limit
      }),
      db.risk.count({ where })
    ])

    return {
      risks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    }
  }

  /**
   * 根据ID获取风险详情
   */
  async getRiskById(id: string) {
    const risk = await db.risk.findUnique({
      where: { id }
    })

    if (!risk) {
      throw new Error('风险记录不存在')
    }

    return risk
  }

  /**
   * 更新风险记录
   */
  async updateRisk(id: string, data: UpdateRiskInput) {
    // 如果更新了概率或风险等级，重新计算风险评分
    const existingRisk = await this.getRiskById(id)
    const updatedData: any = { ...data }

    if (data.probability || data.riskLevel) {
      const probability = data.probability || existingRisk.probability
      const riskLevel = data.riskLevel || existingRisk.riskLevel
      updatedData.riskScore = this.calculateRiskScore(probability, riskLevel)
    }

    const risk = await db.risk.update({
      where: { id },
      data: updatedData
    })

    return risk
  }

  /**
   * 删除风险记录
   */
  async deleteRisk(id: string) {
    await this.getRiskById(id) // 检查是否存在

    await db.risk.delete({
      where: { id }
    })

    return { success: true }
  }

  /**
   * 获取投资组合的风险统计
   */
  async getRiskStats(portfolioId: string): Promise<RiskStats> {
    const risks = await db.risk.findMany({
      where: { portfolioId }
    })

    // 按类型统计
    const riskByType: Record<string, number> = {}
    // 按等级统计
    const riskByLevel: Record<string, number> = {}
    // 风险因子统计
    const factorCount: Record<string, number> = {}

    let totalScore = 0

    risks.forEach(risk => {
      // 按类型统计
      riskByType[risk.riskType] = (riskByType[risk.riskType] || 0) + 1

      // 按等级统计
      riskByLevel[risk.riskLevel] = (riskByLevel[risk.riskLevel] || 0) + 1

      // 统计风险因子（从JSON字符串解析）
      try {
        const factors = risk.factorsJson ? JSON.parse(risk.factorsJson) : []
        factors.forEach((factor: any) => {
          factorCount[factor.name] = (factorCount[factor.name] || 0) + 1
        })
      } catch (e) {
        console.error('解析风险因子失败:', e)
      }

      totalScore += risk.riskScore
    })

    // 获取主要风险因子（按出现次数排序，取前5个）
    const topRiskFactors = Object.entries(factorCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    return {
      totalRisks: risks.length,
      activeRisks: risks.filter(r => r.status === 'active').length,
      criticalRisks: risks.filter(r => r.riskLevel === 'critical').length,
      riskByType,
      riskByLevel,
      avgRiskScore: risks.length > 0 ? totalScore / risks.length : 0,
      topRiskFactors
    }
  }

  /**
   * 计算风险暴露
   */
  async calculateRiskExposure(portfolioId: string): Promise<RiskExposure> {
    const portfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        positions: true
      }
    })

    if (!portfolio) {
      throw new Error('投资组合不存在')
    }

    // 计算组合总价值（所有持仓市值之和）
    const totalValue = portfolio.positions.reduce((sum, pos) => sum + (pos.marketValue || 0), 0)
    let atRiskValue = 0

    const positionExposures = await Promise.all(
      portfolio.positions.map(async (position) => {
        const positionRisks = await db.risk.findMany({
          where: {
            portfolioId,
            positionId: position.id,
            status: 'active'
          }
        })

        // 计算个券风险价值（高风险计100%，中等风险计50%，低风险计20%）
        const riskValue = positionRisks.reduce((sum, risk) => {
          const positionValue = position.marketValue || 0
          if (risk.riskLevel === 'critical' || risk.riskLevel === 'high') {
            return sum + positionValue
          } else if (risk.riskLevel === 'medium') {
            return sum + positionValue * 0.5
          } else {
            return sum + positionValue * 0.2
          }
        }, 0)

        atRiskValue += riskValue

        return {
          positionId: position.id,
          symbol: position.symbol,
          value: position.marketValue || 0,
          riskValue,
          riskRatio: position.marketValue ? riskValue / position.marketValue : 0
        }
      })
    )

    return {
      portfolioId,
      totalValue,
      atRiskValue,
      riskExposureRatio: totalValue ? atRiskValue / totalValue : 0,
      positionExposures
    }
  }

  /**
   * 计算相关性分析
   */
  async calculateCorrelation(portfolioId: string): Promise<CorrelationAnalysis> {
    const portfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        positions: true
      }
    })

    if (!portfolio || !portfolio.positions.length) {
      throw new Error('投资组合不存在或没有持仓')
    }

    const symbols = portfolio.positions.map(p => p.symbol)
    const correlationMatrix: Record<string, Record<string, number>> = {}
    const highCorrelationPairs: Array<{ symbol1: string; symbol2: string; correlation: number }> = []

    // 模拟相关性计算（实际应用中应该调用历史价格数据API）
    for (let i = 0; i < symbols.length; i++) {
      correlationMatrix[symbols[i]] = {}
      for (let j = 0; j < symbols.length; j++) {
        if (i === j) {
          correlationMatrix[symbols[i]][symbols[j]] = 1.0
        } else {
          // 模拟相关性（同行业的相关性较高）
          const isSameIndustry = this.isSameIndustry(symbols[i], symbols[j])
          const baseCorrelation = isSameIndustry ? 0.7 : 0.3
          const randomFactor = (Math.random() - 0.5) * 0.2 // 随机波动±0.1
          const correlation = Math.max(-1, Math.min(1, baseCorrelation + randomFactor))

          correlationMatrix[symbols[i]][symbols[j]] = correlation

          // 记录高相关性配对（相关性>0.7）
          if (correlation > 0.7 && i < j) {
            highCorrelationPairs.push({
              symbol1: symbols[i],
              symbol2: symbols[j],
              correlation
            })
          }
        }
      }
    }

    // 计算集中度
    const totalValue = portfolio.positions.reduce((sum, pos) => sum + (pos.marketValue || 0), 0) || 1
    const positionWeights = portfolio.positions.map(p => ({
      symbol: p.symbol,
      weight: totalValue ? (p.marketValue || 0) / totalValue : 0,
      value: p.marketValue || 0
    })).sort((a, b) => b.weight - a.weight)

    const topPositions = positionWeights.slice(0, 5)
    const concentrationRatio = topPositions.reduce((sum, pos) => sum + pos.weight, 0)

    return {
      portfolioId,
      correlationMatrix,
      highCorrelationPairs,
      concentrationRisk: {
        topPositions,
        concentrationRatio
      }
    }
  }

  /**
   * 生成情景分析
   */
  async generateScenarioAnalysis(portfolioId: string) {
    const portfolio = await db.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        positions: true
      }
    })

    if (!portfolio) {
      throw new Error('投资组合不存在')
    }

    const scenarios = [
      {
        scenario: 'optimistic' as const,
        marketImpact: 0.15, // 市场上涨15%
        assumptions: ['经济复苏', '政策宽松', '企业盈利增长'],
        probability: 0.25
      },
      {
        scenario: 'base' as const,
        marketImpact: 0.02, // 市场上涨2%
        assumptions: ['经济平稳', '政策中性', '企业盈利稳定'],
        probability: 0.5
      },
      {
        scenario: 'pessimistic' as const,
        marketImpact: -0.20, // 市场下跌20%
        assumptions: ['经济衰退', '政策紧缩', '企业盈利下滑'],
        probability: 0.25
      }
    ]

    const totalValue = portfolio.positions.reduce((sum, pos) => sum + (pos.marketValue || 0), 0)

    return scenarios.map(s => {
      // 根据市场影响和组合Beta计算组合价值影响
      const portfolioBeta = this.calculatePortfolioBeta(portfolio.positions)
      const portfolioImpact = s.marketImpact * portfolioBeta
      const newValue = totalValue * (1 + portfolioImpact)

      return {
        scenario: s.scenario,
        impact: {
          portfolioValue: newValue - totalValue,
          returnChange: portfolioImpact,
          riskChange: s.scenario === 'pessimistic' ? 0.5 : s.scenario === 'optimistic' ? -0.2 : 0
        },
        assumptions: s.assumptions,
        probability: s.probability
      }
    })
  }

  /**
   * 计算风险评分
   */
  private calculateRiskScore(probability: number, riskLevel: string): number {
    const levelMultiplier: Record<string, number> = {
      low: 2,
      medium: 5,
      high: 8,
      critical: 10
    }

    return probability * (levelMultiplier[riskLevel] || 5) * 10 // 0-100分
  }

  /**
   * 判断是否同行业（简化版本）
   */
  private isSameIndustry(symbol1: string, symbol2: string): boolean {
    // 简化判断：通过股票代码前缀判断（实际应用中应该调用行业分类API）
    const techPattern = /^(00700|AAPL|TSLA|MSFT|GOOGL)/
    const financePattern = /^(01398|C|BAC|JPM)/
    const energyPattern = /^(00883|XOM|CVX)/

    const patterns = [techPattern, financePattern, energyPattern]

    for (const pattern of patterns) {
      if (pattern.test(symbol1) && pattern.test(symbol2)) {
        return true
      }
    }

    return false
  }

  /**
   * 计算组合Beta（简化版本）
   */
  private calculatePortfolioBeta(positions: Array<{ symbol: string; marketValue?: number | null }>): number {
    if (!positions.length) return 1.0

    // 模拟Beta计算（实际应用中应该使用历史价格数据）
    const totalValue = positions.reduce((sum, pos) => sum + (pos.marketValue || 0), 0)

    const weightedBeta = positions.reduce((sum, pos) => {
      const value = pos.marketValue || 0
      const weight = totalValue ? value / totalValue : 1 / positions.length

      // 模拟Beta值（科技股Beta较高，金融股Beta较低）
      let beta = 1.0
      if (/^(00700|AAPL|TSLA|MSFT|GOOGL)/.test(pos.symbol)) {
        beta = 1.3 // 科技股Beta较高
      } else if (/^(01398|C|BAC|JPM)/.test(pos.symbol)) {
        beta = 0.9 // 金融股Beta较低
      } else if (/^(00883|XOM|CVX)/.test(pos.symbol)) {
        beta = 1.0 // 能源股Beta中等
      }

      return sum + beta * weight
    }, 0)

    return weightedBeta
  }
}

// 导出服务实例
export const riskService = new RiskService()