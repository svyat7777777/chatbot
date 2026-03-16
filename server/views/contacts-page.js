const { renderAppLayout } = require('./app-layout');

function renderContactsPage(options = {}) {
  const initialContacts = Array.isArray(options.initialContacts) ? options.initialContacts : [];
  return renderAppLayout({
    title: 'Contacts',
    activeNav: 'contacts',
    styles: `
      :root {
        color-scheme: light;
        --bg: #f4f6fb;
        --panel: #ffffff;
        --panel-soft: #f8faff;
        --panel-muted: #f7f9fc;
        --border: #dbe2f0;
        --text: #1b2437;
        --muted: #67718a;
        --muted-soft: #8a94ab;
        --accent: #1f6fff;
        --accent-soft: #e9f1ff;
        --accent-border: rgba(31, 111, 255, 0.16);
        --success: #1f9d61;
        --warning: #f59e0b;
        --danger: #e25563;
      }
      * { box-sizing: border-box; }
      body {
        font-family: Manrope, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
      }
      .page {
        max-width: 1360px;
        margin: 0 auto;
        padding: 18px;
        display: grid;
        gap: 18px;
      }
      .hero,
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: 0 10px 30px rgba(26, 35, 57, 0.05);
      }
      .hero { padding: 18px; }
      .hero-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .hero-copy {
        display: grid;
        gap: 10px;
      }
      .hero-kicker {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        min-height: 26px;
        padding: 0 10px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .hero h1 {
        margin: 0;
        font-size: 30px;
        letter-spacing: -0.03em;
      }
      .hero p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        max-width: 720px;
      }
      .toolbar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        margin-top: 16px;
      }
      .toolbar-main {
        display: grid;
        gap: 10px;
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
        padding: 0 12px;
        border-radius: 999px;
        background: var(--panel-muted);
        border: 1px solid var(--border);
      }
      .metric-pill strong {
        font-size: 12px;
      }
      .metric-pill span {
        color: var(--muted);
        font-size: 12px;
      }
      .toolbar-actions {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: flex-end;
      }
      .toolbar input {
        width: 100%;
        border: 1px solid var(--border);
        background: #fff;
        color: var(--text);
        border-radius: 16px;
        padding: 14px 16px;
        font: inherit;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
      }
      .btn {
        border: 1px solid var(--border);
        background: #fff;
        color: var(--text);
        border-radius: 12px;
        padding: 10px 14px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn.primary {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1.85fr) minmax(340px, 0.92fr);
        gap: 18px;
        align-items: start;
      }
      .panel-head {
        padding: 18px 20px 0;
      }
      .panel-head h2 {
        margin: 0;
        font-size: 19px;
        letter-spacing: -0.02em;
      }
      .panel-head p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 13px;
      }
      .panel-body {
        padding: 18px 20px 20px;
      }
      .table-wrap {
        overflow: auto;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: linear-gradient(180deg, #ffffff, #fbfcff);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 860px;
      }
      th,
      td {
        text-align: left;
        padding: 13px 12px;
        border-bottom: 1px solid #eef2fa;
        vertical-align: top;
      }
      th {
        color: var(--muted-soft);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: rgba(251, 252, 255, 0.96);
        position: sticky;
        top: 0;
        z-index: 1;
      }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #f8fbff; }
      td.actions-cell {
        width: 96px;
      }
      .contact-row.selected td {
        background: #eef5ff;
      }
      .contact-cell strong {
        display: block;
        font-size: 14px;
        line-height: 1.25;
      }
      .contact-cell small,
      .message-snippet,
      .muted {
        color: var(--muted);
        font-size: 11px;
      }
      .contact-stack,
      .last-message-stack {
        display: grid;
        gap: 4px;
      }
      .contact-meta-line {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .message-snippet {
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text);
        font-size: 12px;
        font-weight: 600;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 5px 9px;
        font-size: 10px;
        font-weight: 800;
        border: 1px solid rgba(0, 0, 0, 0.02);
      }
      .badge.new { background: #ecfdf3; color: var(--success); }
      .badge.contacted { background: #eef4ff; color: #4267d6; }
      .badge.in_progress { background: #fff7e9; color: var(--warning); }
      .badge.closed { background: #fdeef0; color: var(--danger); }
      .badge.operator {
        background: var(--panel-muted);
        color: #42506b;
        border-color: rgba(84, 97, 126, 0.08);
      }
      .row-actions {
        display: flex;
        gap: 6px;
        flex-wrap: nowrap;
      }
      .tiny-btn {
        border: 1px solid var(--border);
        background: #fff;
        color: var(--text);
        border-radius: 10px;
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
      }
      .tiny-btn.primary {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: rgba(31, 111, 255, 0.18);
      }
      .icon-btn {
        width: 36px;
        height: 36px;
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
        gap: 14px;
      }
      .empty-state {
        padding: 24px;
        border: 1px dashed var(--border);
        border-radius: 14px;
        background: var(--panel-soft);
        color: var(--muted);
        text-align: center;
      }
      .profile-card {
        border: 1px solid var(--border);
        border-radius: 18px;
        background: linear-gradient(180deg, #ffffff, #f9fbff);
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
        font-size: 24px;
        letter-spacing: -0.03em;
      }
      .profile-head p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 13px;
      }
      .profile-summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 14px;
      }
      .profile-summary-card {
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #fff;
        padding: 12px;
      }
      .profile-summary-card strong {
        display: block;
        color: var(--muted-soft);
        font-size: 11px;
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
        gap: 8px;
        flex-wrap: wrap;
      }
      .profile-tabs {
        padding-top: 2px;
      }
      .profile-tab {
        border: 1px solid var(--border);
        background: #fff;
        color: var(--muted);
        border-radius: 999px;
        padding: 7px 11px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .profile-tab.active {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: rgba(31, 111, 255, 0.18);
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
        font-size: 14px;
      }
      .profile-section-title span {
        color: var(--muted);
        font-size: 12px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .info-item {
        border: 1px solid var(--border);
        border-radius: 14px;
        background: #fff;
        padding: 12px;
      }
      .info-item strong {
        display: block;
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .info-item span {
        display: block;
        margin-top: 6px;
        font-size: 14px;
      }
      .list {
        display: grid;
        gap: 10px;
      }
      .list-item {
        border: 1px solid var(--border);
        border-radius: 14px;
        background: #fff;
        padding: 12px;
      }
      .list-item-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .list-item strong {
        font-size: 14px;
      }
      .list-item p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 12px;
      }
      @media (max-width: 1100px) {
        .layout { grid-template-columns: 1fr; }
      }
      @media (max-width: 720px) {
        .toolbar { grid-template-columns: 1fr; }
        .toolbar-actions { justify-content: stretch; }
        .toolbar-actions .btn { flex: 1; }
        .info-grid { grid-template-columns: 1fr; }
        .profile-summary-grid { grid-template-columns: 1fr; }
        .page { padding: 12px; }
        table { min-width: 760px; }
      }
    `,
    content: `
    <div class="page">
      <section class="hero">
        <div class="hero-head">
          <div class="hero-copy">
            <span class="hero-kicker">CRM workspace</span>
            <h1>Contacts</h1>
            <p>Окрема CRM-сторінка для контактів, профілів і переходу в пов’язані чати.</p>
          </div>
        </div>
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
      </section>

      <div class="layout">
        <section class="panel">
          <div class="panel-head">
            <h2>Всі контакти</h2>
            <p>Тут зручно переглядати контакти як окремі CRM-профілі, а чат відкривати окремою дією.</p>
          </div>
          <div class="panel-body">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Контакти</th>
                    <th>Operator</th>
                    <th>Lead status</th>
                    <th>Dialogs</th>
                    <th>Останнє</th>
                    <th>Rating</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="contactsTableBody">
                  <tr><td colspan="8" class="muted">Loading contacts…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside class="panel">
          <div class="panel-head">
            <h2>Профіль контакту</h2>
            <p>Натисни “Переглянути контакт”, щоб побачити деталі, діалоги, файли та активність.</p>
          </div>
          <div class="panel-body">
            <div id="profileRoot" class="profile-shell">
              <div class="empty-state">Оберіть контакт у таблиці зліва.</div>
            </div>
          </div>
        </aside>
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
          if (state.loadingContacts) {
            contactsTableBody.innerHTML = '<tr><td colspan="8" class="muted">Loading contacts…</td></tr>';
            return;
          }
          if (!state.contacts.length) {
            contactsTableBody.innerHTML = '<tr><td colspan="8" class="muted">Контакти не знайдено.</td></tr>';
            return;
          }

          contactsTableBody.innerHTML = state.contacts.map(function (contact) {
            const title = contact.name || contact.phone || contact.telegram || contact.email || contact.contactId;
            const chatHref = contact.conversationId
              ? '/inbox?conversationId=' + encodeURIComponent(contact.conversationId) + '&contactId=' + encodeURIComponent(contact.contactId) + '&contactsTab=current'
              : '';
            return '<tr class="' + (contact.contactId === state.selectedContactId ? 'contact-row selected' : 'contact-row') + '">' +
              '<td class="contact-cell"><div class="contact-stack"><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(contact.contactId || '') + '</small></div></td>' +
              '<td><div class="contact-meta-line"><span>' + escapeHtml(contact.phone || '—') + '</span><span class="muted">' + escapeHtml(contact.telegram || contact.email || '—') + '</span></div></td>' +
              '<td>' + renderOperatorBadge(contact) + '</td>' +
              '<td>' + renderStatusBadge(contact.status || 'new') + '</td>' +
              '<td>' + escapeHtml(String(contact.dialogsCount || 0)) + '</td>' +
              '<td><div class="last-message-stack"><div class="message-snippet">' + escapeHtml(contact.lastMessage || '—') + '</div><div class="muted">' + escapeHtml(formatShortDate(contact.lastMessageAt || contact.lastConversationAt || contact.updatedAt)) + '</div></div></td>' +
              '<td>' + escapeHtml(contact.rating || '—') + '</td>' +
              '<td class="actions-cell"><div class="row-actions">' +
                '<button type="button" class="tiny-btn primary icon-btn" data-open-profile="' + escapeHtml(contact.contactId) + '" data-tooltip="Переглянути контакт" aria-label="Переглянути контакт">👁</button>' +
                (chatHref
                  ? '<a class="tiny-btn icon-btn" href="' + escapeHtml(chatHref) + '" data-tooltip="Відкрити чат" aria-label="Відкрити чат">💬</a>'
                  : '<span class="tiny-btn icon-btn" style="opacity:.5;pointer-events:none;" data-tooltip="Немає пов’язаного чату" aria-label="Немає пов’язаного чату">💬</span>') +
              '</div></td>' +
            '</tr>';
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
            '<div class="profile-head">' +
              '<div>' +
                '<h3>' + escapeHtml(contact.name || contact.phone || contact.telegram || contact.email || contact.contactId) + '</h3>' +
                '<p>' + escapeHtml([contact.phone, contact.telegram, contact.email].filter(Boolean).join(' · ') || 'Contact profile') + '</p>' +
              '</div>' +
              '<div class="badge-row">' + renderStatusBadge(contact.status || 'new') + '</div>' +
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
          renderContactsTable();
          try {
            const params = new URLSearchParams();
            if (state.search) params.set('q', state.search);
            params.set('limit', '200');
            const payload = await fetchJson('/api/admin/contacts?' + params.toString());
            state.contacts = payload.contacts || [];
            renderToolbarMetrics();
            renderContactsTable();
          } catch (error) {
            contactsTableBody.innerHTML = '<tr><td colspan="8" class="muted">Не вдалося завантажити контакти.</td></tr>';
          } finally {
            state.loadingContacts = false;
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
