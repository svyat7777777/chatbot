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
          >${renderSidebarIcon(item.key)}</a>
        `).join('')}
      </nav>
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
    <style>
      :root {
        --app-sidebar-width: 72px;
        --app-shell-bg: #f5f7fb;
        --app-sidebar-bg: #182132;
        --app-sidebar-border: rgba(255, 255, 255, 0.08);
        --app-sidebar-text: #98a6c3;
        --app-sidebar-accent: #2864ff;
        --app-sidebar-accent-soft: rgba(69, 119, 255, 0.18);
      }
      * { box-sizing: border-box; }
      html, body { min-height: 100%; }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(40, 100, 255, 0.05), transparent 22%),
          linear-gradient(180deg, #fafbfc 0%, var(--app-shell-bg) 100%);
      }
      .app-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: var(--app-sidebar-width);
        padding: 14px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        background: var(--app-sidebar-bg);
        border-right: 1px solid var(--app-sidebar-border);
        z-index: 20;
      }
      .app-sidebar-brand {
        width: 40px;
        height: 40px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #f4f7ff;
        font: 800 12px/1 Manrope, Inter, ui-sans-serif, system-ui, sans-serif;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .app-sidebar-nav {
        display: grid;
        gap: 14px;
      }
      .app-sidebar-link {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        border: 1px solid transparent;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--app-sidebar-text);
        background: transparent;
        text-decoration: none;
        transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
      }
      .app-sidebar-link svg {
        width: 22px;
        height: 22px;
        stroke: currentColor;
      }
      .app-sidebar-link:hover {
        color: #e8eefc;
        background: rgba(255, 255, 255, 0.05);
      }
      .app-sidebar-link.active {
        color: #dfeaff;
        border-color: rgba(91, 132, 255, 0.18);
        background: var(--app-sidebar-accent-soft);
      }
      .app-page {
        margin-left: var(--app-sidebar-width);
        min-height: 100vh;
      }
      @media (max-width: 900px) {
        .app-sidebar {
          position: sticky;
          top: 0;
          width: 100%;
          height: 72px;
          flex-direction: row;
          justify-content: space-between;
          padding: 10px 12px;
          border-right: 0;
          border-bottom: 1px solid var(--app-sidebar-border);
        }
        .app-sidebar-nav {
          display: flex;
        }
        .app-page {
          margin-left: 0;
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
  </body>
</html>`;
}

module.exports = {
  renderAppLayout
};
