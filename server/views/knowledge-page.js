const { renderAppLayout } = require('./app-layout');

function renderKnowledgePage() {
  return renderAppLayout({
    title: 'Knowledge',
    activeNav: 'knowledge',
    styles: `
      :root {
        color-scheme: light;
        --bg: #f5f4f7;
        --panel: #ffffff;
        --panel-soft: #faf9fc;
        --border: #eeedf0;
        --border-strong: #dddbe6;
        --text: #0d0e14;
        --muted: #6b6f80;
        --muted-soft: #a8aab8;
        --accent: #3b5bdb;
        --accent-soft: #eef2ff;
        --accent-border: #c5d0fa;
        --success: #2f9e44;
        --warning: #f59f00;
        --danger: #e03131;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: 'Plus Jakarta Sans', Manrope, Inter, ui-sans-serif, system-ui, sans-serif;
      }
      .knowledge-page {
        min-height: 100vh;
        display: grid;
        grid-template-rows: auto 1fr;
      }
      .knowledge-topbar {
        background: #fff;
        border-bottom: 1px solid var(--border);
        padding: 14px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .knowledge-topbar-copy {
        display: grid;
        gap: 4px;
      }
      .knowledge-topbar-copy h1 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .knowledge-topbar-copy p {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
      }
      .knowledge-topbar-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .knowledge-shell {
        padding: 24px;
        display: grid;
        gap: 18px;
        align-content: start;
      }
      .knowledge-meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .meta-card,
      .knowledge-card,
      .knowledge-tab-panel {
        background: var(--panel);
        border: 1px solid var(--border);
        box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04);
      }
      .meta-card {
        border-radius: 16px;
        padding: 14px 16px;
        display: grid;
        gap: 4px;
      }
      .meta-card label {
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .meta-card strong {
        font-size: 15px;
        font-weight: 700;
      }
      .knowledge-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .knowledge-tabs {
        display: inline-flex;
        padding: 4px;
        border-radius: 999px;
        background: var(--panel-soft);
        border: 1px solid var(--border);
        gap: 4px;
      }
      .knowledge-tab {
        border: 0;
        background: transparent;
        color: var(--muted);
        border-radius: 999px;
        padding: 9px 14px;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .knowledge-tab.active {
        background: var(--accent-soft);
        color: var(--accent);
      }
      .knowledge-tab-panel {
        border-radius: 18px;
        padding: 18px;
        display: grid;
        gap: 18px;
      }
      .knowledge-tab-panel[hidden] {
        display: none !important;
      }
      .knowledge-grid {
        display: grid;
        grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
        gap: 18px;
      }
      .knowledge-card {
        border-radius: 16px;
        padding: 16px;
        display: grid;
        gap: 14px;
      }
      .knowledge-card-head {
        display: grid;
        gap: 4px;
      }
      .knowledge-card-head strong {
        font-size: 15px;
        font-weight: 700;
      }
      .knowledge-card-head small {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.5;
      }
      .field-grid {
        display: grid;
        gap: 12px;
      }
      .field-row {
        display: grid;
        gap: 6px;
      }
      .field-row.two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .field-row label {
        font-size: 12px;
        font-weight: 600;
      }
      input, select, textarea, button {
        font: inherit;
      }
      input, select, textarea {
        width: 100%;
        min-height: 40px;
        border-radius: 12px;
        border: 1px solid var(--border-strong);
        background: #fff;
        color: var(--text);
        padding: 10px 12px;
      }
      textarea {
        min-height: 120px;
        resize: vertical;
      }
      .btn-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }
      .btn, .ghost-btn {
        min-height: 40px;
        border-radius: 12px;
        padding: 9px 14px;
        border: 1px solid var(--border-strong);
        background: #fff;
        color: var(--text);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn.primary {
        background: var(--accent);
        color: #fff;
        border-color: var(--accent);
      }
      .btn.danger {
        border-color: rgba(224,49,49,.22);
        color: var(--danger);
      }
      .ghost-btn {
        min-height: 34px;
        padding: 7px 10px;
        font-size: 11px;
      }
      .status-line {
        color: var(--muted);
        font-size: 12px;
      }
      .status-line.success {
        color: var(--success);
      }
      .status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        border: 1px solid var(--border);
        background: var(--panel-soft);
        color: var(--muted);
      }
      .status-badge.pending { background: #fff9db; color: #8a6700; border-color: #ffe066; }
      .status-badge.running { background: #eef2ff; color: var(--accent); border-color: var(--accent-border); }
      .status-badge.completed { background: #ebfbee; color: var(--success); border-color: rgba(47,158,68,.24); }
      .status-badge.failed { background: #fff5f5; color: var(--danger); border-color: rgba(224,49,49,.22); }
      .list-stack {
        display: grid;
        gap: 12px;
      }
      .item-card {
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 14px;
        display: grid;
        gap: 10px;
        background: linear-gradient(180deg, #fff 0%, #fcfcfe 100%);
      }
      .item-card-head,
      .item-card-meta {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
      }
      .item-card-head strong {
        font-size: 14px;
        font-weight: 700;
      }
      .item-card-head small,
      .item-card-copy,
      .item-card-url,
      .item-card-meta span {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.5;
      }
      .item-card-copy {
        white-space: pre-wrap;
      }
      .item-card-url {
        word-break: break-word;
      }
      .item-card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .tag {
        display: inline-flex;
        align-items: center;
        min-height: 26px;
        padding: 0 10px;
        border-radius: 999px;
        background: var(--panel-soft);
        border: 1px solid var(--border);
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
      }
      .empty-state {
        border: 1px dashed var(--border-strong);
        border-radius: 14px;
        padding: 18px;
        text-align: center;
        color: var(--muted);
        background: #fff;
        font-size: 13px;
      }
      details.imported-pages {
        border-top: 1px solid var(--border);
        padding-top: 10px;
      }
      details.imported-pages summary {
        cursor: pointer;
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
      }
      .imported-pages-list {
        margin-top: 10px;
        display: grid;
        gap: 8px;
      }
      .imported-page-item {
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 10px;
        background: var(--panel-soft);
      }
      .imported-page-item strong {
        display: block;
        font-size: 12px;
        margin-bottom: 4px;
      }
      .imported-page-item span {
        color: var(--muted);
        font-size: 11px;
        display: block;
        margin-bottom: 6px;
        word-break: break-word;
      }
      .imported-page-item p {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.45;
      }
      @media (max-width: 1080px) {
        .knowledge-meta,
        .knowledge-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
    content: `
      <div class="knowledge-page">
        <header class="knowledge-topbar">
          <div class="knowledge-topbar-copy">
            <h1>Knowledge</h1>
            <p>Separate imported knowledge from manually maintained rules so AI, reports, and future operator assistance can trust the right source.</p>
          </div>
          <div class="knowledge-topbar-actions">
            <select id="knowledgeSiteSelect" aria-label="Select site"></select>
          </div>
        </header>

        <div class="knowledge-shell">
          <section class="knowledge-meta">
            <div class="meta-card">
              <label>Workspace</label>
              <strong id="knowledgeWorkspaceName">Loading…</strong>
            </div>
            <div class="meta-card">
              <label>Current site</label>
              <strong id="knowledgeSiteName">Loading…</strong>
            </div>
            <div class="meta-card">
              <label>Knowledge priority</label>
              <strong>Manual → Import → Model</strong>
            </div>
          </section>

          <section class="knowledge-toolbar">
            <div class="knowledge-tabs" id="knowledgeTabs">
              <button type="button" class="knowledge-tab active" data-knowledge-tab="import">Import</button>
              <button type="button" class="knowledge-tab" data-knowledge-tab="manual">Manual</button>
            </div>
            <div id="knowledgePageStatus" class="status-line">Knowledge is always scoped to the active site.</div>
          </section>

          <section class="knowledge-tab-panel" data-knowledge-panel="import">
            <div class="knowledge-grid">
              <div class="knowledge-card">
                <div class="knowledge-card-head">
                  <strong>Add import source</strong>
                  <small>Create a source for website crawling now. Document imports can be configured already, but runs remain explicitly website-first until a later step.</small>
                </div>
                <div class="field-grid">
                  <div class="field-row">
                    <label for="importSourceName">Source name</label>
                    <input id="importSourceName" type="text" placeholder="Main website knowledge" />
                  </div>
                  <div class="field-row">
                    <label for="importSourceType">Source type</label>
                    <select id="importSourceType">
                      <option value="website">Website</option>
                      <option value="document">Document</option>
                    </select>
                  </div>
                  <div class="field-row">
                    <label for="importStartingUrl">Starting URL</label>
                    <input id="importStartingUrl" type="url" placeholder="https://example.com" />
                  </div>
                  <div class="field-row two">
                    <div>
                      <label for="importFrequency">Crawl frequency</label>
                      <select id="importFrequency">
                        <option value="manual">Manual</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label for="importMaxPages">Max pages</label>
                      <input id="importMaxPages" type="number" min="1" max="100" value="10" />
                    </div>
                  </div>
                  <div class="field-row">
                    <label for="importCrawlDepth">Crawl depth</label>
                    <input id="importCrawlDepth" type="number" min="0" max="4" value="1" />
                  </div>
                </div>
                <div class="btn-row">
                  <button type="button" class="btn primary" id="createImportSourceBtn">Create source</button>
                </div>
                <div id="importStatus" class="status-line">Website imports can be run now. Document imports are scaffolded and will report honestly if not supported yet.</div>
              </div>

              <div class="knowledge-card">
                <div class="knowledge-card-head">
                  <strong>Imported sources</strong>
                  <small>Run imports manually, review page counts, and remove stale sources without mixing them with manual policy knowledge.</small>
                </div>
                <div id="importSourcesList" class="list-stack"></div>
              </div>
            </div>
          </section>

          <section class="knowledge-tab-panel" data-knowledge-panel="manual" hidden>
            <div class="knowledge-grid">
              <div class="knowledge-card">
                <div class="knowledge-card-head">
                  <strong>Manual knowledge entry</strong>
                  <small>Use this for stable policies, rules, promises the assistant must avoid, and business facts that should always override imported text.</small>
                </div>
                <div class="field-grid">
                  <div class="field-row">
                    <label for="manualTitle">Title</label>
                    <input id="manualTitle" type="text" placeholder="Shipping policy" />
                  </div>
                  <div class="field-row two">
                    <div>
                      <label for="manualCategory">Category</label>
                      <input id="manualCategory" type="text" placeholder="policy" />
                    </div>
                    <div>
                      <label for="manualPriority">Priority</label>
                      <select id="manualPriority">
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="always_use">Always use</option>
                      </select>
                    </div>
                  </div>
                  <div class="field-row two">
                    <div>
                      <label for="manualEnabled">Enabled</label>
                      <select id="manualEnabled">
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    </div>
                    <div>
                      <label for="manualSearch">Search entries</label>
                      <input id="manualSearch" type="search" placeholder="Search title, category, content" />
                    </div>
                  </div>
                  <div class="field-row">
                    <label for="manualContent">Content</label>
                    <textarea id="manualContent" placeholder="The assistant must never promise same-day production without confirming capacity first."></textarea>
                  </div>
                </div>
                <div class="btn-row">
                  <button type="button" class="btn primary" id="saveManualEntryBtn">Save entry</button>
                  <button type="button" class="btn" id="resetManualEntryBtn">Clear form</button>
                </div>
                <div id="manualStatus" class="status-line">Manual knowledge is treated as the highest-trust source for future AI retrieval.</div>
              </div>

              <div class="knowledge-card">
                <div class="knowledge-card-head">
                  <strong>Manual entries</strong>
                  <small>Search, edit, disable, or delete stable knowledge for the current site.</small>
                </div>
                <div class="field-row">
                  <label for="manualCategoryFilter">Category filter</label>
                  <input id="manualCategoryFilter" type="text" placeholder="Filter by category" />
                </div>
                <div id="manualEntriesList" class="list-stack"></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `,
    scripts: `<script>
      (function () {
        const state = {
          activeTab: 'import',
          workspaceName: '',
          sites: [],
          selectedSiteId: '',
          manualEntries: [],
          importSources: [],
          importItemsBySource: {},
          editingManualId: '',
          loadingImportItems: {}
        };

        const siteSelectEl = document.getElementById('knowledgeSiteSelect');
        const workspaceNameEl = document.getElementById('knowledgeWorkspaceName');
        const siteNameEl = document.getElementById('knowledgeSiteName');
        const knowledgeTabsEl = document.getElementById('knowledgeTabs');
        const pageStatusEl = document.getElementById('knowledgePageStatus');
        const importPanelEl = document.querySelector('[data-knowledge-panel="import"]');
        const manualPanelEl = document.querySelector('[data-knowledge-panel="manual"]');
        const importStatusEl = document.getElementById('importStatus');
        const manualStatusEl = document.getElementById('manualStatus');
        const importSourcesListEl = document.getElementById('importSourcesList');
        const manualEntriesListEl = document.getElementById('manualEntriesList');

        const fields = {
          importSourceName: document.getElementById('importSourceName'),
          importSourceType: document.getElementById('importSourceType'),
          importStartingUrl: document.getElementById('importStartingUrl'),
          importFrequency: document.getElementById('importFrequency'),
          importMaxPages: document.getElementById('importMaxPages'),
          importCrawlDepth: document.getElementById('importCrawlDepth'),
          manualTitle: document.getElementById('manualTitle'),
          manualCategory: document.getElementById('manualCategory'),
          manualPriority: document.getElementById('manualPriority'),
          manualEnabled: document.getElementById('manualEnabled'),
          manualContent: document.getElementById('manualContent'),
          manualSearch: document.getElementById('manualSearch'),
          manualCategoryFilter: document.getElementById('manualCategoryFilter')
        };

        function escapeHtml(value) {
          return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        async function fetchJson(url, options) {
          const response = await fetch(url, options);
          const payload = await response.json();
          if (!response.ok || payload.ok === false) {
            throw new Error(payload.message || payload.error || 'Request failed');
          }
          return payload;
        }

        function setPageStatus(text, success) {
          if (!pageStatusEl) return;
          pageStatusEl.textContent = text;
          pageStatusEl.className = 'status-line' + (success ? ' success' : '');
        }

        function setImportStatus(text, success) {
          if (!importStatusEl) return;
          importStatusEl.textContent = text;
          importStatusEl.className = 'status-line' + (success ? ' success' : '');
        }

        function setManualStatus(text, success) {
          if (!manualStatusEl) return;
          manualStatusEl.textContent = text;
          manualStatusEl.className = 'status-line' + (success ? ' success' : '');
        }

        function setActiveTab(tabKey) {
          state.activeTab = tabKey === 'manual' ? 'manual' : 'import';
          Array.from(knowledgeTabsEl.querySelectorAll('[data-knowledge-tab]')).forEach(function (button) {
            const active = button.getAttribute('data-knowledge-tab') === state.activeTab;
            button.classList.toggle('active', active);
          });
          importPanelEl.hidden = state.activeTab !== 'import';
          manualPanelEl.hidden = state.activeTab !== 'manual';
        }

        function renderSiteHeader() {
          const currentSite = state.sites.find(function (site) { return site.siteId === state.selectedSiteId; }) || state.sites[0] || null;
          workspaceNameEl.textContent = state.workspaceName || 'Workspace';
          siteNameEl.textContent = currentSite ? (currentSite.name || currentSite.siteId) : 'No site selected';
          siteSelectEl.innerHTML = state.sites.map(function (site) {
            return '<option value="' + escapeHtml(site.siteId) + '">' + escapeHtml(site.name || site.siteId) + '</option>';
          }).join('');
          siteSelectEl.value = currentSite ? currentSite.siteId : '';
        }

        function renderImportSources() {
          if (!state.importSources.length) {
            importSourcesListEl.innerHTML = '<div class="empty-state">No import sources for this site yet. Add a website source to start building imported knowledge.</div>';
            return;
          }
          importSourcesListEl.innerHTML = state.importSources.map(function (source) {
            const items = Array.isArray(state.importItemsBySource[source.id]) ? state.importItemsBySource[source.id] : [];
            const pagesSummary = source.importedPageCount ? String(source.importedPageCount) + ' pages imported' : 'No pages imported yet';
            const canViewItems = source.importedPageCount > 0;
            return (
              '<article class="item-card" data-import-source="' + escapeHtml(source.id) + '">' +
                '<div class="item-card-head">' +
                  '<div>' +
                    '<strong>' + escapeHtml(source.name) + '</strong>' +
                    '<div class="item-card-url">' + escapeHtml(source.startingUrl) + '</div>' +
                  '</div>' +
                  '<span class="status-badge ' + escapeHtml(source.status) + '">' + escapeHtml(source.status.replace(/_/g, ' ')) + '</span>' +
                '</div>' +
                '<div class="item-card-tags">' +
                  '<span class="tag">' + escapeHtml(source.sourceType) + '</span>' +
                  '<span class="tag">' + escapeHtml(source.frequency) + '</span>' +
                  '<span class="tag">depth ' + escapeHtml(source.crawlDepth) + '</span>' +
                  '<span class="tag">max ' + escapeHtml(source.maxPages) + ' pages</span>' +
                  '<span class="tag">' + escapeHtml(pagesSummary) + '</span>' +
                '</div>' +
                '<div class="item-card-meta">' +
                  '<span>Last run: ' + escapeHtml(source.lastRunAt || 'Never') + '</span>' +
                  '<span>' + escapeHtml(source.lastError || '') + '</span>' +
                '</div>' +
                '<div class="btn-row">' +
                  '<button type="button" class="ghost-btn" data-import-action="run" data-source-id="' + escapeHtml(source.id) + '">Run import</button>' +
                  (canViewItems
                    ? '<button type="button" class="ghost-btn" data-import-action="toggle-items" data-source-id="' + escapeHtml(source.id) + '">' + (items.length ? 'Hide pages' : 'View pages') + '</button>'
                    : '') +
                  '<button type="button" class="ghost-btn" data-import-action="delete" data-source-id="' + escapeHtml(source.id) + '">Delete</button>' +
                '</div>' +
                (items.length
                  ? '<details class="imported-pages" open><summary>Imported pages</summary><div class="imported-pages-list">' + items.map(function (item) {
                    return '<div class="imported-page-item"><strong>' + escapeHtml(item.title || item.url) + '</strong><span>' + escapeHtml(item.url || '') + '</span><p>' + escapeHtml((item.content || '').slice(0, 240)) + '</p></div>';
                  }).join('') + '</div></details>'
                  : '') +
              '</article>'
            );
          }).join('');
        }

        function renderManualEntries() {
          if (!state.manualEntries.length) {
            manualEntriesListEl.innerHTML = '<div class="empty-state">No manual knowledge entries yet. Add policies, business rules, and controlled facts for this site.</div>';
            return;
          }
          manualEntriesListEl.innerHTML = state.manualEntries.map(function (entry) {
            return (
              '<article class="item-card" data-manual-entry="' + escapeHtml(entry.id) + '">' +
                '<div class="item-card-head">' +
                  '<div>' +
                    '<strong>' + escapeHtml(entry.title) + '</strong>' +
                    '<small>' + escapeHtml(entry.category || 'uncategorized') + '</small>' +
                  '</div>' +
                  '<span class="status-badge ' + (entry.isEnabled ? 'completed' : 'pending') + '">' + (entry.isEnabled ? 'enabled' : 'disabled') + '</span>' +
                '</div>' +
                '<div class="item-card-tags">' +
                  '<span class="tag">' + escapeHtml(entry.priority) + '</span>' +
                  '<span class="tag">' + escapeHtml(entry.category || 'general') + '</span>' +
                  '<span class="tag">Updated ' + escapeHtml(entry.updatedAt || entry.createdAt || '') + '</span>' +
                '</div>' +
                '<div class="item-card-copy">' + escapeHtml(entry.content) + '</div>' +
                '<div class="btn-row">' +
                  '<button type="button" class="ghost-btn" data-manual-action="edit" data-entry-id="' + escapeHtml(entry.id) + '">Edit</button>' +
                  '<button type="button" class="ghost-btn" data-manual-action="toggle" data-entry-id="' + escapeHtml(entry.id) + '">' + (entry.isEnabled ? 'Disable' : 'Enable') + '</button>' +
                  '<button type="button" class="ghost-btn" data-manual-action="delete" data-entry-id="' + escapeHtml(entry.id) + '">Delete</button>' +
                '</div>' +
              '</article>'
            );
          }).join('');
        }

        function resetManualForm() {
          state.editingManualId = '';
          fields.manualTitle.value = '';
          fields.manualCategory.value = '';
          fields.manualPriority.value = 'normal';
          fields.manualEnabled.value = 'true';
          fields.manualContent.value = '';
          setManualStatus('Manual knowledge is treated as the highest-trust source for future AI retrieval.', false);
        }

        async function loadSites() {
          const payload = await fetchJson('/api/admin/sites');
          state.workspaceName = payload.plan && payload.plan.workspace ? payload.plan.workspace.name : 'Workspace';
          state.sites = payload.sites || [];
          state.selectedSiteId = payload.activeSiteId || (state.sites[0] && state.sites[0].siteId) || '';
          renderSiteHeader();
        }

        async function loadManualEntries() {
          if (!state.selectedSiteId) return;
          const params = new URLSearchParams();
          params.set('siteId', state.selectedSiteId);
          if (fields.manualSearch.value.trim()) params.set('q', fields.manualSearch.value.trim());
          if (fields.manualCategoryFilter.value.trim()) params.set('category', fields.manualCategoryFilter.value.trim());
          const payload = await fetchJson('/api/admin/knowledge/manual?' + params.toString());
          state.manualEntries = payload.entries || [];
          renderManualEntries();
        }

        async function loadImportSources() {
          if (!state.selectedSiteId) return;
          const params = new URLSearchParams();
          params.set('siteId', state.selectedSiteId);
          const payload = await fetchJson('/api/admin/knowledge/import-sources?' + params.toString());
          state.importSources = payload.sources || [];
          renderImportSources();
        }

        async function selectSite(siteId) {
          await fetchJson('/api/admin/sites/' + encodeURIComponent(siteId) + '/select', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          state.selectedSiteId = siteId;
          renderSiteHeader();
          await Promise.all([loadManualEntries(), loadImportSources()]);
          setPageStatus('Knowledge context switched to the selected site.', true);
        }

        async function saveManualEntry() {
          const body = {
            siteId: state.selectedSiteId,
            title: fields.manualTitle.value.trim(),
            category: fields.manualCategory.value.trim(),
            content: fields.manualContent.value.trim(),
            priority: fields.manualPriority.value,
            isEnabled: fields.manualEnabled.value === 'true'
          };
          if (state.editingManualId) {
            await fetchJson('/api/admin/knowledge/manual/' + encodeURIComponent(state.editingManualId), {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            setManualStatus('Manual knowledge entry updated.', true);
          } else {
            await fetchJson('/api/admin/knowledge/manual', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            setManualStatus('Manual knowledge entry created.', true);
          }
          resetManualForm();
          await loadManualEntries();
        }

        async function createImportSource() {
          await fetchJson('/api/admin/knowledge/import-sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              siteId: state.selectedSiteId,
              name: fields.importSourceName.value.trim(),
              sourceType: fields.importSourceType.value,
              startingUrl: fields.importStartingUrl.value.trim(),
              frequency: fields.importFrequency.value,
              maxPages: Number(fields.importMaxPages.value) || 10,
              crawlDepth: Number(fields.importCrawlDepth.value) || 1
            })
          });
          fields.importSourceName.value = '';
          fields.importStartingUrl.value = '';
          fields.importSourceType.value = 'website';
          fields.importFrequency.value = 'manual';
          fields.importMaxPages.value = '10';
          fields.importCrawlDepth.value = '1';
          setImportStatus('Import source created.', true);
          await loadImportSources();
        }

        async function runImportSource(sourceId) {
          setImportStatus('Import running…', false);
          await fetchJson('/api/admin/knowledge/import-sources/' + encodeURIComponent(sourceId) + '/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: state.selectedSiteId })
          });
          setImportStatus('Import completed.', true);
          await loadImportSources();
        }

        async function toggleImportItems(sourceId) {
          if (state.importItemsBySource[sourceId]) {
            delete state.importItemsBySource[sourceId];
            renderImportSources();
            return;
          }
          const payload = await fetchJson('/api/admin/knowledge/import-sources/' + encodeURIComponent(sourceId) + '/items?siteId=' + encodeURIComponent(state.selectedSiteId));
          state.importItemsBySource[sourceId] = payload.items || [];
          renderImportSources();
        }

        knowledgeTabsEl.addEventListener('click', function (event) {
          const button = event.target.closest('[data-knowledge-tab]');
          if (!button) return;
          setActiveTab(button.getAttribute('data-knowledge-tab') || 'import');
        });

        siteSelectEl.addEventListener('change', function () {
          selectSite(siteSelectEl.value).catch(function (error) {
            setPageStatus(error.message || 'Failed to switch site.', false);
          });
        });

        document.getElementById('createImportSourceBtn').addEventListener('click', function () {
          createImportSource().catch(function (error) {
            setImportStatus(error.message || 'Failed to create import source.', false);
          });
        });

        document.getElementById('saveManualEntryBtn').addEventListener('click', function () {
          saveManualEntry().catch(function (error) {
            setManualStatus(error.message || 'Failed to save manual entry.', false);
          });
        });

        document.getElementById('resetManualEntryBtn').addEventListener('click', function () {
          resetManualForm();
        });

        fields.manualSearch.addEventListener('input', function () {
          loadManualEntries().catch(function (error) {
            setManualStatus(error.message || 'Failed to search entries.', false);
          });
        });

        fields.manualCategoryFilter.addEventListener('input', function () {
          loadManualEntries().catch(function (error) {
            setManualStatus(error.message || 'Failed to filter entries.', false);
          });
        });

        importSourcesListEl.addEventListener('click', function (event) {
          const button = event.target.closest('[data-import-action]');
          if (!button) return;
          const action = button.getAttribute('data-import-action');
          const sourceId = button.getAttribute('data-source-id') || '';
          if (action === 'run') {
            runImportSource(sourceId).catch(function (error) {
              setImportStatus(error.message || 'Failed to run import.', false);
            });
            return;
          }
          if (action === 'delete') {
            fetchJson('/api/admin/knowledge/import-sources/' + encodeURIComponent(sourceId), {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ siteId: state.selectedSiteId })
            }).then(function () {
              delete state.importItemsBySource[sourceId];
              setImportStatus('Import source deleted.', true);
              return loadImportSources();
            }).catch(function (error) {
              setImportStatus(error.message || 'Failed to delete import source.', false);
            });
            return;
          }
          if (action === 'toggle-items') {
            toggleImportItems(sourceId).catch(function (error) {
              setImportStatus(error.message || 'Failed to load imported pages.', false);
            });
          }
        });

        manualEntriesListEl.addEventListener('click', function (event) {
          const button = event.target.closest('[data-manual-action]');
          if (!button) return;
          const action = button.getAttribute('data-manual-action');
          const entryId = button.getAttribute('data-entry-id') || '';
          const entry = state.manualEntries.find(function (item) { return item.id === entryId; });
          if (!entry) return;
          if (action === 'edit') {
            state.editingManualId = entry.id;
            fields.manualTitle.value = entry.title || '';
            fields.manualCategory.value = entry.category || '';
            fields.manualPriority.value = entry.priority || 'normal';
            fields.manualEnabled.value = entry.isEnabled ? 'true' : 'false';
            fields.manualContent.value = entry.content || '';
            setActiveTab('manual');
            setManualStatus('Editing existing entry. Save to apply changes.', false);
            return;
          }
          if (action === 'toggle') {
            fetchJson('/api/admin/knowledge/manual/' + encodeURIComponent(entry.id), {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                siteId: state.selectedSiteId,
                isEnabled: !entry.isEnabled
              })
            }).then(function () {
              setManualStatus('Manual entry updated.', true);
              return loadManualEntries();
            }).catch(function (error) {
              setManualStatus(error.message || 'Failed to update manual entry.', false);
            });
            return;
          }
          if (action === 'delete') {
            fetchJson('/api/admin/knowledge/manual/' + encodeURIComponent(entry.id), {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ siteId: state.selectedSiteId })
            }).then(function () {
              if (state.editingManualId === entry.id) {
                resetManualForm();
              }
              setManualStatus('Manual entry deleted.', true);
              return loadManualEntries();
            }).catch(function (error) {
              setManualStatus(error.message || 'Failed to delete manual entry.', false);
            });
          }
        });

        Promise.resolve()
          .then(loadSites)
          .then(function () {
            return Promise.all([loadImportSources(), loadManualEntries()]);
          })
          .then(function () {
            setPageStatus('Knowledge is loaded for the active site.', true);
          })
          .catch(function (error) {
            setPageStatus(error.message || 'Failed to load knowledge.', false);
          });
      })();
    </script>`
  });
}

module.exports = {
  renderKnowledgePage
};
