/**
 * 批量重新生成Thesis API
 * POST /api/theses/batch-regenerate
 * Body: { positionIds: string[] }
 */
import { NextRequest, NextResponse } from 'next/server'
import { thesisService } from '@/server/services/thesisService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { positionIds } = body

    if (!positionIds || !Array.isArray(positionIds) || positionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供有效的positionIds数组' },
        { status: 400 }
      )
    }

    // 限制批量大小，防止API超时
    const MAX_BATCH_SIZE = 10
    if (positionIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { success: false, error: `批量大小不能超过${MAX_BATCH_SIZE}个` },
        { status: 400 }
      )
    }

    console.log(`[Batch Regenerate] Starting batch regenerate for ${positionIds.length} positions`)

    const results: any[] = []
    const errors: any[] = []

    for (const positionId of positionIds) {
      try {
        const result = await thesisService.regenerateThesisForPosition(positionId)
        results.push({
          positionId,
          success: true,
          thesisId: result.thesis.id,
          healthScore: result.thesis.healthScore
        })
        console.log(`[Batch Regenerate] ✓ ${positionId} - health: ${result.thesis.healthScore}`)
      } catch (error: any) {
        console.error(`[Batch Regenerate] ✗ ${positionId}: ${error.message}`)
        errors.push({ positionId, error: error.message })
      }

      // 每个thesis生成后等待1秒，避免API限流
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        total: positionIds.length,
        succeeded: results.length,
        failed: errors.length,
        results,
        errors
      }
    })
  } catch (error: any) {
    console.error('[Batch Regenerate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || '批量重新生成失败' },
      { status: 500 }
    )
  }
}
