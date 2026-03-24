# Investment Thesis Monitoring Agent

一个面向二级市场投资者的持仓逻辑监控应用。核心功能是分析投资逻辑变化，而不是简单的价格提醒。

## 核心概念

### 什么是 Investment Thesis？
投资者持有某个标的背后的核心逻辑。例如：
- 盈利修复逻辑
- 行业景气上行逻辑
- 政策利好逻辑
- AI资本开支扩张逻辑
- 高股息防御逻辑

### 什么是 Thesis Change？
不是单纯的价格涨跌，而是：
- 逻辑被验证（Strengthen）
- 逻辑维持（Maintain）
- 逻辑弱化（Weaken）
- 逻辑反转（Reverse）

### 什么是好的提醒？
好的提醒必须回答：
1. 发生了什么事件
2. 改变了哪条逻辑
3. 证据是什么
4. 影响程度如何
5. 用户应该如何理解这个变化

## 技术栈

### 前端
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Server Components (Minimal client state)

### 后端
- **API**: Next.js API Routes
- **Database**: SQLite (MVP) / PostgreSQL (Production)
- **ORM**: Prisma
- **Validation**: Zod

### AI 层
- **Provider Abstraction**: 统一的 LLM provider 接口
- **Mock Provider**: MVP 阶段使用 mock 数据
- **Prompt Management**: 独立的 prompt 目录

## 架构原则

1. **规则引擎 + LLM 分层**
   - 规则层：格式校验、阈值判断、提醒等级初筛
   - LLM层：逻辑归因、thesis生成、影响分析

2. **结构化存储**
   - 所有中间结果（Portfolio、Position、Thesis、MonitorPlan、Event、Alert）都结构化存储
   - 不使用纯文本存储分析结果

3. **MVP 优先**
   - 先支持 mock 数据和 mock 事件
   - 预留真实数据接入接口
   - 分阶段开发，保证每个阶段都可运行

## 数据模型

```
Portfolio
├── id
├── name
├── description
└── positions (1:n)

Position
├── id
├── portfolioId
├── symbol
├── assetName
├── market
├── quantity
├── costPrice
├── positionWeight
├── holdingStyle (short_term/swing/long_term)
└── thesis (1:n)

Thesis
├── id
├── positionId
├── lookbackWindow (e.g., "12m")
├── summary
├── coreThesis
├── fragilePoints
├── pricePhasesJson (structured)
├── driversJson (structured)
├── monitorTargetsJson (structured)
└── rawContextJson

MonitorPlan
├── id
├── positionId
├── thesisId
├── priority (high/medium/low)
├── monitorItemsJson (structured)
└── status (active/paused/completed)

Event
├── id
├── symbol
├── eventType (earnings/guidance_change/policy/etc.)
├── title
├── content
├── eventTime
└── source

EventAnalysis
├── id
├── eventId
├── positionId
├── thesisId
├── relevanceScore (0-1)
├── thesisImpact (strengthen/maintain/weaken/reverse)
├── impactLevel (high/medium/low)
├── reasoning
├── evidenceJson (structured)
└── actionFramework

Alert
├── id
├── positionId
├── eventId
├── eventAnalysisId
├── level (info/watch/important/urgent)
├── title
├── summary
└── status (unread/read/dismissed)
```

## 项目结构

```
src/
├── app/
│   ├── (pages)/
│   │   ├── dashboard/
│   │   ├── portfolios/
│   │   ├── positions/
│   │   ├── thesis/
│   │   ├── monitor-plans/
│   │   ├── events/
│   │   └── alerts/
│   └── api/
│       ├── portfolios/
│       ├── positions/
│       ├── thesis/
│       ├── monitor-plans/
│       ├── events/
│       ├── event-analysis/
│       └── alerts/
├── components/
│   ├── portfolio/
│   ├── position/
│   ├── thesis/
│   ├── alert/
│   ├── dashboard/
│   ├── layout/
│   └── ui/ (shadcn components)
├── lib/
│   ├── db/
│   ├── llm/
│   │   ├── providers/
│   │   └── prompts/
│   ├── schemas/ (Zod schemas)
│   ├── services/
│   └── utils/
└── server/
    └── services/ (business logic)
```

## 开发计划

### Phase 1: 项目初始化 ✅
- [x] 初始化 Next.js + TypeScript + Tailwind + Prisma
- [x] 数据库 schema 设计
- [x] 基础 layout 和导航
- [x] mock provider 和 LLM provider 抽象层

### Phase 2: 组合与持仓管理 ✅
- [x] 组合 CRUD
- [x] 持仓录入
- [x] 列表和详情页

### Phase 3: Thesis 生成
- [ ] 设计 thesis prompt
- [ ] 接入 mock context
- [ ] 实现 thesis 生成 API
- [ ] 实现 thesis 详情页

### Phase 4: Monitor Plan 生成
- [ ] 设计 monitor plan prompt
- [ ] 实现 monitor plan API
- [ ] 实现展示页

### Phase 5: 事件与分析
- [ ] 事件录入页
- [ ] 事件分析 prompt
- [ ] 事件分析 API
- [ ] 提醒生成逻辑

### Phase 6: 提醒中心
- [ ] alert 列表页
- [ ] alert 详情页

### Phase 7: 完善与收尾
- [ ] 基础错误处理
- [ ] loading 状态
- [ ] 空状态
- [ ] schema 校验完善

## 本地开发

### 环境设置
1. 复制环境变量文件：
   ```bash
   cp .env.example .env.local
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 初始化数据库：
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. 启动开发服务器：
   ```bash
   npm run dev
   ```

### 数据库操作
- 生成 Prisma 客户端：`npm run db:generate`
- 更新数据库结构：`npm run db:push`
- 填充测试数据：`npm run db:seed`
- 打开 Prisma Studio：`npm run db:studio`

## API 端点

### Portfolio
- `GET /api/portfolios` - 获取组合列表
- `POST /api/portfolios` - 创建组合
- `GET /api/portfolios/:id` - 获取组合详情
- `PUT /api/portfolios/:id` - 更新组合
- `DELETE /api/portfolios/:id` - 删除组合

### Position
- `POST /api/positions` - 创建持仓
- `GET /api/positions/:id` - 获取持仓详情

### Thesis
- `POST /api/thesis/generate` - 生成 thesis
- `GET /api/thesis/by-position/:positionId` - 获取持仓的 thesis

### MonitorPlan
- `POST /api/monitor-plans/generate` - 生成监控计划
- `GET /api/monitor-plans/by-position/:positionId` - 获取持仓的监控计划

### Event
- `POST /api/events` - 创建事件
- `GET /api/events` - 获取事件列表
- `GET /api/events/:id` - 获取事件详情

### EventAnalysis
- `POST /api/event-analysis/analyze` - 分析事件
- `GET /api/event-analysis/by-event/:eventId` - 获取事件分析

### Alert
- `GET /api/alerts` - 获取提醒列表
- `GET /api/alerts/:id` - 获取提醒详情

## Mock 数据

系统内置了以下示例标的的 mock context：

1. **NVDA** - NVIDIA Corporation
2. **TSLA** - Tesla Inc.
3. **AAPL** - Apple Inc.
4. **300750.SZ** - 宁德时代
5. **518880.SH** - 华安黄金ETF

每个标的包含：
- 过去12个月价格表现摘要
- 关键财报摘要
- 关键新闻事件
- 行业背景
- 宏观背景

## 提醒逻辑

### Alert 等级映射
- `reverse` → `urgent`
- `weaken` + `high` → `important`
- `weaken` → `watch`
- `strengthen` → `info`
- `maintain` → `info`

### 提醒触发条件
1. 事件与 thesis 相关度 > 0.7
2. thesis impact 不是 `maintain`
3. 影响等级至少为 `medium`

## 扩展计划

### 数据接入
- 行情数据 API（聚宽、Tushare、Yahoo Finance）
- 公告数据 API（公司公告、行业数据）
- 新闻数据 API（财经新闻、社交媒体）

### AI 增强
- 多模型支持（OpenAI GPT-4、Claude、本地模型）
- 自定义 prompt 调优
- 批量分析和批量提醒

### 高级功能
- 组合层面风险分析
- 跨标的逻辑关联分析
- 自动化监控和扫描
- 报表和导出功能

## 贡献指南

1. 遵循 TypeScript 类型安全
2. 所有核心 JSON 输出必须经过 Zod 校验
3. service 层和 UI 层分离
4. prompt 独立管理
5. 优先保证项目可运行，再补充细节

## License

MIT