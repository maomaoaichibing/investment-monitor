/**
 * POST /api/hedge-fund/analyze
 *
 * 分析单只股票，返回多 Agent 投资决策。
 *
 * Body: { symbol: string, agents?: string[] }
 * Response: AnalyzeResponse
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeSymbol } from '@/server/hedge-fund/hedge-fund-service';

const AnalyzeRequestSchema = z.object({
  symbol: z.string().min(1, '股票代码不能为空'),
  agents: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AnalyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '参数验证失败', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await analyzeSymbol(parsed.data);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] /hedge-fund/analyze error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '分析失败',
      },
      { status: 500 }
    );
  }
}
