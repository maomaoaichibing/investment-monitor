/**
 * 市场情绪分析师
 *
 * 新闻情绪 + 市场热度分析。
 */

import type { AnalysisContext, AgentSignal, AgentFunction } from '../types';
import { buildSentimentAnalystPrompt } from '../prompts/sentiment-analyst';
import { callAgentLLM } from '../llm-helper';

const AGENT_ID = 'sentiment-analyst';

export const sentimentAnalyst: AgentFunction = async (
  context: AnalysisContext
): Promise<AgentSignal> => {
  const { systemPrompt, userPrompt } = buildSentimentAnalystPrompt(context);
  return callAgentLLM(systemPrompt, userPrompt, AGENT_ID);
};
