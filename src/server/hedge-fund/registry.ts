/**
 * AI Hedge Fund — Agent 注册表
 *
 * 所有 Agent 在此注册，新增 Agent 只需：
 * 1. 在 agents/ 目录写实现函数
 * 2. 在此文件的 AGENT_REGISTRY 中注册配置
 * 3. 在 agents/index.ts 中导出
 * 4. Portfolio Manager 自动发现
 */

import type { AgentConfig, AgentEntry } from './types';

// 注意：AgentEntry 和 AgentFunction 在 types.ts 中定义

/**
 * Agent 注册表配置
 * 注意：fn 函数在 index.ts 中通过 import 实际绑定
 */
export const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: 'value-investor',
    displayName: '价值投资分析师',
    description: '巴菲特护城河 + 格雷厄姆安全边际',
    investingStyle: '寻找被市场低估的优质企业，关注ROE、护城河、现金流和估值安全边际',
    type: 'philosophy',
    order: 0,
    enabled: true,
  },
  {
    id: 'growth-investor',
    displayName: '成长投资分析师',
    description: '彼得·林奇PEG策略 + 费希尔成长股研究',
    investingStyle: '寻找收入和利润高速增长的公司，关注PEG比率、收入增速、市场份额扩张',
    type: 'philosophy',
    order: 1,
    enabled: true,
  },
  {
    id: 'technical-analyst',
    displayName: '技术分析师',
    description: '价格/成交量/均线/趋势分析',
    investingStyle: '基于价格走势和成交量模式判断趋势方向，关注支撑阻力位、均线系统、动量指标',
    type: 'analytical',
    order: 10,
    enabled: true,
  },
  {
    id: 'sentiment-analyst',
    displayName: '市场情绪分析师',
    description: '新闻情绪 + 市场热度分析',
    investingStyle: '分析新闻情感和市场参与者行为，识别过度乐观或悲观的市场情绪',
    type: 'analytical',
    order: 11,
    enabled: true,
  },
  // Phase 2 预留
  // {
  //   id: 'macro-investor',
  //   displayName: '宏观趋势分析师',
  //   description: '德鲁肯米勒宏观趋势',
  //   investingStyle: '基于宏观经济周期和政策方向判断行业趋势',
  //   type: 'philosophy',
  //   order: 2,
  //   enabled: false,
  // },
  // {
  //   id: 'contrarian-investor',
  //   displayName: '逆向投资分析师',
  //   description: '迈克尔·布瑞逆向投资',
  //   investingStyle: '在市场极端情绪中寻找反向投资机会',
  //   type: 'philosophy',
  //   order: 3,
  //   enabled: false,
  // },
];

/**
 * 获取所有启用的 Agent 配置
 */
export function getEnabledAgents(): AgentConfig[] {
  return AGENT_CONFIGS.filter(a => a.enabled).sort((a, b) => a.order - b.order);
}

/**
 * 获取指定 Agent 配置
 */
export function getAgentConfig(id: string): AgentConfig | undefined {
  return AGENT_CONFIGS.find(a => a.id === id);
}
