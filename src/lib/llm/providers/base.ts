export interface LLMProvider {
  generateWithModel<T>(params: {
    model: string
    prompt: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    responseFormat?: {
      type: 'json_schema'
      json_schema: any
    }
  }): Promise<T>
}

export interface MockLLMProvider extends LLMProvider {
  setMockResponse<T>(response: T): void
  clearMockResponse(): void
}

// Base abstract class for LLM providers
export abstract class BaseLLMProvider implements LLMProvider {
  abstract generateWithModel<T>(params: {
    model: string
    prompt: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    responseFormat?: {
      type: 'json_schema'
      json_schema: any
    }
  }): Promise<T>

  protected validateJsonResponse<T>(response: string, schema?: any): T {
    try {
      const parsed = JSON.parse(response)
      
      if (schema) {
        // TODO: Implement Zod validation if needed
        // For now, just return parsed
      }
      
      return parsed
    } catch (error) {
      throw new Error(`Failed to parse LLM response as JSON: ${error}`)
    }
  }
}