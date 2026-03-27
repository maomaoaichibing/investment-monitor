import { NextRequest, NextResponse } from 'next/server';
import { emailMessageSchema } from '@/lib/schemas/emailSchema';
import { sendEmail, validateEmailConfig } from '@/server/services/emailService';

// GET - 验证邮件配置
export async function GET() {
  try {
    const validation = await validateEmailConfig();

    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: '邮件配置无效',
        details: validation.error,
        configured: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: '邮件配置正常',
      configured: true,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - 发送邮件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求体
    const validated = emailMessageSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: '参数验证失败', details: validated.error.errors },
        { status: 400 }
      );
    }

    const { to, subject, html, text } = validated.data;

    // 验证配置
    const validation = await validateEmailConfig();
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: '邮件服务未配置', details: validation.error },
        { status: 503 }
      );
    }

    // 发送邮件
    const result = await sendEmail(to, subject, html || '', text || undefined);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '邮件发送成功',
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: '邮件发送失败', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
