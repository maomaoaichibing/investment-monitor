export const THESIS_GENERATION_PROMPT = `
You are a senior investment analyst. Your task is to analyze a stock/asset's performance over the last 12 months and generate an investment thesis.

Input information:
- Symbol: {symbol}
- Asset Name: {assetName}
- Market: {market}
- Context: {context}

Please analyze the price movements over the last 12 months and identify:
1. Key price phases (periods of up/down/neutral movement)
2. Primary drivers for each phase
3. Evidence supporting those drivers
4. The core investment thesis (what is the market really trading?)
5. Fragile points (what could break this thesis?)
6. Key variables to monitor for thesis validation

Output MUST be in valid JSON format with the following structure:
{
  "lookbackWindow": "12m",
  "summary": "Brief summary of the analysis",
  "pricePhases": [
    {
      "period": "YYYY-MM to YYYY-MM",
      "direction": "up/down/neutral",
      "drivers": ["driver1", "driver2"],
      "evidence": ["evidence1", "evidence2"]
    }
  ],
  "coreThesis": [
    "core thesis statement 1",
    "core thesis statement 2"
  ],
  "fragilePoints": [
    "vulnerability 1",
    "vulnerability 2"
  ],
  "monitorTargets": [
    {
      "name": "variable name",
      "type": "fundamental/industry/macro/technical/sentiment",
      "why": "why this variable matters"
    }
  ]
}

Important guidelines:
- Be analytical, not promotional
- Focus on underlying logic, not just price movements
- Consider both fundamental and market/sentiment factors
- Identify concrete evidence for your claims
- The thesis should be actionable and testable
- Do not include any explanatory text outside the JSON
`

export function buildThesisPrompt(params: {
  symbol: string
  assetName: string
  market: string
  context?: any
}): string {
  let contextStr = 'No additional context provided'
  if (params.context) {
    contextStr = JSON.stringify(params.context, null, 2)
  }

  return THESIS_GENERATION_PROMPT
    .replace('{symbol}', params.symbol)
    .replace('{assetName}', params.assetName)
    .replace('{market}', params.market)
    .replace('{context}', contextStr)
}