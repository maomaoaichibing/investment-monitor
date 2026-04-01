import { NextRequest, NextResponse } from 'next/server'
import { promptTemplateService } from '@/server/services/promptTemplateService'
import { CreatePromptTemplateSchema, UpdatePromptTemplateSchema } from '@/lib/schemas/llmSchema'
import { z } from 'zod'

/**
 * GET /api/prompt-templates
 * 获取Prompt模板列表
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // 解析查询参数
    const query = {
      modelType: searchParams.get('modelType') as any || undefined,
      provider: searchParams.get('provider') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    }

    // 获取模板列表
    const result = await promptTemplateService.getTemplates(query)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('获取Prompt模板列表失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取Prompt模板列表失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/prompt-templates
 * 创建Prompt模板
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证请求数据
    const validatedData = CreatePromptTemplateSchema.parse(body)

    // 创建模板
    const template = await promptTemplateService.createTemplate(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: { template },
        message: 'Prompt模板创建成功'
      },
      { status: 201 }
    )
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

    console.error('创建Prompt模板失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '创建Prompt模板失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}