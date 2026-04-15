/**
 * Agent LLM 调用辅助函数
 *
 * 统一的 LLM 调用接口，所有 Agent 共享。
 * 使用 Kimi API（moonshot-v1-8k），与现有 llmService 一致。
 */

import type { AgentSignal, SignalType } from './types';

const KIMI_API_KEY = process.env.KIMI_API_KEY || 'sk-5lKs7u9Q5FTWUpRd8SHneXmNt9ER51puxbyv7rY5I5YjY3oX';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = 'moonshot-v1-8k';

interface LLMSignalRaw {
  signal: string;
  confidence: number;
  reasoning: string;
}

/**
 * 通用 Agent LLM 调用
 * @param systemPrompt 系统提示词
 * @param userPrompt 用户提示词
 * @param agentId Agent ID
 * @returns 标准化 AgentSignal
 */
export async function callAgentLLM(
  systemPrompt: string,
  userPrompt: string,
  agentId: string
): Promise<AgentSignal> {
  const startTime = Date.now();

  try {
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // 低温度 = 更稳定的投资判断
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[HedgeFund][${agentId}] LLM API error:`, response.status, errorText);
      return createFallbackSignal(agentId);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 解析 JSON
    const parsed = parseSignalJSON(content);
    if (!parsed) {
      console.warn(`[HedgeFund][${agentId}] Failed to parse LLM response:`, content.slice(0, 200));
      return createFallbackSignal(agentId);
    }

    // 标准化输出
    return {
      agentId,
      signal: normalizeSignal(parsed.signal),
      confidence: clamp(parsed.confidence, 0, 100),
      reasoning: String(parsed.reasoning || '无详细理由').slice(0, 200),
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`[HedgeFund][${agentId}] LLM call failed:`, error);
    return createFallbackSignal(agentId, Date.now() - startTime);
  }
}

/**
 * 解析 LLM 返回的 JSON 信号
 */
function parseSignalJSON(content: string): LLMSignalRaw | null {
  // 直接解析
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.signal) return parsed;
  } catch {}

  // 提取 JSON 块
  const jsonMatch =
    content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed && parsed.signal) return parsed;
    } catch {}
  }

  return null;
}

/**
 * 标准化信号方向
 */
function normalizeSignal(raw: string): SignalType {
  const s = String(raw).toLowerCase().trim();
  if (s === 'bullish' || s === 'buy' || s === '看多') return 'bullish';
  if (s === 'bearish' || s === 'sell' || s === '看空') return 'bearish';
  return 'neutral';
}

/**
 * 数值钳制
 */
function clamp(value: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, Number(value) || 50)));
}

/**
 * Fallback 信号（LLM 调用失败时）
 */
function createFallbackSignal(agentId: string, durationMs?: number): AgentSignal {
  return {
    agentId,
    signal: 'neutral',
    confidence: 30,
    reasoning: 'LLM调用失败，无法生成判断',
    timestamp: new Date().toISOString(),
    durationMs,
  };
}
