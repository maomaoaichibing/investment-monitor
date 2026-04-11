# Alert Impact Analyzer 执行记录

## 2026-04-11 10:44 执行结果

**执行状态**: ✅ 成功（无新增alert）

**分析数量**: 0条（无新增）

**说明**: 101条未读 alerts 均为历史积压（2026-04-08 Yahoo RSS风暴），与上次执行（2026-04-10）完全一致，无新增 high/medium 级别 alert。批量分析已于 2026-04-09 完成。

**服务器**: 62.234.79.188:4000

---

## 2026-04-10 14:02 执行结果

**执行状态**: ✅ 成功

**分析数量**: 1条 (蔚来 urgent)

**结果摘要**:
- 蔚来(NIO): bearish影响, impactScore=7, 健康度 80→65 (-17), 假设 weakened
- 触发因素: 月交付量环比下降23%

**备注**: `level=important,urgent` 联合查询仍返回0条（历史已知问题），改用全量未读查询筛出 urgent 蔚来 alert

**服务器**: localhost:4000

---

## 2026-04-09 22:14 执行结果

**执行状态**: ✅ 成功

**分析数量**: 1条 (蔚来 urgent)

**结果摘要**:
- 蔚来(NIO): bearish影响, impactScore=7, 健康度 65 (基准), 假设 weakened
- 触发因素: 月交付量环比下降23%
- `level=important,urgent` 联合查询仍返回0条（API参数解析问题），需修复

**服务器**: localhost:4000

---

## 2026-04-09 15:47 执行结果（批量全量分析）

**执行状态**: ✅ 成功

**分析数量**: 101条 (重要级别新闻 Alert，来自 Finnhub 切换后的 Yahoo RSS 风暴)

**按标的汇总**:
| 标的 | 总数 | 利好 | 利空 | 中性 | 均分 | 健康度变化 |
|------|------|------|------|------|------|------------|
| NIO (蔚来) | 4 | 4 | 0 | 0 | 7.0 | +20 ✅ |
| MU (美光科技) | 24 | 14 | 9 | 1 | 6.2 | -87 ⚠️ |
| 00981 (中芯国际) | 19 | 0 | 18 | 1 | 5.9 | -305 🔴 |
| PDD (拼多多) | 23 | 4 | 17 | 2 | 5.1 | -292 🔴 |
| AAPL (苹果) | 31 | 9 | 2 | 20 | 3.6 | -155 ⚠️ |

**关键发现**: 中芯国际(00981)全线 bearish(18/19)，假设普遍 weakened；拼多多(PDD)17/23 bearish；蔚来(NIO)全4条利好（Firefly升级）；苹果(AAPL)中性为主（财报前观望）

**⚠️ 异常**: Alert数量从昨日4条暴增至101条（+97条），原因是 Finnhub 切换后 Yahoo RSS 新闻数量大幅增加，建议检查 alert-impact-analyzer 的触发阈值或增加 Alert 去重逻辑

**服务器**: 62.234.79.188:4000
**API路径**: /api/alerts?status=unread&level=important,urgent + /api/alerts/[id]/analyze

---

## 2026-04-09 13:45 执行结果

**执行状态**: ✅ 成功

**分析数量**: 1条 (urgent × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 65 (假设基准), 假设weakened

**备注**: level=important,urgent 联合查询返回0条（API参数解析问题），改用全量未读查询筛出3条（info/watch/urgent），分析蔚来 urgent alert

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-09 09:42 执行结果

**执行状态**: ✅ 成功

**分析数量**: 1条 (important × 1)

**结果摘要**:
1. 美光科技(MU): bearish影响, impactScore=7, 健康度 82→65 (-17), 假设weakened

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-09 07:02 执行结果

**执行状态**: ✅ 成功

**分析数量**: 1条 (important × 1)

**结果摘要**:
1. 美光科技(MU): bearish影响, impactScore=7, 健康度 82→65 (-17), 假设weakened

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-09 03:51 执行结果

**执行状态**: ✅ 成功

**分析数量**: 1条 (important × 1)

**结果摘要**:
1. 美光科技(MU): neutral影响, impactScore=3, 健康度 82→65 (-17), 假设weakened

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-08 23:06 执行结果

**执行状态**: ✅ 成功

**分析数量**: 1条 (important × 1)

**结果摘要**:
1. 美光科技(MU): bearish影响, impactScore=5, 健康度 80→65 (-15), 假设weakened

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-08 17:24 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 82→65 (-17), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=2, 健康度 82→65 (-17), 假设weakened

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-08 15:22 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 82→65 (-17), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=5, 健康度 80→65 (-15), 假设intact

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-08 07:41 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 82→65 (-17), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=3, 健康度 82→65 (-15), 假设weakened

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-08 05:39 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 82→65 (-17), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=5, 健康度 80→75 (-5), 假设intact

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-08 03:38 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 82→65 (-15), 假设weakened
2. 美光科技(MU): bearish影响, impactScore=7, 健康度 82→65 (-17), 假设weakened

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-08 01:37 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 82→65 (-17), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=3, 健康度 80→77 (-3), 假设intact

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-07 23:36 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 82→65 (-15), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=3, 健康度 82→65 (-15), 假设weakened

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-07 21:35 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 82→65 (-17), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=5, 健康度 80→65 (-15), 假设weakened

**服务器**: localhost:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-07 19:27 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 82→65 (-17), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=3, 健康度 82→75 (-5), 假设intact

**服务器**: 62.234.79.188:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-07 15:42 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 →65 (-17), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=3, 健康度 →75 (-5), 假设intact

**服务器**: 62.234.79.188:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-07 12:52 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 →65 (-15), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=5, 健康度 →75 (-5), 假设intact

**服务器**: 62.234.79.188:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-07 10:50 执行结果

**执行状态**: ✅ 成功

**分析数量**: 1条 (important × 1)

**结果摘要**:
1. 美光科技(MU): neutral影响, impactScore=3, 健康度 82→65 (-17), 假设intact

**服务器**: 62.234.79.188:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-07 08:45 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 80→65 (-15), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=5, 健康度 80→65 (-15), 假设weakened

**服务器**: 62.234.79.188:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-07 06:40 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (urgent × 1, important × 1)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 82→65 (-17), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=4, 健康度 80→65 (-15), 假设weakened

**服务器**: 62.234.79.188:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-07 04:39 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (important + urgent各1条)

**结果摘要**:
1. 蔚来(NIO): bearish影响, impactScore=7, 健康度 80→65 (-15), 假设weakened
2. 美光科技(MU): neutral影响, impactScore=4, 健康度 82→65 (-17), 假设weakened

**服务器**: 62.234.79.188:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-07 02:38 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (important + urgent各1条)

**结果摘要**:
1. 美光科技(MU): neutral影响, impactScore=4, 健康度 80→70 (-10), 假设weakened
2. 蔚来(NIO): bearish影响, impactScore=7, 健康度 80→65 (-15), 假设weakened

**服务器**: 62.234.79.188:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-07 00:37 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (important + urgent各1条)

**结果摘要**:
1. 美光科技(MU): neutral影响, impactScore=3, 健康度 82→65 (-17), 假设intact
2. 蔚来(NIO): bearish影响, impactScore=7, 健康度 80→65 (-15), 假设weakened

**服务器**: 62.234.79.188:4000
**API路径**: /api/alerts/[id]/analyze

---

## 2026-04-06 22:36 执行结果

**执行状态**: ✅ 成功

**分析数量**: 2条 (important + urgent各1条)

**结果摘要**:
1. 美光科技(MU): neutral影响, 健康度↓15→65
2. 蔚来(NIO): bearish影响, 健康度↓15→65

**服务器**: 62.234.79.188:4000
**API路径**: /api/alerts/[id]/analyze
