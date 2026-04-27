const { renderAppLayout } = require('./app-layout');

function renderDashboardPage() {
  return renderAppLayout({
    title: 'Super Admin',
    activeNav: 'super-admin',
    isSuperAdmin: true,
    styles: `
      :root {
        --sa-bg: #f4f6fb;
        --sa-panel: #ffffff;
        --sa-line: #dfe6f0;
        --sa-text: #111827;
        --sa-muted: #667085;
        --sa-accent: #0f766e;
        --sa-dark: #111827;
      }
      body { margin: 0; background: var(--sa-bg); color: var(--sa-text); }
      .sa-page { min-height: 100vh; display: grid; grid-template-columns: 228px minmax(0, 1fr); }
      .sa-sidebar { background: #111827; color: #fff; padding: 24px 18px; display: grid; align-content: start; gap: 18px; }
      .sa-brand { font-size: 22px; font-weight: 800; letter-spacing: 0; }
      .sa-tabs { display: grid; gap: 8px; }
      .sa-tab { min-height: 42px; border: 0; background: transparent; color: #cbd5e1; text-align: left; padding: 0 12px; border-radius: 8px; font: inherit; font-weight: 700; cursor: pointer; }
      .sa-tab.active { background: #263244; color: #fff; }
      .sa-main { padding: 26px; display: grid; gap: 18px; align-content: start; }
      .sa-top { display: flex; justify-content: space-between; align-items: end; gap: 16px; }
      .sa-top h1 { margin: 0; font-size: 32px; letter-spacing: 0; }
      .sa-top p { margin: 6px 0 0; color: var(--sa-muted); }
      .sa-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
      .sa-card { background: var(--sa-panel); border: 1px solid var(--sa-line); border-radius: 8px; padding: 16px; }
      .sa-card small { color: var(--sa-muted); font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
      .sa-card strong { display: block; margin-top: 10px; font-size: 24px; }
      .sa-toolbar { background: var(--sa-panel); border: 1px solid var(--sa-line); border-radius: 8px; padding: 14px; display: grid; grid-template-columns: minmax(240px, 1fr) 150px 170px 170px; gap: 10px; }
      .sa-input, .sa-select { min-height: 42px; border: 1px solid var(--sa-line); border-radius: 8px; padding: 0 12px; font: inherit; background: #fff; color: var(--sa-text); }
      .sa-table-wrap { background: var(--sa-panel); border: 1px solid var(--sa-line); border-radius: 8px; overflow: auto; }
      table { width: 100%; border-collapse: collapse; min-width: 1120px; }
      th, td { padding: 13px 14px; border-bottom: 1px solid #edf1f6; text-align: left; vertical-align: middle; font-size: 14px; }
      th { color: var(--sa-muted); font-size: 12px; text-transform: uppercase; letter-spacing: .06em; background: #fbfcff; }
      .sa-sub { color: var(--sa-muted); font-size: 12px; margin-top: 3px; }
      .sa-pill { display: inline-flex; align-items: center; min-height: 26px; padding: 0 9px; border-radius: 999px; background: #edf2f7; color: #344054; font-size: 12px; font-weight: 800; }
      .sa-pill.ok { background: #dcfce7; color: #166534; }
      .sa-pill.warn { background: #fef3c7; color: #92400e; }
      .sa-btn { min-height: 38px; border: 1px solid var(--sa-dark); background: var(--sa-dark); color: #fff; border-radius: 8px; padding: 0 12px; font: inherit; font-weight: 800; cursor: pointer; }
      .sa-btn.light { background: #fff; color: var(--sa-dark); border-color: var(--sa-line); }
      .sa-section { display: none; gap: 16px; }
      .sa-section.active { display: grid; }
      .sa-provider-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .sa-provider-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; background: #fff; border: 1px solid var(--sa-line); border-radius: 8px; padding: 14px; }
      .sa-drawer { position: fixed; inset: 0; display: none; background: rgba(15, 23, 42, .42); z-index: 20; }
      .sa-drawer.open { display: block; }
      .sa-drawer-panel { margin-left: auto; width: min(720px, 100vw); height: 100%; background: #fff; padding: 22px; overflow: auto; display: grid; gap: 16px; align-content: start; }
      .sa-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .sa-box { border: 1px solid var(--sa-line); border-radius: 8px; padding: 12px; background: #fbfcff; }
      .sa-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .sa-action-form { display: grid; grid-template-columns: minmax(120px, 1fr) minmax(140px, 1fr) auto; gap: 8px; }
      .sa-list { display: grid; gap: 8px; }
      .sa-list-row { border: 1px solid var(--sa-line); border-radius: 8px; padding: 10px 12px; }
      @media (max-width: 980px) {
        .sa-page { grid-template-columns: 1fr; }
        .sa-sidebar { position: sticky; top: 0; z-index: 5; }
        .sa-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .sa-grid, .sa-provider-grid, .sa-detail-grid, .sa-toolbar, .sa-action-form { grid-template-columns: 1fr; }
      }
    `,
    content: `
      <div class="sa-page">
        <aside class="sa-sidebar">
          <div class="sa-brand">Super Admin</div>
          <nav class="sa-tabs">
            <button class="sa-tab active" data-tab="overview">Overview</button>
            <button class="sa-tab" data-tab="workspaces">Workspaces</button>
            <button class="sa-tab" data-tab="providers">AI Providers</button>
            <button class="sa-tab" data-tab="tokens">Token Usage</button>
            <button class="sa-tab" data-tab="audit">Audit Log</button>
          </nav>
        </aside>
        <main class="sa-main">
          <div class="sa-top">
            <div><h1 id="saTitle">Overview</h1><p>Platform-wide customers, subscriptions, AI usage, and guarded controls.</p></div>
            <button class="sa-btn light" id="refreshBtn" type="button">Refresh</button>
          </div>

          <section class="sa-section active" data-section="overview">
            <div class="sa-grid" id="overviewGrid"></div>
          </section>

          <section class="sa-section" data-section="workspaces">
            <div class="sa-toolbar">
              <input class="sa-input" id="searchInput" type="search" placeholder="Search workspace name or owner email" />
              <select class="sa-select" id="planFilter"><option value="">All plans</option><option value="basic">Starter</option><option value="pro">Growth</option><option value="business">Scale</option></select>
              <select class="sa-select" id="statusFilter"><option value="">All statuses</option><option value="active">Active</option><option value="trialing">Trialing</option><option value="past_due">Past due</option><option value="canceled">Canceled</option></select>
              <select class="sa-select" id="aiLimitFilter"><option value="">All AI balances</option><option value="reached">AI limit reached</option><option value="ok">AI balance ok</option></select>
            </div>
            <div class="sa-table-wrap"><table><thead><tr><th>Workspace</th><th>Owner email</th><th>Plan</th><th>Subscription</th><th>AI</th><th>Sites</th><th>Users</th><th>Chats</th><th>Included tokens</th><th>Purchased tokens</th><th>Used tokens</th><th>Remaining tokens</th><th>Usage %</th><th>Last activity</th><th>Actions</th></tr></thead><tbody id="workspaceRows"></tbody></table></div>
          </section>

          <section class="sa-section" data-section="providers">
            <div class="sa-provider-grid" id="providerGrid"></div>
          </section>

          <section class="sa-section" data-section="tokens">
            <div class="sa-table-wrap"><table><thead><tr><th>Workspace</th><th>Plan</th><th>AI</th><th>Included</th><th>Purchased</th><th>Used</th><th>Remaining</th><th>Usage %</th></tr></thead><tbody id="tokenRows"></tbody></table></div>
          </section>

          <section class="sa-section" data-section="audit">
            <div class="sa-table-wrap"><table><thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Workspace</th><th>Payload</th></tr></thead><tbody id="auditRows"></tbody></table></div>
          </section>
        </main>
      </div>

      <div class="sa-drawer" id="drawer">
        <div class="sa-drawer-panel">
          <div class="sa-top"><div><h1 id="drawerTitle">Workspace</h1><p id="drawerSub"></p></div><button class="sa-btn light" id="closeDrawer" type="button">Close</button></div>
          <div class="sa-detail-grid" id="detailGrid"></div>
          <div class="sa-card">
            <small>Actions</small>
            <div class="sa-list" style="margin-top:12px;">
              <form class="sa-action-form" id="addTokensForm"><input class="sa-input" name="amount" type="number" min="1" placeholder="100000" /><input class="sa-input" name="reason" placeholder="Manual credit reason" /><button class="sa-btn" type="submit">Add tokens</button></form>
              <form class="sa-action-form" id="changePlanForm"><select class="sa-select" name="plan"><option value="basic">Starter</option><option value="pro">Growth</option><option value="business">Scale</option></select><span></span><button class="sa-btn" type="submit">Change plan</button></form>
              <form class="sa-action-form" id="extendForm"><input class="sa-input" name="days" type="number" min="1" placeholder="30" /><span></span><button class="sa-btn" type="submit">Extend subscription</button></form>
              <form class="sa-action-form" id="disableAiForm"><select class="sa-select" name="disabled"><option value="true">Disable AI</option><option value="false">Enable AI</option></select><input class="sa-input" name="reason" placeholder="Reason" /><button class="sa-btn" type="submit">Save AI status</button></form>
            </div>
          </div>
          <div class="sa-card"><small>Members</small><div class="sa-list" id="memberList" style="margin-top:12px;"></div></div>
          <div class="sa-card"><small>Sites</small><div class="sa-list" id="siteList" style="margin-top:12px;"></div></div>
          <div class="sa-card"><small>Recent Token Usage</small><div class="sa-list" id="usageList" style="margin-top:12px;"></div></div>
        </div>
      </div>
    `,
    scripts: `
      <script>
        (function () {
          const state = { workspaces: [], selectedWorkspaceId: '' };
          const fmt = new Intl.NumberFormat();
          const byId = (id) => document.getElementById(id);
          const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
          const date = (value) => value ? new Date(String(value).replace(' ', 'T') + 'Z').toLocaleString() : '-';
          async function api(url, options) {
            const res = await fetch(url, options);
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.ok === false) throw new Error(data.message || 'Request failed');
            return data;
          }
          function activate(tab) {
            document.querySelectorAll('.sa-tab').forEach((el) => el.classList.toggle('active', el.dataset.tab === tab));
            document.querySelectorAll('.sa-section').forEach((el) => el.classList.toggle('active', el.dataset.section === tab));
            byId('saTitle').textContent = ({ overview: 'Overview', workspaces: 'Workspaces', providers: 'AI Providers', tokens: 'Token Usage', audit: 'Audit Log' })[tab] || 'Super Admin';
          }
          function renderOverview(data) {
            const cards = [
              ['Users', data.totalUsers], ['Workspaces', data.totalWorkspaces], ['Active paid workspaces', data.activeSubscriptions],
              ['Total AI tokens used', data.totalTokensUsed], ['Conversations', data.totalConversations], ['Sites', data.totalSites]
            ];
            byId('overviewGrid').innerHTML = cards.map(([label, value]) => '<article class="sa-card"><small>' + esc(label) + '</small><strong>' + fmt.format(value || 0) + '</strong></article>').join('');
          }
          function renderWorkspaces(items) {
            state.workspaces = items;
            byId('workspaceRows').innerHTML = items.map((w) => '<tr><td><strong>' + esc(w.workspaceName) + '</strong><div class="sa-sub">' + esc(w.workspaceSlug || w.workspaceId) + '</div></td><td>' + esc(w.ownerEmail || '-') + '</td><td><span class="sa-pill">' + esc(w.planDisplayName || w.planLabel || w.plan) + '</span></td><td>' + esc(w.subscriptionStatus || '-') + '</td><td>' + (w.aiEnabled ? '<span class="sa-pill ok">enabled</span>' : '<span class="sa-pill">disabled</span>') + '</td><td>' + fmt.format(w.sitesCount || 0) + '</td><td>' + fmt.format(w.usersCount || 0) + '</td><td>' + fmt.format(w.conversationsCount || 0) + '</td><td>' + fmt.format(w.includedTokensMonthly || 0) + '</td><td>' + fmt.format(w.purchasedTokens || 0) + '</td><td>' + fmt.format(w.usedTokensCurrentPeriod || 0) + '</td><td>' + fmt.format(w.remainingTokens || 0) + '</td><td><span class="sa-pill ' + (w.usagePercent >= 90 ? 'warn' : 'ok') + '">' + esc(w.usagePercent || 0) + '%</span></td><td>' + esc(date(w.lastSeenAt)) + '</td><td><button class="sa-btn light" data-open="' + esc(w.workspaceId) + '">Open</button></td></tr>').join('');
            byId('tokenRows').innerHTML = items.map((w) => '<tr><td><strong>' + esc(w.workspaceName) + '</strong></td><td>' + esc(w.planDisplayName || w.planLabel || w.plan) + '</td><td>' + (w.aiEnabled ? '<span class="sa-pill ok">enabled</span>' : '<span class="sa-pill">disabled</span>') + '</td><td>' + fmt.format(w.includedTokensMonthly || 0) + '</td><td>' + fmt.format(w.purchasedTokens || 0) + '</td><td>' + fmt.format(w.usedTokensCurrentPeriod || 0) + '</td><td>' + fmt.format(w.remainingTokens || 0) + '</td><td>' + esc(w.usagePercent || 0) + '%</td></tr>').join('');
          }
          function renderProviders(data) {
            byId('providerGrid').innerHTML = Object.values(data).map((item) => '<div class="sa-provider-row"><div><strong>' + esc(item.label) + '</strong><div class="sa-sub">' + esc(item.isSecret ? (item.maskedValue || 'Not configured') : (item.value || 'Not configured')) + '</div></div><span class="sa-pill ' + (item.configured ? 'ok' : '') + '">' + (item.configured ? 'Configured' : 'Not configured') + '</span></div>').join('');
          }
          function renderAudit(items) {
            byId('auditRows').innerHTML = items.map((item) => '<tr><td>' + esc(date(item.createdAt)) + '</td><td>' + esc(item.adminEmail || item.adminUserId) + '</td><td>' + esc(item.action) + '</td><td>' + esc(item.workspaceName || item.workspaceId || '-') + '</td><td><code>' + esc(JSON.stringify(item.payload || {})) + '</code></td></tr>').join('');
          }
          async function loadAll() {
            const params = new URLSearchParams();
            if (byId('searchInput').value) params.set('q', byId('searchInput').value);
            if (byId('planFilter').value) params.set('plan', byId('planFilter').value);
            if (byId('statusFilter').value) params.set('status', byId('statusFilter').value);
            if (byId('aiLimitFilter').value) params.set('aiLimit', byId('aiLimitFilter').value);
            const [overview, workspaces, providers, audit] = await Promise.all([
              api('/api/super-admin/overview'),
              api('/api/super-admin/workspaces?' + params.toString()),
              api('/api/super-admin/ai-providers'),
              api('/api/super-admin/audit-log')
            ]);
            renderOverview(overview); renderWorkspaces(workspaces); renderProviders(providers); renderAudit(audit);
          }
          async function openWorkspace(id) {
            const detail = await api('/api/super-admin/workspaces/' + encodeURIComponent(id));
            state.selectedWorkspaceId = id;
            byId('drawerTitle').textContent = detail.workspaceName;
            byId('drawerSub').textContent = (detail.ownerEmail || '-') + ' · ' + (detail.planDisplayName || detail.planLabel || detail.plan) + ' · ' + detail.subscriptionStatus;
            const rows = [['Owner', detail.ownerEmail || '-'], ['Plan', detail.planDisplayName || detail.planLabel || detail.plan], ['Subscription', detail.subscriptionStatus], ['AI', detail.aiEnabled ? 'enabled' : 'disabled'], ['Sites', detail.sitesCount], ['Users', detail.usersCount], ['Chats', detail.conversationsCount], ['Included tokens', fmt.format(detail.includedTokensMonthly || 0)], ['Purchased tokens', fmt.format(detail.purchasedTokens || 0)], ['Used tokens', fmt.format(detail.usedTokensCurrentPeriod || 0)], ['Remaining tokens', fmt.format(detail.remainingTokens || 0)]];
            byId('detailGrid').innerHTML = rows.map(([k, v]) => '<div class="sa-box"><small>' + esc(k) + '</small><strong>' + esc(v) + '</strong></div>').join('');
            byId('memberList').innerHTML = (detail.members || []).map((m) => '<div class="sa-list-row"><strong>' + esc(m.email || m.name || m.userId) + '</strong><div class="sa-sub">' + esc(m.role) + '</div></div>').join('') || '<div class="sa-sub">No members</div>';
            byId('siteList').innerHTML = (detail.sites || []).map((s) => '<div class="sa-list-row"><strong>' + esc(s.name) + '</strong><div class="sa-sub">' + esc(s.primaryDomain || s.domain || 'No domain') + ' · last seen ' + esc(date(s.lastSeenAt)) + '</div></div>').join('') || '<div class="sa-sub">No sites</div>';
            byId('usageList').innerHTML = (detail.recentTokenUsage || []).map((u) => '<div class="sa-list-row"><strong>' + fmt.format(u.total_tokens || 0) + ' tokens</strong><div class="sa-sub">' + esc(u.provider || '-') + ' · ' + esc(u.model || '-') + ' · ' + esc(date(u.created_at)) + '</div></div>').join('') || '<div class="sa-sub">No token usage yet</div>';
            byId('drawer').classList.add('open');
          }
          async function postAction(path, body) {
            await api('/api/super-admin/workspaces/' + encodeURIComponent(state.selectedWorkspaceId) + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            await loadAll();
            await openWorkspace(state.selectedWorkspaceId);
          }
          document.querySelector('.sa-tabs').addEventListener('click', (event) => { const btn = event.target.closest('.sa-tab'); if (btn) activate(btn.dataset.tab); });
          byId('workspaceRows').addEventListener('click', (event) => { const btn = event.target.closest('[data-open]'); if (btn) openWorkspace(btn.dataset.open); });
          byId('closeDrawer').addEventListener('click', () => byId('drawer').classList.remove('open'));
          byId('refreshBtn').addEventListener('click', loadAll);
          ['searchInput', 'planFilter', 'statusFilter', 'aiLimitFilter'].forEach((id) => byId(id).addEventListener('input', loadAll));
          byId('addTokensForm').addEventListener('submit', (event) => { event.preventDefault(); postAction('/add-tokens', { amount: Number(event.target.amount.value || 0), reason: event.target.reason.value }); });
          byId('changePlanForm').addEventListener('submit', (event) => { event.preventDefault(); postAction('/change-plan', { plan: event.target.plan.value }); });
          byId('extendForm').addEventListener('submit', (event) => { event.preventDefault(); postAction('/extend-subscription', { days: Number(event.target.days.value || 0) }); });
          byId('disableAiForm').addEventListener('submit', (event) => { event.preventDefault(); postAction('/disable-ai', { disabled: event.target.disabled.value === 'true', reason: event.target.reason.value }); });
          loadAll().then(() => { const id = new URLSearchParams(location.search).get('workspace'); if (id) openWorkspace(id); });
        })();
      </script>
    `
  });
}

module.exports = {
  renderDashboardPage,
  renderWorkspaceDetailPage: renderDashboardPage
};
