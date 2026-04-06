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
  return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="m5.5 8 6.5 5 6.5-5"/></svg>';
}

function renderSidebar(activeNav) {
  const items = [
    { key: 'inbox', href: '/inbox', label: 'Inbox' },
    { key: 'contacts', href: '/contacts', label: 'Contacts' },
    { key: 'analytics', href: '/analytics', label: 'Analytics' },
    { key: 'settings', href: '/settings', label: 'Settings' }
  ];

  return `
    <aside class="app-sidebar" aria-label="Primary navigation">
      <div class="app-sidebar-brand">PF</div>
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
      <div class="app-sidebar-avatar" aria-hidden="true">MA</div>
    </aside>
  `;
}

function renderAppLayout(options = {}) {
  const title = String(options.title || 'Chat Platform');
  const activeNav = String(options.activeNav || 'inbox');
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
      .app-sidebar-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4c6ef5, #228be6);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        margin-top: 8px;
        margin-bottom: 6px;
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
        .app-sidebar-avatar {
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
    ${renderSidebar(activeNav)}
    <main class="app-page">
      ${content}
    </main>
    ${scripts}
    <script>
      (function () {
        const badge = document.getElementById('appInboxUnreadBadge');
        if (!badge) return;

        let pollTimer = 0;

        function renderInboxBadge(totalUnread) {
          const count = Math.max(0, Number(totalUnread) || 0);
          if (count > 0) {
            badge.hidden = false;
            badge.textContent = count > 99 ? '99+' : String(count);
          } else {
            badge.hidden = true;
            badge.textContent = '0';
          }
        }

        async function refreshInboxBadge() {
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
          if (pollTimer) {
            window.clearInterval(pollTimer);
          }
          refreshInboxBadge();
          pollTimer = window.setInterval(refreshInboxBadge, 10000);
        }

        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) {
            refreshInboxBadge();
          }
        });

        window.addEventListener('focus', refreshInboxBadge);
        startInboxBadgePolling();
      }());
    </script>
  </body>
</html>`;
}

module.exports = {
  renderAppLayout
};
