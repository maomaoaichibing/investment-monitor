#!/usr/bin/env node
/**
 * 自主工作引擎 - Autonomous Work Engine
 *
 * 功能：
 * 1. 每5分钟扫描项目状态
 * 2. 检查服务器健康状态
 * 3. 检测代码错误和问题
 * 4. 自动记录需要关注的事项
 * 5. 发现问题自动生成任务建议
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const PROJECT_PATH = '/Users/zhangxiaohei/WorkBuddy/smart-investment';
const SERVER_URL = 'http://62.234.79.188:4000';
const LOG_FILE = path.join(PROJECT_PATH, '.workbuddy/memory/autonomous-work.log');

const CHECK_INTERVAL = 5 * 60 * 1000; // 5分钟

// 关键API列表
const CRITICAL_APIS = [
  '/api/portfolios',
  '/api/positions',
  '/api/alerts',
  '/api/stock/quote/00700?market=HK',
  '/api/market/overview',
];

async function log(message: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
  console.log(logEntry.trim());
}

async function checkServerHealth(): Promise<string[]> {
  const results: string[] = [];

  for (const api of CRITICAL_APIS) {
    try {
      const response = await fetch(`${SERVER_URL}${api}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        results.push(`✅ ${api} - OK`);
      } else {
        results.push(`⚠️ ${api} - ${response.status}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push(`❌ ${api} - ${errorMessage}`);
    }
  }

  return results;
}

async function checkGitStatus(): Promise<{ hasChanges: boolean; details?: string; error?: string }> {
  try {
    const { stdout } = await execAsync('git status --porcelain', {
      cwd: PROJECT_PATH,
    });

    if (stdout.trim()) {
      return { hasChanges: true, details: stdout.trim() };
    }
    return { hasChanges: false };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { hasChanges: false, error: errorMessage };
  }
}

async function checkRecentBuildErrors() {
  try {
    const buildLogPath = path.join(PROJECT_PATH, '.next/build.log');
    if (fs.existsSync(buildLogPath)) {
      const content = fs.readFileSync(buildLogPath, 'utf-8');
      const errors = content.match(/Error:.*/g);
      if (errors && errors.length > 0) {
        return errors.slice(-5); // 最近5个错误
      }
    }
    return [];
  } catch {
    return [];
  }
}

async function checkPM2Status(): Promise<{ running: boolean; uptime?: number; memory?: string; cpu?: string; error?: string }> {
  try {
    const { stdout } = await execAsync('pm2 jlist', { cwd: PROJECT_PATH });
    const processes = JSON.parse(stdout);
    const monitor = processes.find((p: { name: string }) => p.name === 'investment-monitor');

    if (monitor) {
      return {
        running: monitor.pm2_env?.status === 'online',
        uptime: monitor.pm2_env?.pm_uptime,
        memory: Math.round(monitor.monit?.memory / 1024 / 1024) + 'MB',
        cpu: monitor.monit?.cpu + '%',
      };
    }
    return { running: false };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { running: false, error: errorMessage };
  }
}

async function checkDatabaseStatus() {
  try {
    const dbPath = path.join(PROJECT_PATH, 'prisma/dev.db');
    const stats = fs.statSync(dbPath);
    return {
      exists: true,
      size: Math.round(stats.size / 1024) + 'KB',
      modified: stats.mtime.toISOString(),
    };
  } catch {
    return { exists: false };
  }
}

async function runSelfCheck() {
  await log('=== 自主工作引擎启动 ===');

  const [serverHealth, gitStatus, pm2Status, dbStatus, buildErrors] = await Promise.all([
    checkServerHealth(),
    checkGitStatus(),
    checkPM2Status(),
    checkDatabaseStatus(),
    checkRecentBuildErrors(),
  ]);

  await log('--- 服务器健康检查 ---');
  serverHealth.forEach(r => log(r));

  await log('--- Git 状态 ---');
  if (gitStatus.hasChanges) {
    log(`有未提交的更改:\n${gitStatus.details}`);
  } else {
    log('✅ 无未提交更改');
  }

  await log('--- PM2 进程状态 ---');
  if (pm2Status.running) {
    log(`✅ 进程运行中 | 内存: ${pm2Status.memory} | CPU: ${pm2Status.cpu}`);
  } else {
    log(`❌ 进程未运行: ${pm2Status.error || 'unknown'}`);
  }

  await log('--- 数据库状态 ---');
  if (dbStatus.exists) {
    log(`✅ 数据库存在 | 大小: ${dbStatus.size} | 修改: ${dbStatus.modified}`);
  } else {
    log('❌ 数据库不存在');
  }

  if (buildErrors.length > 0) {
    await log('--- 最近构建错误 ---');
    buildErrors.forEach(e => log(`⚠️ ${e}`));
  }

  await log('=== 检查完成 ===\n');
}

// 主函数
async function main(): Promise<void> {
  log(`项目路径: ${PROJECT_PATH}`);
  log(`检查间隔: ${CHECK_INTERVAL / 1000 / 60} 分钟`);
  log(`服务器: ${SERVER_URL}`);

  // 立即执行一次
  await runSelfCheck();

  // 设置定时循环
  setInterval(runSelfCheck, CHECK_INTERVAL);

  log('自主工作引擎已启动，将在后台持续运行...');
  log('按 Ctrl+C 停止\n');
}

// 启动
main().catch(console.error);