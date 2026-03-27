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
        ? 'AI-асистент, передача оператору, збір лідів, inbox, аналітика та автоматизація для серйозних розмов на сайті.'
        : 'AI assistant, operator handoff, lead capture, inbox, analytics, and automation for serious website conversations.',
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
    <style>
      :root {
        color-scheme: dark;
        --bg: #071019;
        --bg-soft: #0b1624;
        --panel: rgba(10, 22, 36, 0.86);
        --panel-soft: rgba(255, 255, 255, 0.03);
        --line: rgba(155, 173, 194, 0.18);
        --line-soft: rgba(255,255,255,0.06);
        --text: #f4f7fb;
        --muted: #96a8bc;
        --soft: #718299;
        --accent: #78a6ff;
        --accent-strong: #a9c2ff;
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
        font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(120, 166, 255, 0.18), transparent 28%),
          radial-gradient(circle at 90% 10%, rgba(102, 215, 193, 0.14), transparent 24%),
          linear-gradient(180deg, #071019 0%, #08121d 24%, #091521 54%, #060b12 100%);
      }
      a { color: inherit; text-decoration: none; }
      button { font: inherit; }
      .container {
        width: min(var(--container), calc(100% - 40px));
        margin: 0 auto;
      }
      .section { position: relative; padding: 92px 0; }
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
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-weight: 700;
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
        position: sticky;
        top: 0;
        z-index: 40;
        backdrop-filter: blur(18px);
        background: rgba(7, 16, 25, 0.8);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
        width: 38px;
        height: 38px;
        border-radius: 11px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(145deg, rgba(120, 166, 255, 0.9), rgba(102, 215, 193, 0.75));
        color: #071019;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 0.94rem;
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
        border-radius: 12px;
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
        background: linear-gradient(180deg, #8ab2ff 0%, #6f9cff 100%);
        color: #06101a;
        box-shadow: 0 18px 38px rgba(120, 166, 255, 0.24);
      }
      .button-secondary {
        border-color: rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.025);
        color: var(--text);
      }
      .page-hero { padding: 70px 0 36px; }
      .page-hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
        gap: 42px;
        align-items: center;
      }
      .page-hero-copy { max-width: 560px; }
      .page-hero-copy h1 {
        font-size: clamp(2.8rem, 6vw, 5rem);
        line-height: 0.96;
        margin: 14px 0;
      }
      .page-hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 24px;
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
        background: linear-gradient(180deg, rgba(12, 24, 38, 0.88), rgba(8, 16, 26, 0.9));
        box-shadow: var(--shadow-lg);
      }
      .page-hero-aside,
      .marketing-panel,
      .demo-brief { border-radius: 26px; padding: 24px; }
      .page-hero-aside { display: grid; gap: 16px; }
      .panel-grid,
      .capability-grid,
      .pricing-grid,
      .faq-grid,
      .demo-grid,
      .journey-grid,
      .seo-grid {
        display: grid;
        gap: 16px;
      }
      .panel-grid.two,
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
        margin-top: 36px;
        padding: 28px;
        border-radius: 28px;
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
      title: isUk ? 'Подивіться всю систему за обіцянкою головної сторінки.' : 'See the full system behind the homepage promise.',
      description: isUk ? 'Продукт поєднує AI-відповіді, передачу оператору, збір лідів, контактні профілі, аналітику та автоматизацію в один операційний шар для розмов на сайті.' : 'The product combines AI response, human handoff, lead capture, contact records, analytics, and automation into one operating layer for website conversations.',
      actions: [
        { href: '/demo', label: copy.cta.bookDemo, variant: 'button-primary' },
        { href: '/pricing', label: copy.cta.viewPricing, variant: 'button-secondary' }
      ],
      notes: isUk ? ['AI-асистент + оператори', 'Збір лідів + контактний профіль', 'Аналітика + автоматизація'] : ['AI assistant + operators', 'Lead capture + contact profile', 'Analytics + automation'],
      aside: `
        <div class="panel-item">
          <strong>${isUk ? 'Що платформа замінює' : 'What the platform replaces'}</strong>
          <p>${isUk ? 'Пасивний чат, розірвані форми, хаотичні inbox-и та follow-up, що тримається на пам’яті команди.' : 'Passive chat, disconnected forms, messy inboxes, and follow-up that depends on memory.'}</p>
        </div>
        <div class="product-diagram">
          <div class="diagram-row">
            <div class="diagram-node primary"><strong>${isUk ? 'Відвідувач сайту' : 'Website visitor'}</strong><span>${isUk ? 'Отримує підказку одразу' : 'Prompted instantly'}</span></div>
            <div class="diagram-node"><strong>${isUk ? 'AI-асистент' : 'AI assistant'}</strong><span>${isUk ? 'Відповідає і кваліфікує' : 'Answers and qualifies'}</span></div>
            <div class="diagram-node accent"><strong>${isUk ? 'Оператор' : 'Operator'}</strong><span>${isUk ? 'Підключається коли треба' : 'Joins when needed'}</span></div>
          </div>
          <div class="diagram-row">
            <div class="diagram-node"><strong>${isUk ? 'Збір ліда' : 'Lead capture'}</strong><span>${isUk ? 'Email, телефон, обсяг, термін' : 'Email, phone, scope, timing'}</span></div>
            <div class="diagram-node"><strong>${isUk ? 'Спільний inbox' : 'Shared inbox'}</strong><span>${isUk ? 'Власник, нотатки, статус' : 'Owner, notes, status'}</span></div>
            <div class="diagram-node"><strong>${isUk ? 'Аналітика' : 'Analytics'}</strong><span>${isUk ? 'Видимість наміру і джерела' : 'Intent and source visibility'}</span></div>
          </div>
        </div>
      `
    }, copy.lang, copy)}
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          isUk ? 'Ядро системи' : 'Core system',
          isUk ? 'Продукт найсильніший тоді, коли всі частини працюють разом.' : 'The product is strongest when the parts work together.',
          isUk ? 'Ця сторінка йде глибше за головну, щоб покупець зрозумів, як кожен шар впливає на кваліфікацію, follow-up і видимість процесу.' : 'This page goes deeper than the homepage so buyers can understand how each layer contributes to qualification, follow-up, and visibility.'
        )}
        <div class="capability-grid">
          <article class="capability-item" data-reveal><strong>${isUk ? 'AI-асистент' : 'AI assistant'}</strong><p>${isUk ? 'Відповідає на типові питання, пропонує наступні кроки і тримає першу відповідь миттєвою.' : 'Answers routine questions, suggests next steps, and keeps the first response instant.'}</p></article>
          <article class="capability-item" data-reveal><strong>${isUk ? 'Передача оператору' : 'Human handoff'}</strong><p>${isUk ? 'Передає sales-ready або складні діалоги оператору з повним transcript.' : 'Escalates sales-ready or complex conversations to an operator with the full transcript attached.'}</p></article>
          <article class="capability-item" data-reveal><strong>${isUk ? 'Збір лідів' : 'Lead capture'}</strong><p>${isUk ? 'Збирає контакти й деталі проєкту прямо в діалозі, поки намір ще сильний.' : 'Collects contact details and project information inside the conversation while motivation is still high.'}</p></article>
          <article class="capability-item" data-reveal><strong>${isUk ? 'Спільний inbox' : 'Shared inbox'}</strong><p>${isUk ? 'Тримає власника, нотатки, статус і джерело в одній черзі для всіх сайтів і операторів.' : 'Keeps ownership, notes, status, and source tracking in one queue across sites and operators.'}</p></article>
          <article class="capability-item" data-reveal><strong>${isUk ? 'Контактний профіль' : 'Contact profile'}</strong><p>${isUk ? 'Перетворює чат на повноцінний запис із історією, наміром, джерелом і станом follow-up.' : 'Turns chats into usable records with history, intent, source, and follow-up state.'}</p></article>
          <article class="capability-item" data-reveal><strong>${isUk ? 'Автоматизація' : 'Automation'}</strong><p>${isUk ? 'Призначає, тегує, нагадує й ескалує автоматично, щоб кваліфікований попит не зависав.' : 'Assigns, tags, reminds, and escalates automatically so qualified demand does not stall.'}</p></article>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          isUk ? 'Потік продукту' : 'Product flow',
          isUk ? 'Від першого повідомлення до вимірюваного follow-up.' : 'From first message to measurable follow-up.',
          isUk ? 'Розмова не закінчується на привітанні. Робочий процес продовжується через кваліфікацію, призначення відповідального і звітність.' : 'The conversation does not stop at hello. The workflow continues through qualification, ownership, and reporting.'
        )}
        <div class="journey-grid">
          <article class="journey-step" data-reveal><strong>${isUk ? '1. Залучайте одразу' : '1. Engage immediately'}</strong><p>${isUk ? 'Асистент вітає відвідувачів підказками, прив’язаними до цін, запитів, підтримки або sales intent.' : 'The assistant greets visitors with prompts tied to pricing, quotes, support, or sales intent.'}</p></article>
          <article class="journey-step" data-reveal><strong>${isUk ? '2. Відповідайте в контексті' : '2. Answer in context'}</strong><p>${isUk ? 'Питання обробляються миттєво, тому відвідувач не йде до конкурента.' : 'Questions are handled instantly so visitors stay engaged instead of leaving for a competitor.'}</p></article>
          <article class="journey-step" data-reveal><strong>${isUk ? '3. Збирайте структуровані дані' : '3. Capture structured details'}</strong><p>${isUk ? 'Email, телефон, термін, бюджет або scope збираються в момент, коли намір уже помітний.' : 'Email, phone, timeline, budget, or project scope are collected when intent is visible.'}</p></article>
          <article class="journey-step" data-reveal><strong>${isUk ? '4. Передавайте з контекстом' : '4. Hand off with context'}</strong><p>${isUk ? 'Оператор підключається вже з transcript, owner і captured details на місці.' : 'Operators join the conversation with the transcript, owner, and captured details already in place.'}</p></article>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          isUk ? 'Видимість по кількох сайтах' : 'Multi-site visibility',
          isUk ? 'Підготовлено до SaaS-операцій, коли вони знадобляться.' : 'Structured for SaaS-style operations when you need them.',
          isUk ? 'Навіть якщо стартуєте з одного сайту, модель підтримує централізовані workflow між кількома майданчиками і командами.' : 'Even if the first use case is one site, the model supports centralized workflows across multiple properties and teams.'
        )}
        <div class="panel-grid two">
          <article class="panel-item" data-reveal><strong>${isUk ? 'Централізовані операції' : 'Centralized operations'}</strong><p>${isUk ? 'Один inbox і одна операційна модель з окремим відстеженням джерела, owner і результативності по кожному сайту.' : 'Use one inbox and one operating model while still tracking site source, ownership, and performance by property.'}</p></article>
          <article class="panel-item" data-reveal><strong>${isUk ? 'Масштабований запуск' : 'Scalable deployment'}</strong><p>${isUk ? 'Налаштовуйте flows, prompts і routing для кожного сайту без розриву базового workflow.' : 'Configure flows, prompts, and routing per site without fragmenting the underlying workflow.'}</p></article>
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
        ['Нерухомість', 'Заявки із сайту приходять після робочого часу, питання по об’єктах повторюються, а серйозні покупці зникають до відповіді агента.', 'AI одразу відповідає на питання по об’єктах, збирає контакти й передає серйозний інтерес потрібному агенту з контекстом.', 'Швидша кваліфікація, краща видимість джерел, менше втрачених заявок.'],
        ['Ecommerce', 'Покупці вагаються через доставку, наявність чи сумісність і йдуть ще до того, як команда встигає відповісти.', 'Розмовний шар відповідає на заперечення в реальному часі, фіксує намір і ескалує цінні запити, коли це потрібно.', 'Менше abandonment, більше повернутого наміру, чистіший handoff у support або sales.'],
        ['Локальні послуги', 'Запити на прорахунок приходять у різний час, а деталі робіт губляться між інструментами.', 'Збирайте scope робіт, дедлайни і контакти прямо в чаті та відправляйте термінові запити в один керований inbox.', 'Кращі заявки на прорахунок, менше пропущених лідів, швидший response discipline.'],
        ['Агенції', 'Discovery-чати хаотичні й часто потребують другого проходу, перш ніж перетворяться на usable brief.', 'Перетворюйте discovery-розмови на структурований intake із scope, таймлайном, budget range та owner.', 'Менше ручної кваліфікації, кращі brief-и, чистіший follow-up.'],
        ['Кастомне виробництво', 'Бізнесам із quote-driven продажем потрібно точно збирати специфікації та зберігати всі ревізії протягом циклу продажу.', 'Проводьте клієнта через вимоги, збирайте технічні деталі в контексті й тримайте весь thread в одному workflow.', 'Сильніша підготовка quote, краща безперервність, менше втрати контексту між sales і delivery.']
      ]
    : [
        ['Real estate', 'Website inquiries come in after hours, listing questions repeat constantly, and serious buyers disappear before an agent responds.', 'Use AI to answer listing questions instantly, capture contact details, and route serious interest to the right agent with context.', 'Faster lead qualification, better source visibility, fewer lost inquiries.'],
        ['Ecommerce', 'Shoppers hesitate on shipping, availability, or fit questions and abandon before a human team can respond.', 'Use the conversation layer to answer objections in real time, capture intent, and escalate high-value purchase questions when needed.', 'Lower abandonment, more recovered intent, cleaner handoff to support or sales.'],
        ['Local services', 'Quote requests arrive at inconsistent times and operators lose job details when inquiries move between tools.', 'Collect job scope, timeline, and contact details inside the chat and send urgent or high-value requests into one managed inbox.', 'Better quote quality, fewer missed leads, faster response discipline.'],
        ['Agencies', 'Discovery chats are messy and usually require a second pass before they become a usable brief.', 'Turn discovery questions into structured intake with service scope, timeline, budget range, and ownership already attached.', 'Less manual qualification, better briefs, cleaner follow-up.'],
        ['Custom manufacturing', 'Quote-led businesses need to capture specifications accurately and preserve revisions throughout the sales process.', 'Guide buyers through requirements, capture technical details in context, and keep the entire thread visible in one workflow.', 'Stronger quote preparation, better continuity, fewer context gaps between sales and delivery.']
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
        { name: 'Starter', price: '$99', note: 'для одного lead-driven сайту', description: 'Чистий старт для бізнесу, якому потрібні AI-відповіді, збір лідів і один спільний workflow.', points: ['AI-асистент і логіка привітання', 'Збір лідів у чаті', 'Один shared inbox', 'Базова аналітика'], cta: { href: '/demo', label: 'Обговорити fit' } },
        { name: 'Growth', price: '$249', note: 'для активних SMB-команд', description: 'План для команд, яким потрібні передача оператору, сильніша звітність і workflow automation.', points: ['Усе зі Starter', 'Передача оператору і ownership', 'Контактний профіль і source tracking', 'Правила автоматизації й нагадування', 'Видимість по кількох сайтах'], cta: { href: '/demo', label: copy.cta.bookDemo }, featured: true },
        { name: 'Custom', price: 'Контакт', note: 'для multi-site або складніших запусків', description: 'Для більш просунутого запуску, спільної операційної моделі та кастомних вимог до впровадження.', points: ['Кастомний дизайн workflow', 'Підтримка складнішого rollout', 'Операційна модель для кількох сайтів', 'Кастомні вимоги до звітності'], cta: { href: '/demo', label: 'Обговорити вимоги' } }
      ]
    : [
        { name: 'Starter', price: '$99', note: 'for one lead-driven site', description: 'A clean entry point for businesses that need AI answers, lead capture, and one shared workflow.', points: ['AI assistant and greeting logic', 'Lead capture inside chat', 'One shared inbox', 'Basic analytics'], cta: { href: '/demo', label: 'Talk through fit' } },
        { name: 'Growth', price: '$249', note: 'for active SMB teams', description: 'The plan for teams that want operator handoff, stronger reporting, and workflow automation.', points: ['Everything in Starter', 'Operator handoff and ownership', 'Contact profile and source tracking', 'Automation rules and reminders', 'Multi-site visibility'], cta: { href: '/demo', label: copy.cta.bookDemo }, featured: true },
        { name: 'Custom', price: 'Contact', note: 'for multi-site or higher complexity', description: 'For more advanced deployment, shared operating models, and custom implementation needs.', points: ['Custom workflow design', 'Advanced rollout support', 'Multi-site operational setup', 'Custom reporting requirements'], cta: { href: '/demo', label: 'Discuss requirements' } }
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
        ['Чи може AI передати розмову людині?', 'Так. High-intent діалоги можуть автоматично переходити оператору з transcript, captured details і status.'],
        ['Чи можна збирати контактні дані?', 'Так. Email, телефон, scope проєкту, таймлайн та інші поля можна збирати прямо в розмові.'],
        ['Чи працює це на кількох сайтах?', 'Так. Модель workflow підтримує multi-site source tracking, централізований inbox і спільні операції.'],
        ['Чи можна кастомізувати?', 'Так. Повідомлення, prompts, правила handoff і workflow logic можна підлаштувати під сайт і команду.'],
        ['Чи є один спільний inbox?', 'Так. Оператори працюють з одного inbox, де разом зберігаються AI-відповіді, людський follow-up, нотатки й ownership.'],
        ['Як працює звітність?', 'Звітність побудована навколо якості розмов, source pages, швидкості відповіді, handoff performance і qualification outcomes.'],
        ['Це більше для support чи sales?', 'Підійде для обох, але найсильніше позиціювання тут — lead capture, qualification і follow-up.'],
        ['Чи потрібна технічна допомога для встановлення?', 'Зазвичай ні для базового запуску. Для складніших сценаріїв може знадобитися технічна допомога залежно від сайту й workflow.']
      ]
    : [
        ['Is setup difficult?', 'No. The product is added with a lightweight embed and then configured for each site, team, and conversation flow.'],
        ['Can AI hand conversations to a human?', 'Yes. High-intent conversations can be routed directly to an operator with the transcript, captured details, and status preserved.'],
        ['Can it capture lead details?', 'Yes. Email, phone, project scope, timing, and other fields can be collected inside the conversation.'],
        ['Can it work across multiple sites?', 'Yes. The workflow model supports multi-site source tracking, centralized inbox visibility, and shared operations.'],
        ['Can it be customized?', 'Yes. Messaging, prompts, handoff rules, and workflow logic can be configured to fit the site and team.'],
        ['Is there one shared inbox?', 'Yes. Operators work from one inbox that keeps AI replies, human follow-up, notes, and ownership together.'],
        ['How does reporting work?', 'Reporting is structured around conversation quality, source pages, response speed, handoff performance, and qualification outcomes.'],
        ['Is this for support or sales?', 'It can support both, but the strongest positioning here is for lead capture, qualification, and follow-up.'],
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
      title: isUk ? 'Використайте демо-сторінку як чесний наступний крок, а не фейковий signup flow.' : 'Use the demo page as a clear next step, not a fake signup flow.',
      description: isUk ? 'Ця сторінка дає покупцю реалістичний шлях уперед вже зараз: зрозуміти, що відбувається на демо, оцінити fit і перейти в наявний workspace, коли це доречно.' : 'This page gives the buyer a realistic path forward right now: understand what happens in a demo, decide whether it fits, and move into the existing product workspace when appropriate.',
      actions: [
        { href: '/inbox', label: isUk ? 'Відкрити demo inbox' : 'Open demo inbox', variant: 'button-primary' },
        { href: '/product', label: copy.cta.seeProduct, variant: 'button-secondary' }
      ],
      notes: isUk ? ['Чесний CTA-шлях', 'Без фейкових форм', 'Корисно для sales-розмов'] : ['Honest CTA path', 'No fake backend forms', 'Useful for sales conversations'],
      aside: `
        <div class="panel-item">
          <strong>${isUk ? 'Що відбувається на демо' : 'What happens in a demo'}</strong>
          <p>${isUk ? 'Ви проходите живу модель продукту, flow розмови, логіку handoff і те, як workflow ляже на ваш сайт або сайти.' : 'You walk through the live product model, the conversation flow, the handoff logic, and how the workflow would map to your site or sites.'}</p>
        </div>
      `
    }, copy.lang, copy)}
    <section class="section">
      <div class="container">
        ${renderSectionHead(
          copy.labels.demoPath,
          isUk ? 'Корисна публічна демо-сторінка в межах поточних обмежень.' : 'A useful public-facing demo page within today’s constraints.',
          isUk ? 'Оскільки повного публічного scheduling або signup backend ще немає, ця сторінка веде серйозного покупця до найбільш правдоподібного наступного кроку.' : 'Because there is not yet a full public scheduling or signup backend, this page is designed to move a serious buyer to the most credible next step.'
        )}
        <div class="demo-brief" data-reveal>
          <div class="demo-grid">
            <article class="demo-step"><strong>${isUk ? 'Для кого це' : 'Who it is for'}</strong><p>${isUk ? 'Для команд, які отримують ліди із сайту і хочуть швидшу першу відповідь, чистішу кваліфікацію та кращу видимість follow-up.' : 'Teams that rely on their website for leads and need faster first response, cleaner qualification, or better follow-up visibility.'}</p></article>
            <article class="demo-step"><strong>${isUk ? 'Що ви побачите' : 'What you will see'}</strong><p>${isUk ? 'AI greeting flow, передачу оператору, контактний профіль, аналітику, автоматизацію і поведінку системи в реальних розмовах.' : 'The AI greeting flow, operator handoff, contact profile, analytics, automation, and how the system behaves across real conversations.'}</p></article>
            <article class="demo-step"><strong>${isUk ? 'Що підготувати' : 'What you should prepare'}</strong><p>${isUk ? 'Типові питання покупців, поточний шлях ліда, типові проблеми кваліфікації і чи маєте один сайт або кілька.' : 'Typical buyer questions, current lead flow, common qualification issues, and whether you operate one site or many.'}</p></article>
            <article class="demo-step"><strong>${isUk ? 'Основна дія сьогодні' : 'Primary action today'}</strong><p>${isUk ? 'Використати наявний workspace як чесну точку входу, поки немає повного публічного scheduling flow.' : 'Use the existing product workspace as the honest entry point until a full public scheduling flow is added.'}</p></article>
          </div>
          <div class="marketing-panel">
            <strong style="display:block;margin-bottom:10px;">${isUk ? 'Рекомендовані наступні дії' : 'Suggested next actions'}</strong>
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
