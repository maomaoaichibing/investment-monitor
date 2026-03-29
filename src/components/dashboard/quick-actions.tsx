import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Plus,
  RefreshCw,
  TrendingUp,
  FileText,
  AlertTriangle,
  Briefcase,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function QuickActions() {
  const actions = [
    {
      title: '新建组合',
      description: '创建新的投资组合',
      href: '/portfolios/new',
      icon: Briefcase,
      variant: 'default' as const,
    },
    {
      title: '批量重新生成',
      description: '批量更新投资论题',
      href: '/positions/batch-regenerate',
      icon: RefreshCw,
      variant: 'outline' as const,
    },
    {
      title: '查看全部论题',
      description: '浏览所有投资论题',
      href: '/theses',
      icon: FileText,
      variant: 'outline' as const,
    },
    {
      title: '查看全部提醒',
      description: '查看和处理提醒',
      href: '/alerts',
      icon: AlertTriangle,
      variant: 'outline' as const,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" />
          快捷操作
        </CardTitle>
        <CardDescription>常用功能快速入口</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant={action.variant}
              asChild
              className="h-auto py-3 justify-start"
            >
              <Link href={action.href}>
                <action.icon className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
