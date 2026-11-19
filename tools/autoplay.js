/* tools/autoplay.js — 打开一个「看得见」的 Chrome，让农场机器人按正常速度自己玩。
 *
 *   npm install
 *   npm run bot
 *
 * 想直接看也可以手动打开：http://127.0.0.1:8123/index.html?bot=1
 * 机器人会使用第一个空存档槽，并在本次会话里关闭自动存档，不会覆盖玩家进度。
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const URL_BASE = process.env.FARM_URL || 'http://127.0.0.1:8123/index.html';
const CHROME = process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HEADLESS = process.argv.includes('--headless');
const LEARN_KEY = 'farm_bot_v1';
const LEARN_FILE = path.join(ROOT, 'bot', 'learned-policy.json');

let server = null;
let browser = null;
let syncFn = null;

function log(msg) {
  console.log('[autoplay] ' + msg);
}
function readLearnFile() {
  try {
    const raw = fs.readFileSync(LEARN_FILE, 'utf8');
    JSON.parse(raw);
    return raw;
  } catch (e) {
    return '';
  }
}
function writeLearnFile(raw) {
  try {
    fs.writeFileSync(LEARN_FILE, raw, 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

async function ping(url, timeoutMs = 1200) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return r.ok;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function ensureServer() {
  if (await ping(URL_BASE)) {
    log('本地服务已在运行：' + URL_BASE);
    return;
  }
  log('本地服务未启动，正在运行 serve.js …');
  server = spawn(process.execPath, ['serve.js'], { cwd: ROOT, stdio: 'inherit' });
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await ping(URL_BASE)) {
      log('本地服务已启动');
      return;
    }
  }
  throw new Error('本地服务启动超时，请先手动运行 node serve.js');
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright-core'));
  } catch (e) {
    console.error('\n缺少 playwright-core。先在项目目录运行：\n\n  npm install\n');
    process.exit(1);
  }

  await ensureServer();

  const launchOpts = {
    headless: HEADLESS,
    args: HEADLESS
      ? ['--no-sandbox']
      : ['--window-size=1280,820', '--window-position=80,40', '--no-sandbox']
  };
  if (CHROME && fs.existsSync(CHROME)) launchOpts.executablePath = CHROME;
  else launchOpts.channel = 'chrome';

  log('正在打开浏览器…');
  browser = await chromium.launch(launchOpts);
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.on('pageerror', e => log('页面错误：' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') log('控制台错误：' + m.text());
  });

  /* 学习进度落盘：Playwright 默认是临时浏览器配置，关掉窗口 localStorage 会丢。
   * 启动时把 bot/learned-policy.json 注入 localStorage，运行中定时回写。 */
  const savedLearn = HEADLESS ? '' : readLearnFile();
  if (savedLearn) {
    await context.addInitScript(({ key, raw }) => {
      try {
        if (!localStorage.getItem(key)) localStorage.setItem(key, raw);
      } catch (e) {}
    }, { key: LEARN_KEY, raw: savedLearn });
    log('已载入历史学习：' + path.basename(LEARN_FILE));
  }

  let lastLearn = savedLearn;
  let learnTimer = null;
  let syncLearn = async () => {
    if (HEADLESS) return;
    try {
      const raw = await page.evaluate((key) => localStorage.getItem(key), LEARN_KEY);
      if (raw && raw !== lastLearn) {
        lastLearn = raw;
        if (writeLearnFile(raw)) {
          try {
            const d = JSON.parse(raw);
            log('学习进度已保存：第 ' + ((d.history || []).length + 1) + ' 次策略，最佳 +' + Math.round(d.bestReward || 0) + 'g');
          } catch (e) { log('学习进度已保存'); }
        }
      }
    } catch (e) {}
  };
  syncFn = syncLearn;

  const botUrl = URL_BASE + (URL_BASE.indexOf('?') >= 0 ? '&' : '?') + 'bot=1';
  await page.goto(botUrl, { waitUntil: 'load' });
  learnTimer = setInterval(syncLearn, 4000);
  log('已打开：' + botUrl);
  log('机器人按正常游戏速度行动；右下角面板可以暂停 / 重置学习 / 停止。');
  log('关闭浏览器窗口即可结束。');

  await new Promise((resolve) => {
    browser.on('disconnected', resolve);
    if (HEADLESS) {
      /* 无人值守检查：跑 25 秒，把关键状态打印出来 */
      setTimeout(async () => {
        try {
          const st = await page.evaluate(() => {
            const s = window.FarmBot && window.FarmBot.state;
            return s ? {
              ready: s.ready, running: s.running, task: s.task,
              day: clock.day, gold: Math.floor(gold), stamina: Math.floor(stamina),
              policy: window.FarmBot.policy, history: s.history.length
            } : null;
          });
          log('状态：' + JSON.stringify(st));
        } catch (e) { log('读取状态失败：' + e.message); }
        resolve();
      }, 25000);
    }
  });

  if (learnTimer) clearInterval(learnTimer);
  if (syncFn) await syncFn();
  if (browser) await browser.close().catch(() => {});
}

process.on('SIGINT', async () => {
  try { if (syncFn) await syncFn(); } catch (e) {}
  try { if (browser) await browser.close(); } catch (e) {}
  if (server) server.kill();
  process.exit(0);
});

main().catch(async (e) => {
  console.error('[autoplay] 启动失败：' + e.message);
  try { if (browser) await browser.close(); } catch (e2) {}
  if (server) server.kill();
  process.exit(1);
});
