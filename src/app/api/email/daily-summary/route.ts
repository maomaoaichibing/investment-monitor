import { NextRequest, NextResponse } from 'next/server';
import { dailySummaryEmailSchema } from '@/lib/schemas/emailSchema';
import { sendDailySummaryEmail, validateEmailConfig } from '@/server/services/emailService';

// POST /api/email/daily-summary - 发送每日摘要邮件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求体
    const validated = dailySummaryEmailSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: '参数验证失败', details: validated.error.errors },
        { status: 400 }
      );
    }

    // 验证配置
    const validation = await validateEmailConfig();
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: '邮件服务未配置', details: validation.error },
        { status: 503 }
      );
    }

    // 发送邮件
    const result = await sendDailySummaryEmail(validated.data.to, validated.data);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
