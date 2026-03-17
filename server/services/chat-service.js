const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_GREETING =
  'Маєте запитання? 👋 Допоможемо з 3D друком, ціною, термінами або кастомним замовленням.';
const MAX_TEXT_LENGTH = 4000;
const MESSAGE_RATE_WINDOW_MS = 60 * 1000;
const MESSAGE_RATE_LIMIT = 20;

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
    this.siteProfileProvider = options.siteProfileProvider;
    this.productsProvider = options.productsProvider;
    this.uploadsDir = options.uploadsDir;
    this.publicUploadsBase = options.publicUploadsBase || '/uploads/chat';
    this.sseClients = new Map();
    this.typingStateMap = new Map();
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
      siteTitle: sanitizeText(siteConfig?.title || siteId || 'Chat Platform', 120) || 'Chat Platform',
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
      siteId: String(row.site_id || ''),
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
      messages: this.getMessages(conversationId)
    };
  }

  getOrCreateConversation({ visitorId, sourcePage, language, siteId, channel = 'web', externalChatId = '', externalUserId = '', skipGreeting = false }) {
    const cleanVisitorId = sanitizeText(visitorId, 64) || this.createVisitorId();
    const cleanSourcePage = sanitizeText(sourcePage, 512) || '/';
    const cleanLanguage = ['uk', 'en'].includes(language) ? language : detectLanguage(language);
    const cleanSiteId = sanitizeText(siteId, 80) || 'default';
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
            WHERE channel = ? AND external_chat_id = ? AND site_id = ?
            ORDER BY datetime(updated_at) DESC, id DESC
            LIMIT 1
            `
          )
          .get(cleanChannel, cleanExternalChatId, cleanSiteId)
      : this.db
          .prepare(
            `
            SELECT *
            FROM conversations
            WHERE visitor_id = ? AND site_id = ?
            ORDER BY datetime(updated_at) DESC, id DESC
            LIMIT 1
            `
          )
          .get(cleanVisitorId, cleanSiteId);

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
        INSERT INTO conversations (conversation_id, site_id, channel, external_chat_id, external_user_id, status, language, source_page, visitor_id, created_at, updated_at, last_message_at)
        VALUES (?, ?, ?, ?, ?, 'ai', ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
        `
      )
      .run(
        conversationId,
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
      channel: cleanChannel,
      siteId: cleanSiteId,
      sourcePage: cleanSourcePage,
      visitorId: cleanVisitorId,
      externalChatId: cleanExternalChatId,
      externalUserId: cleanExternalUserId
    });

    this.notifyTelegramAboutNewConversation(conversationId).catch((error) => {
      console.error('Failed to send new conversation notification to Telegram', error);
      this.addEvent(conversationId, 'telegram_notification_failed', {
        type: 'new_conversation',
        error: String(error.message || error)
      });
    });

    return this.getConversationWithMessages(conversationId);
  }

  addEvent(conversationId, eventType, payload = {}) {
    this.db
      .prepare(
        `
        INSERT INTO conversation_events (conversation_id, event_type, payload, created_at)
        VALUES (?, ?, ?, datetime('now'))
        `
      )
      .run(String(conversationId || '').trim(), String(eventType || '').trim(), JSON.stringify(payload || {}));
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

    return this.channelDispatcher.sendMessage(activeConversation, message);
  }

  async handleChannelInboundMessage(payload = {}) {
    const cleanChannel = normalizeChannel(payload.channel);
    if (cleanChannel === 'web') {
      throw new Error('INVALID_CHANNEL_MESSAGE');
    }

    const siteId = sanitizeText(payload.siteId, 80) || 'printforge-main';
    const externalChatId = sanitizeText(payload.externalChatId, 160);
    const externalUserId = sanitizeText(payload.externalUserId || payload.externalChatId, 160);
    const senderName = sanitizeText(payload.senderName, 80) || `${cleanChannel} user`;
    if (!externalChatId || !externalUserId) {
      throw new Error('CHANNEL_IDENTITY_REQUIRED');
    }

    const conversationPayload = this.getOrCreateConversation({
      siteId,
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
    const cleanChannel = normalizeChannel(channel || conversation?.channel || 'web');
    const cleanExternalMessageId = sanitizeText(externalMessageId, 160);
    const serializedRawPayload = rawPayload == null ? null : JSON.stringify(rawPayload);

    const insert = this.db
      .prepare(
        `
        INSERT INTO messages (conversation_id, channel, external_message_id, sender_type, sender_name, message_text, message_type, raw_payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `
      )
      .run(
        cleanConversationId,
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

      return this.getConversationWithMessages(conversation.conversationId);
    }

    const refreshed = this.getConversationById(conversation.conversationId);
    if (refreshed.status === 'human' || refreshed.status === 'waiting_operator' || refreshed.status === 'closed') {
      return this.getConversationWithMessages(conversation.conversationId);
    }

    if (context.skipAiReply) {
      return this.getConversationWithMessages(conversation.conversationId);
    }

    const aiDecision = this.buildAiDecision({
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
        senderType: 'system',
        senderName: 'System',
        text:
          updated.language === 'en'
            ? 'The chat has been handed over to a manager. We will reply here shortly.'
            : 'Чат передано менеджеру. Ми відповімо тут найближчим часом.',
        messageType: 'system',
        channel: conversation.channel
      });
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

  buildAiDecision({ conversation, text, attachments }) {
    const language = conversation.language === 'en' ? 'en' : 'uk';
    const cleanText = sanitizeText(text).toLowerCase();
    const products = Array.isArray(this.productsProvider?.()) ? this.productsProvider() : [];
    const supportTelegram = this.siteProfileProvider?.().telegramDisplay || '@PicoDesigner';

    if (attachments.length > 0) {
      return { escalate: true, reason: 'attachment_uploaded', assignedTo: 'telegram' };
    }

    if (!cleanText) {
      return {
        escalate: false,
        reply:
          language === 'en'
            ? 'Thanks. If you want, describe the size, material, or purpose of the part and I will help further.'
            : 'Дякую. Якщо хочете, опишіть розмір, матеріал або призначення деталі, і я підкажу далі.'
      };
    }

    const escalationPatterns = [
      /кастом|індивідуал|нестандарт|прорах|розрах|кошторис|точн(а|у) цін|менеджер|оператор|людин|терміново/u,
      /custom|quote|estimate|exact price|manager|operator|human|urgent/i,
      /\.(stl|3mf|obj|zip|pdf)\b/i
    ];

    if (escalationPatterns.some((pattern) => pattern.test(cleanText))) {
      return { escalate: true, reason: 'manual_estimate_requested', assignedTo: 'telegram' };
    }

    const productMatch = products.find((item) => {
      const title = String(item.title || '').toLowerCase();
      return title && cleanText.includes(title);
    });

    if (productMatch && Number(productMatch.price) > 0) {
      const priceText =
        language === 'en'
          ? `Current price for "${productMatch.title}" is ${Number(productMatch.price).toLocaleString('uk-UA')} UAH.`
          : `Актуальна ціна на "${productMatch.title}" зараз ${Number(productMatch.price).toLocaleString('uk-UA')} грн.`;
      const extra =
        language === 'en'
          ? 'If you need a modified version or custom size, send details and we will calculate it separately.'
          : 'Якщо потрібна модифікація або інший розмір, надішліть деталі і ми порахуємо окремо.';
      return { escalate: false, reply: `${priceText} ${extra}` };
    }

    if (/скільки.*кошту|ціна|price|cost/u.test(cleanText)) {
      return {
        escalate: false,
        reply:
          language === 'en'
            ? 'For standard products I can name the listed site price. For a custom order, please send dimensions, reference images, sketch, or a file, and we will calculate the exact cost.'
            : 'Для стандартних товарів можу назвати ціну з сайту. Для кастомного замовлення надішліть розміри, фото, ескіз або файл, і ми підрахуємо точну вартість.'
      };
    }

    if (/термін|скільки.*час|коли буде готов|lead time|how long|delivery time/u.test(cleanText)) {
      return {
        escalate: false,
        reply:
          language === 'en'
            ? 'Standard production usually takes 1-3 days depending on complexity and queue. For custom parts with files or unusual geometry, a manager will confirm the exact lead time after review.'
            : 'Стандартне виготовлення зазвичай займає 1-3 дні залежно від складності та черги. Для кастомних деталей з файлами або нетиповою геометрією точний термін підтвердить менеджер після перегляду.'
      };
    }

    if (/доставка|відправ|нова пошта|shipping|delivery/u.test(cleanText)) {
      return {
        escalate: false,
        reply:
          language === 'en'
            ? 'We ship across Ukraine, usually via Nova Poshta. After production we send tracking details right away.'
            : 'Доставляємо по Україні, зазвичай Новою Поштою. Після готовності одразу надсилаємо дані для відстеження.'
      };
    }

    if (/як.*надіслат|куди.*файл|upload|attach|send file/u.test(cleanText)) {
      return {
        escalate: false,
        reply:
          language === 'en'
            ? `You can attach files directly in this chat. We accept JPG, PNG, PDF, STL, 3MF, OBJ, and ZIP up to 20 MB. After file upload the request is handed to a manager for review.`
            : 'Ви можете прикріпити файл прямо в цей чат. Підтримуємо JPG, PNG, PDF, STL, 3MF, OBJ і ZIP до 20 MB. Після завантаження файл автоматично піде менеджеру на перегляд.'
      };
    }

    if (/матеріал|pla|petg|abs|material/u.test(cleanText)) {
      return {
        escalate: false,
        reply:
          language === 'en'
            ? 'We usually work with PLA, PETG, and ABS. The best material depends on whether you need appearance, heat resistance, or stronger mechanical properties.'
            : 'Ми зазвичай працюємо з PLA, PETG та ABS. Оптимальний матеріал залежить від того, чи вам важливі зовнішній вигляд, термостійкість або міцність.'
      };
    }

    if (/привіт|добрий|hello|hi|hey/u.test(cleanText)) {
      return {
        escalate: false,
        reply:
          language === 'en'
            ? 'Hello. I can help with 3D printing, materials, standard lead times, and how to submit a custom request.'
            : 'Вітаю. Я можу допомогти з 3D друком, матеріалами, стандартними термінами та тим, як надіслати кастомний запит.'
      };
    }

    return {
      escalate: true,
      reason: 'low_confidence',
      assignedTo: 'telegram',
      reply:
        language === 'en'
          ? `I am handing this over to a manager for a precise reply. If needed, you can also write to Telegram ${supportTelegram}.`
          : `Передаю це менеджеру для точної відповіді. Якщо зручно, можете також написати в Telegram ${supportTelegram}.`
    };
  }

  listConversations({ status, siteId, search, limit = 100 }) {
    const clauses = [];
    const params = [];

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

  listInboxConversations({ status, siteId, search, limit = 100 }) {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const sourceStatus =
      normalizedStatus === 'closed'
        ? 'closed'
        : normalizedStatus === 'open'
          ? null
          : null;

    const items = this.listConversations({
      status: sourceStatus,
      siteId,
      search,
      limit
    });

    if (normalizedStatus === 'open') {
      return items.filter((item) => item.inboxStatus === 'open');
    }

    if (normalizedStatus === 'closed') {
      return items.filter((item) => item.inboxStatus === 'closed');
    }

    return items;
  }

  listEvents(conversationId) {
    return this.db
      .prepare(
        `
        SELECT id, conversation_id, event_type, payload, created_at
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
        eventType: String(row.event_type),
        payload: safeJsonParse(row.payload, {}),
        createdAt: String(row.created_at || '')
      }));
  }

  getFeedbackForConversation(conversationId) {
    const row = this.db
      .prepare(
        `
        SELECT id, conversation_id, rating, ease, comment, created_at, requested_by
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
        INSERT INTO conversation_feedback (id, conversation_id, rating, ease, comment, created_at, requested_by)
        VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
        ON CONFLICT(conversation_id)
        DO UPDATE SET
          id = excluded.id,
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
