const { DEFAULT_WORKSPACE_ID, DEFAULT_SITE_ID } = require('../db/database');
const { createWidgetKey, createPrefixedId } = require('../utils/id');

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

function normalizeDomain(value) {
  return sanitizeText(value, 255)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .trim();
}

function slugifySiteName(value) {
  return sanitizeText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

class WorkspaceService {
  constructor(options = {}) {
    this.db = options.db;
    this.siteConfigProvider = typeof options.siteConfigProvider === 'function' ? options.siteConfigProvider : null;
    this.siteConfigsProvider = typeof options.siteConfigsProvider === 'function' ? options.siteConfigsProvider : null;
    this.statements = {
      getWorkspaceById: this.db.prepare(`
        SELECT id, name, slug, plan, subscription_status, trial_ends_at, current_period_end,
               stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_portal_last_url,
               trial_started_at, billing_provider, created_at, updated_at
        FROM workspaces
        WHERE id = ?
        LIMIT 1
      `),
      getDefaultWorkspace: this.db.prepare(`
        SELECT id, name, slug, plan, subscription_status, trial_ends_at, current_period_end,
               stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_portal_last_url,
               trial_started_at, billing_provider, created_at, updated_at
        FROM workspaces
        WHERE id = ?
        LIMIT 1
      `),
      getWorkspaceByStripeCustomerId: this.db.prepare(`
        SELECT id, name, slug, plan, subscription_status, trial_ends_at, current_period_end,
               stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_portal_last_url,
               trial_started_at, billing_provider, created_at, updated_at
        FROM workspaces
        WHERE stripe_customer_id = ?
        LIMIT 1
      `),
      getWorkspaceByStripeSubscriptionId: this.db.prepare(`
        SELECT id, name, slug, plan, subscription_status, trial_ends_at, current_period_end,
               stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_portal_last_url,
               trial_started_at, billing_provider, created_at, updated_at
        FROM workspaces
        WHERE stripe_subscription_id = ?
        LIMIT 1
      `),
      getSiteById: this.db.prepare(`
        SELECT id, workspace_id, name, domain, widget_key, is_active,
               last_seen_at, last_seen_url, last_seen_host, last_seen_user_agent, last_seen_referrer, heartbeat_count,
               created_at, updated_at
        FROM sites
        WHERE id = ?
        LIMIT 1
      `),
      getSiteByWidgetKey: this.db.prepare(`
        SELECT id, workspace_id, name, domain, widget_key, is_active,
               last_seen_at, last_seen_url, last_seen_host, last_seen_user_agent, last_seen_referrer, heartbeat_count,
               created_at, updated_at
        FROM sites
        WHERE widget_key = ?
        LIMIT 1
      `),
      getSiteByIdWithinWorkspace: this.db.prepare(`
        SELECT id, workspace_id, name, domain, widget_key, is_active,
               last_seen_at, last_seen_url, last_seen_host, last_seen_user_agent, last_seen_referrer, heartbeat_count,
               created_at, updated_at
        FROM sites
        WHERE id = ? AND workspace_id = ?
        LIMIT 1
      `),
      listSitesByWorkspace: this.db.prepare(`
        SELECT id, workspace_id, name, domain, widget_key, is_active,
               last_seen_at, last_seen_url, last_seen_host, last_seen_user_agent, last_seen_referrer, heartbeat_count,
               created_at, updated_at
        FROM sites
        WHERE workspace_id = ?
        ORDER BY is_active DESC, datetime(created_at) ASC, name COLLATE NOCASE ASC
      `),
      upsertSite: this.db.prepare(`
        INSERT INTO sites (id, workspace_id, name, domain, widget_key, is_active, created_at, updated_at)
        VALUES (@id, @workspace_id, @name, @domain, @widget_key, @is_active, @created_at, @updated_at)
        ON CONFLICT(id) DO UPDATE SET
          workspace_id = excluded.workspace_id,
          name = excluded.name,
          domain = excluded.domain,
          is_active = excluded.is_active,
          updated_at = excluded.updated_at
      `),
      updateSite: this.db.prepare(`
        UPDATE sites
        SET name = @name,
            domain = @domain,
            is_active = @is_active,
            updated_at = @updated_at
        WHERE id = @id AND workspace_id = @workspace_id
      `),
      updateWidgetKey: this.db.prepare(`
        UPDATE sites
        SET widget_key = ?,
            last_seen_at = NULL,
            last_seen_url = NULL,
            last_seen_host = NULL,
            last_seen_user_agent = NULL,
            last_seen_referrer = NULL,
            updated_at = ?
        WHERE id = ? AND workspace_id = ?
      `),
      countSiteId: this.db.prepare(`
        SELECT COUNT(*) AS count
        FROM sites
        WHERE id = ?
      `),
      listDomainsBySite: this.db.prepare(`
        SELECT id, site_id, workspace_id, domain, is_primary, created_at, updated_at
        FROM site_domains
        WHERE site_id = ? AND workspace_id = ?
        ORDER BY is_primary DESC, domain ASC
      `),
      getDomainById: this.db.prepare(`
        SELECT id, site_id, workspace_id, domain, is_primary, created_at, updated_at
        FROM site_domains
        WHERE id = ? AND site_id = ? AND workspace_id = ?
        LIMIT 1
      `),
      insertDomain: this.db.prepare(`
        INSERT INTO site_domains (id, site_id, workspace_id, domain, is_primary, created_at, updated_at)
        VALUES (@id, @site_id, @workspace_id, @domain, @is_primary, @created_at, @updated_at)
      `),
      deleteDomainById: this.db.prepare(`
        DELETE FROM site_domains
        WHERE id = ? AND site_id = ? AND workspace_id = ?
      `),
      clearPrimaryDomains: this.db.prepare(`
        UPDATE site_domains
        SET is_primary = 0, updated_at = ?
        WHERE site_id = ? AND workspace_id = ?
      `),
      syncSitePrimaryDomain: this.db.prepare(`
        UPDATE sites
        SET domain = ?, updated_at = ?
        WHERE id = ? AND workspace_id = ?
      `),
      updateSiteHeartbeat: this.db.prepare(`
        UPDATE sites
        SET last_seen_at = @last_seen_at,
            last_seen_url = @last_seen_url,
            last_seen_host = @last_seen_host,
            last_seen_user_agent = @last_seen_user_agent,
            last_seen_referrer = @last_seen_referrer,
            heartbeat_count = COALESCE(heartbeat_count, 0) + 1,
            updated_at = @updated_at
        WHERE id = @id AND workspace_id = @workspace_id AND widget_key = @widget_key
      `),
      updateWorkspaceBilling: this.db.prepare(`
        UPDATE workspaces
        SET plan = @plan,
            subscription_status = @subscription_status,
            trial_ends_at = @trial_ends_at,
            current_period_end = @current_period_end,
            stripe_customer_id = @stripe_customer_id,
            stripe_subscription_id = @stripe_subscription_id,
            stripe_price_id = @stripe_price_id,
            stripe_portal_last_url = @stripe_portal_last_url,
            trial_started_at = @trial_started_at,
            billing_provider = @billing_provider,
            updated_at = @updated_at
        WHERE id = @id
      `)
    };
  }

  normalizeWorkspace(row) {
    if (!row) return null;
    return {
      id: String(row.id || '').trim(),
      name: String(row.name || '').trim(),
      slug: String(row.slug || '').trim(),
      plan: String(row.plan || 'basic').trim(),
      subscriptionStatus: String(row.subscription_status || 'active').trim() || 'active',
      trialEndsAt: String(row.trial_ends_at || '').trim(),
      currentPeriodEnd: String(row.current_period_end || '').trim(),
      stripeCustomerId: String(row.stripe_customer_id || '').trim(),
      stripeSubscriptionId: String(row.stripe_subscription_id || '').trim(),
      stripePriceId: String(row.stripe_price_id || '').trim(),
      stripePortalLastUrl: String(row.stripe_portal_last_url || '').trim(),
      trialStartedAt: String(row.trial_started_at || '').trim(),
      billingProvider: String(row.billing_provider || 'stripe').trim() || 'stripe',
      createdAt: String(row.created_at || '').trim(),
      updatedAt: String(row.updated_at || '').trim()
    };
  }

  normalizeDomain(row) {
    if (!row) return null;
    return {
      id: String(row.id || '').trim(),
      siteId: String(row.site_id || '').trim(),
      workspaceId: String(row.workspace_id || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID,
      domain: String(row.domain || '').trim(),
      isPrimary: Number(row.is_primary) === 1,
      createdAt: String(row.created_at || '').trim(),
      updatedAt: String(row.updated_at || '').trim()
    };
  }

  normalizeSite(row, domains = null) {
    if (!row) return null;
    const normalizedDomains = Array.isArray(domains) ? domains : [];
    const primaryDomain = normalizedDomains.find((item) => item.isPrimary)?.domain || String(row.domain || '').trim();
    return {
      id: String(row.id || '').trim(),
      workspaceId: String(row.workspace_id || DEFAULT_WORKSPACE_ID).trim() || DEFAULT_WORKSPACE_ID,
      name: String(row.name || '').trim(),
      domain: String(row.domain || '').trim(),
      primaryDomain,
      domains: normalizedDomains,
      widgetKey: String(row.widget_key || '').trim(),
      lastSeenAt: String(row.last_seen_at || '').trim(),
      lastSeenUrl: String(row.last_seen_url || '').trim(),
      lastSeenHost: String(row.last_seen_host || '').trim(),
      lastSeenUserAgent: String(row.last_seen_user_agent || '').trim(),
      lastSeenReferrer: String(row.last_seen_referrer || '').trim(),
      heartbeatCount: Number(row.heartbeat_count || 0),
      isActive: Number(row.is_active) === 1,
      createdAt: String(row.created_at || '').trim(),
      updatedAt: String(row.updated_at || '').trim()
    };
  }

  getDefaultWorkspace() {
    return this.normalizeWorkspace(this.statements.getDefaultWorkspace.get(DEFAULT_WORKSPACE_ID));
  }

  getWorkspaceById(workspaceId) {
    const cleanWorkspaceId = sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID;
    return this.normalizeWorkspace(this.statements.getWorkspaceById.get(cleanWorkspaceId));
  }

  getWorkspaceByStripeCustomerId(customerId) {
    const cleanCustomerId = sanitizeText(customerId, 160);
    if (!cleanCustomerId) return null;
    return this.normalizeWorkspace(this.statements.getWorkspaceByStripeCustomerId.get(cleanCustomerId));
  }

  getWorkspaceByStripeSubscriptionId(subscriptionId) {
    const cleanSubscriptionId = sanitizeText(subscriptionId, 160);
    if (!cleanSubscriptionId) return null;
    return this.normalizeWorkspace(this.statements.getWorkspaceByStripeSubscriptionId.get(cleanSubscriptionId));
  }

  updateWorkspaceBilling(workspaceId, updates = {}) {
    const current = this.getWorkspaceById(workspaceId);
    if (!current) return null;
    const next = Object.assign({}, current, updates);
    const updatedAt = nowSql();
    this.statements.updateWorkspaceBilling.run({
      id: current.id,
      plan: sanitizeText(next.plan, 40) || current.plan || 'basic',
      subscription_status: sanitizeText(next.subscriptionStatus, 80) || current.subscriptionStatus || 'active',
      trial_ends_at: sanitizeText(next.trialEndsAt, 40) || null,
      current_period_end: sanitizeText(next.currentPeriodEnd, 40) || null,
      stripe_customer_id: sanitizeText(next.stripeCustomerId, 160) || null,
      stripe_subscription_id: sanitizeText(next.stripeSubscriptionId, 160) || null,
      stripe_price_id: sanitizeText(next.stripePriceId, 160) || null,
      stripe_portal_last_url: sanitizeText(next.stripePortalLastUrl, 2000) || null,
      trial_started_at: sanitizeText(next.trialStartedAt, 40) || null,
      billing_provider: sanitizeText(next.billingProvider, 40) || 'stripe',
      updated_at: updatedAt
    });
    return this.getWorkspaceById(current.id);
  }

  listSiteDomains(siteId, workspaceId) {
    const cleanSiteId = sanitizeText(siteId, 120);
    const cleanWorkspaceId = sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID;
    if (!cleanSiteId) return [];
    return this.statements.listDomainsBySite.all(cleanSiteId, cleanWorkspaceId).map((row) => this.normalizeDomain(row));
  }

  getSiteById(siteId) {
    const cleanSiteId = sanitizeText(siteId, 120);
    if (!cleanSiteId) return null;
    const row = this.statements.getSiteById.get(cleanSiteId);
    if (!row) return null;
    return this.normalizeSite(row, this.listSiteDomains(cleanSiteId, row.workspace_id));
  }

  getSiteByIdWithinWorkspace(siteId, workspaceId) {
    const cleanSiteId = sanitizeText(siteId, 120);
    const cleanWorkspaceId = sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID;
    if (!cleanSiteId) return null;
    const row = this.statements.getSiteByIdWithinWorkspace.get(cleanSiteId, cleanWorkspaceId);
    if (!row) return null;
    return this.normalizeSite(row, this.listSiteDomains(cleanSiteId, cleanWorkspaceId));
  }

  getSiteByWidgetKey(widgetKey) {
    const cleanWidgetKey = sanitizeText(widgetKey, 160);
    if (!cleanWidgetKey) return null;
    const row = this.statements.getSiteByWidgetKey.get(cleanWidgetKey);
    if (!row) return null;
    return this.normalizeSite(row, this.listSiteDomains(row.id, row.workspace_id));
  }

  getWorkspaceForSite(siteId) {
    const site = this.getSiteById(siteId);
    if (!site) return this.getDefaultWorkspace();
    return this.getWorkspaceById(site.workspaceId) || this.getDefaultWorkspace();
  }

  listSitesByWorkspace(workspaceId = DEFAULT_WORKSPACE_ID) {
    const cleanWorkspaceId = sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID;
    return this.statements.listSitesByWorkspace.all(cleanWorkspaceId).map((row) => (
      this.normalizeSite(row, this.listSiteDomains(row.id, cleanWorkspaceId))
    ));
  }

  getDefaultSiteForWorkspace(workspaceId = DEFAULT_WORKSPACE_ID) {
    const sites = this.listSitesByWorkspace(workspaceId);
    return sites.find((site) => site.isActive) || sites[0] || null;
  }

  syncConfiguredSites() {
    if (!this.siteConfigsProvider) return;
    const configs = this.siteConfigsProvider();
    const now = nowSql();

    configs.forEach((config) => {
      const siteId = sanitizeText(config && config.siteId, 120);
      if (!siteId) return;
      const existing = this.getSiteById(siteId);
      const normalizedDomain = normalizeDomain(config.domain || '');
      this.statements.upsertSite.run({
        id: siteId,
        workspace_id: DEFAULT_WORKSPACE_ID,
        name: sanitizeText(config.title || siteId, 160) || siteId,
        domain: normalizedDomain || null,
        widget_key: existing?.widgetKey || createWidgetKey(),
        is_active: 1,
        created_at: existing?.createdAt || now,
        updated_at: now
      });
      if (normalizedDomain) {
        this.addSiteDomain(DEFAULT_WORKSPACE_ID, siteId, normalizedDomain, { isPrimary: true });
      }
    });

    if (!this.getSiteById(DEFAULT_SITE_ID)) {
      this.statements.upsertSite.run({
        id: DEFAULT_SITE_ID,
        workspace_id: DEFAULT_WORKSPACE_ID,
        name: 'Default Site',
        domain: null,
        widget_key: createWidgetKey(),
        is_active: 1,
        created_at: now,
        updated_at: now
      });
    }
  }

  resolveWorkspaceId(candidateWorkspaceId) {
    const cleanWorkspaceId = sanitizeText(candidateWorkspaceId, 120);
    if (cleanWorkspaceId && this.getWorkspaceById(cleanWorkspaceId)) {
      return cleanWorkspaceId;
    }
    return DEFAULT_WORKSPACE_ID;
  }

  resolveSite(siteId, fallbackSiteId = DEFAULT_SITE_ID, workspaceId = '') {
    const cleanSiteId = sanitizeText(siteId, 120);
    const cleanWorkspaceId = sanitizeText(workspaceId, 120);
    if (cleanSiteId) {
      const existing = cleanWorkspaceId
        ? this.getSiteByIdWithinWorkspace(cleanSiteId, cleanWorkspaceId)
        : this.getSiteById(cleanSiteId);
      if (existing) return existing;
      const config = this.siteConfigProvider ? this.siteConfigProvider(cleanSiteId) : null;
      if (config) {
        this.syncConfiguredSites();
        return cleanWorkspaceId
          ? this.getSiteByIdWithinWorkspace(cleanSiteId, cleanWorkspaceId)
          : this.getSiteById(cleanSiteId);
      }
    }
    if (cleanWorkspaceId) {
      return this.getSiteByIdWithinWorkspace(fallbackSiteId, cleanWorkspaceId)
        || this.getDefaultSiteForWorkspace(cleanWorkspaceId)
        || this.getSiteById(DEFAULT_SITE_ID);
    }
    return this.getSiteById(fallbackSiteId) || this.getSiteById(DEFAULT_SITE_ID);
  }

  createSite(workspaceId, input = {}) {
    const cleanWorkspaceId = sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID;
    const now = nowSql();
    const cleanName = sanitizeText(input.name || 'Untitled Site', 160) || 'Untitled Site';
    const cleanDomain = normalizeDomain(input.domain || '');
    const requestedId = sanitizeText(input.id, 120);
    let siteId = requestedId || slugifySiteName(cleanName) || createPrefixedId('site');
    while (Number(this.statements.countSiteId.get(siteId)?.count || 0) > 0) {
      siteId = `${slugifySiteName(cleanName) || 'site'}-${Math.random().toString(36).slice(2, 6)}`;
    }

    this.statements.upsertSite.run({
      id: siteId,
      workspace_id: cleanWorkspaceId,
      name: cleanName,
      domain: cleanDomain || null,
      widget_key: createWidgetKey(),
      is_active: input.isActive === false ? 0 : 1,
      created_at: now,
      updated_at: now
    });

    if (cleanDomain) {
      this.addSiteDomain(cleanWorkspaceId, siteId, cleanDomain, { isPrimary: true });
    }

    return this.getSiteByIdWithinWorkspace(siteId, cleanWorkspaceId);
  }

  updateSite(workspaceId, siteId, input = {}) {
    const existing = this.getSiteByIdWithinWorkspace(siteId, workspaceId);
    if (!existing) return null;
    const cleanWorkspaceId = sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID;
    const nextName = sanitizeText(input.name, 160) || existing.name;
    const nextDomain = normalizeDomain(
      Object.prototype.hasOwnProperty.call(input, 'domain') ? input.domain : existing.domain
    );
    const isActive = Object.prototype.hasOwnProperty.call(input, 'isActive')
      ? (input.isActive === true || String(input.isActive) === '1' ? 1 : 0)
      : (existing.isActive ? 1 : 0);

    this.statements.updateSite.run({
      id: existing.id,
      workspace_id: cleanWorkspaceId,
      name: nextName,
      domain: nextDomain || null,
      is_active: isActive,
      updated_at: nowSql()
    });

    if (nextDomain) {
      this.addSiteDomain(cleanWorkspaceId, existing.id, nextDomain, { isPrimary: true });
    }

    return this.getSiteByIdWithinWorkspace(existing.id, cleanWorkspaceId);
  }

  regenerateWidgetKey(workspaceId, siteId) {
    const existing = this.getSiteByIdWithinWorkspace(siteId, workspaceId);
    if (!existing) return null;
    this.statements.updateWidgetKey.run(createWidgetKey(), nowSql(), existing.id, existing.workspaceId);
    return this.getSiteByIdWithinWorkspace(existing.id, existing.workspaceId);
  }

  addSiteDomain(workspaceId, siteId, domain, options = {}) {
    const existingSite = this.getSiteByIdWithinWorkspace(siteId, workspaceId);
    if (!existingSite) return null;
    const cleanDomain = normalizeDomain(domain);
    if (!cleanDomain) {
      throw new Error('INVALID_DOMAIN');
    }
    const cleanWorkspaceId = sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID;
    const now = nowSql();
    const isPrimary = options.isPrimary === true;
    if (isPrimary) {
      this.statements.clearPrimaryDomains.run(now, siteId, cleanWorkspaceId);
    }
    try {
      this.statements.insertDomain.run({
        id: createPrefixedId('sdomain'),
        site_id: siteId,
        workspace_id: cleanWorkspaceId,
        domain: cleanDomain,
        is_primary: isPrimary ? 1 : 0,
        created_at: now,
        updated_at: now
      });
    } catch (error) {
      if (!/UNIQUE/i.test(String(error.message || ''))) throw error;
      if (isPrimary) {
        const existingDomains = this.listSiteDomains(siteId, cleanWorkspaceId);
        const matching = existingDomains.find((item) => item.domain === cleanDomain);
        if (matching) {
          this.statements.clearPrimaryDomains.run(now, siteId, cleanWorkspaceId);
          this.db.prepare(`
            UPDATE site_domains
            SET is_primary = 1, updated_at = ?
            WHERE id = ? AND site_id = ? AND workspace_id = ?
          `).run(now, matching.id, siteId, cleanWorkspaceId);
        }
      }
    }

    if (isPrimary) {
      this.statements.syncSitePrimaryDomain.run(cleanDomain, now, siteId, cleanWorkspaceId);
    }
    return this.listSiteDomains(siteId, cleanWorkspaceId);
  }

  deleteSiteDomain(workspaceId, siteId, domainId) {
    const existing = this.statements.getDomainById.get(
      sanitizeText(domainId, 120),
      sanitizeText(siteId, 120),
      sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID
    );
    if (!existing) return null;
    this.statements.deleteDomainById.run(existing.id, existing.site_id, existing.workspace_id);
    const remaining = this.listSiteDomains(existing.site_id, existing.workspace_id);
    const primary = remaining.find((item) => item.isPrimary) || remaining[0] || null;
    this.statements.syncSitePrimaryDomain.run(primary?.domain || null, nowSql(), existing.site_id, existing.workspace_id);
    if (primary && !primary.isPrimary) {
      this.addSiteDomain(existing.workspace_id, existing.site_id, primary.domain, { isPrimary: true });
      return this.listSiteDomains(existing.site_id, existing.workspace_id);
    }
    return remaining;
  }

  doesHostMatchSite(siteOrSiteId, hostCandidate) {
    const site = typeof siteOrSiteId === 'string' ? this.getSiteById(siteOrSiteId) : siteOrSiteId;
    const host = normalizeDomain(hostCandidate);
    if (!site || !host) return false;
    const allowedDomains = []
      .concat(Array.isArray(site.domains) ? site.domains.map((item) => item.domain) : [])
      .concat(site.primaryDomain || [])
      .concat(site.domain || [])
      .map((item) => normalizeDomain(item))
      .filter(Boolean);
    if (!allowedDomains.length) return false;
    return allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  }

  recordSiteHeartbeat(siteId, widgetKey, details = {}) {
    const existing = this.getSiteById(siteId);
    if (!existing || !existing.isActive) return null;
    const cleanWidgetKey = sanitizeText(widgetKey, 160);
    if (!cleanWidgetKey || cleanWidgetKey !== existing.widgetKey) {
      return null;
    }
    const now = nowSql();
    this.statements.updateSiteHeartbeat.run({
      id: existing.id,
      workspace_id: existing.workspaceId,
      widget_key: cleanWidgetKey,
      last_seen_at: now,
      last_seen_url: sanitizeText(details.pageUrl || '', 2048) || null,
      last_seen_host: normalizeDomain(details.pageHost || '') || null,
      last_seen_user_agent: sanitizeText(details.userAgent || '', 512) || null,
      last_seen_referrer: sanitizeText(details.referrer || '', 2048) || null,
      updated_at: now
    });
    return this.getSiteById(existing.id);
  }
}

module.exports = {
  WorkspaceService,
  DEFAULT_WORKSPACE_ID,
  DEFAULT_SITE_ID
};
