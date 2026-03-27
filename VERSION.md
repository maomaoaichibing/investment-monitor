# 投资监控系统版本管理

## 当前版本

**v1.3** (2026-03-27)

### 功能清单
- Portfolio管理 - 投资组合CRUD
- Position管理 - 持仓CRUD
- Dashboard统计 - 实时数据展示
- AI Thesis生成 - 结构化投资论题
- AI Alert影响分析
- AI 每日摘要
- 邮件通知系统
- **仪表盘改版** - 决策价值卡片、AI动态流、增强论题卡片
- **仪表盘优化** - 论题卡片真实内容、健康度环形进度条、Sparkline迷你图
- **投资组合列表页** - /portfolios 完整列表展示
- **论题详情页** - /theses/[id] 动态路由

### 技术栈
- Next.js 14 + TypeScript + Tailwind CSS
- Prisma + SQLite
- Kimi API (moonshot-v1-8k)
- nodemailer (QQ邮箱SMTP)

### 部署信息
- 服务器: root@62.234.79.188
- 项目路径: /var/www/investment-monitor
- PM2服务: investment-monitor
- 访问地址: http://62.234.79.188:4000

---

## 版本历史

| 版本 | 日期 | 提交/commit | 更新内容 |
|------|------|-------------|----------|
| v1.3 | 2026-03-27 | e39c1f7 | 投资监控系统多页面修复：portfolios列表页、theses详情路由(/theses/[id])、首页数据一致性 |
| v1.2 | 2026-03-27 | 8b8cc23 | 健康度环形进度条SVG实现、Sparkline迷你折线图渲染修复 |
| v1.1 | 2026-03-27 | b9ef02d | 仪表盘优化：论题卡片填充内容、健康度环形进度条、Sparkline迷你图、数据一致性修复 |
| v1.0 | 2026-03-27 | 1d6eac9 | 仪表盘改版上线，新增决策价值卡片、AI动态流、增强论题卡片、即将到来的事件模块 |

---

## 版本命名规则

- **主版本号**: 重大架构变更（如换框架、大规模重构）
- **次版本号**: 新功能上线、功能优化
- **修订号**: Bug修复、文档更新、小调整

**格式**: `v主版本号.次版本号.修订号`
**示例**: v1.0, v1.1, v1.2, v2.0

---

## 回滚指南

### 从 Git 回滚

```bash
# 查看版本历史
git log --oneline

# 回滚到指定版本
git revert <commit-hash>    # 创建新提交回滚（推荐）
# 或
git reset --hard <commit-hash>  # 强制回滚（会丢失之后的提交）

# 推送回滚
git push origin main
```

### 从 PM2 回滚

```bash
# 查看历史版本
pm2 show investment-monitor

# 如果有备份，执行
pm2 stop investment-monitor
# 手动替换代码目录
pm2 start investment-monitor
```

### 从备份文件回滚数据库

```bash
# 查看备份
ls backups/

# 解压备份
gunzip backups/invest_db_YYYY-MM-DD.db.gz

# 停止服务
pm2 stop investment-monitor

# 替换数据库
cp backups/invest_db_YYYY-MM-DD.db prisma/dev.db

# 重启服务
pm2 start investment-monitor
```

---

## 备份策略

- **数据库**: 每天 02:00 自动备份到 `backups/` 目录
- **代码**: 每次部署自动提交 Git
- **保留**: 保留最近30天备份

---

## 部署检查清单

- [ ] 代码修改完成并测试通过
- [ ] `npm run build` 构建成功
- [ ] 本地预览正常
- [ ] 提交代码: `git add -A && git commit -m "vX.X"` && `git push`
- [ ] 服务器部署: `ssh root@62.234.79.188 "cd /var/www/investment-monitor && ./deploy-update.sh"`
- [ ] 更新 VERSION.md 记录新版本
- [ ] 验证线上功能正常
