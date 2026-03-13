const fs = require('fs');
const path = require('path');

const DEFAULT_ALLOWED_FILE_TYPES = ['jpg', 'jpeg', 'png', 'pdf', 'stl', '3mf', 'obj', 'zip'];
const DEFAULT_MAX_UPLOAD_SIZE = 20 * 1024 * 1024;
const DEFAULT_SETTINGS_PATH = process.env.CHAT_PLATFORM_SITE_SETTINGS_PATH
  || path.join(__dirname, '..', '..', 'data', 'site-settings.json');

const FLOW_KEY_MAP = {
  price: 'price',
  time: 'print_time',
  print_time: 'print_time',
  upload: 'file_upload',
  file_upload: 'file_upload',
  question: 'general_question',
  general_question: 'general_question',
  repair: 'repair',
  design: 'design',
  idea: 'idea',
  batch: 'batch'
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizeHexColor(value, fallback) {
  const input = String(value || '').trim();
  if (!input) return fallback;
  if (/^#[0-9a-f]{6}$/i.test(input)) return input;
  if (/^#[0-9a-f]{3}$/i.test(input)) return input;
  return fallback;
}

function normalizeQuickAction(item) {
  const label = sanitizeText(item?.label, 80);
  const icon = sanitizeText(item?.icon, 12);
  const rawKey = sanitizeText(item?.key || item?.flowId, 40).toLowerCase();
  const mappedFlowId = FLOW_KEY_MAP[rawKey] || rawKey || '';
  const key = rawKey || mappedFlowId;
  if (!label || !mappedFlowId) {
    return null;
  }

  return {
    label,
    icon: icon || '💬',
    key,
    flowId: mappedFlowId
  };
}

function normalizeQuickActions(actions, fallback) {
  const normalized = Array.isArray(actions)
    ? actions.map(normalizeQuickAction).filter(Boolean)
    : [];
  return normalized.length ? normalized : (Array.isArray(fallback) ? fallback.map(normalizeQuickAction).filter(Boolean) : []);
}

function buildTelegramNotificationsConfig(value = {}) {
  return {
    enabled: value.enabled === true,
    notifyOnNewConversation: value.notifyOnNewConversation === true,
    notifyOnImportantUserMessage: value.notifyOnImportantUserMessage === true,
    operatorChatIds: Array.isArray(value.operatorChatIds)
      ? value.operatorChatIds.map((item) => sanitizeText(item, 80)).filter(Boolean)
      : [],
    importantKeywords: Array.isArray(value.importantKeywords)
      ? value.importantKeywords.map((item) => sanitizeText(item, 80)).filter(Boolean)
      : []
  };
}

function createSiteConfig(siteId, overrides = {}) {
  const cleanSiteId = String(siteId || '').trim();
  const baseTitle = sanitizeText(overrides.title || cleanSiteId || 'Chat Platform', 120);
  const telegramNotifications = buildTelegramNotificationsConfig(overrides.telegram?.notifications || {});
  const quickActions = normalizeQuickActions(overrides.quickActions, [
    { icon: '💰', label: 'Дізнатись ціну', key: 'price' },
    { icon: '📦', label: 'Скільки часу друк', key: 'time' },
    { icon: '📎', label: 'Завантажити модель', key: 'upload' },
    { icon: '❓', label: 'Поставити питання', key: 'question' }
  ]);
  const onlineStatusText = sanitizeText(
    overrides.onlineStatusText || overrides.statusLabels?.ai || 'онлайн',
    80
  ) || 'онлайн';

  return {
    siteId: cleanSiteId,
    title: baseTitle,
    avatarUrl: sanitizeText(overrides.avatarUrl || '', 1024),
    welcomeMessage: sanitizeText(overrides.welcomeMessage || '👋 Привіт!', 2000) || '👋 Привіт!',
    welcomeIntroLabel: sanitizeText(
      overrides.welcomeIntroLabel || overrides.botMetaLabel || `AI помічник ${baseTitle}`,
      120
    ) || `AI помічник ${baseTitle}`,
    onlineStatusText,
    botMetaLabel: sanitizeText(overrides.botMetaLabel || `AI помічник ${baseTitle}`, 120) || `AI помічник ${baseTitle}`,
    operatorMetaLabel: sanitizeText(overrides.operatorMetaLabel || `Менеджер ${baseTitle}`, 120) || `Менеджер ${baseTitle}`,
    placeholder: sanitizeText(overrides.placeholder || 'Напишіть повідомлення...', 140) || 'Напишіть повідомлення...',
    launcherTitle: sanitizeText(overrides.launcherTitle || 'AI чат', 80) || 'AI чат',
    launcherSubtitle: sanitizeText(overrides.launcherSubtitle || 'підтримка онлайн', 120) || 'підтримка онлайн',
    quickActions,
    allowedFileTypes: Array.isArray(overrides.allowedFileTypes) && overrides.allowedFileTypes.length
      ? overrides.allowedFileTypes.map((item) => String(item || '').trim().replace(/^\./, '').toLowerCase()).filter(Boolean)
      : DEFAULT_ALLOWED_FILE_TYPES,
    maxUploadSize: Number(overrides.maxUploadSize || DEFAULT_MAX_UPLOAD_SIZE),
    fileHint: sanitizeText(overrides.fileHint || '', 200),
    aiEnabled: overrides.aiEnabled !== false,
    theme: {
      primary: normalizeHexColor(overrides.theme?.primary, '#f78c2f'),
      primarySoft: normalizeHexColor(overrides.theme?.primarySoft, '#ffb15d'),
      headerBg: normalizeHexColor(overrides.theme?.headerBg, '#131926'),
      headerBgSoft: normalizeHexColor(overrides.theme?.headerBgSoft, '#2a3650'),
      bubbleBg: normalizeHexColor(overrides.theme?.bubbleBg, '#ffffff'),
      surface: sanitizeText(overrides.theme?.surface || 'rgba(255, 252, 248, 0.975)', 80) || 'rgba(255, 252, 248, 0.975)',
      textColor: normalizeHexColor(overrides.theme?.textColor, '#1f2734')
    },
    statusLabels: {
      open: sanitizeText(overrides.statusLabels?.open || 'open', 40) || 'open',
      ai: onlineStatusText,
      human: sanitizeText(overrides.statusLabels?.human || 'менеджер онлайн', 80) || 'менеджер онлайн',
      closed: sanitizeText(overrides.statusLabels?.closed || 'діалог завершено', 80) || 'діалог завершено'
    },
    telegram: {
      enabled: overrides.telegram?.enabled === true,
      botUsername: sanitizeText(overrides.telegram?.botUsername || '', 80),
      notifications: telegramNotifications
    },
    flowTextOverrides: Object.assign({}, overrides.flowTextOverrides || {}),
    uploadsPath: overrides.uploadsPath || path.join(__dirname, '..', '..', 'uploads', 'chat', cleanSiteId)
  };
}

const baseSiteConfigs = {
  'printforge-main': createSiteConfig('printforge-main', {
    title: 'PrintForge AI',
    welcomeIntroLabel: 'AI помічник PrintForge',
    botMetaLabel: 'AI помічник PrintForge',
    operatorMetaLabel: 'Менеджер PrintForge',
    onlineStatusText: 'онлайн',
    welcomeMessage: [
      '👋 Привіт!',
      'Я AI помічник PrintForge.',
      '',
      'Можу допомогти:',
      '• порахувати ціну',
      '• оцінити час друку',
      '• прийняти модель'
    ].join('\n'),
    placeholder: 'Напишіть повідомлення або опишіть ваше замовлення...',
    launcherTitle: 'AI чат',
    launcherSubtitle: 'ціна, терміни, кастом',
    quickActions: [
      { icon: '💰', label: 'Дізнатись ціну', key: 'price' },
      { icon: '📦', label: 'Скільки часу друк', key: 'time' },
      { icon: '📎', label: 'Завантажити модель', key: 'upload' },
      { icon: '❓', label: 'Поставити питання', key: 'question' }
    ],
    fileHint: 'Формати: JPG, PNG, PDF, STL, 3MF, OBJ, ZIP · до 20 MB',
    telegram: {
      enabled: true,
      notifications: {
        enabled: true,
        notifyOnNewConversation: true,
        notifyOnImportantUserMessage: true,
        operatorChatIds: [],
        importantKeywords: ['ціна', 'термін', 'прорахунок', 'оператор', 'менеджер', 'терміново', 'файл']
      }
    }
  }),
  'demo-parts-shop': createSiteConfig('demo-parts-shop', {
    title: 'Parts Shop AI',
    welcomeIntroLabel: 'AI помічник Parts Shop',
    botMetaLabel: 'AI помічник Parts Shop',
    operatorMetaLabel: 'Менеджер Parts Shop',
    onlineStatusText: 'онлайн',
    welcomeMessage: [
      '👋 Вітаємо!',
      'Я AI помічник Parts Shop.',
      '',
      'Можу допомогти:',
      '• оцінити друк деталі',
      '• прийняти файл моделі',
      '• передати запит оператору'
    ].join('\n'),
    placeholder: 'Опишіть деталь або поставте запитання...',
    launcherTitle: 'Chat',
    launcherSubtitle: 'деталі, моделі, строки',
    quickActions: [
      { icon: '💬', label: 'Розрахунок деталі', key: 'price' },
      { icon: '📎', label: 'Надіслати файл', key: 'upload' },
      { icon: '⏱', label: 'Термін друку', key: 'time' },
      { icon: '❓', label: 'Запитання', key: 'question' }
    ],
    theme: {
      primary: '#1f6fff',
      primarySoft: '#6ca4ff',
      headerBg: '#111827',
      headerBgSoft: '#334155',
      bubbleBg: '#ffffff',
      surface: 'rgba(248, 251, 255, 0.98)',
      textColor: '#1f2734'
    },
    fileHint: 'Формати: JPG, PNG, PDF, STL, 3MF, OBJ, ZIP · до 20 MB',
    telegram: {
      enabled: false,
      notifications: {
        enabled: false,
        notifyOnNewConversation: false,
        notifyOnImportantUserMessage: false,
        operatorChatIds: [],
        importantKeywords: []
      }
    }
  })
};

function readSettingsStore() {
  try {
    const raw = fs.readFileSync(DEFAULT_SETTINGS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeSettingsStore(nextStore) {
  ensureDir(path.dirname(DEFAULT_SETTINGS_PATH));
  fs.writeFileSync(DEFAULT_SETTINGS_PATH, `${JSON.stringify(nextStore, null, 2)}\n`, 'utf8');
}

function buildEditableSettings(config) {
  return {
    siteId: config.siteId,
    title: config.title,
    avatarUrl: config.avatarUrl,
    welcomeMessage: config.welcomeMessage,
    welcomeIntroLabel: config.welcomeIntroLabel,
    onlineStatusText: config.onlineStatusText,
    theme: {
      primary: config.theme.primary,
      headerBg: config.theme.headerBg,
      bubbleBg: config.theme.bubbleBg,
      textColor: config.theme.textColor
    },
    quickActions: normalizeQuickActions(config.quickActions, [])
  };
}

function sanitizeSiteSettingsInput(input = {}, baseConfig) {
  const merged = createSiteConfig(baseConfig.siteId, Object.assign({}, baseConfig, {
    title: input.title,
    avatarUrl: input.avatarUrl,
    welcomeMessage: input.welcomeMessage,
    welcomeIntroLabel: input.welcomeIntroLabel,
    onlineStatusText: input.onlineStatusText,
    theme: Object.assign({}, baseConfig.theme, input.theme || {}),
    quickActions: input.quickActions
  }));
  return buildEditableSettings(merged);
}

function getSiteConfig(siteId) {
  const key = String(siteId || '').trim();
  const baseConfig = baseSiteConfigs[key];
  if (!baseConfig) return null;
  const store = readSettingsStore();
  const override = store[key] && typeof store[key] === 'object' ? store[key] : {};
  return createSiteConfig(key, Object.assign({}, baseConfig, override, {
    theme: Object.assign({}, baseConfig.theme, override.theme || {}),
    telegram: Object.assign({}, baseConfig.telegram, override.telegram || {}),
    statusLabels: Object.assign({}, baseConfig.statusLabels, override.statusLabels || {})
  }));
}

function getEditableSiteSettings(siteId) {
  const config = getSiteConfig(siteId);
  return config ? buildEditableSettings(config) : null;
}

function saveSiteSettings(siteId, input) {
  const key = String(siteId || '').trim();
  const baseConfig = baseSiteConfigs[key];
  if (!baseConfig) {
    return null;
  }

  const store = readSettingsStore();
  store[key] = sanitizeSiteSettingsInput(input, baseConfig);
  writeSettingsStore(store);
  return getEditableSiteSettings(key);
}

function listSiteConfigs() {
  return Object.keys(baseSiteConfigs)
    .map((siteId) => getSiteConfig(siteId))
    .filter(Boolean);
}

function listEditableSiteSettings() {
  return Object.keys(baseSiteConfigs)
    .map((siteId) => getEditableSiteSettings(siteId))
    .filter(Boolean);
}

module.exports = {
  DEFAULT_ALLOWED_FILE_TYPES,
  DEFAULT_MAX_UPLOAD_SIZE,
  createSiteConfig,
  getSiteConfig,
  getEditableSiteSettings,
  saveSiteSettings,
  listSiteConfigs,
  listEditableSiteSettings,
  normalizeQuickAction,
  normalizeQuickActions
};
