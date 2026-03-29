"use client"

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell, Home, Briefcase, AlertTriangle, BarChart, Settings, Menu, X, TestTube,
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
      <div className="container flex h-14 sm:h-16 items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <BarChart className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="font-bold text-sm sm:text-base">投资监控系统</span>
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

        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </Button>

          {/* 设置按钮 - 桌面端 */}
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
            <Link href="/settings/email" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              邮件
            </Link>
          </Button>

          <Button variant="default" size="sm" asChild className="hidden sm:flex">
            <Link href="/portfolios/new">新建组合</Link>
          </Button>

          {/* 移动端菜单按钮 */}
          <MobileMenu unreadAlertCount={unreadAlertCount} />
        </div>
      </div>
    </header>
  )
}

function MobileMenu({ unreadAlertCount }: { unreadAlertCount: number }) {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: '/', label: '仪表盘', icon: Home },
    { href: '/portfolios', label: '投资组合', icon: Briefcase },
    { href: '/alerts', label: '提醒', icon: AlertTriangle, badge: unreadAlertCount },
    { href: '/monitor-plan-test', label: '测试', icon: TestTube },
    { href: '/changelog', label: '版本管理', icon: History },
  ]

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* 移动端菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 - 点击关闭 */}
          <div
            className="fixed inset-0 top-14 z-40 bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          {/* 菜单内容 */}
          <div className="fixed inset-x-0 top-14 z-50 bg-background border-t md:hidden">
            <nav className="container py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
            <div className="border-t pt-4 mt-2">
              <Link href="/settings/email" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Mail className="h-5 w-5 mr-3" />
                  邮件设置
                </Button>
              </Link>
              <Link href="/portfolios/new" onClick={() => setIsOpen(false)}>
                <Button className="w-full mt-2">
                  新建组合
                </Button>
              </Link>
            </div>
          </nav>
          </div>
        </>
      )}
    </>
  )
}
