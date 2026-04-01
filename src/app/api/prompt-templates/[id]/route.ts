import { NextRequest, NextResponse } from 'next/server'
import { promptTemplateService } from '@/server/services/promptTemplateService'
import { UpdatePromptTemplateSchema } from '@/lib/schemas/llmSchema'
import { z } from 'zod'

/**
 * GET /api/prompt-templates/:id
 * 获取Prompt模板详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '模板ID不能为空'
        },
        { status: 400 }
      )
    }

    // 获取模板详情
    const template = await promptTemplateService.getTemplateById(id)

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: '模板不存在'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { template }
    })
  } catch (error) {
    console.error('获取Prompt模板详情失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取Prompt模板详情失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/prompt-templates/:id
 * 更新Prompt模板
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '模板ID不能为空'
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    // 验证请求数据
    const validatedData = UpdatePromptTemplateSchema.parse(body)

    // 更新模板
    const template = await promptTemplateService.updateTemplate(id, validatedData)

    return NextResponse.json({
      success: true,
      data: { template },
      message: 'Prompt模板更新成功'
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

    console.error('更新Prompt模板失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '更新Prompt模板失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: error instanceof Error && error.message === '模板不存在' ? 404 : 500 }
    )
  }
}

/**
 * DELETE /api/prompt-templates/:id
 * 删除Prompt模板
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: '模板ID不能为空'
        },
        { status: 400 }
      )
    }

    // 删除模板
    await promptTemplateService.deleteTemplate(id)

    return NextResponse.json({
      success: true,
      message: 'Prompt模板删除成功'
    })
  } catch (error) {
    console.error('删除Prompt模板失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '删除Prompt模板失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: error instanceof Error && error.message === '模板不存在' ? 404 : 500 }
    )
  }
}