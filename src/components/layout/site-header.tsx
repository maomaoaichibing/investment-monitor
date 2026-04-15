"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  Briefcase,
  AlertTriangle,
  Menu,
  X,
  Bell,
  Mail,
  PieChart,
  TestTube,
  History,
  Newspaper,
  Brain,
} from 'lucide-react'

// MobileMenu 是客户端组件，需要 useState
function MobileMenu({ unreadAlertCount }: { unreadAlertCount: number }) {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: '/', label: '仪表盘', icon: 'Home' },
    { href: '/portfolios', label: '投资组合', icon: 'Briefcase' },
    { href: '/hedge-fund', label: 'AI Fund', icon: 'Brain' },
    { href: '/alerts', label: '提醒', icon: 'AlertTriangle', badge: unreadAlertCount },
    { href: '/theses', label: '投资论题', icon: 'PieChart' },
    { href: '/news', label: '舆情', icon: 'Newspaper' },
    { href: '/test-suite', label: '系统测试', icon: 'TestTube' },
    { href: '/changelog', label: '版本管理', icon: 'History' },
  ]

  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Home,
    Briefcase,
    AlertTriangle,
    PieChart,
    TestTube,
    History,
    Brain,
    Newspaper,
  }

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

      {isOpen && (
        <>
          <div
            className="fixed inset-0 top-14 z-40 bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-0 top-14 z-50 bg-background border-t md:hidden">
            <nav className="container py-4 flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = icons[item.icon]
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
              <div className="border-t pt-4 mt-2">
                <Link href="/settings/email" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Mail className="h-5 w-5 mr-3" />
                    邮件设置
                  </Button>
                </Link>
                <Link href="/portfolios/new" onClick={() => setIsOpen(false)}>
                  <Button className="w-full mt-2">新建组合</Button>
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  )
}

// SiteHeader 接收 unreadAlertCount 作为 props（由服务端 layout.tsx 传入）
interface SiteHeaderProps {
  unreadAlertCount?: number
}

export function SiteHeader({ unreadAlertCount = 0 }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-6">
          <Link href="/" className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg hidden sm:inline">投资监控</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 flex-1">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            仪表盘
          </Link>
          <Link href="/portfolios" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            投资组合
          </Link>
          <Link href="/hedge-fund" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <Brain className="h-3.5 w-3.5" />
            AI Fund
          </Link>
          <Link href="/alerts" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            提醒
            {unreadAlertCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadAlertCount > 99 ? '99+' : unreadAlertCount}
              </Badge>
            )}
          </Link>
          <Link href="/analytics" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            数据分析
          </Link>
          <Link href="/theses" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            投资论题
          </Link>
          <Link href="/news" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <Newspaper className="h-3.5 w-3.5" />
            舆情
          </Link>
          <Link href="/test-suite" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <TestTube className="h-3.5 w-3.5" />
            系统测试
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile menu button */}
          <MobileMenu unreadAlertCount={unreadAlertCount} />

          {/* Desktop action buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portfolios/new">
                <Briefcase className="h-4 w-4 mr-1" />
                新建组合
              </Link>
            </Button>

            {/* Alert bell */}
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/alerts">
                <Bell className="h-4 w-4" />
                {unreadAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
