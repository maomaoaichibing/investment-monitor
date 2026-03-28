'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RegenerateThesisButtonProps {
  positionId: string
  positionName: string
}

export function RegenerateThesisButton({ positionId, positionName }: RegenerateThesisButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegenerate = async () => {
    if (!confirm(`确定要重新生成 ${positionName} 的投资论题吗？\n\n这将删除现有的投资论题并用最新的分析框架重新生成。`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/theses/regenerate/${positionId}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        alert(`成功重新生成 ${positionName} 的投资论题！`)
        router.refresh()
      } else {
        alert(`重新生成失败: ${data.error}`)
      }
    } catch (error) {
      alert(`重新生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleRegenerate}
      disabled={isLoading}
      className="text-amber-600 hover:text-amber-700 hover:border-amber-300"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? '重新生成中...' : '重新生成'}
    </Button>
  )
}