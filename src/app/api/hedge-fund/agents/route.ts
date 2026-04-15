/**
 * GET /api/hedge-fund/agents
 *
 * 获取所有 Agent 列表。
 */

import { NextResponse } from 'next/server';
import { listAgents } from '@/server/hedge-fund/hedge-fund-service';

export async function GET() {
  try {
    const result = listAgents();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] /hedge-fund/agents error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取Agent列表失败',
      },
      { status: 500 }
    );
  }
}
