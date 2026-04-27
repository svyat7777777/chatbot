const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_GREETING =
  'Маєте запитання? 👋 Допоможемо з 3D друком, ціною, термінами або кастомним замовленням.';
const MAX_TEXT_LENGTH = 4000;
const MESSAGE_RATE_WINDOW_MS = 60 * 1000;
const MESSAGE_RATE_LIMIT = 20;
const DEFAULT_WORKSPACE_ID = 'workspace_default';
const DEFAULT_SITE_ID = 'site_default';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function sanitizeText(value, maxLength = MAX_TEXT_LENGTH) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
    .join('\n')
    .trim()
    .slice(0, maxLength);
}

function normalizeContextMessages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const text = sanitizeText(item && item.text);
      if (!text) return null;
      const senderType = String(item && item.senderType || 'ai').trim().toLowerCase() || 'ai';
      return {
        senderType: ['ai', 'operator', 'system', 'visitor'].includes(senderType) ? senderType : 'ai',
        senderName: sanitizeText(item && item.senderName, 80),
        text,
        messageType: sanitizeText(item && item.messageType, 40) || 'flow'
      };
    })
    .filter(Boolean);
}

function detectLanguage(value) {
  const text = String(value || '');
  const hasCyrillic = /[А-Яа-яІіЇїЄєҐґ]/.test(text);
  return hasCyrillic ? 'uk' : 'en';
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeChannel(value) {
  const clean = String(value || 'web').trim().toLowerCase();
  return ['web', 'telegram', 'instagram', 'facebook'].includes(clean) ? clean : 'web';
}

function formatTelegramDate(date = new Date()) {
  return date.toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
}

function buildStorageName(originalName) {
  const parsed = path.parse(String(originalName || 'file'));
  const baseName = String(parsed.name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'file';
  const ext = String(parsed.ext || '').toLowerCase().slice(0, 12);
  return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${baseName}${ext}`;
}

function normalizeProductOfferSnapshot(value, customMessage = '') {
  const product = value && typeof value === 'object' ? value : {};
  const title = sanitizeText(product.title, 160);
  const url = sanitizeText(product.url || product.link, 2048);
  if (!title || !url) {
    return null;
  }

  return {
    productId: sanitizeText(product.productId || product.id || product.sku || title, 160),
    sku: sanitizeText(product.sku, 120),
    category: sanitizeText(product.category, 120),
    title,
    image: sanitizeText(product.image || product.imageUrl, 2048),
    url,
    price: sanitizeText(product.price, 120),
    shortDescription: sanitizeText(product.shortDescription || product.description, 320),
    customMessage: sanitizeText(customMessage || product.customMessage, 600)
  };
}

function buildProductOfferOutboundText(snapshot, fallbackText = '') {
  const product = normalizeProductOfferSnapshot(snapshot, fallbackText);
  if (!product) {
    return sanitizeText(fallbackText, 2000);
  }

  const lines = [];
  if (product.customMessage) {
    lines.push(product.customMessage);
  }
  lines.push(`Product: ${product.title}`);
  if (product.price) {
    lines.push(`Price: ${product.price}`);
  }
  if (product.shortDescription) {
    lines.push(product.shortDescription);
  }
  lines.push(product.url);
  return sanitizeText(lines.filter(Boolean).join('\n'), 3000);
}

class ChatService {
  constructor(options) {
    this.db = options.db;
    this.contactService = options.contactService || null;
    this.channelDispatcher = options.channelDispatcher || null;
    this.botToken = String(options.botToken || '').trim();
    this.operatorChatIds = this.normalizeOperatorChatIds(options.operatorChatIds || options.operatorChatId || '');
    this.telegramWebhookSecret = String(options.telegramWebhookSecret || '').trim();
    this.publicBaseUrl = options.publicBaseUrl;
    this.siteConfigProvider = typeof options.siteConfigProvider === 'function' ? options.siteConfigProvider : null;
    this.siteConfigsProvider = typeof options.siteConfigsProvider === 'function' ? options.siteConfigsProvider : null;
    this.workspaceService = options.workspaceService || null;
    this.aiAssistantService = options.aiAssistantService || null;
    this.siteProfileProvider = options.siteProfileProvider;
    this.productsProvider = options.productsProvider;
    this.uploadsDir = options.uploadsDir;
    this.publicUploadsBase = options.publicUploadsBase || '/uploads/chat';
    this.sseClients = new Map();
    this.typingStateMap = new Map();
    this.operatorFallbackTimers = new Map();
    this.rateLimitMap = new Map();
    ensureDir(this.uploadsDir);
  }

  normalizeOperatorChatIds(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '').trim()).filter(Boolean);
    }

    return String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  primaryOperatorChatId() {
    return this.operatorChatIds[0] || '';
  }

  getSiteConfig(siteId) {
    return this.siteConfigProvider ? this.siteConfigProvider(String(siteId || '').trim()) : null;
  }

  getAssistantSettings(siteConfig) {
    return siteConfig?.aiAssistant && typeof siteConfig.aiAssistant === 'object'
      ? siteConfig.aiAssistant
      : {};
  }

  buildOperatorFallbackReply(siteConfig, language = 'uk') {
    const assistant = this.getAssistantSettings(siteConfig);
    return sanitizeText(
      assistant.operatorFallbackMessage
        || (language === 'en'
          ? 'A manager is needed for an accurate reply. Please leave your contact details and we will get back to you.'
          : 'Для точної відповіді потрібен менеджер. Залиште, будь ласка, ваші контакти і ми з вами зв’яжемося.'),
      1200
    );
  }

  isExplicitHumanRequest(text) {
    return /(менеджер|оператор|людина|людину|поклич|зв.?яжіть|human|manager|operator|real person|someone from team)/i
      .test(sanitizeText(text, 240));
  }

  countVisitorMessages(conversationId) {
    if (!conversationId || !this.db) return 0;
    const row = this.db
      .prepare('SELECT COUNT(*) AS total FROM messages WHERE conversation_id = ? AND sender_type = ?')
      .get(String(conversationId).trim(), 'visitor');
    return Number(row && row.total) || 0;
  }

  getContactForConversation(conversation) {
    if (!conversation || !this.contactService || typeof this.contactService.listContacts !== 'function') {
      return null;
    }
    const matches = this.contactService.listContacts({
      workspaceId: conversation.workspaceId,
      siteId: conversation.siteId,
      conversationId: conversation.conversationId,
      limit: 1
    });
    return Array.isArray(matches) && matches.length ? matches[0] : null;
  }

  maybeExtractName(text, language = 'uk') {
    const clean = sanitizeText(text, 120).replace(/\s+/g, ' ').trim();
    if (!clean || clean.length > 40) return '';
    if (/[0-9@:/]/.test(clean)) return '';
    if ((clean.match(/\s+/g) || []).length > 2) return '';
    const lower = clean.toLowerCase();
    const patterns = language === 'en'
      ? [
          /^(?:i am|i'm|im|my name is|this is)\s+([a-z][a-z' -]{1,30})$/i,
          /^([a-z][a-z' -]{1,30})$/i
        ]
      : [
          /^(?:я|мене звати|моє ім'?я|це)\s+([а-яіїєґa-z][а-яіїєґa-z' -]{1,30})$/iu,
          /^([а-яіїєґa-z][а-яіїєґa-z' -]{1,30})$/iu
        ];
    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match && match[1]) {
        const candidate = sanitizeText(match[1], 40).replace(/\s+/g, ' ').trim();
        if (candidate && candidate.length >= 2) {
          return candidate
            .split(' ')
            .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : '')
            .join(' ');
        }
      }
    }
    return '';
  }

  isGenericGreetingMessage(text) {
    const clean = sanitizeText(text, 160).toLowerCase();
    if (!clean) return false;
    if (/^(hi|hello|hey|привіт|добрий день|доброго дня|вітаю)\b/iu.test(clean)) {
      return true;
    }
    const genericPatterns = [
      /^(hi|hello|hey|good morning|good afternoon|good evening)$/i,
      /^(привіт|добрий день|доброго дня|доброго вечора|вітаю)$/iu,
      /^(є хтось\??|потрібна допомога|хочу дізнатись|хочу дізнатися|підкажіть)$/iu,
      /^(need help|i need help|can you help|i want to know|need some info)$/i
    ];
    return genericPatterns.some((pattern) => pattern.test(clean));
  }

  isCapabilityQuestion(text) {
    const clean = sanitizeText(text, 240).toLowerCase();
    if (!clean) return false;
    return [
      /чим ти можеш допомогти/iu,
      /ти можеш на щось відповісти/iu,
      /а ти можеш/iu,
      /що ти вмієш/iu,
      /що ти можеш/iu,
      /на що ти можеш відповісти/iu,
      /how can you help/i,
      /what can you do/i,
      /can you answer/i
    ].some((pattern) => pattern.test(clean));
  }

  askedForVisitorName(conversationId) {
    if (!conversationId || !this.db) return false;
    const row = this.db
      .prepare('SELECT message_text AS text FROM messages WHERE conversation_id = ? AND sender_type = ? ORDER BY datetime(created_at) DESC, id DESC LIMIT 6')
      .all(String(conversationId).trim(), 'ai');
    return Array.isArray(row) && row.some((item) => /як я можу до вас звертатися|how may i address you|what should i call you/i.test(String(item && item.text || '')));
  }

  saveCapturedVisitorName(conversation, name) {
    const cleanName = sanitizeText(name, 120);
    if (!cleanName || !conversation || !this.contactService) return null;
    const existing = this.getContactForConversation(conversation);
    if (existing && typeof this.contactService.updateContact === 'function') {
      return this.contactService.updateContact(existing.contactId, Object.assign({}, existing, {
        name: cleanName,
        workspaceId: conversation.workspaceId,
        sourceSiteId: conversation.siteId,
        conversationId: conversation.conversationId
      }));
    }
    if (typeof this.contactService.createContact === 'function') {
      return this.contactService.createContact({
        name: cleanName,
        workspaceId: conversation.workspaceId,
        sourceSiteId: conversation.siteId,
        source: conversation.siteId,
        conversationId: conversation.conversationId,
        lastConversationAt: new Date().toISOString()
      });
    }
    return null;
  }

  buildGreetingIntroReply(siteConfig, language = 'uk') {
    const assistant = this.getAssistantSettings(siteConfig);
    const greeting = sanitizeText(
      assistant.greetingMessage
        || (language === 'en'
          ? 'Hello! I am the PrintForge AI assistant.'
          : 'Вітаю! Я AI-помічник PrintForge.'),
      600
    );
    const capabilities = sanitizeText(
      assistant.capabilitiesMessage
        || (language === 'en'
          ? 'I can help with questions about 3D printing, materials, file requirements, production lead times, delivery, and basic order information.'
          : 'Можу допомогти з питаннями про 3D-друк, матеріали, вимоги до файлів, строки виготовлення, доставку та базову інформацію по замовленню.'),
      1200
    );
    const askName = language === 'en'
      ? 'Please tell me how I can address you.'
      : 'Підкажіть, будь ласка, як я можу до вас звертатися?';
    return [greeting, capabilities, askName].filter(Boolean).join('\n');
  }

  buildCapabilityReply(siteConfig, language = 'uk') {
    const assistant = this.getAssistantSettings(siteConfig);
    return sanitizeText(
      assistant.capabilitiesMessage
        || (language === 'en'
          ? 'I can help with basic information about 3D printing, materials, file preparation, lead times, delivery, and what is needed for an order estimate.\nIf you need an exact model review or help from a manager, I will pass the request to an operator.'
          : 'Я можу підказати базову інформацію про 3D-друк, матеріали, підготовку файлів, строки, доставку та те, що потрібно для розрахунку замовлення.\nЯкщо потрібна точна оцінка моделі або допомога менеджера — я передам запит оператору.'),
      1200
    );
  }

  buildClarifyingKnowledgeReply(siteConfig, language = 'uk') {
    const assistant = this.getAssistantSettings(siteConfig);
    return sanitizeText(
      assistant.capabilitiesMessage
        || (language === 'en'
          ? 'I can help with questions about 3D printing, materials, file preparation, lead times, delivery, and basic order information. Please tell me what exactly you need regarding 3D printing, and I will try to help.'
          : 'Я допомагаю з питаннями про 3D-друк, матеріали, підготовку файлів, строки виготовлення, доставку та базову інформацію по замовленню. Напишіть, будь ласка, що саме вас цікавить щодо 3D-друку, і я постараюся допомогти.'),
      1200
    );
  }

  resolveKnowledgeField(siteConfig, field) {
    const assistant = this.getAssistantSettings(siteConfig);
    const manualValue = sanitizeText(assistant && assistant[field], 2000);
    const generated = assistant && assistant.generatedKnowledge && typeof assistant.generatedKnowledge === 'object'
      ? assistant.generatedKnowledge
      : {};
    const aiValue = sanitizeText(generated && generated[field], 2000);
    return manualValue || aiValue || '';
  }

  cleanKnowledgeSnippet(value, maxLength = 320) {
    const text = sanitizeText(value, 4000)
      .replace(/\b(PrintForge Store|3D PrintForge Store|PrintForge)\b/gi, 'PrintForge')
      .replace(/\b(Блог|Контакти|Замовити|Написати в Telegram|Подзвонити)\b/gi, ' ')
      .replace(/[|•]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (!text) return '';
    const normalized = text
      .replace(/з яких матеріалів друкуєте\??/giu, ' ')
      .replace(/скільки часу друкуєте\??/giu, ' ')
      .replace(/які строки виготовлення\??/giu, ' ')
      .replace(/скільки коштує[^\n.?!?]*\??/giu, ' ')
      .replace(/як(?:а|і)? доставка[^\n.?!?]*\??/giu, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((item) => sanitizeText(item, 260))
      .filter(Boolean)
      .filter((item) => !/^(blog|контакти|замовити|написати|подзвонити)$/i.test(item));
    return sanitizeText((sentences.slice(0, 2).join(' ') || normalized || text), maxLength);
  }

  extractKnownMaterials(siteConfig) {
    const source = [
      this.resolveKnowledgeField(siteConfig, 'services'),
      this.resolveKnowledgeField(siteConfig, 'faq'),
      this.resolveKnowledgeField(siteConfig, 'companyDescription')
    ].join(' ');
    const hits = [];
    [
      ['PLA', /\bpla\b|пла/iu],
      ['PETG', /\bpetg\b|петг/iu],
      ['ABS', /\babs\b|абс/iu],
      ['TPU', /\btpu\b|тпу/iu],
      ['Nylon', /\bnylon\b|нейлон/iu],
      ['Resin', /\bresin\b|смола/iu]
    ].forEach(([label, pattern]) => {
      if (pattern.test(source)) hits.push(label);
    });
    return hits;
  }

  extractLeadTimeAnswer(siteConfig, language = 'uk') {
    const source = [
      this.resolveKnowledgeField(siteConfig, 'leadTimeRules'),
      this.resolveKnowledgeField(siteConfig, 'faq')
    ].join(' ');
    const rangeMatch = source.match(/(\d+\s*(?:[-–]\s*\d+)?)\s*(дн(?:і|ів)?|день|day|days)/iu);
    if (rangeMatch) {
      const value = sanitizeText(rangeMatch[1], 40).replace(/\s+/g, '');
      return language === 'en'
        ? `Usually production takes about ${value} days, but the exact time depends on the model, size, and quantity.`
        : `Зазвичай виготовлення займає приблизно ${value} дні, але точний строк залежить від моделі, розміру та кількості.`;
    }
    return this.cleanKnowledgeSnippet(this.resolveKnowledgeField(siteConfig, 'leadTimeRules') || this.resolveKnowledgeField(siteConfig, 'faq'), 240);
  }

  extractDeliveryAnswer(siteConfig, language = 'uk') {
    const source = [
      this.resolveKnowledgeField(siteConfig, 'deliveryInfo'),
      this.resolveKnowledgeField(siteConfig, 'faq')
    ].join(' ');
    const hasNovaPoshta = /нова пошта|nova poshta/iu.test(source);
    const hasLviv = /львів|lviv/iu.test(source);
    if (hasNovaPoshta || hasLviv) {
      const parts = [];
      if (hasNovaPoshta) {
        parts.push(language === 'en' ? 'We ship across Ukraine with Nova Poshta.' : 'Відправляємо по Україні Новою Поштою.');
      }
      if (hasLviv) {
        parts.push(language === 'en' ? 'In Lviv we can also coordinate local pickup or a fast handoff.' : 'У Львові можемо окремо узгодити самовивіз або швидку передачу замовлення.');
      }
      return sanitizeText(parts.join(' '), 260);
    }
    return this.cleanKnowledgeSnippet(this.resolveKnowledgeField(siteConfig, 'deliveryInfo') || this.resolveKnowledgeField(siteConfig, 'faq'), 240);
  }

  buildDirectKnowledgeReply(siteConfig, text, language = 'uk') {
    const cleanText = sanitizeText(text, 500).toLowerCase();
    if (!cleanText) return '';

    const knowledge = {
      companyDescription: this.resolveKnowledgeField(siteConfig, 'companyDescription'),
      services: this.resolveKnowledgeField(siteConfig, 'services'),
      faq: this.resolveKnowledgeField(siteConfig, 'faq'),
      pricingRules: this.resolveKnowledgeField(siteConfig, 'pricingRules'),
      leadTimeRules: this.resolveKnowledgeField(siteConfig, 'leadTimeRules'),
      fileRequirements: this.resolveKnowledgeField(siteConfig, 'fileRequirements'),
      deliveryInfo: this.resolveKnowledgeField(siteConfig, 'deliveryInfo')
    };

    const firstNonEmpty = (...values) => values.map((value) => this.cleanKnowledgeSnippet(value, 320)).find(Boolean) || '';
    const trimReply = (value) => sanitizeText(value, 700);
    const materials = this.extractKnownMaterials(siteConfig);

    if (/(матеріал|матерiал|pla|petg|abs|нейлон|resin|смола|plastic|filament)/i.test(cleanText)) {
      if (materials.length) {
        return trimReply(
          language === 'en'
            ? `We usually work with ${materials.join(', ')}. If you want, I can also help you choose which material fits your part best.`
            : `Ми зазвичай працюємо з ${materials.join(', ')}. Якщо хочете, я ще підкажу, який матеріал краще підійде саме для вашої деталі.`
        );
      }
      return trimReply(firstNonEmpty(
        /матеріал|pla|petg|abs|нейлон|resin|смола/i.test(knowledge.faq) ? knowledge.faq : '',
        /матеріал|pla|petg|abs|нейлон|resin|смола/i.test(knowledge.services) ? knowledge.services : '',
        knowledge.services
      ));
    }

    if (/(строк|термін|скільки часу|як довго|lead time|turnaround|when ready)/i.test(cleanText)) {
      const base = this.extractLeadTimeAnswer(siteConfig, language);
      if (!base) return '';
      return trimReply(base);
    }

    if (/(достав|відправ|нова пошта|pickup|ship|shipping|delivery)/i.test(cleanText)) {
      return trimReply(this.extractDeliveryAnswer(siteConfig, language));
    }

    if (/(файл|stl|3mf|obj|step|формат|model file|upload)/i.test(cleanText)) {
      return trimReply(firstNonEmpty(knowledge.fileRequirements, knowledge.faq));
    }

    if (/(ціна|вартість|скільки коштує|price|cost|quote|estimate)/i.test(cleanText)) {
      const pricing = firstNonEmpty(knowledge.pricingRules, knowledge.faq);
      if (!pricing) return '';
      return trimReply(pricing);
    }

    if (/(що ви робите|що друкуєте|які послуги|services|what do you do|що можете зробити)/i.test(cleanText)) {
      return trimReply(firstNonEmpty(knowledge.services, knowledge.companyDescription, knowledge.faq));
    }

    if (/(faq|часті питання|підкажіть|розкажіть)/i.test(cleanText) && knowledge.faq) {
      return trimReply(knowledge.faq);
    }

    return '';
  }

  buildNameAcknowledgementReply(name, language = 'uk') {
    const safeName = sanitizeText(name, 80) || (language === 'en' ? 'there' : 'друже');
    return language === 'en'
      ? `Nice to meet you, ${safeName}!\nPlease tell me what exactly you are interested in, and I will do my best to help.`
      : `Дуже приємно, ${safeName}!\nНапишіть, будь ласка, що саме вас цікавить — і я постараюся допомогти.`;
  }

  async buildConversationPreludeDecision({ conversation, text, attachments }) {
    if (!conversation) return null;
    const language = conversation.language === 'en' ? 'en' : 'uk';
    const cleanText = sanitizeText(text, 240);
    const visitorMessageCount = this.countVisitorMessages(conversation.conversationId);
    const siteConfig = this.getSiteConfig(conversation.siteId) || {};

    if (visitorMessageCount <= 1 && this.isGenericGreetingMessage(cleanText)) {
      return {
        escalate: false,
        reason: 'greeting_intro',
        reply: this.buildGreetingIntroReply(siteConfig, language)
      };
    }

    if (this.isCapabilityQuestion(cleanText)) {
      return {
        escalate: false,
        reason: 'capability_intro',
        reply: this.buildCapabilityReply(siteConfig, language)
      };
    }

    if (attachments.length === 0 && this.askedForVisitorName(conversation.conversationId)) {
      const existingContact = this.getContactForConversation(conversation);
      if (!existingContact || !sanitizeText(existingContact.name, 120)) {
        const capturedName = this.maybeExtractName(cleanText, language);
        if (capturedName) {
          this.saveCapturedVisitorName(conversation, capturedName);
          return {
            escalate: false,
            reason: 'name_captured',
            reply: this.buildNameAcknowledgementReply(capturedName, language)
          };
        }
      }
    }

    return null;
  }

  async buildAiPolicyDecision({ conversation, text, attachments }) {
    const language = conversation.language === 'en' ? 'en' : 'uk';
    const siteConfig = this.getSiteConfig(conversation.siteId) || {};
    const assistant = this.getAssistantSettings(siteConfig);
    const cleanText = sanitizeText(text, 2000);
    const attachmentsPresent = Array.isArray(attachments) && attachments.length > 0;
    const requiresHuman = this.isExplicitHumanRequest(cleanText)
      || attachmentsPresent
      || /(refund|complaint|problem with order|wrong order|bad quality|return|повернен|скарг|проблема з замовленням|брак|неякіс)/i.test(cleanText)
      || /(urgent|today|tomorrow|deadline|терміново|сьогодні|завтра|на зараз|дедлайн)/i.test(cleanText)
      || /(discount|cheaper|best price|special price|знижк|скидк|дешевше|торг)/i.test(cleanText)
      || /(my order|order status|where is my order|замовлення|статус замовлення|де моє замовлення|мій заказ)/i.test(cleanText);

    if (requiresHuman) {
      return {
        escalate: true,
        reason: this.isExplicitHumanRequest(cleanText) ? 'human_request' : 'needs_human',
        assignedTo: 'telegram',
        reply: this.buildOperatorFallbackReply(siteConfig, language)
      };
    }

    if (assistant.enabled !== true || !this.aiAssistantService || typeof this.aiAssistantService.generateVisitorReply !== 'function') {
      return {
        escalate: true,
        reason: 'ai_disabled',
        assignedTo: 'telegram',
        reply: this.buildOperatorFallbackReply(siteConfig, language)
      };
    }

    if (typeof this.aiUsageGate === 'function') {
      try {
        const gate = this.aiUsageGate({
          workspaceId: conversation.workspaceId,
          siteId: conversation.siteId,
          conversationId: conversation.conversationId
        });
        if (!gate || gate.allowed !== true) {
          return {
            escalate: true,
            reason: gate && gate.code === 'AI_TOKEN_LIMIT_REACHED' ? 'ai_token_limit_reached' : 'ai_unavailable',
            assignedTo: 'telegram',
            reply: this.buildOperatorFallbackReply(siteConfig, language)
          };
        }
      } catch (error) {
        console.error('AI usage gate failed', error);
        return {
          escalate: true,
          reason: 'ai_usage_gate_error',
          assignedTo: 'telegram',
          reply: this.buildOperatorFallbackReply(siteConfig, language)
        };
      }
    }

    const directKnowledgeReply = this.buildDirectKnowledgeReply(siteConfig, cleanText, language);
    if (directKnowledgeReply) {
      return {
        escalate: false,
        reason: 'direct_knowledge',
        reply: directKnowledgeReply
      };
    }

    const history = this.getMessages(conversation.conversationId);
    let result = null;
    try {
      const requestCaps = typeof this.aiRequestCapsProvider === 'function'
        ? this.aiRequestCapsProvider({
          workspaceId: conversation.workspaceId,
          siteId: conversation.siteId,
          conversationId: conversation.conversationId
        })
        : null;
      result = await this.aiAssistantService.generateVisitorReply({
        siteConfig,
        conversation,
        messages: history,
        currentText: cleanText,
        requestCaps
      });
    } catch (error) {
      console.error('AI visitor reply failed', error);
      return {
        escalate: true,
        reason: 'ai_error',
        assignedTo: 'telegram',
        reply: this.buildOperatorFallbackReply(siteConfig, language)
      };
    }
    const reply = sanitizeText(result && result.text, 2000);
    if (this.aiUsageRecorder && result) {
      try {
        this.aiUsageRecorder({
          workspaceId: conversation.workspaceId,
          siteId: conversation.siteId,
          conversationId: conversation.conversationId,
          provider: result.provider || assistant.provider || '',
          model: result.model || '',
          usage: result.usage,
          inputText: cleanText,
          messages: history,
          text: reply
        });
      } catch (error) {
        console.error('Failed to record AI visitor token usage', error);
      }
    }
    if (!reply || /^UNKNOWN[\s.!?]*$/i.test(reply)) {
      return {
        escalate: false,
        reason: 'unknown_clarify',
        reply: this.buildClarifyingKnowledgeReply(siteConfig, language)
      };
    }

    return {
      escalate: false,
      reason: 'knowledge_reply',
      reply,
      model: result && result.model ? String(result.model) : ''
    };
  }

  createVisitorId() {
    return `v_${crypto.randomBytes(12).toString('hex')}`;
  }

  createConversationId() {
    return `pf-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
  }

  hasTelegramBridge() {
    return Boolean(this.botToken);
  }

  resolveTelegramSettings(siteId) {
    const siteConfig = this.getSiteConfig(siteId);
    const telegram = siteConfig?.telegram && typeof siteConfig.telegram === 'object' ? siteConfig.telegram : {};
    const notifications =
      telegram.notifications && typeof telegram.notifications === 'object'
        ? telegram.notifications
        : {};
    const operatorChatIds = this.normalizeOperatorChatIds(
      notifications.operatorChatIds && notifications.operatorChatIds.length
        ? notifications.operatorChatIds
        : this.operatorChatIds
    );

    return {
      siteTitle: sanitizeText(siteConfig?.title || siteId || 'verbbot.com', 120) || 'verbbot.com',
      botUsername: sanitizeText(telegram.botUsername || '', 80),
      notificationsEnabled: telegram.enabled === true && notifications.enabled === true,
      notifyOnNewConversation: notifications.notifyOnNewConversation === true,
      notifyOnImportantUserMessage: notifications.notifyOnImportantUserMessage === true,
      importantKeywords: Array.isArray(notifications.importantKeywords)
        ? notifications.importantKeywords.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)
        : [],
      operatorChatIds
    };
  }

  hasTelegramNotificationChannel(siteId) {
    const settings = this.resolveTelegramSettings(siteId);
    return Boolean(this.botToken && settings.notificationsEnabled && settings.operatorChatIds.length > 0);
  }

  allTelegramOperatorChatIds() {
    const siteChatIds = this.siteConfigsProvider
      ? this.siteConfigsProvider()
          .filter(Boolean)
          .flatMap((config) => this.resolveTelegramSettings(config.siteId).operatorChatIds)
      : [];
    return Array.from(new Set([...this.operatorChatIds, ...siteChatIds].filter(Boolean)));
  }

  buildPublicUrl(publicPath) {
    const cleanPath = String(publicPath || '').trim();
    if (!cleanPath) return '';
    if (/^https?:\/\//i.test(cleanPath)) {
      return cleanPath;
    }

    const base =
      typeof this.publicBaseUrl === 'function'
        ? String(this.publicBaseUrl() || '').trim().replace(/\/+$/, '')
        : String(this.publicBaseUrl || '').trim().replace(/\/+$/, '');
    if (!base) {
      return cleanPath;
    }
    return `${base}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`;
  }

  withAttachments(messageRow) {
    const attachments = this.db
      .prepare(
        `
        SELECT id, file_name, mime_type, file_size, storage_path, public_url, created_at
        FROM attachments
        WHERE message_id = ?
        ORDER BY id ASC
        `
      )
      .all(messageRow.id)
      .map((item) => ({
        id: Number(item.id),
        fileName: String(item.file_name || ''),
        mimeType: String(item.mime_type || ''),
        fileSize: Number(item.file_size) || 0,
        storagePath: String(item.storage_path || ''),
        publicUrl: this.buildPublicUrl(String(item.public_url || '')),
        createdAt: String(item.created_at || '')
      }));

    return {
      id: Number(messageRow.id),
      conversationId: String(messageRow.conversation_id),
      workspaceId: String(messageRow.workspace_id || DEFAULT_WORKSPACE_ID),
      channel: normalizeChannel(messageRow.channel),
      externalMessageId: String(messageRow.external_message_id || ''),
      senderType: String(messageRow.sender_type),
      senderName: String(messageRow.sender_name || ''),
      text: String(messageRow.message_text || ''),
      messageType: String(messageRow.message_type || 'text'),
      rawPayload: safeJsonParse(messageRow.raw_payload, null),
      direction: String(messageRow.sender_type || '') === 'visitor' ? 'inbound' : 'outbound',
      createdAt: String(messageRow.created_at || ''),
      attachments
    };
  }

  normalizeConversation(row) {
    if (!row) return null;
    const assignedTo = String(row.assigned_to || '');
    const assignedOperator = String(row.assigned_operator || row.assigned_to || '');
    return {
      id: Number(row.id),
      conversationId: String(row.conversation_id),
      workspaceId: String(row.workspace_id || DEFAULT_WORKSPACE_ID),
      siteId: String(row.site_id || DEFAULT_SITE_ID),
      channel: normalizeChannel(row.channel),
      externalChatId: String(row.external_chat_id || ''),
      externalUserId: String(row.external_user_id || ''),
      status: String(row.status || 'ai'),
      language: String(row.language || 'uk'),
      sourcePage: String(row.source_page || ''),
      visitorId: String(row.visitor_id || ''),
      assignedTo,
      assignedOperator,
      unreadCount: Number(row.unread_count) || 0,
      lastOperator: String(row.last_operator || ''),
      handoffAt: String(row.handoff_at || ''),
      humanRepliedAt: String(row.human_replied_at || ''),
      feedbackRequestedAt: String(row.feedback_requested_at || ''),
      feedbackCompletedAt: String(row.feedback_completed_at || ''),
      closedAt: String(row.closed_at || ''),
      createdAt: String(row.created_at || ''),
      updatedAt: String(row.updated_at || ''),
      lastMessageAt: String(row.last_message_at || '')
    };
  }

  getConversationById(conversationId) {
    const row = this.db
      .prepare(
        `
        SELECT *
        FROM conversations
        WHERE conversation_id = ?
        `
      )
      .get(String(conversationId || '').trim());
    return this.normalizeConversation(row);
  }

  getWorkspaceIdForSite(siteId) {
    const cleanSiteId = sanitizeText(siteId, 80) || DEFAULT_SITE_ID;
    if (this.workspaceService && typeof this.workspaceService.getWorkspaceForSite === 'function') {
      return this.workspaceService.getWorkspaceForSite(cleanSiteId)?.id || DEFAULT_WORKSPACE_ID;
    }
    return DEFAULT_WORKSPACE_ID;
  }

  resolveConversationWorkspaceId(conversationId) {
    return this.getConversationById(conversationId)?.workspaceId || DEFAULT_WORKSPACE_ID;
  }

  getConversationForVisitor(conversationId, visitorId) {
    const row = this.db
      .prepare(
        `
        SELECT *
        FROM conversations
        WHERE conversation_id = ? AND visitor_id = ?
        `
      )
      .get(String(conversationId || '').trim(), String(visitorId || '').trim());
    return this.normalizeConversation(row);
  }

  getMessages(conversationId) {
    const rows = this.db
      .prepare(
        `
        SELECT *
        FROM messages
        WHERE conversation_id = ?
        ORDER BY datetime(created_at) ASC, id ASC
        `
      )
      .all(String(conversationId || '').trim());
    return rows.map((row) => this.withAttachments(row));
  }

  getConversationWithMessages(conversationId) {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return null;
    return {
      conversation,
      messages: this.getMessages(conversationId),
      typing: this.getTypingState(conversationId)
    };
  }

  hasVisitorMessages(conversationId) {
    const row = this.db
      .prepare(
        `
        SELECT 1
        FROM messages
        WHERE conversation_id = ?
          AND sender_type = 'visitor'
        LIMIT 1
        `
      )
      .get(String(conversationId || '').trim());
    return Boolean(row);
  }

  getOrCreateConversation({ visitorId, sourcePage, language, siteId, workspaceId = '', channel = 'web', externalChatId = '', externalUserId = '', skipGreeting = false }) {
    const cleanVisitorId = sanitizeText(visitorId, 64) || this.createVisitorId();
    const cleanSourcePage = sanitizeText(sourcePage, 512) || '/';
    const cleanLanguage = ['uk', 'en'].includes(language) ? language : detectLanguage(language);
    const cleanSiteId = sanitizeText(siteId, 80) || DEFAULT_SITE_ID;
    const cleanWorkspaceId = sanitizeText(workspaceId, 120) || this.getWorkspaceIdForSite(cleanSiteId);
    const cleanChannel = normalizeChannel(channel);
    const cleanExternalChatId = sanitizeText(externalChatId, 160);
    const cleanExternalUserId = sanitizeText(externalUserId, 160);
    const siteConfig = this.siteConfigProvider ? this.siteConfigProvider(cleanSiteId) : null;

    const existing = cleanChannel !== 'web' && cleanExternalChatId
      ? this.db
          .prepare(
            `
            SELECT *
            FROM conversations
            WHERE workspace_id = ? AND channel = ? AND external_chat_id = ? AND site_id = ?
            ORDER BY datetime(updated_at) DESC, id DESC
            LIMIT 1
            `
          )
          .get(cleanWorkspaceId, cleanChannel, cleanExternalChatId, cleanSiteId)
      : this.db
          .prepare(
            `
            SELECT *
            FROM conversations
            WHERE workspace_id = ? AND visitor_id = ? AND site_id = ?
            ORDER BY datetime(updated_at) DESC, id DESC
            LIMIT 1
            `
          )
          .get(cleanWorkspaceId, cleanVisitorId, cleanSiteId);

    if (existing) {
      const normalized = this.normalizeConversation(existing);
      if (
        cleanSourcePage && cleanSourcePage !== normalized.sourcePage ||
        (cleanChannel !== normalized.channel) ||
        (cleanExternalChatId && cleanExternalChatId !== normalized.externalChatId) ||
        (cleanExternalUserId && cleanExternalUserId !== normalized.externalUserId)
      ) {
        this.db
          .prepare(
            `
            UPDATE conversations
            SET source_page = ?, channel = ?, external_chat_id = ?, external_user_id = ?, updated_at = datetime('now')
            WHERE conversation_id = ?
            `
          )
          .run(
            cleanSourcePage,
            cleanChannel,
            cleanExternalChatId || null,
            cleanExternalUserId || null,
            normalized.conversationId
          );
      }
      return this.getConversationWithMessages(normalized.conversationId);
    }

    const conversationId = this.createConversationId();
    this.db
      .prepare(
        `
        INSERT INTO conversations (conversation_id, workspace_id, site_id, channel, external_chat_id, external_user_id, status, language, source_page, visitor_id, created_at, updated_at, last_message_at)
        VALUES (?, ?, ?, ?, ?, ?, 'ai', ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
        `
      )
      .run(
        conversationId,
        cleanWorkspaceId,
        cleanSiteId,
        cleanChannel,
        cleanExternalChatId || null,
        cleanExternalUserId || null,
        cleanLanguage || 'uk',
        cleanSourcePage,
        cleanVisitorId
      );

    if (!skipGreeting) {
      const greeting = sanitizeText(
        siteConfig?.welcomeMessage || (cleanLanguage === 'en'
          ? 'Have questions? 👋 We can help with 3D printing, pricing, lead times, or a custom order.'
          : DEFAULT_GREETING),
        1000
      );
      this.addMessage({
        conversationId,
        senderType: 'ai',
        senderName: sanitizeText(siteConfig?.title || 'AI Assistant', 80),
        text: greeting,
        messageType: 'text',
        channel: cleanChannel
      });
    }

    this.addEvent(conversationId, 'conversation_created', {
      workspaceId: cleanWorkspaceId,
      channel: cleanChannel,
      siteId: cleanSiteId,
      sourcePage: cleanSourcePage,
      visitorId: cleanVisitorId,
      externalChatId: cleanExternalChatId,
      externalUserId: cleanExternalUserId
    });

    if (skipGreeting || cleanChannel !== 'web') {
      this.notifyTelegramAboutNewConversation(conversationId).catch((error) => {
        console.error('Failed to send new conversation notification to Telegram', error);
        this.addEvent(conversationId, 'telegram_notification_failed', {
          type: 'new_conversation',
          error: String(error.message || error)
        });
      });
    }

    return this.getConversationWithMessages(conversationId);
  }

  addEvent(conversationId, eventType, payload = {}) {
    const workspaceId = this.resolveConversationWorkspaceId(conversationId);
    this.db
      .prepare(
        `
        INSERT INTO conversation_events (conversation_id, workspace_id, event_type, payload, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        `
      )
      .run(String(conversationId || '').trim(), workspaceId, String(eventType || '').trim(), JSON.stringify(payload || {}));
  }

  updateConversation(conversationId, patch = {}) {
    const current = this.getConversationById(conversationId);
    if (!current) return null;
    const nextStatus = patch.status ? String(patch.status) : current.status;
    const nextLanguage = patch.language ? String(patch.language) : current.language;
    const nextAssignedTo = patch.assignedTo !== undefined ? String(patch.assignedTo || '') : current.assignedTo;
    const nextAssignedOperator =
      patch.assignedOperator !== undefined
        ? String(patch.assignedOperator || '')
        : current.assignedOperator;
    const nextSourcePage = patch.sourcePage !== undefined ? String(patch.sourcePage || '') : current.sourcePage;
    const nextUnreadCount =
      patch.unreadCount !== undefined
        ? Math.max(0, Number(patch.unreadCount) || 0)
        : current.unreadCount;
    const nextLastOperator =
      patch.lastOperator !== undefined
        ? String(patch.lastOperator || '')
        : current.lastOperator;
    const nextHandoffAt =
      patch.handoffAt !== undefined
        ? String(patch.handoffAt || '')
        : current.handoffAt;
    const nextHumanRepliedAt =
      patch.humanRepliedAt !== undefined
        ? String(patch.humanRepliedAt || '')
        : current.humanRepliedAt;
    const nextFeedbackRequestedAt =
      patch.feedbackRequestedAt !== undefined
        ? String(patch.feedbackRequestedAt || '')
        : current.feedbackRequestedAt;
    const nextFeedbackCompletedAt =
      patch.feedbackCompletedAt !== undefined
        ? String(patch.feedbackCompletedAt || '')
        : current.feedbackCompletedAt;
    const nextClosedAt =
      patch.closedAt !== undefined
        ? String(patch.closedAt || '')
        : current.closedAt;

    this.db
      .prepare(
        `
        UPDATE conversations
        SET status = ?, language = ?, assigned_to = ?, assigned_operator = ?, source_page = ?, unread_count = ?, last_operator = ?, handoff_at = ?, human_replied_at = ?, feedback_requested_at = ?, feedback_completed_at = ?, closed_at = ?, updated_at = datetime('now')
        WHERE conversation_id = ?
        `
      )
      .run(
        nextStatus,
        nextLanguage,
        nextAssignedTo || null,
        nextAssignedOperator || null,
        nextSourcePage || null,
        nextUnreadCount,
        nextLastOperator || null,
        nextHandoffAt || null,
        nextHumanRepliedAt || null,
        nextFeedbackRequestedAt || null,
        nextFeedbackCompletedAt || null,
        nextClosedAt || null,
        current.conversationId
      );

    return this.getConversationById(conversationId);
  }

  incrementUnreadCount(conversationId) {
    const cleanConversationId = String(conversationId || '').trim();
    if (!cleanConversationId) return null;
    this.db
      .prepare(
        `
        UPDATE conversations
        SET unread_count = COALESCE(unread_count, 0) + 1, updated_at = datetime('now')
        WHERE conversation_id = ?
        `
      )
      .run(cleanConversationId);
    const updated = this.getConversationById(cleanConversationId);
    if (updated) {
      this.broadcast(cleanConversationId, 'conversation', updated);
    }
    return updated;
  }

  resetUnreadCount(conversationId) {
    const cleanConversationId = String(conversationId || '').trim();
    if (!cleanConversationId) return null;
    this.db
      .prepare(
        `
        UPDATE conversations
        SET unread_count = 0, updated_at = datetime('now')
        WHERE conversation_id = ?
        `
      )
      .run(cleanConversationId);
    const updated = this.getConversationById(cleanConversationId);
    if (updated) {
      this.broadcast(cleanConversationId, 'conversation', updated);
    }
    return updated;
  }

  assignOperator(conversationId, operator) {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return null;

    const cleanOperator = sanitizeText(operator, 80);
    const updated = this.updateConversation(conversationId, {
      assignedTo: cleanOperator,
      assignedOperator: cleanOperator
    });
    this.addEvent(conversationId, 'operator_assigned', {
      operator: cleanOperator || ''
    });
    this.broadcast(conversationId, 'conversation', updated);
    return updated;
  }

  async dispatchOutboundMessage(conversation, message) {
    const activeConversation = conversation?.conversationId
      ? (this.getConversationById(conversation.conversationId) || conversation)
      : null;
    if (!activeConversation || normalizeChannel(activeConversation.channel) === 'web') {
      return { ok: true, skipped: true, channel: 'web' };
    }

    if (!this.channelDispatcher) {
      throw new Error(`Outbound dispatcher is not configured for channel "${activeConversation.channel}"`);
    }

    const outboundMessage =
      String(message && message.messageType || 'text') === 'product_offer'
        ? Object.assign({}, message, {
            text: buildProductOfferOutboundText(message && message.rawPayload, message && message.text)
          })
        : message;

    return this.channelDispatcher.sendMessage(activeConversation, outboundMessage);
  }

  async handleChannelInboundMessage(payload = {}) {
    const cleanChannel = normalizeChannel(payload.channel);
    if (cleanChannel === 'web') {
      throw new Error('INVALID_CHANNEL_MESSAGE');
    }

    const siteId = sanitizeText(payload.siteId, 80) || 'printforge-main';
    const workspaceId = this.getWorkspaceIdForSite(siteId);
    const externalChatId = sanitizeText(payload.externalChatId, 160);
    const externalUserId = sanitizeText(payload.externalUserId || payload.externalChatId, 160);
    const senderName = sanitizeText(payload.senderName, 80) || `${cleanChannel} user`;
    if (!externalChatId || !externalUserId) {
      throw new Error('CHANNEL_IDENTITY_REQUIRED');
    }

    const conversationPayload = this.getOrCreateConversation({
      siteId,
      workspaceId,
      channel: cleanChannel,
      externalChatId,
      externalUserId,
      visitorId: `${cleanChannel}:${externalUserId}`,
      sourcePage: sanitizeText(payload.sourcePage, 512) || `/${cleanChannel}`,
      language: sanitizeText(payload.language, 8) || detectLanguage(payload.text || ''),
      skipGreeting: true
    });
    const conversation = conversationPayload?.conversation;
    if (!conversation) {
      throw new Error('CONVERSATION_NOT_FOUND');
    }

    if (this.contactService && typeof this.contactService.upsertExternalIdentity === 'function') {
      this.contactService.upsertExternalIdentity({
        channel: cleanChannel,
        externalUserId,
        name: senderName,
        workspaceId,
        telegram: payload.senderHandle || '',
        sourceSiteId: siteId,
        conversationId: conversation.conversationId,
        lastConversationAt: new Date().toISOString()
      });
    }

    const beforeMessageIds = new Set((conversationPayload.messages || []).map((item) => Number(item.id)));
    const result = await this.handleVisitorMessage({
      conversationId: conversation.conversationId,
      visitorId: conversation.visitorId,
      text: payload.text,
      files: Array.isArray(payload.files) ? payload.files : [],
      sourcePage: sanitizeText(payload.sourcePage, 512) || `/${cleanChannel}`,
      clientContext: payload.clientContext || {},
      messageMeta: {
        channel: cleanChannel,
        externalMessageId: payload.externalMessageId,
        rawPayload: payload.rawPayload,
        senderName
      }
    });

    const outboundMessages = (result.messages || []).filter((item) => {
      return !beforeMessageIds.has(Number(item.id)) && item.senderType !== 'visitor';
    });

    for (const message of outboundMessages) {
      try {
        const outboundResult = await this.dispatchOutboundMessage(result.conversation, message);
        if (outboundResult && outboundResult.externalMessageId) {
          this.db.prepare(
            `
            UPDATE messages
            SET external_message_id = ?, raw_payload = ?
            WHERE id = ?
            `
          ).run(
            outboundResult.externalMessageId,
            outboundResult.rawPayload == null ? null : JSON.stringify(outboundResult.rawPayload),
            Number(message.id)
          );
        }
      } catch (error) {
        this.addEvent(conversation.conversationId, 'channel_outbound_failed', {
          channel: cleanChannel,
          messageId: message.id,
          error: String(error.message || error)
        });
        console.error(`Failed to send automated ${cleanChannel} reply`, error);
      }
    }

    return this.getConversationWithMessages(conversation.conversationId);
  }

  touchConversation(conversationId) {
    this.db
      .prepare(
        `
        UPDATE conversations
        SET updated_at = datetime('now'), last_message_at = datetime('now')
        WHERE conversation_id = ?
        `
      )
      .run(String(conversationId || '').trim());
  }

  addMessage({ conversationId, senderType, senderName, text, messageType = 'text', attachments = [], channel = '', externalMessageId = '', rawPayload = null }) {
    const cleanConversationId = String(conversationId || '').trim();
    const cleanText = sanitizeText(text);
    const cleanSenderType = String(senderType || 'system').trim();
    const cleanSenderName = sanitizeText(senderName, 80);
    const cleanMessageType = String(messageType || 'text').trim();
    const conversation = this.getConversationById(cleanConversationId);
    const workspaceId = conversation?.workspaceId || DEFAULT_WORKSPACE_ID;
    const cleanChannel = normalizeChannel(channel || conversation?.channel || 'web');
    const cleanExternalMessageId = sanitizeText(externalMessageId, 160);
    const serializedRawPayload = rawPayload == null ? null : JSON.stringify(rawPayload);

    const insert = this.db
      .prepare(
        `
        INSERT INTO messages (conversation_id, workspace_id, channel, external_message_id, sender_type, sender_name, message_text, message_type, raw_payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `
      )
      .run(
        cleanConversationId,
        workspaceId,
        cleanChannel,
        cleanExternalMessageId || null,
        cleanSenderType,
        cleanSenderName || null,
        cleanText || null,
        cleanMessageType,
        serializedRawPayload
      );

    const messageId = Number(insert.lastInsertRowid);

    if (Array.isArray(attachments) && attachments.length > 0) {
      const insertAttachment = this.db.prepare(
        `
        INSERT INTO attachments (message_id, file_name, mime_type, file_size, storage_path, public_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `
      );

      for (const attachment of attachments) {
        insertAttachment.run(
          messageId,
          String(attachment.fileName || 'file'),
          String(attachment.mimeType || ''),
          Number(attachment.fileSize) || 0,
          String(attachment.storagePath || ''),
          String(attachment.publicUrl || '')
        );
      }
    }

    this.touchConversation(cleanConversationId);
    const row = this.db
      .prepare(
        `
        SELECT *
        FROM messages
        WHERE id = ?
        `
      )
      .get(messageId);
    const message = this.withAttachments(row);
    const nextConversation = this.getConversationById(cleanConversationId);
    if (nextConversation) {
      this.broadcast(cleanConversationId, 'conversation', nextConversation);
    }
    this.broadcast(cleanConversationId, 'message', message);
    return message;
  }

  assertVisitorRateLimit(visitorId) {
    const key = String(visitorId || '').trim();
    const now = Date.now();
    const timestamps = (this.rateLimitMap.get(key) || []).filter((item) => now - item < MESSAGE_RATE_WINDOW_MS);
    if (timestamps.length >= MESSAGE_RATE_LIMIT) {
      throw new Error('RATE_LIMIT');
    }
    timestamps.push(now);
    this.rateLimitMap.set(key, timestamps);
  }

  storeUpload(file) {
    const filename = buildStorageName(file.originalname);
    const targetPath = path.join(this.uploadsDir, filename);
    fs.renameSync(file.path, targetPath);
    const publicUrl = this.buildPublicUrl(`${this.publicUploadsBase}/${filename}`);
    return {
      fileName: String(file.originalname || filename),
      mimeType: String(file.mimetype || ''),
      fileSize: Number(file.size) || 0,
      storagePath: targetPath,
      publicUrl
    };
  }

  async handleVisitorMessage({ conversationId, visitorId, text, files = [], sourcePage, clientContext, messageMeta = {} }) {
    const conversation = this.getConversationForVisitor(conversationId, visitorId);
    if (!conversation) {
      throw new Error('CONVERSATION_NOT_FOUND');
    }
    const hadVisitorMessagesBefore = this.hasVisitorMessages(conversation.conversationId);

    const cleanText = sanitizeText(text);
    const storedFiles = files.map((file) => this.storeUpload(file));
    const context = typeof clientContext === 'string'
      ? safeJsonParse(clientContext, {})
      : (clientContext && typeof clientContext === 'object' ? clientContext : {});
    const contextMessages = normalizeContextMessages(context.flowMessages);
    const hasServiceOnlyContext = Boolean(
      context.requestHumanHandoff ||
      (context.leadSummary && typeof context.leadSummary === 'object') ||
      contextMessages.length > 0
    );

    if (cleanText || storedFiles.length > 0) {
      this.assertVisitorRateLimit(visitorId);
    }

    if (!cleanText && storedFiles.length === 0 && !hasServiceOnlyContext) {
      throw new Error('EMPTY_MESSAGE');
    }

    const nextLanguage = cleanText ? detectLanguage(cleanText) : conversation.language;
    this.updateConversation(conversation.conversationId, {
      language: nextLanguage,
      sourcePage: sanitizeText(sourcePage, 512) || conversation.sourcePage
    });

    let visitorMessage = null;
    if (cleanText || storedFiles.length > 0) {
      const visitorMessageType = sanitizeText(context.visitorMessageType, 40) || (storedFiles.length > 0 && !cleanText ? 'file' : 'text');
      visitorMessage = this.addMessage({
        conversationId: conversation.conversationId,
        senderType: 'visitor',
        senderName: sanitizeText(messageMeta.senderName, 80) || 'Visitor',
        text: cleanText,
        messageType: visitorMessageType,
        attachments: storedFiles,
        channel: normalizeChannel(messageMeta.channel || conversation.channel),
        externalMessageId: sanitizeText(messageMeta.externalMessageId, 160),
        rawPayload: messageMeta.rawPayload
      });

      this.addEvent(conversation.conversationId, 'visitor_message', {
        messageId: visitorMessage.id,
        hasAttachments: storedFiles.length > 0
      });
      this.incrementUnreadCount(conversation.conversationId);

      if (!hadVisitorMessagesBefore && normalizeChannel(conversation.channel) === 'web') {
        this.notifyTelegramAboutNewConversation(conversation.conversationId).catch((error) => {
          console.error('Failed to send new conversation notification to Telegram', error);
          this.addEvent(conversation.conversationId, 'telegram_notification_failed', {
            type: 'new_conversation',
            error: String(error.message || error)
          });
        });
      }
    }

    if (context.flowState && typeof context.flowState === 'object') {
      this.addEvent(conversation.conversationId, 'guided_flow_state', context.flowState);
    }

    if (contextMessages.length > 0) {
      const siteConfig = this.getSiteConfig(conversation.siteId);
      const assistantName = sanitizeText(siteConfig?.title || 'AI Assistant', 80) || 'AI Assistant';
      for (const item of contextMessages) {
        this.addMessage({
          conversationId: conversation.conversationId,
          senderType: item.senderType,
          senderName: item.senderName || (item.senderType === 'operator' ? 'Operator' : assistantName),
          text: item.text,
          messageType: item.messageType,
          channel: conversation.channel
        });
        if (item.senderType === 'visitor') {
          this.incrementUnreadCount(conversation.conversationId);
        }
      }
    }

    if (context.leadSummary && typeof context.leadSummary === 'object') {
      this.addEvent(conversation.conversationId, 'lead_summary_captured', context.leadSummary);
    }

    if (visitorMessage) {
      try {
        await this.notifyTelegramAboutImportantVisitorMessage(conversation.conversationId, visitorMessage, context);
      } catch (error) {
        console.error('Failed to send visitor notification to Telegram', error);
        this.addEvent(conversation.conversationId, 'telegram_notification_failed', {
          messageId: visitorMessage.id,
          error: String(error.message || error)
        });
      }
    }

    if (context.requestHumanHandoff) {
      const updatedConversation = this.updateConversation(conversation.conversationId, {
        status: 'waiting_operator',
        assignedTo: sanitizeText(context.assignedTo || 'telegram', 80) || 'telegram',
        assignedOperator: sanitizeText(context.assignedTo || '', 80),
        handoffAt: conversation.handoffAt || new Date().toISOString(),
        closedAt: ''
      });
      this.addEvent(conversation.conversationId, 'lead_ready_for_handoff', {
        flowType: sanitizeText(context.flowType || '', 80),
        summary: context.leadSummary || null
      });
      this.broadcast(conversation.conversationId, 'conversation', updatedConversation);

      if (context.leadSummary && typeof context.leadSummary === 'object') {
        try {
          await this.notifyTelegramAboutLeadHandoff(conversation.conversationId, context.leadSummary);
        } catch (error) {
          console.error('Failed to deliver lead summary to Telegram', error);
          this.addEvent(conversation.conversationId, 'telegram_notification_failed', {
            error: String(error.message || error),
            type: 'lead_summary'
          });
        }
      }

      const confirmationText = sanitizeText(context.confirmationText);
      if (confirmationText) {
        this.addMessage({
          conversationId: conversation.conversationId,
          senderType: 'system',
          senderName: 'System',
          text: confirmationText,
          messageType: 'system',
          channel: conversation.channel
        });
      }

      if (visitorMessage) {
        this.scheduleOperatorFallback(updatedConversation, visitorMessage);
      }

      return this.getConversationWithMessages(conversation.conversationId);
    }

    const refreshed = this.getConversationById(conversation.conversationId);
    if (visitorMessage) {
      this.scheduleOperatorFallback(refreshed, visitorMessage);
    }
    if (refreshed.status === 'human' || refreshed.status === 'closed') {
      return this.getConversationWithMessages(conversation.conversationId);
    }

    if (context.skipAiReply) {
      return this.getConversationWithMessages(conversation.conversationId);
    }

    const preludeDecision = await this.buildConversationPreludeDecision({
      conversation: refreshed,
      text: cleanText,
      attachments: storedFiles
    });
    if (preludeDecision && preludeDecision.reply) {
      this.addMessage({
        conversationId: conversation.conversationId,
        senderType: 'ai',
        senderName: 'PrintForge AI',
        text: preludeDecision.reply,
        messageType: 'text',
        channel: conversation.channel
      });
      return this.getConversationWithMessages(conversation.conversationId);
    }

    const aiDecision = await this.buildAiDecision({
      conversation: refreshed,
      text: cleanText,
      attachments: storedFiles
    });

    if (aiDecision.escalate) {
      const updated = this.updateConversation(conversation.conversationId, {
        status: 'waiting_operator',
        assignedTo: aiDecision.assignedTo || 'telegram',
        assignedOperator: sanitizeText(aiDecision.assignedOperator || '', 80),
        handoffAt: refreshed.handoffAt || new Date().toISOString(),
        closedAt: ''
      });
      this.addEvent(conversation.conversationId, 'escalated_to_human', { reason: aiDecision.reason });
      this.broadcast(conversation.conversationId, 'conversation', updated);
      this.addMessage({
        conversationId: conversation.conversationId,
        senderType: 'ai',
        senderName: 'PrintForge AI',
        text: aiDecision.reply
          || (updated.language === 'en'
            ? 'A manager will continue this chat shortly.'
            : 'Менеджер продовжить цей чат найближчим часом.'),
        messageType: 'text',
        channel: conversation.channel
      });
      if (visitorMessage) {
        this.scheduleOperatorFallback(updated, visitorMessage);
      }
      return this.getConversationWithMessages(conversation.conversationId);
    }

    if (aiDecision.reply) {
      this.addMessage({
        conversationId: conversation.conversationId,
        senderType: 'ai',
        senderName: 'PrintForge AI',
        text: aiDecision.reply,
        messageType: 'text',
        channel: conversation.channel
      });
    }

    return this.getConversationWithMessages(conversation.conversationId);
  }

  async buildAiDecision({ conversation, text, attachments }) {
    return this.buildAiPolicyDecision({ conversation, text, attachments });
  }

  listConversationsByWorkspace(workspaceId, options = {}) {
    return this.listConversations(Object.assign({}, options, { workspaceId }));
  }

  createConversationForSite(options = {}) {
    const siteId = sanitizeText(options.siteId, 80) || DEFAULT_SITE_ID;
    const workspaceId = sanitizeText(options.workspaceId, 120) || this.getWorkspaceIdForSite(siteId);
    return this.getOrCreateConversation(Object.assign({}, options, { siteId, workspaceId }));
  }

  createMessageForWorkspace({ workspaceId, conversationId, ...rest }) {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) {
      throw new Error('CONVERSATION_NOT_FOUND');
    }
    if (workspaceId && conversation.workspaceId !== String(workspaceId).trim()) {
      throw new Error('WORKSPACE_CONVERSATION_MISMATCH');
    }
    return this.addMessage(Object.assign({ conversationId }, rest));
  }

  listConversations({ workspaceId, status, siteId, search, limit = 100 }) {
    const clauses = [];
    const params = [];

    if (workspaceId) {
      clauses.push('c.workspace_id = ?');
      params.push(String(workspaceId).trim());
    }

    if (status && ['ai', 'waiting_operator', 'human', 'closed'].includes(status)) {
      clauses.push('c.status = ?');
      params.push(status);
    }

    if (siteId) {
      clauses.push('c.site_id = ?');
      params.push(String(siteId).trim());
    }

    if (search) {
      clauses.push('(c.conversation_id LIKE ? OR c.site_id LIKE ? OR c.source_page LIKE ? OR c.channel LIKE ? OR c.external_chat_id LIKE ? OR c.external_user_id LIKE ? OR m.message_text LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.db
      .prepare(
        `
        SELECT c.id,
               c.conversation_id,
               c.workspace_id,
               c.site_id,
               c.channel,
               c.external_chat_id,
               c.external_user_id,
               c.status,
               c.language,
               c.source_page,
               c.visitor_id,
               c.assigned_to,
               c.assigned_operator,
               c.unread_count,
               c.last_operator,
               c.handoff_at,
               c.human_replied_at,
               c.feedback_requested_at,
               c.feedback_completed_at,
               c.closed_at,
               c.created_at,
               c.updated_at,
               c.last_message_at,
               (
                 SELECT message_text
                 FROM messages mx
                 WHERE mx.conversation_id = c.conversation_id
                 ORDER BY datetime(mx.created_at) DESC, mx.id DESC
                 LIMIT 1
               ) AS last_message,
               (
                 SELECT created_at
                 FROM messages mv
                 WHERE mv.conversation_id = c.conversation_id
                   AND mv.sender_type = 'visitor'
                 ORDER BY datetime(mv.created_at) DESC, mv.id DESC
                 LIMIT 1
               ) AS last_visitor_message_at,
               EXISTS(
                 SELECT 1
                 FROM messages mm
                 JOIN attachments a ON a.message_id = mm.id
                 WHERE mm.conversation_id = c.conversation_id
               ) AS has_attachments
        FROM conversations c
        LEFT JOIN messages m ON m.conversation_id = c.conversation_id
        ${whereSql}
        GROUP BY c.id
        ORDER BY datetime(c.last_message_at) DESC, c.id DESC
        LIMIT ?
        `
      )
      .all(...params, Number(limit) || 100);

    return rows.map((row) => ({
      ...this.normalizeConversation(row),
      inboxStatus: String(row.status || 'ai') === 'closed' ? 'closed' : 'open',
      lastMessage: sanitizeText(row.last_message, 180),
      lastVisitorMessageAt: String(row.last_visitor_message_at || ''),
      hasAttachments: Number(row.has_attachments) === 1
    }));
  }

  listInboxConversations({ workspaceId, status, siteId, search, limit = 100 }) {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const sourceStatus =
      normalizedStatus === 'closed'
        ? 'closed'
        : normalizedStatus === 'open'
          ? null
          : null;

    const items = this.listConversations({
      workspaceId,
      status: sourceStatus,
      siteId,
      search,
      limit
    });

    const visibleItems = items.filter((item) => Boolean(item.lastVisitorMessageAt));

    if (normalizedStatus === 'open') {
      return visibleItems.filter((item) => item.inboxStatus === 'open');
    }

    if (normalizedStatus === 'closed') {
      return visibleItems.filter((item) => item.inboxStatus === 'closed');
    }

    return visibleItems;
  }

  listEvents(conversationId) {
    return this.db
      .prepare(
        `
        SELECT id, conversation_id, workspace_id, event_type, payload, created_at
        FROM conversation_events
        WHERE conversation_id = ?
        ORDER BY datetime(created_at) DESC, id DESC
        LIMIT 100
        `
      )
      .all(String(conversationId || '').trim())
      .map((row) => ({
        id: Number(row.id),
        conversationId: String(row.conversation_id),
        workspaceId: String(row.workspace_id || DEFAULT_WORKSPACE_ID),
        eventType: String(row.event_type),
        payload: safeJsonParse(row.payload, {}),
        createdAt: String(row.created_at || '')
      }));
  }

  getFeedbackForConversation(conversationId) {
    const row = this.db
      .prepare(
        `
        SELECT id, conversation_id, workspace_id, rating, ease, comment, created_at, requested_by
        FROM conversation_feedback
        WHERE conversation_id = ?
        LIMIT 1
        `
      )
      .get(String(conversationId || '').trim());
    if (!row) return null;
    return {
      id: String(row.id || ''),
      conversationId: String(row.conversation_id || ''),
      workspaceId: String(row.workspace_id || DEFAULT_WORKSPACE_ID),
      rating: String(row.rating || ''),
      ease: String(row.ease || ''),
      comment: String(row.comment || ''),
      createdAt: String(row.created_at || ''),
      requestedBy: String(row.requested_by || '')
    };
  }

  requestFeedback(conversationId, operatorName = 'Operator') {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return null;

    const cleanOperatorName = sanitizeText(operatorName, 80) || 'Operator';
    const requestedAt = new Date().toISOString();
    const updated = this.updateConversation(conversationId, {
      feedbackRequestedAt: requestedAt,
      feedbackCompletedAt: ''
    });
    this.addEvent(conversationId, 'feedback_requested', {
      requestedBy: cleanOperatorName,
      requestedAt
    });
    this.broadcast(conversationId, 'conversation', updated);
    return updated;
  }

  submitFeedback({ conversationId, visitorId, rating, ease, comment, requestedBy = '' }) {
    const conversation = this.getConversationForVisitor(conversationId, visitorId);
    if (!conversation) {
      throw new Error('CONVERSATION_NOT_FOUND');
    }
    if (!conversation.feedbackRequestedAt) {
      throw new Error('FEEDBACK_NOT_REQUESTED');
    }

    const cleanRating = String(rating || '').trim().toLowerCase();
    if (!['up', 'down'].includes(cleanRating)) {
      throw new Error('INVALID_FEEDBACK_RATING');
    }

    const cleanEase = sanitizeText(ease, 40).toLowerCase();
    const allowedEase = ['', 'very_easy', 'easy', 'neutral', 'difficult', 'very_difficult'];
    if (!allowedEase.includes(cleanEase)) {
      throw new Error('INVALID_FEEDBACK_EASE');
    }

    const cleanComment = sanitizeText(comment, 1000);
    const existing = this.getFeedbackForConversation(conversationId);
    const feedbackId = existing?.id || `fb_${crypto.randomBytes(8).toString('hex')}`;
    const completedAt = new Date().toISOString();

    this.db
      .prepare(
        `
        INSERT INTO conversation_feedback (id, conversation_id, workspace_id, rating, ease, comment, created_at, requested_by)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)
        ON CONFLICT(conversation_id)
        DO UPDATE SET
          id = excluded.id,
          workspace_id = excluded.workspace_id,
          rating = excluded.rating,
          ease = excluded.ease,
          comment = excluded.comment,
          created_at = datetime('now'),
          requested_by = excluded.requested_by
        `
      )
      .run(
        feedbackId,
        conversation.conversationId,
        conversation.workspaceId || DEFAULT_WORKSPACE_ID,
        cleanRating,
        cleanEase || null,
        cleanComment || null,
        sanitizeText(requestedBy, 80) || null
      );

    const updated = this.updateConversation(conversation.conversationId, {
      feedbackCompletedAt: completedAt
    });
    this.addEvent(conversation.conversationId, 'feedback_submitted', {
      rating: cleanRating,
      ease: cleanEase || '',
      comment: cleanComment
    });
    this.broadcast(conversation.conversationId, 'conversation', updated);

    return {
      conversation: updated,
      feedback: this.getFeedbackForConversation(conversation.conversationId)
    };
  }

  async addInboxReply(conversationId, text, operatorName = 'Operator') {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return null;

    const cleanText = sanitizeText(text);
    if (!cleanText) {
      return null;
    }

    const cleanOperatorName = sanitizeText(operatorName, 80) || 'Operator';
    this.clearOperatorFallbackTimer(conversationId);
    const firstHumanReplyAt = conversation.humanRepliedAt || new Date().toISOString();
    const updated = this.updateConversation(conversationId, {
      status: 'human',
      assignedTo: cleanOperatorName,
      assignedOperator: cleanOperatorName,
      unreadCount: 0,
      lastOperator: cleanOperatorName,
      humanRepliedAt: firstHumanReplyAt,
      closedAt: ''
    });
    this.broadcast(conversationId, 'conversation', updated);
    this.addEvent(conversationId, 'operator_replied_from_inbox', { operator: cleanOperatorName });
    const message = this.addMessage({
      conversationId,
      senderType: 'operator',
      senderName: cleanOperatorName,
      text: cleanText,
      messageType: 'text',
      channel: conversation.channel
    });
    this.setOperatorTyping(conversationId, false, cleanOperatorName);

    try {
      const outboundResult = await this.dispatchOutboundMessage(conversation, message);
      if (outboundResult && outboundResult.externalMessageId) {
        this.db.prepare(
          `
          UPDATE messages
          SET external_message_id = ?, raw_payload = ?
          WHERE id = ?
          `
        ).run(
          outboundResult.externalMessageId,
          outboundResult.rawPayload == null ? null : JSON.stringify(outboundResult.rawPayload),
          Number(message.id)
        );
      }
    } catch (error) {
      this.addEvent(conversationId, 'channel_outbound_failed', {
        channel: conversation.channel,
        messageId: message.id,
        error: String(error.message || error)
      });
      console.error(`Failed to send outbound ${conversation.channel} reply`, error);
    }

    return {
      conversation: this.getConversationById(conversationId),
      message,
      messages: this.getMessages(conversationId)
    };
  }

  async addInboxProductOffer(conversationId, product, operatorName = 'Operator', customMessage = '') {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return null;

    const snapshot = normalizeProductOfferSnapshot(product, customMessage);
    if (!snapshot) {
      throw new Error('INVALID_PRODUCT_OFFER');
    }

    const cleanOperatorName = sanitizeText(operatorName, 80) || 'Operator';
    this.clearOperatorFallbackTimer(conversationId);
    const firstHumanReplyAt = conversation.humanRepliedAt || new Date().toISOString();
    const updated = this.updateConversation(conversationId, {
      status: 'human',
      assignedTo: cleanOperatorName,
      assignedOperator: cleanOperatorName,
      unreadCount: 0,
      lastOperator: cleanOperatorName,
      humanRepliedAt: firstHumanReplyAt,
      closedAt: ''
    });
    this.broadcast(conversationId, 'conversation', updated);
    this.addEvent(conversationId, 'product_offer_sent_from_inbox', {
      operator: cleanOperatorName,
      productId: snapshot.productId,
      title: snapshot.title,
      channel: conversation.channel
    });
    const message = this.addMessage({
      conversationId,
      senderType: 'operator',
      senderName: cleanOperatorName,
      text: snapshot.customMessage || '',
      messageType: 'product_offer',
      channel: conversation.channel,
      rawPayload: snapshot
    });
    this.setOperatorTyping(conversationId, false, cleanOperatorName);

    try {
      const outboundResult = await this.dispatchOutboundMessage(conversation, message);
      if (outboundResult && outboundResult.externalMessageId) {
        this.db.prepare(
          `
          UPDATE messages
          SET external_message_id = ?
          WHERE id = ?
          `
        ).run(
          outboundResult.externalMessageId,
          Number(message.id)
        );
      }
    } catch (error) {
      this.addEvent(conversationId, 'channel_outbound_failed', {
        channel: conversation.channel,
        messageId: message.id,
        error: String(error.message || error)
      });
      console.error(`Failed to send outbound ${conversation.channel} product offer`, error);
    }

    return {
      conversation: this.getConversationById(conversationId),
      message,
      messages: this.getMessages(conversationId)
    };
  }

  setInboxStatus(conversationId, status, operatorName = 'Operator') {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return null;

    const cleanStatus = String(status || '').trim().toLowerCase();
    const cleanOperatorName = sanitizeText(operatorName, 80) || 'Operator';
    const nextStatus = cleanStatus === 'closed' ? 'closed' : 'human';
    const updated = this.updateConversation(conversationId, {
      status: nextStatus,
      assignedTo: nextStatus === 'closed' ? '' : cleanOperatorName,
      assignedOperator: nextStatus === 'closed' ? '' : cleanOperatorName,
      lastOperator: cleanOperatorName,
      humanRepliedAt: nextStatus === 'human' ? (conversation.humanRepliedAt || new Date().toISOString()) : conversation.humanRepliedAt,
      closedAt: nextStatus === 'closed' ? new Date().toISOString() : ''
    });

    this.addEvent(conversationId, 'inbox_status_changed', {
      status: cleanStatus === 'closed' ? 'closed' : 'open',
      operator: cleanOperatorName
    });
    this.broadcast(conversationId, 'conversation', updated);
    if (cleanStatus === 'closed') {
      this.clearOperatorFallbackTimer(conversationId);
      this.setOperatorTyping(conversationId, false, cleanOperatorName);
    }

    return updated;
  }

  setOperatorTyping(conversationId, isTyping, operatorName = 'Operator') {
    const cleanConversationId = String(conversationId || '').trim();
    if (!cleanConversationId) return null;

    const conversation = this.getConversationById(cleanConversationId);
    if (!conversation) return null;

    const active = isTyping === true && String(conversation.status || '').trim().toLowerCase() !== 'closed';
    const payload = {
      active,
      actor: 'operator',
      operatorName: sanitizeText(operatorName, 80) || 'Operator',
      conversationId: cleanConversationId,
      updatedAt: new Date().toISOString()
    };

    if (active) {
      this.typingStateMap.set(cleanConversationId, payload);
    } else {
      this.typingStateMap.delete(cleanConversationId);
    }

    this.broadcast(cleanConversationId, 'typing', payload);
    return payload;
  }

  getTypingState(conversationId) {
    return this.typingStateMap.get(String(conversationId || '').trim()) || null;
  }

  getOperatorFallbackConfig(siteId) {
    const siteConfig = this.getSiteConfig(siteId);
    const fallback = siteConfig && typeof siteConfig.operatorFallback === 'object' ? siteConfig.operatorFallback : {};
    return {
      enabled: fallback.enabled === true,
      delaySeconds: Math.max(5, Math.min(600, Number(fallback.delaySeconds) || 30)),
      message:
        sanitizeText(
          fallback.message || 'Оператори зараз зайняті, але ми на зв’язку. Залишайтесь у чаті, і ми відповімо вам якнайшвидше.',
          1000
        ) || 'Оператори зараз зайняті, але ми на зв’язку. Залишайтесь у чаті, і ми відповімо вам якнайшвидше.'
    };
  }

  clearOperatorFallbackTimer(conversationId) {
    const key = String(conversationId || '').trim();
    const current = this.operatorFallbackTimers.get(key);
    if (current && current.timeoutId) {
      clearTimeout(current.timeoutId);
    }
    this.operatorFallbackTimers.delete(key);
  }

  hasOperatorReplyAfterMessage(conversationId, messageId) {
    const row = this.db
      .prepare(
        `
        SELECT 1
        FROM messages
        WHERE conversation_id = ?
          AND sender_type = 'operator'
          AND id > ?
        LIMIT 1
        `
      )
      .get(String(conversationId || '').trim(), Number(messageId) || 0);
    return Boolean(row);
  }

  hasOperatorFallbackBeenSent(conversationId) {
    const row = this.db
      .prepare(
        `
        SELECT 1
        FROM conversation_events
        WHERE conversation_id = ?
          AND event_type = 'operator_fallback_sent'
        LIMIT 1
        `
      )
      .get(String(conversationId || '').trim());
    return Boolean(row);
  }

  scheduleOperatorFallback(conversation, visitorMessage) {
    const currentConversation = conversation && conversation.conversationId
      ? conversation
      : this.getConversationById(conversation);
    const cleanConversationId = String(currentConversation?.conversationId || '').trim();
    if (!cleanConversationId || !visitorMessage || Number(visitorMessage.id) <= 0) {
      return;
    }

    const status = String(currentConversation.status || '').trim().toLowerCase();
    if (!['human', 'waiting_operator'].includes(status)) {
      this.clearOperatorFallbackTimer(cleanConversationId);
      return;
    }

    if (this.hasOperatorFallbackBeenSent(cleanConversationId)) {
      this.clearOperatorFallbackTimer(cleanConversationId);
      return;
    }

    const fallbackConfig = this.getOperatorFallbackConfig(currentConversation.siteId);
    if (!fallbackConfig.enabled || !fallbackConfig.message) {
      this.clearOperatorFallbackTimer(cleanConversationId);
      return;
    }

    this.clearOperatorFallbackTimer(cleanConversationId);
    const timeoutId = setTimeout(() => {
      this.runOperatorFallback(cleanConversationId, {
        triggerMessageId: Number(visitorMessage.id) || 0,
        siteId: currentConversation.siteId
      }).catch((error) => {
        console.error('Failed to send operator fallback message', error);
      });
    }, fallbackConfig.delaySeconds * 1000);

    if (typeof timeoutId.unref === 'function') {
      timeoutId.unref();
    }

    this.operatorFallbackTimers.set(cleanConversationId, {
      timeoutId,
      triggerMessageId: Number(visitorMessage.id) || 0
    });
  }

  async runOperatorFallback(conversationId, context = {}) {
    const cleanConversationId = String(conversationId || '').trim();
    const activeTimer = this.operatorFallbackTimers.get(cleanConversationId);
    const expectedMessageId = Number(context.triggerMessageId) || 0;
    if (!activeTimer || activeTimer.triggerMessageId !== expectedMessageId) {
      return null;
    }

    this.operatorFallbackTimers.delete(cleanConversationId);
    const conversation = this.getConversationById(cleanConversationId);
    if (!conversation) {
      return null;
    }

    const status = String(conversation.status || '').trim().toLowerCase();
    if (!['human', 'waiting_operator'].includes(status)) {
      return null;
    }

    if (this.hasOperatorFallbackBeenSent(cleanConversationId)) {
      return null;
    }

    if (this.hasOperatorReplyAfterMessage(cleanConversationId, expectedMessageId)) {
      return null;
    }

    const fallbackConfig = this.getOperatorFallbackConfig(conversation.siteId || context.siteId);
    if (!fallbackConfig.enabled || !fallbackConfig.message) {
      return null;
    }

    const siteConfig = this.getSiteConfig(conversation.siteId);
    const senderName = sanitizeText(siteConfig?.title || 'AI Assistant', 80) || 'AI Assistant';
    const message = this.addMessage({
      conversationId: cleanConversationId,
      senderType: 'ai',
      senderName,
      text: fallbackConfig.message,
      messageType: 'operator_fallback',
      channel: conversation.channel
    });
    this.addEvent(cleanConversationId, 'operator_fallback_sent', {
      triggerMessageId: expectedMessageId,
      delaySeconds: fallbackConfig.delaySeconds
    });

    try {
      const outboundResult = await this.dispatchOutboundMessage(conversation, message);
      if (outboundResult && outboundResult.externalMessageId) {
        this.db.prepare(
          `
          UPDATE messages
          SET external_message_id = ?, raw_payload = ?
          WHERE id = ?
          `
        ).run(
          outboundResult.externalMessageId,
          outboundResult.rawPayload == null ? null : JSON.stringify(outboundResult.rawPayload),
          Number(message.id)
        );
      }
    } catch (error) {
      this.addEvent(cleanConversationId, 'channel_outbound_failed', {
        channel: conversation.channel,
        messageId: message.id,
        error: String(error.message || error)
      });
      console.error(`Failed to send operator fallback via ${conversation.channel}`, error);
    }

    return message;
  }

  deleteConversations(conversationIds = []) {
    const ids = Array.from(new Set(
      (Array.isArray(conversationIds) ? conversationIds : [conversationIds])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    ));

    if (!ids.length) {
      return { deletedCount: 0 };
    }

    const placeholders = ids.map(() => '?').join(', ');
    const attachmentRows = this.db
      .prepare(
        `
        SELECT a.storage_path
        FROM attachments a
        JOIN messages m ON m.id = a.message_id
        WHERE m.conversation_id IN (${placeholders})
        `
      )
      .all(...ids);

    const existingIds = this.db
      .prepare(
        `
        SELECT conversation_id
        FROM conversations
        WHERE conversation_id IN (${placeholders})
        `
      )
      .all(...ids)
      .map((row) => String(row.conversation_id || '').trim())
      .filter(Boolean);

    if (!existingIds.length) {
      return { deletedCount: 0 };
    }

    const deleteTransaction = this.db.transaction((targetIds) => {
      const deleteAttachments = this.db.prepare(
        `
        DELETE FROM attachments
        WHERE message_id IN (
          SELECT id
          FROM messages
          WHERE conversation_id IN (${targetIds.map(() => '?').join(', ')})
        )
        `
      );
      const deleteMessages = this.db.prepare(
        `
        DELETE FROM messages
        WHERE conversation_id IN (${targetIds.map(() => '?').join(', ')})
        `
      );
      const deleteEvents = this.db.prepare(
        `
        DELETE FROM conversation_events
        WHERE conversation_id IN (${targetIds.map(() => '?').join(', ')})
        `
      );
      const deleteConversations = this.db.prepare(
        `
        DELETE FROM conversations
        WHERE conversation_id IN (${targetIds.map(() => '?').join(', ')})
        `
      );

      deleteAttachments.run(...targetIds);
      deleteMessages.run(...targetIds);
      deleteEvents.run(...targetIds);
      deleteConversations.run(...targetIds);
    });

    deleteTransaction(existingIds);

    for (const row of attachmentRows) {
      const filePath = String(row.storage_path || '').trim();
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Failed to remove chat attachment file', error);
        }
      }
    }

    for (const conversationId of existingIds) {
      const clients = this.sseClients.get(conversationId) || [];
      for (const client of clients) {
        try {
          client.end();
        } catch (error) {
          console.error('Failed to close SSE client for deleted conversation', error);
        }
      }
      this.sseClients.delete(conversationId);
    }

    return { deletedCount: existingIds.length };
  }

  broadcast(conversationId, eventName, payload) {
    const set = this.sseClients.get(String(conversationId || '').trim());
    if (!set || set.size === 0) return;
    const serialized = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of set) {
      res.write(serialized);
    }
  }

  addSseClient(conversationId, res) {
    const key = String(conversationId || '').trim();
    const set = this.sseClients.get(key) || new Set();
    set.add(res);
    this.sseClients.set(key, set);
    const typingState = this.getTypingState(key);
    if (typingState) {
      res.write(`event: typing\ndata: ${JSON.stringify(typingState)}\n\n`);
    }
  }

  removeSseClient(conversationId, res) {
    const key = String(conversationId || '').trim();
    const set = this.sseClients.get(key);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) {
      this.sseClients.delete(key);
    }
  }

  isImportantVisitorMessage({ conversation, message, context = {} }) {
    const settings = this.resolveTelegramSettings(conversation?.siteId);
    if (!settings.notificationsEnabled || !settings.notifyOnImportantUserMessage) {
      return false;
    }

    if (Array.isArray(message?.attachments) && message.attachments.length > 0) {
      return true;
    }

    if (context.requestHumanHandoff || (context.leadSummary && typeof context.leadSummary === 'object')) {
      return true;
    }

    const text = sanitizeText(message?.text || '', 2000).toLowerCase();
    if (!text) {
      return false;
    }

    if (text.length >= 160) {
      return true;
    }

    const defaultPatterns = [
      /менеджер|оператор|терміново|прорах|розрах|кошторис|ціна|вартість|термін/u,
      /manager|operator|urgent|quote|estimate|price|cost|lead time/i
    ];

    if (defaultPatterns.some((pattern) => pattern.test(text))) {
      return true;
    }

    if (settings.importantKeywords.some((keyword) => keyword && text.includes(keyword))) {
      return true;
    }

    return false;
  }

  async sendTelegramTextNotification(siteId, lines) {
    const settings = this.resolveTelegramSettings(siteId);
    if (!this.botToken || !settings.notificationsEnabled || !settings.operatorChatIds.length) {
      return;
    }

    const text = lines.filter(Boolean).join('\n');
    if (!text) {
      return;
    }

    for (const operatorChatId of settings.operatorChatIds) {
      await this.callTelegram('sendMessage', {
        chat_id: operatorChatId,
        text
      });
    }
  }

  async notifyTelegramAboutNewConversation(conversationId) {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return;
    const settings = this.resolveTelegramSettings(conversation.siteId);
    if (!settings.notificationsEnabled || !settings.notifyOnNewConversation) {
      return;
    }

    const header = [
      `🆕 Нова розмова з сайту ${settings.siteTitle}`,
      `CID: ${conversation.conversationId}`,
      `Site: ${conversation.siteId}`,
      `Статус: ${conversation.status}`,
      `Мова: ${conversation.language}`,
      `Сторінка: ${conversation.sourcePage || '-'}`,
      `Час: ${formatTelegramDate()}`
    ];
    if (settings.botUsername) {
      header.push(`Bot: ${settings.botUsername}`);
    }

    await this.sendTelegramTextNotification(conversation.siteId, header);
    this.addEvent(conversation.conversationId, 'telegram_notification_sent', {
      type: 'new_conversation'
    });
  }

  async notifyTelegramAboutImportantVisitorMessage(conversationId, message, context = {}) {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return;
    if (!this.isImportantVisitorMessage({ conversation, message, context })) {
      return;
    }

    const settings = this.resolveTelegramSettings(conversation.siteId);
    const lines = [
      `🔔 Важливе повідомлення з сайту ${settings.siteTitle}`,
      `CID: ${conversation.conversationId}`,
      `Site: ${conversation.siteId}`,
      `Статус: ${conversation.status}`,
      `Сторінка: ${conversation.sourcePage || '-'}`,
      `Час: ${formatTelegramDate()}`,
      message.text ? `Текст: ${message.text}` : 'Текст: [лише файли]'
    ];
    if (Array.isArray(message.attachments) && message.attachments.length > 0) {
      lines.push(`Файли: ${message.attachments.map((item) => item.fileName).join(', ')}`);
    }

    await this.sendTelegramTextNotification(conversation.siteId, lines);
    this.addEvent(conversation.conversationId, 'telegram_notification_sent', {
      type: 'important_user_message',
      messageId: message.id
    });

    if (Array.isArray(message.attachments) && message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        await this.notifyTelegramAboutAttachment(conversation.siteId, conversation.conversationId, attachment);
      }
    }
  }

  async notifyTelegramAboutAttachment(siteId, conversationId, attachment) {
    const settings = this.resolveTelegramSettings(siteId);
    if (!this.botToken || !settings.notificationsEnabled || !settings.operatorChatIds.length) {
      return;
    }

    for (const operatorChatId of settings.operatorChatIds) {
      try {
        const fileBuffer = fs.readFileSync(attachment.storagePath);
        const form = new FormData();
        form.append('chat_id', operatorChatId);
        form.append('caption', `CID: ${conversationId}\nSite: ${siteId}\nФайл: ${attachment.fileName}`);
        form.append('document', new Blob([fileBuffer]), attachment.fileName);
        await this.callTelegram('sendDocument', form, true);
      } catch (error) {
        console.error('Failed to send file to Telegram', error);
      }
    }
  }

  async notifyTelegramAboutLeadHandoff(conversationId, summary) {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return;
    const settings = this.resolveTelegramSettings(conversation.siteId);
    if (!settings.notificationsEnabled) return;

    const contact = summary?.contact?.value
      ? `${summary.contact.type || 'contact'}: ${summary.contact.value}`
      : 'не вказано';
    const lines = [
      `📌 Нова заявка з сайту ${settings.siteTitle}`,
      `CID: ${conversation.conversationId}`,
      `Site: ${conversation.siteId}`,
      `Flow: ${sanitizeText(summary?.flowType || '', 80) || '-'}`,
      `Ім'я: ${sanitizeText(summary?.name || '', 120) || '-'}`,
      `Що потрібно: ${sanitizeText(summary?.objectDescription || '', 500) || '-'}`,
      `Розмір: ${sanitizeText(summary?.size || '', 120) || '-'}`,
      `Контакт: ${sanitizeText(contact, 160)}`,
      `Питання: ${sanitizeText(summary?.freeQuestion || '', 500) || '-'}`,
      `Файли: ${Array.isArray(summary?.fileNames) && summary.fileNames.length ? summary.fileNames.join(', ') : 'немає'}`,
      `Сторінка: ${conversation.sourcePage || '-'}`,
      `Час: ${formatTelegramDate()}`
    ];

    await this.sendTelegramTextNotification(conversation.siteId, lines);
    this.addEvent(conversation.conversationId, 'telegram_notification_sent', {
      type: 'lead_handoff'
    });
  }

  async callTelegram(method, payload, isFormData = false) {
    if (!this.hasTelegramBridge()) {
      return { ok: false };
    }

    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
      method: 'POST',
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      body: isFormData ? payload : JSON.stringify(payload)
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram API ${method} failed: ${body}`);
    }
    return response.json();
  }

  extractConversationIdFromTelegram(message) {
    const text = sanitizeText(message?.text || message?.caption || '', 2000);
    const replyText = sanitizeText(message?.reply_to_message?.text || message?.reply_to_message?.caption || '', 2000);
    const sources = [text, replyText];
    for (const item of sources) {
      const match = item.match(/\bCID:\s*(pf-[a-z0-9-]+)/i);
      if (match) return match[1];
    }
    return null;
  }

  async handleTelegramUpdate(update) {
    if (!this.botToken) {
      return { ok: true, ignored: true };
    }

    const message = update?.message || update?.edited_message;
    if (!message) return { ok: true, ignored: true };

    const chatId = String(message.chat?.id || '');
    const allowedChatIds = this.allTelegramOperatorChatIds();
    if (allowedChatIds.length && !allowedChatIds.includes(chatId)) {
      return { ok: true, ignored: true };
    }

    const rawText = sanitizeText(message.text || message.caption || '', 3000);
    const commandMatch = rawText.match(/^\/(reply|take|ai|close)\s+([^\s]+)(?:\s+([\s\S]+))?$/i);

    if (commandMatch) {
      const [, command, cid, remainder] = commandMatch;
      if (command.toLowerCase() === 'reply') {
        return this.createOperatorReply(cid, remainder || '', message);
      }
      return this.applyOperatorCommand(command.toLowerCase(), cid, message);
    }

    const conversationId = this.extractConversationIdFromTelegram(message);
    if (!conversationId) {
      return { ok: true, ignored: true };
    }

    if (message.document || (Array.isArray(message.photo) && message.photo.length > 0)) {
      const conversation = this.getConversationById(conversationId);
      if (!conversation) {
        return { ok: false };
      }
      const attachment = await this.downloadTelegramAttachment(message);
      const text = rawText;
      this.clearOperatorFallbackTimer(conversationId);
      await this.updateConversation(conversationId, {
        status: 'human',
        assignedTo: this.operatorDisplayName(message),
        assignedOperator: this.operatorDisplayName(message),
        unreadCount: 0,
        lastOperator: this.operatorDisplayName(message),
        humanRepliedAt: conversation.humanRepliedAt || new Date().toISOString(),
        closedAt: ''
      });
      const outboundMessage = this.addMessage({
        conversationId,
        senderType: 'operator',
        senderName: this.operatorDisplayName(message),
        text,
        messageType: attachment ? 'file' : 'text',
        attachments: attachment ? [attachment] : [],
        channel: conversation.channel
      });
      try {
        await this.dispatchOutboundMessage(conversation, outboundMessage);
      } catch (error) {
        this.addEvent(conversationId, 'channel_outbound_failed', {
          channel: conversation.channel,
          messageId: outboundMessage.id,
          error: String(error.message || error)
        });
      }
      return { ok: true };
    }

    if (rawText) {
      return this.createOperatorReply(conversationId, rawText, message);
    }

    return { ok: true, ignored: true };
  }

  operatorDisplayName(message) {
    const first = sanitizeText(message?.from?.first_name, 40);
    const last = sanitizeText(message?.from?.last_name, 40);
    const username = sanitizeText(message?.from?.username, 40);
    return [first, last].filter(Boolean).join(' ') || username || 'Operator';
  }

  async createOperatorReply(conversationId, text, message) {
    const conversation = this.getConversationById(conversationId);
    const replyChatId = String(message?.chat?.id || this.primaryOperatorChatId()).trim();
    if (!conversation) {
      await this.callTelegram('sendMessage', {
        chat_id: replyChatId,
        text: `Не знайдено діалог ${conversationId}.`
      });
      return { ok: false };
    }

    const updated = this.updateConversation(conversationId, {
      status: 'human',
      assignedTo: this.operatorDisplayName(message),
      assignedOperator: this.operatorDisplayName(message),
      unreadCount: 0,
      lastOperator: this.operatorDisplayName(message),
      humanRepliedAt: conversation.humanRepliedAt || new Date().toISOString(),
      closedAt: ''
    });
    this.clearOperatorFallbackTimer(conversationId);
    this.broadcast(conversationId, 'conversation', updated);
    this.addEvent(conversationId, 'operator_replied', { operator: this.operatorDisplayName(message) });
    const outboundMessage = this.addMessage({
      conversationId,
      senderType: 'operator',
      senderName: this.operatorDisplayName(message),
      text,
      messageType: 'text',
      channel: conversation.channel
    });
    try {
      await this.dispatchOutboundMessage(conversation, outboundMessage);
    } catch (error) {
      this.addEvent(conversationId, 'channel_outbound_failed', {
        channel: conversation.channel,
        messageId: outboundMessage.id,
        error: String(error.message || error)
      });
    }
    return { ok: true };
  }

  async applyOperatorCommand(command, conversationId, message) {
    const conversation = this.getConversationById(conversationId);
    const replyChatId = String(message?.chat?.id || this.primaryOperatorChatId()).trim();
    if (!conversation) {
      await this.callTelegram('sendMessage', {
        chat_id: replyChatId,
        text: `Не знайдено діалог ${conversationId}.`
      });
      return { ok: false };
    }

    let nextStatus = conversation.status;
    let eventType = '';
    let systemText = '';

    if (command === 'take') {
      nextStatus = 'human';
      eventType = 'operator_taken';
      systemText = conversation.language === 'en' ? 'A manager joined the chat.' : 'До чату приєднався менеджер.';
    } else if (command === 'ai') {
      nextStatus = 'ai';
      eventType = 'returned_to_ai';
      systemText = conversation.language === 'en' ? 'The chat was returned to AI support.' : 'Чат повернено AI-помічнику.';
    } else if (command === 'close') {
      nextStatus = 'closed';
      eventType = 'conversation_closed';
      systemText = conversation.language === 'en' ? 'This chat has been closed.' : 'Цей чат закрито.';
    }

    const updated = this.updateConversation(conversationId, {
      status: nextStatus,
      assignedTo: nextStatus === 'human' ? this.operatorDisplayName(message) : '',
      assignedOperator: nextStatus === 'human' ? this.operatorDisplayName(message) : '',
      lastOperator: this.operatorDisplayName(message),
      handoffAt: command === 'take' ? (conversation.handoffAt || new Date().toISOString()) : conversation.handoffAt,
      humanRepliedAt: nextStatus === 'human' ? (conversation.humanRepliedAt || new Date().toISOString()) : conversation.humanRepliedAt,
      closedAt: nextStatus === 'closed' ? new Date().toISOString() : ''
    });
    this.addEvent(conversationId, eventType, { operator: this.operatorDisplayName(message) });
    this.broadcast(conversationId, 'conversation', updated);
    if (systemText) {
      this.addMessage({
        conversationId,
        senderType: 'system',
        senderName: 'System',
        text: systemText,
        messageType: 'system'
      });
    }
    await this.callTelegram('sendMessage', {
      chat_id: replyChatId,
      text: `Оновлено ${conversationId}: статус ${nextStatus}.`
    });
    return { ok: true };
  }

  async downloadTelegramAttachment(message) {
    const candidate = message.document || (Array.isArray(message.photo) && message.photo.length ? message.photo[message.photo.length - 1] : null);
    if (!candidate?.file_id) return null;

    const fileMetaPayload = await this.callTelegram('getFile', { file_id: candidate.file_id });
    const filePath = String(fileMetaPayload?.result?.file_path || '');
    if (!filePath) return null;

    const response = await fetch(`https://api.telegram.org/file/bot${this.botToken}/${filePath}`);
    if (!response.ok) {
      throw new Error(`Failed to download Telegram file: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName =
      message.document?.file_name || path.basename(filePath) || `telegram-file-${Date.now()}`;
    const storedName = buildStorageName(originalName);
    const targetPath = path.join(this.uploadsDir, storedName);
    fs.writeFileSync(targetPath, buffer);

    return {
      fileName: originalName,
      mimeType: String(message.document?.mime_type || 'application/octet-stream'),
      fileSize: Number(candidate.file_size) || buffer.length,
      storagePath: targetPath,
      publicUrl: this.buildPublicUrl(`${this.publicUploadsBase}/${storedName}`)
    };
  }
}

module.exports = { ChatService, DEFAULT_GREETING, detectLanguage, sanitizeText };
