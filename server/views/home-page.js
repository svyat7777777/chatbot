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

function getHomeCopy(lang) {
  const isUk = lang === 'uk';
  return {
    brandTagline: isUk ? 'Система розмов для сайту' : 'Website conversation system',
    labels: {
      homeAria: isUk ? 'Chat Platform головна' : 'Chat Platform home',
      primaryNav: isUk ? 'Основна навігація' : 'Primary',
      languageSwitcher: isUk ? 'Перемикач мови' : 'Language switcher',
      en: 'EN',
      uk: 'UA',
      storyStep: isUk ? 'Крок' : 'Step',
      primaryState: isUk ? 'Основний стан' : 'Primary state',
      context: isUk ? 'Контекст' : 'Context',
      output: isUk ? 'Результат' : 'Output',
      conversationThread: isUk ? 'Потік розмови' : 'Conversation thread',
      siteSource: isUk ? 'Джерело сайту' : 'Site source',
      owner: isUk ? 'Власник' : 'Owner',
      intentScore: isUk ? 'Оцінка наміру' : 'Intent score',
      source: isUk ? 'Джерело' : 'Source',
      status: isUk ? 'Статус' : 'Status',
      qualified: isUk ? 'Кваліфіковано' : 'Qualified',
      capability: isUk ? 'Можливість' : 'Capability',
      productViews: isUk ? 'Вигляди продукту' : 'Product views',
      productView: isUk ? 'Вигляд продукту' : 'Product view',
      operationalView: isUk ? 'Операційний вигляд' : 'Operational view',
      realWorkflowContext: isUk ? 'Реальний контекст workflow' : 'Real workflow context',
      primaryPanel: isUk ? 'Головна панель' : 'Primary panel',
      action: isUk ? 'Дія' : 'Action',
      workspace: isUk ? 'Робочий простір' : 'Workspace'
    },
    nav: {
      product: isUk ? 'Продукт' : 'Product',
      useCases: isUk ? 'Сценарії' : 'Use cases',
      pricing: isUk ? 'Ціни' : 'Pricing',
      faq: 'FAQ',
      demo: isUk ? 'Демо' : 'Demo',
      productTour: isUk ? 'Огляд продукту' : 'Product tour',
      bookDemo: isUk ? 'Замовити демо' : 'Book a demo',
      seeProduct: isUk ? 'Подивитися продукт' : 'See the product',
      reviewPricing: isUk ? 'Переглянути ціни' : 'Review pricing',
      operatorLogin: isUk ? 'Вхід для операторів' : 'Operator login'
    },
    meta: {
      title: isUk ? 'Chat Platform | Система розмов для сайту' : 'Chat Platform | Website conversation system',
      description: isUk
        ? 'AI-чат, передача оператору, збір лідів, shared inbox, аналітика й автоматизація в одній преміальній системі розмов для сайту.'
        : 'AI chat, live operator handoff, lead capture, shared inbox, analytics, and automation in one premium website conversation system.'
    },
    hero: {
      eyebrow: isUk ? 'AI + оператори + inbox + аналітика' : 'AI + operators + inbox + analytics',
      title: isUk ? 'Перетворіть відвідувачів сайту на кваліфіковані розмови.' : 'Turn website visitors into qualified conversations.',
      description: isUk
        ? 'Система розмов для сайту, яка відповідає на питання через AI, збирає дані ліда, передає high-intent чати команді й тримає весь workflow в одному inbox.'
        : 'A website conversation system that answers questions with AI, captures lead details, routes high-intent chats to your team, and keeps the full workflow in one inbox.',
      meta: isUk
        ? ['Відповідає миттєво', 'Збирає дані ліда', 'Передає з контекстом']
        : ['Answers instantly', 'Captures lead details', 'Hands off with context'],
      note: isUk
        ? 'Створено для команд, які втрачають ліди, коли відповіді повільні, контекст губиться, а follow-up нестабільний.'
        : 'Built for teams that lose leads when replies are slow, context gets lost, or follow-up is inconsistent.',
      proof: isUk
        ? [
            ['AI + передача людині', 'Ескалуйте важливі розмови з повним thread без втрати контексту.'],
            ['Збір лідів у чаті', 'Отримуйте контакти саме тоді, коли намір купівлі вже помітний.'],
            ['Одна операційна система', 'Тримайте чат, inbox, контакти й follow-up в одному місці.']
          ]
        : [
            ['AI + human handoff', 'Escalate important conversations with the full thread attached.'],
            ['Lead capture in chat', 'Collect contact details when buying intent is actually visible.'],
            ['One operational system', 'Keep chat, inbox, contacts, and follow-up in one place.']
          ],
      scene: {
        workspaceNav: isUk
          ? ['Робочий простір', 'Shared inbox', 'Контактні профілі', 'Правила автоматизації', 'Аналітика']
          : ['Workspace', 'Shared inbox', 'Contact profiles', 'Automation rules', 'Analytics'],
        leadTitle: isUk ? 'Northline: запит на комерційну пропозицію' : 'Northline commercial quote inquiry',
        leadMeta: isUk ? 'Сторінка цін · кваліфікований лід · оператор підключився' : 'Pricing page · qualified lead · operator joined',
        liveHandoff: isUk ? 'Живий handoff' : 'Live handoff',
        qualified: isUk ? 'Статус ліда: Кваліфіковано' : 'Lead status: Qualified',
        source: isUk ? 'Джерело: /pricing' : 'Source: /pricing',
        insights: isUk
          ? [['Контактний профіль', 'Julia · Oak & Co.'], ['Наступна дія', 'Follow-up по пропозиції сьогодні']]
          : [['Contact record', 'Julia · Oak & Co.'], ['Next action', 'Quote follow-up today']],
        profileTitle: isUk ? 'Контактний профіль' : 'Contact profile',
        profileRows: isUk
          ? [['Компанія', 'Oak & Co.'], ['Таймлайн', 'Початок квітня'], ['Власник', 'Daria'], ['Follow-up', 'Сьогодні · 15:30']]
          : [['Company', 'Oak & Co.'], ['Timeline', 'Early April'], ['Owner', 'Daria'], ['Follow-up', 'Today · 15:30']],
        messages: isUk
          ? [
              'Вітаємо в Northline. Вас цікавлять ціни, терміни монтажу чи індивідуальний прорахунок?',
              'Нам потрібна пропозиція для двох локацій і швидке вікно монтажу.',
              'Можу допомогти. Який email і бажаний таймлайн?',
              'Вітаю, Julia. Я вже бачу ваші дані й можу підтвердити варіанти цін та доступні дати.'
            ]
          : [
              'Welcome to Northline. Looking for pricing, installation timing, or a custom quote?',
              'We need a quote for two locations and a fast install window.',
              'I can help with that. What is the best email and target timeline?',
              'Hi Julia, I have your details. I can confirm pricing options and available dates.'
            ]
      }
    },
    trust: {
      title: isUk ? 'Створено для бізнесів, які втрачають ліди, коли розмови на сайті зупиняються.' : 'Designed for businesses that lose leads when website conversations stall.',
      description: isUk
        ? 'Перейдіть від пасивного чату та розірваних форм до однієї системи, яка вітає, кваліфікує, маршрутизує й відстежує кожну розмову.'
        : 'Move from passive chat and disconnected forms to one system that greets, qualifies, routes, and tracks every conversation.',
      stats: isUk
        ? [
            ['Швидша відповідь', 'AI відповідає одразу замість очікування оператора.'],
            ['Вищий сигнал', 'Дані ліда та намір фіксуються, поки діалог ще живий.'],
            ['Один workflow', 'Inbox, профіль, аналітика й автоматизація залишаються пов’язаними.']
          ]
        : [
            ['Faster response', 'AI answers immediately instead of waiting for an operator.'],
            ['Higher signal', 'Lead details and intent are captured while the conversation is still live.'],
            ['One workflow', 'Inbox, profile, analytics, and automation stay connected.']
          ]
    },
    sections: {
      story: {
        pill: isUk ? 'Потік продукту' : 'Product flow',
        title: isUk ? 'Покажіть увесь workflow розмови, а не лише першу відповідь.' : 'Show the full conversation workflow, not just the first reply.',
        text: isUk ? 'Від привітання до кваліфікації, handoff, inbox-менеджменту й follow-up продукт поводиться як одна зв’язана система.' : 'From greeting to qualification, handoff, inbox management, and follow-up, the product behaves like one connected system.'
      },
      problem: {
        pill: isUk ? 'Чому команди втрачають ліди' : 'Why teams lose leads',
        title: isUk ? 'Більшість сайтів досі відповідають запізно, кваліфікують надто пізно і майже нічого не відстежують.' : 'Most websites still reply too slowly, qualify too late, and track too little.',
        text: isUk ? 'Форми, пасивні чат-віджети й розірвані inbox-и створюють тертя саме там, де намір покупця найвищий.' : 'Forms, passive chat widgets, and disconnected inboxes create friction exactly where buyer intent is highest.'
      },
      capabilities: {
        pill: isUk ? 'Зв’язана система' : 'Connected system',
        title: isUk ? 'Побудовано як єдиний workflow розмови, а не як купа роз’єднаних інструментів.' : 'Built as one conversation workflow, not a pile of disconnected tools.',
        text: isUk ? 'AI відповідає, lead capture оновлює запис, handoff зберігає контекст, автоматизація не дає темпу впасти, а inbox лишається зручним для команди.' : 'AI answers questions, lead capture updates the record, handoff preserves context, automation keeps momentum moving, and the inbox stays usable for the team.',
        intro: isUk
          ? [['AI-відповіді', 'Миттєво закривають повторювані питання.'], ['Передача оператору', 'Швидко ескалує high-intent чати.'], ['Готово до кількох сайтів', 'Централізує workflow між майданчиками.']]
          : [['AI answers', 'Handle repetitive questions instantly.'], ['Operator handoff', 'Escalate high-intent chats fast.'], ['Multi-site ready', 'Centralize workflows across properties.']]
      },
      demo: {
        pill: isUk ? 'Демо продукту' : 'Product demo',
        title: isUk ? 'Покажіть основні поверхні продукту, а не стіну dashboard-art.' : 'Show the core product surfaces, not a wall of dashboard art.',
        text: isUk ? 'Кожен вигляд нижче — це робоча поверхня системи: чат, inbox, контактний запис, аналітика й автоматизація.' : 'Each view below represents a working surface of the system: chat, inbox, contact record, analytics, and automation.'
      },
      industries: {
        pill: isUk ? 'Галузі' : 'Industries',
        title: isUk ? 'Створено для команд, які виграють бізнес через свій сайт.' : 'Designed for teams that win business through their website.',
        text: isUk ? 'Найсильніші сценарії там, де повільні відповіді, слабка кваліфікація або поганий follow-up перетворюють реальний попит на втрачений дохід.' : 'The strongest use cases are the ones where slow replies, poor qualification, or weak follow-up turn real demand into lost revenue.'
      },
      roi: {
        pill: isUk ? 'Вплив на бізнес' : 'Business impact',
        title: isUk ? 'Зробіть розмови на сайті вимірюваними, швидшими і простішими в операційному веденні.' : 'Make website conversations measurable, faster, and easier to run.',
        text: isUk ? 'Коли привітання, кваліфікація, handoff і follow-up живуть в одній системі, команда відповідає швидше, збирає більше сигналу і втрачає менше контексту.' : 'When greeting, qualification, handoff, and follow-up live in one system, teams reply faster, capture more signal, and lose less context.'
      },
      proof: {
        pill: isUk ? 'Довіра і доказ' : 'Trust and proof',
        title: isUk ? 'Створено для реальних операцій, а не vanity-метрик чату.' : 'Built for real operations, not vanity chat metrics.',
        text: isUk ? 'Тут довіру будує зрілість продукту, чистий workflow, практичний rollout і система, зібрана навколо результатів розмов.' : 'The trust story here is product maturity, clean workflows, practical deployment, and a system designed around conversation outcomes.',
        buyersPill: isUk ? 'Що має повірити покупець' : 'What buyers need to believe',
        buyersTitle: isUk ? 'Це краще за звичайний чат-віджет, бо workflow не закінчується на привітанні.' : 'This is better than a normal chat widget because the workflow continues after hello.',
        buyersText: isUk ? 'Продукт не зупиняється на привітанні відвідувачів. Він збирає дані ліда, передає контекст людям, структурує контакти й робить ефективність видимою.' : 'The product does not stop at greeting visitors. It captures lead details, transfers context to humans, structures contacts, and makes performance visible.'
      },
      faq: {
        pill: 'FAQ',
        title: isUk ? 'Дайте практичні відповіді до того, як вони загальмують рішення.' : 'Answer the practical questions before they slow the decision.',
        text: isUk ? 'Поясніть setup, handoff, branding і multi-site поведінку так, щоб продукт здавався простим для впровадження.' : 'Keep setup, handoff, branding, and multi-site behavior clear enough that the product feels easy to adopt.'
      },
      cta: {
        pill: isUk ? 'Почніть із сильнішого conversation layer' : 'Start with a stronger conversation layer',
        title: isUk ? 'Замініть пасивний чат на сайті системою, яка реально рухає ліди вперед.' : 'Replace passive website chat with a system that actually moves leads forward.',
        text: isUk ? 'Дайте сайту workflow розмов, який вітає, кваліфікує, маршрутизує й відстежує попит в одному місці.' : 'Give your website a conversation workflow that welcomes, qualifies, routes, and tracks demand in one place.'
      }
    },
    footer: {
      summary: isUk ? 'AI-асистент, передача оператору, збір лідів, inbox, аналітика й автоматизація для серйозних розмов на сайті.' : 'AI assistant, operator handoff, lead capture, inbox, analytics, and automation for serious website conversations.',
      product: isUk ? 'Продукт' : 'Product',
      explore: isUk ? 'Розділи' : 'Explore',
      why: isUk ? 'Навіщо це існує' : 'Why this exists',
      whyText: isUk ? 'Створено для команд, які втрачають ліди, коли розмови на сайті зупиняються, контекст фрагментований або follow-up без дисципліни.' : 'Built for teams that lose leads when website conversations stall, context is fragmented, or follow-up lacks discipline.'
    }
  };
}

function renderLanguageSwitcher(pathname, lang, labels) {
  return `
    <div class="lang-switcher" aria-label="${escapeHtml(labels.languageSwitcher)}">
      <a href="${withLang(pathname, 'en')}"${lang === 'en' ? ' class="is-active"' : ''}>${labels.en}</a>
      <a href="${withLang(pathname, 'uk')}"${lang === 'uk' ? ' class="is-active"' : ''}>${labels.uk}</a>
    </div>
  `;
}

const STORY_STEPS = [
  {
    label: '01',
    title: localized('Welcome visitors with context, not a blank chat bubble', 'Вітайте відвідувачів контекстом, а не порожньою чат-бульбашкою'),
    description: localized('Start the conversation the moment a visitor lands with prompts tied to pricing, quotes, service questions, or sales intent.', 'Починайте розмову в момент заходу на сайт за допомогою підказок, прив’язаних до ціни, прорахунку, сервісних питань або sales intent.'),
    tag: localized('Arrival', 'Старт'),
    score: localized('Engagement +37%', 'Залучення +37%'),
    bullets: [
      localized('Contextual greeting', 'Контекстне привітання'),
      localized('Suggested quick paths', 'Швидкі сценарії входу'),
      localized('Source page attached', 'Сторінка-джерело прикріплена')
    ],
    transcript: [
      { tone: 'assistant', text: localized('Welcome to Northline. Looking for pricing, availability, or a custom quote?', 'Вітаємо в Northline. Вас цікавлять ціни, наявність чи індивідуальний прорахунок?') },
      { tone: 'chip', text: localized('Get pricing', 'Дізнатися ціну') },
      { tone: 'chip', text: localized('Talk to sales', 'Поговорити з sales') },
      { tone: 'chip', text: localized('Ask a question', 'Поставити питання') }
    ]
  },
  {
    label: '02',
    title: localized('Answer repetitive questions instantly with AI', 'Відповідайте на повторювані питання миттєво через AI'),
    description: localized('Handle the common questions in seconds so visitors stay engaged and your team stops repeating the same answers.', 'Закривайте типові питання за секунди, щоб відвідувач не втрачав інтерес, а команда не повторювала одне й те саме.'),
    tag: localized('AI answers', 'AI-відповіді'),
    score: localized('First reply <10s', 'Перша відповідь <10с'),
    bullets: [
      localized('Knowledge-driven answers', 'Відповіді на базі знань'),
      localized('Guided next steps', 'Керовані наступні кроки'),
      localized('Escalation rules ready', 'Правила ескалації готові')
    ],
    transcript: [
      { tone: 'visitor', text: localized('Do you install in New Jersey and what is the usual timeline?', 'Ви монтуєте в Нью-Джерсі і який у вас звичайний таймлайн?') },
      { tone: 'assistant', text: localized('Yes. New Jersey installs usually start within 5 to 7 business days after approval.', 'Так. Монтажі в Нью-Джерсі зазвичай стартують через 5-7 робочих днів після підтвердження.') },
      { tone: 'assistant', text: localized('If you want, I can estimate timing and route this to a specialist.', 'За потреби я можу оцінити терміни й передати запит спеціалісту.') }
    ]
  },
  {
    label: '03',
    title: localized('Capture lead details inside the conversation', 'Збирайте дані ліда прямо в розмові'),
    description: localized('Collect email, phone, project type, timing, or budget when intent is clear, without breaking the flow.', 'Збирайте email, телефон, тип проєкту, таймлайн чи бюджет у момент, коли намір уже зрозумілий, не ламаючи flow.'),
    tag: localized('Lead capture', 'Збір ліда'),
    score: localized('Qualified leads 2.4x', 'Кваліфіковані ліди 2.4x'),
    bullets: [
      localized('Email and phone', 'Email і телефон'),
      localized('Project scope', 'Обсяг проєкту'),
      localized('Timeline and urgency', 'Таймлайн і терміновість')
    ],
    transcript: [
      { tone: 'assistant', text: localized('I can prepare a quote. What is the best email and preferred installation date?', 'Я можу підготувати прорахунок. Який найкращий email і бажана дата монтажу?') },
      { tone: 'visitor', text: localized('julia@oakandco.com. We want to start in early April.', 'julia@oakandco.com. Хочемо стартувати на початку квітня.') },
      { tone: 'system', text: localized('Contact updated: email, timeline, project type.', 'Контакт оновлено: email, таймлайн, тип проєкту.') }
    ]
  },
  {
    label: '04',
    title: localized('Hand off high-intent conversations to an operator', 'Передавайте high-intent розмови оператору'),
    description: localized('Escalate complex or sales-ready chats with the transcript, captured details, and conversation status already attached.', 'Ескалуйте складні або sales-ready чати вже з transcript, captured details і статусом розмови.'),
    tag: localized('Human takeover', 'Передача людині'),
    score: localized('Assisted chats 84%', 'Чати з оператором 84%'),
    bullets: [
      localized('Priority routing', 'Пріоритетний routing'),
      localized('Transcript preserved', 'Transcript збережено'),
      localized('Owner assigned', 'Owner призначено')
    ],
    transcript: [
      { tone: 'system', text: localized('AI routed this conversation to Daria in Sales.', 'AI передав цю розмову Daria у відділ sales.') },
      { tone: 'operator', text: localized('Hi Julia, I have your project details. I can confirm pricing options and available install windows.', 'Вітаю, Julia. Я вже бачу деталі вашого проєкту і можу підтвердити варіанти цін та доступні вікна монтажу.') },
      { tone: 'visitor', text: localized('Perfect. We need a fast turnaround and two location options.', 'Чудово. Нам потрібен швидкий запуск і два варіанти локацій.') }
    ]
  },
  {
    label: '05',
    title: localized('Keep the full context in one shared inbox', 'Тримайте весь контекст в одному shared inbox'),
    description: localized('Operators work from one queue with site source, ownership, notes, and customer history visible in the same workflow.', 'Оператори працюють з однієї черги, де в одному workflow видно джерело сайту, owner, нотатки та історію клієнта.'),
    tag: localized('Shared inbox', 'Спільний inbox'),
    score: localized('Context retained 100%', 'Контекст збережено 100%'),
    bullets: [
      localized('Shared queue', 'Спільна черга'),
      localized('Internal notes', 'Внутрішні нотатки'),
      localized('Multi-site visibility', 'Видимість по кількох сайтах')
    ],
    transcript: [
      { tone: 'system', text: localized('Assigned to Daria. Priority: High. Source: main website.', 'Призначено Daria. Пріоритет: високий. Джерело: основний сайт.') },
      { tone: 'operator', text: localized('Added note: customer requested install before April 12.', 'Додано нотатку: клієнт просить монтаж до 12 квітня.') },
      { tone: 'system', text: localized('Follow-up reminder scheduled for tomorrow.', 'Нагадування на follow-up заплановане на завтра.') }
    ]
  },
  {
    label: '06',
    title: localized('Track intent, performance, and follow-up', 'Відстежуйте намір, ефективність і follow-up'),
    description: localized('Measure which pages convert, which conversations qualify, and where follow-up slows across sites, campaigns, and operators.', 'Вимірюйте, які сторінки конвертують, які розмови кваліфікуються і де follow-up сповільнюється між сайтами, кампаніями й операторами.'),
    tag: localized('Analytics', 'Аналітика'),
    score: localized('Full-funnel visibility', 'Повна видимість воронки'),
    bullets: [
      localized('Lead intent tracking', 'Відстеження наміру ліда'),
      localized('Page attribution', 'Атрибуція сторінок'),
      localized('Operator and SLA insight', 'Аналітика оператора й SLA')
    ],
    transcript: [
      { tone: 'system', text: localized('Lead moved to Qualified. Source page: /services/custom-installation.', 'Лід переведено в Qualified. Джерело: /services/custom-installation.') },
      { tone: 'system', text: localized('Automation triggered a reminder for tomorrow at 10:00.', 'Автоматизація створила нагадування на завтра о 10:00.') },
      { tone: 'system', text: localized('Qualified conversation added to weekly performance report.', 'Кваліфіковану розмову додано до щотижневого performance report.') }
    ]
  }
];

const CAPABILITIES = [
  {
    title: localized('AI response and qualification', 'AI-відповідь і кваліфікація'),
    text: localized('Respond instantly, answer routine questions, and move the visitor toward the next step without losing momentum.', 'Відповідайте миттєво, закривайте типові питання і ведіть відвідувача до наступного кроку без втрати темпу.'),
    points: [
      localized('Context-aware greeting', 'Привітання з урахуванням контексту'),
      localized('Intent-based prompts', 'Підказки на основі наміру'),
      localized('Fast qualification path', 'Швидкий шлях кваліфікації')
    ]
  },
  {
    title: localized('Shared inbox and contact record', 'Shared inbox і контактний запис'),
    text: localized('Keep the conversation, owner, source page, captured details, and internal notes in one working view.', 'Тримайте розмову, owner, сторінку-джерело, captured details і внутрішні нотатки в одному робочому вигляді.'),
    points: [
      localized('Operator ownership', 'Owner для оператора'),
      localized('Structured contact profile', 'Структурований контактний профіль'),
      localized('Source and status preserved', 'Джерело і статус збережені')
    ]
  },
  {
    title: localized('Automation and follow-up discipline', 'Автоматизація і дисципліна follow-up'),
    text: localized('Assign, tag, remind, and escalate automatically so qualified demand keeps moving after the first response.', 'Призначайте, тегуйте, нагадуйте й ескалуйте автоматично, щоб кваліфікований попит не зупинявся після першої відповіді.'),
    points: [
      localized('Assignment rules', 'Правила призначення'),
      localized('Follow-up reminders', 'Нагадування на follow-up'),
      localized('Multi-site workflows', 'Workflow для кількох сайтів')
    ]
  }
];

const DEMO_VIEWS = [
  {
    key: 'widget',
    label: localized('Chat widget', 'Чат-віджет'),
    title: localized('A website assistant that feels native to the page', 'Асистент для сайту, який відчувається частиною сторінки'),
    description: localized('Use contextual prompts, fast answers, and lead capture moments that feel like part of the customer journey, not a bolted-on widget.', 'Використовуйте контекстні підказки, швидкі відповіді і моменти збору ліда, які виглядають частиною шляху клієнта, а не навішаним віджетом.'),
    metrics: [
      [localized('Prompt completion', 'Завершення prompt'), '68%'],
      [localized('Avg. reply time', 'Сер. час відповіді'), '6s'],
      [localized('Qualified rate', 'Частка qualified'), '+31%']
    ],
    rail: [
      localized('Greeting logic', 'Логіка привітання'),
      localized('Quick reply paths', 'Швидкі гілки відповіді'),
      localized('Capture trigger', 'Тригер збору')
    ],
    rows: [
      [localized('Greeting', 'Привітання'), localized('Pricing / quote / human help', 'Ціни / прорахунок / людина')],
      [localized('Capture', 'Збір'), localized('Email and timeline', 'Email і таймлайн')],
      [localized('State', 'Стан'), localized('AI active', 'AI активний')]
    ],
    scene: [
      [localized('Live greeting', 'Живе привітання'), localized('Pricing, quote, human help', 'Ціни, прорахунок, допомога людини'), 'scene-card--primary scene-card--wide'],
      [localized('Knowledge response', 'Відповідь із бази знань'), localized('Instant FAQ and objections', 'Миттєві FAQ і заперечення'), 'scene-card--soft'],
      [localized('Lead trigger', 'Тригер збору ліда'), localized('Capture email and timeline', 'Збір email і таймлайну'), 'scene-card--accent']
    ]
  },
  {
    key: 'inbox',
    label: localized('Inbox', 'Inbox'),
    title: localized('Operators work from one shared conversation workspace', 'Оператори працюють з одного shared conversation workspace'),
    description: localized('Assignments, notes, SLA visibility, site filters, and full AI context keep human follow-up operational instead of messy.', 'Assignments, нотатки, видимість SLA, site filters і повний AI-контекст роблять людський follow-up операційним, а не хаотичним.'),
    metrics: [
      [localized('High-intent open', 'Відкрито high-intent'), '12'],
      [localized('Resolution time', 'Час вирішення'), '19m'],
      [localized('SLA met', 'SLA виконано'), '94%']
    ],
    rail: [
      localized('Priority queue', 'Пріоритетна черга'),
      localized('Owner and status', 'Owner і статус'),
      localized('Internal notes', 'Внутрішні нотатки')
    ],
    rows: [
      [localized('Owner', 'Owner'), 'Daria · Sales'],
      [localized('Priority', 'Пріоритет'), localized('High intent', 'Високий намір')],
      [localized('Next step', 'Наступний крок'), localized('Quote follow-up', 'Follow-up по пропозиції')]
    ],
    scene: [
      [localized('Queue overview', 'Огляд черги'), localized('High-intent conversations first', 'High-intent розмови першими'), 'scene-card--primary scene-card--wide'],
      [localized('Assignment panel', 'Панель призначення'), localized('Operator and due time', 'Оператор і дедлайн'), 'scene-card--soft'],
      [localized('Team note', 'Нотатка команди'), localized('Quote requested before Friday', 'Пропозицію просять до п’ятниці'), 'scene-card--accent']
    ]
  },
  {
    key: 'contact',
    label: localized('Contact profile', 'Контактний профіль'),
    title: localized('Every conversation becomes a usable contact record', 'Кожна розмова стає повноцінним контактним записом'),
    description: localized('Keep identity, source, budget, timeline, and message history together so operators can move the conversation forward without re-discovery.', 'Тримайте identity, source, budget, timeline та історію повідомлень разом, щоб оператор міг рухати розмову вперед без повторного discovery.'),
    metrics: [
      [localized('Known contacts', 'Відомі контакти'), '1,284'],
      [localized('Profiles enriched', 'Профілі збагачено'), '82%'],
      [localized('Repeat chats', 'Повторні чати'), '27%']
    ],
    rail: [
      localized('Identity fields', 'Поля ідентичності'),
      localized('Conversation history', 'Історія розмов'),
      localized('Source and tags', 'Джерело і теги')
    ],
    rows: [
      [localized('Contact', 'Контакт'), localized('Julia at Oak & Co.', 'Julia в Oak & Co.')],
      [localized('Source', 'Джерело'), '/pricing'],
      [localized('Intent', 'Намір'), localized('Commercial quote', 'Комерційний прорахунок')]
    ],
    scene: [
      [localized('Structured profile', 'Структурований профіль'), localized('Email, phone, company, scope', 'Email, телефон, компанія, scope'), 'scene-card--primary scene-card--wide'],
      [localized('Intent tags', 'Теги наміру'), localized('Budget, urgency, fit', 'Бюджет, терміновість, fit'), 'scene-card--soft'],
      [localized('History', 'Історія'), localized('Previous chats and notes', 'Попередні чати і нотатки'), 'scene-card--accent']
    ]
  },
  {
    key: 'analytics',
    label: localized('Analytics', 'Аналітика'),
    title: localized('Measure conversation performance like a revenue system', 'Вимірюйте ефективність розмов як дохідну систему'),
    description: localized('Track qualified volume, source pages, handoff quality, and response trends so chat becomes measurable, not anecdotal.', 'Відстежуйте обсяг qualified, source pages, якість handoff і тренди відповіді, щоб чат став вимірюваним, а не anecdotal.'),
    metrics: [
      [localized('Qualified convos', 'Qualified розмови'), '214'],
      [localized('Missed intent', 'Втрачений намір'), '-42%'],
      [localized('Top source page', 'Топ-сторінка джерела'), '/pricing']
    ],
    rail: [
      localized('Qualification trend', 'Тренд кваліфікації'),
      localized('Page attribution', 'Атрибуція сторінок'),
      localized('Operator performance', 'Ефективність операторів')
    ],
    rows: [
      [localized('Qualified', 'Qualified'), localized('214 this month', '214 цього місяця')],
      [localized('Top source', 'Топ-джерело'), '/pricing'],
      [localized('SLA health', 'SLA health'), localized('94% met', '94% виконано')]
    ],
    scene: [
      [localized('Pipeline view', 'Вигляд воронки'), localized('Qualified to closed', 'Від qualified до closed'), 'scene-card--primary scene-card--wide'],
      [localized('Page attribution', 'Атрибуція сторінок'), localized('Top converting traffic paths', 'Траєкторії трафіку з найкращою конверсією'), 'scene-card--soft'],
      [localized('Response trend', 'Тренд відповіді'), localized('Speed and team health', 'Швидкість і здоров’я команди'), 'scene-card--accent']
    ]
  },
  {
    key: 'automation',
    label: localized('Automation', 'Автоматизація'),
    title: localized('Automate routing, reminders, and conversation hygiene', 'Автоматизуйте routing, нагадування і conversation hygiene'),
    description: localized('Use rules to assign, tag, escalate, and follow up so no qualified lead stalls in the inbox.', 'Використовуйте правила для призначення, тегування, ескалації і follow-up, щоб жоден qualified lead не зависав в inbox.'),
    metrics: [
      [localized('Flows active', 'Активні flow'), '18'],
      [localized('Auto-routed', 'Авто-маршрутизовано'), '71%'],
      [localized('Follow-up compliance', 'Дотримання follow-up'), '97%']
    ],
    rail: [
      localized('Rules engine', 'Rules engine'),
      localized('Intent conditions', 'Умови наміру'),
      localized('Follow-up actions', 'Дії follow-up')
    ],
    rows: [
      [localized('Trigger', 'Тригер'), localized('Budget + urgency', 'Бюджет + терміновість')],
      [localized('Action', 'Дія'), localized('Assign and remind', 'Призначити й нагадати')],
      [localized('Status', 'Статус'), localized('Flow live', 'Flow активний')]
    ],
    scene: [
      [localized('Routing logic', 'Логіка routing'), localized('Assign by site, topic, or score', 'Призначення за сайтом, темою чи score'), 'scene-card--primary scene-card--wide'],
      [localized('Trigger panel', 'Панель тригерів'), localized('Intent and urgency conditions', 'Умови наміру й терміновості'), 'scene-card--soft'],
      [localized('Reminder queue', 'Черга нагадувань'), localized('Scheduled follow-up actions', 'Заплановані дії follow-up'), 'scene-card--accent']
    ]
  }
];

const USE_CASES = [
  {
    name: localized('Real estate', 'Нерухомість'),
    text: localized('Qualify buyer and seller intent early, answer listing questions fast, and route serious inquiries to the right agent with context attached.', 'Рано кваліфікуйте намір покупця або продавця, швидко відповідайте на питання по об’єктах і передавайте серйозні запити потрібному агенту разом із контекстом.')
  },
  {
    name: localized('Ecommerce', 'Ecommerce'),
    text: localized('Handle product, shipping, and availability questions in real time while recovering shoppers who would otherwise leave.', 'Відповідайте на питання про товар, доставку й наявність у реальному часі та повертайте покупців, які інакше підуть.')
  },
  {
    name: localized('Local services', 'Локальні послуги'),
    text: localized('Capture quote requests after hours, collect job details in chat, and surface urgent leads to operators immediately.', 'Збирайте запити на прорахунок після робочого часу, отримуйте деталі робіт у чаті й одразу показуйте термінові ліди операторам.')
  },
  {
    name: localized('Agencies', 'Агенції'),
    text: localized('Turn discovery chats into usable briefs with scope, budget range, timeline, and ownership already defined.', 'Перетворюйте discovery-чати на usable briefs, де вже визначені scope, budget range, таймлайн і owner.')
  },
  {
    name: localized('Custom manufacturing', 'Кастомне виробництво'),
    text: localized('Guide high-consideration quote conversations, collect specifications, and keep every revision visible in one thread.', 'Проводьте клієнта через quote-розмови з високою складністю, збирайте специфікації і тримайте кожну ревізію видимою в одному thread.')
  }
];

const FAQS = [
  {
    question: localized('Is installation difficult?', 'Чи складно підключити?'),
    answer: localized('No. Add a lightweight embed, then configure the assistant, routing rules, and team workflow for each site.', 'Ні. Додайте легкий embed-код, а потім налаштуйте асистента, routing rules і workflow команди для кожного сайту.')
  },
  {
    question: localized('Can AI hand off a conversation to a person?', 'Чи може AI передати розмову людині?'),
    answer: localized('Yes. High-intent conversations can route directly to an operator with the transcript, captured details, and status preserved.', 'Так. High-intent розмови можуть автоматично переходити оператору зі збереженим transcript, captured details і статусом.')
  },
  {
    question: localized('Can we capture phone, email, and project details in chat?', 'Чи можна збирати телефон, email і деталі проєкту в чаті?'),
    answer: localized('Yes. Collect lead fields inside the conversation when intent is strongest, without pushing visitors into a separate form.', 'Так. Збирайте поля ліда прямо в розмові, коли намір найсильніший, без переведення користувача в окрему форму.')
  },
  {
    question: localized('Can one team manage multiple websites?', 'Чи може одна команда керувати кількома сайтами?'),
    answer: localized('Yes. The platform supports multi-site operations with source tracking, centralized inbox workflows, and shared visibility.', 'Так. Платформа підтримує multi-site роботу з відстеженням джерел, централізованим inbox workflow і спільною видимістю.')
  },
  {
    question: localized('Can the chat experience match our brand?', 'Чи можна адаптувати чат під наш бренд?'),
    answer: localized('Yes. Messaging, prompts, handoff rules, and tone can be configured so the assistant feels native to the site experience.', 'Так. Messaging, prompts, handoff rules і tone можна налаштувати так, щоб асистент відчувався природною частиною сайту.')
  },
  {
    question: localized('Do operators reply from one inbox?', 'Чи відповідають оператори з одного inbox?'),
    answer: localized('Yes. Operators work from one inbox that keeps AI messages, human replies, internal notes, and follow-up actions together.', 'Так. Оператори працюють з одного inbox, де разом зберігаються AI-повідомлення, людські відповіді, внутрішні нотатки і дії follow-up.')
  }
];

function renderStoryStep(step, index, lang, copy) {
  return `
    <article class="story-step${index === 0 ? ' is-active' : ''}" data-story-step="${index}" data-reveal>
      <div class="story-step-index">${copy.labels.storyStep} ${step.label}</div>
      <h3>${pick(step.title, lang)}</h3>
      <p>${pick(step.description, lang)}</p>
      <ul class="story-step-list">
        ${step.bullets.map((bullet) => `<li>${pick(bullet, lang)}</li>`).join('')}
      </ul>
    </article>
  `;
}

function renderStoryPanel(step, index, lang, copy) {
  return `
    <div class="story-visual-panel${index === 0 ? ' is-active' : ''}" data-story-panel="${index}">
      <div class="story-scene">
        <div class="story-scene-header">
          <span>${pick(step.tag, lang)}</span>
          <strong>${pick(step.score, lang)}</strong>
        </div>
        <div class="story-scene-grid">
          ${step.bullets.map((bullet, bulletIndex) => `
            <div class="scene-card${bulletIndex === 0 ? ' scene-card--primary scene-card--wide' : bulletIndex === 2 ? ' scene-card--accent' : ' scene-card--soft'}">
              <div class="scene-card-top">
                <span>${bulletIndex === 0 ? copy.labels.primaryState : bulletIndex === 1 ? copy.labels.context : copy.labels.output}</span>
                <em>${pick(step.tag, lang)}</em>
              </div>
              <strong>${pick(bullet, lang)}</strong>
              <p>${bulletIndex === 0 ? (lang === 'uk' ? 'Взаємодія, яку бачить відвідувач, помітна одразу.' : 'Visitor-facing interaction is visible immediately.') : bulletIndex === 1 ? (lang === 'uk' ? 'Допоміжні дані залишаються прив’язаними до thread.' : 'Supporting data stays attached to the thread.') : (lang === 'uk' ? 'Наступна дія для команди чітко визначена.' : 'The next action is clear to the team.')}</p>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="story-chat-card">
        <div class="story-chat-top">
          <div>
            <strong>${pick(step.title, lang)}</strong>
            <span>${copy.labels.conversationThread}</span>
          </div>
          <em>${pick(step.score, lang)}</em>
        </div>
        <div class="story-chat-meta">
          <span>${copy.labels.siteSource}: /pricing</span>
          <span>${copy.labels.owner}: Daria</span>
        </div>
        <div class="story-chat-stream">
          ${step.transcript.map((message) => `<div class="message-bubble ${message.tone}">${pick(message.text, lang)}</div>`).join('')}
        </div>
      </div>
      <aside class="story-metric-card">
        <div class="metric-stat">${pick(step.score, lang)}</div>
        <div class="metric-grid">
          <div><span>${copy.labels.intentScore}</span><strong>92</strong></div>
          <div><span>${copy.labels.source}</span><strong>/pricing</strong></div>
          <div><span>${copy.labels.owner}</span><strong>Daria</strong></div>
          <div><span>${copy.labels.status}</span><strong>${copy.labels.qualified}</strong></div>
        </div>
      </aside>
    </div>
  `;
}

function renderCapability(capability, index, lang, copy) {
  const classes = ['capability-card'];
  if (index === 0) classes.push('capability-card--featured');

  return `
    <article class="${classes.join(' ')}" data-reveal>
      <span class="capability-eyebrow">${copy.labels.capability} ${String(index + 1).padStart(2, '0')}</span>
      <h3>${pick(capability.title, lang)}</h3>
      <p>${pick(capability.text, lang)}</p>
      <div class="capability-points">
        ${capability.points.map((point) => `<span>${pick(point, lang)}</span>`).join('')}
      </div>
    </article>
  `;
}

function renderDemoView(view, index, lang, copy) {
  return `
    <div class="demo-panel${index === 0 ? ' is-active' : ''}" data-demo-panel="${view.key}">
      <div class="demo-copy">
        <span class="section-pill">${copy.labels.productView}</span>
        <h3>${pick(view.title, lang)}</h3>
        <p>${pick(view.description, lang)}</p>
        <div class="demo-metrics">
          ${view.metrics.map(([label, value]) => `
            <div class="demo-metric">
              <span>${pick(label, lang)}</span>
              <strong>${value}</strong>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="demo-visual">
        <div class="demo-rail">
          <div class="demo-rail-label">${pick(view.label, lang)}</div>
          ${view.rail.map((item) => `<div class="demo-rail-item">${pick(item, lang)}</div>`).join('')}
        </div>
        <div class="demo-stage">
          <div class="demo-stage-top">
            <strong>${pick(view.label, lang)}</strong>
            <span>${copy.labels.operationalView}</span>
          </div>
          <div class="demo-stage-subhead">
            <span>${copy.labels.primaryState}</span>
            <span>${copy.labels.realWorkflowContext}</span>
          </div>
          <div class="demo-stage-grid">
            ${view.scene.map(([title, text, className]) => `
              <div class="scene-card ${className}">
                <div class="scene-card-top">
                  <span>${className.includes('primary') ? copy.labels.primaryPanel : className.includes('accent') ? copy.labels.action : copy.labels.context}</span>
                  <em>${pick(view.label, lang)}</em>
                </div>
                <strong>${pick(title, lang)}</strong>
                <p>${pick(text, lang)}</p>
              </div>
            `).join('')}
          </div>
          <div class="demo-stage-list">
            ${view.rows.map(([label, value]) => `
              <div class="demo-stage-row">
                <span>${pick(label, lang)}</span>
                <strong>${pick(value, lang)}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderFaqItem(item, index, lang) {
  return `
    <article class="faq-item${index === 0 ? ' is-open' : ''}" data-reveal>
      <button class="faq-trigger" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}">
        <span>${pick(item.question, lang)}</span>
        <span class="faq-plus"></span>
      </button>
      <div class="faq-answer">
        <p>${pick(item.answer, lang)}</p>
      </div>
    </article>
  `;
}

function renderHomePage({ lang } = {}) {
  const resolvedLang = lang === 'uk' ? 'uk' : 'en';
  const copy = getHomeCopy(resolvedLang);
  return `<!doctype html>
<html lang="${resolvedLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(copy.meta.title)}</title>
    <meta
      name="description"
      content="${escapeHtml(copy.meta.description)}"
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
          display: flex;
        }
        .header-actions .button {
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
          <a href="/" class="brand" aria-label="${escapeHtml(copy.labels.homeAria)}">
            <span class="brand-mark">CP</span>
            <span class="brand-copy">
              Chat Platform
              <small>${escapeHtml(copy.brandTagline)}</small>
            </span>
          </a>
          <nav class="nav-links" aria-label="${escapeHtml(copy.labels.primaryNav)}">
            <a href="/product">${copy.nav.product}</a>
            <a href="/use-cases">${copy.nav.useCases}</a>
            <a href="/pricing">${copy.nav.pricing}</a>
            <a href="/faq">${copy.nav.faq}</a>
            <a href="/demo">${copy.nav.demo}</a>
          </nav>
          <div class="header-actions">
            ${renderLanguageSwitcher('/', resolvedLang, copy.labels)}
            <a class="button button-secondary" href="/product">${copy.nav.productTour}</a>
            <a class="button button-primary" href="/demo">${copy.nav.bookDemo}</a>
          </div>
        </div>
      </header>

      <main>
        <section class="hero section">
          <div class="container hero-grid">
            <div class="hero-copy" data-reveal>
              <span class="eyebrow">${copy.hero.eyebrow}</span>
              <h1>${copy.hero.title}</h1>
              <p>${copy.hero.description}</p>
              <div class="hero-meta">
                ${copy.hero.meta.map((item) => `<span>${item}</span>`).join('')}
              </div>
              <div class="hero-actions">
                <a class="button button-primary" href="/demo">${copy.nav.bookDemo}</a>
                <a class="button button-secondary" href="/product">${copy.nav.seeProduct}</a>
              </div>
              <div class="hero-action-note">${copy.hero.note}</div>
              <div class="hero-proof">
                ${copy.hero.proof.map(([title, text]) => `
                  <div class="proof-chip">
                    <strong>${title}</strong>
                    <span>${text}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="hero-visual" data-reveal>
              <div class="hero-frame">
                <div class="window-bar"><span></span><span></span><span></span></div>
                <div class="hero-shell">
                  <div class="hero-nav">
                    <strong>${copy.hero.scene.workspaceNav[0]}</strong>
                    <div class="hero-nav-item is-active">${copy.hero.scene.workspaceNav[1]}</div>
                    <div class="hero-nav-item">${copy.hero.scene.workspaceNav[2]}</div>
                    <div class="hero-nav-item">${copy.hero.scene.workspaceNav[3]}</div>
                    <div class="hero-nav-item">${copy.hero.scene.workspaceNav[4]}</div>
                  </div>
                  <div class="hero-stage">
                  <div class="hero-stage-top">
                    <div>
                        <strong>${copy.hero.scene.leadTitle}</strong>
                        <div class="mini-label">${copy.hero.scene.leadMeta}</div>
                      </div>
                      <span class="hero-status">${copy.hero.scene.liveHandoff}</span>
                    </div>
                    <div class="hero-toolbar">
                      <strong>${copy.hero.scene.qualified}</strong>
                      <span>${copy.hero.scene.source}</span>
                    </div>
                    <div class="hero-messages">
                      <div class="message-bubble assistant">${copy.hero.scene.messages[0]}</div>
                      <div class="message-bubble visitor">${copy.hero.scene.messages[1]}</div>
                      <div class="message-bubble assistant">${copy.hero.scene.messages[2]}</div>
                      <div class="message-bubble operator">${copy.hero.scene.messages[3]}</div>
                    </div>
                    <div class="hero-insights">
                      ${copy.hero.scene.insights.map(([label, value]) => `
                        <div class="insight-card"><span>${label}</span><strong>${value}</strong></div>
                      `).join('')}
                    </div>
                  </div>
                </div>
              </div>

              <div class="hero-aside">
                <div class="hero-aside-body">
                  <span class="mini-label">${copy.hero.scene.profileTitle}</span>
                  <div class="hero-profile">
                    ${copy.hero.scene.profileRows.map(([label, value]) => `
                      <div class="profile-row"><span>${label}</span><strong>${value}</strong></div>
                    `).join('')}
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
                <strong>${copy.trust.title}</strong>
                <p>${copy.trust.description}</p>
              </div>
              ${copy.trust.stats.map(([title, text]) => `
                <div class="trust-stat">
                  <strong>${title}</strong>
                  <span>${text}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </section>

        <section class="section" id="story">
          <div class="container">
            <div class="section-head" data-reveal>
              <span class="section-pill">${copy.sections.story.pill}</span>
              <h2>${copy.sections.story.title}</h2>
              <p>${copy.sections.story.text}</p>
            </div>
            <div class="story-layout">
              <div class="story-rail">
                ${STORY_STEPS.map((step, index) => renderStoryStep(step, index, resolvedLang, copy)).join('')}
              </div>
              <div class="story-visual-stack">
                ${STORY_STEPS.map((step, index) => renderStoryPanel(step, index, resolvedLang, copy)).join('')}
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="section-head" data-reveal>
              <span class="section-pill">${copy.sections.problem.pill}</span>
              <h2>${copy.sections.problem.title}</h2>
              <p>${copy.sections.problem.text}</p>
            </div>
            <div class="problem-grid">
              ${(resolvedLang === 'uk'
                ? [
                    ['Відвідувачі йдуть до відповіді команди', 'Покупці з високим наміром відпадають, коли перша відповідь повністю залежить від доступності оператора.'],
                    ['Ліди розсипаються між інструментами', 'Повідомлення, контакти й дії follow-up розриваються, коли форми, чат та inbox існують окремо.'],
                    ['Оператори повторюють ті самі відповіді', 'Команда витрачає час на рутинні питання замість розмов, де справді потрібна людина.'],
                    ['Ніхто не бачить, що реально конвертує', 'Без атрибуції та tracking наміру чат стає активністю, а не вимірюваним джерелом pipeline.']
                  ]
                : [
                    ['Visitors leave before anyone responds', 'High-intent buyers bounce when the first response depends entirely on operator availability.'],
                    ['Leads get scattered across tools', 'Messages, contact details, and follow-up actions break apart when forms, chat, and inboxes are separate.'],
                    ['Operators repeat the same answers', 'Teams waste time on repetitive questions instead of stepping into the conversations that actually need a person.'],
                    ['No one can see what converts', 'Without attribution and intent tracking, chat becomes activity, not a measurable source of pipeline.']
                  ]).map(([title, text]) => `
                    <article data-reveal>
                      <strong>${title}</strong>
                      <p>${text}</p>
                    </article>
                  `).join('')}
            </div>
          </div>
        </section>

        <section class="section" id="capabilities">
          <div class="container capability-layout">
            <div class="capability-intro" data-reveal>
              <span class="section-pill">${copy.sections.capabilities.pill}</span>
              <h2>${copy.sections.capabilities.title}</h2>
              <p>${copy.sections.capabilities.text}</p>
              <div class="capability-intro-grid">
                ${copy.sections.capabilities.intro.map(([title, text]) => `<div><strong>${title}</strong><span>${text}</span></div>`).join('')}
              </div>
            </div>
            <div class="capability-stack">
              ${CAPABILITIES.map((capability, index) => renderCapability(capability, index, resolvedLang, copy)).join('')}
            </div>
          </div>
        </section>

        <section class="section" id="product">
          <div class="container">
            <div class="section-head" data-reveal>
              <span class="section-pill">${copy.sections.demo.pill}</span>
              <h2>${copy.sections.demo.title}</h2>
              <p>${copy.sections.demo.text}</p>
            </div>
            <div class="demo-shell" data-reveal>
              <div class="demo-tabs" role="tablist" aria-label="${escapeHtml(copy.labels.productViews)}">
                ${DEMO_VIEWS.map((view, index) => `
                  <button
                    class="demo-tab${index === 0 ? ' is-active' : ''}"
                    type="button"
                    role="tab"
                    aria-selected="${index === 0 ? 'true' : 'false'}"
                    data-demo-tab="${view.key}"
                  >${pick(view.label, resolvedLang)}</button>
                `).join('')}
              </div>
              ${DEMO_VIEWS.map((view, index) => renderDemoView(view, index, resolvedLang, copy)).join('')}
            </div>
          </div>
        </section>

        <section class="section" id="industries">
          <div class="container">
            <div class="section-head" data-reveal>
              <span class="section-pill">${copy.sections.industries.pill}</span>
              <h2>${copy.sections.industries.title}</h2>
              <p>${copy.sections.industries.text}</p>
            </div>
            <div class="use-case-grid">
              ${USE_CASES.map((item) => `
                <article class="use-case-card" data-reveal>
                  <h3>${pick(item.name, resolvedLang)}</h3>
                  <p>${pick(item.text, resolvedLang)}</p>
                </article>
              `).join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container roi-layout">
            <div class="roi-card" data-reveal>
              <span class="section-pill">${copy.sections.roi.pill}</span>
              <h3>${copy.sections.roi.title}</h3>
              <p>${copy.sections.roi.text}</p>
              <div class="roi-matrix">
                ${(resolvedLang === 'uk'
                  ? [
                      ['Швидша перша відповідь', 'AI закриває response gap у момент заходу на сайт.'],
                      ['Більше qualified розмов', 'Дані ліда збираються в правильний момент прямо в чаті.'],
                      ['Сильніша дисципліна follow-up', 'Owner, нагадування і статус лишаються видимими по всьому workflow.'],
                      ['Чіткіша атрибуція', 'Видно, які сторінки, наміри й оператори реально дають результат.']
                    ]
                  : [
                      ['Faster first response', 'AI closes the response gap the moment a visitor lands.'],
                      ['More qualified conversations', 'Lead details are captured at the right moment inside the chat.'],
                      ['Stronger follow-up discipline', 'Ownership, reminders, and status stay visible across the workflow.'],
                      ['Clearer attribution', 'See which pages, intents, and operators actually drive outcomes.']
                    ]).map(([title, text]) => `
                      <article>
                        <strong>${title}</strong>
                        <p>${text}</p>
                      </article>
                    `).join('')}
              </div>
            </div>
            <div class="roi-scoreboard" data-reveal>
              ${(
                resolvedLang === 'uk'
                  ? [
                      ['Середня перша відповідь', '6 секунд'],
                      ['Втрачений намір ліда', '-42%'],
                      ['Частка qualified lead', '+31%'],
                      ['Покриття SLA операторів', '94%']
                    ]
                  : [
                      ['Average first response', '6 seconds'],
                      ['Missed lead intent', '-42%'],
                      ['Qualified lead rate', '+31%'],
                      ['Operator SLA coverage', '94%']
                    ]
              ).map(([label, value]) => `<div class="score-row"><span>${label}</span><strong>${value}</strong></div>`).join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container proof-layout">
            <div class="proof-card" data-reveal>
              <span class="section-pill">${copy.sections.proof.pill}</span>
              <h3>${copy.sections.proof.title}</h3>
              <p>${copy.sections.proof.text}</p>
              <div class="proof-grid">
                ${(resolvedLang === 'uk'
                  ? [
                      ['Операційно зрозуміло', 'AI, оператори, контакти й follow-up живуть в одному передбачуваному workflow.'],
                      ['Готово до кількох сайтів', 'Відстеження джерел і централізований inbox підтримують multi-site ріст.'],
                      ['Легко запустити', 'Додайте віджет, налаштуйте flows і швидко стартуйте маршрутизацію розмов.'],
                      ['Business-first дизайн', 'Побудовано для capture, qualification і progress попиту, а не просто для показу чат-активності.']
                    ]
                  : [
                      ['Operationally clear', 'AI, operators, contacts, and follow-up live in one predictable workflow.'],
                      ['Ready for multiple sites', 'Source tracking and centralized inbox logic support multi-site growth.'],
                      ['Easy to deploy', 'Add the widget, configure flows, and start routing conversations quickly.'],
                      ['Business-first design', 'Built to capture, qualify, and progress demand instead of just displaying chat activity.']
                    ]).map(([title, text]) => `
                      <article>
                        <strong>${title}</strong>
                        <p>${text}</p>
                      </article>
                    `).join('')}
              </div>
              <div class="proof-note">${resolvedLang === 'uk' ? 'Коли пізніше з’являться реальні логотипи клієнтів чи testimonials, цей блок легко їх вбере без зміни загальної структури.' : 'If you later add customer logos or real testimonials, this section can absorb them without changing the overall structure.'}</div>
            </div>
            <div class="proof-card" data-reveal>
              <span class="section-pill">${copy.sections.proof.buyersPill}</span>
              <h3>${copy.sections.proof.buyersTitle}</h3>
              <p>${copy.sections.proof.buyersText}</p>
            </div>
          </div>
        </section>

        <section class="section" id="faq">
          <div class="container">
            <div class="section-head" data-reveal>
              <span class="section-pill">${copy.sections.faq.pill}</span>
              <h2>${copy.sections.faq.title}</h2>
              <p>${copy.sections.faq.text}</p>
            </div>
            <div class="faq-grid">
              ${FAQS.map((item, index) => renderFaqItem(item, index, resolvedLang)).join('')}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="final-cta" data-reveal>
              <div>
                <span class="section-pill">${copy.sections.cta.pill}</span>
                <h2>${copy.sections.cta.title}</h2>
                <p>${copy.sections.cta.text}</p>
              </div>
              <div class="final-cta-actions">
                <a class="button button-primary" href="/demo">${copy.nav.bookDemo}</a>
                <a class="button button-secondary" href="/pricing">${copy.nav.reviewPricing}</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="container footer-grid">
          <div class="footer-brand">
            <span>Chat Platform</span>
            <p>${copy.footer.summary}</p>
            ${renderLanguageSwitcher('/', resolvedLang, copy.labels)}
          </div>
          <div class="footer-col">
            <strong>${copy.footer.product}</strong>
            <a href="/product">${copy.nav.product}</a>
            <a href="/use-cases">${copy.nav.useCases}</a>
            <a href="/pricing">${copy.nav.pricing}</a>
          </div>
          <div class="footer-col">
            <strong>${copy.footer.explore}</strong>
            <a href="/faq">${copy.nav.faq}</a>
            <a href="/demo">${copy.nav.demo}</a>
            <a href="/inbox">${copy.labels.workspace}</a>
          </div>
          <div class="footer-col">
            <strong>${copy.footer.why}</strong>
            <p>${copy.footer.whyText}</p>
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
