function renderInboxPage() {
  return `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chat Inbox</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #eef3fb;
        --panel: rgba(255, 255, 255, 0.96);
        --panel-soft: #f8fbff;
        --panel-muted: #f4f7fc;
        --border: #d7dfef;
        --text: #1b2437;
        --muted: #6a748a;
        --muted-soft: #8f97aa;
        --accent: #1f6fff;
        --accent-soft: #eaf2ff;
        --accent-border: rgba(31, 111, 255, 0.2);
        --warning-soft: #fff4e8;
        --success-soft: #eef9f2;
        --shadow: 0 18px 44px rgba(26, 35, 57, 0.08);
      }
      * { box-sizing: border-box; }
      html, body {
        height: 100%;
      }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(31, 111, 255, 0.08), transparent 28%),
          linear-gradient(180deg, #f6f9ff 0%, var(--bg) 100%);
        overflow: hidden;
      }
      button, input, select, textarea {
        font: inherit;
      }
      button {
        border: 0;
        border-radius: 12px;
        padding: 10px 13px;
        cursor: pointer;
        transition: transform 0.14s ease, background-color 0.14s ease, border-color 0.14s ease;
      }
      button:hover {
        transform: translateY(-1px);
      }
      .layout {
        display: grid;
        grid-template-columns: 264px minmax(480px, 1fr) 328px;
        gap: 16px;
        height: calc(100vh - 24px);
        min-height: 0;
        max-width: 1520px;
        margin: 12px auto;
        padding: 0 12px;
        align-items: stretch;
      }
      .panel {
        min-width: 0;
        min-height: 0;
        height: 100%;
        background: var(--panel);
        border: 1px solid rgba(215, 223, 239, 0.94);
        border-radius: 24px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(12px);
        overflow: hidden;
      }
      .sidebar,
      .contacts-panel,
      .chat-panel {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
      }
      .sidebar-head,
      .chat-head,
      .contacts-head {
        flex-shrink: 0;
        padding: 16px 18px;
        border-bottom: 1px solid var(--border);
      }
      .sidebar-head h1,
      .chat-title-row h2,
      .contacts-head h3 {
        margin: 0;
        font-size: 17px;
        line-height: 1.2;
      }
      .nav-row {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      .nav-row a {
        text-decoration: none;
        color: var(--muted);
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 6px 11px;
        font-size: 12px;
        font-weight: 700;
        background: #fff;
      }
      .nav-row a.active {
        color: var(--accent);
        border-color: var(--accent-border);
        background: var(--accent-soft);
      }
      .toolbar {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }
      .toolbar input,
      .toolbar select,
      .reply-box textarea,
      .reply-box input,
      .contacts-panel input,
      .contacts-panel textarea,
      .contacts-panel select {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 9px 11px;
        background: #fff;
        color: var(--text);
      }
      .toolbar input::placeholder,
      .contacts-panel input::placeholder,
      .contacts-panel textarea::placeholder {
        color: var(--muted-soft);
      }
      .toolbar-row {
        display: grid;
        grid-template-columns: 1fr 112px;
        gap: 8px;
      }
      .conversation-list,
      .contacts-list {
        flex: 1;
        min-height: 0;
        overflow: auto;
      }
      .conversation-list {
        padding: 12px;
        display: grid;
        gap: 10px;
      }
      .conversation-group {
        display: grid;
        gap: 8px;
      }
      .conversation-group summary {
        list-style: none;
        cursor: pointer;
      }
      .conversation-group summary::-webkit-details-marker {
        display: none;
      }
      .conversation-group-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 2px 4px;
        font-size: 11px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--muted-soft);
        font-weight: 800;
      }
      .conversation-group-label::after {
        content: '▾';
        transition: transform 0.14s ease;
      }
      .conversation-group:not([open]) .conversation-group-label::after {
        transform: rotate(-90deg);
      }
      .conversation-group-items {
        display: grid;
        gap: 8px;
      }
      .conversation-item {
        width: 100%;
        text-align: left;
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 12px;
        background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
      }
      .conversation-item:hover {
        border-color: rgba(31, 111, 255, 0.18);
      }
      .conversation-item.active {
        border-color: var(--accent-border);
        background: linear-gradient(180deg, #eff5ff 0%, #f8fbff 100%);
        box-shadow: inset 0 0 0 1px rgba(31, 111, 255, 0.08);
      }
      .conversation-item.closed {
        background: #f5f7fb;
      }
      .conversation-top,
      .conversation-meta,
      .chat-meta,
      .contact-card-top,
      .contact-inline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .conversation-id {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.01em;
      }
      .conversation-title {
        margin-top: 7px;
        font-size: 13px;
        font-weight: 700;
      }
      .last-message {
        margin-top: 6px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .conversation-meta {
        margin-top: 8px;
        color: var(--muted-soft);
        font-size: 11px;
      }
      .badge-row,
      .quick-replies,
      .tag-row,
      .suggestion-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 22px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.01em;
        border: 1px solid transparent;
        background: #eef3ff;
        color: #3352a5;
      }
      .badge.open {
        background: #eef3ff;
        color: #4461a9;
      }
      .badge.ai {
        background: #eef9f2;
        color: #2f8558;
      }
      .badge.human {
        background: #fff4e8;
        color: #b96a1a;
      }
      .badge.closed {
        background: #eceff5;
        color: #5d677f;
      }
      .badge.new {
        background: #eef3ff;
        color: #3550a8;
      }
      .badge.contacted {
        background: #eef9f2;
        color: #216e4c;
      }
      .badge.in_progress {
        background: #fff4e8;
        color: #b96a1a;
      }
      .badge.contact-status-closed,
      .badge.crm-closed {
        background: #edf0f5;
        color: #606c86;
      }
      .badge.lead,
      .badge.client,
      .badge.vip,
      .badge.spam {
        background: #f5f7fb;
        color: #4f5970;
        border-color: rgba(79, 89, 112, 0.08);
      }
      .badge.vip {
        background: #fff4d9;
        color: #9d6a00;
      }
      .badge.spam {
        background: #fff0f0;
        color: #bf4d4d;
      }
      .badge.subtle {
        background: var(--panel-muted);
        color: var(--muted);
      }
      .chat-panel {
        overflow: hidden;
      }
      .chat-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .chat-title-row {
        min-width: 0;
      }
      .chat-title-row p {
        margin: 6px 0 0;
        color: var(--muted);
        font-size: 12px;
      }
      .chat-meta {
        flex-wrap: wrap;
        justify-content: flex-end;
        color: var(--muted);
        font-size: 12px;
      }
      .messages {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background:
          linear-gradient(180deg, rgba(250, 251, 255, 0.9), rgba(245, 248, 255, 0.92));
      }
      .message {
        width: fit-content;
        max-width: min(100%, 680px);
        border: 1px solid rgba(215, 223, 239, 0.92);
        border-radius: 18px;
        padding: 10px 12px;
        background: #fff;
        box-shadow: 0 8px 20px rgba(26, 35, 57, 0.04);
      }
      .message.operator {
        align-self: flex-end;
        background: #eff5ff;
        border-color: #c4d9ff;
      }
      .message.visitor {
        background: #fff9f2;
        border-color: rgba(247, 140, 47, 0.18);
      }
      .message.ai {
        background: #fbfdff;
      }
      .message.system {
        align-self: center;
        max-width: 520px;
        background: #f4f7fb;
      }
      .message-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 6px;
        color: var(--muted-soft);
        font-size: 11px;
      }
      .message-sender {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #4f5b75;
      }
      .message-text {
        font-size: 14px;
        line-height: 1.45;
        word-break: break-word;
      }
      .message-date {
        white-space: nowrap;
      }
      .attachments {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .attachments a {
        color: var(--accent);
        font-size: 12px;
        text-decoration: none;
      }
      .reply-box {
        flex-shrink: 0;
        min-height: 0;
        border-top: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.98);
        padding: 14px 16px 16px;
        display: grid;
        gap: 10px;
      }
      .reply-top {
        display: grid;
        grid-template-columns: 170px 1fr;
        gap: 10px;
      }
      .quick-reply-btn {
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: #fff;
        color: #42506b;
        font-size: 12px;
        font-weight: 700;
      }
      .quick-reply-btn:hover {
        border-color: var(--accent-border);
        color: var(--accent);
      }
      .reply-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }
      .reply-status-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .primary-btn {
        background: var(--accent);
        color: #fff;
      }
      .secondary-btn {
        background: #edf2fb;
        color: #394863;
      }
      .ghost-btn {
        background: #fff;
        border: 1px solid var(--border);
        color: #46526e;
      }
      .contacts-head p,
      .section-head p,
      .contact-meta,
      .contact-field-hint,
      .empty-state {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 12px;
      }
      .contacts-body {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .contacts-current {
        flex-shrink: 0;
        padding: 14px 14px 12px;
        border-bottom: 1px solid var(--border);
        display: grid;
        gap: 12px;
        background: linear-gradient(180deg, rgba(248, 251, 255, 0.96), rgba(255, 255, 255, 0.96));
      }
      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .section-head h4 {
        margin: 0;
        font-size: 14px;
      }
      .info-grid {
        display: grid;
        gap: 8px;
      }
      .info-row,
      .contact-row {
        display: grid;
        grid-template-columns: 78px 1fr;
        gap: 8px;
        align-items: center;
      }
      .info-label,
      .contact-field label {
        color: var(--muted-soft);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .info-value {
        min-height: 20px;
        font-size: 13px;
        color: var(--text);
      }
      .info-value.empty {
        color: var(--muted-soft);
      }
      .contact-form {
        display: grid;
        gap: 10px;
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: #fff;
      }
      .contact-form-grid {
        display: grid;
        gap: 10px;
      }
      .contact-field {
        display: grid;
        gap: 5px;
      }
      .contact-field textarea {
        min-height: 92px;
        resize: vertical;
      }
      .tag-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .tag-btn {
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--panel-muted);
        color: #48556e;
        font-size: 12px;
        font-weight: 700;
      }
      .tag-btn.active {
        background: var(--accent-soft);
        border-color: var(--accent-border);
        color: var(--accent);
      }
      .form-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .suggestion-box {
        border: 1px dashed rgba(31, 111, 255, 0.24);
        border-radius: 16px;
        padding: 10px 11px;
        background: var(--accent-soft);
      }
      .suggestion-title {
        font-size: 12px;
        font-weight: 800;
        margin-bottom: 6px;
      }
      .contact-inline {
        padding: 9px 10px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: #fff;
      }
      .contact-inline strong {
        font-size: 13px;
      }
      .contact-inline small {
        display: block;
        margin-top: 3px;
        color: var(--muted);
        font-size: 11px;
      }
      .contacts-list-wrap {
        flex: 0 0 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
      .contacts-search {
        padding: 12px 14px 0;
      }
      .contacts-list {
        padding: 12px 14px 14px;
        display: grid;
        gap: 9px;
        overflow: visible;
      }
      .contact-card {
        text-align: left;
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 11px 12px;
        background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
      }
      .contact-card.active {
        border-color: var(--accent-border);
        background: linear-gradient(180deg, #eef5ff 0%, #f9fbff 100%);
      }
      .contact-card strong {
        display: block;
        font-size: 13px;
      }
      .contact-card p {
        margin: 7px 0 0;
        font-size: 12px;
        line-height: 1.35;
        color: var(--muted);
      }
      .contact-card-meta {
        margin-top: 8px;
        color: var(--muted-soft);
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .empty-state {
        padding: 20px 12px;
      }
      .pill-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        padding: 0 7px;
        height: 20px;
        border-radius: 999px;
        background: #fff;
        border: 1px solid var(--border);
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
      }
      .muted-text {
        color: var(--muted);
        font-size: 12px;
      }
      @media (max-width: 1180px) {
        body {
          overflow: auto;
        }
        .layout {
          grid-template-columns: 1fr;
          height: auto;
          max-width: 940px;
          margin: 10px auto 18px;
        }
        .panel {
          height: auto;
          min-height: 280px;
        }
        .contacts-body {
          overflow: visible;
        }
        .chat-panel {
          min-height: 72vh;
        }
        .contacts-panel {
          min-height: 420px;
        }
      }
      @media (max-width: 720px) {
        .layout {
          padding: 0 8px;
          gap: 12px;
        }
        .sidebar-head,
        .chat-head,
        .contacts-head,
        .reply-box,
        .contacts-current {
          padding-left: 14px;
          padding-right: 14px;
        }
        .reply-top {
          grid-template-columns: 1fr;
        }
        .chat-head,
        .section-head,
        .reply-actions {
          align-items: flex-start;
          flex-direction: column;
        }
        .toolbar-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <aside class="panel sidebar">
        <div class="sidebar-head">
          <h1>Operator Inbox</h1>
          <div class="nav-row">
            <a href="/inbox" class="active">Inbox</a>
            <a href="/settings">Settings</a>
          </div>
          <div class="toolbar">
            <input id="searchInput" type="search" placeholder="Пошук по CID, сайту або тексту" />
            <div class="toolbar-row">
              <select id="statusFilter">
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="all">All</option>
              </select>
              <button id="refreshBtn" type="button" class="ghost-btn">Оновити</button>
            </div>
          </div>
        </div>
        <div class="conversation-list" id="conversationList"></div>
      </aside>

      <main class="panel chat-panel">
        <div class="chat-head">
          <div class="chat-title-row">
            <h2 id="conversationTitle">Оберіть діалог</h2>
            <p id="conversationSummary">Messenger-style workspace для оператора.</p>
          </div>
          <div id="conversationMeta" class="chat-meta"></div>
        </div>
        <div class="messages" id="messagesPane">
          <div class="empty-state">Оберіть діалог у списку зліва.</div>
        </div>
        <div class="reply-box">
          <div class="reply-top">
            <input id="operatorName" type="text" value="Operator" placeholder="Ваше ім'я" />
            <div class="quick-replies" id="quickReplies"></div>
          </div>
          <textarea id="replyInput" rows="3" placeholder="Напишіть відповідь оператором..."></textarea>
          <div class="reply-actions">
            <div class="reply-status-actions">
              <button id="sendReplyBtn" type="button" class="primary-btn">Надіслати</button>
              <button id="markOpenBtn" type="button" class="secondary-btn">Open</button>
              <button id="markClosedBtn" type="button" class="secondary-btn">Closed</button>
            </div>
            <div class="muted-text">Enter — надіслати, Shift+Enter — новий рядок</div>
          </div>
        </div>
      </main>

      <aside class="panel contacts-panel">
        <div class="contacts-head">
          <h3>Контакти</h3>
          <p>Міні CRM для поточного діалогу й останніх лідів.</p>
        </div>
        <div class="contacts-body">
          <section class="contacts-current">
            <div class="section-head">
              <div>
                <h4>Поточний відвідувач</h4>
                <p id="currentVisitorHint">Відкрий діалог, щоб побачити дані.</p>
              </div>
              <span id="linkedContactBadge" class="pill-count">0</span>
            </div>

            <div id="contactSuggestion" class="suggestion-box" hidden></div>
            <div id="linkedContactCard"></div>
            <div id="currentVisitorInfo" class="info-grid"></div>

            <div class="form-actions">
              <button id="openSaveContactBtn" type="button" class="primary-btn">Зберегти контакт</button>
              <button id="editLinkedContactBtn" type="button" class="ghost-btn" hidden>Редагувати</button>
            </div>

            <form id="contactForm" class="contact-form" hidden>
              <div class="contact-form-grid">
                <div class="contact-field">
                  <label for="contactNameInput">Name</label>
                  <input id="contactNameInput" type="text" placeholder="Ім'я" />
                </div>
                <div class="contact-field">
                  <label for="contactPhoneInput">Phone</label>
                  <input id="contactPhoneInput" type="text" placeholder="+380..." />
                </div>
                <div class="contact-field">
                  <label for="contactTelegramInput">Telegram</label>
                  <input id="contactTelegramInput" type="text" placeholder="@username" />
                </div>
                <div class="contact-field">
                  <label for="contactEmailInput">Email</label>
                  <input id="contactEmailInput" type="email" placeholder="mail@example.com" />
                </div>
                <div class="contact-field">
                  <label for="contactStatusInput">Lead status</label>
                  <select id="contactStatusInput">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div class="contact-field">
                  <label>Tags</label>
                  <div id="contactTags" class="tag-selector"></div>
                </div>
                <div class="contact-field">
                  <label for="contactNotesInput">Comment / Notes</label>
                  <textarea id="contactNotesInput" placeholder="Наприклад: хоче друк деталей авто, попросив відповісти в Telegram..."></textarea>
                </div>
              </div>
              <div class="form-actions">
                <button id="saveContactBtn" type="submit" class="primary-btn">Save Contact</button>
                <button id="cancelContactBtn" type="button" class="secondary-btn">Cancel</button>
              </div>
            </form>
          </section>

          <section class="contacts-list-wrap">
            <div class="contacts-search">
              <input id="contactsSearchInput" type="search" placeholder="Пошук по імені, телефону, email..." />
            </div>
            <div class="contacts-list" id="contactsList"></div>
          </section>
        </div>
      </aside>
    </div>

    <script>
      (function () {
        const CONVERSATIONS_POLL_MS = 8000;
        const OPEN_CONVERSATION_POLL_MS = 4000;
        const QUICK_REPLIES = [
          'Дякуємо! Ми зв’яжемося з вами найближчим часом.',
          'Надішліть, будь ласка, STL файл.',
          'Для точного прорахунку вкажіть розмір деталі.',
          'Напишіть ваш Telegram або телефон.'
        ];
        const CONTACT_TAGS = [
          { value: 'lead', label: 'Lead' },
          { value: 'client', label: 'Client' },
          { value: 'vip', label: 'VIP' },
          { value: 'spam', label: 'Spam' }
        ];

        const state = {
          conversations: [],
          selectedConversationId: '',
          search: '',
          status: 'open',
          selectedConversation: null,
          selectedMessages: [],
          selectedMessagesSignature: '',
          listPollTimer: null,
          conversationPollTimer: null,
          loadingConversations: false,
          loadingConversation: false,
          contacts: [],
          contactsSearch: '',
          loadingContacts: false,
          linkedContact: null,
          detectedContact: null,
          contactDraft: null,
          selectedContactId: '',
          showContactForm: false,
          contactFormDirty: false,
          contactFormConversationId: ''
        };

        const conversationList = document.getElementById('conversationList');
        const messagesPane = document.getElementById('messagesPane');
        const conversationTitle = document.getElementById('conversationTitle');
        const conversationSummary = document.getElementById('conversationSummary');
        const conversationMeta = document.getElementById('conversationMeta');
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const refreshBtn = document.getElementById('refreshBtn');
        const operatorNameInput = document.getElementById('operatorName');
        const replyInput = document.getElementById('replyInput');
        const sendReplyBtn = document.getElementById('sendReplyBtn');
        const markOpenBtn = document.getElementById('markOpenBtn');
        const markClosedBtn = document.getElementById('markClosedBtn');
        const quickReplies = document.getElementById('quickReplies');
        const currentVisitorHint = document.getElementById('currentVisitorHint');
        const linkedContactBadge = document.getElementById('linkedContactBadge');
        const contactSuggestion = document.getElementById('contactSuggestion');
        const linkedContactCard = document.getElementById('linkedContactCard');
        const currentVisitorInfo = document.getElementById('currentVisitorInfo');
        const openSaveContactBtn = document.getElementById('openSaveContactBtn');
        const editLinkedContactBtn = document.getElementById('editLinkedContactBtn');
        const contactForm = document.getElementById('contactForm');
        const contactNameInput = document.getElementById('contactNameInput');
        const contactPhoneInput = document.getElementById('contactPhoneInput');
        const contactTelegramInput = document.getElementById('contactTelegramInput');
        const contactEmailInput = document.getElementById('contactEmailInput');
        const contactStatusInput = document.getElementById('contactStatusInput');
        const contactTags = document.getElementById('contactTags');
        const contactNotesInput = document.getElementById('contactNotesInput');
        const saveContactBtn = document.getElementById('saveContactBtn');
        const cancelContactBtn = document.getElementById('cancelContactBtn');
        const contactsSearchInput = document.getElementById('contactsSearchInput');
        const contactsList = document.getElementById('contactsList');

        function formatDate(value) {
          if (!value) return '';
          const date = new Date(String(value).replace(' ', 'T') + 'Z');
          if (Number.isNaN(date.getTime())) return value;
          return date.toLocaleString('uk-UA');
        }

        function formatShortDate(value) {
          if (!value) return '';
          const date = new Date(String(value).replace(' ', 'T') + 'Z');
          if (Number.isNaN(date.getTime())) return value;
          return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }) + ' ' +
            date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        }

        function parseDateValue(value) {
          if (!value) return null;
          const date = new Date(String(value).replace(' ', 'T') + 'Z');
          return Number.isNaN(date.getTime()) ? null : date;
        }

        function formatDayLabel(dayKey) {
          if (!dayKey) return 'Без дати';
          const date = new Date(dayKey + 'T00:00:00');
          if (Number.isNaN(date.getTime())) return dayKey;
          return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }

        function getConversationDayKey(item) {
          const date = parseDateValue(item && item.lastMessageAt);
          if (!date) return '';
          return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
          ].join('-');
        }

        function getTodayDayKey() {
          const now = new Date();
          return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
          ].join('-');
        }

        function escapeHtml(value) {
          return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function nl2br(value) {
          return escapeHtml(value).replace(/\\n/g, '<br />');
        }

        function normalizePhone(value) {
          return String(value || '').replace(/[^\d+()\\-.\\s]/g, '').trim();
        }

        function normalizeTelegram(value) {
          const clean = String(value || '').trim().replace(/\\s+/g, '');
          if (!clean) return '';
          return clean.charAt(0) === '@' ? clean : '@' + clean.replace(/^@+/, '');
        }

        function normalizeEmail(value) {
          return String(value || '').trim().toLowerCase();
        }

        function uniqueValues(values) {
          return Array.from(new Set((values || []).filter(Boolean)));
        }

        function formatConversationStatus(status) {
          if (status === 'open') return 'Open';
          if (status === 'closed') return 'Closed';
          if (status === 'human') return 'Human';
          if (status === 'ai') return 'AI';
          return 'Open';
        }

        function getConversationStatus(item) {
          if (!item) return 'open';
          if (item.status === 'closed' || item.inboxStatus === 'closed') return 'closed';
          if (item.status === 'human') return 'human';
          if (item.status === 'ai') return 'ai';
          return 'open';
        }

        function getContactStatusLabel(status) {
          if (status === 'contacted') return 'Contacted';
          if (status === 'in_progress') return 'In Progress';
          if (status === 'closed') return 'Closed';
          return 'New';
        }

        function renderBadge(label, tone, extraClass) {
          return '<span class="badge ' + escapeHtml(tone || '') + ' ' + escapeHtml(extraClass || '') + '">' + escapeHtml(label) + '</span>';
        }

        function renderConversationStatusBadge(item) {
          const status = getConversationStatus(item);
          return renderBadge(formatConversationStatus(status), status, '');
        }

        function renderContactStatusBadge(status) {
          return renderBadge(getContactStatusLabel(status), status, status === 'closed' ? 'contact-status-closed' : '');
        }

        function renderTagBadges(tags) {
          return (tags || []).map(function (tag) {
            return renderBadge(String(tag || '').toUpperCase(), tag, '');
          }).join('');
        }

        function isNearBottom(element, threshold) {
          if (!element) return true;
          return (element.scrollHeight - element.scrollTop - element.clientHeight) <= (threshold || 48);
        }

        async function fetchJson(url, options) {
          const response = await fetch(url, options);
          const payload = await response.json();
          if (!response.ok || !payload.ok) {
            throw new Error(payload.message || 'Request failed');
          }
          return payload;
        }

        function buildMessagesSignature(messages) {
          return (messages || []).map(function (message) {
            return [
              message.id || '',
              message.senderType || '',
              message.createdAt || '',
              message.text || '',
              Array.isArray(message.attachments)
                ? message.attachments.map(function (file) {
                    return file.id || file.publicUrl || file.fileName || '';
                  }).join(',')
                : ''
            ].join('|');
          }).join('||');
        }

        function detectName(messages) {
          const visitorTexts = (messages || [])
            .filter(function (message) {
              return message.senderType === 'visitor';
            })
            .map(function (message) {
              return String(message.text || '');
            });

          const patterns = [
            /(?:мене звати|моє ім'?я|я\\s+[-–—:]?\\s*|my name is|i am)\\s+([A-Za-zА-Яа-яІіЇїЄєҐґ' -]{2,40})/i,
            /(?:зватися)\\s+([A-Za-zА-Яа-яІіЇїЄєҐґ' -]{2,40})/i
          ];

          for (let index = 0; index < visitorTexts.length; index += 1) {
            const text = visitorTexts[index];
            for (let patternIndex = 0; patternIndex < patterns.length; patternIndex += 1) {
              const match = text.match(patterns[patternIndex]);
              if (match && match[1]) {
                return String(match[1]).trim().replace(/\\s{2,}/g, ' ');
              }
            }
          }
          return '';
        }

        function detectContactFromMessages(messages) {
          const joined = (messages || [])
            .map(function (message) {
              return String(message.text || '');
            })
            .join('\\n');
          const emails = uniqueValues((joined.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/ig) || []).map(normalizeEmail));
          const telegramMatches = [];
          const telegramPattern = /(^|\\s)@([a-zA-Z0-9_]{5,32})\\b/g;
          let telegramMatch;
          while ((telegramMatch = telegramPattern.exec(joined)) !== null) {
            telegramMatches.push(normalizeTelegram('@' + telegramMatch[2]));
          }
          const phones = uniqueValues((joined.match(/(?:\\+?\\d[\\d\\s().-]{7,}\\d)/g) || [])
            .map(normalizePhone)
            .filter(function (phone) {
              return phone.replace(/\\D/g, '').length >= 10;
            }));

          return {
            name: detectName(messages),
            phone: phones[0] || '',
            telegram: uniqueValues(telegramMatches)[0] || '',
            email: emails[0] || ''
          };
        }

        function buildContactDraft(base) {
          return {
            contactId: base && base.contactId ? base.contactId : '',
            name: base && base.name ? base.name : '',
            phone: base && base.phone ? base.phone : '',
            telegram: base && base.telegram ? base.telegram : '',
            email: base && base.email ? base.email : '',
            notes: base && base.notes ? base.notes : '',
            status: base && base.status ? base.status : 'new',
            tags: Array.isArray(base && base.tags) ? base.tags.slice() : [],
            sourceSiteId: base && base.sourceSiteId ? base.sourceSiteId : (state.selectedConversation ? state.selectedConversation.siteId : ''),
            conversationId: base && base.conversationId ? base.conversationId : (state.selectedConversation ? state.selectedConversation.conversationId : ''),
            lastConversationAt: base && base.lastConversationAt ? base.lastConversationAt : (state.selectedConversation ? state.selectedConversation.lastMessageAt : '')
          };
        }

        function getContactDraftFromForm() {
          return buildContactDraft({
            contactId: state.linkedContact ? state.linkedContact.contactId : '',
            name: contactNameInput.value.trim(),
            phone: normalizePhone(contactPhoneInput.value),
            telegram: normalizeTelegram(contactTelegramInput.value),
            email: normalizeEmail(contactEmailInput.value),
            notes: contactNotesInput.value.trim(),
            status: contactStatusInput.value,
            tags: state.contactDraft && Array.isArray(state.contactDraft.tags) ? state.contactDraft.tags.slice() : [],
            sourceSiteId: state.selectedConversation ? state.selectedConversation.siteId : '',
            conversationId: state.selectedConversation ? state.selectedConversation.conversationId : '',
            lastConversationAt: state.selectedConversation ? state.selectedConversation.lastMessageAt : ''
          });
        }

        function hasDetectedContactData(contact) {
          return Boolean(contact && (contact.name || contact.phone || contact.telegram || contact.email));
        }

        function syncContactDraft(source) {
          if (
            state.showContactForm &&
            state.contactFormDirty &&
            state.contactFormConversationId === (state.selectedConversation ? state.selectedConversation.conversationId : '')
          ) {
            return;
          }

          state.contactDraft = buildContactDraft(source || state.linkedContact || state.detectedContact || {});
          state.contactFormConversationId = state.selectedConversation ? state.selectedConversation.conversationId : '';
          state.contactFormDirty = false;
          renderContactForm();
        }

        function setContactFormVisible(visible) {
          state.showContactForm = visible === true;
          contactForm.hidden = !state.showContactForm;
          if (!state.showContactForm) {
            state.contactFormDirty = false;
          }
        }

        function renderQuickReplies() {
          quickReplies.innerHTML = QUICK_REPLIES.map(function (text) {
            return '<button type="button" class="quick-reply-btn" data-quick-reply="' + escapeHtml(text) + '">' + escapeHtml(text) + '</button>';
          }).join('');
        }

        function renderTagSelector() {
          const activeTags = state.contactDraft && Array.isArray(state.contactDraft.tags) ? state.contactDraft.tags : [];
          contactTags.innerHTML = CONTACT_TAGS.map(function (tag) {
            const active = activeTags.indexOf(tag.value) >= 0 ? ' active' : '';
            return '<button type="button" class="tag-btn' + active + '" data-tag="' + escapeHtml(tag.value) + '">' + escapeHtml(tag.label) + '</button>';
          }).join('');
        }

        function renderConversationList() {
          if (!state.conversations.length) {
            conversationList.innerHTML = '<div class="empty-state">Немає діалогів.</div>';
            return;
          }

          const todayKey = getTodayDayKey();
          const grouped = state.conversations.reduce(function (accumulator, item) {
            const dayKey = getConversationDayKey(item);
            const group = accumulator.find(function (entry) {
              return entry.dayKey === dayKey;
            });

            if (group) {
              group.items.push(item);
            } else {
              accumulator.push({ dayKey: dayKey, items: [item] });
            }
            return accumulator;
          }, []);

          conversationList.innerHTML = grouped.map(function (group) {
            const isToday = group.dayKey === todayKey;
            const hasSelectedConversation = group.items.some(function (item) {
              return item.conversationId === state.selectedConversationId;
            });
            const openAttr = isToday || hasSelectedConversation ? ' open' : '';
            const itemsHtml = group.items.map(function (item) {
              const inboxStatus = item.inboxStatus || (item.status === 'closed' ? 'closed' : 'open');
              const title = item.sourcePage || item.siteId || 'Conversation';
              return '<button type="button" class="conversation-item ' + (item.conversationId === state.selectedConversationId ? 'active ' : '') + (inboxStatus === 'closed' ? 'closed' : '') + '" data-conversation-id="' + escapeHtml(item.conversationId) + '">' +
                '<div class="conversation-top">' +
                  '<span class="conversation-id">' + escapeHtml(item.conversationId) + '</span>' +
                  renderConversationStatusBadge(item) +
                '</div>' +
                '<div class="conversation-title">' + escapeHtml(title) + '</div>' +
                '<div class="last-message">' + escapeHtml(item.lastMessage || '—') + '</div>' +
                '<div class="conversation-meta"><span>' + escapeHtml(item.siteId || '-') + '</span><span>' + escapeHtml(formatShortDate(item.lastMessageAt)) + '</span></div>' +
              '</button>';
            }).join('');

            return '<details class="conversation-group"' + openAttr + '>' +
              '<summary class="conversation-group-label"><span>' + escapeHtml(isToday ? 'Сьогодні' : formatDayLabel(group.dayKey)) + '</span><span class="pill-count">' + escapeHtml(String(group.items.length)) + '</span></summary>' +
              '<div class="conversation-group-items">' + itemsHtml + '</div>' +
            '</details>';
          }).join('');
        }

        function renderEmptyConversation() {
          state.selectedConversation = null;
          state.selectedMessages = [];
          state.selectedMessagesSignature = '';
          conversationTitle.textContent = 'Оберіть діалог';
          conversationSummary.textContent = 'Messenger-style workspace для оператора.';
          conversationMeta.innerHTML = '';
          messagesPane.innerHTML = '<div class="empty-state">Оберіть діалог у списку зліва.</div>';
          state.linkedContact = null;
          state.detectedContact = null;
          state.selectedContactId = '';
          syncContactDraft({});
          renderContactsPanel();
        }

        function renderConversation(conversation, messages, options) {
          const settings = options || {};
          const shouldStickToBottom = settings.forceScrollBottom || isNearBottom(messagesPane, 64);
          const previousScrollTop = messagesPane.scrollTop;
          const previousScrollHeight = messagesPane.scrollHeight;

          state.selectedConversation = conversation;
          state.selectedMessages = messages;
          state.selectedMessagesSignature = buildMessagesSignature(messages);
          state.detectedContact = detectContactFromMessages(messages);

          conversationTitle.textContent = conversation.conversationId;
          conversationSummary.textContent = conversation.sourcePage || 'Діалог з віджета сайту';
          conversationMeta.innerHTML =
            '<span>' + renderConversationStatusBadge(conversation) + '</span>' +
            '<span>' + escapeHtml(conversation.siteId || '-') + '</span>' +
            '<span>' + escapeHtml(formatDate(conversation.lastMessageAt)) + '</span>';

          messagesPane.innerHTML = messages.map(function (message) {
            const attachments = Array.isArray(message.attachments) && message.attachments.length
              ? '<div class="attachments">' + message.attachments.map(function (file) {
                  return '<a href="' + escapeHtml(file.publicUrl || '#') + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(file.fileName || 'file') + '</a>';
                }).join('') + '</div>'
              : '';

            return '<article class="message ' + escapeHtml(message.senderType || '') + '">' +
              '<div class="message-head"><span class="message-sender">' + escapeHtml(message.senderType || '-') + '</span><span class="message-date">' + escapeHtml(formatShortDate(message.createdAt)) + '</span></div>' +
              '<div class="message-text">' + nl2br(message.text || '—') + '</div>' +
              attachments +
            '</article>';
          }).join('');

          if (shouldStickToBottom) {
            messagesPane.scrollTop = messagesPane.scrollHeight;
          } else if (settings.preserveScroll !== false) {
            const scrollDelta = messagesPane.scrollHeight - previousScrollHeight;
            messagesPane.scrollTop = Math.max(0, previousScrollTop + scrollDelta);
          }

          syncContactDraft(state.linkedContact || state.detectedContact || {});
          renderContactsPanel();
        }

        function renderInfoRow(label, value) {
          return '<div class="info-row"><div class="info-label">' + escapeHtml(label) + '</div><div class="info-value' + (value ? '' : ' empty') + '">' + escapeHtml(value || 'не знайдено') + '</div></div>';
        }

        function renderLinkedContactCard() {
          if (!state.linkedContact) {
            linkedContactCard.innerHTML = '';
            editLinkedContactBtn.hidden = true;
            linkedContactBadge.textContent = '0';
            return;
          }

          linkedContactBadge.textContent = '1';
          editLinkedContactBtn.hidden = false;
          linkedContactCard.innerHTML =
            '<div class="contact-inline">' +
              '<div>' +
                '<strong>' + escapeHtml(state.linkedContact.name || state.linkedContact.phone || state.linkedContact.email || state.linkedContact.telegram || state.linkedContact.contactId) + '</strong>' +
                '<small>' + escapeHtml(state.linkedContact.notes || 'Контакт уже збережено') + '</small>' +
              '</div>' +
              '<div class="badge-row">' + renderContactStatusBadge(state.linkedContact.status || 'new') + renderTagBadges(state.linkedContact.tags || []) + '</div>' +
            '</div>';
        }

        function renderSuggestionBox() {
          if (!hasDetectedContactData(state.detectedContact) || state.linkedContact) {
            contactSuggestion.hidden = true;
            contactSuggestion.innerHTML = '';
            return;
          }

          const items = [];
          if (state.detectedContact.name) items.push(renderBadge(state.detectedContact.name, 'subtle', ''));
          if (state.detectedContact.phone) items.push(renderBadge(state.detectedContact.phone, 'subtle', ''));
          if (state.detectedContact.telegram) items.push(renderBadge(state.detectedContact.telegram, 'subtle', ''));
          if (state.detectedContact.email) items.push(renderBadge(state.detectedContact.email, 'subtle', ''));
          contactSuggestion.hidden = false;
          contactSuggestion.innerHTML =
            '<div class="suggestion-title">Знайдено контактні дані — зберегти?</div>' +
            '<div class="suggestion-row">' + items.join('') + '</div>';
        }

        function renderCurrentVisitorInfo() {
          const base = state.linkedContact || state.detectedContact || {};
          currentVisitorHint.textContent = state.selectedConversation
            ? 'Дані з поточного діалогу можна доповнити й зберегти.'
            : 'Відкрий діалог, щоб побачити дані.';
          currentVisitorInfo.innerHTML = [
            renderInfoRow('Name', base.name || ''),
            renderInfoRow('Phone', base.phone || ''),
            renderInfoRow('Telegram', base.telegram || ''),
            renderInfoRow('Email', base.email || '')
          ].join('');
        }

        function renderContactForm() {
          const draft = state.contactDraft || buildContactDraft({});
          contactNameInput.value = draft.name || '';
          contactPhoneInput.value = draft.phone || '';
          contactTelegramInput.value = draft.telegram || '';
          contactEmailInput.value = draft.email || '';
          contactStatusInput.value = draft.status || 'new';
          contactNotesInput.value = draft.notes || '';
          renderTagSelector();
          setContactFormVisible(state.showContactForm);
          saveContactBtn.textContent = state.linkedContact ? 'Update Contact' : 'Save Contact';
        }

        function renderContactsList() {
          if (!state.contacts.length) {
            contactsList.innerHTML = '<div class="empty-state">Поки що немає збережених контактів.</div>';
            return;
          }

          contactsList.innerHTML = state.contacts.map(function (contact) {
            const title = contact.name || contact.phone || contact.email || contact.telegram || contact.contactId;
            const details = [contact.phone, contact.telegram, contact.email].filter(Boolean).join(' · ');
            return '<button type="button" class="contact-card ' + (contact.contactId === state.selectedContactId ? 'active' : '') + '" data-contact-id="' + escapeHtml(contact.contactId) + '" data-conversation-id="' + escapeHtml(contact.conversationId || '') + '">' +
              '<div class="contact-card-top">' +
                '<strong>' + escapeHtml(title) + '</strong>' +
                renderContactStatusBadge(contact.status || 'new') +
              '</div>' +
              '<div class="tag-row">' + renderTagBadges(contact.tags || []) + '</div>' +
              '<p>' + escapeHtml(details || contact.notes || 'Без додаткових даних') + '</p>' +
              '<div class="contact-card-meta"><span>' + escapeHtml(contact.sourceSiteId || '-') + '</span><span>' + escapeHtml(formatShortDate(contact.lastConversationAt || contact.updatedAt)) + '</span></div>' +
            '</button>';
          }).join('');
        }

        function renderContactsPanel() {
          renderSuggestionBox();
          renderLinkedContactCard();
          renderCurrentVisitorInfo();
          renderContactForm();
          renderContactsList();
          openSaveContactBtn.disabled = !state.selectedConversation;
        }

        async function loadContacts(options) {
          const settings = options || {};
          if (state.loadingContacts) return;
          state.loadingContacts = true;
          try {
            const params = new URLSearchParams();
            if (state.contactsSearch) params.set('q', state.contactsSearch);
            params.set('limit', '60');
            const payload = await fetchJson('/api/admin/contacts?' + params.toString());
            state.contacts = payload.contacts || [];
            if (settings.keepSelected !== true) {
              state.selectedContactId = state.linkedContact ? state.linkedContact.contactId : state.selectedContactId;
            }
            renderContactsList();
          } finally {
            state.loadingContacts = false;
          }
        }

        async function loadLinkedContact() {
          if (!state.selectedConversation) {
            state.linkedContact = null;
            renderContactsPanel();
            return;
          }

          const params = new URLSearchParams();
          params.set('conversationId', state.selectedConversation.conversationId);
          params.set('limit', '5');
          const payload = await fetchJson('/api/admin/contacts?' + params.toString());
          state.linkedContact = payload.contacts && payload.contacts.length ? payload.contacts[0] : null;
          state.selectedContactId = state.linkedContact ? state.linkedContact.contactId : state.selectedContactId;
          syncContactDraft(state.linkedContact || state.detectedContact || {});
          renderContactsPanel();
        }

        async function loadConversations(options) {
          const settings = options || {};
          if (state.loadingConversations) return;
          state.loadingConversations = true;
          const previousSelectedConversationId = state.selectedConversationId;
          const params = new URLSearchParams();
          if (state.status) params.set('status', state.status);
          if (state.search) params.set('q', state.search);

          try {
            const payload = await fetchJson('/api/inbox/conversations?' + params.toString());
            state.conversations = payload.conversations || [];

            if (!state.selectedConversationId && state.conversations.length) {
              state.selectedConversationId = state.conversations[0].conversationId;
            }
            if (state.selectedConversationId && !state.conversations.some(function (item) {
              return item.conversationId === state.selectedConversationId;
            })) {
              state.selectedConversationId = state.conversations[0] ? state.conversations[0].conversationId : '';
            }

            renderConversationList();
            if (previousSelectedConversationId !== state.selectedConversationId) {
              restartConversationPolling();
            }
            if (state.selectedConversationId && settings.reloadSelectedConversation !== false) {
              await loadConversation(state.selectedConversationId, { preserveScroll: true });
            } else if (!state.selectedConversationId) {
              restartConversationPolling();
              renderEmptyConversation();
            }
          } finally {
            state.loadingConversations = false;
          }
        }

        async function loadConversation(conversationId, options) {
          if (!conversationId || state.loadingConversation) return;
          state.loadingConversation = true;
          try {
            const payload = await fetchJson('/api/inbox/conversations/' + encodeURIComponent(conversationId));
            const conversation = payload.conversation;
            const messages = payload.messages || [];
            const nextSignature = buildMessagesSignature(messages);
            const selectedChanged = state.selectedConversationId !== conversationId;

            state.selectedConversationId = conversationId;

            if (
              !selectedChanged &&
              state.selectedConversation &&
              state.selectedMessagesSignature === nextSignature &&
              state.selectedConversation.status === conversation.status &&
              state.selectedConversation.lastMessageAt === conversation.lastMessageAt
            ) {
              state.selectedConversation = conversation;
              state.detectedContact = detectContactFromMessages(messages);
              await loadLinkedContact();
              return;
            }

            renderConversation(conversation, messages, {
              preserveScroll: options && options.preserveScroll !== false,
              forceScrollBottom: options && (options.forceScrollBottom === true || selectedChanged)
            });
            await loadLinkedContact();
          } finally {
            state.loadingConversation = false;
          }
        }

        async function sendReply() {
          if (!state.selectedConversationId) return;
          const text = replyInput.value.trim();
          if (!text) return;

          await fetchJson('/api/inbox/conversations/' + encodeURIComponent(state.selectedConversationId) + '/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: text,
              operatorName: operatorNameInput.value.trim() || 'Operator'
            })
          });

          replyInput.value = '';
          await loadConversations({ reloadSelectedConversation: true });
          await loadConversation(state.selectedConversationId, { forceScrollBottom: true });
        }

        async function updateStatus(nextStatus) {
          if (!state.selectedConversationId) return;
          await fetchJson('/api/inbox/conversations/' + encodeURIComponent(state.selectedConversationId) + '/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: nextStatus,
              operatorName: operatorNameInput.value.trim() || 'Operator'
            })
          });
          await loadConversations({ reloadSelectedConversation: true });
        }

        async function saveContact(event) {
          if (event) event.preventDefault();
          if (!state.selectedConversation) return;

          const draft = getContactDraftFromForm();
          const method = state.linkedContact ? 'PATCH' : 'POST';
          const url = state.linkedContact
            ? '/api/admin/contacts/' + encodeURIComponent(state.linkedContact.contactId)
            : '/api/admin/contacts';

          const payload = await fetchJson(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draft)
          });

          state.linkedContact = payload.contact;
          state.selectedContactId = payload.contact.contactId;
          state.contactDraft = buildContactDraft(payload.contact);
          state.contactFormDirty = false;
          setContactFormVisible(false);
          await loadContacts({ keepSelected: true });
          renderContactsPanel();
        }

        async function openConversationFromContact(conversationId) {
          if (!conversationId) return;
          if (state.status !== 'all') {
            state.status = 'all';
            statusFilter.value = 'all';
          }
          state.selectedConversationId = conversationId;
          await loadConversations({ reloadSelectedConversation: false });
          renderConversationList();
          restartConversationPolling();
          await loadConversation(conversationId, { forceScrollBottom: true });
        }

        function restartConversationPolling() {
          if (state.conversationPollTimer) {
            clearInterval(state.conversationPollTimer);
            state.conversationPollTimer = null;
          }

          if (!state.selectedConversationId) return;
          state.conversationPollTimer = setInterval(function () {
            loadConversation(state.selectedConversationId, { preserveScroll: true }).catch(console.error);
          }, OPEN_CONVERSATION_POLL_MS);
        }

        function startPolling() {
          if (!state.listPollTimer) {
            state.listPollTimer = setInterval(function () {
              loadConversations({ reloadSelectedConversation: false }).catch(console.error);
            }, CONVERSATIONS_POLL_MS);
          }
          restartConversationPolling();
        }

        function markContactFormDirty() {
          state.contactFormDirty = true;
          const draft = getContactDraftFromForm();
          state.contactDraft = buildContactDraft(draft);
          renderTagSelector();
        }

        renderQuickReplies();
        syncContactDraft({});
        renderContactsPanel();

        conversationList.addEventListener('click', function (event) {
          const button = event.target.closest('.conversation-item');
          if (!button) return;
          state.selectedConversationId = button.getAttribute('data-conversation-id') || '';
          renderConversationList();
          restartConversationPolling();
          loadConversation(state.selectedConversationId, { forceScrollBottom: true }).catch(console.error);
        });

        quickReplies.addEventListener('click', function (event) {
          const button = event.target.closest('[data-quick-reply]');
          if (!button) return;
          const value = button.getAttribute('data-quick-reply') || '';
          replyInput.value = value;
          replyInput.focus();
        });

        refreshBtn.addEventListener('click', function () {
          loadConversations({ reloadSelectedConversation: true }).catch(console.error);
          loadContacts({ keepSelected: true }).catch(console.error);
        });

        searchInput.addEventListener('input', function () {
          state.search = searchInput.value.trim();
          loadConversations({ reloadSelectedConversation: true }).catch(console.error);
        });

        statusFilter.addEventListener('change', function () {
          state.status = statusFilter.value;
          loadConversations({ reloadSelectedConversation: true }).catch(console.error);
        });

        sendReplyBtn.addEventListener('click', function () {
          sendReply().catch(console.error);
        });

        replyInput.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendReply().catch(console.error);
          }
        });

        markOpenBtn.addEventListener('click', function () {
          updateStatus('open').catch(console.error);
        });

        markClosedBtn.addEventListener('click', function () {
          updateStatus('closed').catch(console.error);
        });

        openSaveContactBtn.addEventListener('click', function () {
          if (!state.selectedConversation) return;
          syncContactDraft(state.linkedContact || state.detectedContact || {});
          setContactFormVisible(true);
        });

        editLinkedContactBtn.addEventListener('click', function () {
          if (!state.linkedContact) return;
          syncContactDraft(state.linkedContact);
          setContactFormVisible(true);
        });

        cancelContactBtn.addEventListener('click', function () {
          syncContactDraft(state.linkedContact || state.detectedContact || {});
          setContactFormVisible(false);
          renderContactsPanel();
        });

        contactForm.addEventListener('submit', function (event) {
          saveContact(event).catch(console.error);
        });

        [contactNameInput, contactPhoneInput, contactTelegramInput, contactEmailInput, contactStatusInput, contactNotesInput].forEach(function (input) {
          input.addEventListener('input', markContactFormDirty);
          input.addEventListener('change', markContactFormDirty);
        });

        contactTags.addEventListener('click', function (event) {
          const button = event.target.closest('[data-tag]');
          if (!button) return;
          const tag = button.getAttribute('data-tag') || '';
          const draft = state.contactDraft || buildContactDraft({});
          const tags = Array.isArray(draft.tags) ? draft.tags.slice() : [];
          const existingIndex = tags.indexOf(tag);
          if (existingIndex >= 0) {
            tags.splice(existingIndex, 1);
          } else {
            tags.push(tag);
          }
          draft.tags = tags;
          state.contactDraft = buildContactDraft(draft);
          state.contactFormDirty = true;
          renderTagSelector();
        });

        contactsSearchInput.addEventListener('input', function () {
          state.contactsSearch = contactsSearchInput.value.trim();
          loadContacts({ keepSelected: true }).catch(console.error);
        });

        contactsList.addEventListener('click', function (event) {
          const button = event.target.closest('.contact-card');
          if (!button) return;
          state.selectedContactId = button.getAttribute('data-contact-id') || '';
          renderContactsList();
          const conversationId = button.getAttribute('data-conversation-id') || '';
          if (conversationId) {
            openConversationFromContact(conversationId).catch(console.error);
          }
        });

        window.addEventListener('beforeunload', function () {
          if (state.listPollTimer) clearInterval(state.listPollTimer);
          if (state.conversationPollTimer) clearInterval(state.conversationPollTimer);
        });

        Promise.all([
          loadConversations({ reloadSelectedConversation: true }),
          loadContacts({ keepSelected: true })
        ])
          .then(function () {
            startPolling();
          })
          .catch(function (error) {
            console.error(error);
            conversationList.innerHTML = '<div class="empty-state">Не вдалося завантажити inbox.</div>';
            contactsList.innerHTML = '<div class="empty-state">Не вдалося завантажити контакти.</div>';
          });
      })();
    </script>
  </body>
</html>`;
}

module.exports = {
  renderInboxPage
};
