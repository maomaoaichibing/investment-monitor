/**
 * 大盘指数服务
 * 获取A股、港股、美股主要指数
 */

import { getCache, setCache } from './stockCache'

export interface MarketIndex {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  market: string
  updateTime: string
}

export interface MarketOverview {
  A股: {
    上证指数: MarketIndex
    深证成指: MarketIndex
    创业板: MarketIndex
  }
  港股: {
    恒生指数: MarketIndex
    恒生国企指数: MarketIndex
  }
  美股: {
    道琼斯: MarketIndex
    纳斯达克: MarketIndex
    标普500: MarketIndex
  }
}

// 腾讯财经指数代码
const TENCENT_INDEX_CODES: Record<string, { code: string; market: string }> = {
  // A股
  '上证指数': { code: 'sh000001', market: 'A' },
  '深证成指': { code: 'sz399001', market: 'A' },
  '创业板': { code: 'sz399006', market: 'A' },
  // 港股
  '恒生指数': { code: 'hkHSI', market: 'HK' },
  '恒生国企指数': { code: 'hkHSCEI', market: 'HK' },
  // 美股
  '道琼斯': { code: 'usDJI', market: 'US' },
  '纳斯达克': { code: 'usIXIC', market: 'US' },
  '标普500': { code: 'usSPX', market: 'US' },
}

async function fetchFromTencent(codes: string[]): Promise<Record<string, MarketIndex | null>> {
  const results: Record<string, MarketIndex | null> = {}

  try {
    const url = `https://qt.gtimg.cn/q=${codes.join(',')}`
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.qq.com',
        'User-Agent': 'Mozilla/5.0'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const text = await response.text()
    const lines = text.split('\n')

    for (const line of lines) {
      const match = line.match(/v_(\w+)="([^"]+)"/)
      if (!match) continue

      const [, code, data] = match
      const fields = data.split('~')

      if (fields.length < 10) continue

      const name = fields[1]
      const price = parseFloat(fields[3]) || 0
      const prevClose = parseFloat(fields[4]) || 0
      const change = price - prevClose
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

      // 确定市场
      let market = 'A'
      if (code.startsWith('hk')) market = 'HK'
      else if (code.startsWith('us')) market = 'US'

      results[code] = {
        code,
        name,
        price,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        market,
        updateTime: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Fetch from Tencent failed:', error)
  }

  return results
}

export async function getMarketOverview(): Promise<{
  success: boolean
  data?: MarketOverview
  error?: string
}> {
  const cacheKey = 'market:overview'

  // 检查缓存
  const cached = getCache<MarketOverview>(cacheKey, 60 * 1000)
  if (cached) {
    return { success: true, data: cached }
  }

  try {
    // 构建查询代码列表
    const codes = Object.values(TENCENT_INDEX_CODES).map(v => v.code)

    // 批量获取
    const results = await fetchFromTencent(codes)

    // 构建返回数据
    const overview: MarketOverview = {
      A股: {
        上证指数: results['sh000001'] || { code: 'sh000001', name: '上证指数', price: 0, change: 0, changePercent: 0, market: 'A', updateTime: '' },
        深证成指: results['sz399001'] || { code: 'sz399001', name: '深证成指', price: 0, change: 0, changePercent: 0, market: 'A', updateTime: '' },
        创业板: results['sz399006'] || { code: 'sz399006', name: '创业板', price: 0, change: 0, changePercent: 0, market: 'A', updateTime: '' },
      },
      港股: {
        恒生指数: results['hkHSI'] || { code: 'hkHSI', name: '恒生指数', price: 0, change: 0, changePercent: 0, market: 'HK', updateTime: '' },
        恒生国企指数: results['hkHSCEI'] || { code: 'hkHSCEI', name: '恒生国企指数', price: 0, change: 0, changePercent: 0, market: 'HK', updateTime: '' },
      },
      美股: {
        道琼斯: results['usDJI'] || { code: 'usDJI', name: '道琼斯', price: 0, change: 0, changePercent: 0, market: 'US', updateTime: '' },
        纳斯达克: results['usIXIC'] || { code: 'usIXIC', name: '纳斯达克', price: 0, change: 0, changePercent: 0, market: 'US', updateTime: '' },
        标普500: results['usSPX'] || { code: 'usSPX', name: '标普500', price: 0, change: 0, changePercent: 0, market: 'US', updateTime: '' },
      }
    }

    // 缓存结果
    setCache(cacheKey, overview)

    return { success: true, data: overview }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取失败'
    }
  }
}
