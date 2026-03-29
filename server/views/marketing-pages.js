const PUBLIC_NAV = [
  { href: '/', key: 'home' },
  { href: '/product', key: 'product' },
  { href: '/use-cases', key: 'use-cases' },
  { href: '/pricing', key: 'pricing' },
  { href: '/faq', key: 'faq' },
  { href: '/demo', key: 'demo' }
];

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pick(value, lang) {
  if (value && typeof value === 'object' && !Array.isArray(value) && ('en' in value || 'uk' in value)) {
    return value[lang] || value.en || '';
  }
  return value;
}

function withLang(pathname, lang) {
  return `${pathname}?lang=${lang}`;
}

const MARKETING_SHOTS = {
  widgetEntry: '/marketing/widget-entry.png',
  leadCapture: '/marketing/widget-lead-capture.png',
  inbox: '/marketing/inbox-thread.png',
  contacts: '/marketing/contacts.png',
  analytics: '/marketing/analytics.png',
  settings: '/marketing/settings.png'
};

function renderScreenshotCard(options) {
  return `
    <figure class="shot-card ${escapeHtml(options.className || '')}">
      <figcaption class="shot-meta">
        <span>${escapeHtml(options.eyebrow || '')}</span>
        <strong>${escapeHtml(options.title || '')}</strong>
        ${options.text ? `<p>${escapeHtml(options.text)}</p>` : ''}
      </figcaption>
      <div class="shot-frame">
        <img src="${escapeHtml(options.src)}" alt="${escapeHtml(options.alt || options.title || '')}" loading="${escapeHtml(options.loading || 'lazy')}" />
      </div>
    </figure>
  `;
}

function getMarketingCopy(lang) {
  const isUk = lang === 'uk';
  return {
    lang,
    brandName: 'Chat Platform',
    brandTagline: isUk ? 'Система розмов для сайту' : 'Website conversation system',
    nav: {
      home: isUk ? 'Головна' : 'Home',
      product: isUk ? 'Продукт' : 'Product',
      'use-cases': isUk ? 'Сценарії' : 'Use cases',
      pricing: isUk ? 'Ціни' : 'Pricing',
      faq: 'FAQ',
      demo: isUk ? 'Демо' : 'Demo'
    },
    cta: {
      workspace: isUk ? 'Вхід для операторів' : 'Operator login',
      bookDemo: isUk ? 'Замовити демо' : 'Book a demo',
      viewPricing: isUk ? 'Переглянути ціни' : 'View pricing',
      seeIncluded: isUk ? 'Що входить' : 'See what is included',
      seeProduct: isUk ? 'Подивитися продукт' : 'Review product depth'
    },
    footer: {
      summary: isUk
        ? 'Website conversation system з AI-відповідями, guided capture, shared inbox, контактними записами, аналітикою й налаштуваннями flow.'
        : 'A website conversation system with AI replies, guided capture, a shared inbox, contact records, analytics, and flow settings.',
      product: isUk ? 'Продукт' : 'Product',
      explore: isUk ? 'Розділи' : 'Explore',
      why: isUk ? 'Навіщо це існує' : 'Why this exists',
      whyText: isUk
        ? 'Створено для команд, які втрачають попит, коли відповіді повільні, контекст розірваний, а follow-up неструктурований.'
        : 'Built for teams that lose pipeline when replies are slow, context is fragmented, and follow-up lacks discipline.',
      footerCta: isUk ? 'Подивитися демо-шлях' : 'See the demo path',
      workspace: isUk ? 'Робочий простір' : 'Workspace'
    },
    labels: {
      primaryNav: isUk ? 'Основна навігація' : 'Primary',
      homeAria: isUk ? 'Chat Platform головна' : 'Chat Platform home',
      langSwitcher: isUk ? 'Перемикач мови' : 'Language switcher',
      en: 'EN',
      uk: 'UA',
      sectionProductView: isUk ? 'Вигляд продукту' : 'Product view',
      plans: isUk ? 'Плани' : 'Plans',
      questions: isUk ? 'Питання' : 'Questions',
      demoPath: isUk ? 'Шлях до демо' : 'Demo path'
    }
  };
}

function renderLanguageSwitcher(pathname, lang, copy) {
  return `
    <div class="lang-switcher" aria-label="${escapeHtml(copy.labels.langSwitcher)}">
      <a href="${withLang(pathname, 'en')}"${lang === 'en' ? ' class="is-active"' : ''}>${copy.labels.en}</a>
      <a href="${withLang(pathname, 'uk')}"${lang === 'uk' ? ' class="is-active"' : ''}>${copy.labels.uk}</a>
    </div>
  `;
}

function renderNav(activeKey, lang, pathname, copy) {
  return `
    <header class="site-header">
      <div class="container header-bar">
        <a href="/" class="brand" aria-label="${escapeHtml(copy.labels.homeAria)}">
          <span class="brand-mark">CP</span>
          <span class="brand-copy">
            ${copy.brandName}
            <small>${escapeHtml(copy.brandTagline)}</small>
          </span>
        </a>
        <nav class="nav-links" aria-label="${escapeHtml(copy.labels.primaryNav)}">
          ${PUBLIC_NAV.map((item) => `
            <a href="${item.href}"${item.key === activeKey ? ' class="is-active"' : ''}>${escapeHtml(copy.nav[item.key])}</a>
          `).join('')}
        </nav>
        <div class="header-actions">
          ${renderLanguageSwitcher(pathname, lang, copy)}
          <a class="button button-secondary" href="/inbox">${escapeHtml(copy.cta.workspace)}</a>
          <a class="button button-primary" href="/demo">${escapeHtml(copy.cta.bookDemo)}</a>
        </div>
      </div>
    </header>
  `;
}

function renderFooter(lang, pathname, copy) {
  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <div class="brand">
            <span class="brand-mark">CP</span>
            <span class="brand-copy">
              ${copy.brandName}
              <small>${escapeHtml(copy.brandTagline)}</small>
            </span>
          </div>
          <p>${escapeHtml(copy.footer.summary)}</p>
          ${renderLanguageSwitcher(pathname, lang, copy)}
        </div>
        <div class="footer-col">
          <strong>${escapeHtml(copy.footer.product)}</strong>
          <a href="/product">${escapeHtml(copy.nav.product)}</a>
          <a href="/use-cases">${escapeHtml(copy.nav['use-cases'])}</a>
          <a href="/pricing">${escapeHtml(copy.nav.pricing)}</a>
        </div>
        <div class="footer-col">
          <strong>${escapeHtml(copy.footer.explore)}</strong>
          <a href="/faq">${escapeHtml(copy.nav.faq)}</a>
          <a href="/demo">${escapeHtml(copy.nav.demo)}</a>
          <a href="/inbox">${escapeHtml(copy.footer.workspace)}</a>
        </div>
        <div class="footer-col">
          <strong>${escapeHtml(copy.footer.why)}</strong>
          <p>${escapeHtml(copy.footer.whyText)}</p>
          <a class="footer-cta" href="/demo">${escapeHtml(copy.footer.footerCta)}</a>
        </div>
      </div>
    </footer>
  `;
}

function renderHero(options, lang, copy) {
  const eyebrow = options.eyebrow ? `<span class="eyebrow">${escapeHtml(options.eyebrow)}</span>` : '';
  const actions = Array.isArray(options.actions) ? `
    <div class="page-hero-actions">
      ${options.actions.map((action) => `
        <a class="button ${escapeHtml(action.variant || 'button-secondary')}" href="${escapeHtml(action.href || '#')}">${escapeHtml(action.label || '')}</a>
      `).join('')}
    </div>
  ` : '';
  const notes = Array.isArray(options.notes) && options.notes.length ? `
    <div class="page-hero-notes">
      ${options.notes.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}
    </div>
  ` : '';
  const aside = options.aside ? `<aside class="page-hero-aside">${options.aside}</aside>` : '';

  return `
    <section class="page-hero section">
      <div class="container page-hero-grid">
        <div class="page-hero-copy" data-reveal>
          ${eyebrow}
          <h1>${escapeHtml(options.title)}</h1>
          <p>${escapeHtml(options.description)}</p>
          ${actions}
          ${notes}
        </div>
        ${aside}
      </div>
    </section>
  `;
}

function renderSectionHead(eyebrow, title, text) {
  return `
    <div class="section-head" data-reveal>
      ${eyebrow ? `<span class="section-pill">${escapeHtml(eyebrow)}</span>` : ''}
      <h2>${escapeHtml(title)}</h2>
      ${text ? `<p>${escapeHtml(text)}</p>` : ''}
    </div>
  `;
}

function renderMarketingLayout(options) {
  const lang = options.lang === 'uk' ? 'uk' : 'en';
  const copy = getMarketingCopy(lang);
  const title = escapeHtml(options.title || 'Chat Platform');
  const description = escapeHtml(options.description || 'Premium website conversation system.');
  const activeKey = escapeHtml(options.activeKey || '');
  const content = String(options.content || '');
  const pathname = String(options.pathname || '/');

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      :root {
        color-scheme: dark;
        --bg: #09090b;
        --bg-soft: #111113;
        --panel: rgba(17, 17, 19, 0.88);
        --panel-soft: rgba(255, 255, 255, 0.03);
        --line: #1e1e22;
        --line-soft: rgba(255,255,255,0.06);
        --text: #f4f4f5;
        --muted: #a1a1aa;
        --soft: #6b7280;
        --accent: #3b82f6;
        --accent-strong: #93c5fd;
        --teal: #66d7c1;
        --warn: #f6a98f;
        --shadow-lg: 0 24px 64px rgba(0, 0, 0, 0.28);
        --container: 1180px;
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        min-width: 320px;
        font-family: 'Geist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 50% -10%, rgba(59,130,246,0.08), transparent 34%),
          linear-gradient(180deg, #09090b 0%, #0d0d10 45%, #0a0a0d 100%);
      }
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        opacity: 0.35;
        pointer-events: none;
        z-index: 1000;
      }
      body::after {
        content: '';
        position: fixed;
        top: 0;
        inset-inline: 0;
        width: 100%;
        height: 520px;
        background-image:
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
        background-size: 60px 60px;
        opacity: 0.18;
        pointer-events: none;
        mask-image: radial-gradient(ellipse 78% 58% at 50% 0%, black, transparent);
      }
      a { color: inherit; text-decoration: none; }
      button { font: inherit; }
      .container {
        width: min(var(--container), calc(100% - 40px));
        margin: 0 auto;
      }
      .section { position: relative; padding: 112px 0; }
      .section-head {
        display: grid;
        gap: 14px;
        max-width: 760px;
        margin-bottom: 34px;
      }
      .section-pill,
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        width: fit-content;
        padding: 8px 12px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.03);
        color: var(--accent-strong);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .section-head h2,
      .page-hero-copy h1 {
        margin: 0;
        font-family: 'Bricolage Grotesque', 'Geist', sans-serif;
        font-weight: 600;
        letter-spacing: -0.045em;
      }
      .section-head h2 {
        font-size: clamp(2rem, 4vw, 3.3rem);
        line-height: 1.03;
      }
      .section-head p,
      .page-hero-copy p,
      .footer-brand p,
      .footer-col p {
        margin: 0;
        color: var(--muted);
        font-size: 1.04rem;
        line-height: 1.72;
      }
      .site-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 40;
        backdrop-filter: blur(20px);
        background: rgba(9, 9, 11, 0.58);
        border-bottom: 1px solid transparent;
        transition: background 220ms ease, border-color 220ms ease;
      }
      .site-header.is-scrolled {
        background: rgba(9, 9, 11, 0.84);
        border-bottom-color: var(--line);
      }
      .header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        min-height: 72px;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 16px;
        font-weight: 700;
        letter-spacing: -0.03em;
      }
      .brand-mark {
        width: 30px;
        height: 30px;
        border-radius: 7px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(145deg, rgba(120, 166, 255, 0.9), rgba(102, 215, 193, 0.75));
        color: #071019;
        font-family: 'Bricolage Grotesque', sans-serif;
        font-size: 0.82rem;
        box-shadow: 0 14px 30px rgba(120, 166, 255, 0.22);
      }
      .brand-copy small {
        display: block;
        color: var(--soft);
        font-size: 0.74rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .nav-links {
        display: flex;
        align-items: center;
        gap: 24px;
        color: var(--muted);
        font-size: 0.92rem;
      }
      .nav-links a.is-active,
      .nav-links a:hover { color: var(--text); }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .lang-switcher {
        display: inline-flex;
        align-items: center;
        padding: 4px;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 12px;
        background: rgba(255,255,255,0.03);
      }
      .lang-switcher a {
        min-width: 42px;
        padding: 8px 10px;
        border-radius: 8px;
        color: var(--muted);
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-align: center;
      }
      .lang-switcher a.is-active {
        background: rgba(120, 166, 255, 0.16);
        color: var(--text);
      }
      .button {
        appearance: none;
        border: 1px solid transparent;
        border-radius: 6px;
        padding: 14px 19px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: -0.015em;
        cursor: pointer;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease, box-shadow 180ms ease;
      }
      .button:hover { transform: translateY(-1px); }
      .button-primary {
        background: var(--accent);
        color: #fff;
        box-shadow: 0 8px 24px rgba(59,130,246,0.3);
      }
      .button-secondary {
        border-color: var(--line);
        background: rgba(255,255,255,0.015);
        color: var(--text);
      }
      .page-hero {
        padding: 126px 0 72px;
        position: relative;
        overflow: hidden;
      }
      .page-hero::before {
        content: '';
        position: absolute;
        top: -180px;
        left: 50%;
        transform: translateX(-50%);
        width: 760px;
        height: 520px;
        background: radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 72%);
        pointer-events: none;
      }
      .page-hero::after {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
        background-size: 60px 60px;
        mask-image: radial-gradient(ellipse 78% 58% at 50% 0%, black, transparent);
        opacity: 0.16;
        pointer-events: none;
      }
      .page-hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
        gap: 48px;
        align-items: center;
        position: relative;
        z-index: 1;
      }
      .page-hero-copy { max-width: 590px; }
      .page-hero-copy h1 {
        font-size: clamp(3rem, 5.8vw, 5.2rem);
        line-height: 1;
        letter-spacing: -0.055em;
        margin: 16px 0 16px;
      }
      .page-hero-copy p {
        max-width: 46ch;
        font-size: 1.02rem;
      }
      .page-hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 28px;
      }
      .page-hero-notes {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 20px;
        color: var(--soft);
        font-size: 0.9rem;
      }
      .page-hero-notes span {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .page-hero-notes span::before {
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--teal);
      }
      .page-hero-aside,
      .marketing-panel,
      .plan-card,
      .pricing-note,
      .faq-item,
      .demo-brief,
      .footer-grid {
        position: relative;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(12, 24, 38, 0.9), rgba(8, 16, 26, 0.92));
        box-shadow: var(--shadow-lg);
      }
      .page-hero-aside,
      .marketing-panel,
      .demo-brief { border-radius: 26px; padding: 24px; }
      .page-hero-aside {
        background:
          linear-gradient(180deg, rgba(12, 24, 38, 0.92), rgba(8, 16, 26, 0.94));
      }
      .page-hero-aside { display: grid; gap: 16px; }
      .panel-grid,
      .capability-grid,
      .shot-grid,
      .pricing-grid,
      .faq-grid,
      .demo-grid,
      .journey-grid,
      .seo-grid {
        display: grid;
        gap: 16px;
      }
      .panel-grid.two,
      .shot-grid,
      .journey-grid,
      .demo-grid,
      .seo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .capability-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .pricing-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .faq-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .panel-item,
      .capability-item,
      .plan-points li,
      .journey-step,
      .seo-item,
      .demo-step {
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.03);
        border-radius: 18px;
      }
      .panel-item,
      .capability-item,
      .journey-step,
      .seo-item,
      .demo-step { padding: 18px; }
      .panel-item strong,
      .capability-item strong,
      .plan-card h3,
      .journey-step strong,
      .seo-item strong,
      .demo-step strong {
        display: block;
        margin-bottom: 8px;
        font-size: 1.04rem;
      }
      .panel-item p,
      .capability-item p,
      .plan-card p,
      .journey-step p,
      .seo-item p,
      .demo-step p,
      .pricing-note p {
        margin: 0;
        color: var(--muted);
        line-height: 1.72;
      }
      .product-diagram {
        display: grid;
        gap: 14px;
      }
      .shot-card {
        display: grid;
        gap: 12px;
        margin: 0;
      }
      .shot-meta span {
        display: inline-flex;
        margin-bottom: 6px;
        color: var(--accent-strong);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .shot-meta strong {
        display: block;
        margin-bottom: 6px;
        font-size: 1rem;
      }
      .shot-meta p {
        margin: 0;
        color: var(--muted);
        line-height: 1.65;
      }
      .shot-frame {
        overflow: hidden;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(4, 10, 18, 0.78);
        box-shadow: 0 18px 38px rgba(0, 0, 0, 0.24);
      }
      .shot-frame img {
        display: block;
        width: 100%;
        height: auto;
      }
      .diagram-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .diagram-node {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.03);
      }
      .diagram-node.primary { background: rgba(120,166,255,0.12); }
      .diagram-node.accent { background: rgba(102,215,193,0.12); }
      .diagram-node strong { display: block; margin-bottom: 8px; }
      .plan-card {
        border-radius: 24px;
        padding: 24px;
      }
      .plan-card.featured { border-color: rgba(120,166,255,0.28); background: linear-gradient(180deg, rgba(120,166,255,0.1), rgba(8,16,26,0.92)); }
      .plan-price {
        margin: 16px 0 10px;
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-size: 2.4rem;
        line-height: 1;
        letter-spacing: -0.05em;
      }
      .plan-price small {
        color: var(--soft);
        font-size: 0.96rem;
      }
      .plan-points {
        list-style: none;
        padding: 0;
        margin: 20px 0 0;
        display: grid;
        gap: 10px;
      }
      .plan-points li {
        padding: 12px 14px;
        color: var(--muted);
        font-size: 0.92rem;
      }
      .faq-item { border-radius: 22px; overflow: clip; }
      .faq-trigger {
        width: 100%;
        border: 0;
        padding: 22px 22px 20px;
        background: transparent;
        color: var(--text);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        text-align: left;
        cursor: pointer;
      }
      .faq-trigger span:first-child { font-size: 1rem; font-weight: 600; }
      .faq-plus {
        position: relative;
        width: 18px;
        height: 18px;
        flex: 0 0 18px;
      }
      .faq-plus::before,
      .faq-plus::after {
        content: '';
        position: absolute;
        top: 8px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--accent-strong);
        transition: transform 180ms ease, opacity 180ms ease;
      }
      .faq-plus::after { transform: rotate(90deg); }
      .faq-item.is-open .faq-plus::after { transform: rotate(90deg) scaleX(0); opacity: 0; }
      .faq-answer { max-height: 0; overflow: hidden; transition: max-height 260ms ease; }
      .faq-answer p { margin: 0; padding: 0 22px 22px; color: var(--muted); line-height: 1.75; }
      .faq-item.is-open .faq-answer { max-height: 240px; }
      .demo-brief {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
        gap: 18px;
        align-items: stretch;
      }
      .footer-grid {
        margin-top: 24px;
        padding: 28px;
        border-radius: 24px;
        display: grid;
        grid-template-columns: 1.2fr 0.8fr 0.8fr 1fr;
        gap: 18px;
      }
      .footer-col,
      .footer-brand { display: grid; gap: 10px; align-content: start; }
      .footer-col strong { font-size: 0.92rem; }
      .footer-col a,
      .footer-cta { color: var(--muted); font-size: 0.92rem; }
      .footer-col a:hover,
      .footer-cta:hover { color: var(--text); }
      [data-reveal] {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 500ms ease, transform 500ms ease;
      }
      [data-reveal].is-visible { opacity: 1; transform: translateY(0); }
      @media (max-width: 1180px) {
        .page-hero-grid,
        .demo-brief,
        .panel-grid.two,
        .journey-grid,
        .seo-grid { grid-template-columns: 1fr; }
        .capability-grid,
        .pricing-grid,
        .faq-grid,
        .footer-grid { grid-template-columns: 1fr 1fr; }
        .diagram-row { grid-template-columns: 1fr; }
      }
      @media (max-width: 960px) {
        .nav-links { display: none; }
        .page-hero { padding-top: 44px; }
        .page-hero-copy { max-width: 100%; }
        .page-hero-copy h1,
        .section-head h2 { max-width: none; }
        .footer-grid,
        .capability-grid,
        .pricing-grid,
        .faq-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 720px) {
        .container { width: min(var(--container), calc(100% - 24px)); }
        .section { padding: 72px 0; }
        .header-bar { min-height: 68px; }
        .header-actions .button-secondary { display: none; }
        .brand-mark { width: 34px; height: 34px; border-radius: 10px; }
        .page-hero-copy h1 { font-size: clamp(2.5rem, 13vw, 4rem); }
        .page-hero-actions { flex-direction: column; }
        .page-hero-actions .button { width: 100%; }
        .header-actions { gap: 8px; }
        .lang-switcher a { min-width: 38px; padding: 8px; }
      }
    </style>
  </head>
  <body>
    ${renderNav(activeKey, lang, pathname, copy)}
    <main>${content}</main>
    ${renderFooter(lang, pathname, copy)}
    <script>
      (() => {
        const siteHeader = document.querySelector('.site-header');
        const syncHeader = () => {
          if (!siteHeader) return;
          siteHeader.classList.toggle('is-scrolled', window.scrollY > 16);
        };
        syncHeader();
        window.addEventListener('scroll', syncHeader, { passive: true });

        const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
        if ('IntersectionObserver' in window) {
          const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            });
          }, { threshold: 0.18 });
          revealItems.forEach((item) => revealObserver.observe(item));
        } else {
          revealItems.forEach((item) => item.classList.add('is-visible'));
        }
        const faqItems = Array.from(document.querySelectorAll('.faq-item'));
        faqItems.forEach((item) => {
          const trigger = item.querySelector('.faq-trigger');
          if (!trigger) return;
          trigger.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');
            faqItems.forEach((entry) => {
              entry.classList.remove('is-open');
              const button = entry.querySelector('.faq-trigger');
              if (button) button.setAttribute('aria-expanded', 'false');
            });
            if (!isOpen) {
              item.classList.add('is-open');
              trigger.setAttribute('aria-expanded', 'true');
            }
          });
        });
      })();
    </script>
  </body>
</html>`;
}

function renderProductPage({ lang } = {}) {
  const copy = getMarketingCopy(lang === 'uk' ? 'uk' : 'en');
  const isUk = copy.lang === 'uk';
  const content = `
    ${renderHero({
      eyebrow: isUk ? 'Продукт' : 'Product',
      title: isUk ? 'Подивіться реальні поверхні продукту за обіцянкою головної сторінки.' : 'See the real product surfaces behind the homepage promise.',
      description: isUk ? 'Тут показано реальний віджет, guided chat flows, inbox, контакти, аналітику і налаштування, які разом формують website conversation system для запитів, quote-flow і handoff до оператора.' : 'This page shows the real widget, guided chat flows, inbox, contacts, analytics, and settings that together form the website conversation system for requests, quote flows, and operator handoff.',
      actions: [
        { href: '/demo', label: copy.cta.bookDemo, variant: 'button-primary' },
        { href: '/pricing', label: copy.cta.viewPricing, variant: 'button-secondary' }
      ],
      notes: isUk ? ['Віджет + inbox', 'Контактний профіль + ліди', 'Аналітика + налаштування'] : ['Widget + inbox', 'Contact profile + leads', 'Analytics + settings'],
      aside: `
        <div class="shot-grid">
          ${renderScreenshotCard({
            src: MARKETING_SHOTS.widgetEntry,
            eyebrow: isUk ? 'Віджет' : 'Widget',
            title: isUk ? 'Перший контакт на сторінці' : 'First contact on the page',
            text: isUk ? 'AI-асистент вітає, показує quick actions і запускає розмову без порожнього чату.' : 'The AI assistant greets visitors, shows quick actions, and starts the conversation without a blank chat.',
            alt: isUk ? 'Віджет чату на сайті' : 'Website chat widget'
          })}
          ${renderScreenshotCard({
            src: MARKETING_SHOTS.inbox,
            eyebrow: isUk ? 'Inbox' : 'Inbox',
            title: isUk ? 'Оператор бачить повний thread' : 'Operators see the full thread',
            text: isUk ? 'Розмова, статус, owner і робоча панель живуть в одному операційному вигляді.' : 'Conversation history, status, owner, and workspace panels stay in one operational view.',
            alt: isUk ? 'Inbox з активним діалогом' : 'Inbox with active thread'
          })}
        </div>
      `
    }, copy.lang, copy)}
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          isUk ? 'Ядро системи' : 'Core system',
          isUk ? 'Продукт найсильніший тоді, коли guided chat flow, inbox і контактний запис працюють разом.' : 'The product is strongest when the guided chat flow, inbox, and contact record work together.',
          isUk ? 'Тут менше абстракції і більше реальних поверхонь, які команда реально використовує для відповідей, кваліфікації, handoff і follow-up.' : 'This section uses the real surfaces a team actually uses for replies, qualification, handoff, and follow-up.'
        )}
        <div class="capability-grid">
          <article class="capability-item" data-reveal><strong>${isUk ? 'AI replies' : 'AI replies'}</strong><p>${isUk ? 'Асистент закриває прості питання одразу і веде відвідувача до правильного сценарію.' : 'The assistant handles the simple questions first and guides the visitor into the right scenario.'}</p></article>
          <article class="capability-item" data-reveal><strong>${isUk ? 'Human handoff' : 'Human handoff'}</strong><p>${isUk ? 'Коли запит складний або high-intent, розмова переходить оператору в inbox разом із контекстом.' : 'When the request is complex or high-intent, the conversation moves into the inbox with its context attached.'}</p></article>
          <article class="capability-item" data-reveal><strong>${isUk ? 'Lead capture in chat' : 'Lead capture in chat'}</strong><p>${isUk ? 'Ім’я, телефон, email, короткий опис або файл збираються прямо в чаті.' : 'Name, phone, email, a short request brief, or a file can be collected directly inside the chat.'}</p></article>
          <article class="capability-item" data-reveal><strong>${isUk ? 'Shared inbox' : 'Shared inbox'}</strong><p>${isUk ? 'Inbox тримає thread, статус, source page, призначення й operator workflow в одному місці.' : 'The inbox keeps the thread, status, source page, assignment, and operator workflow together.'}</p></article>
          <article class="capability-item" data-reveal><strong>${isUk ? 'Contact records' : 'Contact records'}</strong><p>${isUk ? 'Кожна розмова може оновити контактний запис із lead-статусом, operator ownership і історією діалогів.' : 'Each conversation can update a contact record with lead status, operator ownership, and dialogue history.'}</p></article>
          <article class="capability-item" data-reveal><strong>${isUk ? 'Flow settings' : 'Flow settings'}</strong><p>${isUk ? 'Quick actions, welcome text, fallback до оператора й сценарії чату налаштовуються під конкретний сайт.' : 'Quick actions, welcome text, operator fallback, and chat scenarios can be configured per site.'}</p></article>
        </div>
        <div class="shot-grid" style="margin-top:22px;">
          ${renderScreenshotCard({
            src: MARKETING_SHOTS.contacts,
            eyebrow: isUk ? 'Контакти' : 'Contacts',
            title: isUk ? 'Контактний список і lead-статуси' : 'Contact list and lead statuses',
            text: isUk ? 'Окрема поверхня для контактів, активних лідів, assigned статусів і швидкого експорту.' : 'A dedicated surface for contacts, active leads, assigned status, and export-ready records.',
            alt: isUk ? 'Сторінка контактів' : 'Contacts page'
          })}
          ${renderScreenshotCard({
            src: MARKETING_SHOTS.settings,
            eyebrow: isUk ? 'Налаштування' : 'Settings',
            title: isUk ? 'Керуйте виглядом віджета і chat flows' : 'Control widget identity and chat flows',
            text: isUk ? 'Settings показують welcome text, quick actions, operator fallback і live preview у тому ж місці.' : 'Settings cover welcome text, quick actions, operator fallback, and a live preview in one place.',
            alt: isUk ? 'Налаштування чату' : 'Chat settings'
          })}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          isUk ? 'Потік продукту' : 'Product flow',
          isUk ? 'Від сценарію у віджеті до inbox, контактів і аналітики.' : 'From a widget scenario to inbox, contacts, and analytics.',
          isUk ? 'Реальний шлях такий: відвідувач відкриває віджет, обирає сценарій, guided flow збирає деталі, inbox приймає handoff, контакти зберігають lead data, аналітика показує активність.' : 'The real path is concrete: the visitor opens the widget, chooses a scenario, the guided flow collects the details, the inbox handles the handoff, contacts store the lead data, and analytics show the activity.'
        )}
        <div class="shot-grid">
          ${renderScreenshotCard({
            src: MARKETING_SHOTS.widgetEntry,
            eyebrow: isUk ? 'Крок 1' : 'Step 1',
            title: isUk ? 'AI відповідає на сайті одразу' : 'AI replies on the site immediately',
            text: isUk ? 'Welcome text і quick actions запускають правильний тип розмови: ціна, час друку, файл або питання.' : 'Welcome text and quick actions start the right kind of conversation: pricing, timing, file upload, or a question.',
            alt: isUk ? 'Початковий стан віджета' : 'Widget entry'
          })}
          ${renderScreenshotCard({
            src: MARKETING_SHOTS.leadCapture,
            eyebrow: isUk ? 'Крок 2' : 'Step 2',
            title: isUk ? 'Файл і деталі збираються всередині чату' : 'Files and details are collected inside the chat',
            text: isUk ? 'Коли сценарій це потребує, користувач одразу завантажує модель або залишає структуровані деталі без окремої форми.' : 'When the flow needs it, the visitor can upload a model or leave structured details without being pushed to a separate form.',
            alt: isUk ? 'Збір файлу і деталей у чаті' : 'Lead capture in widget'
          })}
          ${renderScreenshotCard({
            src: MARKETING_SHOTS.inbox,
            eyebrow: isUk ? 'Крок 3' : 'Step 3',
            title: isUk ? 'Inbox продовжує розмову без втрати контексту' : 'The inbox continues the conversation without losing context',
            text: isUk ? 'Оператор бачить активний діалог, AI handling, статус і робочу панель поруч із thread.' : 'The operator sees the active conversation, AI handling, status, and workspace panels alongside the thread.',
            alt: isUk ? 'Inbox з активним діалогом' : 'Inbox active thread'
          })}
          ${renderScreenshotCard({
            src: MARKETING_SHOTS.analytics,
            eyebrow: isUk ? 'Крок 4' : 'Step 4',
            title: isUk ? 'Аналітика дає видимість по активності' : 'Analytics make activity visible',
            text: isUk ? 'Overview показує total chats, AI vs human handled і джерела активності без вигаданого BI-шару.' : 'The overview shows total chats, AI vs human handled, and activity sources without pretending to be a full BI layer.',
            alt: isUk ? 'Огляд аналітики' : 'Analytics overview'
          })}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          isUk ? 'Видимість по кількох сайтах' : 'Multi-site visibility',
          isUk ? 'Основа для кількох сайтів є, але без перебільшення maturity.' : 'The foundation for multiple sites exists, without overstating maturity.',
          isUk ? 'Навіть якщо перший запуск на одному сайті, поточні surfaces уже показують source page, inbox, контакти й flow settings як одну зв’язану систему.' : 'Even if the first rollout is one site, the current surfaces already show the source page, inbox, contacts, and flow settings as one connected system.'
        )}
        <div class="panel-grid two">
          <article class="panel-item" data-reveal><strong>${isUk ? 'Централізовані операції' : 'Centralized operations'}</strong><p>${isUk ? 'Один inbox, окремі контактні записи і аналітика chat activity дають єдину картину для кількох джерел трафіку.' : 'One inbox, contact records, and chat activity analytics create a single operating view across multiple traffic sources.'}</p></article>
          <article class="panel-item" data-reveal><strong>${isUk ? 'Керований rollout' : 'Managed rollout'}</strong><p>${isUk ? 'Settings дозволяють підлаштувати welcome text, quick actions і fallback без розриву базового workflow.' : 'Settings let you tune welcome text, quick actions, and fallback behavior without fragmenting the core workflow.'}</p></article>
        </div>
      </div>
    </section>
  `;
  return renderMarketingLayout({
    title: isUk ? 'Продукт | Chat Platform' : 'Product | Chat Platform',
    description: isUk ? 'Детальніше про AI-асистента, передачу оператору, збір лідів, inbox, контактний профіль, аналітику та автоматизацію.' : 'Explore the AI assistant, human handoff, lead capture, inbox, contact profile, analytics, and automation.',
    activeKey: 'product',
    pathname: '/product',
    lang: copy.lang,
    content
  });
}

function renderUseCasesPage({ lang } = {}) {
  const copy = getMarketingCopy(lang === 'uk' ? 'uk' : 'en');
  const isUk = copy.lang === 'uk';
  const cases = isUk
    ? [
        ['Нерухомість', 'Заявки із сайту приходять після робочого часу, а відвідувачі хочуть швидко зрозуміти ціну, терміни або наступний крок.', 'Віджет може відповісти першим, зібрати контакти й передати важливий запит у shared inbox агента.', 'Швидша кваліфікація, менше втрачених заявок, кращий handoff у команду.'],
        ['Ecommerce', 'Покупці вагаються через доставку, наявність, кастомізацію або питання по товару й залишають сторінку.', 'Guided chat flow відповідає на прості питання, веде до потрібного сценарію і передає складні запити оператору.', 'Менше abandonment, більше збережених розмов, видимість того, що реально питають покупці.'],
        ['Локальні послуги', 'Запити на прорахунок часто приходять у неробочий час і вимагають фото, файл або короткий опис задачі.', 'Чат збирає контакти, опис, файл і одразу створює зрозумілий thread для inbox та contact record.', 'Краща якість запиту, менше пропущених лідів, простіший follow-up.'],
        ['Агенції', 'Перші discovery-розмови часто розкидані між формами, месенджерами і ручними нотатками.', 'Сайтова розмова може зібрати scope, budget signals, timeline і передати все в один operator workflow.', 'Менше ручного збору деталей, краща якість intake, чистіший shared inbox.'],
        ['Кастомне виробництво', 'Клієнтам потрібно поставити питання, отримати прорахунок і часто одразу надіслати файл або модель.', 'Guided flow у чаті приймає файл, збирає технічні деталі й тримає запит у зв’язаному inbox та contact record.', 'Сильніший quote intake, менше втрати контексту, краще видно, де запити зупиняються.']
      ]
    : [
        ['Real estate', 'Website inquiries arrive after hours, and visitors want fast answers about pricing, timing, or the next step.', 'The widget can answer first, capture contact details, and route the important request into the agent inbox with context.', 'Faster qualification, fewer missed inquiries, cleaner handoff to the team.'],
        ['Ecommerce', 'Shoppers hesitate on shipping, availability, customization, or product questions and leave before anyone replies.', 'The guided chat flow answers the simple questions, pushes the visitor into the right scenario, and hands off complex requests when needed.', 'Lower abandonment, more preserved conversations, better visibility into what visitors ask.'],
        ['Local services', 'Quote requests often arrive outside working hours and may require a photo, file, or short job description.', 'The chat collects contact details, request context, and files inside the conversation, then creates a clean inbox thread and contact record.', 'Better quote quality, fewer missed leads, and easier follow-up.'],
        ['Agencies', 'First discovery conversations are often split across forms, messaging tools, and manual notes.', 'A website conversation can capture scope, budget signals, timeline, and ownership inside one operator workflow.', 'Less manual intake, better briefs, and a cleaner shared inbox.'],
        ['Custom manufacturing', 'Customers need to ask questions, request a quote, and often upload a model or reference file immediately.', 'The guided flow can accept a file, collect technical details, and keep the request tied to the inbox thread and contact record.', 'Stronger quote intake, less lost context, and clearer visibility into where requests stall.']
      ];

  const content = `
    ${renderHero({
      eyebrow: isUk ? 'Сценарії' : 'Use cases',
      title: isUk ? 'Співвіднесіть продукт із тим бізнесом, який ви реально ведете.' : 'Match the product to the kind of business you actually run.',
      description: isUk ? 'Це не абстрактні вертикалі. Тут показано, де швидші відповіді, краща кваліфікація та чистіший follow-up дають реальну бізнес-цінність.' : 'These pages are not generic vertical labels. They show where faster replies, better qualification, and cleaner follow-up create real business value.',
      actions: [
        { href: '/demo', label: isUk ? 'Переглянути демо-шлях' : 'See a demo path', variant: 'button-primary' },
        { href: '/product', label: isUk ? 'Подивитися продукт глибше' : 'Review product depth', variant: 'button-secondary' }
      ],
      notes: isUk ? ['Команди з sales-фокусом', 'Quote-driven workflow', 'Готово до кількох сайтів'] : ['Sales-led teams', 'Quote-driven workflows', 'Multi-site visibility ready'],
      aside: `
        <div class="panel-item">
          <strong>${isUk ? 'Що об’єднує ці бізнеси' : 'What all these businesses share'}</strong>
          <p>${isUk ? 'Усі вони втрачають pipeline, коли намір на сайті високий, а відповіді повільні, деталі фрагментовані або follow-up нестабільний.' : 'They all lose pipeline when website intent is high but replies are slow, details are fragmented, or follow-up is inconsistent.'}</p>
        </div>
      `
    }, copy.lang, copy)}
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          isUk ? 'Відповідність бізнесу' : 'Business fit',
          isUk ? 'Сценарії, побудовані навколо реального пошукового й купівельного наміру.' : 'Use cases shaped around real search and buying intent.',
          isUk ? 'Кожен блок показує проблему, поведінку продукту, яка допомагає, і бізнес-результат, який це покращує.' : 'Each section gives the problem, the product behavior that helps, and the business outcome it improves.'
        )}
        <div class="seo-grid">
          ${cases.map(([name, problem, approach, outcome]) => `
            <article class="seo-item" data-reveal>
              <strong>${escapeHtml(name)}</strong>
              <p><strong>${isUk ? 'Проблема:' : 'Problem:'}</strong> ${escapeHtml(problem)}</p>
              <p><strong>${isUk ? 'Як допомагає:' : 'How it helps:'}</strong> ${escapeHtml(approach)}</p>
              <p><strong>${isUk ? 'Результат:' : 'Outcome:'}</strong> ${escapeHtml(outcome)}</p>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          isUk ? 'Шлях між сторінками' : 'Internal linking path',
          isUk ? 'Кожен сценарій природно веде на наступну сторінку, яка потрібна покупцю.' : 'Each use case naturally leads to the next page a buyer needs.',
          isUk ? 'Так сайт краще працює і для прямих відвідувачів, і для SEO, і для реклами на глибокі сторінки.' : 'That makes the site more useful for direct visitors, SEO, and paid traffic landing on deeper pages.'
        )}
        <div class="panel-grid two">
          <article class="panel-item" data-reveal><strong>${isUk ? 'Потрібна глибина по продукту?' : 'Need product depth?'}</strong><p>${isUk ? 'Перейдіть зі сценарію на сторінку продукту, щоб побачити, як AI, оператори, контакти й аналітика працюють разом.' : 'Move from the use case into the product page to see how AI, operators, contacts, and analytics fit together.'}</p><a class="footer-cta" href="/product">${isUk ? 'До продукту' : 'Go to product'}</a></article>
          <article class="panel-item" data-reveal><strong>${isUk ? 'Готові зрозуміти бюджет?' : 'Ready to qualify budget?'}</strong><p>${isUk ? 'Перейдіть у ціни та демо, щоб оцінити відповідність плану і практичний наступний крок.' : 'Move into pricing and the demo page to understand plan fit and the practical next step.'}</p><a class="footer-cta" href="/pricing">${isUk ? 'До цін' : 'Go to pricing'}</a></article>
        </div>
      </div>
    </section>
  `;
  return renderMarketingLayout({
    title: isUk ? 'Сценарії | Chat Platform' : 'Use Cases | Chat Platform',
    description: isUk ? 'Приклади для нерухомості, ecommerce, локальних сервісів, агенцій і бізнесів із прорахунком під запит.' : 'See how the platform fits real estate, ecommerce, local services, agencies, and custom quote-driven businesses.',
    activeKey: 'use-cases',
    pathname: '/use-cases',
    lang: copy.lang,
    content
  });
}

function renderPricingPage({ lang } = {}) {
  const copy = getMarketingCopy(lang === 'uk' ? 'uk' : 'en');
  const isUk = copy.lang === 'uk';
  const plans = isUk
    ? [
        { name: 'Starter', price: '$99', note: 'для одного lead-driven сайту', description: 'Для команд, яким потрібен widget із AI-відповідями, guided lead capture і базовий shared inbox.', points: ['Widget і welcome сценарії', 'Lead capture в чаті', 'Один shared inbox', 'Базова conversation analytics'], cta: { href: '/demo', label: 'Обговорити fit' } },
        { name: 'Growth', price: '$249', note: 'для активних SMB-команд', description: 'Для команд, яким потрібні operator handoff, contact records, analytics visibility і налаштовані chat flows.', points: ['Усе зі Starter', 'Human handoff і ownership', 'Contact records і source tracking', 'Flow settings і operator fallback', 'Розширена conversation analytics'], cta: { href: '/demo', label: copy.cta.bookDemo }, featured: true },
        { name: 'Custom', price: 'Контакт', note: 'для multi-site або складніших запусків', description: 'Для команд, яким потрібні складніші сценарії запуску, кілька сайтів або кастомна конфігурація flow.', points: ['Кастомний rollout', 'Конфігурація під кілька сайтів', 'Розширені сценарії widget flow', 'Підлаштована структура звітності'], cta: { href: '/demo', label: 'Обговорити вимоги' } }
      ]
    : [
        { name: 'Starter', price: '$99', note: 'for one lead-driven site', description: 'For teams that need a widget with AI replies, guided lead capture, and a basic shared inbox.', points: ['Widget and welcome scenarios', 'Lead capture inside chat', 'One shared inbox', 'Basic conversation analytics'], cta: { href: '/demo', label: 'Talk through fit' } },
        { name: 'Growth', price: '$249', note: 'for active SMB teams', description: 'For teams that need operator handoff, contact records, analytics visibility, and configurable chat flows.', points: ['Everything in Starter', 'Human handoff and ownership', 'Contact records and source tracking', 'Flow settings and operator fallback', 'Expanded conversation analytics'], cta: { href: '/demo', label: copy.cta.bookDemo }, featured: true },
        { name: 'Custom', price: 'Contact', note: 'for multi-site or higher complexity', description: 'For teams that need a more tailored rollout, multiple sites, or more specific flow configuration.', points: ['Custom rollout support', 'Multi-site configuration', 'Extended widget flow scenarios', 'Tailored reporting structure'], cta: { href: '/demo', label: 'Discuss requirements' } }
      ];

  const content = `
    ${renderHero({
      eyebrow: isUk ? 'Ціни' : 'Pricing',
      title: isUk ? 'Прозора структура цін без удавання, що весь ринок однаковий.' : 'Clear pricing structure without pretending the work is one-size-fits-all.',
      description: isUk ? 'Ці плани дають зрозумілу комерційну рамку вже зараз, залишаючи простір для фінального пакування, вибору впровадження та складніших запусків.' : 'The plans below give buyers a credible pricing frame now while leaving room for final packaging, implementation choices, and more advanced rollout needs.',
      actions: [
        { href: '/demo', label: copy.cta.bookDemo, variant: 'button-primary' },
        { href: '/product', label: copy.cta.seeIncluded, variant: 'button-secondary' }
      ],
      notes: isUk ? ['Поки не потрібен billing backend', 'Працює для кваліфікації й довіри', 'Готово до майбутньої реальної pricing-моделі'] : ['No billing backend required yet', 'Good for qualification and trust', 'Ready for a future real pricing model'],
      aside: `
        <div class="panel-item">
          <strong>${isUk ? 'Примітка щодо цін' : 'Pricing note'}</strong>
          <p>${isUk ? 'Ці плани навмисно подані як чиста комерційна структура, а не як фейковий checkout funnel. Мета тут — ясність і кваліфікація.' : 'These plans are intentionally presented as a clean commercial structure, not as a fake purchase funnel. The goal is clarity and qualification.'}</p>
        </div>
      `
    }, copy.lang, copy)}
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          copy.labels.plans,
          isUk ? 'Досить просто, щоб зрозуміти, і досить структуровано, щоб продавати.' : 'Simple enough to understand, structured enough to sell.',
          isUk ? 'Кожен план показує, для кого він, що в нього входить і коли варто перейти в демо-розмову.' : 'Each plan is framed around who it is for, what it includes, and when a buyer should move into a demo conversation.'
        )}
        <div class="pricing-grid">
          ${plans.map((plan) => `
            <article class="plan-card${plan.featured ? ' featured' : ''}" data-reveal>
              <span class="section-pill">${escapeHtml(plan.note)}</span>
              <h3>${escapeHtml(plan.name)}</h3>
              <div class="plan-price">${escapeHtml(plan.price)}${plan.price.startsWith('$') ? '<small>/mo</small>' : ''}</div>
              <p>${escapeHtml(plan.description)}</p>
              <ul class="plan-points">
                ${plan.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}
              </ul>
              <div class="page-hero-actions">
                <a class="button ${plan.featured ? 'button-primary' : 'button-secondary'}" href="${escapeHtml(plan.cta.href)}">${escapeHtml(plan.cta.label)}</a>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="pricing-note" data-reveal style="padding:24px;border-radius:24px;">
          <strong style="display:block;margin-bottom:10px;">${isUk ? 'Для чого ця сторінка цін' : 'What this pricing page is for'}</strong>
          <p>${isUk ? 'Вона зменшує тертя, кваліфікує покупця і вже зараз дає правдоподібну комерційну рамку без фейкового checkout flow чи передчасної фіксації packaging.' : 'It reduces friction, qualifies buyers, and creates a credible commercial frame today without forcing a fake checkout flow or overcommitting to packaging that is not finalized.'}</p>
        </div>
      </div>
    </section>
  `;
  return renderMarketingLayout({
    title: isUk ? 'Ціни | Chat Platform' : 'Pricing | Chat Platform',
    description: isUk ? 'Прозорі плани Starter, Growth і Custom із чітким шляхом до демо.' : 'Clean pricing for Starter, Growth, and Custom use cases with clear demo paths.',
    activeKey: 'pricing',
    pathname: '/pricing',
    lang: copy.lang,
    content
  });
}

function renderFaqPage({ lang } = {}) {
  const copy = getMarketingCopy(lang === 'uk' ? 'uk' : 'en');
  const isUk = copy.lang === 'uk';
  const faqs = isUk
    ? [
        ['Чи складно підключити?', 'Ні. Продукт додається легким embed-кодом і далі налаштовується для кожного сайту, команди та conversation flow.'],
        ['Чи може AI передати розмову людині?', 'Так. High-intent або складні діалоги можуть переходити оператору в inbox разом із transcript, source page і статусом.'],
        ['Чи можна збирати контактні дані?', 'Так. Email, телефон, короткий опис запиту, таймлайн та інші поля можна збирати прямо в розмові.'],
        ['Чи можна приймати файл або модель у чаті?', 'Так. Для запитів на прорахунок або технічних запитів чат може попросити файл і тримати його в тому ж request flow.'],
        ['Чи працює це на кількох сайтах?', 'Так. Модель workflow підтримує multi-site source tracking, централізований inbox і спільні операції.'],
        ['Чи можна кастомізувати?', 'Так. Welcome text, quick actions, fallback до оператора і chat flows можна налаштовувати під конкретний сайт.'],
        ['Чи є один спільний inbox?', 'Так. Оператори працюють з одного inbox, де пов’язані AI replies, людські відповіді, статус, source і contact record.'],
        ['Як працює звітність?', 'Аналітика показує total chats, open / closed status, AI vs human handled та іншу активність по conversations.'],
        ['Це більше для support чи sales?', 'Продукт може допомагати і там, і там, але найсильніше він зараз працює для website inquiries, qualification, quote requests і follow-up.'],
        ['Чи потрібна технічна допомога для встановлення?', 'Зазвичай ні для базового запуску. Для складніших сценаріїв може знадобитися технічна допомога залежно від сайту й workflow.']
      ]
    : [
        ['Is setup difficult?', 'No. The product is added with a lightweight embed and then configured for each site, team, and conversation flow.'],
        ['Can AI hand conversations to a human?', 'Yes. High-intent or complex conversations can move into the inbox with the transcript, source page, and current status preserved.'],
        ['Can it capture lead details?', 'Yes. Email, phone, a short request brief, timing, and other fields can be collected inside the conversation.'],
        ['Can it accept a file or model upload in chat?', 'Yes. For quote-led or technical requests, the chat can ask for a file and keep it inside the same request flow.'],
        ['Can it work across multiple sites?', 'Yes. The workflow model supports multi-site source tracking, centralized inbox visibility, and shared operations.'],
        ['Can it be customized?', 'Yes. Welcome text, quick actions, operator fallback, and chat flows can be configured for each site.'],
        ['Is there one shared inbox?', 'Yes. Operators work from one inbox that keeps AI replies, human replies, status, source, and the linked contact record together.'],
        ['How does reporting work?', 'Analytics show total chats, open and closed status, AI vs human handled, and other conversation activity.'],
        ['Is this for support or sales?', 'It can help with both, but today the strongest fit is website inquiries, qualification, quote requests, and follow-up.'],
        ['Do I need technical help to install it?', 'Usually not for a basic setup. More advanced implementation may benefit from technical help depending on the site and workflow requirements.']
      ];

  const content = `
    ${renderHero({
      eyebrow: 'FAQ',
      title: isUk ? 'Зніміть заперечення до того, як вони сповільнять рішення.' : 'Answer objections cleanly before they slow the decision.',
      description: isUk ? 'Ця сторінка існує, щоб покупець швидко переходив від інтересу до впевненості без пошуку практичних відповідей по всій головній.' : 'This page exists so the buyer can move from interest to confidence without hunting through a long homepage for practical answers.',
      actions: [
        { href: '/demo', label: copy.cta.bookDemo, variant: 'button-primary' },
        { href: '/pricing', label: isUk ? 'Переглянути ціни' : 'Review pricing', variant: 'button-secondary' }
      ],
      notes: isUk ? ['Підключення', 'Handoff', 'Кастомізація', 'Операції на кількох сайтах'] : ['Setup', 'Handoff', 'Customization', 'Multi-site operations']
    }, copy.lang, copy)}
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          copy.labels.questions,
          isUk ? 'Фокусні відповіді про запуск, workflow і fit для бізнесу.' : 'Focused answers for setup, workflow, and business fit.',
          isUk ? 'Мета — зняти тертя, а не втопити відвідувача в загальній документації.' : 'The goal is to remove friction, not to drown the visitor in generic documentation.'
        )}
        <div class="faq-grid">
          ${faqs.map(([question, answer], index) => `
            <article class="faq-item${index === 0 ? ' is-open' : ''}" data-reveal>
              <button class="faq-trigger" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}">
                <span>${escapeHtml(question)}</span>
                <span class="faq-plus"></span>
              </button>
              <div class="faq-answer">
                <p>${escapeHtml(answer)}</p>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;
  return renderMarketingLayout({
    title: 'FAQ | Chat Platform',
    description: isUk ? 'Відповіді про встановлення, передачу оператору, кастомізацію, звітність і multi-site роботу.' : 'Focused answers for setup, handoff, customization, reporting, and multi-site operations.',
    activeKey: 'faq',
    pathname: '/faq',
    lang: copy.lang,
    content
  });
}

function renderDemoPage({ lang } = {}) {
  const copy = getMarketingCopy(lang === 'uk' ? 'uk' : 'en');
  const isUk = copy.lang === 'uk';
  const content = `
    ${renderHero({
      eyebrow: isUk ? 'Демо' : 'Demo',
      title: isUk ? 'Покажіть реальний workflow продукту, а не вигаданий signup flow.' : 'Show the real product workflow, not a fake signup flow.',
      description: isUk ? 'Ця сторінка веде покупця до найчеснішого наступного кроку: побачити реальний inbox, guided request flows, contact records і зрозуміти, як це ляже на його сайт.' : 'This page moves the buyer to the most honest next step: inspect the real inbox, the guided request flows, the contact records, and decide how the workflow would fit the site.',
      actions: [
        { href: '/inbox', label: isUk ? 'Відкрити demo inbox' : 'Open demo inbox', variant: 'button-primary' },
        { href: '/product', label: copy.cta.seeProduct, variant: 'button-secondary' }
      ],
      notes: isUk ? ['Реальний inbox', 'Реальні widget screens', 'Без фейкових форм'] : ['Real inbox', 'Real widget screens', 'No fake forms'],
      aside: `
        ${renderScreenshotCard({
          src: MARKETING_SHOTS.inbox,
          eyebrow: isUk ? 'Живий workflow' : 'Live workflow',
          title: isUk ? 'Що ви реально побачите на демо' : 'What you actually see in a demo',
          text: isUk ? 'Активний inbox thread, робочу панель оператора і те, як AI handoff переходить у людську відповідь.' : 'An active inbox thread, the operator workspace, and how AI handoff turns into a human reply.',
          alt: isUk ? 'Inbox для демо' : 'Demo inbox'
        })}
      `
    }, copy.lang, copy)}
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          copy.labels.demoPath,
          isUk ? 'Корисна публічна демо-сторінка в межах поточного продукту.' : 'A useful public-facing demo page within the current product reality.',
          isUk ? 'Оскільки повного scheduling або signup backend ще немає, ця сторінка чесно показує, що саме побачить покупець у live product surfaces.' : 'Because there is not yet a full scheduling or signup backend, this page honestly shows what a buyer would actually see in the live product surfaces.'
        )}
        <div class="demo-brief" data-reveal>
          <div class="demo-grid">
            <article class="demo-step"><strong>${isUk ? 'Для кого це' : 'Who it is for'}</strong><p>${isUk ? 'Для команд, які отримують ліди із сайту і хочуть швидшу першу відповідь, чистішу кваліфікацію та кращу видимість follow-up.' : 'Teams that rely on their website for leads and need faster first response, cleaner qualification, or better follow-up visibility.'}</p></article>
            <article class="demo-step"><strong>${isUk ? 'Що ви побачите' : 'What you will see'}</strong><p>${isUk ? 'AI greeting flow, upload / request сценарії, активний inbox thread, контактний профіль і огляд аналітики.' : 'The AI greeting flow, upload / request flows, the active inbox thread, the contact profile, and the analytics overview.'}</p></article>
            <article class="demo-step"><strong>${isUk ? 'Що підготувати' : 'What you should prepare'}</strong><p>${isUk ? 'Типові питання покупців, поточний шлях ліда, типові проблеми кваліфікації і чи маєте один сайт або кілька.' : 'Typical buyer questions, current lead flow, common qualification issues, and whether you operate one site or many.'}</p></article>
            <article class="demo-step"><strong>${isUk ? 'Основна дія сьогодні' : 'Primary action today'}</strong><p>${isUk ? 'Використати наявний workspace як чесну точку входу, поки немає повного публічного scheduling flow.' : 'Use the existing product workspace as the honest entry point until a full public scheduling flow is added.'}</p></article>
          </div>
          <div class="marketing-panel">
            <strong style="display:block;margin-bottom:10px;">${isUk ? 'Рекомендовані наступні дії' : 'Suggested next actions'}</strong>
            <div class="shot-grid" style="margin-bottom:16px;">
              ${renderScreenshotCard({
                src: MARKETING_SHOTS.leadCapture,
                eyebrow: isUk ? 'Віджет' : 'Widget',
                title: isUk ? 'Збір деталей і файлів' : 'Collecting details and files',
                text: isUk ? 'Корисно для quote-запитів, де потрібно отримати файл, короткий опис і контактні дані.' : 'Useful for quote requests where the team needs a file, a short brief, and contact details.',
                alt: isUk ? 'Збір файлу у віджеті' : 'File upload in widget'
              })}
              ${renderScreenshotCard({
                src: MARKETING_SHOTS.contacts,
                eyebrow: isUk ? 'Контакт' : 'Contact',
                title: isUk ? 'Контактний запис після діалогу' : 'The contact record after the conversation',
                text: isUk ? 'Показує, що розмова не зникає: вона стає usable contact record для наступного кроку.' : 'Shows that the conversation does not disappear: it becomes a usable contact record for the next step.',
                alt: isUk ? 'Контакти після розмови' : 'Contacts after conversation'
              })}
            </div>
            <div class="panel-grid">
              <article class="panel-item"><strong>${isUk ? 'Відкрити demo inbox' : 'Open the demo inbox'}</strong><p>${isUk ? 'Найкраще для тих, хто хоче одразу подивитися структуру live workspace.' : 'Best for visitors who want to inspect the live workspace structure right now.'}</p><a class="footer-cta" href="/inbox">${isUk ? 'До inbox' : 'Go to inbox'}</a></article>
              <article class="panel-item"><strong>${isUk ? 'Потрібно більше контексту спочатку?' : 'Need more context first?'}</strong><p>${isUk ? 'Перегляньте сторінку продукту або цін, перш ніж заходити у workspace.' : 'Review the product page or pricing page before stepping into the workspace.'}</p><a class="footer-cta" href="/product">${isUk ? 'До продукту' : 'Go to product'}</a></article>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  return renderMarketingLayout({
    title: isUk ? 'Демо | Chat Platform' : 'Demo | Chat Platform',
    description: isUk ? 'Чіткий публічний шлях до демо без вигаданого signup backend.' : 'Clear demo path for serious buyers without inventing a fake public signup backend.',
    activeKey: 'demo',
    pathname: '/demo',
    lang: copy.lang,
    content
  });
}

module.exports = {
  renderProductPage,
  renderUseCasesPage,
  renderPricingPage,
  renderFaqPage,
  renderDemoPage
};
