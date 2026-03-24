/**
 * PM2 部署配置 - 投资监控系统
 *
 * 服务器配置步骤：
 * 1. 在服务器上安装 PM2: npm i -g pm2
 * 2. 在 /etc/environment 中设置环境变量:
 *    echo "DATABASE_URL=file:./dev.db" >> /etc/environment
 *    echo "KIMI_API_KEY=sk-your-api-key" >> /etc/environment
 *    source /etc/environment
 * 3. 部署: pm2 start ecosystem.config.js --env production
 * 4. 保存配置: pm2 save
 * 5. 设置开机自启: pm2 startup
 */

module.exports = {
  apps: [{
    name: 'investment-monitor',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/investment-monitor',
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      // 生产环境变量（实际值在服务器上配置）
      DATABASE_URL: 'file:./dev.db',
      // API 密钥通过服务器环境变量配置，不硬编码
    },
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
    },
    // PM2 配置
    instances: 1,           // 单实例（SQLite 不适合多进程）
    exec_mode: 'fork',      // fork 模式
    watch: false,           // 不监听文件变化
    max_memory_restart: '1G', // 内存超过 1G 自动重启
    error_file: '/var/log/pm2/investment-monitor-error.log',
    out_file: '/var/log/pm2/investment-monitor-out.log',
    log_file: '/var/log/pm2/investment-monitor-combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // 自动重启
    autorestart: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    // 环境检查
    env_check: {
      NODE_VERSION: '>=18.0.0'
    }
  }]
}
