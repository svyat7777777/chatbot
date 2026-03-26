const STORY_STEPS = [
  {
    label: '01',
    title: 'Welcome visitors with context, not a blank chat bubble',
    description: 'Start the conversation the moment a visitor lands with prompts tied to pricing, quotes, service questions, or sales intent.',
    tag: 'Arrival',
    score: 'Engagement +37%',
    bullets: ['Contextual greeting', 'Suggested quick paths', 'Source page attached'],
    transcript: [
      { tone: 'assistant', text: 'Welcome to Northline. Looking for pricing, availability, or a custom quote?' },
      { tone: 'chip', text: 'Get pricing' },
      { tone: 'chip', text: 'Talk to sales' },
      { tone: 'chip', text: 'Ask a question' }
    ]
  },
  {
    label: '02',
    title: 'Answer repetitive questions instantly with AI',
    description: 'Handle the common questions in seconds so visitors stay engaged and your team stops repeating the same answers.',
    tag: 'AI answers',
    score: 'First reply <10s',
    bullets: ['Knowledge-driven answers', 'Guided next steps', 'Escalation rules ready'],
    transcript: [
      { tone: 'visitor', text: 'Do you install in New Jersey and what is the usual timeline?' },
      { tone: 'assistant', text: 'Yes. New Jersey installs usually start within 5 to 7 business days after approval.' },
      { tone: 'assistant', text: 'If you want, I can estimate timing and route this to a specialist.' }
    ]
  },
  {
    label: '03',
    title: 'Capture lead details inside the conversation',
    description: 'Collect email, phone, project type, timing, or budget when intent is clear, without breaking the flow.',
    tag: 'Lead capture',
    score: 'Qualified leads 2.4x',
    bullets: ['Email and phone', 'Project scope', 'Timeline and urgency'],
    transcript: [
      { tone: 'assistant', text: 'I can prepare a quote. What is the best email and preferred installation date?' },
      { tone: 'visitor', text: 'julia@oakandco.com. We want to start in early April.' },
      { tone: 'system', text: 'Contact updated: email, timeline, project type.' }
    ]
  },
  {
    label: '04',
    title: 'Hand off high-intent conversations to an operator',
    description: 'Escalate complex or sales-ready chats with the transcript, captured details, and conversation status already attached.',
    tag: 'Human takeover',
    score: 'Assisted chats 84%',
    bullets: ['Priority routing', 'Transcript preserved', 'Owner assigned'],
    transcript: [
      { tone: 'system', text: 'AI routed this conversation to Daria in Sales.' },
      { tone: 'operator', text: 'Hi Julia, I have your project details. I can confirm pricing options and available install windows.' },
      { tone: 'visitor', text: 'Perfect. We need a fast turnaround and two location options.' }
    ]
  },
  {
    label: '05',
    title: 'Keep the full context in one shared inbox',
    description: 'Operators work from one queue with site source, ownership, notes, and customer history visible in the same workflow.',
    tag: 'Shared inbox',
    score: 'Context retained 100%',
    bullets: ['Shared queue', 'Internal notes', 'Multi-site visibility'],
    transcript: [
      { tone: 'system', text: 'Assigned to Daria. Priority: High. Source: main website.' },
      { tone: 'operator', text: 'Added note: customer requested install before April 12.' },
      { tone: 'system', text: 'Follow-up reminder scheduled for tomorrow.' }
    ]
  },
  {
    label: '06',
    title: 'Track intent, performance, and follow-up',
    description: 'Measure which pages convert, which conversations qualify, and where follow-up slows across sites, campaigns, and operators.',
    tag: 'Analytics',
    score: 'Full-funnel visibility',
    bullets: ['Lead intent tracking', 'Page attribution', 'Operator and SLA insight'],
    transcript: [
      { tone: 'system', text: 'Lead moved to Qualified. Source page: /services/custom-installation.' },
      { tone: 'system', text: 'Automation triggered a reminder for tomorrow at 10:00.' },
      { tone: 'system', text: 'Qualified conversation added to weekly performance report.' }
    ]
  }
];

const CAPABILITIES = [
  {
    title: 'AI response and qualification',
    text: 'Respond instantly, answer routine questions, and move the visitor toward the next step without losing momentum.',
    points: ['Context-aware greeting', 'Intent-based prompts', 'Fast qualification path']
  },
  {
    title: 'Shared inbox and contact record',
    text: 'Keep the conversation, owner, source page, captured details, and internal notes in one working view.',
    points: ['Operator ownership', 'Structured contact profile', 'Source and status preserved']
  },
  {
    title: 'Automation and follow-up discipline',
    text: 'Assign, tag, remind, and escalate automatically so qualified demand keeps moving after the first response.',
    points: ['Assignment rules', 'Follow-up reminders', 'Multi-site workflows']
  }
];

const DEMO_VIEWS = [
  {
    key: 'widget',
    label: 'Chat widget',
    title: 'A website assistant that feels native to the page',
    description: 'Use contextual prompts, fast answers, and lead capture moments that feel like part of the customer journey, not a bolted-on widget.',
    metrics: [['Prompt completion', '68%'], ['Avg. reply time', '6s'], ['Qualified rate', '+31%']],
    rail: ['Greeting logic', 'Quick reply paths', 'Capture trigger'],
    rows: [['Greeting', 'Pricing / quote / human help'], ['Capture', 'Email and timeline'], ['State', 'AI active']],
    scene: [
      ['Live greeting', 'Pricing, quote, human help', 'scene-card--primary scene-card--wide'],
      ['Knowledge response', 'Instant FAQ and objections', 'scene-card--soft'],
      ['Lead trigger', 'Capture email and timeline', 'scene-card--accent']
    ]
  },
  {
    key: 'inbox',
    label: 'Inbox',
    title: 'Operators work from one shared conversation workspace',
    description: 'Assignments, notes, SLA visibility, site filters, and full AI context keep human follow-up operational instead of messy.',
    metrics: [['High-intent open', '12'], ['Resolution time', '19m'], ['SLA met', '94%']],
    rail: ['Priority queue', 'Owner and status', 'Internal notes'],
    rows: [['Owner', 'Daria · Sales'], ['Priority', 'High intent'], ['Next step', 'Quote follow-up']],
    scene: [
      ['Queue overview', 'High-intent conversations first', 'scene-card--primary scene-card--wide'],
      ['Assignment panel', 'Operator and due time', 'scene-card--soft'],
      ['Team note', 'Quote requested before Friday', 'scene-card--accent']
    ]
  },
  {
    key: 'contact',
    label: 'Contact profile',
    title: 'Every conversation becomes a usable contact record',
    description: 'Keep identity, source, budget, timeline, and message history together so operators can move the conversation forward without re-discovery.',
    metrics: [['Known contacts', '1,284'], ['Profiles enriched', '82%'], ['Repeat chats', '27%']],
    rail: ['Identity fields', 'Conversation history', 'Source and tags'],
    rows: [['Contact', 'Julia at Oak & Co.'], ['Source', '/pricing'], ['Intent', 'Commercial quote']],
    scene: [
      ['Structured profile', 'Email, phone, company, scope', 'scene-card--primary scene-card--wide'],
      ['Intent tags', 'Budget, urgency, fit', 'scene-card--soft'],
      ['History', 'Previous chats and notes', 'scene-card--accent']
    ]
  },
  {
    key: 'analytics',
    label: 'Analytics',
    title: 'Measure conversation performance like a revenue system',
    description: 'Track qualified volume, source pages, handoff quality, and response trends so chat becomes measurable, not anecdotal.',
    metrics: [['Qualified convos', '214'], ['Missed intent', '-42%'], ['Top source page', '/pricing']],
    rail: ['Qualification trend', 'Page attribution', 'Operator performance'],
    rows: [['Qualified', '214 this month'], ['Top source', '/pricing'], ['SLA health', '94% met']],
    scene: [
      ['Pipeline view', 'Qualified to closed', 'scene-card--primary scene-card--wide'],
      ['Page attribution', 'Top converting traffic paths', 'scene-card--soft'],
      ['Response trend', 'Speed and team health', 'scene-card--accent']
    ]
  },
  {
    key: 'automation',
    label: 'Automation',
    title: 'Automate routing, reminders, and conversation hygiene',
    description: 'Use rules to assign, tag, escalate, and follow up so no qualified lead stalls in the inbox.',
    metrics: [['Flows active', '18'], ['Auto-routed', '71%'], ['Follow-up compliance', '97%']],
    rail: ['Rules engine', 'Intent conditions', 'Follow-up actions'],
    rows: [['Trigger', 'Budget + urgency'], ['Action', 'Assign and remind'], ['Status', 'Flow live']],
    scene: [
      ['Routing logic', 'Assign by site, topic, or score', 'scene-card--primary scene-card--wide'],
      ['Trigger panel', 'Intent and urgency conditions', 'scene-card--soft'],
      ['Reminder queue', 'Scheduled follow-up actions', 'scene-card--accent']
    ]
  }
];

const USE_CASES = [
  {
    name: 'Real estate',
    text: 'Qualify buyer and seller intent early, answer listing questions fast, and route serious inquiries to the right agent with context attached.'
  },
  {
    name: 'Ecommerce',
    text: 'Handle product, shipping, and availability questions in real time while recovering shoppers who would otherwise leave.'
  },
  {
    name: 'Local services',
    text: 'Capture quote requests after hours, collect job details in chat, and surface urgent leads to operators immediately.'
  },
  {
    name: 'Agencies',
    text: 'Turn discovery chats into usable briefs with scope, budget range, timeline, and ownership already defined.'
  },
  {
    name: 'Custom manufacturing',
    text: 'Guide high-consideration quote conversations, collect specifications, and keep every revision visible in one thread.'
  }
];

const FAQS = [
  {
    question: 'Is installation difficult?',
    answer: 'No. Add a lightweight embed, then configure the assistant, routing rules, and team workflow for each site.'
  },
  {
    question: 'Can AI hand off a conversation to a person?',
    answer: 'Yes. High-intent conversations can route directly to an operator with the transcript, captured details, and status preserved.'
  },
  {
    question: 'Can we capture phone, email, and project details in chat?',
    answer: 'Yes. Collect lead fields inside the conversation when intent is strongest, without pushing visitors into a separate form.'
  },
  {
    question: 'Can one team manage multiple websites?',
    answer: 'Yes. The platform supports multi-site operations with source tracking, centralized inbox workflows, and shared visibility.'
  },
  {
    question: 'Can the chat experience match our brand?',
    answer: 'Yes. Messaging, prompts, handoff rules, and tone can be configured so the assistant feels native to the site experience.'
  },
  {
    question: 'Do operators reply from one inbox?',
    answer: 'Yes. Operators work from one inbox that keeps AI messages, human replies, internal notes, and follow-up actions together.'
  }
];

function renderStoryStep(step, index) {
  return `
    <article class="story-step${index === 0 ? ' is-active' : ''}" data-story-step="${index}" data-reveal>
      <div class="story-step-index">Step ${step.label}</div>
      <h3>${step.title}</h3>
      <p>${step.description}</p>
      <ul class="story-step-list">
        ${step.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}
      </ul>
    </article>
  `;
}

function renderStoryPanel(step, index) {
  return `
    <div class="story-visual-panel${index === 0 ? ' is-active' : ''}" data-story-panel="${index}">
      <div class="story-scene">
        <div class="story-scene-header">
          <span>${step.tag}</span>
          <strong>${step.score}</strong>
        </div>
        <div class="story-scene-grid">
          ${step.bullets.map((bullet, bulletIndex) => `
            <div class="scene-card${bulletIndex === 0 ? ' scene-card--primary scene-card--wide' : bulletIndex === 2 ? ' scene-card--accent' : ' scene-card--soft'}">
              <div class="scene-card-top">
                <span>${bulletIndex === 0 ? 'Primary state' : bulletIndex === 1 ? 'Context' : 'Output'}</span>
                <em>${step.tag}</em>
              </div>
              <strong>${bullet}</strong>
              <p>${bulletIndex === 0 ? 'Visitor-facing interaction is visible immediately.' : bulletIndex === 1 ? 'Supporting data stays attached to the thread.' : 'The next action is clear to the team.'}</p>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="story-chat-card">
        <div class="story-chat-top">
          <div>
            <strong>${step.title}</strong>
            <span>Conversation thread</span>
          </div>
          <em>${step.score}</em>
        </div>
        <div class="story-chat-meta">
          <span>Site source: /pricing</span>
          <span>Owner: Daria</span>
        </div>
        <div class="story-chat-stream">
          ${step.transcript.map((message) => `<div class="message-bubble ${message.tone}">${message.text}</div>`).join('')}
        </div>
      </div>
      <aside class="story-metric-card">
        <div class="metric-stat">${step.score}</div>
        <div class="metric-grid">
          <div><span>Intent score</span><strong>92</strong></div>
          <div><span>Source</span><strong>/pricing</strong></div>
          <div><span>Owner</span><strong>Daria</strong></div>
          <div><span>Status</span><strong>Qualified</strong></div>
        </div>
      </aside>
    </div>
  `;
}

function renderCapability(capability, index) {
  const classes = ['capability-card'];
  if (index === 0) classes.push('capability-card--featured');

  return `
    <article class="${classes.join(' ')}" data-reveal>
      <span class="capability-eyebrow">Capability ${String(index + 1).padStart(2, '0')}</span>
      <h3>${capability.title}</h3>
      <p>${capability.text}</p>
      <div class="capability-points">
        ${capability.points.map((point) => `<span>${point}</span>`).join('')}
      </div>
    </article>
  `;
}

function renderDemoView(view, index) {
  return `
    <div class="demo-panel${index === 0 ? ' is-active' : ''}" data-demo-panel="${view.key}">
      <div class="demo-copy">
        <span class="section-pill">Product view</span>
        <h3>${view.title}</h3>
        <p>${view.description}</p>
        <div class="demo-metrics">
          ${view.metrics.map(([label, value]) => `
            <div class="demo-metric">
              <span>${label}</span>
              <strong>${value}</strong>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="demo-visual">
        <div class="demo-rail">
          <div class="demo-rail-label">${view.label}</div>
          ${view.rail.map((item) => `<div class="demo-rail-item">${item}</div>`).join('')}
        </div>
        <div class="demo-stage">
          <div class="demo-stage-top">
            <strong>${view.label}</strong>
            <span>Operational view</span>
          </div>
          <div class="demo-stage-subhead">
            <span>Primary state</span>
            <span>Real workflow context</span>
          </div>
          <div class="demo-stage-grid">
            ${view.scene.map(([title, text, className]) => `
              <div class="scene-card ${className}">
                <div class="scene-card-top">
                  <span>${className.includes('primary') ? 'Primary panel' : className.includes('accent') ? 'Action' : 'Context'}</span>
                  <em>${view.label}</em>
                </div>
                <strong>${title}</strong>
                <p>${text}</p>
              </div>
            `).join('')}
          </div>
          <div class="demo-stage-list">
            ${view.rows.map(([label, value]) => `
              <div class="demo-stage-row">
                <span>${label}</span>
                <strong>${value}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderFaqItem(item, index) {
  return `
    <article class="faq-item${index === 0 ? ' is-open' : ''}" data-reveal>
      <button class="faq-trigger" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}">
        <span>${item.question}</span>
        <span class="faq-plus"></span>
      </button>
      <div class="faq-answer">
        <p>${item.answer}</p>
      </div>
    </article>
  `;
}

function renderHomePage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chat Platform | Website conversation system</title>
    <meta
      name="description"
      content="AI chat, live operator handoff, lead capture, shared inbox, analytics, and automation in one premium website conversation system."
    />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
    <style>
      :root {
        color-scheme: dark;
        --bg: #071019;
        --bg-soft: #0b1624;
        --panel: rgba(10, 22, 36, 0.82);
        --panel-strong: #0d1a2a;
        --panel-soft: rgba(255, 255, 255, 0.04);
        --line: rgba(155, 173, 194, 0.18);
        --line-strong: rgba(155, 173, 194, 0.28);
        --line-soft: rgba(255, 255, 255, 0.06);
        --text: #f4f7fb;
        --muted: #96a8bc;
        --soft: #718299;
        --accent: #78a6ff;
        --accent-strong: #a9c2ff;
        --accent-soft: rgba(120, 166, 255, 0.16);
        --teal: #66d7c1;
        --teal-soft: rgba(102, 215, 193, 0.14);
        --warn: #f6a98f;
        --shadow-xl: 0 50px 140px rgba(0, 0, 0, 0.36);
        --shadow-lg: 0 24px 64px rgba(0, 0, 0, 0.28);
        --radius-xl: 30px;
        --radius-lg: 22px;
        --radius-md: 16px;
        --radius-sm: 12px;
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
      img { max-width: 100%; display: block; }
      .home-shell {
        position: relative;
        overflow: clip;
      }
      .home-shell::before,
      .home-shell::after {
        content: '';
        position: absolute;
        pointer-events: none;
        filter: blur(80px);
        opacity: 0.6;
      }
      .home-shell::before {
        top: 180px;
        left: -100px;
        width: 280px;
        height: 280px;
        background: rgba(120, 166, 255, 0.14);
      }
      .home-shell::after {
        top: 980px;
        right: -120px;
        width: 340px;
        height: 340px;
        background: rgba(102, 215, 193, 0.12);
      }
      .container {
        width: min(var(--container), calc(100% - 40px));
        margin: 0 auto;
      }
      .section {
        position: relative;
        padding: 112px 0;
      }
      .section-tight {
        padding-top: 64px;
      }
      .section-head {
        display: grid;
        gap: 18px;
        max-width: 760px;
        margin-bottom: 50px;
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
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .section-head h2,
      .hero-copy h1,
      .final-cta h2 {
        margin: 0;
        font-family: 'Space Grotesk', 'Inter', sans-serif;
        font-weight: 700;
        letter-spacing: -0.045em;
      }
      .section-head h2 {
        font-size: clamp(2.05rem, 4vw, 3.45rem);
        line-height: 1;
        max-width: 13ch;
      }
      .section-head p,
      .hero-copy p,
      .final-cta p {
        margin: 0;
        color: var(--muted);
        font-size: 1.02rem;
        line-height: 1.78;
      }
      .site-header {
        position: sticky;
        top: 0;
        z-index: 40;
        backdrop-filter: blur(18px);
        background: rgba(7, 16, 25, 0.74);
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
      .nav-links a:hover {
        color: var(--text);
      }
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
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
      }
      .button:hover {
        transform: translateY(-1px);
      }
      .button-primary {
        background: linear-gradient(180deg, #8ab2ff 0%, #6f9cff 100%);
        color: #06101a;
        box-shadow: 0 18px 38px rgba(120, 166, 255, 0.24);
      }
      .button-secondary {
        border-color: var(--line-strong);
        background: rgba(255, 255, 255, 0.025);
        color: var(--text);
      }
      .button-secondary:hover {
        border-color: rgba(255, 255, 255, 0.22);
        background: rgba(255, 255, 255, 0.045);
      }
      .hero {
        padding: 62px 0 38px;
      }
      .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
        align-items: center;
        gap: 42px;
      }
      .hero-copy {
        max-width: 540px;
      }
      .hero-copy h1 {
        font-size: clamp(2.8rem, 6.2vw, 5.1rem);
        line-height: 0.94;
        max-width: 9.8ch;
        margin: 14px 0 14px;
        text-wrap: balance;
      }
      .hero-copy p {
        max-width: 48ch;
        font-size: 1rem;
        line-height: 1.68;
      }
      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 18px;
        color: var(--soft);
        font-size: 0.9rem;
      }
      .hero-meta span {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .hero-meta span::before {
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--teal);
        box-shadow: 0 0 0 6px rgba(102, 215, 193, 0.08);
      }
      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 14px;
        margin: 24px 0 14px;
      }
      .hero-action-note {
        color: var(--soft);
        font-size: 0.9rem;
        line-height: 1.6;
      }
      .hero-proof {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-top: 6px;
      }
      .proof-chip {
        padding: 14px 14px 15px;
        border-radius: 16px;
        border: 1px solid var(--line-soft);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.022));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
      }
      .proof-chip strong,
      .trust-stat strong {
        display: block;
        font-size: 1rem;
        margin-bottom: 4px;
      }
      .proof-chip span,
      .trust-stat span {
        color: var(--muted);
        font-size: 0.9rem;
      }
      .hero-visual {
        position: relative;
        min-height: 560px;
      }
      .hero-frame,
      .hero-aside {
        position: absolute;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: linear-gradient(180deg, rgba(12, 25, 40, 0.96), rgba(8, 17, 28, 0.94));
        box-shadow: var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.03);
      }
      .hero-frame {
        top: 0;
        right: 0;
        width: min(100%, 620px);
        padding: 20px;
        border-radius: 30px;
      }
      .hero-frame::before,
      .hero-aside::before,
      .story-scene::before,
      .story-chat-card::before,
      .story-metric-card::before,
      .demo-shell::before,
      .roi-card::before,
      .proof-card::before,
      .final-cta::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 18%);
      }
      .window-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
      }
      .window-bar span {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.14);
      }
      .hero-shell {
        display: grid;
        grid-template-columns: 168px minmax(0, 1fr);
        gap: 16px;
      }
      .hero-nav,
      .hero-stage,
      .hero-aside-body {
        border-radius: 20px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.028));
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      .hero-nav {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .hero-nav strong {
        font-size: 0.86rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .hero-nav-item {
        padding: 12px 14px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.03);
        color: var(--muted);
        border: 1px solid transparent;
        font-size: 0.9rem;
      }
      .hero-nav-item.is-active {
        background: linear-gradient(180deg, rgba(120, 166, 255, 0.18), rgba(120, 166, 255, 0.08));
        border-color: rgba(120, 166, 255, 0.18);
        color: var(--text);
      }
      .hero-stage {
        padding: 18px;
        display: grid;
        gap: 14px;
      }
      .hero-stage-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .hero-stage-top strong {
        font-size: 1.04rem;
      }
      .hero-status {
        padding: 8px 10px;
        border-radius: 999px;
        background: var(--teal-soft);
        color: var(--teal);
        font-size: 0.8rem;
        font-weight: 700;
      }
      .hero-messages {
        display: grid;
        gap: 11px;
      }
      .hero-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .hero-toolbar span {
        color: var(--soft);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .hero-toolbar strong {
        font-size: 0.92rem;
      }
      .message-bubble {
        max-width: 88%;
        padding: 12px 14px;
        border-radius: 14px;
        font-size: 0.92rem;
        line-height: 1.58;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
      }
      .message-bubble.assistant {
        background: rgba(120, 166, 255, 0.12);
        border: 1px solid rgba(120, 166, 255, 0.16);
      }
      .message-bubble.visitor {
        margin-left: auto;
        background: rgba(255, 255, 255, 0.05);
      }
      .message-bubble.operator,
      .message-bubble.system {
        background: rgba(102, 215, 193, 0.12);
        border: 1px solid rgba(102, 215, 193, 0.16);
      }
      .message-bubble.chip {
        width: fit-content;
        padding: 9px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--line);
      }
      .hero-insights {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .insight-card {
        padding: 14px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.028);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .insight-card span {
        display: block;
        color: var(--muted);
        font-size: 0.82rem;
        margin-bottom: 6px;
      }
      .insight-card strong {
        font-size: 1rem;
      }
      .mini-label,
      .hero-aside-body .mini-label {
        color: var(--soft);
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .hero-aside {
        left: 18px;
        bottom: 18px;
        width: min(100%, 252px);
        border-radius: 22px;
        padding: 16px;
      }
      .hero-aside-body {
        padding: 16px;
        display: grid;
        gap: 12px;
      }
      .hero-profile {
        display: grid;
        gap: 10px;
      }
      .profile-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.04);
      }
      .profile-row span {
        color: var(--soft);
        font-size: 0.8rem;
      }
      .profile-row strong {
        font-size: 0.86rem;
      }
      .trust-bar {
        padding-top: 6px;
      }
      .trust-surface {
        display: grid;
        grid-template-columns: 1.2fr 1fr 1fr 1fr;
        gap: 18px;
        padding: 24px;
        border-radius: 26px;
        border: 1px solid var(--line-soft);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.02));
      }
      .trust-copy strong {
        display: block;
        font-size: 1.06rem;
        margin-bottom: 6px;
      }
      .trust-copy p {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }
      .trust-stat {
        padding-left: 16px;
        border-left: 1px solid var(--line);
      }
      .story-layout {
        display: grid;
        grid-template-columns: minmax(320px, 430px) minmax(0, 1fr);
        gap: 42px;
        align-items: start;
      }
      .story-rail {
        position: sticky;
        top: 104px;
        display: grid;
        gap: 14px;
      }
      .story-step {
        padding: 22px 22px 20px;
        border-radius: 22px;
        border: 1px solid rgba(255, 255, 255, 0.045);
        background: rgba(255, 255, 255, 0.022);
        color: var(--muted);
        transition: border-color 240ms ease, background 240ms ease, transform 240ms ease, color 240ms ease, box-shadow 240ms ease;
      }
      .story-step.is-active {
        border-color: rgba(120, 166, 255, 0.28);
        background: linear-gradient(180deg, rgba(120, 166, 255, 0.12), rgba(120, 166, 255, 0.045));
        color: var(--text);
        transform: translateX(6px);
        box-shadow: 0 18px 36px rgba(0, 0, 0, 0.16);
      }
      .story-step-index {
        color: var(--accent-strong);
        font-size: 0.72rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-bottom: 12px;
      }
      .story-step h3 {
        margin: 0 0 10px;
        font-size: 1.12rem;
        line-height: 1.34;
        max-width: 18ch;
      }
      .story-step p {
        margin: 0;
        line-height: 1.7;
        max-width: 34ch;
      }
      .story-step-list {
        list-style: none;
        padding: 0;
        margin: 14px 0 0;
        display: grid;
        gap: 8px;
        font-size: 0.9rem;
      }
      .story-step-list li {
        color: var(--soft);
      }
      .story-visual-stack {
        position: sticky;
        top: 104px;
        min-height: 660px;
      }
      .story-visual-panel {
        position: absolute;
        inset: 0;
        display: grid;
        gap: 16px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(16px) scale(0.988);
        pointer-events: none;
        transition: opacity 280ms ease, transform 280ms ease, visibility 0ms linear 280ms;
        will-change: opacity, transform;
      }
      .story-visual-panel.is-active {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
        pointer-events: auto;
        transition: opacity 280ms ease, transform 280ms ease, visibility 0ms linear 0ms;
      }
      .story-scene,
      .story-chat-card,
      .story-metric-card,
      .problem-grid article,
      .roi-card,
      .proof-card,
      .faq-item,
      .final-cta {
        position: relative;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(12, 24, 38, 0.88), rgba(8, 16, 26, 0.9));
        box-shadow: var(--shadow-lg);
      }
      .story-scene {
        padding: 22px;
        border-radius: 26px;
      }
      .story-scene-header,
      .story-chat-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .story-scene-header span,
      .story-chat-top span {
        color: var(--soft);
        font-size: 0.84rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .story-scene-grid,
      .demo-stage-grid {
        margin-top: 18px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .scene-card {
        padding: 18px;
        border-radius: 17px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(255, 255, 255, 0.03);
      }
      .scene-card-top,
      .story-chat-meta,
      .demo-stage-subhead {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .scene-card-top {
        margin-bottom: 12px;
      }
      .scene-card-top span,
      .scene-card-top em,
      .story-chat-meta span,
      .demo-stage-subhead span {
        color: var(--soft);
        font-size: 0.74rem;
        font-style: normal;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .scene-card strong {
        display: block;
        margin-bottom: 8px;
        font-size: 1rem;
      }
      .scene-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
      }
      .scene-card--wide {
        grid-column: span 2;
      }
      .scene-card--primary {
        background: linear-gradient(180deg, rgba(120, 166, 255, 0.15), rgba(120, 166, 255, 0.06));
      }
      .scene-card--accent {
        background: linear-gradient(180deg, rgba(102, 215, 193, 0.15), rgba(102, 215, 193, 0.06));
      }
      .scene-card--soft {
        background: rgba(255, 255, 255, 0.04);
      }
      .story-chat-card {
        padding: 22px;
        border-radius: 24px;
      }
      .story-chat-top strong {
        display: block;
        font-size: 1rem;
      }
      .story-chat-top em {
        font-style: normal;
        color: var(--accent-strong);
        font-weight: 700;
      }
      .story-chat-meta {
        margin-top: 14px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.028);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .story-chat-stream {
        margin-top: 16px;
        display: grid;
        gap: 10px;
      }
      .story-metric-card {
        padding: 22px;
        border-radius: 22px;
      }
      .metric-stat {
        font-size: 1.34rem;
        font-weight: 700;
        letter-spacing: -0.03em;
      }
      .metric-grid {
        margin-top: 16px;
        display: grid;
        gap: 12px;
      }
      .metric-grid div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: var(--muted);
      }
      .metric-grid strong {
        color: var(--text);
      }
      .problem-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }
      .problem-grid article {
        padding: 24px;
        border-radius: 22px;
      }
      .problem-grid article:nth-child(1) {
        grid-column: span 2;
      }
      .problem-grid strong {
        display: block;
        margin-bottom: 12px;
        font-size: 1.08rem;
      }
      .problem-grid p {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
      }
      .problem-grid article::before {
        content: '';
        display: block;
        width: 44px;
        height: 2px;
        margin-bottom: 18px;
        background: linear-gradient(90deg, var(--warn), transparent);
      }
      .capability-layout {
        display: grid;
        grid-template-columns: 1.04fr 0.96fr;
        gap: 28px;
        align-items: start;
      }
      .capability-intro {
        padding: 34px;
        border-radius: 28px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(120, 166, 255, 0.08), rgba(255, 255, 255, 0.02));
      }
      .capability-intro h2 {
        margin: 14px 0 0;
        font-size: clamp(2rem, 3.8vw, 3.2rem);
        line-height: 1.02;
        letter-spacing: -0.045em;
        max-width: 12ch;
      }
      .capability-intro p {
        margin: 16px 0 0;
        max-width: 54ch;
        color: var(--muted);
        line-height: 1.8;
      }
      .capability-intro-grid {
        margin-top: 24px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .capability-intro-grid div {
        padding: 16px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .capability-intro-grid strong {
        display: block;
        margin-bottom: 6px;
      }
      .capability-stack {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }
      .capability-card {
        padding: 24px;
        border-radius: 22px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.03);
      }
      .capability-card--featured {
        grid-column: span 2;
        background: linear-gradient(180deg, rgba(102, 215, 193, 0.08), rgba(255, 255, 255, 0.03));
      }
      .capability-eyebrow {
        display: inline-block;
        margin-bottom: 16px;
        color: var(--soft);
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .capability-card h3 {
        margin: 0 0 10px;
        font-size: 1.08rem;
      }
      .capability-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
      }
      .capability-points {
        display: grid;
        gap: 10px;
        margin-top: 18px;
      }
      .capability-points span {
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: var(--soft);
        font-size: 0.84rem;
      }
      .demo-shell {
        position: relative;
        padding: 28px;
        border-radius: 30px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(13, 24, 39, 0.86), rgba(9, 16, 26, 0.9));
      }
      .demo-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 30px;
      }
      .demo-tab {
        padding: 11px 14px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.025);
        color: var(--muted);
        cursor: pointer;
        transition: border-color 180ms ease, color 180ms ease, background 180ms ease, transform 180ms ease;
      }
      .demo-tab:hover {
        transform: translateY(-1px);
        color: var(--text);
      }
      .demo-tab.is-active {
        color: var(--text);
        background: rgba(120, 166, 255, 0.12);
        border-color: rgba(120, 166, 255, 0.26);
      }
      .demo-panel {
        display: none;
        grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);
        gap: 26px;
        align-items: stretch;
      }
      .demo-panel.is-active {
        display: grid;
        animation: demoFade 260ms ease;
      }
      @keyframes demoFade {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .demo-copy {
        display: grid;
        align-content: start;
        gap: 14px;
      }
      .demo-copy h3 {
        margin: 0;
        font-size: clamp(1.9rem, 3vw, 2.8rem);
        line-height: 1.08;
        letter-spacing: -0.04em;
      }
      .demo-copy p {
        margin: 0;
        color: var(--muted);
        line-height: 1.75;
      }
      .demo-metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 8px;
      }
      .demo-metric {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.03);
      }
      .demo-metric span {
        display: block;
        color: var(--soft);
        margin-bottom: 6px;
        font-size: 0.84rem;
      }
      .demo-metric strong {
        font-size: 1.1rem;
      }
      .demo-visual {
        display: grid;
        grid-template-columns: 168px minmax(0, 1fr);
        gap: 14px;
      }
      .demo-rail,
      .demo-stage {
        border-radius: 22px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.03);
      }
      .demo-rail {
        padding: 18px;
        display: grid;
        align-content: start;
        gap: 10px;
      }
      .demo-rail-label {
        color: var(--accent-strong);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 6px;
      }
      .demo-rail-item {
        padding: 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.035);
        color: var(--muted);
      }
      .demo-stage {
        padding: 20px;
      }
      .demo-stage-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }
      .demo-stage-top span {
        color: var(--soft);
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .demo-stage-subhead {
        margin-bottom: 16px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.028);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .demo-stage-list {
        margin-top: 16px;
        display: grid;
        gap: 10px;
      }
      .demo-stage-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 11px 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.026);
        border: 1px solid rgba(255, 255, 255, 0.045);
      }
      .demo-stage-row span {
        color: var(--soft);
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .demo-stage-row strong {
        font-size: 0.92rem;
        letter-spacing: -0.01em;
      }
      .use-case-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 16px;
      }
      .use-case-card {
        padding: 24px;
        border-radius: 22px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.028);
      }
      .use-case-card:first-child,
      .use-case-card:last-child {
        grid-column: span 2;
      }
      .use-case-card h3 {
        margin: 0 0 12px;
        font-size: 1.08rem;
      }
      .use-case-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
      }
      .roi-layout {
        display: grid;
        grid-template-columns: 1.06fr 0.94fr;
        gap: 22px;
      }
      .roi-card {
        padding: 30px;
        border-radius: 28px;
      }
      .roi-card h3 {
        margin: 0 0 10px;
        font-size: 1.28rem;
      }
      .roi-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.75;
      }
      .roi-matrix {
        margin-top: 22px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .roi-matrix article {
        padding: 18px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .roi-matrix strong {
        display: block;
        margin-bottom: 8px;
      }
      .roi-matrix p {
        color: var(--muted);
        margin: 0;
      }
      .roi-scoreboard {
        display: grid;
        gap: 14px;
      }
      .score-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 20px 22px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.028);
      }
      .score-row span {
        color: var(--muted);
      }
      .score-row strong {
        font-size: 1.18rem;
      }
      .proof-layout {
        display: grid;
        grid-template-columns: 1.06fr 0.94fr;
        gap: 22px;
      }
      .proof-card {
        padding: 30px;
        border-radius: 28px;
      }
      .proof-card h3 {
        margin: 0 0 12px;
        font-size: 1.18rem;
      }
      .proof-card p {
        margin: 0;
        color: var(--muted);
        line-height: 1.75;
      }
      .proof-grid {
        margin-top: 20px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .proof-grid article {
        padding: 18px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .proof-grid strong {
        display: block;
        margin-bottom: 8px;
      }
      .proof-note {
        margin-top: 18px;
        color: var(--soft);
        font-size: 0.92rem;
      }
      .faq-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .faq-item {
        border-radius: 22px;
        overflow: clip;
      }
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
      .faq-trigger span:first-child {
        font-size: 1rem;
        font-weight: 600;
      }
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
      .faq-plus::after {
        transform: rotate(90deg);
      }
      .faq-item.is-open .faq-plus::after {
        transform: rotate(90deg) scaleX(0);
        opacity: 0;
      }
      .faq-answer {
        max-height: 0;
        overflow: hidden;
        transition: max-height 260ms ease;
      }
      .faq-answer p {
        margin: 0;
        padding: 0 22px 22px;
        color: var(--muted);
        line-height: 1.75;
      }
      .faq-item.is-open .faq-answer {
        max-height: 220px;
      }
      .final-cta {
        padding: 42px;
        border-radius: 32px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 24px;
        align-items: center;
      }
      .final-cta h2 {
        font-size: clamp(2.2rem, 4vw, 3.6rem);
        line-height: 1.02;
        margin-bottom: 12px;
      }
      .final-cta-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: flex-end;
      }
      .site-footer {
        padding: 26px 0 44px;
        color: var(--soft);
      }
      .footer-grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr 0.8fr 1fr;
        gap: 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        padding-top: 24px;
      }
      .footer-brand,
      .footer-col {
        display: grid;
        gap: 10px;
        align-content: start;
      }
      .footer-brand p,
      .footer-col p {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
      }
      .footer-col strong {
        color: var(--text);
        font-size: 0.92rem;
      }
      .footer-col a {
        color: var(--soft);
        font-size: 0.92rem;
      }
      .footer-col a:hover {
        color: var(--text);
      }
      [data-reveal] {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 560ms cubic-bezier(0.22, 1, 0.36, 1), transform 560ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      [data-reveal].is-visible {
        opacity: 1;
        transform: translateY(0);
      }
      @media (max-width: 1180px) {
        .hero-grid,
        .demo-panel,
        .proof-layout,
        .roi-layout,
        .capability-layout {
          grid-template-columns: 1fr;
        }
        .hero-visual {
          min-height: 620px;
        }
        .use-case-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .use-case-card:first-child,
        .use-case-card:last-child,
        .problem-grid article:nth-child(1) {
          grid-column: span 1;
        }
        .problem-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .trust-surface {
          grid-template-columns: 1fr 1fr;
        }
        .trust-copy {
          grid-column: 1 / -1;
        }
        .footer-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 960px) {
        .nav-links {
          display: none;
        }
        .hero {
          padding-top: 44px;
        }
        .hero-shell,
        .demo-visual,
        .faq-grid,
        .story-layout {
          grid-template-columns: 1fr;
        }
        .hero-frame,
        .hero-aside {
          position: relative;
          inset: auto;
          width: 100%;
        }
        .hero-visual {
          min-height: auto;
          display: grid;
          gap: 14px;
        }
        .story-rail {
          position: static;
        }
        .story-visual-stack {
          min-height: auto;
          position: static;
        }
        .story-visual-panel,
        .story-visual-panel {
          position: relative;
          inset: auto;
          top: auto;
          display: none;
          opacity: 1;
          visibility: visible;
          transform: none;
          transition: none;
        }
        .story-visual-panel.is-active {
          display: grid;
        }
        .demo-metrics,
        .capability-intro-grid,
        .hero-proof {
          grid-template-columns: 1fr;
        }
        .hero-copy {
          max-width: 100%;
        }
        .hero-aside {
          left: auto;
          bottom: auto;
        }
        .hero-copy h1,
        .section-head h2,
        .capability-intro h2,
        .final-cta h2 {
          max-width: none;
        }
        .trust-stat {
          border-left: 0;
          padding-left: 0;
        }
        .trust-surface,
        .use-case-grid {
          grid-template-columns: 1fr;
        }
        .final-cta {
          grid-template-columns: 1fr;
        }
        .final-cta-actions {
          justify-content: flex-start;
        }
      }
      @media (max-width: 720px) {
        .container {
          width: min(var(--container), calc(100% - 24px));
        }
        .section {
          padding: 70px 0;
        }
        .header-bar {
          min-height: 68px;
        }
        .header-actions {
          display: none;
        }
        .brand-mark {
          width: 34px;
          height: 34px;
          border-radius: 10px;
        }
        .hero-copy h1 {
          font-size: clamp(2.6rem, 13vw, 4.1rem);
          line-height: 0.94;
        }
        .hero-copy p {
          font-size: 0.99rem;
        }
        .hero-actions {
          gap: 10px;
          margin: 28px 0 14px;
        }
        .hero-actions .button {
          width: 100%;
          justify-content: center;
          text-align: center;
        }
        .hero-action-note,
        .hero-meta {
          font-size: 0.88rem;
        }
        .story-scene-grid,
        .demo-stage-grid,
        .problem-grid,
        .capability-stack,
        .roi-matrix {
          grid-template-columns: 1fr;
        }
        .scene-card--wide,
        .capability-card--featured {
          grid-column: span 1;
        }
        .hero-shell {
          gap: 14px;
        }
        .hero-frame,
        .hero-aside,
        .demo-shell,
        .roi-card,
        .proof-card,
        .final-cta {
          border-radius: 24px;
        }
        .story-step {
          padding: 18px 18px 17px;
        }
        .story-step h3 {
          font-size: 1.02rem;
          max-width: none;
        }
        .story-step p {
          font-size: 0.96rem;
          max-width: none;
        }
        .story-chat-card,
        .story-scene,
        .story-metric-card {
          padding: 18px;
        }
        .demo-shell {
          padding: 18px;
        }
        .demo-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .demo-tab {
          text-align: center;
        }
        .faq-trigger {
          padding: 18px 18px 16px;
        }
        .faq-answer p {
          padding: 0 18px 18px;
        }
        .footer-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="home-shell">
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
            <a href="/product">Product</a>
            <a href="/use-cases">Use cases</a>
            <a href="/pricing">Pricing</a>
            <a href="/faq">FAQ</a>
            <a href="/demo">Demo</a>
          </nav>
          <div class="header-actions">
            <a class="button button-secondary" href="/product">Product tour</a>
            <a class="button button-primary" href="/demo">Book a demo</a>
          </div>
        </div>
      </header>

      <main>
        <section class="hero section">
          <div class="container hero-grid">
            <div class="hero-copy" data-reveal>
              <span class="eyebrow">AI + operators + inbox + analytics</span>
              <h1>Turn website visitors into qualified conversations.</h1>
              <p>
                A website conversation system that answers questions with AI, captures lead details, routes high-intent chats to your team, and keeps the full workflow in one inbox.
              </p>
              <div class="hero-meta">
                <span>Answers instantly</span>
                <span>Captures lead details</span>
                <span>Hands off with context</span>
              </div>
              <div class="hero-actions">
                <a class="button button-primary" href="/demo">Book a demo</a>
                <a class="button button-secondary" href="/product">See the product</a>
              </div>
              <div class="hero-action-note">Built for teams that lose leads when replies are slow, context gets lost, or follow-up is inconsistent.</div>
              <div class="hero-proof">
                <div class="proof-chip">
                  <strong>AI + human handoff</strong>
                  <span>Escalate important conversations with the full thread attached.</span>
                </div>
                <div class="proof-chip">
                  <strong>Lead capture in chat</strong>
                  <span>Collect contact details when buying intent is actually visible.</span>
                </div>
                <div class="proof-chip">
                  <strong>One operational system</strong>
                  <span>Keep chat, inbox, contacts, and follow-up in one place.</span>
                </div>
              </div>
            </div>

            <div class="hero-visual" data-reveal>
              <div class="hero-frame">
                <div class="window-bar"><span></span><span></span><span></span></div>
                <div class="hero-shell">
                  <div class="hero-nav">
                    <strong>Workspace</strong>
                    <div class="hero-nav-item is-active">Shared inbox</div>
                    <div class="hero-nav-item">Contact profiles</div>
                    <div class="hero-nav-item">Automation rules</div>
                    <div class="hero-nav-item">Analytics</div>
                  </div>
                  <div class="hero-stage">
                    <div class="hero-stage-top">
                      <div>
                        <strong>Northline commercial quote inquiry</strong>
                        <div class="mini-label">Pricing page · qualified lead · operator joined</div>
                      </div>
                      <span class="hero-status">Live handoff</span>
                    </div>
                    <div class="hero-toolbar">
                      <strong>Lead status: Qualified</strong>
                      <span>Source: /pricing</span>
                    </div>
                    <div class="hero-messages">
                      <div class="message-bubble assistant">Welcome to Northline. Looking for pricing, installation timing, or a custom quote?</div>
                      <div class="message-bubble visitor">We need a quote for two locations and a fast install window.</div>
                      <div class="message-bubble assistant">I can help with that. What is the best email and target timeline?</div>
                      <div class="message-bubble operator">Hi Julia, I have your details. I can confirm pricing options and available dates.</div>
                    </div>
                    <div class="hero-insights">
                      <div class="insight-card"><span>Contact record</span><strong>Julia · Oak & Co.</strong></div>
                      <div class="insight-card"><span>Next action</span><strong>Quote follow-up today</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="hero-aside">
                <div class="hero-aside-body">
                  <span class="mini-label">Contact profile</span>
                  <div class="hero-profile">
                    <div class="profile-row"><span>Company</span><strong>Oak & Co.</strong></div>
                    <div class="profile-row"><span>Timeline</span><strong>Early April</strong></div>
                    <div class="profile-row"><span>Owner</span><strong>Daria</strong></div>
                    <div class="profile-row"><span>Follow-up</span><strong>Today · 15:30</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="trust-bar section-tight">
          <div class="container">
            <div class="trust-surface" data-reveal>
              <div class="trust-copy">
                <strong>Designed for businesses that lose leads when website conversations stall.</strong>
                <p>Move from passive chat and disconnected forms to one system that greets, qualifies, routes, and tracks every conversation.</p>
              </div>
              <div class="trust-stat">
                <strong>Faster response</strong>
                <span>AI answers immediately instead of waiting for an operator.</span>
              </div>
              <div class="trust-stat">
                <strong>Higher signal</strong>
                <span>Lead details and intent are captured while the conversation is still live.</span>
              </div>
              <div class="trust-stat">
                <strong>One workflow</strong>
                <span>Inbox, profile, analytics, and automation stay connected.</span>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="story">
          <div class="container">
            <div class="section-head" data-reveal>
              <span class="section-pill">Product flow</span>
              <h2>Show the full conversation workflow, not just the first reply.</h2>
              <p>From greeting to qualification, handoff, inbox management, and follow-up, the product behaves like one connected system.</p>
            </div>
            <div class="story-layout">
              <div class="story-rail">
                ${STORY_STEPS.map(renderStoryStep).join('')}
              </div>
              <div class="story-visual-stack">
                ${STORY_STEPS.map(renderStoryPanel).join('')}
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-head" data-reveal>
              <span class="section-pill">Why teams lose leads</span>
              <h2>Most websites still reply too slowly, qualify too late, and track too little.</h2>
              <p>Forms, passive chat widgets, and disconnected inboxes create friction exactly where buyer intent is highest.</p>
            </div>
            <div class="problem-grid">
              <article data-reveal>
                <strong>Visitors leave before anyone responds</strong>
                <p>High-intent buyers bounce when the first response depends entirely on operator availability.</p>
              </article>
              <article data-reveal>
                <strong>Leads get scattered across tools</strong>
                <p>Messages, contact details, and follow-up actions break apart when forms, chat, and inboxes are separate.</p>
              </article>
              <article data-reveal>
                <strong>Operators repeat the same answers</strong>
                <p>Teams waste time on repetitive questions instead of stepping into the conversations that actually need a person.</p>
              </article>
              <article data-reveal>
                <strong>No one can see what converts</strong>
                <p>Without attribution and intent tracking, chat becomes activity, not a measurable source of pipeline.</p>
              </article>
            </div>
          </div>
        </section>

        <section class="section" id="capabilities">
          <div class="container capability-layout">
            <div class="capability-intro" data-reveal>
              <span class="section-pill">Connected system</span>
              <h2>Built as one conversation workflow, not a pile of disconnected tools.</h2>
              <p>
                AI answers questions, lead capture updates the record, handoff preserves context, automation keeps momentum moving,
                and the inbox stays usable for the team.
              </p>
              <div class="capability-intro-grid">
                <div><strong>AI answers</strong><span>Handle repetitive questions instantly.</span></div>
                <div><strong>Operator handoff</strong><span>Escalate high-intent chats fast.</span></div>
                <div><strong>Multi-site ready</strong><span>Centralize workflows across properties.</span></div>
              </div>
            </div>
            <div class="capability-stack">
              ${CAPABILITIES.map(renderCapability).join('')}
            </div>
          </div>
        </section>

        <section class="section" id="product">
          <div class="container">
            <div class="section-head" data-reveal>
              <span class="section-pill">Product demo</span>
              <h2>Show the core product surfaces, not a wall of dashboard art.</h2>
              <p>Each view below represents a working surface of the system: chat, inbox, contact record, analytics, and automation.</p>
            </div>
            <div class="demo-shell" data-reveal>
              <div class="demo-tabs" role="tablist" aria-label="Product views">
                ${DEMO_VIEWS.map((view, index) => `
                  <button
                    class="demo-tab${index === 0 ? ' is-active' : ''}"
                    type="button"
                    role="tab"
                    aria-selected="${index === 0 ? 'true' : 'false'}"
                    data-demo-tab="${view.key}"
                  >${view.label}</button>
                `).join('')}
              </div>
              ${DEMO_VIEWS.map(renderDemoView).join('')}
            </div>
          </div>
        </section>

        <section class="section" id="industries">
          <div class="container">
            <div class="section-head" data-reveal>
              <span class="section-pill">Industries</span>
              <h2>Designed for teams that win business through their website.</h2>
              <p>The strongest use cases are the ones where slow replies, poor qualification, or weak follow-up turn real demand into lost revenue.</p>
            </div>
            <div class="use-case-grid">
              ${USE_CASES.map((item) => `
                <article class="use-case-card" data-reveal>
                  <h3>${item.name}</h3>
                  <p>${item.text}</p>
                </article>
              `).join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container roi-layout">
            <div class="roi-card" data-reveal>
              <span class="section-pill">Business impact</span>
              <h3>Make website conversations measurable, faster, and easier to run.</h3>
              <p>When greeting, qualification, handoff, and follow-up live in one system, teams reply faster, capture more signal, and lose less context.</p>
              <div class="roi-matrix">
                <article>
                  <strong>Faster first response</strong>
                  <p>AI closes the response gap the moment a visitor lands.</p>
                </article>
                <article>
                  <strong>More qualified conversations</strong>
                  <p>Lead details are captured at the right moment inside the chat.</p>
                </article>
                <article>
                  <strong>Stronger follow-up discipline</strong>
                  <p>Ownership, reminders, and status stay visible across the workflow.</p>
                </article>
                <article>
                  <strong>Clearer attribution</strong>
                  <p>See which pages, intents, and operators actually drive outcomes.</p>
                </article>
              </div>
            </div>
            <div class="roi-scoreboard" data-reveal>
              <div class="score-row"><span>Average first response</span><strong>6 seconds</strong></div>
              <div class="score-row"><span>Missed lead intent</span><strong>-42%</strong></div>
              <div class="score-row"><span>Qualified lead rate</span><strong>+31%</strong></div>
              <div class="score-row"><span>Operator SLA coverage</span><strong>94%</strong></div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container proof-layout">
            <div class="proof-card" data-reveal>
              <span class="section-pill">Trust and proof</span>
              <h3>Built for real operations, not vanity chat metrics.</h3>
              <p>The trust story here is product maturity, clean workflows, practical deployment, and a system designed around conversation outcomes.</p>
              <div class="proof-grid">
                <article>
                  <strong>Operationally clear</strong>
                  <p>AI, operators, contacts, and follow-up live in one predictable workflow.</p>
                </article>
                <article>
                  <strong>Ready for multiple sites</strong>
                  <p>Source tracking and centralized inbox logic support multi-site growth.</p>
                </article>
                <article>
                  <strong>Easy to deploy</strong>
                  <p>Add the widget, configure flows, and start routing conversations quickly.</p>
                </article>
                <article>
                  <strong>Business-first design</strong>
                  <p>Built to capture, qualify, and progress demand instead of just displaying chat activity.</p>
                </article>
              </div>
              <div class="proof-note">If you later add customer logos or real testimonials, this section can absorb them without changing the overall structure.</div>
            </div>
            <div class="proof-card" data-reveal>
              <span class="section-pill">What buyers need to believe</span>
              <h3>This is better than a normal chat widget because the workflow continues after hello.</h3>
              <p>The product does not stop at greeting visitors. It captures lead details, transfers context to humans, structures contacts, and makes performance visible.</p>
            </div>
          </div>
        </section>

        <section class="section" id="faq">
          <div class="container">
            <div class="section-head" data-reveal>
              <span class="section-pill">FAQ</span>
              <h2>Answer the practical questions before they slow the decision.</h2>
              <p>Keep setup, handoff, branding, and multi-site behavior clear enough that the product feels easy to adopt.</p>
            </div>
            <div class="faq-grid">
              ${FAQS.map(renderFaqItem).join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="final-cta" data-reveal>
              <div>
                <span class="section-pill">Start with a stronger conversation layer</span>
                <h2>Replace passive website chat with a system that actually moves leads forward.</h2>
                <p>Give your website a conversation workflow that welcomes, qualifies, routes, and tracks demand in one place.</p>
              </div>
              <div class="final-cta-actions">
                <a class="button button-primary" href="/demo">Book a demo</a>
                <a class="button button-secondary" href="/pricing">Review pricing</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="container footer-grid">
          <div class="footer-brand">
            <span>Chat Platform</span>
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
            <p>Built for teams that lose leads when website conversations stall, context is fragmented, or follow-up lacks discipline.</p>
          </div>
        </div>
      </footer>
    </div>

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

        const storySteps = Array.from(document.querySelectorAll('[data-story-step]'));
        const storyPanels = Array.from(document.querySelectorAll('[data-story-panel]'));
        let activeStoryIndex = 0;
        let storyClickLockUntil = 0;
        let storyScrollTicking = false;
        const storyDesktopQuery = window.matchMedia('(min-width: 961px)');

        const setActiveStory = (index) => {
          if (!storySteps.length) return;
          const nextIndex = Math.max(0, Math.min(storySteps.length - 1, index));
          if (nextIndex === activeStoryIndex) return;
          activeStoryIndex = nextIndex;
          storySteps.forEach((step, stepIndex) => {
            step.classList.toggle('is-active', stepIndex === activeStoryIndex);
          });
          storyPanels.forEach((panel, panelIndex) => {
            panel.classList.toggle('is-active', panelIndex === activeStoryIndex);
          });
        };

        const syncStoryWithScroll = () => {
          storyScrollTicking = false;
          if (!storySteps.length || !storyDesktopQuery.matches) return;
          if (Date.now() < storyClickLockUntil) return;

          const anchorY = window.innerHeight * 0.34;
          let closestIndex = activeStoryIndex;
          let closestDistance = Number.POSITIVE_INFINITY;

          storySteps.forEach((step, index) => {
            const rect = step.getBoundingClientRect();
            const stepCenter = rect.top + rect.height / 2;
            const distance = Math.abs(stepCenter - anchorY);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          });

          if (closestDistance <= window.innerHeight * 0.42) {
            setActiveStory(closestIndex);
          }
        };

        const requestStorySync = () => {
          if (storyScrollTicking) return;
          storyScrollTicking = true;
          window.requestAnimationFrame(syncStoryWithScroll);
        };

        if (storySteps.length) {
          setActiveStory(0);
          window.addEventListener('scroll', requestStorySync, { passive: true });
          window.addEventListener('resize', requestStorySync);
          if (typeof storyDesktopQuery.addEventListener === 'function') {
            storyDesktopQuery.addEventListener('change', requestStorySync);
          } else if (typeof storyDesktopQuery.addListener === 'function') {
            storyDesktopQuery.addListener(requestStorySync);
          }
          requestStorySync();
        }

        storySteps.forEach((step) => {
          step.addEventListener('click', () => {
            const index = Number(step.getAttribute('data-story-step'));
            if (Number.isNaN(index)) return;
            storyClickLockUntil = Date.now() + 900;
            setActiveStory(index);
          });
        });

        const demoTabs = Array.from(document.querySelectorAll('[data-demo-tab]'));
        const demoPanels = Array.from(document.querySelectorAll('[data-demo-panel]'));
        const setActiveDemo = (key) => {
          demoTabs.forEach((tab) => {
            const active = tab.getAttribute('data-demo-tab') === key;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          demoPanels.forEach((panel) => {
            panel.classList.toggle('is-active', panel.getAttribute('data-demo-panel') === key);
          });
        };

        demoTabs.forEach((tab) => {
          tab.addEventListener('click', () => {
            setActiveDemo(tab.getAttribute('data-demo-tab') || '');
          });
        });

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

module.exports = {
  renderHomePage
};
