const PUBLIC_NAV = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/product', label: 'Product', key: 'product' },
  { href: '/use-cases', label: 'Use cases', key: 'use-cases' },
  { href: '/pricing', label: 'Pricing', key: 'pricing' },
  { href: '/faq', label: 'FAQ', key: 'faq' },
  { href: '/demo', label: 'Demo', key: 'demo' }
];

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderNav(activeKey) {
  return `
    <header class="site-header">
      <div class="container header-bar">
        <a href="/" class="brand" aria-label="Chat Platform home">
          <span class="brand-mark">CP</span>
          <span class="brand-copy">
            Chat Platform
            <small>Website conversation system</small>
          </span>
        </a>
        <nav class="nav-links" aria-label="Primary">
          ${PUBLIC_NAV.map((item) => `
            <a href="${item.href}"${item.key === activeKey ? ' class="is-active"' : ''}>${item.label}</a>
          `).join('')}
        </nav>
        <div class="header-actions">
          <a class="button button-secondary" href="/inbox">Operator login</a>
          <a class="button button-primary" href="/demo">Book a demo</a>
        </div>
      </div>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <div class="brand">
            <span class="brand-mark">CP</span>
            <span class="brand-copy">
              Chat Platform
              <small>Website conversation system</small>
            </span>
          </div>
          <p>AI assistant, operator handoff, lead capture, inbox, analytics, and automation for serious website conversations.</p>
        </div>
        <div class="footer-col">
          <strong>Product</strong>
          <a href="/product">Product</a>
          <a href="/use-cases">Use cases</a>
          <a href="/pricing">Pricing</a>
        </div>
        <div class="footer-col">
          <strong>Explore</strong>
          <a href="/faq">FAQ</a>
          <a href="/demo">Demo</a>
          <a href="/inbox">Workspace</a>
        </div>
        <div class="footer-col">
          <strong>Why this exists</strong>
          <p>Built for teams that lose pipeline when replies are slow, context is fragmented, and follow-up lacks discipline.</p>
          <a class="footer-cta" href="/demo">See the demo path</a>
        </div>
      </div>
    </footer>
  `;
}

function renderHero(options) {
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
  const title = escapeHtml(options.title || 'Chat Platform');
  const description = escapeHtml(options.description || 'Premium website conversation system.');
  const activeKey = escapeHtml(options.activeKey || '');
  const content = String(options.content || '');

  return `<!doctype html>
<html lang="en">
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
        .header-actions { display: none; }
        .brand-mark { width: 34px; height: 34px; border-radius: 10px; }
        .page-hero-copy h1 { font-size: clamp(2.5rem, 13vw, 4rem); }
        .page-hero-actions { flex-direction: column; }
        .page-hero-actions .button { width: 100%; }
      }
    </style>
  </head>
  <body>
    ${renderNav(activeKey)}
    <main>${content}</main>
    ${renderFooter()}
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

function renderProductPage() {
  const content = `
    ${renderHero({
      eyebrow: 'Product',
      title: 'See the full system behind the homepage promise.',
      description: 'The product combines AI response, human handoff, lead capture, contact records, analytics, and automation into one operating layer for website conversations.',
      actions: [
        { href: '/demo', label: 'Book a demo', variant: 'button-primary' },
        { href: '/pricing', label: 'View pricing', variant: 'button-secondary' }
      ],
      notes: ['AI assistant + operators', 'Lead capture + contact profile', 'Analytics + automation'],
      aside: `
        <div class="panel-item">
          <strong>What the platform replaces</strong>
          <p>Passive chat, disconnected forms, messy inboxes, and follow-up that depends on memory.</p>
        </div>
        <div class="product-diagram">
          <div class="diagram-row">
            <div class="diagram-node primary"><strong>Website visitor</strong><span>Prompted instantly</span></div>
            <div class="diagram-node"><strong>AI assistant</strong><span>Answers and qualifies</span></div>
            <div class="diagram-node accent"><strong>Operator</strong><span>Joins when needed</span></div>
          </div>
          <div class="diagram-row">
            <div class="diagram-node"><strong>Lead capture</strong><span>Email, phone, scope, timing</span></div>
            <div class="diagram-node"><strong>Shared inbox</strong><span>Owner, notes, status</span></div>
            <div class="diagram-node"><strong>Analytics</strong><span>Intent and source visibility</span></div>
          </div>
        </div>
      `
    })}
    <section class="section">
      <div class="container">
        ${renderSectionHead('Core system', 'The product is strongest when the parts work together.', 'This page goes deeper than the homepage so buyers can understand how each layer contributes to qualification, follow-up, and visibility.')}
        <div class="capability-grid">
          <article class="capability-item" data-reveal><strong>AI assistant</strong><p>Answers routine questions, suggests next steps, and keeps the first response instant.</p></article>
          <article class="capability-item" data-reveal><strong>Human handoff</strong><p>Escalates sales-ready or complex conversations to an operator with the full transcript attached.</p></article>
          <article class="capability-item" data-reveal><strong>Lead capture</strong><p>Collects contact details and project information inside the conversation while motivation is still high.</p></article>
          <article class="capability-item" data-reveal><strong>Shared inbox</strong><p>Keeps ownership, notes, status, and source tracking in one queue across sites and operators.</p></article>
          <article class="capability-item" data-reveal><strong>Contact profile</strong><p>Turns chats into usable records with history, intent, source, and follow-up state.</p></article>
          <article class="capability-item" data-reveal><strong>Automation</strong><p>Assigns, tags, reminds, and escalates automatically so qualified demand does not stall.</p></article>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        ${renderSectionHead('Product flow', 'From first message to measurable follow-up.', 'The conversation does not stop at hello. The workflow continues through qualification, ownership, and reporting.')}
        <div class="journey-grid">
          <article class="journey-step" data-reveal><strong>1. Engage immediately</strong><p>The assistant greets visitors with prompts tied to pricing, quotes, support, or sales intent.</p></article>
          <article class="journey-step" data-reveal><strong>2. Answer in context</strong><p>Questions are handled instantly so visitors stay engaged instead of leaving for a competitor.</p></article>
          <article class="journey-step" data-reveal><strong>3. Capture structured details</strong><p>Email, phone, timeline, budget, or project scope are collected when intent is visible.</p></article>
          <article class="journey-step" data-reveal><strong>4. Hand off with context</strong><p>Operators join the conversation with the transcript, owner, and captured details already in place.</p></article>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        ${renderSectionHead('Multi-site visibility', 'Structured for SaaS-style operations when you need them.', 'Even if the first use case is one site, the model supports centralized workflows across multiple properties and teams.')}
        <div class="panel-grid two">
          <article class="panel-item" data-reveal><strong>Centralized operations</strong><p>Use one inbox and one operating model while still tracking site source, ownership, and performance by property.</p></article>
          <article class="panel-item" data-reveal><strong>Scalable deployment</strong><p>Configure flows, prompts, and routing per site without fragmenting the underlying workflow.</p></article>
        </div>
      </div>
    </section>
  `;
  return renderMarketingLayout({
    title: 'Product | Chat Platform',
    description: 'Explore the AI assistant, human handoff, lead capture, inbox, contact profile, analytics, and automation.',
    activeKey: 'product',
    content
  });
}

function renderUseCasesPage() {
  const cases = [
    ['Real estate', 'Website inquiries come in after hours, listing questions repeat constantly, and serious buyers disappear before an agent responds.', 'Use AI to answer listing questions instantly, capture contact details, and route serious interest to the right agent with context.', 'Faster lead qualification, better source visibility, fewer lost inquiries.'],
    ['Ecommerce', 'Shoppers hesitate on shipping, availability, or fit questions and abandon before a human team can respond.', 'Use the conversation layer to answer objections in real time, capture intent, and escalate high-value purchase questions when needed.', 'Lower abandonment, more recovered intent, cleaner handoff to support or sales.'],
    ['Local services', 'Quote requests arrive at inconsistent times and operators lose job details when inquiries move between tools.', 'Collect job scope, timeline, and contact details inside the chat and send urgent or high-value requests into one managed inbox.', 'Better quote quality, fewer missed leads, faster response discipline.'],
    ['Agencies', 'Discovery chats are messy and usually require a second pass before they become a usable brief.', 'Turn discovery questions into structured intake with service scope, timeline, budget range, and ownership already attached.', 'Less manual qualification, better briefs, cleaner follow-up.'],
    ['Custom manufacturing', 'Quote-led businesses need to capture specifications accurately and preserve revisions throughout the sales process.', 'Guide buyers through requirements, capture technical details in context, and keep the entire thread visible in one workflow.', 'Stronger quote preparation, better continuity, fewer context gaps between sales and delivery.']
  ];

  const content = `
    ${renderHero({
      eyebrow: 'Use cases',
      title: 'Match the product to the kind of business you actually run.',
      description: 'These pages are not generic vertical labels. They show where faster replies, better qualification, and cleaner follow-up create real business value.',
      actions: [
        { href: '/demo', label: 'See a demo path', variant: 'button-primary' },
        { href: '/product', label: 'Review product depth', variant: 'button-secondary' }
      ],
      notes: ['Sales-led teams', 'Quote-driven workflows', 'Multi-site visibility ready'],
      aside: `
        <div class="panel-item">
          <strong>What all these businesses share</strong>
          <p>They all lose pipeline when website intent is high but replies are slow, details are fragmented, or follow-up is inconsistent.</p>
        </div>
      `
    })}
    <section class="section">
      <div class="container">
        ${renderSectionHead('Business fit', 'Use cases shaped around real search and buying intent.', 'Each section gives the problem, the product behavior that helps, and the business outcome it improves.')}
        <div class="seo-grid">
          ${cases.map(([name, problem, approach, outcome]) => `
            <article class="seo-item" data-reveal>
              <strong>${escapeHtml(name)}</strong>
              <p><strong>Problem:</strong> ${escapeHtml(problem)}</p>
              <p><strong>How it helps:</strong> ${escapeHtml(approach)}</p>
              <p><strong>Outcome:</strong> ${escapeHtml(outcome)}</p>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        ${renderSectionHead('Internal linking path', 'Each use case naturally leads to the next page a buyer needs.', 'That makes the site more useful for direct visitors, SEO, and paid traffic landing on deeper pages.')}
        <div class="panel-grid two">
          <article class="panel-item" data-reveal><strong>Need product depth?</strong><p>Move from the use case into the product page to see how AI, operators, contacts, and analytics fit together.</p><a class="footer-cta" href="/product">Go to product</a></article>
          <article class="panel-item" data-reveal><strong>Ready to qualify budget?</strong><p>Move into pricing and the demo page to understand plan fit and the practical next step.</p><a class="footer-cta" href="/pricing">Go to pricing</a></article>
        </div>
      </div>
    </section>
  `;
  return renderMarketingLayout({
    title: 'Use Cases | Chat Platform',
    description: 'See how the platform fits real estate, ecommerce, local services, agencies, and custom quote-driven businesses.',
    activeKey: 'use-cases',
    content
  });
}

function renderPricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: '$99',
      note: 'for one lead-driven site',
      description: 'A clean entry point for businesses that need AI answers, lead capture, and one shared workflow.',
      points: ['AI assistant and greeting logic', 'Lead capture inside chat', 'One shared inbox', 'Basic analytics'],
      cta: { href: '/demo', label: 'Talk through fit' }
    },
    {
      name: 'Growth',
      price: '$249',
      note: 'for active SMB teams',
      description: 'The plan for teams that want operator handoff, stronger reporting, and workflow automation.',
      points: ['Everything in Starter', 'Operator handoff and ownership', 'Contact profile and source tracking', 'Automation rules and reminders', 'Multi-site visibility'],
      cta: { href: '/demo', label: 'Book a demo' },
      featured: true
    },
    {
      name: 'Custom',
      price: 'Contact',
      note: 'for multi-site or higher complexity',
      description: 'For more advanced deployment, shared operating models, and custom implementation needs.',
      points: ['Custom workflow design', 'Advanced rollout support', 'Multi-site operational setup', 'Custom reporting requirements'],
      cta: { href: '/demo', label: 'Discuss requirements' }
    }
  ];

  const content = `
    ${renderHero({
      eyebrow: 'Pricing',
      title: 'Clear pricing structure without pretending the work is one-size-fits-all.',
      description: 'The plans below give buyers a credible pricing frame now while leaving room for final packaging, implementation choices, and more advanced rollout needs.',
      actions: [
        { href: '/demo', label: 'Book a demo', variant: 'button-primary' },
        { href: '/product', label: 'See what is included', variant: 'button-secondary' }
      ],
      notes: ['No billing backend required yet', 'Good for qualification and trust', 'Ready for a future real pricing model'],
      aside: `
        <div class="panel-item">
          <strong>Pricing note</strong>
          <p>These plans are intentionally presented as a clean commercial structure, not as a fake purchase funnel. The goal is clarity and qualification.</p>
        </div>
      `
    })}
    <section class="section">
      <div class="container">
        ${renderSectionHead('Plans', 'Simple enough to understand, structured enough to sell.', 'Each plan is framed around who it is for, what it includes, and when a buyer should move into a demo conversation.')}
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
          <strong style="display:block;margin-bottom:10px;">What this pricing page is for</strong>
          <p>It reduces friction, qualifies buyers, and creates a credible commercial frame today without forcing a fake checkout flow or overcommitting to packaging that is not finalized.</p>
        </div>
      </div>
    </section>
  `;
  return renderMarketingLayout({
    title: 'Pricing | Chat Platform',
    description: 'Clean pricing for Starter, Growth, and Custom use cases with clear demo paths.',
    activeKey: 'pricing',
    content
  });
}

function renderFaqPage() {
  const faqs = [
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
      title: 'Answer objections cleanly before they slow the decision.',
      description: 'This page exists so the buyer can move from interest to confidence without hunting through a long homepage for practical answers.',
      actions: [
        { href: '/demo', label: 'Book a demo', variant: 'button-primary' },
        { href: '/pricing', label: 'Review pricing', variant: 'button-secondary' }
      ],
      notes: ['Setup', 'Handoff', 'Customization', 'Multi-site operations']
    })}
    <section class="section">
      <div class="container">
        ${renderSectionHead('Questions', 'Focused answers for setup, workflow, and business fit.', 'The goal is to remove friction, not to drown the visitor in generic documentation.')}
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
    description: 'Focused answers for setup, handoff, customization, reporting, and multi-site operations.',
    activeKey: 'faq',
    content
  });
}

function renderDemoPage() {
  const content = `
    ${renderHero({
      eyebrow: 'Demo',
      title: 'Use the demo page as a clear next step, not a fake signup flow.',
      description: 'This page gives the buyer a realistic path forward right now: understand what happens in a demo, decide whether it fits, and move into the existing product workspace when appropriate.',
      actions: [
        { href: '/inbox', label: 'Open demo inbox', variant: 'button-primary' },
        { href: '/product', label: 'Review product depth', variant: 'button-secondary' }
      ],
      notes: ['Honest CTA path', 'No fake backend forms', 'Useful for sales conversations'],
      aside: `
        <div class="panel-item">
          <strong>What happens in a demo</strong>
          <p>You walk through the live product model, the conversation flow, the handoff logic, and how the workflow would map to your site or sites.</p>
        </div>
      `
    })}
    <section class="section">
      <div class="container">
        ${renderSectionHead('Demo path', 'A useful public-facing demo page within today’s constraints.', 'Because there is not yet a full public scheduling or signup backend, this page is designed to move a serious buyer to the most credible next step.')}
        <div class="demo-brief" data-reveal>
          <div class="demo-grid">
            <article class="demo-step"><strong>Who it is for</strong><p>Teams that rely on their website for leads and need faster first response, cleaner qualification, or better follow-up visibility.</p></article>
            <article class="demo-step"><strong>What you will see</strong><p>The AI greeting flow, operator handoff, contact profile, analytics, automation, and how the system behaves across real conversations.</p></article>
            <article class="demo-step"><strong>What you should prepare</strong><p>Typical buyer questions, current lead flow, common qualification issues, and whether you operate one site or many.</p></article>
            <article class="demo-step"><strong>Primary action today</strong><p>Use the existing product workspace as the honest entry point until a full public scheduling flow is added.</p></article>
          </div>
          <div class="marketing-panel">
            <strong style="display:block;margin-bottom:10px;">Suggested next actions</strong>
            <div class="panel-grid">
              <article class="panel-item"><strong>Open the demo inbox</strong><p>Best for visitors who want to inspect the live workspace structure right now.</p><a class="footer-cta" href="/inbox">Go to inbox</a></article>
              <article class="panel-item"><strong>Need more context first?</strong><p>Review the product page or pricing page before stepping into the workspace.</p><a class="footer-cta" href="/product">Go to product</a></article>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  return renderMarketingLayout({
    title: 'Demo | Chat Platform',
    description: 'Clear demo path for serious buyers without inventing a fake public signup backend.',
    activeKey: 'demo',
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
