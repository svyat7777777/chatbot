const { createPrefixedId } = require('../utils/id');
const { PLANS, normalizePlanKey } = require('./plan-service');

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

function sanitizeText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function nowSql() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function parseSqlTimestamp(value) {
  const clean = sanitizeText(value, 40);
  if (!clean) return null;
  const parsed = new Date(clean.replace(' ', 'T') + 'Z');
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function maxSqlTimestamp(values) {
  return values
    .map((item) => sanitizeText(item, 40))
    .filter(Boolean)
    .sort()
    .pop() || '';
}

function addDaysSql(value, days) {
  const base = parseSqlTimestamp(value) || new Date();
  const next = new Date(base.getTime() + (Math.max(1, Number(days) || 1) * 24 * 60 * 60 * 1000));
  return next.toISOString().replace('T', ' ').slice(0, 19);
}

function buildUsagePercent(used, total) {
  const denominator = Number(total || 0);
  if (denominator <= 0) return 0;
  return Math.min(999, Math.round((Number(used || 0) / denominator) * 1000) / 10);
}

class SuperAdminService {
  constructor(options = {}) {
    this.db = options.db;
    this.workspaceService = options.workspaceService;
    this.planService = options.planService;
    this.statements = {
      listWorkspaces: this.db.prepare(`
        SELECT id, name, slug, plan, subscription_status, trial_ends_at, current_period_end,
               manual_plan_override, manual_subscription_status, manual_current_period_end,
               gifted_reason, gifted_by, last_activity_at, workspace_ai_disabled,
               stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_portal_last_url,
               trial_started_at, billing_provider, created_at, updated_at
        FROM workspaces
        ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC, name COLLATE NOCASE ASC
      `),
      getWorkspaceById: this.db.prepare(`
        SELECT id, name, slug, plan, subscription_status, trial_ends_at, current_period_end,
               manual_plan_override, manual_subscription_status, manual_current_period_end,
               gifted_reason, gifted_by, last_activity_at, workspace_ai_disabled,
               stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_portal_last_url,
               trial_started_at, billing_provider, created_at, updated_at
        FROM workspaces
        WHERE id = ?
        LIMIT 1
      `),
      countUsers: this.db.prepare('SELECT COUNT(*) AS count FROM users'),
      countWorkspaces: this.db.prepare('SELECT COUNT(*) AS count FROM workspaces'),
      countSites: this.db.prepare('SELECT COUNT(*) AS count FROM sites'),
      countConversations: this.db.prepare('SELECT COUNT(*) AS count FROM conversations'),
      countMessages: this.db.prepare('SELECT COUNT(*) AS count FROM messages'),
      totalTokensUsed: this.db.prepare('SELECT COALESCE(SUM(total_tokens), 0) AS total FROM workspace_ai_usage'),
      owners: this.db.prepare(`
        SELECT wm.workspace_id, wm.role, wm.created_at, u.id AS user_id, u.email, u.name
        FROM workspace_members wm
        LEFT JOIN users u ON u.id = wm.user_id
        ORDER BY CASE wm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, datetime(wm.created_at) ASC
      `),
      membersByWorkspace: this.db.prepare(`
        SELECT wm.id, wm.workspace_id, wm.user_id, wm.role, wm.created_at, u.email, u.name
        FROM workspace_members wm
        LEFT JOIN users u ON u.id = wm.user_id
        WHERE wm.workspace_id = ?
        ORDER BY CASE wm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, datetime(wm.created_at) ASC
      `),
      siteStats: this.db.prepare(`
        SELECT workspace_id, COUNT(*) AS site_count, MAX(last_seen_at) AS latest_site_seen_at
        FROM sites
        GROUP BY workspace_id
      `),
      conversationStats: this.db.prepare(`
        SELECT workspace_id, COUNT(*) AS conversation_count, MAX(last_message_at) AS latest_conversation_at
        FROM conversations
        GROUP BY workspace_id
      `),
      messageStats: this.db.prepare(`
        SELECT workspace_id, COUNT(*) AS message_count, MAX(created_at) AS latest_message_at
        FROM messages
        GROUP BY workspace_id
      `),
      memberStats: this.db.prepare(`
        SELECT workspace_id, COUNT(*) AS member_count
        FROM workspace_members
        GROUP BY workspace_id
      `),
      getBalance: this.db.prepare('SELECT * FROM workspace_ai_balances WHERE workspace_id = ? LIMIT 1'),
      upsertBalance: this.db.prepare(`
        INSERT INTO workspace_ai_balances (
          workspace_id, included_tokens_monthly, purchased_tokens, used_tokens_current_period,
          period_start, period_end, updated_at
        ) VALUES (
          @workspace_id, @included_tokens_monthly, @purchased_tokens, @used_tokens_current_period,
          @period_start, @period_end, @updated_at
        )
        ON CONFLICT(workspace_id) DO UPDATE SET
          included_tokens_monthly = excluded.included_tokens_monthly,
          period_end = excluded.period_end,
          updated_at = excluded.updated_at
      `),
      addPurchasedTokens: this.db.prepare(`
        UPDATE workspace_ai_balances
        SET purchased_tokens = COALESCE(purchased_tokens, 0) + ?,
            updated_at = datetime('now')
        WHERE workspace_id = ?
      `),
      insertAiUsage: this.db.prepare(`
        INSERT INTO workspace_ai_usage (
          id, workspace_id, site_id, conversation_id, message_id, provider, model,
          prompt_tokens, completion_tokens, total_tokens, estimated_cost_cents, created_at
        ) VALUES (
          @id, @workspace_id, @site_id, @conversation_id, @message_id, @provider, @model,
          @prompt_tokens, @completion_tokens, @total_tokens, @estimated_cost_cents, @created_at
        )
      `),
      incrementUsedTokens: this.db.prepare(`
        UPDATE workspace_ai_balances
        SET used_tokens_current_period = COALESCE(used_tokens_current_period, 0) + ?,
            updated_at = datetime('now')
        WHERE workspace_id = ?
      `),
      usageHistory: this.db.prepare(`
        SELECT substr(created_at, 1, 10) AS day,
               provider,
               model,
               COUNT(*) AS calls,
               COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens,
               COALESCE(SUM(completion_tokens), 0) AS completion_tokens,
               COALESCE(SUM(total_tokens), 0) AS total_tokens
        FROM workspace_ai_usage
        WHERE workspace_id = ?
        GROUP BY substr(created_at, 1, 10), provider, model
        ORDER BY day DESC
        LIMIT 60
      `),
      recentUsage: this.db.prepare(`
        SELECT id, site_id, conversation_id, message_id, provider, model,
               prompt_tokens, completion_tokens, total_tokens, estimated_cost_cents, created_at
        FROM workspace_ai_usage
        WHERE workspace_id = ?
        ORDER BY datetime(created_at) DESC
        LIMIT ?
      `),
      recentConversationsCount: this.db.prepare(`
        SELECT COUNT(*) AS count
        FROM conversations
        WHERE workspace_id = ? AND datetime(created_at) >= datetime('now', '-7 days')
      `),
      updateWorkspacePlan: this.db.prepare(`
        UPDATE workspaces
        SET plan = ?, updated_at = datetime('now')
        WHERE id = ?
      `),
      updateWorkspacePeriod: this.db.prepare(`
        UPDATE workspaces
        SET current_period_end = ?, updated_at = datetime('now')
        WHERE id = ?
      `),
      updateWorkspaceTrial: this.db.prepare(`
        UPDATE workspaces
        SET trial_ends_at = ?, updated_at = datetime('now')
        WHERE id = ?
      `),
      updateWorkspaceAiDisabled: this.db.prepare(`
        UPDATE workspaces
        SET workspace_ai_disabled = ?, updated_at = datetime('now')
        WHERE id = ?
      `),
      insertAuditLog: this.db.prepare(`
        INSERT INTO super_admin_audit_log (id, admin_user_id, action, workspace_id, target_user_id, payload_json, created_at)
        VALUES (@id, @admin_user_id, @action, @workspace_id, @target_user_id, @payload_json, @created_at)
      `),
      auditLog: this.db.prepare(`
        SELECT l.id, l.admin_user_id, l.action, l.workspace_id, l.target_user_id, l.payload_json, l.created_at,
               u.email AS admin_email, u.name AS admin_name, w.name AS workspace_name
        FROM super_admin_audit_log l
        LEFT JOIN users u ON u.id = l.admin_user_id
        LEFT JOIN workspaces w ON w.id = l.workspace_id
        ORDER BY datetime(l.created_at) DESC
        LIMIT ?
      `)
    };
  }

  getOwnerMap() {
    const owners = new Map();
    this.statements.owners.all().forEach((row) => {
      const workspaceId = sanitizeText(row.workspace_id, 120);
      if (!workspaceId || owners.has(workspaceId)) return;
      owners.set(workspaceId, {
        userId: sanitizeText(row.user_id, 120),
        email: sanitizeText(row.email, 160),
        name: sanitizeText(row.name, 160),
        role: sanitizeText(row.role, 40) || 'operator'
      });
    });
    return owners;
  }

  getStatsMaps() {
    const makeMap = (statement, mapper) => {
      const map = new Map();
      statement.all().forEach((row) => map.set(String(row.workspace_id), mapper(row)));
      return map;
    };
    return {
      owners: this.getOwnerMap(),
      siteStats: makeMap(this.statements.siteStats, (row) => ({
        siteCount: Number(row.site_count || 0),
        latestSiteSeenAt: sanitizeText(row.latest_site_seen_at, 40)
      })),
      conversationStats: makeMap(this.statements.conversationStats, (row) => ({
        conversationCount: Number(row.conversation_count || 0),
        latestConversationAt: sanitizeText(row.latest_conversation_at, 40)
      })),
      messageStats: makeMap(this.statements.messageStats, (row) => ({
        messageCount: Number(row.message_count || 0),
        latestMessageAt: sanitizeText(row.latest_message_at, 40)
      })),
      memberStats: makeMap(this.statements.memberStats, (row) => ({
        memberCount: Number(row.member_count || 0)
      }))
    };
  }

  ensureBalance(workspaceId) {
    const workspace = this.workspaceService.getWorkspaceById(workspaceId);
    if (!workspace) return null;
    const effective = this.workspaceService.getEffectiveWorkspaceState(workspace);
    const plan = PLANS[normalizePlanKey(effective.plan)] || PLANS.basic;
    const existing = this.statements.getBalance.get(workspace.id);
    const next = {
      workspace_id: workspace.id,
      included_tokens_monthly: Number(plan.includedTokens || 0),
      purchased_tokens: Number(existing?.purchased_tokens || 0),
      used_tokens_current_period: Number(existing?.used_tokens_current_period || 0),
      period_start: sanitizeText(existing?.period_start, 40) || sanitizeText(workspace.trialStartedAt, 40) || sanitizeText(workspace.createdAt, 40) || nowSql(),
      period_end: sanitizeText(effective.currentPeriodEnd || effective.trialEndsAt || existing?.period_end, 40),
      updated_at: nowSql()
    };
    this.statements.upsertBalance.run(next);
    return this.statements.getBalance.get(workspace.id);
  }

  getBalanceSummary(workspaceId) {
    const row = this.ensureBalance(workspaceId);
    if (!row) {
      return {
        includedTokensMonthly: 0,
        purchasedTokens: 0,
        usedTokensCurrentPeriod: 0,
        remainingTokens: 0,
        usagePercent: 0,
        periodStart: '',
        periodEnd: '',
        limitReached: false
      };
    }
    const included = Number(row.included_tokens_monthly || 0);
    const purchased = Number(row.purchased_tokens || 0);
    const used = Number(row.used_tokens_current_period || 0);
    const total = included + purchased;
    const remaining = total - used;
    return {
      includedTokensMonthly: included,
      purchasedTokens: purchased,
      usedTokensCurrentPeriod: used,
      remainingTokens: remaining,
      usagePercent: buildUsagePercent(used, total),
      periodStart: sanitizeText(row.period_start, 40),
      periodEnd: sanitizeText(row.period_end, 40),
      limitReached: total > 0 && remaining <= 0
    };
  }

  buildWorkspaceSummary(workspace, maps) {
    const current = this.workspaceService.normalizeWorkspace(workspace);
    const effective = this.workspaceService.getEffectiveWorkspaceState(current);
    const plan = PLANS[normalizePlanKey(effective.plan)] || PLANS.basic;
    const owner = maps.owners.get(current.id) || null;
    const siteStats = maps.siteStats.get(current.id) || { siteCount: 0, latestSiteSeenAt: '' };
    const conversationStats = maps.conversationStats.get(current.id) || { conversationCount: 0, latestConversationAt: '' };
    const messageStats = maps.messageStats.get(current.id) || { messageCount: 0, latestMessageAt: '' };
    const memberStats = maps.memberStats.get(current.id) || { memberCount: 0 };
    const balance = this.getBalanceSummary(current.id);
    const lastActivityAt = maxSqlTimestamp([
      current.lastActivityAt,
      conversationStats.latestConversationAt,
      messageStats.latestMessageAt,
      siteStats.latestSiteSeenAt,
      current.updatedAt,
      current.createdAt
    ]);
    const lastSeenDate = parseSqlTimestamp(siteStats.latestSiteSeenAt);
    const isOnline = Boolean(lastSeenDate && (Date.now() - lastSeenDate.getTime()) <= ONLINE_WINDOW_MS);
    const aiDisabled = Number(workspace.workspace_ai_disabled || 0) === 1;

    return {
      workspaceId: current.id,
      workspaceName: current.name,
      workspaceSlug: current.slug,
      ownerEmail: owner?.email || '',
      ownerName: owner?.name || '',
      owner,
      plan: normalizePlanKey(effective.plan),
      planLabel: plan.label || effective.plan,
      subscriptionStatus: effective.subscriptionStatus || 'active',
      trialEndsAt: effective.trialEndsAt || current.trialEndsAt || '',
      currentPeriodEnd: effective.currentPeriodEnd || '',
      usersCount: memberStats.memberCount,
      sitesCount: siteStats.siteCount,
      conversationsCount: conversationStats.conversationCount,
      messagesCount: messageStats.messageCount,
      aiEnabled: Boolean(plan.ai && !aiDisabled),
      aiDisabled,
      includedTokensMonthly: balance.includedTokensMonthly,
      purchasedTokens: balance.purchasedTokens,
      usedTokensCurrentPeriod: balance.usedTokensCurrentPeriod,
      remainingTokens: balance.remainingTokens,
      usagePercent: balance.usagePercent,
      lastSeenAt: lastActivityAt,
      latestSiteSeenAt: siteStats.latestSiteSeenAt,
      isOnline,
      createdAt: current.createdAt,
      workspace: Object.assign({}, current, { workspaceAiDisabled: aiDisabled })
    };
  }

  listWorkspaceSummaries(filters = {}) {
    const maps = this.getStatsMaps();
    const q = sanitizeText(filters.q, 160).toLowerCase();
    const planFilter = sanitizeText(filters.plan, 40).toLowerCase();
    const status = sanitizeText(filters.status, 80).toLowerCase();
    const aiLimit = sanitizeText(filters.aiLimit, 20).toLowerCase();

    return this.statements.listWorkspaces.all()
      .map((row) => this.buildWorkspaceSummary(row, maps))
      .filter((item) => {
        if (q) {
          const haystack = [item.workspaceName, item.workspaceSlug, item.ownerEmail, item.ownerName].join(' ').toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        if (planFilter && item.plan !== planFilter) return false;
        if (status && item.subscriptionStatus.toLowerCase() !== status) return false;
        if (aiLimit === 'reached' && item.remainingTokens > 0) return false;
        if (aiLimit === 'ok' && item.remainingTokens <= 0) return false;
        return true;
      });
  }

  getOverview() {
    const workspaces = this.listWorkspaceSummaries();
    return {
      totalUsers: Number(this.statements.countUsers.get()?.count || 0),
      totalWorkspaces: Number(this.statements.countWorkspaces.get()?.count || 0),
      totalSites: Number(this.statements.countSites.get()?.count || 0),
      totalConversations: Number(this.statements.countConversations.get()?.count || 0),
      totalMessages: Number(this.statements.countMessages.get()?.count || 0),
      totalTokensUsed: Number(this.statements.totalTokensUsed.get()?.total || 0),
      activeSubscriptions: workspaces.filter((item) => item.plan !== 'basic' && ['active', 'trialing'].includes(item.subscriptionStatus)).length,
      trialWorkspaces: workspaces.filter((item) => item.subscriptionStatus === 'trialing' || item.trialEndsAt).length,
      basicWorkspaces: workspaces.filter((item) => item.plan === 'basic').length,
      proWorkspaces: workspaces.filter((item) => item.plan === 'pro').length,
      businessWorkspaces: workspaces.filter((item) => item.plan === 'business').length
    };
  }

  getWorkspaceDetail(workspaceId) {
    const cleanWorkspaceId = sanitizeText(workspaceId, 120);
    if (!cleanWorkspaceId) return null;
    const workspaceRow = this.statements.getWorkspaceById.get(cleanWorkspaceId);
    if (!workspaceRow) return null;
    const maps = this.getStatsMaps();
    const summary = this.buildWorkspaceSummary(workspaceRow, maps);
    const workspace = summary.workspace;
    const sites = this.workspaceService.listSitesByWorkspace(cleanWorkspaceId).map((site) => {
      const seenAt = parseSqlTimestamp(site.lastSeenAt);
      return Object.assign({}, site, {
        isOnline: Boolean(seenAt && (Date.now() - seenAt.getTime()) <= ONLINE_WINDOW_MS)
      });
    });
    const members = this.statements.membersByWorkspace.all(cleanWorkspaceId).map((row) => ({
      membershipId: sanitizeText(row.id, 120),
      userId: sanitizeText(row.user_id, 120),
      email: sanitizeText(row.email, 160),
      name: sanitizeText(row.name, 160),
      role: sanitizeText(row.role, 40),
      createdAt: sanitizeText(row.created_at, 40)
    }));
    return Object.assign({}, summary, {
      workspaceInfo: workspace,
      ownerInfo: summary.owner,
      members,
      sites,
      subscription: {
        plan: summary.plan,
        status: summary.subscriptionStatus,
        trialEndsAt: summary.trialEndsAt,
        currentPeriodEnd: summary.currentPeriodEnd,
        billingProvider: workspace.billingProvider,
        stripeCustomerId: workspace.stripeCustomerId,
        stripeSubscriptionId: workspace.stripeSubscriptionId
      },
      aiUsageSummary: this.getBalanceSummary(cleanWorkspaceId),
      recentConversationsCount: Number(this.statements.recentConversationsCount.get(cleanWorkspaceId)?.count || 0),
      tokenUsageHistory: this.statements.usageHistory.all(cleanWorkspaceId),
      recentTokenUsage: this.statements.recentUsage.all(cleanWorkspaceId, 25)
    });
  }

  getCustomerAiUsage(workspaceId) {
    const workspace = this.workspaceService.getWorkspaceById(workspaceId);
    if (!workspace) return null;
    const effective = this.workspaceService.getEffectiveWorkspaceState(workspace);
    const plan = PLANS[normalizePlanKey(effective.plan)] || PLANS.basic;
    const balance = this.getBalanceSummary(workspace.id);
    const aiCheck = this.planService.canUseAI(workspace.id);
    return {
      plan: plan.key,
      aiEnabled: aiCheck.allowed,
      includedTokensMonthly: balance.includedTokensMonthly,
      purchasedTokens: balance.purchasedTokens,
      usedTokensCurrentPeriod: balance.usedTokensCurrentPeriod,
      remainingTokens: balance.remainingTokens,
      periodStart: balance.periodStart,
      periodEnd: balance.periodEnd,
      usagePercent: balance.usagePercent,
      limitReached: balance.limitReached
    };
  }

  recordAiUsage(input = {}) {
    const workspaceId = sanitizeText(input.workspaceId, 120);
    if (!workspaceId || !this.workspaceService.getWorkspaceById(workspaceId)) return null;
    const totalTokens = Math.max(0, Number(input.totalTokens || 0));
    if (totalTokens <= 0) return this.getBalanceSummary(workspaceId);
    this.ensureBalance(workspaceId);
    this.statements.insertAiUsage.run({
      id: createPrefixedId('aiusage'),
      workspace_id: workspaceId,
      site_id: sanitizeText(input.siteId, 120) || null,
      conversation_id: sanitizeText(input.conversationId, 120) || null,
      message_id: sanitizeText(input.messageId, 120) || null,
      provider: sanitizeText(input.provider, 40) || null,
      model: sanitizeText(input.model, 120) || null,
      prompt_tokens: Math.max(0, Number(input.promptTokens || 0)),
      completion_tokens: Math.max(0, Number(input.completionTokens || 0)),
      total_tokens: totalTokens,
      estimated_cost_cents: Math.max(0, Number(input.estimatedCostCents || 0)),
      created_at: nowSql()
    });
    this.statements.incrementUsedTokens.run(totalTokens, workspaceId);
    return this.getBalanceSummary(workspaceId);
  }

  audit(actor, action, payload = {}) {
    this.statements.insertAuditLog.run({
      id: createPrefixedId('saudit'),
      admin_user_id: sanitizeText(actor?.id, 120) || 'unknown',
      action: sanitizeText(action, 80),
      workspace_id: sanitizeText(payload.workspaceId, 120) || null,
      target_user_id: sanitizeText(payload.targetUserId, 120) || null,
      payload_json: JSON.stringify(payload),
      created_at: nowSql()
    });
  }

  addTokens(workspaceId, input = {}, actor = {}) {
    const amount = Math.max(0, Math.floor(Number(input.amount || 0)));
    if (!amount) throw new Error('INVALID_TOKEN_AMOUNT');
    this.ensureBalance(workspaceId);
    this.statements.addPurchasedTokens.run(amount, workspaceId);
    this.audit(actor, 'add_tokens', {
      workspaceId,
      amount,
      reason: sanitizeText(input.reason, 500)
    });
    return this.getWorkspaceDetail(workspaceId);
  }

  changePlan(workspaceId, input = {}, actor = {}) {
    const plan = normalizePlanKey(input.plan);
    const workspace = this.workspaceService.getWorkspaceById(workspaceId);
    if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');
    this.statements.updateWorkspacePlan.run(plan, workspaceId);
    this.ensureBalance(workspaceId);
    this.audit(actor, 'change_plan', { workspaceId, plan });
    return this.getWorkspaceDetail(workspaceId);
  }

  extendSubscription(workspaceId, input = {}, actor = {}) {
    const days = Math.max(1, Math.floor(Number(input.days || 0)));
    const workspace = this.workspaceService.getWorkspaceById(workspaceId);
    if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');
    const targetField = workspace.trialEndsAt && workspace.subscriptionStatus === 'trialing' ? 'trial_ends_at' : 'current_period_end';
    const baseDate = targetField === 'trial_ends_at' ? workspace.trialEndsAt : workspace.currentPeriodEnd;
    const nextDate = addDaysSql(baseDate, days);
    if (targetField === 'trial_ends_at') {
      this.statements.updateWorkspaceTrial.run(nextDate, workspaceId);
    } else {
      this.statements.updateWorkspacePeriod.run(nextDate, workspaceId);
    }
    this.ensureBalance(workspaceId);
    this.audit(actor, 'extend_subscription', { workspaceId, days, targetField, nextDate });
    return this.getWorkspaceDetail(workspaceId);
  }

  setAiDisabled(workspaceId, input = {}, actor = {}) {
    const disabled = input.disabled === true || input.disabled === 'true' || input.disabled === 1 || input.disabled === '1';
    const workspace = this.workspaceService.getWorkspaceById(workspaceId);
    if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');
    this.statements.updateWorkspaceAiDisabled.run(disabled ? 1 : 0, workspaceId);
    this.audit(actor, disabled ? 'disable_ai' : 'enable_ai', {
      workspaceId,
      disabled,
      reason: sanitizeText(input.reason, 500)
    });
    return this.getWorkspaceDetail(workspaceId);
  }

  listAuditLog(limit = 100) {
    return this.statements.auditLog.all(Math.min(250, Math.max(1, Number(limit) || 100))).map((row) => ({
      id: sanitizeText(row.id, 120),
      adminUserId: sanitizeText(row.admin_user_id, 120),
      adminEmail: sanitizeText(row.admin_email, 160),
      adminName: sanitizeText(row.admin_name, 160),
      action: sanitizeText(row.action, 80),
      workspaceId: sanitizeText(row.workspace_id, 120),
      workspaceName: sanitizeText(row.workspace_name, 160),
      targetUserId: sanitizeText(row.target_user_id, 120),
      payload: (() => {
        try { return JSON.parse(row.payload_json || '{}'); } catch (error) { return {}; }
      })(),
      createdAt: sanitizeText(row.created_at, 40)
    }));
  }
}

module.exports = {
  SuperAdminService,
  ONLINE_WINDOW_MS
};
