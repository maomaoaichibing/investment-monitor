'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Loader2, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// 影响方向标签映射
const thesisImpactLabels: Record<string, string> = {
  strengthen: '强化',
  maintain: '维持',
  weaken: '弱化',
  reverse: '反转'
};

// 影响方向颜色映射
const thesisImpactColors: Record<string, string> = {
  strengthen: 'bg-green-100 text-green-800',
  maintain: 'bg-blue-100 text-blue-800',
  weaken: 'bg-yellow-100 text-yellow-800',
  reverse: 'bg-red-100 text-red-800'
};

// 影响等级颜色映射
const impactLevelColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
};

// 影响等级图标映射
const impactLevelIcons: Record<string, React.ReactNode> = {
  high: <TrendingDown className="h-4 w-4 text-red-600" />,
  medium: <AlertCircle className="h-4 w-4 text-yellow-600" />,
  low: <TrendingUp className="h-4 w-4 text-green-600" />
};

export default function EventAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { id: eventId } = params;

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [theses, setTheses] = useState<any[]>([]);
  const [selectedThesisId, setSelectedThesisId] = useState<string>('');
  const [analysis, setAnalysis] = useState<any>(null);

  // 加载事件和论题列表
  useEffect(() => {
    loadEventAndTheses();
  }, [eventId]);

  const loadEventAndTheses = async () => {
    try {
      setLoading(true);
      setError(null);

      // 加载事件详情
      const eventResponse = await fetch(`/api/events/${eventId}`);
      const eventResult = await eventResponse.json();

      if (eventResult.success) {
        setEvent(eventResult.data);
      } else {
        setError('加载事件失败: ' + eventResult.error);
        return;
      }

      // 加载论题列表
      const thesesResponse = await fetch('/api/theses');
      const thesesResult = await thesesResponse.json();

      if (thesesResult.success) {
        setTheses(thesesResult.data);
        if (thesesResult.data.length > 0) {
          setSelectedThesisId(thesesResult.data[0].id);
        }
      } else {
        setError('加载论题失败: ' + thesesResult.error);
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    if (!selectedThesisId) {
      setError('请先选择一个论题');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const response = await fetch('/api/event-analysis/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId,
          thesisId: selectedThesisId
        })
      });

      const result = await response.json();

      if (result.success) {
        setAnalysis(result.data.eventAnalysis);
      } else {
        setError('生成分析失败: ' + result.error);
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('Error generating analysis:', err);
    } finally {
      setGenerating(false);
    }
  };

  const getThesisImpactLabel = (impact: string) => {
    return thesisImpactLabels[impact] || impact;
  };

  const getThesisImpactColor = (impact: string) => {
    return thesisImpactColors[impact] || 'bg-gray-100 text-gray-800';
  };

  const getImpactLevelColor = (level: string) => {
    return impactLevelColors[level] || 'bg-gray-100 text-gray-800';
  };

  const getImpactLevelIcon = (level: string) => {
    return impactLevelIcons[level] || <AlertCircle className="h-4 w-4" />;
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <Alert variant="destructive">
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={loadEventAndTheses}>重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回事件详情
        </Button>
      </div>

      {/* 事件信息卡片 */}
      {event && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>事件信息</CardTitle>
            <CardDescription>
              {event.symbol} - {event.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{event.content}</p>
          </CardContent>
        </Card>
      )}

      {/* 选择论题 */}
      {!analysis && theses.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>选择论题</CardTitle>
            <CardDescription>
              选择要分析的论题，AI将分析该事件对论题的影响
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {theses.map((thesis) => (
                <div
                  key={thesis.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedThesisId === thesis.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedThesisId(thesis.id)}
                >
                  <h3 className="font-medium mb-1">{thesis.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {thesis.summary?.substring(0, 100)}...
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    健康度: {thesis.healthScore}%
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button
                onClick={generateAnalysis}
                disabled={generating || !selectedThesisId}
                className="gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI分析中...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    生成事件分析
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分析结果 */}
      {analysis && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Badge className={getThesisImpactColor(analysis.thesisImpact)}>
                  {getThesisImpactLabel(analysis.thesisImpact)}
                </Badge>
                <Badge className={getImpactLevelColor(analysis.impactLevel)}>
                  {getImpactLevelIcon(analysis.impactLevel)}
                  <span className="ml-1">
                    {analysis.impactLevel === 'high' ? '高' :
                     analysis.impactLevel === 'medium' ? '中' : '低'}影响
                  </span>
                </Badge>
              </div>
              <span className={`font-bold ${getRelevanceColor(analysis.relevanceScore)}`}>
                相关度: {(analysis.relevanceScore * 100).toFixed(0)}%
              </span>
            </div>
            <CardTitle>AI分析结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 推理分析 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">推理分析</h3>
              <Alert>
                <AlertDescription>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {analysis.reasoning}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>

            {/* 证据支持 */}
            {analysis.evidenceJson && analysis.evidenceJson.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">证据支持</h3>
                <div className="space-y-2">
                  {analysis.evidenceJson.map((evidence: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{evidence}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 行动框架 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">行动框架</h3>
              <Alert>
                <AlertTitle>投资建议</AlertTitle>
                <AlertDescription>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {analysis.actionFramework}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分析完成后的操作 */}
      {analysis && (
        <div className="flex gap-4">
          <Button onClick={() => router.push(`/event-analysis/${analysis.id}`)}>
            查看分析详情
          </Button>
          <Button variant="outline" onClick={() => setAnalysis(null)}>
            重新分析
          </Button>
        </div>
      )}
    </div>
  );
}
