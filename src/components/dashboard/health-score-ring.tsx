'use client'

import { useEffect, useState } from 'react'

interface HealthScoreRingProps {
  score: number // 0-100
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export function HealthScoreRing({
  score,
  size = 80,
  strokeWidth = 8,
  showLabel = true
}: HealthScoreRingProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 计算颜色：>70 绿色，40-70 黄色，<40 红色
  const getColor = (s: number) => {
    if (s >= 70) return '#22c55e' // green-500
    if (s >= 40) return '#eab308' // yellow-500
    return '#ef4444' // red-500
  }

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  const color = getColor(score)

  if (!mounted) {
    return (
      <div style={{ width: size, height: size }} className="flex items-center justify-center">
        <div className="w-full h-full rounded-full border-4 border-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      )}
    </div>
  )
}

// 获取健康度等级标签
export function getHealthLevel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: '健康', color: 'text-green-500' }
  if (score >= 40) return { label: '预警', color: 'text-yellow-500' }
  return { label: '危机', color: 'text-red-500' }
}

// 获取健康度图标
export function getHealthEmoji(score: number): string {
  if (score >= 70) return '🟢'
  if (score >= 40) return '🟡'
  return '🔴'
}
