import { z } from 'zod'
import {
  LLMProvider,
  LLMConfig,
  LLMRequest,
  LLMResponse,
  BatchAnalysisRequest,
  BatchAnalysisResult
} from '@/lib/schemas/llmSchema'

interface LLMProviderConfig {
  baseUrl: string
  apiKey: string
  defaultModel: string
  models: string[]
  maxTokensLimit: number
}

const PROVIDER_CONFIGS: Record<LLMProvider, LLMProviderConfig> = {
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKey: process.env.KIMI_API_KEY || 'sk-5lKs7u9Q5FTWUpRd8SHneXmNt9ER51puxbyv7rY5I5YjY3oX',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    maxTokensLimit: 128000
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'gpt-4',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    maxTokensLimit: 128000
  },
  claude: {
    baseUrl: 'https://api.anthropic.com',
    apiKey: process.env.CLAUDE_API_KEY || '',
    defaultModel: 'claude-3-opus-20240229',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    maxTokensLimit: 200000
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder'],
    maxTokensLimit: 32000
  },
  local: {
    baseUrl: process.env.LOCAL_LLM_URL || 'http://localhost:11434/v1',
    apiKey: 'ollama',
    defaultModel: 'llama2',
    models: ['llama2', 'codellama', 'mistral'],
    maxTokensLimit: 4096
  }
}

// 价格计算（每1K tokens的价格，单位：美元）
const PRICING: Record<string, { input: number; output: number }> = {
  'moonshot-v1-8k': { input: 0.012, output: 0.012 },
  'moonshot-v1-32k': { input: 0.024, output: 0.024 },
  'moonshot-v1-128k': { input: 0.048, output: 0.048 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  'deepseek-chat': { input: 0.00014, output: 0.00028 },
  'deepseek-coder': { input: 0.00014, output: 0.00028 },
  'llama2': { input: 0, output: 0 },
  'codellama': { input: 0, output: 0 },
  'mistral': { input: 0, output: 0 }
}

/**
 * LLM多提供商服务
 * 支持Kimi、OpenAI、Claude、DeepSeek等多个LLM提供商
 */
export class LLMMultiProviderService {
  private configs: Map<LLMProvider, LLMConfig> = new Map()

  constructor() {
    // 初始化默认配置
    Object.entries(PROVIDER_CONFIGS).forEach(([provider, config]) => {
      this.configs.set(provider as LLMProvider, {
        provider: provider as LLMProvider,
        model: config.defaultModel,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        temperature: 0.3,
        maxTokens: 2000,
        timeout: 30000
      })
    })
  }

  /**
   * 调用LLM API
   */
  async callLLM(request: LLMRequest, config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const provider = request.provider
    const providerConfig = PROVIDER_CONFIGS[provider]
    const actualConfig = { ...this.configs.get(provider), ...config }

    if (!actualConfig.apiKey) {
      return {
        success: false,
        error: `API key not configured for provider: ${provider}`
      }
    }

    try {
      const startTime = Date.now()
      let response
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }

      // 根据不同提供商调用不同的API
      switch (provider) {
        case 'kimi':
        case 'openai':
        case 'deepseek':
        case 'local':
          response = await this.callOpenAICompatibleAPI(request, this.mergeConfig(provider, actualConfig))
          usage = response.usage || usage
          break
        case 'claude':
          response = await this.callClaudeAPI(request, this.mergeConfig(provider, actualConfig))
          usage = response.usage || usage
          break
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }

      const duration = Date.now() - startTime
      const cost = this.calculateCost(request.model, usage)

      return {
        success: true,
        data: {
          content: response.content,
          usage,
          model: request.model,
          provider: request.provider
        },
        cost
      }
    } catch (error) {
      console.error(`LLM API call failed for provider ${provider}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 调用OpenAI兼容API（Kimi、OpenAI、DeepSeek、Local）
   */
  private async callOpenAICompatibleAPI(
    request: LLMRequest,
    config: LLMConfig
  ): Promise<{ content: string; usage?: any }> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || config.temperature,
        max_tokens: request.maxTokens || config.maxTokens,
        stream: request.stream
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.choices[0].message.content,
      usage: data.usage
    }
  }

  /**
   * 调用Claude API
   */
  private async callClaudeAPI(
    request: LLMRequest,
    config: LLMConfig
  ): Promise<{ content: string; usage?: any }> {
    // Claude API使用不同的消息格式
    const claudeMessages = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))

    const response = await fetch(`${config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model,
        messages: claudeMessages,
        max_tokens: request.maxTokens || config.maxTokens,
        temperature: request.temperature || config.temperature,
        stream: request.stream
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.content[0].text,
      usage: data.usage
    }
  }

  /**
   * 批量分析
   */
  async batchAnalyze(request: BatchAnalysisRequest): Promise<BatchAnalysisResult> {
    const { items, batchSize, parallel, config } = request
    const results = []
    let successCount = 0
    let failedCount = 0
    const startTime = Date.now()

    if (parallel) {
      // 并行处理
      const batches = []
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize))
      }

      await Promise.all(
        batches.map(async (batch) => {
          for (const item of batch) {
            try {
              const result = await this.analyzeItem(item, config)
              results.push({ item, success: true, data: result })
              successCount++
            } catch (error) {
              results.push({
                item,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
              failedCount++
            }
          }
        })
      )
    } else {
      // 串行处理
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)

        for (const item of batch) {
          try {
            const result = await this.analyzeItem(item, config)
            results.push({ item, success: true, data: result })
            successCount++
          } catch (error) {
            results.push({
              item,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
            failedCount++
          }
        }

        // 批次间添加延迟，避免速率限制
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    const duration = Date.now() - startTime
    const cost = results.reduce((sum, r) => sum + (r.data?.cost || 0), 0)

    return {
      total: items.length,
      success: successCount,
      failed: failedCount,
      results,
      cost,
      duration
    }
  }

  /**
   * 分析单个项目
   */
  private async analyzeItem(item: any, config?: Partial<LLMConfig>): Promise<any> {
    // 这里可以根据不同的item类型调用不同的分析逻辑
    const template = item.template || 'Default analysis for: {content}'
    const content = typeof item === 'string' ? item : JSON.stringify(item)
    const prompt = template.replace('{content}', content)

    const request: LLMRequest = {
      provider: config?.provider || LLMProvider.KIMI,
      model: config?.model || 'moonshot-v1-8k',
      messages: [
        {
          role: 'system',
          content: 'You are a professional financial analyst. Analyze the following content and provide insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config?.temperature || 0.3,
      maxTokens: config?.maxTokens || 2000,
      responseFormat: 'text',
      stream: false
    }

    const response = await this.callLLM(request, config)

    if (!response.success) {
      throw new Error(response.error)
    }

    return response.data
  }

  /**
   * 计算成本
   */
  private calculateCost(model: string, usage: { promptTokens: number; completionTokens: number }): number {
    const pricing = PRICING[model]
    if (!pricing) return 0

    const inputCost = (usage.promptTokens / 1000) * pricing.input
    const outputCost = (usage.completionTokens / 1000) * pricing.output

    return inputCost + outputCost
  }

  /**
   * 合并配置（确保所有必需字段都有值）
   */
  private mergeConfig(provider: LLMProvider, config?: Partial<LLMConfig>): LLMConfig {
    const defaultConfig = this.configs.get(provider)
    const providerDefaults = PROVIDER_CONFIGS[provider]
    
    return {
      provider: provider,
      model: config?.model || defaultConfig?.model || providerDefaults.defaultModel,
      apiKey: config?.apiKey || defaultConfig?.apiKey || providerDefaults.apiKey || '',
      baseUrl: config?.baseUrl || defaultConfig?.baseUrl || providerDefaults.baseUrl || '',
      temperature: config?.temperature ?? defaultConfig?.temperature ?? 0.3,
      maxTokens: config?.maxTokens ?? defaultConfig?.maxTokens ?? 2000,
      timeout: config?.timeout ?? defaultConfig?.timeout ?? 30000,
      topP: config?.topP ?? defaultConfig?.topP ?? 1,
      frequencyPenalty: config?.frequencyPenalty ?? defaultConfig?.frequencyPenalty ?? 0,
      presencePenalty: config?.presencePenalty ?? defaultConfig?.presencePenalty ?? 0
    }
  }

  /**
   * 获取提供商配置
   */
  getProviderConfig(provider: LLMProvider): LLMProviderConfig | null {
    return PROVIDER_CONFIGS[provider] || null
  }

  /**
   * 列出所有可用的提供商
   */
  listProviders(): Array<{
    provider: LLMProvider
    name: string
    models: string[]
    isConfigured: boolean
  }> {
    return Object.entries(PROVIDER_CONFIGS).map(([provider, config]) => ({
      provider: provider as LLMProvider,
      name: this.getProviderName(provider as LLMProvider),
      models: config.models,
      isConfigured: !!config.apiKey
    }))
  }

  /**
   * 获取提供商显示名称
   */
  private getProviderName(provider: LLMProvider): string {
    const names: Record<LLMProvider, string> = {
      kimi: 'Kimi (月之暗面)',
      openai: 'OpenAI',
      claude: 'Claude (Anthropic)',
      deepseek: 'DeepSeek',
      local: '本地模型 (Ollama)'
    }
    return names[provider] || provider
  }

  /**
   * 更新提供商配置
   */
  updateProviderConfig(provider: LLMProvider, config: Partial<LLMConfig>): void {
    const existingConfig = this.configs.get(provider)
    if (existingConfig) {
      this.configs.set(provider, { ...existingConfig, ...config })
    }
  }

  /**
   * 测试提供商连接
   */
  async testProvider(provider: LLMProvider): Promise<boolean> {
    try {
      const config = this.configs.get(provider)
      if (!config?.apiKey) return false

      const request: LLMRequest = {
        provider,
        model: config.model,
        messages: [
          {
            role: 'user',
            content: 'Hello, are you working?'
          }
        ],
        maxTokens: 10,
        responseFormat: 'text',
        stream: false
      }

      const response = await this.callLLM(request)
      return response.success
    } catch (error) {
      console.error(`Test failed for provider ${provider}:`, error)
      return false
    }
  }
}

// 导出服务实例
export const llmMultiProviderService = new LLMMultiProviderService()