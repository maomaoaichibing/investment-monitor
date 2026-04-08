'use client'

import { useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Clock, RefreshCw, PlayCircle, AlertTriangle } from 'lucide-react'

// ─── 测试用例定义 ──────────────────────────────────────────────────
interface TestCase {
  id: string
  category: string
  name: string
  description: string
  test: () => Promise<TestResult>
}

interface TestResult {
  passed: boolean
  message: string
  detail?: string
  duration: number
}

interface TestState extends TestResult {
  status: 'pending' | 'running' | 'passed' | 'failed'
}

// 辅助函数
async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

async function timedTest(fn: () => Promise<{ passed: boolean; message: string; detail?: string }>): Promise<TestResult> {
  const start = Date.now()
  try {
    const result = await fn()
    return { ...result, duration: Date.now() - start }
  } catch (e) {
    return {
      passed: false,
      message: `测试异常: ${e instanceof Error ? e.message : String(e)}`,
      duration: Date.now() - start
    }
  }
}

// ─── 测试用例 ──────────────────────────────────────────────────────
const TEST_CASES: TestCase[] = [
  // ── API 测试 ──────────────────────────────
  {
    id: 'api-portfolios',
    category: 'API',
    name: 'GET /api/portfolios',
    description: '获取投资组合列表',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/api/portfolios')
      const data = await res.json()
      const items = Array.isArray(data) ? data : data.data
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      if (!Array.isArray(items)) return { passed: false, message: '返回数据格式错误，应为数组', detail: JSON.stringify(data).substring(0, 200) }
      return { passed: true, message: `✓ 返回 ${items.length} 个投资组合` }
    })
  },
  {
    id: 'api-positions',
    category: 'API',
    name: 'GET /api/positions',
    description: '获取持仓列表',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/api/positions')
      const data = await res.json()
      const items = Array.isArray(data) ? data : data.data
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      if (!Array.isArray(items)) return { passed: false, message: '返回数据格式错误', detail: JSON.stringify(data).substring(0, 200) }
      return { passed: true, message: `✓ 返回 ${items.length} 个持仓` }
    })
  },
  {
    id: 'api-alerts',
    category: 'API',
    name: 'GET /api/alerts',
    description: '获取提醒列表',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/api/alerts')
      const data = await res.json()
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      const items = data.data?.alerts || data.alerts || data.data || data
      if (!Array.isArray(items)) return { passed: false, message: '返回数据格式错误', detail: JSON.stringify(data).substring(0, 200) }
      return { passed: true, message: `✓ 返回 ${items.length} 个提醒` }
    })
  },
  {
    id: 'api-theses',
    category: 'API',
    name: 'GET /api/theses',
    description: '获取论题列表',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/api/theses')
      const data = await res.json()
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      const items = data.data?.theses || data.theses || data.data || data
      if (!Array.isArray(items)) return { passed: false, message: '返回数据格式错误', detail: JSON.stringify(data).substring(0, 200) }
      return { passed: true, message: `✓ 返回 ${items.length} 个论题` }
    })
  },
  {
    id: 'api-daily-summary',
    category: 'API',
    name: 'GET /api/daily-summary',
    description: '获取每日摘要',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/api/daily-summary', undefined, 10000)
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      const data = await res.json()
      if (!data) return { passed: false, message: '返回空数据' }
      return { passed: true, message: `✓ 摘要日期: ${data.date || '未知'}` }
    })
  },
  {
    id: 'api-stock-quote',
    category: 'API',
    name: 'GET /api/stock/quote',
    description: '实时行情接口',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/api/stock/quote?symbol=600519&market=A')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      const data = await res.json()
      if (!data) return { passed: false, message: '返回空数据' }
      return { passed: true, message: `✓ 行情接口正常` }
    })
  },

  // ── 页面测试 ──────────────────────────────
  {
    id: 'page-home',
    category: '页面',
    name: '首页 /',
    description: '首页（仪表盘）加载',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      const html = await res.text()
      if (html.includes('仪表盘') || html.includes('dashboard') || html.includes('投资')) {
        return { passed: true, message: '✓ 仪表盘页面加载正常' }
      }
      return { passed: true, message: '✓ 首页响应正常' }
    })
  },
  {
    id: 'page-portfolios',
    category: '页面',
    name: '投资组合列表 /portfolios',
    description: '投资组合列表页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/portfolios')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      return { passed: true, message: '✓ 页面响应 200' }
    })
  },
  {
    id: 'page-theses',
    category: '页面',
    name: '论题列表 /theses',
    description: '投资论题列表页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/theses')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      return { passed: true, message: '✓ 页面响应 200' }
    })
  },
  {
    id: 'page-theses-generate',
    category: '页面',
    name: '生成论题 /theses/generate',
    description: '生成投资论题页（曾经缺失）',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/theses/generate')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status} - 页面可能仍缺失！` }
      return { passed: true, message: '✓ 页面存在并响应 200' }
    })
  },
  {
    id: 'page-alerts',
    category: '页面',
    name: '提醒列表 /alerts',
    description: '提醒列表页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/alerts')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      return { passed: true, message: '✓ 页面响应 200' }
    })
  },
  {
    id: 'page-positions-new',
    category: '页面',
    name: '新增持仓 /positions/new',
    description: '新增持仓表单页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/positions/new')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      return { passed: true, message: '✓ 页面响应 200' }
    })
  },
  {
    id: 'page-portfolios-new',
    category: '页面',
    name: '新建组合 /portfolios/new',
    description: '新建投资组合表单页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/portfolios/new')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      return { passed: true, message: '✓ 页面响应 200' }
    })
  },
  {
    id: 'page-market',
    category: '页面',
    name: '市场行情 /market',
    description: '市场行情页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/market')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      return { passed: true, message: '✓ 页面响应 200' }
    })
  },
  {
    id: 'page-risks',
    category: '页面',
    name: '风险管理 /risks',
    description: '风险管理页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/risks')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      return { passed: true, message: '✓ 页面响应 200' }
    })
  },
  {
    id: 'page-events',
    category: '页面',
    name: '事件列表 /events',
    description: '事件列表页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/events')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      return { passed: true, message: '✓ 页面响应 200' }
    })
  },
  {
    id: 'page-llm',
    category: '页面',
    name: 'LLM管理 /llm-management',
    description: 'LLM提供商管理页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/llm-management')
      if (!res.ok) return { passed: false, message: `HTTP ${res.status}` }
      return { passed: true, message: '✓ 页面响应 200' }
    })
  },

  // ── 数据关联测试 ──────────────────────────
  {
    id: 'data-portfolio-detail',
    category: '数据关联',
    name: '投资组合详情页',
    description: '获取第一个Portfolio并访问详情页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/api/portfolios')
      if (!res.ok) return { passed: false, message: `API错误 HTTP ${res.status}` }
      const data = await res.json()
      const items = Array.isArray(data) ? data : (data.data || [])
      if (!items.length) return { passed: false, message: '无投资组合数据可测试', detail: '请先添加投资组合' }
      const id = items[0].id
      const pageRes = await fetchWithTimeout(`/portfolios/${id}`)
      if (!pageRes.ok) return { passed: false, message: `详情页 HTTP ${pageRes.status}，ID: ${id}` }
      return { passed: true, message: `✓ 组合详情页正常 (ID: ${id.substring(0, 8)}...)` }
    })
  },
  {
    id: 'data-position-detail',
    category: '数据关联',
    name: '持仓详情页',
    description: '获取第一个Position并访问详情页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/api/positions')
      if (!res.ok) return { passed: false, message: `API错误 HTTP ${res.status}` }
      const data = await res.json()
      const items = Array.isArray(data) ? data : (data.data || [])
      if (!items.length) return { passed: false, message: '无持仓数据可测试' }
      const id = items[0].id
      const pageRes = await fetchWithTimeout(`/positions/${id}`)
      if (!pageRes.ok) return { passed: false, message: `持仓详情页 HTTP ${pageRes.status}` }
      return { passed: true, message: `✓ 持仓详情页正常 (ID: ${id.substring(0, 8)}...)` }
    })
  },
  {
    id: 'data-position-edit',
    category: '数据关联',
    name: '持仓编辑页',
    description: '获取第一个Position并访问编辑页（曾经缺失）',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/api/positions')
      if (!res.ok) return { passed: false, message: `API错误 HTTP ${res.status}` }
      const data = await res.json()
      const items = Array.isArray(data) ? data : (data.data || [])
      if (!items.length) return { passed: false, message: '无持仓数据可测试' }
      const id = items[0].id
      const pageRes = await fetchWithTimeout(`/positions/${id}/edit`)
      if (!pageRes.ok) return { passed: false, message: `编辑页 HTTP ${pageRes.status} - 可能仍缺失！` }
      return { passed: true, message: `✓ 持仓编辑页正常 (ID: ${id.substring(0, 8)}...)` }
    })
  },
  {
    id: 'data-thesis-detail',
    category: '数据关联',
    name: '论题详情页',
    description: '获取第一个Thesis并访问详情页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/api/theses')
      if (!res.ok) return { passed: false, message: `API错误 HTTP ${res.status}` }
      const data = await res.json()
      const items = data.data?.theses || data.theses || data.data || (Array.isArray(data) ? data : [])
      if (!items.length) return { passed: false, message: '无论题数据可测试' }
      const id = items[0].id
      const pageRes = await fetchWithTimeout(`/theses/${id}`)
      if (!pageRes.ok) return { passed: false, message: `论题详情页 HTTP ${pageRes.status}` }
      return { passed: true, message: `✓ 论题详情页正常 (ID: ${id.substring(0, 8)}...)` }
    })
  },
  {
    id: 'data-alert-detail',
    category: '数据关联',
    name: '提醒详情页',
    description: '获取第一个Alert并访问详情页',
    test: () => timedTest(async () => {
      const res = await fetchWithTimeout('/api/alerts')
      if (!res.ok) return { passed: false, message: `API错误 HTTP ${res.status}` }
      const data = await res.json()
      const items = data.data?.alerts || data.alerts || data.data || (Array.isArray(data) ? data : [])
      if (!items.length) return { passed: false, message: '无提醒数据可测试（数据库暂无提醒）' }
      const id = items[0].id
      const pageRes = await fetchWithTimeout(`/alerts/${id}`)
      if (!pageRes.ok) return { passed: false, message: `提醒详情页 HTTP ${pageRes.status}` }
      return { passed: true, message: `✓ 提醒详情页正常 (ID: ${id.substring(0, 8)}...)` }
    })
  },
]

// ─── 主组件 ────────────────────────────────────────────────────────
export default function TestSuitePage() {
  const [results, setResults] = useState<Record<string, TestState>>({})
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const categories = Array.from(new Set(TEST_CASES.map(t => t.category)))

  const runTest = useCallback(async (tc: TestCase): Promise<void> => {
    setResults(prev => ({ ...prev, [tc.id]: { passed: false, message: '', duration: 0, status: 'running' } }))
    const result = await tc.test()
    setResults(prev => ({
      ...prev,
      [tc.id]: { ...result, status: result.passed ? 'passed' : 'failed' }
    }))
  }, [])

  const runAll = useCallback(async () => {
    setIsRunning(true)
    setResults({})
    setProgress(0)

    // 分批并发，每批最多4个
    const batchSize = 4
    for (let i = 0; i < TEST_CASES.length; i += batchSize) {
      const batch = TEST_CASES.slice(i, i + batchSize)
      await Promise.all(batch.map(tc => runTest(tc)))
      setProgress(Math.min(i + batchSize, TEST_CASES.length))
    }

    setIsRunning(false)
    setProgress(TEST_CASES.length)
  }, [runTest])

  const runCategory = useCallback(async (category: string) => {
    const tests = TEST_CASES.filter(t => t.category === category)
    await Promise.all(tests.map(tc => runTest(tc)))
  }, [runTest])

  const passed = Object.values(results).filter(r => r.status === 'passed').length
  const failed = Object.values(results).filter(r => r.status === 'failed').length
  const total = Object.keys(results).length

  const statusIcon = (id: string) => {
    const r = results[id]
    if (!r) return <Clock className="h-4 w-4 text-muted-foreground" />
    if (r.status === 'running') return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    if (r.status === 'passed') return <CheckCircle2 className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 标题区 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <PlayCircle className="h-6 w-6 text-blue-500" />
          系统综合测试
        </h1>
        <p className="text-muted-foreground text-sm">
          全面测试所有 API、页面与数据关联，自动发现问题
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{TEST_CASES.length}</div>
            <div className="text-xs text-muted-foreground">测试总数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-green-600">{passed}</div>
            <div className="text-xs text-muted-foreground">通过</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-red-600">{failed}</div>
            <div className="text-xs text-muted-foreground">失败</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-gray-500">{TEST_CASES.length - total}</div>
            <div className="text-xs text-muted-foreground">待执行</div>
          </CardContent>
        </Card>
      </div>

      {/* 进度条 */}
      {isRunning && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">测试进行中...</span>
            <span className="font-medium">{progress}/{TEST_CASES.length}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(progress / TEST_CASES.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button
          onClick={runAll}
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning ? (
            <><RefreshCw className="h-4 w-4 animate-spin" />测试中...</>
          ) : (
            <><PlayCircle className="h-4 w-4" />运行全部测试</>
          )}
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            variant="outline"
            size="sm"
            onClick={() => runCategory(cat)}
            disabled={isRunning}
          >
            仅测{cat}
          </Button>
        ))}
      </div>

      {/* 失败摘要 */}
      {failed > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {failed} 项测试失败
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {TEST_CASES.filter(tc => results[tc.id]?.status === 'failed').map(tc => (
                <li key={tc.id} className="text-sm text-red-700">
                  • <strong>{tc.name}</strong>: {results[tc.id].message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 按分类显示测试结果 */}
      <div className="space-y-6">
        {categories.map(category => {
          const tests = TEST_CASES.filter(t => t.category === category)
          const catPassed = tests.filter(t => results[t.id]?.status === 'passed').length
          const catFailed = tests.filter(t => results[t.id]?.status === 'failed').length
          const catTotal = tests.filter(t => results[t.id]).length

          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{category}</span>
                  {catTotal > 0 && (
                    <div className="flex gap-2">
                      {catPassed > 0 && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{catPassed} 通过</Badge>}
                      {catFailed > 0 && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{catFailed} 失败</Badge>}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tests.map(tc => {
                    const r = results[tc.id]
                    return (
                      <div key={tc.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                        <div className="mt-0.5 flex-shrink-0">{statusIcon(tc.id)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{tc.name}</span>
                            {r && <span className="text-xs text-muted-foreground">{r.duration}ms</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{tc.description}</p>
                          {r && r.message && (
                            <p className={`text-xs mt-1 ${r.status === 'passed' ? 'text-green-700' : 'text-red-700'}`}>
                              {r.message}
                            </p>
                          )}
                          {r?.detail && (
                            <details className="mt-1">
                              <summary className="text-xs text-muted-foreground cursor-pointer">详情</summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">{r.detail}</pre>
                            </details>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs flex-shrink-0"
                          disabled={isRunning}
                          onClick={() => runTest(tc)}
                        >
                          重跑
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 底部说明 */}
      <div className="mt-8 p-4 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <p className="font-medium mb-1">测试说明</p>
        <ul className="space-y-1">
          <li>• 所有测试使用当前环境的 API，不影响生产数据</li>
          <li>• 数据关联测试需要数据库中存在相应数据</li>
          <li>• 页面测试仅检查 HTTP 响应状态码（200 = 正常）</li>
          <li>• 超时时间：8 秒（AI 接口 10 秒）</li>
        </ul>
      </div>
    </div>
  )
}
