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

function buildKnowledgeBlock(aiAssistant) {
  const config = aiAssistant || {};
  const sections = [
    ['Company description', config.companyDescription],
    ['Services', config.services],
    ['FAQ', config.faq],
    ['Pricing rules', config.pricingRules],
    ['Lead time rules', config.leadTimeRules],
    ['File requirements', config.fileRequirements],
    ['Delivery info', config.deliveryInfo],
    ['Tone of voice', config.tone],
    ['Forbidden claims', config.forbiddenClaims],
    ['Default language', config.defaultLanguage],
    ['Response style', config.responseStyle],
    ['Ask-for-contact style', config.askContactStyle],
    ['Ask-for-file style', config.askFileStyle]
  ];

  return sections
    .map(([label, value]) => `${label}: ${sanitizeText(value, 4000) || '-'}`)
    .join('\n');
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

  const output = Array.isArray(payload && payload.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item && item.content) ? item.content : [];
    for (const part of content) {
      const text = sanitizeText(
        (part && (part.text || part.output_text || (part.type === 'output_text' ? part.text : ''))) || '',
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
        const text = sanitizeText(part && (part.text || part.content || ''), 8000);
        if (text) return text;
      }
    }
  }
  return '';
}

function extractJsonObject(text) {
  const source = sanitizeText(text, 12000);
  if (!source) return null;

  const directStart = source.indexOf('{');
  const directEnd = source.lastIndexOf('}');
  if (directStart >= 0 && directEnd > directStart) {
    try {
      return JSON.parse(source.slice(directStart, directEnd + 1));
    } catch (error) {
      // fall through
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
      'You are assisting a human operator inside an internal inbox.',
      'You are not talking to the customer directly; you generate a draft for the operator.',
      `Reply in the customer language when it is obvious from the conversation; otherwise use ${defaultLanguage}.`,
      'Keep the draft concise, human, and action-oriented.',
      'Do not invent prices, delivery promises, or policies.',
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
      `KNOWLEDGE BASE:\n${buildKnowledgeBlock(aiAssistant)}`,
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
      `KNOWLEDGE BASE:\n${buildKnowledgeBlock(aiAssistant)}`,
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
      `KNOWLEDGE BASE:\n${buildKnowledgeBlock(aiAssistant)}`,
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
      `KNOWLEDGE BASE:\n${buildKnowledgeBlock(aiAssistant)}`,
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
}

module.exports = {
  AiAssistantService
};
