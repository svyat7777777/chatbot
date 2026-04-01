const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_KIMI_BASE_URL = 'https://api.moonshot.cn/v1';

function sanitizeText(value, maxLength = 12000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function formatMessageRole(senderType) {
  if (senderType === 'visitor') return 'visitor';
  if (senderType === 'operator') return 'operator';
  if (senderType === 'ai') return 'assistant';
  return String(senderType || 'system').trim().toLowerCase() || 'system';
}

function formatMessages(messages) {
  return (Array.isArray(messages) ? messages : [])
    .slice(-20)
    .map((message) => {
      const text = sanitizeText(message && message.text, 3000) || '[empty]';
      const createdAt = sanitizeText(message && message.createdAt, 64);
      return `${formatMessageRole(message && message.senderType)} [${createdAt || 'unknown time'}]: ${text}`;
    })
    .join('\n');
}

function formatContact(contact) {
  if (!contact) {
    return 'No saved contact data.';
  }

  const lines = [
    `name: ${sanitizeText(contact.name, 200) || '-'}`,
    `phone: ${sanitizeText(contact.phone, 80) || '-'}`,
    `telegram: ${sanitizeText(contact.telegram, 80) || '-'}`,
    `email: ${sanitizeText(contact.email, 120) || '-'}`,
    `leadStatus: ${sanitizeText(contact.status, 40) || '-'}`,
    `notes: ${sanitizeText(contact.notes, 600) || '-'}`
  ];

  return lines.join('\n');
}

function loadKnowledgeForSite(siteConfig = {}) {
  const aiAssistant = siteConfig && siteConfig.aiAssistant ? siteConfig.aiAssistant : {};
  return {
    manual: {
      companyDescription: sanitizeText(aiAssistant.companyDescription, 4000),
      services: sanitizeText(aiAssistant.services, 4000),
      faq: sanitizeText(aiAssistant.faq, 4000),
      pricingRules: sanitizeText(aiAssistant.pricingRules, 4000),
      leadTimeRules: sanitizeText(aiAssistant.leadTimeRules, 4000),
      fileRequirements: sanitizeText(aiAssistant.fileRequirements, 4000),
      deliveryInfo: sanitizeText(aiAssistant.deliveryInfo, 4000)
    },
    ai: {
      companyDescription: sanitizeText(aiAssistant.generatedKnowledge && aiAssistant.generatedKnowledge.companyDescription, 4000),
      services: sanitizeText(aiAssistant.generatedKnowledge && aiAssistant.generatedKnowledge.services, 4000),
      faq: sanitizeText(aiAssistant.generatedKnowledge && aiAssistant.generatedKnowledge.faq, 4000),
      pricingRules: sanitizeText(aiAssistant.generatedKnowledge && aiAssistant.generatedKnowledge.pricingRules, 4000),
      leadTimeRules: sanitizeText(aiAssistant.generatedKnowledge && aiAssistant.generatedKnowledge.leadTimeRules, 4000),
      fileRequirements: sanitizeText(aiAssistant.generatedKnowledge && aiAssistant.generatedKnowledge.fileRequirements, 4000),
      deliveryInfo: sanitizeText(aiAssistant.generatedKnowledge && aiAssistant.generatedKnowledge.deliveryInfo, 4000)
    },
    generatedMeta: {
      sourceName: sanitizeText(aiAssistant.generatedKnowledge && aiAssistant.generatedKnowledge.sourceName, 240),
      generatedAt: sanitizeText(aiAssistant.generatedKnowledge && aiAssistant.generatedKnowledge.generatedAt, 80)
    },
    assistant: aiAssistant
  };
}

function resolveKnowledge(manual = {}, ai = {}) {
  const fields = ['companyDescription', 'services', 'faq', 'pricingRules', 'leadTimeRules', 'fileRequirements', 'deliveryInfo'];
  const resolved = {};
  fields.forEach((field) => {
    const manualValue = sanitizeText(manual[field], 4000);
    const aiValue = sanitizeText(ai[field], 4000);
    if (manualValue) {
      resolved[field] = { value: manualValue, source: 'manual' };
    } else if (aiValue) {
      resolved[field] = { value: aiValue, source: 'ai' };
    } else {
      resolved[field] = { value: '', source: 'missing' };
    }
  });
  return resolved;
}

function buildKnowledgePrompt(siteConfig = {}) {
  const knowledge = loadKnowledgeForSite(siteConfig);
  const resolved = resolveKnowledge(knowledge.manual, knowledge.ai);
  const assistant = knowledge.assistant || {};
  const fieldLabels = [
    ['companyDescription', 'company_description'],
    ['services', 'services'],
    ['faq', 'faq'],
    ['pricingRules', 'pricing_rules'],
    ['leadTimeRules', 'lead_time_rules'],
    ['fileRequirements', 'file_requirements'],
    ['deliveryInfo', 'delivery_info']
  ];
  const fieldLines = fieldLabels.map(([field, label]) => {
    const entry = resolved[field] || { value: '', source: 'missing' };
    return `${label} [source=${entry.source}]: ${entry.value || '-'}`;
  });
  const metaLines = [
    `tone: ${sanitizeText(assistant.tone, 240) || '-'}`,
    `forbidden_claims: ${sanitizeText(assistant.forbiddenClaims, 4000) || '-'}`,
    `default_language: ${sanitizeText(assistant.defaultLanguage, 24) || '-'}`,
    `response_style: ${sanitizeText(assistant.responseStyle, 40) || '-'}`,
    `ask_contact_style: ${sanitizeText(assistant.askContactStyle, 600) || '-'}`,
    `ask_file_style: ${sanitizeText(assistant.askFileStyle, 600) || '-'}`,
    knowledge.generatedMeta.sourceName ? `ai_source_name: ${knowledge.generatedMeta.sourceName}` : '',
    knowledge.generatedMeta.generatedAt ? `ai_generated_at: ${knowledge.generatedMeta.generatedAt}` : ''
  ].filter(Boolean);
  return [
    'BUSINESS KNOWLEDGE:',
    'Priority: Manual -> AI -> Model',
    'Use manual values first. If a field is empty, use AI-generated knowledge. If still empty, use cautious model reasoning.',
    fieldLines.join('\n'),
    'BUSINESS RULES:',
    metaLines.join('\n')
  ].join('\n');
}

function normalizeKnowledgeSnapshotPayload(payload = {}) {
  const root = payload && typeof payload === 'object'
    ? (payload.knowledge && typeof payload.knowledge === 'object'
      ? payload.knowledge
      : payload.data && typeof payload.data === 'object'
        ? payload.data
        : payload.result && typeof payload.result === 'object'
          ? payload.result
          : payload)
    : {};
  const fields = ['companyDescription', 'services', 'faq', 'pricingRules', 'leadTimeRules', 'fileRequirements', 'deliveryInfo'];
  const aliases = {
    companyDescription: ['companyDescription', 'company_description'],
    services: ['services'],
    faq: ['faq'],
    pricingRules: ['pricingRules', 'pricing_rules'],
    leadTimeRules: ['leadTimeRules', 'lead_time_rules'],
    fileRequirements: ['fileRequirements', 'file_requirements'],
    deliveryInfo: ['deliveryInfo', 'delivery_info']
  };
  const normalized = {};
  fields.forEach((field) => {
    const candidates = aliases[field] || [field];
    const value = candidates.reduce((found, key) => (
      found || (root && Object.prototype.hasOwnProperty.call(root, key) ? root[key] : '')
    ), '');
    normalized[field] = sanitizeText(value, field === 'faq' ? 3000 : 2000);
  });
  return normalized;
}

function hasMeaningfulKnowledgeSnapshot(snapshot = {}) {
  return ['companyDescription', 'services', 'faq', 'pricingRules', 'leadTimeRules', 'fileRequirements', 'deliveryInfo']
    .some((field) => Boolean(sanitizeText(snapshot[field], field === 'faq' ? 3000 : 2000)));
}

function formatProductSearchResults(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    return 'No matching products found in the local catalog.';
  }

  return list.slice(0, 6).map((item, index) => {
    return [
      `${index + 1}. ${sanitizeText(item.title, 200) || 'Untitled product'}`,
      `url: ${sanitizeText(item.link || item.url, 500) || '-'}`,
      `image: ${sanitizeText(item.image || item.imageUrl, 500) || '-'}`,
      `description: ${sanitizeText(item.description, 600) || '-'}`,
      `price: ${sanitizeText(item.price, 80) || '-'}`
    ].join('\n');
  }).join('\n\n');
}

function buildTaskInstruction(action, currentText) {
  const cleanText = sanitizeText(currentText, 4000);
  const targetLanguage = sanitizeText(arguments[2], 40).toLowerCase();

  if (action === 'translate') {
    if (!cleanText) {
      return [
        'There is no current operator draft.',
        'Return an empty string.'
      ].join('\n\n');
    }

    const targetLanguageLabel =
      targetLanguage === 'uk' ? 'Ukrainian'
        : targetLanguage === 'ru' ? 'Russian'
          : 'English';

    return [
      'You translate customer support draft messages.',
      `Translate the text into ${targetLanguageLabel}.`,
      'Preserve meaning, tone, and intent.',
      'Return only the translated message text.',
      'Do not add explanations or extra formatting.',
      'Do not add greetings or signatures unless they are already present in the original text.',
      `Current draft:\n${cleanText}`
    ].join('\n\n');
  }

  if (action === 'polish') {
    if (!cleanText) {
      return [
        'There is no current operator draft.',
        'Return an empty string.'
      ].join('\n\n');
    }
    return [
      'You improve customer support draft messages written by a human operator.',
      'Fix grammar, spelling, and punctuation.',
      'Improve clarity and professionalism.',
      'Preserve the exact meaning.',
      'Keep the same language as the original input.',
      'Keep it concise.',
      'Return only the improved message.',
      `Current draft:\n${cleanText}`
    ].join('\n\n');
  }

  if (action === 'shorten') {
    if (cleanText) {
      return [
        'Rewrite the current operator draft so it is shorter and clearer.',
        'Keep the original meaning.',
        `Current draft:\n${cleanText}`,
        'Return only the rewritten message.'
      ].join('\n\n');
    }
    return [
      'Generate a short concise reply based on the recent conversation.',
      'There is no current textarea draft, so infer the next short operator message from the context.',
      'Return only the reply text.'
    ].join('\n\n');
  }

  if (action === 'more_sales') {
    if (cleanText) {
      return [
        'Rewrite the current operator draft to sound a bit more sales-oriented and persuasive.',
        'Stay honest, concise, and practical.',
        `Current draft:\n${cleanText}`,
        'Return only the rewritten message.'
      ].join('\n\n');
    }
    return [
      'Generate a short sales-oriented operator reply based on the recent conversation.',
      'Keep it honest and practical. Encourage the next step without sounding pushy.',
      'Return only the reply text.'
    ].join('\n\n');
  }

  if (action === 'ask_contact') {
    return [
      'Rewrite or generate a short reply that politely asks the customer for phone number or Telegram.',
      'Explain that this will help continue the estimate faster.',
      cleanText ? `Current draft:\n${cleanText}` : '',
      'Return only the reply text.'
    ].filter(Boolean).join('\n\n');
  }

  if (action === 'ask_file') {
    return [
      'Rewrite or generate a short reply that politely asks for STL/3MF/OBJ file, or at least dimensions / photo of the part.',
      'Explain that this is needed for a precise estimate.',
      cleanText ? `Current draft:\n${cleanText}` : '',
      'Return only the reply text.'
    ].filter(Boolean).join('\n\n');
  }

  return [
    'Generate a short operator draft reply for the customer based on the conversation and site knowledge.',
    'Focus on the next practical step.',
    'If needed, ask for file, dimensions, material, quantity, phone, or Telegram.',
    cleanText ? `Existing operator draft (optional context):\n${cleanText}` : '',
    'Return only the reply text.'
  ].filter(Boolean).join('\n\n');
}

function extractOutputText(payload) {
  const direct = sanitizeText(payload && payload.output_text, 8000);
  if (direct) return direct;

  const directTextValue = sanitizeText(
    payload && payload.output_text && typeof payload.output_text === 'object'
      ? (payload.output_text.text || payload.output_text.value || '')
      : '',
    8000
  );
  if (directTextValue) return directTextValue;

  const directContent = Array.isArray(payload && payload.content) ? payload.content : [];
  for (const part of directContent) {
    const text = sanitizeText(
      part && (
        (typeof part.text === 'string' ? part.text : '')
        || (part.text && (part.text.value || part.text.text || ''))
        || (typeof part.output_text === 'string' ? part.output_text : '')
        || (part.output_text && (part.output_text.value || part.output_text.text || ''))
        || (typeof part.content === 'string' ? part.content : '')
        || ''
      ),
      8000
    );
    if (text) return text;
  }

  const output = Array.isArray(payload && payload.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item && item.content) ? item.content : [];
    for (const part of content) {
      const text = sanitizeText(
        (part && (
          (typeof part.text === 'string' ? part.text : '')
          || (part.text && (part.text.value || part.text.text || ''))
          || (typeof part.output_text === 'string' ? part.output_text : '')
          || (part.output_text && (part.output_text.value || part.output_text.text || ''))
          || (part.type === 'output_text' && typeof part.text === 'string' ? part.text : '')
          || (typeof part.content === 'string' ? part.content : '')
          || ''
        )) || '',
        8000
      );
      if (text) return text;
    }
  }

  return '';
}

function extractChatCompletionText(payload) {
  const choices = Array.isArray(payload && payload.choices) ? payload.choices : [];
  for (const choice of choices) {
    const message = choice && choice.message ? choice.message : null;
    if (!message) continue;
    const content = message.content;
    if (typeof content === 'string') {
      const text = sanitizeText(content, 8000);
      if (text) return text;
    }
    if (Array.isArray(content)) {
      for (const part of content) {
        const text = sanitizeText(
          part && (
            (typeof part.text === 'string' ? part.text : '')
            || (part.text && (part.text.value || part.text.text || ''))
            || (typeof part.content === 'string' ? part.content : '')
            || ''
          ),
          8000
        );
        if (text) return text;
      }
    }
  }
  return '';
}

function stripCodeFences(text) {
  const source = sanitizeText(text, 16000);
  if (!source) return '';
  const fenceMatch = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenceMatch && fenceMatch[1] ? sanitizeText(fenceMatch[1], 16000) : source;
}

function extractBalancedJsonCandidate(text) {
  const source = stripCodeFences(text);
  const candidates = [];
  for (let start = 0; start < source.length; start += 1) {
    if (source[start] !== '{') continue;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < source.length; index += 1) {
      const char = source[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }
      if (char === '"') {
        inString = true;
        continue;
      }
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          candidates.push(source.slice(start, index + 1));
          break;
        }
      }
    }
  }
  return candidates;
}

function extractJsonObject(text) {
  const source = stripCodeFences(text);
  if (!source) return null;

  try {
    return JSON.parse(source);
  } catch (error) {
    // continue
  }

  for (const candidate of extractBalancedJsonCandidate(source)) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // continue
    }
  }

  return null;
}

function normalizeSummaryList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeText(item, 320))
      .filter(Boolean)
      .slice(0, 6);
  }

  const single = sanitizeText(value, 800);
  return single ? [single] : [];
}

function normalizeSummaryPayload(payload) {
  const raw = payload && typeof payload === 'object' ? payload : {};
  const customerGoal = sanitizeText(
    raw.customerGoal || raw.customer_goal || raw.goal || '',
    500
  );
  const knownInformation = normalizeSummaryList(
    raw.knownInformation || raw.known_information || raw.knownInfo
  );
  const missingInformation = normalizeSummaryList(
    raw.missingInformation || raw.missing_information || raw.missingInfo
  );
  const recommendedNextStep = sanitizeText(
    raw.recommendedNextStep || raw.recommended_next_step || raw.nextStep || '',
    500
  );

  return {
    customerGoal: customerGoal || 'Не визначено',
    knownInformation,
    missingInformation,
    recommendedNextStep: recommendedNextStep || 'Уточнити наступний практичний крок у клієнта.'
  };
}

function normalizeFlowDraftPayload(payload) {
  const draft = payload && typeof payload === 'object' ? payload : {};
  const steps = Array.isArray(draft.steps) ? draft.steps : [];
  return {
    title: sanitizeText(draft.title, 160) || 'New AI flow',
    buttonLabel: sanitizeText(draft.buttonLabel, 120) || sanitizeText(draft.title, 120) || 'New flow',
    slug: sanitizeText(draft.slug, 120) || '',
    icon: sanitizeText(draft.icon, 12) || '💬',
    description: sanitizeText(draft.description, 400) || '',
    summary: {
      goal: sanitizeText(draft.summary && draft.summary.goal, 220) || '',
      collectedFields: Array.isArray(draft.summary && draft.summary.collectedFields)
        ? draft.summary.collectedFields.map((item) => sanitizeText(item, 80)).filter(Boolean)
        : [],
      branches: Array.isArray(draft.summary && draft.summary.branches)
        ? draft.summary.branches.map((item) => sanitizeText(item, 120)).filter(Boolean)
        : []
    },
    steps: steps.map((step, index) => {
      const safeStep = step && typeof step === 'object' ? step : {};
      return {
        id: sanitizeText(safeStep.id, 120) || `step_${index + 1}`,
        type: sanitizeText(safeStep.type, 24) || 'message',
        input: sanitizeText(safeStep.input, 24) || 'text',
        text: sanitizeText(safeStep.text, 1200) || '',
        options: Array.isArray(safeStep.options)
          ? safeStep.options.map((option, optionIndex) => {
              const safeOption = option && typeof option === 'object' ? option : {};
              const label = sanitizeText(safeOption.label, 160) || `Option ${optionIndex + 1}`;
              return {
                label,
                value: sanitizeText(safeOption.value, 160) || ''
              };
            }).filter((option) => option.label)
          : []
      };
    }).filter((step) => step.id || step.text || (Array.isArray(step.options) && step.options.length))
  };
}

class AiAssistantService {
  constructor(options = {}) {
    this.providers = {
      openai: {
        apiKey: String(options.openaiApiKey || options.apiKey || '').trim(),
        baseUrl: String(options.openaiBaseUrl || options.baseUrl || DEFAULT_OPENAI_BASE_URL).replace(/\/+$/, '')
      },
      kimi: {
        apiKey: String(options.kimiApiKey || '').trim(),
        baseUrl: String(options.kimiBaseUrl || DEFAULT_KIMI_BASE_URL).replace(/\/+$/, '')
      }
    };
  }

  isEnabled(provider) {
    const key = String(provider || 'openai').trim().toLowerCase() || 'openai';
    return Boolean(this.providers[key] && this.providers[key].apiKey);
  }

  buildInstructions(siteConfig) {
    const aiAssistant = siteConfig && siteConfig.aiAssistant ? siteConfig.aiAssistant : {};
    const tone = sanitizeText(aiAssistant.tone, 240) || 'Friendly and professional.';
    const defaultLanguage = sanitizeText(aiAssistant.defaultLanguage, 24) || 'uk';
    const responseStyle = sanitizeText(aiAssistant.responseStyle, 40) || 'short';

    return [
      'BUSINESS KNOWLEDGE is the primary source of truth for business facts.',
      'Use BUSINESS KNOWLEDGE before general model reasoning.',
      'If BUSINESS KNOWLEDGE is missing something, ask for missing details instead of inventing prices, policies, lead times, shipping terms, or guarantees.',
      'When knowledge is absent, use cautious fallback reasoning only.',
      'Keep replies concise, useful, and appropriate for a sales/support website assistant.',
      'You are assisting a human operator inside an internal inbox unless the task says you are replying to the visitor.',
      'Do not invent prices, delivery promises, or policies.',
      `Reply in the customer language when it is obvious from the conversation; otherwise use ${defaultLanguage}.`,
      'Keep the draft concise, human, and action-oriented.',
      'Do not promise exact price without the required file or dimensions.',
      `Preferred tone: ${tone}`,
      `Preferred response style: ${responseStyle}`
    ].join('\n');
  }

  buildPrompt(params) {
    const siteConfig = params.siteConfig || {};
    const aiAssistant = siteConfig.aiAssistant || {};
    const conversation = params.conversation || {};
    const promptParts = [
      `SITE ID:\n${sanitizeText(siteConfig.siteId, 120) || '-'}`,
      `SITE TITLE:\n${sanitizeText(siteConfig.title, 200) || '-'}`,
      buildKnowledgePrompt(siteConfig),
      [
        'CONVERSATION META:',
        `conversationId: ${sanitizeText(conversation.conversationId, 120) || '-'}`,
        `sourcePage: ${sanitizeText(conversation.sourcePage, 400) || '-'}`,
        `status: ${sanitizeText(conversation.status, 40) || '-'}`,
        `lastMessageAt: ${sanitizeText(conversation.lastMessageAt, 64) || '-'}`
      ].join('\n'),
      `CONTACT INFO:\n${formatContact(params.contact)}`,
      `CONVERSATION HISTORY:\n${formatMessages(params.messages) || '-'}`,
      `TASK:\n${buildTaskInstruction(params.action, params.currentText, params.targetLanguage)}`
    ];

    return promptParts.join('\n\n');
  }

  buildSummaryPrompt(params) {
    const siteConfig = params.siteConfig || {};
    const aiAssistant = siteConfig.aiAssistant || {};
    const conversation = params.conversation || {};

    return [
      `SITE ID:\n${sanitizeText(siteConfig.siteId, 120) || '-'}`,
      `SITE TITLE:\n${sanitizeText(siteConfig.title, 200) || '-'}`,
      buildKnowledgePrompt(siteConfig),
      [
        'CONVERSATION META:',
        `conversationId: ${sanitizeText(conversation.conversationId, 120) || '-'}`,
        `sourcePage: ${sanitizeText(conversation.sourcePage, 400) || '-'}`,
        `status: ${sanitizeText(conversation.status, 40) || '-'}`,
        `lastMessageAt: ${sanitizeText(conversation.lastMessageAt, 64) || '-'}`
      ].join('\n'),
      `CONTACT INFO:\n${formatContact(params.contact)}`,
      `CONVERSATION HISTORY:\n${formatMessages(params.messages) || '-'}`,
      [
        'TASK:',
        'Summarize this conversation for a human operator.',
        'Return valid JSON only with these keys:',
        'customerGoal, knownInformation, missingInformation, recommendedNextStep',
        'knownInformation and missingInformation must be arrays of short bullet-like strings.',
        'Do not invent facts that are not in the conversation or contact record.',
        'Keep the summary concise and practical.'
      ].join('\n')
    ].join('\n\n');
  }

  buildWorkspacePrompt(params) {
    const siteConfig = params.siteConfig || {};
    const aiAssistant = siteConfig.aiAssistant || {};
    const conversation = params.conversation || {};
    const operatorPrompt = sanitizeText(params.operatorPrompt, 5000);
    const history = Array.isArray(params.history) ? params.history : [];
    const historyBlock = history
      .slice(-12)
      .map((entry) => {
        const role = sanitizeText(entry && entry.role, 32) || 'assistant';
        const text = sanitizeText(entry && entry.text, 2500) || '[empty]';
        return `${role}: ${text}`;
      })
      .join('\n');

    return [
      `SITE ID:\n${sanitizeText(siteConfig.siteId, 120) || '-'}`,
      `SITE TITLE:\n${sanitizeText(siteConfig.title, 200) || '-'}`,
      buildKnowledgePrompt(siteConfig),
      [
        'CONVERSATION META:',
        `conversationId: ${sanitizeText(conversation.conversationId, 120) || '-'}`,
        `sourcePage: ${sanitizeText(conversation.sourcePage, 400) || '-'}`,
        `status: ${sanitizeText(conversation.status, 40) || '-'}`,
        `lastMessageAt: ${sanitizeText(conversation.lastMessageAt, 64) || '-'}`
      ].join('\n'),
      `CONTACT INFO:\n${formatContact(params.contact)}`,
      `CONVERSATION HISTORY:\n${formatMessages(params.messages) || '-'}`,
      `AI SIDEBAR HISTORY:\n${historyBlock || '-'}`,
      `PRODUCT SEARCH RESULTS:\n${formatProductSearchResults(params.productResults)}`,
      [
        'TASK:',
        'You are an internal AI assistant for a human operator.',
        'Answer the operator directly, not the customer.',
        'Be concise and practical.',
        'If asked to summarize, prefer short bullet points.',
        'If asked to improve or translate a reply, return the transformed text only.',
        'If asked about products, use PRODUCT SEARCH RESULTS when available and do not invent missing products.',
        'Return plain text only. No markdown code fences.',
        `Operator request:\n${operatorPrompt || '-'}`
      ].join('\n')
    ].join('\n\n');
  }

  buildFlowDraftPrompt(params) {
    const siteConfig = params.siteConfig || {};
    const aiAssistant = siteConfig.aiAssistant || {};
    const prompt = sanitizeText(params.prompt, 4000);
    const flowGoal = sanitizeText(params.goal, 280) || 'Guide the visitor through a useful chat scenario.';
    const language = sanitizeText(params.language, 32) || sanitizeText(aiAssistant.defaultLanguage, 32) || 'uk';
    const tone = sanitizeText(params.tone, 120) || sanitizeText(aiAssistant.tone, 120) || 'Friendly and professional';
    const template = sanitizeText(params.template, 120) || '';
    const existingFlowTitles = Array.isArray(params.existingFlows)
      ? params.existingFlows.map((item) => sanitizeText(item && (item.title || item.buttonLabel || item.slug), 120)).filter(Boolean).join(', ')
      : '';

    return [
      `SITE ID:\n${sanitizeText(siteConfig.siteId, 120) || '-'}`,
      `SITE TITLE:\n${sanitizeText(siteConfig.title, 200) || '-'}`,
      buildKnowledgePrompt(siteConfig),
      `FLOW GOAL:\n${flowGoal}`,
      `TARGET LANGUAGE:\n${language}`,
      `TONE OF VOICE:\n${tone}`,
      `TEMPLATE HINT:\n${template || '-'}`,
      `EXISTING FLOWS:\n${existingFlowTitles || '-'}`,
      `USER REQUEST:\n${prompt || '-'}`,
      [
        'TASK:',
        'Create a draft chat flow for a website widget.',
        'Return valid JSON only. No markdown, no explanation, no code fences.',
        'Use the existing simple flow engine schema.',
        'The flow must be sequential and compatible with these fields only:',
        'title, buttonLabel, slug, icon, description, summary, steps[].',
        'Each step must use only: id, type, input, text, options[].',
        'Each option must use only: label, value.',
        'Allowed step.type values: message, choice.',
        'Allowed step.input values: text, choice, file, none.',
        'Use choice steps for user selection. Because the current engine is sequential, do not invent per-option next-step IDs inside persisted data.',
        'When the request implies branching, reflect it in summary.branches and in the option labels, but keep the saved step structure sequential and practical.',
        'Prefer 3 to 8 steps unless the request clearly needs more.',
        'Make step texts understandable for a real customer.',
        'Suggest a compact slug in latin characters with underscores.',
        'summary.goal should be one short sentence.',
        'summary.collectedFields should be a short list of collected inputs like ["name", "dimensions", "deadline"].',
        'summary.branches should be a short list of human-readable branch summaries like ["Has file -> upload file", "No file -> describe part"].'
      ].join('\n')
    ].join('\n\n');
  }

  buildFlowAssistPrompt(params) {
    const siteConfig = params.siteConfig || {};
    const aiAssistant = siteConfig.aiAssistant || {};
    const mode = sanitizeText(params.mode, 40) || 'predict_bot';
    const flowTitle = sanitizeText(params.flowTitle, 200) || 'Untitled flow';
    const conversation = Array.isArray(params.conversation) ? params.conversation : [];
    const selectedMessage = params.selectedMessage && typeof params.selectedMessage === 'object'
      ? params.selectedMessage
      : null;

    const conversationBlock = conversation
      .slice(-16)
      .map((entry) => {
        const role = sanitizeText(entry && entry.role, 20) || 'bot';
        const text = sanitizeText(entry && entry.text, 900) || '[empty]';
        return `${role}: ${text}`;
      })
      .join('\n');

    const selectedBlock = selectedMessage
      ? [
          `SELECTED MESSAGE ROLE: ${sanitizeText(selectedMessage.role, 20) || '-'}`,
          `SELECTED MESSAGE TEXT: ${sanitizeText(selectedMessage.text, 900) || '-'}`
        ].join('\n')
      : 'SELECTED MESSAGE: -';

    const modeInstructionMap = {
      predict_bot: [
        'Suggest the next natural bot message in the scenario.',
        'Return one concise customer-facing bot message only.'
      ],
      predict_client: [
        'Suggest the most natural customer reply for the selected point in the scenario.',
        'Return one short customer reply only.'
      ],
      rewrite: [
        'Rewrite the selected message so it sounds clearer and more natural.',
        'Keep the original intent.'
      ],
      improve: [
        'Improve the selected message so it sounds better for a real customer chat.',
        'Make it concise, clear, and friendly.'
      ]
    };

    const modeInstructions = modeInstructionMap[mode] || modeInstructionMap.predict_bot;

    return [
      `SITE ID:\n${sanitizeText(siteConfig.siteId, 120) || '-'}`,
      `SITE TITLE:\n${sanitizeText(siteConfig.title, 200) || '-'}`,
      buildKnowledgePrompt(siteConfig),
      `FLOW TITLE:\n${flowTitle}`,
      `CURRENT SCENARIO CHAT:\n${conversationBlock || '-'}`,
      selectedBlock,
      [
        'TASK:',
        'You are helping a non-technical admin write a chatbot scenario like a chat conversation.',
        'Do not output JSON.',
        'Do not explain your reasoning.',
        'Do not use markdown or bullet lists.',
        'Return plain text only.',
        modeInstructions.join('\n')
      ].join('\n')
    ].join('\n\n');
  }

  getProviderConfig(provider) {
    const key = String(provider || 'openai').trim().toLowerCase() || 'openai';
    return this.providers[key] || null;
  }

  async requestResponsesApi(provider, body, allowRetryWithoutTemperature) {
    const providerConfig = this.getProviderConfig(provider);
    if (!providerConfig || !providerConfig.apiKey) {
      throw new Error(`${String(provider || 'openai').toUpperCase()} API key is not configured on the server.`);
    }

    const response = await fetch(`${providerConfig.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerConfig.apiKey}`
      },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = sanitizeText(
        payload && payload.error && (payload.error.message || payload.error.code),
        500
      ) || `OpenAI request failed with status ${response.status}.`;

      if (
        allowRetryWithoutTemperature &&
        response.status === 400 &&
        /temperature/i.test(message)
      ) {
        const retryBody = Object.assign({}, body);
        delete retryBody.temperature;
        return this.requestResponsesApi(provider, retryBody, false);
      }

      throw new Error(message);
    }

    return payload;
  }

  async requestChatCompletionsApi(provider, body, allowRetryWithoutTemperature) {
    const providerConfig = this.getProviderConfig(provider);
    if (!providerConfig || !providerConfig.apiKey) {
      throw new Error(`${String(provider || 'openai').toUpperCase()} API key is not configured on the server.`);
    }

    const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerConfig.apiKey}`
      },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = sanitizeText(
        payload && payload.error && (payload.error.message || payload.error.code),
        500
      ) || `${String(provider || 'kimi').toUpperCase()} request failed with status ${response.status}.`;

      if (
        allowRetryWithoutTemperature &&
        response.status === 400 &&
        /temperature/i.test(message)
      ) {
        const retryBody = Object.assign({}, body);
        delete retryBody.temperature;
        return this.requestChatCompletionsApi(provider, retryBody, false);
      }

      throw new Error(message);
    }

    return payload;
  }

  async generateReply(params = {}) {
    const siteConfig = params.siteConfig || {};
    const aiAssistant = siteConfig.aiAssistant || {};
    const provider = String(aiAssistant.provider || 'openai').trim().toLowerCase() || 'openai';
    if (aiAssistant.enabled !== true) {
      throw new Error('AI assistant is disabled for this site.');
    }
    if (!['openai', 'kimi'].includes(provider)) {
      throw new Error('Unsupported AI provider.');
    }
    if (!this.isEnabled(provider)) {
      throw new Error(`${provider.toUpperCase()} API key is not configured on the server.`);
    }

    let text = '';
    const model = sanitizeText(
      aiAssistant.model,
      120
    ) || (provider === 'kimi' ? 'moonshot-v1-8k' : 'gpt-5');

    if (provider === 'openai') {
      const body = {
        model,
        reasoning: { effort: 'low' },
        instructions: this.buildInstructions(siteConfig),
        input: this.buildPrompt(params),
        max_output_tokens: Number(aiAssistant.maxTokens) || 220
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestResponsesApi(provider, body, true);
      text = extractOutputText(payload);
    } else if (provider === 'kimi') {
      const body = {
        model,
        messages: [
          { role: 'system', content: this.buildInstructions(siteConfig) },
          { role: 'user', content: this.buildPrompt(params) }
        ],
        max_tokens: Number(aiAssistant.maxTokens) || 220
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestChatCompletionsApi(provider, body, true);
      text = extractChatCompletionText(payload);
    }

    if (!text) {
      throw new Error('AI assistant returned an empty draft.');
    }

    return {
      text,
      model
    };
  }

  async generateSummary(params = {}) {
    const siteConfig = params.siteConfig || {};
    const aiAssistant = siteConfig.aiAssistant || {};
    const provider = String(aiAssistant.provider || 'openai').trim().toLowerCase() || 'openai';

    if (aiAssistant.enabled !== true) {
      throw new Error('AI assistant is disabled for this site.');
    }
    if (!['openai', 'kimi'].includes(provider)) {
      throw new Error('Unsupported AI provider.');
    }
    if (!this.isEnabled(provider)) {
      throw new Error(`${provider.toUpperCase()} API key is not configured on the server.`);
    }

    let text = '';
    const model = sanitizeText(
      aiAssistant.model,
      120
    ) || (provider === 'kimi' ? 'moonshot-v1-8k' : 'gpt-5');

    const summaryInstructions = [
      this.buildInstructions(siteConfig),
      'Return only valid JSON.',
      'The JSON must contain: customerGoal, knownInformation, missingInformation, recommendedNextStep.',
      'Do not include markdown, code fences, comments, or extra prose.'
    ].join('\n');

    if (provider === 'openai') {
      const body = {
        model,
        reasoning: { effort: 'low' },
        instructions: summaryInstructions,
        input: this.buildSummaryPrompt(params),
        max_output_tokens: Number(aiAssistant.maxTokens) || 260
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestResponsesApi(provider, body, true);
      text = extractOutputText(payload);
    } else {
      const body = {
        model,
        messages: [
          { role: 'system', content: summaryInstructions },
          { role: 'user', content: this.buildSummaryPrompt(params) }
        ],
        max_tokens: Number(aiAssistant.maxTokens) || 260
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestChatCompletionsApi(provider, body, true);
      text = extractChatCompletionText(payload);
    }

    if (!text) {
      throw new Error('AI assistant returned an empty summary.');
    }

    const parsed = extractJsonObject(text);
    if (!parsed) {
      throw new Error('AI assistant returned an invalid summary format.');
    }

    return {
      summary: normalizeSummaryPayload(parsed),
      model
    };
  }

  async generateWorkspaceReply(params = {}) {
    const siteConfig = params.siteConfig || {};
    const aiAssistant = siteConfig.aiAssistant || {};
    const provider = String(aiAssistant.provider || 'openai').trim().toLowerCase() || 'openai';

    if (aiAssistant.enabled !== true) {
      throw new Error('AI assistant is disabled for this site.');
    }
    if (!['openai', 'kimi'].includes(provider)) {
      throw new Error('Unsupported AI provider.');
    }
    if (!this.isEnabled(provider)) {
      throw new Error(`${provider.toUpperCase()} API key is not configured on the server.`);
    }

    const model = sanitizeText(aiAssistant.model, 120) || (provider === 'kimi' ? 'moonshot-v1-8k' : 'gpt-5');
    const instructions = [
      this.buildInstructions(siteConfig),
      'You are operating inside an internal assistant sidebar.',
      'Keep answers compact and directly useful for the operator.',
      'Return plain text only.'
    ].join('\n');

    let text = '';
    if (provider === 'openai') {
      const body = {
        model,
        reasoning: { effort: 'low' },
        instructions,
        input: this.buildWorkspacePrompt(params),
        max_output_tokens: Math.max(180, Number(aiAssistant.maxTokens) || 320)
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestResponsesApi(provider, body, true);
      text = extractOutputText(payload);
    } else {
      const body = {
        model,
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: this.buildWorkspacePrompt(params) }
        ],
        max_tokens: Math.max(180, Number(aiAssistant.maxTokens) || 320)
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestChatCompletionsApi(provider, body, true);
      text = extractChatCompletionText(payload);
    }

    if (!text) {
      throw new Error('AI assistant returned an empty sidebar response.');
    }

    return {
      text,
      model
    };
  }

  async generateKnowledgeSnapshot(params = {}) {
    const siteConfig = params.siteConfig || {};
    const aiAssistant = siteConfig.aiAssistant || {};
    const provider = String(aiAssistant.provider || 'openai').trim().toLowerCase() || 'openai';
    if (!['openai', 'kimi'].includes(provider)) {
      throw new Error('Unsupported AI provider.');
    }
    if (!this.isEnabled(provider)) {
      throw new Error(`${provider.toUpperCase()} API key is not configured on the server.`);
    }

    const model = sanitizeText(aiAssistant.model, 120) || (provider === 'kimi' ? 'moonshot-v1-8k' : 'gpt-5');
    const instructions = [
      'Extract structured business knowledge from website content.',
      'Return valid JSON only.',
      'Do not include markdown, code fences, comments, or extra prose.',
      'Use exactly these string keys:',
      'company_description, services, faq, pricing_rules, lead_time_rules, file_requirements, delivery_info.',
      'Extract only what is supported by the website content.',
      'If information is unknown, return an empty string for that field.',
      'Do not invent pricing, policies, lead times, shipping rules, or file requirements.',
      'Keep values concise, factual, and business-usable.',
      'Example output:',
      '{"company_description":"","services":"","faq":"","pricing_rules":"","lead_time_rules":"","file_requirements":"","delivery_info":""}'
    ].join('\n');
    const input = [
      'SITE CONTEXT:',
      `site_id: ${sanitizeText(siteConfig.siteId, 120) || '-'}`,
      `site_title: ${sanitizeText(siteConfig.title, 200) || '-'}`,
      `language: ${sanitizeText(aiAssistant.defaultLanguage, 24) || 'uk'}`,
      `manager_name: ${sanitizeText(siteConfig.managerName || aiAssistant.managerName, 120) || '-'}`,
      '',
      'IMPORTED WEBSITE CONTENT:',
      sanitizeText(params.sourceText, 18000) || 'No imported content provided.'
    ].join('\n');

    let text = '';
    let rawPayload = null;
    if (provider === 'openai') {
      const body = {
        model,
        reasoning: { effort: 'low' },
        instructions,
        input,
        max_output_tokens: Math.max(300, Number(aiAssistant.maxTokens) || 420)
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestResponsesApi(provider, body, true);
      rawPayload = payload;
      text = extractOutputText(payload);
    } else {
      const body = {
        model,
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: input }
        ],
        max_tokens: Math.max(300, Number(aiAssistant.maxTokens) || 420)
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestChatCompletionsApi(provider, body, true);
      rawPayload = payload;
      text = extractChatCompletionText(payload);
    }

    console.info('[knowledge-ai] model call', {
      provider,
      model,
      sourceTextLength: sanitizeText(params.sourceText, 50000).length,
      rawResponsePreview: sanitizeText(text || JSON.stringify(rawPayload || {}), 1200)
    });

    if (!text) {
      throw new Error('AI assistant returned an empty knowledge snapshot.');
    }

    const parsed = extractJsonObject(text);
    console.info('[knowledge-ai] parsed snapshot', parsed ? JSON.stringify(parsed).slice(0, 1200) : null);
    if (!parsed) {
      throw new Error('AI assistant returned an invalid knowledge snapshot format.');
    }

    const normalized = normalizeKnowledgeSnapshotPayload(parsed);
    console.info('[knowledge-ai] normalized snapshot', normalized);
    if (!hasMeaningfulKnowledgeSnapshot(normalized)) {
      throw new Error('AI assistant returned an empty knowledge snapshot.');
    }

    return {
      knowledge: normalized,
      model
    };
  }

  async generateFlowDraft(params = {}) {
    const siteConfig = params.siteConfig || {};
    const aiAssistant = siteConfig.aiAssistant || {};
    const provider = String(aiAssistant.provider || 'openai').trim().toLowerCase() || 'openai';

    if (aiAssistant.enabled !== true) {
      throw new Error('AI assistant is disabled for this site.');
    }
    if (!['openai', 'kimi'].includes(provider)) {
      throw new Error('Unsupported AI provider.');
    }
    if (!this.isEnabled(provider)) {
      throw new Error(`${provider.toUpperCase()} API key is not configured on the server.`);
    }

    const model = sanitizeText(aiAssistant.model, 120) || (provider === 'kimi' ? 'moonshot-v1-8k' : 'gpt-5');
    const instructions = [
      'You are an AI assistant helping a non-technical admin create a chatbot scenario.',
      'Return only valid JSON.',
      'Do not include markdown, code fences, comments, or extra prose.',
      'Keep the flow clear, customer-friendly, and compatible with the provided schema.'
    ].join('\n');

    let text = '';
    if (provider === 'openai') {
      const body = {
        model,
        reasoning: { effort: 'low' },
        instructions,
        input: this.buildFlowDraftPrompt(params),
        max_output_tokens: Math.max(320, Number(aiAssistant.maxTokens) || 520)
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestResponsesApi(provider, body, true);
      text = extractOutputText(payload);
    } else {
      const body = {
        model,
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: this.buildFlowDraftPrompt(params) }
        ],
        max_tokens: Math.max(320, Number(aiAssistant.maxTokens) || 520)
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestChatCompletionsApi(provider, body, true);
      text = extractChatCompletionText(payload);
    }

    if (!text) {
      throw new Error('AI assistant returned an empty flow draft.');
    }

    const parsed = extractJsonObject(text);
    if (!parsed) {
      throw new Error('AI assistant returned an invalid flow draft format.');
    }

    return {
      draft: normalizeFlowDraftPayload(parsed),
      model
    };
  }

  async assistFlowConversation(params = {}) {
    const siteConfig = params.siteConfig || {};
    const aiAssistant = siteConfig.aiAssistant || {};
    const provider = String(aiAssistant.provider || 'openai').trim().toLowerCase() || 'openai';

    if (aiAssistant.enabled !== true) {
      throw new Error('AI assistant is disabled for this site.');
    }
    if (!['openai', 'kimi'].includes(provider)) {
      throw new Error('Unsupported AI provider.');
    }
    if (!this.isEnabled(provider)) {
      throw new Error(`${provider.toUpperCase()} API key is not configured on the server.`);
    }

    const model = sanitizeText(aiAssistant.model, 120) || (provider === 'kimi' ? 'moonshot-v1-8k' : 'gpt-5');
    const instructions = [
      'You help write chatbot scenarios in a natural chat style.',
      'Return plain text only.',
      'Never return JSON, lists, markdown, labels, or explanations.',
      'Be concise and customer-friendly.'
    ].join('\n');

    let text = '';
    if (provider === 'openai') {
      const body = {
        model,
        reasoning: { effort: 'low' },
        instructions,
        input: this.buildFlowAssistPrompt(params),
        max_output_tokens: Math.max(120, Number(aiAssistant.maxTokens) || 180)
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestResponsesApi(provider, body, true);
      text = extractOutputText(payload);
    } else {
      const body = {
        model,
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: this.buildFlowAssistPrompt(params) }
        ],
        max_tokens: Math.max(120, Number(aiAssistant.maxTokens) || 180)
      };

      if (Number.isFinite(Number(aiAssistant.temperature))) {
        body.temperature = Number(aiAssistant.temperature);
      }

      const payload = await this.requestChatCompletionsApi(provider, body, true);
      text = extractChatCompletionText(payload);
    }

    if (!text) {
      throw new Error('AI assistant returned an empty flow assist response.');
    }

    return {
      text: sanitizeText(text, 2000),
      model
    };
  }
}

module.exports = {
  AiAssistantService
};
