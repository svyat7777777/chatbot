const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_STATUSES = ['new', 'contacted', 'in_progress', 'closed'];
const ALLOWED_TAGS = ['lead', 'client', 'vip', 'spam'];

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

function normalizePhone(value) {
  return sanitizeText(value, 40).replace(/[^\d+()\-.\s]/g, '').trim();
}

function normalizeEmail(value) {
  return sanitizeText(value, 120).toLowerCase();
}

function normalizeTelegram(value) {
  const clean = sanitizeText(value, 80).replace(/\s+/g, '');
  if (!clean) return '';
  return clean.startsWith('@') ? clean : `@${clean.replace(/^@+/, '')}`;
}

function normalizeStatus(value) {
  const clean = sanitizeText(value, 40).toLowerCase();
  return ALLOWED_STATUSES.includes(clean) ? clean : 'new';
}

function normalizeTags(values) {
  const list = Array.isArray(values)
    ? values
    : String(values || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  return Array.from(
    new Set(
      list
        .map((item) => sanitizeText(item, 40).toLowerCase())
        .filter((item) => ALLOWED_TAGS.includes(item))
    )
  );
}

function buildSearchIndex(contact) {
  return [
    contact.contactId,
    contact.name,
    contact.phone,
    contact.telegram,
    contact.email,
    contact.notes,
    contact.status,
    ...(contact.tags || []),
    contact.sourceSiteId,
    contact.conversationId
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

class ContactService {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.join(__dirname, '..', '..', 'data', 'contacts.json');
  }

  readStore() {
    try {
      const raw = fs.readFileSync(this.storagePath, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.contacts) ? parsed : { contacts: [] };
    } catch (error) {
      return { contacts: [] };
    }
  }

  writeStore(store) {
    ensureDir(path.dirname(this.storagePath));
    fs.writeFileSync(this.storagePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
  }

  createContactId() {
    return `ct-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
  }

  normalizeContact(input = {}, existing = null) {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const contact = {
      contactId: existing?.contactId || this.createContactId(),
      name: sanitizeText(input.name || existing?.name || '', 120),
      phone: normalizePhone(input.phone || existing?.phone || ''),
      telegram: normalizeTelegram(input.telegram || existing?.telegram || ''),
      email: normalizeEmail(input.email || existing?.email || ''),
      notes: sanitizeText(input.notes || existing?.notes || '', 4000),
      status: normalizeStatus(input.status || existing?.status || 'new'),
      tags: normalizeTags(input.tags != null ? input.tags : existing?.tags || []),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      sourceSiteId: sanitizeText(input.sourceSiteId || existing?.sourceSiteId || '', 80),
      conversationId: sanitizeText(input.conversationId || existing?.conversationId || '', 120),
      lastConversationAt: sanitizeText(input.lastConversationAt || existing?.lastConversationAt || '', 32)
    };

    contact.searchIndex = buildSearchIndex(contact);
    return contact;
  }

  sanitizePublicContact(contact) {
    if (!contact) return null;
    return {
      contactId: contact.contactId,
      name: contact.name,
      phone: contact.phone,
      telegram: contact.telegram,
      email: contact.email,
      notes: contact.notes,
      status: contact.status,
      tags: Array.isArray(contact.tags) ? contact.tags.slice() : [],
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
      sourceSiteId: contact.sourceSiteId,
      conversationId: contact.conversationId,
      lastConversationAt: contact.lastConversationAt
    };
  }

  listContacts(filters = {}) {
    const q = sanitizeText(filters.q || '', 200).toLowerCase();
    const siteId = sanitizeText(filters.siteId || '', 80);
    const conversationId = sanitizeText(filters.conversationId || '', 120);
    const limit = Math.max(1, Math.min(Number(filters.limit) || 50, 500));
    const store = this.readStore();

    return store.contacts
      .filter((contact) => !siteId || contact.sourceSiteId === siteId)
      .filter((contact) => !conversationId || contact.conversationId === conversationId)
      .filter((contact) => !q || String(contact.searchIndex || '').includes(q))
      .sort((left, right) => {
        const leftValue = String(left.updatedAt || left.createdAt || '');
        const rightValue = String(right.updatedAt || right.createdAt || '');
        return rightValue.localeCompare(leftValue);
      })
      .slice(0, limit)
      .map((contact) => this.sanitizePublicContact(contact));
  }

  getContactById(contactId) {
    const cleanId = sanitizeText(contactId, 120);
    if (!cleanId) return null;
    const store = this.readStore();
    const contact = store.contacts.find((item) => item.contactId === cleanId);
    return this.sanitizePublicContact(contact || null);
  }

  createContact(input = {}) {
    const store = this.readStore();
    const contact = this.normalizeContact(input);
    store.contacts.push(contact);
    this.writeStore(store);
    return this.sanitizePublicContact(contact);
  }

  updateContact(contactId, input = {}) {
    const cleanId = sanitizeText(contactId, 120);
    if (!cleanId) return null;

    const store = this.readStore();
    const index = store.contacts.findIndex((item) => item.contactId === cleanId);
    if (index < 0) return null;

    const updated = this.normalizeContact(input, store.contacts[index]);
    store.contacts[index] = updated;
    this.writeStore(store);
    return this.sanitizePublicContact(updated);
  }
}

module.exports = {
  ContactService,
  ALLOWED_STATUSES,
  ALLOWED_TAGS
};
