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
        --bg: #f6f7f9;
        --panel: rgba(255, 255, 255, 0.98);
        --panel-soft: #fbfcfe;
        --panel-muted: #f3f5f8;
        --border: #e5e9f0;
        --text: #20283a;
        --muted: #6b7384;
        --muted-soft: #96a0b1;
        --accent: #2864ff;
        --accent-soft: #eef3ff;
        --accent-border: rgba(40, 100, 255, 0.16);
        --warning-soft: #fff5e9;
        --success-soft: #eef8f1;
        --shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
      }
      * { box-sizing: border-box; }
      html, body {
        height: 100%;
      }
      body {
        margin: 0;
        font-family: Manrope, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(40, 100, 255, 0.05), transparent 22%),
          linear-gradient(180deg, #fafbfc 0%, var(--bg) 100%);
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
        grid-template-columns: 260px minmax(420px, 760px) 320px;
        gap: 16px;
        height: calc(100vh - 20px);
        min-height: 0;
        max-width: 1376px;
        margin: 10px auto;
        padding: 0 10px;
        align-items: stretch;
        justify-content: center;
      }
      .panel {
        min-width: 0;
        min-height: 0;
        height: 100%;
        background: var(--panel);
        border: 1px solid rgba(229, 233, 240, 0.95);
        border-radius: 18px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(10px);
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
        padding: 16px;
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
        padding: 10px;
        display: grid;
        gap: 6px;
      }
      .conversation-group {
        display: grid;
        gap: 4px;
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
        padding: 6px 8px;
        font-size: 10px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--muted-soft);
        font-weight: 800;
        border-radius: 12px;
      }
      .conversation-group[open] .conversation-group-label {
        padding: 4px 2px 2px;
      }
      .conversation-group:not([open]) .conversation-group-label {
        background: #fff;
        border: 1px solid rgba(229, 233, 240, 0.95);
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.02);
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
        gap: 4px;
      }
      .conversation-item {
        width: 100%;
        text-align: left;
        border: 1px solid transparent;
        border-radius: 14px;
        padding: 9px 10px;
        background: #fff;
      }
      .conversation-item:hover {
        background: #f5f7fb;
        border-color: rgba(40, 100, 255, 0.08);
      }
      .conversation-item.active {
        border-color: rgba(40, 100, 255, 0.14);
        background: #edf3ff;
        box-shadow: inset 2px 0 0 rgba(40, 100, 255, 0.7);
      }
      .conversation-item.closed {
        background: #f8f9fb;
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
        grid-template-columns: 30px minmax(0, 1fr);
        gap: 10px;
        align-items: start;
      }
      .conversation-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #eef2f8;
        color: #5c6678;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.03em;
        border: 1px solid rgba(96, 114, 145, 0.08);
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
        font-size: 12px;
        font-weight: 800;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .conversation-time {
        flex-shrink: 0;
        font-size: 10px;
        color: var(--muted-soft);
        font-weight: 600;
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
        margin-top: 3px;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
        white-space: normal;
      }
      .conversation-meta {
        margin-top: 6px;
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
        position: sticky;
        top: 0;
        z-index: 2;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(8px);
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
        font-size: 11px;
      }
      .messages {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: linear-gradient(180deg, #fbfcfe, #f7f8fb);
      }
      .message-list {
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .message-row {
        display: flex;
        align-items: flex-end;
        gap: 10px;
      }
      .message-row.operator {
        justify-content: flex-end;
      }
      .message-row.system {
        justify-content: center;
      }
      .message-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 10px;
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
        max-width: min(100%, 620px);
        border: 1px solid rgba(229, 233, 240, 0.92);
        border-radius: 18px;
        padding: 10px 12px;
        background: #fff;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
      }
      .message-row.operator .message {
        background: #edf3ff;
        border-color: #d5e3ff;
      }
      .message-row.visitor .message {
        background: #fff7ec;
        border-color: rgba(232, 176, 94, 0.22);
      }
      .message-row.ai .message {
        background: #f7f8fb;
      }
      .message-row.system .message {
        align-self: center;
        max-width: 520px;
        background: #f1f4f8;
      }
      .message-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 7px;
        color: var(--muted-soft);
        font-size: 10px;
      }
      .message-sender {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #667086;
      }
      .message-row.operator .message-sender {
        text-transform: none;
        letter-spacing: 0;
        font-size: 12px;
        color: #24457f;
      }
      .message-role {
        margin: -4px 0 7px;
        font-size: 11px;
        color: var(--muted);
      }
      .message-text {
        font-size: 13px;
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
        background: rgba(255, 255, 255, 0.985);
        padding: 14px 16px 16px;
        display: grid;
        gap: 12px;
      }
      .reply-top {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 12px;
      }
      .quick-replies-panel {
        display: grid;
        gap: 10px;
      }
      .quick-replies-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: #fff;
        color: #44506a;
        font-size: 11px;
        font-weight: 800;
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
        padding: 6px 9px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: #fff;
        color: #42506b;
        font-size: 11px;
        font-weight: 700;
      }
      .quick-replies-tools {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .ai-actions {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .ai-actions-label {
        font-size: 10px;
        font-weight: 800;
        color: var(--muted-soft);
        letter-spacing: 0.04em;
        text-transform: uppercase;
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
        max-height: 124px;
        overflow-y: auto;
        padding: 10px;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--panel-soft);
      }
      .quick-replies-panel.collapsed .quick-replies {
        display: none;
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
        padding: 16px 16px 14px;
        display: grid;
        gap: 14px;
        background: linear-gradient(180deg, rgba(250, 251, 254, 0.96), rgba(255, 255, 255, 0.98));
      }
      .contacts-tabs {
        display: inline-flex;
        gap: 6px;
        padding: 0 16px 12px;
        border-bottom: 1px solid var(--border);
      }
      .contacts-tab {
        border: 1px solid var(--border);
        background: #fff;
        color: var(--muted);
        border-radius: 999px;
        padding: 7px 11px;
        font-size: 12px;
        font-weight: 700;
      }
      .contacts-tab.active {
        background: var(--accent-soft);
        color: var(--accent);
        border-color: var(--accent-border);
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
        gap: 10px;
      }
      .section-head h4 {
        margin: 0;
        font-size: 14px;
      }
      .section-head-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .info-grid {
        display: grid;
        gap: 8px;
      }
      .info-row,
      .contact-row {
        display: grid;
        grid-template-columns: 92px 1fr;
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
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 10px 22px rgba(15, 23, 42, 0.03);
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
        min-height: 18px;
        padding: 0 7px;
        border-radius: 999px;
        background: #f2f5fb;
        color: #56627b;
        font-size: 10px;
        font-weight: 800;
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
            <div id="quickRepliesPanel" class="quick-replies-panel collapsed">
              <div class="quick-replies-tools">
                <button id="toggleQuickRepliesBtn" type="button" class="quick-replies-toggle">Швидкі відповіді</button>
                <div class="ai-actions" id="aiActions">
                  <span class="ai-actions-label">AI</span>
                  <button type="button" class="ai-assist-btn" data-ai-action="draft">AI Draft</button>
                  <button type="button" class="ai-assist-btn" data-ai-action="shorten">Shorten</button>
                  <button type="button" class="ai-assist-btn" data-ai-action="more_sales">More Sales</button>
                  <button type="button" class="ai-assist-btn" data-ai-action="ask_contact">Ask Contact</button>
                  <button type="button" class="ai-assist-btn" data-ai-action="ask_file">Ask File</button>
                  <button type="button" class="ai-assist-btn" data-ai-action="summary">AI Summary</button>
                </div>
              </div>
              <div class="quick-replies" id="quickReplies"></div>
            </div>
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
          <div class="section-head">
            <div>
              <h3>Контакти</h3>
              <p>Міні CRM для поточного діалогу та списку лідів.</p>
            </div>
          </div>
        </div>
        <div class="contacts-tabs">
          <button id="currentContactTabBtn" type="button" class="contacts-tab active" data-contacts-tab="current">Поточний контакт</button>
          <button id="allContactsTabBtn" type="button" class="contacts-tab" data-contacts-tab="all">Всі контакти</button>
        </div>
        <div class="contacts-body">
          <section id="currentContactPanel" class="contacts-tab-panel">
            <div class="contacts-current">
            <div class="section-head">
              <div>
                <h4>Поточний відвідувач</h4>
                <p id="currentVisitorHint">Відкрий діалог, щоб побачити дані.</p>
              </div>
              <div class="section-head-actions">
                <button id="aiSummaryBtn" type="button" class="ghost-btn">AI Summary</button>
                <span id="linkedContactBadge" class="pill-count">0</span>
              </div>
            </div>

            <div id="contactSuggestion" class="suggestion-box" hidden></div>
            <div id="linkedContactCard"></div>
            <div id="currentVisitorInfo" class="info-grid"></div>
            <div id="aiSummaryCard" class="ai-summary-card" hidden></div>

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
                <button id="cancelContactBtn" type="button" class="secondary-btn" hidden>Cancel</button>
              </div>
            </form>
            </div>
          </section>

          <section id="allContactsPanel" class="contacts-tab-panel contacts-list-wrap" hidden>
            <div class="contacts-current" style="padding-bottom:12px;">
              <div class="section-head">
                <div>
                  <h4>Всі контакти</h4>
                  <p>Пошук, експорт і перехід до пов’язаних діалогів.</p>
                </div>
                <button id="exportContactsBtn" type="button" class="ghost-btn">Export CSV</button>
              </div>
            </div>
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
          showContactForm: false,
          contactFormDirty: false,
          contactFormConversationId: '',
          contactDraftHydratedKey: '',
          siteSettingsMap: {},
          quickRepliesCollapsed: true,
          viewedConversationMap: readViewedConversationMap(),
          groupOpenStateMap: readGroupOpenStateMap(),
          aiActionLoading: false,
          activeAiAction: ''
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
        const quickRepliesPanel = document.getElementById('quickRepliesPanel');
        const toggleQuickRepliesBtn = document.getElementById('toggleQuickRepliesBtn');
        const aiActions = document.getElementById('aiActions');
        const quickReplies = document.getElementById('quickReplies');
        const currentVisitorHint = document.getElementById('currentVisitorHint');
        const linkedContactBadge = document.getElementById('linkedContactBadge');
        const aiSummaryBtn = document.getElementById('aiSummaryBtn');
        const currentContactTabBtn = document.getElementById('currentContactTabBtn');
        const allContactsTabBtn = document.getElementById('allContactsTabBtn');
        const currentContactPanel = document.getElementById('currentContactPanel');
        const allContactsPanel = document.getElementById('allContactsPanel');
        const contactSuggestion = document.getElementById('contactSuggestion');
        const linkedContactCard = document.getElementById('linkedContactCard');
        const currentVisitorInfo = document.getElementById('currentVisitorInfo');
        const aiSummaryCard = document.getElementById('aiSummaryCard');
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
        const exportContactsBtn = document.getElementById('exportContactsBtn');

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

        function getConversationDisplayName(item) {
          const previewName = sanitizePreviewText(item && item.lastMessage);
          const visitorId = sanitizePreviewText(item && item.visitorId);
          if (visitorId) {
            return visitorId.length > 18 ? visitorId.slice(0, 18) : visitorId;
          }
          if (previewName && previewName.length <= 28) {
            return previewName;
          }
          return item && item.conversationId ? item.conversationId.slice(0, 14) : 'Visitor';
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
          const lastVisitorMessageAt = String(item && item.lastVisitorMessageAt || '');
          if (!lastVisitorMessageAt) return false;
          const viewedAt = String(state.viewedConversationMap[item.conversationId] || '');
          return !viewedAt || viewedAt < lastVisitorMessageAt;
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
          const aiActionsConfig = [
            { key: 'draft', label: 'AI Draft' },
            { key: 'shorten', label: 'Shorten' },
            { key: 'more_sales', label: 'More Sales' },
            { key: 'ask_contact', label: 'Ask Contact' },
            { key: 'ask_file', label: 'Ask File' },
            { key: 'summary', label: 'AI Summary' }
          ];
          quickRepliesPanel.classList.toggle('collapsed', state.quickRepliesCollapsed);
          aiActions.innerHTML = '<span class="ai-actions-label">AI</span>' + aiActionsConfig.map(function (item) {
            const isLoading =
              (item.key === 'summary' && state.aiSummaryLoading) ||
              (state.aiActionLoading && state.activeAiAction === item.key);
            const label = isLoading ? 'AI...' : item.label;
            const classes = 'ai-assist-btn' + (isLoading ? ' is-loading' : '');
            const disabled = state.aiActionLoading || state.aiSummaryLoading || !state.selectedConversation || !aiEnabled;
            return '<button type="button" class="' + classes + '" data-ai-action="' + escapeHtml(item.key) + '"' + (disabled ? ' disabled' : '') + '>' + escapeHtml(label) + '</button>';
          }).join('');
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
              const preview = getMeaningfulPreview(item);
              const unreadBadge = isConversationUnread(item) ? '<span class="new-dot">New</span>' : '';
              const timeLabel = formatSidebarTime(item.lastMessageAt);
              const avatarLabel = getInitials(displayName);
              return '<button type="button" class="conversation-item ' + (item.conversationId === state.selectedConversationId ? 'active ' : '') + (inboxStatus === 'closed' ? 'closed' : '') + '" data-conversation-id="' + escapeHtml(item.conversationId) + '">' +
                '<div class="conversation-main">' +
                  '<div class="conversation-avatar">' + escapeHtml(avatarLabel) + '</div>' +
                  '<div class="conversation-body">' +
                    '<div class="conversation-header">' +
                      '<span class="conversation-name">' + escapeHtml(displayName) + '</span>' +
                      '<span class="conversation-time">' + escapeHtml(timeLabel) + '</span>' +
                    '</div>' +
                    '<div class="last-message">' + escapeHtml(preview) + '</div>' +
                    '<div class="conversation-meta"><span class="status-pill">' + escapeHtml(item.siteId || '-') + '</span>' + unreadBadge + renderConversationStatusBadge(item) + '</div>' +
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
          renderQuickReplies();
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
          if (state.aiSummaryConversationId && state.aiSummaryConversationId !== conversation.conversationId && !state.aiSummaryLoading) {
            state.aiSummary = null;
            state.aiSummaryConversationId = '';
          }
          syncOperatorIdentity();
          renderQuickReplies();

          conversationTitle.textContent = conversation.conversationId;
          conversationSummary.textContent = conversation.sourcePage || 'Діалог з віджета сайту';
          conversationMeta.innerHTML =
            '<span>' + renderConversationStatusBadge(conversation) + '</span>' +
            '<span>' + escapeHtml(conversation.siteId || '-') + '</span>' +
            '<span>' + escapeHtml(formatDate(conversation.lastMessageAt)) + '</span>';

          messagesPane.innerHTML = '<div class="message-list">' + messages.map(function (message) {
            const attachments = Array.isArray(message.attachments) && message.attachments.length
              ? '<div class="attachments">' + message.attachments.map(function (file) {
                  return '<a href="' + escapeHtml(file.publicUrl || '#') + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(file.fileName || 'file') + '</a>';
                }).join('') + '</div>'
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
                (senderType === 'operator' ? '<div class="message-role">' + escapeHtml(managerProfile.title) + '</div>' : '') +
                '<div class="message-text">' + nl2br(message.text || '—') + '</div>' +
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

        function renderAiSummary() {
          const aiSettings = getCurrentAiAssistantSettings();
          const aiEnabled = Boolean(aiSettings && aiSettings.enabled);
          const hasConversation = Boolean(state.selectedConversation);

          aiSummaryBtn.disabled = !hasConversation || state.aiSummaryLoading || !aiEnabled;
          aiSummaryBtn.textContent = state.aiSummaryLoading ? 'AI...' : 'AI Summary';
          aiSummaryBtn.title = aiEnabled ? '' : 'Enable AI Assistant in Settings for this site.';

          if (!state.aiSummary && !state.aiSummaryLoading) {
            aiSummaryCard.hidden = true;
            aiSummaryCard.innerHTML = '';
            return;
          }

          if (
            state.selectedConversation &&
            state.aiSummaryConversationId &&
            state.aiSummaryConversationId !== state.selectedConversation.conversationId &&
            !state.aiSummaryLoading
          ) {
            aiSummaryCard.hidden = true;
            aiSummaryCard.innerHTML = '';
            return;
          }

          const summary = state.aiSummary || {};
          const knownInformation = Array.isArray(summary.knownInformation) ? summary.knownInformation : [];
          const missingInformation = Array.isArray(summary.missingInformation) ? summary.missingInformation : [];
          const renderList = function (items, emptyLabel) {
            if (!items.length) {
              return '<div class="ai-summary-value">' + escapeHtml(emptyLabel) + '</div>';
            }
            return '<ul class="ai-summary-list">' + items.map(function (item) {
              return '<li>' + escapeHtml(item) + '</li>';
            }).join('') + '</ul>';
          };

          aiSummaryCard.hidden = false;
          aiSummaryCard.innerHTML =
            '<div class="ai-summary-head">' +
              '<strong>AI Summary</strong>' +
              (state.aiSummaryLoading ? '<span class="status-pill subtle">Loading...</span>' : '') +
            '</div>' +
            '<div class="ai-summary-grid">' +
              '<div class="ai-summary-section">' +
                '<div class="ai-summary-label">Customer goal</div>' +
                '<div class="ai-summary-value">' + escapeHtml(summary.customerGoal || 'Не визначено') + '</div>' +
              '</div>' +
              '<div class="ai-summary-section">' +
                '<div class="ai-summary-label">Known information</div>' +
                renderList(knownInformation, 'Ще немає надійних даних.') +
              '</div>' +
              '<div class="ai-summary-section">' +
                '<div class="ai-summary-label">Missing information</div>' +
                renderList(missingInformation, 'Критичних пропусків не виявлено.') +
              '</div>' +
              '<div class="ai-summary-section">' +
                '<div class="ai-summary-label">Recommended next step</div>' +
                '<div class="ai-summary-value">' + escapeHtml(summary.recommendedNextStep || 'Уточнити наступний практичний крок.') + '</div>' +
              '</div>' +
            '</div>';
        }

        function renderContactsTabs() {
          const activeTab = state.contactsTab === 'all' ? 'all' : 'current';
          currentContactTabBtn.classList.toggle('active', activeTab === 'current');
          allContactsTabBtn.classList.toggle('active', activeTab === 'all');
          currentContactPanel.hidden = activeTab !== 'current';
          allContactsPanel.hidden = activeTab !== 'all';
        }

        function renderLinkedContactCard() {
          if (!state.linkedContact) {
            linkedContactCard.innerHTML = '';
            linkedContactBadge.textContent = '0';
            return;
          }

          linkedContactBadge.textContent = '1';
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
          renderContactsTabs();
          renderSuggestionBox();
          renderLinkedContactCard();
          renderCurrentVisitorInfo();
          renderAiSummary();
          renderContactForm(false);
          renderContactsList();
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
            if (selectedChanged) {
              state.aiSummary = null;
              state.aiSummaryConversationId = '';
              state.aiSummaryLoading = false;
            }

            if (
              !selectedChanged &&
              state.selectedConversation &&
              state.selectedMessagesSignature === nextSignature &&
              state.selectedConversation.status === conversation.status &&
              state.selectedConversation.lastMessageAt === conversation.lastMessageAt
            ) {
              state.selectedConversation = conversation;
              state.detectedContact = detectContactFromMessages(messages);
              renderQuickReplies();
              markConversationViewed(conversation.conversationId, getLatestVisitorMessageAt(messages));
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

        async function runAiAssist(action) {
          if (!state.selectedConversation || state.aiActionLoading) return;
          if (action === 'summary') {
            return runAiSummary();
          }
          state.aiActionLoading = true;
          state.activeAiAction = action;
          renderQuickReplies();
          try {
            const payload = await fetchJson('/api/inbox/conversations/' + encodeURIComponent(state.selectedConversation.conversationId) + '/ai-draft', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode: action,
                currentText: replyInput.value
              })
            });
            replyInput.value = payload.draft || payload.text || '';
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
          replyInput.focus();
        });

        toggleQuickRepliesBtn.addEventListener('click', function () {
          state.quickRepliesCollapsed = !state.quickRepliesCollapsed;
          renderQuickReplies();
        });

        aiActions.addEventListener('click', function (event) {
          const button = event.target.closest('[data-ai-action]');
          if (!button) return;
          const action = button.getAttribute('data-ai-action') || 'draft';
          runAiAssist(action).catch(function (error) {
            console.error(error);
            window.alert(error && error.message ? error.message : 'AI draft failed.');
          });
        });

        aiSummaryBtn.addEventListener('click', function () {
          runAiSummary().catch(function (error) {
            console.error(error);
            window.alert(error && error.message ? error.message : 'AI summary failed.');
          });
        });

        currentContactTabBtn.addEventListener('click', function () {
          state.contactsTab = 'current';
          renderContactsTabs();
        });

        allContactsTabBtn.addEventListener('click', function () {
          state.contactsTab = 'all';
          renderContactsTabs();
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

        exportContactsBtn.addEventListener('click', function () {
          const params = new URLSearchParams();
          if (state.selectedConversation && state.selectedConversation.siteId) {
            params.set('siteId', state.selectedConversation.siteId);
          }
          window.location.href = '/api/admin/contacts/export.csv' + (params.toString() ? '?' + params.toString() : '');
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
          loadSiteSettings(),
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
