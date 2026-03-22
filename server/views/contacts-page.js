const { renderAppLayout } = require('./app-layout');

function renderContactsPage(options = {}) {
  const initialContacts = Array.isArray(options.initialContacts) ? options.initialContacts : [];
  return renderAppLayout({
    title: 'Contacts',
    activeNav: 'contacts',
    styles: `
      :root {
        color-scheme: light;
        --bg: #f5f4f7;
        --panel: #ffffff;
        --panel-soft: #fafafe;
        --panel-muted: #f7f6fb;
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
        font-family: "Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      .page {
        min-height: 100vh;
        padding: 0;
        display: grid;
        grid-template-rows: auto 1fr;
        align-content: start;
        gap: 0;
      }
      .topbar,
      .panel,
      .list-shell,
      .profile-card {
        background: var(--panel);
        border: 1px solid var(--border);
        box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04);
      }
      .topbar {
        border-radius: 0;
        border-left: none;
        border-right: none;
        border-top: none;
        min-height: 56px;
        padding: 10px 28px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }
      .topbar-left {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .topbar h1 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .topbar p {
        margin: 0;
        color: var(--muted);
        font-size: 11px;
      }
      .topbar-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .workspace {
        padding: 24px 28px 28px;
        display: grid;
        gap: 16px;
        align-content: start;
        min-height: 0;
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }
      .toolbar-main {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
      }
      .toolbar-metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .metric-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 34px;
        padding: 0 11px;
        border-radius: 999px;
        background: var(--panel);
        border: 1px solid var(--border);
      }
      .metric-pill strong {
        font-size: 12px;
        font-weight: 700;
      }
      .metric-pill span {
        color: var(--muted);
        font-size: 11px;
      }
      .toolbar-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: flex-end;
      }
      .toolbar input {
        width: min(620px, 100%);
        min-height: 40px;
        border: 1px solid var(--border-strong);
        background: var(--panel);
        color: var(--text);
        border-radius: 10px;
        padding: 9px 12px;
        font: inherit;
        box-shadow: 0 1px 2px rgba(0,0,0,.05);
      }
      .btn {
        min-height: 38px;
        border: 1px solid var(--border-strong);
        background: var(--panel);
        color: var(--text);
        border-radius: 10px;
        padding: 8px 14px;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 2px rgba(0,0,0,.05);
      }
      .btn:disabled {
        opacity: 0.62;
        cursor: wait;
        pointer-events: none;
      }
      .btn.primary {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
      }
      .panel-head {
        padding: 16px 18px 0;
      }
      .panel-head h2 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .panel-head p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 11px;
      }
      .panel-body {
        padding: 14px 18px 18px;
      }
      .muted {
        color: var(--muted);
        font-size: 11px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 4px 9px;
        font-size: 10px;
        font-weight: 700;
        border: 1px solid rgba(0, 0, 0, 0.04);
      }
      .badge.new { background: #ebfbee; color: var(--success); }
      .badge.contacted { background: var(--accent-soft); color: var(--accent); }
      .badge.in_progress { background: #fff9db; color: var(--warning); }
      .badge.closed { background: #fff5f5; color: var(--danger); }
      .badge.operator {
        background: var(--panel-muted);
        color: #52576a;
        border-color: var(--border);
      }
      .tiny-btn {
        min-height: 34px;
        border: 1px solid var(--border);
        background: var(--panel);
        color: var(--text);
        border-radius: 8px;
        padding: 7px 10px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
      }
      .tiny-btn.primary {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: var(--accent-border);
      }
      .icon-btn {
        width: 34px;
        height: 34px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        font-size: 15px;
        line-height: 1;
      }
      .icon-btn::after {
        content: attr(data-tooltip);
        position: absolute;
        left: 50%;
        bottom: calc(100% + 8px);
        transform: translateX(-50%) translateY(4px);
        background: rgba(27, 36, 55, 0.96);
        color: #fff;
        border-radius: 8px;
        padding: 6px 8px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.14s ease, transform 0.14s ease;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
        z-index: 5;
      }
      .icon-btn:hover::after,
      .icon-btn:focus-visible::after {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      .profile-shell {
        display: grid;
        gap: 10px;
      }
      .crm-shell {
        display: grid;
        grid-template-columns: minmax(0, 1.8fr) minmax(320px, 0.88fr);
        gap: 16px;
        align-items: start;
      }
      .contacts-workspace {
        display: grid;
        gap: 12px;
        min-width: 0;
      }
      .contact-profile-panel {
        min-width: 0;
        position: sticky;
        top: 24px;
        overflow: hidden;
        border-radius: 12px;
      }
      .list-shell {
        border-radius: 12px;
        background: var(--panel);
        overflow: hidden;
      }
      .list-grid {
        display: grid;
      }
      .list-grid-head,
      .contact-list-row {
        display: grid;
        grid-template-columns: minmax(230px, 1.4fr) minmax(180px, 0.92fr) minmax(140px, 0.7fr) minmax(140px, 0.68fr) 92px;
        gap: 14px;
        align-items: center;
      }
      .list-grid-head {
        padding: 11px 16px;
        border-bottom: 1px solid var(--border);
        background: #fafafe;
        color: var(--muted-soft);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .contact-list {
        display: grid;
      }
      .contact-list-row {
        padding: 14px 16px;
        border-bottom: 1px solid var(--border);
        cursor: pointer;
        transition: background 0.14s ease, border-color 0.14s ease;
      }
      .contact-list-row:last-child {
        border-bottom: none;
      }
      .contact-list-row:hover {
        background: #fafafe;
      }
      .contact-list-row.selected {
        background: var(--accent-soft);
      }
      .cell-stack {
        display: grid;
        gap: 4px;
        min-width: 0;
      }
      .cell-title {
        font-size: 14px;
        font-weight: 600;
        line-height: 1.25;
        word-break: break-word;
      }
      .cell-subtitle {
        color: var(--muted);
        font-size: 11px;
        line-height: 1.35;
        word-break: break-word;
      }
      .cell-meta {
        color: var(--text);
        font-size: 12px;
        font-weight: 600;
        line-height: 1.35;
        overflow: hidden;
      }
      .cell-meta.muted {
        color: var(--muted);
        font-weight: 500;
      }
      .cell-inline {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .cell-actions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
      }
      .contact-profile-panel .panel-head {
        padding-top: 12px;
      }
      .contact-profile-panel .panel-body {
        padding-top: 10px;
      }
      .empty-state {
        padding: 24px 18px;
        border: 1px dashed var(--border);
        border-radius: 12px;
        background: var(--panel-soft);
        color: var(--muted);
        text-align: center;
        font-size: 12px;
      }
      .profile-card {
        border-radius: 12px;
        padding: 16px;
      }
      .profile-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }
      .profile-head h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        letter-spacing: -0.03em;
      }
      .profile-head p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 11px;
      }
      .profile-summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }
      .profile-summary-card {
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--panel);
        padding: 11px 12px;
      }
      .profile-summary-card strong {
        display: block;
        color: var(--muted-soft);
        font-size: 10px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .profile-summary-card span {
        display: block;
        margin-top: 6px;
        font-size: 15px;
        font-weight: 700;
      }
      .badge-row,
      .tags-row,
      .profile-tabs,
      .profile-actions {
        display: flex;
        gap: 7px;
        flex-wrap: wrap;
      }
      .profile-tabs {
        padding-top: 2px;
      }
      .profile-tab {
        border: 1px solid var(--border);
        background: var(--panel);
        color: var(--muted);
        border-radius: 999px;
        padding: 6px 11px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
      }
      .profile-tab.active {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: var(--accent-border);
      }
      .profile-section {
        display: grid;
        gap: 12px;
      }
      .profile-section-title {
        display: grid;
        gap: 4px;
      }
      .profile-section-title strong {
        font-size: 13px;
        font-weight: 600;
      }
      .profile-section-title span {
        color: var(--muted);
        font-size: 11px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .info-item {
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--panel);
        padding: 11px 12px;
      }
      .info-item strong {
        display: block;
        color: var(--muted);
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .info-item span {
        display: block;
        margin-top: 6px;
        font-size: 13px;
      }
      .list {
        display: grid;
        gap: 10px;
      }
      .list-item {
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--panel);
        padding: 12px;
      }
      .list-item-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .list-item strong {
        font-size: 13px;
        font-weight: 600;
      }
      .list-item p {
        margin: 5px 0 0;
        color: var(--muted);
        font-size: 11px;
      }
      .table-count {
        display: inline-flex;
        align-items: center;
        min-height: 32px;
        padding: 0 11px;
        border-radius: 999px;
        background: var(--panel);
        border: 1px solid var(--border);
        color: var(--muted);
        font-size: 11px;
        font-weight: 600;
      }
      .profile-topline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }
      .profile-topline .muted {
        font-size: 11px;
      }
      .profile-meta-strip {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }
      .profile-meta-pill {
        display: grid;
        gap: 3px;
        padding: 11px 12px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--panel);
      }
      .profile-meta-pill strong {
        color: var(--muted-soft);
        font-size: 10px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .profile-meta-pill span {
        font-size: 13px;
        font-weight: 700;
      }
      @media (max-width: 1180px) {
        .crm-shell { grid-template-columns: 1fr; }
        .contact-profile-panel {
          position: static;
        }
      }
      @media (max-width: 720px) {
        .topbar {
          padding: 12px 16px;
          min-height: auto;
          align-items: flex-start;
          flex-direction: column;
        }
        .workspace {
          padding: 16px;
        }
        .toolbar {
          align-items: stretch;
        }
        .toolbar-main {
          flex-direction: column;
          align-items: stretch;
        }
        .toolbar-actions { justify-content: stretch; }
        .toolbar-actions .btn { flex: 1; }
        .info-grid { grid-template-columns: 1fr; }
        .profile-summary-grid { grid-template-columns: 1fr; }
        .profile-meta-strip { grid-template-columns: 1fr; }
        .list-grid-head,
        .contact-list-row {
          grid-template-columns: minmax(0, 1fr);
        }
        .list-grid-head {
          display: none;
        }
        .contact-list-row {
          gap: 8px;
        }
        .cell-actions {
          justify-content: flex-start;
        }
      }
    `,
    content: `
    <div class="page">
      <section class="topbar">
        <div class="topbar-left">
            <h1>Contacts</h1>
            <p>Контакти, пов’язані діалоги й CRM профілі в одному просторі.</p>
        </div>
      </section>

      <div class="workspace">
        <div class="toolbar">
          <div class="toolbar-main">
            <input id="contactsSearchInput" type="search" placeholder="Пошук по імені, телефону, Telegram або email..." />
            <div id="contactsMetrics" class="toolbar-metrics"></div>
          </div>
          <div class="toolbar-actions">
            <button id="refreshBtn" type="button" class="btn">Оновити</button>
            <button id="exportBtn" type="button" class="btn primary">Export CSV</button>
          </div>
        </div>

        <div class="crm-shell">
        <section class="contacts-workspace">
          <section class="panel">
            <div class="panel-body">
              <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
                <div id="tableCount" class="table-count">0 contacts</div>
              </div>
              <div class="list-shell">
                <div class="list-grid-head">
                  <div>Контакт</div>
                  <div>Контакти</div>
                  <div>Оператор</div>
                  <div>Статус</div>
                  <div></div>
                </div>
                <div id="contactsTableBody" class="contact-list">
                  <div class="empty-state">Loading contacts…</div>
                </div>
              </div>
            </div>
          </section>
        </section>

        <aside class="panel contact-profile-panel">
          <div class="panel-head">
            <h2>Профіль контакту</h2>
            <p>Деталі контакту, історія спілкування, файли та активність.</p>
          </div>
          <div class="panel-body">
            <div id="profileRoot" class="profile-shell">
              <div class="empty-state">Оберіть контакт у таблиці зліва.</div>
            </div>
          </div>
        </aside>
      </div>
      </div>
    </div>

    `,
    scripts: `<script>
      (function () {
        const state = {
          contacts: ${JSON.stringify(initialContacts)},
          search: '',
          selectedContactId: '',
          selectedProfile: null,
          loadingContacts: false,
          loadingProfile: false,
          profileTab: 'info'
        };

        const searchInput = document.getElementById('contactsSearchInput');
        const refreshBtn = document.getElementById('refreshBtn');
        const exportBtn = document.getElementById('exportBtn');
        const contactsMetrics = document.getElementById('contactsMetrics');
        const contactsTableBody = document.getElementById('contactsTableBody');
        const profileRoot = document.getElementById('profileRoot');
        const tableCount = document.getElementById('tableCount');

        function escapeHtml(value) {
          return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function fetchJson(url, options) {
          return fetch(url, options).then(function (response) {
            return response.json().then(function (payload) {
              if (!response.ok || !payload.ok) {
                throw new Error(payload.message || 'Request failed');
              }
              return payload;
            });
          });
        }

        function formatShortDate(value) {
          if (!value) return '—';
          const date = new Date(String(value).replace(' ', 'T') + 'Z');
          if (Number.isNaN(date.getTime())) return String(value);
          return new Intl.DateTimeFormat('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(date);
        }

        function renderStatusBadge(status) {
          const value = String(status || 'new').trim();
          const map = {
            new: 'New',
            contacted: 'Contacted',
            in_progress: 'In Progress',
            closed: 'Closed'
          };
          return '<span class="badge ' + escapeHtml(value) + '">' + escapeHtml(map[value] || value) + '</span>';
        }

        function renderTagBadges(tags) {
          if (!Array.isArray(tags) || !tags.length) return '<span class="muted">No tags</span>';
          return tags.map(function (tag) {
            return '<span class="badge">' + escapeHtml(tag) + '</span>';
          }).join('');
        }

        function renderOperatorBadge(contact) {
          const assigned = String(contact && contact.assignedOperator || '').trim();
          const last = String(contact && contact.lastOperator || '').trim();
          const primary = assigned || last;
          if (!primary) return '<span class="muted">—</span>';
          const secondary = last && assigned && last !== assigned ? '<span class="muted">last: ' + escapeHtml(last) + '</span>' : '';
          return '<div class="contact-meta-line"><span class="badge operator">' + escapeHtml(primary) + '</span>' + secondary + '</div>';
        }

        function renderToolbarMetrics() {
          const totalContacts = state.contacts.length;
          const activeLeads = state.contacts.filter(function (contact) {
            return String(contact.status || '') !== 'closed';
          }).length;
          const assignedContacts = state.contacts.filter(function (contact) {
            return Boolean(contact.assignedOperator || contact.lastOperator);
          }).length;
          const withDialogs = state.contacts.reduce(function (sum, contact) {
            return sum + Math.max(0, Number(contact.dialogsCount) || 0);
          }, 0);

          contactsMetrics.innerHTML = [
            { label: 'Contacts', value: totalContacts },
            { label: 'Active leads', value: activeLeads },
            { label: 'With operator', value: assignedContacts },
            { label: 'Dialogs', value: withDialogs }
          ].map(function (item) {
            return '<div class="metric-pill"><strong>' + escapeHtml(String(item.value)) + '</strong><span>' + escapeHtml(item.label) + '</span></div>';
          }).join('');
        }

        function renderContactsTable() {
          tableCount.textContent = String(state.contacts.length) + ' contacts';
          if (state.loadingContacts) {
            contactsTableBody.innerHTML = '<div class="empty-state">Loading contacts…</div>';
            return;
          }
          if (!state.contacts.length) {
            contactsTableBody.innerHTML = '<div class="empty-state">Контакти не знайдено.</div>';
            return;
          }

          contactsTableBody.innerHTML = state.contacts.map(function (contact) {
            const title = contact.name || contact.phone || contact.telegram || contact.email || contact.contactId;
            const primaryContact = contact.phone || contact.telegram || contact.email || '—';
            const secondaryContact = [contact.telegram, contact.email].filter(function (value) {
              return value && value !== primaryContact;
            }).join(' · ') || '—';
            const chatHref = contact.conversationId
              ? '/inbox?conversationId=' + encodeURIComponent(contact.conversationId) + '&contactId=' + encodeURIComponent(contact.contactId) + '&contactsTab=current'
              : '';
            return '<div class="' + (contact.contactId === state.selectedContactId ? 'contact-list-row selected' : 'contact-list-row') + '" data-open-profile="' + escapeHtml(contact.contactId) + '">' +
              '<div class="cell-stack">' +
                '<div class="cell-title">' + escapeHtml(title) + '</div>' +
                '<div class="cell-subtitle">' + escapeHtml(contact.contactId || '') + '</div>' +
              '</div>' +
              '<div class="cell-stack">' +
                '<div class="cell-meta">' + escapeHtml(primaryContact) + '</div>' +
                '<div class="cell-subtitle">' + escapeHtml(secondaryContact) + '</div>' +
              '</div>' +
              '<div class="cell-stack">' + renderOperatorBadge(contact) + '</div>' +
              '<div class="cell-inline">' + renderStatusBadge(contact.status || 'new') + '<span class="muted">' + escapeHtml(String(contact.dialogsCount || 0)) + ' dlg</span></div>' +
              '<div class="cell-actions">' +
                '<button type="button" class="tiny-btn primary icon-btn" data-open-profile="' + escapeHtml(contact.contactId) + '" data-tooltip="Переглянути контакт" aria-label="Переглянути контакт">👁</button>' +
                (chatHref
                  ? '<a class="tiny-btn icon-btn" href="' + escapeHtml(chatHref) + '" data-tooltip="Відкрити чат" aria-label="Відкрити чат">💬</a>'
                  : '<span class="tiny-btn icon-btn" style="opacity:.5;pointer-events:none;" data-tooltip="Немає пов’язаного чату" aria-label="Немає пов’язаного чату">💬</span>') +
              '</div>' +
            '</div>';
          }).join('');
        }

        function renderProfile() {
          if (state.loadingProfile) {
            profileRoot.innerHTML = '<div class="empty-state">Loading profile…</div>';
            return;
          }
          if (!state.selectedProfile || !state.selectedProfile.contact) {
            profileRoot.innerHTML = '<div class="empty-state">Оберіть контакт у таблиці зліва.</div>';
            return;
          }

          const profile = state.selectedProfile;
          const contact = profile.contact;
          const summary = profile.summary || {};
          const headerTitle = contact.name || contact.phone || contact.telegram || contact.email || contact.contactId;
          const headerSubline = [contact.phone, contact.telegram, contact.email].filter(Boolean).join(' · ') || 'CRM profile';
          const tabs = [
            { key: 'info', label: 'Info' },
            { key: 'conversations', label: 'Conversations' },
            { key: 'files', label: 'Files' },
            { key: 'ratings', label: 'Ratings' },
            { key: 'activity', label: 'Activity' }
          ];

          let bodyHtml = '';
          if (state.profileTab === 'conversations') {
            bodyHtml = (profile.conversations || []).length
              ? '<div class="list">' + (profile.conversations || []).map(function (item) {
                  const href = '/inbox?conversationId=' + encodeURIComponent(item.conversationId || '') + '&contactId=' + encodeURIComponent(contact.contactId) + '&contactsTab=current';
                  return '<div class="list-item">' +
                    '<div class="list-item-head"><strong>' + escapeHtml(item.siteId || 'Site') + '</strong><span class="muted">' + escapeHtml(formatShortDate(item.lastMessageAt || item.updatedAt || item.createdAt)) + '</span></div>' +
                    '<p>' + escapeHtml(String(item.messageCount || 0)) + ' messages</p>' +
                    '<div class="profile-actions"><a class="tiny-btn" href="' + escapeHtml(href) + '">Open chat</a></div>' +
                  '</div>';
                }).join('') + '</div>'
              : '<div class="empty-state">Пов’язаних діалогів поки немає.</div>';
          } else if (state.profileTab === 'files') {
            bodyHtml = (profile.files || []).length
              ? '<div class="list">' + (profile.files || []).map(function (file) {
                  return '<div class="list-item">' +
                    '<div class="list-item-head"><strong>' + escapeHtml(file.fileName || 'file') + '</strong><span class="muted">' + escapeHtml(formatShortDate(file.createdAt)) + '</span></div>' +
                    '<div class="profile-actions"><a class="tiny-btn" href="' + escapeHtml(file.publicUrl || '#') + '" target="_blank" rel="noopener noreferrer">Download</a></div>' +
                  '</div>';
                }).join('') + '</div>'
              : '<div class="empty-state">Файлів поки немає.</div>';
          } else if (state.profileTab === 'ratings') {
            bodyHtml = (profile.ratings || []).length
              ? '<div class="list">' + (profile.ratings || []).map(function (rating) {
                  return '<div class="list-item">' +
                    '<div class="list-item-head"><strong>' + escapeHtml(rating.value || 'Rating') + '</strong><span class="muted">' + escapeHtml(formatShortDate(rating.createdAt)) + '</span></div>' +
                    (rating.note ? '<p>' + escapeHtml(rating.note) + '</p>' : '') +
                  '</div>';
                }).join('') + '</div>'
              : '<div class="empty-state">Оцінок поки немає.</div>';
          } else if (state.profileTab === 'activity') {
            bodyHtml = (profile.activity || []).length
              ? '<div class="list">' + (profile.activity || []).map(function (item) {
                  return '<div class="list-item">' +
                    '<div class="list-item-head"><strong>' + escapeHtml(item.label || 'Activity') + '</strong><span class="muted">' + escapeHtml(formatShortDate(item.createdAt)) + '</span></div>' +
                    '<p>' + escapeHtml(item.siteId || '—') + '</p>' +
                  '</div>';
                }).join('') + '</div>'
              : '<div class="empty-state">Активності поки немає.</div>';
          } else {
            bodyHtml =
              '<div class="profile-section">' +
                '<div class="profile-section-title"><strong>CRM overview</strong><span>Короткий зріз по оператору, діалогах і останній активності.</span></div>' +
                '<div class="profile-summary-grid">' +
                  '<div class="profile-summary-card"><strong>Assigned operator</strong><span>' + escapeHtml(summary.assignedOperator || '—') + '</span></div>' +
                  '<div class="profile-summary-card"><strong>Last operator</strong><span>' + escapeHtml(summary.lastOperator || '—') + '</span></div>' +
                  '<div class="profile-summary-card"><strong>Total dialogs</strong><span>' + escapeHtml(String(summary.dialogsCount || 0)) + '</span></div>' +
                  '<div class="profile-summary-card"><strong>Last activity</strong><span>' + escapeHtml(formatShortDate(summary.lastActivityAt || summary.lastMessageAt || contact.updatedAt)) + '</span></div>' +
                '</div>' +
              '</div>' +
              '<div class="profile-section">' +
                '<div class="profile-section-title"><strong>Contact details</strong><span>Збережені поля контакту та позначки для CRM.</span></div>' +
                '<div class="info-grid">' +
                  '<div class="info-item"><strong>Name</strong><span>' + escapeHtml(contact.name || '—') + '</span></div>' +
                  '<div class="info-item"><strong>Lead status</strong><span>' + escapeHtml(contact.status || 'new') + '</span></div>' +
                  '<div class="info-item"><strong>Phone</strong><span>' + escapeHtml(contact.phone || '—') + '</span></div>' +
                  '<div class="info-item"><strong>Telegram</strong><span>' + escapeHtml(contact.telegram || '—') + '</span></div>' +
                  '<div class="info-item"><strong>Email</strong><span>' + escapeHtml(contact.email || '—') + '</span></div>' +
                  '<div class="info-item"><strong>Contact ID</strong><span>' + escapeHtml(contact.contactId || '—') + '</span></div>' +
                  '<div class="info-item" style="grid-column:1 / -1;"><strong>Notes</strong><span>' + escapeHtml(contact.notes || '—') + '</span></div>' +
                  '<div class="info-item" style="grid-column:1 / -1;"><strong>Tags</strong><span>' + renderTagBadges(contact.tags || []) + '</span></div>' +
                '</div>' +
              '</div>';
          }

          profileRoot.innerHTML = '<div class="profile-card">' +
            '<div class="profile-topline"><span class="muted">CRM profile</span><div class="badge-row">' + renderStatusBadge(contact.status || 'new') + '</div></div>' +
            '<div class="profile-head">' +
              '<div>' +
                '<h3>' + escapeHtml(headerTitle) + '</h3>' +
                '<p>' + escapeHtml(headerSubline) + '</p>' +
              '</div>' +
              '<div class="muted">' + escapeHtml(contact.contactId || '') + '</div>' +
            '</div>' +
            '<div class="profile-meta-strip">' +
              '<div class="profile-meta-pill"><strong>Assigned</strong><span>' + escapeHtml(summary.assignedOperator || '—') + '</span></div>' +
              '<div class="profile-meta-pill"><strong>Last activity</strong><span>' + escapeHtml(formatShortDate(summary.lastActivityAt || summary.lastMessageAt || contact.updatedAt)) + '</span></div>' +
            '</div>' +
            '<div class="tags-row" style="margin-top:10px;">' + renderTagBadges(contact.tags || []) + '</div>' +
            '<div class="profile-tabs" style="margin-top:14px;">' + tabs.map(function (tab) {
              return '<button type="button" class="profile-tab ' + (state.profileTab === tab.key ? 'active' : '') + '" data-profile-tab="' + escapeHtml(tab.key) + '">' + escapeHtml(tab.label) + '</button>';
            }).join('') + '</div>' +
            '<div style="margin-top:14px;">' + bodyHtml + '</div>' +
          '</div>';
        }

        async function loadContacts() {
          if (state.loadingContacts) return;
          state.loadingContacts = true;
          refreshBtn.disabled = true;
          refreshBtn.textContent = 'Оновлення...';
          renderContactsTable();
          try {
            const params = new URLSearchParams();
            if (state.search) params.set('q', state.search);
            params.set('limit', '200');
            const payload = await fetchJson('/api/admin/contacts?' + params.toString());
            state.contacts = payload.contacts || [];
            renderToolbarMetrics();
          } catch (error) {
            contactsTableBody.innerHTML = '<div class="empty-state">Не вдалося завантажити контакти.</div>';
          } finally {
            state.loadingContacts = false;
            refreshBtn.disabled = false;
            refreshBtn.textContent = 'Оновити';
            renderContactsTable();
          }
        }

        async function openProfile(contactId) {
          if (!contactId) return;
          state.selectedContactId = contactId;
          state.loadingProfile = true;
          state.selectedProfile = null;
          state.profileTab = 'info';
          renderProfile();
          try {
            const payload = await fetchJson('/api/admin/contacts/' + encodeURIComponent(contactId) + '/profile');
            state.selectedProfile = payload.profile || null;
          } catch (error) {
            profileRoot.innerHTML = '<div class="empty-state">Не вдалося завантажити профіль контакту.</div>';
            return;
          } finally {
            state.loadingProfile = false;
            renderProfile();
          }
        }

        searchInput.addEventListener('input', function () {
          state.search = searchInput.value.trim();
          loadContacts().catch(console.error);
        });

        refreshBtn.addEventListener('click', function () {
          loadContacts().catch(console.error);
        });

        exportBtn.addEventListener('click', function () {
          const params = new URLSearchParams();
          if (state.search) params.set('q', state.search);
          window.location.href = '/api/admin/contacts/export.csv' + (params.toString() ? '?' + params.toString() : '');
        });

        contactsTableBody.addEventListener('click', function (event) {
          if (event.target.closest('a[href]')) return;
          const button = event.target.closest('[data-open-profile]');
          if (!button) return;
          openProfile(button.getAttribute('data-open-profile') || '').catch(console.error);
        });

        profileRoot.addEventListener('click', function (event) {
          const button = event.target.closest('[data-profile-tab]');
          if (!button) return;
          state.profileTab = button.getAttribute('data-profile-tab') || 'info';
          renderProfile();
        });

        renderContactsTable();
        renderToolbarMetrics();
      })();
    </script>`
  });
}

module.exports = {
  renderContactsPage
};
