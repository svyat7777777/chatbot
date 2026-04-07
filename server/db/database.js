const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const DEFAULT_WORKSPACE_ID = 'workspace_default';
const DEFAULT_WORKSPACE_SLUG = 'default';
const DEFAULT_SITE_ID = 'site_default';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function nowSql() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function randomWidgetKey() {
  return `wk_${crypto.randomBytes(24).toString('hex')}`;
}

function listColumns(db, tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
}

function listIndexes(db, tableName) {
  return db.prepare(`PRAGMA index_list(${tableName})`).all();
}

function hasTable(db, tableName) {
  const row = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`).get(tableName);
  return Boolean(row);
}

function addColumnIfMissing(db, tableName, columnName, definitionSql) {
  const columns = listColumns(db, tableName);
  if (!columns.includes(columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql}`);
  }
}

function createTenantTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      plan TEXT NOT NULL DEFAULT 'basic',
      subscription_status TEXT NOT NULL DEFAULT 'active',
      trial_ends_at TEXT,
      current_period_end TEXT,
      manual_plan_override TEXT,
      manual_subscription_status TEXT,
      manual_current_period_end TEXT,
      gifted_reason TEXT,
      gifted_by TEXT,
      last_activity_at TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      stripe_price_id TEXT,
      stripe_portal_last_url TEXT,
      trial_started_at TEXT,
      billing_provider TEXT NOT NULL DEFAULT 'stripe',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(workspace_id, user_id),
      FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      domain TEXT,
      widget_key TEXT NOT NULL UNIQUE,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS site_domains (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(site_id, domain),
      FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_manual (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      is_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
      FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS knowledge_import_sources (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'website',
      starting_url TEXT NOT NULL DEFAULT '',
      frequency TEXT NOT NULL DEFAULT 'manual',
      max_pages INTEGER NOT NULL DEFAULT 10,
      crawl_depth INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending',
      last_run_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
      FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS knowledge_import_items (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      content_hash TEXT NOT NULL DEFAULT '',
      imported_at TEXT NOT NULL,
      FOREIGN KEY (source_id) REFERENCES knowledge_import_sources (id) ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
      FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
    );
  `);
}

function createCoreTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL UNIQUE,
      workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
      site_id TEXT NOT NULL DEFAULT '${DEFAULT_SITE_ID}',
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
      workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
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
      workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
      event_type TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversation_feedback (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL UNIQUE,
      workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
      rating TEXT NOT NULL,
      ease TEXT,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      requested_by TEXT,
      FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id TEXT NOT NULL UNIQUE,
      workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
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
  `);
}

function migrateIntegrationSettingsTable(db) {
  const columns = hasTable(db, 'integration_settings') ? listColumns(db, 'integration_settings') : [];
  const hasScopedShape =
    columns.includes('setting_id') &&
    columns.includes('workspace_id') &&
    columns.includes('setting_key');

  if (hasScopedShape) {
    return;
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS integration_settings_v2 (
      setting_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      setting_key TEXT NOT NULL,
      setting_value TEXT,
      is_secret INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(workspace_id, setting_key),
      FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
    )
  `);

  if (hasTable(db, 'integration_settings')) {
    const legacyRows = db.prepare(`
      SELECT setting_key, setting_value, is_secret, updated_at
      FROM integration_settings
    `).all();

    const insert = db.prepare(`
      INSERT INTO integration_settings_v2 (
        setting_id, workspace_id, setting_key, setting_value, is_secret, updated_at
      ) VALUES (
        @setting_id, @workspace_id, @setting_key, @setting_value, @is_secret, @updated_at
      )
      ON CONFLICT(workspace_id, setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        is_secret = excluded.is_secret,
        updated_at = excluded.updated_at
    `);

    legacyRows.forEach((row) => {
      insert.run({
        setting_id: randomId('iset'),
        workspace_id: DEFAULT_WORKSPACE_ID,
        setting_key: String(row.setting_key || '').trim(),
        setting_value: row.setting_value == null ? null : String(row.setting_value),
        is_secret: Number(row.is_secret) ? 1 : 0,
        updated_at: String(row.updated_at || nowSql())
      });
    });

    db.exec('DROP TABLE integration_settings');
  }

  db.exec('ALTER TABLE integration_settings_v2 RENAME TO integration_settings');
}

function migrateExistingTables(db) {
  addColumnIfMissing(db, 'workspaces', 'subscription_status', `TEXT NOT NULL DEFAULT 'active'`);
  addColumnIfMissing(db, 'workspaces', 'trial_ends_at', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'current_period_end', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'manual_plan_override', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'manual_subscription_status', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'manual_current_period_end', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'gifted_reason', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'gifted_by', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'last_activity_at', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'stripe_customer_id', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'stripe_subscription_id', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'stripe_price_id', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'stripe_portal_last_url', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'trial_started_at', 'TEXT');
  addColumnIfMissing(db, 'workspaces', 'billing_provider', `TEXT NOT NULL DEFAULT 'stripe'`);

  addColumnIfMissing(db, 'sites', 'last_seen_at', 'TEXT');
  addColumnIfMissing(db, 'sites', 'last_seen_url', 'TEXT');
  addColumnIfMissing(db, 'sites', 'last_seen_host', 'TEXT');
  addColumnIfMissing(db, 'sites', 'last_seen_user_agent', 'TEXT');
  addColumnIfMissing(db, 'sites', 'last_seen_referrer', 'TEXT');
  addColumnIfMissing(db, 'sites', 'heartbeat_count', 'INTEGER NOT NULL DEFAULT 0');

  addColumnIfMissing(db, 'conversations', 'workspace_id', `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);
  addColumnIfMissing(db, 'conversations', 'site_id', `TEXT NOT NULL DEFAULT '${DEFAULT_SITE_ID}'`);
  addColumnIfMissing(db, 'conversations', 'channel', `TEXT NOT NULL DEFAULT 'web'`);
  addColumnIfMissing(db, 'conversations', 'external_chat_id', 'TEXT');
  addColumnIfMissing(db, 'conversations', 'external_user_id', 'TEXT');
  addColumnIfMissing(db, 'conversations', 'unread_count', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'conversations', 'assigned_operator', 'TEXT');
  addColumnIfMissing(db, 'conversations', 'last_operator', 'TEXT');
  addColumnIfMissing(db, 'conversations', 'handoff_at', 'TEXT');
  addColumnIfMissing(db, 'conversations', 'human_replied_at', 'TEXT');
  addColumnIfMissing(db, 'conversations', 'closed_at', 'TEXT');
  addColumnIfMissing(db, 'conversations', 'feedback_requested_at', 'TEXT');
  addColumnIfMissing(db, 'conversations', 'feedback_completed_at', 'TEXT');

  addColumnIfMissing(db, 'messages', 'workspace_id', `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);
  addColumnIfMissing(db, 'messages', 'channel', `TEXT NOT NULL DEFAULT 'web'`);
  addColumnIfMissing(db, 'messages', 'external_message_id', 'TEXT');
  addColumnIfMissing(db, 'messages', 'raw_payload', 'TEXT');

  addColumnIfMissing(db, 'conversation_events', 'workspace_id', `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);
  addColumnIfMissing(db, 'conversation_feedback', 'workspace_id', `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);

  const contactColumnDefinitions = {
    contact_id: `TEXT NOT NULL DEFAULT ''`,
    workspace_id: `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`,
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
    addColumnIfMissing(db, 'contacts', name, definition);
  });
}

function seedDefaultWorkspace(db) {
  const now = nowSql();
  db.prepare(`
    INSERT INTO workspaces (
      id, name, slug, plan, subscription_status, trial_ends_at, current_period_end,
      stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_portal_last_url,
      trial_started_at, billing_provider, created_at, updated_at
    )
    VALUES (?, ?, ?, 'basic', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'stripe', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      plan = CASE
        WHEN workspaces.plan IS NULL OR trim(workspaces.plan) = '' OR workspaces.plan = 'free' THEN 'basic'
        ELSE workspaces.plan
      END,
      subscription_status = COALESCE(NULLIF(trim(workspaces.subscription_status), ''), 'active'),
      billing_provider = COALESCE(NULLIF(trim(workspaces.billing_provider), ''), 'stripe'),
      updated_at = excluded.updated_at
  `).run(
    DEFAULT_WORKSPACE_ID,
    'Default Workspace',
    DEFAULT_WORKSPACE_SLUG,
    now,
    now
  );
}

function seedDefaultSite(db) {
  const now = nowSql();
  const existing = db.prepare('SELECT id, widget_key FROM sites WHERE id = ? LIMIT 1').get(DEFAULT_SITE_ID);
  const widgetKey = existing?.widget_key || randomWidgetKey();
  db.prepare(`
    INSERT INTO sites (id, workspace_id, name, domain, widget_key, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      workspace_id = excluded.workspace_id,
      name = excluded.name,
      domain = excluded.domain,
      is_active = excluded.is_active,
      updated_at = excluded.updated_at
  `).run(
    DEFAULT_SITE_ID,
    DEFAULT_WORKSPACE_ID,
    'Default Site',
    null,
    widgetKey,
    now,
    now
  );
}

function backfillTenantOwnership(db) {
  db.exec(`
    UPDATE workspaces
    SET plan = 'basic'
    WHERE plan IS NULL
       OR trim(plan) = ''
       OR lower(trim(plan)) = 'free';

    UPDATE workspaces
    SET subscription_status = 'active'
    WHERE subscription_status IS NULL
       OR trim(subscription_status) = '';

    UPDATE workspaces
    SET billing_provider = 'stripe'
    WHERE billing_provider IS NULL
       OR trim(billing_provider) = '';

    UPDATE conversations
    SET workspace_id = '${DEFAULT_WORKSPACE_ID}'
    WHERE workspace_id IS NULL
       OR trim(workspace_id) = ''
       OR workspace_id = 'default';

    UPDATE conversations
    SET site_id = '${DEFAULT_SITE_ID}'
    WHERE site_id IS NULL
       OR trim(site_id) = ''
       OR site_id = 'default';

    UPDATE messages
    SET workspace_id = COALESCE(
      (
        SELECT c.workspace_id
        FROM conversations c
        WHERE c.conversation_id = messages.conversation_id
      ),
      '${DEFAULT_WORKSPACE_ID}'
    )
    WHERE workspace_id IS NULL
       OR trim(workspace_id) = ''
       OR workspace_id = 'default';

    UPDATE contacts
    SET workspace_id = '${DEFAULT_WORKSPACE_ID}'
    WHERE workspace_id IS NULL
       OR trim(workspace_id) = ''
       OR workspace_id = 'default';

    UPDATE conversation_events
    SET workspace_id = COALESCE(
      (
        SELECT c.workspace_id
        FROM conversations c
        WHERE c.conversation_id = conversation_events.conversation_id
      ),
      '${DEFAULT_WORKSPACE_ID}'
    )
    WHERE workspace_id IS NULL
       OR trim(workspace_id) = ''
       OR workspace_id = 'default';

    UPDATE conversation_feedback
    SET workspace_id = COALESCE(
      (
        SELECT c.workspace_id
        FROM conversations c
        WHERE c.conversation_id = conversation_feedback.conversation_id
      ),
      '${DEFAULT_WORKSPACE_ID}'
    )
    WHERE workspace_id IS NULL
       OR trim(workspace_id) = ''
       OR workspace_id = 'default';
  `);
}

function createIndexes(db) {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sites_workspace_id ON sites(workspace_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_sites_last_seen_at ON sites(last_seen_at DESC);
    CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id, role);
    CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer_id ON workspaces(stripe_customer_id);
    CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_subscription_id ON workspaces(stripe_subscription_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_manual_workspace_site ON knowledge_manual(workspace_id, site_id, is_enabled);
    CREATE INDEX IF NOT EXISTS idx_knowledge_manual_category ON knowledge_manual(workspace_id, site_id, category);
    CREATE INDEX IF NOT EXISTS idx_knowledge_import_sources_workspace_site ON knowledge_import_sources(workspace_id, site_id, status);
    CREATE INDEX IF NOT EXISTS idx_knowledge_import_items_source_id ON knowledge_import_items(source_id, imported_at DESC);
    CREATE INDEX IF NOT EXISTS idx_knowledge_import_items_workspace_site ON knowledge_import_items(workspace_id, site_id, imported_at DESC);
    CREATE INDEX IF NOT EXISTS idx_integration_settings_workspace_key ON integration_settings(workspace_id, setting_key);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_site_domains_site_id ON site_domains(site_id, is_primary DESC, domain);
    CREATE INDEX IF NOT EXISTS idx_site_domains_workspace_id ON site_domains(workspace_id, domain);

    CREATE INDEX IF NOT EXISTS idx_conversations_workspace_site_visitor ON conversations(workspace_id, site_id, visitor_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_site_visitor ON conversations(site_id, visitor_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_workspace_status ON conversations(workspace_id, status);
    CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
    CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversations_channel_external_chat ON conversations(channel, external_chat_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_channel_external_user ON conversations(channel, external_user_id);

    CREATE INDEX IF NOT EXISTS idx_messages_workspace_conversation_id ON messages(workspace_id, conversation_id, created_at ASC, id ASC);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, created_at ASC, id ASC);
    CREATE INDEX IF NOT EXISTS idx_messages_channel_external_message ON messages(channel, external_message_id);

    CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_events_workspace_conversation ON conversation_events(workspace_id, conversation_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversation_events_conversation_id ON conversation_events(conversation_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversation_feedback_workspace_created_at ON conversation_feedback(workspace_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversation_feedback_created_at ON conversation_feedback(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_contacts_site_id ON contacts(site_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_workspace_site ON contacts(workspace_id, site_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_contacts_updated_at ON contacts(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
    CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
    CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
    CREATE INDEX IF NOT EXISTS idx_contacts_conversation_id ON contacts(conversation_id);
  `);
}

function normalizeExistingSiteOwnership(db) {
  const rows = db.prepare(`
    SELECT DISTINCT site_id
    FROM conversations
    WHERE site_id IS NOT NULL
      AND trim(site_id) <> ''
  `).all();

  const existingSiteIds = new Set(db.prepare('SELECT id FROM sites').all().map((row) => String(row.id)));
  const insert = db.prepare(`
    INSERT INTO sites (id, workspace_id, name, domain, widget_key, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `);
  const now = nowSql();

  rows.forEach((row) => {
    const siteId = String(row.site_id || '').trim();
    if (!siteId || existingSiteIds.has(siteId)) {
      return;
    }
    insert.run(siteId, DEFAULT_WORKSPACE_ID, siteId, null, randomWidgetKey(), now, now);
    existingSiteIds.add(siteId);
  });
}

function backfillSiteDomains(db) {
  const now = nowSql();
  const insert = db.prepare(`
    INSERT INTO site_domains (id, site_id, workspace_id, domain, is_primary, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(site_id, domain) DO UPDATE SET
      is_primary = CASE
        WHEN excluded.is_primary = 1 THEN 1
        ELSE site_domains.is_primary
      END,
      updated_at = excluded.updated_at
  `);

  const rows = db.prepare(`
    SELECT id, workspace_id, domain
    FROM sites
    WHERE domain IS NOT NULL
      AND trim(domain) <> ''
  `).all();

  rows.forEach((row) => {
    insert.run(
      randomId('sdomain'),
      String(row.id || '').trim(),
      String(row.workspace_id || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID,
      String(row.domain || '').trim().toLowerCase(),
      1,
      now,
      now
    );
  });
}

function createDatabase(dbFilePath) {
  const resolvedPath = path.resolve(dbFilePath);
  ensureDir(path.dirname(resolvedPath));

  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTenantTables(db);
  createCoreTables(db);
  migrateIntegrationSettingsTable(db);
  migrateExistingTables(db);
  seedDefaultWorkspace(db);
  seedDefaultSite(db);
  backfillTenantOwnership(db);
  normalizeExistingSiteOwnership(db);
  backfillSiteDomains(db);
  createIndexes(db);

  return db;
}

module.exports = {
  createDatabase,
  DEFAULT_WORKSPACE_ID,
  DEFAULT_WORKSPACE_SLUG,
  DEFAULT_SITE_ID,
  randomWidgetKey
};
