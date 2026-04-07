import { ThesisInput } from '@/server/services/thesisService'
import { buildThesisPrompt } from './prompts/thesisPrompt'
import { generateMonitorPlanPrompt } from './prompts/monitorPlanPrompt'
import { buildAlertImpactPrompt } from './prompts/alertImpactPrompt'
import { buildDailySummaryPrompt } from './prompts/dailySummaryPrompt'
import { buildDevilsAdvocatePrompt } from './prompts/devilsAdvocatePrompt'
import { monitorPlanSchema } from '@/lib/schemas/monitorPlanSchema'

// Kimi API 配置
const KIMI_API_KEY = process.env.KIMI_API_KEY || 'sk-5lKs7u9Q5FTWUpRd8SHneXmNt9ER51puxbyv7rY5I5YjY3oX'
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'
const KIMI_MODEL = 'moonshot-v1-8k'

export class LLMService {
  /**
   * 使用 Kimi LLM 生成投资论题
   */
  async generateThesis(input: ThesisInput): Promise<any> {
    // 构建提示词
    const prompt = buildThesisPrompt(input)

    try {
      // 调用 Kimi API
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
              content: `你是一位专业的投资研究分析师。你的任务是基于用户提供的"投资理由"，深度分析并生成一份"投资逻辑监控框架"（议题树）。

【核心概念】
- 议题树(Pillars)：把一个持仓的投资逻辑拆解成3-5个核心议题，每个议题都是可以被数据验证或证伪的假设
- 每个议题包含：核心假设、监控指标、看多/看空信号、风险触发条件

【输出格式 - 必须严格按此JSON格式】
{
  "thesisSummary": "一句话总结核心投资逻辑（30字内）",
  "pillars": [
    {
      "id": 1,
      "name": "议题名称，如：欧洲储能需求",
      "coreAssumption": "可证伪的具体假设，如：2025年欧洲储能装机量同比增长>40%",
      "conviction": 1-10,
      "monitorIndicators": [
        {
          "name": "指标名称，如：欧洲储能月度装机量",
          "type": "fundamental|industry|macro|technical|sentiment|price",
          "frequency": "realtime|daily|weekly|monthly|quarterly",
          "dataSource": "可选的数据来源建议"
        }
      ],
      "bullishSignal": "做多仓位填写：什么数据/事件说明做多逻辑成立",
      "bearishSignal": "做空仓位填写：什么数据/事件说明做空逻辑成立",
      "riskTrigger": "什么数据/事件说明逻辑可能失效"
    }
  ],
  "fragilePoints": ["风险点1", "风险点2"],
  "pricePhases": [
    {"period": "阶段", "description": "描述", "keyLevels": ["关键价位"]}
  ]
}

【重要规则】
1. pillars必须返回3-5个议题
2. 做多仓位使用bullishSignal，做空仓位使用bearishSignal
3. 每个议题的monitorIndicators必须包含2-4个具体指标
4. conviction是1-10的数字，表示对这个议题的信心度
5. 所有type必须是：fundamental, industry, macro, technical, sentiment, price 之一
6. frequency必须是：realtime, daily, weekly, monthly, quarterly 之一
7. 只返回JSON，不要包含任何解释或其他内容`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Kimi API error:', response.status, errorText)
        throw new Error(`Kimi API error: ${response.status}`)
      }

      const data = await response.json()

      // 解析 Kimi 的响应
      const content = data.choices?.[0]?.message?.content || ''
      console.log('Kimi raw response:', content)

      // 尝试解析JSON
      let parsed
      try {
        // 尝试直接解析
        parsed = JSON.parse(content)
      } catch {
        // 如果失败，尝试提取JSON块
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                         content.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1])
          } catch {
            console.warn('Failed to parse JSON from content')
            return this.generateFallbackThesis(input)
          }
        } else {
          console.warn('No JSON found in response')
          return this.generateFallbackThesis(input)
        }
      }

      // 验证并补充必要字段
      return this.validateAndFillThesis(parsed, input)

    } catch (error) {
      console.error('LLM Service error:', error)
      // API调用失败时使用fallback
      return this.generateFallbackThesis(input)
    }
  }

  /**
   * 验证并填充thesis数据
   */
  private validateAndFillThesis(data: any, input: ThesisInput): any {
    const defaultThesis = this.generateFallbackThesis(input)

    // 处理议题树格式（增强版 - 支持 #1 Prompt 的新字段）
    const pillars = Array.isArray(data?.pillars) && data.pillars.length > 0
      ? data.pillars.map((p: any, idx: number) => ({
          id: p.pillar_id || p.id || idx + 1,
          name: p.pillar_name || p.name || `议题${idx + 1}`,
          coreAssumption: p.core_assumption || p.coreAssumption || '',
          conviction: Math.min(10, Math.max(1, parseInt(p.conviction) || 5)),
          monitorIndicators: Array.isArray(p.monitorIndicators) && p.monitorIndicators.length > 0
            ? p.monitorIndicators.slice(0, 4).map((i: any) => ({
                name: i.indicator_name || i.name || '',
                type: ['fundamental', 'industry', 'macro', 'technical', 'sentiment', 'price'].includes(i.type)
                  ? i.type : 'fundamental',
                frequency: ['realtime', 'daily', 'weekly', 'monthly', 'quarterly', 'event'].includes(i.frequency)
                  ? i.frequency : 'weekly',
                dataSource: i.data_source || i.dataSource || '',
                dataType: i.data_type || i.dataType || 'stock_price'
              }))
            : [],
          bullishSignal: p.bullish_signal || p.bullishSignal || '',
          bearishSignal: p.bearish_signal || p.bearishSignal || '',
          riskTrigger: p.risk_trigger || p.riskTrigger || '',
          impactWeight: p.impact_weight || p.impactWeight || Math.floor(100 / (data.pillars.length || 1))
        }))
      : defaultThesis.pillars

    // 计算权重归一化（确保总和为100）
    const totalWeight = pillars.reduce((sum: number, p: any) => sum + (p.impactWeight || 0), 0)
    if (totalWeight > 0 && Math.abs(totalWeight - 100) > 1) {
      pillars.forEach((p: any) => {
        p.impactWeight = Math.round((p.impactWeight / totalWeight) * 100)
      })
    }

    return {
      thesisSummary: data?.thesis_summary || data?.thesisSummary || defaultThesis.thesisSummary,
      overallHealthScore: data?.overall_health_score || data?.overallHealthScore || 80,
      pillars,
      pricePhases: Array.isArray(data?.pricePhases) && data.pricePhases.length > 0
        ? data.pricePhases.map((p: any) => ({
            period: p.period || p.phase || '未知阶段',
            description: p.description || '',
            keyLevels: Array.isArray(p.keyLevels) ? p.keyLevels : []
          }))
        : defaultThesis.pricePhases,
      fragilePoints: Array.isArray(data?.fragilePoints) && data.fragilePoints.length > 0
        ? data.fragilePoints.slice(0, 5)
        : defaultThesis.fragilePoints,
    }
  }

  /**
   * 使用 Kimi LLM 生成监控计划
   */
  async generateMonitorPlan(thesisData: {
    summary: string
    pricePhases: any[]
    coreThesis: any[]
    fragilePoints: string[]
    monitorTargets: any[]
    symbol: string
    assetName: string
    market: string
  }): Promise<any> {
    // 构建提示词
    const prompt = generateMonitorPlanPrompt(thesisData)

    try {
      // 调用 Kimi API
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
              content: `你是一位专业的投资监控分析师。你的任务是基于投资论题生成一个具体、可执行的监控计划。

【输出格式 - 必须严格按此JSON格式】
{
  "watchItems": [
    {
      "title": "监控项标题",
      "metric": "具体指标名称",
      "threshold": "触发阈值条件",
      "source": "数据来源",
      "frequency": "realtime|daily|weekly|monthly|quarterly",
      "priority": "high|medium|low"
    }
  ],
  "triggerConditions": [
    {
      "condition": "触发条件描述",
      "description": "条件说明",
      "action": "建议行动",
      "priority": "high|medium|low",
      "requiresConfirmation": true|false,
      "confirmationMethod": "ai|manual"
    }
  ],
  "reviewFrequency": "daily|weekly|biweekly|monthly",
  "disconfirmSignals": [
    {
      "signal": "否定信号描述",
      "description": "信号说明",
      "severity": "critical|high|medium|low",
      "response": "应对措施"
    }
  ],
  "actionHints": [
    {
      "scenario": "场景描述",
      "suggestedAction": "建议行动",
      "rationale": "行动理由",
      "priority": "high|medium|low"
    }
  ],
  "notes": "总体备注说明"
}

【重要规则】
1. watchItems至少返回3个监控项，每个都要有具体的指标和阈值
2. triggerConditions至少返回2个触发条件
3. disconfirmSignals至少返回2个否定投资逻辑的信号
4. actionHints至少返回2个场景应对建议
5. reviewFrequency根据股票特性选择合适的频率
6. 只返回JSON，不要包含任何解释或其他内容`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Kimi API error:', response.status, errorText)
        throw new Error(`Kimi API error: ${response.status}`)
      }

      const data = await response.json()

      // 解析 Kimi 的响应
      const content = data.choices?.[0]?.message?.content || ''
      console.log('Kimi Monitor Plan raw response:', content)

      // 尝试解析JSON
      let parsed
      try {
        // 尝试直接解析
        parsed = JSON.parse(content)
      } catch {
        // 如果失败，尝试提取JSON块
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                         content.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1])
          } catch {
            console.warn('Failed to parse JSON from content')
            return this.generateFallbackMonitorPlan(thesisData)
          }
        } else {
          console.warn('No JSON found in response')
          return this.generateFallbackMonitorPlan(thesisData)
        }
      }

      // 验证并补充必要字段
      return this.validateAndFillMonitorPlan(parsed, thesisData)

    } catch (error) {
      console.error('LLM MonitorPlan Service error:', error)
      // API调用失败时使用fallback
      return this.generateFallbackMonitorPlan(thesisData)
    }
  }

  /**
   * 验证并填充MonitorPlan数据
   */
  private validateAndFillMonitorPlan(data: any, thesisData: any): any {
    const defaultPlan = this.generateFallbackMonitorPlan(thesisData)

    // 处理watchItems
    const watchItems = Array.isArray(data?.watchItems) && data.watchItems.length > 0
      ? data.watchItems.slice(0, 6).map((item: any, idx: number) => ({
          title: item.title || `监控项${idx + 1}`,
          metric: item.metric || '',
          threshold: item.threshold || '',
          source: item.source || '',
          frequency: ['realtime', 'daily', 'weekly', 'monthly', 'quarterly'].includes(item.frequency)
            ? item.frequency : 'weekly',
          priority: ['high', 'medium', 'low'].includes(item.priority)
            ? item.priority : 'medium'
        }))
      : defaultPlan.watchItems

    // 处理triggerConditions
    const triggerConditions = Array.isArray(data?.triggerConditions) && data.triggerConditions.length > 0
      ? data.triggerConditions.slice(0, 4).map((cond: any) => ({
          condition: cond.condition || '',
          description: cond.description || '',
          action: cond.action || '',
          priority: ['high', 'medium', 'low'].includes(cond.priority)
            ? cond.priority : 'medium',
          requiresConfirmation: Boolean(cond.requiresConfirmation),
          confirmationMethod: ['ai', 'manual'].includes(cond.confirmationMethod)
            ? cond.confirmationMethod : 'manual'
        }))
      : defaultPlan.triggerConditions

    // 处理disconfirmSignals
    const disconfirmSignals = Array.isArray(data?.disconfirmSignals) && data.disconfirmSignals.length > 0
      ? data.disconfirmSignals.slice(0, 4).map((sig: any) => ({
          signal: sig.signal || '',
          description: sig.description || '',
          severity: ['critical', 'high', 'medium', 'low'].includes(sig.severity)
            ? sig.severity : 'medium',
          response: sig.response || ''
        }))
      : defaultPlan.disconfirmSignals

    // 处理actionHints
    const actionHints = Array.isArray(data?.actionHints) && data.actionHints.length > 0
      ? data.actionHints.slice(0, 4).map((hint: any) => ({
          scenario: hint.scenario || '',
          suggestedAction: hint.suggestedAction || '',
          rationale: hint.rationale || '',
          priority: ['high', 'medium', 'low'].includes(hint.priority)
            ? hint.priority : 'medium'
        }))
      : defaultPlan.actionHints

    return {
      watchItems,
      triggerConditions,
      reviewFrequency: ['daily', 'weekly', 'biweekly', 'monthly'].includes(data?.reviewFrequency)
        ? data.reviewFrequency : 'weekly',
      disconfirmSignals,
      actionHints,
      notes: data?.notes || defaultPlan.notes
    }
  }

  /**
   * 生成默认的MonitorPlan结构（Fallback）
   */
  private generateFallbackMonitorPlan(thesisData: any): any {
    return {
      watchItems: [
        {
          title: '股价走势监控',
          metric: '股价',
          threshold: '跌破关键支撑位',
          source: '交易所行情',
          frequency: 'daily',
          priority: 'high'
        },
        {
          title: '季度财报',
          metric: '营收和利润增速',
          threshold: '同比下降超过10%',
          source: '公司财报',
          frequency: 'quarterly',
          priority: 'high'
        },
        {
          title: '行业动态',
          metric: '竞争对手动向',
          threshold: '重大技术突破或价格战',
          source: '行业新闻',
          frequency: 'weekly',
          priority: 'medium'
        }
      ],
      triggerConditions: [
        {
          condition: '股价跌破关键支撑位',
          description: '技术面破位',
          action: '减仓或止损',
          priority: 'high',
          requiresConfirmation: true,
          confirmationMethod: 'manual'
        },
        {
          condition: '季度财报大幅低于预期',
          description: '基本面恶化',
          action: '重新评估投资逻辑',
          priority: 'high',
          requiresConfirmation: true,
          confirmationMethod: 'ai'
        }
      ],
      reviewFrequency: 'weekly',
      disconfirmSignals: [
        {
          signal: '核心业务竞争力下降',
          description: '市场份额持续下滑',
          severity: 'critical',
          response: '减仓并重新评估'
        },
        {
          signal: '行业政策重大不利变化',
          description: '监管环境恶化',
          severity: 'high',
          response: '密切关注，必要时减仓'
        }
      ],
      actionHints: [
        {
          scenario: '股价在支撑位获得支撑',
          suggestedAction: '持有或加仓',
          rationale: '技术面确认支撑有效',
          priority: 'medium'
        },
        {
          scenario: '出现重大利好催化剂',
          suggestedAction: '加仓',
          rationale: '催化剂驱动股价上涨',
          priority: 'high'
        }
      ],
      notes: `针对${thesisData.assetName}的监控计划，重点关注基本面和技术面变化`
    }
  }

  /**
   * 生成默认的Thesis结构（Fallback）
   */
  private generateFallbackThesis(input: ThesisInput): any {
    return {
      thesisSummary: `${input.assetName}具有良好的投资价值，建议关注基本面变化`,
      pillars: [
        {
          id: 1,
          name: "基本面支撑",
          coreAssumption: `${input.assetName}的核心业务保持稳定增长`,
          conviction: 6,
          monitorIndicators: [
            { name: "季度营收增速", type: "fundamental", frequency: "quarterly" },
            { name: "毛利率变化", type: "fundamental", frequency: "quarterly" }
          ],
          bullishSignal: "营收和利润持续增长",
          riskTrigger: "核心业务增速放缓"
        },
        {
          id: 2,
          name: "估值合理",
          coreAssumption: "当前估值处于合理区间",
          conviction: 5,
          monitorIndicators: [
            { name: "PE分位数", type: "fundamental", frequency: "daily" },
            { name: "PB分位数", type: "fundamental", frequency: "daily" }
          ],
          bullishSignal: "估值处于历史低位",
          riskTrigger: "估值回到历史高位"
        }
      ],
      pricePhases: [
        {
          period: "当前",
          description: "价格处于合理区间",
          keyLevels: ["支撑位", "阻力位"]
        }
      ],
      fragilePoints: [
        "宏观经济不确定性",
        "行业竞争加剧",
        "政策变化"
      ]
    }
  }

  /**
   * #2: 使用 Kimi LLM 分析数据异常对投资论点的影响
   */
  async analyzeAlertImpact(params: {
    stockCode: string
    stockName: string
    direction: string
    thesisSummary: string
    currentHealthScore: number
    pillarName: string
    coreAssumption: string
    bullishSignal: string
    riskTrigger: string
    indicatorName: string
    changeDescription: string
    dataSource: string
    dataTime: string
  }): Promise<any> {
    const prompt = buildAlertImpactPrompt(params)

    try {
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
              content: `你是一位专业的投资逻辑审计员。你的任务是判断新数据对投资论点的影响，保持客观，不要过度解读单一数据点。`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Kimi API error:', response.status, errorText)
        throw new Error(`Kimi API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      console.log('Kimi AlertImpact raw response:', content)

      // 解析 JSON
      let parsed
      try {
        parsed = JSON.parse(content)
      } catch {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                         content.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1])
          } catch {
            console.warn('Failed to parse JSON from content')
            return this.generateFallbackAlertImpact(params)
          }
        } else {
          console.warn('No JSON found in response')
          return this.generateFallbackAlertImpact(params)
        }
      }

      // 验证并填充
      return this.validateAndFillAlertImpact(parsed, params)

    } catch (error) {
      console.error('LLM AlertImpact error:', error)
      return this.generateFallbackAlertImpact(params)
    }
  }

  /**
   * 验证并填充 AlertImpact 数据
   */
  private validateAndFillAlertImpact(data: any, params: any): any {
    const defaultImpact = this.generateFallbackAlertImpact(params)

    return {
      impactDirection: ['bullish', 'neutral', 'bearish'].includes(data?.impact_direction)
        ? data.impact_direction : 'neutral',
      impactScore: Math.min(10, Math.max(1, parseInt(data?.impact_score) || 5)),
      reasoning: data?.reasoning || defaultImpact.reasoning,
      assumptionStatus: ['intact', 'weakened', 'falsified'].includes(data?.assumption_status)
        ? data.assumption_status : 'intact',
      suggestedAction: data?.suggested_action || defaultImpact.suggestedAction,
      newHealthScore: Math.min(100, Math.max(0, parseInt(data?.new_health_score) || params.currentHealthScore)),
      healthScoreChange: parseInt(data?.health_score_change) || 0,
      followUpWatch: data?.follow_up_watch || defaultImpact.followUpWatch,
      alertLevel: ['info', 'warning', 'critical'].includes(data?.alert_level)
        ? data.alert_level : 'info'
    }
  }

  /**
   * 生成默认的 AlertImpact 结构（Fallback）
   */
  private generateFallbackAlertImpact(params: any): any {
    return {
      impactDirection: 'neutral',
      impactScore: 5,
      reasoning: `数据变化（${params.indicatorName}: ${params.changeDescription}）需要进一步观察。`,
      assumptionStatus: 'intact',
      suggestedAction: '密切关注',
      newHealthScore: params.currentHealthScore,
      healthScoreChange: 0,
      followUpWatch: '等待下一个关键数据节点验证',
      alertLevel: 'info'
    }
  }

  /**
   * #3: 使用 Kimi LLM 生成每日/每周投资监控简报
   */
  async generateDailySummary(params: {
    portfoliosJson: string
    todayDataChangesJson: string
    date?: string
  }): Promise<any> {
    const prompt = buildDailySummaryPrompt(params)

    try {
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
              content: `你是用户的私人投资顾问助理，负责生成每日投资监控简报。语言简洁有力。`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Kimi API error:', response.status, errorText)
        throw new Error(`Kimi API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      console.log('Kimi DailySummary raw response:', content)

      // 解析 JSON
      let parsed
      try {
        parsed = JSON.parse(content)
      } catch {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                         content.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1])
          } catch {
            console.warn('Failed to parse JSON from content')
            return this.generateFallbackDailySummary()
          }
        } else {
          console.warn('No JSON found in response')
          return this.generateFallbackDailySummary()
        }
      }

      // 验证并填充
      return this.validateAndFillDailySummary(parsed)

    } catch (error) {
      console.error('LLM DailySummary error:', error)
      return this.generateFallbackDailySummary()
    }
  }

  /**
   * 验证并填充 DailySummary 数据
   */
  private validateAndFillDailySummary(data: any): any {
    const today = new Date().toISOString().split('T')[0]

    return {
      date: data?.date || today,
      summary: data?.summary || '今日投资组合整体稳定，论点健康度良好。',
      criticalAlerts: Array.isArray(data?.critical_alerts) ? data.critical_alerts : [],
      notableChanges: Array.isArray(data?.notable_changes) ? data.notable_changes : [],
      noChangeStocks: Array.isArray(data?.no_change_stocks) ? data.no_change_stocks : [],
      upcomingEvents: Array.isArray(data?.upcoming_events) ? data.upcoming_events : []
    }
  }

  /**
   * 生成默认的 DailySummary 结构（Fallback）
   */
  private generateFallbackDailySummary(): any {
    const today = new Date().toISOString().split('T')[0]
    return {
      date: today,
      summary: '今日投资组合整体稳定，论点健康度良好。',
      criticalAlerts: [],
      notableChanges: [],
      noChangeStocks: [],
      upcomingEvents: []
    }
  }

  /**
   * #6: 使用 Kimi LLM 生成反向论证（Devil's Advocate）
   */
  async generateDevilsAdvocate(params: {
    stockCode: string
    stockName: string
    direction: string
    thesisSummary: string
    pillarsJson: string
  }): Promise<any> {
    const prompt = buildDevilsAdvocatePrompt(params)

    try {
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
              content: `你是一位专业的投资"魔鬼代言人"。你的任务是找到反对用户投资论点的最强证据和逻辑，保持客观，不要为了反对而反对。`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Kimi API error:', response.status, errorText)
        throw new Error(`Kimi API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      console.log('Kimi DevilsAdvocate raw response:', content)

      // 解析 JSON
      let parsed
      try {
        parsed = JSON.parse(content)
      } catch {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                         content.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1])
          } catch {
            console.warn('Failed to parse JSON from content')
            return this.generateFallbackDevilsAdvocate(params)
          }
        } else {
          console.warn('No JSON found in response')
          return this.generateFallbackDevilsAdvocate(params)
        }
      }

      // 验证并填充
      return this.validateAndFillDevilsAdvocate(parsed, params)

    } catch (error) {
      console.error('LLM DevilsAdvocate error:', error)
      return this.generateFallbackDevilsAdvocate(params)
    }
  }

  /**
   * 验证并填充 DevilsAdvocate 数据
   */
  private validateAndFillDevilsAdvocate(data: any, params: any): any {
    return {
      overallCounterThesis: data?.overall_counter_thesis || '反对观点总结',
      riskScore: Math.min(100, Math.max(0, parseInt(data?.risk_score) || 50)),
      challenges: Array.isArray(data?.challenges) ? data.challenges : [],
      blindSpots: Array.isArray(data?.blind_spots) ? data.blind_spots : [],
      keyQuestion: data?.key_question || '核心问题待确定'
    }
  }

  /**
   * 生成默认的 DevilsAdvocate 结构（Fallback）
   */
  private generateFallbackDevilsAdvocate(params: any): any {
    return {
      overallCounterThesis: `需要进一步分析${params.stockName}的风险`,
      riskScore: 50,
      challenges: [
        {
          target_assumption: '核心假设待验证',
          counter_argument: '该假设可能面临市场环境和竞争格局的挑战',
          counter_evidence: '需要更多数据支持',
          probability: '中',
          worst_case_impact: '可能导致股价下跌20%以上'
        }
      ],
      blindSpots: [
        '可能存在被忽视的风险因素',
        '宏观环境影响可能被低估'
      ],
      keyQuestion: `${params.stockName}的核心竞争力能否持续？`
    }
  }
}

export const llmService = new LLMService()
