import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { getAlertLevelColor } from '@/lib/utils'
import type { AlertLevel } from '@/lib/schemas/alertSchema'

interface AlertBadgeProps {
  level: AlertLevel
  className?: string
  showIcon?: boolean
}

export function AlertBadge({ level, className = '', showIcon = true }: AlertBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`text-xs ${getAlertLevelColor(level)} ${className}`}
    >
      {showIcon && (
        <AlertTriangle className="h-3 w-3 mr-1" />
      )}
      {level}
    </Badge>
  )
}

// Helper component for Alert Status
interface AlertStatusBadgeProps {
  status: 'unread' | 'read' | 'dismissed'
  className?: string
}

export function AlertStatusBadge({ status, className = '' }: AlertStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'read':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'read':
        return '已读'
      case 'dismissed':
        return '已忽略'
      default:
        return '未读'
    }
  }

  return (
    <Badge 
      variant="outline" 
      className={`text-xs ${getStatusColor(status)} ${className}`}
    >
      {getStatusText(status)}
    </Badge>
  )
}
