import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/email/subscriptions - 获取所有邮件订阅
 */
export async function GET() {
  try {
    const subscriptions = await db.emailSubscription.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: subscriptions,
      total: subscriptions.length,
    })
  } catch (error) {
    console.error('[EmailSubscription API] 获取订阅列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取订阅列表失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/email/subscriptions - 创建新的邮件订阅
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, alertLevel, positionId } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: '邮箱地址不能为空' },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '邮箱格式无效' },
        { status: 400 }
      )
    }

    // 检查是否已存在相同的订阅
    const existing = await db.emailSubscription.findFirst({
      where: {
        email,
        alertLevel: alertLevel || 'important',
        ...(positionId ? { positionId } : {}),
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: '该订阅已存在' },
        { status: 409 }
      )
    }

    const subscription = await db.emailSubscription.create({
      data: {
        email,
        alertLevel: alertLevel || 'important',
        positionId: positionId || null,
        isActive: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: subscription,
        message: '订阅创建成功',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[EmailSubscription API] 创建订阅失败:', error)
    return NextResponse.json(
      { success: false, error: '创建订阅失败' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/email/subscriptions?id=xxx - 删除订阅
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '订阅ID不能为空' },
        { status: 400 }
      )
    }

    await db.emailSubscription.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: '订阅已删除',
    })
  } catch (error) {
    console.error('[EmailSubscription API] 删除订阅失败:', error)
    return NextResponse.json(
      { success: false, error: '删除订阅失败' },
      { status: 500 }
    )
  }
}
