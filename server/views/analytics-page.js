const { renderAppLayout } = require('./app-layout');

const ANALYTICS_NAV_SECTIONS = [
  { key: 'chats', label: 'Chats', items: ['overview', 'engagement', 'missed-chats', 'satisfaction', 'duration', 'availability'] },
  { key: 'ai', label: 'AI', items: ['overview', 'performance', 'usage', 'failures'] },
  { key: 'agents', label: 'Agents', items: ['performance', 'response-time', 'activity'] },
  { key: 'customers', label: 'Customers', items: ['leads', 'queue', 'abandonment'] },
  { key: 'ecommerce', label: 'Ecommerce', items: ['conversions', 'revenue', 'products'] },
  { key: 'insights', label: 'Insights', items: ['top-questions', 'trends', 'recommendations'] },
  { key: 'export', label: 'Export', items: ['generate-report', 'scheduled-reports'] }
];

function titleizeSlug(value) {
  return String(value || '')
    .split('-')
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
    .join(' ');
}

function renderAnalyticsNavMarkup() {
  return ANALYTICS_NAV_SECTIONS.map((section, sectionIndex) => (
    '<div class="analytics-nav-section' + (sectionIndex === 0 ? ' open' : '') + '" data-analytics-section="' + section.key + '">' +
      '<button type="button" class="analytics-nav-trigger' + (sectionIndex === 0 ? ' active' : '') + '" data-analytics-trigger="' + section.key + '">' +
        '<span class="analytics-nav-label">' + section.label + '</span>' +
        '<span class="analytics-nav-arrow">›</span>' +
      '</button>' +
      '<div class="analytics-nav-items">' +
        section.items.map((item, itemIndex) => (
          '<a class="analytics-nav-item' + (sectionIndex === 0 && itemIndex === 0 ? ' active' : '') + '"' +
            ' href="/analytics/' + encodeURIComponent(section.key) + '/' + encodeURIComponent(item) + '"' +
            ' data-analytics-nav-item="' + section.key + '/' + item + '">' +
            titleizeSlug(item) +
          '</a>'
        )).join('') +
      '</div>' +
    '</div>'
  )).join('');
}

function renderAnalyticsPage() {
  return renderAppLayout({
    title: 'Analytics',
    activeNav: 'analytics',
    styles: `
      :root {
        color-scheme: light;
        --page-bg: #f5f4f7;
        --panel: #ffffff;
        --panel-soft: #faf9fc;
        --bdr: #eeedf0;
        --bdr-strong: #dddbe6;
        --txt1: #0d0e14;
        --txt2: #6b6f80;
        --txt3: #a8aab8;
        --blue: #3b5bdb;
        --blue-l: #eef2ff;
        --blue-b: #c5d0fa;
        --green: #2f9e44;
        --green-l: #ebfbee;
        --amber: #f59f00;
        --amber-l: #fff9db;
        --red: #e03131;
        --red-l: #fff5f5;
        --purple: #7048e8;
        --purple-l: #f3f0ff;
        --shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04);
        --shadow-sm: 0 1px 2px rgba(0,0,0,.05);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--page-bg);
        color: var(--txt1);
        font-family: 'Plus Jakarta Sans', Manrope, Inter, ui-sans-serif, system-ui, sans-serif;
      }
      .analytics-page {
        min-height: 100vh;
        background: var(--page-bg);
      }
      .analytics-shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
      }
      .analytics-sidebar {
        background: #fff;
        border-right: 1px solid var(--bdr);
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .analytics-sidebar-head {
        padding: 18px 18px 14px;
        border-bottom: 1px solid var(--bdr);
        display: grid;
        gap: 3px;
      }
      .analytics-sidebar-head strong {
        font-size: 15px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .analytics-sidebar-head span {
        font-size: 11px;
        color: var(--txt3);
      }
      .analytics-sidebar-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 12px 10px 18px;
      }
      .analytics-sidebar-scroll::-webkit-scrollbar,
      .analytics-main-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .analytics-sidebar-scroll::-webkit-scrollbar-thumb,
      .analytics-main-scroll::-webkit-scrollbar-thumb {
        background: var(--bdr-strong);
        border-radius: 999px;
      }
      .analytics-nav {
        display: grid;
        gap: 6px;
      }
      .analytics-nav-section {
        display: grid;
        gap: 4px;
      }
      .analytics-nav-trigger {
        width: 100%;
        min-height: 42px;
        border: 1px solid transparent;
        border-radius: 10px;
        background: transparent;
        color: var(--txt1);
        padding: 0 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
      }
      .analytics-nav-trigger:hover {
        background: var(--panel-soft);
      }
      .analytics-nav-trigger.active {
        background: var(--blue-l);
        border-color: var(--blue-b);
        color: var(--blue);
      }
      .analytics-nav-arrow {
        font-size: 12px;
        color: var(--txt3);
        transition: transform .18s ease, color .18s ease;
      }
      .analytics-nav-section.open .analytics-nav-arrow {
        transform: rotate(90deg);
        color: var(--blue);
      }
      .analytics-nav-items {
        display: grid;
        gap: 4px;
        max-height: 0;
        overflow: hidden;
        padding-left: 14px;
        opacity: 0;
        transition: max-height .2s ease, opacity .18s ease, margin .18s ease;
      }
      .analytics-nav-section.open .analytics-nav-items {
        max-height: 420px;
        opacity: 1;
        margin-top: 2px;
      }
      .analytics-nav-item {
        min-height: 34px;
        border-radius: 9px;
        padding: 0 12px;
        display: flex;
        align-items: center;
        text-decoration: none;
        color: var(--txt2);
        background: transparent;
        font-size: 12px;
        font-weight: 600;
      }
      .analytics-nav-item:hover {
        background: var(--panel-soft);
        color: var(--txt1);
      }
      .analytics-nav-item.active {
        background: var(--blue-l);
        color: var(--blue);
      }
      .analytics-main {
        min-width: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
      .analytics-topbar {
        min-height: 60px;
        padding: 12px 22px;
        background: #fff;
        border-bottom: 1px solid var(--bdr);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .analytics-topbar-left {
        display: grid;
        gap: 2px;
      }
      .analytics-title {
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .analytics-subtitle {
        font-size: 11px;
        color: var(--txt3);
      }
      .analytics-topbar-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .range-tabs {
        display: inline-flex;
        gap: 3px;
        padding: 3px;
        background: var(--page-bg);
        border: 1px solid var(--bdr);
        border-radius: 9px;
      }
      .range-tab,
      .compare-btn,
      .topbar-select,
      .refresh-btn {
        font: inherit;
      }
      .range-tab {
        min-height: 30px;
        padding: 0 12px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: var(--txt2);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .range-tab.active {
        background: #fff;
        color: var(--txt1);
        box-shadow: var(--shadow-sm);
      }
      .compare-btn {
        min-height: 34px;
        padding: 0 12px;
        border: 1px solid var(--bdr);
        border-radius: 8px;
        background: #fff;
        color: var(--txt2);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .compare-btn.active {
        background: var(--blue-l);
        border-color: var(--blue-b);
        color: var(--blue);
      }
      .topbar-select {
        min-width: 150px;
        height: 34px;
        padding: 0 12px;
        border: 1px solid var(--bdr-strong);
        border-radius: 8px;
        background: #fff;
        color: var(--txt1);
        box-shadow: var(--shadow-sm);
        outline: none;
      }
      .refresh-btn {
        height: 34px;
        padding: 0 14px;
        border: 0;
        border-radius: 8px;
        background: var(--blue);
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 8px rgba(59,91,219,.25);
      }
      .refresh-btn svg {
        width: 13px;
        height: 13px;
        stroke: currentColor;
      }
      .analytics-main-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 20px 22px 24px;
      }
      .analytics-content {
        display: grid;
        gap: 14px;
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
      }
      .content-row {
        display: grid;
        gap: 14px;
        align-items: start;
      }
      .widget-card,
      .metric-card {
        background: #fff;
        border: 1px solid var(--bdr);
        border-radius: 12px;
        box-shadow: var(--shadow);
      }
      .metric-card {
        padding: 16px 18px;
        display: grid;
        gap: 8px;
        position: relative;
        overflow: hidden;
        min-height: 122px;
      }
      .metric-kicker {
        width: fit-content;
        min-height: 22px;
        padding: 0 8px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .metric-card.blue .metric-kicker { background: var(--blue-l); color: var(--blue); }
      .metric-card.green .metric-kicker { background: var(--green-l); color: var(--green); }
      .metric-card.amber .metric-kicker { background: var(--amber-l); color: var(--amber); }
      .metric-card.red .metric-kicker { background: var(--red-l); color: var(--red); }
      .metric-card.purple .metric-kicker { background: var(--purple-l); color: var(--purple); }
      .metric-value {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.04em;
        line-height: 1;
      }
      .metric-label {
        font-size: 12px;
        color: var(--txt2);
      }
      .metric-meta {
        font-size: 11px;
        color: var(--txt3);
      }
      .metric-compare {
        width: fit-content;
        min-height: 24px;
        padding: 0 8px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        font-size: 11px;
        font-weight: 700;
      }
      .metric-compare.up { background: var(--green-l); color: var(--green); }
      .metric-compare.down { background: var(--red-l); color: var(--red); }
      .metric-compare.neutral { background: var(--panel-soft); color: var(--txt3); }
      .metric-bar {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
      }
      .metric-card.blue .metric-bar { background: linear-gradient(90deg, var(--blue-b), var(--blue)); }
      .metric-card.green .metric-bar { background: linear-gradient(90deg, #b2f2bb, var(--green)); }
      .metric-card.amber .metric-bar { background: linear-gradient(90deg, #ffe066, var(--amber)); }
      .metric-card.red .metric-bar { background: linear-gradient(90deg, #ffc9c9, var(--red)); }
      .metric-card.purple .metric-bar { background: linear-gradient(90deg, #d0bfff, var(--purple)); }
      .widget-head {
        padding: 14px 18px 0;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .widget-title-wrap {
        display: grid;
        gap: 3px;
      }
      .widget-title {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .widget-subtitle {
        margin: 0;
        font-size: 12px;
        color: var(--txt3);
      }
      .widget-meta {
        font-size: 11px;
        color: var(--txt3);
        white-space: nowrap;
      }
      .widget-body {
        padding: 14px 18px 18px;
      }
      .line-shell {
        border: 1px solid var(--bdr);
        border-radius: 12px;
        background: linear-gradient(180deg, #fbfdff 0%, #f7f9fd 100%);
        padding: 14px;
        overflow: hidden;
      }
      .line-chart {
        width: 100%;
        height: 220px;
      }
      .line-chart-labels {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-top: 8px;
        font-size: 11px;
        color: var(--txt3);
        overflow: hidden;
      }
      .line-chart-labels span {
        flex: 1 1 0;
        min-width: 0;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .donut-wrap {
        display: grid;
        gap: 16px;
      }
      .donut-visual {
        min-height: 176px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .donut-ring {
        width: 168px;
        height: 168px;
        border-radius: 50%;
        position: relative;
        background: conic-gradient(var(--blue) 0deg, var(--blue) 360deg);
      }
      .donut-ring::after {
        content: '';
        position: absolute;
        inset: 24px;
        border-radius: 50%;
        background: #fff;
        border: 1px solid var(--bdr);
      }
      .donut-center {
        position: absolute;
        text-align: center;
        display: grid;
        gap: 2px;
      }
      .donut-center strong {
        font-size: 24px;
        letter-spacing: -0.04em;
      }
      .donut-center span {
        font-size: 11px;
        color: var(--txt3);
      }
      .donut-legend {
        display: grid;
        gap: 8px;
      }
      .legend-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .legend-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--txt2);
      }
      .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 3px;
        flex-shrink: 0;
      }
      .legend-value {
        font-size: 12px;
        font-weight: 700;
      }
      .bar-list {
        display: grid;
        gap: 10px;
      }
      .bar-row {
        display: grid;
        gap: 7px;
      }
      .bar-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .bar-head strong {
        font-size: 13px;
        font-weight: 600;
      }
      .bar-head span {
        font-size: 11px;
        color: var(--txt3);
      }
      .progress {
        height: 8px;
        border-radius: 999px;
        background: #edf1f7;
        overflow: hidden;
      }
      .progress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #6c8fff, var(--blue));
      }
      .progress.green span { background: linear-gradient(90deg, #69db7c, var(--green)); }
      .progress.amber span { background: linear-gradient(90deg, #ffd27a, var(--amber)); }
      .progress.red span { background: linear-gradient(90deg, #ffb0b0, var(--red)); }
      .progress.purple span { background: linear-gradient(90deg, #b197fc, var(--purple)); }
      .table-wrap {
        overflow-x: auto;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 540px;
      }
      .data-table th,
      .data-table td {
        padding: 11px 14px;
        border-bottom: 1px solid #f1f0f4;
        text-align: left;
        vertical-align: middle;
      }
      .data-table th {
        padding-top: 8px;
        padding-bottom: 8px;
        background: #fafafa;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .08em;
        color: var(--txt3);
      }
      .data-table td {
        font-size: 13px;
      }
      .data-table tr:last-child td {
        border-bottom: 0;
      }
      .align-right {
        text-align: right !important;
      }
      .empty-state,
      .loading-state,
      .error-state {
        min-height: 120px;
        border: 1px dashed var(--bdr-strong);
        border-radius: 12px;
        background: var(--panel-soft);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: var(--txt3);
        font-size: 13px;
        padding: 18px;
      }
      .error-state {
        color: var(--red);
      }
      .spinner {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2.5px solid var(--bdr-strong);
        border-top-color: var(--blue);
        animation: analytics-spin .7s linear infinite;
      }
      @keyframes analytics-spin {
        to { transform: rotate(360deg); }
      }
      .heatmap {
        display: grid;
        gap: 8px;
      }
      .heatmap-top {
        display: grid;
        grid-template-columns: 42px repeat(24, minmax(0, 1fr));
        gap: 4px;
        font-size: 10px;
        color: var(--txt3);
      }
      .heatmap-row {
        display: grid;
        grid-template-columns: 42px repeat(24, minmax(0, 1fr));
        gap: 4px;
        align-items: center;
      }
      .heatmap-label {
        font-size: 10px;
        color: var(--txt3);
      }
      .heatmap-cell {
        aspect-ratio: 1 / 1;
        border-radius: 6px;
        background: #edf1f7;
        position: relative;
      }
      .heatmap-cell[data-level="1"] { background: #d9e2ff; }
      .heatmap-cell[data-level="2"] { background: #b9c8ff; }
      .heatmap-cell[data-level="3"] { background: #8ba4ff; }
      .heatmap-cell[data-level="4"] { background: #5d80ff; }
      .heatmap-cell[data-level="5"] { background: #3b5bdb; }
      .insight-list {
        display: grid;
        gap: 12px;
      }
      .insight-card {
        border: 1px solid var(--bdr);
        border-radius: 12px;
        background: var(--panel-soft);
        padding: 14px;
        display: grid;
        gap: 8px;
      }
      .insight-card strong {
        font-size: 14px;
      }
      .insight-card p {
        margin: 0;
        font-size: 13px;
        color: var(--txt2);
        line-height: 1.55;
      }
      .insight-action {
        font-size: 12px;
        font-weight: 700;
        color: var(--blue);
      }
      .export-panel {
        display: grid;
        gap: 14px;
      }
      .export-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .ghost-btn {
        min-height: 34px;
        padding: 0 12px;
        border: 1px solid var(--bdr);
        border-radius: 8px;
        background: #fff;
        color: var(--txt2);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .ghost-btn.primary {
        background: var(--blue);
        border-color: var(--blue);
        color: #fff;
      }
      .hidden {
        display: none !important;
      }
      @media (max-width: 1200px) {
        .analytics-shell {
          grid-template-columns: 240px minmax(0, 1fr);
        }
      }
      @media (max-width: 980px) {
        .analytics-shell {
          grid-template-columns: 1fr;
        }
        .analytics-sidebar {
          display: none;
        }
        .analytics-main-scroll {
          padding: 16px 18px 20px;
        }
        .analytics-topbar {
          padding: 12px 18px;
        }
      }
    `,
    content: `
      <div class="analytics-page">
        <div class="analytics-shell">
          <aside class="analytics-sidebar">
            <div class="analytics-sidebar-head">
              <strong>Analytics</strong>
              <span>Navigation</span>
            </div>
            <div class="analytics-sidebar-scroll">
              <nav id="analyticsNav" class="analytics-nav" aria-label="Analytics navigation">${renderAnalyticsNavMarkup()}</nav>
            </div>
          </aside>

          <section class="analytics-main">
            <header class="analytics-topbar">
              <div class="analytics-topbar-left">
                <div class="analytics-title" id="analyticsPageTitle">Analytics</div>
                <div class="analytics-subtitle" id="analyticsUpdatedAt">Updated: loading…</div>
              </div>
              <div class="analytics-topbar-right">
                <div class="range-tabs" id="periodFilter">
                  <button type="button" class="range-tab" data-period="24h">Last 24h</button>
                  <button type="button" class="range-tab" data-period="7d">7 days</button>
                  <button type="button" class="range-tab active" data-period="30d">30 days</button>
                  <button type="button" class="range-tab" data-period="60d">60 days</button>
                  <button type="button" class="range-tab" data-period="90d">90 days</button>
                </div>
                <button type="button" class="compare-btn" id="compareBtn">Compare previous</button>
                <select id="siteSelect" class="topbar-select" aria-label="Select site">
                  <option value="">All sites</option>
                </select>
                <select id="operatorSelect" class="topbar-select hidden" aria-label="Select operator">
                  <option value="">All operators</option>
                </select>
                <button id="refreshBtn" type="button" class="refresh-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 3v6h-6"></path>
                    <path d="M3 21v-6h6"></path>
                    <path d="M21 9a9 9 0 0 0-15.5-3.36L3 9"></path>
                    <path d="M3 15a9 9 0 0 0 15.5 3.36L21 15"></path>
                  </svg>
                  Refresh
                </button>
              </div>
            </header>

            <div class="analytics-main-scroll">
              <div id="analyticsContent" class="analytics-content"></div>
            </div>
          </section>
        </div>
      </div>
    `,
    scripts: `<script>
      (function () {
        const analyticsNav = document.getElementById('analyticsNav');
        const analyticsContent = document.getElementById('analyticsContent');
        const analyticsPageTitle = document.getElementById('analyticsPageTitle');
        const analyticsUpdatedAt = document.getElementById('analyticsUpdatedAt');
        const periodFilter = document.getElementById('periodFilter');
        const compareBtn = document.getElementById('compareBtn');
        const siteSelect = document.getElementById('siteSelect');
        const operatorSelect = document.getElementById('operatorSelect');
        const refreshBtn = document.getElementById('refreshBtn');
        const NAV_STORAGE_KEY = 'chat-platform-analytics-nav-open';
        let currentPayload = null;
        const state = {
          period: new URLSearchParams(window.location.search).get('period') || '30d',
          siteId: new URLSearchParams(window.location.search).get('siteId') || '',
          operator: new URLSearchParams(window.location.search).get('operator') || '',
          compare: /^(1|true|yes)$/i.test(String(new URLSearchParams(window.location.search).get('compare') || '')),
          loading: false,
          sitesLoaded: false,
          navPath: parseAnalyticsPath(window.location.pathname),
          navOpen: readNavOpenState()
        };

        function escapeHtml(value) {
          return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function parseAnalyticsPath(pathname) {
          const clean = String(pathname || '/analytics').replace(/^\\/+|\\/+$/g, '');
          const parts = clean.split('/');
          if (parts[0] !== 'analytics') return { section: 'chats', item: 'overview' };
          return {
            section: parts[1] || 'chats',
            item: parts[2] || 'overview'
          };
        }

        function formatDuration(seconds) {
          const total = Math.max(0, Math.round(Number(seconds || 0)));
          const hours = Math.floor(total / 3600);
          const minutes = Math.floor((total % 3600) / 60);
          if (hours > 0) return hours + 'h ' + minutes + 'm';
          if (minutes > 0) return minutes + 'm';
          return total + 's';
        }

        function readNavOpenState() {
          try {
            const parsed = JSON.parse(window.localStorage.getItem(NAV_STORAGE_KEY) || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
          } catch (error) {
            return {};
          }
        }

        function writeNavOpenState() {
          try {
            window.localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(state.navOpen || {}));
          } catch (error) {}
        }

        function syncControls() {
          Array.from(periodFilter.querySelectorAll('[data-period]')).forEach(function (button) {
            button.classList.toggle('active', button.getAttribute('data-period') === state.period);
          });
          compareBtn.classList.toggle('active', state.compare);
          siteSelect.value = state.siteId;
          operatorSelect.value = state.operator;
        }

        function updateUrlState(push) {
          const params = new URLSearchParams();
          params.set('period', state.period);
          if (state.siteId) params.set('siteId', state.siteId);
          if (state.operator) params.set('operator', state.operator);
          if (state.compare) params.set('compare', '1');
          const pathname = '/analytics/' + encodeURIComponent(state.navPath.section) + '/' + encodeURIComponent(state.navPath.item);
          const method = push ? 'pushState' : 'replaceState';
          window.history[method]({}, '', pathname + '?' + params.toString());
        }

        function renderAnalyticsNav() {
          if (!analyticsNav) return;
          Array.from(analyticsNav.querySelectorAll('.analytics-nav-section')).forEach(function (sectionNode) {
            const sectionKey = String(sectionNode.getAttribute('data-analytics-section') || '');
            const open = state.navOpen[sectionKey] !== false || sectionKey === state.navPath.section;
            sectionNode.classList.toggle('open', open);
            const trigger = sectionNode.querySelector('[data-analytics-trigger]');
            if (trigger) {
              trigger.classList.toggle('active', sectionKey === state.navPath.section);
            }
          });
          Array.from(analyticsNav.querySelectorAll('.analytics-nav-item')).forEach(function (itemNode) {
            const key = String(itemNode.getAttribute('data-analytics-nav-item') || '');
            itemNode.classList.toggle('active', key === (state.navPath.section + '/' + state.navPath.item));
          });
        }

        async function fetchJson(url) {
          const response = await fetch(url);
          const payload = await response.json();
          if (!response.ok || !payload.ok) {
            throw new Error(payload.message || 'Request failed');
          }
          return payload;
        }

        async function ensureSitesLoaded() {
          if (state.sitesLoaded) return;
          state.sitesLoaded = true;
          try {
            const payload = await fetchJson('/api/admin/sites');
            const sites = Array.isArray(payload.sites) ? payload.sites : [];
            siteSelect.innerHTML = '<option value="">All sites</option>' + sites.map(function (site) {
              const siteId = String(site.siteId || '').trim();
              const title = String(site.title || siteId || 'Site').trim();
              return '<option value="' + escapeHtml(siteId) + '">' + escapeHtml(title) + '</option>';
            }).join('');
            siteSelect.value = state.siteId;
          } catch (error) {
            siteSelect.innerHTML = '<option value="">All sites</option>';
          }
        }

        function renderLoading() {
          analyticsContent.innerHTML =
            '<div class="metrics-grid">' +
              Array(4).fill('<div class="metric-card"><div class="loading-state"><div class="spinner"></div></div><div class="metric-bar"></div></div>').join('') +
            '</div>' +
            '<div class="widget-card"><div class="widget-body"><div class="loading-state"><div class="spinner"></div></div></div></div>';
        }

        function formatWidgetValue(value, format) {
          if (format === 'duration') return formatDuration(value);
          return escapeHtml(value);
        }

        function renderMetrics(items) {
          if (!Array.isArray(items) || !items.length) return '';
          return '<div class="metrics-grid">' + items.map(function (item) {
            const tone = escapeHtml(item.tone || 'blue');
            const compare = item.compare
              ? '<span class="metric-compare ' + escapeHtml(item.compare.direction || 'neutral') + '">' + escapeHtml(item.compare.label || '') + '</span>'
              : '';
            return (
              '<article class="metric-card ' + tone + '">' +
                '<span class="metric-kicker">' + escapeHtml(item.label || '') + '</span>' +
                '<div class="metric-value">' + escapeHtml(item.value || '') + '</div>' +
                '<div class="metric-label">' + escapeHtml(item.meta || '') + '</div>' +
                compare +
                '<div class="metric-bar"></div>' +
              '</article>'
            );
          }).join('') + '</div>';
        }

        function renderLineWidget(widget) {
          const labels = Array.isArray(widget.labels) ? widget.labels : [];
          const series = Array.isArray(widget.series) ? widget.series : [];
          if (!labels.length || !series.length) {
            return '<div class="empty-state">No chart data available.</div>';
          }
          const width = 760;
          const height = 260;
          const max = Math.max.apply(null, series.flatMap(function (entry) {
            return Array.isArray(entry.values) ? entry.values.map(function (value) { return Number(value || 0); }) : [0];
          }).concat([1]));
          const gridLines = [0, 0.25, 0.5, 0.75, 1].map(function (ratio) {
            const y = 20 + ((height - 40) * ratio);
            return '<line x1="20" y1="' + y.toFixed(1) + '" x2="' + (width - 20) + '" y2="' + y.toFixed(1) + '" stroke="#ececf2" stroke-width="1"></line>';
          }).join('');
          const stepX = labels.length > 1 ? (width - 40) / (labels.length - 1) : 0;
          const seriesHtml = series.map(function (entry, index) {
            const points = labels.map(function (_, pointIndex) {
              const x = 20 + (stepX * pointIndex);
              const y = height - 20 - ((Number(entry.values[pointIndex] || 0) / max) * (height - 60));
              return { x: x, y: y };
            });
            const polyline = points.map(function (point) { return point.x.toFixed(1) + ',' + point.y.toFixed(1); }).join(' ');
            const fillPath = index === 0
              ? ('M ' + points.map(function (point) { return point.x.toFixed(1) + ' ' + point.y.toFixed(1); }).join(' L ') + ' L ' + points[points.length - 1].x.toFixed(1) + ' ' + (height - 20) + ' L ' + points[0].x.toFixed(1) + ' ' + (height - 20) + ' Z')
              : '';
            const circles = points.map(function (point) {
              return '<circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="3.5" fill="#fff" stroke="' + escapeHtml(entry.color || '#3b5bdb') + '" stroke-width="2"></circle>';
            }).join('');
            return (fillPath ? '<path d="' + fillPath + '" fill="rgba(59,91,219,.08)"></path>' : '') +
              '<polyline fill="none" stroke="' + escapeHtml(entry.color || '#3b5bdb') + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="' + polyline + '"></polyline>' +
              circles;
          }).join('');
          const stride = labels.length > 12 ? Math.ceil(labels.length / 12) : 1;
          const legend = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px;">' + series.map(function (entry) {
            return '<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--txt2);"><span style="width:10px;height:10px;border-radius:3px;background:' + escapeHtml(entry.color || '#3b5bdb') + ';display:inline-block;"></span>' + escapeHtml(entry.label || '') + '</span>';
          }).join('') + '</div>';
          return legend +
            '<div class="line-shell">' +
              '<svg class="line-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' + escapeHtml(widget.title || 'Line chart') + '">' +
                gridLines +
                seriesHtml +
              '</svg>' +
              '<div class="line-chart-labels">' + labels.map(function (label, index) {
                return '<span>' + (index % stride === 0 || index === labels.length - 1 ? escapeHtml(label) : '&nbsp;') + '</span>';
              }).join('') + '</div>' +
            '</div>';
        }

        function renderDonutWidget(widget) {
          const segments = Array.isArray(widget.segments) ? widget.segments : [];
          const total = segments.reduce(function (sum, segment) { return sum + Number(segment.value || 0); }, 0);
          if (!total) return '<div class="empty-state">No distribution data available.</div>';
          let offset = 0;
          const gradient = segments.map(function (segment) {
            const slice = (Number(segment.value || 0) / total) * 360;
            const start = offset;
            offset += slice;
            return escapeHtml(segment.color || '#3b5bdb') + ' ' + start.toFixed(2) + 'deg ' + offset.toFixed(2) + 'deg';
          }).join(', ');
          return (
            '<div class="donut-wrap">' +
              '<div class="donut-visual">' +
                '<div class="donut-ring" style="background:conic-gradient(' + gradient + ')"></div>' +
                '<div class="donut-center"><strong>' + escapeHtml(total) + '</strong><span>' + escapeHtml(widget.totalLabel || 'Total') + '</span></div>' +
              '</div>' +
              '<div class="donut-legend">' +
                segments.map(function (segment) {
                  const pct = total ? ((Number(segment.value || 0) / total) * 100).toFixed(1) : '0.0';
                  return '<div class="legend-row"><span class="legend-label"><span class="legend-dot" style="background:' + escapeHtml(segment.color || '#3b5bdb') + '"></span>' + escapeHtml(segment.label || '') + '</span><span class="legend-value">' + pct + '%</span></div>';
                }).join('') +
              '</div>' +
            '</div>'
          );
        }

        function renderBarsWidget(widget) {
          const items = Array.isArray(widget.items) ? widget.items : [];
          if (!items.length) return '<div class="empty-state">No bar data available.</div>';
          const max = Math.max.apply(null, items.map(function (item) { return Number(item.value || 0); }).concat([1]));
          return '<div class="bar-list">' + items.map(function (item) {
            const tone = escapeHtml(item.tone || 'blue');
            return (
              '<div class="bar-row">' +
                '<div class="bar-head"><strong>' + escapeHtml(item.label || '') + '</strong><span>' + formatWidgetValue(item.value, item.format) + '</span></div>' +
                '<div class="progress ' + tone + '"><span style="width:' + ((Number(item.value || 0) / max) * 100).toFixed(2) + '%"></span></div>' +
              '</div>'
            );
          }).join('') + '</div>';
        }

        function renderTableWidget(widget) {
          const columns = Array.isArray(widget.columns) ? widget.columns : [];
          const rows = Array.isArray(widget.rows) ? widget.rows : [];
          if (!columns.length) return '<div class="empty-state">No table data available.</div>';
          if (!rows.length) return '<div class="empty-state">No rows for this view yet.</div>';
          function renderCellValue(value) {
            if (value && typeof value === 'object') {
              if (value.type === 'link') {
                return '<a href="' + escapeHtml(value.href || '#') + '" style="display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border:1px solid var(--blue-b);border-radius:8px;background:var(--blue-l);color:var(--blue);font-size:12px;font-weight:700;text-decoration:none;">' + escapeHtml(value.label || 'Open') + '</a>';
              }
            }
            return escapeHtml(value == null ? '—' : value);
          }
          return (
            '<div class="table-wrap"><table class="data-table"><thead><tr>' +
              columns.map(function (column) {
                return '<th class="' + (column.align === 'right' ? 'align-right' : '') + '">' + escapeHtml(column.label || '') + '</th>';
              }).join('') +
            '</tr></thead><tbody>' +
              rows.map(function (row) {
                return '<tr>' + columns.map(function (column) {
                  return '<td class="' + (column.align === 'right' ? 'align-right' : '') + '">' + renderCellValue(row[column.key]) + '</td>';
                }).join('') + '</tr>';
              }).join('') +
            '</tbody></table></div>'
          );
        }

        function renderHeatmapWidget(widget) {
          const xLabels = Array.isArray(widget.xLabels) ? widget.xLabels : [];
          const yLabels = Array.isArray(widget.yLabels) ? widget.yLabels : [];
          const cells = Array.isArray(widget.cells) ? widget.cells : [];
          if (!xLabels.length || !yLabels.length || !cells.length) return '<div class="empty-state">No heatmap data available.</div>';
          const max = Math.max.apply(null, cells.flatMap(function (row) { return row; }).concat([0]));
          function level(value) {
            if (!max || !value) return 0;
            const ratio = value / max;
            if (ratio >= 0.8) return 5;
            if (ratio >= 0.6) return 4;
            if (ratio >= 0.4) return 3;
            if (ratio >= 0.2) return 2;
            return 1;
          }
          return (
            '<div class="heatmap">' +
              '<div class="heatmap-top"><span></span>' + xLabels.map(function (label) { return '<span class="heatmap-label">' + escapeHtml(label) + '</span>'; }).join('') + '</div>' +
              yLabels.map(function (label, rowIndex) {
                return '<div class="heatmap-row"><span class="heatmap-label">' + escapeHtml(label) + '</span>' +
                  xLabels.map(function (_, colIndex) {
                    const value = Number((cells[rowIndex] || [])[colIndex] || 0);
                    return '<span class="heatmap-cell" data-level="' + level(value) + '" title="' + escapeHtml(label + ' ' + xLabels[colIndex] + ': ' + value) + '"></span>';
                  }).join('') +
                '</div>';
              }).join('') +
            '</div>'
          );
        }

        function renderInsightsWidget(widget) {
          const items = Array.isArray(widget.items) ? widget.items : [];
          if (!items.length) return '<div class="empty-state">No recommendations available.</div>';
          return '<div class="insight-list">' + items.map(function (item) {
            return (
              '<article class="insight-card">' +
                '<strong>' + escapeHtml(item.title || '') + '</strong>' +
                '<p>' + escapeHtml(item.text || '') + '</p>' +
                '<span class="insight-action">' + escapeHtml(item.action || '') + '</span>' +
              '</article>'
            );
          }).join('') + '</div>';
        }

        function renderExportWidget(widget) {
          return (
            '<div class="export-panel">' +
              '<div class="widget-subtitle">Current section: ' + escapeHtml((widget.options && widget.options.section) || '') + ' / ' + escapeHtml((widget.options && widget.options.item) || '') + '</div>' +
              '<div class="export-actions">' +
                '<button type="button" class="ghost-btn primary" data-export-type="json">Export JSON</button>' +
                '<button type="button" class="ghost-btn" data-export-type="csv">Export CSV</button>' +
                '<button type="button" class="ghost-btn" data-export-type="pdf">Export PDF</button>' +
              '</div>' +
            '</div>'
          );
        }

        function renderWidget(widget) {
          const title = escapeHtml(widget.title || '');
          const subtitle = escapeHtml(widget.subtitle || '');
          let body = '';
          if (widget.kind === 'line') body = renderLineWidget(widget);
          else if (widget.kind === 'donut') body = renderDonutWidget(widget);
          else if (widget.kind === 'bars') body = renderBarsWidget(widget);
          else if (widget.kind === 'table') body = renderTableWidget(widget);
          else if (widget.kind === 'heatmap') body = renderHeatmapWidget(widget);
          else if (widget.kind === 'insights') body = renderInsightsWidget(widget);
          else if (widget.kind === 'export') body = renderExportWidget(widget);
          else if (widget.kind === 'empty') body = '<div class="empty-state">' + escapeHtml(widget.subtitle || 'No data available.') + '</div>';
          else body = '<div class="empty-state">Unsupported widget type.</div>';
          return (
            '<section class="widget-card">' +
              '<div class="widget-head">' +
                '<div class="widget-title-wrap"><h2 class="widget-title">' + title + '</h2><p class="widget-subtitle">' + subtitle + '</p></div>' +
                (widget.meta ? '<span class="widget-meta">' + escapeHtml(widget.meta) + '</span>' : '') +
              '</div>' +
              '<div class="widget-body">' + body + '</div>' +
            '</section>'
          );
        }

        function renderRows(rows) {
          return (Array.isArray(rows) ? rows : []).map(function (row) {
            if (row.type === 'metrics') return renderMetrics(row.items);
            const columns = row.columns || '1fr';
            return '<div class="content-row" style="grid-template-columns:' + escapeHtml(columns) + ';">' + (Array.isArray(row.widgets) ? row.widgets.map(renderWidget).join('') : '') + '</div>';
          }).join('');
        }

        function setOperatorFilter(payload) {
          const relevant = Boolean(payload && payload.page && payload.page.filters && payload.page.filters.operator);
          operatorSelect.classList.toggle('hidden', !relevant);
          const options = payload && payload.page && payload.page.controls && Array.isArray(payload.page.controls.operatorOptions)
            ? payload.page.controls.operatorOptions
            : [];
          operatorSelect.innerHTML = '<option value="">All operators</option>' + options.map(function (name) {
            return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
          }).join('');
          operatorSelect.value = state.operator;
          if (!relevant) {
            state.operator = '';
          }
        }

        function renderPayload(payload) {
          currentPayload = payload;
          analyticsPageTitle.textContent = payload && payload.page && payload.page.title ? payload.page.title : 'Analytics';
          analyticsUpdatedAt.textContent = 'Updated: ' + (payload.generatedAt || '—');
          setOperatorFilter(payload);
          analyticsContent.innerHTML = renderRows(payload.page && payload.page.rows ? payload.page.rows : []);
        }

        function buildCsvFromPayload(payload) {
          if (!payload || !payload.page) return 'section,item\\n';
          const rows = [];
          rows.push(['section', 'item', 'title']);
          rows.push([payload.page.section, payload.page.item, payload.page.title || '']);
          (payload.page.rows || []).forEach(function (row) {
            if (row.type === 'metrics') {
              (row.items || []).forEach(function (item) {
                rows.push(['metric', item.label || '', item.value || '', item.meta || '']);
              });
              return;
            }
            (row.widgets || []).forEach(function (widget) {
              if (widget.kind === 'table') {
                rows.push(['table', widget.title || '']);
                rows.push((widget.columns || []).map(function (column) { return column.label || column.key || ''; }));
                (widget.rows || []).forEach(function (tableRow) {
                  rows.push((widget.columns || []).map(function (column) { return tableRow[column.key] == null ? '' : String(tableRow[column.key]); }));
                });
              }
            });
          });
          return rows.map(function (row) {
            return row.map(function (cell) {
              return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"';
            }).join(',');
          }).join('\\n');
        }

        function downloadBlob(filename, content, type) {
          const blob = new Blob([content], { type: type });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = filename;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(url);
        }

        async function loadAnalytics(pushHistory) {
          if (state.loading) return;
          state.loading = true;
          renderAnalyticsNav();
          syncControls();
          renderLoading();
          try {
            updateUrlState(Boolean(pushHistory));
            await ensureSitesLoaded();
            const params = new URLSearchParams();
            params.set('period', state.period);
            params.set('section', state.navPath.section);
            params.set('item', state.navPath.item);
            if (state.siteId) params.set('siteId', state.siteId);
            if (state.operator) params.set('operator', state.operator);
            if (state.compare) params.set('compare', '1');
            const payload = await fetchJson('/api/admin/analytics?' + params.toString());
            renderPayload(payload);
          } catch (error) {
            analyticsContent.innerHTML = '<div class="widget-card"><div class="widget-body"><div class="error-state">Failed to load analytics. ' + escapeHtml(error && error.message || '') + '</div></div></div>';
            analyticsUpdatedAt.textContent = 'Updated: failed';
          } finally {
            state.loading = false;
          }
        }

        periodFilter.addEventListener('click', function (event) {
          const button = event.target.closest('[data-period]');
          if (!button) return;
          const period = String(button.getAttribute('data-period') || '').trim();
          if (!period || period === state.period) return;
          state.period = period;
          loadAnalytics(false).catch(console.error);
        });

        compareBtn.addEventListener('click', function () {
          state.compare = !state.compare;
          loadAnalytics(false).catch(console.error);
        });

        siteSelect.addEventListener('change', function () {
          state.siteId = String(siteSelect.value || '').trim();
          loadAnalytics(false).catch(console.error);
        });

        operatorSelect.addEventListener('change', function () {
          state.operator = String(operatorSelect.value || '').trim();
          loadAnalytics(false).catch(console.error);
        });

        refreshBtn.addEventListener('click', function () {
          loadAnalytics(false).catch(console.error);
        });

        if (analyticsNav) analyticsNav.addEventListener('click', function (event) {
          const trigger = event.target.closest('[data-analytics-trigger]');
          if (trigger) {
            const key = String(trigger.getAttribute('data-analytics-trigger') || '').trim();
            if (!key) return;
            state.navOpen[key] = !(state.navOpen[key] !== false);
            writeNavOpenState();
            renderAnalyticsNav();
            return;
          }
          const itemLink = event.target.closest('[data-analytics-nav-item]');
          if (!itemLink) return;
          event.preventDefault();
          const parts = String(itemLink.getAttribute('data-analytics-nav-item') || '').split('/');
          if (parts.length !== 2) return;
          state.navPath = { section: parts[0], item: parts[1] };
          state.navOpen[parts[0]] = true;
          writeNavOpenState();
          loadAnalytics(true).catch(console.error);
        });

        analyticsContent.addEventListener('click', function (event) {
          const exportButton = event.target.closest('[data-export-type]');
          if (!exportButton || !currentPayload) return;
          const exportType = String(exportButton.getAttribute('data-export-type') || '').trim();
          const slug = (currentPayload.page && currentPayload.page.section ? currentPayload.page.section : 'analytics') + '-' + (currentPayload.page && currentPayload.page.item ? currentPayload.page.item : 'report');
          if (exportType === 'json') {
            downloadBlob(slug + '.json', JSON.stringify(currentPayload, null, 2), 'application/json');
            return;
          }
          if (exportType === 'csv') {
            downloadBlob(slug + '.csv', buildCsvFromPayload(currentPayload), 'text/csv;charset=utf-8');
            return;
          }
          if (exportType === 'pdf') {
            window.print();
          }
        });

        window.addEventListener('popstate', function () {
          state.navPath = parseAnalyticsPath(window.location.pathname);
          state.period = new URLSearchParams(window.location.search).get('period') || '30d';
          state.siteId = new URLSearchParams(window.location.search).get('siteId') || '';
          state.operator = new URLSearchParams(window.location.search).get('operator') || '';
          state.compare = /^(1|true|yes)$/i.test(String(new URLSearchParams(window.location.search).get('compare') || ''));
          loadAnalytics(false).catch(console.error);
        });

        renderAnalyticsNav();
        loadAnalytics(false).catch(console.error);
      })();
    </script>`
  });
}

module.exports = {
  renderAnalyticsPage
};
