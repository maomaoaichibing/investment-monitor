import { BaseLLMProvider, MockLLMProvider } from './base'
import { ThesisOutput, MonitorPlanOutput, EventAnalysisOutput } from '@/lib/schemas'

export class MockLLMProviderImpl extends BaseLLMProvider implements MockLLMProvider {
  private mockResponse: any = null

  async generateWithModel<T>(params: {
    model: string
    prompt: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    responseFormat?: {
      type: 'json_schema'
      json_schema: any
    }
  }): Promise<T> {
    // If mock response is set, return it
    if (this.mockResponse) {
      return this.mockResponse as T
    }

    // Otherwise, generate mock responses based on the prompt type
    if (params.prompt.includes('thesis') || params.prompt.includes('Thesis')) {
      return this.generateMockThesis() as T
    } else if (params.prompt.includes('monitor') || params.prompt.includes('Monitor')) {
      return this.generateMockMonitorPlan() as T
    } else if (params.prompt.includes('event') || params.prompt.includes('Event')) {
      return this.generateMockEventAnalysis() as T
    }

    // Default mock response
    return {
      message: 'Mock LLM response',
      timestamp: new Date().toISOString(),
    } as T
  }

  setMockResponse<T>(response: T): void {
    this.mockResponse = response
  }

  clearMockResponse(): void {
    this.mockResponse = null
  }

  private generateMockThesis(): ThesisOutput {
    return {
      lookbackWindow: '12m',
      summary: '过去12个月该标的主要由业绩修复和行业景气改善驱动上涨。公司季度利润连续改善，行业需求稳步增长，估值从底部修复。',
      pricePhases: [
        {
          period: '2025-01 to 2025-04',
          direction: 'up',
          drivers: ['行业需求改善', '利润率回升'],
          evidence: ['月度销量改善', '毛利率提升2个百分点']
        },
        {
          period: '2025-05 to 2025-08',
          direction: 'neutral',
          drivers: ['市场情绪波动', '政策不确定性'],
          evidence: ['成交量萎缩', '政策预期调整']
        },
        {
          period: '2025-09 to 2025-12',
          direction: 'up',
          drivers: ['新产品发布', '成本下降'],
          evidence: ['新订单增长', '单位成本下降5%']
        }
      ],
      coreThesis: [
        '市场核心交易逻辑是盈利修复和估值重估',
        '行业景气度改善是本轮上涨的主要驱动力',
        '新产品线有望带来第二增长曲线'
      ],
      fragilePoints: [
        '若行业高频数据转弱，则逻辑弱化',
        '若利润率不及预期，则估值支撑减弱',
        '新产品市场接受度存在不确定性'
      ],
      monitorTargets: [
        {
          name: '季度利润率',
          type: 'fundamental',
          why: '盈利修复是核心逻辑验证点'
        },
        {
          name: '行业月度销量',
          type: 'industry',
          why: '行业景气是景气驱动的重要证据'
        },
        {
          name: '新产品订单量',
          type: 'fundamental',
          why: '新增长曲线验证'
        }
      ]
    }
  }

  private generateMockMonitorPlan(): MonitorPlanOutput {
    return {
      priority: 'high',
      monitorItems: [
        {
          target: '季度利润率',
          category: 'fundamental',
          trigger: '低于市场预期',
          impact: 'logic_weaken',
          severity: 'high'
        },
        {
          target: '行业月度销量',
          category: 'industry',
          trigger: '连续两个月低于预期',
          impact: 'logic_weaken',
          severity: 'medium'
        },
        {
          target: '新产品订单量',
          category: 'fundamental',
          trigger: '订单增速放缓或下滑',
          impact: 'logic_weaken',
          severity: 'high'
        }
      ]
    }
  }

  private generateMockEventAnalysis(): EventAnalysisOutput {
    return {
      relevanceScore: 0.89,
      thesisImpact: 'weaken',
      impactLevel: 'high',
      reasoning: [
        '该事件直接影响 thesis 中的盈利修复主线',
        '新的利润率数据低于 thesis 预设验证条件',
        '管理层对下一季度指引保守，暗示盈利修复可能不及预期'
      ],
      evidence: [
        '最新财报利润率不及预期',
        '管理层未给出明确修复指引',
        '行业数据同步走弱'
      ],
      actionFramework: '将风险等级提升为重要，若后续行业数据继续走弱，则考虑降低仓位暴露。建议关注下季度财报，若继续不及预期则重新评估投资逻辑。'
    }
  }
}