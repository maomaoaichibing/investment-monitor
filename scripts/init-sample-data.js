const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 开始初始化示例数据...')

  // 1. 插入Prompt模板
  console.log('📄 插入Prompt模板...')
  let templateCount = 0
  
  const templates = [
    {
      name: '投资论题生成模板',
      description: '用于生成股票投资论题的标准模板',
      modelType: 'thesis_generation',
      provider: 'kimi',
      template: `你是一个专业的投资分析师。请为股票{symbol}生成投资论题。

股票信息：
- 股票代码: {symbol}
- 公司名称: {companyName}
- 行业: {industry}
- 当前价格: {currentPrice}

请按照以下结构生成投资论题：
1. 核心投资逻辑（可量化的核心假设）
2. 增长驱动力分析
3. 关键监控指标
4. 风险因素
5. 投资期限建议

要求：
- 论点必须具体、可验证
- 提供明确的监控指标和触发条件
- 包含估值分析
- 考虑行业周期位置`,
      variables: 'symbol,companyName,industry,currentPrice',
      examples: JSON.stringify({
        example1: '生成腾讯控股的投资论题',
        example2: '分析新能源汽车行业投资机会'
      }),
      version: '1.0'
    },
    {
      name: '事件影响分析模板',
      description: '分析重大事件对投资论题的影响',
      modelType: 'event_analysis',
      provider: 'kimi',
      template: `你是一个专业的投资分析师。请分析以下事件对投资论题的影响。

事件信息：
{eventDetails}

投资论题：
{thesisSummary}

请分析：
1. 事件相关度评分（0-100）
2. 对核心假设的影响（加强/维持/削弱/反转）
3. 影响程度（高/中/低）
4. 具体推理过程
5. 建议行动框架
6. 更新后的论题健康度评分

输出JSON格式：
{
  "relevanceScore": number,
  "thesisImpact": "strengthen|maintain|weaken|reverse",
  "impactLevel": "high|medium|low",
  "reasoning": "详细推理",
  "actionFramework": "具体建议",
  "newHealthScore": number
}`,
      variables: 'eventDetails,thesisSummary',
      version: '1.0'
    },
    {
      name: '提醒影响分析模板',
      description: '分析Alert提醒对投资论题的影响',
      modelType: 'alert_impact',
      provider: 'kimi',
      template: `分析提醒对投资论题的影响。

提醒内容：
{alertContent}

当前论题状态：
{thesisStatus}

请分析：
1. 影响方向（正面/负面/中性）
2. 影响程度（1-10）
3. 哪些核心假设受影响
4. 新的健康度评分
5. 建议行动`,
      variables: 'alertContent,thesisStatus',
      version: '1.0'
    },
    {
      name: '每日摘要生成模板',
      description: '生成每日投资监控摘要',
      modelType: 'daily_summary',
      provider: 'kimi',
      template: `请生成今日投资监控摘要。

今日数据：
{todayData}

请包含：
1. 关键提醒汇总
2. 重大变化
3. 即将发生的事件
4. 重点关注列表
5. 行动建议`,
      variables: 'todayData',
      version: '1.0'
    }
  ]
  
  for (const template of templates) {
    try {
      await prisma.promptTemplate.create({ data: template })
      templateCount++
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Prompt模板已存在: ${template.name}`)
      } else {
        throw error
      }
    }
  }
  console.log(`✅ 插入 ${templateCount} 个Prompt模板`)

  // 获取默认投资组合ID
  const portfolio = await prisma.portfolio.findFirst()
  if (!portfolio) {
    console.log('❌ 未找到投资组合，请先创建投资组合')
    return
  }

  // 2. 插入风险数据
  console.log('⚠️ 插入风险数据...')
  let riskCount = 0
  
  const risks = [
    {
      portfolioId: portfolio.id,
      riskType: 'market',
      riskLevel: 'medium',
      status: 'active',
      title: '美股市场波动率上升',
      description: 'VIX指数上升至25，市场不确定性增加，可能影响科技股表现',
      impact: 'negative',
      probability: 0.7,
      riskScore: 65,
      factorsJson: JSON.stringify({
        factors: [
          '美联储政策不确定性',
          '通胀数据超预期',
          '地缘政治风险'
        ]
      }),
      metricsJson: JSON.stringify({
        vixLevel: 25,
        spxVolatility: 18.5
      })
    },
    {
      portfolioId: portfolio.id,
      riskType: 'industry',
      riskLevel: 'high',
      status: 'active',
      title: '半导体行业库存调整',
      description: '半导体行业进入库存调整周期，可能影响相关股票Q2业绩',
      impact: 'negative',
      probability: 0.8,
      riskScore: 72,
      factorsJson: JSON.stringify({
        factors: [
          '消费电子需求疲软',
          '库存水平过高',
          '价格战压力'
        ]
      })
    },
    {
      portfolioId: portfolio.id,
      positionId: null,
      riskType: 'company',
      riskLevel: 'critical',
      status: 'active',
      title: '特斯拉交付量不及预期',
      description: '特斯拉Q1交付量低于市场预期，股价可能面临压力',
      impact: 'negative',
      probability: 0.9,
      riskScore: 85,
      factorsJson: JSON.stringify({
        factors: [
          '生产瓶颈',
          '竞争加剧',
          '价格下调影响利润'
        ]
      })
    },
    {
      portfolioId: portfolio.id,
      riskType: 'currency',
      riskLevel: 'medium',
      status: 'monitoring',
      title: '人民币汇率波动风险',
      description: '人民币对美元汇率波动可能影响港股持仓的汇率折算',
      impact: 'negative',
      probability: 0.6,
      riskScore: 55,
      factorsJson: JSON.stringify({
        factors: [
          '中美利差变化',
          '贸易顺差收窄',
          '资本流动'
        ]
      })
    },
    {
      portfolioId: portfolio.id,
      riskType: 'liquidity',
      riskLevel: 'low',
      status: 'monitoring',
      title: '小盘股流动性风险',
      description: '部分小盘股持仓流动性较差，大额交易可能影响价格',
      impact: 'negative',
      probability: 0.4,
      riskScore: 35,
      factorsJson: JSON.stringify({
        factors: [
          '日均成交量低',
          '买卖价差大',
          '机构持仓比例低'
        ]
      })
    }
  ]
  
  for (const risk of risks) {
    try {
      await prisma.risk.create({ data: risk })
      riskCount++
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  风险记录已存在: ${risk.title}`)
      } else {
        throw error
      }
    }
  }
  console.log(`✅ 插入 ${riskCount} 条风险记录`)

  console.log('🎉 示例数据初始化完成！')
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
