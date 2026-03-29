/**
 * 邮件订阅服务
 * 管理Alert邮件通知的订阅配置和自动发送
 */

import { db } from '@/lib/db'
import { sendAlertEmail, validateEmailConfig } from './emailService'

// 邮件订阅配置
export interface EmailSubscription {
  id: string
  email: string
  enabled: boolean
  levels: string[]  // 订阅的alert级别: ['urgent', 'important', 'watch', 'info']
  createdAt: Date
  updatedAt: Date
}

// 订阅者邮件列表（可以从环境变量或数据库配置）
function getSubscriberEmails(): string[] {
  const emails = process.env.ALERT_SUBSCRIBER_EMAILS || ''
  if (!emails) return []
  return emails.split(',').map(e => e.trim()).filter(Boolean)
}

// 检查是否应该发送通知
function shouldSendNotification(level: string): boolean {
  // urgent 和 important 级别默认通知
  return ['urgent', 'important'].includes(level)
}

// 发送Alert通知给所有订阅者
export async function sendAlertNotifications(
  alert: {
    id: string
    title: string
    level: string
    summary: string
    position?: { symbol?: string; assetName?: string } | null
    eventAnalysis?: { thesisImpact?: string } | null
  }
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const result = { sent: 0, failed: 0, errors: [] as string[] }

  // 检查邮件配置是否有效
  const configValid = await validateEmailConfig()
  if (!configValid.valid) {
    console.log('[EmailSubscription] 邮件配置无效，跳过通知:', configValid.error)
    return { ...result, failed: -1, errors: [configValid.error || '邮件配置无效'] }
  }

  // 检查是否需要发送通知
  if (!shouldSendNotification(alert.level)) {
    console.log(`[EmailSubscription] 级别 ${alert.level} 不需要发送通知`)
    return result
  }

  // 获取订阅者邮箱
  const subscribers = getSubscriberEmails()
  if (subscribers.length === 0) {
    console.log('[EmailSubscription] 没有配置订阅者邮箱 (ALERT_SUBSCRIBER_EMAILS)')
    return { ...result, failed: -1, errors: ['没有配置订阅者邮箱'] }
  }

  // 发送邮件给每个订阅者
  for (const email of subscribers) {
    try {
      const emailResult = await sendAlertEmail(email, {
        title: alert.title,
        level: alert.level,
        content: alert.summary,
        symbol: alert.position?.symbol,
        impact: alert.eventAnalysis?.thesisImpact,
      })

      if (emailResult.success) {
        result.sent++
        console.log(`[EmailSubscription] ✅ 邮件已发送: ${email}`)
      } else {
        result.failed++
        result.errors.push(`${email}: ${emailResult.error}`)
        console.log(`[EmailSubscription] ❌ 邮件发送失败: ${email} - ${emailResult.error}`)
      }
    } catch (error) {
      result.failed++
      result.errors.push(`${email}: ${(error as Error).message}`)
      console.log(`[EmailSubscription] ❌ 异常: ${email} - ${(error as Error).message}`)
    }
  }

  return result
}

// 获取当前的订阅配置信息
export async function getSubscriptionStatus(): Promise<{
  configured: boolean
  subscribers: string[]
  emailConfigValid: boolean
}> {
  const subscribers = getSubscriberEmails()
  const emailConfigValid = (await validateEmailConfig()).valid

  return {
    configured: subscribers.length > 0,
    subscribers,
    emailConfigValid,
  }
}
