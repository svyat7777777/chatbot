const { renderAppLayout } = require('./app-layout');

function renderInboxPage() {
  return renderAppLayout({
    title: 'Chat Inbox',
    activeNav: 'inbox',
    styles: `
      :root {
        color-scheme: light;
        --bg: #1a1c24;
        --panel: #ffffff;
        --panel-soft: #fafafa;
        --panel-muted: #f5f6fa;
        --border: #eeedf0;
        --text: #0d0e14;
        --muted: #6b6f80;
        --muted-soft: #a8aab8;
        --accent: #3b5bdb;
        --accent-soft: #eef2ff;
        --accent-border: #c5d0fa;
        --warning-soft: #fff9db;
        --success-soft: #ebfbee;
        --shadow: 0 4px 12px rgba(0,0,0,.08);
        --left-bg: #fcfcfd;
        --left-border: #eeedf0;
        --left-text: #0d0e14;
        --left-muted: #6b6f80;
        --left-icon: #a8aab8;
        --right-bg: #fafafa;
        --right-border: #ebebeb;
      }
      * { box-sizing: border-box; }
      html, body {
        height: 100%;
      }
      body {
        font-family: 'Plus Jakarta Sans', Manrope, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        overflow: hidden;
        background: var(--bg);
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
        grid-template-columns: 320px minmax(0, 1fr) 330px;
        gap: 0;
        height: 100vh;
        min-height: 0;
        max-width: none;
        margin: 0;
        padding: 0;
        align-items: stretch;
      }
      .panel {
        min-width: 0;
        min-height: 0;
        height: 100%;
        background: #ffffff;
        border: 0;
        border-radius: 0;
        box-shadow: none;
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
        font-size: 16px;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: -0.02em;
      }
      .sidebar-head {
        display: grid;
        gap: 12px;
      }
      .toolbar {
        display: grid;
        gap: 8px;
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
        border-radius: 10px;
        padding: 10px 11px;
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
        grid-template-columns: 1fr 104px;
        gap: 8px;
      }
      .conversation-list,
      .contacts-list {
        flex: 1;
        min-height: 0;
        overflow: auto;
      }
      .conversation-list {
        padding: 10px 10px 14px;
        display: grid;
        gap: 10px;
        align-content: start;
        grid-auto-rows: max-content;
      }
      .conversation-group {
        display: grid;
        gap: 6px;
        align-self: start;
      }
      .conversation-group:not([open]) {
        gap: 0;
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
        padding: 2px 8px;
        font-size: 11px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--left-muted);
        font-weight: 700;
        border-radius: 0;
      }
      .conversation-group[open] .conversation-group-label {
        padding: 2px 8px;
      }
      .conversation-group:not([open]) .conversation-group-label {
        background: transparent;
        border: 0;
        box-shadow: none;
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
        gap: 6px;
      }
      .conversation-item {
        width: 100%;
        text-align: left;
        position: relative;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 18px;
        padding: 11px 12px;
        background: rgba(31, 37, 52, 0.96);
      }
      .conversation-item:hover {
        background: rgba(38, 44, 60, 0.98);
        border-color: rgba(91,127,247,.14);
      }
      .conversation-item.active {
        border-color: rgba(91,127,247,.16);
        background: rgba(45, 55, 78, 0.98);
        box-shadow: inset 3px 0 0 #5b7ff7;
      }
      .conversation-item.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 10px;
        bottom: 10px;
        width: 3px;
        border-radius: 0 3px 3px 0;
        background: #5b7ff7;
      }
      .conversation-item.closed {
        opacity: 0.88;
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
      .conversation-main {
        display: grid;
        grid-template-columns: 36px minmax(0, 1fr);
        gap: 10px;
        align-items: start;
      }
      .conversation-avatar {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,.1);
        color: #ffffff;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.03em;
        border: 1px solid rgba(255,255,255,.04);
        flex-shrink: 0;
      }
      .conversation-body {
        min-width: 0;
      }
      .conversation-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-width: 0;
      }
      .conversation-name {
        min-width: 0;
        font-size: 14px;
        font-weight: 800;
        color: var(--left-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .conversation-identity {
        min-width: 0;
        display: grid;
        gap: 2px;
      }
      .conversation-secondary {
        min-width: 0;
        font-size: 11px;
        color: #8f96a8;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .conversation-time {
        flex-shrink: 0;
        font-size: 10px;
        color: #8f96a8;
        font-weight: 600;
      }
      .conversation-time-wrap {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .conversation-title {
        margin-top: 4px;
        color: var(--text);
        font-size: 12px;
        font-weight: 700;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .last-message {
        margin-top: 5px;
        color: #a0a7b8;
        font-size: 12px;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
        white-space: normal;
      }
      .conversation-meta {
        margin-top: 8px;
        color: var(--muted-soft);
        font-size: 10px;
        justify-content: flex-start;
        gap: 6px;
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
        min-height: 20px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
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
      .badge.waiting_operator {
        background: #fff4cf;
        color: #9a6700;
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
        background: #f5f7fb;
        color: #5d677f;
        border-color: rgba(79, 89, 112, 0.08);
      }
      .chat-panel {
        overflow: hidden;
        background: #fff;
        border-right: 1px solid var(--border);
      }
      .chat-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        position: sticky;
        top: 0;
        z-index: 2;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(8px);
        min-height: 62px;
        padding: 12px 18px;
      }
      .chat-title-row {
        flex: 1;
        min-width: 0;
        display: grid;
        gap: 3px;
      }
      .chat-title-row h2 {
        font-size: 16px;
        line-height: 1.15;
        font-weight: 700;
      }
      .chat-title-row p {
        margin: 0;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.3;
      }
      .chat-meta {
        display: grid;
        gap: 6px;
      }
      .chat-meta-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }
      .chat-status {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 0 9px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        border: 1px solid transparent;
      }
      .chat-status.ai {
        background: #eef1f5;
        color: #4b5568;
      }
      .chat-status.waiting {
        background: #fff4cf;
        color: #996800;
      }
      .chat-status.human {
        background: #e1edff;
        color: #2452a3;
      }
      .chat-status.closed {
        background: #fee3e3;
        color: #b13d3d;
      }
      .chat-meta-chip {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 0 9px;
        border-radius: 999px;
        background: #f5f7fb;
        border: 1px solid var(--border);
        color: var(--muted);
        font-size: 10px;
        font-weight: 700;
      }
      .chat-assignment {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 6px 3px 9px;
        min-height: 30px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: #fff;
        box-shadow: none;
      }
      .chat-assignment-label {
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
      }
      .chat-assignment-value {
        font-size: 11px;
        font-weight: 700;
        color: var(--text);
        max-width: 112px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .chat-assignment select {
        border: 0;
        border-left: 1px solid var(--border);
        border-radius: 0;
        padding: 0 18px 0 10px;
        min-height: 24px;
        font-size: 11px;
        font-weight: 700;
        color: var(--text);
        background: transparent;
      }
      .chat-source-chip {
        max-width: 220px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .badge-unread {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 20px;
        padding: 0 8px;
        border-radius: 12px;
        background: #2563eb;
        color: #fff;
        font-size: 12px;
        font-weight: 800;
      }
      .messages {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 14px 16px 6px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #fbfcff;
      }
      .message-list {
        width: 100%;
        max-width: 820px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .message-row {
        display: flex;
        align-items: flex-end;
        gap: 8px;
      }
      .message-row.operator {
        justify-content: flex-end;
      }
      .message-row.system {
        justify-content: center;
      }
      .message-avatar {
        width: 26px;
        height: 26px;
        border-radius: 9px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.04em;
        background: #eceff5;
        color: #667086;
      }
      .message-row.visitor .message-avatar {
        background: #fff0de;
        color: #b26d1c;
      }
      .message-row.operator .message-avatar {
        background: #e7f0ff;
        color: #2f62c8;
        order: 2;
      }
      .message-row.ai .message-avatar {
        background: #eef1f6;
        color: #5e697c;
      }
      .message {
        width: fit-content;
        max-width: min(70%, 640px);
        display: grid;
        gap: 3px;
        border: 0;
        padding: 0;
        background: transparent;
        box-shadow: none;
      }
      .message-row.operator .message {
        align-items: flex-end;
      }
      .message-row.visitor .message {
        align-items: flex-start;
      }
      .message-row.ai .message {
        align-items: flex-start;
      }
      .message-row.system .message {
        align-self: center;
        max-width: 520px;
        background: #f1f4f8;
        border: 1px solid rgba(229, 233, 240, 0.92);
        border-radius: 14px;
        padding: 10px 12px;
      }
      .message-head {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 0;
        color: var(--muted-soft);
        font-size: 9px;
        opacity: 0.78;
      }
      .message-row.operator .message-head {
        justify-content: flex-end;
      }
      .message-sender {
        font-size: 10px;
        font-weight: 500;
        text-transform: none;
        letter-spacing: 0;
        color: #6b6f80;
      }
      .message-row.operator .message-sender {
        font-size: 10px;
        color: #6b6f80;
      }
      .message-role {
        margin: -2px 0 0;
        font-size: 10px;
        color: var(--muted-soft);
      }
      .message-text {
        font-size: 13px;
        line-height: 1.5;
        word-break: break-word;
        background: #ffffff;
        border: 1px solid #e8e8e8;
        border-radius: 3px 14px 14px 14px;
        padding: 9px 13px;
        box-shadow: none;
      }
      .message-row.operator .message-text {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
        border-radius: 14px 3px 14px 14px;
        box-shadow: none;
      }
      .message-row.system .message-text {
        background: transparent;
        border: 0;
        box-shadow: none;
        padding: 0;
      }
      .message-date {
        white-space: nowrap;
        font-size: 10px;
      }
      .attachments {
        margin-top: 2px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .attachments a {
        color: var(--accent);
        font-size: 12px;
        text-decoration: none;
      }
      .product-offer-text {
        margin-bottom: 8px;
      }
      .product-offer-card {
        display: grid;
        grid-template-columns: 84px minmax(0, 1fr);
        gap: 10px;
        padding: 10px;
        border-radius: 14px;
        border: 1px solid rgba(229, 233, 240, 0.96);
        background: #ffffff;
      }
      .message-row.operator .product-offer-card {
        background: rgba(255, 255, 255, 0.94);
      }
      .product-offer-image,
      .product-offer-image-empty {
        width: 84px;
        height: 84px;
        border-radius: 12px;
        object-fit: cover;
        background: #eff3f8;
      }
      .product-offer-image-empty {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 800;
        color: var(--muted);
      }
      .product-offer-body {
        min-width: 0;
        display: grid;
        gap: 6px;
      }
      .product-offer-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .product-offer-title {
        font-size: 13px;
        font-weight: 800;
        line-height: 1.35;
      }
      .product-offer-price {
        white-space: nowrap;
        font-size: 12px;
        font-weight: 800;
        color: var(--accent);
      }
      .product-offer-description {
        margin: 0;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.4;
      }
      .product-offer-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 2px;
      }
      .product-link-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        padding: 6px 10px;
        border-radius: 10px;
        border: 1px solid rgba(40, 100, 255, 0.14);
        background: #eef3ff;
        color: var(--accent);
        font-size: 11px;
        font-weight: 800;
        text-decoration: none;
      }
      .reply-box {
        flex-shrink: 0;
        min-height: 0;
        border-top: 1px solid var(--border);
        background: #ffffff;
        padding: 10px 14px 14px;
        display: grid;
        gap: 8px;
        position: relative;
      }
      .composer-resize-handle {
        width: 100%;
        height: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: ns-resize;
        margin-top: -6px;
      }
      .composer-resize-handle::before {
        content: '';
        width: 60px;
        height: 4px;
        border-radius: 999px;
        background: #d9e0eb;
      }
      .reply-top {
        display: grid;
        grid-template-columns: 136px minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        min-height: 38px;
      }
      .quick-replies-panel {
        display: flex;
        justify-content: flex-end;
        position: relative;
        align-items: center;
        min-width: 0;
      }
      .quick-replies-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: auto;
        min-height: 28px;
        padding: 4px 9px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: #fff;
        color: #44506a;
        font-size: 10px;
        font-weight: 800;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .quick-replies-toggle::after {
        content: '▾';
        font-size: 12px;
        transition: transform 0.16s ease;
      }
      .quick-replies-panel.collapsed .quick-replies-toggle::after {
        transform: rotate(-90deg);
      }
      .quick-reply-btn {
        padding: 5px 8px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: #fff;
        color: #42506b;
        font-size: 10px;
        font-weight: 700;
      }
      .quick-replies-tools {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: nowrap;
        justify-content: flex-end;
        min-width: 0;
        overflow-x: auto;
        overflow-y: visible;
        scrollbar-width: thin;
      }
      .ai-actions {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-wrap: nowrap;
        justify-content: flex-end;
        min-width: 0;
        flex: 1 1 auto;
      }
      .ai-actions-label {
        font-size: 10px;
        font-weight: 800;
        color: var(--muted-soft);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .ai-language-select {
        min-height: 30px;
        border-radius: 10px;
        border: 1px solid rgba(40, 100, 255, 0.12);
        background: #fff;
        color: var(--text);
        padding: 6px 8px;
        font-size: 10px;
        font-weight: 800;
        flex-shrink: 0;
      }
      .ai-assist-btn {
        padding: 6px 8px;
        border-radius: 10px;
        border: 1px solid rgba(40, 100, 255, 0.12);
        background: #fff;
        color: var(--accent);
        font-size: 10px;
        font-weight: 800;
        min-height: 30px;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .ai-assist-btn.is-loading {
        background: #edf3ff;
        color: #3550a8;
      }
      .ai-assist-btn:disabled {
        opacity: 0.64;
        cursor: default;
        transform: none;
      }
      .quick-reply-btn:hover {
        border-color: var(--accent-border);
        color: var(--accent);
      }
      .quick-replies {
        position: absolute;
        right: 0;
        bottom: calc(100% + 8px);
        width: min(320px, calc(100vw - 48px));
        max-height: 220px;
        overflow-y: auto;
        padding: 10px;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
        z-index: 4;
      }
      .quick-replies-panel.collapsed .quick-replies {
        display: none;
      }
      .quick-replies-panel:not(.collapsed) .quick-replies-toggle {
        border-color: var(--accent-border);
        background: var(--accent-soft);
        color: var(--accent);
      }
      .reply-actions {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 12px;
        align-items: center;
      }
      .reply-send-actions,
      .reply-status-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .reply-send-actions {
        align-items: center;
      }
      .reply-actions-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .primary-btn {
        background: var(--accent);
        color: #fff;
        box-shadow: 0 8px 18px rgba(40, 100, 255, 0.18);
      }
      .secondary-btn {
        background: #eff2f6;
        color: #394863;
      }
      .ghost-btn {
        background: #fff;
        border: 1px solid var(--border);
        color: #46526e;
      }
      .icon-btn {
        width: 36px;
        height: 36px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        line-height: 1;
      }
      .contacts-head p,
      .section-head p,
      .contact-meta,
      .contact-field-hint,
      .empty-state {
        margin: 2px 0 0;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.35;
      }
      .contacts-body {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
        background: #fafbfe;
      }
      .contacts-current {
        flex-shrink: 0;
        padding: 10px 12px 12px;
        display: grid;
        gap: 8px;
        background: transparent;
      }
      .contacts-tabs {
        display: none;
      }
      .contacts-tab-panel {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .contacts-tab-panel[hidden] {
        display: none !important;
      }
      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .section-head h4 {
        margin: 0;
        font-size: 13px;
      }
      .contact-status-line {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
      }
      .contact-identity {
        display: grid;
        gap: 5px;
      }
      .contact-identity-row {
        display: grid;
        grid-template-columns: 16px minmax(0, 52px) 1fr;
        gap: 6px;
        align-items: start;
        font-size: 12px;
        line-height: 1.3;
      }
      .contact-identity-icon {
        font-size: 13px;
        line-height: 1;
      }
      .contact-identity-label {
        color: var(--muted-soft);
        font-size: 11px;
        font-weight: 700;
      }
      .contact-identity-value {
        color: var(--text);
        min-width: 0;
        word-break: break-word;
      }
      .contact-identity-value.empty {
        color: var(--muted-soft);
      }
      .section-head-actions {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .info-grid {
        display: grid;
        gap: 4px;
      }
      .contact-section-card {
        display: grid;
        gap: 5px;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }
      .contact-section-head {
        display: grid;
        gap: 2px;
      }
      .contact-section-head strong {
        font-size: 12px;
      }
      .contact-summary-card {
        display: grid;
        gap: 5px;
        padding: 8px 0 0;
        border: 0;
        border-radius: 0;
        background: transparent;
      }
      .contact-summary-card .empty-state {
        margin: 0;
        padding: 0;
        text-align: left;
        border: 0;
        background: transparent;
      }
      .contact-section-head small {
        color: var(--muted);
        font-size: 11px;
        line-height: 1.35;
      }
      .activity-list {
        display: grid;
        gap: 4px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        color: var(--text);
        font-size: 12px;
        line-height: 1.3;
      }
      .activity-item::before {
        content: attr(data-icon);
        color: inherit;
        font-weight: 400;
        line-height: 1;
        margin-top: 1px;
      }
      .info-row,
      .contact-row {
        display: grid;
        grid-template-columns: 74px 1fr;
        gap: 6px;
        align-items: center;
      }
      .info-label,
      .contact-field label {
        color: var(--muted-soft);
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .info-value {
        min-height: 18px;
        font-size: 12px;
        color: var(--text);
      }
      .info-value.empty {
        color: var(--muted-soft);
      }
      .contact-form {
        display: grid;
        gap: 6px;
        padding: 10px;
        border: 1px solid rgba(229, 233, 240, 0.95);
        border-radius: 14px;
        background: #fff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
      }
      .contact-form-grid {
        display: grid;
        gap: 6px;
      }
      .contact-field {
        display: grid;
        grid-template-columns: 74px minmax(0, 1fr);
        gap: 6px;
        align-items: center;
      }
      .contact-field.is-tags,
      .contact-field.is-notes {
        align-items: start;
      }
      .contact-field textarea {
        min-height: 72px;
        resize: vertical;
      }
      .contacts-panel input,
      .contacts-panel textarea,
      .contacts-panel select {
        padding: 8px 10px;
        border-radius: 9px;
        font-size: 12px;
      }
      .tag-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .tag-btn {
        padding: 5px 8px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--panel-muted);
        color: #48556e;
        font-size: 10px;
        font-weight: 700;
      }
      .tag-btn.active {
        background: var(--accent-soft);
        border-color: var(--accent-border);
        color: var(--accent);
      }
      .form-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        padding-top: 2px;
        justify-content: flex-start;
      }
      .suggestion-box {
        border: 1px dashed rgba(31, 111, 255, 0.24);
        border-radius: 14px;
        padding: 10px 11px;
        background: var(--accent-soft);
      }
      .suggestion-title {
        font-size: 12px;
        font-weight: 800;
        margin-bottom: 6px;
      }
      .ai-summary-card {
        display: grid;
        gap: 10px;
        padding: 13px 14px;
        border: 1px solid rgba(40, 100, 255, 0.1);
        border-radius: 16px;
        background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
        box-shadow: 0 10px 22px rgba(15, 23, 42, 0.03);
      }
      .ai-summary-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .ai-summary-head strong {
        font-size: 13px;
      }
      .ai-summary-grid {
        display: grid;
        gap: 8px;
      }
      .ai-summary-section {
        display: grid;
        gap: 4px;
      }
      .ai-summary-label {
        color: var(--muted-soft);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .ai-summary-value {
        font-size: 12px;
        line-height: 1.45;
        color: var(--text);
      }
      .ai-summary-list {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 4px;
        color: var(--text);
        font-size: 12px;
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
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
      .contacts-search {
        padding: 16px 16px 0;
      }
      .contacts-list {
        padding: 12px 16px 16px;
        display: grid;
        gap: 8px;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .contacts-table-wrap {
        padding: 12px 16px 16px;
        overflow: auto;
      }
      .contacts-table {
        width: 100%;
        min-width: 760px;
        border-collapse: collapse;
        font-size: 12px;
      }
      .contacts-table th,
      .contacts-table td {
        padding: 10px 8px;
        border-bottom: 1px solid var(--border);
        text-align: left;
        vertical-align: top;
      }
      .contacts-table th {
        font-size: 10px;
        font-weight: 800;
        color: var(--muted-soft);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .contacts-table tbody tr:hover {
        background: #f8faff;
      }
      .contacts-table-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .tiny-btn {
        padding: 6px 9px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: #fff;
        color: var(--text);
        font-size: 11px;
        font-weight: 700;
      }
      .tiny-btn.primary {
        background: var(--accent-soft);
        border-color: var(--accent-border);
        color: var(--accent);
      }
      .contact-card {
        text-align: left;
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 11px 12px;
        background: #fff;
      }
      .contact-card.active {
        border-color: var(--accent-border);
        background: #f2f6ff;
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
      .contact-profile-sheet {
        width: 100%;
        background: #fff;
        border: 1px solid rgba(229, 233, 240, 0.98);
        border-radius: 18px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        margin-top: 12px;
      }
      .contact-profile-head {
        padding: 16px 16px 14px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .contact-profile-title h3 {
        margin: 0;
        font-size: 22px;
      }
      .contact-profile-title p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 13px;
      }
      .contact-profile-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .contact-profile-tabs {
        display: flex;
        gap: 8px;
        padding: 0 16px 14px;
        border-bottom: 1px solid var(--border);
        flex-wrap: wrap;
      }
      .contact-profile-tab {
        border: 1px solid var(--border);
        background: #fff;
        color: var(--muted);
        border-radius: 999px;
        padding: 7px 12px;
        font-size: 12px;
        font-weight: 700;
      }
      .contact-profile-tab.active {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: var(--accent-border);
      }
      .contact-profile-body {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 16px 16px 18px;
      }
      .profile-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .profile-field {
        display: grid;
        gap: 6px;
      }
      .profile-field.full {
        grid-column: 1 / -1;
      }
      .profile-field label {
        color: var(--muted-soft);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .profile-field input,
      .profile-field textarea,
      .profile-field select {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 10px 11px;
      }
      .profile-field textarea {
        min-height: 110px;
        resize: vertical;
      }
      .profile-actions {
        margin-top: 14px;
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .profile-table {
        width: 100%;
        border-collapse: collapse;
      }
      .profile-table th,
      .profile-table td {
        padding: 11px 8px;
        border-bottom: 1px solid var(--border);
        text-align: left;
        vertical-align: top;
      }
      .profile-table th {
        color: var(--muted-soft);
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .profile-list {
        display: grid;
        gap: 10px;
      }
      .profile-card {
        padding: 12px 13px;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: #fff;
      }
      .profile-card strong {
        display: block;
        font-size: 13px;
      }
      .profile-card small,
      .profile-card p {
        color: var(--muted);
        font-size: 12px;
      }
      .profile-activity-item {
        display: grid;
        gap: 5px;
        padding: 11px 12px;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: #fff;
      }
      .profile-activity-item strong {
        font-size: 13px;
      }
      .profile-activity-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        color: var(--muted-soft);
        font-size: 11px;
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
        background: rgba(91,127,247,.14);
        border: 1px solid rgba(91,127,247,.08);
        color: #93a9ff;
        font-size: 11px;
        font-weight: 700;
      }
      .new-dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 18px;
        padding: 0 7px;
        border-radius: 999px;
        background: #e93d61;
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 20px;
        padding: 0 8px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
        color: #d7dbe6;
        border: 1px solid rgba(255,255,255,.04);
        font-size: 11px;
        font-weight: 700;
      }
      .contacts-head {
        display: grid;
        gap: 10px;
        min-height: 62px;
        align-content: center;
        background: #fff;
      }
      .sidebar-segmented {
        display: inline-grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 4px;
        padding: 4px;
        border-radius: 999px;
        background: var(--panel-muted);
        border: 1px solid rgba(229, 233, 240, 0.9);
        align-self: flex-start;
      }
      .sidebar-tab-btn {
        min-height: 34px;
        padding: 7px 12px;
        border-radius: 999px;
        background: transparent;
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
        box-shadow: none;
      }
      .sidebar-tab-btn.active {
        background: var(--accent);
        color: #fff;
      }
      .contacts-current {
        gap: 8px;
        padding: 12px 14px 16px;
      }
      .contact-collapsible {
        border: 1px solid rgba(229, 233, 240, 0.9);
        border-radius: 14px;
        background: #fff;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
      }
      .contact-collapsible summary {
        list-style: none;
        cursor: pointer;
        padding: 10px 11px;
        font-size: 12px;
        font-weight: 800;
        color: var(--text);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .contact-collapsible summary::-webkit-details-marker {
        display: none;
      }
      .contact-collapsible summary::after {
        content: '▾';
        color: var(--muted-soft);
        transition: transform 0.14s ease;
      }
      .contact-collapsible:not([open]) summary::after {
        transform: rotate(-90deg);
      }
      .contact-collapsible-body {
        padding: 0 11px 10px;
      }
      .form-actions {
        position: sticky;
        bottom: 0;
        padding: 8px 0 0;
        background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.98) 24%);
      }
      .ai-sidebar {
        min-height: 0;
        height: 100%;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto auto;
        gap: 10px;
        padding: 12px 14px 16px;
      }
      .ai-sidebar-head {
        display: grid;
        gap: 3px;
      }
      .ai-sidebar-head strong {
        font-size: 14px;
      }
      .ai-sidebar-head p {
        margin: 0;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.35;
      }
      .ai-sidebar-messages {
        min-height: 0;
        overflow: auto;
        display: grid;
        gap: 10px;
        padding-right: 2px;
      }
      .ai-sidebar-message {
        display: flex;
      }
      .ai-sidebar-message.user {
        justify-content: flex-end;
      }
      .ai-sidebar-message.assistant {
        justify-content: flex-start;
      }
      .ai-sidebar-bubble {
        max-width: 100%;
        padding: 10px 11px;
        border-radius: 12px;
        background: #f5f7fb;
        border: 1px solid rgba(229, 233, 240, 0.92);
        font-size: 12px;
        line-height: 1.45;
      }
      .ai-sidebar-message.user .ai-sidebar-bubble {
        background: #eef3ff;
        border-color: rgba(40, 100, 255, 0.14);
      }
      .ai-sidebar-bubble.muted {
        color: var(--muted);
      }
      .ai-sidebar-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .ai-sidebar-quick {
        min-height: 30px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 800;
      }
      .ai-sidebar-input-wrap {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: end;
      }
      .ai-sidebar-input-wrap textarea {
        min-height: 84px;
        resize: vertical;
      }
      .ai-product-grid {
        display: grid;
        gap: 8px;
        margin-top: 8px;
      }
      .ai-product-card {
        display: grid;
        grid-template-columns: 52px minmax(0, 1fr);
        gap: 8px;
        padding: 8px;
        border-radius: 12px;
        background: #fff;
        border: 1px solid rgba(229, 233, 240, 0.92);
      }
      .ai-product-card img,
      .ai-product-image {
        width: 52px;
        height: 52px;
        object-fit: cover;
        border-radius: 10px;
        background: #eef2f8;
      }
      .ai-product-image-empty {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
      }
      .ai-product-card-body {
        display: grid;
        gap: 4px;
        min-width: 0;
      }
      .ai-product-card-body strong {
        font-size: 12px;
        line-height: 1.3;
      }
      .ai-product-card-body p {
        margin: 0;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.35;
      }
      .ai-product-card-body a {
        color: var(--accent);
        font-size: 11px;
        font-weight: 800;
        text-decoration: none;
      }
      .ai-product-card-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 2px;
      }
      .ai-product-insert-btn {
        min-height: 28px;
        padding: 6px 9px;
        border-radius: 10px;
        border: 1px solid rgba(40, 100, 255, 0.14);
        background: #eef3ff;
        color: var(--accent);
        font-size: 11px;
        font-weight: 800;
      }
      .product-picker-modal[hidden] {
        display: none !important;
      }
      .product-picker-modal {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: grid;
        place-items: center;
      }
      .product-picker-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.28);
        backdrop-filter: blur(3px);
      }
      .product-picker-dialog {
        position: relative;
        z-index: 1;
        width: min(720px, calc(100vw - 40px));
        max-height: min(80vh, 860px);
        overflow: hidden;
        border-radius: 18px;
        background: #fff;
        border: 1px solid rgba(229, 233, 240, 0.96);
        box-shadow: 0 24px 56px rgba(15, 23, 42, 0.18);
        display: grid;
        grid-template-rows: auto auto auto minmax(0, 1fr);
      }
      .product-picker-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px 12px;
        border-bottom: 1px solid rgba(229, 233, 240, 0.96);
      }
      .product-picker-head h3 {
        margin: 0;
        font-size: 16px;
      }
      .product-picker-head p {
        margin: 3px 0 0;
        color: var(--muted);
        font-size: 12px;
      }
      .product-picker-controls {
        display: grid;
        gap: 8px;
        padding: 12px 16px 0;
      }
      .product-picker-query-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 180px;
        gap: 8px;
      }
      .product-picker-controls input,
      .product-picker-controls select,
      .product-picker-controls textarea {
        width: 100%;
        border: 1px solid rgba(229, 233, 240, 0.96);
        border-radius: 12px;
        background: #fff;
        padding: 10px 12px;
        font-size: 13px;
        color: var(--text);
      }
      .product-picker-controls textarea {
        min-height: 72px;
        resize: vertical;
      }
      .product-search-results {
        min-height: 0;
        overflow-y: auto;
        padding: 0 16px 16px;
        display: grid;
        gap: 10px;
      }
      .product-picker-status {
        padding: 0 16px 12px;
      }
      .product-picker-detected {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 26px;
        padding: 4px 10px;
        border-radius: 999px;
        background: #eef2ff;
        color: #3354d1;
        font-size: 11px;
        font-weight: 700;
      }
      .product-picker-preview {
        padding: 0 16px 12px;
      }
      .product-picker-preview[hidden] {
        display: none;
      }
      .product-search-item {
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
        padding: 12px;
        border-radius: 14px;
        border: 1px solid rgba(229, 233, 240, 0.96);
        background: #fbfcff;
      }
      .product-search-item img,
      .product-search-item .product-offer-image-empty {
        width: 72px;
        height: 72px;
      }
      .product-search-copy {
        display: grid;
        gap: 5px;
        min-width: 0;
      }
      .product-search-copy strong {
        font-size: 13px;
        line-height: 1.35;
      }
      .product-search-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .product-search-chip {
        display: inline-flex;
        align-items: center;
        min-height: 20px;
        padding: 3px 8px;
        border-radius: 999px;
        background: #f1f4f8;
        color: #556174;
        font-size: 10px;
        font-weight: 800;
      }
      .product-search-chip.is-source {
        color: #3354d1;
        background: #eef2ff;
      }
      .product-search-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      @media (max-width: 900px) {
        .product-picker-query-row,
        .product-search-item {
          grid-template-columns: 1fr;
        }
      }
      .selection-ai-toolbar {
        position: fixed;
        z-index: 50;
        padding: 4px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(229, 233, 240, 0.96);
        box-shadow: 0 14px 32px rgba(15, 23, 42, 0.14);
      }
      .selection-ai-toolbar .ghost-btn {
        min-height: 30px;
        padding: 6px 11px;
        font-size: 11px;
        font-weight: 800;
        border-radius: 999px;
      }
      .sidebar {
        background: var(--left-bg);
        border-right: 1px solid var(--left-border);
      }
      .sidebar-head {
        border-bottom: 0;
        padding: 18px 16px 12px;
      }
      .sidebar-head h1 {
        color: var(--left-text);
        margin-bottom: 14px;
      }
      .toolbar {
        gap: 10px;
      }
      .toolbar-row {
        grid-template-columns: 1fr auto;
        gap: 6px;
      }
      .toolbar input,
      .toolbar select {
        background: #ffffff;
        border: 1px solid var(--border);
        color: var(--left-text);
        border-radius: 8px;
        font-size: 12px;
        padding: 8px 10px;
      }
      .toolbar input::placeholder {
        color: var(--left-icon);
      }
      .toolbar button.ghost-btn {
        background: #ffffff;
        border: 1px solid var(--border);
        color: var(--left-muted);
        border-radius: 6px;
        min-height: 32px;
        padding: 6px 12px;
        font-size: 12px;
      }
      .conversation-list {
        padding: 2px 8px 12px;
        gap: 2px;
      }
      .conversation-group-label {
        color: var(--left-icon);
        padding: 12px 8px 4px;
      }
      .conversation-group:not([open]) .conversation-group-label {
        background: transparent;
        border: 0;
        box-shadow: none;
      }
      .pill-count {
        background: #eef2ff;
        border-color: transparent;
        color: #3b5bdb;
      }
      .conversation-item {
        background: #ffffff;
        border: 1px solid #eeedf0;
        border-radius: 8px;
        padding: 10px 12px;
      }
      .conversation-item:hover {
        background: #ffffff;
        border-color: #d9e1fb;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
      }
      .conversation-item.active {
        background: #f5f8ff;
        border-color: #c5d0fa;
        box-shadow: 0 10px 24px rgba(59, 91, 219, 0.08);
      }
      .conversation-item.active::before {
        content: '';
        position: absolute;
        left: -1px;
        top: 20%;
        height: 60%;
        width: 3px;
        background: #5b7ff7;
        border-radius: 0 3px 3px 0;
      }
      .conversation-item {
        position: relative;
      }
      .conversation-avatar {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        border: 0;
        background: #eef2ff;
        color: #4c6fff;
        font-weight: 700;
      }
      .conversation-name {
        color: var(--left-text);
        font-weight: 500;
        font-size: 13px;
      }
      .conversation-secondary,
      .conversation-time,
      .last-message {
        color: var(--muted);
      }
      .conversation-meta {
        margin-top: 5px;
      }
      .status-pill {
        background: #f5f7fb;
        color: var(--muted);
      }
      .chat-panel {
        background: #ffffff;
        border-right: 1px solid var(--border);
      }
      .chat-head {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 58px;
        padding: 0 20px;
        border-bottom: 1px solid var(--border);
        background: #fff;
      }
      .chat-title-row {
        flex: 1;
        min-width: 0;
      }
      .chat-title-row h2 {
        font-size: 15px;
        font-weight: 600;
        line-height: 1.2;
      }
      .chat-title-row p {
        font-size: 11px;
        color: var(--muted-soft);
        margin-top: 1px;
      }
      .chat-meta {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .chat-meta-row {
        flex-wrap: nowrap;
      }
      .chat-status,
      .chat-meta-chip {
        min-height: 28px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 500;
      }
      .chat-assignment {
        min-height: 30px;
        gap: 6px;
        padding: 0 8px 0 10px;
        border-radius: 6px;
        box-shadow: none;
        background: #fafafa;
      }
      .chat-assignment-label,
      .chat-assignment-value,
      .chat-assignment select {
        font-size: 12px;
      }
      .chat-assignment select {
        min-height: 28px;
      }
      .messages {
        padding: 24px 24px 16px;
        gap: 14px;
        background: #fcfcfc;
      }
      .message-list {
        max-width: none;
        margin: 0;
        gap: 14px;
      }
      .message {
        max-width: 70%;
      }
      .message-row.operator .message {
        max-width: 70%;
      }
      .message-row.operator .message-sender,
      .message-row.operator .message-date,
      .message-row.operator .message-role {
        color: #6b6f80;
      }
      .message-row.visitor .message {
        max-width: 70%;
      }
      .message-row.ai .message {
        max-width: 70%;
      }
      .message-avatar {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        margin-top: 16px;
        font-size: 10px;
        font-weight: 700;
      }
      .reply-box {
        border-top: 1px solid var(--border);
        background: #fff;
        padding: 10px 16px 14px;
      }
      .composer-resize-handle {
        margin: -10px -16px 10px;
        height: 1px;
        background: var(--border);
      }
      .reply-top {
        border-bottom: 1px solid var(--border);
        padding-bottom: 9px;
        margin-bottom: 8px;
      }
      .reply-top input#operatorName {
        width: auto;
        min-width: 78px;
        max-width: 108px;
        padding: 4px 7px;
        border-radius: 6px;
        background: #f5f5f7;
      }
      .quick-replies-panel {
        border: 0;
        background: transparent;
        padding: 0;
      }
      .quick-replies-tools {
        gap: 4px;
        align-items: center;
      }
      .ai-actions {
        gap: 4px;
        flex-wrap: nowrap;
      }
      .ai-actions-label {
        color: var(--muted-soft);
        font-size: 10px;
      }
      .ai-assist-btn,
      .quick-replies-toggle,
      #aiActions select {
        min-height: 24px;
        padding: 2px 7px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
      }
      #aiActions select {
        width: 58px;
        min-width: 58px;
        padding-right: 20px;
      }
      .quick-replies-toggle {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
      }
      .quick-replies-toggle .quick-replies-icon {
        font-size: 11px;
        line-height: 1;
      }
      .reply-box textarea#replyInput {
        min-height: 96px;
        max-height: 360px;
        border: 0;
        border-radius: 0;
        background: transparent;
        padding: 0;
        font-size: 14px;
        line-height: 1.65;
        resize: vertical;
      }
      .reply-actions {
        justify-content: space-between;
        margin-top: 6px;
        padding-top: 8px;
        border-top: 1px solid var(--border);
      }
      .reply-actions-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: space-between;
        width: 100%;
      }
      .reply-status-actions {
        order: 2;
        gap: 6px;
      }
      .reply-send-actions {
        order: 3;
      }
      .primary-btn {
        border-radius: 6px;
        background: var(--accent);
      }
      .secondary-btn {
        border-radius: 6px;
        background: #fafafa;
        border: 1px solid #e0e0e0;
      }
      .contacts-panel {
        background: var(--right-bg);
      }
      .contacts-head {
        position: sticky;
        top: 0;
        z-index: 2;
        background: #fff;
        border-bottom: 1px solid var(--right-border);
        padding: 16px 16px 12px;
      }
      .contacts-head h3 {
        font-size: 14px;
        font-weight: 600;
      }
      .contacts-head p {
        font-size: 11px;
        color: var(--muted-soft);
      }
      .sidebar-segmented {
        background: #f5f5f7;
        border: 1px solid #e8e8e8;
      }
      .sidebar-tab-btn.active {
        background: var(--accent-soft);
        color: var(--accent);
      }
      .contacts-current {
        padding: 14px 16px;
        background: #fff;
      }
      .contact-collapsible,
      .contact-form,
      .contact-profile-sheet {
        margin-top: 6px;
      }
      .contact-form {
        gap: 9px;
      }
      .contact-field {
        grid-template-columns: 72px minmax(0, 1fr);
      }
      .contact-field label {
        width: auto;
      }
      .contacts-panel input,
      .contacts-panel textarea,
      .contacts-panel select {
        background: #fafafa;
        border: 1px solid #e8e8e8;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 13px;
      }
      .tag-btn {
        border-width: 1.5px;
        padding: 4px 11px;
        font-size: 11px;
        font-weight: 500;
      }
      .form-actions {
        background: #fff;
        padding-top: 4px;
      }
      .form-actions .primary-btn {
        width: 100%;
      }
      .muted-text {
        color: var(--muted);
        font-size: 12px;
      }
      @media (max-width: 1320px) {
        .layout {
          grid-template-columns: 280px minmax(0, 1fr);
        }
        .contacts-panel {
          display: none;
        }
      }
      @media (max-width: 1180px) {
        body {
          overflow: auto;
        }
        .layout {
          grid-template-columns: 300px minmax(0, 1fr);
          height: auto;
          max-width: 1328px;
          margin: 10px auto 18px;
        }
        .panel {
          height: auto;
          min-height: 280px;
        }
        .chat-panel {
          min-height: 72vh;
        }
        .chat-head {
          align-items: stretch;
        }
        .chat-meta {
          justify-content: flex-start;
        }
      }
      @media (max-width: 900px) {
        .layout {
          grid-template-columns: 1fr;
          padding: 0 8px;
          gap: 12px;
        }
        .sidebar {
          min-height: 320px;
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
    `,
    content: `
    <div class="layout">
      <aside class="panel sidebar">
        <div class="sidebar-head">
          <h1>Chats</h1>
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
        <div id="selectionAiToolbar" class="selection-ai-toolbar" hidden>
          <button id="askAiFromSelectionBtn" type="button" class="ghost-btn">Ask AI</button>
        </div>
        <div class="reply-box">
          <div id="composerResizeHandle" class="composer-resize-handle" aria-hidden="true"></div>
          <div class="reply-top">
            <input id="operatorName" type="text" value="Operator" placeholder="Ваше ім'я" />
            <div id="quickRepliesPanel" class="quick-replies-panel collapsed">
              <div class="quick-replies-tools">
                <div class="ai-actions" id="aiActions">
                  <span class="ai-actions-label">AI</span>
                  <button type="button" class="ai-assist-btn" data-ai-action="draft">AI</button>
                  <button type="button" class="ai-assist-btn" data-ai-action="polish">Fix</button>
                  <button type="button" class="ai-assist-btn" data-ai-action="shorten">Short</button>
                  <button type="button" class="ai-assist-btn" data-ai-action="more_sales">Sales</button>
                  <button id="openProductPickerBtn" type="button" class="ai-assist-btn">Prod</button>
                </div>
                <button id="toggleQuickRepliesBtn" type="button" class="quick-replies-toggle"><span class="quick-replies-icon">⚡</span><span>Replies</span></button>
              </div>
              <div class="quick-replies" id="quickReplies"></div>
            </div>
          </div>
          <textarea id="replyInput" rows="3" placeholder="Напишіть відповідь оператором..."></textarea>
          <div class="reply-actions">
            <div class="reply-send-actions">
              <button id="sendReplyBtn" type="button" class="primary-btn">Надіслати</button>
            </div>
            <div class="reply-actions-meta">
              <div class="reply-status-actions">
              <button id="markOpenBtn" type="button" class="secondary-btn">Open</button>
              <button id="requestFeedbackBtn" type="button" class="secondary-btn">Request feedback</button>
              <button id="markClosedBtn" type="button" class="secondary-btn">Closed</button>
              </div>
              <div class="muted-text">Enter — надіслати, Shift+Enter — новий рядок</div>
            </div>
          </div>
        </div>
      </main>

      <aside class="panel contacts-panel">
        <div class="contacts-head">
          <div>
            <h3>Workspace</h3>
            <p>CRM and AI tools for this conversation</p>
          </div>
          <div class="sidebar-segmented" role="tablist" aria-label="Sidebar tabs">
            <button id="contactSidebarTabBtn" type="button" class="sidebar-tab-btn active" role="tab" aria-selected="true">Contact</button>
            <button id="aiSidebarTabBtn" type="button" class="sidebar-tab-btn" role="tab" aria-selected="false">AI</button>
          </div>
        </div>
        <div class="contacts-body">
          <section id="currentContactPanel" class="contacts-tab-panel">
            <div class="contacts-current">
            <div class="section-head">
              <div>
                <h4>Contact</h4>
                <div id="currentVisitorHint" class="contact-status-line">No conversation selected</div>
              </div>
              <div class="section-head-actions">
                <span id="linkedContactBadge" class="pill-count">0</span>
              </div>
            </div>

            <div id="contactSuggestion" class="suggestion-box" hidden></div>
            <div id="linkedContactCard"></div>
            <div id="currentVisitorInfo" class="info-grid"></div>
            <details class="contact-collapsible" open>
              <summary>Activity</summary>
              <div id="currentContactActivity" class="contact-collapsible-body"></div>
            </details>
            <details class="contact-collapsible">
              <summary>AI Summary</summary>
              <div id="aiSummaryBlock" class="contact-collapsible-body"></div>
            </details>

            <form id="contactForm" class="contact-form">
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
                <div class="contact-field is-tags">
                  <label>Tags</label>
                  <div id="contactTags" class="tag-selector"></div>
                </div>
                <div class="contact-field is-notes">
                  <label for="contactNotesInput">Comment / Notes</label>
                  <textarea id="contactNotesInput" placeholder="Наприклад: хоче друк деталей авто, попросив відповісти в Telegram..."></textarea>
                </div>
              </div>
              <div class="form-actions">
                <button id="saveContactBtn" type="submit" class="primary-btn">Save</button>
                <button id="cancelContactBtn" type="button" class="secondary-btn" hidden>Cancel</button>
              </div>
            </form>
            <div id="contactProfileInline"></div>
            </div>
          </section>

          <section id="aiAssistantPanel" class="contacts-tab-panel" hidden>
            <div class="ai-sidebar">
              <div class="ai-sidebar-head">
                <strong>AI Assistant</strong>
                <p>Ask AI about this conversation or find products</p>
              </div>
              <div id="aiSidebarMessages" class="ai-sidebar-messages"></div>
              <div class="ai-sidebar-actions" id="aiSidebarQuickActions">
                <button type="button" class="ghost-btn ai-sidebar-quick" data-ai-sidebar-action="summarize">Summarize</button>
                <button type="button" class="ghost-btn ai-sidebar-quick" data-ai-sidebar-action="translate">Translate</button>
                <button type="button" class="ghost-btn ai-sidebar-quick" data-ai-sidebar-action="improve">Improve reply</button>
                <button type="button" class="ghost-btn ai-sidebar-quick" data-ai-sidebar-action="find_products">Find products</button>
              </div>
              <div class="ai-sidebar-input-wrap">
                <textarea id="aiSidebarInput" rows="3" placeholder="Ask AI about this conversation..."></textarea>
                <button id="aiSidebarSendBtn" type="button" class="primary-btn">Send</button>
              </div>
            </div>
          </section>

          <section id="allContactsPanel" class="contacts-tab-panel contacts-list-wrap" hidden style="display:none;">
            <div class="contacts-current" style="padding-bottom:12px;">
              <div class="section-head">
                <div>
                  <h4>Всі контакти</h4>
                  <p>Швидкий список контактів. Повна CRM-таблиця доступна на окремій сторінці Contacts.</p>
                </div>
                <div class="section-head-actions">
                  <a href="/contacts" class="ghost-btn icon-btn" style="text-decoration:none;" title="Відкрити Contacts" aria-label="Відкрити Contacts">↗</a>
                </div>
              </div>
            </div>
            <div class="contacts-search">
              <input id="contactsSearchInput" type="search" placeholder="Пошук по імені, телефону, email..." />
            </div>
            <div class="contacts-table-wrap">
              <div id="contactsList"></div>
            </div>
          </section>
        </div>
      </aside>

      <div id="productPickerModal" class="product-picker-modal" hidden>
        <div id="productPickerBackdrop" class="product-picker-backdrop"></div>
        <div class="product-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="productPickerTitle">
          <div class="product-picker-head">
            <div>
              <h3 id="productPickerTitle">Insert product</h3>
              <p>Search by title, SKU, keyword, or paste product URL.</p>
            </div>
            <button id="closeProductPickerBtn" type="button" class="ghost-btn icon-btn" aria-label="Close product picker">×</button>
          </div>
          <div class="product-picker-controls">
            <div class="product-picker-query-row">
              <input id="productSearchInput" type="search" placeholder="Search by title, SKU, keyword, or paste product URL" />
              <select id="productSourceSelect">
                <option value="all">All sources</option>
                <option value="shopify">Shopify</option>
                <option value="woocommerce">WooCommerce</option>
                <option value="custom_api">Custom API</option>
                <option value="local_catalog">Local catalog</option>
              </select>
            </div>
            <div id="productUrlDetectedBadge" class="product-picker-detected" hidden>Detected URL</div>
            <textarea id="productCustomMessageInput" rows="2" placeholder="Optional custom message"></textarea>
          </div>
          <div id="productSearchStatus" class="muted-text">Type at least 2 characters to search.</div>
          <div id="productResolvedPreview" class="product-picker-preview" hidden></div>
          <div id="productSearchResults" class="product-search-results"></div>
        </div>
      </div>
    </div>

    `,
    scripts: `<script>
      (function () {
        const CONVERSATIONS_POLL_MS = 8000;
        const OPEN_CONVERSATION_POLL_MS = 4000;
        const DEFAULT_QUICK_REPLIES = [
          { text: 'Дякуємо! Ми зв’яжемося з вами найближчим часом.' },
          { text: 'Надішліть, будь ласка, STL файл.' },
          { text: 'Для точного прорахунку вкажіть розмір деталі.' },
          { text: 'Напишіть ваш Telegram або телефон.' }
        ];
        const VIEWED_STORAGE_KEY = 'chat-platform-inbox-viewed';
        const GROUP_STATE_STORAGE_KEY = 'chat-platform-inbox-groups';
        const CONTACT_TAGS = [
          { value: 'lead', label: 'Lead' },
          { value: 'client', label: 'Client' },
          { value: 'vip', label: 'VIP' },
          { value: 'spam', label: 'Spam' }
        ];
        const INITIAL_PARAMS = new URLSearchParams(window.location.search);

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
          contactsTab: 'current',
          aiSummary: null,
          aiSummaryConversationId: '',
          aiSummaryLoading: false,
          contactDraft: null,
          selectedContactId: '',
          contactProfile: null,
          contactProfileDraft: null,
          contactProfileTab: 'info',
          contactProfileDirty: false,
          contactProfileError: '',
          loadingContactProfile: false,
          showContactForm: false,
          contactFormDirty: false,
          contactFormConversationId: '',
          contactDraftHydratedKey: '',
          siteSettingsMap: {},
          quickRepliesCollapsed: true,
          viewedConversationMap: readViewedConversationMap(),
          groupOpenStateMap: readGroupOpenStateMap(),
          aiActionLoading: false,
          activeAiAction: '',
          productSearchOpen: false,
          productSearchQuery: '',
          productSearchSource: 'all',
          productSearchResults: [],
          productSearchLoading: false,
          productResolveLoading: false,
          productResolvedItem: null,
          productDetectedSource: '',
          productQueryMode: 'search',
          feedbackRequestLoading: false,
          translateTargetLanguage: 'en',
          soundOnNewMessage: true,
          heardVisitorMessageMap: {},
          sidebarTab: 'contact',
          aiSidebarSessions: {},
          aiSidebarLoading: false,
          aiSidebarLoadingConversationId: '',
          aiSidebarSelectionText: ''
        };

        state.selectedConversationId = INITIAL_PARAMS.get('conversationId') || '';
        state.selectedContactId = INITIAL_PARAMS.get('contactId') || '';
        state.contactsTab = INITIAL_PARAMS.get('contactsTab') === 'all' ? 'all' : 'current';
        console.log('inbox_init');

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
        const requestFeedbackBtn = document.getElementById('requestFeedbackBtn');
        const markClosedBtn = document.getElementById('markClosedBtn');
        const composerResizeHandle = document.getElementById('composerResizeHandle');
        const quickRepliesPanel = document.getElementById('quickRepliesPanel');
        const toggleQuickRepliesBtn = document.getElementById('toggleQuickRepliesBtn');
        const aiActions = document.getElementById('aiActions');
        const openProductPickerBtn = document.getElementById('openProductPickerBtn');
        const quickReplies = document.getElementById('quickReplies');
        const currentVisitorHint = document.getElementById('currentVisitorHint');
        const linkedContactBadge = document.getElementById('linkedContactBadge');
        const contactSidebarTabBtn = document.getElementById('contactSidebarTabBtn');
        const aiSidebarTabBtn = document.getElementById('aiSidebarTabBtn');
        const currentContactTabBtn = document.getElementById('currentContactTabBtn');
        const allContactsTabBtn = document.getElementById('allContactsTabBtn');
        const currentContactPanel = document.getElementById('currentContactPanel');
        const aiAssistantPanel = document.getElementById('aiAssistantPanel');
        const allContactsPanel = document.getElementById('allContactsPanel');
        const contactSuggestion = document.getElementById('contactSuggestion');
        const linkedContactCard = document.getElementById('linkedContactCard');
        const currentContactActivity = document.getElementById('currentContactActivity');
        const aiSummaryBlock = document.getElementById('aiSummaryBlock');
        const currentVisitorInfo = document.getElementById('currentVisitorInfo');
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
        const contactProfileInline = document.getElementById('contactProfileInline');
        const aiSidebarMessages = document.getElementById('aiSidebarMessages');
        const aiSidebarInput = document.getElementById('aiSidebarInput');
        const aiSidebarSendBtn = document.getElementById('aiSidebarSendBtn');
        const aiSidebarQuickActions = document.getElementById('aiSidebarQuickActions');
        const productPickerModal = document.getElementById('productPickerModal');
        const productPickerBackdrop = document.getElementById('productPickerBackdrop');
        const closeProductPickerBtn = document.getElementById('closeProductPickerBtn');
        const productSearchInput = document.getElementById('productSearchInput');
        const productSourceSelect = document.getElementById('productSourceSelect');
        const productCustomMessageInput = document.getElementById('productCustomMessageInput');
        const productUrlDetectedBadge = document.getElementById('productUrlDetectedBadge');
        const productResolvedPreview = document.getElementById('productResolvedPreview');
        const productSearchStatus = document.getElementById('productSearchStatus');
        const productSearchResults = document.getElementById('productSearchResults');
        const selectionAiToolbar = document.getElementById('selectionAiToolbar');
        const askAiFromSelectionBtn = document.getElementById('askAiFromSelectionBtn');
        let operatorTypingTimer = 0;
        let operatorTypingConversationId = '';
        let operatorTypingActive = false;
        let contactProfileLoadTimer = 0;
        let contactProfileRequestId = 0;
        let composerResizeState = null;
        let productSearchTimer = 0;
        let lastSoundTime = 0;

        function logOverlay(eventName, meta) {
          try {
            console.log(eventName, Object.assign({ overlay: 'contact-profile' }, meta || {}));
          } catch (error) {
            console.log(eventName);
          }
        }

        function readViewedConversationMap() {
          try {
            const raw = window.localStorage.getItem(VIEWED_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
          } catch (error) {
            return {};
          }
        }

        function readGroupOpenStateMap() {
          try {
            const raw = window.localStorage.getItem(GROUP_STATE_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
          } catch (error) {
            return {};
          }
        }

        function writeGroupOpenStateMap() {
          try {
            window.localStorage.setItem(GROUP_STATE_STORAGE_KEY, JSON.stringify(state.groupOpenStateMap || {}));
          } catch (error) {
            console.error('Failed to store group open state', error);
          }
        }

        function writeViewedConversationMap() {
          try {
            window.localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(state.viewedConversationMap || {}));
          } catch (error) {
            console.error('Failed to store viewed conversation map', error);
          }
        }

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

        function formatSidebarTime(value) {
          if (!value) return '';
          const date = new Date(String(value).replace(' ', 'T') + 'Z');
          if (Number.isNaN(date.getTime())) return value;

          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const diffDays = Math.round((todayStart - targetStart) / 86400000);

          if (diffDays === 0) {
            return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
          }
          if (diffDays === 1) {
            return 'Вчора';
          }
          return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
        }

        function sanitizePreviewText(value) {
          const text = String(value || '')
            .split('\\\\').join('/')
            .split(/\\s+/).join(' ')
            .trim();
          if (!text) return '';
          const meaninglessCharacters = '/|.-_,:;';
          const onlyMeaninglessChars = text.split('').every(function (character) {
            return meaninglessCharacters.indexOf(character) >= 0;
          });
          if (onlyMeaninglessChars) return '';
          if (text === '/' || text === '-' || text === '|' || text === '...') return '';
          return text;
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

        function getInitials(value, fallback) {
          const source = String(value || fallback || '').trim();
          if (!source) return 'OP';
          const parts = source.split(/\s+/).filter(Boolean);
          if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
          }
          return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }

        function nl2br(value) {
          return escapeHtml(value).replace(/\\n/g, '<br />');
        }

        function normalizePhone(value) {
          return Array.from(String(value || ''))
            .filter(function (character) {
              return '0123456789+(). -'.indexOf(character) >= 0;
            })
            .join('')
            .trim();
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
          if (status === 'waiting_operator') return 'Waiting for operator';
          if (status === 'closed') return 'Closed';
          if (status === 'human') return 'In conversation';
          if (status === 'ai') return 'AI handling';
          return 'AI handling';
        }

        function formatConversationStatusBadgeLabel(status) {
          if (status === 'waiting_operator') return 'Waiting';
          if (status === 'closed') return 'Closed';
          if (status === 'human') return 'Human';
          if (status === 'ai') return 'AI';
          return 'AI';
        }

        function getConversationStatus(item) {
          if (!item) return 'open';
          if (item.status === 'closed' || item.inboxStatus === 'closed') return 'closed';
          if (item.status === 'waiting_operator') return 'waiting_operator';
          if (item.status === 'human') return 'human';
          if (item.status === 'ai') return 'ai';
          return 'ai';
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
          return renderBadge(formatConversationStatusBadgeLabel(status), status, '');
        }

        function formatChannelLabel(channel) {
          const clean = String(channel || 'web').trim().toLowerCase();
          if (clean === 'telegram') return 'Telegram';
          if (clean === 'instagram') return 'Instagram';
          if (clean === 'facebook') return 'Facebook';
          return 'Web';
        }

        function renderConversationChannelBadge(item) {
          return renderBadge(formatChannelLabel(item && item.channel), 'subtle', 'channel-badge');
        }

        function renderUnreadBadge(item) {
          const unreadCount = Math.max(0, Number(item && item.unreadCount) || 0);
          if (!unreadCount) return '';
          return '<span class="badge-unread">' + escapeHtml(String(unreadCount)) + '</span>';
        }

        function getVisitorMessageFingerprint(item) {
          if (!item) return '';
          return String(item.lastVisitorMessageAt || item.lastMessageAt || '').trim();
        }

        function playMessageSound() {
          if (!state.soundOnNewMessage) return;
          const now = Date.now();
          if (now - lastSoundTime < 2000) return;
          const sound = new Audio('/sounds/message.mp3');
          sound.volume = 0.4;
          sound.play().catch(function () {});
          lastSoundTime = now;
        }

        function maybePlayIncomingMessageSound(nextConversations, previousConversations) {
          if (!state.soundOnNewMessage) return;
          const previousMap = new Map((previousConversations || []).map(function (item) {
            return [String(item.conversationId || ''), item];
          }));

          let shouldPlay = false;
          (nextConversations || []).some(function (item) {
            const conversationId = String(item && item.conversationId || '').trim();
            if (!conversationId) return false;

            const nextFingerprint = getVisitorMessageFingerprint(item);
            if (!nextFingerprint) return false;

            const previousItem = previousMap.get(conversationId) || null;
            const previousFingerprint = getVisitorMessageFingerprint(previousItem);
            const heardFingerprint = String(state.heardVisitorMessageMap[conversationId] || '').trim();
            const unreadCount = Math.max(0, Number(item && item.unreadCount) || 0);
            const isOperatorTypingHere = operatorTypingActive && operatorTypingConversationId === conversationId;

            if (
              nextFingerprint &&
              nextFingerprint !== previousFingerprint &&
              nextFingerprint !== heardFingerprint &&
              unreadCount > 0 &&
              !isOperatorTypingHere
            ) {
              shouldPlay = true;
              return true;
            }
            return false;
          });

          if (shouldPlay) {
            playMessageSound();
          }
        }

        function syncHeardVisitorMessages(conversations) {
          (conversations || []).forEach(function (item) {
            const conversationId = String(item && item.conversationId || '').trim();
            const fingerprint = getVisitorMessageFingerprint(item);
            if (conversationId && fingerprint) {
              state.heardVisitorMessageMap[conversationId] = fingerprint;
            }
          });
        }

        function renderChatStatusBar(item) {
          const status = getConversationStatus(item);
          const statusClass = status === 'waiting_operator' ? 'waiting' : status;
          return '<span class="chat-status ' + escapeHtml(statusClass) + '">' + escapeHtml(formatConversationStatus(status)) + '</span>';
        }

        function formatConversationStartMeta(item) {
          const parts = [];
          if (item && item.channel) parts.push(formatChannelLabel(item.channel));
          if (item && item.siteId) parts.push(String(item.siteId));
          if (item && item.createdAt) parts.push(formatDate(item.createdAt));
          return parts.join(' • ') || 'Conversation metadata';
        }

        function getAssignableOperators(conversation) {
          const settings = getConversationSiteSettings(conversation);
          const operators = Array.isArray(settings && settings.operators)
            ? settings.operators.map(function (item) {
                return String(item && item.name || '').trim();
              }).filter(Boolean)
            : [];
          const assignedOperator = String(conversation && conversation.assignedOperator || '').trim();
          if (assignedOperator && operators.indexOf(assignedOperator) === -1) {
            operators.unshift(assignedOperator);
          }
          if (!operators.length) {
            operators.push('Operator');
          }
          return operators;
        }

        function renderAssignedOperatorControl(conversation) {
          const assignedOperator = String(conversation && conversation.assignedOperator || '').trim();
          const options = ['<option value="">Unassigned</option>'].concat(getAssignableOperators(conversation).map(function (operatorName) {
            const selected = assignedOperator === operatorName ? ' selected' : '';
            return '<option value="' + escapeHtml(operatorName) + '"' + selected + '>' + escapeHtml(operatorName) + '</option>';
          }));
          return '<div class="chat-assignment">' +
            '<span class="chat-assignment-label">Operator:</span>' +
            '<span class="chat-assignment-value">' + escapeHtml(assignedOperator || 'Unassigned') + '</span>' +
            '<select id="assignOperatorSelect" aria-label="Assign operator">' + options.join('') + '</select>' +
          '</div>';
        }

        function renderContactStatusBadge(status) {
          return renderBadge(getContactStatusLabel(status), status, status === 'closed' ? 'contact-status-closed' : '');
        }

        function renderTagBadges(tags) {
          return (tags || []).map(function (tag) {
            return renderBadge(String(tag || '').toUpperCase(), tag, '');
          }).join('');
        }

        function getCurrentSiteSettings() {
          const siteId = state.selectedConversation && state.selectedConversation.siteId
            ? state.selectedConversation.siteId
            : '';
          return siteId ? state.siteSettingsMap[siteId] || null : null;
        }

        function getConversationSiteSettings(conversation) {
          const siteId = conversation && conversation.siteId ? conversation.siteId : '';
          return siteId ? state.siteSettingsMap[siteId] || null : null;
        }

        function getManagerProfile(conversation, message) {
          const settings = getConversationSiteSettings(conversation);
          const managerName = String(message && message.senderName || settings && settings.managerName || 'Operator').trim();
          const managerTitle = String(settings && (settings.managerTitle || settings.operatorMetaLabel) || 'Менеджер').trim();
          const managerAvatarUrl = String(settings && settings.managerAvatarUrl || '').trim();
          return {
            name: managerName || 'Operator',
            title: managerTitle || 'Менеджер',
            avatarLabel: getInitials(managerName, settings && settings.managerName)
          };
        }

        function getCurrentAiAssistantSettings() {
          const settings = getCurrentSiteSettings();
          return settings && settings.aiAssistant ? settings.aiAssistant : null;
        }

        function getOperatorQuickReplies() {
          const settings = getCurrentSiteSettings();
          const items = settings && Array.isArray(settings.operatorQuickReplies) && settings.operatorQuickReplies.length
            ? settings.operatorQuickReplies
            : DEFAULT_QUICK_REPLIES;
          return items.map(function (item) {
            return typeof item === 'string' ? { text: item } : { text: String(item && item.text || '').trim() };
          }).filter(function (item) {
            return item.text;
          });
        }

        function syncOperatorIdentity() {
          const settings = getCurrentSiteSettings();
          const defaultName = String(settings && settings.managerName || 'Operator').trim() || 'Operator';
          const previousDefault = String(operatorNameInput.getAttribute('data-default-name') || '').trim();
          const currentValue = String(operatorNameInput.value || '').trim();

          if (!currentValue || currentValue === previousDefault || currentValue === 'Operator') {
            operatorNameInput.value = defaultName;
          }

          operatorNameInput.setAttribute('data-default-name', defaultName);
          operatorNameInput.placeholder = defaultName;
        }

        async function pushOperatorTyping(active, conversationIdOverride) {
          const conversationId = String(conversationIdOverride || state.selectedConversationId || '').trim();
          if (!conversationId) return;
          if (operatorTypingConversationId === conversationId && operatorTypingActive === active) return;
          operatorTypingConversationId = conversationId;
          operatorTypingActive = active;
          await fetchJson('/api/inbox/conversations/' + encodeURIComponent(conversationId) + '/typing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              active: active,
              operatorName: operatorNameInput.value.trim() || 'Operator'
            })
          });
        }

        function scheduleOperatorTypingStop(conversationId) {
          if (operatorTypingTimer) {
            window.clearTimeout(operatorTypingTimer);
          }
          operatorTypingTimer = window.setTimeout(function () {
            operatorTypingTimer = 0;
            pushOperatorTyping(false, conversationId).catch(console.error);
          }, 2000);
        }

        function handleOperatorTypingInput() {
          const conversationId = String(state.selectedConversationId || '').trim();
          if (!conversationId) return;
          if (!String(replyInput.value || '').trim()) {
            if (operatorTypingTimer) {
              window.clearTimeout(operatorTypingTimer);
              operatorTypingTimer = 0;
            }
            pushOperatorTyping(false, conversationId).catch(console.error);
            return;
          }
          pushOperatorTyping(true, conversationId).catch(console.error);
          scheduleOperatorTypingStop(conversationId);
        }

        function stopOperatorTyping(conversationIdOverride) {
          if (operatorTypingTimer) {
            window.clearTimeout(operatorTypingTimer);
            operatorTypingTimer = 0;
          }
          pushOperatorTyping(false, conversationIdOverride || state.selectedConversationId || '').catch(console.error);
        }

        function getLatestVisitorMessageAt(messages) {
          const visitorMessages = (messages || []).filter(function (message) {
            return message.senderType === 'visitor';
          });
          if (!visitorMessages.length) return '';
          return String(visitorMessages[visitorMessages.length - 1].createdAt || '');
        }

        function getMeaningfulPreview(item) {
          const preview = sanitizePreviewText(item && item.lastMessage);
          if (preview) return preview;
          if (item && item.hasAttachments) return 'Надіслано файл';
          if (item && item.status === 'closed') return 'Діалог закрито';
          return 'Новий діалог';
        }

        function getConversationLabel(item) {
          const source = sanitizePreviewText(item && item.sourcePage);
          if (source) {
            let cleanSource = source;
            while (cleanSource.charAt(0) === '/') {
              cleanSource = cleanSource.slice(1);
            }
            return cleanSource || item.siteId || 'Conversation';
          }
          return item && item.siteId ? item.siteId : 'Conversation';
        }

        function getConversationLinkedContact(item) {
          const conversationId = String(item && item.conversationId || '').trim();
          if (!conversationId) return null;
          return (state.contacts || []).find(function (contact) {
            return String(contact && contact.conversationId || '').trim() === conversationId;
          }) || null;
        }

        function getContactPrimaryLabel(contact) {
          if (!contact) return '';
          return sanitizePreviewText(contact.name) ||
            sanitizePreviewText(contact.phone) ||
            sanitizePreviewText(contact.telegram) ||
            sanitizePreviewText(contact.email) ||
            '';
        }

        function getVisitorFallbackLabel(visitorId) {
          const cleanVisitorId = sanitizePreviewText(visitorId);
          if (!cleanVisitorId) return 'Відвідувач';
          const compact = cleanVisitorId.replace(/^v[_-]?/i, '');
          const suffix = compact.slice(-5);
          return suffix ? ('Відвідувач ' + suffix) : 'Відвідувач';
        }

        function getConversationDisplayName(item) {
          const contact = getConversationLinkedContact(item);
          const contactLabel = getContactPrimaryLabel(contact);
          if (contactLabel) return contactLabel;
          return getVisitorFallbackLabel(item && item.visitorId);
        }

        function getConversationSecondaryLabel(item) {
          const contact = getConversationLinkedContact(item);
          if (contact) {
            return sanitizePreviewText(contact.phone) ||
              sanitizePreviewText(contact.telegram) ||
              sanitizePreviewText(contact.email) ||
              '';
          }
          return sanitizePreviewText(item && item.visitorEmail) ||
            sanitizePreviewText(item && item.visitorPhone) ||
            sanitizePreviewText(item && item.visitorTelegram) ||
            sanitizePreviewText(item && item.sourcePage) ||
            '';
        }

        function getInitials(value) {
          const words = String(value || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          if (!words.length) return 'V';
          if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
          return (words[0][0] + words[1][0]).toUpperCase();
        }

        function isConversationUnread(item) {
          return Math.max(0, Number(item && item.unreadCount) || 0) > 0;
        }

        function openConversationGroupForItem(item) {
          const dayKey = getConversationDayKey(item);
          if (!dayKey) return;
          state.groupOpenStateMap[dayKey] = true;
          writeGroupOpenStateMap();
        }

        function markConversationViewed(conversationId, viewedAt) {
          const cleanId = String(conversationId || '');
          const cleanViewedAt = String(viewedAt || '');
          if (!cleanId || !cleanViewedAt) return;
          if (String(state.viewedConversationMap[cleanId] || '') === cleanViewedAt) return;
          state.viewedConversationMap[cleanId] = cleanViewedAt;
          writeViewedConversationMap();
          renderConversationList();
        }

        function updateConversationInState(nextConversation) {
          if (!nextConversation || !nextConversation.conversationId) return;
          state.conversations = state.conversations.map(function (item) {
            return item.conversationId === nextConversation.conversationId
              ? Object.assign({}, item, nextConversation)
              : item;
          });
          if (state.selectedConversation && state.selectedConversation.conversationId === nextConversation.conversationId) {
            state.selectedConversation = Object.assign({}, state.selectedConversation, nextConversation);
          }
        }

        async function markConversationAsRead(conversationId) {
          const cleanConversationId = String(conversationId || '').trim();
          if (!cleanConversationId) return;
          const payload = await fetchJson('/api/inbox/conversations/' + encodeURIComponent(cleanConversationId) + '/read', {
            method: 'POST'
          });
          if (payload && payload.conversation) {
            updateConversationInState(payload.conversation);
            renderConversationList();
            if (state.selectedConversation && state.selectedConversation.conversationId === cleanConversationId) {
              renderConversation(state.selectedConversation, state.selectedMessages, {
                preserveScroll: true
              });
            }
          }
        }

        async function assignOperator(operatorName) {
          if (!state.selectedConversationId) return;
          const payload = await fetchJson('/api/inbox/conversations/' + encodeURIComponent(state.selectedConversationId) + '/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operator: operatorName
            })
          });
          if (payload && payload.conversation) {
            updateConversationInState(payload.conversation);
            renderConversationList();
            if (state.selectedConversation && state.selectedMessages) {
              renderConversation(state.selectedConversation, state.selectedMessages, {
                preserveScroll: true
              });
            }
          }
        }

        function getContactHydrationKey(source) {
          return [
            state.selectedConversation ? state.selectedConversation.conversationId : '',
            source && source.contactId ? source.contactId : '',
            source && source.updatedAt ? source.updatedAt : '',
            source && source.name ? source.name : '',
            source && source.phone ? source.phone : '',
            source && source.telegram ? source.telegram : '',
            source && source.email ? source.email : ''
          ].join('|');
        }

        function isNearBottom(element, threshold) {
          if (!element) return true;
          return (element.scrollHeight - element.scrollTop - element.clientHeight) <= (threshold || 48);
        }

        async function fetchJson(url, options) {
          const response = await fetch(url, options);
          console.log('fetch_status', url, response.status);
          const payload = await response.json();
          if (!response.ok || !payload.ok) {
            throw new Error(payload.message || 'Request failed');
          }
          return payload;
        }

        async function loadSiteSettings() {
          const payload = await fetchJson('/api/admin/sites');
          state.siteSettingsMap = (payload.sites || []).reduce(function (accumulator, site) {
            accumulator[site.siteId] = site;
            return accumulator;
          }, {});
          syncOperatorIdentity();
          renderQuickReplies();
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

        function syncContactDraft(source, force) {
          const nextSource = source || state.linkedContact || state.detectedContact || {};
          const nextHydrationKey = getContactHydrationKey(nextSource);
          const currentConversationId = state.selectedConversation ? state.selectedConversation.conversationId : '';
          const shouldPreserveDirtyDraft =
            state.showContactForm &&
            state.contactFormDirty &&
            state.contactFormConversationId === currentConversationId &&
            force !== true;

          if (shouldPreserveDirtyDraft) {
            return;
          }

          if (state.contactDraftHydratedKey === nextHydrationKey && force !== true) {
            return;
          }

          state.contactDraft = buildContactDraft(nextSource);
          state.contactFormConversationId = currentConversationId;
          state.contactDraftHydratedKey = nextHydrationKey;
          state.contactFormDirty = false;
          renderContactForm(true);
        }

        function setContactFormVisible(visible) {
          state.showContactForm = visible !== false;
          contactForm.hidden = !state.showContactForm;
          cancelContactBtn.hidden = !state.contactFormDirty;
        }

        function renderQuickReplies() {
          const items = getOperatorQuickReplies();
          const aiSettings = getCurrentAiAssistantSettings();
          const aiEnabled = Boolean(aiSettings && aiSettings.enabled);
          const translateOptions = [
            { value: 'en', label: 'EN' },
            { value: 'uk', label: 'UA' },
            { value: 'ru', label: 'RU' }
          ];
          const aiActionsConfig = [
            { key: 'draft', label: 'AI' },
            { key: 'polish', label: 'Fix' },
            { key: 'translate', label: 'Trans' },
            { key: 'shorten', label: 'Short' },
            { key: 'more_sales', label: 'Sales' }
          ];
          quickRepliesPanel.classList.toggle('collapsed', state.quickRepliesCollapsed);
          aiActions.innerHTML =
            '<span class="ai-actions-label">AI</span>' +
            '<select id="translateLanguageSelect" class="ai-language-select" aria-label="Translate target language">' +
              translateOptions.map(function (item) {
                return '<option value="' + escapeHtml(item.value) + '"' + (state.translateTargetLanguage === item.value ? ' selected' : '') + '>' + escapeHtml(item.label) + '</option>';
              }).join('') +
            '</select>' +
            aiActionsConfig.map(function (item) {
            const isLoading =
              (item.key === 'summary' && state.aiSummaryLoading) ||
              (state.aiActionLoading && state.activeAiAction === item.key);
            const label = isLoading ? 'AI...' : item.label;
            const classes = 'ai-assist-btn' + (isLoading ? ' is-loading' : '');
            const disabled = state.aiActionLoading || state.aiSummaryLoading || !state.selectedConversation || !aiEnabled;
            return '<button type="button" class="' + classes + '" data-ai-action="' + escapeHtml(item.key) + '"' + (disabled ? ' disabled' : '') + '>' + escapeHtml(label) + '</button>';
          }).join('') +
            '<button type="button" class="ai-assist-btn" data-ai-action="product_picker"' + (!state.selectedConversation ? ' disabled' : '') + '>Prod</button>';
          aiActions.title = aiEnabled ? '' : 'Enable AI Assistant in Settings for this site.';
          quickReplies.innerHTML = items.map(function (item) {
            return '<button type="button" class="quick-reply-btn" data-quick-reply="' + escapeHtml(item.text) + '">' + escapeHtml(item.text) + '</button>';
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
          console.log('render_chats_target', !!conversationList);
          console.log('active_filter', state.status);
          if (!conversationList) return;
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
            const hasStoredState = Object.prototype.hasOwnProperty.call(state.groupOpenStateMap, group.dayKey);
            const isOpen = hasStoredState ? state.groupOpenStateMap[group.dayKey] === true : (isToday || hasSelectedConversation);
            const openAttr = isOpen ? ' open' : '';
            const itemsHtml = group.items.map(function (item) {
              const inboxStatus = item.inboxStatus || (item.status === 'closed' ? 'closed' : 'open');
              const displayName = getConversationDisplayName(item);
              const secondaryLabel = getConversationSecondaryLabel(item);
              const preview = getMeaningfulPreview(item);
              const unreadBadge = renderUnreadBadge(item);
              const timeLabel = formatSidebarTime(item.lastMessageAt);
              const avatarLabel = getInitials(displayName);
              return '<button type="button" class="conversation-item ' + (item.conversationId === state.selectedConversationId ? 'active ' : '') + (inboxStatus === 'closed' ? 'closed' : '') + '" data-conversation-id="' + escapeHtml(item.conversationId) + '">' +
                '<div class="conversation-main">' +
                  '<div class="conversation-avatar">' + escapeHtml(avatarLabel) + '</div>' +
                  '<div class="conversation-body">' +
                    '<div class="conversation-header">' +
                      '<span class="conversation-identity"><span class="conversation-name">' + escapeHtml(displayName) + '</span><span class="conversation-secondary">' + escapeHtml(secondaryLabel) + '</span></span>' +
                      '<span class="conversation-time-wrap"><span class="conversation-time">' + escapeHtml(timeLabel) + '</span>' + unreadBadge + '</span>' +
                    '</div>' +
                    '<div class="last-message">' + escapeHtml(preview) + '</div>' +
                    '<div class="conversation-meta">' + renderConversationChannelBadge(item) + '<span class="status-pill">' + escapeHtml(item.siteId || '-') + '</span>' + renderConversationStatusBadge(item) + '</div>' +
                  '</div>' +
                '</div>' +
              '</button>';
            }).join('');

            return '<details class="conversation-group" data-day-key="' + escapeHtml(group.dayKey) + '"' + openAttr + '>' +
              '<summary class="conversation-group-label"><span>' + escapeHtml(isToday ? 'Сьогодні' : formatDayLabel(group.dayKey)) + '</span><span class="pill-count">' + escapeHtml(String(group.items.length)) + '</span></summary>' +
              '<div class="conversation-group-items">' + itemsHtml + '</div>' +
            '</details>';
          }).join('');
        }

        function renderEmptyConversation() {
          stopOperatorTyping(state.selectedConversationId || '');
          hideSelectionAiToolbar();
          state.selectedConversation = null;
          state.selectedMessages = [];
          state.selectedMessagesSignature = '';
          state.aiSummary = null;
          state.aiSummaryConversationId = '';
          state.aiSummaryLoading = false;
          state.contactDraftHydratedKey = '';
          conversationTitle.textContent = 'Оберіть діалог';
          conversationSummary.textContent = 'Messenger-style workspace для оператора.';
          conversationMeta.innerHTML = '';
          messagesPane.innerHTML = '<div class="empty-state">Оберіть діалог у списку зліва.</div>';
          state.linkedContact = null;
          state.detectedContact = null;
          state.selectedContactId = '';
          syncOperatorIdentity();
          syncFeedbackRequestButton();
          renderQuickReplies();
          syncContactDraft({});
          renderContactsPanel();
        }

        function syncConversationHeading() {
          if (!state.selectedConversation) return;
          const conversation = state.selectedConversation;
          const selectedLabel = getContactPrimaryLabel(state.linkedContact) || getContactPrimaryLabel(state.detectedContact) || getVisitorFallbackLabel(conversation.visitorId);
          const selectedSecondary = formatConversationStartMeta(conversation) || '';
          conversationTitle.textContent = selectedLabel;
          conversationSummary.textContent = selectedSecondary;
        }

        function syncFeedbackRequestButton() {
          if (!requestFeedbackBtn) return;
          const conversation = state.selectedConversation || null;
          const requested = Boolean(conversation && conversation.feedbackRequestedAt);
          const completed = Boolean(conversation && conversation.feedbackCompletedAt);
          requestFeedbackBtn.disabled = !conversation || state.feedbackRequestLoading || requested;
          if (!conversation) {
            requestFeedbackBtn.textContent = 'Request feedback';
            return;
          }
          if (state.feedbackRequestLoading) {
            requestFeedbackBtn.textContent = 'Requesting...';
            return;
          }
          if (completed) {
            requestFeedbackBtn.textContent = 'Feedback received';
            return;
          }
          if (requested) {
            requestFeedbackBtn.textContent = 'Feedback requested';
            return;
          }
          requestFeedbackBtn.textContent = 'Request feedback';
        }

        function renderConversation(conversation, messages, options) {
          console.log('render_conversation_target', !!messagesPane);
          if (!messagesPane) return;
          hideSelectionAiToolbar();
          const settings = options || {};
          const shouldStickToBottom = settings.forceScrollBottom || isNearBottom(messagesPane, 64);
          const previousScrollTop = messagesPane.scrollTop;
          const previousScrollHeight = messagesPane.scrollHeight;

          state.selectedConversation = conversation;
          state.selectedMessages = messages;
          state.selectedMessagesSignature = buildMessagesSignature(messages);
          state.detectedContact = detectContactFromMessages(messages);
          if (state.aiSummaryConversationId && state.aiSummaryConversationId !== conversation.conversationId && !state.aiSummaryLoading) {
            state.aiSummary = null;
            state.aiSummaryConversationId = '';
          }
          syncOperatorIdentity();
          syncFeedbackRequestButton();
          renderQuickReplies();

          syncConversationHeading();
          conversationMeta.innerHTML =
            '<div class="chat-meta-row">' +
              renderConversationChannelBadge(conversation) +
              renderChatStatusBar(conversation) +
              renderAssignedOperatorControl(conversation) +
              (conversation.sourcePage ? '<span class="chat-meta-chip chat-source-chip">' + escapeHtml(conversation.sourcePage) + '</span>' : '') +
            '</div>';

          messagesPane.innerHTML = '<div class="message-list">' + messages.map(function (message) {
            const attachments = Array.isArray(message.attachments) && message.attachments.length
              ? '<div class="attachments">' + message.attachments.map(function (file) {
                  return '<a href="' + escapeHtml(file.publicUrl || '#') + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(file.fileName || 'file') + '</a>';
                }).join('') + '</div>'
              : '';
            const productOffer = String(message.messageType || '') === 'product_offer'
              ? renderProductOfferCard(message.rawPayload || {}, {})
              : '';
            const senderType = String(message.senderType || 'system');
            const managerProfile = senderType === 'operator' ? getManagerProfile(conversation, message) : null;
            const avatarLabel =
              senderType === 'operator' ? managerProfile.avatarLabel
                : senderType === 'ai' ? 'AI'
                  : senderType === 'visitor' ? 'VI'
                    : 'SY';
            const senderLabel =
              senderType === 'operator' ? managerProfile.name
                : senderType === 'ai' ? 'AI'
                  : senderType === 'visitor' ? 'Visitor'
                    : senderType;

            return '<div class="message-row ' + escapeHtml(senderType) + '">' +
              '<div class="message-avatar">' + escapeHtml(avatarLabel) + '</div>' +
              '<article class="message">' +
                '<div class="message-head"><span class="message-sender">' + escapeHtml(senderLabel || '-') + '</span><span class="message-date">' + escapeHtml(formatShortDate(message.createdAt)) + '</span></div>' +
                (message.text ? '<div class="message-text' + (productOffer ? ' product-offer-text' : '') + '">' + nl2br(message.text) + '</div>' : '') +
                productOffer +
                attachments +
              '</article>' +
            '</div>';
          }).join('') + '</div>';

          if (shouldStickToBottom) {
            messagesPane.scrollTop = messagesPane.scrollHeight;
          } else if (settings.preserveScroll !== false) {
            const scrollDelta = messagesPane.scrollHeight - previousScrollHeight;
            messagesPane.scrollTop = Math.max(0, previousScrollTop + scrollDelta);
          }

          syncContactDraft(state.linkedContact || state.detectedContact || {});
          renderContactsPanel();
          markConversationViewed(conversation.conversationId, getLatestVisitorMessageAt(messages));
        }

        function renderInfoRow(label, value) {
          return '<div class="info-row"><div class="info-label">' + escapeHtml(label) + '</div><div class="info-value' + (value ? '' : ' empty') + '">' + escapeHtml(value || 'не знайдено') + '</div></div>';
        }

        function renderIdentityRow(icon, label, value) {
          return '<div class="contact-identity-row">' +
            '<span class="contact-identity-icon">' + escapeHtml(icon) + '</span>' +
            '<span class="contact-identity-label">' + escapeHtml(label) + '</span>' +
            '<span class="contact-identity-value' + (value ? '' : ' empty') + '">' + escapeHtml(value || 'не знайдено') + '</span>' +
          '</div>';
        }

        function renderAiSummary() {
          if (!aiSummaryBlock) return;
          if (!state.selectedConversation) {
            aiSummaryBlock.innerHTML = '<div class="empty-state">No summary yet.</div>';
            return;
          }

          if (
            state.selectedConversation &&
            state.aiSummaryConversationId &&
            state.aiSummaryConversationId !== state.selectedConversation.conversationId &&
            !state.aiSummaryLoading
          ) {
            state.aiSummary = null;
            state.aiSummaryConversationId = '';
          }

          if (state.aiSummaryLoading) {
            aiSummaryBlock.innerHTML = '<div class="empty-state">Generating summary…</div>';
            return;
          }

          if (!state.aiSummary) {
            aiSummaryBlock.innerHTML =
              '<div class="empty-state">No summary yet.</div>' +
              '<button type="button" class="ghost-btn" id="generateAiSummaryBtn">Generate</button>';
            return;
          }

          const summary = state.aiSummary || {};
          const known = Array.isArray(summary.knownInformation) ? summary.knownInformation : [];
          const missing = Array.isArray(summary.missingInformation) ? summary.missingInformation : [];
          const items = [];
          if (summary.customerGoal) items.push(summary.customerGoal);
          if (known.length) items.push('Known: ' + known.join(', '));
          if (missing.length) items.push('Missing: ' + missing.join(', '));
          if (summary.recommendedNextStep) items.push('Next: ' + summary.recommendedNextStep);
          aiSummaryBlock.innerHTML =
            (items.length
              ? '<ul class="activity-list">' + items.map(function (item) {
                  return '<li class="activity-item" data-icon="•">' + escapeHtml(item) + '</li>';
                }).join('') + '</ul>'
              : '<div class="empty-state">No summary yet.</div>');
        }

        function setComposerHeight(nextHeight) {
          const clamped = Math.max(120, Math.min(360, Number(nextHeight) || 0));
          replyInput.style.height = clamped + 'px';
        }

        function startComposerResize(event) {
          event.preventDefault();
          composerResizeState = {
            startY: event.clientY,
            startHeight: replyInput.getBoundingClientRect().height
          };
          document.body.style.userSelect = 'none';
        }

        function handleComposerResize(event) {
          if (!composerResizeState) return;
          const delta = composerResizeState.startY - event.clientY;
          setComposerHeight(composerResizeState.startHeight + delta);
        }

        function stopComposerResize() {
          if (!composerResizeState) return;
          composerResizeState = null;
          document.body.style.userSelect = '';
        }

        function renderContactsTabs() {
          const activeTab = state.contactsTab === 'all' ? 'all' : 'current';
          if (currentContactTabBtn) {
            currentContactTabBtn.classList.toggle('active', activeTab === 'current');
          }
          if (allContactsTabBtn) {
            allContactsTabBtn.classList.toggle('active', activeTab === 'all');
          }
          if (currentContactPanel) {
            currentContactPanel.hidden = activeTab !== 'current';
          }
          if (allContactsPanel) {
            allContactsPanel.hidden = activeTab !== 'all';
          }
        }

        function getAiSidebarSession(conversationId) {
          const key = String(conversationId || '').trim();
          if (!key) {
            return {
              messages: [],
              draft: ''
            };
          }
          if (!state.aiSidebarSessions[key]) {
            state.aiSidebarSessions[key] = {
              messages: [],
              draft: ''
            };
          }
          return state.aiSidebarSessions[key];
        }

        function renderSidebarTabs() {
          const activeTab = state.sidebarTab === 'ai' ? 'ai' : 'contact';
          if (contactSidebarTabBtn) {
            contactSidebarTabBtn.classList.toggle('active', activeTab === 'contact');
            contactSidebarTabBtn.setAttribute('aria-selected', activeTab === 'contact' ? 'true' : 'false');
          }
          if (aiSidebarTabBtn) {
            aiSidebarTabBtn.classList.toggle('active', activeTab === 'ai');
            aiSidebarTabBtn.setAttribute('aria-selected', activeTab === 'ai' ? 'true' : 'false');
          }
          if (currentContactPanel) currentContactPanel.hidden = activeTab !== 'contact';
          if (aiAssistantPanel) aiAssistantPanel.hidden = activeTab !== 'ai';
          if (allContactsPanel) allContactsPanel.hidden = true;
        }

        function escapeHtmlAttribute(value) {
          return escapeHtml(value).replace(/"/g, '&quot;');
        }

        function normalizeProductOffer(item, customMessage) {
          const source = item && typeof item === 'object' ? item : {};
          const title = source.title ? String(source.title).trim() : '';
          const url = source.url ? String(source.url).trim() : (source.link ? String(source.link).trim() : (source.productUrl ? String(source.productUrl).trim() : ''));
          if (!title || !url) return null;
          return {
            source: source.source ? String(source.source).trim() : '',
            externalId: source.externalId ? String(source.externalId).trim() : '',
            productId: source.productId ? String(source.productId).trim() : (source.sku ? String(source.sku).trim() : title),
            sku: source.sku ? String(source.sku).trim() : '',
            category: source.category ? String(source.category).trim() : '',
            title: title,
            image: source.image ? String(source.image).trim() : (source.imageUrl ? String(source.imageUrl).trim() : ''),
            imageUrl: source.imageUrl ? String(source.imageUrl).trim() : (source.image ? String(source.image).trim() : ''),
            url: url,
            productUrl: url,
            price: source.price == null ? '' : String(source.price).trim(),
            currency: source.currency ? String(source.currency).trim() : '',
            availability: source.availability ? String(source.availability).trim() : '',
            description: source.description ? String(source.description).trim() : '',
            shortDescription: source.shortDescription ? String(source.shortDescription).trim() : (source.description ? String(source.description).trim() : ''),
            customMessage: customMessage != null ? String(customMessage).trim() : (source.customMessage ? String(source.customMessage).trim() : '')
          };
        }

        function encodeProductData(product) {
          return escapeHtmlAttribute(encodeURIComponent(JSON.stringify(product || {})));
        }

        function decodeProductData(value) {
          try {
            return JSON.parse(decodeURIComponent(String(value || '')));
          } catch (error) {
            return null;
          }
        }

        function renderProductOfferCard(product, options) {
          const item = normalizeProductOffer(product);
          if (!item) return '';
          const settings = options || {};
          const imageMarkup = item.image
            ? '<img class="' + escapeHtml(settings.imageClass || 'product-offer-image') + '" src="' + escapeHtmlAttribute(item.image) + '" alt="' + escapeHtmlAttribute(item.title) + '" />'
            : '<div class="' + escapeHtml(settings.imageClass || 'product-offer-image-empty') + ' product-offer-image-empty">PF</div>';
          const description = item.shortDescription ? '<p class="product-offer-description">' + escapeHtml(item.shortDescription) + '</p>' : '';
          const price = item.price ? '<span class="product-offer-price">' + escapeHtml(item.price) + '</span>' : '';
          const sourceBadge = item.source ? '<span class="product-search-chip is-source">' + escapeHtml(item.source) + '</span>' : '';
          const actions = [
            '<a class="product-link-btn" href="' + escapeHtmlAttribute(item.url) + '" target="_blank" rel="noopener noreferrer">Open product</a>'
          ];
          if (settings.includeInsert === true) {
            actions.push('<button type="button" class="ai-product-insert-btn" data-insert-product-offer="' + encodeProductData(item) + '">Insert into chat</button>');
          }

          return '<div class="product-offer-card">' +
            imageMarkup +
            '<div class="product-offer-body">' +
              '<div class="product-offer-header">' +
                '<div class="product-offer-title">' + escapeHtml(item.title) + '</div>' +
                price +
              '</div>' +
              (sourceBadge ? '<div class="product-search-meta">' + sourceBadge + '</div>' : '') +
              description +
              '<div class="product-offer-actions">' + actions.join('') + '</div>' +
            '</div>' +
          '</div>';
        }

        function looksLikeProductUrl(value) {
          return /^https?:\/\//i.test(String(value || '').trim());
        }

        function renderProductSearchResults() {
          if (!productSearchResults || !productSearchStatus) return;
          if (productUrlDetectedBadge) {
            productUrlDetectedBadge.hidden = state.productQueryMode !== 'url';
            productUrlDetectedBadge.textContent = state.productResolveLoading
              ? 'Detected URL • resolving product...'
              : (state.productDetectedSource
                ? 'Detected URL • ' + state.productDetectedSource
                : 'Detected URL');
          }
          if (productResolvedPreview) {
            productResolvedPreview.hidden = !state.productResolvedItem;
            productResolvedPreview.innerHTML = state.productResolvedItem
              ? renderProductOfferCard(state.productResolvedItem, { includeInsert: true })
              : '';
          }
          if (state.productResolveLoading) {
            productSearchStatus.textContent = 'Resolving product URL…';
            productSearchResults.innerHTML = '';
            return;
          }
          if (state.productQueryMode === 'url' && state.productResolvedItem) {
            productSearchStatus.textContent = 'Exact product match found.';
            productSearchResults.innerHTML = '';
            return;
          }
          if (state.productSearchLoading) {
            productSearchStatus.textContent = 'Searching products…';
            productSearchResults.innerHTML = '';
            return;
          }
          if (state.productQueryMode === 'url' && !state.productResolvedItem) {
            productSearchStatus.textContent = 'No product found for this URL.';
            productSearchResults.innerHTML = '';
            return;
          }
          if (!state.productSearchQuery || state.productSearchQuery.length < 2) {
            productSearchStatus.textContent = 'Type at least 2 characters to search.';
            productSearchResults.innerHTML = '';
            return;
          }
          if (!state.productSearchResults.length) {
            productSearchStatus.textContent = 'No products found.';
            productSearchResults.innerHTML = '';
            return;
          }
          productSearchStatus.textContent = state.productSearchResults.length + ' product(s) found';
          productSearchResults.innerHTML = state.productSearchResults.map(function (item) {
            const product = normalizeProductOffer(item);
            if (!product) return '';
            const imageMarkup = product.image
              ? '<img src="' + escapeHtmlAttribute(product.image) + '" alt="' + escapeHtmlAttribute(product.title) + '" />'
              : '<div class="product-offer-image-empty">PF</div>';
            const description = product.shortDescription ? '<p class="product-offer-description">' + escapeHtml(product.shortDescription) + '</p>' : '';
            const meta = [
              product.source ? '<span class="product-search-chip is-source">' + escapeHtml(product.source) + '</span>' : '',
              product.category ? '<span class="product-search-chip">' + escapeHtml(product.category) + '</span>' : '',
              product.sku ? '<span class="product-search-chip">' + escapeHtml(product.sku) + '</span>' : '',
              product.price ? '<span class="product-search-chip">' + escapeHtml(product.price) + '</span>' : ''
            ].filter(Boolean).join('');
            return '<article class="product-search-item">' +
              imageMarkup +
              '<div class="product-search-copy">' +
                '<strong>' + escapeHtml(product.title) + '</strong>' +
                '<div class="product-search-meta">' + meta + '</div>' +
                description +
              '</div>' +
              '<div class="product-search-actions">' +
                '<a class="ghost-btn" href="' + escapeHtmlAttribute(product.url) + '" target="_blank" rel="noopener noreferrer">Open</a>' +
                '<button type="button" class="primary-btn" data-insert-product-offer="' + encodeProductData(product) + '">Insert</button>' +
              '</div>' +
            '</article>';
          }).join('');
        }

        function openProductPicker() {
          if (!productPickerModal) return;
          state.productSearchOpen = true;
          state.productResolvedItem = null;
          state.productDetectedSource = '';
          state.productQueryMode = looksLikeProductUrl(state.productSearchQuery) ? 'url' : 'search';
          productPickerModal.hidden = false;
          if (productSourceSelect) {
            productSourceSelect.value = state.productSearchSource || 'all';
          }
          renderProductSearchResults();
          if (productSearchInput) {
            productSearchInput.focus();
            productSearchInput.select();
          }
        }

        function closeProductPicker() {
          if (!productPickerModal) return;
          state.productSearchOpen = false;
          productPickerModal.hidden = true;
        }

        async function resolveProductUrl(query) {
          state.productResolveLoading = true;
          state.productResolvedItem = null;
          state.productDetectedSource = '';
          state.productSearchResults = [];
          renderProductSearchResults();
          try {
            const payload = await fetchJson('/api/products/resolve-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: query,
                source: state.productSearchSource === 'all' ? 'auto' : state.productSearchSource
              })
            });
            state.productResolvedItem = payload.item || null;
            state.productDetectedSource = String(payload.detectedSource || (payload.item && payload.item.source) || '').trim();
          } catch (error) {
            state.productResolvedItem = null;
            state.productDetectedSource = '';
          } finally {
            state.productResolveLoading = false;
            renderProductSearchResults();
          }
        }

        async function runProductSearch(query) {
          const cleanQuery = String(query || '').trim();
          state.productSearchQuery = cleanQuery;
          state.productQueryMode = looksLikeProductUrl(cleanQuery) ? 'url' : 'search';
          state.productResolvedItem = null;
          state.productDetectedSource = '';
          if (state.productQueryMode === 'url') {
            await resolveProductUrl(cleanQuery);
            return;
          }
          if (cleanQuery.length < 2) {
            state.productSearchLoading = false;
            state.productSearchResults = [];
            renderProductSearchResults();
            return;
          }
          state.productSearchLoading = true;
          renderProductSearchResults();
          try {
            const payload = await fetchJson('/api/products/search?q=' + encodeURIComponent(cleanQuery) + '&source=' + encodeURIComponent(state.productSearchSource || 'all'));
            state.productSearchResults = Array.isArray(payload.items) ? payload.items : [];
          } finally {
            state.productSearchLoading = false;
            renderProductSearchResults();
          }
        }

        async function insertProductOffer(product, customMessage, source) {
          if (!state.selectedConversation) return;
          const snapshot = normalizeProductOffer(product, customMessage);
          if (!snapshot) {
            window.alert('Product snapshot is invalid.');
            return;
          }
          await fetchJson('/api/inbox/conversations/' + encodeURIComponent(state.selectedConversation.conversationId) + '/product-offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operatorName: operatorNameInput.value.trim() || 'Operator',
              customMessage: snapshot.customMessage || '',
              source: source || 'operator',
              product: snapshot
            })
          });
          closeProductPicker();
          if (productCustomMessageInput) {
            productCustomMessageInput.value = '';
          }
          await loadConversations({ reloadSelectedConversation: true });
          await loadConversation(state.selectedConversation.conversationId, { forceScrollBottom: true });
        }

        function renderAiProductCards(items) {
          const list = Array.isArray(items) ? items : [];
          if (!list.length) return '';
          return '<div class="ai-product-grid">' + list.map(function (item) {
            const product = normalizeProductOffer(item);
            if (!product) return '';
            const title = product.title || 'Untitled product';
            const image = product.image ? '<img src="' + escapeHtmlAttribute(product.image) + '" alt="' + escapeHtmlAttribute(title) + '" />' : '<div class="ai-product-image ai-product-image-empty">PF</div>';
            const description = product.shortDescription ? '<p>' + escapeHtml(product.shortDescription) + '</p>' : '';
            const link = product.url ? '<a href="' + escapeHtmlAttribute(product.url) + '" target="_blank" rel="noopener noreferrer">Open</a>' : '';
            const insert = state.selectedConversation
              ? '<button type="button" class="ai-product-insert-btn" data-insert-product-offer="' + encodeProductData(product) + '">Insert into chat</button>'
              : '';
            return '<article class="ai-product-card">' +
              image +
              '<div class="ai-product-card-body">' +
                '<strong>' + escapeHtml(title) + '</strong>' +
                description +
                '<div class="ai-product-card-actions">' + link + insert + '</div>' +
              '</div>' +
            '</article>';
          }).join('') + '</div>';
        }

        function renderAiSidebarPanel() {
          if (!aiSidebarMessages || !aiSidebarInput) return;
          if (!state.selectedConversation) {
            aiSidebarMessages.innerHTML = '<div class="empty-state">Open a conversation to use AI Assistant.</div>';
            aiSidebarInput.value = '';
            aiSidebarInput.disabled = true;
            aiSidebarSendBtn.disabled = true;
            return;
          }

          const session = getAiSidebarSession(state.selectedConversation.conversationId);
          aiSidebarInput.disabled = false;
          aiSidebarSendBtn.disabled = state.aiSidebarLoading;
          if (aiSidebarInput.value !== session.draft) {
            aiSidebarInput.value = session.draft || '';
          }

          const messageMarkup = session.messages.length
            ? session.messages.map(function (entry) {
                const role = entry && entry.role === 'user' ? 'user' : 'assistant';
                return '<div class="ai-sidebar-message ' + escapeHtml(role) + '">' +
                  '<div class="ai-sidebar-bubble">' +
                    '<div class="ai-sidebar-text">' + nl2br(entry && entry.text ? entry.text : '') + '</div>' +
                    renderAiProductCards(entry && entry.products) +
                  '</div>' +
                '</div>';
              }).join('')
            : '<div class="empty-state">Ask AI to summarize, improve a reply, translate, or find related products.</div>';

          aiSidebarMessages.innerHTML = messageMarkup;
          if (state.aiSidebarLoading && state.aiSidebarLoadingConversationId === state.selectedConversation.conversationId) {
            aiSidebarMessages.innerHTML += '<div class="ai-sidebar-message assistant"><div class="ai-sidebar-bubble muted">Thinking…</div></div>';
          }
          aiSidebarMessages.scrollTop = aiSidebarMessages.scrollHeight;
        }

        function renderLinkedContactCard() {
          linkedContactBadge.textContent = state.linkedContact ? '1' : '0';
          linkedContactCard.innerHTML = '';
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
          if (!state.selectedConversation) {
            currentVisitorHint.textContent = 'No conversation selected';
            currentVisitorInfo.innerHTML = '';
            return;
          }

          currentVisitorHint.textContent = state.linkedContact ? 'Saved contact' : 'New lead';
          const contact = state.linkedContact || state.detectedContact || {};
          currentVisitorInfo.innerHTML =
            '<div class="contact-identity">' +
              renderIdentityRow('👤', 'Name', contact.name || '') +
              renderIdentityRow('☎', 'Phone', contact.phone || '') +
              renderIdentityRow('💬', 'Telegram', contact.telegram || '') +
              renderIdentityRow('✉', 'Email', contact.email || '') +
            '</div>';
        }

        function renderCurrentContactActivity() {
          const activity = [];
          const conversation = state.selectedConversation || null;
          const linkedContact = state.linkedContact || null;
          const messages = Array.isArray(state.selectedMessages) ? state.selectedMessages : [];
          const hasUploadedFile = messages.some(function (message) {
            return message && Array.isArray(message.attachments) && message.attachments.length;
          });

          if (conversation && conversation.sourcePage) {
            activity.push({ icon: '🌐', label: 'Visited site: ' + conversation.sourcePage });
          }
          if (conversation && conversation.createdAt) {
            activity.push({ icon: '💬', label: 'Started conversation: ' + formatShortDate(conversation.createdAt) });
          }
          if (conversation && conversation.assignedOperator) {
            activity.push({ icon: '👤', label: 'Assigned to ' + conversation.assignedOperator });
          }
          if (hasUploadedFile) {
            activity.push({ icon: '📎', label: 'Uploaded file' });
          }
          if (linkedContact && linkedContact.phone) {
            activity.push({ icon: '📞', label: 'Left phone' });
          } else if (linkedContact && linkedContact.telegram) {
            activity.push({ icon: '💬', label: 'Left Telegram' });
          }

          currentContactActivity.innerHTML =
            (activity.length
              ? '<ul class="activity-list">' + activity.map(function (item) {
                  return '<li class="activity-item" data-icon="' + escapeHtml(item.icon) + '">' + escapeHtml(item.label) + '</li>';
                }).join('') + '</ul>'
              : '<div class="empty-state">Ще немає помітної активності для цього контакту.</div>');
        }

        function renderContactForm(forceHydrate) {
          const draft = state.contactDraft || buildContactDraft({});
          if (forceHydrate === true || !state.contactFormDirty) {
            contactNameInput.value = draft.name || '';
            contactPhoneInput.value = draft.phone || '';
            contactTelegramInput.value = draft.telegram || '';
            contactEmailInput.value = draft.email || '';
            contactStatusInput.value = draft.status || 'new';
            contactNotesInput.value = draft.notes || '';
          }
          renderTagSelector();
          setContactFormVisible(state.showContactForm);
          saveContactBtn.textContent = state.linkedContact ? 'Update Contact' : 'Save Contact';
          cancelContactBtn.hidden = !state.contactFormDirty;
        }

        function renderProfileTagSelector(tags) {
          const activeTags = Array.isArray(tags) ? tags : [];
          return CONTACT_TAGS.map(function (tag) {
            const active = activeTags.indexOf(tag.value) >= 0 ? ' active' : '';
            return '<button type="button" class="tag-btn' + active + '" data-profile-tag="' + escapeHtml(tag.value) + '">' + escapeHtml(tag.label) + '</button>';
          }).join('');
        }

        function buildContactProfileDraft(contact) {
          return buildContactDraft(contact || {});
        }

        function closeContactProfile(reason) {
          if (contactProfileLoadTimer) {
            window.clearTimeout(contactProfileLoadTimer);
            contactProfileLoadTimer = 0;
          }
          logOverlay('overlay_closed', {
            source: 'contact-profile-inline',
            reason: reason || 'manual'
          });
          state.contactProfile = null;
          state.contactProfileDraft = null;
          state.contactProfileDirty = false;
          state.contactProfileTab = 'info';
          state.contactProfileError = '';
          state.loadingContactProfile = false;
          contactProfileInline.innerHTML = '';
        }

        function renderContactProfile() {
          if (state.loadingContactProfile) {
            contactProfileInline.innerHTML =
              '<div class="contact-profile-sheet">' +
              '<div class="contact-profile-head">' +
              '<div class="contact-profile-title">' +
                '<h3>Loading contact…</h3>' +
                '<p>Завантажуємо профіль контакту.</p>' +
              '</div>' +
              '<button type="button" class="ghost-btn" data-close-contact-profile="true">Закрити</button>' +
              '</div>' +
              '<div class="contact-profile-body"><div class="empty-state">Loading…</div></div>' +
              '</div>';
            return;
          }

          if (state.contactProfileError) {
            contactProfileInline.innerHTML =
              '<div class="contact-profile-sheet">' +
              '<div class="contact-profile-head">' +
              '<div class="contact-profile-title">' +
                '<h3>Contact profile</h3>' +
                '<p>Не вдалося завантажити дані контакту.</p>' +
              '</div>' +
              '<button type="button" class="ghost-btn" data-close-contact-profile="true">Закрити</button>' +
              '</div>' +
              '<div class="contact-profile-body">' +
              '<div class="empty-state">' +
                '<strong>Failed to load data. Please try again.</strong>' +
                '<p>' + escapeHtml(state.contactProfileError) + '</p>' +
              '</div>' +
              '</div>' +
              '</div>';
            return;
          }

          const profile = state.contactProfile;
          if (!profile || !profile.contact) {
            state.contactProfileError = 'Contact data is unavailable.';
            contactProfileInline.innerHTML =
              '<div class="contact-profile-sheet">' +
              '<div class="contact-profile-head">' +
              '<div class="contact-profile-title">' +
                '<h3>Contact profile</h3>' +
                '<p>Не вдалося побудувати профіль контакту.</p>' +
              '</div>' +
              '<button type="button" class="ghost-btn" data-close-contact-profile="true">Закрити</button>' +
              '</div>' +
              '<div class="contact-profile-body">' +
              '<div class="empty-state">' +
                '<strong>Error loading data</strong>' +
                '<p>Contact data is unavailable.</p>' +
              '</div>';
              '</div>' +
              '</div>';
            logOverlay('overlay_error', {
              source: 'contact-profile',
              reason: 'missing-profile-data'
            });
            return;
          }

          const contact = profile.contact;
          const summary = profile.summary || {};
          const draft = state.contactProfileDraft || buildContactProfileDraft(contact);
          const tabs = [
            { key: 'info', label: 'Info' },
            { key: 'conversations', label: 'Conversations' },
            { key: 'files', label: 'Files' },
            { key: 'ratings', label: 'Ratings' },
            { key: 'activity', label: 'Activity' }
          ];

          let profileHeadHtml =
            '<div class="contact-profile-title">' +
              '<h3>' + escapeHtml(contact.name || contact.phone || contact.telegram || contact.email || contact.contactId) + '</h3>' +
              '<p>' + escapeHtml([contact.phone, contact.telegram, contact.email].filter(Boolean).join(' · ') || 'Контактний профіль') + '</p>' +
              '<div class="contact-profile-meta">' +
                renderContactStatusBadge(contact.status || 'new') +
                renderTagBadges(contact.tags || []) +
                renderBadge((summary.dialogsCount || 0) + ' dialogs', 'subtle', '') +
              '</div>' +
            '</div>' +
            '<button type="button" class="ghost-btn" data-close-contact-profile="true">Закрити</button>';
          let tabsHtml = tabs.map(function (tab) {
            return '<button type="button" class="contact-profile-tab ' + (state.contactProfileTab === tab.key ? 'active' : '') + '" data-contact-profile-tab="' + escapeHtml(tab.key) + '">' + escapeHtml(tab.label) + '</button>';
          }).join('');
          let bodyHtml = '';

          if (state.contactProfileTab === 'conversations') {
            const rows = (profile.conversations || []).map(function (item) {
              return '<tr>' +
                '<td>' + escapeHtml(formatShortDate(item.lastMessageAt || item.updatedAt || item.createdAt)) + '</td>' +
                '<td>' + escapeHtml(item.siteId || '-') + '</td>' +
                '<td>' + escapeHtml(String(item.messageCount || 0)) + '</td>' +
                '<td>' + escapeHtml(item.lastMessage || '—') + '</td>' +
                '<td><button type="button" class="tiny-btn primary" data-open-chat-from-profile="' + escapeHtml(item.conversationId || '') + '">Open dialog</button></td>' +
              '</tr>';
            }).join('');
            bodyHtml = rows
              ? '<table class="profile-table"><thead><tr><th>Date</th><th>Site</th><th>Messages</th><th>Last message</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>'
              : '<div class="empty-state">Для цього контакту ще не знайдено пов’язаних діалогів.</div>';
          } else if (state.contactProfileTab === 'files') {
            const cards = (profile.files || []).map(function (item) {
              return '<div class="profile-card">' +
                '<strong>' + escapeHtml(item.fileName || 'file') + '</strong>' +
                '<p>' + escapeHtml(item.siteId || '-') + ' · ' + escapeHtml(formatShortDate(item.createdAt)) + '</p>' +
                '<div class="contacts-table-actions"><a class="tiny-btn primary" href="' + escapeHtml(item.publicUrl || '#') + '" target="_blank" rel="noopener noreferrer">Download</a><button type="button" class="tiny-btn" data-open-chat-from-profile="' + escapeHtml(item.conversationId || '') + '">Open chat</button></div>' +
              '</div>';
            }).join('');
            bodyHtml = cards ? '<div class="profile-list">' + cards + '</div>' : '<div class="empty-state">Файлів для цього контакту поки немає.</div>';
          } else if (state.contactProfileTab === 'ratings') {
            const cards = (profile.ratings || []).map(function (item) {
              return '<div class="profile-card">' +
                '<strong>' + escapeHtml(item.value || 'Rating') + '</strong>' +
                '<p>' + escapeHtml(formatShortDate(item.createdAt)) + '</p>' +
                (item.note ? '<small>' + escapeHtml(item.note) + '</small>' : '') +
              '</div>';
            }).join('');
            bodyHtml = cards ? '<div class="profile-list">' + cards + '</div>' : '<div class="empty-state">Оцінок для цього контакту ще немає.</div>';
          } else if (state.contactProfileTab === 'activity') {
            const cards = (profile.activity || []).map(function (item) {
              return '<div class="profile-activity-item">' +
                '<strong>' + escapeHtml(item.label || 'Activity') + '</strong>' +
                '<div class="profile-activity-meta"><span>' + escapeHtml(formatShortDate(item.createdAt)) + '</span><span>' + escapeHtml(item.siteId || '-') + '</span>' + (item.conversationId ? '<button type="button" class="tiny-btn" data-open-chat-from-profile="' + escapeHtml(item.conversationId) + '">Open chat</button>' : '') + '</div>' +
              '</div>';
            }).join('');
            bodyHtml = cards ? '<div class="profile-list">' + cards + '</div>' : '<div class="empty-state">Активності для цього контакту ще немає.</div>';
          } else {
            bodyHtml =
              '<div class="profile-grid">' +
                '<div class="profile-field"><label>Name</label><input id="profileNameInput" type="text" value="' + escapeHtml(draft.name || '') + '" /></div>' +
                '<div class="profile-field"><label>Lead status</label><select id="profileStatusInput"><option value="new"' + (draft.status === 'new' ? ' selected' : '') + '>New</option><option value="contacted"' + (draft.status === 'contacted' ? ' selected' : '') + '>Contacted</option><option value="in_progress"' + (draft.status === 'in_progress' ? ' selected' : '') + '>In Progress</option><option value="closed"' + (draft.status === 'closed' ? ' selected' : '') + '>Closed</option></select></div>' +
                '<div class="profile-field"><label>Phone</label><input id="profilePhoneInput" type="text" value="' + escapeHtml(draft.phone || '') + '" /></div>' +
                '<div class="profile-field"><label>Telegram</label><input id="profileTelegramInput" type="text" value="' + escapeHtml(draft.telegram || '') + '" /></div>' +
                '<div class="profile-field full"><label>Email</label><input id="profileEmailInput" type="email" value="' + escapeHtml(draft.email || '') + '" /></div>' +
                '<div class="profile-field full"><label>Tags</label><div id="profileTags" class="tag-selector">' + renderProfileTagSelector(draft.tags || []) + '</div></div>' +
                '<div class="profile-field full"><label>Notes</label><textarea id="profileNotesInput">' + escapeHtml(draft.notes || '') + '</textarea></div>' +
              '</div>' +
              '<div class="profile-actions"><span class="muted-text">' + escapeHtml(summary.lastMessage ? 'Last message: ' + summary.lastMessage : 'Оновіть контактні дані за потреби.') + '</span><button type="button" class="primary-btn" data-save-contact-profile="true">Save Contact</button></div>';
          }
          contactProfileInline.innerHTML =
            '<div class="contact-profile-sheet">' +
              '<div class="contact-profile-head">' + profileHeadHtml + '</div>' +
              '<div class="contact-profile-tabs">' + tabsHtml + '</div>' +
              '<div class="contact-profile-body">' + bodyHtml + '</div>' +
            '</div>';
        }

        async function openContactProfile(contactId) {
          if (!contactId || state.loadingContactProfile) return;
          contactProfileRequestId += 1;
          const requestId = contactProfileRequestId;
          state.loadingContactProfile = true;
          state.contactProfileError = '';
          state.contactProfile = null;
          state.contactProfileDraft = null;
          state.contactProfileTab = 'info';
          logOverlay('overlay_open', { source: 'contact-profile', contactId: contactId });
          logOverlay('overlay_loading_start', { source: 'contact-profile', contactId: contactId });
          renderContactProfile();
          if (contactProfileLoadTimer) {
            window.clearTimeout(contactProfileLoadTimer);
          }
          contactProfileLoadTimer = window.setTimeout(function () {
            if (!state.loadingContactProfile || requestId !== contactProfileRequestId) return;
            logOverlay('overlay_timeout', { source: 'contact-profile', contactId: contactId });
            state.loadingContactProfile = false;
            state.contactProfileError = 'Loading timed out after 8 seconds.';
            renderContactProfile();
          }, 8000);
          try {
            const payload = await fetchJson('/api/admin/contacts/' + encodeURIComponent(contactId) + '/profile');
            if (requestId !== contactProfileRequestId) {
              return;
            }
            if (!payload.profile || !payload.profile.contact) {
              throw new Error('Contact data is unavailable.');
            }
            state.contactProfile = payload.profile || null;
            state.contactProfileDraft = buildContactProfileDraft(payload.profile && payload.profile.contact || {});
            state.contactProfileDirty = false;
            state.contactProfileTab = 'info';
            state.contactProfileError = '';
            logOverlay('overlay_loaded', { source: 'contact-profile', contactId: contactId });
            renderContactProfile();
          } catch (error) {
            if (requestId !== contactProfileRequestId) {
              return;
            }
            state.contactProfileError = error && error.message ? error.message : 'Failed to load contact profile.';
            logOverlay('overlay_error', { source: 'contact-profile', contactId: contactId, message: state.contactProfileError });
            renderContactProfile();
          } finally {
            if (requestId === contactProfileRequestId) {
              state.loadingContactProfile = false;
              if (contactProfileLoadTimer) {
                window.clearTimeout(contactProfileLoadTimer);
                contactProfileLoadTimer = 0;
              }
              renderContactProfile();
            }
          }
        }

        async function saveContactProfile() {
          if (!state.contactProfile || !state.contactProfile.contact) return;
          const draft = buildContactDraft({
            contactId: state.contactProfile.contact.contactId,
            name: document.getElementById('profileNameInput').value.trim(),
            phone: normalizePhone(document.getElementById('profilePhoneInput').value),
            telegram: normalizeTelegram(document.getElementById('profileTelegramInput').value),
            email: normalizeEmail(document.getElementById('profileEmailInput').value),
            notes: document.getElementById('profileNotesInput').value.trim(),
            status: document.getElementById('profileStatusInput').value,
            tags: state.contactProfileDraft && Array.isArray(state.contactProfileDraft.tags) ? state.contactProfileDraft.tags.slice() : [],
            sourceSiteId: state.contactProfile.contact.sourceSiteId,
            conversationId: state.contactProfile.contact.conversationId,
            lastConversationAt: state.contactProfile.contact.lastConversationAt
          });
          const payload = await fetchJson('/api/admin/contacts/' + encodeURIComponent(state.contactProfile.contact.contactId), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draft)
          });
          await loadContacts({ keepSelected: true });
          state.linkedContact = state.linkedContact && state.linkedContact.contactId === payload.contact.contactId
            ? payload.contact
            : state.linkedContact;
          const profilePayload = await fetchJson('/api/admin/contacts/' + encodeURIComponent(payload.contact.contactId) + '/profile');
          state.contactProfile = profilePayload.profile;
          state.contactProfileDraft = buildContactProfileDraft(profilePayload.profile && profilePayload.profile.contact || {});
          state.contactProfileDirty = false;
          renderContactsPanel();
          renderContactProfile();
        }

        function renderContactsList() {
          if (!state.contacts.length) {
            contactsList.innerHTML = '<div class="empty-state">Поки що немає збережених контактів.</div>';
            return;
          }

          contactsList.innerHTML = state.contacts.map(function (contact) {
            const title = contact.name || contact.phone || contact.telegram || contact.email || contact.contactId;
            const details = [contact.phone, contact.telegram, contact.email].filter(Boolean).join(' · ');
            const metaLeft = contact.sourceSiteId || (contact.dialogsCount ? String(contact.dialogsCount) + ' dialogs' : 'Contact');
            const metaRight = formatShortDate(contact.lastMessageAt || contact.lastConversationAt || contact.updatedAt);
            return '<button type="button" class="contact-card ' + (contact.contactId === state.selectedContactId ? 'active' : '') + '" data-open-contact-item="' + escapeHtml(contact.contactId) + '" data-conversation-id="' + escapeHtml(contact.conversationId || '') + '">' +
              '<div class="contact-card-top">' +
                '<strong>' + escapeHtml(title) + '</strong>' +
                renderContactStatusBadge(contact.status || 'new') +
              '</div>' +
              '<div class="tag-row">' + renderTagBadges(contact.tags || []) + '</div>' +
              '<p>' + escapeHtml(contact.lastMessage || details || 'Без додаткових даних') + '</p>' +
              '<div class="contact-card-meta"><span>' + escapeHtml(metaLeft) + '</span><span>' + escapeHtml(metaRight || '') + '</span></div>' +
            '</button>';
          }).join('');
        }

        function renderContactsPanel() {
          renderSidebarTabs();
          renderSuggestionBox();
          renderLinkedContactCard();
          renderCurrentContactActivity();
          renderCurrentVisitorInfo();
          renderAiSummary();
          renderContactForm(false);
          renderAiSidebarPanel();
          renderContactsList();
          if (state.contactProfile) {
            renderContactProfile();
          }
          setContactFormVisible(Boolean(state.selectedConversation));
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
          syncConversationHeading();
          renderContactsPanel();
        }

        async function loadConversations(options) {
          const settings = options || {};
          if (state.loadingConversations) return;
          state.loadingConversations = true;
          const previousConversations = Array.isArray(state.conversations) ? state.conversations.slice() : [];
          const previousSelectedConversationId = state.selectedConversationId;
          const params = new URLSearchParams();
          if (state.status) params.set('status', state.status);
          if (state.search) params.set('q', state.search);

          try {
            const url = '/api/inbox/conversations?' + params.toString();
            console.log('inbox_conversations_request', url);
            const payload = await fetchJson(url);
            state.conversations = payload.conversations || [];
            console.log('conversations_loaded', state.conversations.length);
            if (previousConversations.length) {
              maybePlayIncomingMessageSound(state.conversations, previousConversations);
            }
            syncHeardVisitorMessages(state.conversations);

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
            const previousConversationId = state.selectedConversationId;
            const payload = await fetchJson('/api/inbox/conversations/' + encodeURIComponent(conversationId));
            const conversation = payload.conversation;
            const messages = payload.messages || [];
            console.log('selected_conversation', conversation && conversation.conversationId ? conversation.conversationId : '');
            const nextSignature = buildMessagesSignature(messages);
            const selectedChanged = state.selectedConversationId !== conversationId;

            state.selectedConversationId = conversationId;
            if (selectedChanged) {
              stopOperatorTyping(previousConversationId || '');
              state.aiSummary = null;
              state.aiSummaryConversationId = '';
              state.aiSummaryLoading = false;
            }

            if (
              !selectedChanged &&
              state.selectedConversation &&
              state.selectedMessagesSignature === nextSignature &&
              state.selectedConversation.status === conversation.status &&
              state.selectedConversation.lastMessageAt === conversation.lastMessageAt &&
              String(state.selectedConversation.assignedOperator || '') === String(conversation.assignedOperator || '') &&
              Number(state.selectedConversation.unreadCount || 0) === Number(conversation.unreadCount || 0) &&
              String(state.selectedConversation.feedbackRequestedAt || '') === String(conversation.feedbackRequestedAt || '') &&
              String(state.selectedConversation.feedbackCompletedAt || '') === String(conversation.feedbackCompletedAt || '')
            ) {
              state.selectedConversation = conversation;
              state.detectedContact = detectContactFromMessages(messages);
              syncFeedbackRequestButton();
              renderQuickReplies();
              markConversationViewed(conversation.conversationId, getLatestVisitorMessageAt(messages));
              if (Number(conversation.unreadCount) > 0) {
                markConversationAsRead(conversation.conversationId).catch(console.error);
              }
              await loadLinkedContact();
              return;
            }

            renderConversation(conversation, messages, {
              preserveScroll: options && options.preserveScroll !== false,
              forceScrollBottom: options && (options.forceScrollBottom === true || selectedChanged)
            });
            if (Number(conversation.unreadCount) > 0) {
              markConversationAsRead(conversation.conversationId).catch(console.error);
            }
            await loadLinkedContact();
          } finally {
            state.loadingConversation = false;
          }
        }

        async function sendReply() {
          if (!state.selectedConversationId) return;
          const text = replyInput.value.trim();
          if (!text) return;
          stopOperatorTyping(state.selectedConversationId);

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
          if (nextStatus === 'closed') {
            stopOperatorTyping(state.selectedConversationId);
          }
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

        async function requestFeedback() {
          if (!state.selectedConversation || state.feedbackRequestLoading) return;
          state.feedbackRequestLoading = true;
          syncFeedbackRequestButton();
          try {
            const payload = await fetchJson('/api/inbox/conversations/' + encodeURIComponent(state.selectedConversation.conversationId) + '/request-feedback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                operatorName: operatorNameInput.value.trim() || 'Operator'
              })
            });
            if (payload && payload.conversation) {
              state.selectedConversation = payload.conversation;
            }
            await loadConversations({ reloadSelectedConversation: true });
            await loadConversation(state.selectedConversationId, { preserveScroll: true });
          } finally {
            state.feedbackRequestLoading = false;
            syncFeedbackRequestButton();
          }
        }

        async function runAiAssist(action) {
          if (!state.selectedConversation || state.aiActionLoading) return;
          if (action === 'summary') {
            return runAiSummary();
          }
          if ((action === 'polish' || action === 'translate') && !replyInput.value.trim()) {
            window.alert('Спершу напишіть текст, який треба покращити.');
            replyInput.focus();
            return;
          }
          state.aiActionLoading = true;
          state.activeAiAction = action;
          renderQuickReplies();
          try {
            const endpoint = action === 'polish'
              ? '/api/inbox/conversations/' + encodeURIComponent(state.selectedConversation.conversationId) + '/ai-improve'
              : action === 'translate'
                ? '/api/inbox/conversations/' + encodeURIComponent(state.selectedConversation.conversationId) + '/ai-translate'
                : '/api/inbox/conversations/' + encodeURIComponent(state.selectedConversation.conversationId) + '/ai-draft';
            const payload = await fetchJson(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode: action,
                action: action,
                text: replyInput.value,
                currentText: replyInput.value,
                targetLanguage: state.translateTargetLanguage
              })
            });
            replyInput.value = payload.translatedText || payload.improvedText || payload.draft || payload.text || '';
            replyInput.focus();
          } finally {
            state.aiActionLoading = false;
            state.activeAiAction = '';
            renderQuickReplies();
          }
        }

        async function runAiSummary() {
          if (!state.selectedConversation || state.aiSummaryLoading || state.aiActionLoading) return;
          state.aiSummaryLoading = true;
          state.activeAiAction = 'summary';
          renderQuickReplies();
          renderContactsPanel();
          try {
            const payload = await fetchJson('/api/inbox/conversations/' + encodeURIComponent(state.selectedConversation.conversationId) + '/ai-summary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            state.aiSummary = payload.summary || null;
            state.aiSummaryConversationId = state.selectedConversation.conversationId;
            renderContactsPanel();
          } finally {
            state.aiSummaryLoading = false;
            state.activeAiAction = '';
            renderQuickReplies();
            renderContactsPanel();
          }
        }

        function getSelectionTextFromMessages() {
          const selection = window.getSelection ? window.getSelection() : null;
          if (!selection || !selection.rangeCount) return '';
          const text = String(selection.toString() || '').trim();
          if (!text) return '';
          const range = selection.getRangeAt(0);
          const anchorNode = range.commonAncestorContainer;
          const anchorElement = anchorNode && anchorNode.nodeType === 1 ? anchorNode : anchorNode && anchorNode.parentElement;
          if (!anchorElement || !messagesPane || !messagesPane.contains(anchorElement)) {
            return '';
          }
          return text;
        }

        function hideSelectionAiToolbar() {
          state.aiSidebarSelectionText = '';
          if (selectionAiToolbar) selectionAiToolbar.hidden = true;
        }

        function updateSelectionAiToolbar() {
          if (!selectionAiToolbar || !askAiFromSelectionBtn) return;
          const selection = window.getSelection ? window.getSelection() : null;
          if (!selection || !selection.rangeCount || selection.isCollapsed) {
            hideSelectionAiToolbar();
            return;
          }
          const text = getSelectionTextFromMessages();
          if (!text) {
            hideSelectionAiToolbar();
            return;
          }
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (!rect || (!rect.width && !rect.height)) {
            hideSelectionAiToolbar();
            return;
          }
          state.aiSidebarSelectionText = text;
          selectionAiToolbar.hidden = false;
          selectionAiToolbar.style.left = Math.max(16, rect.left + (rect.width / 2) - 44) + 'px';
          selectionAiToolbar.style.top = Math.max(16, rect.top - 44) + 'px';
        }

        async function sendAiSidebarPrompt(prompt, action) {
          if (!state.selectedConversation || state.aiSidebarLoading) return;
          const text = String(prompt || '').trim();
          if (!text) return;
          const session = getAiSidebarSession(state.selectedConversation.conversationId);
          session.draft = '';
          session.messages.push({ role: 'user', text: text });
          state.aiSidebarLoading = true;
          state.aiSidebarLoadingConversationId = state.selectedConversation.conversationId;
          state.sidebarTab = 'ai';
          renderContactsPanel();
          try {
            const payload = await fetchJson('/api/inbox/conversations/' + encodeURIComponent(state.selectedConversation.conversationId) + '/ai-sidebar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: text,
                action: action || '',
                history: session.messages.slice(-8)
              })
            });
            session.messages.push({
              role: 'assistant',
              text: payload.reply || payload.text || '',
              products: payload.products || []
            });
          } finally {
            state.aiSidebarLoading = false;
            state.aiSidebarLoadingConversationId = '';
            renderContactsPanel();
          }
        }

        function buildAiSidebarQuickPrompt(action) {
          if (action === 'summarize') return 'Summarize this client request, key facts, and the next operator action.';
          if (action === 'translate') {
            const draft = String(replyInput && replyInput.value || '').trim();
            return draft
              ? 'Translate this operator draft into English:\\n' + draft
              : 'Translate the next operator reply into English based on this conversation.';
          }
          if (action === 'improve') {
            const draft = String(replyInput && replyInput.value || '').trim();
            return draft
              ? 'Improve this operator draft so it sounds concise, professional, and natural:\\n' + draft
              : 'Suggest a concise professional operator reply for this conversation.';
          }
          if (action === 'find_products') return 'Find similar products for this client request.';
          return '';
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
          await loadContacts({ keepSelected: true });
          renderContactsPanel();
        }

        async function openConversationFromContact(conversationId) {
          if (!conversationId) return;
          state.sidebarTab = 'contact';
          if (state.status !== 'all') {
            state.status = 'all';
            statusFilter.value = 'all';
          }
          state.selectedConversationId = conversationId;
          await loadConversations({ reloadSelectedConversation: false });
          const conversation = state.conversations.find(function (item) {
            return item.conversationId === conversationId;
          });
          if (conversation) {
            openConversationGroupForItem(conversation);
          }
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
          cancelContactBtn.hidden = false;
        }

        function updateContactDraftField(field, value) {
          const draft = state.contactDraft || buildContactDraft({});
          draft[field] = value;
          state.contactDraft = buildContactDraft(draft);
          state.contactFormDirty = true;
          cancelContactBtn.hidden = false;
        }

        renderQuickReplies();
        syncContactDraft({});
        renderContactsPanel();

        conversationList.addEventListener('click', function (event) {
          const button = event.target.closest('.conversation-item');
          if (!button) return;
          state.selectedConversationId = button.getAttribute('data-conversation-id') || '';
          const conversation = state.conversations.find(function (item) {
            return item.conversationId === state.selectedConversationId;
          });
          if (conversation) {
            openConversationGroupForItem(conversation);
          }
          renderConversationList();
          restartConversationPolling();
          loadConversation(state.selectedConversationId, { forceScrollBottom: true }).catch(console.error);
        });

        conversationList.addEventListener('toggle', function (event) {
          const details = event.target.closest('.conversation-group');
          if (!details) return;
          const dayKey = details.getAttribute('data-day-key') || '';
          if (!dayKey) return;
          state.groupOpenStateMap[dayKey] = details.open === true;
          writeGroupOpenStateMap();
        }, true);

        quickReplies.addEventListener('click', function (event) {
          const button = event.target.closest('[data-quick-reply]');
          if (!button) return;
          const value = button.getAttribute('data-quick-reply') || '';
          replyInput.value = value;
          state.quickRepliesCollapsed = true;
          renderQuickReplies();
          replyInput.focus();
        });

        toggleQuickRepliesBtn.addEventListener('click', function () {
          state.quickRepliesCollapsed = !state.quickRepliesCollapsed;
          renderQuickReplies();
        });

        document.addEventListener('click', function (event) {
          if (!quickRepliesPanel.contains(event.target) && !state.quickRepliesCollapsed) {
            state.quickRepliesCollapsed = true;
            renderQuickReplies();
          }
        });

        aiActions.addEventListener('click', function (event) {
          const button = event.target.closest('[data-ai-action]');
          if (!button) return;
          const action = button.getAttribute('data-ai-action') || 'draft';
          if (action === 'product_picker') {
            openProductPicker();
            return;
          }
          runAiAssist(action).catch(function (error) {
            console.error(error);
            window.alert(error && error.message ? error.message : 'AI draft failed.');
          });
        });

        aiActions.addEventListener('change', function (event) {
          const select = event.target.closest('#translateLanguageSelect');
          if (!select) return;
          state.translateTargetLanguage = select.value || 'en';
        });

        if (typeof aiSummaryBtn !== 'undefined' && aiSummaryBtn) {
          aiSummaryBtn.addEventListener('click', function () {
            runAiSummary().catch(function (error) {
              console.error(error);
              window.alert(error && error.message ? error.message : 'AI summary failed.');
            });
          });
        }

        aiSummaryBlock.addEventListener('click', function (event) {
          const button = event.target.closest('#generateAiSummaryBtn');
          if (!button) return;
          runAiSummary().catch(function (error) {
            console.error(error);
            window.alert(error && error.message ? error.message : 'AI summary failed.');
          });
        });

        composerResizeHandle.addEventListener('mousedown', startComposerResize);
        window.addEventListener('mousemove', handleComposerResize);
        window.addEventListener('mouseup', stopComposerResize);

        if (contactSidebarTabBtn) {
          contactSidebarTabBtn.addEventListener('click', function () {
            state.sidebarTab = 'contact';
            renderContactsPanel();
          });
        }

        if (aiSidebarTabBtn) {
          aiSidebarTabBtn.addEventListener('click', function () {
            state.sidebarTab = 'ai';
            renderContactsPanel();
          });
        }

        if (currentContactTabBtn) {
          currentContactTabBtn.addEventListener('click', function () {
            state.contactsTab = 'current';
            renderContactsTabs();
          });
        }

        if (allContactsTabBtn) {
          allContactsTabBtn.addEventListener('click', function () {
            state.contactsTab = 'all';
            renderContactsTabs();
          });
        }

        refreshBtn.addEventListener('click', function () {
          loadConversations({ reloadSelectedConversation: true }).catch(console.error);
          loadContacts({ keepSelected: true }).catch(console.error);
        });

        conversationMeta.addEventListener('change', function (event) {
          const assignSelect = event.target.closest('#assignOperatorSelect');
          if (!assignSelect) return;
          assignOperator(assignSelect.value || '').catch(function (error) {
            console.error(error);
            window.alert(error && error.message ? error.message : 'Failed to assign operator.');
          });
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

        replyInput.addEventListener('input', function () {
          handleOperatorTypingInput();
        });

        replyInput.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendReply().catch(console.error);
          }
        });

        if (aiSidebarInput) {
          aiSidebarInput.addEventListener('input', function () {
            const session = getAiSidebarSession(state.selectedConversationId);
            session.draft = aiSidebarInput.value;
          });

          aiSidebarInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              sendAiSidebarPrompt(aiSidebarInput.value, '').catch(console.error);
            }
          });
        }

        if (aiSidebarSendBtn) {
          aiSidebarSendBtn.addEventListener('click', function () {
            sendAiSidebarPrompt(aiSidebarInput.value, '').catch(console.error);
          });
        }

        if (aiSidebarQuickActions) {
          aiSidebarQuickActions.addEventListener('click', function (event) {
            const button = event.target.closest('[data-ai-sidebar-action]');
            if (!button) return;
            const action = button.getAttribute('data-ai-sidebar-action') || '';
            const prompt = buildAiSidebarQuickPrompt(action);
            const session = getAiSidebarSession(state.selectedConversationId);
            session.draft = prompt;
            renderAiSidebarPanel();
            sendAiSidebarPrompt(prompt, action).catch(console.error);
          });
        }

        if (closeProductPickerBtn) {
          closeProductPickerBtn.addEventListener('click', closeProductPicker);
        }

        if (productPickerBackdrop) {
          productPickerBackdrop.addEventListener('click', closeProductPicker);
        }

        if (productSearchInput) {
          productSearchInput.addEventListener('input', function () {
            const value = productSearchInput.value.trim();
            if (productSearchTimer) {
              clearTimeout(productSearchTimer);
            }
            productSearchTimer = window.setTimeout(function () {
              runProductSearch(value).catch(console.error);
            }, 180);
          });
        }

        if (productSourceSelect) {
          productSourceSelect.addEventListener('change', function () {
            state.productSearchSource = productSourceSelect.value || 'all';
            runProductSearch(productSearchInput ? productSearchInput.value.trim() : '').catch(console.error);
          });
        }

        if (productSearchResults) {
          productSearchResults.addEventListener('click', function (event) {
            const button = event.target.closest('[data-insert-product-offer]');
            if (!button) return;
            const product = decodeProductData(button.getAttribute('data-insert-product-offer'));
            insertProductOffer(product, productCustomMessageInput ? productCustomMessageInput.value : '', 'operator-search').catch(console.error);
          });
        }

        if (productResolvedPreview) {
          productResolvedPreview.addEventListener('click', function (event) {
            const button = event.target.closest('[data-insert-product-offer]');
            if (!button) return;
            const product = decodeProductData(button.getAttribute('data-insert-product-offer'));
            insertProductOffer(product, productCustomMessageInput ? productCustomMessageInput.value : '', 'operator-url').catch(console.error);
          });
        }

        if (aiSidebarMessages) {
          aiSidebarMessages.addEventListener('click', function (event) {
            const button = event.target.closest('[data-insert-product-offer]');
            if (!button) return;
            const product = decodeProductData(button.getAttribute('data-insert-product-offer'));
            insertProductOffer(product, '', 'ai-sidebar').catch(console.error);
          });
        }

        if (messagesPane) {
          messagesPane.addEventListener('click', function (event) {
            const button = event.target.closest('[data-insert-product-offer]');
            if (!button) return;
            const product = decodeProductData(button.getAttribute('data-insert-product-offer'));
            insertProductOffer(product, '', 'message-card').catch(console.error);
          });
        }

        markOpenBtn.addEventListener('click', function () {
          updateStatus('open').catch(console.error);
        });

        requestFeedbackBtn.addEventListener('click', function () {
          requestFeedback().catch(console.error);
        });

        markClosedBtn.addEventListener('click', function () {
          updateStatus('closed').catch(console.error);
        });

        cancelContactBtn.addEventListener('click', function () {
          syncContactDraft(state.linkedContact || state.detectedContact || {}, true);
          state.contactFormDirty = false;
          renderContactsPanel();
        });

        contactForm.addEventListener('submit', function (event) {
          saveContact(event).catch(console.error);
        });

        contactNameInput.addEventListener('input', function () {
          updateContactDraftField('name', contactNameInput.value.trim());
        });
        contactPhoneInput.addEventListener('input', function () {
          updateContactDraftField('phone', normalizePhone(contactPhoneInput.value));
        });
        contactTelegramInput.addEventListener('input', function () {
          updateContactDraftField('telegram', normalizeTelegram(contactTelegramInput.value));
        });
        contactEmailInput.addEventListener('input', function () {
          updateContactDraftField('email', normalizeEmail(contactEmailInput.value));
        });
        contactStatusInput.addEventListener('change', function () {
          updateContactDraftField('status', contactStatusInput.value);
        });
        contactNotesInput.addEventListener('input', function () {
          updateContactDraftField('notes', contactNotesInput.value);
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
          const itemButton = event.target.closest('[data-open-contact-item]');
          if (itemButton) {
            const contactId = itemButton.getAttribute('data-open-contact-item') || '';
            const conversationId = itemButton.getAttribute('data-conversation-id') || '';
            state.selectedContactId = contactId;
            state.contactsTab = 'current';
            renderContactsTabs();
            renderContactsList();
            openContactProfile(contactId).catch(console.error);
            if (conversationId) {
              openConversationFromContact(conversationId).catch(console.error);
            }
            return;
          }
        });

        if (messagesPane) {
          messagesPane.addEventListener('mouseup', function () {
            window.requestAnimationFrame(updateSelectionAiToolbar);
          });
          messagesPane.addEventListener('keyup', function () {
            window.requestAnimationFrame(updateSelectionAiToolbar);
          });
        }

        document.addEventListener('selectionchange', function () {
          if (!selectionAiToolbar || selectionAiToolbar.hidden) return;
          window.requestAnimationFrame(updateSelectionAiToolbar);
        });

        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && state.productSearchOpen) {
            closeProductPicker();
          }
        });

        document.addEventListener('click', function (event) {
          if (selectionAiToolbar && !selectionAiToolbar.contains(event.target)) {
            const selection = window.getSelection ? window.getSelection() : null;
            if (!selection || selection.isCollapsed) {
              hideSelectionAiToolbar();
            }
          }
        });

        if (askAiFromSelectionBtn) {
          askAiFromSelectionBtn.addEventListener('click', function () {
            const text = String(state.aiSidebarSelectionText || '').trim();
            if (!text) return;
            state.sidebarTab = 'ai';
            const session = getAiSidebarSession(state.selectedConversationId);
            session.draft = 'Analyze this message: ' + text;
            renderContactsPanel();
            hideSelectionAiToolbar();
            if (aiSidebarInput) {
              aiSidebarInput.focus();
              aiSidebarInput.setSelectionRange(aiSidebarInput.value.length, aiSidebarInput.value.length);
            }
          });
        }

        contactProfileInline.addEventListener('click', function (event) {
          if (event.target.closest('[data-close-contact-profile]')) {
            closeContactProfile('inline-close');
            return;
          }
          const tabButton = event.target.closest('[data-contact-profile-tab]');
          if (tabButton) {
            state.contactProfileTab = tabButton.getAttribute('data-contact-profile-tab') || 'info';
            renderContactProfile();
            return;
          }

          const openChatButton = event.target.closest('[data-open-chat-from-profile]');
          if (openChatButton) {
            const conversationId = openChatButton.getAttribute('data-open-chat-from-profile') || '';
            if (conversationId) {
              openConversationFromContact(conversationId).catch(console.error);
              closeContactProfile('open-chat');
            }
            return;
          }

          const saveButton = event.target.closest('[data-save-contact-profile]');
          if (saveButton) {
            saveContactProfile().catch(console.error);
            return;
          }

          const profileTagButton = event.target.closest('[data-profile-tag]');
          if (profileTagButton && state.contactProfileDraft) {
            const tag = profileTagButton.getAttribute('data-profile-tag') || '';
            const tags = Array.isArray(state.contactProfileDraft.tags) ? state.contactProfileDraft.tags.slice() : [];
            const index = tags.indexOf(tag);
            if (index >= 0) {
              tags.splice(index, 1);
            } else {
              tags.push(tag);
            }
            state.contactProfileDraft.tags = tags;
            state.contactProfileDirty = true;
            renderContactProfile();
          }
        });

        contactProfileInline.addEventListener('input', function (event) {
          if (!state.contactProfileDraft) return;
          const target = event.target;
          if (target.id === 'profileNameInput') state.contactProfileDraft.name = target.value.trim();
          if (target.id === 'profilePhoneInput') state.contactProfileDraft.phone = normalizePhone(target.value);
          if (target.id === 'profileTelegramInput') state.contactProfileDraft.telegram = normalizeTelegram(target.value);
          if (target.id === 'profileEmailInput') state.contactProfileDraft.email = normalizeEmail(target.value);
          if (target.id === 'profileNotesInput') state.contactProfileDraft.notes = target.value;
          if (target.id === 'profileStatusInput') state.contactProfileDraft.status = target.value;
          state.contactProfileDirty = true;
        });

        window.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && state.contactProfile) {
            closeContactProfile('escape');
          }
        });

        window.addEventListener('beforeunload', function () {
          if (operatorTypingTimer) clearTimeout(operatorTypingTimer);
          if (state.selectedConversationId && operatorTypingActive) {
            navigator.sendBeacon('/api/inbox/conversations/' + encodeURIComponent(state.selectedConversationId) + '/typing', new Blob([JSON.stringify({
              active: false,
              operatorName: operatorNameInput.value.trim() || 'Operator'
            })], { type: 'application/json' }));
          }
          if (state.listPollTimer) clearInterval(state.listPollTimer);
          if (state.conversationPollTimer) clearInterval(state.conversationPollTimer);
        });

        Promise.all([
          loadSiteSettings(),
          loadConversations({ reloadSelectedConversation: true }),
          loadContacts({ keepSelected: true })
        ])
          .then(function () {
            setComposerHeight(128);
            startPolling();
          })
          .catch(function (error) {
            console.error(error);
            conversationList.innerHTML = '<div class="empty-state">Не вдалося завантажити inbox.</div>';
            contactsList.innerHTML = '<div class="empty-state">Не вдалося завантажити контакти.</div>';
          });
      })();
    </script>`
  });
}

module.exports = {
  renderInboxPage
};
