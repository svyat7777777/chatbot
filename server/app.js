require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const express = require('express');
const multer = require('multer');
const { createDatabase } = require('./db/database');
const { ChatService } = require('./services/chat-service');
const {
  getSiteConfig,
  getEditableSiteSettings,
  saveSiteSettings,
  listSiteConfigs,
  listEditableSiteSettings,
  DEFAULT_ALLOWED_FILE_TYPES,
  DEFAULT_MAX_UPLOAD_SIZE
} = require('./config/sites');

const NODE_ENV = String(process.env.NODE_ENV || 'development').trim().toLowerCase();
const IS_PRODUCTION = NODE_ENV === 'production';
const PORT = Number(process.env.CHAT_PLATFORM_PORT || process.env.PORT || 4100);
const HOST = String(process.env.CHAT_PLATFORM_HOST || '0.0.0.0').trim();
const PUBLIC_BASE_URL = String(
  process.env.CHAT_PLATFORM_BASE_URL ||
  process.env.CHAT_PLATFORM_PUBLIC_BASE_URL ||
  `http://localhost:${PORT}`
).replace(/\/+$/, '');
const DB_PATH = process.env.CHAT_PLATFORM_DB_PATH || path.join(__dirname, '..', 'data', 'chat-platform.db');
const TEMP_UPLOAD_DIR = process.env.CHAT_PLATFORM_TEMP_UPLOAD_DIR || path.join(__dirname, '..', 'tmp');
const UPLOADS_ROOT = process.env.CHAT_PLATFORM_UPLOADS_ROOT || path.join(__dirname, '..', 'uploads');
const ALLOWED_ORIGINS = String(process.env.CHAT_PLATFORM_ALLOWED_ORIGINS || '*')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const INBOX_ADMIN_USERNAME = String(process.env.INBOX_ADMIN_USERNAME || '').trim();
const INBOX_ADMIN_PASSWORD = String(process.env.INBOX_ADMIN_PASSWORD || '').trim();

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ''));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function ensureRuntimeConfig() {
  const errors = [];
  const warnings = [];

  if (!Number.isInteger(PORT) || PORT <= 0 || PORT > 65535) {
    errors.push('CHAT_PLATFORM_PORT (or PORT) must be a valid TCP port.');
  }

  if (!HOST) {
    errors.push('CHAT_PLATFORM_HOST must not be empty.');
  }

  if (!isValidHttpUrl(PUBLIC_BASE_URL)) {
    errors.push('CHAT_PLATFORM_BASE_URL must be a valid absolute http(s) URL.');
  }

  if (!ALLOWED_ORIGINS.length) {
    errors.push('CHAT_PLATFORM_ALLOWED_ORIGINS must contain at least one origin or "*".');
  }

  if (IS_PRODUCTION && (ALLOWED_ORIGINS.includes('*') || !ALLOWED_ORIGINS.length)) {
    errors.push('In production, CHAT_PLATFORM_ALLOWED_ORIGINS must list explicit website origins and cannot be "*".');
  }

  if (IS_PRODUCTION && (!INBOX_ADMIN_USERNAME || !INBOX_ADMIN_PASSWORD)) {
    warnings.push('INBOX_ADMIN_USERNAME / INBOX_ADMIN_PASSWORD are not set. /inbox will stay unavailable.');
  }

  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }

  if (errors.length) {
    throw new Error(errors.join(' '));
  }

  for (const warning of warnings) {
    console.warn('[chat-platform]', warning);
  }
}

ensureRuntimeConfig();

fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_ROOT, { recursive: true });

const db = createDatabase(DB_PATH);
const chatService = new ChatService({
  db,
  uploadsDir: path.join(UPLOADS_ROOT, 'chat', 'default'),
  publicUploadsBase: '/uploads/chat',
  publicBaseUrl: PUBLIC_BASE_URL,
  botToken: process.env.CHAT_TELEGRAM_BOT_TOKEN || '',
  operatorChatIds: process.env.CHAT_TELEGRAM_OPERATOR_CHAT_IDS || '',
  telegramWebhookSecret: process.env.CHAT_TELEGRAM_WEBHOOK_SECRET || '',
  siteConfigProvider: getSiteConfig,
  siteConfigsProvider: listSiteConfigs
});

const app = express();
app.set('trust proxy', true);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes('*')) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

app.use((req, res, next) => {
  const origin = String(req.headers.origin || '').trim();
  if (isAllowedOrigin(origin)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Accept');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_ROOT, {
  fallthrough: false,
  maxAge: IS_PRODUCTION ? '1d' : 0
}));
app.get('/widget.js', (req, res) => {
  if (IS_PRODUCTION) {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  res.type('application/javascript').sendFile(path.join(__dirname, '..', 'widget', 'widget.js'));
});
app.get('/widget.css', (req, res) => {
  if (IS_PRODUCTION) {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  res.type('text/css').sendFile(path.join(__dirname, '..', 'widget', 'widget.css'));
});

function normalizeAllowedExtensions(siteConfig) {
  const list = Array.isArray(siteConfig?.allowedFileTypes) && siteConfig.allowedFileTypes.length
    ? siteConfig.allowedFileTypes
    : DEFAULT_ALLOWED_FILE_TYPES;
  return list.map((item) => {
    const normalized = String(item || '').trim().toLowerCase();
    return normalized.startsWith('.') ? normalized : `.${normalized}`;
  });
}

function getUploadDir(siteId) {
  const siteConfig = getSiteConfig(siteId);
  const targetDir = siteConfig?.uploadsPath || path.join(UPLOADS_ROOT, 'chat', siteId || 'default');
  fs.mkdirSync(targetDir, { recursive: true });
  return targetDir;
}

function buildUploadMulter() {
  return multer({
    dest: TEMP_UPLOAD_DIR,
    limits: {
      files: 5,
      fileSize: DEFAULT_MAX_UPLOAD_SIZE
    }
  });
}

const chatUpload = buildUploadMulter();

function resolveSiteConfig(siteId) {
  const cleanSiteId = String(siteId || '').trim();
  return cleanSiteId ? getSiteConfig(cleanSiteId) : null;
}

function resolveConversationSite(conversationId) {
  const conversation = chatService.getConversationById(conversationId);
  if (!conversation) {
    return { conversation: null, siteConfig: null };
  }

  return {
    conversation,
    siteConfig: resolveSiteConfig(conversation.siteId)
  };
}

function assertConversationSiteMatch(conversation, siteId) {
  const cleanSiteId = String(siteId || '').trim();
  if (!cleanSiteId) return true;
  return Boolean(conversation && conversation.siteId === cleanSiteId);
}

function validateChatFiles(files, siteConfig) {
  const allowedExtensions = normalizeAllowedExtensions(siteConfig);
  const maxUploadSize = Number(siteConfig?.maxUploadSize || DEFAULT_MAX_UPLOAD_SIZE);

  for (const file of files) {
    const lowerName = String(file.originalname || '').toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => lowerName.endsWith(ext));
    if (!isAllowed) {
      const error = new Error('INVALID_CHAT_FILE');
      error.code = 'INVALID_CHAT_FILE';
      throw error;
    }
    if (Number(file.size) > maxUploadSize) {
      const error = new Error('LIMIT_FILE_SIZE');
      error.code = 'LIMIT_FILE_SIZE';
      throw error;
    }
  }
}

function attachUploadStore(siteId) {
  const uploadDir = getUploadDir(siteId);
  chatService.uploadsDir = uploadDir;
  chatService.publicUploadsBase = `/uploads/chat/${siteId}`;
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function hasInboxAuthConfig() {
  return Boolean(INBOX_ADMIN_USERNAME && INBOX_ADMIN_PASSWORD);
}

function parseBasicAuth(headerValue) {
  const header = String(headerValue || '').trim();
  if (!header.toLowerCase().startsWith('basic ')) {
    return null;
  }

  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch (error) {
    return null;
  }
}

function requireInboxAuth(req, res, next) {
  if (!hasInboxAuthConfig()) {
    return res.status(503).json({
      ok: false,
      message: 'Inbox auth is not configured. Set INBOX_ADMIN_USERNAME and INBOX_ADMIN_PASSWORD.'
    });
  }

  const credentials = parseBasicAuth(req.headers.authorization);
  const isAuthorized = Boolean(
    credentials &&
    safeEqual(credentials.username, INBOX_ADMIN_USERNAME) &&
    safeEqual(credentials.password, INBOX_ADMIN_PASSWORD)
  );

  if (isAuthorized) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Chat Inbox", charset="UTF-8"');
  return res.status(401).json({ ok: false, message: 'Authentication required.' });
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/widget-config/:siteId', (req, res) => {
  const siteId = String(req.params.siteId || '').trim();
  const config = resolveSiteConfig(siteId);
  if (!config) {
    return res.status(404).json({ ok: false, message: 'Site config not found.' });
  }

  return res.json({
    ok: true,
    config: {
      siteId: config.siteId,
      title: config.title,
      avatarUrl: config.avatarUrl,
      botMetaLabel: config.botMetaLabel,
      welcomeIntroLabel: config.welcomeIntroLabel,
      operatorMetaLabel: config.operatorMetaLabel,
      onlineStatusText: config.onlineStatusText,
      welcomeMessage: config.welcomeMessage,
      placeholder: config.placeholder,
      launcherTitle: config.launcherTitle,
      launcherSubtitle: config.launcherSubtitle,
      avatarUrl: config.avatarUrl,
      quickActions: config.quickActions,
      allowedFileTypes: config.allowedFileTypes,
      maxUploadSize: config.maxUploadSize,
      fileHint: config.fileHint,
      aiEnabled: config.aiEnabled,
      theme: config.theme,
      statusLabels: config.statusLabels,
      flowTextOverrides: config.flowTextOverrides || {},
      telegram: config.telegram || {}
    }
  });
});

app.post('/api/conversations', (req, res) => {
  try {
    const siteId = String(req.body?.siteId || '').trim();
    const siteConfig = resolveSiteConfig(siteId);
    if (!siteConfig) {
      return res.status(404).json({ ok: false, message: 'Site config not found.' });
    }

    const visitorId = String(req.body?.visitorId || '').trim() || chatService.createVisitorId();
    const payload = chatService.getOrCreateConversation({
      siteId,
      visitorId,
      sourcePage: String(req.body?.sourcePage || '/').trim() || '/',
      language: String(req.body?.language || 'uk').trim() || 'uk'
    });

    return res.json({
      ok: true,
      visitorId,
      conversation: payload.conversation,
      messages: payload.messages
    });
  } catch (error) {
    console.error('Failed to create conversation', error);
    return res.status(500).json({ ok: false, message: 'Failed to create conversation.' });
  }
});

app.get('/api/conversations/:conversationId/messages', (req, res) => {
  try {
    const visitorId = String(req.query.visitorId || '').trim();
    const conversationId = String(req.params.conversationId || '').trim();
    const requestedSiteId = String(req.query.siteId || '').trim();
    const conversation = chatService.getConversationForVisitor(conversationId, visitorId);
    if (!conversation) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }
    if (!assertConversationSiteMatch(conversation, requestedSiteId)) {
      return res.status(409).json({ ok: false, message: 'Conversation/site mismatch.' });
    }
    return res.json({
      ok: true,
      conversation,
      messages: chatService.getMessages(conversationId)
    });
  } catch (error) {
    console.error('Failed to load conversation history', error);
    return res.status(500).json({ ok: false, message: 'Failed to load conversation history.' });
  }
});

app.get('/api/conversations/:conversationId/stream', (req, res) => {
  const visitorId = String(req.query.visitorId || '').trim();
  const conversationId = String(req.params.conversationId || '').trim();
  const requestedSiteId = String(req.query.siteId || '').trim();
  const conversation = chatService.getConversationForVisitor(conversationId, visitorId);
  if (!conversation) {
    return res.status(404).json({ ok: false, message: 'Conversation not found.' });
  }
  if (!assertConversationSiteMatch(conversation, requestedSiteId)) {
    return res.status(409).json({ ok: false, message: 'Conversation/site mismatch.' });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true, conversationId })}\n\n`);

  chatService.addSseClient(conversationId, res);
  const keepAlive = setInterval(() => {
    res.write('event: ping\ndata: {}\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    chatService.removeSseClient(conversationId, res);
  });
});

app.post('/api/messages', chatUpload.array('files', 5), async (req, res) => {
  try {
    const conversationId = String(req.body?.conversationId || '').trim();
    const visitorId = String(req.body?.visitorId || '').trim();
    const siteId = String(req.body?.siteId || '').trim();
    const { conversation, siteConfig: conversationSiteConfig } = resolveConversationSite(conversationId);
    const siteConfig = resolveSiteConfig(siteId) || conversationSiteConfig;
    if (!siteConfig) {
      return res.status(404).json({ ok: false, message: 'Site config not found.' });
    }
    if (!conversation) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }
    if (!assertConversationSiteMatch(conversation, siteId || siteConfig.siteId)) {
      return res.status(409).json({ ok: false, message: 'Conversation/site mismatch.' });
    }

    validateChatFiles(Array.isArray(req.files) ? req.files : [], siteConfig);
    attachUploadStore(conversation.siteId);

    const payload = await chatService.handleVisitorMessage({
      conversationId,
      visitorId,
      text: String(req.body?.text || '').trim(),
      files: Array.isArray(req.files) ? req.files : [],
      sourcePage: String(req.body?.sourcePage || '').trim(),
      clientContext: req.body?.clientContext
    });

    return res.json({
      ok: true,
      conversation: payload.conversation,
      messages: payload.messages
    });
  } catch (error) {
    console.error('Failed to post message', error);
    if (error.message === 'CONVERSATION_NOT_FOUND') {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }
    if (error.message === 'EMPTY_MESSAGE') {
      return res.status(400).json({ ok: false, message: 'Write a message or attach a file.' });
    }
    if (error.message === 'RATE_LIMIT') {
      return res.status(429).json({ ok: false, message: 'Too many messages. Try again later.' });
    }
    if (error.code === 'LIMIT_FILE_SIZE' || error.message === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ ok: false, message: 'File is too large. Max size is 20 MB.' });
    }
    if (error.code === 'INVALID_CHAT_FILE' || error.message === 'INVALID_CHAT_FILE') {
      return res.status(400).json({ ok: false, message: 'Allowed file types: STL, 3MF, OBJ, ZIP, JPG, PNG, PDF.' });
    }
    return res.status(500).json({ ok: false, message: 'Failed to send message.' });
  }
});

app.post('/api/uploads', chatUpload.array('files', 5), (req, res) => {
  try {
    const siteId = String(req.body?.siteId || '').trim();
    const siteConfig = resolveSiteConfig(siteId);
    if (!siteConfig) {
      return res.status(404).json({ ok: false, message: 'Site config not found.' });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    validateChatFiles(files, siteConfig);
    attachUploadStore(siteConfig.siteId);

    const uploadedFiles = files.map((file) => chatService.storeUpload(file));
    return res.json({ ok: true, siteId: siteConfig.siteId, files: uploadedFiles });
  } catch (error) {
    console.error('Failed to upload files', error);
    if (error.code === 'LIMIT_FILE_SIZE' || error.message === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ ok: false, message: 'File is too large. Max size is 20 MB.' });
    }
    if (error.code === 'INVALID_CHAT_FILE' || error.message === 'INVALID_CHAT_FILE') {
      return res.status(400).json({ ok: false, message: 'Allowed file types: STL, 3MF, OBJ, ZIP, JPG, PNG, PDF.' });
    }
    return res.status(500).json({ ok: false, message: 'Failed to upload files.' });
  }
});

app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const expectedSecret = String(process.env.CHAT_TELEGRAM_WEBHOOK_SECRET || '').trim();
    const secretHeader = String(req.headers['x-telegram-bot-api-secret-token'] || '').trim();
    if (expectedSecret && secretHeader !== expectedSecret) {
      return res.status(403).json({ ok: false });
    }

    await chatService.handleTelegramUpdate(req.body || {});
    return res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook handling failed', error);
    return res.status(500).json({ ok: false });
  }
});

app.use('/api/inbox', requireInboxAuth);
app.use('/api/admin', requireInboxAuth);
app.use('/inbox', requireInboxAuth);
app.use('/settings', requireInboxAuth);

app.get('/api/admin/sites', (req, res) => {
  try {
    const sites = listEditableSiteSettings();
    return res.json({ ok: true, sites });
  } catch (error) {
    console.error('Failed to load site settings list', error);
    return res.status(500).json({ ok: false, message: 'Failed to load site settings.' });
  }
});

app.get('/api/admin/sites/:siteId/settings', (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    const settings = getEditableSiteSettings(siteId);
    if (!settings) {
      return res.status(404).json({ ok: false, message: 'Site settings not found.' });
    }
    return res.json({ ok: true, settings });
  } catch (error) {
    console.error('Failed to load site settings', error);
    return res.status(500).json({ ok: false, message: 'Failed to load site settings.' });
  }
});

app.post('/api/admin/sites/:siteId/settings', (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    const settings = saveSiteSettings(siteId, req.body || {});
    if (!settings) {
      return res.status(404).json({ ok: false, message: 'Site settings not found.' });
    }
    return res.json({ ok: true, settings });
  } catch (error) {
    console.error('Failed to save site settings', error);
    return res.status(500).json({ ok: false, message: 'Failed to save site settings.' });
  }
});

app.get('/api/inbox/conversations', (req, res) => {
  try {
    const status = String(req.query.status || 'open').trim();
    const search = String(req.query.q || '').trim();
    const siteId = String(req.query.siteId || '').trim();
    const conversations = chatService.listInboxConversations({
      status,
      siteId,
      search,
      limit: Number(req.query.limit) || 200
    });
    return res.json({ ok: true, conversations });
  } catch (error) {
    console.error('Failed to list inbox conversations', error);
    return res.status(500).json({ ok: false, message: 'Failed to load conversations.' });
  }
});

app.get('/api/inbox/conversations/:conversationId', (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || '').trim();
    const payload = chatService.getConversationWithMessages(conversationId);
    if (!payload) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }
    const requestedSiteId = String(req.query.siteId || '').trim();
    if (!assertConversationSiteMatch(payload.conversation, requestedSiteId)) {
      return res.status(409).json({ ok: false, message: 'Conversation/site mismatch.' });
    }
    return res.json({
      ok: true,
      conversation: payload.conversation,
      messages: payload.messages
    });
  } catch (error) {
    console.error('Failed to load inbox conversation', error);
    return res.status(500).json({ ok: false, message: 'Failed to load conversation.' });
  }
});

app.post('/api/inbox/conversations/:conversationId/reply', (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || '').trim();
    const text = String(req.body?.text || '').trim();
    const operatorName = String(req.body?.operatorName || 'Operator').trim();
    if (!text) {
      return res.status(400).json({ ok: false, message: 'Reply text is required.' });
    }

    const payload = chatService.addInboxReply(conversationId, text, operatorName);
    if (!payload) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }

    return res.json({
      ok: true,
      conversation: payload.conversation,
      message: payload.message,
      messages: payload.messages
    });
  } catch (error) {
    console.error('Failed to send inbox reply', error);
    return res.status(500).json({ ok: false, message: 'Failed to send reply.' });
  }
});

app.post('/api/inbox/conversations/:conversationId/status', (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || '').trim();
    const status = String(req.body?.status || '').trim().toLowerCase();
    const operatorName = String(req.body?.operatorName || 'Operator').trim();
    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({ ok: false, message: 'Invalid status.' });
    }

    const conversation = chatService.setInboxStatus(conversationId, status, operatorName);
    if (!conversation) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }

    return res.json({ ok: true, conversation });
  } catch (error) {
    console.error('Failed to update inbox status', error);
    return res.status(500).json({ ok: false, message: 'Failed to update status.' });
  }
});

app.get('/settings', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chat Settings</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f6fb;
        --panel: #ffffff;
        --panel-soft: #f8faff;
        --border: #dbe2f0;
        --text: #1b2437;
        --muted: #67718a;
        --accent: #1f6fff;
        --accent-soft: #e9f1ff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      .layout {
        display: grid;
        grid-template-columns: 260px minmax(0, 860px);
        gap: 18px;
        max-width: 1180px;
        margin: 0 auto;
        padding: 18px;
        align-items: start;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: 0 10px 30px rgba(26, 35, 57, 0.05);
      }
      .sidebar {
        overflow: hidden;
      }
      .sidebar-head, .content-head {
        padding: 16px;
        border-bottom: 1px solid var(--border);
      }
      .sidebar-head h1, .content-head h2 {
        margin: 0;
        font-size: 18px;
      }
      .nav-row {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .nav-row a {
        text-decoration: none;
        color: var(--muted);
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 600;
      }
      .nav-row a.active {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: rgba(31, 111, 255, 0.18);
      }
      .site-list {
        display: grid;
        gap: 8px;
        padding: 12px;
      }
      .site-item {
        width: 100%;
        border: 1px solid var(--border);
        background: #fff;
        border-radius: 14px;
        text-align: left;
        padding: 12px;
        cursor: pointer;
      }
      .site-item.active {
        border-color: rgba(31, 111, 255, 0.18);
        background: var(--accent-soft);
      }
      .site-item strong {
        display: block;
        font-size: 14px;
      }
      .site-item span {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 12px;
      }
      .content {
        overflow: hidden;
      }
      .content-head p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 13px;
      }
      .form {
        padding: 18px;
        display: grid;
        gap: 18px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .field {
        display: grid;
        gap: 6px;
      }
      .field.full {
        grid-column: 1 / -1;
      }
      label {
        font-size: 12px;
        font-weight: 700;
        color: var(--muted);
      }
      input, textarea {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 10px 12px;
        font: inherit;
        background: #fff;
      }
      textarea {
        resize: vertical;
        min-height: 110px;
      }
      .section {
        display: grid;
        gap: 12px;
      }
      .section h3 {
        margin: 0;
        font-size: 14px;
      }
      .quick-actions {
        display: grid;
        gap: 10px;
      }
      .quick-action-row {
        display: grid;
        grid-template-columns: 80px 1fr 160px auto;
        gap: 10px;
        align-items: center;
        padding: 10px;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: var(--panel-soft);
      }
      .quick-action-row button,
      .actions button {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        font: inherit;
        cursor: pointer;
      }
      .actions {
        display: flex;
        gap: 10px;
        justify-content: space-between;
        align-items: center;
      }
      .actions .left {
        display: flex;
        gap: 10px;
      }
      .primary {
        background: var(--accent);
        color: #fff;
      }
      .secondary {
        background: #eef3ff;
        color: #3550a8;
      }
      .danger {
        background: #fff1f1;
        color: #b44d4d;
      }
      .status-line {
        font-size: 13px;
        color: var(--muted);
      }
      .status-line.success {
        color: #1d7c4d;
      }
      @media (max-width: 980px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .grid {
          grid-template-columns: 1fr;
        }
        .quick-action-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <aside class="panel sidebar">
        <div class="sidebar-head">
          <h1>Chat Settings</h1>
          <div class="nav-row">
            <a href="/inbox">Inbox</a>
            <a href="/settings" class="active">Settings</a>
          </div>
        </div>
        <div id="siteList" class="site-list"></div>
      </aside>
      <main class="panel content">
        <div class="content-head">
          <h2 id="siteTitle">Оберіть сайт</h2>
          <p>Редагуйте публічні налаштування віджета для кожного siteId без змін у коді.</p>
        </div>
        <form id="settingsForm" class="form">
          <div class="grid">
            <div class="field">
              <label for="titleInput">Bot title</label>
              <input id="titleInput" type="text" />
            </div>
            <div class="field">
              <label for="welcomeIntroLabelInput">Welcome intro label</label>
              <input id="welcomeIntroLabelInput" type="text" />
            </div>
            <div class="field full">
              <label for="avatarUrlInput">Avatar URL</label>
              <input id="avatarUrlInput" type="url" placeholder="https://..." />
            </div>
            <div class="field full">
              <label for="welcomeMessageInput">Welcome message</label>
              <textarea id="welcomeMessageInput"></textarea>
            </div>
            <div class="field">
              <label for="onlineStatusTextInput">Online status text</label>
              <input id="onlineStatusTextInput" type="text" />
            </div>
            <div class="field">
              <label for="primaryColorInput">Primary color</label>
              <input id="primaryColorInput" type="text" placeholder="#f78c2f" />
            </div>
            <div class="field">
              <label for="headerBgInput">Header background</label>
              <input id="headerBgInput" type="text" placeholder="#131926" />
            </div>
            <div class="field">
              <label for="bubbleBgInput">Bubble background</label>
              <input id="bubbleBgInput" type="text" placeholder="#ffffff" />
            </div>
            <div class="field">
              <label for="textColorInput">Text color</label>
              <input id="textColorInput" type="text" placeholder="#1f2734" />
            </div>
          </div>

          <section class="section">
            <h3>Quick actions</h3>
            <div id="quickActionsList" class="quick-actions"></div>
            <div class="actions">
              <div class="left">
                <button id="addQuickActionBtn" type="button" class="secondary">Додати кнопку</button>
              </div>
              <div id="saveStatus" class="status-line">Зміни ще не збережені.</div>
            </div>
          </section>

          <div class="actions">
            <div class="left">
              <button id="saveBtn" type="submit" class="primary">Зберегти</button>
            </div>
          </div>
        </form>
      </main>
    </div>
    <script>
      (function () {
        const state = {
          sites: [],
          selectedSiteId: '',
          currentSettings: null
        };

        const siteListEl = document.getElementById('siteList');
        const siteTitleEl = document.getElementById('siteTitle');
        const settingsForm = document.getElementById('settingsForm');
        const saveStatusEl = document.getElementById('saveStatus');
        const quickActionsListEl = document.getElementById('quickActionsList');
        const addQuickActionBtn = document.getElementById('addQuickActionBtn');
        const fields = {
          title: document.getElementById('titleInput'),
          avatarUrl: document.getElementById('avatarUrlInput'),
          welcomeMessage: document.getElementById('welcomeMessageInput'),
          welcomeIntroLabel: document.getElementById('welcomeIntroLabelInput'),
          onlineStatusText: document.getElementById('onlineStatusTextInput'),
          primary: document.getElementById('primaryColorInput'),
          headerBg: document.getElementById('headerBgInput'),
          bubbleBg: document.getElementById('bubbleBgInput'),
          textColor: document.getElementById('textColorInput')
        };

        function escapeHtml(value) {
          return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        async function fetchJson(url, options) {
          const response = await fetch(url, options);
          const payload = await response.json();
          if (!response.ok || !payload.ok) {
            throw new Error(payload.message || 'Request failed');
          }
          return payload;
        }

        function renderSiteList() {
          siteListEl.innerHTML = state.sites.map(function (site) {
            return '<button type="button" class="site-item ' + (site.siteId === state.selectedSiteId ? 'active' : '') + '" data-site-id="' + escapeHtml(site.siteId) + '">' +
              '<strong>' + escapeHtml(site.title) + '</strong>' +
              '<span>' + escapeHtml(site.siteId) + '</span>' +
            '</button>';
          }).join('');
        }

        function createQuickActionRow(item) {
          return '<div class="quick-action-row">' +
            '<input type="text" data-qa-field="icon" placeholder="💬" value="' + escapeHtml(item.icon || '') + '" />' +
            '<input type="text" data-qa-field="label" placeholder="Назва кнопки" value="' + escapeHtml(item.label || '') + '" />' +
            '<input type="text" data-qa-field="key" placeholder="price / time / upload / question" value="' + escapeHtml(item.key || '') + '" />' +
            '<button type="button" class="danger" data-remove-quick-action="true">Видалити</button>' +
          '</div>';
        }

        function renderQuickActions(actions) {
          quickActionsListEl.innerHTML = (actions || []).map(createQuickActionRow).join('');
        }

        function fillForm(settings) {
          state.currentSettings = settings;
          siteTitleEl.textContent = settings.title || settings.siteId;
          fields.title.value = settings.title || '';
          fields.avatarUrl.value = settings.avatarUrl || '';
          fields.welcomeMessage.value = settings.welcomeMessage || '';
          fields.welcomeIntroLabel.value = settings.welcomeIntroLabel || '';
          fields.onlineStatusText.value = settings.onlineStatusText || '';
          fields.primary.value = settings.theme?.primary || '';
          fields.headerBg.value = settings.theme?.headerBg || '';
          fields.bubbleBg.value = settings.theme?.bubbleBg || '';
          fields.textColor.value = settings.theme?.textColor || '';
          renderQuickActions(settings.quickActions || []);
          saveStatusEl.textContent = 'Зміни ще не збережені.';
          saveStatusEl.className = 'status-line';
        }

        function collectQuickActions() {
          return Array.from(quickActionsListEl.querySelectorAll('.quick-action-row')).map(function (row) {
            return {
              icon: row.querySelector('[data-qa-field="icon"]').value.trim(),
              label: row.querySelector('[data-qa-field="label"]').value.trim(),
              key: row.querySelector('[data-qa-field="key"]').value.trim()
            };
          });
        }

        async function loadSites() {
          const payload = await fetchJson('/api/admin/sites');
          state.sites = payload.sites || [];
          if (!state.selectedSiteId && state.sites.length) {
            state.selectedSiteId = state.sites[0].siteId;
          }
          renderSiteList();
          if (state.selectedSiteId) {
            await loadSettings(state.selectedSiteId);
          }
        }

        async function loadSettings(siteId) {
          const payload = await fetchJson('/api/admin/sites/' + encodeURIComponent(siteId) + '/settings');
          state.selectedSiteId = siteId;
          renderSiteList();
          fillForm(payload.settings);
        }

        siteListEl.addEventListener('click', function (event) {
          const button = event.target.closest('[data-site-id]');
          if (!button) return;
          loadSettings(button.getAttribute('data-site-id')).catch(console.error);
        });

        addQuickActionBtn.addEventListener('click', function () {
          quickActionsListEl.insertAdjacentHTML('beforeend', createQuickActionRow({ icon: '💬', label: '', key: '' }));
        });

        quickActionsListEl.addEventListener('click', function (event) {
          const button = event.target.closest('[data-remove-quick-action]');
          if (!button) return;
          const row = button.closest('.quick-action-row');
          if (row) row.remove();
        });

        settingsForm.addEventListener('submit', async function (event) {
          event.preventDefault();
          if (!state.selectedSiteId) return;

          const payload = {
            title: fields.title.value.trim(),
            avatarUrl: fields.avatarUrl.value.trim(),
            welcomeMessage: fields.welcomeMessage.value,
            welcomeIntroLabel: fields.welcomeIntroLabel.value.trim(),
            onlineStatusText: fields.onlineStatusText.value.trim(),
            theme: {
              primary: fields.primary.value.trim(),
              headerBg: fields.headerBg.value.trim(),
              bubbleBg: fields.bubbleBg.value.trim(),
              textColor: fields.textColor.value.trim()
            },
            quickActions: collectQuickActions()
          };

          const response = await fetchJson('/api/admin/sites/' + encodeURIComponent(state.selectedSiteId) + '/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          fillForm(response.settings);
          await loadSites();
          saveStatusEl.textContent = 'Збережено.';
          saveStatusEl.className = 'status-line success';
        });

        loadSites().catch(function (error) {
          console.error(error);
          saveStatusEl.textContent = 'Не вдалося завантажити settings.';
        });
      })();
    </script>
  </body>
</html>`);
});

app.get('/inbox', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chat Inbox</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f6fb;
        --panel: #ffffff;
        --border: #dbe2f0;
        --text: #1b2437;
        --muted: #67718a;
        --accent: #1f6fff;
        --accent-soft: #e9f1ff;
        --closed: #f2f4f8;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      .layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 920px);
        min-height: 100vh;
        max-width: 1240px;
        margin: 0 auto;
      }
      .sidebar, .content {
        min-width: 0;
      }
      .sidebar {
        border-right: 1px solid var(--border);
        background: #f8faff;
        display: flex;
        flex-direction: column;
      }
      .sidebar-head, .content-head {
        padding: 14px 16px;
        border-bottom: 1px solid var(--border);
        background: rgba(255,255,255,0.8);
      }
      .sidebar-head h1, .content-head h2 {
        margin: 0;
        font-size: 17px;
      }
      .nav-row {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      .nav-row a {
        text-decoration: none;
        color: var(--muted);
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 600;
      }
      .nav-row a.active {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: rgba(31, 111, 255, 0.18);
      }
      .toolbar {
        display: grid;
        gap: 8px;
        margin-top: 10px;
      }
      .toolbar input, .toolbar select, .reply-box textarea, .reply-box input {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 9px 11px;
        font: inherit;
        background: #fff;
      }
      .conversation-list {
        overflow: auto;
        padding: 10px;
        display: grid;
        gap: 7px;
      }
      .conversation-item {
        border: 1px solid var(--border);
        background: var(--panel);
        border-radius: 12px;
        padding: 10px 11px;
        cursor: pointer;
        text-align: left;
      }
      .conversation-item.active {
        border-color: var(--accent);
        background: linear-gradient(180deg, var(--accent-soft), #f8fbff);
        box-shadow: inset 0 0 0 1px rgba(31, 111, 255, 0.08);
      }
      .conversation-item.closed {
        background: var(--closed);
      }
      .conversation-top, .conversation-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .conversation-id {
        font-size: 12px;
        font-weight: 700;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 20px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.01em;
        background: #edf2ff;
        color: #3450a3;
      }
      .badge.closed {
        background: #eceff5;
        color: #58627c;
      }
      .badge.ai {
        background: #eef9f2;
        color: #2f8558;
      }
      .badge.human {
        background: #fff3e8;
        color: #b96a1a;
      }
      .badge.open {
        background: #eef4ff;
        color: #3450a3;
      }
      .last-message {
        margin: 7px 0 6px;
        font-size: 12px;
        color: var(--muted);
        line-height: 1.35;
      }
      .conversation-meta {
        font-size: 11px;
        color: var(--muted);
      }
      .content {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .messages {
        flex: 1;
        overflow: auto;
        padding: 14px 18px 10px;
        display: grid;
        gap: 10px;
        justify-items: start;
      }
      .message {
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 11px 13px;
        background: var(--panel);
        width: min(100%, 760px);
        box-shadow: 0 4px 14px rgba(26, 35, 57, 0.04);
      }
      .message.operator {
        border-color: #bad2ff;
        background: #edf4ff;
      }
      .message.ai {
        background: #fdfefe;
      }
      .message.visitor {
        background: #fffaf4;
        border-color: rgba(247, 140, 47, 0.16);
      }
      .message.system {
        background: #f7f8fb;
      }
      .message-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 11px;
        color: var(--muted);
        margin-bottom: 7px;
      }
      .message-sender {
        font-weight: 700;
        color: #4c5871;
      }
      .attachments {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .attachments a {
        font-size: 12px;
        color: var(--accent);
        text-decoration: none;
      }
      .reply-box {
        border-top: 1px solid var(--border);
        padding: 14px 16px 16px;
        background: rgba(255,255,255,0.92);
        display: grid;
        gap: 9px;
      }
      .reply-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      button {
        border: 0;
        border-radius: 10px;
        background: var(--accent);
        color: white;
        padding: 9px 12px;
        font: inherit;
        cursor: pointer;
      }
      button.secondary {
        background: #e9eef9;
        color: #33405f;
      }
      .empty-state {
        padding: 24px;
        color: var(--muted);
      }
      @media (max-width: 900px) {
        .layout {
          grid-template-columns: 1fr;
          max-width: none;
        }
        .sidebar {
          min-height: 280px;
          border-right: 0;
          border-bottom: 1px solid var(--border);
        }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-head">
          <h1>Operator Inbox</h1>
          <div class="nav-row">
            <a href="/inbox" class="active">Inbox</a>
            <a href="/settings">Settings</a>
          </div>
          <div class="toolbar">
            <input id="searchInput" type="search" placeholder="Пошук по CID, сайту або тексту" />
            <select id="statusFilter">
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
        <div class="conversation-list" id="conversationList"></div>
      </aside>
      <main class="content">
        <div class="content-head">
          <h2 id="conversationTitle">Оберіть діалог</h2>
          <div id="conversationMeta" class="conversation-meta"></div>
        </div>
        <div class="messages" id="messagesPane">
          <div class="empty-state">Оберіть діалог у списку зліва.</div>
        </div>
        <div class="reply-box">
          <input id="operatorName" type="text" value="Operator" placeholder="Ваше ім'я" />
          <textarea id="replyInput" rows="3" placeholder="Напишіть відповідь оператором..."></textarea>
          <div class="reply-actions">
            <button id="sendReplyBtn" type="button">Надіслати</button>
            <button id="markOpenBtn" type="button" class="secondary">Open</button>
            <button id="markClosedBtn" type="button" class="secondary">Closed</button>
          </div>
        </div>
      </main>
    </div>
    <script>
      (function () {
        const CONVERSATIONS_POLL_MS = 8000;
        const OPEN_CONVERSATION_POLL_MS = 4000;
        const state = {
          conversations: [],
          selectedConversationId: '',
          search: '',
          status: 'open',
          selectedConversation: null,
          selectedMessages: [],
          selectedMessagesSignature: '',
          listPollTimer: null,
          conversationPollTimer: null,
          loadingConversations: false,
          loadingConversation: false
        };

        const conversationList = document.getElementById('conversationList');
        const messagesPane = document.getElementById('messagesPane');
        const conversationTitle = document.getElementById('conversationTitle');
        const conversationMeta = document.getElementById('conversationMeta');
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const operatorNameInput = document.getElementById('operatorName');
        const replyInput = document.getElementById('replyInput');
        const sendReplyBtn = document.getElementById('sendReplyBtn');
        const markOpenBtn = document.getElementById('markOpenBtn');
        const markClosedBtn = document.getElementById('markClosedBtn');

        function formatDate(value) {
          if (!value) return '';
          const date = new Date(String(value).replace(' ', 'T') + 'Z');
          if (Number.isNaN(date.getTime())) return value;
          return date.toLocaleString('uk-UA');
        }

        function escapeHtml(value) {
          return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function nl2br(value) {
          return escapeHtml(value).replace(/\\n/g, '<br />');
        }

        function getStatusTone(status) {
          if (status === 'closed') return 'closed';
          if (status === 'human') return 'human';
          if (status === 'ai') return 'ai';
          return 'open';
        }

        function getStatusLabel(item) {
          if (!item) return 'open';
          if (item.status === 'closed' || item.inboxStatus === 'closed') return 'closed';
          if (item.status === 'human') return 'human';
          if (item.status === 'ai') return 'ai';
          return 'open';
        }

        function renderStatusBadge(item) {
          const label = getStatusLabel(item);
          return '<span class="badge ' + escapeHtml(getStatusTone(label)) + '">' + escapeHtml(label) + '</span>';
        }

        async function fetchJson(url, options) {
          const response = await fetch(url, options);
          const payload = await response.json();
          if (!response.ok || !payload.ok) {
            throw new Error(payload.message || 'Request failed');
          }
          return payload;
        }

        function buildMessagesSignature(messages) {
          return (messages || []).map(function (message) {
            return [
              message.id || '',
              message.senderType || '',
              message.createdAt || '',
              message.text || '',
              Array.isArray(message.attachments)
                ? message.attachments.map(function (file) {
                    return file.id || file.publicUrl || file.fileName || '';
                  }).join(',')
                : ''
            ].join('|');
          }).join('||');
        }

        function isNearBottom(element, threshold) {
          if (!element) return true;
          return (element.scrollHeight - element.scrollTop - element.clientHeight) <= (threshold || 48);
        }

        async function loadConversations(options) {
          const settings = options || {};
          if (state.loadingConversations) return;
          state.loadingConversations = true;
          const previousSelectedConversationId = state.selectedConversationId;
          const params = new URLSearchParams();
          if (state.status) params.set('status', state.status);
          if (state.search) params.set('q', state.search);
          try {
            const payload = await fetchJson('/api/inbox/conversations?' + params.toString());
            state.conversations = payload.conversations || [];

            if (!state.selectedConversationId && state.conversations.length) {
              state.selectedConversationId = state.conversations[0].conversationId;
            }
            if (state.selectedConversationId && !state.conversations.some((item) => item.conversationId === state.selectedConversationId)) {
              state.selectedConversationId = state.conversations[0] ? state.conversations[0].conversationId : '';
            }

            renderConversationList();
            if (previousSelectedConversationId !== state.selectedConversationId) {
              restartConversationPolling();
            }
            if (state.selectedConversationId && settings.reloadSelectedConversation !== false) {
              await loadConversation(state.selectedConversationId, { preserveScroll: true });
            } else if (!state.selectedConversationId) {
              restartConversationPolling();
              renderEmptyConversation();
            }
          } finally {
            state.loadingConversations = false;
          }
        }

        function renderConversationList() {
          if (!state.conversations.length) {
            conversationList.innerHTML = '<div class="empty-state">Немає діалогів.</div>';
            return;
          }

          conversationList.innerHTML = state.conversations.map(function (item) {
            const inboxStatus = item.inboxStatus || (item.status === 'closed' ? 'closed' : 'open');
            return '<button type="button" class="conversation-item ' + (item.conversationId === state.selectedConversationId ? 'active ' : '') + (inboxStatus === 'closed' ? 'closed' : '') + '" data-conversation-id="' + escapeHtml(item.conversationId) + '">' +
              '<div class="conversation-top">' +
                '<span class="conversation-id">' + escapeHtml(item.conversationId) + '</span>' +
                renderStatusBadge(item) +
              '</div>' +
              '<div class="last-message">' + escapeHtml(item.lastMessage || '—') + '</div>' +
              '<div class="conversation-meta"><span>' + escapeHtml(item.siteId || '-') + '</span><span>' + escapeHtml(formatDate(item.lastMessageAt)) + '</span></div>' +
            '</button>';
          }).join('');
        }

        function renderEmptyConversation() {
          state.selectedConversation = null;
          state.selectedMessages = [];
          state.selectedMessagesSignature = '';
          conversationTitle.textContent = 'Оберіть діалог';
          conversationMeta.textContent = '';
          messagesPane.innerHTML = '<div class="empty-state">Оберіть діалог у списку зліва.</div>';
        }

        function renderConversation(conversation, messages, options) {
          const settings = options || {};
          const shouldStickToBottom = settings.forceScrollBottom || isNearBottom(messagesPane, 64);
          const previousScrollTop = messagesPane.scrollTop;
          const previousScrollHeight = messagesPane.scrollHeight;

          state.selectedConversation = conversation;
          state.selectedMessages = messages;
          state.selectedMessagesSignature = buildMessagesSignature(messages);

          conversationTitle.textContent = conversation.conversationId;
          conversationMeta.innerHTML = '<span>' + escapeHtml(conversation.siteId || '-') + '</span>' +
            renderStatusBadge(conversation) +
            '<span>' + escapeHtml(formatDate(conversation.lastMessageAt)) + '</span>';

          messagesPane.innerHTML = messages.map(function (message) {
            const attachments = Array.isArray(message.attachments) && message.attachments.length
              ? '<div class="attachments">' + message.attachments.map(function (file) {
                  return '<a href="' + escapeHtml(file.publicUrl || '#') + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(file.fileName || 'file') + '</a>';
                }).join('') + '</div>'
              : '';

            return '<article class="message ' + escapeHtml(message.senderType || '') + '">' +
              '<div class="message-head"><span class="message-sender">' + escapeHtml(message.senderType || '-') + '</span><span>' + escapeHtml(formatDate(message.createdAt)) + '</span></div>' +
              '<div>' + nl2br(message.text || '—') + '</div>' +
              attachments +
            '</article>';
          }).join('');

          if (shouldStickToBottom) {
            messagesPane.scrollTop = messagesPane.scrollHeight;
          } else if (settings.preserveScroll !== false) {
            const scrollDelta = messagesPane.scrollHeight - previousScrollHeight;
            messagesPane.scrollTop = Math.max(0, previousScrollTop + scrollDelta);
          }
        }

        async function loadConversation(conversationId, options) {
          if (!conversationId || state.loadingConversation) return;
          state.loadingConversation = true;
          try {
            const payload = await fetchJson('/api/inbox/conversations/' + encodeURIComponent(conversationId));
            const conversation = payload.conversation;
            const messages = payload.messages || [];
            const nextSignature = buildMessagesSignature(messages);
            const selectedChanged = state.selectedConversationId !== conversationId;

            state.selectedConversationId = conversationId;

            if (
              !selectedChanged &&
              state.selectedConversation &&
              state.selectedMessagesSignature === nextSignature &&
              state.selectedConversation.status === conversation.status &&
              state.selectedConversation.lastMessageAt === conversation.lastMessageAt
            ) {
              conversationMeta.innerHTML = '<span>' + escapeHtml(conversation.siteId || '-') + '</span>' +
                renderStatusBadge(conversation) +
                '<span>' + escapeHtml(formatDate(conversation.lastMessageAt)) + '</span>';
              state.selectedConversation = conversation;
              return;
            }

            renderConversation(conversation, messages, {
              preserveScroll: options?.preserveScroll !== false,
              forceScrollBottom: options?.forceScrollBottom === true || selectedChanged
            });
          } finally {
            state.loadingConversation = false;
          }
        }

        async function sendReply() {
          if (!state.selectedConversationId) return;
          const text = replyInput.value.trim();
          if (!text) return;

          await fetchJson('/api/inbox/conversations/' + encodeURIComponent(state.selectedConversationId) + '/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: text,
              operatorName: operatorNameInput.value.trim() || 'Operator'
            })
          });

          replyInput.value = '';
          await loadConversations({ reloadSelectedConversation: true });
          await loadConversation(state.selectedConversationId, { forceScrollBottom: true });
        }

        async function updateStatus(nextStatus) {
          if (!state.selectedConversationId) return;
          await fetchJson('/api/inbox/conversations/' + encodeURIComponent(state.selectedConversationId) + '/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: nextStatus,
              operatorName: operatorNameInput.value.trim() || 'Operator'
            })
          });
          await loadConversations({ reloadSelectedConversation: true });
        }

        function restartConversationPolling() {
          if (state.conversationPollTimer) {
            clearInterval(state.conversationPollTimer);
            state.conversationPollTimer = null;
          }

          if (!state.selectedConversationId) return;
          state.conversationPollTimer = setInterval(function () {
            loadConversation(state.selectedConversationId, { preserveScroll: true }).catch(console.error);
          }, OPEN_CONVERSATION_POLL_MS);
        }

        function startPolling() {
          if (!state.listPollTimer) {
            state.listPollTimer = setInterval(function () {
              loadConversations({ reloadSelectedConversation: false }).catch(console.error);
            }, CONVERSATIONS_POLL_MS);
          }
          restartConversationPolling();
        }

        conversationList.addEventListener('click', function (event) {
          const button = event.target.closest('.conversation-item');
          if (!button) return;
          state.selectedConversationId = button.getAttribute('data-conversation-id') || '';
          renderConversationList();
          restartConversationPolling();
          loadConversation(state.selectedConversationId, { forceScrollBottom: true }).catch(console.error);
        });

        searchInput.addEventListener('input', function () {
          state.search = searchInput.value.trim();
          loadConversations({ reloadSelectedConversation: true }).catch(console.error);
        });

        statusFilter.addEventListener('change', function () {
          state.status = statusFilter.value;
          loadConversations({ reloadSelectedConversation: true }).catch(console.error);
        });

        sendReplyBtn.addEventListener('click', function () {
          sendReply().catch(console.error);
        });

        replyInput.addEventListener('keydown', function (event) {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            sendReply().catch(console.error);
          }
        });

        markOpenBtn.addEventListener('click', function () {
          updateStatus('open').catch(console.error);
        });

        markClosedBtn.addEventListener('click', function () {
          updateStatus('closed').catch(console.error);
        });

        window.addEventListener('beforeunload', function () {
          if (state.listPollTimer) clearInterval(state.listPollTimer);
          if (state.conversationPollTimer) clearInterval(state.conversationPollTimer);
        });

        loadConversations({ reloadSelectedConversation: true })
          .then(function () {
            startPolling();
          })
          .catch(function (error) {
            console.error(error);
            conversationList.innerHTML = '<div class="empty-state">Не вдалося завантажити inbox.</div>';
          });
      })();
    </script>
  </body>
</html>`);
});

if (require.main === module) {
  process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection', error);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception', error);
    process.exit(1);
  });

  app.listen(PORT, HOST, () => {
    console.log(`Chat platform listening on http://${HOST}:${PORT}`);
    console.log(`Base URL: ${PUBLIC_BASE_URL}`);
    console.log(`Environment: ${NODE_ENV}`);
  });
}

module.exports = { app, chatService };
