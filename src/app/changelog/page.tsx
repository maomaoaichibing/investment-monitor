import { VersionTimeline } from '@/components/version/version-timeline'
import { CURRENT_VERSION, VERSION_HISTORY } from '@/lib/version'

export const metadata = {
  title: '版本管理 - 投资监控系统',
  description: '查看系统版本历史和更新日志',
}

export default function ChangelogPage() {
  const totalFeatures = VERSION_HISTORY.reduce((sum, v) => sum + v.features.length, 0)

  return (
    <div className="container py-8 max-w-3xl">
      {/* 页面头部 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">版本管理</h1>
          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm font-mono">
            {CURRENT_VERSION}
          </span>
        </div>
        <p className="text-muted-foreground">
          共 {VERSION_HISTORY.length} 个版本，{totalFeatures} 项更新
        </p>
      </div>

      {/* 版本时间线 */}
      <VersionTimeline />
    </div>
  )
}
