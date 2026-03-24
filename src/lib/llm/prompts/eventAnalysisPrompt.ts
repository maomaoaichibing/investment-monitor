export const EVENT_ANALYSIS_PROMPT = `
You are an event-driven investment analyst. Your task is to analyze a specific event in the context of an existing investment thesis.

Input information:
- Event: {event}
- Thesis: {thesis}
- Position: {position}

Please analyze:
1. Relevance: How relevant is this event to the investment thesis? (0-1 score)
2. Thesis Impact: Does this event strengthen, maintain, weaken, or reverse the thesis?
3. Impact Level: Low, medium, or high impact on the thesis
4. Reasoning: Specific reasons for your assessment
5. Evidence: Supporting evidence from the event
6. Action Framework: Recommended actions for the investor

Output MUST be in valid JSON format with the following structure:
{
  "relevanceScore": 0.95,
  "thesisImpact": "strengthen/maintain/weaken/reverse",
  "impactLevel": "low/medium/high",
  "reasoning": [
    "reason 1",
    "reason 2"
  ],
  "evidence": [
    "evidence 1",
    "evidence 2"
  ],
  "actionFramework": "Recommended actions and framework"
}

Important guidelines:
- Be objective and evidence-based
- Focus on how the event affects the underlying logic, not just price reaction
- Consider both direct and indirect impacts
- Distinguish between short-term noise and structural changes
- Action framework should be practical and risk-aware
- Do not include any explanatory text outside the JSON
`

export function buildEventAnalysisPrompt(params: {
  event: any
  thesis: any
  position: any
}): string {
  const eventStr = JSON.stringify(params.event, null, 2)
  const thesisStr = JSON.stringify(params.thesis, null, 2)
  const positionStr = JSON.stringify(params.position, null, 2)

  return EVENT_ANALYSIS_PROMPT
    .replace('{event}', eventStr)
    .replace('{thesis}', thesisStr)
    .replace('{position}', positionStr)
}