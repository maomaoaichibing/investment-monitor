import { ThesisInput, ThesisOutput } from '@/server/services/thesisService'
import { buildThesisPrompt } from './prompts/thesisPrompt'
import { ThesisSchema } from '@/lib/schemas/thesisSchema'

export class LLMService {
  /**
   * 模拟LLM生成投资论题
   * 实际项目中可替换为OpenAI、Claude等真实API调用
   */
  async generateThesis(input: ThesisInput): Promise<any> {
    // 构建提示词
    const prompt = buildThesisPrompt(input)
    
    // 模拟LLM响应（实际项目中使用真实API）
    const mockResponse = this.generateMockThesis(input)
    
    // 解析响应（实际项目中解析API返回的JSON）
    try {
      // 模拟JSON解析
      const parsed = JSON.parse(mockResponse)
      return parsed
    } catch (error) {
      // 如果解析失败，返回默认结构
      console.warn('Failed to parse mock response, using fallback')
      return this.generateFallbackThesis(input)
    }
  }

  /**
   * 生成模拟的Thesis响应
   */
  private generateMockThesis(input: ThesisInput): string {
    const { symbol } = input
    
    const templates: Record<string, any> = {
      'NVDA': {
        summary: "NVIDIA是AI计算革命的领导者，其GPU产品在数据中心和AI训练领域占据绝对主导地位。核心投资逻辑在于AI基础设施的持续扩张和软件生态的深化。",
        pricePhases: [
          {
            phase: "AI驱动主升浪",
            description: "受益于全球AI投资热潮，机构资金持续流入",
            keyLevels: ["$450支撑", "$520阻力"]
          },
          {
            phase: "技术性盘整",
            description: "估值达到高位后需要时间消化，等待基本面验证",
            keyLevels: ["$480关键位"]
          }
        ],
        coreThesis: [
          {
            title: "AI基础设施核心供应商",
            description: "NVIDIA GPU是AI训练和推理的黄金标准，生态系统护城河深厚",
            conviction: 9
          },
          {
            title: "软件转型提升估值",
            description: "CUDA生态系统和AI软件服务创造高毛利、可持续的收入来源",
            conviction: 8
          }
        ],
        fragilePoints: [
          "地缘政治风险（出口管制）",
          "竞争加剧（AMD、Intel、国产替代）",
          "估值过高，需要业绩持续超预期支撑",
          "单一客户依赖（大型云厂商）"
        ],
        monitorTargets: [
          {
            type: "业绩指引",
            condition: "下季度数据中心营收增速低于30%",
            action: "重新评估增长预期"
          },
          {
            type: "技术面",
            condition: "股价跌破$450关键支撑",
            action: "部分减仓，等待企稳"
          },
          {
            type: "竞争动态",
            condition: "AMD MI300系列市场份额超预期",
            action: "评估竞争格局变化"
          }
        ]
      },
      'AAPL': {
        summary: "苹果作为消费电子巨头向服务转型，硬件生态优势带来稳定现金流，服务业务成为第二增长曲线。但面临中国市场压力和创新瓶颈。",
        pricePhases: [
          {
            phase: "盘整期",
            description: "硬件销售增长放缓，估值修复需要新催化剂",
            keyLevels: ["$170支撑", "$190阻力"]
          }
        ],
        coreThesis: [
          {
            title: "生态系统护城河",
            description: "硬件+软件+服务的闭环生态创造高用户粘性和转换成本",
            conviction: 8
          }
        ],
        fragilePoints: [
          "中国市场销售持续下滑",
          "智能手机市场饱和",
          "AI功能落后竞争对手",
          "监管压力加大"
        ],
        monitorTargets: [
          {
            type: "中国市场",
            condition: "大中华区收入同比下降超20%",
            action: "评估中国市场战略"
          }
        ]
      }
    }

    // 返回对应模板或默认
    const template = templates[symbol] || this.generateFallbackThesis(input)
    return JSON.stringify(template)
  }

  /**
   * 生成默认的Thesis结构
   */
  private generateFallbackThesis(input: ThesisInput): any {
    return {
      summary: `基于${input.assetName}(${input.symbol})的基本面和技术面分析，存在结构性投资机会。`,
      pricePhases: [
        {
          phase: "当前阶段",
          description: "价格处于合理区间，等待催化剂",
          keyLevels: ["关键支撑位", "重要阻力位"]
        }
      ],
      coreThesis: [
        {
          title: "核心投资逻辑",
          description: "标的在所处行业中具有相对优势或独特价值",
          conviction: 6
        }
      ],
      fragilePoints: [
        "宏观经济风险",
        "行业竞争加剧",
        "政策变化不确定性"
      ],
      monitorTargets: [
        {
          type: "价格监控",
          condition: "跌破关键技术位",
          action: "重新评估持仓理由"
        },
        {
          type: "基本面",
          condition: "季度业绩不及预期",
          action: "调整盈利预期"
        }
      ]
    }
  }
}

export const llmService = new LLMService()