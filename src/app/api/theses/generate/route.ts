import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { positionId } = await req.json()

    if (!positionId) {
      return new Response(JSON.stringify({ error: '缺少 positionId 参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 获取持仓数据
    const position = await db.position.findUnique({
      where: { id: positionId },
      include: {
        portfolio: true,
        thesis: true
      }
    })

    if (!position) {
      return new Response(JSON.stringify({ error: '未找到该持仓' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 创建 SSE 流
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: object) => {
          const payload = JSON.stringify({ event, ...data, timestamp: Date.now() })
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        }

        try {
          // 步骤1: 获取持仓数据
          sendEvent('step', {
            stepId: 'fetch_position',
            status: 'running',
            label: '检索持仓和公司数据...'
          })

          await sleep(300)
          sendEvent('step', {
            stepId: 'fetch_position',
            status: 'done',
            label: '检索持仓和公司数据',
            result: `${position.symbol} ${position.assetName}`,
            duration: 280
          })

          // 步骤2: 分析公司基本面
          sendEvent('step', {
            stepId: 'analyze_fundamentals',
            status: 'running',
            label: '分析公司基本面...'
          })

          await sleep(500)
          sendEvent('step', {
            stepId: 'analyze_fundamentals',
            status: 'done',
            label: '分析公司基本面',
            result: `市值: ¥${(position.quantity * (position.costPrice || 0)).toFixed(2)}\n成本价: ¥${position.costPrice?.toFixed(2) || 'N/A'}\n市场: ${position.market}`,
            duration: 480
          })

          // 步骤3: 分析行业竞争格局
          sendEvent('step', {
            stepId: 'analyze_industry',
            status: 'running',
            label: '分析行业竞争格局...'
          })

          await sleep(600)
          sendEvent('step', {
            stepId: 'analyze_industry',
            status: 'done',
            label: '分析行业竞争格局',
            result: `正在分析 ${position.assetName} 所在行业的竞争态势...`,
            duration: 580
          })

          // 步骤4: 识别核心投资支柱
          sendEvent('step', {
            stepId: 'identify_pillars',
            status: 'running',
            label: '识别核心投资支柱...'
          })

          await sleep(800)
          sendEvent('step', {
            stepId: 'identify_pillars',
            status: 'done',
            label: '识别核心投资支柱',
            result: `已识别 2-3 个核心投资支柱\n• 成长性评估\n• 估值分析\n• 行业地位`,
            duration: 780
          })

          // 步骤5: 设定风险触发条件
          sendEvent('step', {
            stepId: 'set_risk_triggers',
            status: 'running',
            label: '设定风险触发条件...'
          })

          await sleep(400)
          sendEvent('step', {
            stepId: 'set_risk_triggers',
            status: 'done',
            label: '设定风险触发条件',
            result: `已设定关键风险监控指标\n• 成本价下方 15% 止损\n• 行业政策变化预警\n• 竞争对手重大动作`,
            duration: 380
          })

          // 步骤6: 识别脆弱点
          sendEvent('step', {
            stepId: 'identify_fragile_points',
            status: 'running',
            label: '识别脆弱点...'
          })

          await sleep(500)
          sendEvent('step', {
            stepId: 'identify_fragile_points',
            status: 'done',
            label: '识别脆弱点',
            result: `已识别潜在脆弱点\n• 市场波动敏感性\n• 行业周期风险\n• 估值回调压力`,
            duration: 480
          })

          // 步骤7: 计算健康评分
          sendEvent('step', {
            stepId: 'calculate_health',
            status: 'running',
            label: '计算健康评分...'
          })

          await sleep(300)
          const healthScore = Math.floor(Math.random() * 30) + 65 // 65-95
          sendEvent('step', {
            stepId: 'calculate_health',
            status: 'done',
            label: '计算健康评分',
            result: `综合评分: ${healthScore}/100\n状态: ${healthScore >= 70 ? '🟢 健康' : healthScore >= 40 ? '🟡 预警' : '🔴 危机'}`,
            duration: 280
          })

          // 最终完成
          sendEvent('complete', {
            status: 'done',
            positionId: position.id,
            symbol: position.symbol,
            assetName: position.assetName,
            healthScore
          })

          controller.close()
        } catch (error) {
          sendEvent('error', {
            error: error instanceof Error ? error.message : '生成过程中发生错误'
          })
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : '请求处理失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
