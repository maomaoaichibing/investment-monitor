import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'CNY') {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercentage(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function generateMockContext(symbol: string): any {
  const mockContexts: Record<string, any> = {
    'NVDA': {
      pricePerformance: '过去12个月上涨约200%，主要受AI芯片需求推动',
      earningsSummary: '季度营收连续超预期，数据中心业务增长显著',
      keyEvents: [
        '2025-Q1: AI芯片订单大幅增长',
        '2025-Q2: 新数据中心产品发布',
        '2025-Q3: 合作伙伴扩展',
        '2025-Q4: 行业需求持续强劲'
      ],
      industryBackground: 'AI芯片行业高速增长，竞争加剧但龙头地位稳固',
      macroBackground: '科技投资增加，AI基础设施支出上升'
    },
    'TSLA': {
      pricePerformance: '过去12个月波动较大，受销量和竞争影响',
      earningsSummary: '汽车交付量稳步增长，利润率压力显现',
      keyEvents: [
        '2025-Q1: 新车型发布',
        '2025-Q2: 价格调整影响利润率',
        '2025-Q3: 工厂扩建',
        '2025-Q4: 自动驾驶进展'
      ],
      industryBackground: '电动车竞争激烈，价格战持续',
      macroBackground: '新能源政策支持，但补贴逐步退坡'
    },
    'AAPL': {
      pricePerformance: '过去12个月稳定上涨，服务业务增长强劲',
      earningsSummary: 'iPhone销售稳定，服务业务成为增长引擎',
      keyEvents: [
        '2025-Q1: 新产品发布',
        '2025-Q2: 服务业务增长超预期',
        '2025-Q3: 开发者大会',
        '2025-Q4: 假日季销售强劲'
      ],
      industryBackground: '智能手机市场成熟，服务业务成新增长点',
      macroBackground: '消费电子需求稳定，服务订阅模式普及'
    },
    '300750.SZ': {
      pricePerformance: '过去12个月震荡上行，新能源行业波动',
      earningsSummary: '电池出货量增长，但利润率受原材料影响',
      keyEvents: [
        '2025-Q1: 新工厂投产',
        '2025-Q2: 原材料价格波动',
        '2025-Q3: 新客户签约',
        '2025-Q4: 技术突破'
      ],
      industryBackground: '动力电池竞争激烈，技术迭代快',
      macroBackground: '新能源汽车政策支持，但补贴逐步退出'
    },
    '518880.SH': {
      pricePerformance: '过去12个月震荡，受金价和避险情绪影响',
      earningsSummary: '黄金ETF规模稳定增长',
      keyEvents: [
        '2025-Q1: 地缘政治紧张推高金价',
        '2025-Q2: 美联储政策预期变化',
        '2025-Q3: 通胀数据影响',
        '2025-Q4: 避险需求上升'
      ],
      industryBackground: '黄金作为避险资产，需求稳定',
      macroBackground: '全球不确定性增加，避险资产受青睐'
    }
  }

  return mockContexts[symbol] || {
    pricePerformance: '过去12个月表现数据缺失',
    earningsSummary: '财报数据缺失',
    keyEvents: ['无重大事件记录'],
    industryBackground: '行业背景信息缺失',
    macroBackground: '宏观背景信息缺失'
  }
}

// Alert level mapping functions
export function mapThesisImpactToAlertLevel(
  thesisImpact: 'strengthen' | 'maintain' | 'weaken' | 'reverse',
  impactLevel: 'low' | 'medium' | 'high'
): 'info' | 'watch' | 'important' | 'urgent' {
  if (thesisImpact === 'reverse') {
    return 'urgent'
  }
  
  if (thesisImpact === 'weaken' && impactLevel === 'high') {
    return 'important'
  }
  
  if (thesisImpact === 'weaken') {
    return 'watch'
  }
  
  if (thesisImpact === 'strengthen') {
    return 'info'
  }
  
  // maintain or default
  return 'info'
}

export function getAlertLevelColor(level: string) {
  switch (level) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'important':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'watch':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'info':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}