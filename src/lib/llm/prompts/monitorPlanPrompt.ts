export const MONITOR_PLAN_GENERATION_PROMPT = `
You are a risk management specialist. Your task is to create a monitoring plan based on an investment thesis.

Input information:
- Thesis: {thesis}
- Position Details: {position}

Based on the thesis, create a monitoring plan that:
1. Identifies which variables from the thesis are most critical to monitor
2. Defines trigger conditions for each variable
3. Assesses the potential impact on the thesis if triggers are hit
4. Assigns priority and severity levels

Output MUST be in valid JSON format with the following structure:
{
  "priority": "high/medium/low",
  "monitorItems": [
    {
      "target": "variable name",
      "category": "fundamental/industry/macro/technical/sentiment",
      "trigger": "specific condition that would trigger alert",
      "impact": "logic_strengthen/logic_maintain/logic_weaken/logic_reverse",
      "severity": "low/medium/high"
    }
  ]
}

Important guidelines:
- Each monitor item should be specific and measurable
- Triggers should be concrete conditions, not vague statements
- Impact should directly relate to the core thesis
- Severity should reflect potential damage to the investment thesis
- Focus on early warning signals, not just after-the-fact confirmation
- Do not include any explanatory text outside the JSON
`

export function buildMonitorPlanPrompt(params: {
  thesis: any
  position: any
}): string {
  const thesisStr = JSON.stringify(params.thesis, null, 2)
  const positionStr = JSON.stringify(params.position, null, 2)

  return MONITOR_PLAN_GENERATION_PROMPT
    .replace('{thesis}', thesisStr)
    .replace('{position}', positionStr)
}