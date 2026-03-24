import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Home, Briefcase, AlertTriangle, BarChart, Settings, TestTube } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <BarChart className="h-6 w-6" />
            <span className="font-bold">投资监控系统</span>
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
              <Badge variant="secondary" className="ml-1">3</Badge>
            </Link>
            <Link 
              href="/monitor-plan-test" 
              className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              测试
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
          
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          
          <Button variant="default" asChild>
            <Link href="/portfolios/new">新建组合</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}