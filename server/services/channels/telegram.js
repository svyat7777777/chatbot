const fs = require('fs');
const path = require('path');

function sanitizeText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

class TelegramChannelService {
  constructor(options = {}) {
    this.channel = 'telegram';
    this.botToken = String(options.botToken || '').trim();
    this.webhookSecret = String(options.webhookSecret || '').trim();
    this.defaultSiteId = String(options.defaultSiteId || 'printforge-main').trim();
    this.operatorChatIds = Array.isArray(options.operatorChatIds)
      ? options.operatorChatIds.map((item) => String(item || '').trim()).filter(Boolean)
      : String(options.operatorChatIds || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
  }

  isConfigured() {
    return Boolean(this.botToken);
  }

  verifyWebhook(headers = {}) {
    if (!this.webhookSecret) return true;
    const provided = String(headers['x-telegram-bot-api-secret-token'] || '').trim();
    return provided === this.webhookSecret;
  }

  isOperatorChat(chatId) {
    return this.operatorChatIds.includes(String(chatId || '').trim());
  }

  getWebhookSiteId(update) {
    return String(update?.message?.chat?.username || '').trim() ? this.defaultSiteId : this.defaultSiteId;
  }

  buildSenderName(message) {
    const first = sanitizeText(message?.from?.first_name, 40);
    const last = sanitizeText(message?.from?.last_name, 40);
    const username = sanitizeText(message?.from?.username, 40);
    return [first, last].filter(Boolean).join(' ') || username || 'Telegram user';
  }

  parseInboundUpdate(update) {
    const message = update?.message || update?.edited_message;
    if (!message) return null;

    const chatId = String(message.chat?.id || '').trim();
    if (!chatId || this.isOperatorChat(chatId)) {
      return null;
    }

    const text = sanitizeText(message.text || message.caption || '', 3000);
    if (!text) {
      return null;
    }

    return {
      channel: this.channel,
      siteId: this.getWebhookSiteId(update),
      externalChatId: chatId,
      externalUserId: String(message.from?.id || chatId).trim(),
      externalMessageId: String(message.message_id || '').trim(),
      senderName: this.buildSenderName(message),
      senderHandle: message.from?.username ? `@${String(message.from.username).replace(/^@+/, '')}` : '',
      sourcePage: '/telegram',
      text,
      rawPayload: update
    };
  }

  async callTelegram(method, payload) {
    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram API ${method} failed: ${body}`);
    }
    return response.json();
  }

  async sendMessage(conversation, message) {
    if (!this.isConfigured()) {
      throw new Error('Telegram channel is not configured');
    }
    const chatId = String(conversation?.externalChatId || '').trim();
    const text = sanitizeText(message?.text, 4000);
    if (!chatId || !text) {
      throw new Error('Telegram outbound message is missing chat id or text');
    }

    const payload = await this.callTelegram('sendMessage', {
      chat_id: chatId,
      text
    });

    return {
      ok: true,
      channel: this.channel,
      externalMessageId: String(payload?.result?.message_id || '').trim(),
      rawPayload: payload
    };
  }
}

module.exports = { TelegramChannelService };
