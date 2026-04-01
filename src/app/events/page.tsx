'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar, Clock, ExternalLink, Filter, Plus, Search, Tag } from 'lucide-react';
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

export default function EventListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  });

  // 筛选条件
  const [filters, setFilters] = useState({
    symbol: '',
    eventType: '',
    source: ''
  });

  // 加载事件列表
  const loadEvents = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // 构建查询参数
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10'
      });

      if (filters.symbol) params.append('symbol', filters.symbol);
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.source) params.append('source', filters.source);

      const response = await fetch(`/api/events?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setEvents(result.data);
        setPagination(result.pagination);
      } else {
        setError(result.error || '加载事件失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  // 首次加载
  useEffect(() => {
    loadEvents(1);
  }, []);

  // 筛选条件变化时重新加载
  useEffect(() => {
    loadEvents(1);
  }, [filters]);

  // 处理筛选变化
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    loadEvents(newPage);
  };

  // 跳转到事件详情
  const viewEventDetail = (id: string) => {
    router.push(`/events/${id}`);
  };

  // 创建新事件
  const createNewEvent = () => {
    router.push('/events/new');
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // 截断内容
  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">事件中心</h1>
          <p className="text-muted-foreground mt-1">管理和查看所有投资相关事件</p>
        </div>
        <Button onClick={createNewEvent} className="gap-2">
          <Plus className="h-4 w-4" />
          创建事件
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 筛选栏 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 股票代码搜索 */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">股票代码</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="输入股票代码，如：00700.HK"
                  value={filters.symbol}
                  onChange={(e) => handleFilterChange('symbol', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* 事件类型筛选 */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">事件类型</label>
              <Select
                value={filters.eventType}
                onValueChange={(value) => handleFilterChange('eventType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">所有类型</SelectItem>
                  <SelectItem value="earnings">财报</SelectItem>
                  <SelectItem value="guidance_change">指引变更</SelectItem>
                  <SelectItem value="policy">政策</SelectItem>
                  <SelectItem value="industry_data">行业数据</SelectItem>
                  <SelectItem value="price_break">价格突破</SelectItem>
                  <SelectItem value="management_comment">管理层评论</SelectItem>
                  <SelectItem value="regulation">监管</SelectItem>
                  <SelectItem value="news">新闻</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 来源筛选 */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">来源</label>
              <Select
                value={filters.source}
                onValueChange={(value) => handleFilterChange('source', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">所有来源</SelectItem>
                  <SelectItem value="manual">手动录入</SelectItem>
                  <SelectItem value="auto">自动抓取</SelectItem>
                  <SelectItem value="api">API导入</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* 事件列表 */}
      {!loading && events.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无事件</h3>
            <p className="text-muted-foreground mb-4">还没有任何事件记录</p>
            <Button onClick={createNewEvent}>
              <Plus className="h-4 w-4 mr-2" />
              创建第一个事件
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => viewEventDetail(event.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getEventTypeColor(event.eventType)}>
                        {getEventTypeLabel(event.eventType)}
                      </Badge>
                      <Badge variant="outline">
                        {getSourceLabel(event.source)}
                      </Badge>
                      {event.eventAnalysisCount > 0 && (
                        <Badge variant="secondary">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {event.eventAnalysisCount} 分析
                        </Badge>
                      )}
                      {event.alertCount > 0 && (
                        <Badge variant="destructive">
                          {event.alertCount} 提醒
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mb-1">
                      {event.symbol} - {event.title}
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(event.eventTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {event.symbol}
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {truncateContent(event.content)}
                </p>
                
                {/* 元数据标签 */}
                {event.metadataJson?.tags && event.metadataJson.tags.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {event.metadataJson.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-muted-foreground">
            显示第 {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}