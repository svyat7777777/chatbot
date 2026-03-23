const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createDatabase(dbFilePath) {
  const resolvedPath = path.resolve(dbFilePath);
  ensureDir(path.dirname(resolvedPath));

  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL UNIQUE,
      site_id TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'web',
      external_chat_id TEXT,
      external_user_id TEXT,
      status TEXT NOT NULL DEFAULT 'ai',
      language TEXT NOT NULL DEFAULT 'uk',
      source_page TEXT,
      visitor_id TEXT NOT NULL,
      assigned_to TEXT,
      assigned_operator TEXT,
      unread_count INTEGER NOT NULL DEFAULT 0,
      last_operator TEXT,
      handoff_at TEXT,
      human_replied_at TEXT,
      feedback_requested_at TEXT,
      feedback_completed_at TEXT,
      closed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_message_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'web',
      external_message_id TEXT,
      sender_type TEXT NOT NULL,
      sender_name TEXT,
      message_text TEXT,
      message_type TEXT NOT NULL DEFAULT 'text',
      raw_payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER NOT NULL DEFAULT 0,
      storage_path TEXT NOT NULL,
      public_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversation_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversation_feedback (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL UNIQUE,
      rating TEXT NOT NULL,
      ease TEXT,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      requested_by TEXT,
      FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS integration_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT,
      is_secret INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id TEXT NOT NULL UNIQUE,
      workspace_id TEXT NOT NULL DEFAULT 'default',
      site_id TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      telegram TEXT NOT NULL DEFAULT '',
      telegram_id TEXT NOT NULL DEFAULT '',
      instagram_id TEXT NOT NULL DEFAULT '',
      facebook_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      source TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      conversation_id TEXT NOT NULL DEFAULT '',
      last_conversation_at TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_events_conversation_id ON conversation_events(conversation_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversation_feedback_created_at ON conversation_feedback(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_integration_settings_updated_at ON integration_settings(updated_at DESC);
  `);

  const columns = db.prepare(`PRAGMA table_info(conversations)`).all().map((column) => column.name);
  if (!columns.includes('site_id')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN site_id TEXT NOT NULL DEFAULT 'default'`);
  }
  if (!columns.includes('channel')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN channel TEXT NOT NULL DEFAULT 'web'`);
  }
  if (!columns.includes('external_chat_id')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN external_chat_id TEXT`);
  }
  if (!columns.includes('external_user_id')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN external_user_id TEXT`);
  }
  if (!columns.includes('unread_count')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN unread_count INTEGER NOT NULL DEFAULT 0`);
  }
  if (!columns.includes('assigned_operator')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN assigned_operator TEXT`);
  }
  if (!columns.includes('last_operator')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN last_operator TEXT`);
  }
  if (!columns.includes('handoff_at')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN handoff_at TEXT`);
  }
  if (!columns.includes('human_replied_at')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN human_replied_at TEXT`);
  }
  if (!columns.includes('closed_at')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN closed_at TEXT`);
  }
  if (!columns.includes('feedback_requested_at')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN feedback_requested_at TEXT`);
  }
  if (!columns.includes('feedback_completed_at')) {
    db.exec(`ALTER TABLE conversations ADD COLUMN feedback_completed_at TEXT`);
  }

  const messageColumns = db.prepare(`PRAGMA table_info(messages)`).all().map((column) => column.name);
  if (!messageColumns.includes('channel')) {
    db.exec(`ALTER TABLE messages ADD COLUMN channel TEXT NOT NULL DEFAULT 'web'`);
  }
  if (!messageColumns.includes('external_message_id')) {
    db.exec(`ALTER TABLE messages ADD COLUMN external_message_id TEXT`);
  }
  if (!messageColumns.includes('raw_payload')) {
    db.exec(`ALTER TABLE messages ADD COLUMN raw_payload TEXT`);
  }

  const contactColumns = db.prepare(`PRAGMA table_info(contacts)`).all().map((column) => column.name);
  const contactColumnDefinitions = {
    contact_id: `TEXT NOT NULL DEFAULT ''`,
    workspace_id: `TEXT NOT NULL DEFAULT 'default'`,
    site_id: `TEXT NOT NULL DEFAULT ''`,
    name: `TEXT NOT NULL DEFAULT ''`,
    email: `TEXT NOT NULL DEFAULT ''`,
    phone: `TEXT NOT NULL DEFAULT ''`,
    telegram: `TEXT NOT NULL DEFAULT ''`,
    telegram_id: `TEXT NOT NULL DEFAULT ''`,
    instagram_id: `TEXT NOT NULL DEFAULT ''`,
    facebook_id: `TEXT NOT NULL DEFAULT ''`,
    status: `TEXT NOT NULL DEFAULT 'new'`,
    source: `TEXT NOT NULL DEFAULT ''`,
    notes: `TEXT NOT NULL DEFAULT ''`,
    tags_json: `TEXT NOT NULL DEFAULT '[]'`,
    conversation_id: `TEXT NOT NULL DEFAULT ''`,
    last_conversation_at: `TEXT NOT NULL DEFAULT ''`,
    created_at: `TEXT NOT NULL DEFAULT (datetime('now'))`,
    updated_at: `TEXT NOT NULL DEFAULT (datetime('now'))`
  };

  Object.entries(contactColumnDefinitions).forEach(([name, definition]) => {
    if (!contactColumns.includes(name)) {
      db.exec(`ALTER TABLE contacts ADD COLUMN ${name} ${definition}`);
    }
  });

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_conversations_site_visitor ON conversations(site_id, visitor_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_channel_external_chat ON conversations(channel, external_chat_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_channel_external_user ON conversations(channel, external_user_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
    CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, created_at ASC, id ASC);
    CREATE INDEX IF NOT EXISTS idx_messages_channel_external_message ON messages(channel, external_message_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_site_id ON contacts(site_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_workspace_site ON contacts(workspace_id, site_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_contacts_updated_at ON contacts(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
    CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
    CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
    CREATE INDEX IF NOT EXISTS idx_contacts_conversation_id ON contacts(conversation_id);
  `);

  return db;
}

module.exports = { createDatabase };
