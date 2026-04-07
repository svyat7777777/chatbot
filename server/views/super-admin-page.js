const { renderAppLayout } = require('./app-layout');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateTime(value, fallback = '—') {
  const clean = String(value || '').trim();
  if (!clean) return fallback;
  const date = new Date(clean.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateValue(value) {
  const clean = String(value || '').trim();
  if (!clean) return '';
  return clean.slice(0, 10);
}

function renderDashboardPage(options = {}) {
  const workspaces = Array.isArray(options.workspaces) ? options.workspaces : [];
  const filters = options.filters || {};
  const summaryCards = [
    {
      label: 'Workspaces',
      value: String(workspaces.length)
    },
    {
      label: 'Online now',
      value: String(workspaces.filter((item) => item.isOnline).length)
    },
    {
      label: 'Manual overrides',
      value: String(workspaces.filter((item) => item.manualOverrideActive).length)
    },
    {
      label: 'Gifted/manual',
      value: String(workspaces.filter((item) => item.gifted).length)
    }
  ];

  const tableRows = workspaces.map((item) => `
    <tr>
      <td>
        <strong>${escapeHtml(item.name)}</strong>
        <div class="sa-cell-sub">${escapeHtml(item.id)}</div>
      </td>
      <td>${escapeHtml(item.owner?.email || '—')}</td>
      <td>${escapeHtml(item.planLabel)}</td>
      <td><span class="sa-status-pill ${item.subscriptionStatus === 'active' ? 'is-good' : ''}">${escapeHtml(item.subscriptionStatus)}</span></td>
      <td>${escapeHtml(formatDateTime(item.currentPeriodEnd))}</td>
      <td>${item.daysLeft == null ? '—' : `${item.daysLeft}d`}</td>
      <td>${item.siteCount}</td>
      <td>${item.conversationCount}</td>
      <td>${item.usersCount} / ${item.operatorsCount}</td>
      <td>${escapeHtml(formatDateTime(item.lastActivityAt))}</td>
      <td><span class="sa-status-pill ${item.isOnline ? 'is-good' : 'is-muted'}">${escapeHtml(item.onlineLabel)}</span></td>
      <td><a class="sa-open-link" href="/super-admin/workspaces/${encodeURIComponent(item.id)}">Open</a></td>
    </tr>
  `).join('');

  return renderAppLayout({
    title: 'Super Admin',
    activeNav: 'super-admin',
    isSuperAdmin: true,
    styles: `
      :root {
        color-scheme: light;
        --sa-bg: #eef1f6;
        --sa-card: #ffffff;
        --sa-card-soft: #f7f8fb;
        --sa-border: #dce3ee;
        --sa-text: #0f172a;
        --sa-muted: #64748b;
        --sa-accent: #0f766e;
        --sa-accent-soft: rgba(15, 118, 110, 0.1);
        --sa-danger: #b42318;
        --sa-warning: #b54708;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top right, rgba(15, 118, 110, 0.14), transparent 26%),
          linear-gradient(180deg, #f4f7fb 0%, #edf1f7 100%);
        color: var(--sa-text);
      }
      .sa-page {
        min-height: 100vh;
        padding: 28px;
        display: grid;
        gap: 22px;
      }
      .sa-hero,
      .sa-card,
      .sa-table-card {
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid var(--sa-border);
        border-radius: 24px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
      }
      .sa-hero {
        padding: 24px 26px;
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: flex-start;
      }
      .sa-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--sa-accent-soft);
        color: var(--sa-accent);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .sa-hero h1 {
        margin: 14px 0 6px;
        font-size: 34px;
        line-height: 1;
        letter-spacing: -0.04em;
      }
      .sa-hero p {
        margin: 0;
        color: var(--sa-muted);
        max-width: 720px;
      }
      .sa-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }
      .sa-card {
        padding: 16px 18px;
      }
      .sa-metric-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--sa-muted);
      }
      .sa-metric-value {
        margin-top: 10px;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.04em;
      }
      .sa-filters {
        padding: 18px;
        display: grid;
        gap: 14px;
      }
      .sa-filter-grid {
        display: grid;
        grid-template-columns: minmax(0, 2fr) repeat(3, minmax(160px, 1fr)) auto;
        gap: 12px;
      }
      .sa-field {
        display: grid;
        gap: 7px;
      }
      .sa-field label {
        font-size: 12px;
        font-weight: 600;
        color: var(--sa-muted);
      }
      .sa-field input,
      .sa-field select {
        min-height: 44px;
        border-radius: 14px;
        border: 1px solid var(--sa-border);
        background: #fff;
        padding: 0 14px;
        font: inherit;
        color: var(--sa-text);
      }
      .sa-actions {
        display: flex;
        align-items: end;
        gap: 10px;
      }
      .sa-btn,
      .sa-btn-secondary,
      .sa-open-link {
        min-height: 44px;
        padding: 0 16px;
        border-radius: 14px;
        text-decoration: none;
        border: 1px solid var(--sa-border);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        cursor: pointer;
      }
      .sa-btn {
        background: #0f172a;
        color: #fff;
        border-color: #0f172a;
      }
      .sa-btn-secondary,
      .sa-open-link {
        background: #fff;
        color: var(--sa-text);
      }
      .sa-table-card {
        overflow: hidden;
      }
      .sa-table-wrap {
        overflow: auto;
      }
      .sa-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 1180px;
      }
      .sa-table th,
      .sa-table td {
        padding: 14px 16px;
        border-bottom: 1px solid #edf1f5;
        text-align: left;
        vertical-align: top;
        font-size: 14px;
      }
      .sa-table th {
        color: var(--sa-muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        background: #fbfcfe;
      }
      .sa-cell-sub {
        margin-top: 4px;
        color: var(--sa-muted);
        font-size: 12px;
      }
      .sa-status-pill {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        background: #eef2f7;
        color: #334155;
        font-size: 12px;
        font-weight: 700;
        text-transform: lowercase;
      }
      .sa-status-pill.is-good {
        background: #e8fff7;
        color: #0f766e;
      }
      .sa-status-pill.is-muted {
        background: #eef2f7;
        color: #64748b;
      }
      .sa-empty {
        padding: 28px;
        text-align: center;
        color: var(--sa-muted);
      }
      @media (max-width: 1100px) {
        .sa-summary-grid,
        .sa-filter-grid {
          grid-template-columns: 1fr;
        }
        .sa-page {
          padding: 18px;
        }
        .sa-hero {
          flex-direction: column;
        }
      }
    `,
    content: `
      <div class="sa-page">
        <section class="sa-hero">
          <div>
            <span class="sa-eyebrow">Internal only</span>
            <h1>Super Admin</h1>
            <p>Internal platform controls for monitoring workspaces, subscriptions, usage, and manual owner overrides across the whole SaaS.</p>
          </div>
        </section>

        <section class="sa-summary-grid">
          ${summaryCards.map((card) => `
            <article class="sa-card">
              <div class="sa-metric-label">${escapeHtml(card.label)}</div>
              <div class="sa-metric-value">${escapeHtml(card.value)}</div>
            </article>
          `).join('')}
        </section>

        <form class="sa-card sa-filters" method="get" action="/super-admin">
          <div class="sa-filter-grid">
            <div class="sa-field">
              <label for="sa-q">Search workspace / email</label>
              <input id="sa-q" type="search" name="q" value="${escapeHtml(filters.q || '')}" placeholder="workspace name or owner email" />
            </div>
            <div class="sa-field">
              <label for="sa-status">Subscription status</label>
              <select id="sa-status" name="status">
                <option value="">All statuses</option>
                ${['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'canceled', 'manual', 'gifted'].map((value) => `
                  <option value="${value}"${filters.status === value ? ' selected' : ''}>${value}</option>
                `).join('')}
              </select>
            </div>
            <div class="sa-field">
              <label for="sa-plan">Plan</label>
              <select id="sa-plan" name="plan">
                <option value="">All plans</option>
                ${['basic', 'pro', 'business'].map((value) => `
                  <option value="${value}"${filters.plan === value ? ' selected' : ''}>${value}</option>
                `).join('')}
              </select>
            </div>
            <div class="sa-field">
              <label for="sa-online">Online status</label>
              <select id="sa-online" name="online">
                <option value="">All</option>
                <option value="online"${filters.online === 'online' ? ' selected' : ''}>online</option>
                <option value="offline"${filters.online === 'offline' ? ' selected' : ''}>offline</option>
              </select>
            </div>
            <div class="sa-actions">
              <button class="sa-btn" type="submit">Apply</button>
              <a class="sa-btn-secondary" href="/super-admin">Reset</a>
            </div>
          </div>
        </form>

        <section class="sa-table-card">
          <div class="sa-table-wrap">
            ${workspaces.length ? `
              <table class="sa-table">
                <thead>
                  <tr>
                    <th>Workspace</th>
                    <th>Owner email</th>
                    <th>Plan</th>
                    <th>Subscription</th>
                    <th>Current period end</th>
                    <th>Days left</th>
                    <th>Sites</th>
                    <th>Chats</th>
                    <th>Users / Operators</th>
                    <th>Last activity</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>${tableRows}</tbody>
              </table>
            ` : '<div class="sa-empty">No workspaces matched the current filters.</div>'}
          </div>
        </section>
      </div>
    `
  });
}

function renderWorkspaceDetailPage(options = {}) {
  const workspace = options.workspace || null;
  const flash = options.flash || '';

  if (!workspace) {
    return renderAppLayout({
      title: 'Super Admin',
      activeNav: 'super-admin',
      isSuperAdmin: true,
      content: '<div style="padding:32px;color:#fff;">Workspace not found.</div>'
    });
  }

  return renderAppLayout({
    title: `${workspace.name} · Super Admin`,
    activeNav: 'super-admin',
    isSuperAdmin: true,
    styles: `
      :root {
        color-scheme: light;
        --sa-bg: #eef1f6;
        --sa-card: #ffffff;
        --sa-border: #dce3ee;
        --sa-text: #0f172a;
        --sa-muted: #64748b;
        --sa-accent: #0f766e;
        --sa-accent-soft: rgba(15, 118, 110, 0.1);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top right, rgba(15, 118, 110, 0.14), transparent 24%),
          linear-gradient(180deg, #f4f7fb 0%, #edf1f7 100%);
        color: var(--sa-text);
      }
      .sa-page {
        min-height: 100vh;
        padding: 28px;
        display: grid;
        gap: 20px;
      }
      .sa-topbar,
      .sa-card {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid var(--sa-border);
        border-radius: 24px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
      }
      .sa-topbar {
        padding: 24px 26px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 18px;
      }
      .sa-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--sa-accent-soft);
        color: var(--sa-accent);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .sa-topbar h1 {
        margin: 14px 0 6px;
        font-size: 32px;
        line-height: 1;
        letter-spacing: -0.04em;
      }
      .sa-topbar p {
        margin: 0;
        color: var(--sa-muted);
      }
      .sa-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
        gap: 20px;
      }
      .sa-card {
        padding: 20px;
      }
      .sa-section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }
      .sa-section-head h2 {
        margin: 0;
        font-size: 18px;
        letter-spacing: -0.03em;
      }
      .sa-meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .sa-meta {
        padding: 14px;
        border-radius: 18px;
        background: #f8fafc;
        border: 1px solid #e5eaf1;
      }
      .sa-meta small {
        display: block;
        color: var(--sa-muted);
        margin-bottom: 7px;
      }
      .sa-meta strong {
        display: block;
        font-size: 16px;
      }
      .sa-list {
        display: grid;
        gap: 10px;
      }
      .sa-site-row {
        padding: 14px;
        border: 1px solid #e5eaf1;
        border-radius: 18px;
        background: #fbfcfe;
      }
      .sa-site-row strong,
      .sa-site-row span,
      .sa-site-row small {
        display: block;
      }
      .sa-site-row span,
      .sa-site-row small {
        color: var(--sa-muted);
      }
      .sa-form {
        display: grid;
        gap: 14px;
      }
      .sa-field {
        display: grid;
        gap: 7px;
      }
      .sa-field label {
        font-size: 12px;
        font-weight: 700;
        color: var(--sa-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .sa-field input,
      .sa-field select {
        min-height: 46px;
        border-radius: 14px;
        border: 1px solid var(--sa-border);
        background: #fff;
        padding: 0 14px;
        font: inherit;
      }
      .sa-actions {
        display: flex;
        gap: 10px;
      }
      .sa-btn,
      .sa-btn-secondary {
        min-height: 46px;
        padding: 0 16px;
        border-radius: 14px;
        border: 1px solid var(--sa-border);
        font-weight: 700;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .sa-btn {
        background: #0f172a;
        color: #fff;
        border-color: #0f172a;
      }
      .sa-btn-secondary {
        background: #fff;
        color: var(--sa-text);
      }
      .sa-flash {
        padding: 12px 14px;
        border-radius: 14px;
        background: #e8fff7;
        color: #0f766e;
        font-weight: 700;
      }
      @media (max-width: 1100px) {
        .sa-grid,
        .sa-meta-grid {
          grid-template-columns: 1fr;
        }
        .sa-page {
          padding: 18px;
        }
      }
    `,
    content: `
      <div class="sa-page">
        <section class="sa-topbar">
          <div>
            <a class="sa-btn-secondary" href="/super-admin">Back to workspaces</a>
            <div>
              <span class="sa-eyebrow">Internal only</span>
              <h1>${escapeHtml(workspace.name)}</h1>
              <p>${escapeHtml(workspace.id)}${workspace.owner?.email ? ` · owner ${escapeHtml(workspace.owner.email)}` : ''}</p>
            </div>
          </div>
        </section>

        ${flash ? `<div class="sa-flash">${escapeHtml(flash)}</div>` : ''}

        <section class="sa-grid">
          <div class="sa-card">
            <div class="sa-section-head">
              <h2>Workspace overview</h2>
            </div>
            <div class="sa-meta-grid">
              <div class="sa-meta"><small>Owner</small><strong>${escapeHtml(workspace.owner?.email || '—')}</strong></div>
              <div class="sa-meta"><small>Effective plan</small><strong>${escapeHtml(workspace.planLabel)}</strong></div>
              <div class="sa-meta"><small>Subscription status</small><strong>${escapeHtml(workspace.subscriptionStatus)}</strong></div>
              <div class="sa-meta"><small>Current period end</small><strong>${escapeHtml(formatDateTime(workspace.currentPeriodEnd))}</strong></div>
              <div class="sa-meta"><small>Trial end</small><strong>${escapeHtml(formatDateTime(workspace.trialEndsAt))}</strong></div>
              <div class="sa-meta"><small>Recent activity</small><strong>${escapeHtml(formatDateTime(workspace.lastActivityAt))}</strong></div>
              <div class="sa-meta"><small>Sites</small><strong>${workspace.siteCount}</strong></div>
              <div class="sa-meta"><small>Users / Operators</small><strong>${workspace.usersCount} / ${workspace.operatorsCount}</strong></div>
            </div>

            <div class="sa-section-head" style="margin-top:20px;">
              <h2>Sites</h2>
            </div>
            <div class="sa-list">
              ${workspace.sites.length ? workspace.sites.map((site) => `
                <article class="sa-site-row">
                  <strong>${escapeHtml(site.name)}</strong>
                  <span>${escapeHtml(site.primaryDomain || site.domain || 'No domain')}</span>
                  <small>Last seen: ${escapeHtml(formatDateTime(site.lastSeenAt))} · ${site.isOnline ? 'online' : 'offline'}</small>
                </article>
              `).join('') : '<div class="sa-site-row"><strong>No sites yet</strong><span>This workspace has no connected sites.</span></div>'}
            </div>
          </div>

          <aside class="sa-card">
            <div class="sa-section-head">
              <h2>Manual controls</h2>
            </div>
            <form class="sa-form" method="post" action="/super-admin/workspaces/${encodeURIComponent(workspace.id)}">
              <div class="sa-field">
                <label for="manualPlanOverride">Change plan</label>
                <select id="manualPlanOverride" name="manualPlanOverride">
                  <option value="">Use system plan (${escapeHtml(workspace.workspace.plan)})</option>
                  ${['basic', 'pro', 'business'].map((value) => `
                    <option value="${value}"${workspace.workspace.manualPlanOverride === value ? ' selected' : ''}>${value}</option>
                  `).join('')}
                </select>
              </div>

              <div class="sa-field">
                <label for="manualSubscriptionStatus">Manual subscription status</label>
                <select id="manualSubscriptionStatus" name="manualSubscriptionStatus">
                  <option value="">Use system status (${escapeHtml(workspace.workspace.subscriptionStatus)})</option>
                  ${['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'canceled', 'manual', 'gifted'].map((value) => `
                    <option value="${value}"${workspace.workspace.manualSubscriptionStatus === value ? ' selected' : ''}>${value}</option>
                  `).join('')}
                </select>
              </div>

              <div class="sa-field">
                <label for="manualCurrentPeriodEnd">Extend subscription date manually</label>
                <input id="manualCurrentPeriodEnd" type="date" name="manualCurrentPeriodEnd" value="${escapeHtml(formatDateValue(workspace.workspace.manualCurrentPeriodEnd))}" />
              </div>

              <div class="sa-field">
                <label for="giftedReason">Gifted / manual reason</label>
                <input id="giftedReason" type="text" name="giftedReason" value="${escapeHtml(workspace.workspace.giftedReason || '')}" placeholder="gifted for pilot / manual owner override" />
              </div>

              <div class="sa-actions">
                <button class="sa-btn" type="submit">Save changes</button>
                <a class="sa-btn-secondary" href="/super-admin/workspaces/${encodeURIComponent(workspace.id)}">Reset</a>
              </div>
            </form>
          </aside>
        </section>
      </div>
    `
  });
}

module.exports = {
  renderDashboardPage,
  renderWorkspaceDetailPage
};
