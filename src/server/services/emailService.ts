import nodemailer, { Transporter } from 'nodemailer';
import { EmailConfig, EmailMessage, EmailResult } from '@/lib/schemas/emailSchema';

// 邮件服务配置接口
interface EmailServiceConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// 默认配置（从环境变量读取）
function getEmailConfig(): EmailServiceConfig {
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';
  const from = process.env.EMAIL_FROM || user;

  return {
    host: process.env.EMAIL_HOST || 'smtp.qq.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user, pass },
    from,
  };
}

// 创建 transporter
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const config = getEmailConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });
  }
  return transporter;
}

// 验证邮件配置
export async function validateEmailConfig(): Promise<{ valid: boolean; error?: string }> {
  try {
    const config = getEmailConfig();
    if (!config.auth.user || !config.auth.pass) {
      return { valid: false, error: '邮箱账号或授权码未配置' };
    }
    const transport = getTransporter();
    await transport.verify();
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

// 发送邮件
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<EmailResult> {
  try {
    const config = getEmailConfig();
    const transport = getTransporter();

    const info = await transport.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// 发送投资提醒邮件
export async function sendAlertEmail(
  to: string,
  alert: {
    title: string;
    level: string;
    content: string;
    symbol?: string;
    impact?: string;
  }
): Promise<EmailResult> {
  const levelColors: Record<string, string> = {
    urgent: '#dc2626',
    important: '#f59e0b',
    watch: '#3b82f6',
    info: '#6b7280',
  };

  const levelLabels: Record<string, string> = {
    urgent: '🔴 紧急',
    important: '🟡 重要',
    watch: '🔵 观察',
    info: '⚪ 消息',
  };

  const color = levelColors[alert.level] || '#6b7280';
  const levelLabel = levelLabels[alert.level] || alert.level;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">📊 智能投资监控系统</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0;">投资提醒通知</p>
      </div>

      <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="display: inline-block; background: ${color}15; color: ${color}; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 500; margin-bottom: 16px;">
          ${levelLabel}
        </div>

        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">${alert.title}</h2>

        ${alert.symbol ? `<p style="color: #6b7280; margin: 0 0 8px 0;"><strong>标的:</strong> ${alert.symbol}</p>` : ''}

        ${alert.impact ? `<p style="color: #6b7280; margin: 0 0 8px 0;"><strong>影响:</strong> ${alert.impact}</p>` : ''}

        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 16px;">
          <p style="color: #374151; margin: 0; line-height: 1.6;">${alert.content}</p>
        </div>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/alerts" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; font-weight: 500;">
          查看详情 →
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
        此邮件由智能投资监控系统自动发送
      </p>
    </div>
  `;

  const textContent = `
智能投资监控系统 - 投资提醒通知

级别: ${levelLabel}
标题: ${alert.title}
${alert.symbol ? `标的: ${alert.symbol}` : ''}
${alert.impact ? `影响: ${alert.impact}` : ''}

详情:
${alert.content}

查看详情: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/alerts
  `;

  return sendEmail(to, `[${levelLabel}] ${alert.title}`, html, textContent);
}

// 发送每日摘要邮件
export async function sendDailySummaryEmail(
  to: string,
  summary: {
    date: string;
    criticalAlerts: Array<{ title: string; level: string; symbol?: string }>;
    notableChanges: Array<{ type: string; content: string }>;
    upcomingEvents: Array<{ title: string; date: string }>;
    stats: {
      totalPortfolios: number;
      totalPositions: number;
      activeAlerts: number;
      avgHealthScore: number;
    };
  }
): Promise<EmailResult> {
  const hasCritical = summary.criticalAlerts.length > 0;
  const hasChanges = summary.notableChanges.length > 0;
  const hasEvents = summary.upcomingEvents.length > 0;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">📊 智能投资监控系统</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0;">每日投资摘要 - ${summary.date}</p>
      </div>

      <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <!-- 统计概览 -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #667eea;">${summary.stats.totalPortfolios}</div>
            <div style="font-size: 12px; color: #6b7280;">组合</div>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #667eea;">${summary.stats.totalPositions}</div>
            <div style="font-size: 12px; color: #6b7280;">持仓</div>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: ${summary.stats.activeAlerts > 0 ? '#f59e0b' : '#10b981'};">${summary.stats.activeAlerts}</div>
            <div style="font-size: 12px; color: #6b7280;">活跃提醒</div>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: ${summary.stats.avgHealthScore >= 70 ? '#10b981' : summary.stats.avgHealthScore >= 40 ? '#f59e0b' : '#ef4444'};">${summary.stats.avgHealthScore}</div>
            <div style="font-size: 12px; color: #6b7280;">健康度</div>
          </div>
        </div>

        <!-- 重要提醒 -->
        ${hasCritical ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #dc2626; margin: 0 0 12px 0; font-size: 16px;">🔴 需要关注</h3>
          ${summary.criticalAlerts.map(alert => `
            <div style="background: #fef2f2; border-left: 3px solid #dc2626; padding: 12px; margin-bottom: 8px; border-radius: 0 8px 8px 0;">
              <strong>${alert.title}</strong>
              ${alert.symbol ? ` (${alert.symbol})` : ''}
              <span style="display: inline-block; background: #dc2626; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px;">${alert.level}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- 重大变化 -->
        ${hasChanges ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #3b82f6; margin: 0 0 12px 0; font-size: 16px;">📈 重大变化</h3>
          ${summary.notableChanges.map(change => `
            <div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 12px; margin-bottom: 8px; border-radius: 0 8px 8px 0;">
              <strong>${change.type}:</strong> ${change.content}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- 即将发生 -->
        ${hasEvents ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #10b981; margin: 0 0 12px 0; font-size: 16px;">📅 即将发生</h3>
          ${summary.upcomingEvents.map(event => `
            <div style="background: #f0fdf4; border-left: 3px solid #10b981; padding: 12px; margin-bottom: 8px; border-radius: 0 8px 8px 0;">
              <strong>${event.title}</strong> - ${event.date}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${!hasCritical && !hasChanges && !hasEvents ? `
        <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
          <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
          <p style="margin: 0;">今日一切正常，没有需要特别关注的事项</p>
        </div>
        ` : ''}

        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; font-weight: 500;">
          打开仪表盘 →
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
        智能投资监控系统 | 每日自动生成
      </p>
    </div>
  `;

  const textContent = `
智能投资监控系统 - 每日投资摘要 ${summary.date}

【统计概览】
组合: ${summary.stats.totalPortfolios} | 持仓: ${summary.stats.totalPositions}
活跃提醒: ${summary.stats.activeAlerts} | 平均健康度: ${summary.stats.avgHealthScore}

${hasCritical ? '【需要关注】\n' + summary.criticalAlerts.map(a => `- ${a.title} ${a.symbol || ''}`).join('\n') : ''}

${hasChanges ? '【重大变化】\n' + summary.notableChanges.map(c => `- ${c.type}: ${c.content}`).join('\n') : ''}

${hasEvents ? '【即将发生】\n' + summary.upcomingEvents.map(e => `- ${e.title} (${e.date})`).join('\n') : ''}

查看详情: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}
  `;

  return sendEmail(to, `📊 每日投资摘要 - ${summary.date}`, html, textContent);
}

// 发送测试邮件
export async function sendTestEmail(to: string): Promise<EmailResult> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">✅ 邮件配置成功！</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 16px 0 0 0;">智能投资监控系统邮件通知已启用</p>
      </div>
      <div style="text-align: center; padding: 30px; background: #f9fafb; border-radius: 16px; margin-top: 20px;">
        <p style="color: #6b7280; margin: 0;">这是一封测试邮件，用于验证邮件发送功能是否正常工作。</p>
        <p style="color: #374151; margin: 20px 0 0 0; font-weight: 500;">📧 收件邮箱: ${to}</p>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
        发送时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
      </p>
    </div>
  `;

  return sendEmail(to, '✅ 智能投资监控系统 - 邮件配置测试', html);
}
