const path = require('path');

const DEFAULT_ALLOWED_FILE_TYPES = ['jpg', 'jpeg', 'png', 'pdf', 'stl', '3mf', 'obj', 'zip'];
const DEFAULT_MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

function createSiteConfig(siteId, overrides = {}) {
  const cleanSiteId = String(siteId || '').trim();
  const baseTitle = String(overrides.title || cleanSiteId || 'Chat Platform');
  const telegramNotifications = Object.assign(
    {
      enabled: false,
      notifyOnNewConversation: false,
      notifyOnImportantUserMessage: false,
      operatorChatIds: [],
      importantKeywords: []
    },
    overrides.telegram?.notifications || {}
  );

  return {
    siteId: cleanSiteId,
    title: baseTitle,
    botMetaLabel: overrides.botMetaLabel || `AI помічник ${baseTitle}`,
    operatorMetaLabel: overrides.operatorMetaLabel || `Менеджер ${baseTitle}`,
    welcomeMessage: overrides.welcomeMessage || '👋 Привіт!',
    placeholder: overrides.placeholder || 'Напишіть повідомлення...',
    launcherTitle: overrides.launcherTitle || 'AI чат',
    launcherSubtitle: overrides.launcherSubtitle || 'підтримка онлайн',
    avatarUrl: overrides.avatarUrl || '',
    quickActions: Array.isArray(overrides.quickActions) ? overrides.quickActions : [],
    allowedFileTypes: Array.isArray(overrides.allowedFileTypes) && overrides.allowedFileTypes.length
      ? overrides.allowedFileTypes
      : DEFAULT_ALLOWED_FILE_TYPES,
    maxUploadSize: Number(overrides.maxUploadSize || DEFAULT_MAX_UPLOAD_SIZE),
    fileHint: overrides.fileHint || '',
    aiEnabled: overrides.aiEnabled !== false,
    theme: Object.assign(
      {
        primary: '#f78c2f',
        primarySoft: '#ffb15d',
        headerBg: '#131926',
        headerBgSoft: '#2a3650',
        surface: 'rgba(255, 252, 248, 0.975)'
      },
      overrides.theme || {}
    ),
    statusLabels: Object.assign(
      {
        ai: 'онлайн',
        human: 'менеджер онлайн',
        closed: 'діалог завершено'
      },
      overrides.statusLabels || {}
    ),
    telegram: Object.assign(
      {
        enabled: false,
        botUsername: '',
        notifications: {
          enabled: telegramNotifications.enabled === true,
          notifyOnNewConversation: telegramNotifications.notifyOnNewConversation === true,
          notifyOnImportantUserMessage: telegramNotifications.notifyOnImportantUserMessage === true,
          operatorChatIds: Array.isArray(telegramNotifications.operatorChatIds)
            ? telegramNotifications.operatorChatIds.map((item) => String(item || '').trim()).filter(Boolean)
            : [],
          importantKeywords: Array.isArray(telegramNotifications.importantKeywords)
            ? telegramNotifications.importantKeywords.map((item) => String(item || '').trim()).filter(Boolean)
            : []
        }
      },
      overrides.telegram || {}
    ),
    flowTextOverrides: Object.assign({}, overrides.flowTextOverrides || {}),
    uploadsPath: overrides.uploadsPath || path.join(__dirname, '..', '..', 'uploads', 'chat', cleanSiteId)
  };
}

const siteConfigs = {
  'printforge-main': createSiteConfig('printforge-main', {
    title: 'PrintForge AI',
    botMetaLabel: 'AI помічник PrintForge',
    operatorMetaLabel: 'Менеджер PrintForge',
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
      { icon: '💰', label: 'Дізнатись ціну', flowId: 'price' },
      { icon: '📦', label: 'Скільки часу друк', flowId: 'print_time' },
      { icon: '📎', label: 'Завантажити модель', flowId: 'file_upload' },
      { icon: '❓', label: 'Поставити питання', flowId: 'general_question' }
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
    botMetaLabel: 'AI помічник Parts Shop',
    operatorMetaLabel: 'Менеджер Parts Shop',
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
      { icon: '💬', label: 'Розрахунок деталі', flowId: 'price' },
      { icon: '📎', label: 'Надіслати файл', flowId: 'file_upload' },
      { icon: '⏱', label: 'Термін друку', flowId: 'print_time' },
      { icon: '❓', label: 'Запитання', flowId: 'general_question' }
    ],
    theme: {
      primary: '#1f6fff',
      primarySoft: '#6ca4ff',
      headerBg: '#111827',
      headerBgSoft: '#334155',
      surface: 'rgba(248, 251, 255, 0.98)'
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

function getSiteConfig(siteId) {
  const key = String(siteId || '').trim();
  return siteConfigs[key] || null;
}

function listSiteConfigs() {
  return Object.values(siteConfigs);
}

module.exports = {
  DEFAULT_ALLOWED_FILE_TYPES,
  DEFAULT_MAX_UPLOAD_SIZE,
  createSiteConfig,
  getSiteConfig,
  listSiteConfigs
};
