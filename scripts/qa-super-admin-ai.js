#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const Database = require('better-sqlite3');

const ROOT = path.resolve(__dirname, '..');
const APP_PORT = 4391;
const FAKE_AI_PORT = 4392;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createClient() {
  let cookie = '';
  return async function request(pathname, options = {}) {
    const headers = Object.assign({}, options.headers || {});
    if (cookie) headers.Cookie = cookie;
    if (options.json) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.json);
    }
    const response = await fetch(`http://127.0.0.1:${APP_PORT}${pathname}`, Object.assign({}, options, { headers }));
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const text = await response.text();
    let body = text;
    try { body = text ? JSON.parse(text) : null; } catch (error) {}
    return { response, body, text };
  };
}

function startFakeAiServer() {
  let includeUsage = true;
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      const isResponses = req.url === '/responses';
      const payload = isResponses
        ? { output_text: 'QA fake AI answer for token accounting.' }
        : { choices: [{ message: { content: 'QA fake AI answer for token accounting.' } }] };
      if (includeUsage) {
        payload.usage = isResponses
          ? { input_tokens: 31, output_tokens: 13, total_tokens: 44 }
          : { prompt_tokens: 31, completion_tokens: 13, total_tokens: 44 };
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    });
  });
  return new Promise((resolve) => {
    server.listen(FAKE_AI_PORT, '127.0.0.1', () => {
      resolve({
        server,
        setIncludeUsage(value) {
          includeUsage = Boolean(value);
        }
      });
    });
  });
}

async function waitForApp(child) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) {
      throw new Error(`App exited early with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${APP_PORT}/`);
      if (response.status < 500) return;
    } catch (error) {}
    await sleep(250);
  }
  throw new Error('Timed out waiting for app server.');
}

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'super-admin-ai-qa-'));
  const dbPath = path.join(tempDir, 'qa.db');
  const settingsPath = path.join(tempDir, 'settings.json');
  const fakeAi = await startFakeAiServer();
  const child = spawn(process.execPath, ['server/app.js'], {
    cwd: ROOT,
    env: Object.assign({}, process.env, {
      NODE_ENV: 'development',
      CHAT_PLATFORM_PORT: String(APP_PORT),
      CHAT_PLATFORM_HOST: '127.0.0.1',
      CHAT_PLATFORM_DB_PATH: dbPath,
      CHAT_PLATFORM_SITE_SETTINGS_PATH: settingsPath,
      CHAT_PLATFORM_LEGACY_BASIC_AUTH_FALLBACK: 'false',
      CHAT_PLATFORM_SESSION_SECRET: 'qa-session-secret',
      CHAT_PLATFORM_OPENAI_API_KEY: 'qa-openai-secret',
      CHAT_PLATFORM_OPENAI_BASE_URL: `http://127.0.0.1:${FAKE_AI_PORT}`,
      SUPER_ADMIN_EMAILS: 'super@example.com'
    }),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let logs = '';
  child.stdout.on('data', (chunk) => { logs += chunk.toString(); });
  child.stderr.on('data', (chunk) => { logs += chunk.toString(); });

  try {
    await waitForApp(child);

    const superClient = createClient();
    const customerClient = createClient();

    await superClient('/api/auth/signup', {
      method: 'POST',
      json: { name: 'Super Admin', email: 'super@example.com', password: 'password123', workspaceName: 'Super Workspace' }
    });
    const superLogin = await superClient('/api/auth/login', {
      method: 'POST',
      json: { email: 'super@example.com', password: 'password123' }
    });
    assert(superLogin.body.user.isSuperAdmin === true, 'SUPER_ADMIN_EMAILS did not promote user on login.');

    const customerSignup = await customerClient('/api/auth/signup', {
      method: 'POST',
      json: { name: 'Customer', email: 'customer@example.com', password: 'password123', workspaceName: 'Customer Workspace' }
    });
    const workspaceId = customerSignup.body.activeWorkspaceId;
    assert(workspaceId, 'Customer workspace was not created.');

    const customerForbidden = await customerClient('/api/super-admin/overview');
    assert(customerForbidden.response.status === 403, 'Normal customer can access /api/super-admin/overview.');
    const customerForbiddenWorkspaces = await customerClient('/api/super-admin/workspaces');
    assert(customerForbiddenWorkspaces.response.status === 403, 'Normal customer can access /api/super-admin/workspaces.');

    const customerForbiddenHtml = await customerClient('/super-admin', { headers: { Accept: 'text/html' } });
    assert(customerForbiddenHtml.response.status === 403, 'Normal customer can access /super-admin.');

    const siteCreate = await customerClient('/api/admin/sites', {
      method: 'POST',
      json: { name: 'QA Site', domain: 'qa.local' }
    });
    assert(siteCreate.response.status === 201, 'Customer site create failed.');
    const siteId = siteCreate.body.site.siteId;

    await superClient(`/api/super-admin/workspaces/${encodeURIComponent(workspaceId)}/change-plan`, {
      method: 'POST',
      json: { plan: 'pro' }
    });

    const settingsPayload = await customerClient(`/api/admin/sites/${encodeURIComponent(siteId)}/settings`);
    const settings = settingsPayload.body.settings;
    settings.aiAssistant = Object.assign({}, settings.aiAssistant || {}, {
      enabled: true,
      provider: 'openai',
      model: 'qa-model',
      maxReplyLength: 500,
      companyDescription: 'QA token accounting site.'
    });
    await customerClient(`/api/admin/sites/${encodeURIComponent(siteId)}/settings`, {
      method: 'POST',
      json: settings
    });

    const integrations = await customerClient('/api/admin/integrations');
    const integrationRaw = JSON.stringify(integrations.body);
    assert(!integrationRaw.includes('openai_api_key'), 'Customer integrations include OpenAI key field.');
    assert(!integrationRaw.includes('qa-openai-secret'), 'Customer integrations expose raw OpenAI secret.');

    const settingsHtml = await customerClient('/settings', { headers: { Accept: 'text/html' } });
    assert(!settingsHtml.text.includes('AI Providers'), 'Customer settings HTML contains AI Providers block.');
    assert(!settingsHtml.text.includes('OPENAI_API_KEY'), 'Customer settings HTML contains OPENAI_API_KEY.');

    const providers = await superClient('/api/super-admin/ai-providers');
    const providerRaw = JSON.stringify(providers.body);
    assert(providers.body.openaiApiKey && providers.body.openaiApiKey.configured === true, 'Super Admin provider status does not show configured state.');
    assert(!providerRaw.includes('qa-openai-secret'), 'Super Admin provider endpoint exposes raw secret.');

    const beforeUsage = await customerClient('/api/admin/ai-usage');
    const conversation = await customerClient('/api/conversations', {
      method: 'POST',
      json: { siteId, visitorId: 'visitor-token-1', sourcePage: '/', language: 'en' }
    });
    const conversationId = conversation.body.conversation.conversationId;
    await customerClient('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        conversationId,
        visitorId: 'visitor-token-1',
        siteId,
        text: 'Write one friendly sentence about dashboards.'
      }).toString()
    });
    const afterUsage = await customerClient('/api/admin/ai-usage');
    assert(afterUsage.body.usedTokensCurrentPeriod > beforeUsage.body.usedTokensCurrentPeriod, 'Used tokens did not increment after AI answer.');
    assert(afterUsage.body.remainingTokens < beforeUsage.body.remainingTokens, 'Remaining tokens did not decrease after AI answer.');

    fakeAi.setIncludeUsage(false);
    const beforeMissingUsage = afterUsage.body.usedTokensCurrentPeriod;
    const conversation2 = await customerClient('/api/conversations', {
      method: 'POST',
      json: { siteId, visitorId: 'visitor-token-2', sourcePage: '/', language: 'en' }
    });
    await customerClient('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        conversationId: conversation2.body.conversation.conversationId,
        visitorId: 'visitor-token-2',
        siteId,
        text: 'Write another friendly sentence about onboarding.'
      }).toString()
    });
    const afterMissingUsage = await customerClient('/api/admin/ai-usage');
    assert(afterMissingUsage.body.usedTokensCurrentPeriod > beforeMissingUsage, 'Fallback token estimation did not increment usage.');

    const db = new Database(dbPath);
    const usageRows = db.prepare('SELECT COUNT(*) AS count FROM workspace_ai_usage WHERE workspace_id = ?').get(workspaceId).count;
    assert(usageRows >= 2, 'workspace_ai_usage did not receive expected rows.');

    await superClient(`/api/super-admin/workspaces/${encodeURIComponent(workspaceId)}/add-tokens`, {
      method: 'POST',
      json: { amount: 1234, reason: 'QA credit' }
    });
    const audit = await superClient('/api/super-admin/audit-log');
    assert(audit.body.some((entry) => entry.action === 'add_tokens' && entry.workspaceId === workspaceId), 'Add tokens audit log entry missing.');

    await superClient(`/api/super-admin/workspaces/${encodeURIComponent(workspaceId)}/change-plan`, {
      method: 'POST',
      json: { plan: 'business' }
    });
    const businessUsage = await customerClient('/api/admin/ai-usage');
    assert(businessUsage.body.includedTokensMonthly === 2000000, 'Change plan did not update included token limit.');

    db.prepare(`
      UPDATE workspace_ai_balances
      SET used_tokens_current_period = included_tokens_monthly + purchased_tokens
      WHERE workspace_id = ?
    `).run(workspaceId);
    const rowsBeforeLimit = db.prepare('SELECT COUNT(*) AS count FROM workspace_ai_usage WHERE workspace_id = ?').get(workspaceId).count;
    const conversation3 = await customerClient('/api/conversations', {
      method: 'POST',
      json: { siteId, visitorId: 'visitor-token-3', sourcePage: '/', language: 'en' }
    });
    const limitResponse = await customerClient('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        conversationId: conversation3.body.conversation.conversationId,
        visitorId: 'visitor-token-3',
        siteId,
        text: 'Write a final friendly sentence about customer support.'
      }).toString()
    });
    const rowsAfterLimit = db.prepare('SELECT COUNT(*) AS count FROM workspace_ai_usage WHERE workspace_id = ?').get(workspaceId).count;
    assert(rowsAfterLimit === rowsBeforeLimit, 'AI usage row was created even though token limit was reached.');
    assert(limitResponse.body.conversation.status === 'waiting_operator', 'Token limit did not fall back to operator handoff.');

    await superClient(`/api/super-admin/workspaces/${encodeURIComponent(workspaceId)}/disable-ai`, {
      method: 'POST',
      json: { disabled: true, reason: 'QA disable' }
    });
    const disabledUsage = await customerClient('/api/admin/ai-usage');
    assert(disabledUsage.body.aiEnabled === false, 'Disable AI did not mark customer AI usage as disabled.');
    db.close();

    console.log('Super Admin + AI token QA passed.');
  } finally {
    child.kill('SIGTERM');
    fakeAi.server.close();
    await sleep(250);
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (child.exitCode && child.exitCode !== 0 && logs) {
      console.error(logs);
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
