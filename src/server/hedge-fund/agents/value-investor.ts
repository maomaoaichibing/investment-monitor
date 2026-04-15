/**
 * 价值投资分析师
 *
 * 融合巴菲特护城河 + 格雷厄姆安全边际。
 */

import type { AnalysisContext, AgentSignal, AgentFunction } from '../types';
import { buildValueInvestorPrompt } from '../prompts/value-investor';
import { callAgentLLM } from '../llm-helper';

const AGENT_ID = 'value-investor';

export const valueInvestor: AgentFunction = async (
  context: AnalysisContext
): Promise<AgentSignal> => {
  const { systemPrompt, userPrompt } = buildValueInvestorPrompt(context);
  return callAgentLLM(systemPrompt, userPrompt, AGENT_ID);
};
