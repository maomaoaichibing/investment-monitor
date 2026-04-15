/**
 * Agent 统一导出
 *
 * 所有 Agent 在此注册并导出，新增 Agent 只需在此添加 import + entry。
 */

import type { AgentEntry, AgentFunction } from '../types';
import { AGENT_CONFIGS } from '../registry';
import { valueInvestor } from './value-investor';
import { growthInvestor } from './growth-investor';
import { technicalAnalyst } from './technical-analyst';
import { sentimentAnalyst } from './sentiment-analyst';

/**
 * Agent 函数映射：agentId → agentFunction
 * 新增 Agent 时在此添加映射
 */
const AGENT_FUNCTIONS: Record<string, AgentFunction> = {
  'value-investor': valueInvestor,
  'growth-investor': growthInvestor,
  'technical-analyst': technicalAnalyst,
  'sentiment-analyst': sentimentAnalyst,
};

/**
 * 获取所有 Agent（配置 + 函数）
 */
export function getAllAgents(): AgentEntry[] {
  return AGENT_CONFIGS.map(config => ({
    config,
    fn: AGENT_FUNCTIONS[config.id],
  })).filter(entry => entry.fn);
}

/**
 * 获取指定 Agent
 */
export function getAgent(id: string): AgentEntry | undefined {
  const config = AGENT_CONFIGS.find(c => c.id === id);
  if (!config || !AGENT_FUNCTIONS[id]) return undefined;
  return { config, fn: AGENT_FUNCTIONS[id] };
}

/**
 * 获取所有 Agent 函数（仅启用的）
 */
export function getEnabledAgentFunctions(): Record<string, AgentFunction> {
  const result: Record<string, AgentFunction> = {};
  for (const config of AGENT_CONFIGS) {
    if (config.enabled && AGENT_FUNCTIONS[config.id]) {
      result[config.id] = AGENT_FUNCTIONS[config.id];
    }
  }
  return result;
}
