'use client'

import { CURRENT_VERSION } from '@/lib/version'

interface VersionBadgeProps {
  showLabel?: boolean
  className?: string
}

export function VersionBadge({ showLabel = true, className = '' }: VersionBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-mono text-muted-foreground ${className}`}
    >
      {showLabel && <span>v</span>}
      {CURRENT_VERSION}
    </span>
  )
}
