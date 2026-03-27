import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { llmService } from '@/server/llm/llmService'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const thesisId = searchParams.get('thesisId')

  if (!thesisId) {
    return NextResponse.json(
      { success: false, error: '缺少 thesisId 参数' },
      { status: 400 }
    )
  }

  try {
    // 获取 thesis
    const thesis = await db.thesis.findUnique({
      where: { id: thesisId },
      include: {
        position: {
          select: {
            symbol: true,
            assetName: true
          }
        }
      }
    })

    if (!thesis) {
      return NextResponse.json(
        { success: false, error: 'Thesis 不存在' },
        { status: 404 }
      )
    }

    console.log(`[DevilsAdvocate] Generating for ${thesis.position.assetName} (${thesis.position.symbol})...`)

    // 调用 LLM 生成反向论证
    const result = await llmService.generateDevilsAdvocate({
      stockCode: thesis.position.symbol,
      stockName: thesis.position.assetName,
      direction: 'long',
      thesisSummary: thesis.summary,
      pillarsJson: thesis.pillarsJson || '[]'
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[DevilsAdvocate] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '生成反向论证失败',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
