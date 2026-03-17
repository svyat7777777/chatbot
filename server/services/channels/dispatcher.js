class ChannelDispatcher {
  constructor() {
    this.adapters = new Map();
  }

  register(adapter) {
    if (!adapter || !adapter.channel) return;
    this.adapters.set(String(adapter.channel).trim(), adapter);
  }

  get(channel) {
    return this.adapters.get(String(channel || 'web').trim());
  }

  async sendMessage(conversation, message) {
    const channel = String(conversation?.channel || 'web').trim().toLowerCase();
    if (!channel || channel === 'web') {
      return { ok: true, skipped: true, channel: 'web' };
    }

    const adapter = this.get(channel);
    if (!adapter || typeof adapter.sendMessage !== 'function') {
      throw new Error(`No outbound adapter registered for channel "${channel}"`);
    }

    return adapter.sendMessage(conversation, message);
  }
}

module.exports = { ChannelDispatcher };
