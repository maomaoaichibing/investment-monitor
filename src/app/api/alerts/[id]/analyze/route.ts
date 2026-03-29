import { NextRequest, NextResponse } from 'next/server'
import { alertService } from '@/server/services/alertService'
import { thesisService } from '@/server/services/thesisService'
import { llmService } from '@/server/llm/llmService'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/alerts/[id]/analyze
 * 对指定 Alert 进行影响分析，分析其对相关投资论点的潜在影响
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const alertId = params.id

    // 1. 获取 Alert 详情
    const alert = await alertService.getAlert(alertId)
    if (!alert) {
      return NextResponse.json({
        success: false,
        error: 'Alert不存在',
        data: { impactResult: null }
      }, { status: 404 })
    }

    // 2. 获取关联的持仓
    if (!alert.position) {
      return NextResponse.json({
        success: false,
        error: 'Alert没有关联持仓信息',
        data: { impactResult: null }
      }, { status: 400 })
    }

    const position = alert.position

    // 3. 获取该持仓的投资论题
    const thesis = await thesisService.getThesisByPosition(position.id)
    if (!thesis) {
      return NextResponse.json({
        success: false,
        error: '该持仓没有投资论题，请先生成Thesis',
        data: { impactResult: null }
      }, { status: 400 })
    }

    // 4. 解析 thesis 数据，提取 analyzeAlertImpact 所需的参数
    // 数据库中的字段可能是 pillarsJson（字符串）或 pillars（数组）
    let pillars: any[] = []
    try {
      if (thesis.pillarsJson) {
        pillars = typeof thesis.pillarsJson === 'string'
          ? JSON.parse(thesis.pillarsJson)
          : thesis.pillarsJson
      } else if ((thesis as any).pillars) {
        pillars = (thesis as any).pillars
      }
    } catch {
      pillars = []
    }

    // 获取核心论题作为备选
    let coreThesis: any[] = []
    try {
      if (thesis.coreThesisJson) {
        coreThesis = typeof thesis.coreThesisJson === 'string'
          ? JSON.parse(thesis.coreThesisJson)
          : thesis.coreThesisJson
      }
    } catch {
      coreThesis = []
    }

    // 获取第一个 Pillar（优先使用 pillars，其次 coreThesis）
    const primaryPillar = pillars[0] || coreThesis[0] || {}

    // 5. 构建影响分析参数
    const impactParams = {
      stockCode: position.symbol,
      stockName: position.assetName,
      direction: thesis.direction || '做多',
      thesisSummary: thesis.summary || '暂无投资逻辑摘要',
      currentHealthScore: thesis.healthScore || 80,
      pillarName: primaryPillar.name || '核心议题',
      coreAssumption: primaryPillar.coreAssumption || '暂无核心假设',
      bullishSignal: primaryPillar.bullishSignal || '暂无看多信号',
      riskTrigger: primaryPillar.riskTrigger || '暂无风险触发条件',
      indicatorName: alert.title, // 使用 Alert 标题作为指标名
      changeDescription: alert.summary, // 使用 Alert 摘要作为变化描述
      dataSource: '智能投资监控系统',
      dataTime: alert.sentAt || new Date().toISOString(),
    }

    // 6. 调用 LLM 进行影响分析
    console.log(`[AlertAnalyze] Starting impact analysis for alert ${alertId} (${position.symbol})`)
    const impactResult = await llmService.analyzeAlertImpact(impactParams)
    console.log(`[AlertAnalyze] Impact analysis completed:`, JSON.stringify(impactResult, null, 2))

    // 7. 将分析结果返回
    return NextResponse.json({
      success: true,
      data: {
        alertId,
        positionId: position.id,
        symbol: position.symbol,
        assetName: position.assetName,
        thesisId: thesis.id,
        impactResult: {
          impactDirection: impactResult.impactDirection,
          impactScore: impactResult.impactScore,
          reasoning: impactResult.reasoning,
          assumptionStatus: impactResult.assumptionStatus,
          suggestedAction: impactResult.suggestedAction,
          newHealthScore: impactResult.newHealthScore,
          healthScoreChange: impactResult.healthScoreChange,
          followUpWatch: impactResult.followUpWatch,
          alertLevel: impactResult.alertLevel,
        },
        analyzedAt: new Date().toISOString(),
      },
      error: null
    })

  } catch (error) {
    console.error('[AlertAnalyze] Error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '影响分析失败',
      data: { impactResult: null }
    }, { status: 500 })
  }
}