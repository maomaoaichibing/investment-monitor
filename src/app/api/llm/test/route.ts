import { NextRequest, NextResponse } from 'next/server'
import { llmMultiProviderService } from '@/server/services/llmMultiProviderService'
import { z } from 'zod'

const TestProviderSchema = z.object({
  provider: z.enum(['kimi', 'openai', 'claude', 'deepseek', 'local'])
})

/**
 * POST /api/llm/test
 * 测试LLM提供商的连接
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider } = TestProviderSchema.parse(body)

    const isConnected = await llmMultiProviderService.testProvider(provider)

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: '连接成功'
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: '连接失败，请检查API密钥和网络设置'
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('测试LLM提供商失败:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '参数验证失败',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: '测试LLM提供商失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}