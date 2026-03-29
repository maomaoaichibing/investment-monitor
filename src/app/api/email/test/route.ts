import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail, validateEmailConfig } from '@/server/services/emailService'

// POST - 发送测试邮件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to } = body

    if (!to) {
      return NextResponse.json(
        { success: false, error: '收件人邮箱地址不能为空' },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: '邮箱格式不正确' },
        { status: 400 }
      )
    }

    // 验证配置
    const validation = await validateEmailConfig()
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: '邮件服务未配置或配置无效', details: validation.error },
        { status: 503 }
      )
    }

    // 发送测试邮件
    const result = await sendTestEmail(to)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '测试邮件发送成功',
        messageId: result.messageId
      })
    } else {
      return NextResponse.json(
        { success: false, error: '邮件发送失败', details: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
