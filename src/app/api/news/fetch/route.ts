/**
 * POST /api/news/fetch
 * 抓取所有持仓的新闻并做情感分析
 * 
 * 请求体:
 * - symbol?: 仅抓取指定股票（可选，默认所有持仓）
 * - saveToDb?: 是否存入数据库（默认 true）
 * - analyzeSentiment?: 是否做情感分析（默认 true）
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  fetchNewsForSymbol,
  fetchNewsForAllPositions,
  saveNewsToEvents,
  ruleBasedSentiment,
  translateNewsTitles
} from '@/server/services/newsService'
import { db } from '@/lib/db'
import { alertService } from '@/server/services/alertService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { symbol, market, saveToDb = true, analyzeSentiment = true } = body
    
    let newsResults: { news: any[]; bySymbol: Record<string, any[]>; errors: Record<string, string> }
    
    if (symbol) {
      // 抓取指定股票
      const result = await fetchNewsForSymbol(symbol, market || 'US', { limit: 20 })
      
      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error || '抓取失败',
          source: result.source
        }, { status: 200 })
      }
      
      let newsWithSentiment = result.data || []
      
      // 情感分析
      if (analyzeSentiment) {
        newsWithSentiment = newsWithSentiment.map(item => {
          const { sentiment, score } = ruleBasedSentiment(item.title + ' ' + item.content)
          return { ...item, sentiment, sentimentScore: score }
        })
      }

      // 翻译标题为中文
      try {
        newsWithSentiment = await translateNewsTitles(newsWithSentiment)
      } catch (e) {
        console.error('[API/news/fetch] 翻译失败:', e)
      }

      // 存入数据库
      if (saveToDb) {
        const { saved, skipped, errors } = await saveNewsToEvents(newsWithSentiment)
        console.log(`[API/news/fetch] ${symbol}: 保存 ${saved} 条, 跳过 ${skipped} 条`)
      }
      
      return NextResponse.json({
        success: true,
        data: {
          symbol,
          news: newsWithSentiment,
          source: result.source,
          fetchedAt: result.fetchedAt
        }
      })
    } else {
      // 抓取所有持仓
      newsResults = await fetchNewsForAllPositions({ limitPerSymbol: 10 })
      
      // 情感分析
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

      // 翻译标题为中文（只翻译前3条，默认展示量，10个标的并行请求节省时间）
      try {
        const symKeys = Object.keys(newsResults.bySymbol)
        const symTranslations = await Promise.all(
          symKeys.map(async sym => {
            const top3 = newsResults.bySymbol[sym].slice(0, 3)
            const translated = await translateNewsTitles(top3)
            return { sym, translated }
          })
        )
        // 合并翻译结果
        for (const { sym, translated } of symTranslations) {
          newsResults.bySymbol[sym] = [
            ...translated,
            ...newsResults.bySymbol[sym].slice(3)
          ]
        }
        // 总新闻列表也只翻译前30条
        const topTotal = newsResults.news.slice(0, 30)
        const translatedTotal = await translateNewsTitles(topTotal)
        newsResults.news = [
          ...translatedTotal,
          ...newsResults.news.slice(30)
        ]
      } catch (e) {
        console.error('[API/news/fetch] 翻译失败:', e)
      }

      // 存入数据库
      if (saveToDb) {
        const { saved, skipped, errors } = await saveNewsToEvents(newsResults.news)
        
        // 为高情感得分的新闻创建 Alert（|score| >= 0.5）
        const significantNews = newsResults.news.filter(n => {
          const score = n.sentimentScore || 0
          return Math.abs(score) >= 0.5
        })
        
        let alertsCreated = 0
        for (const item of significantNews.slice(0, 5)) { // 最多创建5个
          try {
            // 找到关联的持仓
            const position = await db.position.findFirst({
              where: { symbol: item.symbol }
            })
            
            if (position) {
              // 先找最新事件
              const event = await db.event.findFirst({
                where: { symbol: item.symbol, title: item.title }
              })
              
              if (event) {
                const level = Math.abs(item.sentimentScore || 0) >= 0.7 ? 'important' : 'watch'
                const impactLabel = (item.sentimentScore || 0) > 0 ? '正面' : '负面'
                
                await alertService.createAlert({
                  positionId: position.id,
                  eventId: event.id,
                  level,
                  title: `${impactLabel}新闻: ${item.title.substring(0, 50)}${item.title.length > 50 ? '...' : ''}`,
                  summary: `${item.newsSource || item.source} | 情感: ${impactLabel}(${item.sentimentScore}) | ${item.content.substring(0, 100)}`
                })
                
                alertsCreated++
              }
            }
          } catch (e) {
            console.error('[API/news/fetch] 创建 Alert 失败:', e)
          }
        }
        
        return NextResponse.json({
          success: true,
          data: {
            summary: {
              totalNews: newsResults.news.length,
              symbolsWithNews: Object.keys(newsResults.bySymbol).length,
              errors: Object.keys(newsResults.errors).length
            },
            bySymbol: newsResults.bySymbol,
            saved,
            skipped,
            alertsCreated,
            fetchedAt: new Date().toISOString()
          }
        })
      }
      
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalNews: newsResults.news.length,
            symbolsWithNews: Object.keys(newsResults.bySymbol).length
          },
          bySymbol: newsResults.bySymbol,
          errors: newsResults.errors
        }
      })
    }
  } catch (error) {
    console.error('[API/news/fetch] error:', error)
    return NextResponse.json(
      { success: false, error: '抓取新闻失败', detail: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
