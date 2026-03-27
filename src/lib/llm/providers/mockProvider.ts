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
      thesisSummary: '公司具有良好的投资价值，业绩稳定增长，估值合理',
      pillars: [
        {
          id: 1,
          name: '业绩增长',
          coreAssumption: '公司季度营收保持15%以上增速',
          conviction: 7,
          monitorIndicators: [
            { name: '季度营收增速', type: 'fundamental', frequency: 'quarterly' },
            { name: '毛利率变化', type: 'fundamental', frequency: 'quarterly' }
          ],
          bullishSignal: '营收和利润持续增长',
          riskTrigger: '核心业务增速放缓'
        },
        {
          id: 2,
          name: '行业地位',
          coreAssumption: '市占率稳步提升',
          conviction: 6,
          monitorIndicators: [
            { name: '市场份额', type: 'industry', frequency: 'quarterly' }
          ],
          bullishSignal: '竞争对手出现问题',
          riskTrigger: '新进入者威胁'
        }
      ],
      fragilePoints: [
        '宏观经济不确定性',
        '行业竞争加剧'
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