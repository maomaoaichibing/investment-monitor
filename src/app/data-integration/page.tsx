'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Globe, MessageCircle, TrendingUp, RefreshCw, Clock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface NewsArticle {
  id: string
  title: string
  summary: string
  source: string
  url: string
  publishedAt: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  relevanceScore: number
}

interface CompanyAnnouncement {
  id: string
  title: string
  content: string
  symbol: string
  type: string
  publishedAt: string
  url: string
}

interface SocialMediaPost {
  id: string
  content: string
  platform: string
  author: string
  publishedAt: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  engagement: number
}

interface IndustryData {
  id: string
  industry: string
  metric: string
  value: string
  period: string
  source: string
}

interface IntegrationStats {
  news: { total: number; today: number }
  announcements: { total: number; today: number }
  socialMedia: { total: number; today: number }
  industryData: { total: number; lastUpdate: string }
}

export default function DataIntegrationPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<IntegrationStats | null>(null)
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([])
  const [recentAnnouncements, setRecentAnnouncements] = useState<CompanyAnnouncement[]>([])
  const [recentSocialMedia, setRecentSocialMedia] = useState<SocialMediaPost[]>([])
  const [industryData, setIndustryData] = useState<IndustryData[]>([])
  const [isIntegrating, setIsIntegrating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    loadOverviewData()
  }, [])

  const loadOverviewData = async () => {
    setLoading(true)
    try {
      // 加载统计数据
      const statsResponse = await fetch('/api/data-integration/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData || null)
      }

      // 加载最近的数据
      await Promise.all([
        loadRecentNews(),
        loadRecentAnnouncements(),
        loadRecentSocialMedia(),
        loadIndustryData()
      ])
    } catch (error) {
      setErrorMessage('无法加载数据集成概览')
    } finally {
      setLoading(false)
    }
  }

  const loadRecentNews = async () => {
    try {
      const response = await fetch('/api/data-integration/news?limit=5')
      if (response.ok) {
        const result = await response.json()
        setRecentNews(result.data?.news || [])
      }
    } catch (error) {
      console.error('加载新闻失败:', error)
    }
  }

  const loadRecentAnnouncements = async () => {
    try {
      const response = await fetch('/api/data-integration/announcements?limit=5')
      if (response.ok) {
        const result = await response.json()
        setRecentAnnouncements(result.data?.announcements || [])
      }
    } catch (error) {
      console.error('加载公告失败:', error)
    }
  }

  const loadRecentSocialMedia = async () => {
    try {
      const response = await fetch('/api/data-integration/social-media?limit=5')
      if (response.ok) {
        const result = await response.json()
        setRecentSocialMedia(result.data?.posts || [])
      }
    } catch (error) {
      console.error('加载社交媒体数据失败:', error)
    }
  }

  const loadIndustryData = async () => {
    try {
      const response = await fetch('/api/data-integration/industry?limit=5')
      if (response.ok) {
        const result = await response.json()
        setIndustryData(result.data?.industryData || [])
      }
    } catch (error) {
      console.error('加载行业数据失败:', error)
    }
  }

  const handleIntegrateAll = async () => {
    setIsIntegrating(true)
    try {
      const response = await fetch('/api/data-integration/integrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeNews: true,
          includeAnnouncements: true,
          includeSocialMedia: true,
          includeIndustryData: true,
          symbol: 'TSLA' // 示例股票
        })
      })

      if (!response.ok) throw new Error('集成失败')

      const result = await response.json()
      
      setErrorMessage(`成功集成 ${result.totalItems} 条数据`)
      loadOverviewData()
    } catch (error) {
      setErrorMessage('数据集成过程中发生错误')
    } finally {
      setIsIntegrating(false)
    }
  }

  const getSentimentBadge = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <Badge className="bg-green-500">正面</Badge>
      case 'negative':
        return <Badge className="bg-red-500">负面</Badge>
      case 'neutral':
        return <Badge variant="secondary">中性</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const getRelevanceProgress = (score: number) => {
    return <Progress value={score * 100} className="h-2" />
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">数据集成中心</h1>
          <p className="text-muted-foreground">
            集成新闻、公告、社交媒体和行业数据，为投资决策提供全面信息
          </p>
        </div>
        <Button onClick={handleIntegrateAll} disabled={isIntegrating}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isIntegrating ? 'animate-spin' : ''}`} />
          {isIntegrating ? '集成中...' : '一键集成'}
        </Button>
      </div>

      {errorMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}

      {/* 概览统计 */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">新闻资讯</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.news.total}</div>
              <p className="text-xs text-muted-foreground">
                今日新增: {stats.news.today}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">公司公告</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.announcements.total}</div>
              <p className="text-xs text-muted-foreground">
                今日新增: {stats.announcements.today}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">社交媒体</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.socialMedia.total}</div>
              <p className="text-xs text-muted-foreground">
                今日新增: {stats.socialMedia.today}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">行业数据</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.industryData.total}</div>
              <p className="text-xs text-muted-foreground">
                最后更新: {new Date(stats.industryData.lastUpdate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="news">新闻资讯</TabsTrigger>
          <TabsTrigger value="announcements">公司公告</TabsTrigger>
          <TabsTrigger value="social">社交媒体</TabsTrigger>
          <TabsTrigger value="industry">行业数据</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* 最近新闻 */}
          <Card>
            <CardHeader>
              <CardTitle>最近新闻</CardTitle>
              <CardDescription>最近集成的新闻资讯</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentNews.map((article) => (
                  <div key={article.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{article.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.summary}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{article.source}</span>
                          <span>{new Date(article.publishedAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSentimentBadge(article.sentiment)}
                        <Badge variant="secondary">
                          相关度: {(article.relevanceScore * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    {getRelevanceProgress(article.relevanceScore)}
                  </div>
                ))}
                {recentNews.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无新闻数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 最近公告 */}
          <Card>
            <CardHeader>
              <CardTitle>最近公告</CardTitle>
              <CardDescription>最近集成的公司公告</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-medium">{announcement.symbol}</span>
                          <span>{announcement.type}</span>
                          <span>{new Date(announcement.publishedAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <Badge variant="secondary">公告</Badge>
                    </div>
                  </div>
                ))}
                {recentAnnouncements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无公告数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news">
          <Card>
            <CardHeader>
              <CardTitle>新闻资讯</CardTitle>
              <CardDescription>所有集成的新闻资讯</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                新闻列表页面开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>公司公告</CardTitle>
              <CardDescription>所有集成的公司公告</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                公告列表页面开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>社交媒体</CardTitle>
              <CardDescription>社交媒体情绪和讨论</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSocialMedia.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm">{post.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-medium">@{post.author}</span>
                          <span>{post.platform}</span>
                          <span>{new Date(post.publishedAt).toLocaleString()}</span>
                          <span>互动: {post.engagement}</span>
                        </div>
                      </div>
                      {getSentimentBadge(post.sentiment)}
                    </div>
                  </div>
                ))}
                {recentSocialMedia.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无社交媒体数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industry">
          <Card>
            <CardHeader>
              <CardTitle>行业数据</CardTitle>
              <CardDescription>行业指标和数据</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {industryData.map((data) => (
                  <div key={data.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{data.industry} - {data.metric}</h4>
                        <p className="text-sm text-muted-foreground">
                          周期: {data.period} | 来源: {data.source}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-lg">
                        {data.value}
                      </Badge>
                    </div>
                  </div>
                ))}
                {industryData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无行业数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}