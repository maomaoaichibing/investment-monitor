import { z } from 'zod';

// 邮件发送结果
export interface EmailResult {
  success: boolean;
  messageId?: string;
  accepted?: string[];
  rejected?: string[];
  error?: string;
}

// 邮件配置
export const emailConfigSchema = z.object({
  host: z.string().optional(),
  port: z.number().optional(),
  secure: z.boolean().optional(),
  user: z.string().email().optional(),
  pass: z.string().optional(),
  from: z.string().optional(),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;

// 邮件消息
export const emailMessageSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string().optional(),
  text: z.string().optional(),
});

export type EmailMessage = z.infer<typeof emailMessageSchema>;

// Alert 邮件
export const alertEmailSchema = z.object({
  to: z.string().email(),
  title: z.string().min(1).max(200),
  level: z.enum(['urgent', 'important', 'watch', 'info']),
  content: z.string().min(1),
  symbol: z.string().optional(),
  impact: z.string().optional(),
});

export type AlertEmail = z.infer<typeof alertEmailSchema>;

// 每日摘要邮件
export const dailySummaryEmailSchema = z.object({
  to: z.string().email(),
  date: z.string(),
  criticalAlerts: z.array(z.object({
    title: z.string(),
    level: z.string(),
    symbol: z.string().optional(),
  })).default([]),
  notableChanges: z.array(z.object({
    type: z.string(),
    content: z.string(),
  })).default([]),
  upcomingEvents: z.array(z.object({
    title: z.string(),
    date: z.string(),
  })).default([]),
  stats: z.object({
    totalPortfolios: z.number(),
    totalPositions: z.number(),
    activeAlerts: z.number(),
    avgHealthScore: z.number(),
  }),
});

export type DailySummaryEmail = z.infer<typeof dailySummaryEmailSchema>;
