const { DEFAULT_WORKSPACE_ID } = require('../db/database');

const PLAN_ORDER = ['basic', 'pro', 'business'];

const PLANS = {
  basic: {
    key: 'basic',
    label: 'Basic',
    maxSites: 1,
    maxUsers: 1,
    ai: false,
    integrations: false,
    analytics: 'full',
    flows: 'basic',
    prioritySupport: false
  },
  pro: {
    key: 'pro',
    label: 'Pro',
    maxSites: 3,
    maxUsers: 5,
    ai: true,
    integrations: true,
    analytics: 'full',
    flows: 'advanced',
    prioritySupport: false
  },
  business: {
    key: 'business',
    label: 'Business',
    maxSites: 10,
    maxUsers: 20,
    ai: true,
    integrations: true,
    analytics: 'full',
    flows: 'advanced',
    prioritySupport: true
  }
};

function sanitizeText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizePlanKey(value) {
  const clean = sanitizeText(value, 40).toLowerCase();
  if (clean === 'free') return 'basic';
  return PLANS[clean] ? clean : 'basic';
}

function toUniqueOperatorKey(item) {
  const name = sanitizeText(item && item.name, 120).toLowerCase();
  if (!name) return '';
  const title = sanitizeText(item && item.title, 120).toLowerCase();
  return `${name}::${title}`;
}

class PlanService {
  constructor(options = {}) {
    this.db = options.db;
    this.workspaceService = options.workspaceService;
    this.siteSettingsProvider = typeof options.siteSettingsProvider === 'function' ? options.siteSettingsProvider : null;
    this.statements = {
      countSitesByWorkspace: this.db.prepare(`
        SELECT COUNT(*) AS count
        FROM sites
        WHERE workspace_id = ?
      `),
      countMembersByWorkspace: this.db.prepare(`
        SELECT COUNT(*) AS count
        FROM workspace_members
        WHERE workspace_id = ?
      `),
      updateWorkspacePlan: this.db.prepare(`
        UPDATE workspaces
        SET plan = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
    };
  }

  getPlanLimits(plan) {
    return Object.assign({}, PLANS[normalizePlanKey(plan)]);
  }

  getWorkspacePlan(workspaceId) {
    const workspace = this.workspaceService.getWorkspaceById(workspaceId || DEFAULT_WORKSPACE_ID);
    const effectiveState = this.workspaceService.getEffectiveWorkspaceState(workspace);
    return this.getPlanLimits(effectiveState.plan);
  }

  listWorkspaceSites(workspaceId) {
    return this.workspaceService.listSitesByWorkspace(workspaceId || DEFAULT_WORKSPACE_ID);
  }

  getWorkspaceOperatorUsage(workspaceId, options = {}) {
    const cleanWorkspaceId = sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID;
    const replaceSiteId = sanitizeText(options.replaceSiteId, 120);
    const nextOperators = Array.isArray(options.nextOperators) ? options.nextOperators : null;
    const operatorKeys = new Set();

    this.listWorkspaceSites(cleanWorkspaceId).forEach((site) => {
      const settings = this.siteSettingsProvider ? this.siteSettingsProvider(site.id) : null;
      const operators = replaceSiteId && site.id === replaceSiteId
        ? nextOperators
        : (Array.isArray(settings && settings.operators) ? settings.operators : []);
      operators.forEach((operator) => {
        const key = toUniqueOperatorKey(operator);
        if (key) operatorKeys.add(key);
      });
    });

    return operatorKeys.size;
  }

  getWorkspaceUsage(workspaceId) {
    const cleanWorkspaceId = sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID;
    return {
      sitesUsed: Number(this.statements.countSitesByWorkspace.get(cleanWorkspaceId)?.count || 0),
      membersUsed: Number(this.statements.countMembersByWorkspace.get(cleanWorkspaceId)?.count || 0),
      operatorsUsed: this.getWorkspaceOperatorUsage(cleanWorkspaceId)
    };
  }

  getNextPlan(plan) {
    const current = normalizePlanKey(plan);
    const index = PLAN_ORDER.indexOf(current);
    if (index === -1 || index >= PLAN_ORDER.length - 1) return current;
    return PLAN_ORDER[index + 1];
  }

  buildUpgradeMessage(planKey, featureLabel, upgradePlan) {
    const current = this.getPlanLimits(planKey);
    const next = this.getPlanLimits(upgradePlan || this.getNextPlan(planKey));
    return `Upgrade required. ${featureLabel} are not available on the ${current.label} plan. Upgrade to ${next.label}.`;
  }

  buildLimitReachedMessage(planKey, resourceLabel, upgradePlan) {
    const current = this.getPlanLimits(planKey);
    const next = this.getPlanLimits(upgradePlan || this.getNextPlan(planKey));
    return `Plan limit reached. You’ve reached your ${current.label} plan limit for ${resourceLabel}. Upgrade to ${next.label}.`;
  }

  canCreateSite(workspaceId) {
    const plan = this.getWorkspacePlan(workspaceId);
    const usage = this.getWorkspaceUsage(workspaceId);
    return {
      allowed: usage.sitesUsed < plan.maxSites,
      code: usage.sitesUsed < plan.maxSites ? '' : 'PLAN_SITE_LIMIT',
      message: usage.sitesUsed < plan.maxSites ? '' : this.buildLimitReachedMessage(plan.key, 'sites')
    };
  }

  canAddUser(workspaceId) {
    const plan = this.getWorkspacePlan(workspaceId);
    const usage = this.getWorkspaceUsage(workspaceId);
    return {
      allowed: usage.membersUsed < plan.maxUsers,
      code: usage.membersUsed < plan.maxUsers ? '' : 'PLAN_USER_LIMIT',
      message: usage.membersUsed < plan.maxUsers ? '' : this.buildLimitReachedMessage(plan.key, 'users')
    };
  }

  canManageOperators(workspaceId, siteId = '', operators = null) {
    const plan = this.getWorkspacePlan(workspaceId);
    const currentCount = Array.isArray(operators)
      ? this.getWorkspaceOperatorUsage(workspaceId, { replaceSiteId: siteId, nextOperators: operators })
      : this.getWorkspaceUsage(workspaceId).operatorsUsed;
    return {
      allowed: currentCount <= plan.maxUsers,
      code: currentCount <= plan.maxUsers ? '' : 'PLAN_OPERATOR_LIMIT',
      message: currentCount <= plan.maxUsers ? '' : this.buildLimitReachedMessage(plan.key, 'operators')
    };
  }

  canUseAI(workspaceId) {
    const plan = this.getWorkspacePlan(workspaceId);
    return {
      allowed: plan.ai === true,
      code: plan.ai === true ? '' : 'PLAN_AI_REQUIRED',
      message: plan.ai === true ? '' : this.buildUpgradeMessage(plan.key, 'AI features')
    };
  }

  canUseIntegrations(workspaceId) {
    const plan = this.getWorkspacePlan(workspaceId);
    return {
      allowed: plan.integrations === true,
      code: plan.integrations === true ? '' : 'PLAN_INTEGRATIONS_REQUIRED',
      message: plan.integrations === true ? '' : this.buildUpgradeMessage(plan.key, 'Integrations')
    };
  }

  canUseAdvancedFlows(workspaceId) {
    const plan = this.getWorkspacePlan(workspaceId);
    return {
      allowed: plan.flows === 'advanced',
      code: plan.flows === 'advanced' ? '' : 'PLAN_ADVANCED_FLOWS_REQUIRED',
      message: plan.flows === 'advanced' ? '' : this.buildUpgradeMessage(plan.key, 'Advanced flows')
    };
  }

  getWorkspaceEntitlements(workspaceId) {
    const plan = this.getWorkspacePlan(workspaceId);
    const usage = this.getWorkspaceUsage(workspaceId);
    return {
      workspaceId: sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID,
      plan,
      usage,
      permissions: {
        canCreateSite: this.canCreateSite(workspaceId).allowed,
        canAddUser: this.canAddUser(workspaceId).allowed,
        canUseAI: this.canUseAI(workspaceId).allowed,
        canUseIntegrations: this.canUseIntegrations(workspaceId).allowed,
        canUseAdvancedFlows: this.canUseAdvancedFlows(workspaceId).allowed,
        canManageOperators: this.canManageOperators(workspaceId).allowed
      }
    };
  }

  setWorkspacePlan(workspaceId, plan) {
    const cleanWorkspaceId = sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID;
    const nextPlan = normalizePlanKey(plan);
    this.statements.updateWorkspacePlan.run(nextPlan, cleanWorkspaceId);
    return this.workspaceService.getWorkspaceById(cleanWorkspaceId);
  }
}

module.exports = {
  PlanService,
  PLANS,
  PLAN_ORDER,
  normalizePlanKey
};
