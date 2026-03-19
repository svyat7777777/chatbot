require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const express = require('express');
const multer = require('multer');
const { createDatabase } = require('./db/database');
const { ChatService } = require('./services/chat-service');
const { ContactService } = require('./services/contact-service');
const { AiAssistantService } = require('./services/ai-assistant-service');
const { ChannelDispatcher } = require('./services/channels/dispatcher');
const { TelegramChannelService } = require('./services/channels/telegram');
const { InstagramChannelService } = require('./services/channels/instagram');
const { FacebookChannelService } = require('./services/channels/facebook');
const { renderInboxPage } = require('./views/inbox-page');
const { renderAnalyticsPage } = require('./views/analytics-page');
const { renderContactsPage } = require('./views/contacts-page');
const { renderAppLayout } = require('./views/app-layout');
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
const CONTACTS_PATH = process.env.CHAT_PLATFORM_CONTACTS_PATH || path.join(__dirname, '..', 'data', 'contacts.json');
const OPENAI_API_KEY = String(process.env.CHAT_PLATFORM_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '').trim();
const OPENAI_BASE_URL = String(process.env.CHAT_PLATFORM_OPENAI_BASE_URL || 'https://api.openai.com/v1').trim();
const KIMI_API_KEY = String(process.env.CHAT_PLATFORM_KIMI_API_KEY || process.env.KIMI_API_KEY || '').trim();
const KIMI_BASE_URL = String(process.env.CHAT_PLATFORM_KIMI_BASE_URL || 'https://api.moonshot.cn/v1').trim();
const OPENROUTER_API_KEY = String(process.env.CHAT_PLATFORM_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '').trim();
const OPENROUTER_BASE_URL = String(process.env.CHAT_PLATFORM_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').trim();
const TEMP_UPLOAD_DIR = process.env.CHAT_PLATFORM_TEMP_UPLOAD_DIR || path.join(__dirname, '..', 'tmp');
const UPLOADS_ROOT = process.env.CHAT_PLATFORM_UPLOADS_ROOT || path.join(__dirname, '..', 'uploads');
const PUBLIC_ROOT = path.join(__dirname, '..', 'public');
const PRODUCT_CATALOG_PATH = process.env.CHAT_PLATFORM_PRODUCT_CATALOG_PATH || path.join(__dirname, '..', 'data', 'products.json');
const ALLOWED_ORIGINS = String(process.env.CHAT_PLATFORM_ALLOWED_ORIGINS || '*')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const INBOX_ADMIN_USERNAME = String(process.env.INBOX_ADMIN_USERNAME || '').trim();
const INBOX_ADMIN_PASSWORD = String(process.env.INBOX_ADMIN_PASSWORD || '').trim();
const TELEGRAM_BOT_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || process.env.CHAT_TELEGRAM_BOT_TOKEN || '').trim();
const TELEGRAM_OPERATOR_CHAT_IDS = String(process.env.TELEGRAM_OPERATOR_CHAT_IDS || process.env.CHAT_TELEGRAM_OPERATOR_CHAT_IDS || '').trim();
const TELEGRAM_WEBHOOK_SECRET = String(process.env.TELEGRAM_WEBHOOK_SECRET || process.env.CHAT_TELEGRAM_WEBHOOK_SECRET || '').trim();
const TELEGRAM_DEFAULT_SITE_ID = String(process.env.TELEGRAM_DEFAULT_SITE_ID || process.env.CHAT_PLATFORM_TELEGRAM_DEFAULT_SITE_ID || 'printforge-main').trim();
const META_APP_ID = String(process.env.META_APP_ID || '').trim();
const META_APP_SECRET = String(process.env.META_APP_SECRET || '').trim();
const META_VERIFY_TOKEN = String(process.env.META_VERIFY_TOKEN || '').trim();
const META_PAGE_ACCESS_TOKEN = String(process.env.META_PAGE_ACCESS_TOKEN || '').trim();
const META_GRAPH_VERSION = String(process.env.META_GRAPH_VERSION || 'v22.0').trim();
const INSTAGRAM_BUSINESS_ACCOUNT_ID = String(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '').trim();
const FACEBOOK_PAGE_ID = String(process.env.FACEBOOK_PAGE_ID || '').trim();
const INSTAGRAM_DEFAULT_SITE_ID = String(process.env.INSTAGRAM_DEFAULT_SITE_ID || process.env.CHAT_PLATFORM_INSTAGRAM_DEFAULT_SITE_ID || 'printforge-main').trim();
const FACEBOOK_DEFAULT_SITE_ID = String(process.env.FACEBOOK_DEFAULT_SITE_ID || process.env.CHAT_PLATFORM_FACEBOOK_DEFAULT_SITE_ID || 'printforge-main').trim();

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ''));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function loadProductCatalog() {
  try {
    if (!fs.existsSync(PRODUCT_CATALOG_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(PRODUCT_CATALOG_PATH, 'utf8');
    const parsed = safeJsonParse(raw, []);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.items)) return parsed.items;
    return [];
  } catch (error) {
    console.error('Failed to load product catalog', error);
    return [];
  }
}

function searchProductCatalog(query, limit = 6) {
  const cleanQuery = String(query || '').trim().toLowerCase();
  if (!cleanQuery) return [];
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  const products = loadProductCatalog();

  return products
    .map((item) => {
      const haystack = [
        item.title,
        item.description,
        item.sku,
        item.category,
        Array.isArray(item.tags) ? item.tags.join(' ') : item.tags
      ].join(' ').toLowerCase();
      const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => ({
      productId: String(entry.item.productId || entry.item.id || entry.item.sku || entry.item.link || entry.item.url || entry.item.title || '').trim(),
      sku: String(entry.item.sku || '').trim(),
      category: String(entry.item.category || '').trim(),
      title: String(entry.item.title || '').trim(),
      image: String(entry.item.image || entry.item.imageUrl || '').trim(),
      link: String(entry.item.link || entry.item.url || '').trim(),
      url: String(entry.item.url || entry.item.link || '').trim(),
      description: String(entry.item.description || '').trim(),
      shortDescription: String(entry.item.shortDescription || entry.item.description || '').trim(),
      price: entry.item.price == null ? '' : String(entry.item.price).trim()
    }));
}

function normalizeProductOfferInput(value, customMessage = '') {
  const product = value && typeof value === 'object' ? value : {};
  const title = String(product.title || '').trim();
  const url = String(product.url || product.link || '').trim();
  if (!title || !url) {
    return null;
  }

  return {
    productId: String(product.productId || product.id || product.sku || title).trim(),
    sku: String(product.sku || '').trim(),
    category: String(product.category || '').trim(),
    title,
    image: String(product.image || product.imageUrl || '').trim(),
    url,
    price: product.price == null ? '' : String(product.price).trim(),
    shortDescription: String(product.shortDescription || product.description || '').trim(),
    customMessage: String(customMessage || product.customMessage || '').trim()
  };
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
fs.mkdirSync(path.join(PUBLIC_ROOT, 'sounds'), { recursive: true });

const db = createDatabase(DB_PATH);
const contactService = new ContactService({
  storagePath: CONTACTS_PATH
});
const INTEGRATION_FIELDS = {
  telegram_bot_token: { secret: true, env: [TELEGRAM_BOT_TOKEN], runtime: true },
  telegram_webhook_secret: { secret: true, env: [TELEGRAM_WEBHOOK_SECRET], runtime: true },
  telegram_bot_username: { secret: false, env: [], runtime: false },
  meta_app_id: { secret: false, env: [META_APP_ID], runtime: false },
  meta_app_secret: { secret: true, env: [META_APP_SECRET], runtime: false },
  meta_verify_token: { secret: true, env: [META_VERIFY_TOKEN], runtime: true },
  meta_page_access_token: { secret: true, env: [META_PAGE_ACCESS_TOKEN], runtime: true },
  instagram_business_account_id: { secret: false, env: [INSTAGRAM_BUSINESS_ACCOUNT_ID], runtime: true },
  facebook_page_id: { secret: false, env: [FACEBOOK_PAGE_ID], runtime: true },
  openai_api_key: { secret: true, env: [OPENAI_API_KEY], runtime: true },
  openai_base_url: { secret: false, env: [OPENAI_BASE_URL], runtime: true },
  kimi_api_key: { secret: true, env: [KIMI_API_KEY], runtime: true },
  kimi_base_url: { secret: false, env: [KIMI_BASE_URL], runtime: true },
  openrouter_api_key: { secret: true, env: [OPENROUTER_API_KEY], runtime: false },
  openrouter_base_url: { secret: false, env: [OPENROUTER_BASE_URL], runtime: false }
};

function normalizeIntegrationValue(value) {
  return String(value == null ? '' : value).trim();
}

function maskSecret(value) {
  const normalized = normalizeIntegrationValue(value);
  if (!normalized) return '';
  if (normalized.length <= 8) return '********';
  return normalized.slice(0, 3) + '********' + normalized.slice(-3);
}

function getStoredIntegrationMap() {
  const rows = db.prepare('SELECT setting_key, setting_value, is_secret, updated_at FROM integration_settings').all();
  return rows.reduce((accumulator, row) => {
    accumulator[String(row.setting_key || '').trim()] = {
      value: normalizeIntegrationValue(row.setting_value),
      isSecret: Boolean(row.is_secret),
      updatedAt: String(row.updated_at || '').trim()
    };
    return accumulator;
  }, {});
}

function getIntegrationValue(key) {
  const cleanKey = String(key || '').trim();
  const definition = INTEGRATION_FIELDS[cleanKey];
  if (!definition) return '';
  const row = db.prepare('SELECT setting_value FROM integration_settings WHERE setting_key = ?').get(cleanKey);
  const storedValue = normalizeIntegrationValue(row && row.setting_value);
  if (storedValue) {
    return storedValue;
  }
  const fallback = Array.isArray(definition.env) ? definition.env.find(Boolean) : '';
  return normalizeIntegrationValue(fallback);
}

function buildAiProviderStatus() {
  return {
    openai: Boolean(getIntegrationValue('openai_api_key')),
    kimi: Boolean(getIntegrationValue('kimi_api_key')),
    openrouter: Boolean(getIntegrationValue('openrouter_api_key'))
  };
}

function buildIntegrationSettingsPayload() {
  const stored = getStoredIntegrationMap();
  const fields = Object.keys(INTEGRATION_FIELDS).reduce((accumulator, key) => {
    const definition = INTEGRATION_FIELDS[key];
    const storedEntry = stored[key];
    const resolvedValue = getIntegrationValue(key);
    const configured = Boolean(resolvedValue);
    accumulator[key] = {
      key,
      configured,
      isSecret: Boolean(definition.secret),
      source: storedEntry && storedEntry.value ? 'stored' : (configured ? 'env' : 'missing'),
      value: definition.secret ? '' : resolvedValue,
      maskedValue: configured ? (definition.secret ? maskSecret(resolvedValue) : resolvedValue) : '',
      updatedAt: storedEntry ? storedEntry.updatedAt : ''
    };
    return accumulator;
  }, {});

  return {
    fields,
    groups: {
      telegram: {
        configured: Boolean(fields.telegram_bot_token.configured),
        label: fields.telegram_bot_token.configured ? 'Configured' : 'Missing'
      },
      meta: {
        configured: Boolean(fields.meta_page_access_token.configured && fields.meta_verify_token.configured),
        label: (fields.meta_page_access_token.configured && fields.meta_verify_token.configured) ? 'Configured' : 'Missing'
      },
      aiProviders: {
        configured: Boolean(fields.openai_api_key.configured || fields.kimi_api_key.configured || fields.openrouter_api_key.configured),
        label: (fields.openai_api_key.configured || fields.kimi_api_key.configured || fields.openrouter_api_key.configured) ? 'Configured' : 'Missing'
      }
    }
  };
}

function saveIntegrationSettings(input = {}) {
  const values = input && input.values && typeof input.values === 'object' ? input.values : {};
  const clearKeys = Array.isArray(input.clearKeys) ? input.clearKeys.map((item) => String(item || '').trim()).filter(Boolean) : [];
  const upsert = db.prepare(`
    INSERT INTO integration_settings (setting_key, setting_value, is_secret, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(setting_key) DO UPDATE SET
      setting_value = excluded.setting_value,
      is_secret = excluded.is_secret,
      updated_at = excluded.updated_at
  `);
  const remove = db.prepare('DELETE FROM integration_settings WHERE setting_key = ?');
  const transaction = db.transaction(() => {
    clearKeys.forEach((key) => {
      if (INTEGRATION_FIELDS[key]) {
        remove.run(key);
      }
    });
    Object.keys(INTEGRATION_FIELDS).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(values, key)) return;
      const definition = INTEGRATION_FIELDS[key];
      const nextValue = normalizeIntegrationValue(values[key]);
      if (definition.secret) {
        if (!nextValue) return;
        upsert.run(key, nextValue, definition.secret ? 1 : 0);
        return;
      }
      upsert.run(key, nextValue, definition.secret ? 1 : 0);
    });
  });
  transaction();
  return buildIntegrationSettingsPayload();
}

function applyRuntimeIntegrationSettings() {
  const telegramBotToken = getIntegrationValue('telegram_bot_token');
  const telegramWebhookSecret = getIntegrationValue('telegram_webhook_secret');
  const metaVerifyToken = getIntegrationValue('meta_verify_token');
  const metaPageAccessToken = getIntegrationValue('meta_page_access_token');
  const instagramBusinessAccountId = getIntegrationValue('instagram_business_account_id');
  const facebookPageId = getIntegrationValue('facebook_page_id');
  const openaiApiKey = getIntegrationValue('openai_api_key');
  const openaiBaseUrl = getIntegrationValue('openai_base_url') || OPENAI_BASE_URL;
  const kimiApiKey = getIntegrationValue('kimi_api_key');
  const kimiBaseUrl = getIntegrationValue('kimi_base_url') || KIMI_BASE_URL;

  chatService.botToken = telegramBotToken;
  chatService.telegramWebhookSecret = telegramWebhookSecret;
  telegramChannelService.botToken = telegramBotToken;
  telegramChannelService.webhookSecret = telegramWebhookSecret;

  instagramChannelService.pageAccessToken = metaPageAccessToken;
  instagramChannelService.verifyToken = metaVerifyToken;
  instagramChannelService.businessAccountId = instagramBusinessAccountId;

  facebookChannelService.pageAccessToken = metaPageAccessToken;
  facebookChannelService.verifyToken = metaVerifyToken;
  facebookChannelService.pageId = facebookPageId;

  aiAssistantService.providers.openai.apiKey = openaiApiKey;
  aiAssistantService.providers.openai.baseUrl = openaiBaseUrl.replace(/\/+$/, '');
  aiAssistantService.providers.kimi.apiKey = kimiApiKey;
  aiAssistantService.providers.kimi.baseUrl = kimiBaseUrl.replace(/\/+$/, '');
}

const runtimeIntegrationSettings = buildIntegrationSettingsPayload();
const channelDispatcher = new ChannelDispatcher();
const telegramChannelService = new TelegramChannelService({
  botToken: getIntegrationValue('telegram_bot_token'),
  webhookSecret: getIntegrationValue('telegram_webhook_secret'),
  defaultSiteId: TELEGRAM_DEFAULT_SITE_ID,
  operatorChatIds: TELEGRAM_OPERATOR_CHAT_IDS
});
const instagramChannelService = new InstagramChannelService({
  pageAccessToken: getIntegrationValue('meta_page_access_token'),
  verifyToken: getIntegrationValue('meta_verify_token'),
  defaultSiteId: INSTAGRAM_DEFAULT_SITE_ID,
  graphVersion: META_GRAPH_VERSION,
  businessAccountId: getIntegrationValue('instagram_business_account_id')
});
const facebookChannelService = new FacebookChannelService({
  pageAccessToken: getIntegrationValue('meta_page_access_token'),
  verifyToken: getIntegrationValue('meta_verify_token'),
  defaultSiteId: FACEBOOK_DEFAULT_SITE_ID,
  graphVersion: META_GRAPH_VERSION,
  pageId: getIntegrationValue('facebook_page_id')
});
channelDispatcher.register(telegramChannelService);
channelDispatcher.register(instagramChannelService);
channelDispatcher.register(facebookChannelService);
const chatService = new ChatService({
  db,
  contactService,
  channelDispatcher,
  uploadsDir: path.join(UPLOADS_ROOT, 'chat', 'default'),
  publicUploadsBase: '/uploads/chat',
  publicBaseUrl: PUBLIC_BASE_URL,
  botToken: getIntegrationValue('telegram_bot_token'),
  operatorChatIds: TELEGRAM_OPERATOR_CHAT_IDS,
  telegramWebhookSecret: getIntegrationValue('telegram_webhook_secret'),
  siteConfigProvider: getSiteConfig,
  siteConfigsProvider: listSiteConfigs
});
const aiAssistantService = new AiAssistantService({
  openaiApiKey: getIntegrationValue('openai_api_key'),
  openaiBaseUrl: getIntegrationValue('openai_base_url') || OPENAI_BASE_URL,
  kimiApiKey: getIntegrationValue('kimi_api_key'),
  kimiBaseUrl: getIntegrationValue('kimi_base_url') || KIMI_BASE_URL
});
applyRuntimeIntegrationSettings();

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
app.get('/sounds/message.mp3', (req, res) => {
  if (IS_PRODUCTION) {
    res.setHeader('Cache-Control', 'public, max-age=604800');
  }
  res.type('audio/mp4').sendFile(path.join(PUBLIC_ROOT, 'sounds', 'message.mp3'));
});
app.use('/sounds', express.static(path.join(PUBLIC_ROOT, 'sounds'), {
  fallthrough: true,
  maxAge: IS_PRODUCTION ? '7d' : 0
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

function normalizeContactMatchToken(value) {
  return String(value || '').trim().toLowerCase();
}

function buildContactMatchTokens(contact) {
  const tokens = [];
  const name = normalizeContactMatchToken(contact?.name);
  const phone = normalizeContactMatchToken(contact?.phone).replace(/\s+/g, '');
  const telegram = normalizeContactMatchToken(contact?.telegram);
  const telegramId = normalizeContactMatchToken(contact?.telegramId);
  const instagramId = normalizeContactMatchToken(contact?.instagramId);
  const facebookId = normalizeContactMatchToken(contact?.facebookId);
  const email = normalizeContactMatchToken(contact?.email);

  if (name && name.length >= 4) tokens.push(name);
  if (phone && phone.replace(/\D/g, '').length >= 6) tokens.push(phone);
  if (telegram && telegram.length >= 4) tokens.push(telegram);
  if (telegramId) tokens.push(telegramId);
  if (instagramId) tokens.push(instagramId);
  if (facebookId) tokens.push(facebookId);
  if (email && email.length >= 5) tokens.push(email);

  return Array.from(new Set(tokens));
}

function doesConversationMatchContact(contact, conversationPayload, tokens) {
  if (!conversationPayload?.conversation) return false;
  if (contact?.conversationId && conversationPayload.conversation.conversationId === contact.conversationId) {
    return true;
  }
  if (contact?.telegramId && String(conversationPayload.conversation.externalUserId || '').trim() === String(contact.telegramId).trim()) {
    return true;
  }
  if (contact?.instagramId && String(conversationPayload.conversation.externalUserId || '').trim() === String(contact.instagramId).trim()) {
    return true;
  }
  if (contact?.facebookId && String(conversationPayload.conversation.externalUserId || '').trim() === String(contact.facebookId).trim()) {
    return true;
  }

  if (!tokens.length) {
    return false;
  }

  const haystack = (conversationPayload.messages || [])
    .flatMap((message) => {
      const parts = [message.text || '', message.senderName || ''];
      if (Array.isArray(message.attachments)) {
        for (const attachment of message.attachments) {
          parts.push(attachment.fileName || '');
        }
      }
      return parts;
    })
    .join('\n')
    .toLowerCase()
    .replace(/\s+/g, '');

  return tokens.some((token) => haystack.includes(token.replace(/\s+/g, '')));
}

function buildConversationActivity(payload) {
  const messages = payload?.messages || [];
  const events = chatService.listEvents(payload?.conversation?.conversationId || '');
  const items = [];

  for (const event of events) {
    let label = '';
    if (event.eventType === 'conversation_created') label = 'Chat started';
    else if (event.eventType === 'conversation_closed' || (event.eventType === 'inbox_status_changed' && event.payload?.status === 'closed')) label = 'Chat closed';
    else if (event.eventType === 'operator_taken') label = 'Operator joined';
    else if (event.eventType === 'returned_to_ai') label = 'Returned to AI';
    else if (/rating|feedback/i.test(event.eventType)) label = 'Rating submitted';
    else if (event.eventType === 'lead_summary_captured') label = 'Lead summary captured';
    if (label) {
      items.push({
        type: 'event',
        label,
        createdAt: event.createdAt,
        conversationId: payload.conversation.conversationId,
        siteId: payload.conversation.siteId,
        payload: event.payload || {}
      });
    }
  }

  for (const message of messages) {
    if (message.senderType === 'visitor' && Array.isArray(message.attachments) && message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        items.push({
          type: 'file_uploaded',
          label: `File uploaded: ${attachment.fileName || 'file'}`,
          createdAt: attachment.createdAt || message.createdAt,
          conversationId: payload.conversation.conversationId,
          siteId: payload.conversation.siteId,
          file: attachment
        });
      }
    }
  }

  return items.sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));
}

function buildRatingsFromEvents(activityItems) {
  return activityItems
    .filter((item) => item.type === 'event' && /rating|feedback/i.test(String(item.payload?.type || item.label || '')))
    .map((item) => ({
      createdAt: item.createdAt,
      value: String(item.payload?.rating || item.payload?.label || item.payload?.value || item.label || '').trim(),
      note: String(item.payload?.note || item.payload?.comment || '').trim()
    }))
    .filter((item) => item.value);
}

function buildContactProfileData(contact) {
  if (!contact) return null;

  const tokens = buildContactMatchTokens(contact);
  const conversations = [];
  const seenConversationIds = new Set();
  const allConversations = chatService.listConversations({ limit: 5000 });

  for (const item of allConversations) {
    const payload = chatService.getConversationWithMessages(item.conversationId);
    if (!payload) continue;
    if (!doesConversationMatchContact(contact, payload, tokens)) continue;
    if (seenConversationIds.has(payload.conversation.conversationId)) continue;
    seenConversationIds.add(payload.conversation.conversationId);
    conversations.push(payload);
  }

  if (!conversations.length && contact.conversationId) {
    const fallback = chatService.getConversationWithMessages(contact.conversationId);
    if (fallback) {
      conversations.push(fallback);
      seenConversationIds.add(fallback.conversation.conversationId);
    }
  }

  const conversationSummaries = conversations
    .map((payload) => ({
      conversationId: payload.conversation.conversationId,
      siteId: payload.conversation.siteId,
      channel: payload.conversation.channel || 'web',
      status: payload.conversation.status,
      createdAt: payload.conversation.createdAt,
      updatedAt: payload.conversation.updatedAt,
      lastMessageAt: payload.conversation.lastMessageAt,
      messageCount: Array.isArray(payload.messages) ? payload.messages.length : 0,
      lastMessage: Array.isArray(payload.messages) && payload.messages.length
        ? String(payload.messages[payload.messages.length - 1].text || '').trim()
        : '',
      hasAttachments: Array.isArray(payload.messages) && payload.messages.some((message) => Array.isArray(message.attachments) && message.attachments.length > 0)
    }))
    .sort((left, right) => String(right.lastMessageAt || right.updatedAt || '').localeCompare(String(left.lastMessageAt || left.updatedAt || '')));

  const files = conversations
    .flatMap((payload) => (payload.messages || [])
      .filter((message) => message.senderType === 'visitor' && Array.isArray(message.attachments) && message.attachments.length > 0)
      .flatMap((message) => message.attachments.map((attachment) => ({
        conversationId: payload.conversation.conversationId,
        siteId: payload.conversation.siteId,
        fileName: attachment.fileName,
        publicUrl: attachment.publicUrl,
        createdAt: attachment.createdAt || message.createdAt,
        fileSize: attachment.fileSize || 0
      }))))
    .sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));

  const activity = conversations
    .flatMap((payload) => buildConversationActivity(payload))
    .sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));

  const ratings = buildRatingsFromEvents(activity);
  const summary = {
    dialogsCount: conversationSummaries.length,
    lastMessage: conversationSummaries[0]?.lastMessage || '',
    lastMessageAt: conversationSummaries[0]?.lastMessageAt || '',
    rating: ratings[0]?.value || '',
    assignedOperator: conversationSummaries[0]?.assignedOperator || '',
    lastOperator: conversationSummaries[0]?.lastOperator || '',
    lastActivityAt:
      activity[0]?.createdAt ||
      conversationSummaries[0]?.lastMessageAt ||
      conversationSummaries[0]?.updatedAt ||
      ''
  };

  return {
    contact,
    summary,
    conversations: conversationSummaries,
    files,
    ratings,
    activity
  };
}

function buildContactOverview(contact) {
  const fallback = {
    dialogsCount: contact?.conversationId ? 1 : 0,
    lastMessage: '',
    lastMessageAt: contact?.lastConversationAt || contact?.updatedAt || '',
    rating: '',
    assignedOperator: '',
    lastOperator: '',
    lastActivityAt: contact?.lastConversationAt || contact?.updatedAt || ''
  };

  if (!contact?.conversationId) {
    return fallback;
  }

  const payload = chatService.getConversationWithMessages(contact.conversationId);
  if (!payload) {
    return fallback;
  }

  const messages = payload.messages || [];
  const lastMessage = messages.length ? String(messages[messages.length - 1].text || '').trim() : '';
  return {
    dialogsCount: 1,
    lastMessage,
    lastMessageAt: payload.conversation.lastMessageAt || payload.conversation.updatedAt || fallback.lastMessageAt,
    rating: '',
    channel: payload.conversation.channel || 'web',
    assignedOperator: payload.conversation.assignedOperator || '',
    lastOperator: payload.conversation.lastOperator || '',
    lastActivityAt: payload.conversation.lastMessageAt || payload.conversation.updatedAt || fallback.lastActivityAt
  };
}

function isSameUtcDay(value, dayKey) {
  return String(value || '').slice(0, 10) === String(dayKey || '').slice(0, 10);
}

function getUtcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function parseSqliteDate(value) {
  const clean = String(value || '').trim();
  if (!clean) return null;
  const parsed = new Date(clean.replace(' ', 'T') + 'Z');
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function percent(value, total) {
  if (!total) return 0;
  return (Number(value || 0) / Number(total || 0)) * 100;
}

function buildTopicAnalytics(messageRows) {
  const topicDefinitions = [
    { key: 'price', label: 'Price / Cost', pattern: /(ціна|варт|cost|price|кошту|прорах|estimate)/i },
    { key: 'lead_time', label: 'Lead time / Timing', pattern: /(термін|час|скільки.*друк|lead time|when|how long|доставка.*коли)/i },
    { key: 'file', label: 'Files / STL', pattern: /(stl|obj|3mf|file|файл|модель|upload|attach)/i },
    { key: 'size', label: 'Size / Dimensions', pattern: /(розмір|габарит|dimension|size|мм|cm|см)/i },
    { key: 'material', label: 'Materials', pattern: /(матеріал|pla|petg|abs|nylon|resin)/i },
    { key: 'delivery', label: 'Delivery', pattern: /(доставк|nova poshta|нова пошта|ship|shipping|pickup)/i },
    { key: 'repair', label: 'Repair', pattern: /(ремонт|repair|fix|зламал)/i },
    { key: 'design', label: 'Design / Modeling', pattern: /(дизайн|design|3d model|моделюван|сконструю)/i }
  ];

  const counts = topicDefinitions.map((topic) => ({
    key: topic.key,
    label: topic.label,
    count: 0
  }));

  const conversationTopicSeen = new Map();
  for (const row of messageRows) {
    const conversationId = String(row.conversation_id || '').trim();
    const text = String(row.message_text || '').trim();
    if (!conversationId || !text) continue;
    let seen = conversationTopicSeen.get(conversationId);
    if (!seen) {
      seen = new Set();
      conversationTopicSeen.set(conversationId, seen);
    }
    topicDefinitions.forEach((topic, index) => {
      if (!seen.has(topic.key) && topic.pattern.test(text)) {
        counts[index].count += 1;
        seen.add(topic.key);
      }
    });
  }

  return counts
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);
}

function normalizeQuestionMessage(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildTopQuestionAnalytics(messageRows, limit = 10) {
  const rules = [
    { label: 'Скільки коштує друк?', pattern: /(ціна|скільки|кошту|варт|price|cost|прорах|estimate)/i },
    { label: 'Які терміни виготовлення?', pattern: /(термін|час|скільки.*час|how long|lead time|коли буде готово)/i },
    { label: 'Чи є доставка?', pattern: /(доставк|нова пошта|nova poshta|shipping|ship|pickup)/i },
    { label: 'Який матеріал?', pattern: /(матеріал|pla|petg|abs|nylon|resin)/i },
    { label: 'Який розмір можна надрукувати?', pattern: /(розмір|габарит|dimension|size|мм|cm|см)/i },
    { label: 'Який файл потрібен?', pattern: /(stl|obj|3mf|file|файл|модель|upload|attach)/i },
    { label: 'Чи можете змоделювати?', pattern: /(моделюван|дизайн|design|3d model|сконструю)/i },
    { label: 'Чи можна терміново?', pattern: /(терміново|urgent|сьогодні|today|asap)/i },
    { label: 'Чи можна зв’язатись з менеджером?', pattern: /(менеджер|оператор|human|manager|зв.?язат)/i }
  ];

  const grouped = new Map();
  for (const row of messageRows) {
    const conversationId = String(row.conversation_id || '').trim();
    const rawText = String(row.message_text || '').trim();
    if (!conversationId || !rawText) continue;
    const text = normalizeQuestionMessage(rawText);
    if (!text) continue;

    let label = '';
    for (const rule of rules) {
      if (rule.pattern.test(text)) {
        label = rule.label;
        break;
      }
    }

    if (!label) {
      const words = text.split(' ').filter(Boolean).slice(0, 5);
      if (!words.length) continue;
      label = words.join(' ');
      if (!/[?؟]$/.test(label)) {
        label += '?';
      }
      label = label.charAt(0).toUpperCase() + label.slice(1);
    }

    if (!grouped.has(label)) {
      grouped.set(label, {
        question: label,
        count: 0,
        samples: []
      });
    }
    const target = grouped.get(label);
    target.count += 1;
    if (target.samples.length < 3 && !target.samples.some((sample) => sample.conversationId === conversationId && sample.text === rawText)) {
      target.samples.push({
        text: rawText,
        conversationId
      });
    }
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.count - left.count || left.question.localeCompare(right.question))
    .slice(0, Math.max(1, Math.min(Number(limit) || 10, 25)));
}

function parseAnalyticsPeriod(rawPeriod) {
  const normalized = String(rawPeriod || '30d').trim().toLowerCase();
  if (normalized === '24h') {
    return {
      key: '24h',
      rangeSql: "datetime('now', '-24 hours')",
      previousRangeSql: "datetime('now', '-48 hours')",
      chartDays: 2,
      chartMode: 'hourly',
      windowHours: 24,
      windowDays: 1,
      label: 'Last 24 hours',
      subtitle: 'За останні 24 години'
    };
  }

  if (normalized === '7d') {
    return {
      key: '7d',
      rangeSql: "datetime('now', '-7 days')",
      previousRangeSql: "datetime('now', '-14 days')",
      chartDays: 7,
      chartMode: 'daily',
      windowHours: 7 * 24,
      windowDays: 7,
      label: 'Last 7 days',
      subtitle: 'За останні 7 днів'
    };
  }

  const customMatch = normalized.match(/^(\d{1,3})d$/);
  if (customMatch) {
    const days = Math.max(1, Math.min(365, Number(customMatch[1]) || 30));
    return {
      key: `${days}d`,
      rangeSql: `datetime('now', '-${days} days')`,
      previousRangeSql: `datetime('now', '-${days * 2} days')`,
      chartDays: days,
      chartMode: 'daily',
      windowHours: days * 24,
      windowDays: days,
      label: `Last ${days} days`,
      subtitle: `За останні ${days} днів`
    };
  }

  return {
    key: '30d',
    rangeSql: "datetime('now', '-30 days')",
    previousRangeSql: "datetime('now', '-60 days')",
    chartDays: 30,
    chartMode: 'daily',
    windowHours: 30 * 24,
    windowDays: 30,
    label: 'Last 30 days',
    subtitle: 'За останні 30 днів'
  };
}

function buildFeedbackAnalytics(period) {
  const rows = db.prepare(
    `
    SELECT event_type, payload
    FROM conversation_events
    WHERE lower(event_type) LIKE '%rating%'
       OR lower(event_type) LIKE '%feedback%'
      AND datetime(created_at) >= ${period.rangeSql}
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT 500
    `
  ).all();

  const totals = { lux: 0, normal: 0, bad: 0 };
  for (const row of rows) {
    const payload = typeof row.payload === 'string' ? safeJsonParse(row.payload, {}) : {};
    const raw = String(
      payload.rating ||
      payload.label ||
      payload.value ||
      payload.feedback ||
      row.event_type ||
      ''
    ).trim().toLowerCase();

    if (/lux|excellent|great|good|5|4/.test(raw)) totals.lux += 1;
    else if (/bad|poor|1|2/.test(raw)) totals.bad += 1;
    else totals.normal += 1;
  }

  const total = totals.lux + totals.normal + totals.bad;
  return {
    total,
    lux: totals.lux,
    normal: totals.normal,
    bad: totals.bad,
    luxPercent: percent(totals.lux, total),
    normalPercent: percent(totals.normal, total),
    badPercent: percent(totals.bad, total)
  };
}

function buildOperatorPerformanceAnalytics(period) {
  const conversations = db.prepare(
    `
    SELECT conversation_id, assigned_operator, last_operator, handoff_at, human_replied_at, closed_at, status
    FROM conversations
    WHERE datetime(created_at) >= ${period.rangeSql}
    `
  ).all();

  const operatorMessages = db.prepare(
    `
    SELECT sender_name, COUNT(*) AS count
    FROM messages
    WHERE sender_type = 'operator'
      AND datetime(created_at) >= ${period.rangeSql}
    GROUP BY sender_name
    `
  ).all();

  const statsMap = new Map();
  function getOperatorStats(name) {
    const cleanName = String(name || '').trim();
    if (!cleanName) return null;
    if (!statsMap.has(cleanName)) {
      statsMap.set(cleanName, {
        operator: cleanName,
        assignedChatsCount: 0,
        humanRepliesCount: 0,
        closedChatsCount: 0,
        messagesSentCount: 0,
        responseTimeTotalSeconds: 0,
        responseTimeSamples: 0,
        averageFirstResponseTimeSeconds: 0
      });
    }
    return statsMap.get(cleanName);
  }

  for (const row of conversations) {
    const assignedOperator = getOperatorStats(row.assigned_operator);
    const lastOperator = getOperatorStats(row.last_operator);

    if (assignedOperator) {
      assignedOperator.assignedChatsCount += 1;
    }

    if (row.human_replied_at) {
      const target = assignedOperator || lastOperator;
      if (target) {
        target.humanRepliesCount += 1;
      }
    }

    if (String(row.status || '') === 'closed') {
      if (assignedOperator) {
        assignedOperator.closedChatsCount += 1;
      }
      if (lastOperator && (!assignedOperator || lastOperator.operator !== assignedOperator.operator)) {
        lastOperator.closedChatsCount += 1;
      }
    }

    const handoffAt = parseSqliteDate(row.handoff_at);
    const humanRepliedAt = parseSqliteDate(row.human_replied_at);
    if (handoffAt && humanRepliedAt) {
      const target = assignedOperator || lastOperator;
      if (target) {
        target.responseTimeTotalSeconds += Math.max(0, Math.round((humanRepliedAt.getTime() - handoffAt.getTime()) / 1000));
        target.responseTimeSamples += 1;
      }
    }
  }

  for (const row of operatorMessages) {
    const target = getOperatorStats(row.sender_name);
    if (target) {
      target.messagesSentCount = Number(row.count || 0);
    }
  }

  const rows = Array.from(statsMap.values())
    .map((item) => Object.assign({}, item, {
      averageFirstResponseTimeSeconds: item.responseTimeSamples
        ? item.responseTimeTotalSeconds / item.responseTimeSamples
        : 0
    }))
    .sort((left, right) => right.assignedChatsCount - left.assignedChatsCount || right.messagesSentCount - left.messagesSentCount);

  const totals = rows.reduce((accumulator, item) => {
    accumulator.assignedChatsCount += item.assignedChatsCount;
    accumulator.humanRepliesCount += item.humanRepliesCount;
    accumulator.closedChatsCount += item.closedChatsCount;
    accumulator.messagesSentCount += item.messagesSentCount;
    accumulator.responseTimeTotalSeconds += item.responseTimeTotalSeconds;
    accumulator.responseTimeSamples += item.responseTimeSamples;
    return accumulator;
  }, {
    assignedChatsCount: 0,
    humanRepliesCount: 0,
    closedChatsCount: 0,
    messagesSentCount: 0,
    responseTimeTotalSeconds: 0,
    responseTimeSamples: 0
  });

  return {
    rows,
    summary: {
      averageResponseTimeSeconds: totals.responseTimeSamples
        ? totals.responseTimeTotalSeconds / totals.responseTimeSamples
        : 0,
      measuredReplies: totals.responseTimeSamples
    }
  };
}

function buildAnalyticsPayload(rawPeriod) {
  const period = parseAnalyticsPeriod(rawPeriod);
  const todayKey = getUtcDayKey();
  const visitorsToday = db.prepare(
    `SELECT COUNT(DISTINCT visitor_id) AS count FROM conversations WHERE date(created_at) = date('now')`
  ).get().count || 0;
  const chatsStartedToday = db.prepare(
    `SELECT COUNT(*) AS count FROM conversations WHERE date(created_at) = date('now')`
  ).get().count || 0;
  const contactsCollectedToday = contactService.listContacts().filter((contact) => isSameUtcDay(contact.createdAt, todayKey)).length;
  const conversionRate = chatsStartedToday ? (contactsCollectedToday / chatsStartedToday) * 100 : 0;

  const dailyChats = db.prepare(
    `
    SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
    FROM conversations
    WHERE datetime(created_at) >= ${period.rangeSql}
    GROUP BY substr(created_at, 1, 10)
    ORDER BY day ASC
    `
  ).all();

  const dailyMap = new Map(dailyChats.map((row) => [String(row.day), Number(row.count || 0)]));
  const normalizedDailyChats = [];
  if (period.chartMode === 'hourly') {
    const hourlyChats = db.prepare(
      `
      SELECT strftime('%Y-%m-%d %H:00', created_at) AS hour_key, COUNT(*) AS count
      FROM conversations
      WHERE datetime(created_at) >= ${period.rangeSql}
      GROUP BY hour_key
      ORDER BY hour_key ASC
      `
    ).all();
    const hourlyMap = new Map(hourlyChats.map((row) => [String(row.hour_key), Number(row.count || 0)]));
    for (let index = 23; index >= 0; index -= 1) {
      const date = new Date();
      date.setUTCMinutes(0, 0, 0);
      date.setUTCHours(date.getUTCHours() - index);
      const hourKey = date.toISOString().slice(0, 13).replace('T', ' ') + ':00';
      normalizedDailyChats.push({
        day: hourKey,
        label: date.toISOString().slice(11, 16),
        count: hourlyMap.get(hourKey) || 0
      });
    }
  } else {
    for (let index = period.chartDays - 1; index >= 0; index -= 1) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - index);
      const dayKey = date.toISOString().slice(0, 10);
      normalizedDailyChats.push({
        day: dayKey,
        label: dayKey.slice(5).split('-').reverse().join('.'),
        count: dailyMap.get(dayKey) || 0
      });
    }
  }

  const funnelBase = {
    visitors: db.prepare(
      `SELECT COUNT(DISTINCT visitor_id) AS count FROM conversations WHERE datetime(created_at) >= ${period.rangeSql}`
    ).get().count || 0,
    startedChat: db.prepare(
      `SELECT COUNT(*) AS count FROM conversations WHERE datetime(created_at) >= ${period.rangeSql}`
    ).get().count || 0,
    sentFile: db.prepare(
      `
      SELECT COUNT(DISTINCT m.conversation_id) AS count
      FROM attachments a
      JOIN messages m ON m.id = a.message_id
      JOIN conversations c ON c.conversation_id = m.conversation_id
      WHERE m.sender_type = 'visitor'
        AND datetime(c.created_at) >= ${period.rangeSql}
      `
    ).get().count || 0
  };

  const recentVisitorMessages = db.prepare(
    `
    SELECT m.conversation_id, m.message_text
    FROM messages m
    JOIN conversations c ON c.conversation_id = m.conversation_id
    WHERE m.sender_type = 'visitor'
      AND datetime(c.created_at) >= ${period.rangeSql}
    ORDER BY datetime(m.created_at) ASC, m.id ASC
    `
  ).all();

  const contactConversationIds = new Set(
    contactService.listContacts()
      .filter((contact) => (contact.phone || contact.telegram) && contact.conversationId)
      .map((contact) => String(contact.conversationId || '').trim())
      .filter(Boolean)
  );
  const messageContactConversationIds = new Set();
  const phonePattern = /(?:\+?\d[\d\s().-]{7,}\d)/;
  const telegramPattern = /(^|\s)@([a-zA-Z0-9_]{5,32})\b/;
  for (const row of recentVisitorMessages) {
    const text = String(row.message_text || '').trim();
    if (!text) continue;
    if (phonePattern.test(text) || telegramPattern.test(text)) {
      messageContactConversationIds.add(String(row.conversation_id || '').trim());
    }
  }

  const leftContact = new Set(Array.from(contactConversationIds).concat(Array.from(messageContactConversationIds))).size;

  const fileUploadCountsRaw = db.prepare(
    `
    SELECT lower(substr(a.file_name, instr(a.file_name, '.') + 1)) AS ext, COUNT(*) AS count
    FROM attachments a
    JOIN messages m ON m.id = a.message_id
    JOIN conversations c ON c.conversation_id = m.conversation_id
    WHERE m.sender_type = 'visitor'
      AND datetime(c.created_at) >= ${period.rangeSql}
    GROUP BY ext
    `
  ).all();
  const uploadMap = fileUploadCountsRaw.reduce((accumulator, row) => {
    accumulator[String(row.ext || '').trim().toLowerCase()] = Number(row.count || 0);
    return accumulator;
  }, {});
  const fileUploads = ['stl', 'png', 'zip', 'obj'].map((ext) => ({
    label: ext.toUpperCase(),
    count: uploadMap[ext] || 0
  }));

  return {
    generatedAt: new Date().toLocaleString('uk-UA'),
    period: {
      key: period.key,
      label: period.label,
      subtitle: period.subtitle
    },
    metrics: {
      visitorsToday,
      chatsStartedToday,
      contactsCollectedToday,
      conversionRate
    },
    dailyChats: normalizedDailyChats,
    funnel: [
      { label: 'Visitors', value: funnelBase.visitors },
      { label: 'Started chat', value: funnelBase.startedChat },
      { label: 'Sent file', value: funnelBase.sentFile },
      { label: 'Left phone/telegram', value: leftContact }
    ],
    topTopics: buildTopicAnalytics(recentVisitorMessages),
    fileUploads,
    feedback: buildFeedbackAnalytics(period),
    operatorPerformance: buildOperatorPerformanceAnalytics(period)
  };
}

function toSqliteTimestamp(date) {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

function buildAnalyticsWindow(period, previous = false) {
  const endAt = new Date();
  const currentStartAt = new Date(endAt.getTime() - (period.windowHours * 60 * 60 * 1000));
  if (!previous) {
    return {
      startAt: currentStartAt,
      endAt,
      startSql: toSqliteTimestamp(currentStartAt),
      endSql: toSqliteTimestamp(endAt)
    };
  }
  const previousStartAt = new Date(currentStartAt.getTime() - (period.windowHours * 60 * 60 * 1000));
  return {
    startAt: previousStartAt,
    endAt: currentStartAt,
    startSql: toSqliteTimestamp(previousStartAt),
    endSql: toSqliteTimestamp(currentStartAt)
  };
}

function buildAnalyticsWhere(options = {}) {
  const clauses = ['datetime(%FIELD%) >= datetime(?)', 'datetime(%FIELD%) < datetime(?)'];
  const params = [options.startSql, options.endSql];
  if (options.siteId) {
    clauses.push('c.site_id = ?');
    params.push(options.siteId);
  }
  if (options.operator) {
    clauses.push('(c.assigned_operator = ? OR c.last_operator = ? OR m.sender_name = ?)');
    params.push(options.operator, options.operator, options.operator);
  }
  return { clauses, params };
}

function buildConversationWhere(options = {}) {
  const clauses = ['datetime(c.created_at) >= datetime(?)', 'datetime(c.created_at) < datetime(?)'];
  const params = [options.startSql, options.endSql];
  if (options.siteId) {
    clauses.push('c.site_id = ?');
    params.push(options.siteId);
  }
  if (options.operator) {
    clauses.push('(c.assigned_operator = ? OR c.last_operator = ?)');
    params.push(options.operator, options.operator);
  }
  return { clauses, params };
}

function loadAnalyticsDataset(period, options = {}, previous = false) {
  const window = buildAnalyticsWindow(period, previous);
  const siteId = String(options.siteId || '').trim();
  const operator = String(options.operator || '').trim();
  const conversationWhere = buildConversationWhere({ startSql: window.startSql, endSql: window.endSql, siteId, operator });
  const conversations = db.prepare(
    `
    SELECT c.*,
           (
             SELECT COUNT(*) FROM messages mm
             WHERE mm.conversation_id = c.conversation_id
           ) AS message_count,
           (
             SELECT COUNT(*) FROM messages mm
             WHERE mm.conversation_id = c.conversation_id
               AND mm.sender_type = 'visitor'
           ) AS visitor_message_count,
           (
             SELECT COUNT(*) FROM messages mm
             WHERE mm.conversation_id = c.conversation_id
               AND mm.sender_type = 'operator'
           ) AS operator_message_count,
           (
             SELECT COUNT(*) FROM messages mm
             WHERE mm.conversation_id = c.conversation_id
               AND mm.sender_type IN ('ai', 'system')
           ) AS ai_message_count,
           (
             SELECT MIN(mm.created_at) FROM messages mm
             WHERE mm.conversation_id = c.conversation_id
               AND mm.sender_type = 'visitor'
           ) AS first_visitor_message_at,
           (
             SELECT MIN(mm.created_at) FROM messages mm
             WHERE mm.conversation_id = c.conversation_id
               AND mm.sender_type = 'operator'
           ) AS first_operator_reply_at,
           (
             SELECT MIN(mm.created_at) FROM messages mm
             WHERE mm.conversation_id = c.conversation_id
               AND mm.sender_type IN ('ai', 'system')
           ) AS first_ai_reply_at,
           (
             SELECT MAX(mm.created_at) FROM messages mm
             WHERE mm.conversation_id = c.conversation_id
           ) AS last_message_actual_at
    FROM conversations c
    WHERE ${conversationWhere.clauses.join(' AND ')}
    ORDER BY datetime(c.created_at) DESC, c.id DESC
    `
  ).all(...conversationWhere.params);

  const messageWhereClauses = ['datetime(m.created_at) >= datetime(?)', 'datetime(m.created_at) < datetime(?)'];
  const messageParams = [window.startSql, window.endSql];
  if (siteId) {
    messageWhereClauses.push('c.site_id = ?');
    messageParams.push(siteId);
  }
  if (operator) {
    messageWhereClauses.push('(c.assigned_operator = ? OR c.last_operator = ? OR m.sender_name = ?)');
    messageParams.push(operator, operator, operator);
  }

  const messages = db.prepare(
    `
    SELECT m.*,
           c.site_id,
           c.source_page,
           c.channel AS conversation_channel,
           c.status AS conversation_status,
           c.assigned_operator,
           c.last_operator
    FROM messages m
    JOIN conversations c ON c.conversation_id = m.conversation_id
    WHERE ${messageWhereClauses.join(' AND ')}
    ORDER BY datetime(m.created_at) ASC, m.id ASC
    `
  ).all(...messageParams);

  const events = db.prepare(
    `
    SELECT e.*, c.site_id, c.channel, c.assigned_operator, c.last_operator
    FROM conversation_events e
    JOIN conversations c ON c.conversation_id = e.conversation_id
    WHERE datetime(e.created_at) >= datetime(?)
      AND datetime(e.created_at) < datetime(?)
      ${siteId ? 'AND c.site_id = ?' : ''}
      ${operator ? 'AND (c.assigned_operator = ? OR c.last_operator = ?)' : ''}
    ORDER BY datetime(e.created_at) ASC, e.id ASC
    `
  ).all(
    window.startSql,
    window.endSql,
    ...(siteId ? [siteId] : []),
    ...(operator ? [operator, operator] : [])
  ).map((row) => Object.assign({}, row, {
    payload: safeJsonParse(row.payload, {})
  }));

  const feedback = db.prepare(
    `
    SELECT f.*, c.site_id
    FROM conversation_feedback f
    JOIN conversations c ON c.conversation_id = f.conversation_id
    WHERE datetime(f.created_at) >= datetime(?)
      AND datetime(f.created_at) < datetime(?)
      ${siteId ? 'AND c.site_id = ?' : ''}
      ${operator ? 'AND (c.assigned_operator = ? OR c.last_operator = ?)' : ''}
    ORDER BY datetime(f.created_at) DESC
    `
  ).all(
    window.startSql,
    window.endSql,
    ...(siteId ? [siteId] : []),
    ...(operator ? [operator, operator] : [])
  );

  const attachments = db.prepare(
    `
    SELECT a.*, m.conversation_id, m.sender_type, c.site_id, c.source_page
    FROM attachments a
    JOIN messages m ON m.id = a.message_id
    JOIN conversations c ON c.conversation_id = m.conversation_id
    WHERE datetime(a.created_at) >= datetime(?)
      AND datetime(a.created_at) < datetime(?)
      ${siteId ? 'AND c.site_id = ?' : ''}
      ${operator ? 'AND (c.assigned_operator = ? OR c.last_operator = ?)' : ''}
    ORDER BY datetime(a.created_at) DESC
    `
  ).all(
    window.startSql,
    window.endSql,
    ...(siteId ? [siteId] : []),
    ...(operator ? [operator, operator] : [])
  );

  const contacts = contactService.listContacts({ siteId, limit: 10000 })
    .filter((contact) => {
      const createdAt = parseSqliteDate(contact.createdAt);
      return createdAt && createdAt >= window.startAt && createdAt < window.endAt;
    });

  return {
    period,
    window,
    siteId,
    operator,
    conversations,
    messages,
    events,
    feedback,
    attachments,
    contacts
  };
}

function dayKeyFromDate(value) {
  const date = parseSqliteDate(value);
  return date ? date.toISOString().slice(0, 10) : '';
}

function hourLabelFromDate(value) {
  const date = parseSqliteDate(value);
  return date ? date.toISOString().slice(11, 13) + ':00' : '';
}

function weekdayIndexFromDate(value) {
  const date = parseSqliteDate(value);
  if (!date) return -1;
  return (date.getUTCDay() + 6) % 7;
}

function formatAnalyticsNumber(value) {
  return new Intl.NumberFormat('uk-UA').format(Number(value || 0));
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = values.map((value) => Number(value || 0)).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function bucketCounts(values, buckets) {
  return buckets.map((bucket) => ({
    label: bucket.label,
    value: values.filter((value) => bucket.test(Number(value || 0))).length
  }));
}

function buildTimeline(period, valueGetter, keyGetter = dayKeyFromDate, labelFormatter = null) {
  const items = [];
  if (period.chartMode === 'hourly') {
    for (let index = period.windowHours - 1; index >= 0; index -= 1) {
      const date = new Date();
      date.setUTCMinutes(0, 0, 0);
      date.setUTCHours(date.getUTCHours() - index);
      const key = date.toISOString().slice(0, 13) + ':00';
      items.push({
        key,
        label: date.toISOString().slice(11, 16),
        value: Number(valueGetter(key) || 0)
      });
    }
    return items;
  }

  for (let index = period.windowDays - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - index);
    const key = date.toISOString().slice(0, 10);
    items.push({
      key,
      label: labelFormatter ? labelFormatter(key) : key.slice(5).split('-').reverse().join('.'),
      value: Number(valueGetter(key) || 0)
    });
  }
  return items;
}

function buildSeriesFromCounts(period, countsMap) {
  return buildTimeline(period, (key) => countsMap.get(key) || 0);
}

function countBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function normalizeConversationState(conversation) {
  const status = String(conversation.status || '').trim().toLowerCase();
  if (status === 'closed') return 'Closed';
  if (status === 'waiting_operator') return 'Waiting';
  if (status === 'human') return 'Human';
  return 'AI';
}

function hasHumanHandling(conversation) {
  return Number(conversation.operator_message_count || 0) > 0 || Boolean(conversation.human_replied_at || conversation.assigned_operator || conversation.last_operator);
}

function hasAiHandling(conversation) {
  return Number(conversation.ai_message_count || 0) > 0 || !hasHumanHandling(conversation);
}

function getConversationDurationSeconds(conversation) {
  const start = parseSqliteDate(conversation.created_at);
  const end = parseSqliteDate(conversation.closed_at || conversation.last_message_actual_at || conversation.last_message_at);
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

function getFirstResponseDelaySeconds(conversation) {
  const firstVisitor = parseSqliteDate(conversation.first_visitor_message_at || conversation.created_at);
  const firstReply = parseSqliteDate(conversation.first_operator_reply_at || conversation.first_ai_reply_at || conversation.human_replied_at);
  if (!firstVisitor || !firstReply) return 0;
  return Math.max(0, Math.round((firstReply.getTime() - firstVisitor.getTime()) / 1000));
}

function deriveConversationSummaries(dataset) {
  return dataset.conversations.map((conversation) => {
    const humanHandled = hasHumanHandling(conversation);
    const aiHandled = hasAiHandling(conversation);
    const responseDelaySeconds = getFirstResponseDelaySeconds(conversation);
    const durationSeconds = getConversationDurationSeconds(conversation);
    const unanswered = Number(conversation.visitor_message_count || 0) > 0 && Number(conversation.operator_message_count || 0) === 0 && Number(conversation.ai_message_count || 0) === 0;
    const abandoned = unanswered && durationSeconds >= 1800;
    const longWait = responseDelaySeconds >= 900;
    return Object.assign({}, conversation, {
      humanHandled,
      aiHandled,
      responseDelaySeconds,
      durationSeconds,
      unanswered,
      abandoned,
      longWait,
      uiStatus: normalizeConversationState(conversation)
    });
  });
}

function buildMetric(label, value, tone, meta, previousValue, compareEnabled) {
  const metric = {
    label,
    value: typeof value === 'number' ? formatAnalyticsNumber(value) : String(value),
    tone: tone || 'blue',
    meta: meta || ''
  };
  if (compareEnabled) {
    const currentNumber = Number(value || 0);
    const previousNumber = Number(previousValue || 0);
    const delta = previousNumber ? ((currentNumber - previousNumber) / previousNumber) * 100 : (currentNumber ? 100 : 0);
    metric.compare = {
      label: delta === 0 ? 'No change' : (delta > 0 ? 'Up ' : 'Down ') + Math.abs(delta).toFixed(1) + '%',
      direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral'
    };
  }
  return metric;
}

function buildSimpleTable(columns, rows) {
  return { kind: 'table', columns, rows };
}

function buildAnalyticsPageDefinition(section, item, current, previous, options = {}) {
  const conversations = deriveConversationSummaries(current);
  const previousConversations = deriveConversationSummaries(previous);
  const conversationById = new Map(conversations.map((item) => [String(item.conversation_id), item]));
  const messagesByConversation = groupBy(current.messages, (item) => String(item.conversation_id));
  const eventsByType = countBy(current.events, (item) => String(item.event_type || '').trim().toLowerCase());
  const contactConversationIds = new Set(current.contacts.map((contact) => String(contact.conversationId || '').trim()).filter(Boolean));
  const operatorOptions = Array.from(new Set(
    conversations.flatMap((item) => [item.assigned_operator, item.last_operator]).concat(
      current.messages.filter((item) => item.sender_type === 'operator').map((item) => item.sender_name)
    ).map((value) => String(value || '').trim()).filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));
  const compareEnabled = Boolean(options.compare);

  function topSourcePages(limit = 8) {
    const counts = countBy(conversations.filter((item) => item.source_page), (item) => String(item.source_page || '/'));
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  function recentConversationRows(limit = 8) {
    return conversations
      .slice()
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
      .slice(0, limit)
      .map((conversation) => ({
        name: conversation.visitor_id || conversation.external_user_id || conversation.conversation_id,
        channel: String(conversation.channel || 'web'),
        status: conversation.uiStatus,
        source: conversation.source_page || '—',
        messages: formatAnalyticsNumber(conversation.message_count || 0)
      }));
  }

  function dailyCounts(filterFn) {
    const map = countBy(conversations.filter(filterFn || (() => true)), (item) => {
      const date = parseSqliteDate(item.created_at);
      return current.period.chartMode === 'hourly'
        ? (date ? date.toISOString().slice(0, 13) + ':00' : '')
        : dayKeyFromDate(item.created_at);
    });
    return buildSeriesFromCounts(current.period, map);
  }

  function messageTimeline(senderType) {
    const rows = senderType
      ? current.messages.filter((item) => String(item.sender_type || '') === senderType)
      : current.messages;
    const map = countBy(rows, (item) => {
      const date = parseSqliteDate(item.created_at);
      return current.period.chartMode === 'hourly'
        ? (date ? date.toISOString().slice(0, 13) + ':00' : '')
        : dayKeyFromDate(item.created_at);
    });
    return buildSeriesFromCounts(current.period, map);
  }

  function statusBars() {
    return [
      { label: 'Open', value: conversations.filter((item) => item.status !== 'closed').length, tone: 'blue' },
      { label: 'Closed', value: conversations.filter((item) => item.status === 'closed').length, tone: 'green' },
      { label: 'Waiting', value: conversations.filter((item) => item.status === 'waiting_operator').length, tone: 'amber' },
      { label: 'Human', value: conversations.filter((item) => item.humanHandled).length, tone: 'purple' }
    ];
  }

  function satisfactionReasons() {
    const map = countBy(current.feedback, (item) => String(item.ease || 'unspecified').trim() || 'unspecified');
    return Array.from(map.entries()).map(([label, value]) => ({ label, value, tone: 'amber' })).sort((a, b) => b.value - a.value);
  }

  function feedbackTrend() {
    const up = countBy(current.feedback.filter((item) => item.rating === 'up'), (item) => dayKeyFromDate(item.created_at));
    const down = countBy(current.feedback.filter((item) => item.rating === 'down'), (item) => dayKeyFromDate(item.created_at));
    const labels = buildSeriesFromCounts(current.period, new Map()).map((item) => item.label);
    return {
      labels,
      series: [
        { label: 'Good', color: '#2f9e44', values: buildSeriesFromCounts(current.period, up).map((item) => item.value) },
        { label: 'Bad', color: '#e03131', values: buildSeriesFromCounts(current.period, down).map((item) => item.value) }
      ]
    };
  }

  function durationValues() {
    return conversations.map((item) => item.durationSeconds).filter((value) => value > 0).map((value) => Math.round(value / 60));
  }

  function responseValues() {
    return conversations.map((item) => item.responseDelaySeconds).filter((value) => value > 0);
  }

  function weekdayHeatmap() {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
    const cells = weekdays.map(() => Array.from({ length: 24 }, () => 0));
    conversations.forEach((conversation) => {
      const weekday = weekdayIndexFromDate(conversation.created_at);
      const date = parseSqliteDate(conversation.created_at);
      if (weekday < 0 || !date) return;
      cells[weekday][date.getUTCHours()] += 1;
    });
    return { xLabels: hours, yLabels: weekdays, cells };
  }

  function aiUsageCounts() {
    const rows = current.events.filter((item) => /^ai_/.test(String(item.event_type || '')));
    return {
      draft: rows.filter((item) => item.event_type === 'ai_draft_used').length,
      improve: rows.filter((item) => item.event_type === 'ai_improve_used').length,
      translate: rows.filter((item) => item.event_type === 'ai_translate_used').length,
      askAi: rows.filter((item) => item.event_type === 'ai_sidebar_used').length,
      selectedAskAi: rows.filter((item) => item.event_type === 'ai_sidebar_used' && item.payload && item.payload.selectedText).length
    };
  }

  function aiFailureCounts() {
    return current.events.filter((item) => /^ai_.*failed$/.test(String(item.event_type || '')));
  }

  function operatorLeaderboardRows() {
    const perf = buildOperatorPerformanceAnalytics(current.period);
    return perf.rows.map((item) => ({
      operator: item.operator,
      assigned: formatAnalyticsNumber(item.assignedChatsCount),
      replies: formatAnalyticsNumber(item.humanRepliesCount),
      closed: formatAnalyticsNumber(item.closedChatsCount),
      messages: formatAnalyticsNumber(item.messagesSentCount),
      response: formatDuration(item.averageFirstResponseTimeSeconds)
    }));
  }

  function topQuestionSamples(limit = 6) {
    const topics = buildTopicAnalytics(current.messages.filter((item) => item.sender_type === 'visitor').map((item) => ({
      conversation_id: item.conversation_id,
      message_text: item.message_text
    })));
    return topics.slice(0, limit).map((topic) => ({
      intent: topic.label,
      count: formatAnalyticsNumber(topic.count),
      sample: current.messages.find((message) => String(message.message_text || '').toLowerCase().includes(String(topic.label || '').toLowerCase().split(' ')[0]))?.message_text || '—'
    }));
  }

  function recommendationCards() {
    const cards = [];
    const replyRate = conversations.length ? (conversations.filter((item) => item.humanHandled || item.aiHandled).length / conversations.length) * 100 : 0;
    const waitingChats = conversations.filter((item) => item.status === 'waiting_operator').length;
    if (waitingChats > 0) {
      cards.push({
        title: 'Reduce waiting queue',
        text: waitingChats + ' chats are waiting for an operator. Consider rebalancing assignments during peak hours.',
        action: 'Add operator coverage for peak slots'
      });
    }
    if (replyRate < 80) {
      cards.push({
        title: 'Improve first reply coverage',
        text: 'Reply coverage is below 80% in the selected period. Review missed and abandoned chats.',
        action: 'Audit Missed chats and Availability pages'
      });
    }
    if (!cards.length) {
      cards.push({
        title: 'System looks stable',
        text: 'Current reply coverage and queue levels look healthy for the selected period.',
        action: 'Track trend changes week over week'
      });
    }
    return cards;
  }

  const pages = {
    'chats/overview': function () {
      const total = conversations.length;
      const previousTotal = previousConversations.length;
      const open = conversations.filter((item) => item.status !== 'closed').length;
      const closed = conversations.filter((item) => item.status === 'closed').length;
      const waiting = conversations.filter((item) => item.status === 'waiting_operator').length;
      const aiHandled = conversations.filter((item) => item.aiHandled && !item.humanHandled).length;
      const humanHandled = conversations.filter((item) => item.humanHandled).length;
      const newChats = conversations.filter((item) => Number(item.unread_count || 0) > 0 || (!item.humanHandled && item.status !== 'closed')).length;
      return {
        title: 'Chats / Overview',
        subtitle: 'Core conversation health, volumes, and status split.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Total chats', total, 'blue', 'All conversations in selected period', previousTotal, compareEnabled),
            buildMetric('New chats', newChats, 'purple', 'Unread or not yet handled', 0, compareEnabled),
            buildMetric('Open chats', open, 'green', 'Not closed', 0, compareEnabled),
            buildMetric('Closed chats', closed, 'amber', 'Closed in selected period', 0, compareEnabled),
            buildMetric('Waiting chats', waiting, 'amber', 'Waiting for operator', 0, compareEnabled),
            buildMetric('AI handled', aiHandled, 'blue', 'Resolved without operator', 0, compareEnabled),
            buildMetric('Human handled', humanHandled, 'purple', 'Handled by operator', 0, compareEnabled)
          ]},
          { type: 'grid', columns: 'minmax(0, 1.6fr) minmax(300px, 1fr)', widgets: [
            { kind: 'line', title: 'Chats per day', subtitle: current.period.label, labels: dailyCounts(() => true).map((item) => item.label), series: [{ label: 'Chats', color: '#3b5bdb', values: dailyCounts(() => true).map((item) => item.value) }] },
            { kind: 'donut', title: 'AI vs Human', subtitle: current.period.label, totalLabel: 'Handled chats', segments: [
              { label: 'AI', value: aiHandled, color: '#3b5bdb' },
              { label: 'Human', value: humanHandled, color: '#f59f00' }
            ]}
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'bars', title: 'Status breakdown', subtitle: current.period.label, items: statusBars() },
            Object.assign({ title: 'Top source pages', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'page', label: 'Page' }, { key: 'count', label: 'Chats', align: 'right' }],
              topSourcePages().map((item) => ({ page: item.label, count: formatAnalyticsNumber(item.value) }))
            ))
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Recent conversations', subtitle: 'Latest conversations in selected period' }, buildSimpleTable(
              [{ key: 'name', label: 'Visitor' }, { key: 'channel', label: 'Channel' }, { key: 'status', label: 'Status' }, { key: 'source', label: 'Source page' }, { key: 'messages', label: 'Messages', align: 'right' }],
              recentConversationRows()
            ))
          ]}
        ]
      };
    },
    'chats/engagement': function () {
      const avgTotal = average(conversations.map((item) => item.message_count));
      const avgVisitor = average(conversations.map((item) => item.visitor_message_count));
      const avgOperator = average(conversations.map((item) => item.operator_message_count));
      const replyRate = percent(conversations.filter((item) => item.humanHandled).length, conversations.length);
      const chatsAbove3 = conversations.filter((item) => Number(item.message_count || 0) > 3).length;
      const histogram = bucketCounts(conversations.map((item) => item.message_count), [
        { label: '1', test: (value) => value === 1 },
        { label: '2', test: (value) => value === 2 },
        { label: '3', test: (value) => value === 3 },
        { label: '4-5', test: (value) => value >= 4 && value <= 5 },
        { label: '6-10', test: (value) => value >= 6 && value <= 10 },
        { label: '11+', test: (value) => value >= 11 }
      ]);
      const engagementPerDay = countBy(conversations, (item) => dayKeyFromDate(item.created_at));
      const messagesPerDay = countBy(current.messages, (item) => dayKeyFromDate(item.created_at));
      const engagementSeries = buildSeriesFromCounts(current.period, engagementPerDay);
      return {
        title: 'Chats / Engagement',
        subtitle: 'Depth of conversation and reply intensity.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Avg messages / chat', avgTotal.toFixed(1), 'blue', 'Total messages per conversation'),
            buildMetric('Avg customer msgs', avgVisitor.toFixed(1), 'green', 'Visitor messages per conversation'),
            buildMetric('Avg operator msgs', avgOperator.toFixed(1), 'amber', 'Operator messages per conversation'),
            buildMetric('Reply rate', percent(conversations.filter((item) => item.humanHandled).length, conversations.length).toFixed(1) + '%', 'purple', 'Chats with operator reply'),
            buildMetric('Chats > 3 messages', chatsAbove3, 'blue', 'More than three total messages')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'bars', title: 'Messages per conversation', subtitle: current.period.label, items: histogram.map((item) => ({ label: item.label, value: item.value, tone: 'blue' })) },
            { kind: 'line', title: 'Engagement trend', subtitle: current.period.label, labels: engagementSeries.map((item) => item.label), series: [
              { label: 'Chats', color: '#3b5bdb', values: engagementSeries.map((item) => item.value) },
              { label: 'Messages', color: '#7048e8', values: buildSeriesFromCounts(current.period, messagesPerDay).map((item) => item.value) }
            ]}
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Most engaged conversations', subtitle: 'Highest message count' }, buildSimpleTable(
              [{ key: 'visitor', label: 'Visitor' }, { key: 'messages', label: 'Messages', align: 'right' }, { key: 'visitorMsgs', label: 'Visitor', align: 'right' }, { key: 'operatorMsgs', label: 'Operator', align: 'right' }],
              conversations.slice().sort((a, b) => Number(b.message_count || 0) - Number(a.message_count || 0)).slice(0, 10).map((item) => ({
                visitor: item.visitor_id || item.external_user_id || item.conversation_id,
                messages: formatAnalyticsNumber(item.message_count),
                visitorMsgs: formatAnalyticsNumber(item.visitor_message_count),
                operatorMsgs: formatAnalyticsNumber(item.operator_message_count)
              }))
            ))
          ]}
        ]
      };
    },
    'chats/missed-chats': function () {
      const unanswered = conversations.filter((item) => item.unanswered);
      const abandoned = conversations.filter((item) => item.abandoned);
      const longWait = conversations.filter((item) => item.longWait);
      return {
        title: 'Chats / Missed chats',
        subtitle: 'Identify chats with no reply, abandonment, or long delays.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Unanswered chats', unanswered.length, 'red', 'No AI or operator reply'),
            buildMetric('Abandoned chats', abandoned.length, 'amber', 'No follow-up after visitor request'),
            buildMetric('Long wait chats', longWait.length, 'purple', 'First response over 15 minutes')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'line', title: 'Missed chats by day', subtitle: current.period.label, labels: dailyCounts((item) => item.unanswered || item.abandoned || item.longWait).map((item) => item.label), series: [{ label: 'Missed', color: '#e03131', values: dailyCounts((item) => item.unanswered || item.abandoned || item.longWait).map((item) => item.value) }] },
            { kind: 'bars', title: 'Missed reason breakdown', subtitle: current.period.label, items: [
              { label: 'Unanswered', value: unanswered.length, tone: 'red' },
              { label: 'Abandoned', value: abandoned.length, tone: 'amber' },
              { label: 'Long wait', value: longWait.length, tone: 'purple' }
            ] }
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Missed conversation list', subtitle: 'Latest affected conversations' }, buildSimpleTable(
              [{ key: 'visitor', label: 'Visitor' }, { key: 'reason', label: 'Reason' }, { key: 'wait', label: 'Wait', align: 'right' }, { key: 'status', label: 'Status' }],
              conversations.filter((item) => item.unanswered || item.abandoned || item.longWait).slice(0, 12).map((item) => ({
                visitor: item.visitor_id || item.conversation_id,
                reason: item.abandoned ? 'Abandoned' : item.longWait ? 'Long wait' : 'Unanswered',
                wait: formatDuration(item.responseDelaySeconds),
                status: item.uiStatus
              }))
            ))
          ]}
        ]
      };
    },
    'chats/satisfaction': function () {
      const total = current.feedback.length;
      const good = current.feedback.filter((item) => item.rating === 'up').length;
      const bad = current.feedback.filter((item) => item.rating === 'down').length;
      return {
        title: 'Chats / Satisfaction',
        subtitle: 'Customer feedback ratings and reasons.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Total feedback', total, 'blue', 'Feedback records'),
            buildMetric('Good / bad ratio', bad ? (good / bad).toFixed(1) + 'x' : (good ? '100%' : '0'), 'green', 'Positive versus negative'),
            buildMetric('Good feedback', good, 'green', 'Thumbs up'),
            buildMetric('Bad feedback', bad, 'red', 'Thumbs down')
          ]},
          { type: 'grid', columns: 'minmax(0, 320px) minmax(0, 1fr)', widgets: [
            { kind: 'donut', title: 'Good vs bad', subtitle: current.period.label, totalLabel: 'Feedback', segments: [
              { label: 'Good', value: good, color: '#2f9e44' },
              { label: 'Bad', value: bad, color: '#e03131' }
            ]},
            { kind: 'bars', title: 'Reasons breakdown', subtitle: current.period.label, items: satisfactionReasons() }
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            { kind: 'line', title: 'Satisfaction trend', subtitle: current.period.label, labels: feedbackTrend().labels, series: feedbackTrend().series },
            Object.assign({ title: 'Feedback records', subtitle: 'Latest feedback entries' }, buildSimpleTable(
              [{ key: 'conversation', label: 'Conversation' }, { key: 'rating', label: 'Rating' }, { key: 'ease', label: 'Ease' }, { key: 'comment', label: 'Comment' }],
              current.feedback.slice(0, 12).map((item) => ({
                conversation: item.conversation_id,
                rating: item.rating,
                ease: item.ease || '—',
                comment: item.comment || '—'
              }))
            ))
          ]}
        ]
      };
    },
    'chats/duration': function () {
      const values = durationValues();
      return {
        title: 'Chats / Duration',
        subtitle: 'How long conversations stay active.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Avg duration', formatDuration(average(values) * 60), 'blue', 'Average conversation duration'),
            buildMetric('Median duration', formatDuration(median(values) * 60), 'green', 'Median conversation duration'),
            buildMetric('Longest chat', formatDuration(Math.max.apply(null, values.concat([0])) * 60), 'amber', 'Maximum duration'),
            buildMetric('Shortest chat', formatDuration(Math.min.apply(null, values.concat([0])) * 60), 'purple', 'Minimum duration')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'bars', title: 'Duration histogram', subtitle: current.period.label, items: bucketCounts(values, [
              { label: '<5m', test: (value) => value < 5 },
              { label: '5-15m', test: (value) => value >= 5 && value < 15 },
              { label: '15-30m', test: (value) => value >= 15 && value < 30 },
              { label: '30-60m', test: (value) => value >= 30 && value < 60 },
              { label: '60m+', test: (value) => value >= 60 }
            ]).map((item) => ({ label: item.label, value: item.value, tone: 'blue' })) },
            { kind: 'line', title: 'Duration trend', subtitle: current.period.label, labels: buildSeriesFromCounts(current.period, countBy(conversations, (item) => dayKeyFromDate(item.created_at))).map((item) => item.label), series: [
              { label: 'Avg duration (min)', color: '#7048e8', values: buildSeriesFromCounts(current.period, countBy(conversations, (item) => dayKeyFromDate(item.created_at))).map((item) => {
                const dayItems = conversations.filter((row) => dayKeyFromDate(row.created_at) === item.key);
                return Number(average(dayItems.map((row) => row.durationSeconds / 60)).toFixed(1));
              }) }
            ]}
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Longest chats', subtitle: 'Top duration conversations' }, buildSimpleTable(
              [{ key: 'visitor', label: 'Visitor' }, { key: 'duration', label: 'Duration', align: 'right' }, { key: 'status', label: 'Status' }, { key: 'messages', label: 'Messages', align: 'right' }],
              conversations.slice().sort((a, b) => b.durationSeconds - a.durationSeconds).slice(0, 10).map((item) => ({
                visitor: item.visitor_id || item.conversation_id,
                duration: formatDuration(item.durationSeconds),
                status: item.uiStatus,
                messages: formatAnalyticsNumber(item.message_count)
              }))
            ))
          ]}
        ]
      };
    },
    'chats/availability': function () {
      const hourCounts = Array.from({ length: 24 }, (_, index) => ({
        label: String(index).padStart(2, '0') + ':00',
        value: conversations.filter((item) => {
          const date = parseSqliteDate(item.created_at);
          return date && date.getUTCHours() === index;
        }).length,
        tone: 'blue'
      }));
      const heatmap = weekdayHeatmap();
      const peakSlots = hourCounts.slice().sort((a, b) => b.value - a.value).slice(0, 8);
      return {
        title: 'Chats / Availability',
        subtitle: 'When chats arrive and peak load windows.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Peak hour', peakSlots[0] ? peakSlots[0].label : '—', 'blue', 'Highest chat volume hour'),
            buildMetric('Peak volume', peakSlots[0] ? peakSlots[0].value : 0, 'green', 'Chats in busiest hour'),
            buildMetric('Weekday spread', conversations.length ? new Set(conversations.map((item) => weekdayIndexFromDate(item.created_at))).size : 0, 'amber', 'Active weekdays'),
            buildMetric('Hourly coverage', hourCounts.filter((item) => item.value > 0).length, 'purple', 'Hours with chat activity')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'heatmap', title: 'Hour / day heatmap', subtitle: current.period.label, xLabels: heatmap.xLabels, yLabels: heatmap.yLabels, cells: heatmap.cells },
            { kind: 'bars', title: 'Chats by hour', subtitle: current.period.label, items: hourCounts }
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Peak time slots', subtitle: 'Top hours by chat volume' }, buildSimpleTable(
              [{ key: 'slot', label: 'Time slot' }, { key: 'chats', label: 'Chats', align: 'right' }],
              peakSlots.map((item) => ({ slot: item.label, chats: formatAnalyticsNumber(item.value) }))
            ))
          ]}
        ]
      };
    },
    'ai/overview': function () {
      const total = conversations.length || 1;
      const aiOnly = conversations.filter((item) => item.aiHandled && !item.humanHandled).length;
      const humanTakeover = conversations.filter((item) => item.humanHandled).length;
      const aiResolved = conversations.filter((item) => item.status === 'closed' && item.aiHandled && !item.humanHandled).length;
      const summaryCount = Number(eventsByType.get('lead_summary_captured') || 0) + Number(eventsByType.get('ai_summary_generated') || 0);
      return {
        title: 'AI / Overview',
        subtitle: 'AI coverage, takeover, and resolution mix.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('AI handled %', percent(aiOnly, total).toFixed(1) + '%', 'blue', 'Resolved without operator'),
            buildMetric('Human takeover %', percent(humanTakeover, total).toFixed(1) + '%', 'amber', 'Chats escalated to operator'),
            buildMetric('AI-only resolved', aiResolved, 'green', 'Closed without operator'),
            buildMetric('Summary generated', summaryCount, 'purple', 'AI summaries captured/generated')
          ]},
          { type: 'grid', columns: 'minmax(0, 320px) minmax(0, 1fr)', widgets: [
            { kind: 'donut', title: 'AI vs Human', subtitle: current.period.label, totalLabel: 'Handled chats', segments: [
              { label: 'AI', value: aiOnly, color: '#3b5bdb' },
              { label: 'Human', value: humanTakeover, color: '#f59f00' }
            ]},
            { kind: 'line', title: 'AI trend', subtitle: current.period.label, labels: dailyCounts(() => true).map((item) => item.label), series: [
              { label: 'AI only', color: '#3b5bdb', values: dailyCounts((item) => item.aiHandled && !item.humanHandled).map((item) => item.value) },
              { label: 'Human takeover', color: '#f59f00', values: dailyCounts((item) => item.humanHandled).map((item) => item.value) }
            ] }
          ]}
        ]
      };
    },
    'ai/performance': function () {
      const aiFirstResponseSamples = conversations.map((item) => {
        const start = parseSqliteDate(item.first_visitor_message_at || item.created_at);
        const firstAi = parseSqliteDate(item.first_ai_reply_at);
        return start && firstAi ? Math.max(0, Math.round((firstAi - start) / 1000)) : 0;
      }).filter(Boolean);
      const aiHandled = conversations.filter((item) => item.aiHandled).length;
      const aiResolved = conversations.filter((item) => item.status === 'closed' && item.aiHandled && !item.humanHandled).length;
      const handoffs = current.events.filter((item) => item.event_type === 'escalated_to_human' || item.event_type === 'lead_ready_for_handoff');
      const leadsAfterAi = conversations.filter((item) => contactConversationIds.has(String(item.conversation_id || '')) && item.aiHandled && !item.humanHandled).length;
      const handoffReasonBars = Array.from(countBy(handoffs, (item) => String(item.payload.reason || 'unknown')).entries()).map(([label, value]) => ({ label, value, tone: 'amber' })).sort((a, b) => b.value - a.value);
      return {
        title: 'AI / Performance',
        subtitle: 'Response speed, resolution, and handoff behavior.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('AI first response', formatDuration(average(aiFirstResponseSamples)), 'blue', 'Average AI first reply time'),
            buildMetric('AI resolution rate', percent(aiResolved, aiHandled || 1).toFixed(1) + '%', 'green', 'AI-only closed chats'),
            buildMetric('Handoff rate', percent(handoffs.length, conversations.length || 1).toFixed(1) + '%', 'amber', 'Escalated to human'),
            buildMetric('Lead capture after AI', leadsAfterAi, 'purple', 'Contacts collected on AI-led chats')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'line', title: 'AI success trend', subtitle: current.period.label, labels: dailyCounts(() => true).map((item) => item.label), series: [
              { label: 'AI resolved', color: '#2f9e44', values: dailyCounts((item) => item.status === 'closed' && item.aiHandled && !item.humanHandled).map((item) => item.value) },
              { label: 'Handoffs', color: '#f59f00', values: dailyCounts((item) => item.humanHandled).map((item) => item.value) }
            ] },
            { kind: 'bars', title: 'Handoff reasons', subtitle: current.period.label, items: handoffReasonBars.length ? handoffReasonBars : [{ label: 'No handoff reasons yet', value: 0, tone: 'amber' }] }
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            Object.assign({ title: 'Successful AI chats', subtitle: 'Closed without operator' }, buildSimpleTable(
              [{ key: 'visitor', label: 'Visitor' }, { key: 'status', label: 'Status' }, { key: 'messages', label: 'Messages', align: 'right' }],
              conversations.filter((item) => item.status === 'closed' && item.aiHandled && !item.humanHandled).slice(0, 10).map((item) => ({
                visitor: item.visitor_id || item.conversation_id,
                status: item.uiStatus,
                messages: formatAnalyticsNumber(item.message_count)
              }))
            )),
            Object.assign({ title: 'Failed / escalated chats', subtitle: 'Human handoff cases' }, buildSimpleTable(
              [{ key: 'visitor', label: 'Visitor' }, { key: 'reason', label: 'Reason' }, { key: 'status', label: 'Status' }],
              handoffs.slice(0, 10).map((item) => ({
                visitor: item.conversation_id,
                reason: String(item.payload.reason || item.event_type || 'unknown'),
                status: 'Escalated'
              }))
            ))
          ]}
        ]
      };
    },
    'ai/usage': function () {
      const counts = aiUsageCounts();
      const aiEvents = current.events.filter((item) => /^ai_.*used$/.test(String(item.event_type || '')));
      const byOperator = countBy(aiEvents, (item) => String(item.payload.operator || conversationById.get(String(item.conversation_id || ''))?.assigned_operator || 'Unassigned'));
      return {
        title: 'AI / Usage',
        subtitle: 'How operators use AI tools in inbox.',
        filters: { operator: true },
        rows: [
          { type: 'metrics', items: [
            buildMetric('AI Draft used', counts.draft, 'blue', 'Draft generations'),
            buildMetric('Improve used', counts.improve, 'green', 'Polish / improve requests'),
            buildMetric('Translate used', counts.translate, 'amber', 'Translate requests'),
            buildMetric('Ask AI used', counts.askAi, 'purple', 'Sidebar AI workspace requests'),
            buildMetric('Selected text Ask AI', counts.selectedAskAi, 'purple', 'Selection-triggered Ask AI')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'bars', title: 'AI tools usage', subtitle: current.period.label, items: [
              { label: 'Draft', value: counts.draft, tone: 'blue' },
              { label: 'Improve', value: counts.improve, tone: 'green' },
              { label: 'Translate', value: counts.translate, tone: 'amber' },
              { label: 'Ask AI', value: counts.askAi, tone: 'purple' }
            ]},
            { kind: 'line', title: 'Usage over time', subtitle: current.period.label, labels: buildSeriesFromCounts(current.period, countBy(aiEvents, (item) => dayKeyFromDate(item.created_at))).map((item) => item.label), series: [
              { label: 'AI actions', color: '#7048e8', values: buildSeriesFromCounts(current.period, countBy(aiEvents, (item) => dayKeyFromDate(item.created_at))).map((item) => item.value) }
            ] }
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Top operators using AI tools', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'operator', label: 'Operator' }, { key: 'actions', label: 'AI actions', align: 'right' }],
              Array.from(byOperator.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([operatorName, count]) => ({
                operator: operatorName,
                actions: formatAnalyticsNumber(count)
              }))
            ))
          ]}
        ]
      };
    },
    'ai/failures': function () {
      const failures = aiFailureCounts();
      const typeBars = Array.from(countBy(failures, (item) => String(item.event_type || 'unknown')).entries()).map(([label, value]) => ({ label, value, tone: 'red' })).sort((a, b) => b.value - a.value);
      return {
        title: 'AI / Failures',
        subtitle: 'Logged AI handler failures and provider issues.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('AI errors count', failures.length, 'red', 'All logged AI failures'),
            buildMetric('Invalid summary format', failures.filter((item) => /summary/i.test(String(item.payload.error || ''))).length, 'amber', 'Summary parse/format failures'),
            buildMetric('Provider/model failures', failures.filter((item) => /provider|model|openai|kimi|openrouter/i.test(String(item.payload.error || ''))).length, 'purple', 'Provider-specific errors')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'line', title: 'AI errors by day', subtitle: current.period.label, labels: buildSeriesFromCounts(current.period, countBy(failures, (item) => dayKeyFromDate(item.created_at))).map((item) => item.label), series: [
              { label: 'Errors', color: '#e03131', values: buildSeriesFromCounts(current.period, countBy(failures, (item) => dayKeyFromDate(item.created_at))).map((item) => item.value) }
            ] },
            { kind: 'bars', title: 'Failure types', subtitle: current.period.label, items: typeBars.length ? typeBars : [{ label: 'No failures logged', value: 0, tone: 'green' }] }
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Recent AI errors', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'time', label: 'Time' }, { key: 'type', label: 'Type' }, { key: 'conversation', label: 'Conversation' }, { key: 'message', label: 'Error' }],
              failures.slice(-20).reverse().map((item) => ({
                time: String(item.created_at || ''),
                type: String(item.event_type || ''),
                conversation: String(item.conversation_id || ''),
                message: String(item.payload.error || '—')
              }))
            ))
          ]}
        ]
      };
    },
    'agents/performance': function () {
      const perf = buildOperatorPerformanceAnalytics(current.period);
      const rows = perf.rows;
      return {
        title: 'Agents / Performance',
        subtitle: 'Assignment, closure, replies, and capture by operator.',
        filters: { operator: true },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Assigned chats', rows.reduce((sum, item) => sum + item.assignedChatsCount, 0), 'blue', 'Total assigned chats'),
            buildMetric('Closed chats', rows.reduce((sum, item) => sum + item.closedChatsCount, 0), 'green', 'Closed by operators'),
            buildMetric('Replies sent', rows.reduce((sum, item) => sum + item.humanRepliesCount, 0), 'amber', 'Chats with human replies'),
            buildMetric('Lead captures', current.contacts.length, 'purple', 'Contacts created in selected period'),
            buildMetric('Feedback score', current.feedback.length ? percent(current.feedback.filter((item) => item.rating === 'up').length, current.feedback.length).toFixed(1) + '%' : '0%', 'green', 'Positive feedback share')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'bars', title: 'Chats closed by operator', subtitle: current.period.label, items: rows.map((item) => ({ label: item.operator, value: item.closedChatsCount, tone: 'green' })) },
            { kind: 'bars', title: 'Leads by operator', subtitle: current.period.label, items: rows.map((item) => ({ label: item.operator, value: conversations.filter((row) => row.assigned_operator === item.operator && contactConversationIds.has(String(row.conversation_id || ''))).length, tone: 'purple' })) }
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Operator leaderboard', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'operator', label: 'Operator' }, { key: 'assigned', label: 'Assigned', align: 'right' }, { key: 'replies', label: 'Replies', align: 'right' }, { key: 'closed', label: 'Closed', align: 'right' }, { key: 'messages', label: 'Messages', align: 'right' }, { key: 'response', label: 'Avg response', align: 'right' }],
              operatorLeaderboardRows()
            ))
          ]}
        ]
      };
    },
    'agents/response-time': function () {
      const perf = buildOperatorPerformanceAnalytics(current.period);
      const responseRows = perf.rows.filter((item) => item.responseTimeSamples > 0);
      const breaches = conversations.filter((item) => item.responseDelaySeconds > 900 && item.humanHandled).length;
      return {
        title: 'Agents / Response time',
        subtitle: 'First-response speed and SLA pressure.',
        filters: { operator: true },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Avg first response', formatDuration(average(responseRows.map((item) => item.averageFirstResponseTimeSeconds))), 'blue', 'Average first operator response'),
            buildMetric('Median response', formatDuration(median(responseValues())), 'green', 'Median operator response'),
            buildMetric('SLA breaches', breaches, 'red', 'Replies slower than 15 minutes')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'bars', title: 'Response time by operator', subtitle: current.period.label, items: responseRows.map((item) => ({ label: item.operator, value: Number(item.averageFirstResponseTimeSeconds.toFixed(0)), tone: 'blue', format: 'duration' })) },
            Object.assign({ title: 'Slowest and fastest responses', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'group', label: 'Group' }, { key: 'operator', label: 'Operator' }, { key: 'response', label: 'Avg response', align: 'right' }],
              []
                .concat(responseRows.slice().sort((a, b) => a.averageFirstResponseTimeSeconds - b.averageFirstResponseTimeSeconds).slice(0, 3).map((item) => ({ group: 'Fastest', operator: item.operator, response: formatDuration(item.averageFirstResponseTimeSeconds) })))
                .concat(responseRows.slice().sort((a, b) => b.averageFirstResponseTimeSeconds - a.averageFirstResponseTimeSeconds).slice(0, 3).map((item) => ({ group: 'Slowest', operator: item.operator, response: formatDuration(item.averageFirstResponseTimeSeconds) })))
            ))
          ]}
        ]
      };
    },
    'agents/activity': function () {
      const operatorMessages = current.messages.filter((item) => item.sender_type === 'operator');
      const byOperator = Array.from(countBy(operatorMessages, (item) => String(item.sender_name || 'Unassigned')).entries()).map(([label, value]) => ({ label, value, tone: 'blue' })).sort((a, b) => b.value - a.value);
      const aiEvents = current.events.filter((item) => /^ai_.*used$/.test(String(item.event_type || '')));
      const aiByOperator = Array.from(countBy(aiEvents, (item) => String(item.payload.operator || conversationById.get(String(item.conversation_id || ''))?.assigned_operator || 'Unassigned')).entries()).map(([label, value]) => ({ label, value, tone: 'purple' })).sort((a, b) => b.value - a.value);
      return {
        title: 'Agents / Activity',
        subtitle: 'When operators are active and how much they send.',
        filters: { operator: true },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Active hours', new Set(operatorMessages.map((item) => hourLabelFromDate(item.created_at))).size, 'blue', 'Hours with operator messages'),
            buildMetric('Messages sent', operatorMessages.length, 'green', 'Operator messages in selected period'),
            buildMetric('AI tools usage', aiEvents.length, 'purple', 'AI actions linked to operators')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'heatmap', title: 'Activity heatmap', subtitle: current.period.label, xLabels: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), yLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], cells: (() => {
              const cells = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
              operatorMessages.forEach((item) => {
                const day = weekdayIndexFromDate(item.created_at);
                const date = parseSqliteDate(item.created_at);
                if (day >= 0 && date) cells[day][date.getUTCHours()] += 1;
              });
              return cells;
            })() },
            { kind: 'bars', title: 'Messages sent by operator', subtitle: current.period.label, items: byOperator }
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Daily activity by operator', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'operator', label: 'Operator' }, { key: 'messages', label: 'Messages', align: 'right' }, { key: 'aiActions', label: 'AI actions', align: 'right' }],
              byOperator.map((item) => ({
                operator: item.label,
                messages: formatAnalyticsNumber(item.value),
                aiActions: formatAnalyticsNumber((aiByOperator.find((row) => row.label === item.label) || {}).value || 0)
              }))
            ))
          ]}
        ]
      };
    },
    'customers/leads': function () {
      const withPhone = current.contacts.filter((item) => item.phone).length;
      const withEmail = current.contacts.filter((item) => item.email).length;
      const withTelegram = current.contacts.filter((item) => item.telegram || item.telegramId).length;
      const statusCounts = Array.from(countBy(current.contacts, (item) => String(item.status || 'new')).entries()).map(([label, value]) => ({ label, value, tone: 'blue' })).sort((a, b) => b.value - a.value);
      const leadTimeline = buildSeriesFromCounts(current.period, countBy(current.contacts, (item) => dayKeyFromDate(item.createdAt)));
      return {
        title: 'Customers / Leads',
        subtitle: 'Lead capture and contact quality.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Total leads', current.contacts.length, 'blue', 'Contacts created in selected period'),
            buildMetric('With phone', withPhone, 'green', 'Phone collected'),
            buildMetric('With email', withEmail, 'amber', 'Email collected'),
            buildMetric('With telegram', withTelegram, 'purple', 'Telegram collected')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 320px)', widgets: [
            { kind: 'line', title: 'Leads over time', subtitle: current.period.label, labels: leadTimeline.map((item) => item.label), series: [{ label: 'Leads', color: '#3b5bdb', values: leadTimeline.map((item) => item.value) }] },
            { kind: 'donut', title: 'Lead status distribution', subtitle: current.period.label, totalLabel: 'Leads', segments: statusCounts.map((item, index) => ({ label: item.label, value: item.value, color: ['#3b5bdb', '#2f9e44', '#f59f00', '#7048e8'][index % 4] })) }
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Latest leads', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' }, { key: 'status', label: 'Status' }, { key: 'site', label: 'Site' }],
              current.contacts.slice(0, 12).map((item) => ({
                name: item.name || '—',
                phone: item.phone || '—',
                email: item.email || '—',
                status: item.status || 'new',
                site: item.sourceSiteId || '—'
              }))
            ))
          ]}
        ]
      };
    },
    'customers/queue': function () {
      const queued = conversations.filter((item) => item.status === 'waiting_operator');
      const waitValues = queued.map((item) => {
        const start = parseSqliteDate(item.handoff_at || item.created_at);
        return start ? Math.max(0, Math.round((Date.now() - start.getTime()) / 1000)) : 0;
      }).filter(Boolean);
      const queueTimeline = buildSeriesFromCounts(current.period, countBy(conversations.filter((item) => item.status === 'waiting_operator'), (item) => dayKeyFromDate(item.created_at)));
      return {
        title: 'Customers / Queue',
        subtitle: 'Current waiting load and queue pressure.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Queued customers', queued.length, 'amber', 'Waiting for operator'),
            buildMetric('Avg wait time', formatDuration(average(waitValues)), 'blue', 'Average queue wait'),
            buildMetric('Current queue', queued.length, 'purple', 'Open waiting conversations')
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            { kind: 'line', title: 'Queue size over time', subtitle: current.period.label, labels: queueTimeline.map((item) => item.label), series: [{ label: 'Queue', color: '#f59f00', values: queueTimeline.map((item) => item.value) }] },
            Object.assign({ title: 'Longest waits', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'visitor', label: 'Visitor' }, { key: 'wait', label: 'Wait', align: 'right' }, { key: 'source', label: 'Source' }],
              queued.slice().sort((a, b) => b.responseDelaySeconds - a.responseDelaySeconds).slice(0, 12).map((item) => ({
                visitor: item.visitor_id || item.conversation_id,
                wait: formatDuration(Math.max(item.responseDelaySeconds, 0)),
                source: item.source_page || '—'
              }))
            ))
          ]}
        ]
      };
    },
    'customers/abandonment': function () {
      const abandoned = conversations.filter((item) => item.abandoned);
      const bySource = Array.from(countBy(abandoned, (item) => String(item.source_page || '/')).entries()).map(([label, value]) => ({ label, value, tone: 'red' })).sort((a, b) => b.value - a.value);
      const trend = buildSeriesFromCounts(current.period, countBy(abandoned, (item) => dayKeyFromDate(item.created_at)));
      return {
        title: 'Customers / Abandonment',
        subtitle: 'Where chats drop after no reply or no follow-up.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Abandoned chats', abandoned.length, 'red', 'Conversations abandoned by visitor'),
            buildMetric('After no reply', abandoned.filter((item) => item.unanswered).length, 'amber', 'No reply before exit'),
            buildMetric('Source pages affected', bySource.length, 'purple', 'Pages with abandonment')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'line', title: 'Abandonment trend', subtitle: current.period.label, labels: trend.map((item) => item.label), series: [{ label: 'Abandoned', color: '#e03131', values: trend.map((item) => item.value) }] },
            { kind: 'bars', title: 'Abandonment by source page', subtitle: current.period.label, items: bySource.slice(0, 8) }
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Abandoned conversation list', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'visitor', label: 'Visitor' }, { key: 'source', label: 'Source page' }, { key: 'messages', label: 'Messages', align: 'right' }],
              abandoned.slice(0, 12).map((item) => ({
                visitor: item.visitor_id || item.conversation_id,
                source: item.source_page || '—',
                messages: formatAnalyticsNumber(item.message_count)
              }))
            ))
          ]}
        ]
      };
    },
    'ecommerce/conversions': function () {
      const chats = conversations.length;
      const leads = current.contacts.length;
      const quotes = conversations.filter((item) => /quote|estimate|price|cost/i.test(String(item.source_page || ''))).length;
      const orders = 0;
      const byPage = topSourcePages();
      return {
        title: 'Ecommerce / Conversions',
        subtitle: 'Chat funnel from conversations to leads and downstream outcomes.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Chats → leads', percent(leads, chats || 1).toFixed(1) + '%', 'blue', 'Lead conversion from chats'),
            buildMetric('Leads → quotes', percent(quotes, leads || 1).toFixed(1) + '%', 'amber', 'Quote-like intents from leads'),
            buildMetric('Quotes → orders', percent(orders, quotes || 1).toFixed(1) + '%', 'green', 'Fallback to 0 if orders unavailable')
          ]},
          { type: 'grid', columns: 'minmax(0, 340px) minmax(0, 1fr)', widgets: [
            { kind: 'bars', title: 'Conversion funnel', subtitle: current.period.label, items: [
              { label: 'Chats', value: chats, tone: 'blue' },
              { label: 'Leads', value: leads, tone: 'green' },
              { label: 'Quotes', value: quotes, tone: 'amber' },
              { label: 'Orders', value: orders, tone: 'purple' }
            ]},
            Object.assign({ title: 'Best converting pages', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'page', label: 'Page' }, { key: 'chats', label: 'Chats', align: 'right' }, { key: 'leads', label: 'Leads', align: 'right' }, { key: 'rate', label: 'Lead rate', align: 'right' }],
              byPage.map((item) => {
                const leadsOnPage = current.contacts.filter((contact) => {
                  const conversation = conversationById.get(String(contact.conversationId || ''));
                  return conversation && String(conversation.source_page || '/') === item.label;
                }).length;
                return {
                  page: item.label,
                  chats: formatAnalyticsNumber(item.value),
                  leads: formatAnalyticsNumber(leadsOnPage),
                  rate: (item.value ? percent(leadsOnPage, item.value).toFixed(1) : '0.0') + '%'
                };
              })
            ))
          ]}
        ]
      };
    },
    'ecommerce/revenue': function () {
      const topValueConversations = conversations.filter((item) => /quote|estimate|price|cost/i.test(String(messagesByConversation.get(String(item.conversation_id || ''))?.map((msg) => msg.message_text).join(' ') || '')));
      return {
        title: 'Ecommerce / Revenue',
        subtitle: 'Estimated revenue footprint from high-intent conversations.',
        filters: { operator: true },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Estimated revenue', '$0', 'blue', 'No order value source connected yet'),
            buildMetric('Avg estimated value', '$0', 'green', 'Requires quote/order values'),
            buildMetric('Revenue by operator', '$0', 'amber', 'No revenue source connected')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'line', title: 'Revenue trend', subtitle: current.period.label, labels: dailyCounts(() => true).map((item) => item.label), series: [{ label: 'Revenue', color: '#3b5bdb', values: dailyCounts(() => true).map(() => 0) }] },
            { kind: 'bars', title: 'Revenue by operator', subtitle: current.period.label, items: operatorOptions.map((item) => ({ label: item, value: 0, tone: 'green' })) }
          ]},
          { type: 'grid', columns: '1fr', widgets: [
            Object.assign({ title: 'Top value conversations', subtitle: 'High-intent revenue candidates' }, buildSimpleTable(
              [{ key: 'visitor', label: 'Visitor' }, { key: 'source', label: 'Source' }, { key: 'messages', label: 'Messages', align: 'right' }, { key: 'value', label: 'Estimated value', align: 'right' }],
              topValueConversations.slice(0, 12).map((item) => ({
                visitor: item.visitor_id || item.conversation_id,
                source: item.source_page || '—',
                messages: formatAnalyticsNumber(item.message_count),
                value: '$0'
              }))
            ))
          ]}
        ]
      };
    },
    'ecommerce/products': function () {
      const productSearchEvents = current.events.filter((item) => item.event_type === 'ai_sidebar_used' && item.payload.action === 'find_products');
      const productKeywords = buildTopicAnalytics(current.messages.filter((item) => item.sender_type === 'visitor').map((item) => ({ conversation_id: item.conversation_id, message_text: item.message_text }))).slice(0, 8);
      return {
        title: 'Ecommerce / Products',
        subtitle: 'Product demand signals from conversations and product search usage.',
        filters: { operator: false },
        rows: [
          { type: 'metrics', items: [
            buildMetric('Top mentioned products', productKeywords.length, 'blue', 'Keyword-derived product topics'),
            buildMetric('Top product pages', topSourcePages().filter((item) => /product|catalog|shop/i.test(item.label)).length, 'green', 'Source pages matching product routes'),
            buildMetric('AI product search usage', productSearchEvents.length, 'purple', 'Find products actions')
          ]},
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'bars', title: 'Top products / categories', subtitle: current.period.label, items: productKeywords.map((item) => ({ label: item.label, value: item.count, tone: 'blue' })) },
            Object.assign({ title: 'Most requested products / pages', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'page', label: 'Source page' }, { key: 'chats', label: 'Chats', align: 'right' }],
              topSourcePages().slice(0, 10).map((item) => ({ page: item.label, chats: formatAnalyticsNumber(item.value) }))
            ))
          ]}
        ]
      };
    },
    'insights/top-questions': function () {
      const topQuestions = buildTopQuestionAnalytics(
        current.messages.filter((item) => item.sender_type === 'visitor').map((item) => ({
          conversation_id: item.conversation_id,
          message_text: item.message_text
        })),
        10
      );
      return {
        title: 'Insights / Top questions',
        subtitle: 'Real customer questions extracted from visitor messages.',
        filters: { operator: false },
        rows: [
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'bars', title: 'Top questions', subtitle: current.period.label, items: topQuestions.map((item) => ({ label: item.question, value: item.count, tone: 'purple' })) },
            Object.assign({ title: 'Question samples', subtitle: current.period.label }, buildSimpleTable(
              [{ key: 'question', label: 'Question' }, { key: 'count', label: 'Count', align: 'right' }, { key: 'sample', label: 'Sample' }, { key: 'view', label: '', align: 'right' }],
              topQuestions.map((item) => ({
                question: item.question,
                count: formatAnalyticsNumber(item.count),
                sample: item.samples[0] ? item.samples[0].text : '—',
                view: item.samples[0]
                  ? { type: 'link', label: 'View', href: '/inbox?conversationId=' + encodeURIComponent(item.samples[0].conversationId) }
                  : '—'
              }))
            ))
          ]}
        ]
      };
    },
    'insights/trends': function () {
      const currentTopics = buildTopicAnalytics(current.messages.filter((item) => item.sender_type === 'visitor').map((item) => ({ conversation_id: item.conversation_id, message_text: item.message_text })));
      const previousTopics = buildTopicAnalytics(previous.messages.filter((item) => item.sender_type === 'visitor').map((item) => ({ conversation_id: item.conversation_id, message_text: item.message_text })));
      const previousMap = new Map(previousTopics.map((item) => [item.label, item.count]));
      const rising = currentTopics.map((item) => ({ label: item.label, value: item.count - Number(previousMap.get(item.label) || 0), tone: 'purple' })).sort((a, b) => b.value - a.value).slice(0, 8);
      const chatTrend = dailyCounts(() => true);
      const leadTrend = buildSeriesFromCounts(current.period, countBy(current.contacts, (item) => dayKeyFromDate(item.createdAt)));
      return {
        title: 'Insights / Trends',
        subtitle: 'Rising topics and period-over-period movement.',
        filters: { operator: false },
        rows: [
          { type: 'grid', columns: 'minmax(0, 1fr) minmax(0, 1fr)', widgets: [
            { kind: 'bars', title: 'Rising topics', subtitle: 'Compared with previous period', items: rising.length ? rising : [{ label: 'No topic change yet', value: 0, tone: 'purple' }] },
            { kind: 'line', title: 'Conversation vs lead trends', subtitle: current.period.label, labels: chatTrend.map((item) => item.label), series: [
              { label: 'Chats', color: '#3b5bdb', values: chatTrend.map((item) => item.value) },
              { label: 'Leads', color: '#2f9e44', values: leadTrend.map((item) => item.value) }
            ] }
          ]}
        ]
      };
    },
    'insights/recommendations': function () {
      return {
        title: 'Insights / Recommendations',
        subtitle: 'Recommended actions based on live analytics aggregates.',
        filters: { operator: false },
        rows: [
          { type: 'grid', columns: '1fr', widgets: [
            { kind: 'insights', title: 'Recommendations', subtitle: current.period.label, items: recommendationCards() }
          ]}
        ]
      };
    },
    'export/generate-report': function () {
      return {
        title: 'Export / Generate report',
        subtitle: 'Export the current analytics view as CSV, JSON, or PDF.',
        filters: { operator: true },
        rows: [
          { type: 'grid', columns: '1fr', widgets: [
            { kind: 'export', title: 'Generate report', subtitle: 'Use current filters and section data.', options: {
              section,
              item,
              period: current.period.key
            } }
          ]}
        ]
      };
    },
    'export/scheduled-reports': function () {
      return {
        title: 'Export / Scheduled reports',
        subtitle: 'Saved schedules are not configured yet in this workspace.',
        filters: { operator: false },
        rows: [
          { type: 'grid', columns: '1fr', widgets: [
            { kind: 'empty', title: 'Scheduled reports', subtitle: 'No report schedules configured yet.' }
          ]}
        ]
      };
    }
  };

  const fallbackKey = section + '/' + item;
  const pageBuilder = pages[fallbackKey] || pages['chats/overview'];
  const page = pageBuilder();
  return Object.assign({}, page, {
    section,
    item,
    controls: {
      period: current.period.key,
      compare: compareEnabled,
      siteId: current.siteId || '',
      operator: current.operator || '',
      operatorOptions
    }
  });
}

function buildAnalyticsWorkspacePayload(rawPeriod, options = {}) {
  const period = parseAnalyticsPeriod(rawPeriod);
  const section = String(options.section || 'chats').trim().toLowerCase();
  const item = String(options.item || 'overview').trim().toLowerCase();
  const operatorRelevant = (
    (section === 'agents') ||
    (section === 'ai' && item === 'usage') ||
    (section === 'ecommerce' && item === 'revenue')
  );
  const datasetOptions = Object.assign({}, options, {
    operator: operatorRelevant ? String(options.operator || '').trim() : ''
  });
  const current = loadAnalyticsDataset(period, datasetOptions, false);
  const previous = loadAnalyticsDataset(period, datasetOptions, true);
  const page = buildAnalyticsPageDefinition(section, item, current, previous, Object.assign({}, options, {
    operator: datasetOptions.operator
  }));
  return {
    generatedAt: new Date().toLocaleString('uk-UA'),
    period: {
      key: period.key,
      label: period.label,
      subtitle: period.subtitle
    },
    page
  };
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
      managerName: config.managerName,
      managerTitle: config.managerTitle,
      managerAvatarUrl: config.managerAvatarUrl,
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

app.post('/api/conversations/:conversationId/feedback', async (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || '').trim();
    const visitorId = String(req.body?.visitorId || '').trim();
    const requestedSiteId = String(req.body?.siteId || req.query?.siteId || '').trim();
    if (!conversationId || !visitorId) {
      return res.status(400).json({ ok: false, message: 'conversationId and visitorId are required.' });
    }

    const conversation = chatService.getConversationForVisitor(conversationId, visitorId);
    if (!conversation) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }
    if (!assertConversationSiteMatch(conversation, requestedSiteId)) {
      return res.status(409).json({ ok: false, message: 'Conversation/site mismatch.' });
    }

    const payload = chatService.submitFeedback({
      conversationId,
      visitorId,
      rating: req.body?.rating,
      ease: req.body?.ease,
      comment: req.body?.comment,
      requestedBy: req.body?.requestedBy
    });

    return res.json({
      ok: true,
      conversation: payload.conversation,
      feedback: payload.feedback
    });
  } catch (error) {
    console.error('Failed to submit conversation feedback', error);
    if (error.message === 'CONVERSATION_NOT_FOUND') {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }
    if (error.message === 'FEEDBACK_NOT_REQUESTED') {
      return res.status(400).json({ ok: false, message: 'Feedback was not requested for this conversation.' });
    }
    if (error.message === 'INVALID_FEEDBACK_RATING') {
      return res.status(400).json({ ok: false, message: 'Choose thumbs up or thumbs down.' });
    }
    if (error.message === 'INVALID_FEEDBACK_EASE') {
      return res.status(400).json({ ok: false, message: 'Invalid ease of resolution option.' });
    }
    return res.status(500).json({ ok: false, message: 'Failed to submit feedback.' });
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
    if (!telegramChannelService.verifyWebhook(req.headers || {})) {
      return res.status(403).json({ ok: false });
    }

    const inbound = telegramChannelService.parseInboundUpdate(req.body || {});
    if (inbound) {
      await chatService.handleChannelInboundMessage(inbound);
    } else {
      await chatService.handleTelegramUpdate(req.body || {});
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook handling failed', error);
    return res.status(500).json({ ok: false });
  }
});

function handleMetaWebhookVerification(req, res) {
  const mode = String(req.query['hub.mode'] || '').trim();
  const challenge = String(req.query['hub.challenge'] || '').trim();
  const verifyToken = String(req.query['hub.verify_token'] || '').trim();
  const expectedVerifyToken = getIntegrationValue('meta_verify_token');
  if (mode === 'subscribe' && expectedVerifyToken && verifyToken === expectedVerifyToken) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden');
}

async function handleMetaWebhookDelivery(req, res) {
  try {
    const body = req.body || {};
    const events = [
      ...instagramChannelService.extractInboundEvents(body),
      ...facebookChannelService.extractInboundEvents(body)
    ];

    for (const event of events) {
      await chatService.handleChannelInboundMessage(event);
    }

    return res.json({ ok: true, processed: events.length });
  } catch (error) {
    console.error('Meta webhook handling failed', error);
    return res.status(500).json({ ok: false });
  }
}

app.get('/api/meta/webhook', handleMetaWebhookVerification);
app.post('/api/meta/webhook', handleMetaWebhookDelivery);
app.get('/api/instagram/webhook', handleMetaWebhookVerification);
app.post('/api/instagram/webhook', handleMetaWebhookDelivery);
app.get('/api/facebook/webhook', handleMetaWebhookVerification);
app.post('/api/facebook/webhook', handleMetaWebhookDelivery);

app.use('/api/inbox', requireInboxAuth);
app.use('/api/admin', requireInboxAuth);
app.use('/api/products', requireInboxAuth);
app.use('/inbox', requireInboxAuth);
app.use('/settings', requireInboxAuth);
app.use('/analytics', requireInboxAuth);
app.use('/contacts', requireInboxAuth);

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
    return res.json({
      ok: true,
      settings: Object.assign({}, settings, {
        aiProviderStatus: buildAiProviderStatus()
      })
    });
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
    return res.json({
      ok: true,
      settings: Object.assign({}, settings, {
        aiProviderStatus: buildAiProviderStatus()
      })
    });
  } catch (error) {
    console.error('Failed to save site settings', error);
    return res.status(500).json({ ok: false, message: 'Failed to save site settings.' });
  }
});

app.get('/api/admin/integrations', (req, res) => {
  try {
    return res.json({ ok: true, settings: buildIntegrationSettingsPayload() });
  } catch (error) {
    console.error('Failed to load integration settings', error);
    return res.status(500).json({ ok: false, message: 'Failed to load integration settings.' });
  }
});

app.post('/api/admin/integrations', (req, res) => {
  try {
    const settings = saveIntegrationSettings(req.body || {});
    applyRuntimeIntegrationSettings();
    return res.json({ ok: true, settings });
  } catch (error) {
    console.error('Failed to save integration settings', error);
    return res.status(500).json({ ok: false, message: 'Failed to save integration settings.' });
  }
});

app.get('/api/admin/contacts', (req, res) => {
  try {
    const contacts = contactService.listContacts({
      q: req.query.q,
      siteId: req.query.siteId,
      conversationId: req.query.conversationId,
      limit: req.query.limit
    }).map((contact) => Object.assign({}, contact, buildContactOverview(contact)));
    return res.json({ ok: true, contacts });
  } catch (error) {
    console.error('Failed to load contacts', error);
    return res.status(500).json({ ok: false, message: 'Failed to load contacts.' });
  }
});

app.get('/api/admin/contacts/export.csv', (req, res) => {
  try {
    const csv = contactService.exportContactsCsv({
      siteId: req.query.siteId,
      q: req.query.q
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts-export.csv"');
    return res.send(csv);
  } catch (error) {
    console.error('Failed to export contacts', error);
    return res.status(500).json({ ok: false, message: 'Failed to export contacts.' });
  }
});

app.post('/api/admin/contacts', (req, res) => {
  try {
    const contact = contactService.createContact(req.body || {});
    return res.status(201).json({ ok: true, contact });
  } catch (error) {
    console.error('Failed to create contact', error);
    return res.status(500).json({ ok: false, message: 'Failed to create contact.' });
  }
});

app.get('/api/admin/contacts/:contactId', (req, res) => {
  try {
    const contactId = String(req.params.contactId || '').trim();
    const contact = contactService.getContactById(contactId);
    if (!contact) {
      return res.status(404).json({ ok: false, message: 'Contact not found.' });
    }
    return res.json({ ok: true, contact });
  } catch (error) {
    console.error('Failed to load contact', error);
    return res.status(500).json({ ok: false, message: 'Failed to load contact.' });
  }
});

app.get('/api/admin/contacts/:contactId/profile', (req, res) => {
  try {
    const contactId = String(req.params.contactId || '').trim();
    const contact = contactService.getContactById(contactId);
    if (!contact) {
      return res.status(404).json({ ok: false, message: 'Contact not found.' });
    }
    const profile = buildContactProfileData(contact);
    return res.json({ ok: true, profile });
  } catch (error) {
    console.error('Failed to load contact profile', error);
    return res.status(500).json({ ok: false, message: 'Failed to load contact profile.' });
  }
});

app.get('/api/admin/analytics', (req, res) => {
  try {
    const period = String(req.query.period || '30d').trim().toLowerCase();
    const section = String(req.query.section || 'chats').trim().toLowerCase();
    const item = String(req.query.item || 'overview').trim().toLowerCase();
    const siteId = String(req.query.siteId || '').trim();
    const operator = String(req.query.operator || '').trim();
    const compare = String(req.query.compare || '').trim().toLowerCase();
    return res.json({
      ok: true,
      ...buildAnalyticsWorkspacePayload(period, {
        section,
        item,
        siteId,
        operator,
        compare: compare === '1' || compare === 'true' || compare === 'yes'
      })
    });
  } catch (error) {
    console.error('Failed to load analytics', error);
    return res.status(500).json({ ok: false, message: 'Failed to load analytics.' });
  }
});

app.get('/api/analytics/top-questions', requireInboxAuth, (req, res) => {
  try {
    const period = parseAnalyticsPeriod(String(req.query.period || '30d').trim().toLowerCase());
    const siteId = String(req.query.siteId || '').trim();
    const dataset = loadAnalyticsDataset(period, { siteId }, false);
    const questions = buildTopQuestionAnalytics(
      dataset.messages
        .filter((item) => String(item.sender_type || '') === 'visitor')
        .map((item) => ({
          conversation_id: item.conversation_id,
          message_text: item.message_text
        })),
      Number(req.query.limit) || 10
    );
    return res.json(questions);
  } catch (error) {
    console.error('Failed to load top questions analytics', error);
    return res.status(500).json({ ok: false, message: 'Failed to load top questions.' });
  }
});

app.patch('/api/admin/contacts/:contactId', (req, res) => {
  try {
    const contactId = String(req.params.contactId || '').trim();
    const contact = contactService.updateContact(contactId, req.body || {});
    if (!contact) {
      return res.status(404).json({ ok: false, message: 'Contact not found.' });
    }
    return res.json({ ok: true, contact });
  } catch (error) {
    console.error('Failed to update contact', error);
    return res.status(500).json({ ok: false, message: 'Failed to update contact.' });
  }
});

async function handleAiDraftRequest(req, res) {
  try {
    const conversationId = String(req.params?.conversationId || req.body?.conversationId || '').trim();
    const action = String(req.body?.action || req.body?.mode || 'draft').trim().toLowerCase();
    const currentText = String(req.body?.currentText || '');

    if (!conversationId) {
      return res.status(400).json({ ok: false, message: 'conversationId is required.' });
    }

    if (!['draft', 'shorten', 'more_sales', 'ask_contact', 'ask_file', 'polish', 'translate'].includes(action)) {
      return res.status(400).json({ ok: false, message: 'Unsupported AI action.' });
    }

    const payload = chatService.getConversationWithMessages(conversationId);
    if (!payload) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }

    const siteConfig = getSiteConfig(payload.conversation.siteId);
    if (!siteConfig) {
      return res.status(404).json({ ok: false, message: 'Site config not found for this conversation.' });
    }

    const contact = contactService.listContacts({
      conversationId,
      limit: 1
    })[0] || null;

    const result = await aiAssistantService.generateReply({
      siteConfig,
      conversation: payload.conversation,
      messages: payload.messages || [],
      contact,
      action,
      currentText
    });

    chatService.addEvent(conversationId, 'ai_draft_used', {
      action,
      operator: payload.conversation.assignedOperator || payload.conversation.lastOperator || '',
      model: result.model || ''
    });

    return res.json({
      ok: true,
      draft: result.text,
      text: result.text,
      model: result.model
    });
  } catch (error) {
    console.error('Failed to generate AI draft', error);
    const conversationId = String(req.params?.conversationId || req.body?.conversationId || '').trim();
    if (conversationId) {
      chatService.addEvent(conversationId, 'ai_draft_failed', {
        error: String(error && error.message || 'Unknown AI draft error')
      });
    }
    const message = String(error && error.message || '').trim();
    const status = /not configured|disabled/i.test(message) ? 503 : 500;
    return res.status(status).json({ ok: false, message: message || 'Failed to generate AI draft.' });
  }
}

async function handleAiImproveRequest(req, res) {
  try {
    const conversationId = String(req.params?.conversationId || req.body?.conversationId || '').trim();
    const currentText = String(req.body?.text || req.body?.currentText || '');

    if (!conversationId) {
      return res.status(400).json({ ok: false, message: 'conversationId is required.' });
    }

    if (!String(currentText || '').trim()) {
      return res.status(400).json({ ok: false, message: 'Draft text is required.' });
    }

    const payload = chatService.getConversationWithMessages(conversationId);
    if (!payload) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }

    const siteConfig = getSiteConfig(payload.conversation.siteId);
    if (!siteConfig) {
      return res.status(404).json({ ok: false, message: 'Site config not found for this conversation.' });
    }

    const contact = contactService.listContacts({
      conversationId,
      limit: 1
    })[0] || null;

    const result = await aiAssistantService.generateReply({
      siteConfig,
      conversation: payload.conversation,
      messages: payload.messages || [],
      contact,
      action: 'polish',
      currentText
    });

    chatService.addEvent(conversationId, 'ai_improve_used', {
      operator: payload.conversation.assignedOperator || payload.conversation.lastOperator || '',
      model: result.model || ''
    });

    return res.json({
      ok: true,
      improvedText: result.text,
      text: result.text,
      model: result.model
    });
  } catch (error) {
    console.error('Failed to improve AI draft', error);
    const conversationId = String(req.params?.conversationId || req.body?.conversationId || '').trim();
    if (conversationId) {
      chatService.addEvent(conversationId, 'ai_improve_failed', {
        error: String(error && error.message || 'Unknown AI improve error')
      });
    }
    const message = String(error && error.message || '').trim();
    const status = /not configured|disabled/i.test(message) ? 503 : 500;
    return res.status(status).json({ ok: false, message: message || 'Failed to improve draft text.' });
  }
}

async function handleAiTranslateRequest(req, res) {
  try {
    const conversationId = String(req.params?.conversationId || req.body?.conversationId || '').trim();
    const currentText = String(req.body?.text || req.body?.currentText || '');
    const targetLanguage = String(req.body?.targetLanguage || 'en').trim().toLowerCase();

    if (!conversationId) {
      return res.status(400).json({ ok: false, message: 'conversationId is required.' });
    }

    if (!String(currentText || '').trim()) {
      return res.status(400).json({ ok: false, message: 'Draft text is required.' });
    }

    if (!['en', 'uk', 'ru'].includes(targetLanguage)) {
      return res.status(400).json({ ok: false, message: 'Unsupported target language.' });
    }

    const payload = chatService.getConversationWithMessages(conversationId);
    if (!payload) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }

    const siteConfig = getSiteConfig(payload.conversation.siteId);
    if (!siteConfig) {
      return res.status(404).json({ ok: false, message: 'Site config not found for this conversation.' });
    }

    const contact = contactService.listContacts({
      conversationId,
      limit: 1
    })[0] || null;

    const result = await aiAssistantService.generateReply({
      siteConfig,
      conversation: payload.conversation,
      messages: payload.messages || [],
      contact,
      action: 'translate',
      currentText,
      targetLanguage
    });

    chatService.addEvent(conversationId, 'ai_translate_used', {
      targetLanguage,
      operator: payload.conversation.assignedOperator || payload.conversation.lastOperator || '',
      model: result.model || ''
    });

    return res.json({
      ok: true,
      translatedText: result.text,
      text: result.text,
      model: result.model
    });
  } catch (error) {
    console.error('Failed to translate AI draft', error);
    const conversationId = String(req.params?.conversationId || req.body?.conversationId || '').trim();
    if (conversationId) {
      chatService.addEvent(conversationId, 'ai_translate_failed', {
        error: String(error && error.message || 'Unknown AI translate error')
      });
    }
    const message = String(error && error.message || '').trim();
    const status = /not configured|disabled/i.test(message) ? 503 : 500;
    return res.status(status).json({ ok: false, message: message || 'Failed to translate draft text.' });
  }
}

async function handleAiSummaryRequest(req, res) {
  try {
    const conversationId = String(req.params?.conversationId || req.body?.conversationId || '').trim();

    if (!conversationId) {
      return res.status(400).json({ ok: false, message: 'conversationId is required.' });
    }

    const payload = chatService.getConversationWithMessages(conversationId);
    if (!payload) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }

    const siteConfig = getSiteConfig(payload.conversation.siteId);
    if (!siteConfig) {
      return res.status(404).json({ ok: false, message: 'Site config not found for this conversation.' });
    }

    const contact = contactService.listContacts({
      conversationId,
      limit: 1
    })[0] || null;

    const result = await aiAssistantService.generateSummary({
      siteConfig,
      conversation: payload.conversation,
      messages: payload.messages || [],
      contact
    });

    chatService.addEvent(conversationId, 'ai_summary_generated', {
      operator: payload.conversation.assignedOperator || payload.conversation.lastOperator || '',
      model: result.model || ''
    });

    return res.json({
      ok: true,
      summary: result.summary,
      model: result.model
    });
  } catch (error) {
    console.error('Failed to generate AI summary', error);
    const conversationId = String(req.params?.conversationId || req.body?.conversationId || '').trim();
    if (conversationId) {
      chatService.addEvent(conversationId, 'ai_summary_failed', {
        error: String(error && error.message || 'Unknown AI summary error')
      });
    }
    const message = String(error && error.message || '').trim();
    const status = /not configured|disabled/i.test(message) ? 503 : 500;
    return res.status(status).json({ ok: false, message: message || 'Failed to generate AI summary.' });
  }
}

async function handleAiSidebarRequest(req, res) {
  try {
    const conversationId = String(req.params?.conversationId || req.body?.conversationId || '').trim();
    const operatorPrompt = String(req.body?.prompt || '').trim();
    const action = String(req.body?.action || '').trim().toLowerCase();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!conversationId) {
      return res.status(400).json({ ok: false, message: 'conversationId is required.' });
    }
    if (!operatorPrompt) {
      return res.status(400).json({ ok: false, message: 'prompt is required.' });
    }

    const payload = chatService.getConversationWithMessages(conversationId);
    if (!payload) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }

    const siteConfig = getSiteConfig(payload.conversation.siteId);
    if (!siteConfig) {
      return res.status(404).json({ ok: false, message: 'Site config not found for this conversation.' });
    }

    const contact = contactService.listContacts({
      conversationId,
      limit: 1
    })[0] || null;

    const productResults = action === 'find_products' ? searchProductCatalog(operatorPrompt, 6) : [];
    const result = await aiAssistantService.generateWorkspaceReply({
      siteConfig,
      conversation: payload.conversation,
      messages: payload.messages || [],
      contact,
      history,
      operatorPrompt,
      productResults
    });

    chatService.addEvent(conversationId, 'ai_sidebar_used', {
      action: action || 'custom',
      operator: payload.conversation.assignedOperator || payload.conversation.lastOperator || '',
      model: result.model || '',
      selectedText: /^analyze this message:/i.test(operatorPrompt)
    });

    return res.json({
      ok: true,
      reply: result.text,
      text: result.text,
      products: productResults,
      model: result.model
    });
  } catch (error) {
    console.error('Failed to generate AI sidebar reply', error);
    const conversationId = String(req.params?.conversationId || req.body?.conversationId || '').trim();
    if (conversationId) {
      chatService.addEvent(conversationId, 'ai_sidebar_failed', {
        error: String(error && error.message || 'Unknown AI sidebar error')
      });
    }
    const message = String(error && error.message || '').trim();
    const status = /not configured|disabled/i.test(message) ? 503 : 500;
    return res.status(status).json({ ok: false, message: message || 'Failed to generate AI sidebar reply.' });
  }
}

app.post('/api/admin/ai/reply-draft', handleAiDraftRequest);
app.post('/api/inbox/conversations/:conversationId/ai-draft', handleAiDraftRequest);
app.post('/api/inbox/conversations/:conversationId/ai-improve', handleAiImproveRequest);
app.post('/api/inbox/conversations/:conversationId/ai-translate', handleAiTranslateRequest);
app.post('/api/inbox/conversations/:conversationId/ai-summary', handleAiSummaryRequest);
app.post('/api/inbox/conversations/:conversationId/ai-sidebar', handleAiSidebarRequest);
app.get('/api/products/search', (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    return res.json({ ok: true, items: searchProductCatalog(query, 12) });
  } catch (error) {
    console.error('Failed to search products', error);
    return res.status(500).json({ ok: false, message: 'Failed to search products.' });
  }
});

async function handleProductOfferRequest(req, res) {
  try {
    const conversationId = String(req.params.conversationId || '').trim();
    const operatorName = String(req.body?.operatorName || 'Operator').trim();
    const product = normalizeProductOfferInput(req.body?.product || req.body, req.body?.customMessage || '');
    if (!product) {
      return res.status(400).json({ ok: false, message: 'Valid product snapshot is required.' });
    }

    const payload = await chatService.addInboxProductOffer(conversationId, product, operatorName, product.customMessage || '');
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
    console.error('Failed to send product offer', error);
    if (error && error.message === 'INVALID_PRODUCT_OFFER') {
      return res.status(400).json({ ok: false, message: 'Product title and URL are required.' });
    }
    return res.status(500).json({ ok: false, message: 'Failed to send product offer.' });
  }
}

app.post('/api/conversations/:conversationId/product-offer', requireInboxAuth, handleProductOfferRequest);
app.post('/api/inbox/conversations/:conversationId/product-offer', handleProductOfferRequest);

app.post('/api/conversations/:conversationId/product-offer/:messageId/interaction', async (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || '').trim();
    const messageId = Number(req.params.messageId);
    const visitorId = String(req.body?.visitorId || '').trim();
    const action = String(req.body?.action || '').trim().toLowerCase();
    const requestedSiteId = String(req.body?.siteId || req.query?.siteId || '').trim();
    if (!conversationId || !visitorId || !Number.isFinite(messageId) || !['open', 'interested'].includes(action)) {
      return res.status(400).json({ ok: false, message: 'conversationId, visitorId, messageId, and valid action are required.' });
    }

    const conversation = chatService.getConversationForVisitor(conversationId, visitorId);
    if (!conversation) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }
    if (!assertConversationSiteMatch(conversation, requestedSiteId)) {
      return res.status(409).json({ ok: false, message: 'Conversation/site mismatch.' });
    }

    const payload = chatService.getConversationWithMessages(conversationId);
    const message = Array.isArray(payload && payload.messages)
      ? payload.messages.find((item) => Number(item.id) === messageId && String(item.messageType || '') === 'product_offer')
      : null;
    if (!message) {
      return res.status(404).json({ ok: false, message: 'Product offer not found.' });
    }

    const product = message.rawPayload && typeof message.rawPayload === 'object' ? message.rawPayload : {};
    chatService.addEvent(conversationId, 'product_offer_interaction', {
      action,
      messageId,
      productId: String(product.productId || '').trim(),
      title: String(product.title || '').trim(),
      visitorId
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Failed to track product offer interaction', error);
    return res.status(500).json({ ok: false, message: 'Failed to track interaction.' });
  }
});

app.post('/api/inbox/conversations/:conversationId/request-feedback', (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || '').trim();
    const operatorName = String(req.body?.operatorName || 'Operator').trim();
    if (!conversationId) {
      return res.status(400).json({ ok: false, message: 'Conversation not found.' });
    }

    const conversation = chatService.requestFeedback(conversationId, operatorName);
    if (!conversation) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }

    return res.json({ ok: true, conversation });
  } catch (error) {
    console.error('Failed to request feedback', error);
    return res.status(500).json({ ok: false, message: 'Failed to request feedback.' });
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

app.post('/api/inbox/conversations/:conversationId/reply', async (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || '').trim();
    const text = String(req.body?.text || '').trim();
    const operatorName = String(req.body?.operatorName || 'Operator').trim();
    if (!text) {
      return res.status(400).json({ ok: false, message: 'Reply text is required.' });
    }

    const payload = await chatService.addInboxReply(conversationId, text, operatorName);
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

app.post('/api/inbox/conversations/:conversationId/read', (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || '').trim();
    const conversation = chatService.resetUnreadCount(conversationId);
    if (!conversation) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }
    return res.json({ ok: true, conversation });
  } catch (error) {
    console.error('Failed to reset unread count', error);
    return res.status(500).json({ ok: false, message: 'Failed to mark conversation as read.' });
  }
});

function handleAssignOperator(req, res) {
  try {
    const conversationId = String(req.params.id || req.params.conversationId || '').trim();
    const operator = String(req.body?.operator || '').trim();
    if (!conversationId) {
      return res.status(400).json({ ok: false, message: 'Conversation id is required.' });
    }

    const conversation = chatService.assignOperator(conversationId, operator);
    if (!conversation) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }
    return res.json({ ok: true, conversation });
  } catch (error) {
    console.error('Failed to assign operator', error);
    return res.status(500).json({ ok: false, message: 'Failed to assign operator.' });
  }
}

app.post('/api/chat/:id/assign', handleAssignOperator);
app.post('/api/inbox/conversations/:conversationId/assign', handleAssignOperator);

app.post('/api/inbox/conversations/:conversationId/typing', (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || '').trim();
    const operatorName = String(req.body?.operatorName || 'Operator').trim();
    const active = req.body?.active === true;
    const typing = chatService.setOperatorTyping(conversationId, active, operatorName);
    if (!typing) {
      return res.status(404).json({ ok: false, message: 'Conversation not found.' });
    }
    return res.json({ ok: true, typing });
  } catch (error) {
    console.error('Failed to update operator typing', error);
    return res.status(500).json({ ok: false, message: 'Failed to update typing state.' });
  }
});

app.get('/settings', (req, res) => {
  res.type('html').send(renderAppLayout({
    title: 'Chat Settings',
    activeNav: 'settings',
    styles: `
      :root {
        color-scheme: light;
        --page-bg: #f5f4f7;
        --card: #ffffff;
        --card-soft: #faf9fc;
        --bdr: #eeedf0;
        --bdr-strong: #dddbe6;
        --txt1: #0d0e14;
        --txt2: #6b6f80;
        --txt3: #a8aab8;
        --blue: #3b5bdb;
        --blue-l: #eef2ff;
        --blue-b: #c5d0fa;
        --red: #e03131;
        --red-l: #fff5f5;
        --red-b: #ffc9c9;
        --shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04);
        --shadow-sm: 0 1px 2px rgba(0,0,0,.06);
      }
      * { box-sizing: border-box; }
      body {
        font-family: 'Plus Jakarta Sans', Manrope, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: var(--page-bg);
        color: var(--txt1);
      }
      .layout {
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        min-height: 100vh;
        padding: 0;
        gap: 0;
      }
      .panel {
        background: var(--card);
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }
      .sidebar {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: 1px solid var(--bdr);
        background: var(--card);
      }
      .sidebar-head {
        padding: 16px 16px 12px;
        border-bottom: 1px solid var(--bdr);
      }
      .sidebar-head h1,
      .content-head h2 {
        margin: 0;
        font-size: 17px;
        font-weight: 600;
        letter-spacing: -0.03em;
      }
      .site-list {
        display: grid;
        gap: 3px;
        padding: 8px;
        overflow-y: auto;
      }
      .site-item {
        width: 100%;
        border: 1px solid transparent;
        background: transparent;
        border-radius: 9px;
        text-align: left;
        padding: 9px 11px;
        cursor: pointer;
        box-shadow: none;
        transition: background .12s ease, border-color .12s ease;
      }
      .site-item.active {
        border-color: var(--blue-b);
        background: var(--blue-l);
      }
      .site-item strong {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--txt1);
      }
      .site-item span {
        display: block;
        margin-top: 2px;
        color: var(--txt3);
        font-size: 10px;
      }
      .site-item.active strong { color: var(--blue); }
      .site-item.active span { color: #7b9eff; }
      .content {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--page-bg);
      }
      .content-head {
        background: var(--card);
        border-bottom: 1px solid var(--bdr);
        padding: 14px 22px 12px;
      }
      .content-head p {
        margin: 3px 0 0;
        color: var(--txt3);
        font-size: 12px;
      }
      .form {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        padding: 0;
      }
      .settings-shell {
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr) 360px;
        flex: 1;
        min-height: 0;
      }
      .settings-categories {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        gap: 2px;
        padding: 10px 8px;
        background: var(--card);
        border-right: 1px solid var(--bdr);
        overflow-y: auto;
        align-content: flex-start;
      }
      .settings-category-btn {
        width: 100%;
        text-align: left;
        border: 1px solid transparent;
        border-radius: 7px;
        padding: 7px 11px;
        background: transparent;
        color: var(--txt2);
        font: inherit;
        cursor: pointer;
        transition: background-color 0.14s ease, color 0.14s ease, border-color 0.14s ease;
        min-height: 60px;
        height: 60px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
      }
      .settings-category-btn strong {
        display: block;
        font-size: 12px;
        color: var(--txt2);
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .settings-category-btn small {
        display: -webkit-box;
        margin-top: 1px;
        font-size: 10px;
        color: var(--txt3);
        line-height: 1.32;
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        max-height: 2.64em;
      }
      .settings-category-btn.active {
        background: var(--blue-l);
        border-color: transparent;
      }
      .settings-category-btn.active strong,
      .settings-category-btn.active small {
        color: var(--blue);
      }
      .settings-panels {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .settings-preview-panel {
        display: flex;
        flex-direction: column;
        min-height: 0;
        border-left: 1px solid var(--bdr);
        background: linear-gradient(180deg, #f8f8fb 0%, #f3f4f8 100%);
      }
      .settings-preview-head {
        padding: 16px 18px 12px;
        border-bottom: 1px solid var(--bdr);
        background: rgba(255,255,255,0.84);
        backdrop-filter: blur(8px);
      }
      .settings-preview-head strong {
        display: block;
        font-size: 14px;
        letter-spacing: -0.02em;
      }
      .settings-preview-head span {
        display: block;
        margin-top: 4px;
        font-size: 11px;
        color: var(--txt3);
      }
      .settings-preview-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 18px;
      }
      .preview-phone {
        width: 100%;
        max-width: 324px;
        margin: 0 auto;
        padding: 12px;
        border-radius: 28px;
        background: linear-gradient(180deg, #1f2330 0%, #151924 100%);
        box-shadow: 0 26px 60px rgba(15, 23, 42, 0.18);
      }
      .preview-widget {
        overflow: hidden;
        border-radius: 22px;
        background: #fff;
        min-height: 620px;
        display: flex;
        flex-direction: column;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
      }
      .preview-header {
        padding: 14px 14px 12px;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .preview-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(255,255,255,0.16);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        overflow: hidden;
        flex-shrink: 0;
      }
      .preview-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .preview-header-copy {
        min-width: 0;
        display: grid;
        gap: 2px;
      }
      .preview-header-copy strong {
        font-size: 14px;
        line-height: 1.2;
      }
      .preview-header-copy span {
        font-size: 11px;
        opacity: 0.8;
      }
      .preview-status {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #4ade80;
        box-shadow: 0 0 0 4px rgba(74,222,128,0.14);
      }
      .preview-chat {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: 12px;
        background: linear-gradient(180deg, #fff 0%, #fffaf5 100%);
      }
      .preview-quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 10px;
      }
      .preview-chip {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(255,255,255,0.94);
        border: 1px solid rgba(31,39,52,0.07);
        color: #31415d;
        font-size: 11px;
        font-weight: 700;
        gap: 6px;
      }
      .preview-messages {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .preview-message {
        display: flex;
        gap: 8px;
        align-items: flex-start;
      }
      .preview-message.user {
        justify-content: flex-end;
      }
      .preview-bubble {
        max-width: 82%;
        padding: 10px 12px;
        border-radius: 16px;
        background: #fff;
        border: 1px solid rgba(31,39,52,0.08);
        font-size: 13px;
        line-height: 1.45;
        color: var(--txt1);
      }
      .preview-message.user .preview-bubble {
        color: #fff;
        border-color: transparent;
      }
      .preview-input {
        margin-top: auto;
        padding-top: 12px;
      }
      .preview-input-box {
        border: 1px solid var(--bdr);
        border-radius: 16px;
        background: #fff;
        padding: 10px;
        display: grid;
        gap: 8px;
        box-shadow: var(--shadow-sm);
      }
      .preview-input-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .preview-placeholder {
        color: var(--txt3);
        font-size: 12px;
      }
      .preview-send-btn {
        min-height: 34px;
        padding: 0 14px;
        border-radius: 12px;
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 18px rgba(0,0,0,.12);
      }
      .color-field {
        display: grid;
        gap: 8px;
      }
      .color-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 44px;
        gap: 8px;
        align-items: center;
      }
      .color-picker-native {
        width: 44px;
        height: 40px;
        padding: 0;
        border-radius: 10px;
        border: 1px solid var(--bdr-strong);
        background: #fff;
        overflow: hidden;
        cursor: pointer;
      }
      .color-picker-native::-webkit-color-swatch-wrapper {
        padding: 0;
      }
      .color-picker-native::-webkit-color-swatch {
        border: 0;
        border-radius: 9px;
      }
      .color-presets {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .color-preset {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0 0 0 1px rgba(15,23,42,0.08);
        cursor: pointer;
      }
      .color-preset.is-active {
        box-shadow: 0 0 0 2px var(--blue);
      }
      .settings-section {
        display: grid;
        grid-template-rows: auto auto;
        overflow: hidden;
        background: transparent;
      }
      .settings-section[hidden] {
        display: none !important;
      }
      .settings-section-head {
        padding: 18px 22px 0;
        display: block;
        position: sticky;
        top: 0;
        z-index: 2;
        background: linear-gradient(180deg, var(--page-bg) 85%, rgba(245,244,247,0));
      }
      .section-copy {
        display: grid;
        gap: 3px;
      }
      .section-copy strong {
        font-size: 15px;
        letter-spacing: -0.02em;
      }
      .section-copy small {
        font-size: 12px;
        color: var(--txt3);
      }
      .settings-section-body {
        display: grid;
        gap: 12px;
        padding: 16px 22px 18px;
        overflow: visible;
      }
      .settings-card {
        display: grid;
        gap: 10px;
        padding: 16px;
        background: var(--card);
        border: 1px solid var(--bdr);
        border-radius: 12px;
        box-shadow: var(--shadow-sm);
      }
      .settings-card-head {
        display: grid;
        gap: 3px;
      }
      .settings-card-head strong {
        font-size: 13px;
        letter-spacing: -0.02em;
      }
      .settings-card-head small {
        font-size: 11px;
        color: var(--txt3);
        line-height: 1.4;
      }
      .status-badge {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        width: fit-content;
      }
      .status-badge.ok {
        background: #ebfbee;
        color: #2f9e44;
        border: 1px solid #b2f2bb;
      }
      .status-badge.missing {
        background: #fff5f5;
        color: #e03131;
        border: 1px solid #ffc9c9;
      }
      .secret-field {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
      }
      .secret-field input {
        min-width: 0;
      }
      .secret-actions {
        display: inline-flex;
        gap: 6px;
      }
      .secret-actions button {
        border-radius: 7px;
        padding: 7px 10px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
        border: 1px solid var(--bdr);
        background: var(--card-soft);
        color: var(--txt2);
      }
      .secret-actions button.clear-pending {
        background: var(--red-l);
        border-color: var(--red-b);
        color: var(--red);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .field {
        display: grid;
        gap: 4px;
      }
      .field.full {
        grid-column: 1 / -1;
      }
      label {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: .07em;
        color: var(--txt3);
      }
      input, textarea, select {
        width: 100%;
        border: 1px solid var(--bdr-strong);
        border-radius: 7px;
        padding: 8px 10px;
        font: inherit;
        font-size: 13px;
        background: var(--card);
        color: var(--txt1);
        box-shadow: var(--shadow-sm);
        outline: none;
        transition: border-color .15s ease, box-shadow .15s ease;
      }
      input:focus, textarea:focus, select:focus {
        border-color: var(--blue-b);
        box-shadow: 0 0 0 3px rgba(59,91,219,.08);
      }
      textarea {
        resize: vertical;
        min-height: 74px;
        line-height: 1.5;
      }
      .section,
      .subsection {
        display: grid;
        gap: 10px;
        padding: 12px;
        background: var(--card);
        border: 1px solid var(--bdr);
        border-radius: 12px;
        box-shadow: var(--shadow-sm);
      }
      .section h3,
      .subsection h3 {
        margin: 0;
        font-size: 13px;
        letter-spacing: -0.02em;
      }
      .subsection-head p {
        margin: 3px 0 0;
        color: var(--txt3);
        font-size: 11px;
      }
      .quick-actions {
        display: grid;
        gap: 8px;
      }
      .quick-action-row {
        display: grid;
        grid-template-columns: 80px minmax(0, 1fr) 160px auto auto auto;
        gap: 8px;
        align-items: center;
        padding: 8px;
        border: 1px solid var(--bdr);
        border-radius: 9px;
        background: var(--card);
        box-shadow: var(--shadow-sm);
      }
      .quick-action-row.operator-reply-row {
        grid-template-columns: minmax(0, 1fr) auto auto auto;
      }
      .flow-scenarios {
        display: grid;
        gap: 10px;
      }
      .flow-scenario-card {
        border: 1px solid var(--bdr);
        border-radius: 12px;
        background: var(--card);
        padding: 10px;
        display: grid;
        gap: 10px;
        box-shadow: var(--shadow-sm);
      }
      .flow-scenario-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .flow-scenario-head p {
        margin: 3px 0 0;
        color: var(--txt3);
        font-size: 11px;
      }
      .flow-editor {
        display: grid;
        gap: 8px;
      }
      .flow-editor-head,
      .flow-step-head,
      .flow-option-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .flow-editor-head {
        padding-top: 2px;
      }
      .flow-steps {
        display: grid;
        gap: 8px;
      }
      .flow-step-card {
        border: 1px solid var(--bdr);
        border-radius: 10px;
        background: var(--card-soft);
        padding: 8px;
        display: grid;
        gap: 8px;
      }
      .flow-step-grid {
        display: grid;
        grid-template-columns: 120px 120px 1fr;
        gap: 8px;
      }
      .flow-step-actions,
      .flow-option-actions {
        display: flex;
        gap: 6px;
      }
      .flow-options {
        display: grid;
        gap: 6px;
      }
      .flow-option-row {
        border: 1px solid var(--bdr);
        border-radius: 9px;
        padding: 6px;
        background: var(--card-soft);
      }
      .flow-option-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        flex: 1;
      }
      .quick-action-row button,
      .actions button,
      .section-actions button,
      .settings-category-btn {
        border: 0;
        font: inherit;
      }
      .section-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }
      .section-actions.compact {
        justify-content: flex-start;
      }
      .actions {
        display: flex;
        gap: 8px;
        justify-content: space-between;
        align-items: center;
      }
      .actions .left {
        display: flex;
        gap: 8px;
      }
      .actions button,
      .section-actions button,
      .quick-action-row button {
        border-radius: 7px;
        padding: 7px 12px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
      }
      .global-actions {
        padding: 10px 22px;
        border-top: 1px solid var(--bdr);
        background: var(--card);
        flex-shrink: 0;
      }
      .primary {
        background: var(--blue);
        color: #fff;
        box-shadow: 0 2px 8px rgba(59,91,219,.3);
      }
      .secondary {
        background: var(--blue-l);
        color: var(--blue);
        border: 1px solid var(--blue-b);
      }
      .danger {
        background: var(--red-l);
        color: var(--red);
        border: 1px solid var(--red-b);
      }
      .status-line {
        font-size: 12px;
        color: var(--txt3);
      }
      .status-line.success {
        color: #1d7c4d;
      }
      .section-placeholder {
        border: 1px dashed var(--bdr-strong);
        border-radius: 12px;
        background: var(--card);
        padding: 11px;
      }
      .section-placeholder strong {
        display: block;
        font-size: 13px;
      }
      .section-placeholder p {
        margin: 4px 0 0;
        color: var(--txt3);
        font-size: 12px;
        line-height: 1.45;
      }
      .operator-manager {
        display: grid;
        gap: 10px;
      }
      .operator-manager-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .operator-list {
        display: grid;
        gap: 6px;
      }
      .operator-row {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.4fr) auto;
        gap: 8px;
        align-items: center;
        padding: 8px 10px;
        border: 1px solid var(--bdr);
        border-radius: 9px;
        background: var(--card);
        box-shadow: var(--shadow-sm);
      }
      .operator-row input {
        width: 100%;
      }
      .operator-row button {
        align-self: stretch;
      }
      .sec-tag {
        display: inline-flex;
        align-items: center;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .1em;
        color: var(--blue);
        background: var(--blue-l);
        border: 1px solid var(--blue-b);
        padding: 2px 8px;
        border-radius: 20px;
        margin-bottom: 8px;
      }
      .settings-main-scroll {
        min-height: 0;
        overflow-y: auto;
      }
      @media (max-width: 980px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .settings-shell {
          grid-template-columns: 1fr;
        }
        .settings-categories {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          border-right: 0;
          border-bottom: 1px solid var(--bdr);
        }
        .settings-preview-panel {
          border-left: 0;
          border-top: 1px solid var(--bdr);
        }
        .grid {
          grid-template-columns: 1fr;
        }
        .quick-action-row {
          grid-template-columns: 1fr;
        }
        .section-actions,
        .actions {
          align-items: flex-start;
        }
        .flow-step-grid,
        .flow-option-fields,
        .operator-row {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 720px) {
        .settings-categories {
          grid-template-columns: 1fr;
        }
      }
    `,
    content: `
    <div class="layout">
      <aside class="panel sidebar">
        <div class="sidebar-head">
          <h1>Chat Settings</h1>
        </div>
        <div id="siteList" class="site-list"></div>
      </aside>
      <main class="panel content">
        <div class="content-head">
          <h2 id="siteTitle">Оберіть сайт</h2>
          <p>Редагуйте публічні налаштування віджета для кожного siteId без змін у коді.</p>
        </div>
        <form id="settingsForm" class="form">
          <div class="settings-shell">
            <aside class="settings-categories" id="settingsCategoryNav">
              <button type="button" class="settings-category-btn active" data-settings-nav="general"><strong>General</strong><small>Назва, avatar, welcome-текст</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="theme"><strong>Appearance</strong><small>Кольори й вигляд віджета</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="actions"><strong>Quick Actions</strong><small>Кнопки і quick replies</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="flows"><strong>Chat Flows</strong><small>Сценарії та choice-кроки</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="ai"><strong>AI Assistant</strong><small>Provider, model, knowledge base</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="crm"><strong>CRM / Contacts</strong><small>Lead статуси й CRM блок</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="integrations"><strong>Integrations</strong><small>Server-side інтеграції та провайдери</small></button>
            </aside>
            <div class="settings-panels">
            <div class="settings-main-scroll">
          <section class="settings-section is-open" data-section="general">
            <div class="settings-section-head">
              <span class="section-copy">
                <strong>General</strong>
                <small>Назва сайту, welcome-текст і базова інформація віджета.</small>
              </span>
            </div>
            <div class="settings-section-body">
              <div class="settings-card">
                <div class="settings-card-head">
                  <strong>Widget identity</strong>
                  <small>Базові назви, статуси та аватари для віджета й оператора.</small>
                </div>
                <div class="grid">
                  <div class="field">
                    <label for="titleInput">Bot title</label>
                    <input id="titleInput" type="text" />
                  </div>
                  <div class="field">
                    <label for="welcomeIntroLabelInput">Welcome intro label</label>
                    <input id="welcomeIntroLabelInput" type="text" />
                  </div>
                  <div class="field">
                    <label for="onlineStatusTextInput">Online status text</label>
                    <input id="onlineStatusTextInput" type="text" />
                  </div>
                  <div class="field">
                    <label for="managerNameInput">Manager name</label>
                    <input id="managerNameInput" type="text" placeholder="Марія" />
                  </div>
                  <div class="field">
                    <label for="managerTitleInput">Manager title</label>
                    <input id="managerTitleInput" type="text" placeholder="Менеджер PrintForge" />
                  </div>
                  <div class="field full">
                    <label for="avatarUrlInput">Avatar URL</label>
                    <input id="avatarUrlInput" type="url" placeholder="https://..." />
                  </div>
                  <div class="field full">
                    <label for="managerAvatarUrlInput">Manager avatar URL</label>
                    <input id="managerAvatarUrlInput" type="url" placeholder="https://..." />
                  </div>
                </div>
              </div>
              <div class="settings-card">
                <div class="settings-card-head">
                  <strong>Operator team</strong>
                  <small>Список операторів для handoff, assignment і відповіді з inbox.</small>
                </div>
                <div class="field full">
                  <div class="operator-manager">
                    <div class="operator-manager-head">
                      <strong>Operators</strong>
                      <button id="addOperatorBtn" type="button" class="secondary">Додати оператора</button>
                    </div>
                    <div id="operatorsList" class="operator-list"></div>
                  </div>
                </div>
              </div>
              <div class="settings-card">
                <div class="settings-card-head">
                  <strong>Welcome content</strong>
                  <small>Початкове повідомлення, яке бачить відвідувач після відкриття чату.</small>
                </div>
                <div class="field full">
                  <label for="welcomeMessageInput">Welcome message</label>
                  <textarea id="welcomeMessageInput"></textarea>
                </div>
              </div>
              <div class="section-actions">
                <button type="button" class="primary" data-save-section="general">Save General</button>
                <div id="generalStatus" class="status-line">Можна редагувати й зберегти тільки цей блок.</div>
              </div>
            </div>
          </section>

          <section class="settings-section" data-section="theme">
            <div class="settings-section-head">
              <span class="section-copy">
                <strong>Theme / Appearance</strong>
                <small>Кольори, фон header і базовий вигляд віджета.</small>
              </span>
            </div>
            <div class="settings-section-body" hidden>
              <div class="grid">
                <div class="field">
                  <label for="primaryColorInput">Primary color</label>
                  <div class="color-field">
                    <div class="color-row">
                      <input id="primaryColorInput" type="text" placeholder="#f78c2f" />
                      <input id="primaryColorPicker" class="color-picker-native" type="color" value="#f78c2f" />
                    </div>
                    <div id="primaryColorPresets" class="color-presets"></div>
                  </div>
                </div>
                <div class="field">
                  <label for="headerBgInput">Header background</label>
                  <div class="color-field">
                    <div class="color-row">
                      <input id="headerBgInput" type="text" placeholder="#131926" />
                      <input id="headerBgPicker" class="color-picker-native" type="color" value="#131926" />
                    </div>
                    <div id="headerBgPresets" class="color-presets"></div>
                  </div>
                </div>
                <div class="field">
                  <label for="bubbleBgInput">Bubble background</label>
                  <div class="color-field">
                    <div class="color-row">
                      <input id="bubbleBgInput" type="text" placeholder="#ffffff" />
                      <input id="bubbleBgPicker" class="color-picker-native" type="color" value="#ffffff" />
                    </div>
                    <div id="bubbleBgPresets" class="color-presets"></div>
                  </div>
                </div>
                <div class="field">
                  <label for="textColorInput">Text color</label>
                  <div class="color-field">
                    <div class="color-row">
                      <input id="textColorInput" type="text" placeholder="#1f2734" />
                      <input id="textColorPicker" class="color-picker-native" type="color" value="#1f2734" />
                    </div>
                    <div id="textColorPresets" class="color-presets"></div>
                  </div>
                </div>
              </div>
              <div class="section-actions">
                <button type="button" class="primary" data-save-section="theme">Save Appearance</button>
                <div id="themeStatus" class="status-line">Зміни стилю не впливають на backend-логіку.</div>
              </div>
            </div>
          </section>

          <section class="settings-section" data-section="actions">
            <div class="settings-section-head">
              <span class="section-copy">
                <strong>Quick Action Buttons</strong>
                <small>Кнопки у віджеті та швидкі відповіді для оператора.</small>
              </span>
            </div>
            <div class="settings-section-body" hidden>
              <div class="subsection">
                <div class="subsection-head">
                  <h3>Visitor quick actions</h3>
                  <p>Label, icon та key для кнопок, які бачить клієнт.</p>
                </div>
                <div id="quickActionsList" class="quick-actions"></div>
                <div class="section-actions compact">
                  <button id="addQuickActionBtn" type="button" class="secondary">Додати кнопку</button>
                </div>
              </div>
              <div class="subsection">
                <div class="subsection-head">
                  <h3>Operator quick replies</h3>
                  <p>Заготовки для inbox без зміни чат-флоу.</p>
                </div>
                <div id="operatorQuickRepliesList" class="quick-actions"></div>
                <div class="section-actions compact">
                  <button id="addOperatorQuickReplyBtn" type="button" class="secondary">Додати відповідь</button>
                </div>
              </div>
              <div class="section-actions">
                <button type="button" class="primary" data-save-section="actions">Save Actions</button>
                <div id="actionsStatus" class="status-line">Редагуйте список кнопок і quick replies окремо від flow.</div>
              </div>
            </div>
          </section>

          <section class="settings-section" data-section="flows">
            <div class="settings-section-head">
              <span class="section-copy">
                <strong>Chat Flows / Scenarios</strong>
                <small>Питання, кроки й choice-опції для кожної quick action кнопки.</small>
              </span>
            </div>
            <div class="settings-section-body" hidden>
              <div id="flowScenariosList" class="flow-scenarios"></div>
              <div class="section-actions">
                <button type="button" class="primary" data-save-section="flows">Save Flows</button>
                <div id="flowsStatus" class="status-line">Widget використовує саме ці сценарії для quick action кнопок.</div>
              </div>
            </div>
          </section>

          <section class="settings-section" data-section="ai">
            <div class="settings-section-head">
              <span class="section-copy">
                <strong>AI Assistant</strong>
                <small>Provider, model і knowledge base для AI draft та summary.</small>
              </span>
            </div>
            <div class="settings-section-body" hidden>
              <div id="aiConfigStatus" class="status-line">OpenAI key: checking...</div>
              <div class="settings-card">
                <div class="settings-card-head">
                  <strong>AI Settings</strong>
                  <small>Увімкнення асистента, провайдер і базові runtime-параметри.</small>
                </div>
                <div class="grid">
                  <div class="field">
                    <label for="aiEnabledInput">Enable AI assistant</label>
                    <select id="aiEnabledInput">
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="aiProviderInput">AI provider</label>
                    <select id="aiProviderInput">
                      <option value="openai">OpenAI</option>
                      <option value="kimi">Kimi</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="aiModelInput">Model</label>
                    <input id="aiModelInput" type="text" placeholder="gpt-5" />
                  </div>
                  <div class="field">
                    <label for="aiTemperatureInput">Temperature</label>
                    <input id="aiTemperatureInput" type="number" min="0" max="2" step="0.1" />
                  </div>
                  <div class="field">
                    <label for="aiMaxTokensInput">Max tokens</label>
                    <input id="aiMaxTokensInput" type="number" min="32" max="1200" step="1" />
                  </div>
                  <div class="field">
                    <label for="aiDefaultLanguageInput">Default language</label>
                    <input id="aiDefaultLanguageInput" type="text" placeholder="uk" />
                  </div>
                </div>
              </div>
              <div class="settings-card">
                <div class="settings-card-head">
                  <strong>Behavior / Tone</strong>
                  <small>Стиль відповіді, тон голосу і правила формулювання AI-повідомлень.</small>
                </div>
                <div class="grid">
                  <div class="field">
                    <label for="aiResponseStyleInput">Response style</label>
                    <select id="aiResponseStyleInput">
                      <option value="short">short</option>
                      <option value="friendly">friendly</option>
                      <option value="sales">sales</option>
                      <option value="technical">technical</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="aiToneInput">Tone of voice</label>
                    <input id="aiToneInput" type="text" />
                  </div>
                  <div class="field full">
                    <label for="aiForbiddenClaimsInput">Forbidden claims</label>
                    <textarea id="aiForbiddenClaimsInput"></textarea>
                  </div>
                  <div class="field full">
                    <label for="aiAskContactStyleInput">Ask-for-contact style</label>
                    <textarea id="aiAskContactStyleInput"></textarea>
                  </div>
                  <div class="field full">
                    <label for="aiAskFileStyleInput">Ask-for-file style</label>
                    <textarea id="aiAskFileStyleInput"></textarea>
                  </div>
                </div>
              </div>
              <div class="settings-card">
                <div class="settings-card-head">
                  <strong>Knowledge / Content</strong>
                  <small>Основний контент, який AI використовує для відповідей клієнтам.</small>
                </div>
                <div class="grid">
                  <div class="field full">
                    <label for="aiCompanyDescriptionInput">Company description</label>
                    <textarea id="aiCompanyDescriptionInput"></textarea>
                  </div>
                  <div class="field full">
                    <label for="aiServicesInput">Services</label>
                    <textarea id="aiServicesInput"></textarea>
                  </div>
                  <div class="field full">
                    <label for="aiFaqInput">FAQ</label>
                    <textarea id="aiFaqInput"></textarea>
                  </div>
                </div>
              </div>
              <div class="settings-card">
                <div class="settings-card-head">
                  <strong>Operational rules</strong>
                  <small>Прайсинг, lead time, вимоги до файлів і інформація про доставку.</small>
                </div>
                <div class="grid">
                  <div class="field full">
                    <label for="aiPricingRulesInput">Pricing rules</label>
                    <textarea id="aiPricingRulesInput"></textarea>
                  </div>
                  <div class="field full">
                    <label for="aiLeadTimeRulesInput">Lead time rules</label>
                    <textarea id="aiLeadTimeRulesInput"></textarea>
                  </div>
                  <div class="field full">
                    <label for="aiFileRequirementsInput">File requirements</label>
                    <textarea id="aiFileRequirementsInput"></textarea>
                  </div>
                  <div class="field full">
                    <label for="aiDeliveryInfoInput">Delivery info</label>
                    <textarea id="aiDeliveryInfoInput"></textarea>
                  </div>
                </div>
              </div>
              <div class="section-actions">
                <button type="button" class="primary" data-save-section="ai">Save AI Settings</button>
                <div id="aiStatus" class="status-line">Тут зберігаються лише site-based AI options, не секрети.</div>
              </div>
            </div>
          </section>

          <section class="settings-section" data-section="crm">
            <div class="settings-section-head">
              <span class="section-copy">
                <strong>Contact / CRM Settings</strong>
                <small>Блок для lead status, tags і майбутніх CRM-параметрів.</small>
              </span>
            </div>
            <div class="settings-section-body" hidden>
              <div class="section-placeholder">
                <strong>Поточний стан</strong>
                <p>Контакти, lead status і tags уже працюють у inbox. Окремі CRM defaults поки не винесені в site settings, але цей блок готовий для майбутніх опцій без зміни структури сторінки.</p>
              </div>
            </div>
          </section>

          <section class="settings-section" data-section="integrations">
            <div class="settings-section-head">
              <span class="section-copy">
                <strong>Integrations</strong>
                <small>Server-side токени, webhook secrets і AI provider credentials.</small>
              </span>
            </div>
            <div class="settings-section-body" hidden>
              <div class="settings-card">
                <div class="settings-card-head">
                  <strong>Telegram</strong>
                  <small>Bot token, webhook secret і username для Telegram integration.</small>
                  <span id="telegramIntegrationBadge" class="status-badge missing">Missing</span>
                </div>
                <div class="grid">
                  <div class="field full">
                    <label for="telegramBotTokenInput">TELEGRAM_BOT_TOKEN</label>
                    <div class="secret-field">
                      <input id="telegramBotTokenInput" type="password" autocomplete="new-password" placeholder="Not configured" />
                      <div class="secret-actions">
                        <button type="button" data-toggle-secret="telegramBotToken">Show</button>
                        <button type="button" data-clear-integration="telegram_bot_token">Clear</button>
                      </div>
                    </div>
                  </div>
                  <div class="field">
                    <label for="telegramWebhookSecretInput">TELEGRAM_WEBHOOK_SECRET</label>
                    <div class="secret-field">
                      <input id="telegramWebhookSecretInput" type="password" autocomplete="new-password" placeholder="Not configured" />
                      <div class="secret-actions">
                        <button type="button" data-toggle-secret="telegramWebhookSecret">Show</button>
                        <button type="button" data-clear-integration="telegram_webhook_secret">Clear</button>
                      </div>
                    </div>
                  </div>
                  <div class="field">
                    <label for="telegramBotUsernameInput">TELEGRAM_BOT_USERNAME</label>
                    <input id="telegramBotUsernameInput" type="text" placeholder="@printforge_bot" />
                  </div>
                </div>
              </div>
              <div class="settings-card">
                <div class="settings-card-head">
                  <strong>Meta (Instagram / Facebook)</strong>
                  <small>Meta app credentials, verify token, page access token and account identifiers.</small>
                  <span id="metaIntegrationBadge" class="status-badge missing">Missing</span>
                </div>
                <div class="grid">
                  <div class="field">
                    <label for="metaAppIdInput">META_APP_ID</label>
                    <input id="metaAppIdInput" type="text" placeholder="Meta app id" />
                  </div>
                  <div class="field">
                    <label for="metaAppSecretInput">META_APP_SECRET</label>
                    <div class="secret-field">
                      <input id="metaAppSecretInput" type="password" autocomplete="new-password" placeholder="Not configured" />
                      <div class="secret-actions">
                        <button type="button" data-toggle-secret="metaAppSecret">Show</button>
                        <button type="button" data-clear-integration="meta_app_secret">Clear</button>
                      </div>
                    </div>
                  </div>
                  <div class="field">
                    <label for="metaVerifyTokenInput">META_VERIFY_TOKEN</label>
                    <div class="secret-field">
                      <input id="metaVerifyTokenInput" type="password" autocomplete="new-password" placeholder="Not configured" />
                      <div class="secret-actions">
                        <button type="button" data-toggle-secret="metaVerifyToken">Show</button>
                        <button type="button" data-clear-integration="meta_verify_token">Clear</button>
                      </div>
                    </div>
                  </div>
                  <div class="field">
                    <label for="metaPageAccessTokenInput">META_PAGE_ACCESS_TOKEN</label>
                    <div class="secret-field">
                      <input id="metaPageAccessTokenInput" type="password" autocomplete="new-password" placeholder="Not configured" />
                      <div class="secret-actions">
                        <button type="button" data-toggle-secret="metaPageAccessToken">Show</button>
                        <button type="button" data-clear-integration="meta_page_access_token">Clear</button>
                      </div>
                    </div>
                  </div>
                  <div class="field">
                    <label for="instagramBusinessAccountIdInput">INSTAGRAM_BUSINESS_ACCOUNT_ID</label>
                    <input id="instagramBusinessAccountIdInput" type="text" placeholder="Instagram business account id" />
                  </div>
                  <div class="field">
                    <label for="facebookPageIdInput">FACEBOOK_PAGE_ID</label>
                    <input id="facebookPageIdInput" type="text" placeholder="Facebook page id" />
                  </div>
                </div>
              </div>
              <div class="settings-card">
                <div class="settings-card-head">
                  <strong>AI Providers</strong>
                  <small>Server-side API keys and base URLs for OpenAI, Kimi and OpenRouter.</small>
                  <span id="aiProvidersIntegrationBadge" class="status-badge missing">Missing</span>
                </div>
                <div class="grid">
                  <div class="field">
                    <label for="openaiApiKeyInput">OPENAI_API_KEY</label>
                    <div class="secret-field">
                      <input id="openaiApiKeyInput" type="password" autocomplete="new-password" placeholder="Not configured" />
                      <div class="secret-actions">
                        <button type="button" data-toggle-secret="openaiApiKey">Show</button>
                        <button type="button" data-clear-integration="openai_api_key">Clear</button>
                      </div>
                    </div>
                  </div>
                  <div class="field">
                    <label for="openaiBaseUrlInput">OPENAI_BASE_URL</label>
                    <input id="openaiBaseUrlInput" type="url" placeholder="https://api.openai.com/v1" />
                  </div>
                  <div class="field">
                    <label for="kimiApiKeyInput">KIMI_API_KEY</label>
                    <div class="secret-field">
                      <input id="kimiApiKeyInput" type="password" autocomplete="new-password" placeholder="Not configured" />
                      <div class="secret-actions">
                        <button type="button" data-toggle-secret="kimiApiKey">Show</button>
                        <button type="button" data-clear-integration="kimi_api_key">Clear</button>
                      </div>
                    </div>
                  </div>
                  <div class="field">
                    <label for="kimiBaseUrlInput">KIMI_BASE_URL</label>
                    <input id="kimiBaseUrlInput" type="url" placeholder="https://api.moonshot.cn/v1" />
                  </div>
                  <div class="field">
                    <label for="openrouterApiKeyInput">OPENROUTER_API_KEY</label>
                    <div class="secret-field">
                      <input id="openrouterApiKeyInput" type="password" autocomplete="new-password" placeholder="Not configured" />
                      <div class="secret-actions">
                        <button type="button" data-toggle-secret="openrouterApiKey">Show</button>
                        <button type="button" data-clear-integration="openrouter_api_key">Clear</button>
                      </div>
                    </div>
                  </div>
                  <div class="field">
                    <label for="openrouterBaseUrlInput">OPENROUTER_BASE_URL</label>
                    <input id="openrouterBaseUrlInput" type="url" placeholder="https://openrouter.ai/api/v1" />
                  </div>
                  <div class="field full">
                    <label for="webhookBaseUrlInput">Webhook base URL</label>
                    <input id="webhookBaseUrlInput" type="url" value="${PUBLIC_BASE_URL}" readonly />
                  </div>
                </div>
              </div>
              <div class="section-actions">
                <button type="button" class="primary" data-save-section="integrations">Save Integrations</button>
                <div id="integrationsStatus" class="status-line">Secrets are stored server-side and returned masked only.</div>
              </div>
            </div>
          </section>

            </div>
            <div class="actions global-actions">
              <div class="left">
                <button id="saveBtn" type="submit" class="primary">Save All</button>
              </div>
              <div id="saveStatus" class="status-line">Зміни ще не збережені.</div>
            </div>
          </div>
          <aside class="settings-preview-panel">
            <div class="settings-preview-head">
              <strong>Live Preview</strong>
              <span>Widget updates instantly from current form state.</span>
            </div>
            <div class="settings-preview-body">
              <div class="preview-phone">
                <div class="preview-widget">
                  <div id="previewHeader" class="preview-header">
                    <div id="previewAvatar" class="preview-avatar">PF</div>
                    <div class="preview-header-copy">
                      <strong id="previewTitle">PrintForge AI</strong>
                      <span id="previewSubtitle">AI assistant · online</span>
                    </div>
                    <div class="preview-status"></div>
                  </div>
                  <div class="preview-chat">
                    <div id="previewQuickActions" class="preview-quick-actions"></div>
                    <div class="preview-messages">
                      <div class="preview-message ai">
                        <div id="previewAiBubble" class="preview-bubble">👋 Привіт! Я AI помічник PrintForge. Можу допомогти з ціною, термінами та кастомним замовленням.</div>
                      </div>
                      <div class="preview-message user">
                        <div id="previewUserBubble" class="preview-bubble">Скільки буде коштувати друк?</div>
                      </div>
                      <div class="preview-message ai">
                        <div id="previewReplyBubble" class="preview-bubble">Напишіть, будь ласка, розмір деталі або надішліть файл, і я підкажу точніше.</div>
                      </div>
                    </div>
                    <div class="preview-input">
                      <div class="preview-input-box">
                        <div class="preview-placeholder">Напишіть повідомлення…</div>
                        <div class="preview-input-row">
                          <span class="status-line">Quick replies + send button</span>
                          <div id="previewSendBtn" class="preview-send-btn">Send</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
          </div>
        </form>
      </main>
    </div>
    `,
    scripts: `<script>
      (function () {
        const state = {
          sites: [],
          selectedSiteId: '',
          currentSettings: null,
          integrationSettings: null,
          pendingIntegrationClear: []
        };

        const siteListEl = document.getElementById('siteList');
        const siteTitleEl = document.getElementById('siteTitle');
        const settingsForm = document.getElementById('settingsForm');
        const saveStatusEl = document.getElementById('saveStatus');
        const aiConfigStatusEl = document.getElementById('aiConfigStatus');
        const sectionEls = Array.from(document.querySelectorAll('[data-section]'));
        const settingsCategoryNav = document.getElementById('settingsCategoryNav');
        const sectionStatusEls = {
          general: document.getElementById('generalStatus'),
          theme: document.getElementById('themeStatus'),
          actions: document.getElementById('actionsStatus'),
          flows: document.getElementById('flowsStatus'),
          ai: document.getElementById('aiStatus'),
          integrations: document.getElementById('integrationsStatus')
        };
        const quickActionsListEl = document.getElementById('quickActionsList');
        const flowScenariosListEl = document.getElementById('flowScenariosList');
        const addQuickActionBtn = document.getElementById('addQuickActionBtn');
        const operatorQuickRepliesListEl = document.getElementById('operatorQuickRepliesList');
        const addOperatorQuickReplyBtn = document.getElementById('addOperatorQuickReplyBtn');
        const operatorsListEl = document.getElementById('operatorsList');
        const addOperatorBtn = document.getElementById('addOperatorBtn');
        const previewEls = {
          header: document.getElementById('previewHeader'),
          avatar: document.getElementById('previewAvatar'),
          title: document.getElementById('previewTitle'),
          subtitle: document.getElementById('previewSubtitle'),
          quickActions: document.getElementById('previewQuickActions'),
          aiBubble: document.getElementById('previewAiBubble'),
          userBubble: document.getElementById('previewUserBubble'),
          replyBubble: document.getElementById('previewReplyBubble'),
          sendBtn: document.getElementById('previewSendBtn')
        };
        const colorControls = {
          primary: { input: document.getElementById('primaryColorInput'), picker: document.getElementById('primaryColorPicker'), presets: document.getElementById('primaryColorPresets') },
          headerBg: { input: document.getElementById('headerBgInput'), picker: document.getElementById('headerBgPicker'), presets: document.getElementById('headerBgPresets') },
          bubbleBg: { input: document.getElementById('bubbleBgInput'), picker: document.getElementById('bubbleBgPicker'), presets: document.getElementById('bubbleBgPresets') },
          textColor: { input: document.getElementById('textColorInput'), picker: document.getElementById('textColorPicker'), presets: document.getElementById('textColorPresets') }
        };
        const PRESET_COLORS = ['#f78c2f', '#3b5bdb', '#2563eb', '#10b981', '#ef4444', '#8b5cf6', '#111827', '#ffffff', '#1f2734', '#f59e0b'];
        const fields = {
          title: document.getElementById('titleInput'),
          avatarUrl: document.getElementById('avatarUrlInput'),
          managerName: document.getElementById('managerNameInput'),
          managerTitle: document.getElementById('managerTitleInput'),
          managerAvatarUrl: document.getElementById('managerAvatarUrlInput'),
          welcomeMessage: document.getElementById('welcomeMessageInput'),
          welcomeIntroLabel: document.getElementById('welcomeIntroLabelInput'),
          onlineStatusText: document.getElementById('onlineStatusTextInput'),
          primary: document.getElementById('primaryColorInput'),
          headerBg: document.getElementById('headerBgInput'),
          bubbleBg: document.getElementById('bubbleBgInput'),
          textColor: document.getElementById('textColorInput'),
          aiEnabled: document.getElementById('aiEnabledInput'),
          aiProvider: document.getElementById('aiProviderInput'),
          aiModel: document.getElementById('aiModelInput'),
          aiTemperature: document.getElementById('aiTemperatureInput'),
          aiMaxTokens: document.getElementById('aiMaxTokensInput'),
          aiCompanyDescription: document.getElementById('aiCompanyDescriptionInput'),
          aiServices: document.getElementById('aiServicesInput'),
          aiFaq: document.getElementById('aiFaqInput'),
          aiPricingRules: document.getElementById('aiPricingRulesInput'),
          aiLeadTimeRules: document.getElementById('aiLeadTimeRulesInput'),
          aiFileRequirements: document.getElementById('aiFileRequirementsInput'),
          aiDeliveryInfo: document.getElementById('aiDeliveryInfoInput'),
          aiTone: document.getElementById('aiToneInput'),
          aiForbiddenClaims: document.getElementById('aiForbiddenClaimsInput'),
          aiDefaultLanguage: document.getElementById('aiDefaultLanguageInput'),
          aiResponseStyle: document.getElementById('aiResponseStyleInput'),
          aiAskContactStyle: document.getElementById('aiAskContactStyleInput'),
          aiAskFileStyle: document.getElementById('aiAskFileStyleInput'),
          telegramBotToken: document.getElementById('telegramBotTokenInput'),
          telegramWebhookSecret: document.getElementById('telegramWebhookSecretInput'),
          telegramBotUsername: document.getElementById('telegramBotUsernameInput'),
          metaAppId: document.getElementById('metaAppIdInput'),
          metaAppSecret: document.getElementById('metaAppSecretInput'),
          metaVerifyToken: document.getElementById('metaVerifyTokenInput'),
          metaPageAccessToken: document.getElementById('metaPageAccessTokenInput'),
          instagramBusinessAccountId: document.getElementById('instagramBusinessAccountIdInput'),
          facebookPageId: document.getElementById('facebookPageIdInput'),
          openaiApiKey: document.getElementById('openaiApiKeyInput'),
          openaiBaseUrl: document.getElementById('openaiBaseUrlInput'),
          kimiApiKey: document.getElementById('kimiApiKeyInput'),
          kimiBaseUrl: document.getElementById('kimiBaseUrlInput'),
          openrouterApiKey: document.getElementById('openrouterApiKeyInput'),
          openrouterBaseUrl: document.getElementById('openrouterBaseUrlInput')
        };
        const integrationBadges = {
          telegram: document.getElementById('telegramIntegrationBadge'),
          meta: document.getElementById('metaIntegrationBadge'),
          aiProviders: document.getElementById('aiProvidersIntegrationBadge')
        };

        function escapeHtml(value) {
          return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function normalizeHexColor(value, fallback) {
          const clean = String(value || '').trim();
          return /^#([0-9a-f]{6})$/i.test(clean) ? clean.toLowerCase() : fallback;
        }

        function hexToRgba(hex, alpha) {
          const normalized = normalizeHexColor(hex, '#000000').slice(1);
          const red = parseInt(normalized.slice(0, 2), 16);
          const green = parseInt(normalized.slice(2, 4), 16);
          const blue = parseInt(normalized.slice(4, 6), 16);
          return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alpha + ')';
        }

        function mixHexColors(hexA, hexB, ratio) {
          const normalizedA = normalizeHexColor(hexA, '#000000').slice(1);
          const normalizedB = normalizeHexColor(hexB, '#ffffff').slice(1);
          const weight = Math.max(0, Math.min(1, Number(ratio) || 0));
          const parts = [0, 2, 4].map(function (index) {
            const valueA = parseInt(normalizedA.slice(index, index + 2), 16);
            const valueB = parseInt(normalizedB.slice(index, index + 2), 16);
            const mixed = Math.round(valueA + ((valueB - valueA) * weight));
            return mixed.toString(16).padStart(2, '0');
          });
          return '#' + parts.join('');
        }

        function getReadableTextColor(hex, lightFallback, darkFallback) {
          const normalized = normalizeHexColor(hex, '#000000').slice(1);
          const red = parseInt(normalized.slice(0, 2), 16);
          const green = parseInt(normalized.slice(2, 4), 16);
          const blue = parseInt(normalized.slice(4, 6), 16);
          const brightness = ((red * 299) + (green * 587) + (blue * 114)) / 1000;
          return brightness >= 160 ? (darkFallback || '#17202d') : (lightFallback || '#ffffff');
        }

        function getInitials(value, fallback) {
          const source = String(value || fallback || '').trim();
          if (!source) return 'PF';
          const parts = source.split(/\s+/).filter(Boolean);
          if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
          }
          return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }

        function renderColorPresets(controlKey, activeColor) {
          const control = colorControls[controlKey];
          if (!control || !control.presets) return;
          control.presets.innerHTML = PRESET_COLORS.map(function (color) {
            const isActive = normalizeHexColor(activeColor, '') === color.toLowerCase();
            return '<button type="button" class="color-preset' + (isActive ? ' is-active' : '') + '" data-color-control="' + escapeHtml(controlKey) + '" data-color-value="' + escapeHtml(color) + '" style="background:' + escapeHtml(color) + ';"></button>';
          }).join('');
        }

        function syncColorControl(controlKey, fallback) {
          const control = colorControls[controlKey];
          if (!control || !control.input) return;
          const normalized = normalizeHexColor(control.input.value, fallback);
          if (control.picker) {
            control.picker.value = normalized;
          }
          renderColorPresets(controlKey, normalized);
        }

        function applyColorValue(controlKey, value, fallback) {
          const control = colorControls[controlKey];
          if (!control || !control.input) return;
          control.input.value = normalizeHexColor(value, fallback);
          syncColorControl(controlKey, fallback);
          renderLivePreview();
        }

        function renderLivePreview() {
          const primary = normalizeHexColor(fields.primary.value, '#f78c2f');
          const headerBg = normalizeHexColor(fields.headerBg.value, '#131926');
          const bubbleBg = normalizeHexColor(fields.bubbleBg.value, '#ffffff');
          const textColor = normalizeHexColor(fields.textColor.value, '#1f2734');
          const onPrimary = getReadableTextColor(primary, '#ffffff', '#17202d');
          const title = fields.title.value.trim() || 'PrintForge AI';
          const intro = fields.welcomeIntroLabel.value.trim() || 'AI assistant';
          const status = fields.onlineStatusText.value.trim() || 'online';
          const welcomeMessage = fields.welcomeMessage.value.trim() || '👋 Привіт! Я AI помічник PrintForge. Можу допомогти з ціною, термінами та кастомним замовленням.';
          const managerName = fields.managerName.value.trim() || 'Марія';
          const avatarUrl = fields.avatarUrl.value.trim();

          if (previewEls.header) {
            previewEls.header.style.background = headerBg;
          }
          if (previewEls.title) previewEls.title.textContent = title;
          if (previewEls.subtitle) previewEls.subtitle.textContent = intro + ' · ' + status;
          if (previewEls.avatar) {
            previewEls.avatar.innerHTML = avatarUrl
              ? '<img src="' + escapeHtml(avatarUrl) + '" alt="' + escapeHtml(title) + '" />'
              : escapeHtml(getInitials(title, 'PF'));
          }
          if (previewEls.aiBubble) {
            previewEls.aiBubble.textContent = welcomeMessage;
            previewEls.aiBubble.style.background = bubbleBg;
            previewEls.aiBubble.style.color = textColor;
          }
          if (previewEls.replyBubble) {
            previewEls.replyBubble.style.background = bubbleBg;
            previewEls.replyBubble.style.color = textColor;
          }
          if (previewEls.userBubble) {
            previewEls.userBubble.style.background = primary;
            previewEls.userBubble.style.color = onPrimary;
            previewEls.userBubble.style.boxShadow = '0 6px 16px ' + hexToRgba(primary, 0.16);
          }
          if (previewEls.sendBtn) {
            previewEls.sendBtn.style.background = primary;
            previewEls.sendBtn.style.color = onPrimary;
            previewEls.sendBtn.style.boxShadow = '0 6px 16px ' + hexToRgba(primary, 0.16);
          }
          if (previewEls.quickActions) {
            const actions = collectQuickActions().slice(0, 4);
            previewEls.quickActions.innerHTML = actions.map(function (item) {
              return '<span class="preview-chip" style="border-color:' + escapeHtml(hexToRgba(primary, 0.16)) + ';color:' + escapeHtml(textColor) + ';"><span>' + escapeHtml(item.icon || '💬') + '</span><span>' + escapeHtml(item.label || 'Quick action') + '</span></span>';
            }).join('') || '<span class="preview-chip">💬 Quick action</span>';
          }
        }

        function updateAiProviderStatus(settings) {
          const provider = fields.aiProvider.value || settings.aiAssistant?.provider || 'openai';
          const providerStatus = settings.aiProviderStatus || {};
          const configured = Boolean(providerStatus[provider]);
          const providerLabel = provider === 'kimi' ? 'Kimi' : provider === 'openrouter' ? 'OpenRouter' : 'OpenAI';
          aiConfigStatusEl.textContent = providerLabel + ' key: ' + (configured ? 'Configured' : 'Not configured');
          aiConfigStatusEl.className = 'status-line' + (configured ? ' success' : '');
        }

        function setIntegrationBadge(el, configured, label) {
          if (!el) return;
          el.textContent = label || (configured ? 'Configured' : 'Missing');
          el.className = 'status-badge ' + (configured ? 'ok' : 'missing');
        }

        function applySecretFieldState(field, descriptor, key) {
          if (!field) return;
          const isPendingClear = state.pendingIntegrationClear.indexOf(key) !== -1;
          field.value = '';
          field.placeholder = isPendingClear
            ? 'Will be cleared on save'
            : (descriptor && descriptor.configured
              ? (descriptor.maskedValue || 'Configured')
              : 'Not configured');
          field.dataset.configured = descriptor && descriptor.configured ? 'true' : 'false';
        }

        function fillIntegrationForm(settings) {
          const safe = settings && settings.fields ? settings : { fields: {}, groups: {} };
          state.integrationSettings = safe;
          state.pendingIntegrationClear = [];
          const getField = function (key) {
            return safe.fields && safe.fields[key] ? safe.fields[key] : { configured: false, value: '', maskedValue: '' };
          };

          applySecretFieldState(fields.telegramBotToken, getField('telegram_bot_token'), 'telegram_bot_token');
          applySecretFieldState(fields.telegramWebhookSecret, getField('telegram_webhook_secret'), 'telegram_webhook_secret');
          fields.telegramBotUsername.value = getField('telegram_bot_username').value || '';
          fields.metaAppId.value = getField('meta_app_id').value || '';
          applySecretFieldState(fields.metaAppSecret, getField('meta_app_secret'), 'meta_app_secret');
          applySecretFieldState(fields.metaVerifyToken, getField('meta_verify_token'), 'meta_verify_token');
          applySecretFieldState(fields.metaPageAccessToken, getField('meta_page_access_token'), 'meta_page_access_token');
          fields.instagramBusinessAccountId.value = getField('instagram_business_account_id').value || '';
          fields.facebookPageId.value = getField('facebook_page_id').value || '';
          applySecretFieldState(fields.openaiApiKey, getField('openai_api_key'), 'openai_api_key');
          fields.openaiBaseUrl.value = getField('openai_base_url').value || '';
          applySecretFieldState(fields.kimiApiKey, getField('kimi_api_key'), 'kimi_api_key');
          fields.kimiBaseUrl.value = getField('kimi_base_url').value || '';
          applySecretFieldState(fields.openrouterApiKey, getField('openrouter_api_key'), 'openrouter_api_key');
          fields.openrouterBaseUrl.value = getField('openrouter_base_url').value || '';

          setIntegrationBadge(integrationBadges.telegram, safe.groups && safe.groups.telegram && safe.groups.telegram.configured, safe.groups && safe.groups.telegram && safe.groups.telegram.label);
          setIntegrationBadge(integrationBadges.meta, safe.groups && safe.groups.meta && safe.groups.meta.configured, safe.groups && safe.groups.meta && safe.groups.meta.label);
          setIntegrationBadge(integrationBadges.aiProviders, safe.groups && safe.groups.aiProviders && safe.groups.aiProviders.configured, safe.groups && safe.groups.aiProviders && safe.groups.aiProviders.label);
          Array.from(settingsForm.querySelectorAll('[data-clear-integration]')).forEach(function (button) {
            button.classList.remove('clear-pending');
            button.textContent = 'Clear';
          });
          Array.from(settingsForm.querySelectorAll('[data-toggle-secret]')).forEach(function (button) {
            button.textContent = 'Show';
          });
          if (state.currentSettings) {
            state.currentSettings.aiProviderStatus = {
              openai: Boolean(getField('openai_api_key').configured),
              kimi: Boolean(getField('kimi_api_key').configured),
              openrouter: Boolean(getField('openrouter_api_key').configured)
            };
          }
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

        function setActiveSection(sectionKey) {
          sectionEls.forEach(function (section) {
            const key = section.getAttribute('data-section');
            const body = section.querySelector('.settings-section-body');
            const isOpen = key === sectionKey;
            section.classList.toggle('is-open', isOpen);
            section.hidden = !isOpen;
            if (body) {
              body.hidden = false;
            }
          });
          Array.from(settingsCategoryNav.querySelectorAll('[data-settings-nav]')).forEach(function (button) {
            button.classList.toggle('active', button.getAttribute('data-settings-nav') === sectionKey);
          });
        }

        function setGlobalStatus(text, success) {
          saveStatusEl.textContent = text;
          saveStatusEl.className = 'status-line' + (success ? ' success' : '');
        }

        function setSectionStatus(sectionKey, text, success) {
          const el = sectionStatusEls[sectionKey];
          if (!el) return;
          el.textContent = text;
          el.className = 'status-line' + (success ? ' success' : '');
        }

        function resetSectionStatuses() {
          setGlobalStatus('Зміни ще не збережені.', false);
          setSectionStatus('general', 'Можна редагувати й зберегти тільки цей блок.', false);
          setSectionStatus('theme', 'Зміни стилю не впливають на backend-логіку.', false);
          setSectionStatus('actions', 'Редагуйте список кнопок і quick replies окремо від flow.', false);
          setSectionStatus('flows', 'Widget використовує саме ці сценарії для quick action кнопок.', false);
          setSectionStatus('ai', 'Тут зберігаються лише site-based AI options, не секрети.', false);
          setSectionStatus('integrations', 'Secrets are stored server-side and returned masked only.', false);
        }

        function createFlowOptionRow(option) {
          return '<div class="flow-option-row">' +
            '<div class="flow-option-fields">' +
              '<input type="text" data-flow-option-field="label" placeholder="Option label" value="' + escapeHtml(option.label || '') + '" />' +
              '<input type="text" data-flow-option-field="value" placeholder="option_value" value="' + escapeHtml(option.value || '') + '" />' +
            '</div>' +
            '<div class="flow-option-actions">' +
              '<button type="button" class="danger" data-remove-flow-option="true">×</button>' +
            '</div>' +
          '</div>';
        }

        function createFlowStepCard(step) {
          const options = Array.isArray(step.options) ? step.options : [];
          return '<div class="flow-step-card">' +
            '<div class="flow-step-head">' +
              '<strong>' + escapeHtml(step.id || 'step') + '</strong>' +
              '<div class="flow-step-actions">' +
                '<button type="button" class="secondary" data-move-flow-step="up">↑</button>' +
                '<button type="button" class="secondary" data-move-flow-step="down">↓</button>' +
                '<button type="button" class="danger" data-remove-flow-step="true">Delete</button>' +
              '</div>' +
            '</div>' +
            '<div class="flow-step-grid">' +
              '<input type="text" data-flow-step-field="id" placeholder="step_id" value="' + escapeHtml(step.id || '') + '" />' +
              '<select data-flow-step-field="input">' +
                '<option value="text"' + (step.input === 'text' ? ' selected' : '') + '>text</option>' +
                '<option value="choice"' + (step.input === 'choice' ? ' selected' : '') + '>choice</option>' +
                '<option value="file"' + (step.input === 'file' ? ' selected' : '') + '>file</option>' +
                '<option value="none"' + (step.input === 'none' ? ' selected' : '') + '>none</option>' +
              '</select>' +
              '<input type="text" data-flow-step-field="type" placeholder="message / choice" value="' + escapeHtml(step.type || 'message') + '" />' +
            '</div>' +
            '<textarea data-flow-step-field="text" placeholder="Bot message / question">' + escapeHtml(step.text || '') + '</textarea>' +
            '<div class="flow-options"' + ((step.input === 'choice' || step.type === 'choice') ? '' : ' hidden') + '>' +
              '<div class="flow-editor-head">' +
                '<strong>Choice options</strong>' +
                '<button type="button" class="secondary" data-add-flow-option="true">Add option</button>' +
              '</div>' +
              '<div data-flow-options-list="true">' + options.map(createFlowOptionRow).join('') + '</div>' +
            '</div>' +
          '</div>';
        }

        function createQuickActionRow(item) {
          return '<div class="quick-action-row" data-quick-action-row="true">' +
            '<input type="text" data-qa-field="icon" placeholder="💬" value="' + escapeHtml(item.icon || '') + '" />' +
            '<input type="text" data-qa-field="label" placeholder="Назва кнопки" value="' + escapeHtml(item.label || '') + '" />' +
            '<input type="text" data-qa-field="key" placeholder="price / time / upload / question" value="' + escapeHtml(item.key || '') + '" />' +
            '<button type="button" class="secondary" data-move-quick-action="up">↑</button>' +
            '<button type="button" class="secondary" data-move-quick-action="down">↓</button>' +
            '<button type="button" class="danger" data-remove-quick-action="true">Видалити</button>' +
          '</div>';
        }

        function createFlowScenarioRow(item) {
          const flow = Array.isArray(item.flow) ? item.flow : [];
          const title = item.label || item.key || 'Без назви';
          return '<div class="flow-scenario-card" data-flow-scenario-row="true">' +
            '<div class="flow-scenario-head">' +
              '<div>' +
                '<strong>' + escapeHtml(title) + '</strong>' +
                '<p>' + escapeHtml(item.key || 'quick_action') + '</p>' +
              '</div>' +
              '<button type="button" class="secondary" data-add-flow-step="true">Add step</button>' +
            '</div>' +
            '<div class="flow-editor">' +
              '<div class="flow-steps" data-flow-steps="true">' + flow.map(createFlowStepCard).join('') + '</div>' +
            '</div>' +
          '</div>';
        }

        function renderQuickActions(actions) {
          quickActionsListEl.innerHTML = (actions || []).map(createQuickActionRow).join('');
          flowScenariosListEl.innerHTML = (actions || []).map(createFlowScenarioRow).join('');
        }

        function createOperatorQuickReplyRow(item) {
          return '<div class="quick-action-row operator-reply-row">' +
            '<input type="text" data-oqr-field="text" placeholder="Швидка відповідь для оператора" value="' + escapeHtml(item.text || '') + '" />' +
            '<button type="button" class="secondary" data-move-operator-quick-reply="up">↑</button>' +
            '<button type="button" class="secondary" data-move-operator-quick-reply="down">↓</button>' +
            '<button type="button" class="danger" data-remove-operator-quick-reply="true">Видалити</button>' +
          '</div>';
        }

        function renderOperatorQuickReplies(items) {
          operatorQuickRepliesListEl.innerHTML = (items || []).map(createOperatorQuickReplyRow).join('');
        }

        function createOperatorRow(item) {
          return '<div class="operator-row">' +
            '<input type="text" data-operator-field="name" placeholder="Maria" value="' + escapeHtml(item.name || '') + '" />' +
            '<input type="text" data-operator-field="title" placeholder="Менеджер PrintForge" value="' + escapeHtml(item.title || '') + '" />' +
            '<input type="url" data-operator-field="avatarUrl" placeholder="https://..." value="' + escapeHtml(item.avatarUrl || '') + '" />' +
            '<button type="button" class="danger" data-remove-operator="true">Видалити</button>' +
          '</div>';
        }

        function renderOperators(items) {
          operatorsListEl.innerHTML = (items || []).map(createOperatorRow).join('');
        }

        function collectOperators() {
          return Array.from(operatorsListEl.querySelectorAll('.operator-row')).map(function (row) {
            return {
              name: row.querySelector('[data-operator-field="name"]').value.trim(),
              title: row.querySelector('[data-operator-field="title"]').value.trim(),
              avatarUrl: row.querySelector('[data-operator-field="avatarUrl"]').value.trim()
            };
          }).filter(function (item) {
            return item.name;
          });
        }

        function fillForm(settings) {
          state.currentSettings = settings;
          siteTitleEl.textContent = settings.title || settings.siteId;
          fields.title.value = settings.title || '';
          fields.avatarUrl.value = settings.avatarUrl || '';
          fields.managerName.value = settings.managerName || '';
          fields.managerTitle.value = settings.managerTitle || settings.operatorMetaLabel || '';
          fields.managerAvatarUrl.value = settings.managerAvatarUrl || '';
          fields.welcomeMessage.value = settings.welcomeMessage || '';
          fields.welcomeIntroLabel.value = settings.welcomeIntroLabel || '';
          fields.onlineStatusText.value = settings.onlineStatusText || '';
          fields.primary.value = settings.theme?.primary || '';
          fields.headerBg.value = settings.theme?.headerBg || '';
          fields.bubbleBg.value = settings.theme?.bubbleBg || '';
          fields.textColor.value = settings.theme?.textColor || '';
          fields.aiEnabled.value = settings.aiAssistant?.enabled === false ? 'false' : 'true';
          fields.aiProvider.value = settings.aiAssistant?.provider || 'openai';
          fields.aiModel.value = settings.aiAssistant?.model || 'gpt-5';
          fields.aiTemperature.value = settings.aiAssistant?.temperature ?? 0.4;
          fields.aiMaxTokens.value = settings.aiAssistant?.maxTokens ?? 220;
          fields.aiCompanyDescription.value = settings.aiAssistant?.companyDescription || '';
          fields.aiServices.value = settings.aiAssistant?.services || '';
          fields.aiFaq.value = settings.aiAssistant?.faq || '';
          fields.aiPricingRules.value = settings.aiAssistant?.pricingRules || '';
          fields.aiLeadTimeRules.value = settings.aiAssistant?.leadTimeRules || '';
          fields.aiFileRequirements.value = settings.aiAssistant?.fileRequirements || '';
          fields.aiDeliveryInfo.value = settings.aiAssistant?.deliveryInfo || '';
          fields.aiTone.value = settings.aiAssistant?.tone || '';
          fields.aiForbiddenClaims.value = settings.aiAssistant?.forbiddenClaims || '';
          fields.aiDefaultLanguage.value = settings.aiAssistant?.defaultLanguage || 'uk';
          fields.aiResponseStyle.value = settings.aiAssistant?.responseStyle || 'short';
          fields.aiAskContactStyle.value = settings.aiAssistant?.askContactStyle || '';
          fields.aiAskFileStyle.value = settings.aiAssistant?.askFileStyle || '';
          updateAiProviderStatus(settings);
          renderQuickActions(settings.quickActions || []);
          renderOperatorQuickReplies(settings.operatorQuickReplies || []);
          renderOperators(settings.operators || []);
          syncColorControl('primary', '#f78c2f');
          syncColorControl('headerBg', '#131926');
          syncColorControl('bubbleBg', '#ffffff');
          syncColorControl('textColor', '#1f2734');
          renderLivePreview();
          resetSectionStatuses();
          const currentOpen = document.querySelector('.settings-section.is-open');
          setActiveSection(currentOpen ? (currentOpen.getAttribute('data-section') || 'general') : 'general');
        }

        function collectQuickActions() {
          const actionRows = Array.from(quickActionsListEl.querySelectorAll('[data-quick-action-row]'));
          const flowRows = Array.from(flowScenariosListEl.querySelectorAll('[data-flow-scenario-row]'));
          return actionRows.map(function (row, rowIndex) {
            const flowRow = flowRows[rowIndex];
            const flow = flowRow ? Array.from(flowRow.querySelectorAll('[data-flow-steps] .flow-step-card')).map(function (stepRow, index) {
              const type = stepRow.querySelector('[data-flow-step-field="type"]').value.trim() || 'message';
              const input = stepRow.querySelector('[data-flow-step-field="input"]').value.trim() || 'text';
              const options = Array.from(stepRow.querySelectorAll('[data-flow-options-list] .flow-option-row')).map(function (optionRow) {
                return {
                  label: optionRow.querySelector('[data-flow-option-field="label"]').value.trim(),
                  value: optionRow.querySelector('[data-flow-option-field="value"]').value.trim()
                };
              }).filter(function (option) {
                return option.label;
              });
              return {
                id: stepRow.querySelector('[data-flow-step-field="id"]').value.trim() || ('step_' + (index + 1)),
                type: type,
                input: input,
                text: stepRow.querySelector('[data-flow-step-field="text"]').value,
                options: options
              };
            }).filter(function (step) {
              return step.text.trim() || step.input === 'none';
            }) : [];
            return {
              icon: row.querySelector('[data-qa-field="icon"]').value.trim(),
              label: row.querySelector('[data-qa-field="label"]').value.trim(),
              key: row.querySelector('[data-qa-field="key"]').value.trim(),
              flow: flow
            };
          });
        }

        function collectOperatorQuickReplies() {
          return Array.from(operatorQuickRepliesListEl.querySelectorAll('.quick-action-row')).map(function (row) {
            return {
              text: row.querySelector('[data-oqr-field="text"]').value.trim()
            };
          }).filter(function (item) {
            return item.text;
          });
        }

        async function loadSites() {
          const payload = await fetchJson('/api/admin/sites');
          state.sites = payload.sites || [];
          if (!state.selectedSiteId && state.sites.length) {
            state.selectedSiteId = state.sites[0].siteId;
          }
          renderSiteList();
          await loadIntegrationSettings();
          if (state.selectedSiteId) {
            await loadSettings(state.selectedSiteId);
          }
        }

        async function loadIntegrationSettings() {
          const payload = await fetchJson('/api/admin/integrations');
          fillIntegrationForm(payload.settings || {});
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

        settingsCategoryNav.addEventListener('click', function (event) {
          const button = event.target.closest('[data-settings-nav]');
          if (!button) return;
          setActiveSection(button.getAttribute('data-settings-nav') || 'general');
        });

        addQuickActionBtn.addEventListener('click', function () {
          const actions = collectQuickActions();
          actions.push({ icon: '💬', label: '', key: '', flow: [] });
          renderQuickActions(actions);
          setSectionStatus('actions', 'Є нова кнопка. Не забудь зберегти.', false);
          setSectionStatus('flows', 'Для нової кнопки можна налаштувати сценарій нижче.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        addOperatorQuickReplyBtn.addEventListener('click', function () {
          operatorQuickRepliesListEl.insertAdjacentHTML('beforeend', createOperatorQuickReplyRow({ text: '' }));
          setSectionStatus('actions', 'Є нова quick reply. Не забудь зберегти.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        addOperatorBtn.addEventListener('click', function () {
          operatorsListEl.insertAdjacentHTML('beforeend', createOperatorRow({
            name: '',
            title: fields.managerTitle.value.trim() || 'Менеджер',
            avatarUrl: ''
          }));
          setSectionStatus('general', 'Є новий оператор. Не забудь зберегти.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        fields.aiProvider.addEventListener('change', function () {
          updateAiProviderStatus(state.currentSettings || { aiAssistant: {}, aiProviderStatus: {} });
          setSectionStatus('ai', 'Provider змінено. Не забудь зберегти AI settings.', false);
        });

        settingsForm.addEventListener('input', function (event) {
          const section = event.target.closest('[data-section]');
          if (!section) return;
          const key = section.getAttribute('data-section') || '';
          if (event.target === fields.primary) syncColorControl('primary', '#f78c2f');
          if (event.target === fields.headerBg) syncColorControl('headerBg', '#131926');
          if (event.target === fields.bubbleBg) syncColorControl('bubbleBg', '#ffffff');
          if (event.target === fields.textColor) syncColorControl('textColor', '#1f2734');
          renderLivePreview();
          if (key === 'general') {
            setSectionStatus('general', 'Є незбережені зміни в General.', false);
          } else if (key === 'theme') {
            setSectionStatus('theme', 'Є незбережені зміни у вигляді віджета.', false);
          } else if (key === 'ai') {
            setSectionStatus('ai', 'Є незбережені зміни в AI settings.', false);
          } else if (key === 'integrations') {
            setSectionStatus('integrations', 'Є незбережені зміни в integration settings.', false);
          }
          setGlobalStatus('Є незбережені зміни.', false);
        });

        Object.keys(colorControls).forEach(function (key) {
          const control = colorControls[key];
          if (!control) return;
          if (control.picker) {
            control.picker.addEventListener('input', function () {
              const fallbackMap = { primary: '#f78c2f', headerBg: '#131926', bubbleBg: '#ffffff', textColor: '#1f2734' };
              applyColorValue(key, control.picker.value, fallbackMap[key]);
              setSectionStatus('theme', 'Є незбережені зміни у вигляді віджета.', false);
              setGlobalStatus('Є незбережені зміни.', false);
            });
          }
          if (control.presets) {
            control.presets.addEventListener('click', function (event) {
              const button = event.target.closest('[data-color-value]');
              if (!button) return;
              const fallbackMap = { primary: '#f78c2f', headerBg: '#131926', bubbleBg: '#ffffff', textColor: '#1f2734' };
              applyColorValue(key, button.getAttribute('data-color-value') || '', fallbackMap[key]);
              setSectionStatus('theme', 'Є незбережені зміни у вигляді віджета.', false);
              setGlobalStatus('Є незбережені зміни.', false);
            });
          }
        });

        quickActionsListEl.addEventListener('click', function (event) {
          const button = event.target.closest('[data-remove-quick-action]');
          if (button) {
            const row = button.closest('.quick-action-row');
            if (!row) return;
            const actions = collectQuickActions();
            const index = Array.from(quickActionsListEl.querySelectorAll('.quick-action-row')).indexOf(row);
            if (index >= 0) {
              actions.splice(index, 1);
              renderQuickActions(actions);
              setSectionStatus('actions', 'Кнопку видалено. Не забудь зберегти.', false);
              setSectionStatus('flows', 'Сценарії синхронізовано зі списком кнопок.', false);
              setGlobalStatus('Є незбережені зміни.', false);
            }
            return;
          }

          const moveButton = event.target.closest('[data-move-quick-action]');
          if (moveButton) {
            const row = moveButton.closest('.quick-action-row');
            const direction = moveButton.getAttribute('data-move-quick-action');
            const actions = collectQuickActions();
            const index = Array.from(quickActionsListEl.querySelectorAll('.quick-action-row')).indexOf(row);
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (index < 0 || targetIndex < 0 || targetIndex >= actions.length) return;
            const item = actions[index];
            actions[index] = actions[targetIndex];
            actions[targetIndex] = item;
            renderQuickActions(actions);
            setSectionStatus('actions', 'Порядок кнопок змінено. Не забудь зберегти.', false);
            setSectionStatus('flows', 'Порядок сценаріїв оновлено разом із кнопками.', false);
            setGlobalStatus('Є незбережені зміни.', false);
            return;
          }
        });

        quickActionsListEl.addEventListener('input', function () {
          setSectionStatus('actions', 'Є незбережені зміни в quick actions.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        quickActionsListEl.addEventListener('change', function () {
          renderQuickActions(collectQuickActions());
          setSectionStatus('actions', 'Quick actions оновлено. Не забудь зберегти.', false);
          setSectionStatus('flows', 'Назви сценаріїв оновлено. Не забудь зберегти.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        flowScenariosListEl.addEventListener('click', function (event) {
          const addStepButton = event.target.closest('[data-add-flow-step]');
          if (addStepButton) {
            const row = addStepButton.closest('[data-flow-scenario-row]');
            const list = row && row.querySelector('[data-flow-steps]');
            if (list) {
              list.insertAdjacentHTML('beforeend', createFlowStepCard({
                id: 'step_' + (list.children.length + 1),
                type: 'message',
                input: 'text',
                text: '',
                options: []
              }));
              setSectionStatus('flows', 'Крок додано. Не забудь зберегти.', false);
              setGlobalStatus('Є незбережені зміни.', false);
            }
            return;
          }

          const moveStepButton = event.target.closest('[data-move-flow-step]');
          if (moveStepButton) {
            const step = moveStepButton.closest('.flow-step-card');
            const direction = moveStepButton.getAttribute('data-move-flow-step');
            if (!step) return;
            if (direction === 'up' && step.previousElementSibling) {
              step.parentNode.insertBefore(step, step.previousElementSibling);
            }
            if (direction === 'down' && step.nextElementSibling) {
              step.parentNode.insertBefore(step.nextElementSibling, step);
            }
            setSectionStatus('flows', 'Порядок кроків змінено. Не забудь зберегти.', false);
            setGlobalStatus('Є незбережені зміни.', false);
            return;
          }

          const removeStepButton = event.target.closest('[data-remove-flow-step]');
          if (removeStepButton) {
            const step = removeStepButton.closest('.flow-step-card');
            if (step) {
              step.remove();
              setSectionStatus('flows', 'Крок видалено. Не забудь зберегти.', false);
              setGlobalStatus('Є незбережені зміни.', false);
            }
            return;
          }

          const addOptionButton = event.target.closest('[data-add-flow-option]');
          if (addOptionButton) {
            const step = addOptionButton.closest('.flow-step-card');
            const list = step && step.querySelector('[data-flow-options-list]');
            if (list) {
              list.insertAdjacentHTML('beforeend', createFlowOptionRow({ label: '', value: '' }));
              setSectionStatus('flows', 'Опцію додано. Не забудь зберегти.', false);
              setGlobalStatus('Є незбережені зміни.', false);
            }
            return;
          }

          const removeOptionButton = event.target.closest('[data-remove-flow-option]');
          if (removeOptionButton) {
            const optionRow = removeOptionButton.closest('.flow-option-row');
            if (optionRow) {
              optionRow.remove();
              setSectionStatus('flows', 'Опцію видалено. Не забудь зберегти.', false);
              setGlobalStatus('Є незбережені зміни.', false);
            }
          }
        });

        flowScenariosListEl.addEventListener('change', function (event) {
          const inputSelect = event.target.closest('[data-flow-step-field="input"], [data-flow-step-field="type"]');
          if (!inputSelect) return;
          const step = inputSelect.closest('.flow-step-card');
          if (!step) return;
          const type = step.querySelector('[data-flow-step-field="type"]').value.trim().toLowerCase();
          const input = step.querySelector('[data-flow-step-field="input"]').value.trim().toLowerCase();
          const optionsWrap = step.querySelector('.flow-options');
          if (optionsWrap) {
            optionsWrap.hidden = !(type === 'choice' || input === 'choice');
          }
          setSectionStatus('flows', 'Є незбережені зміни в flow.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        flowScenariosListEl.addEventListener('input', function () {
          setSectionStatus('flows', 'Є незбережені зміни в flow.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        operatorQuickRepliesListEl.addEventListener('click', function (event) {
          const removeButton = event.target.closest('[data-remove-operator-quick-reply]');
          if (removeButton) {
            const row = removeButton.closest('.quick-action-row');
            if (row) {
              row.remove();
              setSectionStatus('actions', 'Quick reply видалено. Не забудь зберегти.', false);
              setGlobalStatus('Є незбережені зміни.', false);
            }
            return;
          }

          const moveButton = event.target.closest('[data-move-operator-quick-reply]');
          if (!moveButton) return;
          const direction = moveButton.getAttribute('data-move-operator-quick-reply');
          const row = moveButton.closest('.quick-action-row');
          if (!row) return;
          if (direction === 'up' && row.previousElementSibling) {
            row.parentNode.insertBefore(row, row.previousElementSibling);
          }
          if (direction === 'down' && row.nextElementSibling) {
            row.parentNode.insertBefore(row.nextElementSibling, row);
          }
          setSectionStatus('actions', 'Порядок quick replies змінено. Не забудь зберегти.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        operatorQuickRepliesListEl.addEventListener('input', function () {
          setSectionStatus('actions', 'Є незбережені зміни в quick replies.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        operatorsListEl.addEventListener('click', function (event) {
          const removeButton = event.target.closest('[data-remove-operator]');
          if (!removeButton) return;
          const row = removeButton.closest('.operator-row');
          if (row) {
            row.remove();
            setSectionStatus('general', 'Оператора видалено. Не забудь зберегти.', false);
            setGlobalStatus('Є незбережені зміни.', false);
          }
        });

        operatorsListEl.addEventListener('input', function () {
          setSectionStatus('general', 'Є незбережені зміни в списку операторів.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        function buildSettingsPayload() {
          return {
            title: fields.title.value.trim(),
            avatarUrl: fields.avatarUrl.value.trim(),
            managerName: fields.managerName.value.trim(),
            managerTitle: fields.managerTitle.value.trim(),
            managerAvatarUrl: fields.managerAvatarUrl.value.trim(),
            operators: collectOperators(),
            welcomeMessage: fields.welcomeMessage.value,
            welcomeIntroLabel: fields.welcomeIntroLabel.value.trim(),
            onlineStatusText: fields.onlineStatusText.value.trim(),
            theme: {
              primary: fields.primary.value.trim(),
              headerBg: fields.headerBg.value.trim(),
              bubbleBg: fields.bubbleBg.value.trim(),
              textColor: fields.textColor.value.trim()
            },
            quickActions: collectQuickActions(),
            operatorQuickReplies: collectOperatorQuickReplies(),
            aiAssistant: {
              enabled: fields.aiEnabled.value === 'true',
              provider: fields.aiProvider.value.trim(),
              model: fields.aiModel.value.trim(),
              temperature: fields.aiTemperature.value,
              maxTokens: fields.aiMaxTokens.value,
              companyDescription: fields.aiCompanyDescription.value,
              services: fields.aiServices.value,
              faq: fields.aiFaq.value,
              pricingRules: fields.aiPricingRules.value,
              leadTimeRules: fields.aiLeadTimeRules.value,
              fileRequirements: fields.aiFileRequirements.value,
              deliveryInfo: fields.aiDeliveryInfo.value,
              tone: fields.aiTone.value,
              forbiddenClaims: fields.aiForbiddenClaims.value,
              defaultLanguage: fields.aiDefaultLanguage.value,
              responseStyle: fields.aiResponseStyle.value,
              askContactStyle: fields.aiAskContactStyle.value,
              askFileStyle: fields.aiAskFileStyle.value
            }
          };
        }

        function buildIntegrationPayload() {
          return {
            values: {
              telegram_bot_token: fields.telegramBotToken.value.trim(),
              telegram_webhook_secret: fields.telegramWebhookSecret.value.trim(),
              telegram_bot_username: fields.telegramBotUsername.value.trim(),
              meta_app_id: fields.metaAppId.value.trim(),
              meta_app_secret: fields.metaAppSecret.value.trim(),
              meta_verify_token: fields.metaVerifyToken.value.trim(),
              meta_page_access_token: fields.metaPageAccessToken.value.trim(),
              instagram_business_account_id: fields.instagramBusinessAccountId.value.trim(),
              facebook_page_id: fields.facebookPageId.value.trim(),
              openai_api_key: fields.openaiApiKey.value.trim(),
              openai_base_url: fields.openaiBaseUrl.value.trim(),
              kimi_api_key: fields.kimiApiKey.value.trim(),
              kimi_base_url: fields.kimiBaseUrl.value.trim(),
              openrouter_api_key: fields.openrouterApiKey.value.trim(),
              openrouter_base_url: fields.openrouterBaseUrl.value.trim()
            },
            clearKeys: state.pendingIntegrationClear.slice()
          };
        }

        async function saveSettings(sectionKey) {
          if (!state.selectedSiteId) return;

          const response = await fetchJson('/api/admin/sites/' + encodeURIComponent(state.selectedSiteId) + '/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildSettingsPayload())
          });

          fillForm(response.settings);
          await loadSites();
          if (sectionKey) {
            setActiveSection(sectionKey);
            setSectionStatus(sectionKey, 'Збережено.', true);
          }
          setGlobalStatus(sectionKey ? 'Зміни синхронізовано з сервером.' : 'Усі налаштування збережено.', true);
        }

        async function saveIntegrationSettingsForm() {
          const response = await fetchJson('/api/admin/integrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildIntegrationPayload())
          });
          fillIntegrationForm(response.settings || {});
          updateAiProviderStatus(state.currentSettings || { aiAssistant: {}, aiProviderStatus: {} });
          setSectionStatus('integrations', 'Integration settings збережено.', true);
          setGlobalStatus('Server-side integration settings збережено.', true);
        }

        settingsForm.addEventListener('submit', async function (event) {
          event.preventDefault();
          await saveSettings('');
        });

        settingsForm.addEventListener('click', function (event) {
          const toggleButton = event.target.closest('[data-toggle-secret]');
          if (toggleButton) {
            const fieldKey = toggleButton.getAttribute('data-toggle-secret') || '';
            const input = fields[fieldKey];
            if (input) {
              const nextType = input.type === 'password' ? 'text' : 'password';
              input.type = nextType;
              toggleButton.textContent = nextType === 'password' ? 'Show' : 'Hide';
            }
            return;
          }

          const clearButton = event.target.closest('[data-clear-integration]');
          if (clearButton) {
            const key = String(clearButton.getAttribute('data-clear-integration') || '').trim();
            if (key) {
              if (state.pendingIntegrationClear.indexOf(key) === -1) {
                state.pendingIntegrationClear.push(key);
              }
              clearButton.classList.add('clear-pending');
              clearButton.textContent = 'Will clear';
              const fieldMap = {
                telegram_bot_token: fields.telegramBotToken,
                telegram_webhook_secret: fields.telegramWebhookSecret,
                meta_app_secret: fields.metaAppSecret,
                meta_verify_token: fields.metaVerifyToken,
                meta_page_access_token: fields.metaPageAccessToken,
                openai_api_key: fields.openaiApiKey,
                kimi_api_key: fields.kimiApiKey,
                openrouter_api_key: fields.openrouterApiKey
              };
              const input = fieldMap[key];
              if (input) {
                input.value = '';
                input.placeholder = 'Will be cleared on save';
              }
              setSectionStatus('integrations', 'Secret marked for clearing. Натисніть Save Integrations.', false);
              setGlobalStatus('Є незбережені зміни.', false);
            }
            return;
          }
        });

        settingsForm.addEventListener('click', function (event) {
          const saveSectionButton = event.target.closest('[data-save-section]');
          if (!saveSectionButton) return;
          const sectionKey = saveSectionButton.getAttribute('data-save-section') || '';
          if (sectionKey === 'integrations') {
            saveIntegrationSettingsForm().catch(console.error);
            return;
          }
          saveSettings(sectionKey).catch(console.error);
        });

        loadSites().catch(function (error) {
          console.error(error);
          setGlobalStatus('Не вдалося завантажити settings.', false);
        });
      })();
    </script>`
  }));
});

app.get('/inbox', (req, res) => {
  res.type('html').send(renderInboxPage());
});

app.get('/analytics', (req, res) => {
  res.type('html').send(renderAnalyticsPage());
});

app.get('/analytics/:section/:item?', (req, res) => {
  res.type('html').send(renderAnalyticsPage());
});

app.get('/contacts', (req, res) => {
  const initialContacts = contactService.listContacts({ limit: 200 }).map((contact) => (
    Object.assign({}, contact, buildContactOverview(contact))
  ));
  res.type('html').send(renderContactsPage({ initialContacts }));
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
