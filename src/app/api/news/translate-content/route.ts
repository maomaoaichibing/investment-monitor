/**
 * POST /api/news/translate-content
 * 翻译新闻全文为中文
 *
 * 请求体:
 * - url?: 原文URL（将抓取并翻译内容）
 * - content?: 原文内容（直接翻译）
 * - title?: 新闻标题（用于上下文）
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  translateArticleContent,
  extractArticleText
} from '@/server/services/newsService'
import { get as httpsGet } from 'https'

function httpsGetText(url: string, timeout = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url)
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        family: 4 // 强制 IPv4
      }
      const req = httpsGet(options, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location
          if (location) {
            res.destroy()
            httpsGetText(location, timeout).then(resolve).catch(reject)
            return
          }
        }
        let body = ''
        res.on('data', chunk => body += chunk)
        res.on('end', () => resolve(body))
      })
      req.on('error', reject)
      setTimeout(() => { req.destroy(); reject(new Error('timeout')) }, timeout)
    } catch (e) {
      reject(e)
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { url, content, title } = body

    let originalContent = content || ''

    // 如果提供了 URL，抓取页面内容
    if (url && !content) {
      try {
        const html = await httpsGetText(url, 15000)
        originalContent = extractArticleText(html)
        if (originalContent.length < 50) {
          return NextResponse.json({
            success: false,
            error: '无法提取文章内容，页面可能需要登录或不支持访问',
            original: ''
          }, { status: 200 })
        }
      } catch (e) {
        return NextResponse.json({
          success: false,
          error: `抓取原文失败: ${e instanceof Error ? e.message : '未知错误'}`,
          original: ''
        }, { status: 200 })
      }
    }

    if (!originalContent || originalContent.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: '没有提供原文内容',
        original: ''
      }, { status: 400 })
    }

    // 翻译
    const { translated } = await translateArticleContent(originalContent, title)

    return NextResponse.json({
      success: true,
      data: {
        original: originalContent.substring(0, 5000),
        translated,
        titleZh: title
      }
    }, { status: 200 })
  } catch (error) {
    console.error('[API/news/translate-content] error:', error)
    return NextResponse.json(
      { success: false, error: '翻译失败', detail: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
