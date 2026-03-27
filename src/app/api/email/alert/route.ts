import { NextRequest, NextResponse } from 'next/server';
import { alertEmailSchema } from '@/lib/schemas/emailSchema';
import { sendAlertEmail, validateEmailConfig } from '@/server/services/emailService';

// POST /api/email/alert - 发送 Alert 邮件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求体
    const validated = alertEmailSchema.safeParse(body);
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
    const result = await sendAlertEmail(validated.data.to, validated.data);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
