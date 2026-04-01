import { NextRequest, NextResponse } from 'next/server'
import { llmMultiProviderService } from '@/server/services/llmMultiProviderService'
import { BatchAnalysisRequestSchema } from '@/lib/schemas/llmSchema'
import { z } from 'zod'

/**
 * POST /api/llm/batch
 * 批量调用LLM API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证请求数据
    const validatedData = BatchAnalysisRequestSchema.parse(body)

    // 执行批量分析
    const result = await llmMultiProviderService.batchAnalyze(validatedData)

    return NextResponse.json({
      success: true,
      data: result
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

    console.error('批量分析失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '批量分析失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}