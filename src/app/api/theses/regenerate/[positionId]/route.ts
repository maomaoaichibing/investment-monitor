import { NextRequest } from 'next/server'
import { thesisService } from '@/server/services/thesisService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/theses/regenerate/[positionId] - 重新生成指定持仓的投资论题
export async function POST(
  req: NextRequest,
  { params }: { params: { positionId: string } }
) {
  try {
    const { positionId } = params

    if (!positionId) {
      return Response.json(
        { success: false, error: '缺少 positionId 参数' },
        { status: 400 }
      )
    }

    console.log(`[API] Regenerating thesis for position: ${positionId}`)
    const result = await thesisService.regenerateThesisForPosition(positionId)

    return Response.json({
      success: true,
      data: {
        thesis: result.thesis,
        message: `成功重新生成 ${result.thesis.position.assetName} 的投资论题`
      }
    })
  } catch (error) {
    console.error('[API] Error regenerating thesis:', error)
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '重新生成失败' 
      },
      { status: 500 }
    )
  }
}