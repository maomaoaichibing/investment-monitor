'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface AlertActionsProps {
  alertId: string
  alertStatus: string
}

export function AlertActions({ alertId, alertStatus }: AlertActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleAction = async (action: 'read' | 'dismiss') => {
    try {
      setLoading(action)
      const res = await fetch(`/api/alerts/${alertId}/action?action=${action}`, {
        method: 'PATCH'
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to perform action:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={() => handleAction('read')}
        disabled={alertStatus === 'read' || loading !== null}
      >
        {loading === 'read' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4 mr-2" />
        )}
        标记已读
      </Button>

      {alertStatus !== 'dismissed' && (
        <Button
          variant="destructive"
          onClick={() => handleAction('dismiss')}
          disabled={loading !== null}
        >
          {loading === 'dismiss' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          忽略提醒
        </Button>
      )}

      <Button variant="outline" asChild>
        <Link href="/alerts">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回列表
        </Link>
      </Button>
    </div>
  )
}