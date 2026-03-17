function sanitizeText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

class InstagramChannelService {
  constructor(options = {}) {
    this.channel = 'instagram';
    this.pageAccessToken = String(options.pageAccessToken || '').trim();
    this.verifyToken = String(options.verifyToken || '').trim();
    this.defaultSiteId = String(options.defaultSiteId || 'printforge-main').trim();
    this.graphVersion = String(options.graphVersion || 'v22.0').trim();
  }

  isConfigured() {
    return Boolean(this.pageAccessToken);
  }

  verifyWebhookToken(token) {
    if (!this.verifyToken) return false;
    return String(token || '').trim() === this.verifyToken;
  }

  extractInboundEvents(body) {
    if (String(body?.object || '').trim().toLowerCase() !== 'instagram') {
      return [];
    }

    const events = [];
    (body.entry || []).forEach((entry) => {
      (entry.messaging || []).forEach((event) => {
        if (event?.message?.is_echo) return;
        const text = sanitizeText(event?.message?.text, 3000);
        const senderId = String(event?.sender?.id || '').trim();
        const recipientId = String(event?.recipient?.id || '').trim();
        const mid = String(event?.message?.mid || '').trim();
        if (!text || !senderId) return;
        events.push({
          channel: this.channel,
          siteId: this.defaultSiteId,
          externalChatId: senderId,
          externalUserId: senderId,
          externalRecipientId: recipientId,
          externalMessageId: mid,
          senderName: 'Instagram user',
          sourcePage: '/instagram-direct',
          text,
          rawPayload: event
        });
      });
    });
    return events;
  }

  async sendMessage(conversation, message) {
    if (!this.isConfigured()) {
      throw new Error('Instagram channel is not configured');
    }
    const recipientId = String(conversation?.externalChatId || conversation?.externalUserId || '').trim();
    const text = sanitizeText(message?.text, 4000);
    if (!recipientId || !text) {
      throw new Error('Instagram outbound message is missing recipient id or text');
    }

    const response = await fetch(`https://graph.facebook.com/${this.graphVersion}/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.pageAccessToken}`
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { text }
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Instagram Send API failed: ${body}`);
    }

    const payload = await response.json();
    return {
      ok: true,
      channel: this.channel,
      externalMessageId: String(payload?.message_id || '').trim(),
      rawPayload: payload
    };
  }
}

module.exports = { InstagramChannelService };
