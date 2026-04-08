/**
 * GET /api/news/fetch — 读取缓存的新闻数据
 * 查询参数:
 * - refresh=true: 强制刷新（绕过缓存重新抓取）
 *
 * POST /api/news/fetch — 抓取新闻并存入数据库
 * 请求体:
 * - symbol?: 仅抓取指定股票
 * - market?: 市场类型（US/HK/CN）
 * - saveToDb?: 是否存入数据库（默认 true）
 * - analyzeSentiment?: 是否做情感分析（默认 true）
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  fetchNewsForSymbol,
  fetchNewsForAllPositions,
  saveNewsToEvents,
  ruleBasedSentiment,
  translateNewsTitles,
  NewsItem
} from '@/server/services/newsService'
import { db } from '@/lib/db'
import { alertService } from '@/server/services/alertService'
import { getCache, setCache } from '@/server/services/stockCache'

const NEWS_CACHE_KEY = 'news:fetch:all'
const NEWS_CACHE_TTL = 10 * 60 * 1000 // 10分钟

// ==================== GET（读缓存） ====================
export async function GET(request: NextRequest) {
  const refresh = new URL(request.url).searchParams.get('refresh') === 'true'

  // 读缓存（refresh=false 时）
  if (!refresh) {
    try {
      const cached = getCache<Record<string, any>>(NEWS_CACHE_KEY, NEWS_CACHE_TTL)
      if (cached) {
        return NextResponse.json({
          success: true,
          data: cached,
          source: 'cache'
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=300' }
        })
      }
    } catch (e) {
      console.warn('[API/news/fetch GET] 读缓存失败:', e)
    }
  }

  // 缓存未命中或 refresh=true → 重新抓取（内部调用核心逻辑）
  const result = await performNewsFetch({ saveToDb: true, analyzeSentiment: true })

  if (!result.success || !result.data) {
    return NextResponse.json({ success: false, error: result.error || '抓取失败' }, { status: 500 })
  }

  // 写入缓存
  try {
    setCache(NEWS_CACHE_KEY, result.data)
  } catch (e) {
    console.warn('[API/news/fetch GET] 写缓存失败:', e)
  }

  return NextResponse.json({
    success: true,
    data: result.data,
    source: refresh ? 'fetch-fresh' : 'fetch',
    fetchedAt: result.data.fetchedAt
  })
}

// ==================== POST（重新抓取） ====================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { symbol, market, saveToDb = true, analyzeSentiment = true } = body

    const result = await performNewsFetch({ symbol, market, saveToDb, analyzeSentiment })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 200 })
    }

    // POST 命中也更新缓存（保证 GET 能拿到最新数据）
    try { setCache(NEWS_CACHE_KEY, result.data) } catch (e) {}

    return NextResponse.json({
      success: true,
      data: result.data,
      source: 'fetch'
    })
  } catch (error) {
    console.error('[API/news/fetch POST] error:', error)
    return NextResponse.json(
      { success: false, error: '抓取新闻失败', detail: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// ==================== 核心抓取逻辑（GET/POST 共用） ====================
async function performNewsFetch(options: {
  symbol?: string
  market?: string
  saveToDb?: boolean
  analyzeSentiment?: boolean
}) {
  const { symbol, market, saveToDb = true, analyzeSentiment = true } = options

  if (symbol) {
    // 单标的抓取
    const result = await fetchNewsForSymbol(symbol, market || 'US', { limit: 20 })

    if (!result.success) {
      return { success: false, error: result.error || '抓取失败', data: null }
    }

    let newsWithSentiment = result.data || []

    if (analyzeSentiment) {
      newsWithSentiment = newsWithSentiment.map(item => {
        const { sentiment, score } = ruleBasedSentiment(item.title + ' ' + item.content)
        return { ...item, sentiment, sentimentScore: score }
      })
    }

    try {
      newsWithSentiment = await translateNewsTitles(newsWithSentiment)
    } catch (e) {
      console.error('[API/news/fetch] 翻译失败:', e)
    }

    let saved = 0, skipped = 0
    if (saveToDb) {
      const r = await saveNewsToEvents(newsWithSentiment)
      saved = r.saved; skipped = r.skipped
      console.log(`[API/news/fetch] ${symbol}: 保存 ${saved} 条, 跳过 ${skipped} 条`)
    }

    return {
      success: true,
      data: { symbol, news: newsWithSentiment, source: result.source, fetchedAt: result.fetchedAt, saved, skipped }
    }
  } else {
    // 全量抓取（所有持仓）
    const newsResults: { news: NewsItem[]; bySymbol: Record<string, NewsItem[]>; errors: Record<string, string> } =
      await fetchNewsForAllPositions({ limitPerSymbol: 10 })

    if (analyzeSentiment) {
      for (const sym of Object.keys(newsResults.bySymbol)) {
        newsResults.bySymbol[sym] = newsResults.bySymbol[sym].map(item => {
          const { sentiment, score } = ruleBasedSentiment(item.title + ' ' + item.content)
          return { ...item, sentiment, sentimentScore: score }
        })
      }
      newsResults.news = newsResults.news.map(item => {
        const { sentiment, score } = ruleBasedSentiment(item.title + ' ' + item.content)
        return { ...item, sentiment, sentimentScore: score }
      })
    }

    try {
      const symKeys = Object.keys(newsResults.bySymbol)
      const symTranslations = await Promise.all(
        symKeys.map(async sym => {
          const allItems = newsResults.bySymbol[sym]
          const translated = await translateNewsTitles(allItems)
          return { sym, translated }
        })
      )
      for (const { sym, translated } of symTranslations) {
        newsResults.bySymbol[sym] = translated
      }
      const topTotal = newsResults.news.slice(0, 30)
      const translatedTotal = await translateNewsTitles(topTotal)
      newsResults.news = [...translatedTotal, ...newsResults.news.slice(30)]
    } catch (e) {
      console.error('[API/news/fetch] 翻译失败:', e)
    }

    let saved = 0, skipped = 0
    if (saveToDb) {
      const r = await saveNewsToEvents(newsResults.news)
      saved = r.saved; skipped = r.skipped
      console.log(`[API/news/fetch] 全量: 保存 ${saved} 条, 跳过 ${skipped} 条`)

      // 为高情感得分的新闻创建 Alert
      const significantNews = newsResults.news.filter(n => Math.abs(n.sentimentScore || 0) >= 0.5)
      for (const item of significantNews.slice(0, 5)) {
        try {
          const position = await db.position.findFirst({ where: { symbol: item.symbol } })
          if (!position) continue
          const event = await db.event.findFirst({ where: { symbol: item.symbol, title: item.title } })
          if (!event) continue
          const level = Math.abs(item.sentimentScore || 0) >= 0.7 ? 'important' : 'watch'
          const impactLabel = (item.sentimentScore || 0) > 0 ? '正面' : '负面'
          await alertService.createAlert({
            positionId: position.id,
            eventId: event.id,
            level,
            title: `${impactLabel}新闻: ${item.title.substring(0, 50)}${item.title.length > 50 ? '...' : ''}`,
            summary: `${(item as any).newsSource || item.source} | 情感: ${impactLabel}(${item.sentimentScore}) | ${item.content.substring(0, 100)}`
          })
        } catch (e) {
          console.error('[API/news/fetch] 创建 Alert 失败:', e)
        }
      }
    }

    const fetchedAt = new Date().toISOString()
    return {
      success: true,
      data: {
        summary: {
          totalNews: newsResults.news.length,
          symbolsWithNews: Object.keys(newsResults.bySymbol).length,
          errors: Object.keys(newsResults.errors).length
        },
        bySymbol: newsResults.bySymbol,
        errors: newsResults.errors,
        saved,
        skipped,
        fetchedAt
      }
    }
  }
}
