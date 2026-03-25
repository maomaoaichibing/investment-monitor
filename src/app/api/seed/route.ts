import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // 检查是否已有论题
    const existingThesis = await db.thesis.findFirst()
    if (existingThesis) {
      return NextResponse.json({ 
        success: true, 
        message: '测试数据已存在',
        thesis: existingThesis
      })
    }

    // 查找第一个portfolio
    const portfolio = await db.portfolio.findFirst()
    if (!portfolio) {
      return NextResponse.json({ 
        success: false, 
        error: '没有组合数据，请先创建组合' 
      }, { status: 400 })
    }

    // 查找第一个position
    const position = await db.position.findFirst()
    if (!position) {
      return NextResponse.json({ 
        success: false, 
        error: '没有持仓数据，请先创建持仓' 
      }, { status: 400 })
    }

    // 创建测试论题
    const thesis = await db.thesis.create({
      data: {
        positionId: position.id,
        portfolioId: portfolio.id,
        title: `${position.symbol}投资论题`,
        summary: `${position.assetName}长期看好，关注业绩表现`,
        content: `${position.assetName}长期看好，关注业绩表现`,
        investmentStyle: 'growth',
        holdingPeriod: 'long_term',
        pricePhasesJson: JSON.stringify([
          { phase: '建仓期', description: '逐步建仓', keyLevels: ['150'] }
        ]),
        coreThesisJson: JSON.stringify([
          { title: '业绩稳健', description: '公司基本面良好', conviction: 8 }
        ]),
        fragilePointsJson: JSON.stringify([
          '宏观经济波动',
          '行业竞争加剧'
        ]),
        monitorTargetsJson: JSON.stringify([
          { type: 'price', condition: '股价跌破140', action: '减仓' },
          { type: 'fundamental', condition: '季度业绩下滑', action: '重新评估' }
        ]),
        status: 'generated'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: '测试数据创建成功',
      thesis
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
