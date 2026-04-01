const bcrypt = require('bcryptjs');
const { createPrefixedId } = require('../utils/id');
const { DEFAULT_WORKSPACE_ID } = require('../db/database');

const VALID_ROLES = ['owner', 'admin', 'operator'];

function nowSql() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function sanitizeText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizeEmail(value) {
  return sanitizeText(value, 160).toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function normalizeWorkspaceSlug(value) {
  return sanitizeText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

class AuthService {
  constructor(options = {}) {
    this.db = options.db;
    this.workspaceService = options.workspaceService;
    this.bcryptRounds = Math.max(8, Number(options.bcryptRounds) || 10);
    this.statements = {
      countUsers: this.db.prepare('SELECT COUNT(*) AS count FROM users'),
      getUserById: this.db.prepare(`
        SELECT id, email, password_hash, name, created_at, updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `),
      getUserByEmail: this.db.prepare(`
        SELECT id, email, password_hash, name, created_at, updated_at
        FROM users
        WHERE email = ?
        LIMIT 1
      `),
      insertUser: this.db.prepare(`
        INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
        VALUES (@id, @email, @password_hash, @name, @created_at, @updated_at)
      `),
      insertWorkspace: this.db.prepare(`
        INSERT INTO workspaces (id, name, slug, plan, subscription_status, trial_ends_at, current_period_end, created_at, updated_at)
        VALUES (@id, @name, @slug, 'basic', 'active', NULL, NULL, @created_at, @updated_at)
      `),
      insertWorkspaceMember: this.db.prepare(`
        INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
        VALUES (@id, @workspace_id, @user_id, @role, @created_at)
      `),
      listMembershipsByUserId: this.db.prepare(`
        SELECT wm.id,
               wm.workspace_id,
               wm.user_id,
               wm.role,
               wm.created_at,
               w.name AS workspace_name,
               w.slug AS workspace_slug,
               w.plan AS workspace_plan,
               w.created_at AS workspace_created_at,
               w.updated_at AS workspace_updated_at
        FROM workspace_members wm
        JOIN workspaces w ON w.id = wm.workspace_id
        WHERE wm.user_id = ?
        ORDER BY CASE wm.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          ELSE 3
        END, datetime(wm.created_at) ASC
      `),
      getMembershipByUserAndWorkspace: this.db.prepare(`
        SELECT wm.id,
               wm.workspace_id,
               wm.user_id,
               wm.role,
               wm.created_at,
               w.name AS workspace_name,
               w.slug AS workspace_slug,
               w.plan AS workspace_plan,
               w.created_at AS workspace_created_at,
               w.updated_at AS workspace_updated_at
        FROM workspace_members wm
        JOIN workspaces w ON w.id = wm.workspace_id
        WHERE wm.user_id = ? AND wm.workspace_id = ?
        LIMIT 1
      `),
      countWorkspaceBySlug: this.db.prepare(`
        SELECT COUNT(*) AS count
        FROM workspaces
        WHERE slug = ?
      `)
    };
  }

  hasAnyUsers() {
    return Number(this.statements.countUsers.get()?.count || 0) > 0;
  }

  sanitizeUser(row) {
    if (!row) return null;
    return {
      id: String(row.id || '').trim(),
      email: String(row.email || '').trim().toLowerCase(),
      name: String(row.name || '').trim(),
      createdAt: String(row.created_at || '').trim(),
      updatedAt: String(row.updated_at || '').trim()
    };
  }

  serializeMembership(row) {
    if (!row) return null;
    return {
      id: String(row.id || '').trim(),
      workspaceId: String(row.workspace_id || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID,
      userId: String(row.user_id || '').trim(),
      role: VALID_ROLES.includes(String(row.role || '').trim()) ? String(row.role || '').trim() : 'operator',
      createdAt: String(row.created_at || '').trim(),
      workspace: {
        id: String(row.workspace_id || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID,
        name: String(row.workspace_name || '').trim(),
        slug: String(row.workspace_slug || '').trim(),
        plan: String(row.workspace_plan || 'basic').trim(),
        createdAt: String(row.workspace_created_at || '').trim(),
        updatedAt: String(row.workspace_updated_at || '').trim()
      }
    };
  }

  validateSignupInput(input = {}) {
    const name = sanitizeText(input.name, 120);
    const email = normalizeEmail(input.email);
    const password = String(input.password || '');
    const workspaceName = sanitizeText(input.workspaceName || input.workspace_name || '', 120);

    if (!name || name.length < 2) {
      throw new Error('INVALID_NAME');
    }
    if (!isValidEmail(email)) {
      throw new Error('INVALID_EMAIL');
    }
    if (password.length < 8) {
      throw new Error('INVALID_PASSWORD');
    }

    return { name, email, password, workspaceName };
  }

  validateLoginInput(input = {}) {
    const email = normalizeEmail(input.email);
    const password = String(input.password || '');
    if (!isValidEmail(email) || !password) {
      throw new Error('INVALID_CREDENTIALS');
    }
    return { email, password };
  }

  async hashPassword(password) {
    return bcrypt.hash(String(password || ''), this.bcryptRounds);
  }

  async verifyPassword(password, passwordHash) {
    if (!passwordHash) return false;
    return bcrypt.compare(String(password || ''), String(passwordHash || ''));
  }

  getUserById(userId) {
    return this.sanitizeUser(this.statements.getUserById.get(String(userId || '').trim()));
  }

  getUserWithPasswordByEmail(email) {
    const row = this.statements.getUserByEmail.get(normalizeEmail(email));
    if (!row) return null;
    return {
      user: this.sanitizeUser(row),
      passwordHash: String(row.password_hash || '')
    };
  }

  listUserWorkspaces(userId) {
    return this.statements.listMembershipsByUserId.all(String(userId || '').trim()).map((row) => this.serializeMembership(row));
  }

  getMembership(userId, workspaceId) {
    return this.serializeMembership(
      this.statements.getMembershipByUserAndWorkspace.get(
        String(userId || '').trim(),
        String(workspaceId || '').trim()
      )
    );
  }

  getCurrentWorkspaceForUser(userId, activeWorkspaceId = '') {
    const memberships = this.listUserWorkspaces(userId);
    if (!memberships.length) return null;
    const cleanWorkspaceId = sanitizeText(activeWorkspaceId, 120);
    if (cleanWorkspaceId) {
      const activeMembership = memberships.find((item) => item.workspaceId === cleanWorkspaceId);
      if (activeMembership) return activeMembership;
    }
    return memberships[0];
  }

  setActiveWorkspace(sessionObject, workspaceId) {
    if (!sessionObject) return null;
    const cleanWorkspaceId = sanitizeText(workspaceId, 120);
    sessionObject.activeWorkspaceId = cleanWorkspaceId || null;
    return sessionObject.activeWorkspaceId;
  }

  generateWorkspaceName({ name, email, workspaceName }) {
    if (workspaceName) return workspaceName;
    if (name) return `${name}'s Workspace`;
    return `${String(email || '').split('@')[0] || 'New'} Workspace`;
  }

  createUniqueWorkspaceSlug(baseValue) {
    const baseSlug = normalizeWorkspaceSlug(baseValue) || `workspace-${Date.now().toString(36)}`;
    let candidate = baseSlug;
    let counter = 2;
    while (Number(this.statements.countWorkspaceBySlug.get(candidate)?.count || 0) > 0) {
      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }
    return candidate;
  }

  async signup(input = {}) {
    const { name, email, password, workspaceName } = this.validateSignupInput(input);
    if (this.getUserWithPasswordByEmail(email)) {
      throw new Error('EMAIL_IN_USE');
    }

    const passwordHash = await this.hashPassword(password);
    const now = nowSql();
    const userId = createPrefixedId('user');
    const workspaceId = createPrefixedId('workspace');
    const finalWorkspaceName = this.generateWorkspaceName({ name, email, workspaceName });
    const workspaceSlug = this.createUniqueWorkspaceSlug(finalWorkspaceName);
    const memberId = createPrefixedId('member');

    const transaction = this.db.transaction(() => {
      this.statements.insertUser.run({
        id: userId,
        email,
        password_hash: passwordHash,
        name,
        created_at: now,
        updated_at: now
      });
      this.statements.insertWorkspace.run({
        id: workspaceId,
        name: finalWorkspaceName,
        slug: workspaceSlug,
        created_at: now,
        updated_at: now
      });
      this.statements.insertWorkspaceMember.run({
        id: memberId,
        workspace_id: workspaceId,
        user_id: userId,
        role: 'owner',
        created_at: now
      });
    });
    transaction();

    return {
      user: this.getUserById(userId),
      memberships: this.listUserWorkspaces(userId),
      activeMembership: this.getCurrentWorkspaceForUser(userId, workspaceId)
    };
  }

  async login(input = {}) {
    const { email, password } = this.validateLoginInput(input);
    const record = this.getUserWithPasswordByEmail(email);
    if (!record) {
      throw new Error('INVALID_CREDENTIALS');
    }
    const matches = await this.verifyPassword(password, record.passwordHash);
    if (!matches) {
      throw new Error('INVALID_CREDENTIALS');
    }
    return {
      user: record.user,
      memberships: this.listUserWorkspaces(record.user.id),
      activeMembership: this.getCurrentWorkspaceForUser(record.user.id)
    };
  }
}

module.exports = {
  AuthService,
  VALID_ROLES
};
