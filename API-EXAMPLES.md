# API Examples for Monitor Plan

## 1. POST /api/monitor-plan/generate - 首次生成监控计划 (201 Created)

### 请求
```http
POST /api/monitor-plan/generate
Content-Type: application/json

{
  "thesisId": "th_1"
}
```

### 响应 (201 Created)
```json
{
  "success": true,
  "message": "Monitor plan created successfully",
  "data": {
    "monitorPlan": {
      "id": "mp_1",
      "positionId": "pos_1",
      "thesisId": "th_1",
      "title": "NVIDIA AI投资监控计划",
      "description": "监控NVIDIA在AI计算领域的核心指标和潜在风险信号",
      "priority": "medium",
      "status": "active",
      "createdAt": "2026-03-23T10:30:00.000Z",
      "updatedAt": "2026-03-23T10:30:00.000Z",
      "watchItems": [
        {
          "title": "季度数据中心营收",
          "metric": "数据中心营收环比增长",
          "threshold": "环比增长低于10%",
          "source": "公司财报",
          "frequency": "quarterly",
          "priority": "high"
        },
        {
          "title": "毛利率趋势",
          "metric": "毛利率变化",
          "threshold": "连续两个季度下降",
          "source": "财报分析",
          "frequency": "quarterly",
          "priority": "medium"
        }
      ],
      "triggerConditions": [
        {
          "condition": "数据中心营收环比增长低于5%",
          "description": "核心增长引擎放缓",
          "action": "重新评估增长预期，考虑部分减仓",
          "priority": "high",
          "requiresConfirmation": true,
          "confirmationMethod": "ai"
        }
      ],
      "reviewFrequency": "weekly",
      "disconfirmSignals": [
        {
          "signal": "数据中心业务增速连续两个季度下滑",
          "description": "核心增长引擎失速",
          "severity": "critical",
          "response": "重新评估核心投资逻辑"
        }
      ],
      "actionHints": [
        {
          "scenario": "季度业绩低于预期",
          "suggestedAction": "将风险等级提升至高级，准备减仓计划",
          "rationale": "防止连续超预期失败",
          "priority": "high"
        }
      ],
      "notes": "重点关注数据中心业务的持续增长能力"
    },
    "created": true,
    "source": "new"
  }
}
```

## 2. POST /api/monitor-plan/generate - 重复生成监控计划 (200 OK)

### 请求
```http
POST /api/monitor-plan/generate
Content-Type: application/json

{
  "thesisId": "th_1"
}
```

### 响应 (200 OK)
```json
{
  "success": true,
  "message": "Monitor plan already exists",
  "data": {
    "monitorPlan": {
      "id": "mp_1",
      "positionId": "pos_1",
      "thesisId": "th_1",
      "title": "NVIDIA AI投资监控计划",
      "description": "监控NVIDIA在AI计算领域的核心指标和潜在风险信号",
      "priority": "medium",
      "status": "active",
      "createdAt": "2026-03-23T10:30:00.000Z",
      "updatedAt": "2026-03-23T10:30:00.000Z",
      "watchItems": [
        {
          "title": "季度数据中心营收",
          "metric": "数据中心营收环比增长",
          "threshold": "环比增长低于10%",
          "source": "公司财报",
          "frequency": "quarterly",
          "priority": "high"
        },
        {
          "title": "毛利率趋势",
          "metric": "毛利率变化",
          "threshold": "连续两个季度下降",
          "source": "财报分析",
          "frequency": "quarterly",
          "priority": "medium"
        }
      ],
      "triggerConditions": [
        {
          "condition": "数据中心营收环比增长低于5%",
          "description": "核心增长引擎放缓",
          "action": "重新评估增长预期，考虑部分减仓",
          "priority": "high",
          "requiresConfirmation": true,
          "confirmationMethod": "ai"
        }
      ],
      "reviewFrequency": "weekly",
      "disconfirmSignals": [
        {
          "signal": "数据中心业务增速连续两个季度下滑",
          "description": "核心增长引擎失速",
          "severity": "critical",
          "response": "重新评估核心投资逻辑"
        }
      ],
      "actionHints": [
        {
          "scenario": "季度业绩低于预期",
          "suggestedAction": "将风险等级提升至高级，准备减仓计划",
          "rationale": "防止连续超预期失败",
          "priority": "high"
        }
      ],
      "notes": "重点关注数据中心业务的持续增长能力"
    },
    "created": false,
    "source": "existing"
  }
}
```

## 3. GET /api/monitor-plan?thesisId=th_1 - 查询监控计划 (200 OK)

### 请求
```http
GET /api/monitor-plan?thesisId=th_1
```

### 响应 (200 OK - 监控计划存在)
```json
{
  "success": true,
  "data": {
    "monitorPlan": {
      "id": "mp_1",
      "positionId": "pos_1",
      "thesisId": "th_1",
      "title": "NVIDIA AI投资监控计划",
      "description": "监控NVIDIA在AI计算领域的核心指标和潜在风险信号",
      "priority": "medium",
      "status": "active",
      "createdAt": "2026-03-23T10:30:00.000Z",
      "updatedAt": "2026-03-23T10:30:00.000Z",
      "watchItems": [
        {
          "title": "季度数据中心营收",
          "metric": "数据中心营收环比增长",
          "threshold": "环比增长低于10%",
          "source": "公司财报",
          "frequency": "quarterly",
          "priority": "high"
        },
        {
          "title": "毛利率趋势",
          "metric": "毛利率变化",
          "threshold": "连续两个季度下降",
          "source": "财报分析",
          "frequency": "quarterly",
          "priority": "medium"
        }
      ],
      "triggerConditions": [
        {
          "condition": "数据中心营收环比增长低于5%",
          "description": "核心增长引擎放缓",
          "action": "重新评估增长预期，考虑部分减仓",
          "priority": "high",
          "requiresConfirmation": true,
          "confirmationMethod": "ai"
        }
      ],
      "reviewFrequency": "weekly",
      "disconfirmSignals": [
        {
          "signal": "数据中心业务增速连续两个季度下滑",
          "description": "核心增长引擎失速",
          "severity": "critical",
          "response": "重新评估核心投资逻辑"
        }
      ],
      "actionHints": [
        {
          "scenario": "季度业绩低于预期",
          "suggestedAction": "将风险等级提升至高级，准备减仓计划",
          "rationale": "防止连续超预期失败",
          "priority": "high"
        }
      ],
      "notes": "重点关注数据中心业务的持续增长能力"
    }
  }
}
```

### 响应 (200 OK - 监控计划不存在)
```json
{
  "success": true,
  "data": {
    "monitorPlan": null
  },
  "message": "No monitor plan found for this thesis"
}
```