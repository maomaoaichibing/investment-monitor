import { ThesisInput } from '@/server/services/thesisService'
import { buildThesisPrompt } from './prompts/thesisPrompt'

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
- 每个议题包含：核心假设、监控指标、看多信号、风险触发条件

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
      "bullishSignal": "什么数据/事件说明逻辑成立",
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
2. 每个议题的monitorIndicators必须包含2-4个具体指标
3. conviction是1-10的数字，表示对这个议题的信心度
4. 所有type必须是：fundamental, industry, macro, technical, sentiment, price 之一
5. frequency必须是：realtime, daily, weekly, monthly, quarterly 之一
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

    // 处理议题树格式
    const pillars = Array.isArray(data?.pillars) && data.pillars.length > 0
      ? data.pillars.map((p: any, idx: number) => ({
          id: p.id || idx + 1,
          name: p.name || `议题${idx + 1}`,
          coreAssumption: p.coreAssumption || '',
          conviction: Math.min(10, Math.max(1, parseInt(p.conviction) || 5)),
          monitorIndicators: Array.isArray(p.monitorIndicators)
            ? p.monitorIndicators.slice(0, 4).map((i: any) => ({
                name: i.name || '',
                type: ['fundamental', 'industry', 'macro', 'technical', 'sentiment', 'price'].includes(i.type)
                  ? i.type : 'fundamental',
                frequency: ['realtime', 'daily', 'weekly', 'monthly', 'quarterly'].includes(i.frequency)
                  ? i.frequency : 'weekly',
                dataSource: i.dataSource || ''
              }))
            : [],
          bullishSignal: p.bullishSignal || '',
          riskTrigger: p.riskTrigger || ''
        }))
      : defaultThesis.pillars

    return {
      thesisSummary: data?.thesisSummary || defaultThesis.thesisSummary,
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
}

export const llmService = new LLMService()
