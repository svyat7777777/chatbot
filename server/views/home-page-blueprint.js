function localized(en, uk) {
  return { en, uk };
}

function pick(value, lang) {
  if (value && typeof value === 'object' && !Array.isArray(value) && ('en' in value || 'uk' in value)) {
    return value[lang] || value.en || '';
  }
  return value;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function withLang(pathname, lang) {
  return `${pathname}?lang=${lang}`;
}

function renderLanguageSwitcher(pathname, lang, labels) {
  return `
    <div class="lang-switcher" aria-label="${escapeHtml(labels.languageSwitcher)}">
      <a href="${withLang(pathname, 'en')}"${lang === 'en' ? ' class="is-active"' : ''}>${labels.en}</a>
      <a href="${withLang(pathname, 'uk')}"${lang === 'uk' ? ' class="is-active"' : ''}>${labels.uk}</a>
    </div>
  `;
}

const MARKETING_SHOTS = {
  widgetEntry: '/marketing/widget-entry.png',
  leadCapture: '/marketing/widget-lead-capture.png',
  inbox: '/marketing/inbox-thread.png',
  contacts: '/marketing/contacts.png',
  analytics: '/marketing/analytics.png',
  settings: '/marketing/settings.png'
};

function getCopy(lang) {
  const isUk = lang === 'uk';
  return {
    meta: {
      title: isUk ? 'Chat Platform | Система розмов для сайту' : 'Chat Platform | Website conversation system',
      description: isUk
        ? 'Website conversation system з AI-відповідями, guided chat flows, lead capture, handoff до оператора, shared inbox, contact records, analytics і settings.'
        : 'A website conversation system with AI replies, guided chat flows, lead capture, human handoff, a shared inbox, contact records, analytics, and settings.'
    },
    brandTagline: isUk ? 'Система розмов для сайту' : 'Website conversation system',
    labels: {
      homeAria: isUk ? 'Chat Platform головна' : 'Chat Platform home',
      languageSwitcher: isUk ? 'Перемикач мови' : 'Language switcher',
      en: 'EN',
      uk: 'UA',
      workspace: isUk ? 'Робочий простір' : 'Workspace',
      storyStep: isUk ? 'Крок' : 'Step'
    },
    nav: {
      product: isUk ? 'Продукт' : 'Product',
      useCases: isUk ? 'Сценарії' : 'Use cases',
      pricing: isUk ? 'Ціни' : 'Pricing',
      faq: 'FAQ',
      demo: isUk ? 'Демо' : 'Demo',
      productTour: isUk ? 'Огляд продукту' : 'Product tour',
      bookDemo: isUk ? 'Замовити демо' : 'Book a demo',
      reviewPricing: isUk ? 'Переглянути ціни' : 'Review pricing'
    },
    hero: {
      eyebrow: 'Website conversation system',
      title: isUk ? 'Керуйте зверненнями з сайту ще до відповіді оператора.' : 'Manage website conversations before your team replies.',
      description: isUk
        ? 'AI відповідає першим, guided chat flows збирають деталі або файл, а high-intent діалоги переходять у shared inbox разом із contact record і контекстом.'
        : 'AI replies first, guided chat flows collect details or a file, and high-intent threads move into a shared inbox with the contact record and context attached.',
      meta: isUk
        ? ['AI відповідає першим', 'Lead capture в чаті', 'Оператор підключається з контекстом']
        : ['AI replies first', 'Lead capture in chat', 'Operators step in with context'],
      sceneTitle: isUk ? 'Запит на прорахунок уже в роботі' : 'A quote request already moving through the workflow',
      sceneText: isUk
        ? 'Сайт не просто приймає повідомлення. Він проводить відвідувача через сценарій, збирає деталі і дає команді чистий handoff у workspace.'
        : 'The site does not just accept a message. It guides the visitor through a scenario, captures the details, and gives the team a clean handoff in the workspace.',
      cards: isUk
        ? [
            ['Менше втрачених заявок', 'Першу відповідь і intake бере на себе AI.'],
            ['Кращий request quality', 'Чат збирає email, brief або файл до handoff.'],
            ['Чистіший follow-up', 'Inbox, контакт і status лишаються пов’язаними.']
          ]
        : [
            ['Fewer missed requests', 'AI handles the first reply and intake.'],
            ['Better request quality', 'The chat collects email, a brief, or a file before handoff.'],
            ['Cleaner follow-up', 'The inbox, contact, and status remain connected.']
          ],
      profileRows: isUk
        ? [['Source', '/pricing'], ['Owner', 'Maria'], ['Lead status', 'New'], ['Next step', 'Quote follow-up']]
        : [['Source', '/pricing'], ['Owner', 'Maria'], ['Lead status', 'New'], ['Next step', 'Quote follow-up']]
    },
    trust: {
      title: isUk ? 'Створено для сайтів, де важливо не просто привітати, а довести звернення до операторського workflow.' : 'Built for websites that need more than a greeting. They need a request to reach an operator workflow.',
      description: isUk
        ? 'Widget, guided flows, inbox, contacts, analytics і settings працюють як один зв’язаний conversation layer.'
        : 'The widget, guided flows, inbox, contacts, analytics, and settings work as one connected conversation layer.',
      stats: isUk
        ? [
            ['Швидша відповідь', 'AI закриває перший крок відразу.'],
            ['Вищий сигнал', 'Деталі запиту збираються в чаті.'],
            ['Один workflow', 'Inbox, контакт і reporting лишаються пов’язаними.']
          ]
        : [
            ['Faster response', 'AI handles the first step immediately.'],
            ['Higher signal', 'Request details are captured inside the chat.'],
            ['One workflow', 'Inbox, contact, and reporting stay linked.']
          ]
    },
    problem: {
      pill: isUk ? 'Чому звичайний чат не працює' : 'Why ordinary website chat fails',
      title: isUk ? 'Проблема не в тому, що на сайті немає чату. Проблема в тому, що звернення не має системи після першого повідомлення.' : 'The problem is not the lack of chat. The problem is that the request has no system behind it after the first message.',
      text: isUk
        ? 'Коли віджет, intake, inbox і follow-up не зв’язані, команда отримує повідомлення, але не отримує керований request path.'
        : 'When the widget, intake, inbox, and follow-up are disconnected, the team gets a message but not a managed request path.'
    },
    storyIntro: {
      pill: isUk ? 'Product flow' : 'Product flow',
      title: isUk ? 'Ось як реальний website conversation переходить від widget entry до inbox, contact records і analytics.' : 'This is how a real website conversation moves from widget entry to inbox, contact records, and analytics.',
      text: isUk
        ? 'Без вигаданого agent language. Просто реальний шлях: сценарій у чаті, guided questions, AI reply, file upload, handoff і visibility.'
        : 'No invented agent language. Just the real path: chat scenario, guided questions, AI reply, file upload, handoff, and visibility.'
    },
    capabilities: {
      pill: isUk ? 'Connected surfaces' : 'Connected surfaces',
      title: isUk ? 'Один website conversation system замість окремих форм, месенджерів і ручного follow-up.' : 'One website conversation system instead of forms, messengers, and manual follow-up.',
      text: isUk
        ? 'Кожна surface нижче відповідає реальному продукту: widget, guided flows, shared inbox, contacts, analytics і settings.'
        : 'Each surface below maps to the real product: widget, guided flows, shared inbox, contacts, analytics, and settings.'
    },
    demo: {
      pill: isUk ? 'Product surfaces' : 'Product surfaces',
      title: isUk ? 'Подивіться ключові product views у тому вигляді, в якому команда реально ними користується.' : 'See the core product views the way the team actually uses them.',
      text: isUk
        ? 'Не abstract dashboard art, а реальні screens: widget, quote flow, inbox, contacts, analytics і settings.'
        : 'Not abstract dashboard art, but the real screens: widget, quote flow, inbox, contacts, analytics, and settings.'
    },
    useCases: {
      pill: isUk ? 'Use cases' : 'Use cases',
      title: isUk ? 'Найсильніші сценарії зараз: quote requests, service enquiries, file uploads і clean operator handoff.' : 'The strongest use cases today: quote requests, service enquiries, file uploads, and a clean operator handoff.',
      text: isUk
        ? 'Продукт найкраще працює там, де звернення починається на сайті і команді потрібно швидко зібрати контекст перед ручною відповіддю.'
        : 'The product works best where demand starts on the website and the team needs to capture context before a manual reply.'
    },
    analytics: {
      pill: isUk ? 'Analytics and value' : 'Analytics and value',
      title: isUk ? 'Коли chat layer має систему, він стає вимірюваним.' : 'When the chat layer has a system behind it, it becomes measurable.',
      text: isUk
        ? 'Reporting чесно показує обсяг чатів, AI vs human handling, waiting chats і source pages, які реально приносять попит.'
        : 'The reporting layer honestly shows chat volume, AI vs human handling, waiting chats, and the source pages generating demand.'
    },
    proof: {
      pill: isUk ? 'Trust and proof' : 'Trust and proof',
      title: isUk ? 'Довіра тут іде від того, що продукт реально показує, а не від перебільшень.' : 'Trust here comes from what the product actually shows, not from inflated positioning.',
      text: isUk
        ? 'Ми не називаємо це omnichannel platform або CRM replacement. Це website conversation system з чітким шляхом від widget до inbox, contacts, analytics і settings.'
        : 'We are not calling this an omnichannel platform or a CRM replacement. It is a website conversation system with a clear path from widget to inbox, contacts, analytics, and settings.'
    },
    pricing: {
      pill: isUk ? 'Pricing' : 'Pricing',
      title: isUk ? 'Комерційна структура для різної складності website conversation workflow.' : 'Commercial framing for different levels of website conversation workflow complexity.',
      text: isUk
        ? 'Без вигаданого self-serve checkout. Плани тут допомагають зрозуміти fit, а деталі проходять через демо.'
        : 'No fake self-serve checkout. The plans help frame fit, and the commercial detail is handled in the demo.'
    },
    faq: {
      title: isUk ? 'Поширені питання перед демо або запуском' : 'Common questions before a demo or rollout',
      text: isUk
        ? 'Install, handoff, lead capture, branding, inbox і multi-site visibility в одному місці.'
        : 'Install, handoff, lead capture, branding, inbox, and multi-site visibility in one place.'
    },
    cta: {
      pill: isUk ? 'Start with a stronger conversation layer' : 'Start with a stronger conversation layer',
      title: isUk ? 'Замініть пасивний website chat системою, яка реально доводить звернення до дії.' : 'Replace passive website chat with a system that actually moves a request forward.',
      text: isUk
        ? 'Дайте сайту workflow розмов, який вітає, кваліфікує, передає оператору й залишає команді clean follow-up path.'
        : 'Give your website a conversation workflow that welcomes, qualifies, hands off to an operator, and leaves the team with a clean follow-up path.'
    },
    footer: {
      summary: isUk
        ? 'Website conversation system з AI-відповідями, guided chat flows, handoff до оператора, shared inbox, contact records, analytics і settings.'
        : 'A website conversation system with AI replies, guided chat flows, human handoff, a shared inbox, contact records, analytics, and settings.',
      product: isUk ? 'Продукт' : 'Product',
      explore: isUk ? 'Розділи' : 'Explore',
      why: isUk ? 'Навіщо це існує' : 'Why this exists',
      whyText: isUk
        ? 'Створено для команд, які отримують попит через сайт і втрачають його, коли replies повільні, а контекст розірваний.'
        : 'Built for teams that generate demand from their website and lose it when replies are slow and context breaks apart.'
    }
  };
}

const STORY_STEPS = [
  {
    label: '01',
    tag: localized('Widget entry', 'Widget entry'),
    title: localized('Welcome visitors with real scenario choices', 'Вітайте відвідувачів реальними сценаріями'),
    description: localized('The conversation starts with pricing, quote, upload, or question paths instead of an empty chat box.', 'Розмова стартує зі сценаріїв ціни, прорахунку, upload або питання, а не з порожнього чату.'),
    image: MARKETING_SHOTS.widgetEntry,
    score: localized('Scenario-led entry', 'Scenario-led entry'),
    bullets: [
      localized('Quick action buttons', 'Quick action buttons'),
      localized('Context from the page', 'Контекст зі сторінки'),
      localized('AI starts the thread', 'AI починає розмову')
    ]
  },
  {
    label: '02',
    tag: localized('Guided capture', 'Guided capture'),
    title: localized('Collect details and files inside the chat', 'Збирайте деталі і файли прямо в чаті'),
    description: localized('The widget can move into a quote flow where the visitor leaves details or uploads a model without leaving the conversation.', 'Віджет переходить у quote flow, де відвідувач залишає деталі або завантажує модель, не виходячи з розмови.'),
    image: MARKETING_SHOTS.leadCapture,
    score: localized('Quote-ready intake', 'Quote-ready intake'),
    bullets: [
      localized('File upload prompt', 'Prompt на файл'),
      localized('Guided next step', 'Керований next step'),
      localized('Lead details captured', 'Дані ліда зібрано')
    ]
  },
  {
    label: '03',
    tag: localized('Shared inbox', 'Shared inbox'),
    title: localized('Hand the active thread to an operator', 'Передайте активний thread оператору'),
    description: localized('When the request needs a person, the inbox already shows source page, AI state, status, and thread history.', 'Коли зверненню потрібна людина, inbox уже показує source page, AI state, статус і history thread.'),
    image: MARKETING_SHOTS.inbox,
    score: localized('Operator-ready workspace', 'Operator-ready workspace'),
    bullets: [
      localized('Visible source page', 'Видима source page'),
      localized('Assignment and status', 'Assignment і статус'),
      localized('Conversation history', 'Історія розмови')
    ]
  },
  {
    label: '04',
    tag: localized('Contact record', 'Contact record'),
    title: localized('Link the thread to a usable contact record', 'Зв’яжіть thread із повноцінним contact record'),
    description: localized('Names, phones, lead state, last activity, and operator ownership stay tied to the conversation.', 'Ім’я, телефони, lead state, last activity і ownership оператора лишаються прив’язаними до розмови.'),
    image: MARKETING_SHOTS.contacts,
    score: localized('Follow-up context', 'Follow-up context'),
    bullets: [
      localized('Lead status visible', 'Видимий lead status'),
      localized('Operator ownership', 'Operator ownership'),
      localized('Dialog count linked', 'Прив’язаний dialog count')
    ]
  },
  {
    label: '05',
    tag: localized('Analytics', 'Analytics'),
    title: localized('See what visitors ask and where handoffs happen', 'Дивіться, що питають відвідувачі і де стається handoff'),
    description: localized('Analytics shows chat volume, waiting conversations, handled mix, and source-page performance.', 'Аналітика показує обсяг чатів, waiting conversations, handled mix і результативність source pages.'),
    image: MARKETING_SHOTS.analytics,
    score: '227 chats',
    bullets: [
      localized('AI vs human split', 'Розкладка AI vs human'),
      localized('Chat status breakdown', 'Розкладка статусів'),
      localized('Top source pages', 'Топ source pages')
    ]
  },
  {
    label: '06',
    tag: localized('Settings', 'Settings'),
    title: localized('Adjust widget identity, flows, and fallback timing', 'Налаштовуйте identity віджета, flows і fallback timing'),
    description: localized('Settings control welcome copy, quick actions, operator fallback, and the logic behind each site flow.', 'Settings керують welcome copy, quick actions, fallback до оператора і логікою сценаріїв на сайті.'),
    image: MARKETING_SHOTS.settings,
    score: localized('Per-site configuration', 'Per-site configuration'),
    bullets: [
      localized('Quick actions and copy', 'Quick actions і copy'),
      localized('Operator fallback timing', 'Таймінг fallback'),
      localized('Live preview state', 'Live preview state')
    ]
  }
];

const DEMO_VIEWS = [
  {
    key: 'widget',
    label: localized('Chat widget', 'Чат-віджет'),
    title: localized('A website widget with scenario-led entry', 'Website widget зі scenario-led entry'),
    description: localized('Visitors start with pricing, quote, upload, or question prompts instead of typing into an empty box.', 'Відвідувачі стартують із prompt на ціну, прорахунок, upload або питання, а не з порожнього поля.'),
    image: MARKETING_SHOTS.widgetEntry,
    rail: [localized('Quick actions', 'Quick actions'), localized('Context greeting', 'Context greeting'), localized('AI-first reply', 'AI-first reply')],
    rows: [
      [localized('Surface', 'Поверхня'), localized('Website widget', 'Website widget')],
      [localized('Use case', 'Сценарій'), localized('Pricing, quote, question', 'Ціна, прорахунок, питання')],
      [localized('State', 'Стан'), localized('AI active', 'AI active')]
    ]
  },
  {
    key: 'capture',
    label: localized('Lead capture', 'Lead capture'),
    title: localized('Guided request flow inside the same thread', 'Guided request flow в тому ж thread'),
    description: localized('Quote details and file upload happen inside chat, so the request stays connected from the first question onward.', 'Деталі прорахунку і file upload відбуваються в чаті, тож запит лишається зв’язаним від першого питання.'),
    image: MARKETING_SHOTS.leadCapture,
    rail: [localized('File upload', 'File upload'), localized('Guided intake', 'Guided intake'), localized('One conversation', 'Одна розмова')],
    rows: [
      [localized('Trigger', 'Trigger'), localized('Need a quote', 'Потрібен прорахунок')],
      [localized('Upload', 'Upload'), localized('Model file in chat', 'Файл моделі в чаті')],
      [localized('Result', 'Результат'), localized('Request stays in thread', 'Запит лишається в thread')]
    ]
  },
  {
    key: 'inbox',
    label: localized('Inbox', 'Inbox'),
    title: localized('Operators work from one shared conversation view', 'Оператори працюють з одного shared conversation view'),
    description: localized('The inbox shows queue, current thread, assignment, contact sidebar, and AI-assisted operator workflow.', 'Inbox показує queue, поточний thread, assignment, sidebar контакту й AI-assisted workflow для оператора.'),
    image: MARKETING_SHOTS.inbox,
    rail: [localized('Shared queue', 'Shared queue'), localized('Assignment + status', 'Assignment + статус'), localized('Operator workspace', 'Operator workspace')],
    rows: [
      [localized('Queue', 'Queue'), localized('Open / waiting / human', 'Open / waiting / human')],
      [localized('Owner', 'Owner'), 'Maria'],
      [localized('Next step', 'Наступний крок'), localized('Reply or follow-up', 'Відповідь або follow-up')]
    ]
  },
  {
    key: 'contacts',
    label: localized('Contact record', 'Contact record'),
    title: localized('Contacts stay linked to conversation activity', 'Контакти лишаються зв’язаними з активністю розмови'),
    description: localized('Lead status, phone, email, operator ownership, and dialog count remain visible in one place.', 'Lead status, телефон, email, ownership оператора і dialog count лишаються видимими в одному місці.'),
    image: MARKETING_SHOTS.contacts,
    rail: [localized('Lead states', 'Lead states'), localized('Ownership', 'Ownership'), localized('Dialog history', 'Dialog history')],
    rows: [
      [localized('Status', 'Статус'), localized('New / in progress / contacted', 'New / in progress / contacted')],
      [localized('Operators', 'Оператори'), localized('Assigned per contact', 'Assigned per contact')],
      [localized('Records', 'Records'), localized('Linked to dialogs', 'Прив’язані до dialogs')]
    ]
  },
  {
    key: 'analytics',
    label: localized('Analytics', 'Analytics'),
    title: localized('Reporting that shows what the conversation layer is doing', 'Reporting, яке показує, що реально робить conversation layer'),
    description: localized('Track total chats, waiting conversations, handled mix, and source pages producing conversation demand.', 'Відстежуйте total chats, waiting conversations, handled mix і source pages, які реально дають conversation demand.'),
    image: MARKETING_SHOTS.analytics,
    rail: [localized('Volume', 'Volume'), localized('Handled mix', 'Handled mix'), localized('Source pages', 'Source pages')],
    rows: [
      [localized('Total chats', 'Total chats'), '227'],
      [localized('AI handled', 'AI handled'), '178'],
      [localized('Human handled', 'Human handled'), '49']
    ]
  },
  {
    key: 'settings',
    label: localized('Settings', 'Settings'),
    title: localized('Per-site settings keep the flow specific to the business', 'Per-site settings роблять flow специфічним для бізнесу'),
    description: localized('Adjust the widget identity, quick actions, welcome copy, chat flows, and operator fallback in one configuration surface.', 'Налаштовуйте identity віджета, quick actions, welcome copy, chat flows і operator fallback в одному конфігураційному surface.'),
    image: MARKETING_SHOTS.settings,
    rail: [localized('Welcome copy', 'Welcome copy'), localized('Quick actions', 'Quick actions'), localized('Fallback logic', 'Fallback logic')],
    rows: [
      [localized('Identity', 'Identity'), localized('Per site', 'Для кожного сайту')],
      [localized('Flow state', 'Flow state'), localized('Configurable', 'Configurable')],
      [localized('Preview', 'Preview'), localized('Live widget preview', 'Live widget preview')]
    ]
  }
];

const FAQS = [
  {
    question: localized('Is installation difficult?', 'Чи складно підключити?'),
    answer: localized('No. Add the widget embed, then configure the site-specific prompts, flows, and operator routing.', 'Ні. Додайте embed віджета, а далі налаштуйте prompts, flows і routing для операторів по сайту.')
  },
  {
    question: localized('Can AI hand a conversation to a human?', 'Чи може AI передати розмову людині?'),
    answer: localized('Yes. High-intent or more complex threads can move into the inbox with the chat history and captured details preserved.', 'Так. High-intent або складніші threads можуть перейти в inbox зі збереженою історією чату і captured details.')
  },
  {
    question: localized('Can it collect contact details inside the chat?', 'Чи можна збирати contact details прямо в чаті?'),
    answer: localized('Yes. The guided flow can ask for phone, email, a short brief, or other request details while the visitor is still engaged.', 'Так. Guided flow може просити телефон, email, короткий brief або інші деталі запиту, поки відвідувач ще в розмові.')
  },
  {
    question: localized('Can visitors upload a file for a quote request?', 'Чи можуть відвідувачі завантажити файл для прорахунку?'),
    answer: localized('Yes. File upload can happen inside the widget as part of the quote or request flow.', 'Так. File upload може відбуватись прямо у віджеті як частина quote або request flow.')
  },
  {
    question: localized('Do operators work from one shared inbox?', 'Чи працюють оператори з одного shared inbox?'),
    answer: localized('Yes. The inbox keeps queue, active thread, contact sidebar, and status in one workspace.', 'Так. Inbox тримає queue, активний thread, sidebar контакту і статус в одному workspace.')
  },
  {
    question: localized('Can one team manage multiple websites?', 'Чи може одна команда вести кілька сайтів?'),
    answer: localized('Yes. The product foundation supports per-site settings, source tracking, and one operations view across sites.', 'Так. Основа продукту підтримує per-site settings, source tracking і один operations view по кількох сайтах.')
  }
];

function renderHomePage({ lang } = {}) {
  const resolvedLang = lang === 'uk' ? 'uk' : 'en';
  const isUk = resolvedLang === 'uk';
  const copy = getCopy(resolvedLang);

  const trustSurfaces = ['Widget', 'Guided flows', 'Shared inbox', 'Contacts', 'Analytics', 'Settings'];

  const painCards = isUk
    ? [
        ['Чат є, але запит далі не ведеться', 'Віджет приймає повідомлення, але не кваліфікує звернення і не збирає достатньо контексту.'],
        ['Першої відповіді доводиться чекати', 'Поки оператор зайде у workspace, high-intent відвідувач уже може дивитися іншого постачальника.'],
        ['Follow-up починається без структури', 'Команда бачить повідомлення, але не бачить чіткого request path із source, status і contact record.']
      ]
    : [
        ['Chat exists, but the request goes nowhere', 'The widget accepts a message without qualifying the request or collecting enough context.'],
        ['The first reply still takes too long', 'Before an operator reaches the workspace, a high-intent visitor can already move to another vendor.'],
        ['Follow-up starts without structure', 'The team sees a message, but not a clear request path with source, status, and contact record.']
      ];

  const painTimeline = isUk
    ? [
        ['22:47', 'Відвідувач відкриває сторінку цін', 'Потрібен прорахунок або швидке уточнення, але сайт не веде його в чіткий flow.'],
        ['22:49', 'Залишає короткий запит', 'Без guided chat flow звернення йде у порожній thread без потрібних деталей.'],
        ['09:14', 'Команда бачить його запізно', 'Немає AI-first reply, немає handoff у shared inbox, немає clean context для відповіді.'],
        ['09:37', 'Намір уже знизився', 'Лід губиться не тому, що не було чату, а тому, що за чатом не було системи.']
      ]
    : [
        ['10:47 PM', 'The visitor opens the pricing page', 'They need a quote or a quick clarification, but the site does not guide them into a clear flow.'],
        ['10:49 PM', 'They leave a short request', 'Without a guided chat flow, the request lands in a blank thread without enough detail.'],
        ['09:14 AM', 'The team sees it too late', 'There is no AI-first reply, no handoff into the shared inbox, and no clean context for follow-up.'],
        ['09:37 AM', 'The intent has already dropped', 'The lead is lost not because chat was missing, but because there was no system behind the chat.']
      ];

  const capabilityCards = isUk
    ? [
        ['AI replies first', 'Закривайте прості питання одразу, поки оператор ще не підключився.'],
        ['Guided capture in chat', 'Збирайте email, brief, phone або файл у тому ж conversation flow.'],
        ['Human handoff', 'Передавайте важливі звернення людині без втрати thread history.'],
        ['Shared inbox', 'Один queue для операторів зі статусом, source page і assignment.'],
        ['Contact records', 'Контакт, last activity і lead state лишаються зв’язаними з діалогом.'],
        ['Analytics and settings', 'Видимість активності плюс керування flows, quick actions і fallback logic.']
      ]
    : [
        ['AI replies first', 'Handle the simple questions immediately while the operator is still away from the conversation.'],
        ['Guided capture in chat', 'Collect email, a brief, phone number, or a file inside the same conversation flow.'],
        ['Human handoff', 'Pass important requests to a person without losing the thread history.'],
        ['Shared inbox', 'One queue for operators with status, source page, and assignment.'],
        ['Contact records', 'The contact, recent activity, and lead state stay linked to the dialogue.'],
        ['Analytics and settings', 'Visibility into activity plus control over flows, quick actions, and fallback logic.']
      ];

  const industries = isUk
    ? [
        {
          key: 'quotes',
          label: 'Quote flows',
          title: 'Для бізнесів, де звернення починається з прорахунку, файлу або короткого brief.',
          text: 'Клієнт починає в чаті, AI веде по сценарію, а команда отримує request уже з контекстом і матеріалами.',
          image: MARKETING_SHOTS.leadCapture
        },
        {
          key: 'services',
          label: 'Services',
          title: 'Для сервісних бізнесів, де важливо швидко взяти першу відповідь на себе.',
          text: 'AI закриває типові питання, збирає контактні дані, а оператор бачить уже структурований thread у shared inbox.',
          image: MARKETING_SHOTS.inbox
        },
        {
          key: 'agencies',
          label: 'Agencies',
          title: 'Для discovery-звернень, яким потрібен clean handoff від чату до людини.',
          text: 'Замість розмитого першого повідомлення команда отримує contact record, source, status і короткий request context.',
          image: MARKETING_SHOTS.contacts
        },
        {
          key: 'multi',
          label: 'Multi-site',
          title: 'Для команд, які хочуть бачити кілька сайтів в одному операційному view.',
          text: 'Налаштовуйте identity, flows і fallback per-site, а потім дивіться активність у зв’язаній analytics surface.',
          image: MARKETING_SHOTS.settings
        }
      ]
    : [
        {
          key: 'quotes',
          label: 'Quote flows',
          title: 'For businesses where the request starts with a quote, a file, or a short brief.',
          text: 'The visitor starts in chat, AI guides the scenario, and the team gets the request with context and materials already attached.',
          image: MARKETING_SHOTS.leadCapture
        },
        {
          key: 'services',
          label: 'Services',
          title: 'For service businesses that need to take the first reply off the team.',
          text: 'AI handles the routine questions, captures contact details, and leaves the operator with a structured inbox thread.',
          image: MARKETING_SHOTS.inbox
        },
        {
          key: 'agencies',
          label: 'Agencies',
          title: 'For discovery conversations that need a clean handoff from chat to a person.',
          text: 'Instead of a vague first message, the team gets a contact record, source, status, and a short request context.',
          image: MARKETING_SHOTS.contacts
        },
        {
          key: 'multi',
          label: 'Multi-site',
          title: 'For teams that want several websites in one operational view.',
          text: 'Configure identity, flows, and fallback per site, then review activity in the linked analytics surface.',
          image: MARKETING_SHOTS.settings
        }
      ];

  const roiCards = isUk
    ? [
        ['227', 'Total chats', 'Загальний обсяг conversation demand.'],
        ['178', 'AI handled', 'Що AI закриває до handoff.'],
        ['49', 'Human handled', 'Де команді реально треба підключатись.']
      ]
    : [
        ['227', 'Total chats', 'Overall conversation demand.'],
        ['178', 'AI handled', 'What AI resolves before a handoff is needed.'],
        ['49', 'Human handled', 'Where the team actually needs to step in.']
      ];

  const proofCards = isUk
    ? [
        ['Website widget', 'Сценарії, quick actions і guided prompts запускають розмову з правильного контексту.'],
        ['Operator workspace', 'Inbox, owner, status і contact sidebar дають команді керований робочий surface.'],
        ['Reporting visibility', 'Analytics показує volume, handled mix і source pages, які реально створюють попит.']
      ]
    : [
        ['Website widget', 'Scenarios, quick actions, and guided prompts start the conversation with the right context.'],
        ['Operator workspace', 'The inbox, owner, status, and contact sidebar create a disciplined workspace for the team.'],
        ['Reporting visibility', 'Analytics shows volume, handled mix, and the source pages creating demand.']
      ];

  const pricingPlans = isUk
    ? [
        {
          name: 'Starter',
          desc: 'Для одного сайту з widget, AI replies і guided capture.',
          price: 'From demo',
          items: ['Widget + AI replies', 'Guided lead capture', 'Shared inbox']
        },
        {
          name: 'Growth',
          desc: 'Для команд, яким потрібні contacts, analytics і ручний handoff workflow.',
          price: 'Custom',
          items: ['Contact records', 'Analytics visibility', 'Operator workflow']
        },
        {
          name: 'Multi-site',
          desc: 'Для кількох сайтів, окремих settings і одного operations view.',
          price: 'Custom',
          items: ['Per-site settings', 'Shared visibility', 'Deployment support']
        }
      ]
    : [
        {
          name: 'Starter',
          desc: 'For one site with the widget, AI replies, and guided capture.',
          price: 'From demo',
          items: ['Widget + AI replies', 'Guided lead capture', 'Shared inbox']
        },
        {
          name: 'Growth',
          desc: 'For teams that need contacts, analytics, and a manual handoff workflow.',
          price: 'Custom',
          items: ['Contact records', 'Analytics visibility', 'Operator workflow']
        },
        {
          name: 'Multi-site',
          desc: 'For several sites, separate settings, and one operations view.',
          price: 'Custom',
          items: ['Per-site settings', 'Shared visibility', 'Deployment support']
        }
      ];

  return `<!doctype html>
<html lang="${resolvedLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(copy.meta.title)}</title>
    <meta name="description" content="${escapeHtml(copy.meta.description)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700&family=Geist:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      :root {
        --bg: #09090b;
        --bg-elevated: #111113;
        --bg-card: #141416;
        --border: #1e1e22;
        --border-subtle: #18181b;
        --text-primary: #f4f4f5;
        --text-secondary: #a1a1aa;
        --text-muted: #52525b;
        --accent: #3b82f6;
        --accent-dim: rgba(59,130,246,0.12);
        --green: #22c55e;
        --green-dim: rgba(34,197,94,0.1);
        --amber: #f59e0b;
        --red: #ef4444;
        --font-display: 'Bricolage Grotesque', sans-serif;
        --font-body: 'Geist', sans-serif;
        --radius: 10px;
        --radius-sm: 6px;
        --radius-lg: 16px;
      }
      *, *::before, *::after { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text-primary);
        font-family: var(--font-body);
        font-size: 16px;
        line-height: 1.6;
        overflow-x: hidden;
        -webkit-font-smoothing: antialiased;
      }
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        pointer-events: none;
        z-index: 9999;
        opacity: 0.4;
      }
      a { color: inherit; text-decoration: none; }
      button { font: inherit; }
      img { display: block; max-width: 100%; }
      .container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
      .container-wide { max-width: 1400px; margin: 0 auto; padding: 0 32px; }
      nav {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 100;
        border-bottom: 1px solid transparent;
        transition: border-color .3s, background .3s, backdrop-filter .3s;
      }
      nav.scrolled {
        background: rgba(9,9,11,0.85);
        backdrop-filter: blur(20px);
        border-color: var(--border);
      }
      .nav-inner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 32px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .nav-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 600;
        letter-spacing: -0.3px;
      }
      .logo-mark {
        width: 28px;
        height: 28px;
        background: var(--accent);
        border-radius: 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
      }
      .nav-logo small {
        display: block;
        color: var(--text-muted);
        font-family: var(--font-body);
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .nav-links {
        display: flex;
        align-items: center;
        gap: 8px;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .nav-links a {
        color: var(--text-secondary);
        font-size: 14px;
        font-weight: 400;
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        transition: color 0.2s;
      }
      .nav-links a:hover { color: var(--text-primary); }
      .nav-cta { display: flex; align-items: center; gap: 10px; }
      .lang-switcher {
        display: inline-flex;
        align-items: center;
        padding: 4px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: rgba(255,255,255,0.02);
      }
      .lang-switcher a {
        min-width: 38px;
        padding: 7px 9px;
        border-radius: 7px;
        color: var(--text-secondary);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-align: center;
      }
      .lang-switcher a.is-active {
        background: rgba(59,130,246,0.16);
        color: var(--text-primary);
      }
      .btn-ghost,
      .btn-primary {
        font-family: var(--font-body);
        font-size: 13.5px;
        font-weight: 500;
        padding: 8px 16px;
        border-radius: var(--radius-sm);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        transition: all 0.2s;
      }
      .btn-ghost {
        background: none;
        border: 1px solid var(--border);
        color: var(--text-secondary);
      }
      .btn-ghost:hover { border-color: #3f3f46; color: var(--text-primary); }
      .btn-primary {
        background: var(--accent);
        color: #fff;
        border: none;
      }
      .btn-primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(59,130,246,0.3);
      }
      .btn-primary-lg,
      .btn-ghost-lg {
        font-size: 15px;
        padding: 12px 24px;
        border-radius: var(--radius);
      }
      .hero {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 120px 0 80px;
        position: relative;
        overflow: hidden;
      }
      .hero-glow {
        position: absolute;
        top: -200px;
        left: 50%;
        transform: translateX(-50%);
        width: 800px;
        height: 600px;
        background: radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%);
        pointer-events: none;
      }
      .hero-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
        background-size: 60px 60px;
        mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent);
        pointer-events: none;
      }
      .hero-badge,
      .section-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: var(--accent-dim);
        border: 1px solid rgba(59,130,246,0.25);
        border-radius: 100px;
        padding: 5px 14px 5px 8px;
        font-size: 12.5px;
        font-weight: 500;
        color: #93c5fd;
        width: fit-content;
      }
      .hero-badge { margin-bottom: 32px; }
      .hero-badge-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
      .hero-content { text-align: center; position: relative; z-index: 2; }
      .hero h1,
      .section-intro h2,
      .cta-copy h3,
      .faq-copy h3,
      .industry-copy h3,
      .roi-copy h3,
      .panel-copy h3 {
        font-family: var(--font-display);
        letter-spacing: -2px;
        margin: 0;
      }
      .hero h1 {
        font-size: clamp(42px, 6vw, 76px);
        font-weight: 600;
        line-height: 1.08;
        margin-bottom: 24px;
      }
      .hero-sub {
        font-size: 18px;
        color: var(--text-secondary);
        max-width: 620px;
        margin: 0 auto 40px;
        line-height: 1.65;
      }
      .hero-actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .hero-meta {
        margin-top: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        color: var(--text-muted);
        font-size: 12.5px;
        flex-wrap: wrap;
      }
      .hero-meta span {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .hero-meta span::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--green);
      }
      .hero-visual {
        margin-top: 72px;
        position: relative;
        z-index: 2;
      }
      .hero-visual-inner,
      .trust-bar,
      .pain-story,
      .visual-frame,
      .cap-card,
      .tab-shell,
      .industry-shell,
      .roi-shell,
      .proof-card,
      .pricing-card,
      .faq-item,
      .cta-block,
      .footer-shell {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: 0 40px 120px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.03);
        position: relative;
      }
      .hero-visual-inner::before,
      .trust-bar::before,
      .pain-story::before,
      .visual-frame::before,
      .tab-shell::before,
      .industry-shell::before,
      .roi-shell::before,
      .proof-card::before,
      .pricing-card::before,
      .cta-block::before,
      .footer-shell::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(59,130,246,0.35), transparent);
      }
      .hero-visual-inner {
        overflow: hidden;
        max-width: 1040px;
        margin: 0 auto;
      }
      .mock-topbar {
        background: var(--bg-card);
        border-bottom: 1px solid var(--border);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .mock-dot { width: 10px; height: 10px; border-radius: 50%; }
      .mock-dot.red { background: var(--red); }
      .mock-dot.yellow { background: var(--amber); }
      .mock-dot.green { background: var(--green); }
      .mock-url {
        flex: 1;
        background: var(--border);
        border-radius: 5px;
        padding: 5px 12px;
        font-size: 12px;
        color: var(--text-muted);
        margin: 0 16px;
        text-align: center;
      }
      .hero-stage {
        display: grid;
        grid-template-columns: 1.12fr 0.88fr;
        min-height: 520px;
      }
      .hero-stage-main {
        padding: 28px;
        border-right: 1px solid var(--border);
        background: linear-gradient(135deg, #0f172a 0%, #0a0a0e 100%);
        position: relative;
      }
      .hero-stage-main::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 70% 18%, rgba(59,130,246,0.08), transparent 34%);
        pointer-events: none;
      }
      .site-copy { position: relative; z-index: 1; }
      .site-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(59,130,246,0.15);
        border: 1px solid rgba(59,130,246,0.22);
        border-radius: 999px;
        padding: 7px 12px;
        color: #bfdbfe;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      .site-badge::before {
        content: '';
        width: 6px;
        height: 6px;
        background: var(--accent);
        border-radius: 50%;
      }
      .site-copy h3 { font-size: 34px; line-height: 1.08; margin: 0 0 12px; }
      .site-copy p { margin: 0 0 22px; max-width: 48ch; color: var(--text-secondary); }
      .site-points {
        display: grid;
        gap: 10px;
        max-width: 460px;
      }
      .site-point {
        padding: 13px 14px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.07);
        background: rgba(255,255,255,0.03);
        color: var(--text-secondary);
        font-size: 14px;
      }
      .hero-main-shot,
      .hero-widget-shot,
      .hero-contact-shot,
      .vf-shot,
      .panel-shot,
      .industry-shot,
      .roi-shot {
        margin-top: 22px;
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
      }
      .hero-widget-shot,
      .hero-contact-shot { margin-top: 0; }
      .hero-main-shot img,
      .hero-widget-shot img,
      .hero-contact-shot img,
      .vf-shot img,
      .panel-shot img,
      .industry-shot img,
      .roi-shot img {
        width: 100%;
        height: auto;
      }
      .hero-stage-side {
        padding: 20px;
        background: linear-gradient(180deg, rgba(8,11,18,0.98), rgba(7,9,14,0.98));
        display: grid;
        gap: 14px;
        align-content: start;
      }
      .hero-side-head,
      .vf-meta {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .hero-side-head span,
      .small-label,
      .step-index,
      .vf-meta span,
      .panel-label,
      .roi-kicker,
      .proof-kicker {
        color: var(--text-muted);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .hero-side-head strong,
      .vf-meta strong,
      .cap-card strong,
      .proof-card strong,
      .pricing-card h3 {
        display: block;
        font-size: 16px;
      }
      .hero-status {
        background: var(--green-dim);
        color: #86efac;
        border: 1px solid rgba(34,197,94,0.16);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }
      .hero-contact-card {
        padding: 14px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.03);
        display: grid;
        gap: 12px;
      }
      .contact-rows {
        display: grid;
        gap: 8px;
      }
      .contact-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 9px 0;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .contact-row:first-child { border-top: 0; padding-top: 0; }
      .contact-row span { color: var(--text-secondary); font-size: 13px; }
      .contact-row strong { font-size: 13px; }
      section { padding: 112px 0; position: relative; }
      .section-intro {
        max-width: 760px;
        margin: 0 auto 52px;
        text-align: center;
      }
      .section-intro h2 {
        font-size: clamp(34px, 4vw, 58px);
        line-height: 1.06;
        margin: 18px 0;
      }
      .section-intro p {
        margin: 0 auto;
        max-width: 640px;
        color: var(--text-secondary);
        font-size: 18px;
        line-height: 1.7;
      }
      .trust-wrap { padding-top: 32px; }
      .trust-bar {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 24px;
        align-items: center;
        padding: 24px 28px;
      }
      .trust-left { display: grid; gap: 14px; }
      .trust-left strong { font-size: 18px; }
      .trust-left p { margin: 0; color: var(--text-secondary); }
      .trust-logos { display: flex; flex-wrap: wrap; gap: 10px; }
      .trust-pill,
      .vf-caption div,
      .proof-rail span {
        padding: 10px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
        color: var(--text-secondary);
        font-size: 13px;
      }
      .trust-right {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .trust-stat {
        padding-left: 14px;
        border-left: 1px solid var(--border);
      }
      .trust-stat strong { display: block; margin-bottom: 4px; font-size: 15px; }
      .trust-stat span { color: var(--text-secondary); font-size: 13px; line-height: 1.6; }
      .pain-grid {
        display: grid;
        grid-template-columns: 0.9fr 1.1fr;
        gap: 36px;
        align-items: start;
      }
      .pain-list { display: grid; gap: 16px; margin-top: 28px; }
      .pain-card {
        padding: 22px;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
        background: rgba(17,17,19,0.84);
      }
      .pain-card strong { display: block; margin-bottom: 8px; font-size: 18px; }
      .pain-card p { margin: 0; color: var(--text-secondary); }
      .pain-story { padding: 26px; }
      .pain-story-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 18px;
      }
      .pain-story-top strong { font-size: 18px; }
      .pain-story-top span {
        color: var(--text-muted);
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .pain-events { display: grid; gap: 14px; }
      .pain-event {
        display: grid;
        grid-template-columns: 72px 1fr;
        gap: 16px;
        padding: 18px;
        border-radius: 14px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
      }
      .pain-event-time {
        color: #93c5fd;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .pain-event strong { display: block; margin-bottom: 6px; }
      .pain-event p { margin: 0; color: var(--text-secondary); }
      .sticky-section .section-intro { margin-bottom: 68px; }
      .sticky-wrapper {
        display: grid;
        grid-template-columns: 380px 1fr;
        gap: 42px;
        align-items: start;
      }
      .sticky-steps {
        position: sticky;
        top: 104px;
        display: grid;
        gap: 14px;
      }
      .sticky-step {
        padding: 22px;
        border-radius: var(--radius-lg);
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.025);
        color: var(--text-secondary);
        cursor: pointer;
        transition: border-color .22s, background .22s, transform .22s, color .22s;
      }
      .sticky-step.is-active {
        border-color: rgba(59,130,246,0.28);
        background: linear-gradient(180deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04));
        color: var(--text-primary);
        transform: translateX(4px);
      }
      .sticky-step h3 { margin: 8px 0 10px; font-size: 18px; line-height: 1.3; }
      .sticky-step p { margin: 0; font-size: 14px; line-height: 1.7; }
      .sticky-step ul {
        list-style: none;
        padding: 0;
        margin: 12px 0 0;
        display: grid;
        gap: 7px;
        font-size: 13px;
        color: var(--text-muted);
      }
      .sticky-visual-panel {
        position: sticky;
        top: 104px;
        min-height: 760px;
      }
      .visual-frame {
        position: absolute;
        inset: 0;
        padding: 22px;
        display: grid;
        gap: 18px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(16px);
        transition: opacity .28s ease, transform .28s ease, visibility 0ms linear .28s;
      }
      .visual-frame.is-active {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        transition: opacity .28s ease, transform .28s ease, visibility 0ms linear 0ms;
      }
      .vf-caption {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .caps-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .cap-card { padding: 22px; }
      .cap-card p { margin: 8px 0 0; color: var(--text-secondary); }
      .tabs-section .section-intro { margin-bottom: 40px; }
      .tab-shell,
      .industry-shell,
      .roi-shell,
      .cta-block { padding: 24px; }
      .tab-nav,
      .industry-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 24px;
      }
      .tab-btn,
      .industry-tab {
        appearance: none;
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.03);
        color: var(--text-secondary);
        border-radius: 999px;
        padding: 11px 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .tab-btn.is-active,
      .industry-tab.is-active {
        color: var(--text-primary);
        background: rgba(59,130,246,0.14);
        border-color: rgba(59,130,246,0.24);
      }
      .tab-panel,
      .industry-panel { display: none; }
      .tab-panel.is-active,
      .industry-panel.is-active { display: block; }
      .tab-layout,
      .industry-layout,
      .roi-layout,
      .faq-layout,
      .cta-layout {
        display: grid;
        grid-template-columns: 0.95fr 1.05fr;
        gap: 28px;
        align-items: start;
      }
      .panel-copy,
      .industry-copy,
      .roi-copy,
      .faq-copy,
      .cta-copy {
        display: grid;
        gap: 18px;
      }
      .panel-copy h3,
      .industry-copy h3,
      .roi-copy h3,
      .faq-copy h3,
      .cta-copy h3 {
        font-size: 32px;
        line-height: 1.1;
      }
      .panel-copy p,
      .industry-copy p,
      .roi-copy p,
      .faq-copy p,
      .cta-copy p,
      .pricing-card p,
      .proof-card p {
        margin: 0;
        color: var(--text-secondary);
      }
      .panel-points,
      .pricing-card ul,
      .faq-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .panel-points { display: grid; gap: 10px; }
      .panel-points li,
      .pricing-card li {
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.03);
      }
      .panel-notes {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .panel-notes div {
        padding: 14px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.03);
      }
      .panel-notes strong { display: block; margin-bottom: 6px; font-size: 15px; }
      .panel-notes span { color: var(--text-secondary); font-size: 13px; line-height: 1.5; }
      .roi-cards {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 24px;
      }
      .roi-card {
        padding: 18px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.03);
      }
      .roi-number {
        font-family: var(--font-display);
        font-size: 42px;
        line-height: 1;
        letter-spacing: -2px;
        margin-bottom: 8px;
      }
      .roi-card strong { display: block; margin-bottom: 8px; }
      .proof-grid,
      .pricing-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0,1fr));
        gap: 16px;
      }
      .proof-card,
      .pricing-card { padding: 24px; }
      .proof-rail {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }
      .pricing-card.featured {
        border-color: rgba(59,130,246,0.24);
        background: linear-gradient(180deg, rgba(59,130,246,0.08), rgba(17,17,19,0.96));
      }
      .price {
        margin: 18px 0 20px;
        font-family: var(--font-display);
        font-size: 42px;
        line-height: 1;
        letter-spacing: -2px;
      }
      .price small { font-size: 14px; color: var(--text-muted); }
      .faq-list { display: grid; gap: 14px; }
      .faq-item { overflow: clip; }
      .faq-trigger {
        width: 100%;
        background: transparent;
        color: var(--text-primary);
        border: 0;
        padding: 20px 22px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        text-align: left;
        cursor: pointer;
      }
      .faq-trigger span:first-child { font-size: 16px; font-weight: 600; }
      .faq-plus {
        position: relative;
        width: 18px;
        height: 18px;
      }
      .faq-plus::before,
      .faq-plus::after {
        content: '';
        position: absolute;
        top: 8px;
        left: 0;
        right: 0;
        height: 2px;
        background: #93c5fd;
        transition: transform 0.18s ease, opacity 0.18s ease;
      }
      .faq-plus::after { transform: rotate(90deg); }
      .faq-item.is-open .faq-plus::after { transform: rotate(90deg) scaleX(0); opacity: 0; }
      .faq-answer {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.26s ease;
      }
      .faq-answer p { margin: 0; padding: 0 22px 22px; color: var(--text-secondary); }
      .faq-item.is-open .faq-answer { max-height: 240px; }
      .cta-layout { grid-template-columns: 1.1fr auto; align-items: center; }
      .cta-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: flex-end;
      }
      .footer-shell { margin: 0 32px 40px; padding: 28px; }
      .footer-inner {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.2fr 0.8fr 0.8fr 1fr;
        gap: 18px;
      }
      .footer-brand,
      .footer-col {
        display: grid;
        gap: 10px;
        align-content: start;
      }
      .footer-brand p,
      .footer-col p { margin: 0; color: var(--text-secondary); }
      .footer-col strong { font-size: 14px; }
      .footer-col a { color: var(--text-secondary); font-size: 14px; }
      .footer-col a:hover { color: var(--text-primary); }
      [data-reveal] {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      [data-reveal].is-visible {
        opacity: 1;
        transform: translateY(0);
      }
      @media (max-width: 1180px) {
        .trust-bar,
        .pain-grid,
        .sticky-wrapper,
        .tab-layout,
        .industry-layout,
        .roi-layout,
        .faq-layout,
        .cta-layout,
        .footer-inner,
        .hero-stage {
          grid-template-columns: 1fr;
        }
        .caps-grid,
        .pricing-grid,
        .proof-grid,
        .trust-right,
        .vf-caption,
        .panel-notes,
        .roi-cards {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 960px) {
        .nav-links { display: none; }
        .hero { min-height: auto; }
        .sticky-steps,
        .sticky-visual-panel { position: static; top: auto; }
        .sticky-visual-panel { min-height: auto; }
        .visual-frame {
          position: relative;
          inset: auto;
          display: none;
          opacity: 1;
          visibility: visible;
          transform: none;
        }
        .visual-frame.is-active { display: grid; }
      }
      @media (max-width: 720px) {
        .container,
        .container-wide { padding: 0 20px; }
        .nav-inner { padding: 0 20px; }
        .nav-cta .btn-ghost { display: none; }
        .hero { padding: 108px 0 70px; }
        .hero h1 { font-size: clamp(38px, 12vw, 56px); }
        .hero-sub { font-size: 16px; }
        .hero-actions { flex-direction: column; }
        .hero-actions a { width: 100%; }
        section { padding: 78px 0; }
        .caps-grid,
        .proof-grid,
        .pricing-grid,
        .footer-inner { grid-template-columns: 1fr; }
        .cta-actions { justify-content: flex-start; }
        .footer-shell { margin: 0 20px 28px; }
      }
    </style>
  </head>
  <body>
    <nav id="nav">
      <div class="nav-inner">
        <a href="/" class="nav-logo" aria-label="${escapeHtml(copy.labels.homeAria)}">
          <span class="logo-mark">CP</span>
          <span>Chat Platform<small>${escapeHtml(copy.brandTagline)}</small></span>
        </a>
        <div class="nav-links">
          <a href="/product">${escapeHtml(copy.nav.product)}</a>
          <a href="/use-cases">${escapeHtml(copy.nav.useCases)}</a>
          <a href="/pricing">${escapeHtml(copy.nav.pricing)}</a>
          <a href="/faq">${escapeHtml(copy.nav.faq)}</a>
          <a href="/demo">${escapeHtml(copy.nav.demo)}</a>
        </div>
        <div class="nav-cta">
          ${renderLanguageSwitcher('/', resolvedLang, copy.labels)}
          <a class="btn-ghost" href="/product">${escapeHtml(copy.nav.productTour)}</a>
          <a class="btn-primary" href="/demo">${escapeHtml(copy.nav.bookDemo)}</a>
        </div>
      </div>
    </nav>

    <main>
      <section class="hero">
        <div class="hero-glow"></div>
        <div class="hero-grid"></div>
        <div class="container">
          <div class="hero-content" data-reveal>
            <div class="hero-badge"><span class="hero-badge-dot"></span>${escapeHtml(copy.hero.eyebrow)}</div>
            <h1>${escapeHtml(copy.hero.title)}</h1>
            <p class="hero-sub">${escapeHtml(copy.hero.description)}</p>
            <div class="hero-actions">
              <a class="btn-primary btn-primary-lg" href="/demo">${escapeHtml(copy.nav.bookDemo)}</a>
              <a class="btn-ghost btn-ghost-lg" href="#story">${isUk ? 'Подивитися workflow' : 'See the workflow'}</a>
            </div>
            <div class="hero-meta">
              ${copy.hero.meta.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}
            </div>
          </div>

          <div class="hero-visual" data-reveal>
            <div class="hero-visual-inner">
              <div class="mock-topbar">
                <span class="mock-dot red"></span>
                <span class="mock-dot yellow"></span>
                <span class="mock-dot green"></span>
                <div class="mock-url">${isUk ? 'widget → guided capture → inbox → contacts → analytics' : 'widget → guided capture → inbox → contacts → analytics'}</div>
              </div>
              <div class="hero-stage">
                <div class="hero-stage-main">
                  <div class="site-copy">
                    <div class="site-badge">${isUk ? 'Один керований conversation path' : 'One managed conversation path'}</div>
                    <h3>${escapeHtml(copy.hero.sceneTitle)}</h3>
                    <p>${escapeHtml(copy.hero.sceneText)}</p>
                    <div class="site-points">
                      ${copy.hero.cards.map(([title, text]) => `<div class="site-point"><strong>${escapeHtml(title)}</strong><br>${escapeHtml(text)}</div>`).join('')}
                    </div>
                    <div class="hero-main-shot">
                      <img src="${MARKETING_SHOTS.inbox}" alt="${escapeHtml(copy.hero.sceneTitle)}" loading="eager" />
                    </div>
                  </div>
                </div>
                <div class="hero-stage-side">
                  <div class="hero-side-head">
                    <div>
                      <span>${isUk ? 'Website entry' : 'Website entry'}</span>
                      <strong>${isUk ? 'Widget + guided flow' : 'Widget + guided flow'}</strong>
                    </div>
                    <div class="hero-status">${isUk ? 'Human handoff ready' : 'Human handoff ready'}</div>
                  </div>
                  <div class="hero-widget-shot">
                    <img src="${MARKETING_SHOTS.widgetEntry}" alt="${escapeHtml(copy.hero.title)}" loading="eager" />
                  </div>
                  <div class="hero-contact-card">
                    <span class="small-label">${isUk ? 'Contact context' : 'Contact context'}</span>
                    <div class="hero-contact-shot">
                      <img src="${MARKETING_SHOTS.contacts}" alt="${isUk ? 'Контактний запис' : 'Contact record'}" loading="lazy" />
                    </div>
                    <div class="contact-rows">
                      ${copy.hero.profileRows.map(([label, value]) => `<div class="contact-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="trust-wrap">
        <div class="container">
          <div class="trust-bar" data-reveal>
            <div class="trust-left">
              <div class="section-badge">Core surfaces</div>
              <strong>${escapeHtml(copy.trust.title)}</strong>
              <p>${escapeHtml(copy.trust.description)}</p>
              <div class="trust-logos">
                ${trustSurfaces.map((item) => `<span class="trust-pill">${escapeHtml(item)}</span>`).join('')}
              </div>
            </div>
            <div class="trust-right">
              ${copy.trust.stats.map(([title, text]) => `<div class="trust-stat"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <section>
        <div class="container">
          <div class="pain-grid">
            <div>
              <div class="section-intro" style="text-align:left; margin:0 0 26px;" data-reveal>
                <div class="section-badge">${escapeHtml(copy.problem.pill)}</div>
                <h2>${escapeHtml(copy.problem.title)}</h2>
                <p>${escapeHtml(copy.problem.text)}</p>
              </div>
              <div class="pain-list">
                ${painCards.map(([title, text]) => `<article class="pain-card" data-reveal><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></article>`).join('')}
              </div>
            </div>
            <div class="pain-story" data-reveal>
              <div class="pain-story-top">
                <strong>${isUk ? 'Як реальний request губиться без системи' : 'How a real request gets lost without a system'}</strong>
                <span>${isUk ? 'Operational sequence' : 'Operational sequence'}</span>
              </div>
              <div class="pain-events">
                ${painTimeline.map(([time, title, text]) => `<div class="pain-event"><div class="pain-event-time">${escapeHtml(time)}</div><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div></div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="sticky-section" id="story">
        <div class="container-wide">
          <div class="section-intro" data-reveal>
            <div class="section-badge">${escapeHtml(copy.storyIntro.pill)}</div>
            <h2>${escapeHtml(copy.storyIntro.title)}</h2>
            <p>${escapeHtml(copy.storyIntro.text)}</p>
          </div>
          <div class="sticky-wrapper">
            <div class="sticky-steps">
              ${STORY_STEPS.map((step, index) => `<article class="sticky-step${index === 0 ? ' is-active' : ''}" data-story-step="${index}" data-reveal><div class="step-index">${escapeHtml(copy.labels.storyStep)} ${escapeHtml(step.label)}</div><h3>${escapeHtml(pick(step.title, resolvedLang))}</h3><p>${escapeHtml(pick(step.description, resolvedLang))}</p><ul>${step.bullets.map((bullet) => `<li>${escapeHtml(pick(bullet, resolvedLang))}</li>`).join('')}</ul></article>`).join('')}
            </div>
            <div class="sticky-visual-panel">
              ${STORY_STEPS.map((step, index) => `<div class="visual-frame${index === 0 ? ' is-active' : ''}" data-story-panel="${index}"><div class="vf-meta"><div><span>${escapeHtml(pick(step.tag, resolvedLang))}</span><strong>${escapeHtml(pick(step.title, resolvedLang))}</strong></div><span>${escapeHtml(pick(step.score, resolvedLang))}</span></div><div class="vf-shot"><img src="${step.image}" alt="${escapeHtml(pick(step.title, resolvedLang))}" loading="lazy" /></div><div class="vf-caption">${step.bullets.map((bullet) => `<div>${escapeHtml(pick(bullet, resolvedLang))}</div>`).join('')}</div></div>`).join('')}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="container">
          <div class="section-intro" data-reveal>
            <div class="section-badge">${escapeHtml(copy.capabilities.pill)}</div>
            <h2>${escapeHtml(copy.capabilities.title)}</h2>
            <p>${escapeHtml(copy.capabilities.text)}</p>
          </div>
          <div class="caps-grid">
            ${capabilityCards.map(([title, text]) => `<article class="cap-card" data-reveal><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></article>`).join('')}
          </div>
        </div>
      </section>

      <section class="tabs-section">
        <div class="container">
          <div class="section-intro" data-reveal>
            <div class="section-badge">${escapeHtml(copy.demo.pill)}</div>
            <h2>${escapeHtml(copy.demo.title)}</h2>
            <p>${escapeHtml(copy.demo.text)}</p>
          </div>
          <div class="tab-shell" data-reveal>
            <div class="tab-nav" role="tablist">
              ${DEMO_VIEWS.map((view, index) => `<button class="tab-btn${index === 0 ? ' is-active' : ''}" type="button" data-demo-tab="${escapeHtml(view.key)}" aria-selected="${index === 0 ? 'true' : 'false'}">${escapeHtml(pick(view.label, resolvedLang))}</button>`).join('')}
            </div>
            ${DEMO_VIEWS.map((view, index) => `<div class="tab-panel${index === 0 ? ' is-active' : ''}" data-demo-panel="${escapeHtml(view.key)}"><div class="tab-layout"><div class="panel-copy"><span class="panel-label">${isUk ? 'Product view' : 'Product view'}</span><h3>${escapeHtml(pick(view.title, resolvedLang))}</h3><p>${escapeHtml(pick(view.description, resolvedLang))}</p><ul class="panel-points">${view.rail.map((item) => `<li>${escapeHtml(pick(item, resolvedLang))}</li>`).join('')}</ul><div class="panel-notes">${view.rows.map(([label, value]) => `<div><strong>${escapeHtml(pick(label, resolvedLang))}</strong><span>${escapeHtml(pick(value, resolvedLang))}</span></div>`).join('')}</div></div><div class="panel-shot"><img src="${view.image}" alt="${escapeHtml(pick(view.title, resolvedLang))}" loading="lazy" /></div></div></div>`).join('')}
          </div>
        </div>
      </section>

      <section>
        <div class="container">
          <div class="section-intro" data-reveal>
            <div class="section-badge">${escapeHtml(copy.useCases.pill)}</div>
            <h2>${escapeHtml(copy.useCases.title)}</h2>
            <p>${escapeHtml(copy.useCases.text)}</p>
          </div>
          <div class="industry-shell" data-reveal>
            <div class="industry-tabs">
              ${industries.map((item, index) => `<button class="industry-tab${index === 0 ? ' is-active' : ''}" type="button" data-industry-tab="${escapeHtml(item.key)}">${escapeHtml(item.label)}</button>`).join('')}
            </div>
            ${industries.map((item, index) => `<div class="industry-panel${index === 0 ? ' is-active' : ''}" data-industry-panel="${escapeHtml(item.key)}"><div class="industry-layout"><div class="industry-copy"><span class="panel-label">${isUk ? 'Business fit' : 'Business fit'}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p><a class="btn-ghost btn-ghost-lg" href="/use-cases">${isUk ? 'Подивитися детальні сценарії' : 'See detailed use cases'}</a></div><div class="industry-shot"><img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy" /></div></div></div>`).join('')}
          </div>
        </div>
      </section>

      <section>
        <div class="container">
          <div class="section-intro" data-reveal>
            <div class="section-badge">${escapeHtml(copy.analytics.pill)}</div>
            <h2>${escapeHtml(copy.analytics.title)}</h2>
            <p>${escapeHtml(copy.analytics.text)}</p>
          </div>
          <div class="roi-shell" data-reveal>
            <div class="roi-cards">
              ${roiCards.map(([number, title, text]) => `<div class="roi-card"><div class="roi-number">${escapeHtml(number)}</div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div>`).join('')}
            </div>
            <div class="roi-layout">
              <div class="roi-copy">
                <span class="roi-kicker">${isUk ? 'Reporting surface' : 'Reporting surface'}</span>
                <h3>${isUk ? 'Видимість того, де AI закриває звернення, а де команді потрібен handoff.' : 'Visibility into where AI resolves the request and where the team needs to take over.'}</h3>
                <p>${isUk ? 'Analytics не намагається бути всім. Вона показує volume, waiting chats, handled mix і source pages, які реально створюють conversation demand.' : 'The analytics layer is not trying to be everything. It shows volume, waiting chats, handled mix, and the source pages actually creating conversation demand.'}</p>
              </div>
              <div class="roi-shot">
                <img src="${MARKETING_SHOTS.analytics}" alt="${isUk ? 'Огляд аналітики' : 'Analytics overview'}" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="container">
          <div class="section-intro" data-reveal>
            <div class="section-badge">${escapeHtml(copy.proof.pill)}</div>
            <h2>${escapeHtml(copy.proof.title)}</h2>
            <p>${escapeHtml(copy.proof.text)}</p>
          </div>
          <div class="proof-grid">
            ${proofCards.map(([title, text]) => `<article class="proof-card" data-reveal><span class="proof-kicker">${isUk ? 'Product truth' : 'Product truth'}</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p><div class="proof-rail"><span>AI replies</span><span>Human handoff</span><span>Shared inbox</span></div></article>`).join('')}
          </div>
        </div>
      </section>

      <section>
        <div class="container">
          <div class="section-intro" data-reveal>
            <div class="section-badge">${escapeHtml(copy.pricing.pill)}</div>
            <h2>${escapeHtml(copy.pricing.title)}</h2>
            <p>${escapeHtml(copy.pricing.text)}</p>
          </div>
          <div class="pricing-grid">
            ${pricingPlans.map((plan, index) => `<article class="pricing-card${index === 1 ? ' featured' : ''}" data-reveal><h3>${escapeHtml(plan.name)}</h3><p>${escapeHtml(plan.desc)}</p><div class="price">${escapeHtml(plan.price)}<small>${isUk ? ' / after review' : ' / after review'}</small></div><ul>${plan.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul><a class="${index === 1 ? 'btn-primary' : 'btn-ghost'}" href="/pricing">${index === 1 ? escapeHtml(copy.nav.reviewPricing) : escapeHtml(copy.nav.pricing)}</a></article>`).join('')}
          </div>
        </div>
      </section>

      <section>
        <div class="container">
          <div class="faq-layout">
            <div class="faq-copy" data-reveal>
              <div class="section-badge">FAQ</div>
              <h3>${escapeHtml(copy.faq.title)}</h3>
              <p>${escapeHtml(copy.faq.text)}</p>
              <a class="btn-ghost btn-ghost-lg" href="/faq">Open full FAQ</a>
            </div>
            <div class="faq-list">
              ${FAQS.map((item, index) => `<div class="faq-item${index === 0 ? ' is-open' : ''}" data-reveal><button class="faq-trigger" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}"><span>${escapeHtml(pick(item.question, resolvedLang))}</span><span class="faq-plus"></span></button><div class="faq-answer"><p>${escapeHtml(pick(item.answer, resolvedLang))}</p></div></div>`).join('')}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="container">
          <div class="cta-block" data-reveal>
            <div class="cta-layout">
              <div class="cta-copy">
                <div class="section-badge">${escapeHtml(copy.cta.pill)}</div>
                <h3>${escapeHtml(copy.cta.title)}</h3>
                <p>${escapeHtml(copy.cta.text)}</p>
              </div>
              <div class="cta-actions">
                <a class="btn-primary btn-primary-lg" href="/demo">${escapeHtml(copy.nav.bookDemo)}</a>
                <a class="btn-ghost btn-ghost-lg" href="/pricing">${escapeHtml(copy.nav.reviewPricing)}</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer-shell">
      <div class="footer-inner">
        <div class="footer-brand">
          <a href="/" class="nav-logo">
            <span class="logo-mark">CP</span>
            <span>Chat Platform<small>${escapeHtml(copy.brandTagline)}</small></span>
          </a>
          <p>${escapeHtml(copy.footer.summary)}</p>
          ${renderLanguageSwitcher('/', resolvedLang, copy.labels)}
        </div>
        <div class="footer-col">
          <strong>${escapeHtml(copy.footer.product)}</strong>
          <a href="/product">${escapeHtml(copy.nav.product)}</a>
          <a href="/use-cases">${escapeHtml(copy.nav.useCases)}</a>
          <a href="/pricing">${escapeHtml(copy.nav.pricing)}</a>
        </div>
        <div class="footer-col">
          <strong>${escapeHtml(copy.footer.explore)}</strong>
          <a href="/faq">${escapeHtml(copy.nav.faq)}</a>
          <a href="/demo">${escapeHtml(copy.nav.demo)}</a>
          <a href="/inbox">${escapeHtml(copy.labels.workspace)}</a>
        </div>
        <div class="footer-col">
          <strong>${escapeHtml(copy.footer.why)}</strong>
          <p>${escapeHtml(copy.footer.whyText)}</p>
        </div>
      </div>
    </footer>

    <script>
      (() => {
        const nav = document.getElementById('nav');
        const syncNav = () => {
          if (!nav) return;
          nav.classList.toggle('scrolled', window.scrollY > 16);
        };
        syncNav();
        window.addEventListener('scroll', syncNav, { passive: true });

        const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
        if ('IntersectionObserver' in window) {
          const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            });
          }, { threshold: 0.14 });
          revealItems.forEach((item) => revealObserver.observe(item));
        } else {
          revealItems.forEach((item) => item.classList.add('is-visible'));
        }

        const storySteps = Array.from(document.querySelectorAll('[data-story-step]'));
        const storyPanels = Array.from(document.querySelectorAll('[data-story-panel]'));
        const storyQuery = window.matchMedia('(min-width: 961px)');
        let activeStoryIndex = 0;
        let clickLockUntil = 0;
        let storyTicking = false;

        const setActiveStory = (index) => {
          const nextIndex = Math.max(0, Math.min(storySteps.length - 1, index));
          if (nextIndex === activeStoryIndex) return;
          activeStoryIndex = nextIndex;
          storySteps.forEach((step, stepIndex) => step.classList.toggle('is-active', stepIndex === activeStoryIndex));
          storyPanels.forEach((panel, panelIndex) => panel.classList.toggle('is-active', panelIndex === activeStoryIndex));
        };

        const syncStory = () => {
          storyTicking = false;
          if (!storyQuery.matches || !storySteps.length) return;
          if (Date.now() < clickLockUntil) return;
          const anchorY = window.innerHeight * 0.35;
          let closestIndex = activeStoryIndex;
          let closestDistance = Number.POSITIVE_INFINITY;
          storySteps.forEach((step, index) => {
            const rect = step.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const distance = Math.abs(center - anchorY);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          });
          if (closestDistance <= window.innerHeight * 0.42) setActiveStory(closestIndex);
        };

        const requestStory = () => {
          if (storyTicking) return;
          storyTicking = true;
          window.requestAnimationFrame(syncStory);
        };

        if (storySteps.length) {
          setActiveStory(0);
          window.addEventListener('scroll', requestStory, { passive: true });
          window.addEventListener('resize', requestStory);
          if (typeof storyQuery.addEventListener === 'function') storyQuery.addEventListener('change', requestStory);
          else if (typeof storyQuery.addListener === 'function') storyQuery.addListener(requestStory);
          requestStory();
        }

        storySteps.forEach((step) => {
          step.addEventListener('click', () => {
            const index = Number(step.getAttribute('data-story-step'));
            if (Number.isNaN(index)) return;
            clickLockUntil = Date.now() + 900;
            setActiveStory(index);
          });
        });

        const demoTabs = Array.from(document.querySelectorAll('[data-demo-tab]'));
        const demoPanels = Array.from(document.querySelectorAll('[data-demo-panel]'));
        const setDemo = (key) => {
          demoTabs.forEach((tab) => {
            const active = tab.getAttribute('data-demo-tab') === key;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          demoPanels.forEach((panel) => panel.classList.toggle('is-active', panel.getAttribute('data-demo-panel') === key));
        };
        demoTabs.forEach((tab) => tab.addEventListener('click', () => setDemo(tab.getAttribute('data-demo-tab') || '')));

        const industryTabs = Array.from(document.querySelectorAll('[data-industry-tab]'));
        const industryPanels = Array.from(document.querySelectorAll('[data-industry-panel]'));
        const setIndustry = (key) => {
          industryTabs.forEach((tab) => tab.classList.toggle('is-active', tab.getAttribute('data-industry-tab') === key));
          industryPanels.forEach((panel) => panel.classList.toggle('is-active', panel.getAttribute('data-industry-panel') === key));
        };
        industryTabs.forEach((tab) => tab.addEventListener('click', () => setIndustry(tab.getAttribute('data-industry-tab') || '')));

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
