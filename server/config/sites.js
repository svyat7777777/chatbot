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

function sanitizeMultilineText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
    .join('\n')
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

function expandHexColor(value) {
  const normalized = normalizeHexColor(value, '').toLowerCase();
  if (!normalized) return '';
  if (normalized.length === 7) return normalized;
  if (normalized.length === 4) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
  }
  return '';
}

function mixHexColors(baseColor, mixColor, mixRatio = 0.2) {
  const base = expandHexColor(baseColor);
  const mix = expandHexColor(mixColor);
  if (!base || !mix) {
    return base || mix || '#000000';
  }

  const ratio = Math.max(0, Math.min(1, Number(mixRatio) || 0));
  const baseRgb = [1, 3, 5].map((index) => parseInt(base.slice(index, index + 2), 16));
  const mixRgb = [1, 3, 5].map((index) => parseInt(mix.slice(index, index + 2), 16));
  const blended = baseRgb.map((channel, index) => Math.round(channel + (mixRgb[index] - channel) * ratio));
  return `#${blended.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function normalizeQuickActionOption(item, index) {
  const label = sanitizeText(item?.label || item?.text || '', 80);
  const value = sanitizeText(item?.value || label || `option_${index + 1}`, 80).toLowerCase().replace(/\s+/g, '_');
  if (!label) return null;
  return { label, value: value || `option_${index + 1}` };
}

function buildDefaultFlowSteps(flowId) {
  const defaults = {
    price: [
      { id: 'name', type: 'message', input: 'text', text: 'Як до вас можна звертатися?' },
      { id: 'details', type: 'message', input: 'text', text: 'Що саме потрібно надрукувати? Опишіть коротко.' },
      {
        id: 'file',
        type: 'choice',
        text: 'Чи є у вас файл моделі?',
        options: [
          { label: '📎 Завантажити файл', value: 'upload_file' },
          { label: '❌ Файлу немає', value: 'no_file' }
        ]
      },
      { id: 'size', type: 'message', input: 'text', text: 'Який приблизний розмір деталі?' },
      { id: 'contact', type: 'message', input: 'text', text: 'Можете залишити Telegram або телефон?' }
    ],
    print_time: [
      { id: 'name', type: 'message', input: 'text', text: 'Як до вас можна звертатися?' },
      { id: 'details', type: 'message', input: 'text', text: 'Що саме потрібно надрукувати?' },
      {
        id: 'file',
        type: 'choice',
        text: 'Чи є у вас файл моделі?',
        options: [
          { label: '📎 Завантажити файл', value: 'upload_file' },
          { label: '❌ Файлу немає', value: 'no_file' }
        ]
      },
      { id: 'size', type: 'message', input: 'text', text: 'Який приблизний розмір деталі?' },
      { id: 'contact', type: 'message', input: 'text', text: 'Можете залишити Telegram або телефон, і ми напишемо точніше.' }
    ],
    file_upload: [
      { id: 'file', type: 'message', input: 'file', text: 'Надішліть STL, 3MF, OBJ, ZIP або фото/ескіз.' },
      { id: 'name', type: 'message', input: 'text', text: 'Супер 👍 Як вас звати?' },
      { id: 'details', type: 'message', input: 'text', text: 'Що це за деталь або що потрібно зробити з моделлю?' },
      {
        id: 'goal',
        type: 'choice',
        text: 'Що вас цікавить найбільше?',
        options: [
          { label: '💰 Порахувати ціну', value: 'price' },
          { label: '⏱ Дізнатись термін', value: 'time' },
          { label: '✅ Перевірити модель', value: 'check_model' },
          { label: '🛠 Інше', value: 'other' }
        ]
      },
      { id: 'contact', type: 'message', input: 'text', text: 'Залиште Telegram або телефон, щоб ми могли написати вам результат.' }
    ],
    general_question: [
      { id: 'question', type: 'message', input: 'text', text: 'Звичайно! Напишіть ваше питання, і я допоможу або передам менеджеру.' },
      { id: 'name', type: 'message', input: 'text', text: 'Як до вас звертатись?' },
      { id: 'contact', type: 'message', input: 'text', text: 'Можете залишити Telegram або телефон для відповіді?' }
    ]
  };

  return Array.isArray(defaults[flowId]) ? defaults[flowId] : [];
}

function normalizeFlowStep(item, index) {
  const type = sanitizeText(item?.type || 'message', 20).toLowerCase();
  const supportedType = type === 'choice' ? 'choice' : 'message';
  const input = sanitizeText(
    item?.input || (supportedType === 'choice' ? 'choice' : 'text'),
    20
  ).toLowerCase();
  const supportedInput = ['text', 'choice', 'file', 'none'].includes(input)
    ? input
    : (supportedType === 'choice' ? 'choice' : 'text');
  const text = sanitizeText(item?.text || item?.prompt || '', 1200);
  const id = sanitizeText(item?.id || `step_${index + 1}`, 40).toLowerCase().replace(/[^a-z0-9_]+/g, '_') || `step_${index + 1}`;
  const options = supportedType === 'choice'
    ? (Array.isArray(item?.options) ? item.options : []).map(normalizeQuickActionOption).filter(Boolean)
    : [];

  if (!text && supportedInput !== 'none') {
    return null;
  }

  return {
    id,
    type: supportedType,
    input: supportedType === 'choice' ? 'choice' : supportedInput,
    text,
    options
  };
}

function normalizeFlowSteps(flow, flowId) {
  const source = Array.isArray(flow) && flow.length ? flow : buildDefaultFlowSteps(flowId);
  return source.map(normalizeFlowStep).filter(Boolean);
}

function buildDefaultFlows() {
  return [
    { icon: '💰', buttonLabel: 'Дізнатись ціну', slug: 'price', title: 'Price calculation' },
    { icon: '📦', buttonLabel: 'Скільки часу друк', slug: 'print_time', title: 'Print time' },
    { icon: '📎', buttonLabel: 'Завантажити модель', slug: 'file_upload', title: 'Model upload' },
    { icon: '❓', buttonLabel: 'Поставити питання', slug: 'general_question', title: 'General question' }
  ];
}

function normalizeFlow(item, index) {
  const rawSlug = sanitizeText(
    item?.slug || item?.id || item?.key || item?.flowId || `flow_${index + 1}`,
    40
  ).toLowerCase();
  const mappedSlug = FLOW_KEY_MAP[rawSlug] || rawSlug || `flow_${index + 1}`;
  const slug = mappedSlug.replace(/[^a-z0-9_]+/g, '_') || `flow_${index + 1}`;
  const title = sanitizeText(item?.title || item?.buttonLabel || item?.label || slug, 120) || slug;
  const buttonLabel = sanitizeText(item?.buttonLabel || item?.label || title, 80) || title;
  const icon = sanitizeText(item?.icon, 12) || '💬';
  const description = sanitizeText(item?.description || '', 240);

  return {
    id: slug,
    slug,
    title,
    buttonLabel,
    icon,
    showInWidget: item?.showInWidget !== false,
    description,
    steps: normalizeFlowSteps(item?.steps || item?.flow, slug)
  };
}

function normalizeFlows(flows, legacyQuickActions, fallback) {
  const source = Array.isArray(flows) && flows.length
    ? flows
    : (Array.isArray(legacyQuickActions) && legacyQuickActions.length ? legacyQuickActions : fallback);
  const normalized = Array.isArray(source)
    ? source.map(normalizeFlow).filter(Boolean)
    : [];
  return normalized.length ? normalized : buildDefaultFlows().map(normalizeFlow);
}

function buildQuickActionsFromFlows(flows) {
  return (Array.isArray(flows) ? flows : []).filter(function (flow) {
    return flow && flow.showInWidget !== false;
  }).map(function (flow) {
    return {
      label: flow.buttonLabel,
      icon: flow.icon || '💬',
      key: flow.slug || flow.id,
      flowId: flow.slug || flow.id,
      flow: Array.isArray(flow.steps) ? flow.steps : []
    };
  });
}

function normalizeOperatorQuickReply(item) {
  const text = sanitizeText(item?.text || item, 280);
  return text ? { text } : null;
}

function readOperatorTextCandidate(value, maxLength = 120) {
  if (typeof value === 'string' || typeof value === 'number') {
    return sanitizeText(value, maxLength);
  }
  if (value && typeof value === 'object') {
    const nested = value.name || value.label || value.title || value.value || value.url || '';
    if (typeof nested === 'string' || typeof nested === 'number') {
      return sanitizeText(nested, maxLength);
    }
  }
  return '';
}

function normalizeOperatorQuickReplies(items, fallback) {
  const normalized = Array.isArray(items)
    ? items.map(normalizeOperatorQuickReply).filter(Boolean)
    : [];
  return normalized.length
    ? normalized
    : (Array.isArray(fallback) ? fallback.map(normalizeOperatorQuickReply).filter(Boolean) : []);
}

function normalizeOperatorProfile(item, fallbackTitle) {
  const name = readOperatorTextCandidate(item?.name, 120)
    || readOperatorTextCandidate(item?.label, 120)
    || readOperatorTextCandidate(item, 120);
  if (!name) return null;
  return {
    name,
    title: readOperatorTextCandidate(item?.title, 120) || sanitizeText(fallbackTitle || '', 120),
    avatarUrl: readOperatorTextCandidate(item?.avatarUrl, 1024)
  };
}

function normalizeOperators(items, fallback, fallbackTitle) {
  const normalized = Array.isArray(items)
    ? items.map(function (item) {
        return normalizeOperatorProfile(item, fallbackTitle);
      }).filter(Boolean)
    : [];
  if (normalized.length) {
    return normalized;
  }
  return Array.isArray(fallback)
    ? fallback.map(function (item) {
        return normalizeOperatorProfile(item, fallbackTitle);
      }).filter(Boolean)
    : [];
}

function normalizeBoolean(value, fallback = false) {
  if (value === true || value === false) return value;
  return fallback;
}

function normalizeEnum(value, allowed, fallback) {
  const normalized = sanitizeText(value || '', 80).toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeNumber(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function buildTypingSimulationConfig(value = {}) {
  return {
    enabled: normalizeBoolean(value.enabled, true),
    delaySeconds: Math.round(normalizeNumber(value.delaySeconds, 1, 0, 5))
  };
}

function buildOperatorFallbackConfig(value = {}) {
  return {
    enabled: normalizeBoolean(value.enabled, false),
    delaySeconds: Math.round(normalizeNumber(value.delaySeconds, 30, 5, 600)),
    message:
      sanitizeText(
        value.message || 'Оператори зараз зайняті, але ми на зв’язку. Залишайтесь у чаті, і ми відповімо вам якнайшвидше.',
        1000
      ) || 'Оператори зараз зайняті, але ми на зв’язку. Залишайтесь у чаті, і ми відповімо вам якнайшвидше.'
  };
}

function buildAvailabilityConfig(value = {}) {
  return {
    mode: normalizeEnum(value.mode, ['always_online', 'schedule', 'manual'], 'always_online'),
    manualStatus: normalizeEnum(value.manualStatus, ['online', 'offline'], 'online')
  };
}

function buildWorkingHoursConfig(value = {}) {
  const sourceDays = value && typeof value.days === 'object' && value.days ? value.days : {};
  const dayDefaults = {
    mon: { enabled: true, start: '09:00', end: '18:00' },
    tue: { enabled: true, start: '09:00', end: '18:00' },
    wed: { enabled: true, start: '09:00', end: '18:00' },
    thu: { enabled: true, start: '09:00', end: '18:00' },
    fri: { enabled: true, start: '09:00', end: '18:00' },
    sat: { enabled: false, start: '09:00', end: '18:00' },
    sun: { enabled: false, start: '09:00', end: '18:00' }
  };
  const days = Object.keys(dayDefaults).reduce((acc, key) => {
    const source = sourceDays[key] || {};
    const fallback = dayDefaults[key];
    acc[key] = {
      enabled: normalizeBoolean(source.enabled, fallback.enabled),
      start: /^\d{2}:\d{2}$/.test(String(source.start || '')) ? String(source.start) : fallback.start,
      end: /^\d{2}:\d{2}$/.test(String(source.end || '')) ? String(source.end) : fallback.end
    };
    return acc;
  }, {});
  return {
    enabled: normalizeBoolean(value.enabled, true),
    timezone: sanitizeText(value.timezone || 'America/New_York', 80) || 'America/New_York',
    days
  };
}

function buildWidgetPosition(value) {
  return normalizeEnum(value, ['bottom_right', 'bottom_left'], 'bottom_right');
}

function buildWidgetSize(value) {
  return normalizeEnum(value, ['compact', 'medium', 'large'], 'medium');
}

function buildPageVisibilityConfig(value = {}) {
  const mode = normalizeEnum(value.mode, ['all_pages', 'only_selected', 'hide_on_selected'], 'all_pages');
  const rules = Array.isArray(value.rules)
    ? value.rules.map((item) => sanitizeText(item, 240)).filter(Boolean)
    : [];
  return { mode, rules };
}

function buildLanguageConfig(value = {}) {
  return {
    default: normalizeEnum(value.default, ['uk', 'en', 'auto'], 'uk')
  };
}

function buildGeneratedKnowledgeConfig(value = {}) {
  return {
    companyDescription: sanitizeText(value.companyDescription || '', 2000),
    services: sanitizeText(value.services || '', 2000),
    faq: sanitizeText(value.faq || '', 3000),
    pricingRules: sanitizeText(value.pricingRules || '', 2000),
    leadTimeRules: sanitizeText(value.leadTimeRules || '', 2000),
    fileRequirements: sanitizeText(value.fileRequirements || '', 2000),
    deliveryInfo: sanitizeText(value.deliveryInfo || '', 2000),
    generatedAt: sanitizeText(value.generatedAt || '', 64),
    sourceId: sanitizeText(value.sourceId || '', 120),
    sourceName: sanitizeText(value.sourceName || '', 240)
  };
}

function buildKnowledgeSourceConfig(value = {}) {
  return {
    websiteUrl: sanitizeText(value.websiteUrl || '', 2000),
    maxPages: Math.round(normalizeNumber(value.maxPages, 10, 1, 100)),
    frequency: normalizeEnum(value.frequency, ['manual', 'daily', 'weekly', 'monthly'], 'manual')
  };
}

function buildAiReplyRulesConfig(value = {}) {
  const allowed = value.allowed && typeof value.allowed === 'object' ? value.allowed : {};
  const handoff = value.handoff && typeof value.handoff === 'object' ? value.handoff : {};
  const messages = value.messages && typeof value.messages === 'object' ? value.messages : {};
  return {
    mode: normalizeEnum(value.mode, ['ai_first', 'hybrid', 'human_first', 'ai_assist'], 'hybrid'),
    confidenceThreshold: normalizeNumber(value.confidenceThreshold, 0.62, 0, 1),
    allowed: {
      faq: normalizeBoolean(allowed.faq, true),
      delivery: normalizeBoolean(allowed.delivery, true),
      materials: normalizeBoolean(allowed.materials, true),
      process: normalizeBoolean(allowed.process, true),
      fileRequirements: normalizeBoolean(allowed.fileRequirements, true),
      pricingBasic: normalizeBoolean(allowed.pricingBasic, true),
      businessInfo: normalizeBoolean(allowed.businessInfo, true)
    },
    handoff: {
      exactQuote: normalizeBoolean(handoff.exactQuote, true),
      fileReview: normalizeBoolean(handoff.fileReview, true),
      orderSpecific: normalizeBoolean(handoff.orderSpecific, true),
      complaints: normalizeBoolean(handoff.complaints, true),
      urgentDeadline: normalizeBoolean(handoff.urgentDeadline, true),
      discountNegotiation: normalizeBoolean(handoff.discountNegotiation, true),
      humanRequest: normalizeBoolean(handoff.humanRequest, true)
    },
    messages: {
      handoffGeneral: sanitizeText(
        messages.handoffGeneral
          || 'I am handing this over to a manager for an accurate reply. Please stay in chat and we will respond shortly.',
        600
      ),
      handoffHumanRequest: sanitizeText(
        messages.handoffHumanRequest
          || 'Sure, I will connect you with a manager. Please stay in chat and we will respond shortly.',
        600
      ),
      askQuoteDetails: sanitizeText(
        messages.askQuoteDetails
          || 'To prepare an exact quote, please send STL/3MF/OBJ file or at least dimensions, material, quantity, and deadline.',
        600
      ),
      askFileReviewDetails: sanitizeText(
        messages.askFileReviewDetails
          || 'Please upload the file or send dimensions and a reference image. A manager will review the part and confirm the next step.',
        600
      )
    }
  };
}

function buildAiAssistantConfig(value = {}) {
  const fallbackGreeting = 'Вітаю! Я AI-помічник PrintForge.';
  const fallbackCapabilities = 'Можу допомогти з питаннями про 3D-друк, матеріали, вимоги до файлів, строки виготовлення, доставку та базову інформацію по замовленню.';
  const fallbackOperatorMessage = 'Для точної відповіді потрібен менеджер. Залиште, будь ласка, ваші контакти і ми з вами зв’яжемося.';
  return {
    enabled: normalizeBoolean(value.enabled, false),
    provider: sanitizeText(value.provider || 'openai', 40).toLowerCase() || 'openai',
    model: sanitizeText(value.model || 'gpt-5', 80) || 'gpt-5',
    temperature: normalizeNumber(value.temperature, 0.4, 0, 2),
    maxTokens: Math.round(normalizeNumber(value.maxTokens, 220, 32, 1200)),
    maxReplyLength: Math.round(normalizeNumber(value.maxReplyLength, 420, 120, 1200)),
    companyDescription: sanitizeText(value.companyDescription || '', 2000),
    services: sanitizeText(value.services || '', 2000),
    faq: sanitizeText(value.faq || '', 3000),
    pricingRules: sanitizeText(value.pricingRules || '', 2000),
    leadTimeRules: sanitizeText(value.leadTimeRules || '', 2000),
    fileRequirements: sanitizeText(value.fileRequirements || '', 2000),
    deliveryInfo: sanitizeText(value.deliveryInfo || '', 2000),
    tone: sanitizeText(value.tone || 'Friendly and professional.', 240),
    defaultLanguage: sanitizeText(value.defaultLanguage || 'uk', 24) || 'uk',
    responseStyle: normalizeEnum(value.responseStyle, ['short', 'balanced', 'detailed'], 'short'),
    greetingMessage: sanitizeText(value.greetingMessage || fallbackGreeting, 600),
    capabilitiesMessage: sanitizeText(value.capabilitiesMessage || fallbackCapabilities, 1200),
    operatorFallbackMessage: sanitizeText(value.operatorFallbackMessage || fallbackOperatorMessage, 1200),
    knowledgeSource: buildKnowledgeSourceConfig(value.knowledgeSource || {}),
    generatedKnowledge: buildGeneratedKnowledgeConfig(value.generatedKnowledge || {}),
    forbiddenClaims: sanitizeText(value.forbiddenClaims || '', 2000),
    askContactStyle: sanitizeText(value.askContactStyle || '', 500),
    askFileStyle: sanitizeText(value.askFileStyle || '', 500),
    replyRules: buildAiReplyRulesConfig(value.replyRules || {})
  };
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
  const baseTitle = sanitizeText(overrides.title || cleanSiteId || 'verbbot.com', 120);
  const telegramNotifications = buildTelegramNotificationsConfig(overrides.telegram?.notifications || {});
  const flows = normalizeFlows(overrides.flows, overrides.quickActions, buildDefaultFlows());
  const quickActions = buildQuickActionsFromFlows(flows);
  const operatorQuickReplies = normalizeOperatorQuickReplies(overrides.operatorQuickReplies, [
    'Дякуємо! Ми зв’яжемося з вами найближчим часом.',
    'Надішліть, будь ласка, STL файл.',
    'Для точного прорахунку вкажіть розмір деталі.',
    'Напишіть ваш Telegram або телефон.'
  ]);
  const aiAssistant = buildAiAssistantConfig(overrides.aiAssistant || {});
  const typingSimulation = buildTypingSimulationConfig(overrides.typingSimulation || {});
  const operatorFallback = buildOperatorFallbackConfig(overrides.operatorFallback || {});
  const availability = buildAvailabilityConfig(overrides.availability || {});
  const workingHours = buildWorkingHoursConfig(overrides.workingHours || {});
  const widgetPosition = buildWidgetPosition(overrides.widgetPosition);
  const widgetSize = buildWidgetSize(overrides.widgetSize);
  const pageVisibility = buildPageVisibilityConfig(overrides.pageVisibility || {});
  const language = buildLanguageConfig(overrides.language || {});
  const onlineStatusText = sanitizeText(
    overrides.onlineStatusText || overrides.statusLabels?.ai || 'онлайн',
    80
  ) || 'онлайн';
  const themePrimary = normalizeHexColor(overrides.theme?.primary, '#f78c2f');
  const themeHeaderBg = normalizeHexColor(overrides.theme?.headerBg, '#131926');
  const themeBubbleBg = normalizeHexColor(overrides.theme?.bubbleBg, '#ffffff');
  const themeTextColor = normalizeHexColor(overrides.theme?.textColor, '#1f2734');
  const themePrimarySoft = normalizeHexColor(overrides.theme?.primarySoft, mixHexColors(themePrimary, '#ffffff', 0.22));
  const themeHeaderBgSoft = normalizeHexColor(overrides.theme?.headerBgSoft, mixHexColors(themeHeaderBg, '#ffffff', 0.12));
  const defaultManagerTitle = sanitizeText(overrides.managerTitle || overrides.operatorMetaLabel || `Менеджер ${baseTitle}`, 120) || `Менеджер ${baseTitle}`;
  const operators = normalizeOperators(
    overrides.operators,
    [
      {
        name: sanitizeText(overrides.managerName || '', 120) || 'Operator',
        title: defaultManagerTitle,
        avatarUrl: sanitizeText(overrides.managerAvatarUrl || '', 1024)
      }
    ],
    defaultManagerTitle
  );

  return {
    siteId: cleanSiteId,
    title: baseTitle,
    avatarUrl: sanitizeText(overrides.avatarUrl || '', 1024),
    managerName: sanitizeText(overrides.managerName || '', 120),
    managerTitle: defaultManagerTitle,
    managerAvatarUrl: sanitizeText(overrides.managerAvatarUrl || '', 1024),
    operators,
    welcomeMessage: sanitizeMultilineText(overrides.welcomeMessage || '👋 Привіт!', 2000) || '👋 Привіт!',
    welcomeIntroLabel: sanitizeText(
      overrides.welcomeIntroLabel || overrides.botMetaLabel || `AI помічник ${baseTitle}`,
      120
    ) || `AI помічник ${baseTitle}`,
    typingSimulation,
    operatorFallback,
    availability,
    workingHours,
    widgetPosition,
    widgetSize,
    pageVisibility,
    language,
    onlineStatusText,
    botMetaLabel: sanitizeText(overrides.botMetaLabel || `AI помічник ${baseTitle}`, 120) || `AI помічник ${baseTitle}`,
    operatorMetaLabel: sanitizeText(
      overrides.operatorMetaLabel || overrides.managerTitle || `Менеджер ${baseTitle}`,
      120
    ) || `Менеджер ${baseTitle}`,
    placeholder: sanitizeText(overrides.placeholder || 'Напишіть повідомлення...', 140) || 'Напишіть повідомлення...',
    launcherTitle: sanitizeText(overrides.launcherTitle || 'AI чат', 80) || 'AI чат',
    launcherSubtitle: sanitizeText(overrides.launcherSubtitle || 'підтримка онлайн', 120) || 'підтримка онлайн',
    flows,
    quickActions,
    operatorQuickReplies,
    aiAssistant,
    allowedFileTypes: Array.isArray(overrides.allowedFileTypes) && overrides.allowedFileTypes.length
      ? overrides.allowedFileTypes.map((item) => String(item || '').trim().replace(/^\./, '').toLowerCase()).filter(Boolean)
      : DEFAULT_ALLOWED_FILE_TYPES,
    maxUploadSize: Number(overrides.maxUploadSize || DEFAULT_MAX_UPLOAD_SIZE),
    fileHint: sanitizeText(overrides.fileHint || '', 200),
    aiEnabled: overrides.aiEnabled !== false,
    theme: {
      primary: themePrimary,
      primarySoft: themePrimarySoft,
      headerBg: themeHeaderBg,
      headerBgSoft: themeHeaderBgSoft,
      bubbleBg: themeBubbleBg,
      surface: sanitizeText(overrides.theme?.surface || 'rgba(255, 252, 248, 0.975)', 80) || 'rgba(255, 252, 248, 0.975)',
      textColor: themeTextColor
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
    managerName: 'Марія',
    managerTitle: 'Менеджер PrintForge',
    operatorMetaLabel: 'Менеджер PrintForge',
    operators: [
      { name: 'Maria', title: 'Менеджер PrintForge' },
      { name: 'Ivan', title: 'Менеджер PrintForge' },
      { name: 'Admin', title: 'Адміністратор' }
    ],
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
    flows: [
      { icon: '💰', buttonLabel: 'Дізнатись ціну', slug: 'price', title: 'Price calculation' },
      { icon: '📦', buttonLabel: 'Скільки часу друк', slug: 'print_time', title: 'Print time' },
      { icon: '📎', buttonLabel: 'Завантажити модель', slug: 'file_upload', title: 'Model upload' },
      { icon: '❓', buttonLabel: 'Поставити питання', slug: 'general_question', title: 'General question' }
    ],
    aiAssistant: {
      enabled: false,
      provider: 'openai',
      model: 'gpt-5',
      temperature: 0.4,
      maxTokens: 220,
      companyDescription: 'PrintForge is a 3D printing service that produces plastic parts and prototypes using FDM printers.',
      services: '3D printing, prototype production, small batch production, custom plastic parts.',
      faq: 'If the customer asks for an exact price, first ask for STL/3MF/OBJ file or at least dimensions and material preferences.',
      pricingRules: 'Exact price depends on part size, material, print time, quantity, and post-processing. Do not promise an exact price without file or dimensions.',
      leadTimeRules: 'Typical production lead time is 1-3 business days depending on queue, geometry, and quantity.',
      fileRequirements: 'Preferred formats are STL, 3MF, and OBJ. If no file is available, ask for dimensions, quantity, and photo/reference.',
      deliveryInfo: 'Clarify delivery or pickup details after the technical scope becomes clear.',
      tone: 'Friendly, concise, practical, and professional.',
      forbiddenClaims: 'Do not invent exact prices, delivery guarantees, or technical capabilities that were not provided.',
      defaultLanguage: 'uk',
      responseStyle: 'short',
      askContactStyle: 'Politely ask for phone number or Telegram so the team can return with a calculation faster.',
      askFileStyle: 'Ask for STL/3MF/OBJ file, or dimensions and a reference photo if there is no file.'
    },
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
    managerName: 'Оператор',
    managerTitle: 'Менеджер Parts Shop',
    operatorMetaLabel: 'Менеджер Parts Shop',
    operators: [
      { name: 'Operator', title: 'Менеджер Parts Shop' }
    ],
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
    flows: [
      { icon: '💬', buttonLabel: 'Розрахунок деталі', slug: 'price', title: 'Part estimate' },
      { icon: '📎', buttonLabel: 'Надіслати файл', slug: 'file_upload', title: 'Send file' },
      { icon: '⏱', buttonLabel: 'Термін друку', slug: 'print_time', title: 'Lead time' },
      { icon: '❓', buttonLabel: 'Запитання', slug: 'general_question', title: 'Questions' }
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
    aiAssistant: {
      enabled: false,
      provider: 'openai',
      model: 'gpt-5',
      temperature: 0.4,
      maxTokens: 220,
      companyDescription: 'Parts Shop is a service for custom 3D-printed parts and small replacement components.',
      services: '3D printing, custom parts, prototypes, small production batches.',
      faq: 'If details are missing, ask for dimensions, quantity, and model file before promising anything specific.',
      pricingRules: 'Price depends on geometry, material, quantity, and print time. Do not provide exact price without file or dimensions.',
      leadTimeRules: 'Typical lead time is 1-3 business days, but confirm after reviewing the request.',
      fileRequirements: 'Prefer STL, 3MF, or OBJ. If the customer has no file, ask for dimensions or reference photos.',
      deliveryInfo: 'Clarify shipping or pickup after the order scope is confirmed.',
      tone: 'Helpful, concise, and businesslike.',
      forbiddenClaims: 'Do not promise exact pricing or production timing before reviewing the part.',
      defaultLanguage: 'uk',
      responseStyle: 'short',
      askContactStyle: 'Ask for phone number or Telegram in a practical and polite way.',
      askFileStyle: 'Ask for STL/3MF/OBJ or dimensions and a photo so the team can estimate the part.'
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

const DEFAULT_BASE_SITE_ID = Object.keys(baseSiteConfigs)[0] || '';

function humanizeSiteId(siteId) {
  const clean = String(siteId || '').trim();
  if (!clean) return 'Chat site';
  const spaced = clean
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!spaced) return 'Chat site';
  return spaced
    .split(' ')
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
    .join(' ');
}

function createNeutralSiteTemplate(siteId, overrides = {}) {
  const title = sanitizeText(overrides.title || humanizeSiteId(siteId), 120) || humanizeSiteId(siteId);
  const managerTitle = sanitizeText(overrides.managerTitle || `Manager ${title}`, 120) || `Manager ${title}`;
  return createSiteConfig(siteId, Object.assign({
    title,
    managerName: sanitizeText(overrides.managerName || 'Operator', 120) || 'Operator',
    managerTitle,
    operatorMetaLabel: managerTitle,
    operators: [
      {
        name: sanitizeText(overrides.managerName || 'Operator', 120) || 'Operator',
        title: managerTitle,
        avatarUrl: sanitizeText(overrides.managerAvatarUrl || '', 1024)
      }
    ],
    welcomeMessage: [
      'Hi!',
      `I am the assistant for ${title}.`,
      '',
      'I can help you start a conversation, answer basic questions, or pass the chat to an operator.'
    ].join('\n'),
    welcomeIntroLabel: `AI assistant ${title}`,
    botMetaLabel: `AI assistant ${title}`,
    placeholder: 'Write your message...',
    launcherTitle: 'Chat',
    launcherSubtitle: 'online support',
    onlineStatusText: 'online',
    telegram: {
      enabled: false,
      notifications: {
        enabled: false,
        notifyOnNewConversation: false,
        notifyOnImportantUserMessage: false,
        operatorChatIds: [],
        importantKeywords: []
      }
    },
    aiAssistant: {
      enabled: false,
      provider: 'openai',
      model: 'gpt-5',
      temperature: 0.4,
      maxTokens: 220,
      companyDescription: '',
      services: '',
      faq: '',
      pricingRules: '',
      leadTimeRules: '',
      fileRequirements: '',
      deliveryInfo: '',
      tone: 'Friendly and professional.',
      forbiddenClaims: '',
      defaultLanguage: 'uk',
      responseStyle: 'short',
      askContactStyle: 'Politely ask for a phone number, Telegram, or email when it helps move the request forward.',
      askFileStyle: 'Ask for STL/3MF/OBJ files or at least dimensions and a reference photo.'
    }
  }, overrides || {}));
}

function getBaseSiteTemplate(siteId) {
  const key = String(siteId || '').trim();
  if (key && baseSiteConfigs[key]) {
    return baseSiteConfigs[key];
  }
  return createNeutralSiteTemplate(key || 'site_default', {});
}

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
    managerName: config.managerName,
    managerTitle: config.managerTitle,
    managerAvatarUrl: config.managerAvatarUrl,
    operators: normalizeOperators(config.operators, [], config.managerTitle),
    welcomeMessage: config.welcomeMessage,
    welcomeIntroLabel: config.welcomeIntroLabel,
    typingSimulation: buildTypingSimulationConfig(config.typingSimulation || {}),
    operatorFallback: buildOperatorFallbackConfig(config.operatorFallback || {}),
    availability: buildAvailabilityConfig(config.availability || {}),
    workingHours: buildWorkingHoursConfig(config.workingHours || {}),
    widgetPosition: buildWidgetPosition(config.widgetPosition),
    widgetSize: buildWidgetSize(config.widgetSize),
    pageVisibility: buildPageVisibilityConfig(config.pageVisibility || {}),
    language: buildLanguageConfig(config.language || {}),
    onlineStatusText: config.onlineStatusText,
    theme: {
      primary: config.theme.primary,
      headerBg: config.theme.headerBg,
      bubbleBg: config.theme.bubbleBg,
      textColor: config.theme.textColor
    },
    flows: normalizeFlows(config.flows, config.quickActions, []),
    operatorQuickReplies: normalizeOperatorQuickReplies(config.operatorQuickReplies, []),
    aiAssistant: buildAiAssistantConfig(config.aiAssistant || {}),
    aiProviderStatus: {
      openai: Boolean(process.env.CHAT_PLATFORM_OPENAI_API_KEY || process.env.OPENAI_API_KEY),
      kimi: Boolean(process.env.CHAT_PLATFORM_KIMI_API_KEY || process.env.KIMI_API_KEY)
    }
  };
}

function getPersistedSiteSettings(siteId) {
  const key = String(siteId || '').trim();
  if (!key) return null;
  const store = readSettingsStore();
  const stored = store[key] && typeof store[key] === 'object' ? store[key] : null;
  return stored ? sanitizeSiteSettingsInput(stored, getBaseSiteTemplate(key)) : null;
}

function ensureSiteSettings(siteId, seed = {}) {
  const key = String(siteId || '').trim();
  if (!key) return null;

  const store = readSettingsStore();
  if (!store[key] || typeof store[key] !== 'object') {
    const baseConfig = getBaseSiteTemplate(key);
    store[key] = sanitizeSiteSettingsInput(Object.assign({}, baseConfig, seed || {}), baseConfig);
    writeSettingsStore(store);
  }

  return buildEditableSettings(createSiteConfig(key, store[key]));
}

function sanitizeSiteSettingsInput(input = {}, baseConfig) {
  const merged = createSiteConfig(baseConfig.siteId, Object.assign({}, baseConfig, {
    title: input.title,
    avatarUrl: input.avatarUrl,
    managerName: input.managerName,
    managerTitle: input.managerTitle,
    managerAvatarUrl: input.managerAvatarUrl,
    operators: input.operators,
    welcomeMessage: input.welcomeMessage,
    welcomeIntroLabel: input.welcomeIntroLabel,
    typingSimulation: input.typingSimulation,
    operatorFallback: input.operatorFallback,
    availability: input.availability,
    workingHours: input.workingHours,
    widgetPosition: input.widgetPosition,
    widgetSize: input.widgetSize,
    pageVisibility: input.pageVisibility,
    language: input.language,
    onlineStatusText: input.onlineStatusText,
    theme: Object.assign({}, baseConfig.theme, input.theme || {}),
    flows: input.flows,
    quickActions: input.quickActions,
    operatorQuickReplies: input.operatorQuickReplies,
    aiAssistant: input.aiAssistant
  }));
  return buildEditableSettings(merged);
}

function getSiteConfig(siteId) {
  const key = String(siteId || '').trim();
  if (!key) return null;
  const persisted = getPersistedSiteSettings(key);
  if (persisted) {
    return createSiteConfig(key, persisted);
  }
  const initialized = ensureSiteSettings(key);
  return initialized ? createSiteConfig(key, initialized) : null;
}

function getEditableSiteSettings(siteId) {
  const config = getSiteConfig(siteId);
  return config ? buildEditableSettings(config) : null;
}

function saveSiteSettings(siteId, input) {
  const key = String(siteId || '').trim();
  if (!key) {
    return null;
  }
  const baseConfig = getPersistedSiteSettings(key) || getBaseSiteTemplate(key);
  const store = readSettingsStore();
  store[key] = sanitizeSiteSettingsInput(input, baseConfig);
  writeSettingsStore(store);
  return getEditableSiteSettings(key);
}

function listSiteConfigs() {
  const store = readSettingsStore();
  const keys = Array.from(new Set(Object.keys(baseSiteConfigs).concat(Object.keys(store || {}))));
  return keys
    .map((siteId) => getSiteConfig(siteId))
    .filter(Boolean);
}

function listBootstrapSiteConfigs() {
  return Object.keys(baseSiteConfigs)
    .map((siteId) => getSiteConfig(siteId))
    .filter(Boolean);
}

function listEditableSiteSettings() {
  const store = readSettingsStore();
  const keys = Array.from(new Set(Object.keys(baseSiteConfigs).concat(Object.keys(store || {}))));
  return keys
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
  ensureSiteSettings,
  listBootstrapSiteConfigs,
  listSiteConfigs,
  listEditableSiteSettings,
  normalizeFlows,
  normalizeOperatorQuickReplies,
  buildAiAssistantConfig
};
