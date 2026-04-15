/**
 * 技术分析师
 *
 * 价格/成交量/均线/趋势分析。
 */

import type { AnalysisContext, AgentSignal, AgentFunction } from '../types';
import { buildTechnicalAnalystPrompt } from '../prompts/technical-analyst';
import { callAgentLLM } from '../llm-helper';

const AGENT_ID = 'technical-analyst';

export const technicalAnalyst: AgentFunction = async (
  context: AnalysisContext
): Promise<AgentSignal> => {
  const { systemPrompt, userPrompt } = buildTechnicalAnalystPrompt(context);
  return callAgentLLM(systemPrompt, userPrompt, AGENT_ID);
};
