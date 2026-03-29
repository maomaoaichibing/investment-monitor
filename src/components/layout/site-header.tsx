import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell, Home, Briefcase, AlertTriangle, BarChart, Settings, TestTube,
  History, Mail
} from 'lucide-react'
import { db } from '@/lib/db'
import { VersionBadge } from '@/components/version/version-badge'

export async function SiteHeader() {
  // 从数据库获取未读提醒数量
  const unreadAlertCount = await db.alert.count({
    where: { status: 'unread' }
  })

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <BarChart className="h-6 w-6" />
            <span className="font-bold">投资监控系统</span>
            <VersionBadge />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              仪表盘
            </Link>
            <Link
              href="/portfolios"
              className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              投资组合
            </Link>
            <Link
              href="/alerts"
              className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              提醒
              {unreadAlertCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadAlertCount}
                </Badge>
              )}
            </Link>
            <Link
              href="/monitor-plan-test"
              className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              测试
            </Link>
            <Link
              href="/changelog"
              className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              版本管理
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </Button>

          {/* 设置按钮 */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings/email" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              邮件
            </Link>
          </Button>

          <Button variant="default" asChild>
            <Link href="/portfolios/new">新建组合</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}