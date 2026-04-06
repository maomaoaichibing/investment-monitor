import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/analytics/positions - 获取持仓分析数据
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const portfolioId = searchParams.get('portfolioId')

    // 获取持仓数据
    const positions = await db.position.findMany({
      where: portfolioId ? { portfolioId } : undefined,
      include: {
        portfolio: {
          select: { name: true }
        }
      },
      orderBy: { positionWeight: 'desc' }
    })

    if (positions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          positions: [],
          industryDistribution: [],
          marketDistribution: [],
          styleDistribution: [],
          totalValue: 0
        }
      })
    }

    // 计算总市值
    const totalValue = positions.reduce((sum, p) => {
      const marketValue = p.marketValue || (p.costPrice * p.quantity)
      return sum + marketValue
    }, 0)

    // 按行业分组
    const industryMap = new Map<string, number>()
    positions.forEach(p => {
      const industry = p.industry || '其他'
      const marketValue = p.marketValue || (p.costPrice * p.quantity)
      industryMap.set(industry, (industryMap.get(industry) || 0) + marketValue)
    })

    const industryDistribution = Array.from(industryMap.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        percentage: Math.round((value / totalValue) * 10000) / 100
      }))
      .sort((a, b) => b.value - a.value)

    // 按市场分组
    const marketMap = new Map<string, number>()
    positions.forEach(p => {
      const marketValue = p.marketValue || (p.costPrice * p.quantity)
      const marketName = p.market === 'HK' ? '港股' : p.market === 'US' ? '美股' : p.market
      marketMap.set(marketName, (marketMap.get(marketName) || 0) + marketValue)
    })

    const marketDistribution = Array.from(marketMap.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        percentage: Math.round((value / totalValue) * 10000) / 100
      }))
      .sort((a, b) => b.value - a.value)

    // 按持有风格分组
    const styleMap = new Map<string, number>()
    positions.forEach(p => {
      const marketValue = p.marketValue || (p.costPrice * p.quantity)
      const styleName = p.holdingStyle === 'short_term' ? '短线' :
                       p.holdingStyle === 'swing' ? '波段' : '长线'
      styleMap.set(styleName, (styleMap.get(styleName) || 0) + marketValue)
    })

    const styleDistribution = Array.from(styleMap.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        percentage: Math.round((value / totalValue) * 10000) / 100
      }))
      .sort((a, b) => b.value - a.value)

    return NextResponse.json({
      success: true,
      data: {
        positions,
        industryDistribution,
        marketDistribution,
        styleDistribution,
        totalValue: Math.round(totalValue * 100) / 100
      }
    })
  } catch (error) {
    console.error('[Analytics API Error]', error)
    return NextResponse.json(
      { success: false, error: '获取分析数据失败' },
      { status: 500 }
    )
  }
}
