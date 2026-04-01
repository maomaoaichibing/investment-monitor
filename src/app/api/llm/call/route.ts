import { NextRequest, NextResponse } from 'next/server'
import { llmMultiProviderService } from '@/server/services/llmMultiProviderService'
import { LLMRequestSchema } from '@/lib/schemas/llmSchema'
import { z } from 'zod'

/**
 * POST /api/llm/call
 * 调用LLM API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证请求数据
    const validatedData = LLMRequestSchema.parse(body)

    // 调用LLM
    const response = await llmMultiProviderService.callLLM(validatedData)

    if (!response.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'LLM调用失败',
          message: response.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: response.data,
      cost: response.cost
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '数据验证失败',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('LLM调用失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'LLM调用失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}