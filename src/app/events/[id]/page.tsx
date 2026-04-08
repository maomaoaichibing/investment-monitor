import React from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Calendar, Clock, ExternalLink, Tag, User } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// 事件类型标签映射
const eventTypeLabels: Record<string, string> = {
  earnings: '财报',
  guidance_change: '指引变更',
  policy: '政策',
  industry_data: '行业数据',
  price_break: '价格突破',
  management_comment: '管理层评论',
  regulation: '监管',
  news: '新闻'
};

// 事件类型颜色映射
const eventTypeColors: Record<string, string> = {
  earnings: 'bg-blue-100 text-blue-800',
  guidance_change: 'bg-amber-100 text-amber-800',
  policy: 'bg-purple-100 text-purple-800',
  industry_data: 'bg-green-100 text-green-800',
  price_break: 'bg-red-100 text-red-800',
  management_comment: 'bg-gray-100 text-gray-800',
  regulation: 'bg-orange-100 text-orange-800',
  news: 'bg-cyan-100 text-cyan-800'
};

// 来源标签映射
const sourceLabels: Record<string, string> = {
  manual: '手动录入',
  auto: '自动抓取',
  api: 'API导入'
};

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

async function getEvent(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/events/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

export default async function EventDetailPage({
  params
}: {
  params: { id: string };
}) {
  const { id } = params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  // 获取事件类型标签
  const getEventTypeLabel = (type: string) => {
    return eventTypeLabels[type] || type;
  };

  // 获取事件类型颜色
  const getEventTypeColor = (type: string) => {
    return eventTypeColors[type] || 'bg-gray-100 text-gray-800';
  };

  // 获取来源标签
  const getSourceLabel = (source: string) => {
    return sourceLabels[source] || source;
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回事件列表
          </Link>
        </Button>
      </div>

      {/* 事件详情卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Badge className={getEventTypeColor(event.eventType)}>
                {getEventTypeLabel(event.eventType)}
              </Badge>
              <Badge variant="outline">
                {getSourceLabel(event.source)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              ID: {event.id}
            </div>
          </div>
          
          <CardTitle className="text-2xl mb-2">
            {event.symbol} - {event.title}
          </CardTitle>
          
          <CardDescription>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(event.eventTime)}
              </div>
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {event.symbol}
              </div>
              {event.eventAnalysisCount > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {event.eventAnalysisCount} 分析
                </div>
              )}
              {event.alertCount > 0 && (
                <div className="flex items-center gap-1 text-destructive">
                  {event.alertCount} 提醒
                </div>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 事件内容 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">事件内容</h3>
            <div className="prose prose-gray max-w-none">
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {event.content}
              </p>
            </div>
          </div>

          {/* 元数据 */}
          {event.metadataJson && Object.keys(event.metadataJson).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">附加信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 财务数据 */}
                {event.metadataJson.actualValue && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">实际值</span>
                    <span className="font-medium">{event.metadataJson.actualValue}</span>
                  </div>
                )}
                {event.metadataJson.expectedValue && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">预期值</span>
                    <span className="font-medium">{event.metadataJson.expectedValue}</span>
                  </div>
                )}
                {event.metadataJson.beatMiss && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">业绩</span>
                    <Badge 
                      variant={event.metadataJson.beatMiss === 'beat' ? 'default' : 'destructive'}
                    >
                      {event.metadataJson.beatMiss === 'beat' ? '超预期' : 
                       event.metadataJson.beatMiss === 'miss' ? '不及预期' : '符合预期'}
                    </Badge>
                  </div>
                )}
                
                {/* 价格数据 */}
                {event.metadataJson.priceChangePercent !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">价格变化</span>
                    <span className={`font-medium ${
                      event.metadataJson.priceChangePercent > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {event.metadataJson.priceChangePercent > 0 ? '+' : ''}
                      {event.metadataJson.priceChangePercent}%
                    </span>
                  </div>
                )}
                
                {/* 新闻来源 */}
                {event.metadataJson.newsSource && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">新闻来源</span>
                    <span className="font-medium">{event.metadataJson.newsSource}</span>
                  </div>
                )}
                
                {/* 情绪 */}
                {event.metadataJson.sentiment && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">市场情绪</span>
                    <Badge 
                      variant={event.metadataJson.sentiment === 'positive' ? 'default' : 
                               event.metadataJson.sentiment === 'negative' ? 'destructive' : 'secondary'}
                    >
                      {event.metadataJson.sentiment === 'positive' ? '正面' : 
                       event.metadataJson.sentiment === 'negative' ? '负面' : '中性'}
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* 标签 */}
              {event.metadataJson.tags && event.metadataJson.tags.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {event.metadataJson.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 时间信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>创建时间: {formatDateTime(event.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>更新时间: {formatDateTime(event.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href={`/events/${event.id}/analyze`}>
            <AlertCircle className="h-4 w-4 mr-2" />
            分析事件影响
          </Link>
        </Button>

      </div>
    </div>
  );
}

// 404页面
export function generateStaticParams() {
  return [];
}