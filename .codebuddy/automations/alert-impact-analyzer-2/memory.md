# Alert Impact Analyzer - 执行记录

## 最近执行

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
