'use client'

import { VERSION_HISTORY, type Version, type VersionFeature } from '@/lib/version'
import { Badge } from '@/components/ui/badge'
import { GitCommit, Calendar, Sparkles, Bug, TrendingUp, Zap, ChevronDown } from 'lucide-react'

const statusConfig = {
  new: { label: '新功能', icon: Sparkles, className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  improved: { label: '优化', icon: TrendingUp, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  fixed: { label: '修复', icon: Bug, className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  optimized: { label: '性能', icon: Zap, className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
}

function FeatureItem({ feature }: { feature: VersionFeature }) {
  const config = statusConfig[feature.status]
  const Icon = config.icon

  return (
    <div className="flex gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={`mt-0.5 p-1.5 rounded-lg ${config.className}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm">{feature.title}</h4>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.className}`}>
            {config.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  )
}

function VersionCard({ version, isLatest }: { version: Version; isLatest: boolean }) {
  return (
    <details className="rounded-lg border bg-card" open={isLatest}>
      <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold ${
            isLatest ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {version.version}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{version.title}</h3>
              {isLatest && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary">
                  最新
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {version.date}
              </span>
              {version.commitId && (
                <span className="flex items-center gap-1 font-mono">
                  <GitCommit className="h-3 w-3" />
                  {version.commitId.slice(0, 7)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {version.features.length} 项更新
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [&[open]]:rotate-180" />
        </div>
      </summary>
      <div className="px-4 pb-4 border-t">
        <p className="text-sm text-muted-foreground py-3">{version.description}</p>
        <div className="space-y-0">
          {version.features.map((feature, index) => (
            <FeatureItem key={index} feature={feature} />
          ))}
        </div>
      </div>
    </details>
  )
}

export function VersionTimeline() {
  return (
    <div className="space-y-4">
      {VERSION_HISTORY.map((version, index) => (
        <VersionCard
          key={version.version}
          version={version}
          isLatest={index === 0}
        />
      ))}
    </div>
  )
}
