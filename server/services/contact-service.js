const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_STATUSES = ['new', 'contacted', 'in_progress', 'closed'];
const ALLOWED_TAGS = ['lead', 'client', 'vip', 'spam'];
const DEFAULT_WORKSPACE_ID = 'workspace_default';

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

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function buildSearchIndex(contact) {
  return [
    contact.contactId,
    contact.name,
    contact.phone,
    contact.telegram,
    contact.telegramId,
    contact.instagramId,
    contact.facebookId,
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
    this.db = options.db || null;

    if (this.db) {
      this.statements = {
        listContacts: this.db.prepare(`
          SELECT *
          FROM contacts
          WHERE (? = '' OR workspace_id = ?)
            AND (? = '' OR site_id = ?)
            AND (? = '' OR conversation_id = ?)
            AND (? = '' OR lower(
              coalesce(contact_id, '') || ' ' ||
              coalesce(workspace_id, '') || ' ' ||
              coalesce(name, '') || ' ' ||
              coalesce(phone, '') || ' ' ||
              coalesce(telegram, '') || ' ' ||
              coalesce(telegram_id, '') || ' ' ||
              coalesce(instagram_id, '') || ' ' ||
              coalesce(facebook_id, '') || ' ' ||
              coalesce(email, '') || ' ' ||
              coalesce(notes, '') || ' ' ||
              coalesce(status, '') || ' ' ||
              coalesce(tags_json, '') || ' ' ||
              coalesce(site_id, '') || ' ' ||
              coalesce(conversation_id, '')
            ) LIKE '%' || ? || '%')
          ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC, id DESC
          LIMIT ?
        `),
        getContactById: this.db.prepare('SELECT * FROM contacts WHERE contact_id = ? LIMIT 1'),
        findByTelegramId: this.db.prepare('SELECT * FROM contacts WHERE telegram_id = ? AND (? = \'\' OR workspace_id = ?) LIMIT 1'),
        findByInstagramId: this.db.prepare('SELECT * FROM contacts WHERE instagram_id = ? AND (? = \'\' OR workspace_id = ?) LIMIT 1'),
        findByFacebookId: this.db.prepare('SELECT * FROM contacts WHERE facebook_id = ? AND (? = \'\' OR workspace_id = ?) LIMIT 1'),
        insertContact: this.db.prepare(`
          INSERT INTO contacts (
            contact_id, workspace_id, site_id, name, email, phone, telegram, telegram_id,
            instagram_id, facebook_id, status, source, notes, tags_json, conversation_id,
            last_conversation_at, created_at, updated_at
          ) VALUES (
            @contact_id, @workspace_id, @site_id, @name, @email, @phone, @telegram, @telegram_id,
            @instagram_id, @facebook_id, @status, @source, @notes, @tags_json, @conversation_id,
            @last_conversation_at, @created_at, @updated_at
          )
        `),
        updateContact: this.db.prepare(`
          UPDATE contacts
          SET workspace_id = @workspace_id,
              site_id = @site_id,
              name = @name,
              email = @email,
              phone = @phone,
              telegram = @telegram,
              telegram_id = @telegram_id,
              instagram_id = @instagram_id,
              facebook_id = @facebook_id,
              status = @status,
              source = @source,
              notes = @notes,
              tags_json = @tags_json,
              conversation_id = @conversation_id,
              last_conversation_at = @last_conversation_at,
              created_at = @created_at,
              updated_at = @updated_at
          WHERE contact_id = @contact_id
        `)
      };

      this.migrateLegacyJsonStore();
    }
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
    const hasField = (key) => Object.prototype.hasOwnProperty.call(input || {}, key);
    const pickValue = (key, fallback) => {
      if (hasField(key)) return input[key];
      return fallback;
    };

    const sourceSiteId = sanitizeText(
      pickValue('sourceSiteId', pickValue('siteId', existing?.sourceSiteId || existing?.siteId || '')),
      80
    );

    const workspaceId = sanitizeText(
      pickValue('workspaceId', pickValue('workspace_id', existing?.workspaceId || DEFAULT_WORKSPACE_ID)),
      80
    ) || DEFAULT_WORKSPACE_ID;

    const source = sanitizeText(pickValue('source', existing?.source || sourceSiteId || ''), 80);

    const contact = {
      contactId: sanitizeText(
        pickValue('contactId', pickValue('contact_id', existing?.contactId || this.createContactId())),
        120
      ) || this.createContactId(),
      workspaceId,
      sourceSiteId,
      source,
      name: sanitizeText(pickValue('name', existing?.name || ''), 120),
      phone: normalizePhone(pickValue('phone', existing?.phone || '')),
      telegram: normalizeTelegram(pickValue('telegram', existing?.telegram || '')),
      telegramId: sanitizeText(pickValue('telegramId', existing?.telegramId || ''), 120),
      instagramId: sanitizeText(pickValue('instagramId', existing?.instagramId || ''), 120),
      facebookId: sanitizeText(pickValue('facebookId', existing?.facebookId || ''), 120),
      email: normalizeEmail(pickValue('email', existing?.email || '')),
      notes: sanitizeText(pickValue('notes', existing?.notes || ''), 4000),
      status: normalizeStatus(pickValue('status', existing?.status || 'new')),
      tags: normalizeTags(hasField('tags') ? input.tags : (existing?.tags || [])),
      createdAt: sanitizeText(pickValue('createdAt', pickValue('created_at', existing?.createdAt || now)), 32) || now,
      updatedAt: sanitizeText(pickValue('updatedAt', pickValue('updated_at', existing?.updatedAt || now)), 32) || now,
      conversationId: sanitizeText(pickValue('conversationId', existing?.conversationId || ''), 120),
      lastConversationAt: sanitizeText(pickValue('lastConversationAt', existing?.lastConversationAt || ''), 32)
    };

    contact.searchIndex = buildSearchIndex(contact);
    return contact;
  }

  sanitizePublicContact(contact) {
    if (!contact) return null;
    return {
      contactId: contact.contactId,
      workspaceId: contact.workspaceId || DEFAULT_WORKSPACE_ID,
      siteId: contact.sourceSiteId || '',
      source: contact.source || '',
      name: contact.name,
      phone: contact.phone,
      telegram: contact.telegram,
      telegramId: contact.telegramId,
      instagramId: contact.instagramId,
      facebookId: contact.facebookId,
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

  deserializeRow(row) {
    if (!row) return null;
    return {
      contactId: String(row.contact_id || '').trim(),
      workspaceId: String(row.workspace_id || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID,
      sourceSiteId: String(row.site_id || '').trim(),
      source: String(row.source || '').trim(),
      name: String(row.name || '').trim(),
      phone: String(row.phone || '').trim(),
      telegram: String(row.telegram || '').trim(),
      telegramId: String(row.telegram_id || '').trim(),
      instagramId: String(row.instagram_id || '').trim(),
      facebookId: String(row.facebook_id || '').trim(),
      email: String(row.email || '').trim(),
      notes: String(row.notes || '').trim(),
      status: normalizeStatus(row.status),
      tags: normalizeTags(safeJsonParse(row.tags_json, [])),
      createdAt: String(row.created_at || '').trim(),
      updatedAt: String(row.updated_at || '').trim(),
      conversationId: String(row.conversation_id || '').trim(),
      lastConversationAt: String(row.last_conversation_at || '').trim()
    };
  }

  serializeContact(contact) {
    return {
      contact_id: contact.contactId,
      workspace_id: contact.workspaceId || DEFAULT_WORKSPACE_ID,
      site_id: contact.sourceSiteId || '',
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      telegram: contact.telegram || '',
      telegram_id: contact.telegramId || '',
      instagram_id: contact.instagramId || '',
      facebook_id: contact.facebookId || '',
      status: contact.status || 'new',
      source: contact.source || '',
      notes: contact.notes || '',
      tags_json: JSON.stringify(Array.isArray(contact.tags) ? contact.tags : []),
      conversation_id: contact.conversationId || '',
      last_conversation_at: contact.lastConversationAt || '',
      created_at: contact.createdAt || '',
      updated_at: contact.updatedAt || ''
    };
  }

  upsertContactRow(contact) {
    const existing = this.statements.getContactById.get(contact.contactId);
    const serialized = this.serializeContact(contact);
    if (existing) {
      this.statements.updateContact.run(serialized);
    } else {
      this.statements.insertContact.run(serialized);
    }
  }

  migrateLegacyJsonStore() {
    if (!this.db) return;
    const legacyStore = this.readStore();
    if (!legacyStore.contacts.length) return;

    const insertMany = this.db.transaction((contacts) => {
      contacts.forEach((legacyContact) => {
        const normalized = this.normalizeContact(legacyContact);
        this.upsertContactRow(normalized);
      });
    });

    insertMany(legacyStore.contacts);
  }

  listContacts(filters = {}) {
    const q = sanitizeText(filters.q || '', 200).toLowerCase();
    const workspaceId = sanitizeText(filters.workspaceId || '', 80);
    const siteId = sanitizeText(filters.siteId || '', 80);
    const conversationId = sanitizeText(filters.conversationId || '', 120);
    const limit = Math.max(1, Math.min(Number(filters.limit) || 50, 50000));

    if (!this.db) {
      const store = this.readStore();
      return store.contacts
        .filter((contact) => !workspaceId || (contact.workspaceId || DEFAULT_WORKSPACE_ID) === workspaceId)
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

    return this.statements.listContacts
      .all(workspaceId, workspaceId, siteId, siteId, conversationId, conversationId, q, q, limit)
      .map((row) => this.sanitizePublicContact(this.deserializeRow(row)));
  }

  getContactById(contactId) {
    const cleanId = sanitizeText(contactId, 120);
    if (!cleanId) return null;

    if (!this.db) {
      const store = this.readStore();
      const contact = store.contacts.find((item) => item.contactId === cleanId);
      return this.sanitizePublicContact(contact || null);
    }

    return this.sanitizePublicContact(this.deserializeRow(this.statements.getContactById.get(cleanId)));
  }

  findByExternalIdentity(channel, externalUserId, workspaceId = '') {
    const cleanChannel = sanitizeText(channel, 40).toLowerCase();
    const cleanExternalUserId = sanitizeText(externalUserId, 120);
    const cleanWorkspaceId = sanitizeText(workspaceId, 120);
    if (!cleanChannel || !cleanExternalUserId) return null;

    if (!this.db) {
      const key =
        cleanChannel === 'telegram'
          ? 'telegramId'
          : cleanChannel === 'instagram'
            ? 'instagramId'
            : cleanChannel === 'facebook'
              ? 'facebookId'
              : '';
      if (!key) return null;
      const store = this.readStore();
      const match = store.contacts.find((item) => (
        String(item && item[key] || '').trim() === cleanExternalUserId &&
        (!cleanWorkspaceId || String(item?.workspaceId || DEFAULT_WORKSPACE_ID).trim() === cleanWorkspaceId)
      ));
      return this.sanitizePublicContact(match || null);
    }

    const statement =
      cleanChannel === 'telegram'
        ? this.statements.findByTelegramId
        : cleanChannel === 'instagram'
          ? this.statements.findByInstagramId
          : cleanChannel === 'facebook'
            ? this.statements.findByFacebookId
            : null;

    if (!statement) return null;
    return this.sanitizePublicContact(this.deserializeRow(statement.get(cleanExternalUserId, cleanWorkspaceId, cleanWorkspaceId)));
  }

  upsertExternalIdentity(input = {}) {
    const cleanChannel = sanitizeText(input.channel, 40).toLowerCase();
    const cleanExternalUserId = sanitizeText(input.externalUserId, 120);
    if (!cleanChannel || !cleanExternalUserId) {
      return null;
    }

    const key =
      cleanChannel === 'telegram'
        ? 'telegramId'
        : cleanChannel === 'instagram'
          ? 'instagramId'
          : cleanChannel === 'facebook'
            ? 'facebookId'
            : '';
    if (!key) return null;

    const workspaceId = sanitizeText(input.workspaceId, 120) || DEFAULT_WORKSPACE_ID;
    const existing = this.findByExternalIdentity(cleanChannel, cleanExternalUserId, workspaceId);
    const patch = {
      workspaceId,
      sourceSiteId: sanitizeText(input.sourceSiteId, 80),
      source: sanitizeText(input.source || input.sourceSiteId, 80),
      conversationId: sanitizeText(input.conversationId, 120),
      lastConversationAt: sanitizeText(input.lastConversationAt, 32),
      [key]: cleanExternalUserId
    };

    if (cleanChannel === 'telegram') {
      patch.telegram = normalizeTelegram(input.telegram || existing?.telegram || '');
    }
    if (!existing?.name) {
      patch.name = sanitizeText(input.name, 120);
    }

    if (existing) {
      return this.updateContact(existing.contactId, Object.assign({}, existing, patch));
    }

    return this.createContact(Object.assign({}, patch, {
      name: sanitizeText(input.name, 120)
    }));
  }

  createContact(input = {}) {
    const contact = this.normalizeContact(input);

    if (!this.db) {
      const store = this.readStore();
      store.contacts.push(contact);
      this.writeStore(store);
      return this.sanitizePublicContact(contact);
    }

    this.upsertContactRow(contact);
    return this.sanitizePublicContact(contact);
  }

  updateContact(contactId, input = {}) {
    const cleanId = sanitizeText(contactId, 120);
    if (!cleanId) return null;

    if (!this.db) {
      const store = this.readStore();
      const index = store.contacts.findIndex((item) => item.contactId === cleanId);
      if (index < 0) return null;
      const updated = this.normalizeContact(input, store.contacts[index]);
      store.contacts[index] = updated;
      this.writeStore(store);
      return this.sanitizePublicContact(updated);
    }

    const existing = this.deserializeRow(this.statements.getContactById.get(cleanId));
    if (!existing) return null;
    const updated = this.normalizeContact(input, existing);
    this.upsertContactRow(updated);
    return this.sanitizePublicContact(updated);
  }

  exportContactsCsv(filters = {}) {
    const contacts = this.listContacts(Object.assign({}, filters, { limit: 50000 }));
    const rows = [
      ['contactId', 'name', 'phone', 'telegram', 'telegramId', 'instagramId', 'facebookId', 'email', 'notes', 'sourceSiteId', 'conversationId', 'createdAt', 'updatedAt', 'leadStatus', 'tags']
    ].concat(contacts.map((contact) => ([
      contact.contactId,
      contact.name,
      contact.phone,
      contact.telegram,
      contact.telegramId,
      contact.instagramId,
      contact.facebookId,
      contact.email,
      contact.notes,
      contact.sourceSiteId,
      contact.conversationId,
      contact.createdAt,
      contact.updatedAt,
      contact.status,
      Array.isArray(contact.tags) ? contact.tags.join('|') : ''
    ])));

    return rows.map((row) => row.map((cell) => {
      const value = String(cell || '');
      return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(',')).join('\n') + '\n';
  }
}

module.exports = {
  ContactService,
  ALLOWED_STATUSES,
  ALLOWED_TAGS
};
