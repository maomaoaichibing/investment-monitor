/**
 * 版本配置 - 版本历史记录
 * 每次发布新版本时，在此文件添加版本信息
 */

export interface VersionFeature {
  title: string
  description: string
  status: 'new' | 'improved' | 'fixed' | 'optimized'
}

export interface Version {
  version: string
  date: string
  title: string
  description: string
  features: VersionFeature[]
  commitId?: string
}

export const CURRENT_VERSION = 'v1.0.7'

export const VERSION_HISTORY: Version[] = [
  {
    version: 'v1.0.7',
    date: '2026-03-29',
    title: '批量操作 & 健康度仪表盘 & 运维工具',
    description: '新增批量重新生成Thesis、健康度分析页面、Dashboard快捷操作、运维脚本',
    commitId: '2f78268',
    features: [
      {
        title: '修复做空仓位Prompt',
        description: '支持bearishSignal字段，SQQQ等做空产品正确生成看空逻辑',
        status: 'fixed'
      },
      {
        title: '批量重新生成Thesis',
        description: '新增/api/theses/batch-regenerate API和/positions/batch-regenerate页面',
        status: 'new'
      },
      {
        title: '投资组合健康度仪表盘',
        description: '新增/portfolios/[id]/health页面，环形进度显示总体健康度',
        status: 'new'
      },
      {
        title: 'Dashboard快捷操作',
        description: '新增QuickActions组件，快捷入口：新建组合、批量重新生成、全部论题、全部提醒',
        status: 'new'
      },
      {
        title: '完善ESLint配置',
        description: '添加.next/core-web-vitals配置，修复eslint-disable注释问题',
        status: 'optimized'
      },
      {
        title: '运维脚本集',
        description: '新增api-test.sh(API测试)、backup-db.sh(数据库备份)、monitor.sh(服务监控)',
        status: 'new'
      }
    ]
  },
  {
    version: 'v1.0.6',
    date: '2026-03-28',
    title: 'Thesis显示优化 & 做空逻辑修复',
    description: '修复投资论题显示问题，优化做空仓位分析方向',
    commitId: '02f1f94',
    features: [
      {
        title: '修复[object Object]显示问题',
        description: '投资论题详情页的投资支柱现在能正确显示内容，不再显示[object Object]',
        status: 'fixed'
      },
      {
        title: '修复做空仓位分析方向',
        description: '三倍做空纳指(SQQQ)等做空产品现在会正确生成看空逻辑，使用bearishSignal字段',
        status: 'fixed'
      },
      {
        title: '增强持仓详情页行情数据',
        description: '新增52周高低、市值、市盈率、股息率等字段展示',
        status: 'improved'
      },
      {
        title: '多数据源容灾优化',
        description: '行情数据支持腾讯财经→新浪财经→Yahoo Finance自动切换',
        status: 'optimized'
      }
    ]
  },
  {
    version: 'v1.0.5',
    date: '2026-03-27',
    title: 'AI功能全面升级',
    description: '三大AI功能正式上线：Thesis生成框架、Alert影响分析、每日摘要',
    commitId: '18f7ddf',
    features: [
      {
        title: '#1 Thesis生成框架升级',
        description: '新增overallHealthScore、impactWeight、dataType字段，使用结构化框架生成投资论题',
        status: 'new'
      },
      {
        title: '#2 Alert影响分析',
        description: '新增analyzeAlertImpact方法，自动分析数据异常对投资论点的具体影响',
        status: 'new'
      },
      {
        title: '#3 每日/每周AI摘要',
        description: '新增/api/daily-summary端点，生成critical_alerts、notable_changes、upcoming_events',
        status: 'new'
      },
      {
        title: 'Devils Advocate反向论证',
        description: '新增反向投资论点生成，挑战假设、发现盲点',
        status: 'new'
      },
      {
        title: '仪表盘AI动态流',
        description: '新增AIFeed组件，展示AI生成的投资监控动态',
        status: 'new'
      },
      {
        title: '论题详情页改版',
        description: '新增PillarsTree组件，投资支柱树形展示，可折叠展开',
        status: 'improved'
      }
    ]
  },
  {
    version: 'v1.0.4',
    date: '2026-03-26',
    title: 'Phase 5 Alert系统完成',
    description: '完整的提醒系统，支持多级别提醒、自动创建、智能分析',
    commitId: 'a1b2c3d',
    features: [
      {
        title: 'Alert Schemas完整实现',
        description: '7个核心schema，支持level(4级)、status(3级)、source分类',
        status: 'new'
      },
      {
        title: 'Alert Service CRUD',
        description: '完整的Alert服务层，支持创建、查询、更新、删除操作',
        status: 'new'
      },
      {
        title: 'Dashboard RecentAlerts组件',
        description: '真实API数据展示，支持loading/error状态处理',
        status: 'new'
      },
      {
        title: 'Alert列表页',
        description: '支持筛选(status/level)、状态管理、批量操作',
        status: 'new'
      },
      {
        title: 'Alert详情页',
        description: 'SSR渲染，关联数据展示，智能影响分析',
        status: 'new'
      }
    ]
  },
  {
    version: 'v1.0.3',
    date: '2026-03-25',
    title: 'Phase 4 监控计划完成',
    description: 'Monitor Plan功能，支持触发条件、自动创建Alert、监控指标管理',
    commitId: 'b2c3d4e',
    features: [
      {
        title: 'Monitor Plan API',
        description: '统一POST /api/monitor-plan/generate与GET端点，支持首次生成和重复查询',
        status: 'new'
      },
      {
        title: '触发条件持久化',
        description: 'trigger_conditions_json字段，支持复杂的监控条件配置',
        status: 'new'
      },
      {
        title: 'MonitorPlanView组件',
        description: '完整的监控计划展示，包含触发条件、状态、时间线',
        status: 'new'
      }
    ]
  },
  {
    version: 'v1.0.2',
    date: '2026-03-24',
    title: '中文界面完成',
    description: '全部前端页面翻译为中文，提升用户体验',
    commitId: 'c3d4e5f',
    features: [
      {
        title: 'Dashboard中文翻译',
        description: '仪表盘所有组件翻译完成',
        status: 'new'
      },
      {
        title: 'Portfolio中英文切换',
        description: '投资组合相关页面全部汉化',
        status: 'new'
      },
      {
        title: 'Alert系统汉化',
        description: '提醒列表和详情页完整翻译',
        status: 'new'
      }
    ]
  },
  {
    version: 'v1.0.1',
    date: '2026-03-23',
    title: 'Phase 3 完成',
    description: '持仓详情页、Thesis列表页、Dashboard增强',
    commitId: 'd4e5f6g',
    features: [
      {
        title: '持仓详情页',
        description: '路径/positions/[id]，展示持仓信息、关联Thesis、统计概览',
        status: 'new'
      },
      {
        title: 'Thesis列表页',
        description: '路径/theses，支持搜索、状态筛选、分页展示',
        status: 'new'
      },
      {
        title: 'Dashboard RecentTheses',
        description: '三列网格布局，展示最近4个Thesis',
        status: 'new'
      }
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026-03-17',
    title: 'MVP正式上线',
    description: '投资逻辑监控系统核心功能',
    commitId: 'e5f6g7h',
    features: [
      {
        title: '投资流派诊断',
        description: '5大投资流派测试和推荐',
        status: 'new'
      },
      {
        title: '标的7问分析框架',
        description: '结构化投资分析模板',
        status: 'new'
      },
      {
        title: 'Portfolio管理',
        description: '投资组合CRUD完整功能',
        status: 'new'
      },
      {
        title: 'Position管理',
        description: '持仓CRUD，支持多市场(A股/港股/美股)',
        status: 'new'
      }
    ]
  }
]
