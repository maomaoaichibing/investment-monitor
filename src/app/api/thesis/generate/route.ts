import { NextRequest, NextResponse } from 'next/server'
import { thesisService } from '@/server/services/thesisService'
import { GenerateThesisInputSchema } from '@/lib/schemas/thesisSchema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = GenerateThesisInputSchema.parse(body)
    
    // 为持仓生成Thesis（幂等实现）
    const result = await thesisService.generateThesisForPosition(validatedData.positionId)
    
    // 根据创建状态返回不同状态码
    if (result.created) {
      // 新创建的thesis，返回201 Created
      return NextResponse.json({
        success: true,
        data: {
          ...result.thesis,
          source: result.source,
          created: result.created
        },
        message: '投资论题生成成功'
      }, { status: 201 })
    } else {
      // 已存在thesis，返回200 OK（幂等）
      return NextResponse.json({
        success: true,
        data: {
          ...result.thesis,
          source: result.source,
          created: result.created,
          message: '投资论题已存在，直接返回已有记录'
        },
        message: '投资论题已存在，直接返回已有记录'
      }, { status: 200 })
    }
    
  } catch (error) {
    console.error('Error generating thesis:', error)
    
    // Zod验证错误
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      )
    }
    
    // 持仓不存在
    if (error instanceof Error && error.message === 'Position not found') {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      )
    }
    
    // 其他错误
    return NextResponse.json(
      { error: 'Failed to generate thesis', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}