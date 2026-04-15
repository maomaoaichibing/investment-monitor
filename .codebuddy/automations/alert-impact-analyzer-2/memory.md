# Alert Impact Analyzer - 执行记录

## 最近执行

**执行时间**: 2026-04-15 14:50
**执行状态**: ✅ 完成（1条 urgent alert 分析，结论稳定）

### API 调用
- GET /api/alerts?status=unread → 3条（1 urgent蔚来 + 1 watch中海油 + 1 info腾讯）
- level=urgent → 1条（蔚来 cmna1yllj，2026-03-28历史数据）
- level=important → 0条
- POST /api/alerts/cmna1yllj000313t8252w2mdx/analyze → ✅ bearish(7), health 65(-15), weakened
- 蔚来 urgent 累计分析 15 次，结论一致
- 无新的 high/medium 级别新增 alerts
- 结果写入 2026-04-15.md

---

**执行时间**: 2026-04-15 12:28
**执行状态**: ✅ 完成（1条 urgent alert 分析，结论稳定）

### API 调用
- level=urgent → 1条（蔚来 cmna1yllj，2026-03-28历史数据）
- level=important → 0条
- POST /api/alerts/cmna1yllj000313t8252w2mdx/analyze → ✅ bearish(7), health 65(-15), weakened
- 蔚来 urgent 累计分析 14 次，结论一致
- 结果写入 2026-04-15.md

---

**执行时间**: 2026-04-15 10:26
**执行状态**: ⚠️ 无新增 high/medium alerts（蔚来 urgent 累计11次分析，结论稳定 bearish(7) health↓17）

### API 调用
- level=urgent → 1条（蔚来 cmna1yllj，2026-03-28历史数据）
- level=important → 0条
- POST /api/alerts/cmna1yllj000313t8252w2mdx/analyze → ✅ bearish(7), health 65(-17), weakened
- 蔚来 urgent 累计分析 11 次，结论一致
- 结果写入 2026-04-15.md

---

**执行时间**: 2026-04-14 17:55
**执行状态**: ⚠️ 无新增 high/medium alerts（蔚来 urgent 17:53已确认"Alert不存在"，已软删除）

### API 调用
- level=urgent → 1条（蔚来 cmna1yllj, 2026-03-28）
- level=important → 0条
- 蔚来 urgent 累计分析 10+ 次，结果一致 bearish(7)，POST /analyze 已不存在的
- 无新的 high/medium alerts
- 结果写入 2026-04-14.md

---

**执行时间**: 2026-04-13 23:56
**执行状态**: ✅ 完成（1条 urgent alert 分析）

### API 调用
- level=urgent → 1条（蔚来 cmna1yllj，2026-03-28历史数据）
- level=important → 0条
- POST /api/alerts/cmna1yllj000313t8252w2mdx/analyze → ✅ bearish(7), health 65(-15), weakened
- 蔚来 urgent 累计分析8次，结果一致
- 结果写入 2026-04-13.md

---

**执行时间**: 2026-04-13 17:44
**执行状态**: ⚠️ 无新增 high/medium 级别 alerts（蔚来 urgent 已七次分析，命中缓存，跳过）

### API 调用
- level=urgent → 1条（蔚来 cmna1yllj，2026-03-28历史数据）
- level=important → 0条
- 蔚来 urgent 已七次分析（04-11 18:26 / 04-12 00:41/23:37 / 04-13 01:39/03:40/05:41/07:42），结果一致 bearish(7) health 65(-17)，跳过
- info/watch 级别不属于 high/medium，不分析
- 结果写入 2026-04-13.md

---

**执行时间**: 2026-04-13 07:42
**执行状态**: ⚠️ 无新增 high/medium 级别 alerts（蔚来 urgent 已六次分析，命中缓存，跳过）

### API 调用
- limit=50 → 3条（1 urgent NIO, 1 watch 00883, 1 info 00700，全部 2026-03-28）
- 蔚来 urgent 已六次分析（04-11 18:26 / 04-12 00:41 / 04-12 23:37 / 04-13 01:39 / 04-13 03:40 / 04-13 05:41），结果一致 bearish(7) health 65(-15)，命中缓存
- info/watch 级别不属于 high/medium，不分析
- 结果写入 2026-04-13.md

---

**执行时间**: 2026-04-13 05:41
**执行状态**: ⚠️ 无新增 high/medium 级别 alerts（蔚来 urgent 已五次分析，跳过）

### API 调用
- limit=20 → 3条（1 urgent NIO, 1 watch 00883, 1 info 00700，全部 2026-03-28）
- 蔚来 urgent cmna1yllj 已五次分析（04-11 18:26 / 04-12 00:41 / 04-12 23:37 / 04-13 01:39 / 04-13 03:40），结果一致 bearish(7) health 65(-17)，跳过
- info/watch 级别不属于 high/medium，不分析
- 结果写入 2026-04-13.md

---

**执行时间**: 2026-04-13 03:40
**执行状态**: ⚠️ 无新增 high/medium 级别 alerts（蔚来 urgent 已于 04-11/04/12 四次分析，跳过）

### API 调用
- level=urgent → 1条（蔚来 cmna1yllj000313t8252w2mdx，2026-03-28历史数据）
- level=important → 0条
- limit=20 → 3条（1 urgent NIO, 1 watch 00883, 1 info 00700）
- 蔚来 urgent 已四次分析（04-11 18:26 / 04-12 00:41 / 04-12 23:37 / 04-13 01:39），结果一致bearish(7) health 65(-17)，跳过重复分析
- 结果写入 2026-04-13.md

---

**执行时间**: 2026-04-13 01:39
**执行状态**: ⚠️ 无新增 high/medium 级别 alerts（蔚来 urgent 已于 04-11/04-12 三次分析，跳过）

### API 调用
- level=urgent → 1条（蔚来 cmna1yllj000313t8252w2mdx，2026-03-28历史数据）
- level=important → 0条
- limit=20 → 3条（1 urgent NIO, 1 watch 00883, 1 info 00700）
- 蔚来 urgent 已三次分析（04-11 18:26 / 04-12 00:41 / 04-12 23:37），结果一致bearish(7) health 65(-17)
- 结果写入 2026-04-13.md

---

**执行时间**: 2026-04-12 23:37
**执行状态**: ✅ 完成（1条 urgent alert 分析）

### API 调用
- level=important,urgent → 0条（逗号解析bug）
- level=urgent → 1条（蔚来 cmna1yllj000313t8252w2mdx）
- level=important → 0条
- POST /api/alerts/cmna1yllj000313t8252w2mdx/analyze → ✅ bearish, score=7, health 82→65(-17), weakened
- 结果写入 2026-04-12.md

---

**执行时间**: 2026-04-12 12:20
**执行状态**: ⚠️ API 调用失败（本地 shell fork EAGAIN）

### API 调用
- level=important,urgent → 0条（逗号解析bug）
- level=urgent / important → ❌ fork EAGAIN
- 10:15 历史: limit=20 → 3条（1 urgent NIO, 1 watch 00883, 1 info 00700）
- NIO urgent 已于 00:41 分析完毕（bearish, score=7, health 65）
- 无新增 high/medium alerts
- 结果写入 2026-04-12.md

---

**执行时间**: 2026-04-12 10:15
**执行状态**: ⚠️ 无新增 high/medium 级别 alerts（NIO urgent 已于 00:41 分析过）

### API 调用
- GET /api/alerts?status=unread&limit=20 → 3条（1 urgent NIO, 1 watch 00883, 1 info 00700）
- NIO urgent alert 已于 2026-04-11 18:26 和 2026-04-12 00:41 分析过，跳过
- watch/info 级别不属于 high/medium，跳过
- fork资源持续紧张（EAGAIN），首次curl成功后续全失败
- 结果写入 2026-04-12.md

---

**执行时间**: 2026-04-11 22:46
**执行状态**: ⚠️ 无新增 high/medium 级别 alerts（NIO urgent 已于 18:26 分析过）

### API 调用
- GET /api/alerts?status=unread&level=important,urgent → 0条（level参数已知问题）
- GET /api/alerts?status=unread&limit=20 → 3条（1 urgent NIO, 1 watch 00883, 1 info 00700）
- NIO urgent alert 已于 18:26 分析过，跳过重复分析
- watch/info 级别不属于 high/medium，跳过
- 结果写入 2026-04-11.md

---

**执行时间**: 2026-04-11 20:31
**执行状态**: ⚠️ 无新增 high/medium 级别 alerts（NIO urgent 已于 18:26 分析过）

### API 调用
- GET /api/alerts?status=unread&limit=100 → 3条（1 urgent NIO, 1 watch 00883, 1 info 00700）
- NIO urgent alert 已于 18:26 分析过，跳过重复分析
- watch/info 级别不属于 high/medium，跳过
- 结果写入 2026-04-11.md

---

**执行时间**: 2026-04-11 18:26
**执行状态**: ✅ 完成（1条 urgent alert 分析）

### API 调用
- GET /api/alerts?status=unread&level=important,urgent → 0条（level参数已知问题）
- GET /api/alerts?status=unread&limit=20 → 3条（1 urgent NIO, 1 watch 00883, 1 info 00700）
- POST /api/alerts/cmna1yllj000313t8252w2mdx/analyze → ✅ 蔚来 bearish(7), 健康分65(-15)
- 结果写入 2026-04-11.md

---

**执行时间**: 2026-04-11 16:24
**执行状态**: ⚠️ 今日无新增 alerts（全部为 2026-04-08 历史积压）

### API 调用
- GET /api/alerts?status=unread&level=important,urgent&limit=100 → 100条（均为历史积压，0新增）
- 标的分布: AAPL 31, MU 23, PDD 23, 00981 19, NIO 4
- 今日新增: 0条 → 跳过分析
- 结果写入 2026-04-11.md

---

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
