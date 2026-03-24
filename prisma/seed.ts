import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.alert.deleteMany()
  await prisma.eventAnalysis.deleteMany()
  await prisma.event.deleteMany()
  await prisma.monitorPlan.deleteMany()
  await prisma.thesis.deleteMany()
  await prisma.position.deleteMany()
  await prisma.portfolio.deleteMany()

  // Create portfolios
  const portfolio1 = await prisma.portfolio.create({
    data: {
      name: 'Technology Growth',
      description: 'High-growth tech stocks with AI exposure',
    },
  })

  const portfolio2 = await prisma.portfolio.create({
    data: {
      name: 'Defensive Income',
      description: 'Dividend stocks and defensive sectors',
    },
  })

  // Create positions for portfolio 1
  const position1 = await prisma.position.create({
    data: {
      portfolioId: portfolio1.id,
      symbol: 'NVDA',
      assetName: 'NVIDIA Corporation',
      market: 'NASDAQ',
      quantity: 100,
      costPrice: 450.50,
      positionWeight: 25.0,
      holdingStyle: 'long_term',
      note: 'AI chip leader with strong growth prospects',
    },
  })

  const position2 = await prisma.position.create({
    data: {
      portfolioId: portfolio1.id,
      symbol: 'AAPL',
      assetName: 'Apple Inc.',
      market: 'NASDAQ',
      quantity: 50,
      costPrice: 180.25,
      positionWeight: 15.0,
      holdingStyle: 'long_term',
      note: 'Strong ecosystem and services growth',
    },
  })

  const position3 = await prisma.position.create({
    data: {
      portfolioId: portfolio2.id,
      symbol: '518880.SH',
      assetName: '华安黄金ETF',
      market: 'SSE',
      quantity: 10000,
      costPrice: 4.25,
      positionWeight: 30.0,
      holdingStyle: 'swing',
      note: '黄金避险资产，对冲市场波动',
    },
  })

  // Create thesis for positions
  const thesis1 = await prisma.thesis.create({
    data: {
      positionId: position1.id,
      portfolioId: portfolio1.id,
      title: 'NVIDIA AI计算革命投资论题',
      summary: 'NVIDIA是AI计算革命的领导者，其GPU产品在数据中心和AI训练领域占据绝对主导地位。核心投资逻辑在于AI基础设施的持续扩张和软件生态的深化。',
      content: `## 核心投资逻辑

### 1. AI基础设施领导者
- GPU在AI训练领域的绝对主导地位
- CUDA生态系统的护城河效应
- 数据中心业务持续高速增长

### 2. 市场催化剂
- 全球AI投资热潮
- 大模型训练需求爆发
- 边缘AI计算的新增长点

### 3. 风险因素
- 竞争对手追赶压力
- 地缘政治风险
- 技术迭代风险`,
      investmentStyle: 'growth',
      holdingPeriod: 'long_term',
      pricePhasesJson: JSON.stringify([
        {
          phase: 'AI驱动主升浪',
          description: '受益于全球AI投资热潮，机构资金持续流入',
          keyLevels: ['$450支撑', '$520阻力']
        },
        {
          phase: '技术性盘整',
          description: '估值达到高位后需要时间消化，等待基本面验证',
          keyLevels: ['$480关键位']
        }
      ]),
      coreThesisJson: JSON.stringify([
        {
          title: 'AI基础设施核心供应商',
          description: 'NVIDIA GPU是AI训练和推理的黄金标准，生态系统护城河深厚',
          conviction: 9
        },
        {
          title: '软件转型提升估值',
          description: 'CUDA生态系统和AI软件服务创造高毛利、可持续的收入来源',
          conviction: 8
        }
      ]),
      fragilePointsJson: JSON.stringify([
        '地缘政治风险（出口管制）',
        '竞争加剧（AMD、Intel、国产替代）',
        '估值过高，需要业绩持续超预期支撑',
        '单一客户依赖（大型云厂商）'
      ]),
      monitorTargetsJson: JSON.stringify([
        {
          type: '业绩指引',
          condition: '下季度数据中心营收增速低于30%',
          action: '重新评估增长预期'
        },
        {
          type: '技术面',
          condition: '股价跌破$450关键支撑',
          action: '部分减仓，等待企稳'
        },
        {
          type: '竞争动态',
          condition: 'AMD MI300系列市场份额超预期',
          action: '评估竞争格局变化'
        }
      ]),
    },
  })

  // Create monitor plans
  await prisma.monitorPlan.create({
    data: {
      positionId: position1.id,
      thesisId: thesis1.id,
      title: 'NVIDIA AI投资监控计划',
      description: '监控NVIDIA在AI计算领域的核心指标和潜在风险信号',
      priority: 'high',
      reviewFrequency: 'weekly',
      monitorItemsJson: JSON.stringify({
        watchItems: [
          {
            name: '数据中心收入增长率',
            category: 'fundamental',
            frequency: 'quarterly',
            importance: 'high',
            source: '财报',
          },
        ],
        reviewFrequency: 'weekly',
        notes: '重点监控AI计算需求增长趋势',
      }),
      triggerConditionsJson: JSON.stringify([
        {
          condition: '数据中心营收环比增长低于5%',
          description: '核心增长引擎放缓',
          action: '重新评估增长预期，考虑部分减仓',
          priority: 'high',
          requiresConfirmation: true,
          confirmationMethod: 'ai'
        }
      ]),
      disconfirmSignals: JSON.stringify([]),
      actionHints: JSON.stringify([]),
      status: 'active',
    },
  })

  // Create events
  const event1 = await prisma.event.create({
    data: {
      symbol: 'NVDA',
      eventType: 'earnings',
      title: 'Q4 2025 Earnings Release',
      content: 'NVIDIA reported Q4 earnings with revenue of $28 billion, slightly below consensus estimates of $28.5 billion. Data center revenue grew 40% YoY but showed sequential deceleration.',
      eventTime: new Date('2026-01-25'),
      source: 'company',
      metadataJson: JSON.stringify({
        revenue: 28000000000,
        eps: 4.25,
        guidance: 'cautious'
      }),
    },
  })

  // Create event analysis
  const eventAnalysis1 = await prisma.eventAnalysis.create({
    data: {
      eventId: event1.id,
      positionId: position1.id,
      thesisId: thesis1.id,
      relevanceScore: 0.89,
      thesisImpact: 'weaken',
      impactLevel: 'high',
      reasoning: '营收略低于预期，数据中心业务增速放缓，管理层指引谨慎',
      evidenceJson: JSON.stringify([
        '营收280亿 vs 预期285亿',
        '数据中心业务环比增长放缓',
        '下一季度指引低于预期'
      ]),
      actionFramework: '将风险等级提升为重要，密切关注下季度财报。若增速继续放缓，考虑降低仓位。',
    },
  })

  // Create alert
  await prisma.alert.create({
    data: {
      positionId: position1.id,
      eventId: event1.id,
      eventAnalysisId: eventAnalysis1.id,
      level: 'important',
      title: 'Earnings Miss - Growth Concerns',
      summary: 'NVIDIA Q4 earnings slightly missed expectations, data center growth slowing',
      status: 'unread',
      sentAt: new Date(),
    },
  })

  console.log('Database seeded successfully!')
  console.log(`Created: 
  - Portfolios: 2
  - Positions: 3
  - Thesis: 1
  - Monitor Plans: 1
  - Events: 1
  - Event Analyses: 1
  - Alerts: 1`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })