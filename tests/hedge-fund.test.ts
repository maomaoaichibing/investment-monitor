/**
 * AI Hedge Fund — 测试套件
 *
 * 覆盖：Portfolio Manager 信号聚合、LLM Helper JSON 解析、类型系统
 * 运行: npx tsx tests/hedge-fund.test.ts
 */

// ============================================================
// 1. Portfolio Manager 测试
// ============================================================

import { aggregateSignals } from '../src/server/hedge-fund/portfolio-manager';
import type { AgentSignal } from '../src/server/hedge-fund/types';

function createSignal(
  agentId: string,
  signal: 'bullish' | 'bearish' | 'neutral',
  confidence: number,
  reasoning: string
): AgentSignal {
  return {
    agentId,
    signal,
    confidence,
    reasoning,
    timestamp: new Date().toISOString(),
  };
}

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean | Promise<boolean>) {
  try {
    const result = typeof fn === 'function' ? fn() : fn;
    if (result instanceof Promise) {
      result.then(ok => {
        if (ok) { passed++; console.log(`  ✅ ${name}`); }
        else { failed++; console.log(`  ❌ ${name}`); }
      });
    } else {
      if (result) { passed++; console.log(`  ✅ ${name}`); }
      else { failed++; console.log(`  ❌ ${name}`); }
    }
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name} — ${e}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

console.log('\n=== AI Hedge Fund 测试套件 ===\n');

// --------------------------------------------------
// A. Portfolio Manager — 信号聚合
// --------------------------------------------------
console.log('A. Portfolio Manager — 信号聚合');

test('A1. 全部看多 → buy', () => {
  const signals = [
    createSignal('value-investor', 'bullish', 80, '护城河强'),
    createSignal('growth-investor', 'bullish', 75, '增长快'),
    createSignal('technical-analyst', 'bullish', 70, '趋势向上'),
    createSignal('sentiment-analyst', 'bullish', 65, '新闻正面'),
  ];
  const decision = aggregateSignals(signals, '00700');
  assert(decision.action === 'buy', `期望 buy，实际 ${decision.action}`);
  assert(decision.confidence > 60, `置信度应>60，实际 ${decision.confidence}`);
  assert(decision.signalSummary.bullish === 4, '应有4个bullish');
  assert(decision.signalSummary.weightedScore > 0.2, '加权得分应>0.2');
  return true;
});

test('A2. 全部看空 → sell', () => {
  const signals = [
    createSignal('value-investor', 'bearish', 80, '高估'),
    createSignal('growth-investor', 'bearish', 75, '增速放缓'),
    createSignal('technical-analyst', 'bearish', 70, '跌破支撑'),
    createSignal('sentiment-analyst', 'bearish', 65, '负面新闻'),
  ];
  const decision = aggregateSignals(signals, '00700');
  assert(decision.action === 'sell', `期望 sell，实际 ${decision.action}`);
  assert(decision.signalSummary.bearish === 4, '应有4个bearish');
  assert(decision.signalSummary.weightedScore < -0.2, '加权得分应<-0.2');
  return true;
});

test('A3. 全部中性 → hold', () => {
  const signals = [
    createSignal('value-investor', 'neutral', 50, '信号不明确'),
    createSignal('growth-investor', 'neutral', 50, '数据不足'),
    createSignal('technical-analyst', 'neutral', 50, '震荡整理'),
    createSignal('sentiment-analyst', 'neutral', 50, '无重大新闻'),
  ];
  const decision = aggregateSignals(signals, '00700');
  assert(decision.action === 'hold', `期望 hold，实际 ${decision.action}`);
  assert(decision.signalSummary.neutral === 4, '应有4个neutral');
  return true;
});

test('A4. 多空严重分裂 → hold', () => {
  const signals = [
    createSignal('value-investor', 'bullish', 80, '护城河强'),
    createSignal('growth-investor', 'bullish', 70, '增长快'),
    createSignal('technical-analyst', 'bearish', 75, '破位下跌'),
    createSignal('sentiment-analyst', 'bearish', 70, '负面新闻'),
  ];
  const decision = aggregateSignals(signals, '00700');
  assert(decision.action === 'hold', `期望 hold（分裂），实际 ${decision.action}`);
  return true;
});

test('A5. 多数看多+1个中性 → buy', () => {
  const signals = [
    createSignal('value-investor', 'bullish', 80, '价值低估'),
    createSignal('growth-investor', 'bullish', 75, '增长强劲'),
    createSignal('technical-analyst', 'bullish', 65, '均线多头'),
    createSignal('sentiment-analyst', 'neutral', 50, '无明显新闻'),
  ];
  const decision = aggregateSignals(signals, '00700');
  assert(decision.action === 'buy', `期望 buy，实际 ${decision.action}`);
  return true;
});

test('A6. 空信号 → hold', () => {
  const decision = aggregateSignals([], '00700');
  assert(decision.action === 'hold', `期望 hold，实际 ${decision.action}`);
  assert(decision.confidence === 30, `置信度应为30，实际 ${decision.confidence}`);
  return true;
});

test('A7. 加权得分正确计算', () => {
  const signals = [
    createSignal('value-investor', 'bullish', 80, ''),   // weight=1.3, +1*1.3*0.8 = 1.04
    createSignal('technical-analyst', 'bearish', 60, ''), // weight=0.8, -1*0.8*0.6 = -0.48
    createSignal('sentiment-analyst', 'neutral', 50, ''), // weight=0.7, 0
  ];
  const decision = aggregateSignals(signals, '00700');
  const summary = decision.signalSummary;
  // totalWeight = 1.3+0.8+0.7 = 2.8
  // weightedScore = (1.04 - 0.48 + 0) / 2.8 ≈ 0.2
  assert(summary.weightedScore > 0.15, `加权得分应≈0.2，实际 ${summary.weightedScore}`);
  return true;
});

// --------------------------------------------------
// B. Agent 注册表测试
// --------------------------------------------------
console.log('\nB. Agent 注册表');

test('B1. 4个Agent已注册', async () => {
  const { listAgents } = await import('../src/server/hedge-fund/hedge-fund-service');
  const result = listAgents();
  assert(result.total === 4, `期望4个Agent，实际 ${result.total}`);
  const ids = result.agents.map(a => a.id);
  assert(ids.includes('value-investor'), '缺少 value-investor');
  assert(ids.includes('growth-investor'), '缺少 growth-investor');
  assert(ids.includes('technical-analyst'), '缺少 technical-analyst');
  assert(ids.includes('sentiment-analyst'), '缺少 sentiment-analyst');
  return true;
});

test('B2. Agent配置完整性', async () => {
  const { listAgents } = await import('../src/server/hedge-fund/hedge-fund-service');
  const result = listAgents();
  for (const agent of result.agents) {
    assert(agent.id, 'Agent缺少id');
    assert(agent.displayName, `Agent ${agent.id} 缺少displayName`);
    assert(agent.description, `Agent ${agent.id} 缺少description`);
    assert(agent.investingStyle, `Agent ${agent.id} 缺少investingStyle`);
    assert(['philosophy', 'analytical', 'special'].includes(agent.type), `Agent ${agent.id} type无效`);
    assert(typeof agent.order === 'number', `Agent ${agent.id} order不是数字`);
  }
  return true;
});

// --------------------------------------------------
// C. LLM Helper JSON 解析测试
// --------------------------------------------------
console.log('\nC. LLM Helper JSON 解析');

test('C1. 直接JSON解析', async () => {
  const { parseTestJSON } = await import('./hedge-fund-test-helpers');
  const result = parseTestJSON('{"signal":"bullish","confidence":85,"reasoning":"护城河强"}');
  assert(result !== null, '应解析成功');
  assert(result.signal === 'bullish', `期望bullish，实际 ${result.signal}`);
  assert(result.confidence === 85, `期望85，实际 ${result.confidence}`);
  return true;
});

test('C2. 代码块JSON解析', async () => {
  const { parseTestJSON } = await import('./hedge-fund-test-helpers');
  const result = parseTestJSON('```json\n{"signal":"bearish","confidence":70,"reasoning":"高估"}\n```');
  assert(result !== null, '应解析成功');
  assert(result.signal === 'bearish', `期望bearish，实际 ${result.signal}`);
  return true;
});

test('C3. 混合文本JSON解析', async () => {
  const { parseTestJSON } = await import('./hedge-fund-test-helpers');
  const result = parseTestJSON('分析结果如下：\n{"signal":"neutral","confidence":50,"reasoning":"信号不明确"}\n\n以上是分析。');
  assert(result !== null, '应解析成功');
  assert(result.signal === 'neutral', `期望neutral，实际 ${result.signal}`);
  return true;
});

test('C4. 中文信号映射', async () => {
  const { normalizeTestSignal } = await import('./hedge-fund-test-helpers');
  assert(normalizeTestSignal('看多') === 'bullish', '看多应映射为bullish');
  assert(normalizeTestSignal('看空') === 'bearish', '看空应映射为bearish');
  assert(normalizeTestSignal('buy') === 'bullish', 'buy应映射为bullish');
  assert(normalizeTestSignal('sell') === 'bearish', 'sell应映射为bearish');
  assert(normalizeTestSignal('hold') === 'neutral', 'hold应映射为neutral');
  assert(normalizeTestSignal('unknown') === 'neutral', 'unknown应映射为neutral');
  return true;
});

// --------------------------------------------------
// 等待异步测试完成
// --------------------------------------------------

setTimeout(() => {
  console.log(`\n=== 测试结果: ${passed} 通过, ${failed} 失败 ===\n`);
  if (failed > 0) process.exit(1);
}, 3000);
