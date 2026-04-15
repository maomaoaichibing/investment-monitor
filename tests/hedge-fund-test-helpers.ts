/**
 * 测试辅助函数 — 用于测试 llm-helper 的内部逻辑
 */

export function parseTestJSON(content: string): { signal: string; confidence: number; reasoning: string } | null {
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

export function normalizeTestSignal(raw: string): 'bullish' | 'bearish' | 'neutral' {
  const s = String(raw).toLowerCase().trim();
  if (s === 'bullish' || s === 'buy' || s === '看多') return 'bullish';
  if (s === 'bearish' || s === 'sell' || s === '看空') return 'bearish';
  return 'neutral';
}
