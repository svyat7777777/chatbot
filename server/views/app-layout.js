function renderSidebarIcon(kind) {
  if (kind === 'contacts') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>';
  }
  if (kind === 'analytics') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16v-6"/><path d="M12 16V8"/><path d="M17 16v-3"/></svg>';
  }
  if (kind === 'settings') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2.5"/><path d="M12 19.5V22"/><path d="m4.93 4.93 1.77 1.77"/><path d="m17.3 17.3 1.77 1.77"/><path d="M2 12h2.5"/><path d="M19.5 12H22"/><path d="m4.93 19.07 1.77-1.77"/><path d="m17.3 6.7 1.77-1.77"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 4H9l-3-4H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>';
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
        --app-sidebar-bg: rgba(255, 255, 255, 0.92);
        --app-sidebar-border: #dde4ef;
        --app-sidebar-text: #667085;
        --app-sidebar-accent: #2864ff;
        --app-sidebar-accent-soft: #edf3ff;
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
        padding: 12px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        background: var(--app-sidebar-bg);
        border-right: 1px solid var(--app-sidebar-border);
        backdrop-filter: blur(10px);
        z-index: 20;
      }
      .app-sidebar-brand {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        background: linear-gradient(180deg, #f5f8ff 0%, #eef3ff 100%);
        border: 1px solid var(--app-sidebar-border);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--app-sidebar-accent);
        font: 800 12px/1 Manrope, Inter, ui-sans-serif, system-ui, sans-serif;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .app-sidebar-nav {
        display: grid;
        gap: 10px;
      }
      .app-sidebar-link {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        border: 1px solid var(--app-sidebar-border);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--app-sidebar-text);
        background: #fff;
        text-decoration: none;
      }
      .app-sidebar-link svg {
        width: 19px;
        height: 19px;
        stroke: currentColor;
      }
      .app-sidebar-link.active {
        color: var(--app-sidebar-accent);
        border-color: rgba(40, 100, 255, 0.16);
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
