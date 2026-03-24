# 投资监控系统 - 腾讯云部署指南

基于篮球青训系统部署经验，使用 PM2 + Nginx 部署到腾讯云服务器。

---

## 📋 部署准备

### 服务器要求
- **系统**: Ubuntu 20.04/22.04 LTS 或 CentOS 7+
- **内存**: 最低 1GB（推荐 2GB）
- **存储**: 10GB+
- **Node.js**: v18.0.0 或更高
- **端口**: 4000（应用） + 80/443（Nginx）

---

## 🔧 服务器环境配置

### 1. 安装 Node.js（如果未安装）

```bash
# 使用 NVM 安装 Node.js（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

# 验证安装
node -v  # 应显示 v18.x.x
npm -v   # 应显示 9.x.x
```

### 2. 安装 PM2

```bash
npm i -g pm2

# 验证安装
pm2 --version
```

### 3. 创建项目目录

```bash
sudo mkdir -p /var/www/investment-monitor
sudo chown $USER:$USER /var/www/investment-monitor
```

---

## 📦 部署步骤

### 方法一：使用 deploy.sh 脚本（推荐）

1. **上传代码到服务器**
```bash
# 在本地打包代码
zip -r investment-monitor.zip . -x "node_modules/*" ".next/*" ".git/*"

# 上传到服务器（使用 scp 或 rz）
scp investment-monitor.zip root@<服务器IP>:/var/www/

# 在服务器上解压
ssh root@<服务器IP>
cd /var/www/
unzip investment-monitor.zip -d investment-monitor
cd investment-monitor
```

2. **运行部署脚本**
```bash
cd /var/www/investment-monitor
chmod +x deploy.sh
./deploy.sh
```

脚本会自动完成：
- ✅ 安装依赖
- ✅ 生成 Prisma Client
- ✅ 构建应用
- ✅ 启动 PM2 进程
- ✅ 配置开机自启

---

### 方法二：手动部署

```bash
# 1. 进入项目目录
cd /var/www/investment-monitor

# 2. 安装依赖
npm install

# 3. 生成 Prisma Client
npm run db:generate

# 4. 构建应用
npm run build

# 5. 启动应用
pm2 start ecosystem.config.js --env production

# 6. 保存配置
pm2 save
pm2 startup
```

---

## 🌐 Nginx 配置

### 1. 安装 Nginx（如果未安装）

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
sudo systemctl enable nginx
```

### 2. 配置 Nginx 反向代理

创建配置文件：

```bash
sudo nano /etc/nginx/sites-available/investment-monitor
```

内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    # 日志配置
    access_log /var/log/nginx/investment-monitor-access.log;
    error_log /var/log/nginx/investment-monitor-error.log;

    # 客户端限制
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存（可选优化）
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:4000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/investment-monitor /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 🔐 环境变量配置

### 1. 设置环境变量

编辑 `/etc/environment`：

```bash
sudo nano /etc/environment
```

添加：

```bash
# 数据库
DATABASE_URL=file:./dev.db

# API 密钥（如果需要）
KIMI_API_KEY=sk-your-api-key

# 其他配置
NODE_ENV=production
PORT=4000
```

使配置生效：

```bash
source /etc/environment
```

### 2. 验证环境变量

```bash
echo $DATABASE_URL
echo $KIMI_API_KEY
```

---

## 🚀 部署后验证

### 1. 检查应用状态

```bash
# 查看 PM2 进程
pm2 list

# 查看应用日志
pm2 logs investment-monitor

# 实时查看日志
pm2 logs investment-monitor --lines 100 --timestamp
```

### 2. 测试服务

```bash
# 本地测试
curl http://localhost:4000

# 通过 Nginx 测试
curl http://your-domain.com
```

### 3. 检查端口

```bash
# 查看 4000 端口是否监听
netstat -tuln | grep 4000

# 或
ss -tuln | grep 4000
```

---

## 🛠️ 常用管理命令

```bash
# 查看状态
pm2 list

# 查看日志
pm2 logs investment-monitor

# 重启应用
pm2 restart investment-monitor

# 停止应用
pm2 stop investment-monitor

# 删除应用
pm2 delete investment-monitor

# 监控资源
pm2 monit

# 保存配置（开机自启）
pm2 save
pm2 startup
```

---

## 📊 日志管理

### 应用日志

```bash
# PM2 日志
/var/log/pm2/investment-monitor-error.log
/var/log/pm2/investment-monitor-out.log

# 实时查看
tail -f /var/log/pm2/investment-monitor-*.log
```

### Nginx 日志

```bash
# Nginx 访问日志
/var/log/nginx/investment-monitor-access.log

# Nginx 错误日志
/var/log/nginx/investment-monitor-error.log

# 实时查看
tail -f /var/log/nginx/investment-monitor-*.log
```

---

## 🔄 更新部署

代码更新后，重新运行部署：

```bash
cd /var/www/investment-monitor
./deploy.sh
```

或手动：

```bash
cd /var/www/investment-monitor
git pull origin main
npm install
npm run build
pm2 restart investment-monitor
```

---

## 🛡️ 安全建议

1. **配置防火墙**
```bash
# 只开放必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

2. **使用 HTTPS（生产环境）**
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com
```

3. **限制 IP 访问（可选）**
```bash
# 在 Nginx 配置中添加
location / {
    allow 你的IP地址;
    deny all;
    # ...
}
```

---

## 📱 测试访问

部署完成后：

### 1. 本地服务器访问
```
http://<服务器IP>:4000
```

### 2. Nginx 代理访问（配置域名后）
```
http://your-domain.com
```

### 3. 测试页面
- 仪表盘: `/`
- 投资组合: `/portfolios`
- 投资提醒: `/alerts`
- 生成论题: `/thesis/generate`

---

## 🆘 常见问题

### Q1: 部署后访问 502 Bad Gateway?

**原因**: 应用未启动或端口未监听

**解决**:
```bash
# 检查应用状态
pm2 list

# 查看错误日志
pm2 logs investment-monitor --lines 50

# 重启应用
pm2 restart investment-monitor
```

### Q2: 样式丢失或显示不正常?

**原因**: Next.js 缓存问题

**解决**:
```bash
# 重新构建
cd /var/www/investment-monitor
rm -rf .next
npm run build
pm2 restart investment-monitor
```

### Q3: 数据库连接失败?

**原因**: Prisma Client 未生成或数据库文件不存在

**解决**:
```bash
# 生成 Prisma Client
npm run db:generate

# 检查数据库文件
ls -la prisma/dev.db

# 重新启动
pm2 restart investment-monitor
```

### Q4: pm2 command not found?

**原因**: PM2 未安装或不在 PATH

**解决**:
```bash
# 重新安装 PM2
npm i -g pm2

# 创建软链接
sudo ln -s /root/.nvm/versions/node/v18.x.x/bin/pm2 /usr/local/bin/pm2
```

---

## 📚 参考文档

- [PM2 官方文档](https://pm2.keymetrics.io/)
- [Nginx 配置指南](https://nginx.org/en/docs/)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)

---

## 🎯 部署清单

部署前确认：

- [ ] 服务器已安装 Node.js 18+
- [ ] PM2 已全局安装
- [ ] Nginx 已安装（如需要域名访问）
- [ ] 代码已上传到 `/var/www/investment-monitor`
- [ ] 环境变量已配置
- [ ] 端口 4000 未被占用
- [ ] 域名已解析（如需要）

部署后确认：

- [ ] `pm2 list` 显示应用状态为 `online`
- [ ] `curl http://localhost:4000` 返回正常
- [ ] 中文界面显示正常
- [ ] 数据库操作正常

---

**部署完成！** 🎉

访问 http://<服务器IP>:4000 查看效果
