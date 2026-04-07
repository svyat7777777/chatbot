function renderSidebarIcon(kind) {
  if (kind === 'contacts') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20v-1.5a5.5 5.5 0 0 0-11 0V20"/><circle cx="12" cy="8" r="4"/></svg>';
  }
  if (kind === 'analytics') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 19V9"/><path d="M12 19V5"/><path d="M18 19v-8"/></svg>';
  }
  if (kind === 'settings') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"/><path d="M4.5 12a7.5 7.5 0 0 1 15 0"/><path d="M19.5 12a7.5 7.5 0 0 1-15 0"/></svg>';
  }
  if (kind === 'super-admin') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 7v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V7l-8-4Z"/><path d="m9.5 12 1.7 1.7 3.3-3.4"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="m5.5 8 6.5 5 6.5-5"/></svg>';
}

function renderSidebar(activeNav, options = {}) {
  const isSuperAdmin = options.isSuperAdmin === true;
  const items = [
    { key: 'inbox', href: '/inbox', label: 'Inbox' },
    { key: 'contacts', href: '/contacts', label: 'Contacts' },
    { key: 'analytics', href: '/analytics', label: 'Analytics' },
    { key: 'settings', href: '/settings', label: 'Settings' }
  ];
  if (isSuperAdmin) {
    items.push({ key: 'super-admin', href: '/super-admin', label: 'Super Admin' });
  }

  return `
    <aside class="app-sidebar" aria-label="Primary navigation">
      <div class="app-sidebar-brand">VB</div>
      <nav class="app-sidebar-nav">
        ${items.map((item) => `
          <a
            href="${item.href}"
            class="app-sidebar-link${activeNav === item.key ? ' active' : ''}"
            title="${item.label}"
            aria-label="${item.label}"
          >${renderSidebarIcon(item.key)}${item.key === 'inbox' ? '<span id="appInboxUnreadBadge" class="app-sidebar-badge" hidden>0</span>' : ''}</a>
        `).join('')}
      </nav>
      <div class="app-sidebar-spacer"></div>
      <div class="app-account" data-app-account>
        <button
          type="button"
          class="app-account-trigger"
          data-app-account-trigger
          aria-haspopup="menu"
          aria-expanded="false"
          title="Account"
        >
          <span class="app-account-avatar" data-app-account-avatar>MA</span>
        </button>
        <div class="app-account-menu" data-app-account-menu hidden>
          <div class="app-account-summary">
            <div class="app-account-summary-avatar" data-app-account-menu-avatar>MA</div>
            <div class="app-account-summary-copy">
              <strong data-app-account-name>My Account</strong>
              <span data-app-account-email>Loading…</span>
              <small data-app-account-role>Workspace member</small>
              <small data-app-account-workspace></small>
            </div>
          </div>
          <div class="app-account-actions">
            <a href="/settings" class="app-account-link">Profile & settings</a>
            <form method="post" action="/logout" class="app-account-logout-form">
              <button type="submit" class="app-account-logout">Log out</button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  `;
}

function renderAppLayout(options = {}) {
  const title = String(options.title || 'verbbot.com');
  const activeNav = String(options.activeNav || 'inbox');
  const isSuperAdmin = options.isSuperAdmin === true;
  const styles = String(options.styles || '');
  const content = String(options.content || '');
  const scripts = String(options.scripts || '');

  return `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      :root {
        --app-sidebar-width: 52px;
        --app-shell-bg: #ffffff;
        --app-sidebar-bg: #0f1117;
        --app-sidebar-border: rgba(255, 255, 255, 0.06);
        --app-sidebar-text: #4b5168;
        --app-sidebar-accent: #ffffff;
        --app-sidebar-accent-soft: rgba(59, 91, 219, 0.18);
      }
      * { box-sizing: border-box; }
      html, body { min-height: 100%; }
      body {
        margin: 0;
        font-family: 'Plus Jakarta Sans', Manrope, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #1a1c24;
      }
      .app-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: var(--app-sidebar-width);
        padding: 14px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background: var(--app-sidebar-bg);
        border-right: 1px solid var(--app-sidebar-border);
        z-index: 20;
      }
      .app-sidebar-brand {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: #3b5bdb;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font: 700 12px/1 'Plus Jakarta Sans', Manrope, Inter, ui-sans-serif, system-ui, sans-serif;
        letter-spacing: -0.02em;
        margin-bottom: 16px;
      }
      .app-sidebar-nav {
        display: grid;
        gap: 4px;
      }
      .app-sidebar-link {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid transparent;
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--app-sidebar-text);
        background: transparent;
        text-decoration: none;
        transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
      }
      .app-sidebar-link svg {
        width: 18px;
        height: 18px;
        stroke: currentColor;
      }
      .app-sidebar-link:hover {
        color: #ced3e8;
        background: rgba(255, 255, 255, 0.06);
      }
      .app-sidebar-link.active {
        color: #7b9eff;
        background: var(--app-sidebar-accent-soft);
        border-color: transparent;
      }
      .app-sidebar-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        border-radius: 999px;
        background: #ef4444;
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        border: 2px solid var(--app-sidebar-bg);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
        pointer-events: none;
      }
      .app-sidebar-spacer {
        flex: 1;
      }
      .app-account {
        position: relative;
        margin-top: 8px;
        margin-bottom: 10px;
      }
      .app-account-trigger {
        width: 42px;
        height: 42px;
        border: 1px solid rgba(123, 158, 255, 0.18);
        border-radius: 14px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03));
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        cursor: pointer;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 6px 16px rgba(0, 0, 0, 0.18);
        transition: background 0.14s ease, border-color 0.14s ease, transform 0.14s ease, box-shadow 0.14s ease;
        position: relative;
      }
      .app-account-trigger:hover,
      .app-account-trigger[aria-expanded="true"] {
        background: linear-gradient(180deg, rgba(123, 158, 255, 0.16), rgba(123, 158, 255, 0.1));
        border-color: rgba(123, 158, 255, 0.34);
        transform: translateY(-1px);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 10px 20px rgba(0, 0, 0, 0.22);
      }
      .app-account-trigger::after {
        content: '';
        position: absolute;
        right: 5px;
        bottom: 5px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #22c55e;
        border: 2px solid #0f1117;
      }
      .app-account-avatar,
      .app-account-summary-avatar {
        background: linear-gradient(135deg, #4c6ef5, #228be6);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        letter-spacing: 0.03em;
      }
      .app-account-avatar {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        font-size: 12px;
      }
      .app-account-menu {
        position: absolute;
        left: calc(100% + 10px);
        bottom: 0;
        width: 250px;
        padding: 10px;
        border-radius: 14px;
        border: 1px solid rgba(15, 17, 23, 0.08);
        background: #ffffff;
        color: #0d0e14;
        box-shadow: 0 18px 44px rgba(15, 17, 23, 0.18);
      }
      .app-account-summary {
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr);
        gap: 10px;
        align-items: start;
        padding: 4px 4px 10px;
        border-bottom: 1px solid #eeedf0;
      }
      .app-account-summary-avatar {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        font-size: 13px;
      }
      .app-account-summary-copy {
        min-width: 0;
      }
      .app-account-summary-copy strong,
      .app-account-summary-copy span,
      .app-account-summary-copy small {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .app-account-summary-copy strong {
        font-size: 13px;
        line-height: 1.25;
      }
      .app-account-summary-copy span {
        margin-top: 2px;
        font-size: 11px;
        color: #6b6f80;
      }
      .app-account-summary-copy small {
        margin-top: 4px;
        font-size: 11px;
        color: #8a8fa3;
      }
      .app-account-actions {
        display: grid;
        gap: 6px;
        padding-top: 10px;
      }
      .app-account-link,
      .app-account-logout {
        width: 100%;
        min-height: 38px;
        border-radius: 10px;
        text-decoration: none;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .app-account-link {
        border: 1px solid #e8ebf2;
        background: #f8faff;
        color: #2f426f;
      }
      .app-account-logout-form {
        margin: 0;
      }
      .app-account-logout {
        border: 1px solid #f1d2d2;
        background: #fff5f5;
        color: #c92a2a;
      }
      .app-account-link:hover {
        background: #edf3ff;
      }
      .app-account-logout:hover {
        background: #ffe3e3;
      }
      .app-page {
        margin-left: var(--app-sidebar-width);
        width: calc(100vw - var(--app-sidebar-width));
        max-width: none;
        min-height: 100vh;
        min-width: 0;
      }
      @media (max-width: 900px) {
        .app-sidebar {
          position: sticky;
          top: 0;
          width: 100%;
          height: 56px;
          flex-direction: row;
          justify-content: space-between;
          padding: 10px 12px;
          border-right: 0;
          border-bottom: 1px solid var(--app-sidebar-border);
        }
        .app-sidebar-nav {
          display: flex;
        }
        .app-sidebar-spacer,
        .app-account {
          display: none;
        }
        .app-page {
          margin-left: 0;
          width: 100%;
          max-width: none;
          padding-top: 0;
        }
      }
      ${styles}
    </style>
  </head>
  <body>
    ${renderSidebar(activeNav, { isSuperAdmin })}
    <main class="app-page">
      ${content}
    </main>
    ${scripts}
    <script>
      (function () {
        const badge = document.getElementById('appInboxUnreadBadge');
        const accountRoot = document.querySelector('[data-app-account]');
        const accountTrigger = document.querySelector('[data-app-account-trigger]');
        const accountMenu = document.querySelector('[data-app-account-menu]');
        const accountAvatar = document.querySelector('[data-app-account-avatar]');
        const accountMenuAvatar = document.querySelector('[data-app-account-menu-avatar]');
        const accountName = document.querySelector('[data-app-account-name]');
        const accountEmail = document.querySelector('[data-app-account-email]');
        const accountRole = document.querySelector('[data-app-account-role]');
        const accountWorkspace = document.querySelector('[data-app-account-workspace]');

        let pollTimer = 0;

        function getInitials(value) {
          const text = String(value || '').trim();
          if (!text) return 'MA';
          const parts = text.split(/\s+/).filter(Boolean).slice(0, 2);
          if (!parts.length) return 'MA';
          return parts.map(function (item) { return item.charAt(0).toUpperCase(); }).join('').slice(0, 2);
        }

        function setAccountOpen(isOpen) {
          if (!accountRoot || !accountTrigger || !accountMenu) return;
          accountMenu.hidden = !isOpen;
          accountTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }

        function renderAccount(payload) {
          if (!accountRoot) return;
          const user = payload && payload.user ? payload.user : null;
          const workspaces = Array.isArray(payload && payload.workspaces) ? payload.workspaces : [];
          const activeWorkspaceId = String(payload && payload.activeWorkspaceId || '');
          const activeWorkspace = workspaces.find(function (item) {
            return String(item && item.workspaceId || '') === activeWorkspaceId;
          }) || workspaces[0] || null;
          const name = String(user && (user.name || user.fullName) || '').trim() || 'Workspace member';
          const email = String(user && user.email || '').trim() || 'Signed in';
          const role = String(activeWorkspace && activeWorkspace.role || payload && payload.role || '').trim() || 'member';
          const workspaceName = String(activeWorkspace && activeWorkspace.name || '').trim();
          const initials = getInitials(name);

          if (accountAvatar) accountAvatar.textContent = initials;
          if (accountMenuAvatar) accountMenuAvatar.textContent = initials;
          if (accountName) accountName.textContent = name;
          if (accountEmail) accountEmail.textContent = email;
          if (accountRole) accountRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);
          if (accountWorkspace) {
            accountWorkspace.textContent = workspaceName ? workspaceName : '';
            accountWorkspace.hidden = !workspaceName;
          }
        }

        async function hydrateAccount() {
          if (!accountRoot) return;
          try {
            const response = await fetch('/api/auth/me', {
              credentials: 'same-origin',
              headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) return;
            const payload = await response.json();
            renderAccount(payload);
          } catch (error) {
          }
        }

        function renderInboxBadge(totalUnread) {
          const count = Math.max(0, Number(totalUnread) || 0);
          if (!badge) return;
          if (count > 0) {
            badge.hidden = false;
            badge.textContent = count > 99 ? '99+' : String(count);
          } else {
            badge.hidden = true;
            badge.textContent = '0';
          }
        }

        async function refreshInboxBadge() {
          if (!badge) return;
          try {
            const response = await fetch('/api/inbox/conversations?status=open&limit=200', {
              credentials: 'same-origin',
              headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) {
              return;
            }
            const payload = await response.json();
            const conversations = Array.isArray(payload && payload.conversations) ? payload.conversations : [];
            const totalUnread = conversations.reduce(function (sum, item) {
              return sum + Math.max(0, Number(item && item.unreadCount) || 0);
            }, 0);
            renderInboxBadge(totalUnread);
          } catch (error) {
          }
        }

        function startInboxBadgePolling() {
          if (!badge) return;
          if (pollTimer) {
            window.clearInterval(pollTimer);
          }
          refreshInboxBadge();
          pollTimer = window.setInterval(refreshInboxBadge, 10000);
        }

        if (accountRoot && accountTrigger && accountMenu) {
          accountTrigger.addEventListener('click', function (event) {
            event.preventDefault();
            setAccountOpen(accountMenu.hidden);
          });

          document.addEventListener('click', function (event) {
            if (!accountRoot.contains(event.target)) {
              setAccountOpen(false);
            }
          });

          document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
              setAccountOpen(false);
            }
          });

          hydrateAccount();
        }

        document.addEventListener('visibilitychange', function () {
          if (!document.hidden && badge) {
            refreshInboxBadge();
          }
        });

        if (badge) {
          window.addEventListener('focus', refreshInboxBadge);
          startInboxBadgePolling();
        }
      }());
    </script>
  </body>
</html>`;
}

module.exports = {
  renderAppLayout
};
