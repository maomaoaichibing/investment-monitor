import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  XCircle,
  ArrowLeft,
  FileText,
  Calendar,
  Hash,
  Trash2,
  Briefcase
} from 'lucide-react'
import { alertService } from '@/server/services/alertService'
import { getAlertLevelColor, formatDateTime } from '@/lib/utils'

interface AlertDetailPageProps {
  params: {
    id: string
  }
}

export default async function AlertDetailPage({ params }: AlertDetailPageProps) {
  const alert = await alertService.getAlert(params.id)

  if (!alert) {
    notFound()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'dismissed':
        return <XCircle className="h-5 w-5 text-gray-600" />
      default:
        return <Clock className="h-5 w-5 text-blue-600" />
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

  const getImpactIcon = (impact?: string) => {
    switch (impact) {
      case 'strengthen':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'weaken':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/alerts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Alerts
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-8 w-8 text-primary" />
              提醒详情
            </h1>
            <p className="text-muted-foreground">
              查看和管理投资提醒
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Alert Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">{alert.title}</CardTitle>
                  <Badge 
                    variant="outline" 
                    className={`text-sm ${getAlertLevelColor(alert.level)}`}
                  >
                    {alert.level}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(alert.status)}
                    <span className="text-sm font-medium">
                      {getStatusText(alert.status)}
                    </span>
                  </div>
                </div>
                
                <CardDescription className="text-base mb-4">
                  {alert.summary}
                </CardDescription>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Sent: {formatDateTime(alert.sentAt)}
                  </span>
                  
                  <span className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    ID: {alert.id}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Position Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Related Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alert.position ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Symbol</p>
                    <p className="font-medium">{alert.position.symbol}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Asset Name</p>
                    <p className="font-medium">{alert.position.assetName}</p>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/positions/${alert.position.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Position Details
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No position information available</p>
            )}
          </CardContent>
        </Card>

        {/* Event Information Card */}
        {alert.event && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Related Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Event Type</p>
                    <p className="font-medium capitalize">{alert.event.eventType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Symbol</p>
                    <p className="font-medium">{alert.event.symbol}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Event Title</p>
                  <p className="font-medium">{alert.event.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Analysis Card */}
        {alert.eventAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Event Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Relevance Score</p>
                    <p className="font-medium">{alert.eventAnalysis.relevanceScore.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Thesis Impact</p>
                    <p className="font-medium flex items-center gap-2">
                      {getImpactIcon(alert.eventAnalysis.thesisImpact)}
                      <span className="capitalize">{alert.eventAnalysis.thesisImpact}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Impact Level</p>
                    <p className="font-medium capitalize">{alert.eventAnalysis.impactLevel}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Related Thesis</p>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    <Link href={`/thesis/${alert.eventAnalysis.thesisId}`}>
                      View Thesis
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => {
              // This would typically redirect to mark as read action
              window.location.href = `/api/alerts/${alert.id}`
              window.location.reload()
            }}
            disabled={alert.status === 'read'}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Read
          </Button>
          
          {alert.status !== 'dismissed' && (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Are you sure you want to dismiss this alert?')) {
                  window.location.href = `/api/alerts/${alert.id}`
                  window.location.reload()
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Dismiss Alert
            </Button>
          )}
          
          <Button variant="outline" asChild>
            <Link href="/alerts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Alerts
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}