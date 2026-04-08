import type { Metadata } from 'next'
import './globals.css'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Providers } from '@/components/providers'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: '投资逻辑监控系统',
  description: '监控您的投资逻辑，接收智能提醒',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 服务端获取未读提醒数量
  const unreadAlertCount = await db.alert.count({
    where: { status: 'unread' },
  })

  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader unreadAlertCount={unreadAlertCount} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  )
}