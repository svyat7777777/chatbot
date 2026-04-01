require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const { createDatabase, DEFAULT_WORKSPACE_ID, DEFAULT_SITE_ID } = require('./db/database');
const { ChatService } = require('./services/chat-service');
const { ContactService } = require('./services/contact-service');
const { createAnalyticsService } = require('./services/analytics-service');
const { AiAssistantService } = require('./services/ai-assistant-service');
const { AuthService } = require('./services/auth-service');
const { SqliteSessionStore } = require('./services/sqlite-session-store');
const { WorkspaceService } = require('./services/workspace-service');
const { resolveWorkspaceContext } = require('./middleware/workspace-context');
const {
  resolveAuthenticatedUser,
  requireAuth,
  requireWorkspaceMember,
  requireWorkspaceRole,
  isApiRequest
} = require('./middleware/auth');
const { ChannelDispatcher } = require('./services/channels/dispatcher');
const { TelegramChannelService } = require('./services/channels/telegram');
const { InstagramChannelService } = require('./services/channels/instagram');
const { FacebookChannelService } = require('./services/channels/facebook');
const { renderInboxPage } = require('./views/inbox-page');
const { renderAnalyticsPage, ANALYTICS_NAV_SECTIONS, isVisibleAnalyticsItem } = require('./views/analytics-page');
const { renderContactsPage } = require('./views/contacts-page');
const { renderAppLayout } = require('./views/app-layout');
const { renderAuthPage } = require('./views/auth-page');
const { renderHomePage } = require('./views/home-page');
const {
  renderProductPage,
  renderUseCasesPage,
  renderPricingPage,
  renderFaqPage,
  renderDemoPage
} = require('./views/marketing-pages');
const {
  getSiteConfig,
  getEditableSiteSettings,
  saveSiteSettings,
  ensureSiteSettings,
  listBootstrapSiteConfigs,
  listSiteConfigs,
  listEditableSiteSettings,
  normalizeFlows,
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
const SESSION_SECRET = String(process.env.CHAT_PLATFORM_SESSION_SECRET || process.env.SESSION_SECRET || '').trim();
const SESSION_COOKIE_NAME = String(process.env.CHAT_PLATFORM_SESSION_COOKIE_NAME || 'pf_chat_session').trim();
const LEGACY_BASIC_AUTH_FALLBACK = String(process.env.CHAT_PLATFORM_LEGACY_BASIC_AUTH_FALLBACK || 'true').trim().toLowerCase() !== 'false';

function parseCookies(req) {
  return String(req.headers?.cookie || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex === -1) return acc;
      const key = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();
      if (key) acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function resolvePublicLang(req) {
  const queryLang = String(req.query?.lang || '').trim().toLowerCase();
  if (queryLang === 'uk' || queryLang === 'en') return queryLang;
  const cookieLang = String(parseCookies(req).site_lang || '').trim().toLowerCase();
  if (cookieLang === 'uk' || cookieLang === 'en') return cookieLang;
  const acceptLanguage = String(req.headers['accept-language'] || '').toLowerCase();
  return acceptLanguage.includes('uk') ? 'uk' : 'en';
}

function renderPublicPage(req, res, renderFn) {
  const lang = resolvePublicLang(req);
  const queryLang = String(req.query?.lang || '').trim().toLowerCase();
  if (queryLang === 'uk' || queryLang === 'en') {
    res.setHeader('Set-Cookie', `site_lang=${queryLang}; Path=/; Max-Age=31536000; SameSite=Lax`);
  }
  res.type('html').send(renderFn({ lang }));
}

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

function parseUrlOrNull(value) {
  try {
    return new URL(String(value || '').trim());
  } catch (error) {
    return null;
  }
}

function normalizeProductRecord(item, sourceOverride) {
  const source = String(sourceOverride || item?.source || item?.provider || 'local_catalog').trim().toLowerCase() || 'local_catalog';
  const productUrl = String(item?.productUrl || item?.url || item?.link || '').trim();
  const title = String(item?.title || '').trim();
  if (!title || !productUrl) return null;
  const currency = String(item?.currency || '').trim().toUpperCase();
  const price = item?.price == null ? '' : String(item.price).trim();
  return {
    source,
    externalId: String(item?.externalId || item?.productId || item?.id || item?.sku || productUrl || title).trim(),
    productId: String(item?.productId || item?.externalId || item?.id || item?.sku || title).trim(),
    sku: String(item?.sku || '').trim(),
    category: String(item?.category || '').trim(),
    title,
    description: String(item?.description || item?.shortDescription || '').trim(),
    shortDescription: String(item?.shortDescription || item?.description || '').trim(),
    imageUrl: String(item?.imageUrl || item?.image || '').trim(),
    image: String(item?.image || item?.imageUrl || '').trim(),
    productUrl,
    url: productUrl,
    link: productUrl,
    price,
    currency,
    availability: String(item?.availability || '').trim(),
    customMessage: String(item?.customMessage || '').trim()
  };
}

function scoreCatalogItem(item, tokens) {
  const haystack = [
    item.title,
    item.description,
    item.shortDescription,
    item.sku,
    item.category,
    item.externalId,
    Array.isArray(item.tags) ? item.tags.join(' ') : item.tags
  ].join(' ').toLowerCase();
  return tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
}

function createLocalCatalogProvider(providerKey, opts) {
  const key = String(providerKey || 'local_catalog').trim().toLowerCase();
  const label = String(opts?.label || providerKey || 'Local catalog').trim();
  const matchSource = String(opts?.catalogSource || providerKey || '').trim().toLowerCase();
  const hostPatterns = Array.isArray(opts?.hostPatterns) ? opts.hostPatterns.map((item) => String(item || '').toLowerCase()).filter(Boolean) : [];
  return {
    key,
    label,
    async searchProducts(query, limit = 12) {
      const cleanQuery = String(query || '').trim().toLowerCase();
      if (!cleanQuery) return [];
      const tokens = cleanQuery.split(/\s+/).filter(Boolean);
      const products = loadProductCatalog()
        .map((item) => normalizeProductRecord(item, item?.source || (key === 'local_catalog' ? 'local_catalog' : key)))
        .filter(Boolean)
        .filter((item) => !matchSource || item.source === matchSource || item.source === key);
      return products
        .map((item) => ({ item, score: scoreCatalogItem(item, tokens) }))
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, limit)
        .map((entry) => entry.item);
    },
    async getProductByUrl(url) {
      const parsed = parseUrlOrNull(url);
      if (!parsed) return null;
      const normalizedUrl = parsed.toString();
      const products = loadProductCatalog()
        .map((item) => normalizeProductRecord(item, item?.source || (key === 'local_catalog' ? 'local_catalog' : key)))
        .filter(Boolean)
        .filter((item) => !matchSource || item.source === matchSource || item.source === key);
      const directMatch = products.find((item) => {
        const itemUrl = parseUrlOrNull(item.productUrl);
        return itemUrl && itemUrl.toString() === normalizedUrl;
      });
      if (directMatch) return directMatch;
      const hostMatch = hostPatterns.some((pattern) => parsed.hostname.toLowerCase().includes(pattern));
      if (!hostMatch && key !== 'local_catalog') return null;
      return products.find((item) => {
        const itemUrl = parseUrlOrNull(item.productUrl);
        return itemUrl && itemUrl.pathname === parsed.pathname;
      }) || null;
    },
    async getProductById(id) {
      const cleanId = String(id || '').trim();
      if (!cleanId) return null;
      const products = loadProductCatalog()
        .map((item) => normalizeProductRecord(item, item?.source || (key === 'local_catalog' ? 'local_catalog' : key)))
        .filter(Boolean)
        .filter((item) => !matchSource || item.source === matchSource || item.source === key);
      return products.find((item) => item.externalId === cleanId || item.productId === cleanId || item.sku === cleanId) || null;
    },
    normalizeProduct(raw) {
      return normalizeProductRecord(raw, key);
    },
    matchesUrl(url) {
      const parsed = parseUrlOrNull(url);
      if (!parsed) return false;
      if (!hostPatterns.length) return key === 'local_catalog';
      return hostPatterns.some((pattern) => parsed.hostname.toLowerCase().includes(pattern));
    }
  };
}

const PRODUCT_PROVIDERS = {
  local_catalog: createLocalCatalogProvider('local_catalog', {
    label: 'Local catalog',
    catalogSource: 'local_catalog'
  }),
  shopify: createLocalCatalogProvider('shopify', {
    label: 'Shopify',
    catalogSource: 'shopify',
    hostPatterns: ['myshopify.com', 'shopify']
  }),
  woocommerce: createLocalCatalogProvider('woocommerce', {
    label: 'WooCommerce',
    catalogSource: 'woocommerce',
    hostPatterns: ['woocommerce', 'wp']
  }),
  custom_api: createLocalCatalogProvider('custom_api', {
    label: 'Custom API',
    catalogSource: 'custom_api'
  })
};

function listProductProviders() {
  return Object.values(PRODUCT_PROVIDERS);
}

function getProductProvidersForSource(source) {
  const cleanSource = String(source || 'all').trim().toLowerCase();
  if (!cleanSource || cleanSource === 'all' || cleanSource === 'auto') {
    return listProductProviders();
  }
  return PRODUCT_PROVIDERS[cleanSource] ? [PRODUCT_PROVIDERS[cleanSource]] : [];
}

async function searchProductsUnified(query, source, limit = 12) {
  const providers = getProductProvidersForSource(source);
  const results = await Promise.all(providers.map(async (provider) => {
    const items = await provider.searchProducts(query, limit);
    return Array.isArray(items) ? items.map((item) => provider.normalizeProduct(item)).filter(Boolean) : [];
  }));
  const merged = results.flat();
  const seen = new Set();
  return merged.filter((item) => {
    const key = [item.source, item.externalId || item.productUrl || item.title].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

async function resolveProductByUrl(url, source) {
  const providers = getProductProvidersForSource(source);
  for (const provider of providers) {
    if (String(source || '').trim() && source !== 'all' && source !== 'auto') {
      const item = await provider.getProductByUrl(url);
      if (item) return provider.normalizeProduct(item);
      continue;
    }
    if (provider.matchesUrl(url) || source === 'all' || source === 'auto' || !source) {
      const item = await provider.getProductByUrl(url);
      if (item) return provider.normalizeProduct(item);
    }
  }
  return null;
}

function searchProductCatalog(query, limit = 6) {
  const cleanQuery = String(query || '').trim().toLowerCase();
  if (!cleanQuery) return [];
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  const products = loadProductCatalog()
    .map((item) => normalizeProductRecord(item, item?.source || 'local_catalog'))
    .filter(Boolean);
  return products
    .map((item) => ({ item, score: scoreCatalogItem(item, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

function normalizeProductOfferInput(value, customMessage = '') {
  const normalized = normalizeProductRecord(value && typeof value === 'object' ? value : {}, value?.source || '');
  if (!normalized) {
    return null;
  }

  return {
    source: normalized.source,
    externalId: normalized.externalId,
    productId: normalized.productId || normalized.externalId,
    sku: normalized.sku,
    category: normalized.category,
    title: normalized.title,
    image: normalized.image || normalized.imageUrl,
    imageUrl: normalized.imageUrl || normalized.image,
    url: normalized.productUrl || normalized.url,
    productUrl: normalized.productUrl || normalized.url,
    price: normalized.price,
    currency: normalized.currency,
    availability: normalized.availability,
    description: normalized.description,
    shortDescription: normalized.shortDescription,
    customMessage: String(customMessage || normalized.customMessage || '').trim()
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
    warnings.push('INBOX_ADMIN_USERNAME / INBOX_ADMIN_PASSWORD are not set. Legacy basic-auth fallback will be unavailable.');
  }

  if (!SESSION_SECRET) {
    warnings.push('CHAT_PLATFORM_SESSION_SECRET is not set. Using a compatibility fallback secret; set a real secret as soon as possible.');
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
const workspaceService = new WorkspaceService({
  db,
  siteConfigProvider: getSiteConfig,
  siteConfigsProvider: listBootstrapSiteConfigs
});
workspaceService.syncConfiguredSites();
db.prepare('SELECT id, name FROM sites').all().forEach((site) => {
  ensureSiteSettings(site.id, {
    title: site.name || site.id
  });
});
const authService = new AuthService({
  db,
  workspaceService
});
const contactService = new ContactService({
  db,
  storagePath: CONTACTS_PATH
});
const analyticsService = createAnalyticsService({
  db,
  contactService,
  cacheTtlMs: 45000
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

function getStoredIntegrationMap(workspaceId = DEFAULT_WORKSPACE_ID) {
  const cleanWorkspaceId = String(workspaceId || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID;
  const rows = db.prepare(`
    SELECT setting_key, setting_value, is_secret, updated_at
    FROM integration_settings
    WHERE workspace_id = ?
  `).all(cleanWorkspaceId);
  return rows.reduce((accumulator, row) => {
    accumulator[String(row.setting_key || '').trim()] = {
      value: normalizeIntegrationValue(row.setting_value),
      isSecret: Boolean(row.is_secret),
      updatedAt: String(row.updated_at || '').trim()
    };
    return accumulator;
  }, {});
}

function getIntegrationValue(key, workspaceId = DEFAULT_WORKSPACE_ID) {
  const cleanKey = String(key || '').trim();
  const cleanWorkspaceId = String(workspaceId || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID;
  const definition = INTEGRATION_FIELDS[cleanKey];
  if (!definition) return '';
  const row = db.prepare(`
    SELECT setting_value
    FROM integration_settings
    WHERE workspace_id = ? AND setting_key = ?
    LIMIT 1
  `).get(cleanWorkspaceId, cleanKey);
  const storedValue = normalizeIntegrationValue(row && row.setting_value);
  if (storedValue) {
    return storedValue;
  }
  const fallback = Array.isArray(definition.env) ? definition.env.find(Boolean) : '';
  return normalizeIntegrationValue(fallback);
}

function buildAiProviderStatus(workspaceId = DEFAULT_WORKSPACE_ID) {
  return {
    openai: Boolean(getIntegrationValue('openai_api_key', workspaceId)),
    kimi: Boolean(getIntegrationValue('kimi_api_key', workspaceId)),
    openrouter: Boolean(getIntegrationValue('openrouter_api_key', workspaceId))
  };
}

function buildIntegrationSettingsPayload(workspaceId = DEFAULT_WORKSPACE_ID) {
  const stored = getStoredIntegrationMap(workspaceId);
  const fields = Object.keys(INTEGRATION_FIELDS).reduce((accumulator, key) => {
    const definition = INTEGRATION_FIELDS[key];
    const storedEntry = stored[key];
    const resolvedValue = getIntegrationValue(key, workspaceId);
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

function saveIntegrationSettings(input = {}, workspaceId = DEFAULT_WORKSPACE_ID) {
  const cleanWorkspaceId = String(workspaceId || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID;
  const values = input && input.values && typeof input.values === 'object' ? input.values : {};
  const clearKeys = Array.isArray(input.clearKeys) ? input.clearKeys.map((item) => String(item || '').trim()).filter(Boolean) : [];
  const upsert = db.prepare(`
    INSERT INTO integration_settings (setting_id, workspace_id, setting_key, setting_value, is_secret, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(workspace_id, setting_key) DO UPDATE SET
      setting_value = excluded.setting_value,
      is_secret = excluded.is_secret,
      updated_at = excluded.updated_at
  `);
  const remove = db.prepare('DELETE FROM integration_settings WHERE workspace_id = ? AND setting_key = ?');
  const transaction = db.transaction(() => {
    clearKeys.forEach((key) => {
      if (INTEGRATION_FIELDS[key]) {
        remove.run(cleanWorkspaceId, key);
      }
    });
    Object.keys(INTEGRATION_FIELDS).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(values, key)) return;
      const definition = INTEGRATION_FIELDS[key];
      const nextValue = normalizeIntegrationValue(values[key]);
      if (definition.secret) {
        if (!nextValue) return;
        upsert.run(`iset_${cleanWorkspaceId}_${key}`, cleanWorkspaceId, key, nextValue, definition.secret ? 1 : 0);
        return;
      }
      upsert.run(`iset_${cleanWorkspaceId}_${key}`, cleanWorkspaceId, key, nextValue, definition.secret ? 1 : 0);
    });
  });
  transaction();
  return buildIntegrationSettingsPayload(cleanWorkspaceId);
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
  workspaceService,
  channelDispatcher,
  uploadsDir: path.join(UPLOADS_ROOT, 'chat', DEFAULT_SITE_ID),
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
const sessionStore = new SqliteSessionStore({
  db,
  ttlMs: 1000 * 60 * 60 * 24 * 7
});

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
app.use(session({
  name: SESSION_COOKIE_NAME,
  secret: SESSION_SECRET || 'dev-printforge-session-secret',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PRODUCTION,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));
app.use(resolveAuthenticatedUser(authService, workspaceService, {
  allowLegacyBasicAuth: LEGACY_BASIC_AUTH_FALLBACK,
  parseLegacyBasicAuth: (req) => hasLegacyBasicAuthAccess(req)
}));
app.use(resolveWorkspaceContext(workspaceService));
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
app.use('/marketing', express.static(path.join(PUBLIC_ROOT, 'marketing'), {
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

app.get('/', (req, res) => renderPublicPage(req, res, renderHomePage));

app.get('/product', (req, res) => renderPublicPage(req, res, renderProductPage));

app.get('/use-cases', (req, res) => renderPublicPage(req, res, renderUseCasesPage));

app.get('/pricing', (req, res) => renderPublicPage(req, res, renderPricingPage));

app.get('/faq', (req, res) => renderPublicPage(req, res, renderFaqPage));

app.get('/demo', (req, res) => renderPublicPage(req, res, renderDemoPage));

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
  const targetDir = siteConfig?.uploadsPath || path.join(UPLOADS_ROOT, 'chat', siteId || DEFAULT_SITE_ID);
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
  if (!cleanSiteId) {
    return null;
  }
  const site = workspaceService.getSiteById(cleanSiteId);
  if (site) {
    return getSiteConfig(cleanSiteId) || null;
  }
  return null;
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

function buildWidgetConfigPayload(siteId) {
  const site = workspaceService.getSiteById(siteId);
  if (site && !site.isActive) {
    return null;
  }
  const config = resolveSiteConfig(siteId);
  if (!config) {
    return null;
  }
  return {
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
      typingSimulation: config.typingSimulation,
      operatorFallback: config.operatorFallback,
      availability: config.availability,
      widgetPosition: config.widgetPosition,
      widgetSize: config.widgetSize,
      language: config.language,
      welcomeMessage: config.welcomeMessage,
      placeholder: config.placeholder,
      launcherTitle: config.launcherTitle,
      launcherSubtitle: config.launcherSubtitle,
      avatarUrl: config.avatarUrl,
      flows: config.flows,
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
  };
}

function assertConversationWorkspaceMatch(conversation, workspaceId) {
  const cleanWorkspaceId = String(workspaceId || '').trim();
  if (!cleanWorkspaceId) return true;
  return Boolean(conversation && String(conversation.workspaceId || DEFAULT_WORKSPACE_ID) === cleanWorkspaceId);
}

function getRequestWorkspaceId(req) {
  return String(req.workspaceContext?.workspaceId || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID;
}

function getActiveSite(req) {
  return req.workspaceContext?.site || workspaceService.getDefaultSiteForWorkspace(getRequestWorkspaceId(req)) || null;
}

function getRequestSiteId(req) {
  return String(getActiveSite(req)?.id || DEFAULT_SITE_ID).trim() || DEFAULT_SITE_ID;
}

function setActiveSite(req, siteId) {
  const cleanSiteId = String(siteId || '').trim();
  const workspaceId = getRequestWorkspaceId(req);
  const site = workspaceService.getSiteByIdWithinWorkspace(cleanSiteId, workspaceId);
  if (!site) {
    return null;
  }
  if (req.session) {
    req.session.activeSiteId = site.id;
    req.session.activeWorkspaceId = workspaceId;
  }
  req.workspaceContext = Object.assign({}, req.workspaceContext || {}, {
    workspaceId,
    workspace: req.workspaceContext?.workspace || workspaceService.getWorkspaceById(workspaceId),
    siteId: site.id,
    site
  });
  return site;
}

function buildAdminSiteSummary(req, site) {
  const currentSiteId = getRequestSiteId(req);
  return {
    id: site.id,
    siteId: site.id,
    workspaceId: site.workspaceId,
    name: site.name,
    domain: site.domain || '',
    primaryDomain: site.primaryDomain || '',
    domains: Array.isArray(site.domains) ? site.domains : [],
    widgetKey: site.widgetKey,
    widgetKeyMasked: site.widgetKey ? `${site.widgetKey.slice(0, 6)}...${site.widgetKey.slice(-4)}` : '',
    isActive: site.isActive,
    isSelected: site.id === currentSiteId,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt
  };
}

function getWorkspaceScopedSites(req) {
  const workspaceId = getRequestWorkspaceId(req);
  return workspaceService.listSitesByWorkspace(workspaceId).map((site) => buildAdminSiteSummary(req, site));
}

function buildInstallSnippet(site) {
  const scriptUrl = `${PUBLIC_BASE_URL.replace(/\/+$/, '')}/widget.js`;
  return [
    '<script',
    `  src="${scriptUrl}"`,
    `  data-site-id="${site.id}"`,
    `  data-widget-key="${site.widgetKey}">`,
    '</script>'
  ].join('\n');
}

function normalizeHeartbeatHost(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

function deriveHeartbeatHost(pageUrl, pageHost) {
  const directHost = normalizeHeartbeatHost(pageHost);
  if (directHost) return directHost;
  const cleanUrl = String(pageUrl || '').trim();
  if (!cleanUrl) return '';
  try {
    return normalizeHeartbeatHost(new URL(cleanUrl).hostname);
  } catch (error) {
    return '';
  }
}

function buildInstallVerificationState(site) {
  const lastSeenAt = String(site?.lastSeenAt || '').trim();
  const lastSeenHost = String(site?.lastSeenHost || '').trim();
  const lastSeenUrl = String(site?.lastSeenUrl || '').trim();
  const domainValid = lastSeenHost ? workspaceService.doesHostMatchSite(site, lastSeenHost) : null;
  const lastSeenDate = parseSqliteDate(lastSeenAt);
  const recentActivity = Boolean(lastSeenDate && (Date.now() - lastSeenDate.getTime()) <= (5 * 60 * 1000));

  if (!lastSeenAt) {
    return {
      state: 'ready',
      label: 'Ready to install',
      detail: 'We haven’t detected the widget on your site yet.',
      tone: 'neutral',
      recentActivity: false,
      domainValid: null
    };
  }

  if (domainValid === false) {
    return {
      state: 'domain_mismatch',
      label: 'Domain mismatch',
      detail: 'Widget was detected on a domain that is not in this site’s allowed domains.',
      tone: 'warning',
      recentActivity,
      domainValid
    };
  }

  if (recentActivity) {
    return {
      state: 'active_recently',
      label: 'Widget active on your site',
      detail: `Heartbeat detected recently from ${lastSeenHost || lastSeenUrl || 'your website'}.`,
      tone: 'success',
      recentActivity,
      domainValid
    };
  }

  return {
    state: 'detected',
    label: 'Widget detected',
    detail: `Last heartbeat received from ${lastSeenHost || lastSeenUrl || 'your website'}.`,
    tone: 'success',
    recentActivity,
    domainValid
  };
}

function buildSiteInstallPayload(req, site) {
  const workspace = req.workspaceContext?.workspace || workspaceService.getWorkspaceById(site.workspaceId) || workspaceService.getDefaultWorkspace();
  const allowedDomains = Array.isArray(site.domains) ? site.domains : [];
  const verification = buildInstallVerificationState(site);
  return {
    workspace: {
      id: workspace?.id || DEFAULT_WORKSPACE_ID,
      name: workspace?.name || 'Default Workspace'
    },
    site: {
      id: site.id,
      name: site.name,
      workspaceId: site.workspaceId,
      primaryDomain: site.primaryDomain || site.domain || '',
      domain: site.domain || '',
      allowedDomains,
      lastSeenAt: site.lastSeenAt || null,
      lastSeenUrl: site.lastSeenUrl || null,
      lastSeenHost: site.lastSeenHost || null,
      lastSeenUserAgent: site.lastSeenUserAgent || null,
      lastSeenReferrer: site.lastSeenReferrer || null,
      heartbeatCount: Number(site.heartbeatCount || 0),
      domainValid: verification.domainValid,
      widgetKeyMasked: site.widgetKey ? `${site.widgetKey.slice(0, 6)}...${site.widgetKey.slice(-4)}` : '',
      widgetKey: site.widgetKey,
      isActive: site.isActive
    },
    install: {
      scriptUrl: `${PUBLIC_BASE_URL.replace(/\/+$/, '')}/widget.js`,
      snippet: buildInstallSnippet(site),
      instructions: [
        'Copy the code below and paste it before the closing </body> tag.',
        'Add it to every page where you want the chat widget to appear.',
        'If your site uses a CMS, put it in the global footer or custom code area.'
      ]
    },
    status: {
      state: verification.state,
      label: verification.label,
      detail: verification.detail,
      tone: verification.tone,
      snippetCopied: false,
      websiteConnection: site.lastSeenAt ? 'detected' : 'waiting',
      verification: site.lastSeenAt ? (verification.domainValid === false ? 'domain_mismatch' : 'detected') : 'not_completed',
      lastSeenAt: site.lastSeenAt || null,
      lastSeenUrl: site.lastSeenUrl || null,
      lastSeenHost: site.lastSeenHost || null,
      domainValid: verification.domainValid,
      recentActivity: verification.recentActivity,
      heartbeatCount: Number(site.heartbeatCount || 0)
    }
  };
}

function isSiteAllowedForWorkspace(req, siteId) {
  const cleanSiteId = String(siteId || '').trim();
  if (!cleanSiteId) return true;
  const site = workspaceService.getSiteByIdWithinWorkspace(cleanSiteId, getRequestWorkspaceId(req));
  return Boolean(site);
}

function resolveScopedSiteFilter(req, candidateSiteId, options = {}) {
  const cleanCandidate = String(candidateSiteId || '').trim();
  const allowAll = options.allowAll === true;
  const fallbackToActive = options.fallbackToActive !== false;

  if (allowAll && (cleanCandidate === 'all' || cleanCandidate === '*')) {
    return '';
  }

  if (cleanCandidate) {
    const site = workspaceService.getSiteByIdWithinWorkspace(cleanCandidate, getRequestWorkspaceId(req));
    return site ? site.id : null;
  }

  if (!fallbackToActive) {
    return '';
  }

  const activeSite = getActiveSite(req);
  return activeSite ? activeSite.id : '';
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
  const allConversations = chatService.listConversations({
    workspaceId: contact?.workspaceId || DEFAULT_WORKSPACE_ID,
    siteId: contact?.sourceSiteId || '',
    limit: 5000
  });

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
  const period = analyticsService.parseAnalyticsPeriod(rawPeriod);
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
  if (options.workspaceId) {
    clauses.push('c.workspace_id = ?');
    params.push(options.workspaceId);
  }
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
  if (options.workspaceId) {
    clauses.push('c.workspace_id = ?');
    params.push(options.workspaceId);
  }
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
  const workspaceId = String(options.workspaceId || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID;
  const siteId = String(options.siteId || '').trim();
  const operator = String(options.operator || '').trim();
  const conversationWhere = buildConversationWhere({ startSql: window.startSql, endSql: window.endSql, workspaceId, siteId, operator });
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
  messageWhereClauses.push('c.workspace_id = ?');
  messageParams.push(workspaceId);
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
        AND c.workspace_id = ?
        ${siteId ? 'AND c.site_id = ?' : ''}
        ${operator ? 'AND (c.assigned_operator = ? OR c.last_operator = ?)' : ''}
    ORDER BY datetime(e.created_at) ASC, e.id ASC
    `
  ).all(
    window.startSql,
    window.endSql,
    workspaceId,
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
        AND c.workspace_id = ?
        ${siteId ? 'AND c.site_id = ?' : ''}
        ${operator ? 'AND (c.assigned_operator = ? OR c.last_operator = ?)' : ''}
    ORDER BY datetime(f.created_at) DESC
    `
  ).all(
    window.startSql,
    window.endSql,
    workspaceId,
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
        AND c.workspace_id = ?
        ${siteId ? 'AND c.site_id = ?' : ''}
        ${operator ? 'AND (c.assigned_operator = ? OR c.last_operator = ?)' : ''}
    ORDER BY datetime(a.created_at) DESC
    `
  ).all(
    window.startSql,
    window.endSql,
    workspaceId,
    ...(siteId ? [siteId] : []),
    ...(operator ? [operator, operator] : [])
  );

  const contacts = contactService.listContacts({ workspaceId, siteId, limit: 10000 })
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
  const contactByConversationId = new Map(
    current.contacts
      .filter((contact) => String(contact.conversationId || '').trim())
      .map((contact) => [String(contact.conversationId || '').trim(), contact])
  );
  const operatorOptions = Array.from(new Set(
    conversations.flatMap((item) => [item.assigned_operator, item.last_operator]).concat(
      current.messages.filter((item) => item.sender_type === 'operator').map((item) => item.sender_name)
    ).map((value) => String(value || '').trim()).filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));
  const compareEnabled = Boolean(options.compare);

  function shortenVisitorId(value) {
    const clean = String(value || '').trim();
    if (!clean) return 'Visitor';
    const parts = clean.split('_');
    const tail = parts[parts.length - 1] || clean;
    return 'Visitor ' + tail.slice(0, 6);
  }

  function getConversationDisplayName(conversation) {
    const conversationId = String(conversation && conversation.conversation_id || '').trim();
    const contact = conversationId ? contactByConversationId.get(conversationId) : null;
    if (contact) {
      const label = [contact.name, contact.phone, contact.telegram, contact.email]
        .map((value) => String(value || '').trim())
        .find(Boolean);
      if (label) return label;
    }

    const externalUserId = String(conversation && conversation.external_user_id || '').trim();
    if (externalUserId) return shortenVisitorId(externalUserId);
    const visitorId = String(conversation && conversation.visitor_id || '').trim();
    if (visitorId) return shortenVisitorId(visitorId);
    if (conversationId) return 'Chat ' + conversationId.slice(0, 8);
    return 'Visitor';
  }

  function buildConversationLinkCell(conversation) {
    const conversationId = String(conversation && conversation.conversation_id || '').trim();
    const label = getConversationDisplayName(conversation);
    if (!conversationId) return label;
    return {
      type: 'link',
      label,
      href: '/inbox?conversationId=' + encodeURIComponent(conversationId)
    };
  }

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
        name: buildConversationLinkCell(conversation),
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
                visitor: buildConversationLinkCell(item),
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
                visitor: buildConversationLinkCell(item),
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
                visitor: buildConversationLinkCell(item),
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
                visitor: buildConversationLinkCell(item),
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
                visitor: buildConversationLinkCell(item),
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
                visitor: buildConversationLinkCell(item),
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
  const period = analyticsService.parseAnalyticsPeriod(rawPeriod);
  const requestedSection = String(options.section || 'chats').trim().toLowerCase();
  const requestedItem = String(options.item || 'overview').trim().toLowerCase();
  const fallbackSection = ANALYTICS_NAV_SECTIONS[0] || { key: 'chats', items: ['overview'] };
  const fallbackItem = fallbackSection.items[0] || 'overview';
  const section = isVisibleAnalyticsItem(requestedSection, requestedItem)
    ? requestedSection
    : fallbackSection.key;
  const item = isVisibleAnalyticsItem(requestedSection, requestedItem)
    ? requestedItem
    : fallbackItem;
  const operatorRelevant = (
    (section === 'agents') ||
    (section === 'ai' && item === 'usage')
  );
  const datasetOptions = Object.assign({}, options, {
    workspaceId: String(options.workspaceId || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID,
    operator: operatorRelevant ? String(options.operator || '').trim() : ''
  });
  const current = analyticsService.loadAnalyticsDataset(period, datasetOptions, false);
  const previous = analyticsService.loadAnalyticsDataset(period, datasetOptions, true);
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

function hasLegacyBasicAuthConfig() {
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

function hasLegacyBasicAuthAccess(req) {
  if (!LEGACY_BASIC_AUTH_FALLBACK || !hasLegacyBasicAuthConfig()) {
    return false;
  }
  const credentials = parseBasicAuth(req.headers.authorization);
  return Boolean(
    credentials &&
    safeEqual(credentials.username, INBOX_ADMIN_USERNAME) &&
    safeEqual(credentials.password, INBOX_ADMIN_PASSWORD)
  );
}

const requireAuthenticatedUser = requireAuth();
const requireOperatorAccess = requireWorkspaceRole(['owner', 'admin', 'operator']);
const requireAdminAccess = requireWorkspaceRole(['owner', 'admin']);

function sanitizeAuthRedirectTarget(value) {
  const clean = String(value || '').trim();
  if (!clean.startsWith('/') || clean.startsWith('//')) {
    return '/inbox';
  }
  return clean;
}

function buildSessionAuthPayload(req) {
  return {
    ok: true,
    user: req.auth?.user || null,
    workspaces: Array.isArray(req.auth?.memberships) ? req.auth.memberships.map((membership) => ({
      workspaceId: membership.workspaceId,
      role: membership.role,
      name: membership.workspace?.name || '',
      slug: membership.workspace?.slug || '',
      plan: membership.workspace?.plan || 'free'
    })) : [],
    activeWorkspaceId: req.auth?.activeWorkspaceId || '',
    role: req.auth?.role || null,
    legacyFallback: req.auth?.isLegacyFallback === true
  };
}

function establishAuthenticatedSession(req, result) {
  req.session.userId = result.user.id;
  req.session.activeWorkspaceId = result.activeMembership?.workspaceId || result.memberships?.[0]?.workspaceId || null;
}

function destroyAuthenticatedSession(req, res, callback) {
  const cookieName = SESSION_COOKIE_NAME;
  if (!req.session) {
    res.clearCookie(cookieName);
    callback();
    return;
  }
  req.session.destroy((error) => {
    res.clearCookie(cookieName);
    callback(error);
  });
}

app.get('/login', (req, res) => {
  if (req.auth?.isAuthenticated && !req.auth?.isLegacyFallback) {
    return res.redirect(sanitizeAuthRedirectTarget(req.query.next || '/inbox'));
  }
  return res.type('html').send(renderAuthPage({
    mode: 'login',
    next: sanitizeAuthRedirectTarget(req.query.next || '/inbox')
  }));
});

app.post('/login', async (req, res) => {
  const nextTarget = sanitizeAuthRedirectTarget(req.body?.next || req.query?.next || '/inbox');
  try {
    const result = await authService.login(req.body || {});
    establishAuthenticatedSession(req, result);
    if (isApiRequest(req)) {
      return res.json(buildSessionAuthPayload({
        auth: {
          isAuthenticated: true,
          user: result.user,
          memberships: result.memberships,
          activeWorkspaceId: result.activeMembership?.workspaceId || '',
          role: result.activeMembership?.role || null
        }
      }));
    }
    return res.redirect(nextTarget);
  } catch (error) {
    const message = error.message === 'INVALID_CREDENTIALS'
      ? 'Invalid email or password.'
      : 'Failed to sign in.';
    if (isApiRequest(req)) {
      return res.status(400).json({ ok: false, message });
    }
    return res.status(400).type('html').send(renderAuthPage({
      mode: 'login',
      error: message,
      next: nextTarget,
      values: {
        email: req.body?.email || ''
      }
    }));
  }
});

app.get('/signup', (req, res) => {
  if (req.auth?.isAuthenticated && !req.auth?.isLegacyFallback) {
    return res.redirect(sanitizeAuthRedirectTarget(req.query.next || '/inbox'));
  }
  return res.type('html').send(renderAuthPage({
    mode: 'signup',
    next: sanitizeAuthRedirectTarget(req.query.next || '/inbox')
  }));
});

app.post('/signup', async (req, res) => {
  const nextTarget = sanitizeAuthRedirectTarget(req.body?.next || req.query?.next || '/inbox');
  try {
    const result = await authService.signup(req.body || {});
    establishAuthenticatedSession(req, result);
    if (isApiRequest(req)) {
      return res.status(201).json(buildSessionAuthPayload({
        auth: {
          isAuthenticated: true,
          user: result.user,
          memberships: result.memberships,
          activeWorkspaceId: result.activeMembership?.workspaceId || '',
          role: result.activeMembership?.role || null
        }
      }));
    }
    return res.redirect(nextTarget);
  } catch (error) {
    const messageMap = {
      INVALID_NAME: 'Enter a valid name.',
      INVALID_EMAIL: 'Enter a valid email address.',
      INVALID_PASSWORD: 'Password must be at least 8 characters.',
      EMAIL_IN_USE: 'An account with that email already exists.'
    };
    const message = messageMap[error.message] || 'Failed to create account.';
    if (isApiRequest(req)) {
      return res.status(400).json({ ok: false, message });
    }
    return res.status(400).type('html').send(renderAuthPage({
      mode: 'signup',
      error: message,
      next: nextTarget,
      values: {
        name: req.body?.name || '',
        email: req.body?.email || '',
        workspaceName: req.body?.workspaceName || ''
      }
    }));
  }
});

app.post('/logout', (req, res) => {
  destroyAuthenticatedSession(req, res, (error) => {
    if (error) {
      console.error('Failed to destroy session', error);
      return res.status(500).json({ ok: false, message: 'Failed to log out.' });
    }
    if (isApiRequest(req)) {
      return res.json({ ok: true });
    }
    return res.redirect('/login');
  });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await authService.login(req.body || {});
    establishAuthenticatedSession(req, result);
    return res.json({
      ok: true,
      user: result.user,
      workspaces: result.memberships,
      activeWorkspaceId: result.activeMembership?.workspaceId || '',
      role: result.activeMembership?.role || null
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message === 'INVALID_CREDENTIALS' ? 'Invalid email or password.' : 'Failed to sign in.'
    });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const result = await authService.signup(req.body || {});
    establishAuthenticatedSession(req, result);
    return res.status(201).json({
      ok: true,
      user: result.user,
      workspaces: result.memberships,
      activeWorkspaceId: result.activeMembership?.workspaceId || '',
      role: result.activeMembership?.role || null
    });
  } catch (error) {
    const messageMap = {
      INVALID_NAME: 'Enter a valid name.',
      INVALID_EMAIL: 'Enter a valid email address.',
      INVALID_PASSWORD: 'Password must be at least 8 characters.',
      EMAIL_IN_USE: 'An account with that email already exists.'
    };
    return res.status(400).json({ ok: false, message: messageMap[error.message] || 'Failed to create account.' });
  }
});

app.post('/api/auth/logout', requireAuthenticatedUser, (req, res) => {
  destroyAuthenticatedSession(req, res, (error) => {
    if (error) {
      console.error('Failed to destroy session', error);
      return res.status(500).json({ ok: false, message: 'Failed to log out.' });
    }
    return res.json({ ok: true });
  });
});

app.get('/api/auth/me', requireAuthenticatedUser, (req, res) => {
  return res.json(buildSessionAuthPayload(req));
});

app.get('/api/auth/workspaces', requireAuthenticatedUser, (req, res) => {
  return res.json({
    ok: true,
    workspaces: buildSessionAuthPayload(req).workspaces
  });
});

app.post('/api/auth/active-workspace', requireWorkspaceMember(), (req, res) => {
  const workspaceId = String(req.body?.workspaceId || '').trim();
  if (!workspaceId) {
    return res.status(400).json({ ok: false, message: 'workspaceId is required.' });
  }
  const membership = authService.getMembership(req.auth.user.id, workspaceId);
  if (!membership) {
    return res.status(403).json({ ok: false, message: 'You do not belong to that workspace.' });
  }
  authService.setActiveWorkspace(req.session, workspaceId);
  const defaultSite = workspaceService.getDefaultSiteForWorkspace(workspaceId);
  if (req.session) {
    req.session.activeSiteId = defaultSite?.id || null;
  }
  return res.json({
    ok: true,
    activeWorkspaceId: workspaceId,
    activeSiteId: defaultSite?.id || '',
    role: membership.role
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/widget-config/:siteId', (req, res) => {
  const siteId = String(req.params.siteId || '').trim();
  const payload = buildWidgetConfigPayload(siteId);
  if (!payload) {
    return res.status(404).json({ ok: false, message: 'Site config not found.' });
  }
  return res.json(payload);
});

app.get('/api/widget-config/:siteId', (req, res) => {
  const siteId = String(req.params.siteId || '').trim();
  const payload = buildWidgetConfigPayload(siteId);
  if (!payload) {
    return res.status(404).json({ ok: false, message: 'Site config not found.' });
  }
  return res.json(payload);
});

app.get('/api/widget-config/by-key/:widgetKey', (req, res) => {
  const widgetKey = String(req.params.widgetKey || '').trim();
  const site = workspaceService.getSiteByWidgetKey(widgetKey);
  if (!site || !site.isActive) {
    return res.status(404).json({ ok: false, message: 'Site config not found.' });
  }
  const config = resolveSiteConfig(site.id);
  if (!config) {
    return res.status(404).json({ ok: false, message: 'Site config not found.' });
  }
  return res.json({
    ok: true,
    siteId: site.id,
    workspaceId: site.workspaceId,
    widgetKey: site.widgetKey,
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
      typingSimulation: config.typingSimulation,
      operatorFallback: config.operatorFallback,
      availability: config.availability,
      widgetPosition: config.widgetPosition,
      widgetSize: config.widgetSize,
      language: config.language,
      welcomeMessage: config.welcomeMessage,
      placeholder: config.placeholder,
      launcherTitle: config.launcherTitle,
      launcherSubtitle: config.launcherSubtitle,
      avatarUrl: config.avatarUrl,
      flows: config.flows,
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

app.post('/api/widget/heartbeat', (req, res) => {
  try {
    const siteId = String(req.body?.siteId || '').trim();
    const widgetKey = String(req.body?.widgetKey || '').trim();
    if (!siteId || !widgetKey) {
      return res.status(400).json({ ok: false, message: 'siteId and widgetKey are required.' });
    }

    const pageUrl = String(req.body?.pageUrl || '').trim();
    const pageHost = deriveHeartbeatHost(pageUrl, req.body?.pageHost);
    const site = workspaceService.recordSiteHeartbeat(siteId, widgetKey, {
      pageUrl,
      pageHost,
      userAgent: req.body?.userAgent || req.get('user-agent') || '',
      referrer: req.body?.referrer || req.get('referer') || ''
    });

    if (!site) {
      return res.status(403).json({ ok: false, message: 'Invalid site credentials.' });
    }

    return res.json({
      ok: true,
      siteId: site.id,
      detected: true,
      lastSeenAt: site.lastSeenAt,
      domainValid: pageHost ? workspaceService.doesHostMatchSite(site, pageHost) : null
    });
  } catch (error) {
    console.error('Failed to record widget heartbeat', error);
    return res.status(500).json({ ok: false, message: 'Failed to record heartbeat.' });
  }
});

app.post('/api/conversations', (req, res) => {
  try {
    const siteId = String(req.body?.siteId || '').trim();
    const siteConfig = resolveSiteConfig(siteId);
    if (!siteConfig) {
      return res.status(404).json({ ok: false, message: 'Site config not found.' });
    }

    const visitorId = String(req.body?.visitorId || '').trim() || chatService.createVisitorId();
    const payload = chatService.createConversationForSite({
      siteId,
      workspaceId: req.workspaceContext?.workspaceId,
      visitorId,
      sourcePage: String(req.body?.sourcePage || '/').trim() || '/',
      language: String(req.body?.language || 'uk').trim() || 'uk'
    });

    return res.json({
      ok: true,
      visitorId,
      conversation: payload.conversation,
      messages: payload.messages,
      typing: payload.typing || null
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
      messages: chatService.getMessages(conversationId),
      typing: chatService.getTypingState(conversationId)
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

app.use('/api/inbox', requireOperatorAccess);
app.use('/api/admin/contacts', requireOperatorAccess);
app.use('/api/admin/ai', requireOperatorAccess);
app.use('/api/admin/analytics', requireAdminAccess);
app.use('/api/admin/integrations', requireAdminAccess);
app.use('/api/admin/sites', requireAdminAccess);
app.use('/api/products', requireOperatorAccess);
app.use('/inbox', requireOperatorAccess);
app.use('/settings', requireAdminAccess);
app.use('/analytics', requireAdminAccess);
app.use('/contacts', requireOperatorAccess);

app.get('/api/admin/sites', (req, res) => {
  try {
    const sites = getWorkspaceScopedSites(req);
    return res.json({
      ok: true,
      workspaceId: getRequestWorkspaceId(req),
      activeSiteId: getRequestSiteId(req),
      sites
    });
  } catch (error) {
    console.error('Failed to load sites', error);
    return res.status(500).json({ ok: false, message: 'Failed to load sites.' });
  }
});

app.post('/api/admin/sites', (req, res) => {
  try {
    const site = workspaceService.createSite(getRequestWorkspaceId(req), req.body || {});
    if (!site) {
      return res.status(400).json({ ok: false, message: 'Failed to create site.' });
    }
    ensureSiteSettings(site.id, {
      title: site.name,
      managerTitle: `Manager ${site.name}`,
      operatorMetaLabel: `Manager ${site.name}`,
      welcomeIntroLabel: `AI assistant ${site.name}`,
      botMetaLabel: `AI assistant ${site.name}`
    });
    setActiveSite(req, site.id);
    return res.status(201).json({
      ok: true,
      site: buildAdminSiteSummary(req, site),
      activeSiteId: site.id
    });
  } catch (error) {
    console.error('Failed to create site', error);
    return res.status(400).json({ ok: false, message: 'Failed to create site.' });
  }
});

app.patch('/api/admin/sites/:siteId', (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    const site = workspaceService.updateSite(getRequestWorkspaceId(req), siteId, req.body || {});
    if (!site) {
      return res.status(404).json({ ok: false, message: 'Site not found.' });
    }
    return res.json({
      ok: true,
      site: buildAdminSiteSummary(req, site)
    });
  } catch (error) {
    console.error('Failed to update site', error);
    return res.status(400).json({ ok: false, message: 'Failed to update site.' });
  }
});

app.post('/api/admin/sites/:siteId/select', (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    const site = setActiveSite(req, siteId);
    if (!site) {
      return res.status(404).json({ ok: false, message: 'Site not found.' });
    }
    return res.json({
      ok: true,
      activeSiteId: site.id,
      site: buildAdminSiteSummary(req, site)
    });
  } catch (error) {
    console.error('Failed to select site', error);
    return res.status(400).json({ ok: false, message: 'Failed to select site.' });
  }
});

app.post('/api/admin/sites/:siteId/regenerate-widget-key', (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    const site = workspaceService.regenerateWidgetKey(getRequestWorkspaceId(req), siteId);
    if (!site) {
      return res.status(404).json({ ok: false, message: 'Site not found.' });
    }
    return res.json({
      ok: true,
      site: buildAdminSiteSummary(req, site)
    });
  } catch (error) {
    console.error('Failed to regenerate widget key', error);
    return res.status(400).json({ ok: false, message: 'Failed to regenerate widget key.' });
  }
});

app.get('/api/admin/sites/:siteId/domains', (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    const site = workspaceService.getSiteByIdWithinWorkspace(siteId, getRequestWorkspaceId(req));
    if (!site) {
      return res.status(404).json({ ok: false, message: 'Site not found.' });
    }
    return res.json({
      ok: true,
      domains: site.domains || []
    });
  } catch (error) {
    console.error('Failed to load site domains', error);
    return res.status(500).json({ ok: false, message: 'Failed to load site domains.' });
  }
});

app.post('/api/admin/sites/:siteId/domains', (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    const domains = workspaceService.addSiteDomain(
      getRequestWorkspaceId(req),
      siteId,
      req.body?.domain,
      { isPrimary: req.body?.isPrimary === true || String(req.body?.isPrimary) === '1' }
    );
    if (!domains) {
      return res.status(404).json({ ok: false, message: 'Site not found.' });
    }
    return res.status(201).json({ ok: true, domains });
  } catch (error) {
    const message = error.message === 'INVALID_DOMAIN' ? 'Enter a valid domain.' : 'Failed to add domain.';
    console.error('Failed to add site domain', error);
    return res.status(400).json({ ok: false, message });
  }
});

app.delete('/api/admin/sites/:siteId/domains/:domainId', (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    const domainId = String(req.params.domainId || '').trim();
    const domains = workspaceService.deleteSiteDomain(getRequestWorkspaceId(req), siteId, domainId);
    if (!domains) {
      return res.status(404).json({ ok: false, message: 'Domain not found.' });
    }
    return res.json({ ok: true, domains });
  } catch (error) {
    console.error('Failed to remove site domain', error);
    return res.status(400).json({ ok: false, message: 'Failed to remove site domain.' });
  }
});

app.get('/api/admin/sites/:siteId/install', (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    const site = workspaceService.getSiteByIdWithinWorkspace(siteId, getRequestWorkspaceId(req));
    if (!site) {
      return res.status(404).json({ ok: false, message: 'Site not found.' });
    }
    return res.json({
      ok: true,
      install: buildSiteInstallPayload(req, site)
    });
  } catch (error) {
    console.error('Failed to load site install payload', error);
    return res.status(500).json({ ok: false, message: 'Failed to load install details.' });
  }
});

app.get('/api/admin/sites/:siteId/settings', (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    if (!isSiteAllowedForWorkspace(req, siteId)) {
      return res.status(404).json({ ok: false, message: 'Site settings not found.' });
    }
    const site = workspaceService.getSiteByIdWithinWorkspace(siteId, getRequestWorkspaceId(req));
    const settings = ensureSiteSettings(siteId, {
      title: site?.name || siteId
    }) || getEditableSiteSettings(siteId);
    if (!settings) {
      return res.status(404).json({ ok: false, message: 'Site settings not found.' });
    }
    return res.json({
      ok: true,
      settings: Object.assign({}, settings, {
        aiProviderStatus: buildAiProviderStatus(getRequestWorkspaceId(req))
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
    if (!isSiteAllowedForWorkspace(req, siteId)) {
      return res.status(404).json({ ok: false, message: 'Site settings not found.' });
    }
    const site = workspaceService.getSiteByIdWithinWorkspace(siteId, getRequestWorkspaceId(req));
    ensureSiteSettings(siteId, {
      title: site?.name || siteId
    });
    const settings = saveSiteSettings(siteId, req.body || {});
    if (!settings) {
      return res.status(404).json({ ok: false, message: 'Site settings not found.' });
    }
    return res.json({
      ok: true,
      settings: Object.assign({}, settings, {
        aiProviderStatus: buildAiProviderStatus(getRequestWorkspaceId(req))
      })
    });
  } catch (error) {
    console.error('Failed to save site settings', error);
    return res.status(500).json({ ok: false, message: 'Failed to save site settings.' });
  }
});

app.post('/api/admin/sites/:siteId/ai/generate-flow', async (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    const prompt = String(req.body?.prompt || '').trim();
    const language = String(req.body?.language || '').trim();
    const tone = String(req.body?.tone || '').trim();
    const goal = String(req.body?.goal || '').trim();
    const template = String(req.body?.template || '').trim();

    if (!siteId) {
      return res.status(400).json({ ok: false, message: 'siteId is required.' });
    }
    if (!prompt) {
      return res.status(400).json({ ok: false, message: 'Prompt is required.' });
    }
    if (!isSiteAllowedForWorkspace(req, siteId)) {
      return res.status(404).json({ ok: false, message: 'Site config not found.' });
    }

    const siteConfig = getSiteConfig(siteId);
    if (!siteConfig) {
      return res.status(404).json({ ok: false, message: 'Site config not found.' });
    }

    const result = await aiAssistantService.generateFlowDraft({
      siteConfig,
      prompt,
      language,
      tone,
      goal,
      template,
      existingFlows: Array.isArray(siteConfig.flows) ? siteConfig.flows : []
    });

    const normalizedFlow = normalizeFlows([result.draft], [], [])[0];
    if (!normalizedFlow) {
      throw new Error('AI assistant returned an empty normalized flow draft.');
    }

    return res.json({
      ok: true,
      draft: Object.assign({}, normalizedFlow, {
        summary: result.draft.summary || { goal: '', collectedFields: [], branches: [] }
      }),
      model: result.model
    });
  } catch (error) {
    console.error('Failed to generate AI flow draft', error);
    const message = String(error && error.message || '').trim();
    const status = /not configured|disabled/i.test(message) ? 503 : 500;
    return res.status(status).json({ ok: false, message: message || 'Failed to generate AI flow draft.' });
  }
});

app.post('/api/admin/sites/:siteId/ai/assist-flow', async (req, res) => {
  try {
    const siteId = String(req.params.siteId || '').trim();
    const mode = String(req.body?.mode || '').trim();
    const flowTitle = String(req.body?.flowTitle || '').trim();
    const conversation = Array.isArray(req.body?.conversation) ? req.body.conversation : [];
    const selectedMessage = req.body?.selectedMessage && typeof req.body.selectedMessage === 'object'
      ? req.body.selectedMessage
      : null;

    if (!siteId) {
      return res.status(400).json({ ok: false, message: 'siteId is required.' });
    }
    if (!mode) {
      return res.status(400).json({ ok: false, message: 'mode is required.' });
    }
    if (!isSiteAllowedForWorkspace(req, siteId)) {
      return res.status(404).json({ ok: false, message: 'Site config not found.' });
    }

    const siteConfig = getSiteConfig(siteId);
    if (!siteConfig) {
      return res.status(404).json({ ok: false, message: 'Site config not found.' });
    }

    const result = await aiAssistantService.assistFlowConversation({
      siteConfig,
      mode,
      flowTitle,
      conversation,
      selectedMessage
    });

    return res.json({
      ok: true,
      text: result.text,
      model: result.model
    });
  } catch (error) {
    console.error('Failed to assist AI flow conversation', error);
    const message = String(error && error.message || '').trim();
    const status = /not configured|disabled/i.test(message) ? 503 : 500;
    return res.status(status).json({ ok: false, message: message || 'Failed to assist AI flow conversation.' });
  }
});

app.get('/api/admin/integrations', (req, res) => {
  try {
    return res.json({ ok: true, settings: buildIntegrationSettingsPayload(getRequestWorkspaceId(req)) });
  } catch (error) {
    console.error('Failed to load integration settings', error);
    return res.status(500).json({ ok: false, message: 'Failed to load integration settings.' });
  }
});

app.post('/api/admin/integrations', (req, res) => {
  try {
    const settings = saveIntegrationSettings(req.body || {}, getRequestWorkspaceId(req));
    applyRuntimeIntegrationSettings();
    return res.json({ ok: true, settings });
  } catch (error) {
    console.error('Failed to save integration settings', error);
    return res.status(500).json({ ok: false, message: 'Failed to save integration settings.' });
  }
});

app.get('/api/admin/contacts', (req, res) => {
  try {
    const siteId = resolveScopedSiteFilter(req, req.query.siteId, { allowAll: true });
    if (siteId === null) {
      return res.status(404).json({ ok: false, message: 'Site not found.' });
    }
    const contacts = contactService.listContacts({
      workspaceId: getRequestWorkspaceId(req),
      q: req.query.q,
      siteId,
      conversationId: req.query.conversationId,
      limit: req.query.limit
    }).map((contact) => Object.assign({}, contact, buildContactOverview(contact)));
    return res.json({ ok: true, contacts, activeSiteId: getRequestSiteId(req), siteId: siteId || 'all' });
  } catch (error) {
    console.error('Failed to load contacts', error);
    return res.status(500).json({ ok: false, message: 'Failed to load contacts.' });
  }
});

app.get('/api/admin/contacts/export.csv', (req, res) => {
  try {
    const siteId = resolveScopedSiteFilter(req, req.query.siteId, { allowAll: true });
    if (siteId === null) {
      return res.status(404).json({ ok: false, message: 'Site not found.' });
    }
    const csv = contactService.exportContactsCsv({
      workspaceId: getRequestWorkspaceId(req),
      siteId,
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
    const contact = contactService.createContact(Object.assign({}, req.body || {}, {
      workspaceId: getRequestWorkspaceId(req)
    }));
    analyticsService.clearCache();
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
    if (!contact || String(contact.workspaceId || DEFAULT_WORKSPACE_ID) !== getRequestWorkspaceId(req)) {
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
    if (!contact || String(contact.workspaceId || DEFAULT_WORKSPACE_ID) !== getRequestWorkspaceId(req)) {
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
    const siteId = resolveScopedSiteFilter(req, req.query.siteId, { allowAll: true });
    if (siteId === null) {
      return res.status(404).json({ ok: false, message: 'Site not found.' });
    }
    const operator = String(req.query.operator || '').trim();
    const compare = String(req.query.compare || '').trim().toLowerCase();
    return res.json({
      ok: true,
      ...buildAnalyticsWorkspacePayload(period, {
        section,
        item,
        siteId,
        workspaceId: getRequestWorkspaceId(req),
        operator,
        compare: compare === '1' || compare === 'true' || compare === 'yes'
      }),
      activeSiteId: getRequestSiteId(req)
    });
  } catch (error) {
    console.error('Failed to load analytics', error);
    return res.status(500).json({ ok: false, message: 'Failed to load analytics.' });
  }
});

app.get('/api/analytics/top-questions', requireAdminAccess, (req, res) => {
  try {
    const period = analyticsService.parseAnalyticsPeriod(String(req.query.period || '30d').trim().toLowerCase());
    const siteId = resolveScopedSiteFilter(req, req.query.siteId, { allowAll: true });
    if (siteId === null) {
      return res.status(404).json({ ok: false, message: 'Site not found.' });
    }
    const dataset = analyticsService.loadAnalyticsDataset(period, {
      workspaceId: getRequestWorkspaceId(req),
      siteId
    }, false);
    const questions = analyticsService.buildTopQuestionAnalytics(
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
    const existing = contactService.getContactById(contactId);
    if (!existing || String(existing.workspaceId || DEFAULT_WORKSPACE_ID) !== getRequestWorkspaceId(req)) {
      return res.status(404).json({ ok: false, message: 'Contact not found.' });
    }
    const contact = contactService.updateContact(contactId, Object.assign({}, req.body || {}, {
      workspaceId: existing.workspaceId || getRequestWorkspaceId(req)
    }));
    if (!contact) {
      return res.status(404).json({ ok: false, message: 'Contact not found.' });
    }
    analyticsService.clearCache();
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
      workspaceId: payload.conversation.workspaceId || DEFAULT_WORKSPACE_ID,
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
      workspaceId: payload.conversation.workspaceId || DEFAULT_WORKSPACE_ID,
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
      workspaceId: payload.conversation.workspaceId || DEFAULT_WORKSPACE_ID,
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
      workspaceId: payload.conversation.workspaceId || DEFAULT_WORKSPACE_ID,
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
      workspaceId: payload.conversation.workspaceId || DEFAULT_WORKSPACE_ID,
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
app.get('/api/products/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    const source = String(req.query.source || 'all').trim().toLowerCase();
    const items = await searchProductsUnified(query, source, 12);
    return res.json({
      ok: true,
      items,
      sources: listProductProviders().map((provider) => ({ key: provider.key, label: provider.label }))
    });
  } catch (error) {
    console.error('Failed to search products', error);
    return res.status(500).json({ ok: false, message: 'Failed to search products.' });
  }
});

app.post('/api/products/resolve-url', async (req, res) => {
  try {
    const url = String(req.body?.url || '').trim();
    const source = String(req.body?.source || 'auto').trim().toLowerCase();
    if (!isValidHttpUrl(url)) {
      return res.status(400).json({ ok: false, message: 'A valid product URL is required.' });
    }
    const item = await resolveProductByUrl(url, source === 'all' ? 'auto' : source);
    if (!item) {
      return res.status(404).json({ ok: false, message: 'Product not found for this URL.' });
    }
    return res.json({
      ok: true,
      item,
      detectedSource: item.source || source || 'auto'
    });
  } catch (error) {
    console.error('Failed to resolve product URL', error);
    return res.status(500).json({ ok: false, message: 'Failed to resolve product URL.' });
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

app.post('/api/conversations/:conversationId/product-offer', requireOperatorAccess, handleProductOfferRequest);
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
      workspaceId: getRequestWorkspaceId(req),
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
    if (!payload || !assertConversationWorkspaceMatch(payload.conversation, getRequestWorkspaceId(req))) {
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
    if (!payload || !assertConversationWorkspaceMatch(payload.conversation, getRequestWorkspaceId(req))) {
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
    if (!conversation || !assertConversationWorkspaceMatch(conversation, getRequestWorkspaceId(req))) {
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
    if (!conversation || !assertConversationWorkspaceMatch(conversation, getRequestWorkspaceId(req))) {
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
    if (!conversation || !assertConversationWorkspaceMatch(conversation, getRequestWorkspaceId(req))) {
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
        display: block;
        width: 100%;
        max-width: none;
        min-height: 100vh;
        padding: 0;
        gap: 0;
        min-width: 0;
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
      .content {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--page-bg);
        min-width: 0;
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
      .site-manager-card,
      .site-row-card {
        border: 1px solid var(--bdr);
        border-radius: 12px;
        background: var(--card);
        box-shadow: var(--shadow-sm);
      }
      .site-manager-card {
        padding: 18px;
        margin-bottom: 18px;
      }
      .site-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .site-toolbar-copy strong {
        display: block;
        font-size: 15px;
      }
      .site-toolbar-copy small {
        display: block;
        margin-top: 3px;
        color: var(--txt2);
      }
      .site-active-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px;
        border-radius: 999px;
        background: var(--blue-l);
        color: var(--blue);
        font-size: 12px;
        font-weight: 600;
      }
      .site-create-grid,
      .site-row-grid,
      .site-domain-form {
        display: grid;
        gap: 10px;
      }
      .site-create-grid,
      .site-domain-form {
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
        align-items: end;
      }
      .site-list {
        display: grid;
        gap: 12px;
        margin-top: 14px;
      }
      .site-row-card {
        padding: 14px;
      }
      .site-row-head {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 10px;
      }
      .site-row-title {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .site-row-title strong {
        font-size: 14px;
      }
      .site-pill {
        display: inline-flex;
        align-items: center;
        padding: 3px 8px;
        border-radius: 999px;
        border: 1px solid var(--bdr);
        color: var(--txt2);
        font-size: 11px;
        font-weight: 600;
      }
      .site-pill.active {
        border-color: var(--blue-b);
        background: var(--blue-l);
        color: var(--blue);
      }
      .site-row-grid {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 120px;
      }
      .site-row-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }
      .site-widget-key {
        margin-top: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        background: var(--card-soft);
        border: 1px solid var(--bdr);
        font-size: 12px;
        color: var(--txt2);
      }
      .site-domains {
        margin-top: 12px;
        display: grid;
        gap: 10px;
      }
      .site-domain-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .site-domain-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        border-radius: 999px;
        background: var(--card-soft);
        border: 1px solid var(--bdr);
        font-size: 12px;
      }
      .site-domain-chip button {
        border: 0;
        background: transparent;
        color: var(--red);
        cursor: pointer;
        padding: 0;
        font: inherit;
      }
      .site-manager-empty {
        padding: 16px;
        border: 1px dashed var(--bdr-strong);
        border-radius: 12px;
        color: var(--txt2);
        background: var(--card-soft);
      }
      .install-shell {
        display: grid;
        gap: 18px;
      }
      .install-card {
        border: 1px solid var(--bdr);
        border-radius: 16px;
        background: var(--card);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }
      .install-card-head {
        padding: 18px 20px 10px;
        display: grid;
        gap: 4px;
      }
      .install-card-head strong {
        font-size: 16px;
      }
      .install-card-head small {
        color: var(--txt2);
        line-height: 1.5;
      }
      .install-card-body {
        padding: 0 20px 20px;
        display: grid;
        gap: 16px;
      }
      .install-context-grid,
      .install-status-grid,
      .install-actions {
        display: grid;
        gap: 10px;
      }
      .install-context-grid,
      .install-status-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .install-context-item,
      .install-status-item {
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid var(--bdr);
        background: var(--card-soft);
      }
      .install-context-item label,
      .install-status-item label {
        display: block;
        margin-bottom: 6px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--txt3);
      }
      .install-context-item strong,
      .install-status-item strong {
        display: block;
        font-size: 14px;
        color: var(--txt1);
        word-break: break-word;
      }
      .install-context-item code {
        font-size: 13px;
      }
      .install-code-block {
        position: relative;
        border-radius: 16px;
        background: #111827;
        color: #f8fafc;
        border: 1px solid rgba(15, 23, 42, 0.18);
        overflow: hidden;
      }
      .install-code-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
      }
      .install-code-head strong {
        font-size: 13px;
        color: #e2e8f0;
      }
      .install-code-head small {
        color: #94a3b8;
      }
      .install-code {
        margin: 0;
        padding: 16px;
        overflow-x: auto;
        font: 500 13px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        white-space: pre;
      }
      .install-actions {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .install-guidance-list {
        display: grid;
        gap: 10px;
        padding-left: 18px;
        margin: 0;
        color: var(--txt2);
      }
      .install-help-stack {
        display: grid;
        gap: 10px;
      }
      .install-help-item {
        border: 1px solid var(--bdr);
        border-radius: 12px;
        background: var(--card-soft);
        padding: 0 14px;
      }
      .install-help-item summary {
        cursor: pointer;
        list-style: none;
        padding: 14px 0;
        font-weight: 600;
      }
      .install-help-item summary::-webkit-details-marker {
        display: none;
      }
      .install-help-copy {
        padding: 0 0 14px;
        color: var(--txt2);
        line-height: 1.55;
      }
      .install-domain-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .install-domain-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid var(--bdr);
        background: var(--card-soft);
        color: var(--txt2);
        font-size: 12px;
      }
      .install-domain-chip strong {
        color: var(--txt1);
        font-size: 12px;
      }
      .install-widget-key-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .install-widget-key-row code {
        padding: 6px 8px;
        border-radius: 8px;
        background: var(--card-soft);
        border: 1px solid var(--bdr);
      }
      @media (max-width: 980px) {
        .install-context-grid,
        .install-status-grid,
        .install-actions {
          grid-template-columns: 1fr;
        }
      }
      .form {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        min-width: 0;
        width: 100%;
        padding: 0;
      }
      .settings-shell {
        --flows-column-width: 0px;
        display: grid;
        grid-template-columns: 220px var(--flows-column-width) minmax(0, 1fr) 340px;
        flex: 1;
        min-height: 0;
        min-width: 0;
        width: 100%;
        overflow: hidden;
      }
      .settings-shell.is-flows-active {
        --flows-column-width: 240px;
      }
      .settings-categories {
        grid-column: 1;
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
      .settings-flows-column {
        grid-column: 2;
        display: none;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
        background: var(--card);
        border-right: 1px solid var(--bdr);
      }
      .settings-shell.is-flows-active .settings-flows-column {
        display: flex;
      }
      .settings-flows-column-head {
        padding: 16px 16px 12px;
        border-bottom: 1px solid var(--bdr);
      }
      .settings-flows-column-head strong {
        display: block;
        font-size: 14px;
        letter-spacing: -0.02em;
      }
      .settings-flows-column-head small {
        display: block;
        margin-top: 4px;
        font-size: 11px;
        color: var(--txt3);
        line-height: 1.45;
      }
      .settings-flows-column-body {
        display: grid;
        gap: 10px;
        min-height: 0;
        padding: 14px 12px;
        overflow-y: auto;
        align-content: start;
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
        grid-column: 3;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        min-height: 0;
        min-width: 0;
        width: 100%;
        overflow: hidden;
      }
      .settings-preview-panel {
        grid-column: 4;
        display: flex;
        flex-direction: column;
        min-height: 0;
        min-width: 340px;
        width: 340px;
        border-left: 1px solid var(--bdr);
        background: linear-gradient(180deg, #f8f8fb 0%, #f3f4f8 100%);
        overflow: hidden;
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
      .settings-section[data-section="general"] .section-copy strong {
        font-size: 18px;
        font-weight: 700;
        color: var(--txt1);
      }
      .settings-section[data-section="general"] .section-copy small {
        font-size: 13px;
        color: var(--txt2);
        max-width: 700px;
      }
      .settings-section-body {
        display: grid;
        gap: 18px;
        padding: 16px 22px 18px;
        overflow: visible;
      }
      .general-section-body {
        padding: 18px 26px 26px;
      }
      .general-content {
        width: min(100%, 1060px);
        display: grid;
        gap: 20px;
        margin-right: auto;
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
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .settings-card-head small {
        font-size: 11px;
        color: var(--txt3);
        line-height: 1.4;
      }
      .general-card {
        gap: 14px;
        padding: 22px 24px;
        border: 1px solid var(--bdr-strong);
        border-radius: 20px;
        box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04), 0 2px 6px rgba(15, 23, 42, 0.03);
      }
      .general-card .settings-card-head {
        gap: 5px;
      }
      .general-card .settings-card-head strong {
        font-size: 17px;
        color: var(--txt1);
      }
      .general-card .settings-card-head small {
        max-width: 680px;
        font-size: 12px;
        color: var(--txt2);
      }
      .general-card .grid {
        gap: 14px 16px;
      }
      .general-card .field {
        gap: 6px;
      }
      .general-card label {
        color: var(--txt2);
      }
      .general-card input,
      .general-card textarea,
      .general-card select {
        border-radius: 12px;
        padding: 10px 13px;
        font-size: 14px;
        border-color: var(--bdr);
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
      }
      .general-card textarea {
        min-height: 110px;
      }
      .general-card .field-help {
        color: var(--txt2);
      }
      .identity-grid {
        grid-template-columns: repeat(2, minmax(240px, 1fr));
      }
      .identity-links {
        display: grid;
        gap: 14px;
        padding-top: 16px;
        border-top: 1px solid var(--bdr);
      }
      .compact-grid {
        grid-template-columns: repeat(2, minmax(220px, 320px));
        justify-content: start;
      }
      .availability-mode-field {
        max-width: 360px;
      }
      #availabilityDynamicFields {
        display: grid;
        gap: 14px;
      }
      #availabilityDynamicFields:empty {
        display: none;
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
      .stack-fields {
        display: grid;
        gap: 12px;
      }
      .field-help {
        margin-top: 2px;
        font-size: 11px;
        color: var(--txt3);
        line-height: 1.4;
      }
      .nested-block {
        display: grid;
        gap: 12px;
        margin-top: 2px;
        padding-top: 16px;
        border-top: 1px solid var(--bdr);
      }
      .nested-block-head {
        display: grid;
        gap: 3px;
      }
      .nested-block-head strong {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .nested-block-head small {
        margin: 0;
        font-size: 11px;
        color: var(--txt3);
        line-height: 1.4;
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
        gap: 0;
        max-width: 800px;
        border-top: 1px solid var(--bdr);
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
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border: 0;
        border-bottom: 1px solid var(--bdr);
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        transition: background-color .14s ease;
      }
      .quick-action-row.operator-reply-row:hover {
        background: rgba(59,91,219,.03);
      }
      .quick-reply-copy {
        min-width: 0;
        max-width: 680px;
      }
      .quick-reply-input {
        width: 100%;
        max-width: 680px;
        border: 0;
        border-radius: 8px;
        padding: 6px 8px;
        background: transparent;
        box-shadow: none;
        font-size: 14px;
        line-height: 1.45;
        font-weight: 500;
        color: var(--txt1);
      }
      .quick-reply-input::placeholder {
        color: var(--txt3);
      }
      .quick-reply-input:hover {
        background: rgba(59,91,219,.035);
      }
      .quick-reply-input:focus {
        background: var(--card-soft);
        border: 1px solid var(--blue-b);
        box-shadow: 0 0 0 3px rgba(59,91,219,.08);
      }
      .quick-reply-actions {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0;
        border-radius: 0;
        border: 0;
        background: transparent;
        flex-shrink: 0;
      }
      .quick-reply-icon-btn {
        width: 28px;
        height: 28px;
        padding: 0;
        border-radius: 8px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--txt2);
        font-size: 12px;
        font-weight: 700;
        box-shadow: none;
      }
      .quick-reply-icon-btn:hover {
        background: rgba(59,91,219,.08);
        border-color: rgba(59,91,219,.12);
        color: var(--blue);
      }
      .quick-reply-icon-btn.danger {
        color: var(--red);
      }
      .quick-reply-icon-btn.danger:hover {
        background: rgba(224,49,49,.08);
        border-color: rgba(224,49,49,.14);
        color: var(--red);
      }
      .actions-quick-replies {
        max-width: 840px;
        gap: 14px;
        padding: 0;
        background: transparent;
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }
      .actions-quick-replies .section-actions.compact {
        margin-top: 0;
      }
      .actions-quick-replies .section-actions.compact button {
        min-height: 36px;
      }
      .flow-scenarios {
        display: grid;
        gap: 10px;
      }
      .flows-workspace {
        display: block;
      }
      .flows-editor-panel {
        display: grid;
        gap: 12px;
        padding: 14px;
        background: linear-gradient(180deg, rgba(255,255,255,.94) 0%, rgba(249,250,253,.98) 100%);
        border: 1px solid var(--bdr);
        border-radius: 20px;
        box-shadow: 0 12px 28px rgba(15,23,42,.06);
      }
      .flows-list-copy,
      .flows-editor-copy,
      .flow-scenario-copy,
      .flow-step-copy {
        display: grid;
        gap: 3px;
      }
      .flows-list-copy strong,
      .flows-editor-copy strong,
      .flow-scenario-copy strong,
      .flow-step-copy strong {
        font-size: 13px;
        letter-spacing: -0.02em;
      }
      .flows-list-copy small,
      .flows-editor-copy small,
      .flow-scenario-copy p,
      .flow-step-copy span {
        margin: 0;
        font-size: 11px;
        color: var(--txt3);
        line-height: 1.4;
      }
      .flow-list {
        display: grid;
        gap: 8px;
      }
      .flow-list-item {
        position: relative;
        width: 100%;
        border: 1px solid var(--bdr);
        border-radius: 10px;
        background: var(--card);
        padding: 10px 11px;
        box-shadow: var(--shadow-sm);
        transition: background-color .14s ease, border-color .14s ease, box-shadow .14s ease;
      }
      .flow-list-item:hover {
        border-color: var(--blue-b);
      }
      .flow-list-item.active {
        background: var(--blue-l);
        border-color: var(--blue-b);
      }
      .flow-list-item strong {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--txt1);
      }
      .flow-list-item span {
        display: block;
        margin-top: 2px;
        font-size: 10px;
        color: var(--txt3);
        line-height: 1.4;
      }
      .flow-list-item.active strong,
      .flow-list-item.active span {
        color: var(--blue);
      }
      .flow-list-item.is-hidden-flow {
        opacity: 0.72;
      }
      .flow-list-item-main {
        width: 100%;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: start;
        text-align: left;
        border: 0;
        background: transparent;
        padding: 0;
      }
      .flow-list-item-copy {
        min-width: 0;
      }
      .flow-list-item-copy strong,
      .flow-list-item-copy span {
        display: block;
      }
      .flow-list-item-menu-btn {
        width: 24px;
        height: 24px;
        border-radius: 999px;
        border: 1px solid rgba(43, 54, 77, 0.08);
        background: rgba(255,255,255,0.92);
        color: var(--txt3);
        font-size: 13px;
        line-height: 1;
        display: grid;
        place-items: center;
      }
      .flow-list-item-editor {
        display: grid;
        gap: 8px;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(43, 54, 77, 0.06);
      }
      .flow-list-item-editor-row {
        display: grid;
        grid-template-columns: 52px minmax(0, 1fr);
        gap: 8px;
      }
      .flow-list-item-editor input {
        min-height: 34px;
      }
      .flow-list-item-menu {
        position: absolute;
        top: 36px;
        right: 8px;
        min-width: 156px;
        display: grid;
        gap: 4px;
        padding: 6px;
        border: 1px solid rgba(43, 54, 77, 0.07);
        border-radius: 12px;
        background: rgba(255,255,255,.99);
        box-shadow: 0 8px 18px rgba(31, 46, 79, 0.08);
        z-index: 6;
      }
      .flow-list-item-menu button {
        width: 100%;
        text-align: left;
        border: 0;
        background: transparent;
        color: var(--txt2);
        border-radius: 9px;
        padding: 7px 9px;
        font-size: 10px;
        font-weight: 600;
        line-height: 1.25;
      }
      .flow-list-item-menu button:hover {
        background: rgba(59,91,219,.08);
        color: var(--blue);
      }
      .flow-list-item-menu button.danger {
        color: var(--red);
      }
      .flow-list-add {
        width: 100%;
      }
      .flows-editor-empty {
        border: 1px dashed var(--bdr-strong);
        border-radius: 10px;
        background: var(--card-soft);
        padding: 14px;
        color: var(--txt3);
        font-size: 12px;
      }
      .flows-editor-toolbar {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 2px 4px 4px;
        width: min(100%, 640px);
        margin: 0 auto;
      }
      .flows-editor-actions {
        display: inline-flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
      }
      .flow-header-menu {
        width: min(100%, 640px);
        margin: 0 auto 4px;
        display: grid;
        justify-items: end;
      }
      .flow-header-menu-card {
        width: min(100%, 280px);
        display: grid;
        gap: 10px;
        padding: 10px;
        border: 1px solid rgba(43, 54, 77, 0.08);
        border-radius: 14px;
        background: rgba(255,255,255,.98);
        box-shadow: 0 10px 24px rgba(31, 46, 79, 0.08);
      }
      .flow-header-menu-card .field {
        gap: 6px;
      }
      .flow-header-menu-card input {
        min-height: 36px;
      }
      .flows-editor-copy {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .flows-editor-copy strong {
        font-size: 16px;
        letter-spacing: -0.03em;
      }
      .flow-title-menu-btn {
        width: 26px;
        height: 26px;
        border-radius: 999px;
        border: 1px solid rgba(43, 54, 77, 0.08);
        background: rgba(255,255,255,0.92);
        color: var(--txt3);
        font-size: 14px;
        line-height: 1;
        display: grid;
        place-items: center;
      }
      .flow-toolbar-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }
      .flow-toolbar-helper {
        color: var(--txt3);
      }
      .flow-toolbar-badge {
        display: inline-flex;
        align-items: center;
        min-height: 26px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid var(--bdr);
        background: rgba(255,255,255,.92);
        color: var(--txt2);
        font-size: 11px;
        font-weight: 700;
      }
      .flow-toolbar-badge.visible {
        color: var(--blue);
        border-color: var(--blue-b);
        background: var(--blue-l);
      }
      .flow-scenario-card {
        border: 1px solid var(--bdr);
        border-radius: 12px;
        background: var(--card);
        padding: 0;
        display: none;
        gap: 10px;
        box-shadow: var(--shadow-sm);
      }
      .flow-scenario-card.is-active {
        display: grid;
      }
      .flow-scenario-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 16px 0;
      }
      .flow-scenario-head p {
        margin: 3px 0 0;
        color: var(--txt3);
        font-size: 11px;
      }
      .flow-editor {
        display: grid;
        gap: 12px;
        padding: 0 16px 16px;
      }
      .flow-settings-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
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
        padding: 12px;
        display: grid;
        gap: 10px;
      }
      .flow-step-card.is-active {
        border-color: var(--blue-b);
        box-shadow: 0 0 0 3px rgba(59,91,219,.08);
      }
      .flow-step-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
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
      .hours-grid {
        display: grid;
        gap: 8px;
      }
      .hours-row {
        display: grid;
        grid-template-columns: 120px auto minmax(120px, 1fr) minmax(120px, 1fr);
        gap: 10px;
        align-items: center;
        padding: 10px 12px;
        border: 1px solid var(--bdr);
        border-radius: 12px;
        background: var(--card-soft);
        min-width: 0;
      }
      .hours-row strong {
        font-size: 12px;
        line-height: 1.2;
      }
      .inline-toggle {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 34px;
        color: var(--txt3);
        font-size: 11px;
        white-space: nowrap;
      }
      .hours-row input[type="time"] {
        min-width: 0;
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
        min-width: 0;
        width: 100%;
        overflow-y: auto;
      }
      .settings-section,
      .settings-section-body,
      .flows-workspace,
      .flows-editor-panel,
      .flow-scenarios,
      .flow-scenario-card,
      .flow-editor,
      .flow-steps {
        min-width: 0;
      }
      .preview-chip.is-active {
        background: var(--blue-l);
        border-color: var(--blue-b);
        color: var(--blue);
      }
      .preview-mode-btn {
        border: 1px solid var(--bdr);
        background: var(--card);
        color: var(--txt2);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 600;
      }
      .preview-mode-btn.active {
        background: var(--blue-l);
        border-color: var(--blue-b);
        color: var(--blue);
      }
      .preview-step-label {
        display: inline-flex;
        align-items: center;
        margin-top: 8px;
        padding: 3px 8px;
        border-radius: 999px;
        background: var(--blue-l);
        color: var(--blue);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .settings-shell.is-flows-active {
        grid-template-columns: 220px var(--flows-column-width) minmax(0, 1fr);
      }
      .settings-shell.is-flows-active .settings-preview-panel {
        display: none;
      }
      .flow-search-field {
        gap: 6px;
      }
      .flow-search-field label {
        font-size: 10px;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .flows-workspace {
        position: relative;
      }
      .flows-editor-panel {
        padding: 20px;
        gap: 16px;
      }
      .flows-editor-toolbar--builder {
        align-items: center;
      }
      .flow-builder-mode-switch {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px;
        border: 1px solid var(--bdr);
        border-radius: 999px;
        background: var(--card-soft);
      }
      .flow-builder-mode-switch .preview-mode-btn {
        margin: 0;
      }
      .flows-mode-view {
        min-width: 0;
      }
      .flow-scenarios {
        gap: 14px;
      }
      .flow-scenario-card {
        border-radius: 18px;
        overflow: hidden;
      }
      .flow-scenario-card.is-active {
        gap: 0;
      }
      .flow-scenario-head {
        padding: 18px 20px 0;
        align-items: flex-start;
      }
      .flow-scenario-copy strong {
        font-size: 16px;
      }
      .flow-scenario-copy p {
        margin-top: 4px;
      }
      .flow-scenario-overview {
        display: grid;
        gap: 12px;
        padding: 0 20px;
      }
      .flow-overview-card {
        display: grid;
        gap: 14px;
        border: 1px solid var(--bdr);
        border-radius: 16px;
        background: linear-gradient(180deg, #ffffff 0%, #f8f9fd 100%);
        padding: 16px;
      }
      .flow-overview-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
      }
      .flow-overview-copy {
        display: grid;
        gap: 6px;
      }
      .flow-overview-copy strong {
        font-size: 15px;
      }
      .flow-overview-copy p {
        margin: 0;
        color: var(--txt3);
        font-size: 12px;
        line-height: 1.5;
      }
      .flow-overview-actions {
        display: inline-flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .flow-overview-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .flow-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 28px;
        padding: 0 10px;
        border: 1px solid var(--bdr);
        border-radius: 999px;
        background: var(--card);
        color: var(--txt2);
        font-size: 11px;
        font-weight: 600;
      }
      .flow-pill.active {
        color: var(--blue);
        background: var(--blue-l);
        border-color: var(--blue-b);
      }
      .flow-pill.muted {
        color: var(--txt3);
      }
      .flow-source-fields {
        display: none;
      }
      .flow-structure-stack {
        display: grid;
        gap: 10px;
        padding: 18px 20px 20px;
      }
      .flow-step-card {
        position: relative;
        grid-template-columns: 1fr;
        gap: 14px;
        padding: 16px 18px;
        border-radius: 16px;
        background: #fff;
      }
      .flow-step-card::before {
        content: '';
        position: absolute;
        left: 18px;
        top: 18px;
        bottom: 18px;
        width: 3px;
        border-radius: 999px;
        background: var(--bdr);
      }
      .flow-step-card.is-active {
        background: linear-gradient(180deg, #ffffff 0%, #f7f9ff 100%);
        border-color: rgba(59,91,219,.36);
        box-shadow: 0 0 0 3px rgba(59,91,219,.08), 0 14px 28px rgba(15,23,42,.06);
      }
      .flow-step-card.is-active::before {
        background: var(--blue);
      }
      .flow-step-head {
        align-items: flex-start;
        padding-left: 14px;
      }
      .flow-step-copy strong {
        font-size: 15px;
      }
      .flow-step-kicker {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: var(--blue);
      }
      .flow-step-kicker .dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: currentColor;
      }
      .flow-step-kicker.user {
        color: #0f766e;
      }
      .flow-step-kicker.choice {
        color: #8b5cf6;
      }
      .flow-step-kicker.file {
        color: #d97706;
      }
      .flow-step-kicker.end {
        color: #475569;
      }
      .flow-step-surface {
        display: grid;
        gap: 12px;
        padding-left: 14px;
      }
      .flow-step-summary {
        display: grid;
        gap: 10px;
      }
      .flow-chat-bubble {
        max-width: 720px;
        padding: 12px 14px;
        border-radius: 16px;
        background: var(--card-soft);
        border: 1px solid var(--bdr);
        color: var(--txt1);
        font-size: 13px;
        line-height: 1.55;
        white-space: pre-wrap;
      }
      .flow-chat-bubble.empty {
        color: var(--txt3);
        font-style: italic;
      }
      .flow-step-note {
        color: var(--txt3);
        font-size: 12px;
        line-height: 1.5;
      }
      .flow-step-options {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .flow-step-option {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(139,92,246,.22);
        background: rgba(139,92,246,.08);
        color: #6d28d9;
        font-size: 12px;
        font-weight: 600;
      }
      .flow-step-option span {
        color: #8b5cf6;
        font-size: 11px;
        font-weight: 700;
      }
      .flow-step-branching {
        display: grid;
        gap: 7px;
      }
      .flow-step-branch {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border: 1px dashed var(--bdr-strong);
        border-radius: 12px;
        padding: 9px 11px;
        background: rgba(255,255,255,.86);
      }
      .flow-step-branch strong {
        font-size: 12px;
      }
      .flow-step-branch small {
        color: var(--txt3);
        font-size: 11px;
      }
      .flow-step-actions {
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .flow-icon-btn {
        border: 1px solid var(--bdr);
        border-radius: 10px;
        background: var(--card);
        color: var(--txt2);
        min-height: 34px;
        padding: 0 12px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: var(--shadow-sm);
      }
      .flow-icon-btn:hover {
        border-color: var(--blue-b);
        color: var(--blue);
      }
      .flow-icon-btn.danger {
        color: var(--red);
        border-color: rgba(224,49,49,.18);
        background: rgba(224,49,49,.04);
      }
      .flow-insert-step {
        position: relative;
        display: flex;
        justify-content: center;
        padding: 2px 0;
      }
      .flow-insert-step::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 34px;
        width: 1px;
        background: var(--bdr);
      }
      .flow-insert-step button {
        position: relative;
        z-index: 1;
        border-radius: 999px;
        padding: 7px 14px;
      }
      .flow-step-drawer-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15,23,42,.18);
        backdrop-filter: blur(2px);
        z-index: 5;
      }
      .flow-step-drawer {
        position: absolute;
        top: 22px;
        right: 22px;
        width: min(420px, calc(100% - 44px));
        max-height: min(760px, calc(100% - 44px));
        border: 1px solid var(--bdr);
        border-radius: 20px;
        background: #fff;
        box-shadow: 0 24px 60px rgba(15,23,42,.18);
        z-index: 6;
        display: grid;
        grid-template-rows: auto 1fr auto;
        overflow: hidden;
      }
      .flow-step-drawer[hidden],
      .flow-step-drawer-backdrop[hidden] {
        display: none !important;
      }
      .flow-step-drawer-head,
      .flow-step-drawer-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 18px 20px;
        border-bottom: 1px solid var(--bdr);
        background: linear-gradient(180deg, #ffffff 0%, #fbfbfe 100%);
      }
      .flow-step-drawer-foot {
        border-bottom: 0;
        border-top: 1px solid var(--bdr);
      }
      .flow-step-drawer-copy {
        display: grid;
        gap: 4px;
      }
      .flow-step-drawer-copy strong {
        font-size: 16px;
      }
      .flow-step-drawer-copy small {
        color: var(--txt3);
        font-size: 12px;
        line-height: 1.45;
      }
      .flow-step-drawer-body {
        overflow-y: auto;
        padding: 18px 20px;
        display: grid;
        gap: 16px;
      }
      .flow-step-drawer-section {
        display: grid;
        gap: 12px;
        padding: 14px;
        border: 1px solid var(--bdr);
        border-radius: 14px;
        background: var(--card-soft);
      }
      .flow-step-drawer-section h4 {
        margin: 0;
        font-size: 13px;
      }
      .flow-step-drawer-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .flow-step-drawer-grid .field.full {
        grid-column: 1 / -1;
      }
      .flow-drawer-options {
        display: grid;
        gap: 12px;
      }
      .flow-choice-mode-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px;
        border: 1px solid var(--bdr);
        border-radius: 999px;
        background: var(--card);
      }
      .flow-choice-mode-btn {
        border: 0;
        background: transparent;
        color: var(--txt2);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 700;
      }
      .flow-choice-mode-btn.active {
        background: var(--blue-l);
        color: var(--blue);
      }
      .flow-choice-helper {
        margin: 0;
        color: var(--txt3);
        font-size: 12px;
        line-height: 1.5;
      }
      .flow-drawer-option-row {
        display: grid;
        gap: 10px;
        padding: 14px;
        border: 1px solid var(--bdr);
        border-radius: 14px;
        background: #fff;
      }
      .flow-drawer-option-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .flow-drawer-option-title {
        display: grid;
        gap: 4px;
      }
      .flow-drawer-option-title strong {
        font-size: 13px;
      }
      .flow-drawer-option-title small {
        color: var(--txt3);
        font-size: 11px;
      }
      .flow-drawer-option-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 180px auto;
        gap: 10px;
        align-items: end;
      }
      .flow-drawer-option-grid.is-advanced {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 180px auto;
      }
      .flow-option-preview {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(59,91,219,.16);
        background: rgba(59,91,219,.06);
        color: var(--blue);
        font-size: 12px;
        font-weight: 600;
      }
      .field-help-inline {
        margin-top: 6px;
        color: var(--txt3);
        font-size: 11px;
        line-height: 1.45;
      }
      .flow-drawer-utility {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .flow-test-shell {
        display: grid;
        gap: 16px;
      }
      .flow-test-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .flow-test-copy {
        display: grid;
        gap: 4px;
      }
      .flow-test-copy strong {
        font-size: 15px;
      }
      .flow-test-copy small {
        color: var(--txt3);
        font-size: 12px;
      }
      .flow-test-canvas {
        display: grid;
        gap: 14px;
        min-height: 620px;
        border: 1px solid var(--bdr);
        border-radius: 20px;
        background: linear-gradient(180deg, #ffffff 0%, #f8f9fd 100%);
        padding: 18px;
      }
      .flow-test-empty {
        display: grid;
        place-items: center;
        border: 1px dashed var(--bdr-strong);
        border-radius: 16px;
        color: var(--txt3);
        font-size: 13px;
        min-height: 300px;
        background: rgba(255,255,255,.75);
      }
      .flow-test-thread {
        display: grid;
        gap: 12px;
        align-content: start;
      }
      .flow-test-message {
        display: flex;
      }
      .flow-test-message.bot {
        justify-content: flex-start;
      }
      .flow-test-message.user {
        justify-content: flex-end;
      }
      .flow-test-bubble {
        max-width: min(74%, 760px);
        border-radius: 18px;
        padding: 12px 14px;
        font-size: 13px;
        line-height: 1.55;
        border: 1px solid var(--bdr);
        background: #fff;
        color: var(--txt1);
        box-shadow: var(--shadow-sm);
        white-space: pre-wrap;
      }
      .flow-test-message.user .flow-test-bubble {
        background: var(--blue);
        color: #fff;
        border-color: rgba(59,91,219,.26);
      }
      .flow-test-controls {
        margin-top: auto;
        display: grid;
        gap: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--bdr);
      }
      .flow-test-option-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .flow-test-option-btn,
      .flow-test-submit-btn {
        border: 1px solid var(--blue-b);
        background: var(--blue-l);
        color: var(--blue);
        border-radius: 999px;
        padding: 9px 14px;
        font-size: 12px;
        font-weight: 600;
      }
      .flow-test-submit-btn {
        border-radius: 10px;
      }
      .flow-test-input-row {
        display: flex;
        gap: 10px;
      }
      .flow-test-input-row input {
        min-height: 42px;
      }
      .flow-test-hint {
        color: var(--txt3);
        font-size: 12px;
      }
      .flow-chat-editor {
        display: grid;
        gap: 14px;
      }
      .flow-chat-thread {
        width: min(100%, 640px);
        margin: 0 auto;
        min-height: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        padding: 0;
        align-content: start;
        box-shadow: none;
      }
      .flow-conversation-shell {
        display: grid;
        gap: 0;
      }
      .flow-widget-shell {
        overflow: visible;
        border-radius: 18px;
        background: linear-gradient(180deg, #fdfcf9 0%, #faf8f3 100%);
        border: 1px solid rgba(43, 54, 77, 0.08);
        min-height: 740px;
        display: flex;
        flex-direction: column;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.8);
      }
      .flow-widget-header {
        padding: 12px 14px;
        color: #fff8ef;
        display: flex;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }
      .flow-widget-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(255,255,255,0.16);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        overflow: hidden;
        flex-shrink: 0;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
      }
      .flow-widget-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .flow-widget-header-copy {
        min-width: 0;
        flex: 1 1 auto;
        display: grid;
        gap: 1px;
      }
      .flow-widget-header-copy strong {
        font-size: 14px;
        line-height: 1.2;
        letter-spacing: -0.02em;
      }
      .flow-widget-header-copy span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 10px;
        color: rgba(255, 248, 239, 0.72);
      }
      .flow-widget-status {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #40d47e;
        flex: 0 0 auto;
        opacity: 0.92;
      }
      .flow-widget-chat {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: 10px 12px 4px;
        background: linear-gradient(180deg, rgba(255,255,255,.74) 0%, rgba(255,252,248,.95) 100%);
      }
      .flow-widget-quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        padding: 0 0 8px;
      }
      .flow-widget-quick-chip {
        display: inline-flex;
        align-items: center;
        min-height: 0;
        padding: 6px 10px;
        border-radius: 14px;
        background: rgba(255,255,255,0.72);
        border: 1px solid rgba(43, 54, 77, 0.08);
        color: #556075;
        font-size: 11px;
        font-weight: 650;
        line-height: 1.2;
      }
      .flow-widget-quick-chip.is-active {
        border-color: rgba(247, 140, 47, 0.16);
        background: rgba(247, 140, 47, 0.12);
        color: #1f2734;
        box-shadow: none;
      }
      .flow-widget-thread {
        display: flex;
        flex-direction: column;
        gap: 0;
        min-height: 0;
        overflow-y: auto;
        padding: 2px 0 0;
      }
      .flow-chat-stack {
        display: grid;
        gap: 0;
      }
      .flow-chat-entry {
        position: relative;
        display: grid;
        gap: 0;
        margin-bottom: 16px;
        padding: 4px 2px;
        border-radius: 16px;
        transition: background .14s ease;
      }
      .flow-chat-entry:hover,
      .flow-chat-entry.selected {
        background: rgba(255,255,255,.5);
      }
      .flow-chat-entry.selected .flow-chat-bubble,
      .flow-chat-entry.selected .flow-chat-placeholder,
      .flow-chat-entry.selected .flow-chat-action-chip,
      .flow-chat-entry.selected .flow-chat-option-chip {
        box-shadow: 0 0 0 2px rgba(59,91,219,.12);
      }
      .flow-chat-entry:hover .flow-chat-hover-btn,
      .flow-chat-entry:hover .flow-chat-inline-actions,
      .flow-chat-entry.selected .flow-chat-inline-actions {
        opacity: 1;
        pointer-events: auto;
      }
      .flow-chat-inline-actions {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        opacity: 0;
        pointer-events: none;
        transition: opacity .14s ease;
      }
      .flow-chat-bubble-wrap {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        max-width: 100%;
        min-width: 0;
      }
      .flow-chat-hover-btn {
        border: 1px solid rgba(43, 54, 77, 0.08);
        background: rgba(255,255,255,.98);
        color: #556075;
        border-radius: 999px;
        min-height: 22px;
        padding: 0 7px;
        font-size: 9px;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(31, 46, 79, 0.05);
      }
      .flow-chat-menu-btn {
        width: 22px;
        min-width: 22px;
        padding: 0;
        font-size: 12px;
        line-height: 1;
      }
      .flow-chat-hover-btn:hover {
        background: rgba(247, 140, 47, 0.08);
        color: #31415d;
      }
      .flow-chat-block {
        display: grid;
        gap: 4px;
      }
      .flow-chat-node-label {
        display: none;
      }
      .flow-chat-node-label.bot {
        color: #5676cc;
      }
      .flow-chat-node-label.client {
        color: #6b7b96;
      }
      .flow-chat-node-label.action {
        color: #6b7b96;
      }
      .flow-chat-node {
        display: flex;
        width: 100%;
        gap: 7px;
        align-items: flex-start;
      }
      .flow-chat-node.bot,
      .flow-chat-node.action {
        justify-content: flex-start;
      }
      .flow-chat-node.client {
        justify-content: flex-start;
      }
      .flow-chat-node.client-reply {
        justify-content: flex-end;
        margin-top: 8px;
      }
      .flow-chat-node.action {
        margin-top: 1px;
      }
      .flow-chat-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        font-size: 9px;
        font-weight: 650;
        letter-spacing: 0.03em;
        color: #fff6ea;
        background: linear-gradient(135deg, #1d2738, #31415d);
        box-shadow: 0 4px 10px rgba(29, 39, 56, 0.08);
        margin-top: 3px;
        overflow: hidden;
      }
      .flow-chat-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 28%;
        transform: scale(1.05);
      }
      .flow-chat-node-column {
        display: grid;
        gap: 4px;
        width: auto;
        max-width: min(100%, 100%);
        min-width: 0;
      }
      .flow-chat-node.client-reply .flow-chat-node-column {
        justify-items: end;
        max-width: 68%;
      }
      .flow-chat-bubble {
        display: block;
        width: fit-content;
        max-width: 81%;
        min-width: 0;
        padding: 8px 10px;
        border-radius: 15px 15px 15px 9px;
        border: 1px solid rgba(34, 47, 76, 0.045);
        background: rgba(255,255,255,0.96);
        box-shadow: 0 4px 14px rgba(31, 46, 79, 0.04);
        font-size: 14px;
        line-height: 1.4;
        letter-spacing: -0.01em;
        color: #1f2734;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .flow-chat-bubble.is-editing {
        display: block;
        padding: 8px 10px;
        width: min(81%, 460px);
        max-width: min(81%, 460px);
        box-shadow: 0 0 0 2px rgba(247,140,47,.12), 0 4px 14px rgba(31,46,79,.04);
      }
      .flow-inline-editor {
        display: grid;
        gap: 8px;
      }
      .flow-inline-editor textarea {
        width: 100%;
        min-height: 82px;
        border: 0;
        outline: 0;
        resize: vertical;
        background: transparent;
        color: #1f2734;
        font: inherit;
        font-size: 14px;
        line-height: 1.4;
      }
      .flow-inline-editor-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .flow-inline-editor-actions button {
        min-height: 28px;
        padding: 0 11px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
      }
      .flow-chat-bubble.client {
        border-radius: 15px 15px 9px 15px;
        color: #17202d;
        border-color: transparent;
        box-shadow: 0 6px 16px rgba(247, 140, 47, 0.11);
      }
      .flow-chat-bubble.empty {
        color: var(--txt3);
        font-style: italic;
      }
      .flow-chat-subline {
        color: #697385;
        font-size: 10px;
        line-height: 1.35;
        margin: 3px 2px 0;
        opacity: .82;
      }
      .flow-chat-subline.align-right {
        text-align: right;
      }
      .flow-chat-option-list {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        align-items: center;
      }
      .flow-chat-option-chip,
      .flow-chat-action-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        min-height: 0;
        padding: 7px 11px;
        border-radius: 16px;
        border: 1px solid rgba(43, 54, 77, 0.08);
        background: rgba(255,255,255,0.96);
        color: #31415d;
        font-size: 12px;
        font-weight: 580;
        box-shadow: none;
      }
      .flow-chat-action-chip {
        width: auto;
      }
      .flow-chat-placeholder {
        display: grid;
        gap: 3px;
        min-height: 0;
        padding: 8px 11px;
        border-radius: 14px;
        background: rgba(247, 249, 252, 0.92);
        border: 1px dashed rgba(132, 145, 166, 0.22);
        color: #617086;
        font-size: 12px;
        font-weight: 500;
        box-shadow: none;
      }
      .flow-chat-placeholder strong {
        font-size: 9px;
        line-height: 1.2;
        text-transform: uppercase;
        letter-spacing: .08em;
        color: #8a96a8;
      }
      .flow-chat-placeholder-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .flow-chat-placeholder-head button {
        border: 1px solid rgba(43, 54, 77, 0.08);
        background: rgba(255,255,255,0.92);
        color: #556075;
        border-radius: 999px;
        min-height: 22px;
        padding: 0 8px;
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
      }
      .flow-chat-placeholder-head button:disabled {
        opacity: 0.62;
        cursor: default;
      }
      .flow-chat-placeholder span {
        display: block;
        line-height: 1.4;
      }
      .flow-chat-placeholder textarea {
        width: 100%;
        min-height: 56px;
        border: 0;
        outline: 0;
        resize: vertical;
        background: transparent;
        color: inherit;
        font: inherit;
        line-height: 1.4;
        padding: 0;
      }
      .flow-composer-shell {
        position: relative;
        display: grid;
        gap: 0;
        padding: 10px 12px 12px;
        border-top: 1px solid rgba(43, 54, 77, 0.06);
        background: rgba(255, 252, 249, 0.96);
      }
      .flow-composer-row {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) 42px;
        gap: 7px;
        align-items: center;
      }
      .flow-composer-attach,
      .flow-composer-send {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
      }
      .flow-composer-attach {
        border: 1px solid rgba(43, 54, 77, 0.08);
        background: rgba(255,255,255,0.96);
        color: #556075;
        box-shadow: 0 4px 12px rgba(31, 46, 79, 0.05);
      }
      .flow-composer-surface {
        min-width: 0;
        width: 100%;
        min-height: 40px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(43, 54, 77, 0.1);
        border-radius: 16px;
        padding: 0 2px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
        display: flex;
        align-items: center;
      }
      .flow-composer-input {
        display: block;
        width: 100%;
        min-height: 36px;
        border: 0;
        outline: 0;
        background: transparent;
        padding: 9px 11px 8px;
        color: #1f2734;
        font: inherit;
        font-size: 14px;
        line-height: 1.34;
        letter-spacing: -0.01em;
      }
      .flow-composer-send {
        border: 0;
        background: #f78c2f;
        color: #17202d;
        box-shadow: 0 6px 16px rgba(247, 140, 47, 0.16);
      }
      .flow-step-menu {
        position: fixed;
        top: 0;
        left: 0;
        display: grid;
        gap: 4px;
        justify-items: start;
        min-width: 176px;
        padding: 6px;
        border: 1px solid rgba(43, 54, 77, 0.07);
        border-radius: 12px;
        background: rgba(255,255,255,.99);
        box-shadow: 0 8px 18px rgba(31, 46, 79, 0.08);
        z-index: 30;
      }
      .flow-step-menu.is-hidden-measure {
        visibility: hidden;
        pointer-events: none;
      }
      .flow-step-menu button {
        width: 100%;
        text-align: left;
        border: 0;
        background: transparent;
        color: var(--txt2);
        border-radius: 9px;
        padding: 7px 9px;
        font-size: 10px;
        font-weight: 600;
        line-height: 1.25;
        box-shadow: none;
      }
      .flow-step-menu button:hover {
        background: rgba(59,91,219,.08);
        color: var(--blue);
      }
      .flow-step-menu button.danger {
        color: var(--red);
      }
      .flow-step-menu button.danger:hover {
        background: rgba(224,49,49,.08);
        color: var(--red);
      }
      .flow-inline-menu {
        position: absolute;
        left: 12px;
        bottom: 58px;
        display: grid;
        gap: 4px;
        min-width: 188px;
        padding: 6px;
        border: 1px solid rgba(43, 54, 77, 0.07);
        border-radius: 12px;
        background: rgba(255,255,255,.99);
        box-shadow: 0 8px 18px rgba(31, 46, 79, 0.08);
        z-index: 4;
      }
      .flow-inline-menu[hidden] {
        display: none !important;
      }
      .flow-inline-menu button {
        width: 100%;
        text-align: left;
        border: 0;
        background: transparent;
        color: #31415d;
        border-radius: 9px;
        min-height: 0;
        padding: 7px 9px;
        font-size: 10px;
        font-weight: 600;
        line-height: 1.25;
      }
      .flow-inline-menu button:hover {
        background: rgba(59,91,219,.08);
        color: var(--blue);
      }
      .flow-assist-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid rgba(59,91,219,.18);
        border-radius: 12px;
        background: rgba(59,91,219,.06);
        color: var(--blue);
        font-size: 12px;
        font-weight: 600;
      }
      .flow-ai-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15,23,42,.26);
        backdrop-filter: blur(3px);
        z-index: 7;
      }
      .flow-ai-modal {
        position: absolute;
        top: 26px;
        left: 50%;
        transform: translateX(-50%);
        width: min(1120px, calc(100% - 52px));
        max-height: calc(100% - 52px);
        border: 1px solid var(--bdr);
        border-radius: 24px;
        background: #fff;
        box-shadow: 0 28px 70px rgba(15,23,42,.22);
        z-index: 8;
        display: grid;
        grid-template-rows: auto 1fr auto;
        overflow: hidden;
      }
      .flow-ai-modal[hidden],
      .flow-ai-modal-backdrop[hidden] {
        display: none !important;
      }
      .flow-ai-modal-head,
      .flow-ai-modal-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 18px 22px;
        border-bottom: 1px solid var(--bdr);
        background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
      }
      .flow-ai-modal-foot {
        border-bottom: 0;
        border-top: 1px solid var(--bdr);
      }
      .flow-ai-modal-copy {
        display: grid;
        gap: 4px;
      }
      .flow-ai-modal-copy strong {
        font-size: 18px;
      }
      .flow-ai-modal-copy small {
        color: var(--txt3);
        font-size: 12px;
        line-height: 1.45;
      }
      .flow-ai-modal-body {
        overflow-y: auto;
        padding: 22px;
        display: grid;
        grid-template-columns: minmax(320px, 360px) minmax(0, 1fr);
        gap: 18px;
      }
      .flow-ai-panel,
      .flow-ai-preview-panel {
        display: grid;
        gap: 14px;
        align-content: start;
      }
      .flow-ai-card {
        display: grid;
        gap: 12px;
        border: 1px solid var(--bdr);
        border-radius: 18px;
        background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
        padding: 16px;
      }
      .flow-ai-card h4 {
        margin: 0;
        font-size: 14px;
      }
      .flow-ai-card p,
      .flow-ai-card small {
        margin: 0;
        color: var(--txt3);
        font-size: 12px;
        line-height: 1.5;
      }
      .flow-ai-templates {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .flow-ai-template-btn {
        border: 1px solid var(--bdr);
        background: #fff;
        color: var(--txt2);
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 600;
      }
      .flow-ai-template-btn.active {
        border-color: var(--blue-b);
        background: var(--blue-l);
        color: var(--blue);
      }
      .flow-ai-prompt {
        min-height: 180px;
        resize: vertical;
      }
      .flow-ai-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .flow-ai-preview-empty,
      .flow-ai-preview-loading,
      .flow-ai-preview-error {
        display: grid;
        place-items: center;
        min-height: 360px;
        border: 1px dashed var(--bdr-strong);
        border-radius: 18px;
        background: rgba(248,249,253,.72);
        color: var(--txt3);
        font-size: 13px;
        text-align: center;
        padding: 24px;
      }
      .flow-ai-preview-error {
        color: var(--red);
        border-color: rgba(224,49,49,.24);
        background: rgba(224,49,49,.04);
      }
      .flow-ai-draft-layout {
        display: grid;
        gap: 16px;
      }
      .flow-ai-summary {
        display: grid;
        gap: 10px;
      }
      .flow-ai-summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .flow-ai-summary-item {
        display: grid;
        gap: 6px;
        padding: 12px 14px;
        border: 1px solid var(--bdr);
        border-radius: 14px;
        background: #fff;
      }
      .flow-ai-summary-item strong {
        font-size: 13px;
      }
      .flow-ai-summary-item span,
      .flow-ai-summary-item small {
        color: var(--txt3);
        font-size: 12px;
        line-height: 1.45;
      }
      .flow-ai-summary-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .flow-ai-summary-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid var(--bdr);
        background: #fff;
        color: var(--txt2);
        font-size: 11px;
        font-weight: 600;
      }
      .flow-ai-summary-pill.branch {
        border-color: rgba(139,92,246,.18);
        background: rgba(139,92,246,.06);
        color: #7c3aed;
      }
      .flow-ai-preview-panel .flow-overview-actions,
      .flow-ai-preview-panel .flow-step-actions,
      .flow-ai-preview-panel .flow-insert-step {
        display: none !important;
      }
      .flow-ai-preview-tabs {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px;
        border: 1px solid var(--bdr);
        border-radius: 999px;
        background: var(--card-soft);
      }
      .flow-ai-preview-tab {
        border: 0;
        background: transparent;
        color: var(--txt2);
        border-radius: 999px;
        padding: 7px 12px;
        font-size: 12px;
        font-weight: 700;
      }
      .flow-ai-preview-tab.active {
        background: var(--blue-l);
        color: var(--blue);
      }
      .flow-ai-preview-mode[hidden] {
        display: none !important;
      }
      .flow-ai-chat-shell {
        display: grid;
        gap: 14px;
        min-height: 420px;
        border: 1px solid var(--bdr);
        border-radius: 20px;
        background: linear-gradient(180deg, #ffffff 0%, #f8f9fd 100%);
        padding: 18px;
      }
      .flow-ai-chat-thread {
        display: grid;
        gap: 12px;
        align-content: start;
      }
      .flow-ai-chat-message {
        display: flex;
      }
      .flow-ai-chat-message.bot {
        justify-content: flex-start;
      }
      .flow-ai-chat-message.user {
        justify-content: flex-end;
      }
      .flow-ai-chat-bubble {
        max-width: min(76%, 620px);
        border-radius: 18px;
        padding: 12px 14px;
        border: 1px solid var(--bdr);
        background: #fff;
        font-size: 13px;
        line-height: 1.55;
        color: var(--txt1);
        white-space: pre-wrap;
        box-shadow: var(--shadow-sm);
      }
      .flow-ai-chat-message.user .flow-ai-chat-bubble {
        background: var(--blue);
        border-color: rgba(59,91,219,.28);
        color: #fff;
      }
      .flow-ai-chat-controls {
        margin-top: auto;
        display: grid;
        gap: 10px;
        padding-top: 10px;
        border-top: 1px solid var(--bdr);
      }
      .flow-ai-chat-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .flow-ai-chat-option,
      .flow-ai-chat-submit {
        border: 1px solid var(--blue-b);
        background: var(--blue-l);
        color: var(--blue);
        border-radius: 999px;
        padding: 9px 14px;
        font-size: 12px;
        font-weight: 600;
      }
      .flow-ai-chat-submit {
        border-radius: 12px;
      }
      .flow-ai-chat-input-row {
        display: flex;
        gap: 10px;
      }
      .flow-ai-chat-input-row input {
        min-height: 42px;
      }
      .flow-ai-model-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 28px;
        padding: 0 10px;
        border: 1px solid var(--bdr);
        border-radius: 999px;
        background: rgba(255,255,255,.9);
        color: var(--txt2);
        font-size: 11px;
        font-weight: 600;
      }
      .flow-ai-muted {
        color: var(--txt3);
        font-size: 12px;
      }
      @media (max-width: 980px) {
        .settings-shell {
          grid-template-columns: 1fr;
        }
        .settings-categories {
          grid-column: 1;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          border-right: 0;
          border-bottom: 1px solid var(--bdr);
        }
        .settings-flows-column {
          grid-column: 1;
          display: none;
          border-right: 0;
          border-bottom: 1px solid var(--bdr);
        }
        .settings-shell.is-flows-active .settings-flows-column {
          display: flex;
        }
        .settings-preview-panel {
          grid-column: 1;
          width: 100%;
          min-width: 0;
          border-left: 0;
          border-top: 1px solid var(--bdr);
        }
        .settings-panels {
          grid-column: 1;
        }
        .grid {
          grid-template-columns: 1fr;
        }
        .flows-workspace {
          display: block;
        }
        .quick-action-row {
          grid-template-columns: 1fr;
        }
        .section-actions,
        .actions {
          align-items: flex-start;
        }
        .flow-step-grid,
        .flow-settings-grid,
        .hours-row,
        .flow-option-fields,
        .operator-row,
        .flow-step-drawer-grid,
        .flow-drawer-option-row,
        .flow-drawer-option-grid,
        .flow-test-input-row {
          grid-template-columns: 1fr;
        }
        .flow-step-drawer {
          top: 12px;
          right: 12px;
          left: 12px;
          width: auto;
          max-height: calc(100% - 24px);
        }
        .flow-ai-modal {
          top: 12px;
          left: 12px;
          right: 12px;
          transform: none;
          width: auto;
          max-height: calc(100% - 24px);
        }
        .flow-ai-modal-body,
        .flow-ai-grid,
        .flow-ai-summary-grid,
        .flow-ai-chat-input-row {
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
      <main class="panel content">
        <div class="content-head">
          <h2 id="siteTitle">Chat Settings</h2>
          <p>Редагуйте публічні налаштування віджета без зміни коду.</p>
        </div>
        <form id="settingsForm" class="form">
          <div class="settings-shell">
            <aside class="settings-categories" id="settingsCategoryNav">
              <button type="button" class="settings-category-btn active" data-settings-nav="general" aria-selected="true"><strong>General</strong><small>Назва, avatar, welcome-текст</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="install" aria-selected="false"><strong>Install</strong><small>Snippet, domains, install help</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="theme" aria-selected="false"><strong>Appearance</strong><small>Кольори й вигляд віджета</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="actions" aria-selected="false"><strong>Quick Actions</strong><small>Operator quick replies</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="flows" aria-selected="false"><strong>Chat Flows</strong><small>Сценарії та choice-кроки</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="ai" aria-selected="false"><strong>AI Assistant</strong><small>Provider, model, knowledge base</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="crm" aria-selected="false"><strong>CRM / Contacts</strong><small>Lead статуси й CRM блок</small></button>
              <button type="button" class="settings-category-btn" data-settings-nav="integrations" aria-selected="false"><strong>Integrations</strong><small>Server-side інтеграції та провайдери</small></button>
            </aside>
            <aside class="settings-flows-column" id="settingsFlowsColumn">
              <div class="settings-flows-column-head">
                <strong>Flows</strong>
                <small>Оберіть сценарій для редагування та preview.</small>
              </div>
              <div class="settings-flows-column-body">
                <div class="field flow-search-field">
                  <label for="flowSearchInput">Search flows</label>
                  <input id="flowSearchInput" type="search" placeholder="Search by title or slug" />
                </div>
                <div id="flowList" class="flow-list"></div>
                <button id="addFlowBtn" type="button" class="secondary flow-list-add">+ Add flow</button>
              </div>
            </aside>
            <div class="settings-panels">
            <div class="settings-main-scroll">
          <section class="settings-section is-open" data-section="general" aria-hidden="false">
            <div class="settings-section-head">
              <span class="section-copy">
                <strong>General</strong>
                <small>Назва сайту, welcome-текст і базова інформація віджета.</small>
              </span>
            </div>
            <div class="settings-section-body general-section-body">
              <div class="general-content">
              <div class="settings-card general-card">
                <div class="settings-card-head">
                  <strong>Widget identity</strong>
                  <small>Базові назви, статуси та аватари для віджета й оператора.</small>
                </div>
                <div class="grid identity-grid">
                  <div class="field">
                    <label for="titleInput">Bot title</label>
                    <input id="titleInput" type="text" />
                  </div>
                  <div class="field">
                    <label for="welcomeIntroLabelInput">Welcome intro label</label>
                    <input id="welcomeIntroLabelInput" type="text" />
                  </div>
                  <div class="field">
                    <label for="managerNameInput">Manager name</label>
                    <input id="managerNameInput" type="text" placeholder="Марія" />
                  </div>
                  <div class="field">
                    <label for="managerTitleInput">Manager title</label>
                    <input id="managerTitleInput" type="text" placeholder="Менеджер PrintForge" />
                  </div>
                </div>
                <div class="identity-links">
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
              <div class="settings-card general-card">
                <div class="settings-card-head">
                  <strong>Operator fallback</strong>
                  <small>Якщо клієнт написав, а оператор не відповів, чат надішле це повідомлення через заданий час.</small>
                </div>
                <div class="grid compact-grid">
                  <div class="field">
                    <label for="operatorFallbackEnabledInput">Send message when operator does not reply</label>
                    <select id="operatorFallbackEnabledInput">
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="operatorFallbackDelayInput">Delay before fallback</label>
                    <select id="operatorFallbackDelayInput">
                      <option value="15">15 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="60">60 seconds</option>
                      <option value="120">120 seconds</option>
                      <option value="300">300 seconds</option>
                    </select>
                  </div>
                  <div class="field full">
                    <label for="operatorFallbackMessageInput">Fallback message</label>
                    <textarea id="operatorFallbackMessageInput" placeholder="Оператори зараз зайняті, але ми на зв’язку. Залишайтесь у чаті, і ми відповімо вам якнайшвидше."></textarea>
                  </div>
                </div>
              </div>
              <div class="settings-card general-card">
                <div class="settings-card-head">
                  <strong>Availability</strong>
                  <small>Керує online/offline станом у preview та майбутній логіці віджета.</small>
                </div>
                <div class="stack-fields">
                  <div class="field availability-mode-field">
                    <label for="availabilityModeInput">Status mode</label>
                    <select id="availabilityModeInput">
                      <option value="always_online">Always online</option>
                      <option value="schedule">Use working hours</option>
                      <option value="manual">Manual status</option>
                    </select>
                    <div class="field-help">Choose how chat availability is determined</div>
                  </div>
                  <div id="availabilityDynamicFields"></div>
                </div>
              </div>
              <div class="settings-card general-card">
                <div class="settings-card-head">
                  <strong>Language</strong>
                  <small>Базова мова widget UI та chat поведінки.</small>
                </div>
                <div class="grid compact-grid">
                  <div class="field">
                    <label for="languageDefaultInput">Default language</label>
                    <select id="languageDefaultInput">
                      <option value="uk">Ukrainian</option>
                      <option value="en">English</option>
                      <option value="auto">Auto detect</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="settings-card general-card">
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
              <div class="settings-card general-card">
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
            </div>
          </section>

          <section class="settings-section" data-section="install" hidden aria-hidden="true">
            <div class="settings-section-head">
              <span class="section-copy">
                <strong>Install Chat</strong>
                <small>Copy the live snippet for the selected site and hand it off to your website team.</small>
              </span>
            </div>
            <div class="settings-section-body" hidden>
              <div class="install-shell">
                <div class="install-card">
                  <div class="install-card-head">
                    <strong>Install chat on your website</strong>
                    <small>Copy the code below and paste it before the closing &lt;/body&gt; tag on every page where you want the chat widget to appear.</small>
                  </div>
                  <div class="install-card-body">
                    <div class="install-context-grid" id="installContextGrid"></div>
                    <div class="install-widget-key-row">
                      <code id="installWidgetKeyMasked">Hidden</code>
                      <button type="button" class="secondary" id="toggleWidgetKeyBtn">Reveal key</button>
                      <button type="button" class="secondary" id="copyWidgetKeyBtn">Copy key</button>
                    </div>
                    <div class="install-code-block">
                      <div class="install-code-head">
                        <span>
                          <strong>Install snippet</strong>
                          <small id="installScriptUrl">widget.js</small>
                        </span>
                        <button type="button" class="primary" id="copyInstallSnippetBtn">Copy code</button>
                      </div>
                      <pre class="install-code"><code id="installSnippetCode"></code></pre>
                    </div>
                    <div class="install-actions">
                      <button type="button" class="secondary" id="copyInstallInstructionsBtn">Copy install instructions</button>
                      <button type="button" class="secondary" id="openWidgetSettingsBtn">Open widget settings</button>
                      <button type="button" class="secondary" id="manageDomainsBtn">Manage domains</button>
                      <button type="button" class="secondary" id="copyDeveloperHandoffBtn">Copy developer handoff</button>
                    </div>
                    <div id="installStatusLine" class="status-line">Install data will appear for the active site.</div>
                  </div>
                </div>

                <div class="site-manager-card" id="installSiteManagerCard">
                  <div class="site-toolbar">
                    <div class="site-toolbar-copy">
                      <strong>Sites and domains</strong>
                      <small>Choose the active site, update its primary domain, and manage allowed domains for install readiness.</small>
                    </div>
                    <div id="activeSiteBadge" class="site-active-badge">Active site: none</div>
                  </div>
                  <div class="site-create-grid">
                    <div class="field">
                      <label for="newSiteNameInput">New site name</label>
                      <input id="newSiteNameInput" type="text" placeholder="Main storefront" />
                    </div>
                    <div class="field">
                      <label for="newSiteDomainInput">Primary domain</label>
                      <input id="newSiteDomainInput" type="text" placeholder="example.com" />
                    </div>
                    <button id="createSiteBtn" type="button" class="primary">Create site</button>
                  </div>
                  <div id="sitesManagerStatus" class="status-line">Create, select, and manage domains for the active site here.</div>
                  <div id="sitesManagerList" class="site-list"></div>
                </div>

                <div class="install-card">
                  <div class="install-card-head">
                    <strong>Install guidance</strong>
                    <small>Keep the setup practical and lightweight for whoever owns the website code.</small>
                  </div>
                  <div class="install-card-body">
                    <ol class="install-guidance-list">
                      <li>Paste the snippet before the closing &lt;/body&gt; tag.</li>
                      <li>Add it to every page where the chat should appear.</li>
                      <li>If you use a CMS, place it in the global footer or custom code area.</li>
                    </ol>
                    <div class="install-help-stack">
                      <details class="install-help-item">
                        <summary>Custom HTML website</summary>
                        <div class="install-help-copy">Open your main layout or footer template and paste the snippet right before &lt;/body&gt;. Publish the site and refresh the page to see the launcher.</div>
                      </details>
                      <details class="install-help-item">
                        <summary>WordPress</summary>
                        <div class="install-help-copy">Add the snippet in your theme footer, a global code injection plugin, or the site-wide custom code area. Make sure it loads on all public pages where chat should appear.</div>
                      </details>
                      <details class="install-help-item">
                        <summary>Shopify</summary>
                        <div class="install-help-copy">Open the theme editor, go to theme code, and paste the snippet in <code>theme.liquid</code> before &lt;/body&gt;. Save and preview the storefront.</div>
                      </details>
                      <details class="install-help-item">
                        <summary>WooCommerce</summary>
                        <div class="install-help-copy">Paste the snippet in the WordPress footer area used by your WooCommerce theme, or use a site-wide header/footer code plugin so it appears across the storefront.</div>
                      </details>
                      <details class="install-help-item">
                        <summary>Google Tag Manager</summary>
                        <div class="install-help-copy">Create a Custom HTML tag with the snippet, trigger it on all pages where chat should appear, then publish the container. This is useful when you cannot edit site templates directly.</div>
                      </details>
                    </div>
                  </div>
                </div>

                <div class="install-card">
                  <div class="install-card-head">
                    <strong>Domains and status</strong>
                    <small>Review the current domain setup and the install state that Day 5 verification will build on.</small>
                  </div>
                  <div class="install-card-body">
                    <div class="install-domain-summary" id="installDomainsSummary"></div>
                    <div class="install-status-grid" id="installStatusGrid"></div>
                  </div>
                </div>
              </div>
              <div class="section-actions">
                <div id="installSectionStatus" class="status-line">Use this section to generate and copy the live install code for the selected site.</div>
              </div>
            </div>
          </section>

          <section class="settings-section" data-section="theme" hidden aria-hidden="true">
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

          <section class="settings-section" data-section="actions" hidden aria-hidden="true">
            <div class="settings-section-head">
              <span class="section-copy">
                <strong>Quick Actions</strong>
                <small>Швидкі відповіді для операторів в inbox без зміни чат-флоу.</small>
              </span>
            </div>
            <div class="settings-section-body" hidden>
              <div class="subsection actions-quick-replies">
                <div id="operatorQuickRepliesList" class="quick-actions"></div>
                <div class="section-actions compact">
                  <button id="addOperatorQuickReplyBtn" type="button" class="secondary">Додати відповідь</button>
                </div>
              </div>
              <div class="section-actions">
                <button type="button" class="primary" data-save-section="actions">Save Actions</button>
                <div id="actionsStatus" class="status-line">Ці quick replies використовуються лише операторами в inbox.</div>
              </div>
            </div>
          </section>

          <section class="settings-section" data-section="flows" hidden aria-hidden="true">
            <div class="settings-section-body" hidden>
              <div class="flows-workspace">
                <div class="flows-editor-panel">
                  <div class="flows-editor-toolbar flows-editor-toolbar--builder">
                    <div class="flows-editor-copy">
                      <strong id="selectedFlowTitle">Flow conversation</strong>
                      <button id="flowTitleMenuBtn" type="button" class="flow-title-menu-btn" aria-label="Flow menu">…</button>
                    </div>
                  </div>
                  <div id="flowHeaderMenu" class="flow-header-menu" hidden></div>
                  <div id="flowsEditorEmpty" class="flows-editor-empty">Оберіть flow зі списку, щоб редагувати кроки.</div>
                  <div class="flows-mode-view">
                    <div class="flow-chat-editor">
                      <div id="flowScenariosList" class="flow-scenarios flow-chat-thread"></div>
                    </div>
                  </div>
                </div>
                <div id="flowAiModalBackdrop" class="flow-ai-modal-backdrop" hidden></div>
                <section id="flowAiModal" class="flow-ai-modal" hidden></section>
              </div>
              <div class="section-actions">
                <button type="button" class="primary" data-save-section="flows">Save Flows</button>
                <div id="flowsStatus" class="status-line">Кнопки у віджеті генеруються тільки з flows, де увімкнено Show in widget.</div>
              </div>
            </div>
          </section>

          <section class="settings-section" data-section="ai" hidden aria-hidden="true">
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

          <section class="settings-section" data-section="crm" hidden aria-hidden="true">
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

          <section class="settings-section" data-section="integrations" hidden aria-hidden="true">
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
                    <div id="previewMessages" class="preview-messages"></div>
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
          installPayload: null,
          installSnippetCopied: false,
          installInstructionsCopied: false,
          installWidgetKeyVisible: false,
          selectedFlowIndex: 0,
          selectedFlowStepIndex: 0,
          flowsDraft: [],
          flowWorkspaceMode: 'structure',
          flowSearchQuery: '',
          flowDrawer: { open: false, mode: 'step', flowIndex: 0, stepIndex: 0 },
          flowMenu: { open: false, mode: null, stepIndex: null },
          flowHeaderMenuOpen: false,
          flowListMenu: { open: false, index: null },
          flowListEditor: { index: null },
          flowInlineEditor: { stepIndex: null, draft: '', busy: false },
          flowClientHintEditor: { stepIndex: null, draft: '' },
          flowClientHintBusyStep: null,
          flowComposer: { text: '', insertAfter: null },
          flowChoiceAdvanced: false,
          flowTestSession: null,
          flowAi: {
            open: false,
            prompt: '',
            template: '',
            language: 'uk',
            tone: 'Friendly and professional',
            goal: '',
            generating: false,
            error: '',
            model: '',
            draft: null,
            previewMode: 'structure',
            testSession: null
          },
          previewMode: 'widget',
          currentSettings: null,
          availabilityDraft: { manualStatus: 'online' },
          workingHoursDraft: null,
          integrationSettings: null,
          pendingIntegrationClear: []
        };

        const siteTitleEl = document.getElementById('siteTitle');
        const installContextGridEl = document.getElementById('installContextGrid');
        const installDomainsSummaryEl = document.getElementById('installDomainsSummary');
        const installStatusGridEl = document.getElementById('installStatusGrid');
        const installStatusLineEl = document.getElementById('installStatusLine');
        const installSectionStatusEl = document.getElementById('installSectionStatus');
        const installSiteManagerCardEl = document.getElementById('installSiteManagerCard');
        const installSnippetCodeEl = document.getElementById('installSnippetCode');
        const installScriptUrlEl = document.getElementById('installScriptUrl');
        const installWidgetKeyMaskedEl = document.getElementById('installWidgetKeyMasked');
        const copyInstallSnippetBtn = document.getElementById('copyInstallSnippetBtn');
        const copyInstallInstructionsBtn = document.getElementById('copyInstallInstructionsBtn');
        const copyDeveloperHandoffBtn = document.getElementById('copyDeveloperHandoffBtn');
        const copyWidgetKeyBtn = document.getElementById('copyWidgetKeyBtn');
        const toggleWidgetKeyBtn = document.getElementById('toggleWidgetKeyBtn');
        const openWidgetSettingsBtn = document.getElementById('openWidgetSettingsBtn');
        const manageDomainsBtn = document.getElementById('manageDomainsBtn');
        const activeSiteBadgeEl = document.getElementById('activeSiteBadge');
        const sitesManagerStatusEl = document.getElementById('sitesManagerStatus');
        const sitesManagerListEl = document.getElementById('sitesManagerList');
        const createSiteBtn = document.getElementById('createSiteBtn');
        const newSiteNameInput = document.getElementById('newSiteNameInput');
        const newSiteDomainInput = document.getElementById('newSiteDomainInput');
        const settingsForm = document.getElementById('settingsForm');
        const saveStatusEl = document.getElementById('saveStatus');
        const aiConfigStatusEl = document.getElementById('aiConfigStatus');
        const settingsShellEl = document.querySelector('.settings-shell');
        const settingsMainScrollEl = document.querySelector('.settings-main-scroll');
        const sectionEls = settingsMainScrollEl
          ? Array.from(settingsMainScrollEl.querySelectorAll(':scope > .settings-section'))
          : [];
        const settingsCategoryNav = document.getElementById('settingsCategoryNav');
        const sectionStatusEls = {
          general: document.getElementById('generalStatus'),
          install: document.getElementById('installSectionStatus'),
          theme: document.getElementById('themeStatus'),
          actions: document.getElementById('actionsStatus'),
          flows: document.getElementById('flowsStatus'),
          ai: document.getElementById('aiStatus'),
          integrations: document.getElementById('integrationsStatus')
        };
        const flowListEl = document.getElementById('flowList');
        const flowSearchInput = document.getElementById('flowSearchInput');
        const flowScenariosListEl = document.getElementById('flowScenariosList');
        const addFlowBtn = document.getElementById('addFlowBtn');
        const flowsEditorEmptyEl = document.getElementById('flowsEditorEmpty');
        const selectedFlowTitleEl = document.getElementById('selectedFlowTitle');
        const selectedFlowMetaEl = document.getElementById('selectedFlowMeta');
        const flowTitleMenuBtn = document.getElementById('flowTitleMenuBtn');
        const flowHeaderMenuEl = document.getElementById('flowHeaderMenu');
        const flowsStructureViewEl = document.getElementById('flowsStructureView');
        const flowsPreviewViewEl = document.getElementById('flowsPreviewView');
        const toggleFlowTestBtn = document.getElementById('toggleFlowTestBtn');
        const editFlowSettingsBtn = null;
        const resetFlowTestBtn = document.getElementById('resetFlowTestBtn');
        const flowTestStartBtn = document.getElementById('flowTestStartBtn');
        const flowTestCanvasEl = document.getElementById('flowTestCanvas');
        const flowTestTitleEl = document.getElementById('flowTestTitle');
        const flowTestMetaEl = document.getElementById('flowTestMeta');
        const flowStepDrawerEl = null;
        const flowStepDrawerBackdropEl = null;
        const generateFlowAiBtn = document.getElementById('generateFlowAiBtn');
        const flowAiModalEl = document.getElementById('flowAiModal');
        const flowAiModalBackdropEl = document.getElementById('flowAiModalBackdrop');
        function getFlowComposerInputEl() { return document.getElementById('flowComposerInput'); }
        function getFlowComposerSendBtn() { return document.getElementById('flowComposerSendBtn'); }
        function getFlowComposerAttachBtn() { return document.getElementById('flowComposerAttachBtn'); }
        function getFlowComposerActionMenuEl() { return document.getElementById('flowComposerActionMenu'); }
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
          messages: document.getElementById('previewMessages'),
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
          operatorFallbackEnabled: document.getElementById('operatorFallbackEnabledInput'),
          operatorFallbackDelay: document.getElementById('operatorFallbackDelayInput'),
          operatorFallbackMessage: document.getElementById('operatorFallbackMessageInput'),
          availabilityMode: document.getElementById('availabilityModeInput'),
          manualStatus: null,
          workingHoursEnabled: null,
          workingHoursTimezone: null,
          widgetPosition: document.getElementById('widgetPositionInput'),
          widgetSize: document.getElementById('widgetSizeInput'),
          languageDefault: document.getElementById('languageDefaultInput'),
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

        function nl2br(value) {
          return escapeHtml(value).replace(/\\n/g, '<br />');
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

        function getDefaultWorkingHoursDraft() {
          return {
            enabled: true,
            timezone: 'America/New_York',
            days: {
              mon: { enabled: true, start: '09:00', end: '18:00' },
              tue: { enabled: true, start: '09:00', end: '18:00' },
              wed: { enabled: true, start: '09:00', end: '18:00' },
              thu: { enabled: true, start: '09:00', end: '18:00' },
              fri: { enabled: true, start: '09:00', end: '18:00' },
              sat: { enabled: false, start: '09:00', end: '18:00' },
              sun: { enabled: false, start: '09:00', end: '18:00' }
            }
          };
        }

        function captureAvailabilityDraft() {
          if (fields.manualStatus) {
            state.availabilityDraft.manualStatus = fields.manualStatus.value || 'online';
          }
          const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
          const hasRenderedWorkingHours = dayKeys.some(function (day) {
            return Boolean(getWorkingHoursDayField(day, 'enabled'));
          });
          if (fields.workingHoursTimezone || hasRenderedWorkingHours) {
            const currentDraft = state.workingHoursDraft || getDefaultWorkingHoursDraft();
            state.workingHoursDraft = {
              enabled: true,
              timezone: (fields.workingHoursTimezone && fields.workingHoursTimezone.value) || currentDraft.timezone || 'America/New_York',
              days: dayKeys.reduce(function (acc, day) {
                const enabledField = getWorkingHoursDayField(day, 'enabled');
                const startField = getWorkingHoursDayField(day, 'start');
                const endField = getWorkingHoursDayField(day, 'end');
                const fallback = currentDraft.days && currentDraft.days[day] ? currentDraft.days[day] : { enabled: !['sat', 'sun'].includes(day), start: '09:00', end: '18:00' };
                acc[day] = {
                  enabled: enabledField ? Boolean(enabledField.checked) : Boolean(fallback.enabled),
                  start: startField && startField.value ? startField.value : (fallback.start || '09:00'),
                  end: endField && endField.value ? endField.value : (fallback.end || '18:00')
                };
                return acc;
              }, {})
            };
          }
        }

        function renderAvailabilityDetails() {
          const container = document.getElementById('availabilityDynamicFields');
          if (!container || !fields.availabilityMode) return;
          captureAvailabilityDraft();
          const mode = fields.availabilityMode.value || 'always_online';
          if (mode === 'manual') {
            container.innerHTML = '<div class="field" id="manualStatusField">' +
              '<label for="manualStatusInput">Manual status</label>' +
              '<select id="manualStatusInput">' +
                '<option value="online">Online</option>' +
                '<option value="offline">Offline</option>' +
              '</select>' +
            '</div>';
          } else if (mode === 'schedule') {
            container.innerHTML = '<div id="workingHoursSection" class="nested-block">' +
              '<div class="nested-block-head">' +
                '<strong>Working hours</strong>' +
                '<small>Зберігає розклад роботи для майбутньої schedule-логіки.</small>' +
              '</div>' +
              '<div class="grid">' +
                '<div class="field">' +
                  '<label for="workingHoursTimezoneInput">Timezone</label>' +
                  '<select id="workingHoursTimezoneInput">' +
                    '<option value="America/New_York">America/New_York</option>' +
                    '<option value="America/Chicago">America/Chicago</option>' +
                    '<option value="America/Denver">America/Denver</option>' +
                    '<option value="America/Los_Angeles">America/Los_Angeles</option>' +
                    '<option value="Europe/Kyiv">Europe/Kyiv</option>' +
                    '<option value="Europe/Warsaw">Europe/Warsaw</option>' +
                    '<option value="Europe/London">Europe/London</option>' +
                    '<option value="Europe/Berlin">Europe/Berlin</option>' +
                    '<option value="UTC">UTC</option>' +
                  '</select>' +
                '</div>' +
                '<div class="field full">' +
                  '<label>Weekly schedule</label>' +
                  '<div class="hours-grid">' +
                    [
                      ['mon', 'Monday'],
                      ['tue', 'Tuesday'],
                      ['wed', 'Wednesday'],
                      ['thu', 'Thursday'],
                      ['fri', 'Friday'],
                      ['sat', 'Saturday'],
                      ['sun', 'Sunday']
                    ].map(function (day) {
                      return '<div class="hours-row">' +
                        '<strong>' + day[1] + '</strong>' +
                        '<label class="inline-toggle"><input type="checkbox" id="workingHours_' + day[0] + '_enabled" /> <span>Enabled</span></label>' +
                        '<input id="workingHours_' + day[0] + '_start" type="time" />' +
                        '<input id="workingHours_' + day[0] + '_end" type="time" />' +
                      '</div>';
                    }).join('') +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>';
          } else {
            container.innerHTML = '';
          }

          fields.manualStatus = document.getElementById('manualStatusInput');
          fields.workingHoursEnabled = null;
          fields.workingHoursTimezone = document.getElementById('workingHoursTimezoneInput');

          if (fields.manualStatus) {
            fields.manualStatus.value = state.availabilityDraft.manualStatus || 'online';
          }
          if (fields.workingHoursTimezone) {
            const workingHours = state.workingHoursDraft || getDefaultWorkingHoursDraft();
            fields.workingHoursTimezone.value = workingHours.timezone || 'America/New_York';
            ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(function (day) {
              const data = workingHours.days && workingHours.days[day] ? workingHours.days[day] : null;
              if (getWorkingHoursDayField(day, 'enabled')) getWorkingHoursDayField(day, 'enabled').checked = data ? Boolean(data.enabled) : !['sat', 'sun'].includes(day);
              if (getWorkingHoursDayField(day, 'start')) getWorkingHoursDayField(day, 'start').value = data && data.start ? data.start : '09:00';
              if (getWorkingHoursDayField(day, 'end')) getWorkingHoursDayField(day, 'end').value = data && data.end ? data.end : '18:00';
            });
          }
        }

        function getWorkingHoursDayField(day, field) {
          return document.getElementById('workingHours_' + day + '_' + field);
        }

        function getWorkingHoursPayload() {
          const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
          const workingHoursDraft = state.workingHoursDraft || getDefaultWorkingHoursDraft();
          return {
            enabled: fields.availabilityMode.value === 'schedule',
            timezone: ((fields.workingHoursTimezone && fields.workingHoursTimezone.value) || workingHoursDraft.timezone || 'America/New_York').trim(),
            days: dayKeys.reduce(function (acc, day) {
              const fallback = workingHoursDraft.days && workingHoursDraft.days[day] ? workingHoursDraft.days[day] : { enabled: !['sat', 'sun'].includes(day), start: '09:00', end: '18:00' };
              acc[day] = {
                enabled: getWorkingHoursDayField(day, 'enabled') ? Boolean(getWorkingHoursDayField(day, 'enabled').checked) : Boolean(fallback.enabled),
                start: (getWorkingHoursDayField(day, 'start') && getWorkingHoursDayField(day, 'start').value) || fallback.start || '09:00',
                end: (getWorkingHoursDayField(day, 'end') && getWorkingHoursDayField(day, 'end').value) || fallback.end || '18:00'
              };
              return acc;
            }, {})
          };
        }

        function getManualStatusValue() {
          if (fields.manualStatus) return fields.manualStatus.value || 'online';
          return state.availabilityDraft.manualStatus || 'online';
        }

        function renderLivePreview() {
          const primary = normalizeHexColor(fields.primary.value, '#f78c2f');
          const headerBg = normalizeHexColor(fields.headerBg.value, '#131926');
          const bubbleBg = normalizeHexColor(fields.bubbleBg.value, '#ffffff');
          const textColor = normalizeHexColor(fields.textColor.value, '#1f2734');
          const onPrimary = getReadableTextColor(primary, '#ffffff', '#17202d');
          const title = fields.title.value.trim() || 'PrintForge AI';
          const intro = fields.welcomeIntroLabel.value.trim() || 'AI assistant';
          const fallbackStatus = (state.currentSettings && state.currentSettings.onlineStatusText) || 'онлайн';
          const status = fields.availabilityMode && fields.availabilityMode.value === 'manual'
            ? (getManualStatusValue() === 'offline' ? 'offline' : 'online')
            : fallbackStatus;
          const welcomeMessage = fields.welcomeMessage.value.trim() || '👋 Привіт! Я AI помічник PrintForge. Можу допомогти з ціною, термінами та кастомним замовленням.';
          const managerName = fields.managerName.value.trim() || 'Марія';
          const avatarUrl = fields.avatarUrl.value.trim();
          const activeSectionEl = document.querySelector('.settings-section.is-open');
          const activeSection = activeSectionEl ? activeSectionEl.getAttribute('data-section') : 'general';
          const isFlowPreview = state.previewMode === 'flow' && activeSection === 'flows';

          if (previewEls.header) {
            previewEls.header.style.background = headerBg;
          }
          if (previewEls.title) previewEls.title.textContent = title;
          if (previewEls.subtitle) previewEls.subtitle.textContent = intro + ' · ' + status;
          const statusEl = previewEls.header ? previewEls.header.querySelector('.preview-status') : null;
          if (statusEl) {
            const isOffline = status === 'offline';
            statusEl.style.background = isOffline ? '#94a3b8' : '#4ade80';
            statusEl.style.boxShadow = isOffline
              ? '0 0 0 4px rgba(148,163,184,0.18)'
              : '0 0 0 4px rgba(74,222,128,0.14)';
          }
          if (previewEls.avatar) {
            previewEls.avatar.innerHTML = avatarUrl
              ? '<img src="' + escapeHtml(avatarUrl) + '" alt="' + escapeHtml(title) + '" />'
              : escapeHtml(getInitials(title, 'PF'));
          }
          if (previewEls.messages) {
            const flows = collectFlows();
            const selectedFlow = flows[state.selectedFlowIndex] || null;
            const flowSteps = selectedFlow && Array.isArray(selectedFlow.steps) ? selectedFlow.steps : [];
            if (isFlowPreview && selectedFlow) {
              previewEls.messages.innerHTML = [
                '<div class="preview-message user"><div class="preview-bubble" style="background:' + escapeHtml(primary) + ';color:' + escapeHtml(onPrimary) + ';border-color:transparent;box-shadow:0 6px 16px ' + escapeHtml(hexToRgba(primary, 0.16)) + ';">' + escapeHtml(selectedFlow.buttonLabel || selectedFlow.title || selectedFlow.slug || 'Open flow') + '</div></div>'
              ].concat(flowSteps.slice(0, 4).map(function (step, index) {
                const stepText = step && step.text ? step.text : 'Flow step';
                const options = Array.isArray(step && step.options) ? step.options : [];
                return '<div class="preview-message ai"><div class="preview-bubble" style="background:' + escapeHtml(bubbleBg) + ';color:' + escapeHtml(textColor) + ';">' +
                  (index === state.selectedFlowStepIndex ? '<div class="preview-step-label">Active step</div>' : '') +
                  nl2br(stepText) +
                  (options.length ? '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">' + options.slice(0, 3).map(function (option) {
                    return '<span class="preview-chip">' + escapeHtml(option.label || option.value || 'Option') + '</span>';
                  }).join('') + '</div>' : '') +
                '</div></div>';
              })).join('');
            } else {
              previewEls.messages.innerHTML =
                '<div class="preview-message ai"><div class="preview-bubble" style="background:' + escapeHtml(bubbleBg) + ';color:' + escapeHtml(textColor) + ';">' + nl2br(welcomeMessage) + '</div></div>' +
                '<div class="preview-message user"><div class="preview-bubble" style="background:' + escapeHtml(primary) + ';color:' + escapeHtml(onPrimary) + ';border-color:transparent;box-shadow:0 6px 16px ' + escapeHtml(hexToRgba(primary, 0.16)) + ';">Скільки буде коштувати друк?</div></div>' +
                (fields.operatorFallbackEnabled && fields.operatorFallbackEnabled.value === 'true'
                  ? '<div class="preview-message ai"><div class="preview-bubble" style="background:' + escapeHtml(bubbleBg) + ';color:' + escapeHtml(textColor) + ';opacity:.84;">' + nl2br(fields.operatorFallbackMessage.value || 'Оператори зараз зайняті, але ми на зв’язку. Залишайтесь у чаті, і ми відповімо вам якнайшвидше.') + '</div></div>'
                  : '') +
                '<div class="preview-message ai"><div class="preview-bubble" style="background:' + escapeHtml(bubbleBg) + ';color:' + escapeHtml(textColor) + ';">Напишіть, будь ласка, розмір деталі або надішліть файл, і я підкажу точніше.</div></div>';
            }
          }
          if (previewEls.sendBtn) {
            previewEls.sendBtn.style.background = primary;
            previewEls.sendBtn.style.color = onPrimary;
            previewEls.sendBtn.style.boxShadow = '0 6px 16px ' + hexToRgba(primary, 0.16);
          }
          if (previewEls.sendBtn && previewEls.sendBtn.parentNode && previewEls.sendBtn.parentNode.parentNode) {
            const inputWrap = previewEls.sendBtn.parentNode.parentNode.parentNode;
            if (inputWrap) {
              const widgetSizeValue = fields.widgetSize && fields.widgetSize.value ? fields.widgetSize.value : (state.currentSettings && state.currentSettings.widgetSize) || 'medium';
              const widgetPositionValue = fields.widgetPosition && fields.widgetPosition.value ? fields.widgetPosition.value : (state.currentSettings && state.currentSettings.widgetPosition) || 'bottom_right';
              inputWrap.style.maxWidth = widgetSizeValue === 'large' ? '100%' : (widgetSizeValue === 'compact' ? '86%' : '94%');
              inputWrap.style.marginLeft = widgetPositionValue === 'bottom_left' ? '0' : 'auto';
              inputWrap.style.marginRight = widgetPositionValue === 'bottom_left' ? 'auto' : '0';
            }
          }
          if (previewEls.quickActions) {
            const allFlows = collectFlows().filter(function (item) {
              return item.showInWidget !== false;
            });
            const visibleFlows = allFlows.slice(0, 4);
            const selectedFlow = collectFlows()[state.selectedFlowIndex] || null;
            previewEls.quickActions.innerHTML = visibleFlows.map(function (item) {
              const isActive = selectedFlow && (item.slug || item.id) === (selectedFlow.slug || selectedFlow.id);
              return '<span class="preview-chip' + (isActive ? ' is-active' : '') + '" style="border-color:' + escapeHtml(hexToRgba(primary, 0.16)) + ';color:' + escapeHtml(textColor) + ';"><span>' + escapeHtml(item.icon || '💬') + '</span><span>' + escapeHtml(item.buttonLabel || item.title || 'Quick action') + '</span></span>';
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

        function setActiveSection(sectionKey) {
          const availableSectionKeys = new Set(sectionEls.map(function (section) {
            return section.getAttribute('data-section') || '';
          }).filter(Boolean));
          const nextSectionKey = availableSectionKeys.has(sectionKey) ? sectionKey : 'general';
          const isFlowsSection = nextSectionKey === 'flows';
          state.previewMode = isFlowsSection ? 'flow' : 'widget';
          if (!isFlowsSection && state.flowAi.open) {
            closeFlowAiModal();
          }
          if (settingsShellEl) {
            settingsShellEl.classList.toggle('is-flows-active', isFlowsSection);
          }
          sectionEls.forEach(function (section) {
            const key = section.getAttribute('data-section');
            const body = section.querySelector('.settings-section-body');
            const isOpen = key === nextSectionKey;
            section.classList.toggle('is-open', isOpen);
            section.hidden = !isOpen;
            section.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            if (body) {
              body.hidden = !isOpen;
              body.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            }
          });
          Array.from(settingsCategoryNav.querySelectorAll('[data-settings-nav]')).forEach(function (button) {
            const isActive = button.getAttribute('data-settings-nav') === nextSectionKey;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
          });
          if (isFlowsSection) {
            syncActiveFlowView();
          }
          renderLivePreview();
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
          setSectionStatus('install', 'Use this section to generate and copy the live install code for the selected site.', false);
          setSectionStatus('theme', 'Зміни стилю не впливають на backend-логіку.', false);
          setSectionStatus('actions', 'Ці quick replies використовуються лише операторами в inbox.', false);
          setSectionStatus('flows', 'Кнопки у віджеті генеруються тільки з flows, де увімкнено Show in widget.', false);
          setSectionStatus('ai', 'Тут зберігаються лише site-based AI options, не секрети.', false);
          setSectionStatus('integrations', 'Secrets are stored server-side and returned masked only.', false);
        }

        function setSitesManagerStatus(text, success) {
          if (!sitesManagerStatusEl) return;
          sitesManagerStatusEl.textContent = text;
          sitesManagerStatusEl.className = 'status-line' + (success ? ' success' : '');
        }

        function maskWidgetKey(value) {
          const clean = String(value || '').trim();
          if (!clean) return '';
          if (clean.length <= 12) return clean;
          return clean.slice(0, 6) + '...' + clean.slice(-4);
        }

        function escapeSelectorValue(value) {
          return JSON.stringify(String(value || '')).slice(1, -1);
        }

        async function copyToClipboard(value) {
          const text = String(value || '');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return;
          }
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', 'readonly');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        function setInstallStatusLine(text, success) {
          if (!installStatusLineEl) return;
          installStatusLineEl.textContent = text;
          installStatusLineEl.className = 'status-line' + (success ? ' success' : '');
        }

        function flashButtonLabel(button, nextLabel) {
          if (!button) return;
          const original = button.dataset.originalLabel || button.textContent;
          button.dataset.originalLabel = original;
          button.textContent = nextLabel;
          window.setTimeout(function () {
            button.textContent = original;
          }, 1400);
        }

        function buildInstallInstructionsText(install) {
          const lines = Array.isArray(install && install.instructions) ? install.instructions : [];
          return lines.join('\\n');
        }

        function buildDeveloperHandoffText(payload) {
          if (!payload || !payload.site || !payload.install) return '';
          return [
            'Install Chat handoff',
            'Workspace: ' + (payload.workspace && payload.workspace.name || ''),
            'Site: ' + (payload.site.name || payload.site.id),
            'Primary domain: ' + (payload.site.primaryDomain || 'Not set'),
            'Site ID: ' + payload.site.id,
            'Widget key: ' + (payload.site.widgetKey || ''),
            '',
            'Snippet:',
            payload.install.snippet,
            '',
            'Instructions:',
            buildInstallInstructionsText(payload.install)
          ].join('\\n');
        }

        function formatInstallTimestamp(value) {
          const clean = String(value || '').trim();
          if (!clean) return 'Not detected yet';
          const normalized = clean.includes('T') ? clean : clean.replace(' ', 'T') + 'Z';
          const parsed = new Date(normalized);
          if (Number.isNaN(parsed.getTime())) return clean;
          return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
          }).format(parsed);
        }

        function renderInstallPayload() {
          const payload = state.installPayload;
          if (!payload || !payload.site) {
            if (installContextGridEl) installContextGridEl.innerHTML = '<div class="site-manager-empty">Select a site to generate the install snippet.</div>';
            if (installDomainsSummaryEl) installDomainsSummaryEl.innerHTML = '<div class="site-manager-empty">Domain information will appear here.</div>';
            if (installStatusGridEl) installStatusGridEl.innerHTML = '';
            if (installSnippetCodeEl) installSnippetCodeEl.textContent = '';
            if (installScriptUrlEl) installScriptUrlEl.textContent = 'widget.js';
            if (installWidgetKeyMaskedEl) installWidgetKeyMaskedEl.textContent = 'Hidden';
            setInstallStatusLine('Install data will appear for the active site.', false);
            return;
          }

          const widgetKeyDisplay = state.installWidgetKeyVisible
            ? (payload.site.widgetKey || '')
            : (payload.site.widgetKeyMasked || '');
          const verificationStatus = payload.status || {};
          const lastSeenHost = payload.site.lastSeenHost || verificationStatus.lastSeenHost || '';
          const lastSeenUrl = payload.site.lastSeenUrl || verificationStatus.lastSeenUrl || '';
          const domainStatus = verificationStatus.domainValid === false
            ? 'Domain mismatch'
            : verificationStatus.domainValid === true
              ? 'Allowed domain'
              : 'Waiting for detection';
          const statusItems = [
            { label: 'Install state', value: verificationStatus.label || 'Ready to install' },
            { label: 'Snippet copied', value: state.installSnippetCopied ? 'Copied in this session' : 'Not copied yet' },
            { label: 'Website connection', value: verificationStatus.recentActivity ? 'Widget active recently' : (verificationStatus.lastSeenAt ? 'Heartbeat detected' : 'Waiting for website connection') },
            { label: 'Verification', value: verificationStatus.lastSeenAt ? 'Heartbeat received' : 'Verification not yet completed' },
            { label: 'Last seen', value: formatInstallTimestamp(verificationStatus.lastSeenAt) },
            { label: 'Detected host', value: lastSeenHost || 'Not detected yet' },
            { label: 'Domain check', value: domainStatus }
          ];

          if (installContextGridEl) {
            installContextGridEl.innerHTML = [
              { label: 'Workspace', value: payload.workspace && payload.workspace.name || '' },
              { label: 'Site', value: payload.site.name || payload.site.id },
              { label: 'Primary domain', value: payload.site.primaryDomain || 'Not set' },
              { label: 'Active site ID', value: payload.site.id }
            ].map(function (item) {
              return '<div class="install-context-item"><label>' + escapeHtml(item.label) + '</label><strong>' + escapeHtml(item.value) + '</strong></div>';
            }).join('');
          }

          if (installDomainsSummaryEl) {
            const domains = Array.isArray(payload.site.allowedDomains) ? payload.site.allowedDomains : [];
            installDomainsSummaryEl.innerHTML = domains.length
              ? domains.map(function (item) {
                  return '<span class="install-domain-chip"><strong>' + escapeHtml(item.domain || '') + '</strong>' + (item.isPrimary ? '<span>Primary</span>' : '<span>Allowed</span>') + '</span>';
                }).join('')
              : '<div class="site-manager-empty">No allowed domains configured yet. Add your production domain before launch.</div>';
          }

          if (installStatusGridEl) {
            installStatusGridEl.innerHTML = statusItems.map(function (item) {
              return '<div class="install-status-item"><label>' + escapeHtml(item.label) + '</label><strong>' + escapeHtml(item.value) + '</strong></div>';
            }).join('') + (
              verificationStatus.detail
                ? '<div class="install-status-item" style="grid-column:1 / -1;"><label>Status note</label><strong>' + escapeHtml(verificationStatus.detail) + '</strong>' + (lastSeenUrl ? '<div style="margin-top:6px;font-size:12px;color:var(--txt2);word-break:break-word;">' + escapeHtml(lastSeenUrl) + '</div>' : '') + '</div>'
                : ''
            );
          }

          if (installSnippetCodeEl) installSnippetCodeEl.textContent = payload.install.snippet || '';
          if (installScriptUrlEl) installScriptUrlEl.textContent = payload.install.scriptUrl || 'widget.js';
          if (installWidgetKeyMaskedEl) installWidgetKeyMaskedEl.textContent = widgetKeyDisplay || 'Hidden';
          if (toggleWidgetKeyBtn) toggleWidgetKeyBtn.textContent = state.installWidgetKeyVisible ? 'Hide key' : 'Reveal key';
          setInstallStatusLine(
            verificationStatus.detail
              ? verificationStatus.detail
              : (
                state.installSnippetCopied
                  ? 'Snippet copied. Paste it before the closing </body> tag on your site.'
                  : 'Ready to install. Copy the live snippet for this site and paste it into your website footer.'
              ),
            verificationStatus.tone === 'success' || state.installSnippetCopied
          );
        }

        function renderSiteManager() {
          if (!sitesManagerListEl) return;
          const activeSite = state.sites.find(function (site) {
            return site.siteId === state.selectedSiteId;
          }) || state.sites[0] || null;

          if (activeSiteBadgeEl) {
            activeSiteBadgeEl.textContent = activeSite
              ? ('Active site: ' + (activeSite.name || activeSite.siteId))
              : 'Active site: none';
          }

          if (!state.sites.length) {
            sitesManagerListEl.innerHTML = '<div class="site-manager-empty">No sites yet. Create your first site for this workspace.</div>';
            return;
          }

          sitesManagerListEl.innerHTML = state.sites.map(function (site) {
            const domains = Array.isArray(site.domains) ? site.domains : [];
            return '<div class="site-row-card" data-site-row="' + escapeHtml(site.siteId) + '">' +
              '<div class="site-row-head">' +
                '<div class="site-row-title">' +
                  '<strong>' + escapeHtml(site.name || site.siteId) + '</strong>' +
                  (site.siteId === state.selectedSiteId ? '<span class="site-pill active">Active</span>' : '') +
                  (site.isActive ? '' : '<span class="site-pill">Archived</span>') +
                '</div>' +
                '<div class="site-pill">' + escapeHtml(site.siteId) + '</div>' +
              '</div>' +
              '<div class="site-row-grid">' +
                '<div class="field">' +
                  '<label>Site name</label>' +
                  '<input type="text" data-site-field="name" value="' + escapeHtml(site.name || '') + '" />' +
                '</div>' +
                '<div class="field">' +
                  '<label>Primary domain</label>' +
                  '<input type="text" data-site-field="domain" value="' + escapeHtml(site.primaryDomain || site.domain || '') + '" placeholder="example.com" />' +
                '</div>' +
                '<div class="field">' +
                  '<label>Status</label>' +
                  '<select data-site-field="is_active">' +
                    '<option value="1"' + (site.isActive ? ' selected' : '') + '>Active</option>' +
                    '<option value="0"' + (!site.isActive ? ' selected' : '') + '>Archived</option>' +
                  '</select>' +
                '</div>' +
              '</div>' +
              '<div class="site-widget-key">Widget key: <code>' + escapeHtml(maskWidgetKey(site.widgetKey || site.widgetKeyMasked || '')) + '</code></div>' +
              '<div class="site-row-actions">' +
                '<button type="button" class="secondary" data-site-action="select" data-site-id="' + escapeHtml(site.siteId) + '">Use in settings</button>' +
                '<button type="button" class="secondary" data-site-action="save" data-site-id="' + escapeHtml(site.siteId) + '">Save site</button>' +
                '<button type="button" class="secondary" data-site-action="regenerate" data-site-id="' + escapeHtml(site.siteId) + '">Regenerate widget key</button>' +
              '</div>' +
              '<div class="site-domains">' +
                '<div class="site-domain-list">' +
                  (domains.length ? domains.map(function (domain) {
                    return '<span class="site-domain-chip">' +
                      escapeHtml(domain.domain || '') +
                      (domain.isPrimary ? ' <strong>(primary)</strong>' : '') +
                      '<button type="button" data-site-action="delete-domain" data-site-id="' + escapeHtml(site.siteId) + '" data-domain-id="' + escapeHtml(domain.id) + '">Remove</button>' +
                    '</span>';
                  }).join('') : '<span class="site-manager-empty">No allowed domains yet.</span>') +
                '</div>' +
                '<div class="site-domain-form">' +
                  '<div class="field">' +
                    '<label>Add domain</label>' +
                    '<input type="text" data-site-domain-input="' + escapeHtml(site.siteId) + '" placeholder="shop.example.com" />' +
                  '</div>' +
                  '<div class="field">' +
                    '<label>Primary</label>' +
                    '<select data-site-domain-primary="' + escapeHtml(site.siteId) + '">' +
                      '<option value="0">Allowed only</option>' +
                      '<option value="1">Set primary</option>' +
                    '</select>' +
                  '</div>' +
                  '<button type="button" class="secondary" data-site-action="add-domain" data-site-id="' + escapeHtml(site.siteId) + '">Add domain</button>' +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('');
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

        function buildFlowSubtitle(item) {
          if (item && item.description) return item.description;
          return item && (item.slug || item.id) ? (item.slug || item.id) : 'Новий сценарій';
        }

        function getHumanStepTitle(step, index) {
          const text = String(step && step.text || '').toLowerCase();
          const id = String(step && step.id || '').toLowerCase();
          const input = String(step && step.input || '').toLowerCase();
          const type = String(step && step.type || '').toLowerCase();
          if (input === 'file' || /файл|модел|upload|file/.test(text + ' ' + id)) return 'Завантаження файлу';
          if (/ім'я|звертат|name/.test(text + ' ' + id)) return 'Запит імені';
          if (/розмір|size/.test(text + ' ' + id)) return 'Питання про розмір';
          if (/опис|детал|description/.test(text + ' ' + id)) return 'Опис деталі';
          if (type === 'choice' || input === 'choice') return 'Вибір варіанту';
          if (input === 'text') return 'Текстова відповідь';
          if (input === 'none') return index === 0 ? 'Стартове повідомлення' : 'Повідомлення бота';
          return 'Крок ' + (index + 1);
        }

        function getStepKindMeta(step, index, total) {
          const input = String(step && step.input || 'text').toLowerCase();
          const type = String(step && step.type || 'message').toLowerCase();
          if (index === total - 1 && input === 'none') {
            return { label: 'End step', className: 'end', note: 'Показує фінальне повідомлення й завершує flow.' };
          }
          if (input === 'file') {
            return { label: 'File upload', className: 'file', note: 'Клієнт завантажує файл і після цього flow переходить далі.' };
          }
          if (type === 'choice' || input === 'choice') {
            return { label: 'Choice', className: 'choice', note: 'Клієнт обирає один із варіантів і сценарій продовжується далі.' };
          }
          if (input === 'none') {
            return { label: 'Bot message', className: 'bot', note: 'Бот просто надсилає повідомлення й автоматично рухається далі.' };
          }
          return { label: 'User input', className: 'user', note: 'Бот очікує текстову відповідь від клієнта перед наступним кроком.' };
        }

        function getStepNextLabel(steps, index) {
          const nextStep = Array.isArray(steps) ? steps[index + 1] : null;
          if (!nextStep) return 'Завершення flow';
          return getHumanStepTitle(nextStep, index + 1);
        }

        function createFlowListItem(item, index) {
          const stepsCount = Array.isArray(item && item.steps) ? item.steps.length : 0;
          const isEditing = state.flowListEditor.index === index;
          const isMenuOpen = state.flowListMenu.open && state.flowListMenu.index === index;
          return '<div class="flow-list-item' + (item && item.showInWidget === false ? ' is-hidden-flow' : '') + (state.selectedFlowIndex === index ? ' active' : '') + '" data-flow-list-item-wrap="true" data-flow-index="' + index + '">' +
            '<button type="button" class="flow-list-item-main" data-flow-list-item="true" data-flow-index="' + index + '">' +
              '<span class="flow-list-item-copy">' +
                '<strong>' + escapeHtml((item && item.icon ? item.icon + ' ' : '') + (item.buttonLabel || item.title || 'Без назви')) + '</strong>' +
                '<span>' + escapeHtml(stepsCount + ' messages' + (item && item.showInWidget === false ? ' • hidden' : '')) + '</span>' +
              '</span>' +
              '<span type="button" class="flow-list-item-menu-btn" data-flow-list-menu-toggle="' + index + '" aria-label="Flow actions">…</span>' +
            '</button>' +
            (isMenuOpen
              ? '<div class="flow-list-item-menu">' +
                  '<button type="button" data-flow-list-action="edit" data-flow-index="' + index + '">Rename / icon</button>' +
                  '<button type="button" data-flow-list-action="duplicate" data-flow-index="' + index + '">Duplicate</button>' +
                  '<button type="button" class="danger" data-flow-list-action="delete" data-flow-index="' + index + '">Delete</button>' +
                '</div>'
              : '') +
            (isEditing
              ? '<div class="flow-list-item-editor">' +
                  '<div class="flow-list-item-editor-row">' +
                    '<input type="text" data-flow-list-edit-field="icon" data-flow-index="' + index + '" value="' + escapeHtml(item.icon || '') + '" placeholder="💬" />' +
                    '<input type="text" data-flow-list-edit-field="title" data-flow-index="' + index + '" value="' + escapeHtml(item.title || item.buttonLabel || '') + '" placeholder="Назва flow" />' +
                  '</div>' +
                '</div>'
              : '') +
          '</div>';
        }

        function cloneJson(value, fallback) {
          try {
            return JSON.parse(JSON.stringify(value));
          } catch (error) {
            return fallback;
          }
        }

        function getDraftFlows() {
          return Array.isArray(state.flowsDraft) ? state.flowsDraft : [];
        }

        function normalizeDraftStep(step, index) {
          const source = step || {};
          const input = String(source.input || 'text').trim().toLowerCase() || 'text';
          const type = String(source.type || (input === 'choice' ? 'choice' : 'message')).trim().toLowerCase() || 'message';
          return Object.assign({}, source, {
            id: String(source.id || ('step_' + (index + 1))).trim() || ('step_' + (index + 1)),
            type: type,
            input: input,
            text: String(source.text || ''),
            uiClientText: String(source.uiClientText || ''),
            options: Array.isArray(source.options) ? source.options.map(function (option) {
              return {
                label: String(option && option.label || ''),
                value: String(option && option.value || '')
              };
            }) : []
          });
        }

        function normalizeDraftFlow(item, index) {
          const fallbackSlug = 'flow_' + (index + 1);
          return Object.assign({}, item || {}, {
            id: String(item && (item.id || item.slug) || fallbackSlug).trim() || fallbackSlug,
            slug: String(item && (item.slug || item.id) || fallbackSlug).trim() || fallbackSlug,
            title: String(item && item.title || item && item.buttonLabel || fallbackSlug),
            buttonLabel: String(item && item.buttonLabel || item && item.title || fallbackSlug),
            icon: String(item && item.icon || '💬'),
            showInWidget: item && item.showInWidget === false ? false : true,
            description: String(item && item.description || ''),
            steps: Array.isArray(item && item.steps) ? item.steps.map(normalizeDraftStep) : []
          });
        }

        function getChoiceOptionValue(label) {
          return String(label || '').trim().toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, '_').replace(/^_+|_+$/g, '') || 'option';
        }

        function getStepCustomerPlaceholder(step) {
          const id = String(step && step.id || '').toLowerCase();
          const example = String(step && step.uiClientText || '').trim();
          if (example) return example;
          if ((step && step.type === 'choice') || (step && step.input === 'choice')) return 'Customer taps one of the buttons';
          if (step && step.input === 'file') return 'Customer uploads a model file';
          if (/name|ім/.test(id)) return 'Customer types their name';
          if (/phone|тел/.test(id)) return 'Customer shares a phone number';
          if (/email|mail/.test(id)) return 'Customer shares an email';
          return 'Customer types a reply';
        }

        function getStepConversationRole(step) {
          if ((step && step.type === 'choice') || (step && step.input === 'choice') || (step && step.input === 'file')) {
            return 'action';
          }
          if (step && step.input === 'text') {
            return 'client';
          }
          return 'bot';
        }

        function createFlowInsertMenu(index) {
          if (!state.flowMenu.open || state.flowMenu.stepIndex !== index) return '';
          if (state.flowMenu.mode === 'insert-message') {
            return '<div class="flow-step-menu">' +
              '<button type="button" data-flow-insert-action="bot_message" data-step-index="' + index + '">Повідомлення бота</button>' +
              '<button type="button" data-flow-insert-action="free_text" data-step-index="' + index + '">Відповідь клієнта</button>' +
            '</div>';
          }
          if (state.flowMenu.mode === 'insert-action') {
            return '<div class="flow-step-menu">' +
              '<button type="button" data-flow-insert-action="free_text" data-step-index="' + index + '">Текстова відповідь</button>' +
              '<button type="button" data-flow-insert-action="file" data-step-index="' + index + '">Завантаження файлу</button>' +
            '</div>';
          }
          return '';
        }

        function createFlowActionMenu(index) {
          if (!state.flowMenu.open || state.flowMenu.mode !== 'actions' || state.flowMenu.stepIndex !== index) return '';
          return '<div class="flow-step-menu">' +
            '<button type="button" data-flow-step-menu-action="add-below" data-step-index="' + index + '">Додати повідомлення нижче</button>' +
            '<button type="button" data-flow-step-menu-action="add-action" data-step-index="' + index + '">Додати дію</button>' +
            '<button type="button" class="danger" data-flow-step-menu-action="delete" data-step-index="' + index + '">Видалити</button>' +
          '</div>';
        }

        function getFlowEditorTheme() {
          const primary = normalizeHexColor(fields.primary.value, '#f78c2f');
          const headerBg = normalizeHexColor(fields.headerBg.value, '#131926');
          const bubbleBg = normalizeHexColor(fields.bubbleBg.value, '#ffffff');
          const textColor = normalizeHexColor(fields.textColor.value, '#1f2734');
          return {
            primary: primary,
            onPrimary: getReadableTextColor(primary, '#ffffff', '#17202d'),
            headerBg: headerBg,
            bubbleBg: bubbleBg,
            textColor: textColor
          };
        }

        function createFlowChatEntry(step, index, steps) {
          const role = getStepConversationRole(step);
          const isSelected = state.selectedFlowStepIndex === index;
          const message = String(step && step.text || '').trim();
          const nextLabel = getStepNextLabel(steps, index);
          const placeholder = getStepCustomerPlaceholder(step);
          const theme = getFlowEditorTheme();
          const isEditing = state.flowInlineEditor.stepIndex === index;
          const isClientHintBusy = state.flowClientHintBusyStep === index;
          const clientHintDraft = state.flowClientHintEditor.stepIndex === index
            ? state.flowClientHintEditor.draft
            : placeholder;
          const title = fields.title.value.trim() || 'PrintForge AI';
          const avatarUrl = fields.avatarUrl.value.trim();
          const avatarHtml = '<div class="flow-chat-avatar">' + (avatarUrl
            ? '<img src="' + escapeHtml(avatarUrl) + '" alt="' + escapeHtml(title) + '" />'
            : escapeHtml(getInitials(title, 'PF'))) + '</div>';
          const inlineControlsHtml = '<div class="flow-chat-inline-actions">' +
            '<button type="button" class="flow-chat-hover-btn" data-flow-inline-open="' + index + '">Edit</button>' +
            '<button type="button" class="flow-chat-hover-btn flow-chat-menu-btn" data-open-flow-step-menu="true" data-step-index="' + index + '" aria-label="More actions">⋯</button>' +
          '</div>';
          const botBubbleHtml = isEditing
            ? ('<div class="flow-chat-bubble is-editing">' +
                '<div class="flow-inline-editor">' +
                  '<textarea data-flow-inline-input="' + index + '" placeholder="Type the bot message here…"' + (state.flowInlineEditor.busy ? ' disabled' : '') + '>' + escapeHtml(state.flowInlineEditor.draft || '') + '</textarea>' +
                  '<div class="flow-inline-editor-actions">' +
                    '<button type="button" class="secondary" data-flow-inline-cancel="' + index + '"' + (state.flowInlineEditor.busy ? ' disabled' : '') + '>Cancel</button>' +
                    '<button type="button" class="secondary" data-flow-inline-rewrite="' + index + '"' + (state.flowInlineEditor.busy ? ' disabled' : '') + '>' + (state.flowInlineEditor.busy ? 'Rewriting…' : 'Rewrite with AI') + '</button>' +
                    '<button type="button" class="primary" data-flow-inline-save="' + index + '"' + (state.flowInlineEditor.busy ? ' disabled' : '') + '>Save</button>' +
                  '</div>' +
                '</div>' +
              '</div>')
            : ('<div class="flow-chat-bubble' + (message ? '' : ' empty') + '" style="background:' + escapeHtml(theme.bubbleBg) + ';color:' + escapeHtml(theme.textColor) + ';">' + (message ? nl2br(message) : 'Type what the bot should say here.') + '</div>');
          let bodyHtml = '';
          if (role === 'bot') {
            bodyHtml =
              '<div class="flow-chat-node bot">' +
                avatarHtml +
                '<div class="flow-chat-node-column">' +
                  '<div class="flow-chat-bubble-wrap">' + botBubbleHtml + inlineControlsHtml + '</div>' +
                '</div>' +
              '</div>';
          } else if (role === 'client') {
            bodyHtml =
              '<div class="flow-chat-node bot">' +
                avatarHtml +
                '<div class="flow-chat-node-column">' +
                  '<div class="flow-chat-bubble-wrap">' + botBubbleHtml + inlineControlsHtml + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="flow-chat-node client-reply">' +
                '<div class="flow-chat-node-column">' +
                  '<div class="flow-chat-placeholder">' +
                    '<div class="flow-chat-placeholder-head">' +
                      '<strong>Expected reply</strong>' +
                      '<button type="button" data-flow-client-hint-ai="' + index + '"' + (isClientHintBusy ? ' disabled' : '') + '>' + (isClientHintBusy ? 'Predicting…' : 'AI suggest') + '</button>' +
                    '</div>' +
                    '<textarea data-flow-client-hint-input="' + index + '" placeholder="Describe or draft the likely customer reply…"' + (isClientHintBusy ? ' disabled' : '') + '>' + escapeHtml(clientHintDraft) + '</textarea>' +
                  '</div>' +
                  '<div class="flow-chat-subline align-right">Next: ' + escapeHtml(nextLabel) + '.</div>' +
                '</div>' +
              '</div>';
          } else {
            const options = Array.isArray(step && step.options) ? step.options : [];
            bodyHtml =
              '<div class="flow-chat-node bot">' +
                avatarHtml +
                '<div class="flow-chat-node-column">' +
                  '<div class="flow-chat-bubble-wrap">' + botBubbleHtml + inlineControlsHtml + '</div>' +
                  ((step && step.input === 'file')
                    ? '<div class="flow-chat-option-list"><span class="flow-chat-action-chip" style="border-color:' + escapeHtml(hexToRgba(theme.primary, 0.14)) + ';background:rgba(255,255,255,0.96);color:' + escapeHtml(theme.textColor) + ';">📎 Upload file</span><span class="flow-chat-action-chip" style="border-color:' + escapeHtml(hexToRgba(theme.primary, 0.14)) + ';background:rgba(255,255,255,0.96);color:' + escapeHtml(theme.textColor) + ';">No file</span></div>'
                    : '') +
                  (((step && step.type === 'choice') || (step && step.input === 'choice'))
                    ? '<div class="flow-chat-option-list">' + (options.length ? options.map(function (option) {
                        return '<span class="flow-chat-option-chip" style="border-color:' + escapeHtml(hexToRgba(theme.primary, 0.14)) + ';background:rgba(255,255,255,0.96);color:' + escapeHtml(theme.textColor) + ';">' + escapeHtml(option.label || option.value || 'Option') + '</span>';
                      }).join('') : '<span class="flow-chat-action-chip" style="border-color:' + escapeHtml(hexToRgba(theme.primary, 0.14)) + ';background:rgba(255,255,255,0.96);color:' + escapeHtml(theme.textColor) + ';">Add buttons</span>') + '</div>'
                    : '') +
                  '<div class="flow-chat-subline">' + escapeHtml((step && step.input === 'file')
                    ? ('Customer choice continues to ' + nextLabel + '.')
                    : ('Tap an option to continue to ' + nextLabel + '.')) + '</div>' +
                '</div>' +
              '</div>';
          }
          return '<div class="flow-chat-entry ' + role + (isSelected ? ' selected' : '') + '" data-flow-chat-step="true" data-step-index="' + index + '">' +
            '<div class="flow-chat-block">' + bodyHtml + '</div>' +
            createFlowActionMenu(index) +
            createFlowInsertMenu(index) +
          '</div>';
        }

        function createFlowScenarioRow(item, index) {
          const steps = Array.isArray(item.steps) ? item.steps : [];
          const theme = getFlowEditorTheme();
          const title = fields.title.value.trim() || 'PrintForge AI';
          const subtitle = fields.welcomeIntroLabel.value.trim() || 'AI assistant';
          const avatarUrl = fields.avatarUrl.value.trim();
          const visibleFlows = collectFlows().filter(function (flow) {
            return flow.showInWidget !== false;
          }).slice(0, 4);
          return '<div class="flow-conversation-shell" data-flow-scenario-row="true" data-flow-index="' + index + '">' +
            '<div class="flow-widget-shell">' +
              '<div class="flow-widget-header" style="background:' + escapeHtml(theme.headerBg) + ';">' +
                '<div class="flow-widget-avatar">' + (avatarUrl
                  ? '<img src="' + escapeHtml(avatarUrl) + '" alt="' + escapeHtml(title) + '" />'
                  : escapeHtml(getInitials(title, 'PF'))) + '</div>' +
                '<div class="flow-widget-header-copy">' +
                  '<strong>' + escapeHtml(title) + '</strong>' +
                  '<span><span class="flow-widget-status"></span>' + escapeHtml(subtitle) + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="flow-widget-chat">' +
                '<div class="flow-widget-quick-actions">' +
                  visibleFlows.map(function (flow) {
                    const isActive = (flow.slug || flow.id) === (item.slug || item.id);
                    return '<span class="flow-widget-quick-chip' + (isActive ? ' is-active' : '') + '">' +
                      '<span>' + escapeHtml(flow.buttonLabel || flow.title || 'Quick action') + '</span>' +
                    '</span>';
                  }).join('') +
                '</div>' +
                '<div class="flow-widget-thread flow-chat-stack">' +
                  (steps.length
                    ? steps.map(function (step, stepIndex) {
                        return createFlowChatEntry(step, stepIndex, steps);
                      }).join('')
                    : '<div class="flows-editor-empty">Start by typing the first bot message below.</div>') +
                '</div>' +
              '</div>' +
              '<div class="flow-composer-shell">' +
                '<div class="flow-composer-row">' +
                  '<button id="flowComposerAttachBtn" class="flow-composer-attach" type="button" aria-label="Add action">+</button>' +
                  '<div class="flow-composer-surface">' +
                    '<input id="flowComposerInput" class="flow-composer-input" type="text" placeholder="Напишіть повідомлення…" />' +
                  '</div>' +
                  '<button id="flowComposerSendBtn" class="flow-composer-send" type="button" aria-label="Send"><span>➜</span></button>' +
                '</div>' +
                '<div id="flowComposerActionMenu" class="flow-inline-menu" hidden></div>' +
              '</div>' +
            '</div>' +
          '</div>';
        }

        function getAiTemplatePrompt(templateKey) {
          const templates = {
            lead_capture: 'Create a simple lead capture scenario: greet the visitor, ask for name, ask for phone or Telegram, ask what they need, and finish with a confirmation message.',
            price_calculation: 'Create a price calculation scenario for 3D printing: ask for name, ask whether the customer has a model file, if yes ask to upload it, if no ask to describe the part, then ask dimensions, quantity, deadline, and finish with a confirmation.',
            file_upload: 'Create a file upload scenario: greet the user, ask what they want to print, ask to upload the model file, ask for quantity and deadline, then finish with a confirmation.',
            support_triage: 'Create a support triage scenario: ask what the issue is, offer 3 choice buttons for pricing, technical help, or order status, collect the needed details, then finish with a handoff-style confirmation.',
            faq_flow: 'Create a short FAQ flow with buttons for pricing, file requirements, delivery, and custom orders, then provide a follow-up message and a final fallback to contact the team.'
          };
          return templates[templateKey] || '';
        }

        function slugifyFlowText(value, fallback) {
          const base = String(value || '').trim().toLowerCase()
            .replace(/[^a-z0-9а-яіїєґ]+/gi, '_')
            .replace(/^_+|_+$/g, '');
          return base || fallback || 'ai_flow';
        }

        function buildFlowAiSummaryHtml(flow) {
          const summary = flow && flow.summary ? flow.summary : {};
          const goal = summary.goal || flow.description || 'Generated draft based on the prompt.';
          const fieldsList = Array.isArray(summary.collectedFields) ? summary.collectedFields : [];
          const branchesList = Array.isArray(summary.branches) ? summary.branches : [];
          return '<div class="flow-ai-summary">' +
            '<div class="flow-ai-summary-grid">' +
              '<div class="flow-ai-summary-item"><strong>Flow title</strong><span>' + escapeHtml(flow.title || flow.buttonLabel || flow.slug || 'Draft flow') + '</span></div>' +
              '<div class="flow-ai-summary-item"><strong>Button label</strong><span>' + escapeHtml(flow.buttonLabel || flow.title || 'Open flow') + '</span></div>' +
              '<div class="flow-ai-summary-item"><strong>Slug</strong><span>' + escapeHtml(flow.slug || flow.id || 'flow') + '</span></div>' +
            '</div>' +
            '<div class="flow-ai-summary-item"><strong>Goal</strong><small>' + escapeHtml(goal) + '</small></div>' +
            '<div class="flow-ai-summary-item">' +
              '<strong>Collected fields</strong>' +
              (fieldsList.length
                ? '<div class="flow-ai-summary-list">' + fieldsList.map(function (item) {
                    return '<span class="flow-ai-summary-pill">' + escapeHtml(item) + '</span>';
                  }).join('') + '</div>'
                : '<small>No explicit collected fields detected.</small>') +
            '</div>' +
            '<div class="flow-ai-summary-item">' +
              '<strong>Branching summary</strong>' +
              (branchesList.length
                ? '<div class="flow-ai-summary-list">' + branchesList.map(function (item) {
                    return '<span class="flow-ai-summary-pill branch">' + escapeHtml(item) + '</span>';
                  }).join('') + '</div>'
                : '<small>This draft is mostly linear.</small>') +
            '</div>' +
          '</div>';
        }

        function buildFlowAiStructureHtml(flow) {
          if (!flow) return '';
          const steps = Array.isArray(flow.steps) ? flow.steps : [];
          return '<div class="flow-conversation-shell">' +
            '<div class="flow-chat-stack">' + steps.map(function (step, stepIndex) {
              return createFlowChatEntry(step, stepIndex, steps);
            }).join('') + '</div>' +
          '</div>';
        }

        function renderFlowAiChatPreview(flow, session) {
          const safeSession = session || createFlowTestState(flow);
          const messagesHtml = (safeSession.messages || []).map(function (item) {
            return '<div class="flow-ai-chat-message ' + escapeHtml(item.role) + '"><div class="flow-ai-chat-bubble">' + nl2br(item.text || '') + '</div></div>';
          }).join('');
          const activeStep = Array.isArray(flow.steps) ? flow.steps[safeSession.activeStepIndex] : null;
          let controlsHtml = '';
          if (safeSession.completed) {
            controlsHtml = '<div class="flow-ai-muted">Draft flow finished. You can reset or regenerate it.</div>';
          } else if (!activeStep) {
            controlsHtml = '<div class="flow-ai-muted">No active step to preview.</div>';
          } else if (safeSession.awaiting === 'choice') {
            const options = Array.isArray(activeStep.options) ? activeStep.options : [];
            controlsHtml = '<div class="flow-ai-muted">Click a customer choice to continue.</div><div class="flow-ai-chat-actions">' + options.map(function (option, optionIndex) {
              return '<button type="button" class="flow-ai-chat-option" data-ai-test-option="' + optionIndex + '">' + escapeHtml(option.label || option.value || 'Option') + '</button>';
            }).join('') + '</div>';
          } else if (safeSession.awaiting === 'file') {
            controlsHtml = '<div class="flow-ai-muted">Simulate a customer upload.</div><div class="flow-ai-chat-actions"><button type="button" class="flow-ai-chat-option" data-ai-test-upload="true">Upload file</button></div>';
          } else {
            controlsHtml = '<div class="flow-ai-muted">Type a customer answer to continue the draft.</div><div class="flow-ai-chat-input-row"><input id="flowAiTestInput" type="text" placeholder="Наприклад: Василь" /><button type="button" class="flow-ai-chat-submit" data-ai-test-submit="true">Send</button></div>';
          }
          return '<div class="flow-ai-chat-shell">' +
            '<div class="flow-ai-chat-thread">' + (messagesHtml || '<div class="flow-ai-preview-empty" style="min-height:240px;">Click Generate to build a draft flow.</div>') + '</div>' +
            '<div class="flow-ai-chat-controls">' + controlsHtml + '</div>' +
          '</div>';
        }

        function buildFlowAiPreviewHtml() {
          const draft = state.flowAi.draft;
          if (state.flowAi.generating) {
            return '<div class="flow-ai-preview-loading">Generating flow draft with AI…<br /><span class="flow-ai-muted">This can take a few seconds depending on the model.</span></div>';
          }
          if (state.flowAi.error) {
            return '<div class="flow-ai-preview-error">' + escapeHtml(state.flowAi.error) + '</div>';
          }
          if (!draft) {
            return '<div class="flow-ai-preview-empty">Describe the scenario in natural language, choose optional settings, and generate a draft flow here.</div>';
          }
          return '<div class="flow-ai-draft-layout">' +
            buildFlowAiSummaryHtml(draft) +
            '<div class="flow-ai-preview-tabs">' +
              '<button type="button" class="flow-ai-preview-tab' + (state.flowAi.previewMode === 'structure' ? ' active' : '') + '" data-ai-preview-mode="structure">Structure</button>' +
              '<button type="button" class="flow-ai-preview-tab' + (state.flowAi.previewMode === 'chat' ? ' active' : '') + '" data-ai-preview-mode="chat">Chat Preview</button>' +
            '</div>' +
            '<div class="flow-ai-preview-mode"' + (state.flowAi.previewMode === 'structure' ? '' : ' hidden') + '>' + buildFlowAiStructureHtml(draft) + '</div>' +
            '<div class="flow-ai-preview-mode"' + (state.flowAi.previewMode === 'chat' ? '' : ' hidden') + '>' + renderFlowAiChatPreview(draft, state.flowAi.testSession) + '</div>' +
          '</div>';
        }

        function renderFlowAiModal() {
          if (!flowAiModalEl || !flowAiModalBackdropEl) return;
          if (!state.flowAi.open) {
            flowAiModalEl.hidden = true;
            flowAiModalBackdropEl.hidden = true;
            return;
          }
          const selected = getSelectedFlow();
          const selectedFlow = selected.flow;
          flowAiModalEl.innerHTML =
            '<div class="flow-ai-modal-head">' +
              '<div class="flow-ai-modal-copy">' +
                '<strong>Create scenario with AI</strong>' +
                '<small>Describe the chat logic in plain language. AI will turn it into a draft flow you can review before applying.</small>' +
              '</div>' +
              '<button type="button" class="flow-icon-btn" data-close-flow-ai="true">Close</button>' +
            '</div>' +
            '<div class="flow-ai-modal-body">' +
              '<div class="flow-ai-panel">' +
                '<div class="flow-ai-card">' +
                  '<h4>Describe the flow</h4>' +
                  '<p>Explain what the bot should ask, what the customer can answer, and what data you want to collect.</p>' +
                  '<textarea id="flowAiPromptInput" class="flow-ai-prompt" placeholder="Ask for the name, then ask whether they have a file. If yes, ask to upload it. If no, ask to describe the part, then ask dimensions and deadline.">' + escapeHtml(state.flowAi.prompt) + '</textarea>' +
                '</div>' +
                '<div class="flow-ai-card">' +
                  '<h4>Quick templates</h4>' +
                  '<div class="flow-ai-templates">' +
                    [
                      ['lead_capture', 'Lead capture'],
                      ['price_calculation', 'Price calculation'],
                      ['file_upload', 'File upload'],
                      ['support_triage', 'Support triage'],
                      ['faq_flow', 'FAQ flow']
                    ].map(function (item) {
                      return '<button type="button" class="flow-ai-template-btn' + (state.flowAi.template === item[0] ? ' active' : '') + '" data-ai-template="' + item[0] + '">' + item[1] + '</button>';
                    }).join('') +
                  '</div>' +
                '</div>' +
                '<div class="flow-ai-card">' +
                  '<h4>Optional settings</h4>' +
                  '<div class="flow-ai-grid">' +
                    '<div class="field"><label for="flowAiLanguageInput">Language</label><select id="flowAiLanguageInput"><option value="uk"' + (state.flowAi.language === 'uk' ? ' selected' : '') + '>Ukrainian</option><option value="en"' + (state.flowAi.language === 'en' ? ' selected' : '') + '>English</option><option value="ru"' + (state.flowAi.language === 'ru' ? ' selected' : '') + '>Russian</option></select></div>' +
                    '<div class="field"><label for="flowAiToneInput">Tone of voice</label><input id="flowAiToneInput" type="text" value="' + escapeHtml(state.flowAi.tone || '') + '" placeholder="Friendly and professional" /></div>' +
                    '<div class="field full"><label for="flowAiGoalInput">Goal of the flow</label><input id="flowAiGoalInput" type="text" value="' + escapeHtml(state.flowAi.goal || '') + '" placeholder="Collect enough information to estimate price and timeline" /></div>' +
                  '</div>' +
                  '<div class="flow-ai-muted">Current flow in editor: ' + escapeHtml(selectedFlow ? (selectedFlow.title || selectedFlow.buttonLabel || selectedFlow.slug || 'Selected flow') : 'none selected') + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="flow-ai-preview-panel">' +
                '<div class="flow-ai-card">' +
                  '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
                    '<div>' +
                      '<h4 style="margin-bottom:4px;">Draft preview</h4>' +
                      '<p>Review the generated structure, chat flow, and collected fields before applying.</p>' +
                    '</div>' +
                    (state.flowAi.model ? '<span class="flow-ai-model-badge">Model: ' + escapeHtml(state.flowAi.model) + '</span>' : '') +
                  '</div>' +
                  '<div id="flowAiPreviewPane">' + buildFlowAiPreviewHtml() + '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="flow-ai-modal-foot">' +
              '<div class="flow-ai-muted">Apply creates a draft flow in the current builder. You can still edit everything manually afterward.</div>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">' +
                '<button type="button" class="secondary" data-close-flow-ai="true">Cancel</button>' +
                '<button type="button" class="secondary" data-regenerate-flow-ai="true"' + (state.flowAi.generating ? ' disabled' : '') + '>Regenerate</button>' +
                '<button type="button" class="primary" data-generate-flow-ai="true"' + (state.flowAi.generating ? ' disabled' : '') + '>' + (state.flowAi.generating ? 'Generating…' : 'Generate draft') + '</button>' +
                '<button type="button" class="primary" data-apply-flow-ai="true"' + (state.flowAi.draft ? '' : ' disabled') + '>Apply draft</button>' +
              '</div>' +
            '</div>';
          flowAiModalEl.hidden = false;
          flowAiModalBackdropEl.hidden = false;
        }

        function captureFlowAiModalDraftFields() {
          if (!flowAiModalEl || flowAiModalEl.hidden) return;
          const promptField = flowAiModalEl.querySelector('#flowAiPromptInput');
          const languageField = flowAiModalEl.querySelector('#flowAiLanguageInput');
          const toneField = flowAiModalEl.querySelector('#flowAiToneInput');
          const goalField = flowAiModalEl.querySelector('#flowAiGoalInput');
          if (promptField) state.flowAi.prompt = promptField.value;
          if (languageField) state.flowAi.language = languageField.value || 'uk';
          if (toneField) state.flowAi.tone = toneField.value || '';
          if (goalField) state.flowAi.goal = goalField.value || '';
        }

        function openFlowAiModal() {
          closeFlowDrawer();
          state.flowAi.open = true;
          state.flowAi.previewMode = 'structure';
          renderFlowAiModal();
        }

        function closeFlowAiModal() {
          state.flowAi.open = false;
          if (flowAiModalEl) flowAiModalEl.hidden = true;
          if (flowAiModalBackdropEl) flowAiModalBackdropEl.hidden = true;
        }

        async function generateFlowAiDraft(forcePrompt) {
          const promptValue = typeof forcePrompt === 'string'
            ? forcePrompt
            : ((flowAiModalEl && flowAiModalEl.querySelector('#flowAiPromptInput')) ? flowAiModalEl.querySelector('#flowAiPromptInput').value : state.flowAi.prompt);
          const prompt = String(promptValue || '').trim();
          if (!prompt) {
            state.flowAi.error = 'Describe the scenario first so AI knows what to build.';
            renderFlowAiModal();
            return;
          }
          state.flowAi.prompt = prompt;
          if (flowAiModalEl) {
            const languageField = flowAiModalEl.querySelector('#flowAiLanguageInput');
            const toneField = flowAiModalEl.querySelector('#flowAiToneInput');
            const goalField = flowAiModalEl.querySelector('#flowAiGoalInput');
            if (languageField) state.flowAi.language = languageField.value || 'uk';
            if (toneField) state.flowAi.tone = toneField.value || '';
            if (goalField) state.flowAi.goal = goalField.value || '';
          }
          state.flowAi.generating = true;
          state.flowAi.error = '';
          state.flowAi.model = '';
          renderFlowAiModal();
          try {
            const response = await fetchJson('/api/admin/sites/' + encodeURIComponent(state.selectedSiteId) + '/ai/generate-flow', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: state.flowAi.prompt,
                template: state.flowAi.template,
                language: state.flowAi.language,
                tone: state.flowAi.tone,
                goal: state.flowAi.goal
              })
            });
            state.flowAi.draft = response.draft || null;
            state.flowAi.model = response.model || '';
            state.flowAi.previewMode = 'structure';
            state.flowAi.testSession = state.flowAi.draft ? createFlowTestState(state.flowAi.draft) : null;
          } catch (error) {
            state.flowAi.error = String(error && error.message || 'Failed to generate flow draft.');
          } finally {
            state.flowAi.generating = false;
            renderFlowAiModal();
          }
        }

        function applyFlowAiDraft() {
          const draft = state.flowAi.draft;
          if (!draft) return;
          const flows = collectFlows();
          const existingSlugs = flows.map(function (item) { return item.slug || item.id; });
          let baseSlug = draft.slug || slugifyFlowText(draft.title || draft.buttonLabel || 'ai_flow', 'ai_flow');
          let nextSlug = baseSlug;
          let suffix = 2;
          while (existingSlugs.indexOf(nextSlug) !== -1) {
            nextSlug = baseSlug + '_' + suffix;
            suffix += 1;
          }
          const appliedFlow = {
            id: nextSlug,
            slug: nextSlug,
            title: draft.title || draft.buttonLabel || nextSlug,
            buttonLabel: draft.buttonLabel || draft.title || nextSlug,
            icon: draft.icon || '💬',
            showInWidget: draft.showInWidget !== false,
            description: draft.description || '',
            steps: Array.isArray(draft.steps) ? draft.steps.map(function (step, index) {
              return {
                id: step.id || ('step_' + (index + 1)),
                type: step.type || 'message',
                input: step.input || 'text',
                text: step.text || '',
                options: Array.isArray(step.options) ? step.options.map(function (option) {
                  return {
                    label: option.label || option.value || 'Option',
                    value: option.value || slugifyFlowText(option.label || 'option', 'option')
                  };
                }) : []
              };
            }) : [getDefaultStep(0)]
          };
          flows.push(appliedFlow);
          state.selectedFlowIndex = flows.length - 1;
          state.selectedFlowStepIndex = 0;
          state.flowTestSession = null;
          renderFlows(flows);
          closeFlowAiModal();
          setSectionStatus('flows', 'AI draft applied to the builder. Review it and save flows when ready.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        }

        async function fetchFlowAssistText(mode, stepIndex) {
          const flows = getDraftFlows();
          const flow = flows[state.selectedFlowIndex];
          if (!flow) return '';
          const selectedStep = Number.isFinite(stepIndex) ? (flow.steps || [])[stepIndex] : null;
          const conversation = (flow.steps || []).map(function (step, index) {
            const role = getStepConversationRole(step) === 'bot' ? 'bot' : 'client';
            const text = role === 'bot'
              ? (step.text || '')
              : (getStepCustomerPlaceholder(step) || '');
            return {
              index: index,
              role: role,
              text: text
            };
          });
          try {
            const response = await fetchJson('/api/admin/sites/' + encodeURIComponent(state.selectedSiteId) + '/ai/assist-flow', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode: mode,
                flowTitle: flow.title || flow.buttonLabel || flow.slug,
                conversation: conversation,
                selectedMessage: selectedStep ? {
                  index: stepIndex,
                  role: getStepConversationRole(selectedStep) === 'bot' ? 'bot' : 'client',
                  text: selectedStep.text || getStepCustomerPlaceholder(selectedStep) || ''
                } : null
              })
            });
            return String(response && response.text || '').trim();
          } catch (error) {
            setSectionStatus('flows', String(error && error.message || 'AI could not help with this message right now.'), false);
            return '';
          }
        }

        async function assistFlowConversation(mode, stepIndex) {
          const flows = getDraftFlows();
          const flow = flows[state.selectedFlowIndex];
          const selectedStep = Number.isFinite(stepIndex) ? (flow && flow.steps ? flow.steps[stepIndex] : null) : null;
          if (!flow) return;
          try {
            const text = await fetchFlowAssistText(mode, stepIndex);
            if (!text) return;
            if (mode === 'predict_bot') {
              const flowComposerInputEl = getFlowComposerInputEl();
              if (flowComposerInputEl) {
                flowComposerInputEl.value = text;
                flowComposerInputEl.focus();
              }
              state.flowComposer.insertAfter = (flow.steps || []).length - 1;
            } else if (mode === 'predict_client') {
              const flowComposerActionMenuEl = getFlowComposerActionMenuEl();
              if (flowComposerActionMenuEl) flowComposerActionMenuEl.hidden = true;
              rerenderFlowsWithMutation(function (drafts) {
                const currentFlow = drafts[state.selectedFlowIndex];
                if (!currentFlow || !Array.isArray(currentFlow.steps) || !currentFlow.steps.length) return;
                const targetIndex = Number.isFinite(stepIndex) ? stepIndex : (currentFlow.steps.length - 1);
                const targetStep = currentFlow.steps[targetIndex];
                if (!targetStep) return;
                targetStep.input = targetStep.input === 'none' ? 'text' : targetStep.input;
                targetStep.uiClientText = text;
              });
            } else if (selectedStep) {
              rerenderFlowsWithMutation(function (drafts) {
                const currentFlow = drafts[state.selectedFlowIndex];
                const targetStep = currentFlow && currentFlow.steps ? currentFlow.steps[stepIndex] : null;
                if (!targetStep) return;
                targetStep.text = text;
              });
            }
            setSectionStatus('flows', 'AI updated the scenario draft. Review and save when ready.', false);
            setGlobalStatus('Є незбережені зміни.', false);
          } catch (error) {
            setSectionStatus('flows', String(error && error.message || 'AI could not help with this message right now.'), false);
          }
        }

        function openInlineFlowEditor(stepIndex) {
          const selected = getSelectedFlow();
          const step = selected.flow && selected.flow.steps ? selected.flow.steps[stepIndex] : null;
          if (!step) return;
          state.flowInlineEditor = {
            stepIndex: stepIndex,
            draft: step.text || '',
            busy: false
          };
        }

        function focusInlineFlowEditor(stepIndex) {
          requestAnimationFrame(function () {
            const input = flowScenariosListEl && flowScenariosListEl.querySelector('[data-flow-inline-input="' + stepIndex + '"]');
            if (!input) return;
            input.focus();
            if (typeof input.setSelectionRange === 'function') {
              const end = String(input.value || '').length;
              input.setSelectionRange(end, end);
            }
          });
        }

        function closeInlineFlowEditor() {
          state.flowInlineEditor = { stepIndex: null, draft: '', busy: false };
        }

        function openFlowClientHintEditor(stepIndex) {
          const selected = getSelectedFlow();
          const step = selected.flow && selected.flow.steps ? selected.flow.steps[stepIndex] : null;
          if (!step) return;
          state.flowClientHintEditor = {
            stepIndex: stepIndex,
            draft: getStepCustomerPlaceholder(step)
          };
        }

        function saveInlineFlowEditor() {
          const stepIndex = state.flowInlineEditor.stepIndex;
          if (!Number.isFinite(stepIndex) || state.flowInlineEditor.busy) return;
          rerenderFlowsWithMutation(function (flows) {
            const flow = flows[state.selectedFlowIndex];
            const step = flow && flow.steps ? flow.steps[stepIndex] : null;
            if (!step) return;
            step.text = String(state.flowInlineEditor.draft || '').trim();
          });
          closeInlineFlowEditor();
        }

        function renderFlowHeaderMenu() {
          if (!flowHeaderMenuEl) return;
          const selected = getSelectedFlow();
          const flow = selected.flow;
          if (!state.flowHeaderMenuOpen || !flow) {
            flowHeaderMenuEl.hidden = true;
            flowHeaderMenuEl.innerHTML = '';
            return;
          }
          flowHeaderMenuEl.hidden = false;
          flowHeaderMenuEl.innerHTML =
            '<div class="flow-header-menu-card">' +
              '<div class="field">' +
                '<label for="flowHeaderTitleInput">Назва flow</label>' +
                '<input id="flowHeaderTitleInput" type="text" data-flow-header-field="title" value="' + escapeHtml(flow.title || flow.buttonLabel || flow.slug || '') + '" />' +
              '</div>' +
              '<div class="field">' +
                '<label for="flowHeaderIconInput">Іконка</label>' +
                '<input id="flowHeaderIconInput" type="text" data-flow-header-field="icon" value="' + escapeHtml(flow.icon || '') + '" placeholder="💬" />' +
              '</div>' +
            '</div>';
        }

        function positionFlowMenus() {
          const menu = document.querySelector('.flow-step-menu');
          if (!menu || !state.flowMenu.open || !Number.isFinite(state.flowMenu.stepIndex)) return;
          const trigger = document.querySelector('[data-open-flow-step-menu][data-step-index="' + state.flowMenu.stepIndex + '"]');
          const stepRow = document.querySelector('[data-flow-chat-step][data-step-index="' + state.flowMenu.stepIndex + '"]');
          const anchor = trigger || stepRow;
          if (!anchor) return;
          menu.classList.add('is-hidden-measure');
          menu.style.top = '0px';
          menu.style.left = '0px';
          const anchorRect = anchor.getBoundingClientRect();
          const menuRect = menu.getBoundingClientRect();
          const viewportPadding = 12;
          let top = anchorRect.bottom + 8;
          if (top + menuRect.height > window.innerHeight - viewportPadding) {
            top = Math.max(viewportPadding, anchorRect.top - menuRect.height - 8);
          }
          let left = trigger ? anchorRect.left : (anchorRect.left + 44);
          if (left + menuRect.width > window.innerWidth - viewportPadding) {
            left = window.innerWidth - menuRect.width - viewportPadding;
          }
          if (left < viewportPadding) left = viewportPadding;
          menu.style.top = Math.round(top) + 'px';
          menu.style.left = Math.round(left) + 'px';
          menu.classList.remove('is-hidden-measure');
        }

        function syncActiveFlowView() {
          const flows = getDraftFlows();
          const maxIndex = Math.max(0, flows.length - 1);
          state.selectedFlowIndex = Math.min(Math.max(state.selectedFlowIndex, 0), maxIndex);
          const selectedFlow = flows[state.selectedFlowIndex] || null;
          const selectedSteps = selectedFlow && Array.isArray(selectedFlow.steps) ? selectedFlow.steps : [];
          state.selectedFlowStepIndex = Math.min(Math.max(state.selectedFlowStepIndex, 0), Math.max(0, selectedSteps.length - 1));
          const filteredFlows = Array.isArray(flows) ? flows.filter(function (item) {
            const query = String(state.flowSearchQuery || '').trim().toLowerCase();
            if (!query) return true;
            return [item.title, item.buttonLabel, item.slug, item.description].join(' ').toLowerCase().indexOf(query) !== -1;
          }) : [];
          flowListEl.innerHTML = filteredFlows.map(function (item) {
            const index = flows.findIndex(function (flow) {
              return (flow.slug || flow.id) === (item.slug || item.id);
            });
            return createFlowListItem(item, index);
          }).join('');
          Array.from(flowListEl.querySelectorAll('[data-flow-list-item]')).forEach(function (item) {
            item.classList.toggle('active', Number(item.getAttribute('data-flow-index')) === state.selectedFlowIndex);
          });
          if (flowsEditorEmptyEl) {
            flowsEditorEmptyEl.hidden = flows.length > 0;
          }
          if (flowScenariosListEl) {
            flowScenariosListEl.innerHTML = selectedFlow ? createFlowScenarioRow(selectedFlow, state.selectedFlowIndex) : '';
          }
          if (selectedFlowTitleEl) {
            const primaryTitle = selectedFlow && (selectedFlow.title || selectedFlow.buttonLabel || selectedFlow.slug || 'Selected flow');
            const secondaryTitle = selectedFlow && selectedFlow.buttonLabel && selectedFlow.buttonLabel !== primaryTitle ? selectedFlow.buttonLabel : '';
            selectedFlowTitleEl.textContent = selectedFlow
              ? (primaryTitle + (secondaryTitle ? ': ' + secondaryTitle : ''))
              : 'Flow conversation';
          }
          renderFlowHeaderMenu();
          renderFlowWorkspaceMode();
          renderFlowDrawer();
          positionFlowMenus();
        }

        function renderFlows(flows) {
          const safeFlows = (Array.isArray(flows) ? flows : []).map(normalizeDraftFlow);
          state.flowsDraft = cloneJson(safeFlows, []);
          syncActiveFlowView();
        }

        function getSelectedFlow() {
          const flows = getDraftFlows();
          return {
            flows: flows,
            flow: flows[state.selectedFlowIndex] || null
          };
        }

        function getDefaultStep(index) {
          return {
            id: 'step_' + (index + 1),
            type: 'message',
            input: 'none',
            text: '',
            options: []
          };
        }

        function cloneFlowStep(step, index) {
          return Object.assign({}, step || {}, {
            id: (step.id || 'step_' + (index + 1)) + '_copy',
            type: step.type || 'message',
            input: step.input || 'text',
            text: step.text || '',
            options: Array.isArray(step.options) ? step.options.map(function (option) {
              return { label: option.label || '', value: option.value || '' };
            }) : []
          });
        }

        function rerenderFlowsWithMutation(mutator) {
          const flows = cloneJson(getDraftFlows(), []);
          mutator(flows);
          renderFlows(flows);
          renderLivePreview();
          setSectionStatus('flows', 'Є незбережені зміни в flow.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        }

        function openFlowDrawer(mode, flowIndex, stepIndex) {
          state.flowDrawer = {
            open: true,
            mode: mode || 'step',
            flowIndex: Number.isFinite(flowIndex) ? flowIndex : state.selectedFlowIndex,
            stepIndex: Number.isFinite(stepIndex) ? stepIndex : state.selectedFlowStepIndex
          };
          renderFlowDrawer();
        }

        function closeFlowDrawer() {
          state.flowDrawer.open = false;
          if (flowStepDrawerEl) flowStepDrawerEl.hidden = true;
          if (flowStepDrawerBackdropEl) flowStepDrawerBackdropEl.hidden = true;
        }

        function createFlowDrawerOptionRow(option) {
          return '<div class="flow-drawer-option-row">' +
            '<div class="flow-drawer-option-head">' +
              '<div class="flow-drawer-option-title">' +
                '<strong>Option</strong>' +
                '<small>Що побачить клієнт і що буде збережено після кліку.</small>' +
              '</div>' +
              '<button type="button" class="flow-icon-btn danger" data-drawer-remove-option="true">Delete</button>' +
            '</div>' +
            '<div class="flow-option-preview">' + escapeHtml(option.label || 'Button text') + '</div>' +
            '<div class="flow-drawer-option-grid' + (state.flowChoiceAdvanced ? ' is-advanced' : '') + '">' +
              '<div class="field">' +
                '<label>Button text</label>' +
                '<input type="text" data-drawer-option-field="label" placeholder="Yes, I have a file" value="' + escapeHtml(option.label || '') + '" />' +
                '<div class="field-help-inline">Що клієнт побачить у кнопці в чаті.</div>' +
              '</div>' +
              (state.flowChoiceAdvanced
                ? '<div class="field">' +
                    '<label>Saved value</label>' +
                    '<input type="text" data-drawer-option-field="value" placeholder="upload_file" value="' + escapeHtml(option.value || '') + '" />' +
                    '<div class="field-help-inline">Внутрішнє значення для flow. Якщо лишити порожнім, згенерується з тексту кнопки.</div>' +
                  '</div>'
                : '<input type="hidden" data-drawer-option-field="value" value="' + escapeHtml(option.value || '') + '" />') +
              '<div class="field">' +
                '<label>Next step</label>' +
                '<select data-drawer-option-next-step="true" disabled></select>' +
                '<div class="field-help-inline">За поточною моделлю всі варіанти choice-кроку ведуть на наступний step у сценарії.</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        }

        function renderFlowDrawer() {
          if (!flowStepDrawerEl || !flowStepDrawerBackdropEl) return;
          if (!state.flowDrawer.open) {
            flowStepDrawerEl.hidden = true;
            flowStepDrawerBackdropEl.hidden = true;
            return;
          }
          const flows = collectFlows();
          const flow = flows[state.flowDrawer.flowIndex] || null;
          if (!flow) {
            closeFlowDrawer();
            return;
          }

          if (state.flowDrawer.mode === 'flow') {
            flowStepDrawerEl.innerHTML =
              '<div class="flow-step-drawer-head">' +
                '<div class="flow-step-drawer-copy">' +
                  '<strong>Edit flow</strong>' +
                  '<small>Керує кнопкою у віджеті та базовими метаданими сценарію.</small>' +
                '</div>' +
                '<button type="button" class="flow-icon-btn" data-close-flow-drawer="true">Close</button>' +
              '</div>' +
              '<div class="flow-step-drawer-body">' +
                '<div class="flow-step-drawer-section">' +
                  '<h4>Flow settings</h4>' +
                  '<div class="flow-step-drawer-grid">' +
                    '<div class="field"><label>Flow title</label><input type="text" data-drawer-flow-field="title" value="' + escapeHtml(flow.title || '') + '" /></div>' +
                    '<div class="field"><label>Button label</label><input type="text" data-drawer-flow-field="buttonLabel" value="' + escapeHtml(flow.buttonLabel || '') + '" /></div>' +
                    '<div class="field"><label>Icon</label><input type="text" data-drawer-flow-field="icon" value="' + escapeHtml(flow.icon || '') + '" /></div>' +
                    '<div class="field"><label>Slug</label><input type="text" data-drawer-flow-field="slug" value="' + escapeHtml(flow.slug || flow.id || '') + '" /></div>' +
                    '<div class="field"><label>Show in widget</label><select data-drawer-flow-field="showInWidget"><option value="true"' + (flow.showInWidget !== false ? ' selected' : '') + '>Shown</option><option value="false"' + (flow.showInWidget === false ? ' selected' : '') + '>Hidden</option></select></div>' +
                    '<div class="field full"><label>Description</label><textarea data-drawer-flow-field="description">' + escapeHtml(flow.description || '') + '</textarea></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="flow-step-drawer-foot">' +
                '<button type="button" class="secondary" data-close-flow-drawer="true">Cancel</button>' +
                '<button type="button" class="primary" data-save-flow-drawer="true">Apply flow</button>' +
              '</div>';
          } else {
            const step = Array.isArray(flow.steps) ? flow.steps[state.flowDrawer.stepIndex] : null;
            if (!step) {
              closeFlowDrawer();
              return;
            }
            const options = Array.isArray(step.options) ? step.options : [];
            const nextStep = flow.steps[state.flowDrawer.stepIndex + 1];
            const showsChoiceOptions = step.type === 'choice' || step.input === 'choice';
            const interactionValue = step.input === 'file'
              ? 'file'
              : ((step.type === 'choice' || step.input === 'choice')
                ? 'choice'
                : (step.input === 'none' ? 'bot' : 'text'));
            flowStepDrawerEl.innerHTML =
              '<div class="flow-step-drawer-head">' +
                '<div class="flow-step-drawer-copy">' +
                  '<strong>Edit message</strong>' +
                  '<small>' + escapeHtml(getHumanStepTitle(step, state.flowDrawer.stepIndex)) + '</small>' +
                '</div>' +
                '<button type="button" class="flow-icon-btn" data-close-flow-drawer="true">Close</button>' +
              '</div>' +
              '<div class="flow-step-drawer-body">' +
                '<div class="flow-step-drawer-section">' +
                  '<h4>Message settings</h4>' +
                  '<div class="flow-step-drawer-grid">' +
                    '<div class="field"><label>Message label</label><input type="text" data-drawer-step-field="id" value="' + escapeHtml(step.id || '') + '" placeholder="name / phone / deadline" /></div>' +
                    '<div class="field"><label>What should the customer do next?</label><select data-drawer-step-field="interaction"><option value="bot"' + (interactionValue === 'bot' ? ' selected' : '') + '>Just read the message</option><option value="text"' + (interactionValue === 'text' ? ' selected' : '') + '>Type a text reply</option><option value="choice"' + (interactionValue === 'choice' ? ' selected' : '') + '>Tap one of the buttons</option><option value="file"' + (interactionValue === 'file' ? ' selected' : '') + '>Upload a file</option></select></div>' +
                    '<div class="field full"><label>Message text</label><textarea data-drawer-step-field="text" placeholder="What should the bot say in this part of the conversation?">' + escapeHtml(step.text || '') + '</textarea></div>' +
                    '<div class="field full"><label>What the customer is expected to do</label><input type="text" data-drawer-step-field="clientHint" value="' + escapeHtml(step.uiClientText || '') + '" placeholder="Optional hint, e.g. Customer types their name" /></div>' +
                  '</div>' +
                '</div>' +
                (showsChoiceOptions
                  ? '<div class="flow-step-drawer-section">' +
                      '<h4>Choice options</h4>' +
                      '<div class="flow-drawer-options">' +
                        '<div class="flow-choice-mode-toggle">' +
                          '<button type="button" class="flow-choice-mode-btn' + (state.flowChoiceAdvanced ? '' : ' active') + '" data-choice-mode="simple">Simple</button>' +
                          '<button type="button" class="flow-choice-mode-btn' + (state.flowChoiceAdvanced ? ' active' : '') + '" data-choice-mode="advanced">Advanced</button>' +
                        '</div>' +
                        '<p class="flow-choice-helper">Simple mode показує тільки текст кнопки і перехід. Advanced mode відкриває internal stored value для сумісності з поточним flow.</p>' +
                        '<div id="flowDrawerOptionsList">' + options.map(createFlowDrawerOptionRow).join('') + '</div>' +
                        '<button type="button" class="secondary" data-drawer-add-option="true">+ Add option</button>' +
                      '</div>' +
                    '</div>'
                  : '') +
                '<div class="flow-step-drawer-section">' +
                  '<h4>Step actions</h4>' +
                  '<div class="flow-drawer-utility">' +
                    '<button type="button" class="flow-icon-btn" data-move-flow-step="up">Move up</button>' +
                    '<button type="button" class="flow-icon-btn" data-move-flow-step="down">Move down</button>' +
                    '<button type="button" class="flow-icon-btn" data-duplicate-flow-step="true">Duplicate</button>' +
                    (nextStep ? '<button type="button" class="flow-icon-btn" data-jump-to-next-step="true">Jump to linked step</button>' : '') +
                    '<button type="button" class="flow-icon-btn danger" data-remove-flow-step="true">Delete step</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="flow-step-drawer-foot">' +
                '<button type="button" class="secondary" data-close-flow-drawer="true">Cancel</button>' +
                '<button type="button" class="primary" data-save-flow-drawer="true">Apply step</button>' +
              '</div>';
          }
          flowStepDrawerEl.hidden = false;
          flowStepDrawerBackdropEl.hidden = false;
          if (state.flowDrawer.mode === 'step') {
            Array.from(flowStepDrawerEl.querySelectorAll('[data-drawer-option-next-step]')).forEach(function (selectEl) {
              const nextLabel = nextStep ? (getHumanStepTitle(nextStep, state.flowDrawer.stepIndex + 1) + ' (' + (nextStep.id || '') + ')') : 'End of flow';
              selectEl.innerHTML = '<option value="' + escapeHtml(nextStep ? (nextStep.id || '') : 'end') + '" selected>' + escapeHtml(nextLabel) + '</option>';
            });
          }
        }

        function createFlowTestState(flow) {
          const session = {
            messages: [],
            activeStepIndex: 0,
            awaiting: null,
            completed: false
          };
          return advanceFlowTest(flow, session, null);
        }

        function advanceFlowTest(flow, session, userMessage) {
          const nextSession = {
            messages: Array.isArray(session && session.messages) ? session.messages.slice() : [],
            activeStepIndex: session && Number.isFinite(session.activeStepIndex) ? session.activeStepIndex : 0,
            awaiting: null,
            completed: false
          };
          if (userMessage) {
            nextSession.messages.push({ role: 'user', text: userMessage });
            nextSession.activeStepIndex += 1;
          }
          while (Array.isArray(flow.steps) && flow.steps[nextSession.activeStepIndex]) {
            const step = flow.steps[nextSession.activeStepIndex];
            if (String(step.text || '').trim()) {
              nextSession.messages.push({ role: 'bot', text: step.text, stepIndex: nextSession.activeStepIndex });
            }
            if (step.input === 'none') {
              nextSession.activeStepIndex += 1;
              continue;
            }
            nextSession.awaiting = step.input || 'text';
            return nextSession;
          }
          nextSession.completed = true;
          nextSession.awaiting = null;
          return nextSession;
        }

        function renderFlowTest() {
          if (!flowTestCanvasEl) return;
          const selected = getSelectedFlow();
          const flow = selected.flow;
          if (!flow) {
            flowTestCanvasEl.innerHTML = '<div class="flow-test-empty">Оберіть flow зі списку, щоб протестувати сценарій.</div>';
            if (resetFlowTestBtn) resetFlowTestBtn.hidden = true;
            return;
          }
          if (!state.flowTestSession) {
            state.flowTestSession = createFlowTestState(flow);
          }
          if (flowTestTitleEl) flowTestTitleEl.textContent = (flow.buttonLabel || flow.title || flow.slug || 'Flow') + ' · Test';
          if (flowTestMetaEl) flowTestMetaEl.textContent = (flow.slug || 'flow') + ' • ' + ((flow.steps || []).length) + ' steps';
          if (resetFlowTestBtn) resetFlowTestBtn.hidden = false;
          const session = state.flowTestSession;
          const messagesHtml = session.messages.map(function (item) {
            return '<div class="flow-test-message ' + escapeHtml(item.role) + '"><div class="flow-test-bubble">' + nl2br(item.text || '') + '</div></div>';
          }).join('');
          const activeStep = Array.isArray(flow.steps) ? flow.steps[session.activeStepIndex] : null;
          let controlsHtml = '';
          if (session.completed) {
            controlsHtml = '<div class="flow-test-hint">Flow завершено. Ви можете скинути тест і пройти сценарій знову.</div>';
          } else if (!activeStep) {
            controlsHtml = '<div class="flow-test-hint">Немає активного кроку для preview.</div>';
          } else if (session.awaiting === 'choice') {
            const options = Array.isArray(activeStep.options) ? activeStep.options : [];
            controlsHtml = '<div class="flow-test-hint">Клікніть варіант відповіді клієнта.</div><div class="flow-test-option-list">' + options.map(function (option, optionIndex) {
              return '<button type="button" class="flow-test-option-btn" data-test-option-index="' + optionIndex + '">' + escapeHtml(option.label || option.value || 'Option') + '</button>';
            }).join('') + '</div>';
          } else if (session.awaiting === 'file') {
            controlsHtml = '<div class="flow-test-hint">Симуляція завантаження файлу клієнтом.</div><div class="flow-test-option-list"><button type="button" class="flow-test-option-btn" data-test-file-upload="true">Upload file</button></div>';
          } else {
            controlsHtml = '<div class="flow-test-hint">Введіть відповідь клієнта, щоб перевірити наступний перехід.</div><div class="flow-test-input-row"><input id="flowTestInput" type="text" placeholder="Наприклад: Василь" /><button type="button" class="flow-test-submit-btn" data-test-submit-text="true">Send</button></div>';
          }
          flowTestCanvasEl.innerHTML =
            '<div class="flow-test-thread">' +
              (messagesHtml || '<div class="flow-test-empty">Натисніть Start flow, щоб відкрити сценарій у чаті.</div>') +
            '</div>' +
            '<div class="flow-test-controls">' + controlsHtml + '</div>';
        }

        function renderFlowWorkspaceMode() {
          const isPreview = state.flowWorkspaceMode === 'preview';
          if (isPreview) {
            closeFlowDrawer();
          }
          if (flowsStructureViewEl) flowsStructureViewEl.hidden = isPreview;
          if (flowsPreviewViewEl) flowsPreviewViewEl.hidden = !isPreview;
          if (toggleFlowTestBtn) {
            toggleFlowTestBtn.textContent = isPreview ? 'Back to editor' : 'Test flow';
          }
          if (flowTestStartBtn) flowTestStartBtn.hidden = !isPreview;
          if (resetFlowTestBtn) resetFlowTestBtn.hidden = !isPreview;
          if (isPreview) {
            renderFlowTest();
          }
        }

        function getFlowActionTemplates() {
          return [
            { key: 'bot_message', label: 'Повідомлення бота' },
            { key: 'client_reply', label: 'Відповідь клієнта' },
            { key: 'free_text', label: 'Текстова відповідь' },
            { key: 'file', label: 'Завантаження файлу' }
          ];
        }

        function createStepFromTemplate(templateKey, indexHint) {
          const nextIndex = Number(indexHint) || 0;
          const templates = {
            bot_message: { id: 'step_' + (nextIndex + 1), type: 'message', input: 'none', text: 'Нове повідомлення бота', options: [] },
            client_reply: { id: 'reply_' + (nextIndex + 1), type: 'message', input: 'text', text: 'Напишіть, будь ласка, вашу відповідь.', options: [], uiClientText: 'Клієнт вводить відповідь' },
            name: { id: 'name', type: 'message', input: 'text', text: 'Як до вас можна звертатись?', options: [], uiClientText: 'Customer types their name' },
            phone: { id: 'phone', type: 'message', input: 'text', text: 'Залиште, будь ласка, номер телефону для зв’язку.', options: [], uiClientText: 'Customer shares a phone number' },
            email: { id: 'email', type: 'message', input: 'text', text: 'На яку email-адресу зручно відправити відповідь?', options: [], uiClientText: 'Customer shares an email' },
            free_text: { id: 'details', type: 'message', input: 'text', text: 'Опишіть, будь ласка, деталі коротко.', options: [], uiClientText: 'Customer types a free text reply' },
            yes_no: { id: 'choice_' + (nextIndex + 1), type: 'choice', input: 'choice', text: 'Оберіть один із варіантів нижче.', options: [{ label: 'Так', value: 'yes' }, { label: 'Ні', value: 'no' }] },
            choice: { id: 'choice_' + (nextIndex + 1), type: 'choice', input: 'choice', text: 'Оберіть один із варіантів нижче.', options: [{ label: 'Варіант 1', value: 'option_1' }, { label: 'Варіант 2', value: 'option_2' }] },
            file: { id: 'file', type: 'message', input: 'file', text: 'Завантажте, будь ласка, файл моделі.', options: [] },
            confirmation: { id: 'done', type: 'message', input: 'none', text: 'Дякуємо. Ми отримали все необхідне і скоро зв’яжемося з вами.', options: [] }
          };
          return normalizeDraftStep(templates[templateKey] || templates.free_text, nextIndex);
        }

        function renderFlowComposerMenus() {
          const flowComposerActionMenuEl = getFlowComposerActionMenuEl();
          if (flowComposerActionMenuEl) {
            flowComposerActionMenuEl.innerHTML = getFlowActionTemplates().map(function (item) {
              return '<button type="button" data-flow-composer-action="' + escapeHtml(item.key) + '">' + escapeHtml(item.label) + '</button>';
            }).join('');
          }
        }

        function closeFlowInlineMenus() {
          const flowComposerActionMenuEl = getFlowComposerActionMenuEl();
          state.flowMenu.open = false;
          state.flowMenu.mode = null;
          if (flowComposerActionMenuEl) flowComposerActionMenuEl.hidden = true;
        }

        function insertFlowStepFromTemplate(flowIndex, stepIndex, templateKey) {
          rerenderFlowsWithMutation(function (flows) {
            const flow = flows[flowIndex];
            if (!flow) return;
            if (!Array.isArray(flow.steps)) flow.steps = [];
            const insertIndex = Number.isFinite(stepIndex) ? stepIndex + 1 : flow.steps.length;
            flow.steps.splice(insertIndex, 0, createStepFromTemplate(templateKey, insertIndex));
            state.selectedFlowStepIndex = insertIndex;
            state.flowMenu = { open: false, mode: null, stepIndex: null };
            state.flowTestSession = null;
          });
          setSectionStatus('flows', 'Block inserted into the scenario. Review it and save when ready.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        }

        function createOperatorQuickReplyRow(item) {
          return '<div class="quick-action-row operator-reply-row">' +
            '<div class="quick-reply-copy">' +
              '<input class="quick-reply-input" type="text" data-oqr-field="text" placeholder="Швидка відповідь для оператора" value="' + escapeHtml(item.text || '') + '" />' +
            '</div>' +
            '<div class="quick-reply-actions">' +
              '<button type="button" class="quick-reply-icon-btn" data-move-operator-quick-reply="up" aria-label="Підняти вище" title="Підняти вище">↑</button>' +
              '<button type="button" class="quick-reply-icon-btn" data-move-operator-quick-reply="down" aria-label="Опустити нижче" title="Опустити нижче">↓</button>' +
              '<button type="button" class="quick-reply-icon-btn danger" data-remove-operator-quick-reply="true" aria-label="Видалити" title="Видалити">×</button>' +
            '</div>' +
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
          state.selectedFlowIndex = Math.min(state.selectedFlowIndex, Math.max(0, (settings.flows || []).length - 1));
          state.selectedFlowStepIndex = 0;
          state.flowTestSession = null;
          state.flowDrawer.open = false;
          closeInlineFlowEditor();
          state.flowAi.open = false;
          state.flowAi.generating = false;
          state.flowAi.error = '';
          state.flowAi.model = '';
          state.flowAi.draft = null;
          state.flowAi.previewMode = 'structure';
          state.flowAi.testSession = null;
          state.flowAi.language = settings.aiAssistant?.defaultLanguage || 'uk';
          state.flowAi.tone = settings.aiAssistant?.tone || 'Friendly and professional';
          state.flowAi.goal = '';
          state.flowAi.template = '';
          if (!String(state.flowAi.prompt || '').trim()) {
            state.flowAi.prompt = '';
          }
          siteTitleEl.textContent = settings.title || settings.siteId;
          fields.title.value = settings.title || '';
          fields.avatarUrl.value = settings.avatarUrl || '';
          fields.managerName.value = settings.managerName || '';
          fields.managerTitle.value = settings.managerTitle || settings.operatorMetaLabel || '';
          fields.managerAvatarUrl.value = settings.managerAvatarUrl || '';
          fields.welcomeMessage.value = settings.welcomeMessage || '';
          fields.welcomeIntroLabel.value = settings.welcomeIntroLabel || '';
          fields.operatorFallbackEnabled.value = settings.operatorFallback?.enabled === true ? 'true' : 'false';
          fields.operatorFallbackDelay.value = String(settings.operatorFallback?.delaySeconds ?? 30);
          fields.operatorFallbackMessage.value = settings.operatorFallback?.message || 'Оператори зараз зайняті, але ми на зв’язку. Залишайтесь у чаті, і ми відповімо вам якнайшвидше.';
          fields.availabilityMode.value = settings.availability?.mode || 'always_online';
          state.availabilityDraft = {
            manualStatus: settings.availability?.manualStatus || 'online'
          };
          state.workingHoursDraft = {
            enabled: settings.workingHours?.enabled === false ? false : true,
            timezone: settings.workingHours?.timezone || 'America/New_York',
            days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].reduce(function (acc, day) {
              const data = settings.workingHours?.days && settings.workingHours.days[day] ? settings.workingHours.days[day] : null;
              acc[day] = {
                enabled: data ? Boolean(data.enabled) : !['sat', 'sun'].includes(day),
                start: data && data.start ? data.start : '09:00',
                end: data && data.end ? data.end : '18:00'
              };
              return acc;
            }, {})
          };
          renderAvailabilityDetails();
          fields.languageDefault.value = settings.language?.default || 'uk';
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
          renderFlows(settings.flows || []);
          renderFlowComposerMenus();
          renderOperatorQuickReplies(settings.operatorQuickReplies || []);
          renderOperators(settings.operators || []);
          closeFlowAiModal();
          syncColorControl('primary', '#f78c2f');
          syncColorControl('headerBg', '#131926');
          syncColorControl('bubbleBg', '#ffffff');
          syncColorControl('textColor', '#1f2734');
          renderLivePreview();
          resetSectionStatuses();
          if (flowSearchInput) {
            flowSearchInput.value = state.flowSearchQuery || '';
          }
          const currentOpen = document.querySelector('.settings-section.is-open');
          setActiveSection(currentOpen ? (currentOpen.getAttribute('data-section') || 'general') : 'general');
        }

        function collectFlows() {
          return getDraftFlows().map(function (flow, flowIndex) {
            const safeFlow = normalizeDraftFlow(flow, flowIndex);
            return {
              id: safeFlow.slug || safeFlow.id || ('flow_' + (flowIndex + 1)),
              slug: safeFlow.slug || safeFlow.id || ('flow_' + (flowIndex + 1)),
              title: safeFlow.title || safeFlow.buttonLabel || ('flow_' + (flowIndex + 1)),
              buttonLabel: safeFlow.buttonLabel || safeFlow.title || ('flow_' + (flowIndex + 1)),
              icon: safeFlow.icon || '💬',
              showInWidget: safeFlow.showInWidget !== false,
              description: safeFlow.description || '',
              steps: (Array.isArray(safeFlow.steps) ? safeFlow.steps : []).map(function (step, index) {
                const safeStep = normalizeDraftStep(step, index);
                return {
                  id: safeStep.id || ('step_' + (index + 1)),
                  type: safeStep.type === 'choice' ? 'choice' : 'message',
                  input: ['text', 'choice', 'file', 'none'].includes(safeStep.input) ? safeStep.input : 'text',
                  text: safeStep.text || '',
                  uiClientText: safeStep.uiClientText || '',
                  options: (Array.isArray(safeStep.options) ? safeStep.options : []).map(function (option) {
                    const label = String(option && option.label || '').trim();
                    const value = String(option && option.value || '').trim() || getChoiceOptionValue(label);
                    return { label: label, value: value };
                  }).filter(function (option) {
                    return option.label;
                  })
                };
              }).filter(function (step) {
                return step.id || String(step.text || '').trim() || (Array.isArray(step.options) && step.options.length) || step.input === 'none';
              })
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
          if (payload.activeSiteId) {
            state.selectedSiteId = payload.activeSiteId;
          }
          if (!state.selectedSiteId && state.sites.length) {
            state.selectedSiteId = state.sites[0].siteId;
          }
          renderSiteManager();
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
          renderSiteManager();
          fillForm(payload.settings);
          await loadInstallPayload(siteId);
        }

        async function loadInstallPayload(siteId) {
          const payload = await fetchJson('/api/admin/sites/' + encodeURIComponent(siteId) + '/install');
          state.installPayload = payload.install || null;
          state.installSnippetCopied = false;
          state.installInstructionsCopied = false;
          state.installWidgetKeyVisible = false;
          renderInstallPayload();
        }

        async function createSite() {
          const name = newSiteNameInput ? newSiteNameInput.value.trim() : '';
          const domain = newSiteDomainInput ? newSiteDomainInput.value.trim() : '';
          if (!name) {
            setSitesManagerStatus('Enter a site name first.', false);
            return;
          }
          const payload = await fetchJson('/api/admin/sites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, domain: domain })
          });
          if (newSiteNameInput) newSiteNameInput.value = '';
          if (newSiteDomainInput) newSiteDomainInput.value = '';
          setSitesManagerStatus('Site created.', true);
          state.selectedSiteId = payload.activeSiteId || payload.site?.siteId || state.selectedSiteId;
          await loadSites();
        }

        async function selectSite(siteId) {
          const payload = await fetchJson('/api/admin/sites/' + encodeURIComponent(siteId) + '/select', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          state.selectedSiteId = payload.activeSiteId || siteId;
          setSitesManagerStatus('Active site changed.', true);
          await loadSites();
        }

        async function saveSiteMeta(siteId) {
          const row = document.querySelector('[data-site-row="' + escapeSelectorValue(siteId) + '"]');
          if (!row) return;
          const nameInput = row.querySelector('[data-site-field="name"]');
          const domainInput = row.querySelector('[data-site-field="domain"]');
          const activeInput = row.querySelector('[data-site-field="is_active"]');
          await fetchJson('/api/admin/sites/' + encodeURIComponent(siteId), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: nameInput ? nameInput.value.trim() : '',
              domain: domainInput ? domainInput.value.trim() : '',
              isActive: activeInput ? activeInput.value === '1' : true
            })
          });
          setSitesManagerStatus('Site updated.', true);
          await loadSites();
        }

        async function regenerateSiteWidgetKey(siteId) {
          await fetchJson('/api/admin/sites/' + encodeURIComponent(siteId) + '/regenerate-widget-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          setSitesManagerStatus('Widget key regenerated.', true);
          await loadSites();
        }

        async function addSiteDomain(siteId) {
          const input = document.querySelector('[data-site-domain-input="' + escapeSelectorValue(siteId) + '"]');
          const primary = document.querySelector('[data-site-domain-primary="' + escapeSelectorValue(siteId) + '"]');
          const domain = input ? input.value.trim() : '';
          if (!domain) {
            setSitesManagerStatus('Enter a domain first.', false);
            return;
          }
          await fetchJson('/api/admin/sites/' + encodeURIComponent(siteId) + '/domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: domain,
              isPrimary: primary ? primary.value === '1' : false
            })
          });
          if (input) input.value = '';
          if (primary) primary.value = '0';
          setSitesManagerStatus('Domain added.', true);
          await loadSites();
        }

        async function deleteSiteDomain(siteId, domainId) {
          await fetchJson('/api/admin/sites/' + encodeURIComponent(siteId) + '/domains/' + encodeURIComponent(domainId), {
            method: 'DELETE'
          });
          setSitesManagerStatus('Domain removed.', true);
          await loadSites();
        }

        settingsCategoryNav.addEventListener('click', function (event) {
          const button = event.target.closest('[data-settings-nav]');
          if (!button) return;
          if ((button.getAttribute('data-settings-nav') || '') === 'flows') {
            state.previewMode = 'flow';
          }
          setActiveSection(button.getAttribute('data-settings-nav') || 'general');
        });

        if (createSiteBtn) {
          createSiteBtn.addEventListener('click', function () {
            createSite().catch(function (error) {
              setSitesManagerStatus(error.message || 'Failed to create site.', false);
            });
          });
        }

        if (copyInstallSnippetBtn) {
          copyInstallSnippetBtn.addEventListener('click', function () {
            const snippet = state.installPayload && state.installPayload.install ? state.installPayload.install.snippet : '';
            copyToClipboard(snippet).then(function () {
              state.installSnippetCopied = true;
              renderInstallPayload();
              flashButtonLabel(copyInstallSnippetBtn, 'Copied');
              setSectionStatus('install', 'Install snippet copied.', true);
            }).catch(function () {
              setSectionStatus('install', 'Failed to copy install snippet.', false);
            });
          });
        }

        if (copyWidgetKeyBtn) {
          copyWidgetKeyBtn.addEventListener('click', function () {
            const widgetKey = state.installPayload && state.installPayload.site ? state.installPayload.site.widgetKey : '';
            copyToClipboard(widgetKey).then(function () {
              flashButtonLabel(copyWidgetKeyBtn, 'Copied');
              setSectionStatus('install', 'Widget key copied.', true);
            }).catch(function () {
              setSectionStatus('install', 'Failed to copy widget key.', false);
            });
          });
        }

        if (toggleWidgetKeyBtn) {
          toggleWidgetKeyBtn.addEventListener('click', function () {
            state.installWidgetKeyVisible = !state.installWidgetKeyVisible;
            renderInstallPayload();
          });
        }

        if (copyInstallInstructionsBtn) {
          copyInstallInstructionsBtn.addEventListener('click', function () {
            copyToClipboard(buildInstallInstructionsText(state.installPayload && state.installPayload.install)).then(function () {
              state.installInstructionsCopied = true;
              flashButtonLabel(copyInstallInstructionsBtn, 'Copied');
              setSectionStatus('install', 'Install instructions copied.', true);
            }).catch(function () {
              setSectionStatus('install', 'Failed to copy install instructions.', false);
            });
          });
        }

        if (copyDeveloperHandoffBtn) {
          copyDeveloperHandoffBtn.addEventListener('click', function () {
            copyToClipboard(buildDeveloperHandoffText(state.installPayload)).then(function () {
              flashButtonLabel(copyDeveloperHandoffBtn, 'Copied');
              setSectionStatus('install', 'Developer handoff copied.', true);
            }).catch(function () {
              setSectionStatus('install', 'Failed to copy developer handoff.', false);
            });
          });
        }

        if (openWidgetSettingsBtn) {
          openWidgetSettingsBtn.addEventListener('click', function () {
            setActiveSection('general');
            setSectionStatus('general', 'Widget settings are ready for the active site.', true);
          });
        }

        if (manageDomainsBtn) {
          manageDomainsBtn.addEventListener('click', function () {
            setActiveSection('install');
            setSitesManagerStatus('Manage allowed domains in the Sites and domains card below.', true);
            if (installSiteManagerCardEl && typeof installSiteManagerCardEl.scrollIntoView === 'function') {
              installSiteManagerCardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        }

        if (sitesManagerListEl) {
          sitesManagerListEl.addEventListener('click', function (event) {
            const actionButton = event.target.closest('[data-site-action]');
            if (!actionButton) return;
            const action = actionButton.getAttribute('data-site-action') || '';
            const siteId = actionButton.getAttribute('data-site-id') || '';
            const domainId = actionButton.getAttribute('data-domain-id') || '';

            if (action === 'select') {
              selectSite(siteId).catch(function (error) {
                setSitesManagerStatus(error.message || 'Failed to select site.', false);
              });
              return;
            }
            if (action === 'save') {
              saveSiteMeta(siteId).catch(function (error) {
                setSitesManagerStatus(error.message || 'Failed to update site.', false);
              });
              return;
            }
            if (action === 'regenerate') {
              regenerateSiteWidgetKey(siteId).catch(function (error) {
                setSitesManagerStatus(error.message || 'Failed to regenerate widget key.', false);
              });
              return;
            }
            if (action === 'add-domain') {
              addSiteDomain(siteId).catch(function (error) {
                setSitesManagerStatus(error.message || 'Failed to add domain.', false);
              });
              return;
            }
            if (action === 'delete-domain') {
              deleteSiteDomain(siteId, domainId).catch(function (error) {
                setSitesManagerStatus(error.message || 'Failed to remove domain.', false);
              });
            }
          });
        }

        if (toggleFlowTestBtn) {
          toggleFlowTestBtn.addEventListener('click', function () {
            const willPreview = state.flowWorkspaceMode !== 'preview';
            state.flowWorkspaceMode = willPreview ? 'preview' : 'structure';
            if (willPreview) {
              state.flowTestSession = null;
            }
            renderFlowWorkspaceMode();
            syncActiveFlowView();
          });
        }

        if (flowTestStartBtn) {
          flowTestStartBtn.addEventListener('click', function () {
            const selected = getSelectedFlow();
            if (!selected.flow) return;
            state.flowTestSession = createFlowTestState(selected.flow);
            renderFlowTest();
          });
        }

        if (resetFlowTestBtn) {
          resetFlowTestBtn.addEventListener('click', function () {
            const selected = getSelectedFlow();
            if (!selected.flow) return;
            state.flowTestSession = createFlowTestState(selected.flow);
            renderFlowTest();
          });
        }

        if (flowSearchInput) {
          flowSearchInput.addEventListener('input', function () {
            state.flowSearchQuery = flowSearchInput.value || '';
            syncActiveFlowView();
          });
        }

        addFlowBtn.addEventListener('click', function () {
          const flows = cloneJson(getDraftFlows(), []);
          const nextIndex = flows.length + 1;
          flows.push({
            id: 'flow_' + nextIndex,
            slug: 'flow_' + nextIndex,
            title: 'New flow ' + nextIndex,
            buttonLabel: 'New flow ' + nextIndex,
            icon: '💬',
            showInWidget: true,
            description: '',
            steps: [{
              id: 'step_1',
              type: 'message',
              input: 'none',
              text: '',
              options: []
            }]
          });
          state.selectedFlowIndex = flows.length - 1;
          state.selectedFlowStepIndex = 0;
          state.flowTestSession = null;
          renderFlows(flows);
          openFlowDrawer('flow', state.selectedFlowIndex, 0);
          setSectionStatus('flows', 'Новий flow створено і він одразу з’явиться у віджеті. Не забудь зберегти.', false);
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
          if (event.target === fields.availabilityMode) renderAvailabilityDetails();
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

        flowListEl.addEventListener('click', function (event) {
          const menuToggle = event.target.closest('[data-flow-list-menu-toggle]');
          if (menuToggle) {
            event.preventDefault();
            event.stopPropagation();
            const index = Number(menuToggle.getAttribute('data-flow-list-menu-toggle')) || 0;
            state.flowListMenu = {
              open: !(state.flowListMenu.open && state.flowListMenu.index === index),
              index: index
            };
            syncActiveFlowView();
            return;
          }

          const menuAction = event.target.closest('[data-flow-list-action]');
          if (menuAction) {
            event.preventDefault();
            event.stopPropagation();
            const index = Number(menuAction.getAttribute('data-flow-index')) || 0;
            const action = menuAction.getAttribute('data-flow-list-action') || '';
            if (action === 'edit') {
              state.flowListEditor = { index: index };
              state.flowListMenu = { open: false, index: null };
              syncActiveFlowView();
              return;
            }
            if (action === 'duplicate') {
              rerenderFlowsWithMutation(function (flows) {
                const flow = flows[index];
                if (!flow) return;
                const copy = cloneJson(flow, null);
                if (!copy) return;
                copy.id = (flow.id || flow.slug || 'flow') + '_copy';
                copy.slug = slugifyFlowText((flow.slug || flow.title || 'flow') + '_copy', 'flow_copy');
                copy.title = (flow.title || flow.buttonLabel || 'Flow') + ' Copy';
                copy.buttonLabel = copy.title;
                flows.splice(index + 1, 0, normalizeDraftFlow(copy, index + 1));
                state.selectedFlowIndex = index + 1;
                state.flowListMenu = { open: false, index: null };
              });
              return;
            }
            if (action === 'delete') {
              rerenderFlowsWithMutation(function (flows) {
                if (!flows[index]) return;
                flows.splice(index, 1);
                state.selectedFlowIndex = Math.max(0, Math.min(index, flows.length - 1));
                state.flowListMenu = { open: false, index: null };
                state.flowListEditor = { index: null };
              });
              return;
            }
          }

          const button = event.target.closest('[data-flow-list-item]');
          if (!button) return;
          state.selectedFlowIndex = Number(button.getAttribute('data-flow-index')) || 0;
          state.selectedFlowStepIndex = 0;
          state.flowTestSession = null;
          state.flowListMenu = { open: false, index: null };
          closeFlowInlineMenus();
          closeFlowDrawer();
          syncActiveFlowView();
          renderLivePreview();
        });

        flowListEl.addEventListener('input', function (event) {
          const field = event.target.closest('[data-flow-list-edit-field]');
          if (!field) return;
          const index = Number(field.getAttribute('data-flow-index')) || 0;
          const kind = field.getAttribute('data-flow-list-edit-field') || '';
          const flow = getDraftFlows()[index];
          if (!flow) return;
          if (kind === 'title') {
            flow.title = field.value || '';
            if (!String(flow.buttonLabel || '').trim()) {
              flow.buttonLabel = flow.title;
            }
          } else if (kind === 'icon') {
            flow.icon = field.value || '';
          }
          if (index === state.selectedFlowIndex && selectedFlowTitleEl) {
            const primaryTitle = flow.title || flow.buttonLabel || flow.slug || 'Flow conversation';
            const secondaryTitle = flow.buttonLabel && flow.buttonLabel !== primaryTitle ? flow.buttonLabel : '';
            selectedFlowTitleEl.textContent = primaryTitle + (secondaryTitle ? ': ' + secondaryTitle : '');
          }
          renderLivePreview();
          setSectionStatus('flows', 'Є незбережені зміни в flow.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        if (flowTitleMenuBtn) {
          flowTitleMenuBtn.addEventListener('click', function () {
            state.flowHeaderMenuOpen = !state.flowHeaderMenuOpen;
            renderFlowHeaderMenu();
          });
        }

        function handleFlowComposerSend() {
          const flowComposerInputEl = getFlowComposerInputEl();
          const text = flowComposerInputEl ? flowComposerInputEl.value.trim() : '';
          if (!text) return;
          rerenderFlowsWithMutation(function (flows) {
            const flow = flows[state.selectedFlowIndex];
            if (!flow) return;
            if (!Array.isArray(flow.steps)) flow.steps = [];
            const hasComposerTarget = Number.isFinite(state.flowComposer.insertAfter) && state.flowComposer.insertAfter >= -1 && state.flowComposer.insertAfter < flow.steps.length;
            const hasSelectedStep = Number.isFinite(state.selectedFlowStepIndex) && state.selectedFlowStepIndex >= 0 && state.selectedFlowStepIndex < flow.steps.length;
            const insertIndex = hasComposerTarget
              ? state.flowComposer.insertAfter + 1
              : (hasSelectedStep ? state.selectedFlowStepIndex + 1 : flow.steps.length);
            flow.steps.splice(insertIndex, 0, normalizeDraftStep({
              id: slugifyFlowText(text, 'step_' + (insertIndex + 1)),
              type: 'message',
              input: 'none',
              text: text,
              options: []
            }, insertIndex));
            state.selectedFlowStepIndex = insertIndex;
            state.flowComposer.insertAfter = null;
            state.flowMenu = { open: false, mode: null, stepIndex: null };
            state.flowTestSession = null;
          });
          if (flowComposerInputEl) flowComposerInputEl.value = '';
          closeFlowInlineMenus();
        }

        flowScenariosListEl.addEventListener('click', function (event) {
          const activeRow = event.target.closest('[data-flow-scenario-row]');
          if (!activeRow) return;
          const flowIndex = Number(activeRow.getAttribute('data-flow-index')) || 0;
          state.selectedFlowIndex = flowIndex;
          const flowComposerActionMenuEl = getFlowComposerActionMenuEl();
          const stepRow = event.target.closest('[data-flow-chat-step]');
          if (stepRow) {
            state.selectedFlowStepIndex = Number(stepRow.getAttribute('data-step-index')) || 0;
          }

          const composerSendBtn = event.target.closest('#flowComposerSendBtn');
          if (composerSendBtn) {
            handleFlowComposerSend();
            return;
          }

          const composerAttachBtn = event.target.closest('#flowComposerAttachBtn');
          if (composerAttachBtn) {
            renderFlowComposerMenus();
            if (flowComposerActionMenuEl) flowComposerActionMenuEl.hidden = !flowComposerActionMenuEl.hidden;
            return;
          }

          const composerActionItem = event.target.closest('[data-flow-composer-action]');
          if (composerActionItem) {
            const templateKey = composerActionItem.getAttribute('data-flow-composer-action') || 'free_text';
            insertFlowStepFromTemplate(state.selectedFlowIndex, Number.isFinite(state.selectedFlowStepIndex) ? state.selectedFlowStepIndex : (getDraftFlows()[state.selectedFlowIndex]?.steps || []).length - 1, templateKey);
            closeFlowInlineMenus();
            return;
          }

          const openMenuButton = event.target.closest('[data-open-flow-step-menu]');
          if (openMenuButton) {
            const stepIndex = Number(openMenuButton.getAttribute('data-step-index')) || 0;
            state.selectedFlowStepIndex = stepIndex;
            state.flowMenu = {
              open: !(state.flowMenu.open && state.flowMenu.mode === 'actions' && state.flowMenu.stepIndex === stepIndex),
              mode: 'actions',
              stepIndex: stepIndex
            };
            syncActiveFlowView();
            return;
          }

          const inlineOpenButton = event.target.closest('[data-flow-inline-open]');
          if (inlineOpenButton) {
            const stepIndex = Number(inlineOpenButton.getAttribute('data-flow-inline-open')) || 0;
            state.selectedFlowStepIndex = stepIndex;
            openInlineFlowEditor(stepIndex);
            state.flowMenu = { open: false, mode: null, stepIndex: null };
            syncActiveFlowView();
            focusInlineFlowEditor(stepIndex);
            return;
          }

          const addBelowButton = event.target.closest('[data-flow-add-below]');
          if (addBelowButton) {
            const stepIndex = Number(addBelowButton.getAttribute('data-flow-add-below')) || 0;
            state.flowMenu = {
              open: !(state.flowMenu.open && state.flowMenu.mode === 'insert-message' && state.flowMenu.stepIndex === stepIndex),
              mode: 'insert-message',
              stepIndex: stepIndex
            };
            syncActiveFlowView();
            return;
          }

          const stepMenuAction = event.target.closest('[data-flow-step-menu-action]');
          if (stepMenuAction) {
            const action = stepMenuAction.getAttribute('data-flow-step-menu-action') || '';
            const stepIndex = Number(stepMenuAction.getAttribute('data-step-index')) || 0;
            state.selectedFlowStepIndex = stepIndex;
            if (action === 'add-below') {
              state.flowMenu = { open: true, mode: 'insert-message', stepIndex: stepIndex };
              syncActiveFlowView();
              return;
            }
            if (action === 'add-action') {
              state.flowMenu = { open: true, mode: 'insert-action', stepIndex: stepIndex };
              syncActiveFlowView();
              return;
            }
            if (action === 'delete') {
              rerenderFlowsWithMutation(function (flows) {
                const flow = flows[flowIndex];
                if (!flow || !Array.isArray(flow.steps)) return;
                flow.steps.splice(stepIndex, 1);
                state.selectedFlowStepIndex = Math.max(0, Math.min(stepIndex, flow.steps.length - 1));
                state.flowMenu = { open: false, mode: null, stepIndex: null };
                state.flowTestSession = null;
              });
              closeFlowDrawer();
              return;
            }
          }

          const inlineSaveButton = event.target.closest('[data-flow-inline-save]');
          if (inlineSaveButton) {
            saveInlineFlowEditor();
            return;
          }

          const clientHintAiButton = event.target.closest('[data-flow-client-hint-ai]');
          if (clientHintAiButton) {
            const stepIndex = Number(clientHintAiButton.getAttribute('data-flow-client-hint-ai')) || 0;
            if (state.flowClientHintBusyStep === stepIndex) return;
            state.selectedFlowStepIndex = stepIndex;
            openFlowClientHintEditor(stepIndex);
            state.flowClientHintBusyStep = stepIndex;
            syncActiveFlowView();
            Promise.resolve(fetchFlowAssistText('predict_client', stepIndex)).then(function (text) {
              if (!text) return;
              state.flowClientHintEditor = { stepIndex: stepIndex, draft: text };
              rerenderFlowsWithMutation(function (flows) {
                const flow = flows[state.selectedFlowIndex];
                const step = flow && flow.steps ? flow.steps[stepIndex] : null;
                if (!step) return;
                step.input = step.input === 'none' ? 'text' : step.input;
                step.uiClientText = text;
              });
            }).finally(function () {
              state.flowClientHintBusyStep = null;
              syncActiveFlowView();
            });
            return;
          }

          const inlineCancelButton = event.target.closest('[data-flow-inline-cancel]');
          if (inlineCancelButton) {
            closeInlineFlowEditor();
            syncActiveFlowView();
            return;
          }

          const inlineRewriteButton = event.target.closest('[data-flow-inline-rewrite]');
          if (inlineRewriteButton) {
            const stepIndex = Number(inlineRewriteButton.getAttribute('data-flow-inline-rewrite')) || 0;
            if (state.flowInlineEditor.busy) return;
            state.flowInlineEditor.busy = true;
            syncActiveFlowView();
            Promise.resolve(fetchFlowAssistText('rewrite', stepIndex)).then(function (text) {
              if (!text) return;
              state.flowInlineEditor.draft = text;
            }).finally(function () {
              state.flowInlineEditor.busy = false;
              syncActiveFlowView();
              focusInlineFlowEditor(stepIndex);
            });
            return;
          }

          const insertAction = event.target.closest('[data-flow-insert-action]');
          if (insertAction) {
            const templateKey = insertAction.getAttribute('data-flow-insert-action') || 'free_text';
            const stepIndex = Number(insertAction.getAttribute('data-step-index')) || 0;
            insertFlowStepFromTemplate(flowIndex, stepIndex, templateKey);
            syncActiveFlowView();
            return;
          }

          if (event.target.closest('.flow-chat-placeholder')) {
            return;
          }

          if (stepRow && !event.target.closest('button') && !event.target.closest('.flow-inline-editor') && !event.target.closest('.flow-chat-placeholder')) {
            state.flowMenu = { open: false, mode: null, stepIndex: null };
            syncActiveFlowView();
            return;
          }

          syncActiveFlowView();
          renderLivePreview();
        });

        flowScenariosListEl.addEventListener('keydown', function (event) {
          const composerInput = event.target.closest('#flowComposerInput');
          if (!composerInput) return;
          if (event.key === 'Enter') {
            event.preventDefault();
            handleFlowComposerSend();
          }
        });

        flowScenariosListEl.addEventListener('focusin', function (event) {
          const clientHintField = event.target.closest('[data-flow-client-hint-input]');
          if (!clientHintField) return;
          const stepIndex = Number(clientHintField.getAttribute('data-flow-client-hint-input')) || 0;
          if (state.flowClientHintEditor.stepIndex === stepIndex) return;
          openFlowClientHintEditor(stepIndex);
        });

        flowScenariosListEl.addEventListener('input', function (event) {
          const field = event.target.closest('[data-flow-inline-input]');
          if (field) {
            state.flowInlineEditor.draft = field.value || '';
            return;
          }
          const clientHintField = event.target.closest('[data-flow-client-hint-input]');
          if (!clientHintField) return;
          const stepIndex = Number(clientHintField.getAttribute('data-flow-client-hint-input')) || 0;
          const flow = getDraftFlows()[state.selectedFlowIndex];
          const step = flow && flow.steps ? flow.steps[stepIndex] : null;
          if (!step) return;
          const nextDraft = clientHintField.value || '';
          state.flowClientHintEditor = { stepIndex: stepIndex, draft: nextDraft };
          step.uiClientText = nextDraft;
          state.selectedFlowStepIndex = stepIndex;
          setSectionStatus('flows', 'Є незбережені зміни в flow.', false);
          setGlobalStatus('Є незбережені зміни.', false);
        });

        if (flowHeaderMenuEl) {
          flowHeaderMenuEl.addEventListener('input', function (event) {
            const field = event.target.closest('[data-flow-header-field]');
            if (!field) return;
            const kind = field.getAttribute('data-flow-header-field') || '';
            const value = field.value || '';
            const flow = getDraftFlows()[state.selectedFlowIndex];
            if (!flow) return;
            if (kind === 'title') {
              flow.title = value;
              if (!String(flow.buttonLabel || '').trim()) {
                flow.buttonLabel = value;
              }
            } else if (kind === 'icon') {
              flow.icon = value;
            }
            if (selectedFlowTitleEl) {
              const primaryTitle = flow.title || flow.buttonLabel || flow.slug || 'Flow conversation';
              const secondaryTitle = flow.buttonLabel && flow.buttonLabel !== primaryTitle ? flow.buttonLabel : '';
              selectedFlowTitleEl.textContent = primaryTitle + (secondaryTitle ? ': ' + secondaryTitle : '');
            }
            const activeListItem = flowListEl.querySelector('[data-flow-list-item][data-flow-index="' + state.selectedFlowIndex + '"]');
            if (activeListItem) {
              const titleEl = activeListItem.querySelector('strong');
              const metaEl = activeListItem.querySelector('span');
              if (titleEl) {
                titleEl.textContent = ((flow.icon || '') ? (flow.icon + ' ') : '') + (flow.buttonLabel || flow.title || flow.slug || 'Без назви');
              }
              if (metaEl) {
                const stepsCount = Array.isArray(flow.steps) ? flow.steps.length : 0;
                metaEl.textContent = (flow.slug || flow.id || 'flow') + ' • ' + stepsCount + ' messages' + (flow.showInWidget === false ? ' • hidden' : '');
              }
            }
            renderLivePreview();
            setSectionStatus('flows', 'Є незбережені зміни в flow.', false);
            setGlobalStatus('Є незбережені зміни.', false);
          });
        }

        if (flowStepDrawerEl) {
          flowStepDrawerEl.addEventListener('click', function (event) {
            if (event.target.closest('[data-close-flow-drawer]')) {
              closeFlowDrawer();
              return;
            }

            const choiceModeButton = event.target.closest('[data-choice-mode]');
            if (choiceModeButton) {
              state.flowChoiceAdvanced = choiceModeButton.getAttribute('data-choice-mode') === 'advanced';
              renderFlowDrawer();
              return;
            }

            if (event.target.closest('[data-drawer-add-option]')) {
              const list = flowStepDrawerEl.querySelector('#flowDrawerOptionsList');
              if (list) {
                list.insertAdjacentHTML('beforeend', createFlowDrawerOptionRow({ label: '', value: '' }));
                const flows = collectFlows();
                const flow = flows[state.flowDrawer.flowIndex];
                const nextStep = flow && flow.steps ? flow.steps[state.flowDrawer.stepIndex + 1] : null;
                const lastSelect = list.lastElementChild && list.lastElementChild.querySelector('[data-drawer-option-next-step]');
                if (lastSelect) {
                  lastSelect.innerHTML = '<option value="' + escapeHtml(nextStep ? (nextStep.id || '') : 'end') + '" selected>' + escapeHtml(nextStep ? (getHumanStepTitle(nextStep, state.flowDrawer.stepIndex + 1) + ' (' + (nextStep.id || '') + ')') : 'End of flow') + '</option>';
                }
              }
              return;
            }

            const removeOptionButton = event.target.closest('[data-drawer-remove-option]');
            if (removeOptionButton) {
              const row = removeOptionButton.closest('.flow-drawer-option-row');
              if (row) row.remove();
              return;
            }

            if (event.target.closest('[data-jump-to-next-step]')) {
              const flows = collectFlows();
              const flow = flows[state.flowDrawer.flowIndex];
              if (!flow) return;
              state.selectedFlowStepIndex = Math.min((flow.steps || []).length - 1, state.flowDrawer.stepIndex + 1);
              openFlowDrawer('step', state.flowDrawer.flowIndex, state.selectedFlowStepIndex);
              syncActiveFlowView();
              return;
            }

            const moveStepButton = event.target.closest('[data-move-flow-step]');
            if (moveStepButton) {
              const direction = moveStepButton.getAttribute('data-move-flow-step');
              rerenderFlowsWithMutation(function (flows) {
                const flow = flows[state.flowDrawer.flowIndex];
                if (!flow) return;
                const stepIndex = state.flowDrawer.stepIndex;
                if (direction === 'up' && stepIndex > 0) {
                  const moved = flow.steps.splice(stepIndex, 1)[0];
                  flow.steps.splice(stepIndex - 1, 0, moved);
                  state.selectedFlowStepIndex = stepIndex - 1;
                  state.flowDrawer.stepIndex = stepIndex - 1;
                }
                if (direction === 'down' && stepIndex < flow.steps.length - 1) {
                  const moved = flow.steps.splice(stepIndex, 1)[0];
                  flow.steps.splice(stepIndex + 1, 0, moved);
                  state.selectedFlowStepIndex = stepIndex + 1;
                  state.flowDrawer.stepIndex = stepIndex + 1;
                }
                state.flowTestSession = null;
              });
              openFlowDrawer('step', state.flowDrawer.flowIndex, state.flowDrawer.stepIndex);
              return;
            }

            if (event.target.closest('[data-duplicate-flow-step]')) {
              rerenderFlowsWithMutation(function (flows) {
                const flow = flows[state.flowDrawer.flowIndex];
                if (!flow) return;
                flow.steps.splice(state.flowDrawer.stepIndex + 1, 0, cloneFlowStep(flow.steps[state.flowDrawer.stepIndex], state.flowDrawer.stepIndex + 1));
                state.selectedFlowStepIndex = state.flowDrawer.stepIndex + 1;
                state.flowDrawer.stepIndex = state.flowDrawer.stepIndex + 1;
                state.flowTestSession = null;
              });
              openFlowDrawer('step', state.flowDrawer.flowIndex, state.flowDrawer.stepIndex);
              return;
            }

            if (event.target.closest('[data-remove-flow-step]')) {
              rerenderFlowsWithMutation(function (flows) {
                const flow = flows[state.flowDrawer.flowIndex];
                if (!flow) return;
                flow.steps.splice(state.flowDrawer.stepIndex, 1);
                state.selectedFlowStepIndex = Math.max(0, Math.min(state.flowDrawer.stepIndex, flow.steps.length - 1));
                state.flowTestSession = null;
              });
              closeFlowDrawer();
              return;
            }

            if (event.target.closest('[data-save-flow-drawer]')) {
              if (state.flowDrawer.mode === 'flow') {
                rerenderFlowsWithMutation(function (flows) {
                  const flow = flows[state.flowDrawer.flowIndex];
                  if (!flow) return;
                  flow.title = flowStepDrawerEl.querySelector('[data-drawer-flow-field="title"]').value.trim();
                  flow.buttonLabel = flowStepDrawerEl.querySelector('[data-drawer-flow-field="buttonLabel"]').value.trim();
                  flow.icon = flowStepDrawerEl.querySelector('[data-drawer-flow-field="icon"]').value.trim();
                  flow.slug = flowStepDrawerEl.querySelector('[data-drawer-flow-field="slug"]').value.trim() || flow.slug;
                  flow.id = flow.slug;
                  flow.showInWidget = flowStepDrawerEl.querySelector('[data-drawer-flow-field="showInWidget"]').value === 'true';
                  flow.description = flowStepDrawerEl.querySelector('[data-drawer-flow-field="description"]').value.trim();
                  state.flowTestSession = null;
                });
              } else {
                rerenderFlowsWithMutation(function (flows) {
                  const flow = flows[state.flowDrawer.flowIndex];
                  const step = flow && flow.steps ? flow.steps[state.flowDrawer.stepIndex] : null;
                  if (!step) return;
                  const interactionField = flowStepDrawerEl.querySelector('[data-drawer-step-field="interaction"]');
                  const interaction = interactionField ? interactionField.value : 'text';
                  step.id = flowStepDrawerEl.querySelector('[data-drawer-step-field="id"]').value.trim() || step.id;
                  step.type = interaction === 'choice' ? 'choice' : 'message';
                  step.input = interaction === 'bot' ? 'none' : interaction;
                  step.text = flowStepDrawerEl.querySelector('[data-drawer-step-field="text"]').value;
                  step.uiClientText = flowStepDrawerEl.querySelector('[data-drawer-step-field="clientHint"]').value.trim();
                  step.options = Array.from(flowStepDrawerEl.querySelectorAll('.flow-drawer-option-row')).map(function (row) {
                    const labelValue = row.querySelector('[data-drawer-option-field="label"]').value.trim();
                    const rawValue = row.querySelector('[data-drawer-option-field="value"]').value.trim();
                    return {
                      label: labelValue,
                      value: rawValue || labelValue.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, '_').replace(/^_+|_+$/g, '')
                    };
                  }).filter(function (item) {
                    return item.label;
                  });
                  state.selectedFlowStepIndex = state.flowDrawer.stepIndex;
                  state.flowTestSession = null;
                });
              }
              closeFlowDrawer();
            }
          });
        }

        if (flowStepDrawerBackdropEl) {
          flowStepDrawerBackdropEl.addEventListener('click', closeFlowDrawer);
        }

        if (generateFlowAiBtn) {
          generateFlowAiBtn.addEventListener('click', function () {
            openFlowAiModal();
          });
        }

        if (flowAiModalBackdropEl) {
          flowAiModalBackdropEl.addEventListener('click', closeFlowAiModal);
        }

        if (flowAiModalEl) {
          flowAiModalEl.addEventListener('click', function (event) {
            if (event.target.closest('[data-close-flow-ai]')) {
              closeFlowAiModal();
              return;
            }
            const templateBtn = event.target.closest('[data-ai-template]');
            if (templateBtn) {
              captureFlowAiModalDraftFields();
              const template = templateBtn.getAttribute('data-ai-template') || '';
              state.flowAi.template = template;
              state.flowAi.prompt = getAiTemplatePrompt(template);
              renderFlowAiModal();
              return;
            }
            const previewModeBtn = event.target.closest('[data-ai-preview-mode]');
            if (previewModeBtn) {
              captureFlowAiModalDraftFields();
              state.flowAi.previewMode = previewModeBtn.getAttribute('data-ai-preview-mode') || 'structure';
              renderFlowAiModal();
              return;
            }
            if (event.target.closest('[data-generate-flow-ai]')) {
              generateFlowAiDraft();
              return;
            }
            if (event.target.closest('[data-regenerate-flow-ai]')) {
              generateFlowAiDraft();
              return;
            }
            if (event.target.closest('[data-apply-flow-ai]')) {
              applyFlowAiDraft();
              return;
            }
            if (event.target.closest('[data-ai-test-upload]')) {
              if (!state.flowAi.draft) return;
              state.flowAi.previewMode = 'chat';
              state.flowAi.testSession = advanceFlowTest(state.flowAi.draft, state.flowAi.testSession || createFlowTestState(state.flowAi.draft), 'Файл моделі завантажено');
              renderFlowAiModal();
              return;
            }
            if (event.target.closest('[data-ai-test-submit]')) {
              if (!state.flowAi.draft) return;
              const input = flowAiModalEl.querySelector('#flowAiTestInput');
              const value = input && input.value.trim() ? input.value.trim() : 'Тестова відповідь';
              state.flowAi.previewMode = 'chat';
              state.flowAi.testSession = advanceFlowTest(state.flowAi.draft, state.flowAi.testSession || createFlowTestState(state.flowAi.draft), value);
              renderFlowAiModal();
              return;
            }
            const optionButton = event.target.closest('[data-ai-test-option]');
            if (optionButton) {
              if (!state.flowAi.draft) return;
              const step = Array.isArray(state.flowAi.draft.steps) ? state.flowAi.draft.steps[(state.flowAi.testSession && state.flowAi.testSession.activeStepIndex) || 0] : null;
              const options = step && Array.isArray(step.options) ? step.options : [];
              const option = options[Number(optionButton.getAttribute('data-ai-test-option')) || 0];
              state.flowAi.previewMode = 'chat';
              state.flowAi.testSession = advanceFlowTest(state.flowAi.draft, state.flowAi.testSession || createFlowTestState(state.flowAi.draft), (option && (option.label || option.value)) || 'Option');
              renderFlowAiModal();
            }
          });
          flowAiModalEl.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter') return;
            const input = event.target.closest('#flowAiTestInput');
            if (!input || !state.flowAi.draft) return;
            event.preventDefault();
            const value = input.value.trim() || 'Тестова відповідь';
            state.flowAi.previewMode = 'chat';
            state.flowAi.testSession = advanceFlowTest(state.flowAi.draft, state.flowAi.testSession || createFlowTestState(state.flowAi.draft), value);
            renderFlowAiModal();
          });
        }

        if (flowStepDrawerEl) {
          flowStepDrawerEl.addEventListener('input', function (event) {
            const labelInput = event.target.closest('[data-drawer-option-field="label"]');
            if (!labelInput) return;
            const row = labelInput.closest('.flow-drawer-option-row');
            const preview = row && row.querySelector('.flow-option-preview');
            if (preview) {
              preview.textContent = labelInput.value.trim() || 'Button text';
            }
          });
        }

        if (flowTestCanvasEl) {
          flowTestCanvasEl.addEventListener('click', function (event) {
            const selected = getSelectedFlow();
            const flow = selected.flow;
            if (!flow) return;
            if (event.target.closest('[data-test-file-upload]')) {
              state.flowTestSession = advanceFlowTest(flow, state.flowTestSession || createFlowTestState(flow), 'Файл моделі завантажено');
              renderFlowTest();
              return;
            }
            const optionButton = event.target.closest('[data-test-option-index]');
            if (optionButton) {
              const step = Array.isArray(flow.steps) ? flow.steps[(state.flowTestSession && state.flowTestSession.activeStepIndex) || 0] : null;
              const options = step && Array.isArray(step.options) ? step.options : [];
              const option = options[Number(optionButton.getAttribute('data-test-option-index')) || 0];
              state.flowTestSession = advanceFlowTest(flow, state.flowTestSession || createFlowTestState(flow), (option && (option.label || option.value)) || 'Option');
              renderFlowTest();
              return;
            }
            if (event.target.closest('[data-test-submit-text]')) {
              const input = flowTestCanvasEl.querySelector('#flowTestInput');
              const value = input && input.value.trim() ? input.value.trim() : 'Тестова відповідь';
              state.flowTestSession = advanceFlowTest(flow, state.flowTestSession || createFlowTestState(flow), value);
              renderFlowTest();
            }
          });
          flowTestCanvasEl.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter') return;
            const input = event.target.closest('#flowTestInput');
            if (!input) return;
            event.preventDefault();
            const selected = getSelectedFlow();
            if (!selected.flow) return;
            const value = input.value.trim() || 'Тестова відповідь';
            state.flowTestSession = advanceFlowTest(selected.flow, state.flowTestSession || createFlowTestState(selected.flow), value);
            renderFlowTest();
          });
        }

        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && state.flowDrawer.open) {
            closeFlowDrawer();
            return;
          }
          if (event.key === 'Escape' && state.flowAi.open) {
            closeFlowAiModal();
          }
        });

        document.addEventListener('click', function (event) {
          if (!event.target.closest('[data-flow-list-item-wrap]') &&
              state.flowListMenu.open) {
            state.flowListMenu = { open: false, index: null };
            syncActiveFlowView();
          }
          if (!event.target.closest('#flowTitleMenuBtn') &&
              !event.target.closest('#flowHeaderMenu') &&
              state.flowHeaderMenuOpen) {
            state.flowHeaderMenuOpen = false;
            renderFlowHeaderMenu();
          }
          if (!event.target.closest('.flow-composer-shell') &&
              !event.target.closest('.flow-inline-menu') &&
              !event.target.closest('[data-open-flow-step-menu]') &&
              !event.target.closest('[data-flow-add-below]') &&
              !event.target.closest('.flow-chat-placeholder') &&
              !event.target.closest('.flow-step-menu')) {
            closeFlowInlineMenus();
            syncActiveFlowView();
          }
        });

        window.addEventListener('resize', function () {
          positionFlowMenus();
        });
        window.addEventListener('scroll', function () {
          positionFlowMenus();
        }, true);

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

        if (fields.availabilityMode) {
          fields.availabilityMode.addEventListener('change', function () {
            renderAvailabilityDetails();
            renderLivePreview();
          });
        }
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
            onlineStatusText: (state.currentSettings && state.currentSettings.onlineStatusText) || 'онлайн',
            operatorFallback: {
              enabled: fields.operatorFallbackEnabled.value === 'true',
              delaySeconds: Number(fields.operatorFallbackDelay.value || 30),
              message: fields.operatorFallbackMessage.value
            },
            availability: {
              mode: fields.availabilityMode.value,
              manualStatus: getManualStatusValue()
            },
            workingHours: getWorkingHoursPayload(),
            widgetPosition: (state.currentSettings && state.currentSettings.widgetPosition) || 'bottom_right',
            widgetSize: (state.currentSettings && state.currentSettings.widgetSize) || 'medium',
            language: {
              default: fields.languageDefault.value
            },
            theme: {
              primary: fields.primary.value.trim(),
              headerBg: fields.headerBg.value.trim(),
              bubbleBg: fields.bubbleBg.value.trim(),
              textColor: fields.textColor.value.trim()
            },
            flows: collectFlows(),
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
  const siteId = resolveScopedSiteFilter(req, req.query.siteId, { allowAll: true });
  if (siteId === null) {
    return res.status(404).type('html').send('Site not found.');
  }
  const initialContacts = contactService.listContacts({
    workspaceId: getRequestWorkspaceId(req),
    siteId: siteId || '',
    limit: 200
  }).map((contact) => (
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
