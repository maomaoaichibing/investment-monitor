/**
 * 成长投资分析师
 *
 * 彼得·林奇 PEG 策略 + 费希尔成长股研究。
 */

import type { AnalysisContext, AgentSignal, AgentFunction } from '../types';
import { buildGrowthInvestorPrompt } from '../prompts/growth-investor';
import { callAgentLLM } from '../llm-helper';

const AGENT_ID = 'growth-investor';

export const growthInvestor: AgentFunction = async (
  context: AnalysisContext
): Promise<AgentSignal> => {
  const { systemPrompt, userPrompt } = buildGrowthInvestorPrompt(context);
  return callAgentLLM(systemPrompt, userPrompt, AGENT_ID);
};
