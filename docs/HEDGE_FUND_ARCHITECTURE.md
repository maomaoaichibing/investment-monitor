# AI Hedge Fund 模块 — 架构设计文档

## 定位

为 smart-investment 新增多 Agent 投资分析引擎，借鉴 virattt/ai-hedge-fund 的核心理念，
但**完全适配港股数据层和现有技术栈**。

## 设计原则

1. **投资哲学驱动** — 不只是技术指标，而是注入大师思维模型
2. **标准化信号** — 所有 Agent 输出统一的 `signal/confidence/reasoning` 三元组
3. **注册式扩展** — 新增 Agent 只需：写函数 → 注册配置 → 完成
4. **渐进式实现** — Phase 1 先跑通骨架（3个Agent），后续逐步丰富
5. **适配港股** — 数据源对接现有 stockService/klineService，不引入新 API

## 技术栈映射

| ai-hedge-fund (Python/LangGraph) | smart-investment (TS/Next.js) |
|---|---|
| LangGraph State | TypeScript interface + 函数链 |
| Pydantic BaseModel | Zod schema |
| Financial Modeling Prep API | 现有 stockService + klineService |
| agents/ 目录 | src/server/hedge-fund/agents/ |
| utils/analysts.py | src/server/hedge-fund/registry.ts |
| portfolio_manager.py | src/server/hedge-fund/portfolio-manager.ts |

## 目录结构

```
src/server/hedge-fund/
├── types.ts                    # 核心类型定义
├── registry.ts                 # Agent 注册表 (ANALYST_CONFIG)
├── portfolio-manager.ts        # 信号聚合 + 最终决策
├── hedge-fund-service.ts       # 主服务（编排所有Agent）
├── agents/
│   ├── index.ts                # 统一导出
│   ├── value-investor.ts       # 价值投资Agent（巴菲特+格雷厄姆融合）
│   ├── growth-investor.ts      # 成长投资Agent（彼得·林奇风格）
│   ├── technical-analyst.ts    # 技术分析师（价格+成交量+均线）
│   └── sentiment-analyst.ts    # 情绪分析师（新闻+市场情绪）
├── prompts/
│   ├── value-investor.ts       # 价值投资Prompt
│   ├── growth-investor.ts      # 成长投资Prompt
│   ├── technical-analyst.ts    # 技术分析Prompt
│   └── sentiment-analyst.ts    # 情绪分析Prompt
```

## Phase 1 范围（本次实现）

### 4个Agent

| Agent | 投资哲学 | 数据来源 | 输出信号 |
|-------|---------|---------|---------|
| value-investor | 巴菲特护城河+格雷厄姆安全边际 | stockService (基本面) | bullish/bearish/neutral |
| growth-investor | 林奇PEG+费希尔成长 | stockService (增长指标) | bullish/bearish/neutral |
| technical-analyst | 价格/成交量/均线 | klineService (K线) | bullish/bearish/neutral |
| sentiment-analyst | 新闻+市场情绪 | newsService (新闻) | bullish/bearish/neutral |

### 信号格式

```typescript
interface AgentSignal {
  agentId: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;  // 0-100
  reasoning: string;   // 简洁理由（<120字）
}
```

### Portfolio Manager 聚合逻辑

```
4个Agent信号 → 信号统计(多/空/中性) → 置信度加权 → 风险约束检查 → 最终决策
{
  action: 'buy' | 'sell' | 'hold',
  confidence: number,
  reasoning: string,
  signals: AgentSignal[]  // 所有Agent的原始信号
}
```

### API 端点

- `POST /api/hedge-fund/analyze` — 分析单只股票
- `GET /api/hedge-fund/agents` — 获取所有Agent列表
- `GET /api/hedge-fund/agents/[id]` — 获取单个Agent详情

### 数据流

```
POST /api/hedge-fund/analyze { symbol: '00700' }
    ↓
hedge-fund-service.ts
    ├─ stockService.getStockData(symbol) → 基本面数据
    ├─ klineService.getKlineData(symbol) → K线数据
    └─ newsService.getNews(symbol) → 新闻数据
    ↓
并行执行 4 个 Agent（Promise.all）
    ├─ valueInvestor(data, symbol) → AgentSignal
    ├─ growthInvestor(data, symbol) → AgentSignal
    ├─ technicalAnalyst(data, symbol) → AgentSignal
    └─ sentimentAnalyst(data, symbol) → AgentSignal
    ↓
portfolioManager.aggregate(allSignals) → PortfolioDecision
    ↓
返回 { action, confidence, reasoning, signals }
```

## 扩展路径（Phase 2+）

- 更多投资哲学Agent：宏观趋势、逆向投资、估值专家
- 量化分析层：DCF估值、ROE分析、护城河评分
- 回测引擎：历史信号回测
- 前端可视化：React Flow Agent 执行图
- 定时分析：每日自动分析持仓

---

*Created: 2026-04-15*
