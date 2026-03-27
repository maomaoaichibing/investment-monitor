# 邮件通知功能配置指南

## 概述

智能投资监控系统支持邮件通知功能，可以在以下情况发送邮件：
- 📧 **重要 Alert 提醒** - 当有重要的投资提醒时
- 📊 **每日投资摘要** - 每天定时发送投资组合状态摘要
- 📈 **周报/月报** - 定期发送投资报告

---

## QQ 邮箱 SMTP 配置

### 第一步：获取 QQ 邮箱授权码

1. 登录 QQ 邮箱：https://mail.qq.com
2. 进入 **设置** → **账户**
3. 找到 **POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务**
4. 开启 **SMTP 服务**
5. 按提示发送短信获取授权码
6. **保存授权码**（格式：xxxxxxxxxxxxx，16位字母）

> ⚠️ 授权码不是 QQ 密码，是专用用于第三方邮件客户端的访问凭证

### 第二步：配置环境变量

在 `.env` 文件中添加以下配置：

```env
# 邮件发送配置 (QQ 邮箱 SMTP)
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=275755135@qq.com
EMAIL_PASS=your_auth_code_here
EMAIL_FROM=275755135@qq.com

# 应用公共 URL（邮件中的链接）
NEXT_PUBLIC_APP_URL=http://62.234.79.188:4000
```

> ⚠️ 请将 `your_auth_code_here` 替换为实际获取的授权码

### 第三步：验证配置

```bash
# 测试邮件配置是否正确
curl http://localhost:4000/api/email
```

返回 `{ "success": true, "message": "邮件配置正常" }` 表示配置成功。

### 第四步：发送测试邮件

```bash
curl -X POST http://localhost:4000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"to":"275755135@qq.com","subject":"测试邮件","html":"<h1>测试</h1><p>这是一封测试邮件</p>"}'
```

---

## 其他邮箱服务配置

### Gmail

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

> ⚠️ Gmail 需要启用"低安全性应用访问"或使用应用专用密码

### 网易邮箱 (163/126)

```env
EMAIL_HOST=smtp.163.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@163.com
EMAIL_PASS=your授权码
```

---

## 自动化邮件任务

### 每日投资摘要

创建自动化任务，每天早上 9:00 发送每日摘要：

```bash
# 在 WorkBuddy 中创建自动化任务
# 任务名称: daily-email-summary
# 调度: FREQ=DAILY;BYHOUR=9;BYMINUTE=0
# 功能: 调用 /api/email/daily-summary 发送每日摘要
```

### 重要 Alert 即时通知

当有重要的 Alert（级别为 urgent 或 important）时，自动发送邮件通知。

---

## API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/email` | GET | 验证邮件配置 |
| `/api/email` | POST | 发送自定义邮件 |
| `/api/email/alert` | POST | 发送 Alert 邮件 |
| `/api/email/daily-summary` | POST | 发送每日摘要邮件 |

---

## 常见问题

### Q: 邮件发送失败，显示"认证失败"
A: 请检查：
1. EMAIL_USER 是否为正确的邮箱地址
2. EMAIL_PASS 是否为授权码而非登录密码
3. QQ 邮箱是否开启了 SMTP 服务

### Q: 显示"连接服务器失败"
A: 请检查：
1. 网络是否可以访问 EMAIL_HOST
2. 端口号是否正确（587 或 465）
3. 防火墙是否阻止了 SMTP 端口

### Q: 如何修改邮件发件人名称？
A: 在 EMAIL_FROM 中使用格式：`"智能投资系统" <your@email.com>`
