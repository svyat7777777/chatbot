const { PLANS, normalizePlanKey } = require('./plan-service');

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

function sanitizeText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function parseSqlTimestamp(value) {
  const clean = sanitizeText(value, 40);
  if (!clean) return null;
  const parsed = new Date(clean.replace(' ', 'T') + 'Z');
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toSqlDateEndOfDay(value) {
  const clean = sanitizeText(value, 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return '';
  return `${clean} 23:59:59`;
}

function maxSqlTimestamp(values) {
  return values
    .map((item) => sanitizeText(item, 40))
    .filter(Boolean)
    .sort()
    .pop() || '';
}

function buildDaysLeft(value) {
  const date = parseSqlTimestamp(value);
  if (!date) return null;
  const diffMs = date.getTime() - Date.now();
  return diffMs <= 0 ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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
               gifted_reason, gifted_by, last_activity_at,
               stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_portal_last_url,
               trial_started_at, billing_provider, created_at, updated_at
        FROM workspaces
        ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC, name COLLATE NOCASE ASC
      `),
      getWorkspaceById: this.db.prepare(`
        SELECT id, name, slug, plan, subscription_status, trial_ends_at, current_period_end,
               manual_plan_override, manual_subscription_status, manual_current_period_end,
               gifted_reason, gifted_by, last_activity_at,
               stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_portal_last_url,
               trial_started_at, billing_provider, created_at, updated_at
        FROM workspaces
        WHERE id = ?
        LIMIT 1
      `),
      listOwners: this.db.prepare(`
        SELECT wm.workspace_id, wm.role, wm.created_at, u.id AS user_id, u.email, u.name
        FROM workspace_members wm
        LEFT JOIN users u ON u.id = wm.user_id
        ORDER BY CASE wm.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          ELSE 3
        END, datetime(wm.created_at) ASC
      `),
      siteStats: this.db.prepare(`
        SELECT workspace_id,
               COUNT(*) AS site_count,
               MAX(last_seen_at) AS latest_site_seen_at
        FROM sites
        GROUP BY workspace_id
      `),
      conversationStats: this.db.prepare(`
        SELECT workspace_id,
               COUNT(*) AS conversation_count,
               MAX(last_message_at) AS latest_conversation_at
        FROM conversations
        GROUP BY workspace_id
      `),
      memberStats: this.db.prepare(`
        SELECT workspace_id, COUNT(*) AS member_count
        FROM workspace_members
        GROUP BY workspace_id
      `),
      updateManualControls: this.db.prepare(`
        UPDATE workspaces
        SET manual_plan_override = @manual_plan_override,
            manual_subscription_status = @manual_subscription_status,
            manual_current_period_end = @manual_current_period_end,
            gifted_reason = @gifted_reason,
            gifted_by = @gifted_by,
            updated_at = @updated_at
        WHERE id = @id
      `)
    };
  }

  getOwnerMap() {
    const owners = new Map();
    this.statements.listOwners.all().forEach((row) => {
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
    const siteStats = new Map();
    const conversationStats = new Map();
    const memberStats = new Map();

    this.statements.siteStats.all().forEach((row) => {
      siteStats.set(String(row.workspace_id), {
        siteCount: Number(row.site_count || 0),
        latestSiteSeenAt: sanitizeText(row.latest_site_seen_at, 40)
      });
    });

    this.statements.conversationStats.all().forEach((row) => {
      conversationStats.set(String(row.workspace_id), {
        conversationCount: Number(row.conversation_count || 0),
        latestConversationAt: sanitizeText(row.latest_conversation_at, 40)
      });
    });

    this.statements.memberStats.all().forEach((row) => {
      memberStats.set(String(row.workspace_id), {
        memberCount: Number(row.member_count || 0)
      });
    });

    return { siteStats, conversationStats, memberStats };
  }

  buildWorkspaceSummary(workspace, maps) {
    const current = this.workspaceService.normalizeWorkspace(workspace);
    const effective = this.workspaceService.getEffectiveWorkspaceState(current);
    const owner = maps.owners.get(current.id) || null;
    const siteStats = maps.siteStats.get(current.id) || { siteCount: 0, latestSiteSeenAt: '' };
    const conversationStats = maps.conversationStats.get(current.id) || { conversationCount: 0, latestConversationAt: '' };
    const memberStats = maps.memberStats.get(current.id) || { memberCount: 0 };
    const operatorsUsed = this.planService ? this.planService.getWorkspaceUsage(current.id).operatorsUsed : memberStats.memberCount;
    const lastActivityAt = maxSqlTimestamp([
      current.lastActivityAt,
      conversationStats.latestConversationAt,
      siteStats.latestSiteSeenAt,
      current.updatedAt,
      current.createdAt
    ]);
    const lastSeenDate = parseSqlTimestamp(siteStats.latestSiteSeenAt);
    const isOnline = Boolean(lastSeenDate && (Date.now() - lastSeenDate.getTime()) <= ONLINE_WINDOW_MS);
    const billingDate = effective.currentPeriodEnd || effective.trialEndsAt || '';
    const effectivePlan = normalizePlanKey(effective.plan);

    return {
      id: current.id,
      slug: current.slug,
      name: current.name,
      owner,
      plan: effectivePlan,
      planLabel: PLANS[effectivePlan]?.label || effectivePlan,
      basePlan: normalizePlanKey(current.plan),
      subscriptionStatus: effective.subscriptionStatus || 'active',
      currentPeriodEnd: effective.currentPeriodEnd || '',
      trialEndsAt: current.trialEndsAt || '',
      daysLeft: buildDaysLeft(billingDate),
      siteCount: siteStats.siteCount,
      conversationCount: conversationStats.conversationCount,
      usersCount: memberStats.memberCount,
      operatorsCount: operatorsUsed,
      lastActivityAt,
      latestSiteSeenAt: siteStats.latestSiteSeenAt,
      isOnline,
      onlineLabel: isOnline ? 'online' : 'offline',
      manualOverrideActive: effective.manualOverrideActive,
      gifted: effective.gifted,
      giftedReason: current.giftedReason || '',
      giftedBy: current.giftedBy || '',
      workspace: current
    };
  }

  listWorkspaceSummaries(filters = {}) {
    const maps = Object.assign(this.getStatsMaps(), { owners: this.getOwnerMap() });
    const q = sanitizeText(filters.q, 160).toLowerCase();
    const plan = normalizePlanKey(filters.plan || '');
    const planFilterEnabled = ['basic', 'pro', 'business'].includes(sanitizeText(filters.plan, 40).toLowerCase());
    const status = sanitizeText(filters.status, 80).toLowerCase();
    const online = sanitizeText(filters.online, 20).toLowerCase();

    return this.statements.listWorkspaces
      .all()
      .map((row) => this.buildWorkspaceSummary(row, maps))
      .filter((item) => {
        if (q) {
          const ownerEmail = String(item.owner?.email || '').toLowerCase();
          const haystack = [item.name, item.slug, ownerEmail].join(' ').toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        if (planFilterEnabled && item.plan !== plan) return false;
        if (status && item.subscriptionStatus.toLowerCase() !== status) return false;
        if (online === 'online' && !item.isOnline) return false;
        if (online === 'offline' && item.isOnline) return false;
        return true;
      });
  }

  getWorkspaceDetail(workspaceId) {
    const cleanWorkspaceId = sanitizeText(workspaceId, 120);
    if (!cleanWorkspaceId) return null;
    const workspaceRow = this.statements.getWorkspaceById.get(cleanWorkspaceId);
    if (!workspaceRow) return null;
    const maps = Object.assign(this.getStatsMaps(), { owners: this.getOwnerMap() });
    const summary = this.buildWorkspaceSummary(workspaceRow, maps);
    const sites = this.workspaceService.listSitesByWorkspace(cleanWorkspaceId).map((site) => {
      const seenAt = parseSqlTimestamp(site.lastSeenAt);
      return Object.assign({}, site, {
        isOnline: Boolean(seenAt && (Date.now() - seenAt.getTime()) <= ONLINE_WINDOW_MS)
      });
    });
    return Object.assign({}, summary, {
      sites
    });
  }

  updateWorkspaceManualControls(workspaceId, input = {}, actor = {}) {
    const current = this.getWorkspaceDetail(workspaceId);
    if (!current) {
      const error = new Error('WORKSPACE_NOT_FOUND');
      error.code = 'WORKSPACE_NOT_FOUND';
      throw error;
    }

    const rawPlan = sanitizeText(input.manualPlanOverride, 40).toLowerCase();
    const manualPlanOverride = rawPlan ? normalizePlanKey(rawPlan) : '';
    const manualSubscriptionStatus = sanitizeText(input.manualSubscriptionStatus, 80).toLowerCase();
    const manualCurrentPeriodEnd = toSqlDateEndOfDay(input.manualCurrentPeriodEnd);
    const giftedReason = sanitizeText(input.giftedReason, 255);
    const giftedBy = giftedReason ? sanitizeText(actor.email || actor.name, 160) : '';

    this.statements.updateManualControls.run({
      id: current.id,
      manual_plan_override: manualPlanOverride || null,
      manual_subscription_status: manualSubscriptionStatus || null,
      manual_current_period_end: manualCurrentPeriodEnd || null,
      gifted_reason: giftedReason || null,
      gifted_by: giftedBy || null,
      updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });

    return this.getWorkspaceDetail(current.id);
  }
}

module.exports = {
  SuperAdminService,
  ONLINE_WINDOW_MS
};
