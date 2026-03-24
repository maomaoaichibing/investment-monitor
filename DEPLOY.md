# 部署到 Vercel 指南

## 方式一：使用 Vercel CLI（推荐）

### 前提条件
1. 确保代码已提交到 GitHub/GitLab
2. 安装 Vercel CLI：
```bash
npm i -g vercel
```

### 部署步骤

1. **登录 Vercel**
```bash
vercel login
```

2. **运行部署命令**
```bash
vercel
```

3. **回答配置问题**
- Set up and deploy? → `Y`
- Which scope? → 选择你的 Vercel 账号
- Link to existing project? → `N` (首次部署)
- What's your project's name? → `investment-monitor` (或自定义)
- In which directory? → `./` (当前目录)
- Override settings? → `N` (使用默认配置)

4. **等待部署完成**
部署成功后，会显示线上地址，例如：
```
https://investment-monitor.vercel.app
```

### 后续更新
代码更新后，再次运行：
```bash
vercel --prod
```

---

## 方式二：使用 Vercel 网站

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub/GitLab 账号登录
3. 点击 "Add New..." → "Project"
4. 导入你的代码仓库
5. 配置环境变量（如果需要）
6. 点击 "Deploy"

---

## 数据库说明

### ⚠️ 重要提醒
当前项目使用 SQLite 数据库，文件存储在 `/prisma/dev.db`

**Vercel 部署时的问题：**
- Vercel 的文件系统是只读的（Serverless 环境）
- 每次部署后，数据库会重置为初始状态
- 不适合长期生产使用

### 解决方案（可选）

#### 方案 A：使用 Vercel Postgres（推荐）

1. 在 Vercel Dashboard 中创建 Postgres 数据库
2. 更新 `schema.prisma`：
```prisma
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
}
```

3. 安装依赖：
```bash
npm install @prisma/adapter-pg
```

4. 更新数据库连接代码

#### 方案 B：仅用于演示
如果只是演示用途，可以接受数据库重置：
- 预先准备一些种子数据
- 在 `package.json` 中添加：
```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

---

## 环境变量配置

### Vercel 控制台配置
在 Vercel Project Settings → Environment Variables 中添加：

```env
DATABASE_URL=file:./dev.db
```

---

## 验证部署

部署成功后：

1. 访问你的域名（如 https://investment-monitor.vercel.app）
2. 检查中文界面是否正常显示
3. 测试核心功能：
   - 创建投资组合
   - 添加持仓
   - 生成投资论题
   - 查看提醒

---

## 自定义域名（可选）

1. 在 Vercel Dashboard → Project Settings → Domains
2. 添加你的自定义域名
3. 按照提示配置 DNS

---

## 常见问题

### Q: 部署后页面显示 500 错误？
A: 检查数据库连接是否正常，查看 Vercel Logs 获取详细错误信息

### Q: 如何查看服务器日志？
A: 在 Vercel Dashboard → Project → Logs

### Q: 如何回滚到之前的版本？
A: Vercel 自动保存每次部署，可在 Dashboard 中一键回滚

---

## 需要帮助？

参考文档：
- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
