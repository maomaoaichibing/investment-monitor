# Phase 6: 多数据源行情整合

## 现状分析

### 现有行情服务
- **数据源**: 腾讯财经 + 新浪财经（双保险）
- **支持市场**: A股(SH/SZ)、港股(HK)、美股(US)
- **持仓覆盖**: 5只港股 + 5只美股

### 现有持仓
| 代码 | 名称 | 市场 |
|------|------|------|
| 00700 | 腾讯控股 | HK |
| 00883 | 中国海洋石油 | HK |
| 00100 | MINIMAX-W | HK |
| 00981 | 中芯国际 | HK |
| 00317 | 中船防务 | HK |
| AAPL | 苹果 | US |
| PDD | 拼多多 | US |
| MU | 美光科技 | US |
| NIO | 蔚来 | US |
| SQQQ | 三倍做空纳指 | US |

---

## 功能增强

### 1. 增强型行情 API ⭐

#### 1.1 多数据源容灾
```typescript
// 数据源优先级
优先级1: 腾讯财经
优先级2: 新浪财经
优先级3: Yahoo Finance (备用)
```

#### 1.2 增强 StockQuote 接口
```typescript
interface EnhancedStockQuote extends StockQuote {
  // 基础字段 (现有)
  symbol, name, price, change, changePercent,
  open, prevClose, high, low, volume, amount, market

  // 新增字段
  week52High?: number      // 52周最高
  week52Low?: number       // 52周最低
  marketCap?: number       // 总市值
  pe?: number              // 市盈率
  dividend?: number        // 股息率
  turnoverRate?: number    // 换手率
  amplitude?: number        // 振幅
  preMarketPrice?: number  // 盘前价格 (美股)
  afterHoursPrice?: number // 盘后价格 (美股)
  status?: ' trading' | 'closed' | 'pre' | 'after'
}
```

#### 1.3 批量行情优化
- 支持一次查询多个股票（减少请求数）
- 60秒本地缓存（减少API调用）

---

### 2. 行情历史 K 线 ⭐

#### 2.1 日 K 数据
```typescript
interface DailyKLine {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  amount: number
}
```

#### 2.2 简单技术指标
- MA5、MA10、MA20（移动平均线）
- 最近 N 日涨跌幅

---

### 3. 股票搜索与添加 ⭐

#### 3.1 搜索功能
- 支持按代码/名称搜索
- 自动识别市场

#### 3.2 热门股票推荐
- A股：宁德时代、贵州茅台、比亚迪等
- 港股：腾讯、阿里、美团等
- 美股：苹果、谷歌、亚马逊等

---

### 4. 行情看板页面

#### 4.1 自选股监控
- 统一的行情展示页面
- 价格异常提醒

#### 4.2 市场概览
- A股三大指数（上证、深证、创业板）
- 港股恒生指数
- 美股三大指数（道琼斯、纳斯达克、标普500）

---

## 技术实现

### 文件结构
```
src/
├── server/
│   ├── services/
│   │   ├── stockService.ts      # 现有行情服务（增强）
│   │   ├── stockCache.ts         # 行情缓存层
│   │   └── marketOverview.ts     # 大盘指数
│   └── api/
│       ├── stock/
│       │   ├── quote/[symbol]/route.ts    # 单股行情
│       │   ├── batch/route.ts              # 批量行情
│       │   ├── search/route.ts             # 搜索
│       │   └── history/[symbol]/route.ts   # K线数据
│       └── market/
│           └── overview/route.ts           # 大盘指数
└── components/
    └── stock/
        ├── StockCard.tsx
        ├── StockSearch.tsx
        ├── MarketOverview.tsx
        └── MiniChart.tsx
```

### API 设计

#### GET /api/stock/quote/[symbol]?market=HK
```json
{
  "success": true,
  "data": {
    "symbol": "00700",
    "name": "腾讯控股",
    "price": 493.4,
    "change": -2.2,
    "changePercent": -0.44,
    "week52High": 498.2,
    "week52Low": 260.0,
    "marketCap": 4620000000000,
    "pe": 24.5,
    "status": "trading"
  }
}
```

#### GET /api/stock/batch
```json
POST body: { "stocks": [{ "symbol": "00700", "market": "HK" }, ...] }
Response: {
  "success": true,
  "data": {
    "00700": { ... },
    "AAPL": { ... }
  }
}
```

#### GET /api/stock/history/[symbol]?market=HK&period=daily&count=30
```json
{
  "success": true,
  "data": {
    "symbol": "00700",
    "name": "腾讯控股",
    "klines": [
      { "date": "2026-03-27", "open": 495.6, "high": 498.2, "low": 487.6, "close": 493.4, "volume": 20345920 }
    ]
  }
}
```

#### GET /api/market/overview
```json
{
  "success": true,
  "data": {
    "A股": {
      "上证指数": { "code": "000001", "price": 3360.0, "change": 0.5, "changePercent": 0.01 },
      "深证成指": { "code": "399001", "price": 10800.0, "change": -0.3, "changePercent": -0.003 },
      "创业板": { "code": "399006", "price": 2200.0, "change": 1.2, "changePercent": 0.05 }
    },
    "港股": {
      "恒生指数": { "code": "HSI", "price": 20000.0, "change": -100, "changePercent": -0.5 }
    },
    "美股": {
      "道琼斯": { "code": "DJI", "price": 38000.0, "change": 100, "changePercent": 0.26 },
      "纳斯达克": { "code": "IXIC", "price": 15500.0, "change": 50, "changePercent": 0.32 },
      "标普500": { "code": "SPX", "price": 5000.0, "change": 15, "changePercent": 0.30 }
    }
  }
}
```

---

## 实施计划

### Day 1: 基础增强
- [ ] 增强 stockService.ts（多数据源容灾）
- [ ] 添加 stockCache.ts 缓存层
- [ ] 测试所有持仓的行情获取

### Day 2: API 扩展
- [ ] 创建 /api/stock/quote/[symbol] 路由
- [ ] 创建 /api/stock/batch 路由
- [ ] 添加 EnhancedStockQuote 类型

### Day 3: 大盘指数
- [ ] 创建 /api/market/overview 路由
- [ ] 创建 MarketOverview 组件

### Day 4: 搜索与K线
- [ ] 创建 /api/stock/search 路由
- [ ] 创建 /api/stock/history/[symbol] 路由
- [ ] 创建 StockSearch 组件

### Day 5: 集成与测试
- [ ] 在组合详情页集成增强行情
- [ ] 创建行情看板页面
- [ ] 完整测试

---

## 数据源

### 腾讯财经 (主要)
- 港股: `https://qt.gtimg.cn/q=hk00700`
- A股: `https://qt.gtimg.cn/q=sh600519`
- 美股: `https://qt.gtimg.cn/q=usAAPL`

### 新浪财经 (备用)
- 港股: `https://hq.sinajs.cn/list=hk00700`
- A股: `https://hq.sinajs.cn/list=sh600519`
- 美股: `https://hq.sinajs.cn/list=usAAPL`

### Yahoo Finance (备用)
- `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`

---

## 注意事项

1. **API 限制**: 腾讯/新浪可能限制频繁访问，需要缓存
2. **字符编码**: 返回数据可能是 GBK 编码，需要转换
3. **交易时间**: 非交易时间返回昨日数据或无数据
4. **美股盘后**: 美股支持盘前/盘后行情

---

## 风险与对策

| 风险 | 对策 |
|------|------|
| 数据源不可用 | 多数据源容灾，自动切换 |
| API 限流 | 60秒缓存，批量请求 |
| 数据延迟 | 标记数据更新时间 |
| 格式变化 | 健壮的解析逻辑 |
