/**
 * GET /api/hedge-fund/agents/[id]
 *
 * 获取单个 Agent 详情。
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentDetail } from '@/server/hedge-fund/hedge-fund-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = getAgentDetail(params.id);

    if (!agent) {
      return NextResponse.json(
        { success: false, error: `Agent "${params.id}" 不存在` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error(`[API] /hedge-fund/agents/${params.id} error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取Agent详情失败',
      },
      { status: 500 }
    );
  }
}
