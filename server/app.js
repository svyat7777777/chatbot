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
      title: String(entry.item.title || '').trim(),
      image: String(entry.item.image || entry.item.imageUrl || '').trim(),
      link: String(entry.item.link || entry.item.url || '').trim(),
      description: String(entry.item.description || '').trim(),
      price: entry.item.price == null ? '' : String(entry.item.price).trim()
    }));
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
const channelDispatcher = new ChannelDispatcher();
const telegramChannelService = new TelegramChannelService({
  botToken: TELEGRAM_BOT_TOKEN,
  webhookSecret: TELEGRAM_WEBHOOK_SECRET,
  defaultSiteId: TELEGRAM_DEFAULT_SITE_ID,
  operatorChatIds: TELEGRAM_OPERATOR_CHAT_IDS
});
const instagramChannelService = new InstagramChannelService({
  pageAccessToken: META_PAGE_ACCESS_TOKEN,
  verifyToken: META_VERIFY_TOKEN,
  defaultSiteId: INSTAGRAM_DEFAULT_SITE_ID,
  graphVersion: META_GRAPH_VERSION,
  businessAccountId: INSTAGRAM_BUSINESS_ACCOUNT_ID
});
const facebookChannelService = new FacebookChannelService({
  pageAccessToken: META_PAGE_ACCESS_TOKEN,
  verifyToken: META_VERIFY_TOKEN,
  defaultSiteId: FACEBOOK_DEFAULT_SITE_ID,
  graphVersion: META_GRAPH_VERSION,
  pageId: FACEBOOK_PAGE_ID
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
  botToken: TELEGRAM_BOT_TOKEN,
  operatorChatIds: TELEGRAM_OPERATOR_CHAT_IDS,
  telegramWebhookSecret: TELEGRAM_WEBHOOK_SECRET,
  siteConfigProvider: getSiteConfig,
  siteConfigsProvider: listSiteConfigs
});
const aiAssistantService = new AiAssistantService({
  openaiApiKey: OPENAI_API_KEY,
  openaiBaseUrl: OPENAI_BASE_URL,
  kimiApiKey: KIMI_API_KEY,
  kimiBaseUrl: KIMI_BASE_URL
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

function parseAnalyticsPeriod(rawPeriod) {
  const normalized = String(rawPeriod || '30d').trim().toLowerCase();
  if (normalized === '24h') {
    return {
      key: '24h',
      rangeSql: "datetime('now', '-24 hours')",
      chartDays: 2,
      chartMode: 'hourly',
      label: 'Last 24 hours',
      subtitle: 'За останні 24 години'
    };
  }

  if (normalized === '7d') {
    return {
      key: '7d',
      rangeSql: "datetime('now', '-7 days')",
      chartDays: 7,
      chartMode: 'daily',
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
      chartDays: days,
      chartMode: 'daily',
      label: `Last ${days} days`,
      subtitle: `За останні ${days} днів`
    };
  }

  return {
    key: '30d',
    rangeSql: "datetime('now', '-30 days')",
    chartDays: 30,
    chartMode: 'daily',
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
  if (mode === 'subscribe' && META_VERIFY_TOKEN && verifyToken === META_VERIFY_TOKEN) {
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
    return res.json({ ok: true, ...buildAnalyticsPayload(period) });
  } catch (error) {
    console.error('Failed to load analytics', error);
    return res.status(500).json({ ok: false, message: 'Failed to load analytics.' });
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

    return res.json({
      ok: true,
      draft: result.text,
      text: result.text,
      model: result.model
    });
  } catch (error) {
    console.error('Failed to generate AI draft', error);
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

    return res.json({
      ok: true,
      improvedText: result.text,
      text: result.text,
      model: result.model
    });
  } catch (error) {
    console.error('Failed to improve AI draft', error);
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

    return res.json({
      ok: true,
      translatedText: result.text,
      text: result.text,
      model: result.model
    });
  } catch (error) {
    console.error('Failed to translate AI draft', error);
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

    return res.json({
      ok: true,
      summary: result.summary,
      model: result.model
    });
  } catch (error) {
    console.error('Failed to generate AI summary', error);
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

    return res.json({
      ok: true,
      reply: result.text,
      text: result.text,
      products: productResults,
      model: result.model
    });
  } catch (error) {
    console.error('Failed to generate AI sidebar reply', error);
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
        grid-template-columns: 220px minmax(0, 1fr);
        flex: 1;
        min-height: 0;
      }
      .settings-categories {
        display: grid;
        gap: 2px;
        padding: 10px 8px;
        background: var(--card);
        border-right: 1px solid var(--bdr);
        overflow-y: auto;
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
                <span class="sec-tag">General</span>
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
                <span class="sec-tag">Appearance</span>
                <strong>Theme / Appearance</strong>
                <small>Кольори, фон header і базовий вигляд віджета.</small>
              </span>
            </div>
            <div class="settings-section-body" hidden>
              <div class="grid">
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
              <div class="section-actions">
                <button type="button" class="primary" data-save-section="theme">Save Appearance</button>
                <div id="themeStatus" class="status-line">Зміни стилю не впливають на backend-логіку.</div>
              </div>
            </div>
          </section>

          <section class="settings-section" data-section="actions">
            <div class="settings-section-head">
              <span class="section-copy">
                <span class="sec-tag">Actions</span>
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
                <span class="sec-tag">Flows</span>
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
                <span class="sec-tag">AI</span>
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
                <span class="sec-tag">CRM</span>
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
                <span class="sec-tag">Integrations</span>
                <strong>Integrations</strong>
                <small>Telegram, API provider keys і серверні інтеграції.</small>
              </span>
            </div>
            <div class="settings-section-body" hidden>
              <div class="section-placeholder">
                <strong>Server-side only</strong>
                <p>Telegram token, OpenAI/Kimi API keys і технічні інтеграції лишаються на сервері через env. Тут можна безпечно керувати лише site-level behavior і провайдером.</p>
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
          currentSettings: null
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
          ai: document.getElementById('aiStatus')
        };
        const quickActionsListEl = document.getElementById('quickActionsList');
        const flowScenariosListEl = document.getElementById('flowScenariosList');
        const addQuickActionBtn = document.getElementById('addQuickActionBtn');
        const operatorQuickRepliesListEl = document.getElementById('operatorQuickRepliesList');
        const addOperatorQuickReplyBtn = document.getElementById('addOperatorQuickReplyBtn');
        const operatorsListEl = document.getElementById('operatorsList');
        const addOperatorBtn = document.getElementById('addOperatorBtn');
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
          aiAskFileStyle: document.getElementById('aiAskFileStyleInput')
        };

        function escapeHtml(value) {
          return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function updateAiProviderStatus(settings) {
          const provider = fields.aiProvider.value || settings.aiAssistant?.provider || 'openai';
          const providerStatus = settings.aiProviderStatus || {};
          const configured = Boolean(providerStatus[provider]);
          const providerLabel = provider === 'kimi' ? 'Kimi' : 'OpenAI';
          aiConfigStatusEl.textContent = providerLabel + ' key: ' + (configured ? 'Configured' : 'Not configured');
          aiConfigStatusEl.className = 'status-line' + (configured ? ' success' : '');
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
          if (key === 'general') {
            setSectionStatus('general', 'Є незбережені зміни в General.', false);
          } else if (key === 'theme') {
            setSectionStatus('theme', 'Є незбережені зміни у вигляді віджета.', false);
          } else if (key === 'ai') {
            setSectionStatus('ai', 'Є незбережені зміни в AI settings.', false);
          }
          setGlobalStatus('Є незбережені зміни.', false);
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

        settingsForm.addEventListener('submit', async function (event) {
          event.preventDefault();
          await saveSettings('');
        });

        settingsForm.addEventListener('click', function (event) {
          const saveSectionButton = event.target.closest('[data-save-section]');
          if (!saveSectionButton) return;
          saveSettings(saveSectionButton.getAttribute('data-save-section') || '').catch(console.error);
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
