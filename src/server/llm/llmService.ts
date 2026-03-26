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
              content: `你是一位专业的投资分析师，擅长分析股票的投资价值。请根据用户提供的股票信息，生成结构化的投资论题。

必须严格按以下JSON格式返回，不要包含任何其他内容：
{
  "summary": "简短摘要（50-100字）",
  "pricePhases": [
    {"phase": "阶段名称", "description": "阶段描述", "keyLevels": ["关键价位1", "关键价位2"]}
  ],
  "coreThesis": [
    {"title": "论题标题", "description": "论题描述", "conviction": 1-10的整数}
  ],
  "fragilePoints": ["脆弱点1", "脆弱点2", "脆弱点3"],
  "monitorTargets": [
    {"type": "price|fundamental|technical|event|other", "condition": "触发条件", "action": "建议行动"}
  ]
}

注意：
- monitorTargets中的type必须是：price, fundamental, technical, event, other 之一
- conviction必须是1-10的数字
- 返回的必须是合法的JSON格式`
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

    return {
      summary: data?.summary || defaultThesis.summary,
      pricePhases: Array.isArray(data?.pricePhases) && data.pricePhases.length > 0
        ? data.pricePhases.map((p: any) => ({
            phase: p.phase || '未知阶段',
            description: p.description || '',
            keyLevels: Array.isArray(p.keyLevels) ? p.keyLevels : []
          }))
        : defaultThesis.pricePhases,
      coreThesis: Array.isArray(data?.coreThesis) && data.coreThesis.length > 0
        ? data.coreThesis.map((t: any) => ({
            title: t.title || '核心论题',
            description: t.description || '',
            conviction: Math.min(10, Math.max(1, parseInt(t.conviction) || 5))
          }))
        : defaultThesis.coreThesis,
      fragilePoints: Array.isArray(data?.fragilePoints) && data.fragilePoints.length > 0
        ? data.fragilePoints.slice(0, 5)
        : defaultThesis.fragilePoints,
      monitorTargets: Array.isArray(data?.monitorTargets) && data.monitorTargets.length > 0
        ? data.monitorTargets.slice(0, 4).map((t: any) => ({
            type: ['price', 'fundamental', 'technical', 'event', 'other'].includes(t.type)
              ? t.type
              : 'other',
            condition: t.condition || '',
            action: t.action || ''
          }))
        : defaultThesis.monitorTargets
    }
  }

  /**
   * 生成默认的Thesis结构（Fallback）
   */
  private generateFallbackThesis(input: ThesisInput): any {
    return {
      summary: `基于${input.assetName}(${input.symbol})的基本面和技术面分析，存在结构性投资机会。建议关注公司核心竞争力和行业趋势。`,
      pricePhases: [
        {
          phase: "当前价格区间",
          description: "价格处于合理估值区间，等待市场催化剂",
          keyLevels: ["关键支撑位", "重要阻力位"]
        }
      ],
      coreThesis: [
        {
          title: "核心投资逻辑",
          description: `${input.assetName}在所处行业中具有相对优势或独特价值，值得长期关注`,
          conviction: 6
        }
      ],
      fragilePoints: [
        "宏观经济不确定性风险",
        "行业竞争加剧",
        "政策监管变化",
        "估值波动风险"
      ],
      monitorTargets: [
        {
          type: "price",
          condition: "股价跌破关键技术支撑位",
          action: "重新评估持仓风险"
        },
        {
          type: "fundamental",
          condition: "季度业绩大幅不及预期",
          action: "调整盈利预测"
        },
        {
          type: "event",
          condition: "行业重大政策变化",
          action: "评估对公司的影响"
        }
      ]
    }
  }
}

export const llmService = new LLMService()
