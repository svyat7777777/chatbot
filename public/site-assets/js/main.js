/* ═══════════════════════════════════════════════
   PORTALAICHAT.COM — main.js
   Web components + all interactive JS
═══════════════════════════════════════════════ */

// ─── SITE MAP ───
const siteMap = {
  home: "/",
  features: "/features",
  pricing: "/pricing",
  industries: "/industries",
  integrations: "/integrations",
  product: "/product",
  security: "/security",
  contact: "/contact"
};

function getLocale() {
  return localStorage.getItem("pf-lang") || "en";
}

function setLocale(locale) {
  localStorage.setItem("pf-lang", locale);
}

const uiCopy = {
  en: {
    nav: [
      { key: "home", label: "Home" },
      { key: "features", label: "Features" },
      { key: "industries", label: "Industries" },
      { key: "pricing", label: "Pricing" },
      { key: "integrations", label: "Integrations" }
    ],
    footer: [
      {
        title: "Product",
        links: [
          ["Features", siteMap.features],
          ["Pricing", siteMap.pricing],
          ["Integrations", siteMap.integrations],
          ["Changelog", siteMap.features]
        ]
      },
      {
        title: "Industries",
        links: [
          ["Real estate", siteMap.industries + "#realestate"],
          ["E-commerce", siteMap.industries + "#ecommerce"],
          ["Services", siteMap.industries + "#services"],
          ["Agencies", siteMap.industries + "#agencies"]
        ]
      },
      {
        title: "Resources",
        links: [
          ["Documentation", siteMap.integrations],
          ["Blog", siteMap.home],
          ["API", siteMap.integrations],
          ["Status", siteMap.security]
        ]
      },
      {
        title: "Company",
        links: [
          ["About", siteMap.home],
          ["Contact", siteMap.contact],
          ["Privacy", siteMap.security],
          ["Terms", siteMap.security]
        ]
      }
    ],
    login: "Log in",
    demo: "Book demo →",
    footerBlurb: "Conversion-focused conversations for your website. From the first greeting to the closed lead.",
    footerCopyright: "© 2026 portalaichat.com. All rights reserved.",
    footerMade: "Built in Ukraine"
  },
  ua: {
    nav: [
      { key: "home", label: "Головна" },
      { key: "features", label: "Можливості" },
      { key: "industries", label: "Галузі" },
      { key: "pricing", label: "Ціни" },
      { key: "integrations", label: "Інтеграції" }
    ],
    footer: [
      {
        title: "Продукт",
        links: [
          ["Можливості", siteMap.features],
          ["Ціни", siteMap.pricing],
          ["Інтеграції", siteMap.integrations],
          ["Changelog", siteMap.features]
        ]
      },
      {
        title: "Галузі",
        links: [
          ["Нерухомість", siteMap.industries + "#realestate"],
          ["E-commerce", siteMap.industries + "#ecommerce"],
          ["Сервіс", siteMap.industries + "#services"],
          ["Агентства", siteMap.industries + "#agencies"]
        ]
      },
      {
        title: "Ресурси",
        links: [
          ["Документація", siteMap.integrations],
          ["Блог", siteMap.home],
          ["API", siteMap.integrations],
          ["Статус", siteMap.security]
        ]
      },
      {
        title: "Компанія",
        links: [
          ["Про нас", siteMap.home],
          ["Контакти", siteMap.contact],
          ["Privacy", siteMap.security],
          ["Terms", siteMap.security]
        ]
      }
    ],
    login: "Увійти",
    demo: "Замовити демо →",
    footerBlurb: "Конверсійна система розмов для вашого сайту. Від першого привітання до закритого ліда.",
    footerCopyright: "© 2026 portalaichat.com. Всі права захищені.",
    footerMade: "Зроблено в Україні"
  }
};

function navItems() {
  return uiCopy[getLocale()].nav;
}

function footerGroups() {
  return uiCopy[getLocale()].footer;
}

function activeLink(key, current) {
  return key === current ? "nav-link is-active" : "nav-link";
}

// ─── SITE HEADER WEB COMPONENT ───
class SiteHeader extends HTMLElement {
  connectedCallback() {
    const current = document.body.dataset.page || "home";
    const copy = uiCopy[getLocale()];
    this.innerHTML = `
      <nav id="nav">
        <div class="nav-inner">
          <a class="nav-logo" href="${siteMap.home}">
            <div class="logo-mark">P</div>
            portalaichat.com
          </a>
          <ul class="nav-links">
            ${navItems().map(item =>
              `<li><a href="${siteMap[item.key]}"${item.key === current ? ' style="color:var(--text-primary)"' : ''}>${item.label}</a></li>`
            ).join("")}
          </ul>
          <div class="nav-cta">
            <div class="lang-switch" aria-label="Language switcher">
              <button type="button" class="lang-link ${getLocale() === "en" ? "is-active" : ""}" data-lang-switch="en">EN</button>
              <button type="button" class="lang-link ${getLocale() === "ua" ? "is-active" : ""}" data-lang-switch="ua">UA</button>
            </div>
            <a class="btn-ghost" href="/login">${copy.login}</a>
            <a class="btn-primary" href="${siteMap.contact}">${copy.demo}</a>
          </div>
        </div>
      </nav>
    `;

    const nav = this.querySelector("nav");
    const syncScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 20);
    };
    syncScroll();
    window.addEventListener("scroll", syncScroll);

    this.querySelectorAll("[data-lang-switch]").forEach(button => {
      button.addEventListener("click", () => {
        setLocale(button.dataset.langSwitch);
        window.location.reload();
      });
    });
  }
}

// ─── SITE FOOTER WEB COMPONENT ───
class SiteFooter extends HTMLElement {
  connectedCallback() {
    const copy = uiCopy[getLocale()];
    this.innerHTML = `
      <footer>
        <div class="footer-inner">
          <div class="footer-brand">
            <a class="footer-logo" href="${siteMap.home}">
              <div class="logo-mark">P</div>
              <span class="footer-logo-text">portalaichat.com</span>
            </a>
            <p>${copy.footerBlurb}</p>
          </div>
          <div class="footer-links">
            ${footerGroups().map(group => `
              <div>
                <div class="footer-col-title">${group.title}</div>
                <div class="footer-col-links">
                  ${group.links.map(link => `<a href="${link[1]}">${link[0]}</a>`).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="footer-bottom">
          <span class="footer-copyright">${copy.footerCopyright}</span>
          <span style="font-size:12.5px; color:var(--text-muted);">${copy.footerMade} 🇺🇦</span>
        </div>
      </footer>
    `;
  }
}

customElements.define("site-header", SiteHeader);
customElements.define("site-footer", SiteFooter);

function setDocumentLanguage() {
  const locale = getLocale();
  document.documentElement.lang = locale === "ua" ? "uk" : "en";
}

function localizeHomePage() {
  if ((document.body.dataset.page || "") !== "home") return;

  const locale = getLocale();
  const title = document.querySelector("title");
  const meta = document.querySelector('meta[name="description"]');

  if (locale === "en") {
    if (title) title.textContent = "portalaichat.com — Conversion-focused conversations for your website";
    if (meta) meta.setAttribute("content", "portalaichat.com helps teams capture more leads with AI replies, human handoff, a shared inbox, analytics, and automations.");

    const replacements = [
      [".hero-badge", `<span class="hero-badge-dot"></span>New release — now with AI automation`],
      [".hero h1", `The first conversation<br>with a visitor —<br><em>already drives the sale</em>`],
      [".hero-sub", `AI greets, answers, and captures leads. A real operator joins when needed. Every conversation stays in one inbox from the first message to the closed lead.`],
      [".hero-actions", `<a href="/contact" class="btn-primary btn-primary-lg">Connect it to your site →</a><a href="#story" class="btn-ghost btn-ghost-lg">See how it works</a>`],
      [".hero-meta", `<span><svg fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7"/></svg>No credit card required</span><span>· Setup in 10 minutes ·</span><span>Free plan available</span>`],
      [".mock-topbar .mock-url", `myshop.com — Home`],
      [".mock-site-badge", `Real estate · Kyiv`],
      [".mock-site h2", `Developer apartments<br>direct from source`],
      [".mock-site p", `More than 200 listings in the best neighborhoods. Get pricing online without calls.`],
      [".mock-site-btn", `Browse listings`],
      [".mock-chat-status", `online now`],
      [".mock-input-field", `Write a message...`],
      [".trust-label", `Trusted by companies`],
      [".pain-label", `Problem`],
      [".pain-heading", `You lose <span class="pain-keyword">leads</span><br>while you sleep`],
      [".pain-sub", `A visitor arrives, looks around, and leaves. Not because the offer is weak, but because nobody replied in time.`],
      [".sticky-intro .section-label", `How it works`],
      [".sticky-intro .section-heading", `From the first click<br>to the closed lead`],
      [".sticky-intro .section-sub", `The whole visitor journey becomes one continuous process. AI starts it, a human closes it.`],
      [".caps-intro .section-label", `Capabilities`],
      [".caps-intro .section-heading", `One system for<br>the full lead lifecycle`],
      [".caps-intro .section-sub", `Not a scattered toolkit, but one platform from the first greeting to sales analytics.`],
      [".tabs-intro .section-label", `Product`],
      [".tabs-intro .section-heading", `Every part is intentional`],
      [".tabs-intro .section-sub", `From chat to analytics, one platform without unnecessary integrations.`],
      [".industries-intro .section-label", `Industries`],
      [".industries-intro .section-heading", `Where it performs best`],
      [".industries-intro .section-sub", `portalaichat.com adapts to your business instead of forcing your business to adapt.`],
      [".roi-section .section-label", `Results`],
      [".roi-section .section-heading", `Real numbers,<br>real business`],
      [".roi-section .section-sub", `Not marketing promises, but customer metrics after 30 days with portalaichat.com.`],
      [".proof-intro .section-label", `Testimonials`],
      [".proof-intro .section-heading", `What customers say`],
      [".faq-intro .section-label", `Questions`],
      [".faq-intro .section-heading", `Frequently asked questions`],
      [".cta-section .section-label", `Get started`],
      [".cta-section h2", `Ready to catch<br>the next visitor?`],
      [".cta-section p", `Connect portalaichat.com today. Your next lead can arrive tonight.`],
      [".cta-actions", `<a href="/contact" class="btn-primary btn-primary-lg">Start for free →</a><a href="/contact" class="btn-ghost btn-ghost-lg">Request demo</a>`],
      [".cta-note", `No credit card required · Free plan available · Setup in 10 minutes`]
    ];

    replacements.forEach(([selector, html]) => {
      const node = document.querySelector(selector);
      if (node) node.innerHTML = html;
    });

    const trustStatNums = document.querySelectorAll(".trust-stat-num");
    const trustStatTexts = document.querySelectorAll(".trust-stat-text");
    if (trustStatNums[2]) trustStatNums[2].textContent = "12 sec";
    if (trustStatTexts[0]) trustStatTexts[0].textContent = "active websites";
    if (trustStatTexts[1]) trustStatTexts[1].textContent = "more leads";
    if (trustStatTexts[2]) trustStatTexts[2].textContent = "average AI response";

    const mockPropLabels = ["Listings", "From", "Rating"];
    const mockPropSubs = ["↑ 12 new", "UAH", "★ 312 reviews"];
    document.querySelectorAll(".mock-prop-label").forEach((node, index) => {
      if (mockPropLabels[index]) node.textContent = mockPropLabels[index];
    });
    document.querySelectorAll(".mock-prop-sub").forEach((node, index) => {
      if (mockPropSubs[index]) node.textContent = mockPropSubs[index];
    });

    const chatBubbleCopy = [
      "Hi there! 👋 Looking for an apartment? I can help you find an option that matches your budget.",
      "Yes, I want a 2-bedroom under 2M",
      "Perfect. There are 14 matching options. Leave your number and a manager will send you a shortlist personally 📋",
      "+38 067 123 45 67"
    ];
    const chatTimeCopy = ["just now", "just now", "just now"];
    document.querySelectorAll(".mock-messages .msg-bubble").forEach((node, index) => {
      if (chatBubbleCopy[index]) node.textContent = chatBubbleCopy[index];
    });
    document.querySelectorAll(".mock-messages .msg-time").forEach((node, index) => {
      if (chatTimeCopy[index]) node.textContent = chatTimeCopy[index];
    });

    const painTitles = ["Slow response", "Leads are scattered everywhere", "Operators repeat themselves"];
    const painDescs = [
      "The average business reply takes 4+ hours. By then the customer may already be with a competitor.",
      "Your website form, Viber, Instagram, and email all hold fragments of the same lead without full context.",
      "Teams answer the same questions every day. Human time gets spent on FAQ instead of sales."
    ];
    document.querySelectorAll(".pain-problem-title").forEach((node, index) => {
      if (painTitles[index]) node.textContent = painTitles[index];
    });
    document.querySelectorAll(".pain-problem-desc").forEach((node, index) => {
      if (painDescs[index]) node.textContent = painDescs[index];
    });

    const painStoryTitle = document.querySelector(".pain-story-title");
    const painTime = document.querySelector(".pain-time");
    if (painStoryTitle) painStoryTitle.innerHTML = `<span class="pain-red-dot"></span>A real situation without portalaichat.com`;
    if (painTime) painTime.textContent = "Yesterday, 10:47 PM";

    const eventTitles = ["Visitor opened the website", "Asked a question in the form", "No one replied", "Morning follow-up"];
    const eventDescs = [
      "Spent 4 minutes on the pricing page",
      "\"What is the minimum order quantity?\"",
      "The form went to a general email inbox. Everyone was asleep.",
      "A manager replied at 9:15 AM, but the customer had already signed with a competitor at 9:00."
    ];
    const eventTimes = ["10:47 PM", "10:51 PM", "10:51 PM – 9:00 AM", "9:15 AM"];
    document.querySelectorAll(".pain-event-title").forEach((node, index) => {
      if (eventTitles[index]) node.textContent = eventTitles[index];
    });
    document.querySelectorAll(".pain-event-desc").forEach((node, index) => {
      if (eventDescs[index]) node.textContent = eventDescs[index];
    });
    document.querySelectorAll(".pain-event-time").forEach((node, index) => {
      if (eventTimes[index]) node.textContent = eventTimes[index];
    });
    const painResultTitle = document.querySelector(".pain-result-title");
    const painResultSub = document.querySelector(".pain-result-sub");
    if (painResultTitle) painResultTitle.textContent = "Lead lost. Deal gone.";
    if (painResultSub) painResultSub.textContent = "One of dozens every week.";

    const stepNums = ["Step 01", "Step 02", "Step 03", "Step 04", "Step 05", "Step 06"];
    const stepTitles = [
      "The visitor arrives on the site",
      "AI opens the conversation",
      "Questions get instant answers",
      "Contact details are captured",
      "An operator joins when needed",
      "Everything stays in one place"
    ];
    const stepDescs = [
      "In the first 30 seconds, visitors decide whether to stay or leave. portalaichat.com greets them first.",
      "A personalized greeting starts the conversation based on the page, not a generic prompt.",
      "AI knows your business: pricing, terms, delivery, and timelines. It replies 24/7 without delay.",
      "Name, email, and phone number are collected naturally during the conversation instead of through cold forms.",
      "When the question becomes high-value, a real manager joins the thread without losing context.",
      "Leads, conversations, and analytics live in one inbox instead of getting lost between channels."
    ];
    document.querySelectorAll(".step-num").forEach((node, index) => {
      if (stepNums[index]) node.textContent = stepNums[index];
    });
    document.querySelectorAll(".step-title").forEach((node, index) => {
      if (stepTitles[index]) node.textContent = stepTitles[index];
    });
    document.querySelectorAll(".step-desc").forEach((node, index) => {
      if (stepDescs[index]) node.textContent = stepDescs[index];
    });

    const capTitles = [
      "AI assistant that knows your business",
      "Lead capture inside chat",
      "Human handoff",
      "Analytics and reporting",
      "No-code automation",
      "Multiple websites"
    ];
    const capDescs = [
      "Train it once and it answers pricing, conditions, timing, and product questions in natural language 24/7.",
      "Name, phone, and email are captured naturally in the conversation without intrusive forms.",
      "AI decides when to escalate, or an operator can join manually. The full context stays intact.",
      "Track leads, conversions, and operator activity in real time so you can see what actually works.",
      "Trigger messages, auto-replies, and scenarios without code. Set it once and let it keep running.",
      "Run several projects from one account, ideal for agencies and businesses with multiple business lines."
    ];
    document.querySelectorAll(".cap-title").forEach((node, index) => {
      if (capTitles[index]) node.textContent = capTitles[index];
    });
    document.querySelectorAll(".cap-desc").forEach((node, index) => {
      if (capDescs[index]) node.textContent = capDescs[index];
    });

    const tabButtons = ["Chat widget", "Inbox", "Contacts", "Analytics", "Automation"];
    document.querySelectorAll(".tab-btn").forEach((node, index) => {
      if (tabButtons[index]) node.textContent = tabButtons[index];
    });

    const industryButtons = ["🏠 Real estate", "🛍️ E-commerce", "🔧 Services", "🏭 Manufacturing"];
    document.querySelectorAll(".ind-tab").forEach((node, index) => {
      if (industryButtons[index]) node.textContent = industryButtons[index];
    });

    const homeIndustryPanels = [
      {
        title: "Real estate and agencies",
        intro: "Customers browse listings late at night. portalaichat.com replies instantly, captures contacts, and books viewings while competitors are asleep.",
        items: [
          ["Property matching by criteria", "AI asks about budget, rooms, and area, then immediately suggests matching options."],
          ["Viewing booking", "The customer books directly in chat without calls or forms."],
          ["Hot lead handoff to an agent", "When the buyer is serious, a human picks up the conversation without losing context."]
        ],
        visualLabel: "Conversation · Real estate",
        bubbles: [
          "Hi there! Looking for an apartment? Tell me, is it for living or for investment? 🏠",
          "For myself. Budget up to 2.5M, 2-3 rooms, Pechersk or Podil",
          "There are 7 strong options. The best fit is Parkova Residence in Podil, 68m², 2.3M. Want to book a viewing for tomorrow?",
          "Yes, morning works",
          "✅ Viewing booked · The realtor has been notified"
        ]
      },
      {
        title: "E-commerce and online stores",
        intro: "Visitors abandon carts, hesitate over delivery, and need quick reassurance. portalaichat.com removes friction and moves them back toward checkout.",
        items: [
          ["Recovering abandoned carts", "A trigger message appears when the customer is about to leave with items in the cart."],
          ["Questions about stock and delivery", "AI answers common questions about timing, price, returns, and shipping."],
          ["Product matching by needs", "The customer describes what they want and AI recommends the right product."]
        ],
        visualLabel: "Conversation · E-commerce",
        bubbles: [
          "I can see you added an item to your cart. Any questions before checkout? Delivery is tomorrow if you order before 2 PM 🚀",
          "Are there discounts if I order several pieces?",
          "Yes. Orders of 3+ get 10% off, and 5+ get 15% off plus free delivery. Want to place it now?"
        ]
      },
      {
        title: "Local and service businesses",
        intro: "Customers compare fast and expect immediate answers. portalaichat.com handles intake, collects requests, and books consultations without slowing the team down.",
        items: [
          ["Request intake and booking", "AI gathers the needed details and passes a ready request to the manager."],
          ["Preliminary estimate", "The customer describes the task and AI gives an initial price range and timing."],
          ["Post-service review collection", "An automatic feedback prompt can be sent after the job is completed."]
        ],
        visualLabel: "Conversation · Services",
        bubbles: [
          "Hi! Tell me about your task and I’ll help estimate the cost and timing 🔧",
          "I need an AC installed in a two-room apartment",
          "Typically that starts around 2,800–3,500 UAH depending on the type. Leave your number and a technician will call to confirm?",
          "✅ Request accepted · A technician will contact you within 15 minutes"
        ]
      },
      {
        title: "Manufacturing and B2B",
        intro: "Corporate buyers want fast answers without unnecessary calls. portalaichat.com collects technical requirements and qualifies the opportunity before a manager joins.",
        items: [
          ["Collecting technical requirements", "AI уточнює тираж, матеріали, розміри і формує повний запит для менеджера.".replace("AI уточнює тираж, матеріали, розміри і формує повний запит для менеджера.", "AI asks about run size, materials, dimensions, and turns it into a clean request for sales.")],
          ["B2B lead qualification", "It identifies order size and buyer type before passing the conversation onward."],
          ["Sending briefs and proposals", "Relevant documents can be sent automatically once the lead is qualified."]
        ],
        visualLabel: "Conversation · B2B manufacturing",
        bubbles: [
          "Hi! Tell me about your order. What are we producing, what quantity do you need, and do you already have a technical brief? 📋",
          "We need branded boxes, 5,000 units, and the artwork is ready",
          "Perfect. 5,000 units is a premium run. Send the file and I’ll pass everything to our B2B manager with full context."
        ]
      }
    ];

    document.querySelectorAll(".industry-panel").forEach((panel, panelIndex) => {
      const data = homeIndustryPanels[panelIndex];
      if (!data) return;

      const title = panel.querySelector(".industry-text h3");
      const intro = panel.querySelector(".industry-text > p");
      if (title) title.textContent = data.title;
      if (intro) intro.textContent = data.intro;

      const scenarioTitles = panel.querySelectorAll(".ind-scene-title");
      const scenarioDescs = panel.querySelectorAll(".ind-scene-desc");
      data.items.forEach((item, index) => {
        if (scenarioTitles[index]) scenarioTitles[index].textContent = item[0];
        if (scenarioDescs[index]) scenarioDescs[index].textContent = item[1];
      });

      const visualLabel = panel.querySelector(".industry-visual > div > div");
      if (visualLabel) visualLabel.textContent = data.visualLabel;

      const bubbles = panel.querySelectorAll(".industry-visual [style*='border-radius: 10px 10px 10px 4px'], .industry-visual [style*='border-radius: 10px 10px 4px 10px'], .industry-visual [style*='border-radius: 8px']");
      data.bubbles.forEach((text, index) => {
        if (bubbles[index]) bubbles[index].textContent = text;
      });
    });

    const roiNumbers = document.querySelectorAll(".roi-number");
    const roiLabels = document.querySelectorAll(".roi-num-label");
    if (roiLabels[0]) roiLabels[0].textContent = "more leads from the same traffic";
    if (roiNumbers[1]) roiNumbers[1].textContent = "12 sec";
    if (roiLabels[1]) roiLabels[1].textContent = "average first AI response";
    if (roiLabels[2]) roiLabels[2].textContent = "of questions resolved by AI without an operator";

    const proofQuotes = [
      "\"In the first month we captured 47 leads that used to disappear. Customers message us at 11 PM, AI replies instantly, and by morning the team opens a ready-to-work request with contact details and context.\"",
      "\"We connected it in 15 minutes. AI learned our catalog fast, and now 80% of questions are solved without us.\"",
      "\"Site conversion grew from 3% to 11%, and we changed nothing else. We just added portalaichat.com.\"",
      "\"Finally one inbox for everything. We no longer hunt for who wrote where across the site, Telegram, and Viber.\""
    ];
    document.querySelectorAll(".test-quote").forEach((node, index) => {
      if (proofQuotes[index]) node.textContent = proofQuotes[index];
    });

    const trustBadgeLabels = ["GDPR-ready", "99.9% uptime", "Easy setup", "24/7 support"];
    const trustBadgeSubs = ["EU data region", "SLA-backed", "One line of code", "Team in chat"];
    document.querySelectorAll(".trust-badge-label").forEach((node, index) => {
      if (trustBadgeLabels[index]) node.textContent = trustBadgeLabels[index];
    });
    document.querySelectorAll(".trust-badge-sub").forEach((node, index) => {
      if (trustBadgeSubs[index]) node.textContent = trustBadgeSubs[index];
    });

    const faqQuestions = [
      "How hard is installation?",
      "Can AI hand the conversation to a human?",
      "Can AI collect customer contacts?",
      "Can I connect multiple websites?",
      "Can I customize the appearance?",
      "Do all operators see the same conversations?"
    ];
    const faqAnswers = [
      "Add one line of code to your site and you are live. There are guides for WordPress, Tilda, Webflow, and plain HTML.",
      "Yes. AI can escalate based on keywords, conversation depth, or when the visitor explicitly asks for a person.",
      "Yes, naturally inside the conversation. Name, email, and phone number are requested at the right moment without feeling intrusive.",
      "Yes. One account can manage multiple websites, each with its own AI, inbox, and analytics.",
      "Yes. Color, icon, greeting, position on screen, and automatic message behavior can all be configured without code.",
      "You can use one shared team inbox or assign conversations by team, site, or operator with flexible roles and permissions."
    ];
    document.querySelectorAll(".faq-q").forEach((button, index) => {
      if (faqQuestions[index]) {
        const arrow = button.querySelector(".faq-arrow");
        button.childNodes[0].textContent = faqQuestions[index] + " ";
        if (arrow) arrow.textContent = "▼";
      }
    });
    document.querySelectorAll(".faq-a").forEach((node, index) => {
      if (faqAnswers[index]) node.textContent = faqAnswers[index];
    });

    const homeTabTitles = [
      "A chat widget that actually sells",
      "One inbox for the whole team",
      "A profile for every customer",
      "Analytics that actually matter",
      "No-code automation"
    ];
    const homeTabDescs = [
      "Add it with one line of code. It matches your design, starts the conversation before visitors leave, and stays fast on every page.",
      "All conversations from all sites stay in one place. Assign operators, add tags, and keep every lead from slipping through the cracks.",
      "See contacts, source, previous conversations, tags, and operator notes in one view instead of scattered tools.",
      "Not just charts. You see how many leads were captured, which pages create conversations, and where operators make the difference.",
      "Run greeting triggers, follow-ups, and routing scenarios automatically when visitors land on specific pages or match certain intent."
    ];
    document.querySelectorAll(".tab-text h3").forEach((node, index) => {
      if (homeTabTitles[index]) node.textContent = homeTabTitles[index];
    });
    document.querySelectorAll(".tab-text p").forEach((node, index) => {
      if (homeTabDescs[index]) node.textContent = homeTabDescs[index];
    });

    const homeTabFeatures = [
      ["Custom styling and branding", "Automatic greeting by page", "Mobile-ready design", "No loading delay", "Multi-language support"],
      ["Shared team inbox", "Operator assignment", "Tags and statuses", "Search across all threads", "Full customer history"],
      ["Auto-fill from chat", "Tags and custom fields", "Team notes", "Source and UTM markers", "Full interaction history"],
      ["Real-time dashboard", "Operator performance", "Conversion by page", "Conversation funnel", "CSV export"],
      ["Event triggers", "Automatic replies", "Reminders and follow-up", "Conditional logic", "CRM integration"]
    ];
    document.querySelectorAll(".tab-panel").forEach((panel, panelIndex) => {
      const features = panel.querySelectorAll(".tab-feature");
      homeTabFeatures[panelIndex]?.forEach((text, featureIndex) => {
        if (features[featureIndex]) features[featureIndex].textContent = text;
      });
    });

    const widgetPanel = document.querySelector("#tab-widget");
    if (widgetPanel) {
      const headerLines = widgetPanel.querySelectorAll(".tab-mock-content [style*='padding: 12px 14px'] > div:last-child > div");
      if (headerLines[0]) headerLines[0].textContent = "Support";
      if (headerLines[1]) headerLines[1].textContent = "● online";
      const widgetMessages = widgetPanel.querySelectorAll(".tab-mock-content [style*='min-height: 140px'] > div");
      if (widgetMessages[0]) widgetMessages[0].textContent = "Hi! I can help choose the right setup for your business. Where should we start? 👋";
      if (widgetMessages[1]) widgetMessages[1].textContent = "I want to see pricing";
      const widgetInput = widgetPanel.querySelector(".tab-mock-content [style*='flex: 1; background: var(--bg-elevated)']");
      if (widgetInput) widgetInput.textContent = "Write a message...";
    }

    const inboxPanel = document.querySelector("#tab-inbox");
    if (inboxPanel) {
      const avatars = inboxPanel.querySelectorAll(".inbox-av");
      if (avatars[0]) avatars[0].textContent = "O";
      if (avatars[1]) avatars[1].textContent = "M";
      if (avatars[2]) avatars[2].textContent = "S";
      const names = inboxPanel.querySelectorAll(".inbox-name");
      if (names[0]) names[0].innerHTML = `Olena P. <span style="background: rgba(59,130,246,0.15); color: #93C5FD; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 100px;">New</span>`;
      if (names[1]) names[1].textContent = "Mykola V.";
      if (names[2]) names[2].innerHTML = `Serhii K. <span style="background: rgba(245,158,11,0.15); color: #FCD34D; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 100px;">Urgent</span>`;
      const previews = inboxPanel.querySelectorAll(".inbox-preview");
      if (previews[0]) previews[0].textContent = "I want to order 500 bags...";
      if (previews[1]) previews[1].textContent = "Thanks, I’m waiting for the invoice";
      if (previews[2]) previews[2].textContent = "When will the order be ready?";
      const times = inboxPanel.querySelectorAll(".inbox-time");
      if (times[0]) times[0].textContent = "2 min ago";
      if (times[1]) times[1].textContent = "18 min";
      if (times[2]) times[2].textContent = "1 hr";
    }

    const contactsPanel = document.querySelector("#tab-contacts");
    if (contactsPanel) {
      const avatar = contactsPanel.querySelector(".tab-mock-content [style*='width: 38px; height: 38px']");
      if (avatar) avatar.textContent = "O";
      const name = contactsPanel.querySelector(".tab-mock-content [style*='font-size: 13.5px; font-weight: 600; color: var(--text-primary);']");
      if (name) name.textContent = "Olena Petrivna";
      const status = contactsPanel.querySelector(".tab-mock-content [style*='margin-left: auto; background: var(--green-dim)']");
      if (status) status.textContent = "Active";
      const statLabels = contactsPanel.querySelectorAll(".tab-mock-content [style*='font-size: 10px; color: var(--text-muted); text-transform: uppercase;']");
      if (statLabels[0]) statLabels[0].textContent = "Conversations";
      if (statLabels[1]) statLabels[1].textContent = "Source";
      const source = contactsPanel.querySelector(".tab-mock-content [style*='font-size: 13px; font-weight: 500; color: var(--text-primary);']");
      if (source) source.textContent = "Website chat";
      const tags = contactsPanel.querySelectorAll(".tab-mock-content span[style*='font-size: 11px; padding: 4px 10px']");
      if (tags[0]) tags[0].textContent = "VIP customer";
      if (tags[1]) tags[1].textContent = "Branding";
      if (tags[2]) tags[2].textContent = "Returning";
    }

    const analyticsPanel = document.querySelector("#tab-analytics");
    if (analyticsPanel) {
      const statLabels = analyticsPanel.querySelectorAll(".am-stat-label");
      if (statLabels[0]) statLabels[0].textContent = "Leads this month";
      if (statLabels[1]) statLabels[1].textContent = "Conversion";
      const chartLabel = analyticsPanel.querySelector(".am-chart > div");
      if (chartLabel) chartLabel.textContent = "Leads by day";
    }

    const automationPanel = document.querySelector("#tab-automation");
    if (automationPanel) {
      const automationLabels = automationPanel.querySelectorAll(".tab-mock-content [style*='font-size: 12.5px; font-weight: 500; color: var(--text-primary);']");
      const automationMeta = automationPanel.querySelectorAll(".tab-mock-content [style*='font-size: 11px; color: var(--text-muted);']");
      const sectionLabel = automationPanel.querySelector(".tab-mock-content [style*='text-transform: uppercase;']");
      if (sectionLabel) sectionLabel.textContent = "Active scenarios";
      if (automationLabels[0]) automationLabels[0].textContent = "New visitor greeting";
      if (automationLabels[1]) automationLabels[1].textContent = "24-hour follow-up";
      if (automationLabels[2]) automationLabels[2].textContent = "Handoff when quote exceeds 10k";
      if (automationMeta[0]) automationMeta[0].textContent = "Trigger: first visit · Delay: 5 sec";
      if (automationMeta[1]) automationMeta[1].textContent = "Trigger: lead without reply · Email";
      if (automationMeta[2]) automationMeta[2].textContent = "Trigger: keywords in chat";
    }

    const industrySectionLabel = document.querySelector(".industries-section .section-label");
    const industrySectionHeading = document.querySelector(".industries-section .section-heading");
    const industrySectionSub = document.querySelector(".industries-section .section-sub");
    if (industrySectionLabel) industrySectionLabel.textContent = "Industries";
    if (industrySectionHeading) industrySectionHeading.textContent = "Where it works best";
    if (industrySectionSub) industrySectionSub.textContent = "portalaichat.com adapts to your business instead of forcing your business to adapt.";

    const roiCompTitle = document.querySelector(".roi-comp-title");
    if (roiCompTitle) roiCompTitle.textContent = "Before and after portalaichat.com";
    const roiCompLabels = [
      ["First response time", "12 sec vs 4 hr"],
      ["Lead capture rate", "12% → 47%"],
      ["Operator workload", "-62%"],
      ["Deal conversion", "4.1% → 11.8%"]
    ];
    document.querySelectorAll(".roi-comp-label").forEach((node, index) => {
      const spans = node.querySelectorAll("span");
      if (roiCompLabels[index]?.[0] && spans[0]) spans[0].textContent = roiCompLabels[index][0];
      if (roiCompLabels[index]?.[1] && spans[1]) spans[1].textContent = roiCompLabels[index][1];
    });
    const roiLegend = document.querySelectorAll(".roi-visual span[style*='font-size: 12.5px']");
    if (roiLegend[0]) roiLegend[0].textContent = "Before portalaichat.com";
    if (roiLegend[1]) roiLegend[1].textContent = "After portalaichat.com";
  } else {
    if (title) title.textContent = "portalaichat.com — Конверсійна система розмов для вашого сайту";
    if (meta) meta.setAttribute("content", "portalaichat.com допомагає командам захоплювати більше лідів за допомогою AI-відповідей, живої передачі, спільного інбоксу, аналітики та автоматизацій.");
  }
}

function localizeFeaturesPage() {
  if ((document.body.dataset.page || "") !== "features") return;
  if (getLocale() !== "en") return;

  const title = document.querySelector("title");
  const meta = document.querySelector('meta[name="description"]');
  if (title) title.textContent = "Features | portalaichat.com";
  if (meta) meta.setAttribute("content", "Explore portalaichat.com features including AI chat, shared inbox, analytics, automation, and human handoff.");
  document.documentElement.lang = "en";

  const heroLabel = document.querySelector(".page-hero .section-label");
  const heroTitle = document.querySelector(".feat-page-h1");
  const heroSub = document.querySelector(".feat-page-sub");
  const heroActions = document.querySelector(".feat-page-actions");
  if (heroLabel) heroLabel.textContent = "Features";
  if (heroTitle) heroTitle.innerHTML = "Everything you need<br>to stop losing leads";
  if (heroSub) heroSub.textContent = "portalaichat.com is not just a chat widget. It is a complete system from the first greeting on the site to the qualified opportunity in your pipeline.";
  if (heroActions) heroActions.innerHTML = `<a href="/contact" class="btn-primary">Book demo →</a><a href="/pricing" class="btn-ghost">View pricing</a>`;

  const blockTags = ["🤖 AI assistant", "📥 Shared inbox", "🔄 Human handoff", "📊 Analytics", "⚡ Automation"];
  const blockTitles = [
    "Answers for you, 24/7",
    "All conversations in one place",
    "AI starts, humans close",
    "Know what actually drives revenue",
    "Set it once and let it run"
  ];
  const blockDescs = [
    "Train the assistant once with pricing, policies, FAQs, and product context. It keeps answering naturally without sounding scripted.",
    "No conversation gets lost between tabs and messengers. The inbox collects statuses, assignments, tags, and notes in one clean view.",
    "When a conversation becomes valuable, a real manager joins with full context. The customer never feels the handoff.",
    "The live dashboard shows where leads come from, how AI is performing, and where human help is still needed.",
    "Build no-code scenarios for greetings, routing, follow-up, and escalation after the conversation."
  ];
  document.querySelectorAll(".feat-page-block-tag").forEach((node, index) => {
    if (blockTags[index]) node.textContent = blockTags[index];
  });
  document.querySelectorAll(".feat-page-block-title").forEach((node, index) => {
    if (blockTitles[index]) node.textContent = blockTitles[index];
  });
  document.querySelectorAll(".feat-page-block-desc").forEach((node, index) => {
    if (blockDescs[index]) node.textContent = blockDescs[index];
  });

  const featureLists = [
    [
      "Replies based on your business knowledge base",
      "Page-aware greetings for different sections",
      "Multi-language support",
      "Escalates instead of guessing when confidence is low"
    ],
    [
      "Assign conversations across operators",
      "Statuses: open, in progress, resolved",
      "Tags and filters for lead search",
      "Internal notes for the team"
    ],
    [
      "Automatic handoff by keywords or buyer intent",
      "AI writes a short summary for the operator",
      "Full conversation history stays attached",
      "Telegram or email alerts for hot leads"
    ],
    [
      "Lead volume, conversion, and first-response time",
      "AI efficiency and resolution rate",
      "Operator activity and reaction speed",
      "Top-performing pages and traffic sources"
    ],
    [
      "Trigger greetings on important pages",
      "Follow-up when a lead goes quiet for 24 hours",
      "Route conversations by topic",
      "Automatic handoff on key phrases"
    ]
  ];
  document.querySelectorAll(".feat-page-list").forEach((list, listIndex) => {
    list.querySelectorAll("li").forEach((item, itemIndex) => {
      if (featureLists[listIndex]?.[itemIndex]) item.textContent = featureLists[listIndex][itemIndex];
    });
  });

  const misc = [
    [".feat-mock-chat-header div div:last-child", "● online"],
    [".feat-mock-chat-body .feat-mock-msg.ai:first-child", "Hi! I can see you're viewing the pricing page. Do you want help with cost or timing? 👋"],
    [".feat-mock-chat-body .feat-mock-msg.user", "What is the minimum order quantity?"],
    [".feat-mock-chat-body .feat-mock-msg.ai:last-child", "The minimum order is 50 units. Orders over 100 get free delivery. Production takes 5 business days after artwork approval."],
    [".feat-mock-inbox-header", "Inbox · 3 new"],
    [".feat-mock-tag", "hot"],
    [".feat-mock-handoff-banner", "🔁 AI handed off the thread · Customer is ready to buy"],
    [".feat-mock-handoff .feat-mock-msg.ai", "Hi Olena! I’m Marina from sales. I can see you’re interested in 500 custom bags, and I’m already preparing the best offer 🎯"],
    [".section-heading", "Ready to connect it?"]
  ];
  misc.forEach(([selector, text]) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  });
  const inboxNames = document.querySelectorAll(".feat-mock-inbox-name");
  if (inboxNames[0]) inboxNames[0].innerHTML = `Olena K. <span class="feat-mock-tag">hot</span>`;
  if (inboxNames[1]) inboxNames[1].textContent = "Mykhailo V.";
  if (inboxNames[2]) inboxNames[2].textContent = "Online store";
  const inboxPreviews = document.querySelectorAll(".feat-mock-inbox-preview");
  if (inboxPreviews[0]) inboxPreviews[0].textContent = "AI → your turn 🔔";
  if (inboxPreviews[1]) inboxPreviews[1].textContent = "Thanks, I’ll wait for the invoice";
  if (inboxPreviews[2]) inboxPreviews[2].textContent = "Do you have wholesale pricing?";
  const metricLabels = document.querySelectorAll(".feat-mock-metric-label");
  const metricTrends = document.querySelectorAll(".feat-mock-metric-trend");
  if (metricLabels[0]) metricLabels[0].textContent = "Leads";
  if (metricLabels[1]) metricLabels[1].textContent = "Conversion";
  if (metricLabels[2]) metricLabels[2].textContent = "AI resolves";
  if (metricTrends[2]) metricTrends[2].textContent = "auto";
  const flowSteps = document.querySelectorAll(".feat-mock-flow-step");
  if (flowSteps[0]) flowSteps[0].textContent = "📄 Visitor opened the pricing page";
  if (flowSteps[1]) flowSteps[1].textContent = "💬 AI sends a contextual greeting";
  if (flowSteps[2]) flowSteps[2].textContent = "🎯 Lead captured → CRM";
  const ctaSub = document.querySelector("section[style*='background:var(--bg-elevated)'] .section-sub");
  if (ctaSub) ctaSub.textContent = "Setup takes about 10 minutes. Your first lead could arrive tonight.";
  const ctaBtns = document.querySelector("section[style*='background:var(--bg-elevated)'] [style*='display:flex']");
  if (ctaBtns) ctaBtns.innerHTML = `<a href="/contact" class="btn-primary">Book demo →</a><a href="/pricing" class="btn-ghost">View pricing</a>`;
}

function localizeIntegrationsPage() {
  if ((document.body.dataset.page || "") !== "integrations") return;
  if (getLocale() !== "en") return;

  const title = document.querySelector("title");
  const meta = document.querySelector('meta[name="description"]');
  if (title) title.textContent = "Integrations | portalaichat.com";
  if (meta) meta.setAttribute("content", "See how portalaichat.com connects to websites, CRMs, Telegram, email, analytics, and developer workflows.");
  document.documentElement.lang = "en";

  const heroLabel = document.querySelector(".page-hero .section-label");
  const heroTitle = document.querySelector(".feat-page-h1");
  const heroSub = document.querySelector(".feat-page-sub");
  if (heroLabel) heroLabel.textContent = "Integrations";
  if (heroTitle) heroTitle.innerHTML = "Connects with everything<br>you already use";
  if (heroSub) heroSub.textContent = "Add one line of code to your site and portalaichat.com is live. Then connect CRM tools, messengers, and alerts in just a few clicks.";

  const categoryTitles = [
    "Websites and CMS",
    "CRM and business systems",
    "Notifications and communication",
    "Analytics and tracking",
    "For developers"
  ];
  document.querySelectorAll(".intg-category-title").forEach((node, index) => {
    if (categoryTitles[index]) node.textContent = categoryTitles[index];
  });

  const cardNames = [
    "HTML / any website", "WordPress", "Tilda", "Webflow", "Shopify", "WooCommerce",
    "Bitrix24", "HubSpot", "Pipedrive", "Any CRM",
    "Telegram", "Email", "Slack",
    "Google Analytics 4", "Google Tag Manager", "Facebook Pixel",
    "Webhooks", "REST API"
  ];
  const cardDescs = [
    "Add one line of code before </body> and you're live",
    "Use a plugin or insert in footer.php without touching core code",
    "Add an HTML block in site settings once for every page",
    "Use custom code in Project Settings → Footer",
    "Place the snippet in theme.liquid and it runs store-wide",
    "Add through the WordPress footer or a custom scripts plugin",
    "Send leads and contact data through webhook or API",
    "Sync contacts, deals, and conversation tags directly through API",
    "New chat leads can automatically become opportunities in Pipedrive",
    "Send contact data, tags, and conversation summaries through webhook",
    "Instant hot-lead or handoff alerts for the team",
    "Notify managers and send a daily lead digest",
    "Route team alerts into Slack via webhook",
    "Track chat start, lead capture, and handoff as GA4 conversions",
    "Install through GTM without editing the site code",
    "Send lead events into Pixel for retargeting",
    "Receive payloads with contact data, tags, summaries, and UTM source on any endpoint",
    "Sync contacts, export analytics, and manage workspaces for internal dashboards and systems"
  ];
  document.querySelectorAll(".intg-card-name").forEach((node, index) => {
    if (cardNames[index]) node.textContent = cardNames[index];
  });
  document.querySelectorAll(".intg-card-desc").forEach((node, index) => {
    if (cardDescs[index]) node.textContent = cardDescs[index];
  });

  const badges = [
    "1 minute", "Plugin", "HTML block", "Custom code", "theme.liquid", "Footer",
    "Webhook", "API", "API", "Webhook",
    "Native", "Native", "Webhook",
    "Events", "GTM tag", "Events",
    "All plans", "Pro+"
  ];
  document.querySelectorAll(".intg-card-badge").forEach((node, index) => {
    if (badges[index]) node.textContent = badges[index];
  });

  const howLabel = document.querySelector(".intg-how .section-label");
  const howTitle = document.querySelector(".intg-how .section-heading");
  if (howLabel) howLabel.textContent = "How to connect";
  if (howTitle) howTitle.textContent = "Three steps to your first lead";
  const stepTitles = ["Add the script to your site", "Configure the AI", "Connect notifications"];
  const stepDescs = [
    "One line of code works on almost any platform. There are guides for WordPress, Tilda, Shopify, Webflow, and plain HTML.",
    "Upload FAQs, pricing, and operating rules. The assistant can start answering customers within minutes.",
    "Add a Telegram bot or email alerts so your team hears about new leads and hot conversations instantly."
  ];
  document.querySelectorAll(".intg-step-title").forEach((node, index) => {
    if (stepTitles[index]) node.textContent = stepTitles[index];
  });
  document.querySelectorAll(".intg-step-desc").forEach((node, index) => {
    if (stepDescs[index]) node.textContent = stepDescs[index];
  });
  const codeLabel = document.querySelector(".intg-code-label");
  const codePre = document.querySelector(".intg-code-pre");
  if (codeLabel) codeLabel.textContent = "Installation";
  if (codePre) {
    codePre.innerHTML = `<span class="intg-code-comment">&lt;!-- Add before &lt;/body&gt; --&gt;</span>
<span class="intg-code-tag">&lt;script&gt;</span>
  <span class="intg-code-var">window</span>.PortalAIChatConfig = {
    <span class="intg-code-key">workspaceId</span>: <span class="intg-code-str">"your-id"</span>,
    <span class="intg-code-key">language</span>: <span class="intg-code-str">"en"</span>
  };
<span class="intg-code-tag">&lt;/script&gt;</span>
<span class="intg-code-tag">&lt;script </span><span class="intg-code-key">src</span>=<span class="intg-code-str">"https://cdn.portalaichat.com/widget.js"</span>
  <span class="intg-code-key">defer</span><span class="intg-code-tag">&gt;&lt;/script&gt;</span>`;
  }

  const ctaTitle = document.querySelector("section[style*='padding:80px 0'] .section-heading");
  const ctaSub = document.querySelector("section[style*='padding:80px 0'] .section-sub");
  const ctaBtns = document.querySelector("section[style*='padding:80px 0'] [style*='display:flex']");
  if (ctaTitle) ctaTitle.textContent = "Need help with setup?";
  if (ctaSub) ctaSub.textContent = "Our team can help configure the integration for your platform as part of onboarding.";
  if (ctaBtns) ctaBtns.innerHTML = `<a href="/contact" class="btn-primary">Talk to the team →</a><a href="/pricing" class="btn-ghost">View plans</a>`;
}

function localizePricingPage() {
  if ((document.body.dataset.page || "") !== "pricing") return;
  if (getLocale() !== "ua") return;

  const title = document.querySelector("title");
  const meta = document.querySelector('meta[name="description"]');
  if (title) title.textContent = "Ціни | portalaichat.com";
  if (meta) meta.setAttribute("content", "Порівняйте плани portalaichat.com: місячна та річна оплата, функції, enterprise та кастомні умови.");
  document.documentElement.lang = "uk";

  const replacements = [
    [".page-hero .eyebrow", "Ціни"],
    [".page-title", `Плани, що ростуть від одного сайту до <span class="accent-text">команд з більшим навантаженням</span>.`],
    [".page-copy", "Оберіть рівень покриття по сайтах, кількості операторів, chat-flow та звітності, який потрібен зараз, і масштабуйтеся без зміни інструменту пізніше."],
    [".surface-card strong", "Оберіть формат оплати"],
    [".surface-card [data-billing='monthly']", "Щомісяця"],
    [".surface-card [data-billing='yearly']", "Щороку"]
  ];
  replacements.forEach(([selector, html]) => {
    const node = document.querySelector(selector);
    if (node) node.innerHTML = html;
  });
  const billingNote = document.querySelector(".surface-card div[style*='margin-top:12px']");
  if (billingNote) billingNote.textContent = "Зекономте з річною оплатою.";

  const planTitles = ["Starter", "Growth", "Scale"];
  const planDescs = [
    "Для малого бізнесу, який запускає AI-чат на одному сайті.",
    "Для команд, яким потрібні automation, routing і робота кількох операторів.",
    "Для більших команд, які ведуть кілька сайтів, брендів і вищий обсяг чатів."
  ];
  document.querySelectorAll(".pricing-card h3").forEach((node, index) => { if (planTitles[index]) node.textContent = planTitles[index]; });
  document.querySelectorAll(".pricing-card > p").forEach((node, index) => { if (planDescs[index]) node.textContent = planDescs[index]; });
  const monthlyPrices = ["$25", "$35", "$79"];
  const yearlyPrices = ["$250", "$350", "$790"];
  document.querySelectorAll(".price").forEach((node, index) => {
    if (monthlyPrices[index]) node.textContent = monthlyPrices[index];
    if (monthlyPrices[index]) node.dataset.monthly = monthlyPrices[index];
    if (yearlyPrices[index]) node.dataset.yearly = yearlyPrices[index];
  });
  document.querySelectorAll(".price-note").forEach((node) => {
    node.textContent = "на місяць";
    node.dataset.monthly = "на місяць";
    node.dataset.yearly = "на рік";
  });

  const planFeatures = [
    ["1 сайт", "1 оператор", "AI-асистент", "Спільний inbox", "Базовий lead capture", "Відповіді на базі знань", "Базові chat-flow", "Email-підтримка"],
    ["3 сайти", "До 5 операторів", "AI-асистент", "Спільний inbox", "AI → human handoff", "Розширені chat-flow", "Інтеграції", "Аналітика та експорт", "Telegram-сповіщення"],
    ["10 сайтів", "До 20 операторів", "AI-асистент", "Спільний inbox", "AI → human handoff", "Розширені chat-flow", "Інтеграції", "Аналітика та експорт", "Пріоритетна підтримка"]
  ];
  document.querySelectorAll(".pricing-card").forEach((card, cardIndex) => {
    card.querySelectorAll(".feature-list span").forEach((node, itemIndex) => {
      if (planFeatures[cardIndex]?.[itemIndex]) node.textContent = planFeatures[cardIndex][itemIndex];
    });
  });
  const planButtons = ["Почати зі Starter", "Почати з Growth", "Зв’язатися з sales"];
  document.querySelectorAll(".pricing-card .btn").forEach((node, index) => { if (planButtons[index]) node.textContent = planButtons[index]; });
  const label = document.querySelector(".pricing-card.popular .label");
  if (label) label.textContent = "Найпопулярніший";

  const compareEyebrow = document.querySelector(".section .eyebrow");
  const compareTitle = document.querySelector(".section .section-title");
  if (compareEyebrow) compareEyebrow.textContent = "Порівняння";
  if (compareTitle) compareTitle.textContent = "Що входить у плани.";
  const ths = document.querySelectorAll(".compare-table th");
  ["Функція", "Starter", "Growth", "Scale"].forEach((text, i) => { if (ths[i]) ths[i].textContent = text; });
  const tableRows = [
    ["Кількість сайтів", "1", "3", "10"],
    ["Кількість операторів", "1", "До 5", "До 20"],
    ["AI-асистент і відповіді на базі знань", "Так", "Так", "Так"],
    ["Спільний командний inbox", "Так", "Так", "Так"],
    ["AI → human handoff", "—", "Так", "Так"],
    ["Chat-flow", "Базові", "Розширені", "Розширені"],
    ["Інтеграції", "—", "Так", "Так"],
    ["Аналітика та експорт", "—", "Так", "Так"],
    ["Рівень підтримки", "Email", "Стандартна", "Пріоритетна"]
  ];
  document.querySelectorAll(".compare-table tbody tr").forEach((row, r) => {
    row.querySelectorAll("td").forEach((cell, c) => {
      if (tableRows[r]?.[c]) cell.textContent = tableRows[r][c];
    });
  });

  const enterpriseReplacements = [
    [".section.bleed .eyebrow", "Enterprise / кастомно"],
    [".section.bleed .section-title", "Потрібні вищі ліміти, rollout-guidance або окрема sales-розмова?"],
    [".section.bleed .section-copy", "Допоможемо більшим командам спланувати покриття по сайтах, структуру операторів, очікування по support і правильний комерційний сценарій запуску."],
    [".contact-panel .board-title", "Enterprise-запит"],
    [".contact-panel .board-sub", "Розкажіть про свої сайти, команду операторів і очікуваний обсяг чатів."],
    [".contact-panel .btn", "Зв’язатися з sales"]
  ];
  enterpriseReplacements.forEach(([selector, html]) => {
    const node = document.querySelector(selector);
    if (node) node.innerHTML = html;
  });
  const enterpriseCards = document.querySelectorAll(".section.bleed .stack-card");
  if (enterpriseCards[0]) enterpriseCards[0].innerHTML = "<strong>Планування обсягу</strong><p>Підберемо правильний план для більших портфелів сайтів, груп брендів або швидко зростаючих команд.</p>";
  if (enterpriseCards[1]) enterpriseCards[1].innerHTML = "<strong>Ясність rollout</strong><p>Обговоримо кількість операторів, рівень support і як рости без зміни інструменту.</p>";

  const faqEyebrow = document.querySelector(".pricing-faq")?.previousElementSibling?.querySelector(".eyebrow");
  const faqTitle = document.querySelector(".pricing-faq")?.previousElementSibling?.querySelector(".section-title");
  if (faqEyebrow) faqEyebrow.textContent = "FAQ по цінах";
  if (faqTitle) faqTitle.textContent = "Поширені питання про плани.";
  const pricingFaqQuestions = [
    "Чи можу я почати з малого плану і перейти вище пізніше?",
    "Що вважається окремим сайтом?",
    "Чи AI-відповіді та inbox є в кожному плані?",
    "Чи можна оплачувати щороку?"
  ];
  const pricingFaqAnswers = [
    "Так. Ви можете почати зі Starter і перейти на Growth або Scale пізніше, коли додасте більше сайтів, операторів або routing-потреб.",
    "Сайт означає окремий вебресурс із власною установкою віджета і своїми налаштуваннями. Multi-brand або client-install зазвичай рахуються окремо.",
    "Так. AI-асистент і shared inbox є в кожному плані. Вищі плани додають більше операторів, розширені chat-flow, інтеграції та звітність.",
    "Так. У річному режимі ми показуємо повну суму за рік напряму, без додаткової маркетингової математики."
  ];
  document.querySelectorAll(".pricing-faq .faq-trigger span:first-child").forEach((node, index) => {
    if (pricingFaqQuestions[index]) node.textContent = pricingFaqQuestions[index];
  });
  document.querySelectorAll(".pricing-faq .faq-content").forEach((node, index) => {
    if (pricingFaqAnswers[index]) node.textContent = pricingFaqAnswers[index];
  });
}

function localizeSecurityPage() {
  if ((document.body.dataset.page || "") !== "security") return;
  if (getLocale() !== "ua") return;

  const title = document.querySelector("title");
  const meta = document.querySelector('meta[name="description"]');
  if (title) title.textContent = "Безпека і надійність | portalaichat.com";
  if (meta) meta.setAttribute("content", "Дізнайтесь про підхід portalaichat.com до приватності, розділення workspace, доступів, uptime, бекапів і журналювання.");
  document.documentElement.lang = "uk";

  const replacements = [
    [".page-hero .eyebrow", "Безпека і надійність"],
    [".page-title", `Підхід до довіри, створений для <span class="accent-text">даних клієнтських розмов</span>.`],
    [".page-copy", "portalaichat.com спроєктований так, щоб дані чату були розділені по workspace, доступні правильним людям і достатньо надійні для команд, що живуть швидкою відповіддю."],
    [".page-summary strong", "Приватність за замовчуванням"],
    [".page-summary span", "Ми будуємо продукт так, щоб доступ, видимість і розділення сайтів залишалися контрольованими."]
  ];
  replacements.forEach(([selector, html]) => {
    const node = document.querySelector(selector);
    if (node) node.innerHTML = html;
  });

  const securityCards = [
    ["Приватність за замовчуванням", "portalaichat.com підходить командам, яким потрібен зрозумілий контроль над доступом до розмов, видимістю операторів і ownership на рівні workspace."],
    ["Розділення workspace і сайтів", "Дані організовані по workspace і сайтах, щоб агенції та multi-brand бізнеси могли тримати клієнтські або бренд-дані окремо."],
    ["Контроль доступу", "Патерни role-based access допомагають обмежити, хто може дивитися, керувати або експортувати розмови всередині workspace."],
    ["Надійність продукту", "Система зібрана так, щоб підтримувати стабільне покриття website-chat з premium uptime-підходом і передбачуваною видимістю для операторів."],
    ["Бекапи та історія", "Історія розмов, summary і службові записи зберігаються так, щоб команда могла швидко відновити контекст і перевірити, що сталося."],
    ["Логи й audit-style видимість", "Дії в inbox, зміни маршрутизації та операторські workflow достатньо прозорі для внутрішньої відповідальності й review."]
  ];
  document.querySelectorAll(".security-card").forEach((card, index) => {
    const heading = card.querySelector("h3");
    const copy = card.querySelector("p");
    if (securityCards[index]?.[0] && heading) heading.textContent = securityCards[index][0];
    if (securityCards[index]?.[1] && copy) copy.textContent = securityCards[index][1];
  });

  const trustReplacements = [
    [".section.bleed .eyebrow", "Операційна довіра"],
    [".section.bleed .section-title", "Для команд, яким потрібна впевненість до запуску."],
    [".cta-panel .eyebrow", "Поговорімо"],
    [".cta-panel .section-title", "Потрібна глибша розмова про довіру?"],
    [".cta-panel .section-copy", "Якщо вашій команді потрібно обговорити патерни доступу, розділення workspace, rollout-ризики або integration controls, ми пройдемо це разом наживо."]
  ];
  trustReplacements.forEach(([selector, html]) => {
    const node = document.querySelector(selector);
    if (node) node.innerHTML = html;
  });
  const trustCards = document.querySelectorAll(".section.bleed .stack-card");
  if (trustCards[0]) trustCards[0].innerHTML = "<strong>Чіткі межі даних</strong><p>Корисно для агенцій, multi-brand груп і команд, що ведуть окремі портфелі сайтів.</p>";
  if (trustCards[1]) trustCards[1].innerHTML = "<strong>Людський контроль</strong><p>AI працює разом із handoff до оператора і командними workflow, а не як непрозора чорна скринька.</p>";
  if (trustCards[2]) trustCards[2].innerHTML = "<strong>Готовність до review</strong><p>Достатньо структури, щоб обговорити права, експорт, дизайн workspace і операційні очікування ще на onboarding.</p>";
  const securityButtons = document.querySelectorAll(".cta-panel .btn");
  if (securityButtons[0]) securityButtons[0].textContent = "Поговорити з sales";
  if (securityButtons[1]) securityButtons[1].textContent = "Подивитися продукт";
}

function localizeContactPage() {
  if ((document.body.dataset.page || "") !== "contact") return;
  if (getLocale() !== "ua") return;

  const title = document.querySelector("title");
  const meta = document.querySelector('meta[name="description"]');
  if (title) title.textContent = "Замовити демо | portalaichat.com";
  if (meta) meta.setAttribute("content", "Замовте демо portalaichat.com і подивіться, як AI-чат, handoff, inbox та multi-site workspace працюють для вашого бізнесу.");
  document.documentElement.lang = "uk";

  const replacements = [
    [".page-hero .eyebrow", "Замовити демо"],
    [".page-title", `Подивіться, як portalaichat.com вписується у <span class="accent-text">ваш сайт, команду і lead flow</span>.`],
    [".page-copy", "Замовте walkthrough, і ми покажемо продукт на реальному кейсі: AI-привітання, кваліфікація, handoff, inbox-робота, звіти та структура workspace."],
    [".page-summary strong", "Що буде далі"],
    [".page-summary span", "Ми дивимось на тип вашого сайту, response-flow і цілі, а потім показуємо релевантний сценарій замість загальної презентації."],
    [".contact-grid .contact-panel .eyebrow", "Навіщо команди бронюють демо"],
    [".contact-grid .contact-panel .section-title", "Коротке демо з корисними відповідями."]
  ];
  replacements.forEach(([selector, html]) => {
    const node = document.querySelector(selector);
    if (node) node.innerHTML = html;
  });
  document.querySelectorAll(".field label")[0].textContent = "Повне ім’я";
  document.querySelectorAll(".field label")[1].textContent = "Робочий email";
  document.querySelectorAll(".field label")[2].textContent = "Компанія";
  document.querySelectorAll(".field label")[3].textContent = "Скільки сайтів?";
  document.querySelectorAll(".field label")[4].textContent = "Ніша";
  document.querySelectorAll(".field label")[5].textContent = "На чому сфокусуватись у демо?";
  const successState = document.querySelector("[data-success-state]");
  if (successState) successState.textContent = "Ваш запит на демо отримано. Незабаром ми напишемо з наступними кроками та варіантами часу.";
  const submitBtn = document.querySelector("[data-demo-form] .btn-primary");
  if (submitBtn) submitBtn.textContent = "Надіслати запит на демо";
  const sideCards = document.querySelectorAll(".contact-grid .contact-panel .stack-card");
  if (sideCards[0]) sideCards[0].innerHTML = "<strong>Побачите inbox наживо</strong><p>Зрозумієте, як AI і оператори працюють разом без повторення контексту.</p>";
  if (sideCards[1]) sideCards[1].innerHTML = "<strong>Розкладемо ваш use case</strong><p>Ми підлаштуємо walkthrough під нерухомість, ecommerce, сервіс, агенцію або B2B-команду.</p>";
  if (sideCards[2]) sideCards[2].innerHTML = "<strong>Обговоримо setup і rollout</strong><p>Покажемо встановлення віджета, automations, workspace і що команда має підтримувати далі.</p>";
  const miniMeta = document.querySelectorAll(".mini-meta span");
  if (miniMeta[0]) miniMeta[0].textContent = "Зазвичай 25-30 хвилин";
  if (miniMeta[1]) miniMeta[1].textContent = "Без шаблонної sales-презентації";
  const placeholders = [
    "Ірина Коваль",
    "iryna@company.com",
    "Oakstone Realty",
    "Приклад: нам треба швидша перша відповідь на сторінках з цінами, плюс чистий handoff від AI до sales-команди."
  ];
  const nameInput = document.querySelector("#name");
  const emailInput = document.querySelector("#email");
  const companyInput = document.querySelector("#company");
  const detailsInput = document.querySelector("#details");
  if (nameInput) nameInput.placeholder = placeholders[0];
  if (emailInput) emailInput.placeholder = placeholders[1];
  if (companyInput) companyInput.placeholder = placeholders[2];
  if (detailsInput) detailsInput.placeholder = placeholders[3];
  const industryOptions = ["Нерухомість", "Ecommerce", "Локальні сервіси", "Агенція", "Виробництво / B2B", "Інше"];
  document.querySelectorAll("#industry option").forEach((option, index) => {
    if (industryOptions[index]) option.textContent = industryOptions[index];
  });
  const afterSubmitEyebrow = document.querySelector(".section.bleed .eyebrow");
  if (afterSubmitEyebrow) afterSubmitEyebrow.textContent = "Після відправки";
  const afterSubmitCards = document.querySelectorAll(".section.bleed .stack-card");
  if (afterSubmitCards[0]) afterSubmitCards[0].innerHTML = "<strong>1. Ми переглядаємо запит</strong><p>Дивимось на тип бізнесу, кількість сайтів і workflow, який ви хочете покращити.</p>";
  if (afterSubmitCards[1]) afterSubmitCards[1].innerHTML = "<strong>2. Готуємо walkthrough</strong><p>Демо фокусується на вашій ніші, операторському flow і найімовірнішому rollout-сценарії.</p>";
  if (afterSubmitCards[2]) afterSubmitCards[2].innerHTML = "<strong>3. Надсилаємо наступний крок</strong><p>Ви отримуєте відповідь від людини з варіантами часу та, якщо треба, короткими уточненнями.</p>";
  const contactFaqQuestions = [
    "Чи потрібно щось готувати до демо?",
    "Чи покажете також setup-деталі?"
  ];
  const contactFaqAnswers = [
    "Майже нічого. Якщо ви вже знаєте кількість сайтів, тип бізнесу і де зараз застрягають ліди, цього достатньо для корисної сесії.",
    "Так. Ми можемо показати встановлення, структуру workspace, конфігурацію AI і те, як оператори працюють з inbox."
  ];
  document.querySelectorAll(".faq-grid .faq-trigger span:first-child").forEach((node, index) => {
    if (contactFaqQuestions[index]) node.textContent = contactFaqQuestions[index];
  });
  document.querySelectorAll(".faq-grid .faq-content").forEach((node, index) => {
    if (contactFaqAnswers[index]) node.textContent = contactFaqAnswers[index];
  });
}

function localizeProductPage() {
  if ((document.body.dataset.page || "") !== "product") return;
  if (getLocale() !== "ua") return;

  const title = document.querySelector("title");
  const meta = document.querySelector('meta[name="description"]');
  if (title) title.textContent = "Огляд продукту | portalaichat.com";
  if (meta) meta.setAttribute("content", "Подивіться огляд продукту portalaichat.com: inbox, контакт, аналітика, стани віджета, handoff і mobile preview.");
  document.documentElement.lang = "uk";

  const replacements = [
    [".page-hero .eyebrow", "Огляд продукту"],
    [".page-title", `Подивіться на продукт очима оператора: <span class="accent-text">чітко, швидко і з контекстом</span>.`],
    [".page-copy", "Ця сторінка проводить через основні поверхні portalaichat.com: inbox, lead profile, звіти, стани віджета, AI-відповіді та human takeover."],
    [".page-summary strong", "Створено для дії"],
    [".page-summary span", "Кожен екран допомагає команді швидше відповісти, маршрутизувати або зрозуміти, що працює."]
  ];
  replacements.forEach(([selector, html]) => {
    const node = document.querySelector(selector);
    if (node) node.innerHTML = html;
  });

  const tourCards = [
    ["Inbox", "Спільний inbox дає операторам зрозуміле ownership, свіжий контекст повідомлень, причину handoff і сигнали терміновості без п’яти відкритих інструментів."],
    ["Перегляд контакту", "Відкрийте профіль ліда і одразу побачите джерело, summary, теги, нотатки, попередні повідомлення і те, що вже кваліфікував AI."],
    ["Картки аналітики", "Бачте обсяг лідів, AI coverage, швидкість відповіді і тренди конверсії, не виходячи з workspace."],
    ["Стани chat-віджета", "Переглядайте greeting, AI reply, waiting-state і handoff-state у віджеті, який виглядає premium прямо на сайті."],
    ["Приклад handoff", "Коли AI бачить дорогий або важливий момент, оператор отримує summary замість порожнього вікна розмови."],
    ["Стан відповіді оператора", "Оператор може природно продовжити діалог, додати нотатки й зберегти весь thread в одній спільній timeline."],
    ["Стан AI-відповіді", "Залишайте low-friction питання на AI, зберігаючи корисний контекст для подальшого handoff."],
    ["Mobile preview", "Віджет на малих екранах залишається зібраним і продуманим, а не стискається в незручний afterthought."]
  ];
  document.querySelectorAll(".tour-card").forEach((card, index) => {
    const heading = card.querySelector("h3");
    const copy = card.querySelector("p");
    if (tourCards[index]?.[0] && heading) heading.textContent = tourCards[index][0];
    if (tourCards[index]?.[1] && copy) copy.textContent = tourCards[index][1];
  });

  const boardTitle = document.querySelector(".board-title");
  const boardSub = document.querySelector(".inbox-board .board-sub");
  const panelPill = document.querySelector(".panel-pill");
  if (boardTitle) boardTitle.textContent = "Черга на сьогодні";
  if (boardSub) boardSub.textContent = "11 відкритих розмов";
  if (panelPill) panelPill.textContent = "3 пріоритетні";
  const mailItems = document.querySelectorAll(".mail-item");
  if (mailItems[0]) mailItems[0].innerHTML = "<strong>Лід Oakstone</strong><div class=\"board-sub\">Запит на перегляд · передано від AI</div>";
  if (mailItems[1]) mailItems[1].innerHTML = "<strong>Допомога з checkout у LumaShop</strong><div class=\"board-sub\">Питання по доставці · оператор опціонально</div>";
  if (mailItems[2]) mailItems[2].innerHTML = "<strong>Westline quote request</strong><div class=\"board-sub\">Технічний бриф прикріплено</div>";
  const detailItems = document.querySelectorAll(".detail-item");
  if (detailItems[0]) detailItems[0].innerHTML = "<strong>Summary</strong><div class=\"board-sub\">Потрібно 5 000 брендованих коробок, dieline готовий, ціна потрібна цього тижня.</div>";
  if (detailItems[1]) detailItems[1].innerHTML = "<strong>Джерело</strong><div class=\"board-sub\">Westline workspace · сторінка запиту ціни</div>";
  const miniStatLabels = document.querySelectorAll(".mini-stat-label");
  const miniStatNotes = document.querySelectorAll(".mini-stat-note");
  if (miniStatLabels[0]) miniStatLabels[0].textContent = "Захоплення лідів";
  if (miniStatLabels[1]) miniStatLabels[1].textContent = "Медіанна відповідь оператора";
  if (miniStatNotes[0]) miniStatNotes[0].textContent = "зросло на 5.2 пт";
  if (miniStatNotes[1]) miniStatNotes[1].textContent = "швидше на 42%";
  const widgetText = document.querySelectorAll(".widget-card .chat-name, .mobile-widget .chat-name");
  const widgetStatus = document.querySelectorAll(".widget-card .chat-status, .mobile-widget .chat-status");
  if (widgetText[0]) widgetText[0].textContent = "Sales assistant";
  if (widgetText[1]) widgetText[1].textContent = "Mobile widget";
  if (widgetStatus[0]) widgetStatus[0].textContent = "Готовий допомогти";
  if (widgetStatus[1]) widgetStatus[1].textContent = "Компактно, не тісно";
  const productBubbles = document.querySelectorAll(".tour-card .bubble");
  if (productBubbles[0]) productBubbles[0].textContent = "Я можу порівняти плани, допомогти з multi-site pricing або передати вас у sales.";
  if (productBubbles[1]) productBubbles[1].textContent = "Чи підтримуєте ви 8 клієнтських сайтів?";
  if (productBubbles[2]) productBubbles[2].textContent = "Я вже покликала Юлію з sales, щоб вам не довелося нічого повторювати.";
  if (productBubbles[3]) productBubbles[3].textContent = "Чудово.";
  if (productBubbles[4]) productBubbles[4].textContent = "Привіт, я можу пояснити setup workspace для agency-клієнтів і відповісти на питання по rollout.";
  if (productBubbles[5]) productBubbles[5].textContent = "Так. Кожен workspace може мати окремих операторів, брендинг і AI-інструкції.";
  if (productBubbles[6]) productBubbles[6].textContent = "Якщо хочете, я коротко підкажу, який план підійде найкраще, перш ніж покликати людину.";
  if (productBubbles[7]) productBubbles[7].textContent = "Хочете швидку відповідь перед виходом? Я допоможу менш ніж за хвилину.";
  const operatorSteps = document.querySelectorAll(".operator-step");
  if (operatorSteps[0]) operatorSteps[0].innerHTML = "<strong>Нотатка AI</strong><div class=\"board-sub\">Відвідувач питає про запуск агенції на 8 клієнтських сайтах. Бюджет, ймовірно, вище за Growth.</div>";
  if (operatorSteps[1]) operatorSteps[1].innerHTML = "<strong>Причина handoff</strong><div class=\"board-sub\">Комерційна оцінка + multi-workspace fit + запит покупця на людину.</div>";
  if (operatorSteps[2]) operatorSteps[2].innerHTML = "<strong>Вхід оператора</strong><div class=\"board-sub\">Sales підключається вже з контекстом цін, кількості сайтів і попередніх питань.</div>";
}

function localizeIndustriesPage() {
  if ((document.body.dataset.page || "") !== "industries") return;

  const locale = getLocale();
  const title = document.querySelector("title");
  const meta = document.querySelector('meta[name="description"]');

  const industriesContent = {
    en: {
      title: "Industries | portalaichat.com",
      description: "See how portalaichat.com works for real estate, ecommerce, local services, agencies, and manufacturing teams.",
      eyebrow: "Industries",
      heading: `One chat system, tuned for <span class="accent-text">how people actually buy</span> in your category.`,
      copy: "portalaichat.com works especially well in businesses where fast answers, qualified intent, and smooth handoff shape whether a visitor becomes a lead.",
      summaryTitle: "Common thread",
      summaryCopy: "Each use case balances AI speed with human takeover at the right moment.",
      tabs: ["Real estate", "Ecommerce", "Local services", "Agencies", "Manufacturing / B2B"],
      panes: [
        {
          title: "Real estate",
          intro: "Property shoppers ask practical questions late, compare quickly, and often need a clear next action. portalaichat.com qualifies interest before an agent joins.",
          cards: [
            ["Typical questions", "Price, availability, parking, neighborhood, financing, and viewing times."],
            ["AI handles", "Property fit, budget filtering, scheduling intent, FAQ, and initial lead capture."],
            ["Operator handles", "Final slot confirmation, negotiation, and sensitive case-specific questions."],
            ["Outcome", "More booked viewings and fewer overnight leads going cold."]
          ],
          mockTitle: "Real estate conversation",
          mockLines: [
            "Are you looking for a home to live in or an investment property?",
            "Primary home. Budget under $650k.",
            "I found three 2-bedroom listings that match that range. Want to book an evening viewing?"
          ]
        },
        {
          title: "Ecommerce",
          intro: "Buyers hesitate over fit, delivery, and return details. portalaichat.com keeps those objections from turning into abandoned carts.",
          cards: [
            ["Typical questions", "Stock, delivery speed, returns, bundle discounts, sizing, and compatibility."],
            ["AI handles", "Catalog navigation, policy questions, recommendations, and discount logic explanation."],
            ["Operator handles", "Order exceptions, large-value carts, and sensitive service recovery."],
            ["Outcome", "Fewer abandoned high-intent sessions and clearer pre-purchase support."]
          ],
          mockTitle: "Ecommerce chat",
          mockLines: [
            "Need help before checkout? I can confirm shipping timing and size availability.",
            "If I buy 4, is there a discount?",
            "Yes. Orders of 3+ get 10% off, and orders of 5+ get 15% off with free shipping."
          ]
        },
        {
          title: "Local services",
          intro: "Service businesses win when they respond first and ask the right intake questions. portalaichat.com qualifies jobs while the visitor is still ready to book.",
          cards: [
            ["Typical questions", "Availability, service area, price range, urgency, and next available appointment."],
            ["AI handles", "Job intake, service-area filtering, rough estimate guidance, and callback collection."],
            ["Operator handles", "Scheduling confirmation, custom scope, and final quote details."],
            ["Outcome", "More booked jobs and cleaner intake for technicians or coordinators."]
          ],
          mockTitle: "Service business chat",
          mockLines: [
            "Tell me a bit about the issue and your ZIP code. I can confirm if you’re in our service area.",
            "Need AC installation in Brooklyn.",
            "You’re covered. Typical installs start at $2,800. Want the first available appointment this week?"
          ]
        },
        {
          title: "Agencies",
          intro: "Agencies need consistent setup and clean separation across client sites. portalaichat.com gives each client its own AI behavior, inbox, and reports.",
          cards: [
            ["Typical questions", "Can we manage multiple brands, separate data, and still keep one admin view?"],
            ["AI handles", "Site-specific chat flows and knowledge for each client property."],
            ["Operator handles", "Escalations and client-specific service-level response commitments."],
            ["Outcome", "A repeatable operating model for client-side conversational conversion."]
          ],
          mockTitle: "Agency workspace overview",
          mockLines: [
            "Client workspaces",
            "Northvale Realty, LumaShop, FieldHouse Services, and Westline Manufacturing all stay separated while the agency keeps owner-level visibility."
          ]
        },
        {
          title: "Manufacturing / B2B",
          intro: "Serious inquiries often need spec collection before sales can respond well. portalaichat.com captures technical details and buying intent before handoff.",
          cards: [
            ["Typical questions", "Minimum order quantity, materials, lead time, tolerances, packaging, and quote timing."],
            ["AI handles", "Technical intake, fit questions, document collection, and initial qualification."],
            ["Operator handles", "Complex quote work, negotiation, and commercial specifics."],
            ["Outcome", "Sales receives richer inbound opportunities instead of vague form fills."]
          ],
          mockTitle: "B2B qualification",
          mockLines: [
            "What are you producing, what volume do you need, and do you already have a technical brief?",
            "Branded cartons, 5,000 units, dieline ready.",
            "Great. I’ve tagged this as quote-ready and can bring in a sales operator with the details."
          ]
        }
      ]
    },
    ua: {
      title: "Галузі | portalaichat.com",
      description: "Дивіться, як portalaichat.com працює для нерухомості, ecommerce, локального сервісу, агенцій і B2B / виробництва.",
      eyebrow: "Галузі",
      heading: `Одна chat-система, налаштована під <span class="accent-text">реальну поведінку покупця</span> у вашій ніші.`,
      copy: "portalaichat.com найкраще працює там, де швидка відповідь, кваліфікація ліда і плавна передача оператору вирішують, чи стане відвідувач клієнтом.",
      summaryTitle: "Спільний принцип",
      summaryCopy: "У кожному кейсі AI дає швидкість, а людина підхоплює розмову в правильний момент.",
      tabs: ["Нерухомість", "Ecommerce", "Локальні сервіси", "Агенції", "Виробництво / B2B"],
      panes: [
        {
          title: "Нерухомість",
          intro: "Покупці нерухомості часто пишуть пізно, швидко порівнюють варіанти й очікують чіткий наступний крок. portalaichat.com кваліфікує інтерес ще до підключення агента.",
          cards: [
            ["Типові питання", "Ціна, наявність, паркінг, район, фінансування та час перегляду."],
            ["Що бере на себе AI", "Підбір об'єкта, фільтрацію за бюджетом, первинну кваліфікацію й збір контакту."],
            ["Що робить оператор", "Фінальне підтвердження слоту, переговори та чутливі індивідуальні питання."],
            ["Результат", "Більше записів на перегляд і менше нічних лідів, що холонуть до ранку."]
          ],
          mockTitle: "Розмова · нерухомість",
          mockLines: [
            "Ви шукаєте житло для себе чи інвестиційний об'єкт?",
            "Для себе. Бюджет до $650k.",
            "Є три 2-кімнатні варіанти в цьому діапазоні. Записати вас на вечірній перегляд?"
          ]
        },
        {
          title: "Ecommerce",
          intro: "Покупці вагаються через сумісність, доставку і повернення. portalaichat.com знімає ці заперечення до того, як вони перетворяться на покинутий кошик.",
          cards: [
            ["Типові питання", "Наявність, доставка, повернення, знижки за набір, розміри та сумісність."],
            ["Що бере на себе AI", "Навігацію по каталогу, пояснення політик, рекомендації й відповіді на типові заперечення."],
            ["Що робить оператор", "Винятки по замовленнях, великі чеки й чутливі кейси по сервісу."],
            ["Результат", "Менше покинутих високонамірених сесій і краща підтримка до покупки."]
          ],
          mockTitle: "Розмова · ecommerce",
          mockLines: [
            "Потрібна допомога перед checkout? Я можу підтвердити строки доставки й наявність розміру.",
            "Якщо я беру 4 штуки, буде знижка?",
            "Так. Від 3 одиниць діє -10%, від 5 — -15% і безкоштовна доставка."
          ]
        },
        {
          title: "Сервісний та локальний бізнес",
          intro: "Сервісні компанії виграють тоді, коли відповідають першими і ставлять правильні intake-питання. portalaichat.com кваліфікує запит, поки клієнт ще готовий записатися.",
          cards: [
            ["Типові питання", "Наявність, зона обслуговування, діапазон ціни, терміновість і найближчий слот."],
            ["Що бере на себе AI", "Первинний intake, перевірку зони, попередню оцінку та збір номера для callback."],
            ["Що робить оператор", "Підтвердження запису, нестандартний scope і фінальні деталі кошторису."],
            ["Результат", "Більше записів і чистіші заявки для менеджера чи майстра."]
          ],
          mockTitle: "Розмова · сервіс",
          mockLines: [
            "Привіт! Розкажіть про ваше завдання — я допоможу оцінити вартість і строки.",
            "Потрібно встановити кондиціонер у 2-кімнатній квартирі.",
            "Орієнтовно 2 800–3 500 грн залежно від типу. Залиште номер — майстер зателефонує для уточнення?"
          ]
        },
        {
          title: "Агенції",
          intro: "Агенціям потрібен стандартизований запуск і чисте розділення між клієнтськими сайтами. portalaichat.com дає кожному клієнту власний AI, inbox і звіти.",
          cards: [
            ["Типові питання", "Чи можна вести багато брендів, розділити дані й залишити єдиний admin-view?"],
            ["Що бере на себе AI", "Окремі чат-флоу й knowledge-base логіку для кожного клієнтського сайту."],
            ["Що робить оператор", "Ескалації та клієнтські SLA-сценарії відповіді."],
            ["Результат", "Повторювана операційна модель для клієнтського conversational conversion."]
          ],
          mockTitle: "Огляд workspace агенції",
          mockLines: [
            "Клієнтські workspaces",
            "Northvale Realty, LumaShop, FieldHouse Services та Westline Manufacturing повністю розділені, але агенція зберігає owner-level visibility."
          ]
        },
        {
          title: "Виробництво / B2B",
          intro: "Серйозні B2B-запити часто потребують збору специфікації ще до відповіді sales. portalaichat.com збирає технічні деталі та buying intent до handoff.",
          cards: [
            ["Типові питання", "Мінімальний тираж, матеріали, lead time, допуски, пакування та строки прорахунку."],
            ["Що бере на себе AI", "Технічний intake, fit-питання, збір документів і первинну кваліфікацію."],
            ["Що робить оператор", "Складні комерційні прорахунки, переговори та специфіку угоди."],
            ["Результат", "Sales отримує змістовніші inbound-запити замість розмитих форм."]
          ],
          mockTitle: "B2B-кваліфікація",
          mockLines: [
            "Що саме виготовляємо, який потрібен обсяг і чи є у вас технічне завдання?",
            "Потрібні брендовані коробки, 5 000 штук, dieline готовий.",
            "Чудово. Я позначив це як quote-ready і можу передати діалог sales-оператору разом із деталями."
          ]
        }
      ]
    }
  };

  const copy = industriesContent[locale];
  if (!copy) return;

  if (title) title.textContent = copy.title;
  if (meta) meta.setAttribute("content", copy.description);

  const heroEyebrow = document.querySelector(".page-hero .eyebrow");
  const heroHeading = document.querySelector(".page-hero .page-title");
  const heroCopy = document.querySelector(".page-hero .page-copy");
  const summaryStrong = document.querySelector(".page-summary strong");
  const summarySpan = document.querySelector(".page-summary span");
  if (heroEyebrow) heroEyebrow.textContent = copy.eyebrow;
  if (heroHeading) heroHeading.innerHTML = copy.heading;
  if (heroCopy) heroCopy.textContent = copy.copy;
  if (summaryStrong) summaryStrong.textContent = copy.summaryTitle;
  if (summarySpan) summarySpan.textContent = copy.summaryCopy;

  document.querySelectorAll(".industry-tab").forEach((tab, index) => {
    if (copy.tabs[index]) tab.textContent = copy.tabs[index];
  });

  const panes = document.querySelectorAll(".industry-pane");
  panes.forEach((pane, index) => {
    const paneCopy = copy.panes[index];
    if (!paneCopy) return;

    const titleNode = pane.querySelector(".industry-card h3");
    const introNode = pane.querySelector(".industry-card > p");
    if (titleNode) titleNode.textContent = paneCopy.title;
    if (introNode) introNode.textContent = paneCopy.intro;

    const cardStrong = pane.querySelectorAll(".stack-card strong");
    const cardText = pane.querySelectorAll(".stack-card p");
    paneCopy.cards.forEach((card, cardIndex) => {
      if (cardStrong[cardIndex]) cardStrong[cardIndex].textContent = card[0];
      if (cardText[cardIndex]) cardText[cardIndex].textContent = card[1];
    });

    const mockUrl = pane.querySelector(".mock-url");
    if (mockUrl) mockUrl.textContent = paneCopy.mockTitle;

    const bubbles = pane.querySelectorAll(".bubble");
    const miniTitle = pane.querySelector(".mini-panel .board-title");
    const miniText = pane.querySelector(".mini-panel .board-sub");

    if (bubbles.length) {
      paneCopy.mockLines.forEach((line, lineIndex) => {
        if (bubbles[lineIndex]) bubbles[lineIndex].textContent = line;
      });
    } else {
      if (miniTitle && paneCopy.mockLines[0]) miniTitle.textContent = paneCopy.mockLines[0];
      if (miniText && paneCopy.mockLines[1]) miniText.textContent = paneCopy.mockLines[1];
    }
  });
}


// ═══════════════════════════════════════════════
// INTERACTIVE JS (from Downloads/index.html)
// ═══════════════════════════════════════════════

// ─── REVEAL ON SCROLL ───
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  items.forEach(item => observer.observe(item));
}

// ─── TABS (inline onclick handlers) ───
window.switchTab = function(id, btn) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  const panel = document.getElementById("tab-" + id);
  if (panel) panel.classList.add("active");
};

// ─── INDUSTRY TABS (inline onclick handlers) ───
window.switchIndustry = function(id, btn) {
  document.querySelectorAll(".ind-tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".industry-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  const panel = document.getElementById("ind-" + id);
  if (panel) panel.classList.add("active");
};

// ─── FAQ TOGGLE (inline onclick handlers) ───
window.toggleFaq = function(btn) {
  const item = btn.closest(".faq-item");
  const isOpen = item.classList.contains("open");
  document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));
  if (!isOpen) item.classList.add("open");
};

// ─── STICKY SCROLL STORY ───
function initStory() {
  const section   = document.querySelector(".sticky-section");
  if (!section) return;
  const stepItems = Array.from(section.querySelectorAll(".step-item"));
  const chatBox   = document.getElementById("chat-messages");
  if (!chatBox) return;

  const STEPS    = 4;
  const DURATION = 4000;
  let current    = -1;
  let msgTimers  = [];
  let autoTimer  = null;
  let activeBar  = null;

  const stepMsgs = [
    [
      { role:"ai", text:"👋 Hi! I'm portalaichat.com AI. Ask me anything about printing, pricing, or delivery." }
    ],
    [
      { role:"ai", text:"👋 Hi! I'm portalaichat.com AI. Ask me anything about printing, pricing, or delivery." },
      { role:"ai", text:"I noticed you're on our Bulk Orders page. Need a quote?" }
    ],
    [
      { role:"ai",   text:"👋 Hi! I'm portalaichat.com AI. Ask me anything about printing, pricing, or delivery." },
      { role:"ai",   text:"I noticed you're on our Bulk Orders page. Need a quote?" },
      { role:"user", text:"What's the minimum order quantity?" },
      { role:"ai",   text:"Minimum order is 50 units. Free shipping from 100 units. Production time 5 business days." }
    ],
    [
      { role:"ai",   text:"👋 Hi! I'm portalaichat.com AI. Ask me anything about printing, pricing, or delivery." },
      { role:"ai",   text:"I noticed you're on our Bulk Orders page. Need a quote?" },
      { role:"user", text:"What's the minimum order quantity?" },
      { role:"ai",   text:"Minimum order is 50 units. Free shipping from 100 units. Production time 5 business days." },
      { role:"ai",   text:"Want me to send you a detailed quote? Leave your email:" },
      { role:"card" }
    ]
  ];

  function clearTimers() {
    msgTimers.forEach(clearTimeout); msgTimers = [];
    clearTimeout(autoTimer);
    if (activeBar) { activeBar.style.transition = "none"; activeBar.style.width = "0%"; }
  }

  function makeTyping() {
    const row = document.createElement("div");
    row.className = "chat-typing";
    const av = document.createElement("div");
    av.className = "chat-msg-av"; av.textContent = "AI";
    const dots = document.createElement("div");
    dots.className = "chat-typing-dots";
    dots.innerHTML = '<div class="chat-typing-dot"></div><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div>';
    row.appendChild(av); row.appendChild(dots);
    return row;
  }

  function makeMsg(msg) {
    if (msg.role === "card") {
      const c = document.createElement("div");
      c.className = "chat-contact-card";
      c.innerHTML = `<div class="chat-contact-card-title">📋 Leave your details for a quote</div>
        <div class="chat-contact-field">Email address</div>
        <div class="chat-contact-submit">Send quote →</div>`;
      return c;
    }
    const row = document.createElement("div");
    row.className = "chat-msg" + (msg.role === "user" ? " user" : "");
    const av = document.createElement("div");
    av.className = "chat-msg-av" + (msg.role === "user" ? " user" : "");
    av.textContent = msg.role === "user" ? "👤" : "AI";
    const b = document.createElement("div");
    b.className = "chat-msg-bubble"; b.textContent = msg.text;
    row.appendChild(av); row.appendChild(b);
    return row;
  }

  function animateIn(msgs, from) {
    if (from >= msgs.length) return;
    const msg = msgs[from];
    const isAI = msg.role === "ai" || msg.role === "card";
    const delay = from === 0 ? 700 : 350;

    if (isAI) {
      const t = setTimeout(() => {
        const typing = makeTyping();
        chatBox.appendChild(typing);
        const t2 = setTimeout(() => {
          typing.remove();
          chatBox.appendChild(makeMsg(msg));
          const t3 = setTimeout(() => animateIn(msgs, from + 1), 300);
          msgTimers.push(t3);
        }, 700);
        msgTimers.push(t2);
      }, delay);
      msgTimers.push(t);
    } else {
      const t = setTimeout(() => {
        chatBox.appendChild(makeMsg(msg));
        const t2 = setTimeout(() => animateIn(msgs, from + 1), 300);
        msgTimers.push(t2);
      }, delay);
      msgTimers.push(t);
    }
  }

  function startBar(bar) {
    activeBar = bar;
    bar.style.transition = "none"; bar.style.width = "0%";
    bar.getBoundingClientRect();
    bar.style.transition = "width " + DURATION + "ms linear";
    bar.style.width = "100%";
  }

  function goToStep(idx, animate) {
    if (idx === current) return;
    clearTimers();
    const prev = current;
    current = idx;

    stepItems.forEach((s, i) => {
      s.classList.toggle("active", i === idx);
      s.classList.toggle("done",   i < idx);
      const bar = s.querySelector(".step-progress-bar");
      if (bar) { bar.style.transition = "none"; bar.style.width = i < idx ? "100%" : "0%"; }
    });

    const bar = stepItems[idx] && stepItems[idx].querySelector(".step-progress-bar");
    if (bar) requestAnimationFrame(() => startBar(bar));

    const msgs = stepMsgs[idx] || [];
    if (animate && idx > prev && prev >= 0) {
      const prevMsgs = stepMsgs[prev] || [];
      chatBox.querySelectorAll(".chat-typing").forEach(e => e.remove());
      while (chatBox.children.length < prevMsgs.length) {
        chatBox.appendChild(makeMsg(prevMsgs[chatBox.children.length]));
      }
      animateIn(msgs, prevMsgs.length);
    } else {
      chatBox.innerHTML = "";
      if (animate) { animateIn(msgs, 0); }
      else { msgs.forEach(m => chatBox.appendChild(makeMsg(m))); }
    }

    autoTimer = setTimeout(() => goToStep((idx + 1) % STEPS, true), DURATION);
  }

  stepItems.forEach((s, i) => s.addEventListener("click", () => goToStep(i, true)));
  goToStep(0, true);
}

// ─── DATA-BASED TAB GROUPS ───
function initTabs() {
  const groups = document.querySelectorAll("[data-tab-group]");
  groups.forEach(group => {
    const buttons = group.querySelectorAll("[data-tab-target]");
    const panels  = group.querySelectorAll("[data-tab-panel]");
    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const target = button.dataset.tabTarget;
        buttons.forEach(item => item.classList.toggle("active", item === button));
        panels.forEach(panel => panel.classList.toggle("active", panel.dataset.tabPanel === target));
      });
    });
  });
}

// ─── DATA-BASED INDUSTRY GROUPS ───
function initIndustryTabs() {
  const groups = document.querySelectorAll("[data-industry-group]");
  groups.forEach(group => {
    const buttons = group.querySelectorAll("[data-industry-target]");
    const panels  = group.querySelectorAll("[data-industry-panel]");
    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const target = button.dataset.industryTarget;
        buttons.forEach(item => item.classList.toggle("active", item === button));
        panels.forEach(panel => panel.classList.toggle("active", panel.dataset.industryPanel === target));
      });
    });
  });
}

// ─── ACCORDIONS (inner pages: .faq-trigger / .faq-content) ───
function initAccordions() {
  document.querySelectorAll("[data-accordion] .faq-item").forEach(item => {
    const trigger = item.querySelector(".faq-trigger");
    trigger?.addEventListener("click", () => {
      const open = item.classList.contains("open");
      item.parentElement?.querySelectorAll(".faq-item").forEach(peer => peer.classList.remove("open"));
      if (!open) item.classList.add("open");
    });
  });
}

// ─── PRICING TOGGLE (inner pages) ───
function initPricingToggle() {
  const buttons = document.querySelectorAll("[data-billing]");
  if (!buttons.length) return;
  const amounts = document.querySelectorAll("[data-price]");
  const notes = document.querySelectorAll("[data-note]");
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.dataset.billing;
      buttons.forEach(peer => peer.classList.toggle("active", peer === button));
      amounts.forEach(amount => {
        amount.textContent = mode === "yearly" ? amount.dataset.yearly : amount.dataset.monthly;
      });
      notes.forEach(note => {
        note.textContent = mode === "yearly" ? note.dataset.yearly : note.dataset.monthly;
      });
    });
  });
}

// ─── DEMO FORM (inner pages) ───
function initForms() {
  const form    = document.querySelector("[data-demo-form]");
  if (!form) return;
  const success = document.querySelector("[data-success-state]");
  form.addEventListener("submit", event => {
    event.preventDefault();
    form.reset();
    if (success) {
      success.classList.add("show");
      success.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
}

// ─── INIT ALL ───
document.addEventListener("DOMContentLoaded", () => {
  setDocumentLanguage();
  localizeHomePage();
  localizeFeaturesPage();
  localizeIntegrationsPage();
  localizeIndustriesPage();
  localizePricingPage();
  localizeSecurityPage();
  localizeContactPage();
  localizeProductPage();
  initReveal();
  initTabs();
  initIndustryTabs();
  initAccordions();
  initPricingToggle();
  initStory();
  initForms();
});
