# Alert Impact Analyzer - 执行记录

## 最近执行

**执行时间**: 2026-04-11 10:54
**执行状态**: ⚠️ 今日无新增 alerts（全部为 2026-04-08 历史积压）

### API 调用
- GET /api/alerts?status=unread&level=important,urgent&limit=100 → 100条（均为历史积压，0新增）
- 标的分布: AAPL 31, MU 23, PDD 23, 00981 19, NIO 4
- 今日新增: 0条 → 跳过分析
- 结果写入 2026-04-11.md

---

**执行时间**: 2026-04-11 06:14
**执行状态**: ⚠️ 今日无新增 alerts（全部为 2026-04-08 历史积压）

### API 调用
- GET /api/alerts?status=unread&level=important,urgent&limit=100 → 101条（均为历史积压，0新增）
- 标的分布: AAPL 31, MU 23, PDD 23, 00981 19, NIO 4
- 今日新增: 0条 → 跳过分析
- 结果写入 2026-04-11.md

---

**执行时间**: 2026-04-11 00:50
**执行状态**: ⚠️ 今日无新增 alerts（全部为 2026-04-08 历史积压）

### API 调用
- GET /api/alerts?status=unread&level=important,urgent&limit=100 → 100条（均为历史积压，0新增）
- 标的分布: AAPL 31, MU 23, PDD 23, 00981 19, NIO 4
- 今日新增: 0条 → 跳过分析
- 结果写入 2026-04-11.md

---

**执行时间**: 2026-04-10 20:44
**执行状态**: ⚠️ 今日无新增 alerts（全部为 2026-04-08 历史积压）

### API 调用
- GET /api/alerts?status=unread&level=important,urgent&limit=100 → 100条（均为历史积压，0新增）
- 标的分布: AAPL 31, MU 23, PDD 23, 00981 19, NIO 4
- 今日新增: 0条 → 跳过分析
- 结果写入 2026-04-10.md

---

**执行时间**: 2026-04-09 14:20
**执行状态**: ✅ 成功（4/4，代表性样本）

### 分析结果

| 标的 | 新闻 | 影响方向 | 影响分 | 健康度变化 |
|------|------|----------|--------|------------|
| MU | Dividend Growers | 🟢 bullish | 7 | 80→85 (+5) |
| NIO | Firefly升级/ES9 | 🟡 neutral | 5 | 80→80 (0) |
| PDD | Ridiculously Cheap | 🟢 bullish | 7 | 80→85 (+5) |
| AAPL | Broadcom/AI安全 | 🟡 neutral | 3 | 80→80 (0) |

### API 调用
- GET /api/alerts?status=unread&level=important,urgent&limit=100 → 100条（均为历史积压，0新增）
- POST /api/alerts/[id]/analyze → 4/4 成功
- 结果写入 2026-04-09.md

---

**执行时间**: 2026-04-09 12:16
**执行状态**: ✅ 成功（4/4样本）

### 分析结果

| 标的 | 新闻 | 影响方向 | 影响分 | 健康度变化 |
|------|------|----------|--------|------------|
| MU | Dividend Growers | 🟢 bullish | 7 | 80→85 (+5) |
| NIO | Firefly升级/ES9 | 🟡 neutral | 5 | 80→80 (0) |
| PDD | Ridiculous Cheap | 🟢 bullish | 7 | 80→85 (+5) |
| AAPL | Broadcom/AI安全 | 🟡 neutral | 3 | 80→80 (0) |

### API 调用
- GET /api/alerts?status=unread&level=important,urgent&limit=100 → 100条（均为昨日积压，今日0新增）
- POST /api/alerts/[id]/analyze → 4/4 成功（每标的各取最新1条代表样本）
- 结果写入 2026-04-09.md

---

**执行时间**: 2026-04-09 06:41
**执行状态**: ✅ 成功（4/4）

### 分析结果

| 标的 | 新闻 | 影响方向 | 影响分 | 健康度变化 |
|------|------|----------|--------|------------|
| MU | Dividend Growers | 🟢 bullish | 3 | 80→82 (+2) |
| NIO | Firefly升级/ES9 | 🟢 bullish | 7 | 80→85 (+5) |
| MU | AI Stocks被低估 | 🟢 bullish | 7 | 80→85 (+5) |
| PDD | Ridiculous Cheap | 🟢 bullish | 7 | 80→85 (+5) |

### API 调用
- GET /api/alerts?status=unread&level=important,urgent → 4条
- POST /api/alerts/[id]/analyze → 4/4 成功
- 结果写入 alert-impact-2026-04-09.md + 2026-04-09.md

---

**执行时间**: 2026-04-08 18:18
**执行状态**: ✅ 成功（95/96，1条超时）

### 分析结果

| 标的 | 总数 | 正面 | 负面 | 倾向 |
|------|------|------|------|------|
| 中芯国际(00981) | 19 | 0 | 19 | 🔴 bearish |
| 苹果(AAPL) | 31 | 26 | 5 | 🟢 bullish |
| 美光科技(MU) | 21 | 11 | 9 | 🟡 mixed |
| 蔚来(NIO) | 3 | 3 | 0 | 🟢 bullish |
| 拼多多(PDD) | 22 | 3 | 19 | 🔴 bearish |

### API 调用
- GET /api/alerts?status=unread&level=important,urgent&limit=100 → 96条
- POST /api/alerts/[id]/analyze → 95/96成功，1条超时（cmnphp63y000b8897c4aopg3p）
- 分析结果已写入 2026-04-08.md

---

| 时间 | 状态 | 数量 | 备注 |
|------|------|------|------|
| 2026-04-08 18:18 | ✅ 成功 | 95 | 96条全量分析：00981全负面，AAPL偏正面，MU分化，PDD全负面 |
| 2026-04-08 16:03 | ✅ 成功 | 81 | 全量批量分析：PDD/00981 bearish为主，AAPL neutral/bullish，MU分化 |
| 2026-04-08 11:48 | ✅ 成功 | 4 | MU bearish(5), AAPL neutral(3), PDD bearish(7), 00981 bearish(5) |
| 2026-04-08 07:39 | ✅ 成功 | 1 | MU neutral(4) |
| 2026-04-08 05:38 | ✅ 成功 | 2 | NIO bearish(7), MU neutral(5) |
| 2026-04-08 01:35 | ✅ 成功 | 2 | NIO bearish(7), MU neutral(3) |

---

## 历史执行摘要

| 日期 | 状态 | 分析数量 | 备注 |
|------|------|----------|------|
| 2026-04-08 | ✅ 成功 | 4 | PDD bearish(7)为最大影响 |
| 2026-04-07 | ✅ 成功 | 2 | NIO bearish(7), MU neutral(3-5) |

---

**执行时间**: 2026-04-10 13:15
**执行状态**: ⚠️ 今日无新增 alerts（全部为 2026-04-08 历史积压）

### API 调用
- GET /api/alerts?status=unread&level=important,urgent&limit=100 → 100条（全部来自 2026-04-08）
- 标的分布: AAPL 31, MU 23, PDD 23, 00981 19, NIO 4
- 今日新增: 0条 → 跳过分析
- 结果写入 2026-04-10.md
