const { renderAppLayout } = require('./app-layout');

const ANALYTICS_NAV_SECTIONS = [
  { key: 'chats', label: 'Chats', items: [
    { key: 'overview', label: 'Overview' },
    { key: 'engagement', label: 'Engagement' },
    { key: 'missed-chats', label: 'Missed chats' },
    { key: 'satisfaction', label: 'Satisfaction' },
    { key: 'duration', label: 'Duration' },
    { key: 'availability', label: 'Availability' }
  ]},
  { key: 'ai', label: 'AI', items: [
    { key: 'overview', label: 'Overview' },
    { key: 'performance', label: 'Performance' },
    { key: 'usage', label: 'Usage' },
    { key: 'failures', label: 'Failures' }
  ]},
  { key: 'agents', label: 'Agents', items: [
    { key: 'performance', label: 'Performance' },
    { key: 'response-time', label: 'Response time' },
    { key: 'activity', label: 'Activity' }
  ]},
  { key: 'customers', label: 'Customers', items: [
    { key: 'leads', label: 'Leads' },
    { key: 'queue', label: 'Queue' },
    { key: 'abandonment', label: 'Abandonment' }
  ]},
  { key: 'ecommerce', label: 'Ecommerce', items: [
    { key: 'conversions', label: 'Conversions' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'products', label: 'Products' }
  ]},
  { key: 'insights', label: 'Insights', items: [
    { key: 'top-questions', label: 'Top questions' },
    { key: 'trends', label: 'Trends' },
    { key: 'recommendations', label: 'Recommendations' }
  ]},
  { key: 'export', label: 'Export', items: [
    { key: 'generate-report', label: 'Generate report' },
    { key: 'scheduled-reports', label: 'Scheduled reports' }
  ]}
];

function renderAnalyticsNavMarkup() {
  return ANALYTICS_NAV_SECTIONS.map((section, index) => {
    const itemsHtml = section.items.map((item) => (
      '<a class="analytics-nav-item' + (index === 0 && item.key === 'overview' ? ' active' : '') + '"' +
      ' href="/analytics/' + encodeURIComponent(section.key) + '/' + encodeURIComponent(item.key) + '"' +
      ' data-analytics-nav-item="' + section.key + '/' + item.key + '">' +
      item.label +
      '</a>'
    )).join('');

    return '<div class="analytics-nav-section' + (index === 0 ? ' open' : '') + '" data-analytics-section="' + section.key + '">' +
      '<button type="button" class="analytics-nav-trigger' + (index === 0 ? ' active' : '') + '" data-analytics-trigger="' + section.key + '">' +
        '<span class="analytics-nav-label">' + section.label + '</span>' +
        '<span class="analytics-nav-arrow">›</span>' +
      '</button>' +
      '<div class="analytics-nav-items">' + itemsHtml + '</div>' +
    '</div>';
  }).join('');
}

function renderAnalyticsPage() {
  return renderAppLayout({
    title: 'Chat Analytics',
    activeNav: 'analytics',
    styles: `
      :root {
        color-scheme: light;
        --page-bg: #f5f4f7;
        --card: #ffffff;
        --card-soft: #faf9fc;
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
        font-family: 'Plus Jakarta Sans', Manrope, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: var(--page-bg);
        color: var(--txt1);
      }
      .analytics-page {
        min-height: 100vh;
        background: var(--page-bg);
      }
      .analytics-shell {
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        min-height: 100vh;
      }
      .analytics-sidebar {
        border-right: 1px solid var(--bdr);
        background: #ffffff;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .analytics-sidebar-head {
        padding: 18px 16px 14px;
        border-bottom: 1px solid var(--bdr);
        display: grid;
        gap: 3px;
      }
      .analytics-sidebar-head strong {
        font-size: 15px;
        font-weight: 600;
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
        padding: 12px 10px 16px;
      }
      .analytics-sidebar-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .analytics-sidebar-scroll::-webkit-scrollbar-thumb {
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
        min-height: 40px;
        border: 1px solid transparent;
        border-radius: 10px;
        background: transparent;
        color: var(--txt1);
        padding: 0 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
      }
      .analytics-nav-trigger:hover {
        background: var(--card-soft);
      }
      .analytics-nav-trigger.active {
        background: var(--blue-l);
        color: var(--blue);
        border-color: var(--blue-b);
      }
      .analytics-nav-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .analytics-nav-arrow {
        flex-shrink: 0;
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
        padding-left: 12px;
        transition: max-height .2s ease, opacity .18s ease, margin .18s ease;
        opacity: 0;
        margin-top: 0;
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
        background: transparent;
        color: var(--txt2);
        text-decoration: none;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
      }
      .analytics-nav-item:hover {
        background: var(--card-soft);
        color: var(--txt1);
      }
      .analytics-nav-item.active {
        background: var(--blue-l);
        color: var(--blue);
        font-weight: 600;
      }
      .analytics-content {
        min-width: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
      .topbar {
        height: 56px;
        padding: 0 22px;
        background: var(--card);
        border-bottom: 1px solid var(--bdr);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-shrink: 0;
      }
      .topbar-left {
        display: grid;
        gap: 1px;
      }
      .topbar-title {
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .topbar-sub {
        font-size: 11px;
        color: var(--txt3);
      }
      .topbar-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .range-tabs {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 3px;
        background: var(--page-bg);
        border: 1px solid var(--bdr);
        border-radius: 8px;
      }
      .range-tab,
      .site-select,
      .refresh-btn {
        font: inherit;
      }
      .range-tab {
        min-height: 30px;
        padding: 0 11px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--txt2);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color .14s ease, color .14s ease;
      }
      .range-tab.active {
        background: var(--card);
        color: var(--txt1);
        box-shadow: var(--shadow-sm);
        font-weight: 600;
      }
      .site-select {
        min-width: 170px;
        height: 34px;
        padding: 0 12px;
        border: 1px solid var(--bdr-strong);
        border-radius: 8px;
        background: var(--card);
        color: var(--txt1);
        outline: none;
        box-shadow: var(--shadow-sm);
        cursor: pointer;
      }
      .refresh-btn {
        height: 34px;
        padding: 0 14px;
        border: 0;
        border-radius: 8px;
        background: var(--blue);
        color: #fff;
        font-size: 12px;
        font-weight: 600;
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
      .refresh-btn:hover {
        background: #2f4ac0;
      }
      .analytics-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 20px 22px 24px;
      }
      .analytics-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .analytics-scroll::-webkit-scrollbar-thumb {
        background: var(--bdr-strong);
        border-radius: 999px;
      }
      .analytics-grid {
        display: grid;
        gap: 14px;
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }
      .charts-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 14px;
        align-items: start;
      }
      .tables-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 14px;
      }
      .insights-grid {
        display: grid;
        grid-template-columns: 340px minmax(0, 1fr);
        gap: 14px;
        align-items: start;
      }
      .card,
      .metric-card {
        background: var(--card);
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
        min-height: 124px;
      }
      .metric-kicker {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        min-height: 22px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .metric-card.blue .metric-kicker {
        background: var(--blue-l);
        color: var(--blue);
      }
      .metric-card.green .metric-kicker {
        background: var(--green-l);
        color: var(--green);
      }
      .metric-card.amber .metric-kicker {
        background: var(--amber-l);
        color: var(--amber);
      }
      .metric-card.purple .metric-kicker {
        background: var(--purple-l);
        color: var(--purple);
      }
      .metric-value {
        font-size: 28px;
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.04em;
      }
      .metric-label {
        font-size: 12px;
        color: var(--txt2);
      }
      .metric-meta {
        font-size: 11px;
        color: var(--txt3);
      }
      .metric-bar {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
      }
      .metric-card.blue .metric-bar {
        background: linear-gradient(90deg, var(--blue-b), var(--blue));
      }
      .metric-card.green .metric-bar {
        background: linear-gradient(90deg, #b2f2bb, var(--green));
      }
      .metric-card.amber .metric-bar {
        background: linear-gradient(90deg, #ffe066, var(--amber));
      }
      .metric-card.purple .metric-bar {
        background: linear-gradient(90deg, #d0bfff, var(--purple));
      }
      .card-head {
        padding: 14px 18px 0;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .card-title {
        display: grid;
        gap: 3px;
      }
      .card-title h2,
      .card-title h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .card-title p {
        margin: 0;
        font-size: 12px;
        color: var(--txt3);
      }
      .card-meta {
        font-size: 11px;
        color: var(--txt3);
        white-space: nowrap;
      }
      .card-body {
        padding: 14px 18px 18px;
      }
      .line-shell {
        border: 1px solid var(--bdr);
        border-radius: 12px;
        background: linear-gradient(180deg, #fbfdff 0%, #f7f9fd 100%);
        padding: 14px;
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
      }
      .donut-card {
        display: grid;
        min-height: 100%;
      }
      .donut-shell {
        display: grid;
        gap: 16px;
      }
      .donut-visual {
        height: 176px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .donut-ring {
        width: 168px;
        height: 168px;
        border-radius: 50%;
        background: conic-gradient(var(--blue) 0deg, var(--blue) 0deg, #edf1f7 0deg);
        position: relative;
      }
      .donut-ring::after {
        content: '';
        position: absolute;
        inset: 24px;
        border-radius: 50%;
        background: var(--card);
        border: 1px solid var(--bdr);
      }
      .donut-center {
        position: absolute;
        text-align: center;
        display: grid;
        gap: 3px;
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
        font-weight: 600;
      }
      .loading-block,
      .empty,
      .error {
        border: 1px dashed var(--bdr-strong);
        border-radius: 12px;
        background: var(--card-soft);
        padding: 18px;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: var(--txt3);
        font-size: 13px;
      }
      .error {
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
      .funnel-list,
      .topic-list,
      .uploads-list {
        display: grid;
        gap: 10px;
      }
      .funnel-item,
      .topic-item,
      .upload-item {
        display: grid;
        gap: 7px;
      }
      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .row strong {
        font-size: 13px;
        font-weight: 600;
      }
      .row span {
        font-size: 11px;
        color: var(--txt3);
      }
      .progress {
        height: 8px;
        border-radius: 999px;
        overflow: hidden;
        background: #edf1f7;
      }
      .progress > span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #6c8fff, var(--blue));
      }
      .topic-item .progress > span {
        background: linear-gradient(90deg, #8a6eff, var(--purple));
      }
      .upload-item .progress > span {
        background: linear-gradient(90deg, #ffcc74, var(--amber));
      }
      .table-card {
        overflow: hidden;
      }
      .table-head {
        padding: 14px 18px;
        border-bottom: 1px solid var(--bdr);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .table-count {
        min-height: 24px;
        padding: 0 8px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--page-bg);
        border: 1px solid var(--bdr);
        font-size: 11px;
        color: var(--txt3);
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
      }
      .data-table th,
      .data-table td {
        padding: 11px 18px;
        border-bottom: 1px solid #f1f0f4;
        text-align: left;
        vertical-align: middle;
      }
      .data-table th {
        padding-top: 8px;
        padding-bottom: 8px;
        background: #fafafa;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: var(--txt3);
      }
      .data-table td {
        font-size: 13px;
      }
      .data-table tr:last-child td {
        border-bottom: 0;
      }
      .rank {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--page-bg);
        border: 1px solid var(--bdr);
        color: var(--txt3);
        font-size: 10px;
        font-weight: 700;
      }
      .rank.top {
        background: var(--blue-l);
        border-color: var(--blue-b);
        color: var(--blue);
      }
      .intent-badge {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
      }
      .intent-badge.up {
        background: var(--green-l);
        color: var(--green);
      }
      .intent-badge.down {
        background: var(--red-l);
        color: var(--red);
      }
      .intent-badge.neutral {
        background: var(--page-bg);
        border: 1px solid var(--bdr);
        color: var(--txt3);
      }
      .operator-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 14px;
      }
      .summary-card {
        border: 1px solid var(--bdr);
        border-radius: 12px;
        background: var(--card-soft);
        padding: 14px;
        display: grid;
        gap: 6px;
        min-height: 96px;
      }
      .summary-card strong {
        font-size: 12px;
        color: var(--txt2);
      }
      .summary-card span {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.04em;
      }
      .operator-table {
        width: 100%;
        border-collapse: collapse;
      }
      .operator-table th,
      .operator-table td {
        padding: 12px 12px;
        border-bottom: 1px solid #f1f0f4;
        text-align: left;
        vertical-align: middle;
      }
      .operator-table th {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: var(--txt3);
        background: #fafafa;
      }
      .operator-table tr:last-child td {
        border-bottom: 0;
      }
      .operator-cell {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .operator-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--page-bg);
        border: 1px solid var(--bdr);
        color: #42506b;
        font-size: 11px;
        font-weight: 700;
      }
      .operator-meta {
        display: grid;
        gap: 2px;
      }
      .operator-meta strong {
        font-size: 13px;
      }
      .operator-meta span {
        font-size: 11px;
        color: var(--txt3);
      }
      .metric-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 26px;
        padding: 0 9px;
        border-radius: 999px;
        background: var(--page-bg);
        border: 1px solid var(--bdr);
        font-size: 12px;
        font-weight: 600;
      }
      .muted-code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 12px;
        color: var(--txt2);
      }
      @media (max-width: 1200px) {
        .metrics-grid,
        .operator-summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .charts-grid,
        .tables-grid,
        .insights-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 900px) {
        .analytics-shell {
          grid-template-columns: 1fr;
        }
        .analytics-sidebar {
          display: none;
        }
        .topbar {
          height: auto;
          padding: 14px 18px;
          align-items: flex-start;
          flex-direction: column;
        }
        .topbar-right {
          width: 100%;
          justify-content: flex-start;
        }
        .analytics-scroll {
          padding: 16px 18px 20px;
        }
        .metrics-grid,
        .operator-summary-grid {
          grid-template-columns: 1fr;
        }
        .site-select {
          min-width: 0;
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

          <div class="analytics-content">
            <header class="topbar">
              <div class="topbar-left">
                <div class="topbar-title" id="topbarTitle">Analytics</div>
                <div class="topbar-sub" id="updatedAt">Updated: loading…</div>
              </div>
              <div class="topbar-right">
                <div class="range-tabs" id="periodFilter">
                  <button type="button" class="range-tab" data-period="24h">Last 24h</button>
                  <button type="button" class="range-tab" data-period="7d">7 days</button>
                  <button type="button" class="range-tab active" data-period="30d">30 days</button>
                  <button type="button" class="range-tab" data-period="60d">60 days</button>
                  <button type="button" class="range-tab" data-period="90d">90 days</button>
                </div>
                <select id="siteSelect" class="site-select" aria-label="Select site">
                  <option value="">All sites</option>
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

            <div class="analytics-scroll">
              <div class="analytics-grid">
                <section id="metricsGrid" class="metrics-grid"></section>

                <div class="charts-grid">
                  <section class="card">
                    <div class="card-head">
                      <div class="card-title">
                        <h2>Conversations over time</h2>
                        <p id="dailyChartPeriodLabel">Last 30 days</p>
                      </div>
                      <span class="card-meta" id="dailyChartPeriodMeta">Last 30 days</span>
                    </div>
                    <div class="card-body">
                      <div id="dailyChartShell" class="line-shell"></div>
                    </div>
                  </section>

                  <section class="card donut-card">
                    <div class="card-head">
                      <div class="card-title">
                        <h2>Customer feedback</h2>
                        <p id="feedbackPeriodLabel">Last 30 days</p>
                      </div>
                      <span class="card-meta">Distribution</span>
                    </div>
                    <div class="card-body">
                      <div id="feedbackDonutShell" class="donut-shell"></div>
                    </div>
                  </section>
                </div>

                <div class="tables-grid">
                  <section class="card table-card">
                    <div class="table-head">
                      <div class="card-title">
                        <h3>Top user intents</h3>
                        <p id="topicsPeriodLabel">Last 30 days</p>
                      </div>
                      <span class="table-count" id="intentsCount">0 intents</span>
                    </div>
                    <div id="topicsTableShell"></div>
                  </section>

                  <section class="card table-card">
                    <div class="table-head">
                      <div class="card-title">
                        <h3>File uploads</h3>
                        <p id="uploadsPeriodLabel">Last 30 days</p>
                      </div>
                      <span class="table-count" id="uploadsCount">0 files</span>
                    </div>
                    <div class="card-body">
                      <div id="uploadsGrid" class="uploads-list"></div>
                    </div>
                  </section>
                </div>

                <div class="insights-grid">
                  <section class="card">
                    <div class="card-head">
                      <div class="card-title">
                        <h2>Conversation funnel</h2>
                        <p id="funnelPeriodLabel">Last 30 days</p>
                      </div>
                      <span class="card-meta" id="funnelPeriodMeta">Last 30 days</span>
                    </div>
                    <div class="card-body">
                      <div id="funnelList" class="funnel-list"></div>
                    </div>
                  </section>

                  <section class="card">
                    <div class="card-head">
                      <div class="card-title">
                        <h2>Operator performance</h2>
                        <p id="operatorPeriodLabel">Last 30 days</p>
                      </div>
                    </div>
                    <div class="card-body">
                      <div id="performanceGrid" class="operator-summary-grid"></div>
                      <div id="operatorTableShell"></div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    scripts: `<script>
      (function () {
        const metricsGrid = document.getElementById('metricsGrid');
        const dailyChartShell = document.getElementById('dailyChartShell');
        const funnelList = document.getElementById('funnelList');
        const uploadsGrid = document.getElementById('uploadsGrid');
        const feedbackDonutShell = document.getElementById('feedbackDonutShell');
        const performanceGrid = document.getElementById('performanceGrid');
        const operatorTableShell = document.getElementById('operatorTableShell');
        const topicsTableShell = document.getElementById('topicsTableShell');
        const updatedAt = document.getElementById('updatedAt');
        const periodFilter = document.getElementById('periodFilter');
        const siteSelect = document.getElementById('siteSelect');
        const refreshBtn = document.getElementById('refreshBtn');
        const dailyChartPeriodLabel = document.getElementById('dailyChartPeriodLabel');
        const dailyChartPeriodMeta = document.getElementById('dailyChartPeriodMeta');
        const funnelPeriodLabel = document.getElementById('funnelPeriodLabel');
        const funnelPeriodMeta = document.getElementById('funnelPeriodMeta');
        const operatorPeriodLabel = document.getElementById('operatorPeriodLabel');
        const topicsPeriodLabel = document.getElementById('topicsPeriodLabel');
        const feedbackPeriodLabel = document.getElementById('feedbackPeriodLabel');
        const uploadsPeriodLabel = document.getElementById('uploadsPeriodLabel');
        const intentsCount = document.getElementById('intentsCount');
        const uploadsCount = document.getElementById('uploadsCount');
        const analyticsNav = document.getElementById('analyticsNav');
        const topbarTitle = document.getElementById('topbarTitle');
        const NAV_STORAGE_KEY = 'chat-platform-analytics-nav-open';
        const state = {
          period: new URLSearchParams(window.location.search).get('period') || '30d',
          siteId: new URLSearchParams(window.location.search).get('siteId') || '',
          loading: false,
          sitesLoaded: false,
          navPath: parseAnalyticsPath(window.location.pathname),
          navOpen: readNavOpenState()
        };

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

        function parseAnalyticsPath(pathname) {
          const clean = String(pathname || '/analytics').replace(/^\\/+|\\/+$/g, '');
          const parts = clean.split('/');
          if (parts[0] !== 'analytics') {
            return { section: 'chats', item: 'overview' };
          }
          const section = parts[1] || 'chats';
          const item = parts[2] || 'overview';
          return { section: section, item: item };
        }

        function getActiveNavMeta() {
          const sectionNode = analyticsNav && analyticsNav.querySelector('[data-analytics-section="' + state.navPath.section + '"]');
          const trigger = sectionNode && sectionNode.querySelector('[data-analytics-trigger]');
          const itemNode = analyticsNav && analyticsNav.querySelector('[data-analytics-nav-item="' + state.navPath.section + '/' + state.navPath.item + '"]');
          return {
            sectionLabel: trigger ? trigger.textContent.trim() : 'Analytics',
            itemLabel: itemNode ? itemNode.textContent.trim() : 'Overview'
          };
        }

        function renderAnalyticsNav() {
          if (!analyticsNav) return;
          Array.from(analyticsNav.querySelectorAll('.analytics-nav-section')).forEach(function (sectionNode) {
            const sectionKey = String(sectionNode.getAttribute('data-analytics-section') || '').trim();
            const shouldOpen = state.navOpen[sectionKey] !== false || sectionKey === state.navPath.section;
            sectionNode.classList.toggle('open', shouldOpen);
            const trigger = sectionNode.querySelector('[data-analytics-trigger]');
            if (trigger) {
              trigger.classList.toggle('active', sectionKey === state.navPath.section);
            }
          });
          Array.from(analyticsNav.querySelectorAll('.analytics-nav-item')).forEach(function (itemNode) {
            const key = String(itemNode.getAttribute('data-analytics-nav-item') || '').trim();
            itemNode.classList.toggle('active', key === (state.navPath.section + '/' + state.navPath.item));
          });
          const meta = getActiveNavMeta();
          topbarTitle.textContent = meta.sectionLabel + ' / ' + meta.itemLabel;
        }

        function escapeHtml(value) {
          return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function formatPercent(value) {
          return Number(value || 0).toFixed(1) + '%';
        }

        function formatNumber(value) {
          return new Intl.NumberFormat('uk-UA').format(Number(value || 0));
        }

        function formatDuration(seconds) {
          const total = Math.max(0, Math.round(Number(seconds || 0)));
          const hours = Math.floor(total / 3600);
          const minutes = Math.floor((total % 3600) / 60);
          if (hours > 0) return hours + 'h ' + minutes + 'm';
          if (minutes > 0) return minutes + 'm';
          return total + 's';
        }

        function getInitials(value) {
          const words = String(value || '').trim().split(/\\s+/).filter(Boolean);
          if (!words.length) return 'OP';
          if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
          return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
        }

        function setPeriodLabel(label) {
          const safe = label || 'Last 30 days';
          dailyChartPeriodLabel.textContent = safe;
          dailyChartPeriodMeta.textContent = safe;
          funnelPeriodLabel.textContent = safe;
          funnelPeriodMeta.textContent = safe;
          operatorPeriodLabel.textContent = safe;
          topicsPeriodLabel.textContent = safe;
          feedbackPeriodLabel.textContent = safe;
          uploadsPeriodLabel.textContent = safe;
        }

        function syncControls() {
          Array.from(periodFilter.querySelectorAll('[data-period]')).forEach(function (button) {
            button.classList.toggle('active', button.getAttribute('data-period') === state.period);
          });
          siteSelect.value = state.siteId;
        }

        function updateUrlState() {
          const params = new URLSearchParams(window.location.search);
          params.set('period', state.period);
          if (state.siteId) {
            params.set('siteId', state.siteId);
          } else {
            params.delete('siteId');
          }
          const pathname = '/analytics/' + encodeURIComponent(state.navPath.section) + '/' + encodeURIComponent(state.navPath.item);
          window.history.replaceState({}, '', pathname + '?' + params.toString());
        }

        function pushUrlState() {
          const params = new URLSearchParams(window.location.search);
          params.set('period', state.period);
          if (state.siteId) {
            params.set('siteId', state.siteId);
          } else {
            params.delete('siteId');
          }
          const pathname = '/analytics/' + encodeURIComponent(state.navPath.section) + '/' + encodeURIComponent(state.navPath.item);
          window.history.pushState({}, '', pathname + '?' + params.toString());
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
            siteSelect.innerHTML =
              '<option value="">All sites</option>' +
              sites.map(function (site) {
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
          metricsGrid.innerHTML = Array(4).fill('<div class="metric-card"><div class="loading-block"><div class="spinner"></div></div><div class="metric-bar"></div></div>').join('');
          dailyChartShell.innerHTML = '<div class="loading-block"><div class="spinner"></div></div>';
          feedbackDonutShell.innerHTML = '<div class="loading-block"><div class="spinner"></div></div>';
          topicsTableShell.innerHTML = '<div class="loading-block"><div class="spinner"></div></div>';
          uploadsGrid.innerHTML = '<div class="loading-block"><div class="spinner"></div></div>';
          funnelList.innerHTML = '<div class="loading-block"><div class="spinner"></div></div>';
          performanceGrid.innerHTML = '<div class="loading-block"><div class="spinner"></div></div>';
          operatorTableShell.innerHTML = '';
          intentsCount.textContent = 'Loading…';
          uploadsCount.textContent = 'Loading…';
        }

        function renderMetrics(metrics) {
          const cards = [
            {
              tone: 'blue',
              kicker: 'Visitors',
              value: formatNumber(metrics.visitorsToday),
              label: 'Visitors today',
              meta: 'Унікальні visitorId за сьогодні'
            },
            {
              tone: 'green',
              kicker: 'Chats',
              value: formatNumber(metrics.chatsStartedToday),
              label: 'Chats started',
              meta: 'Нові діалоги за сьогодні'
            },
            {
              tone: 'amber',
              kicker: 'Contacts',
              value: formatNumber(metrics.contactsCollectedToday),
              label: 'Contacts collected',
              meta: 'Нові контакти за сьогодні'
            },
            {
              tone: 'purple',
              kicker: 'Conversion',
              value: formatPercent(metrics.conversionRate),
              label: 'Conversion rate',
              meta: 'Contacts / chats started today'
            }
          ];

          metricsGrid.innerHTML = cards.map(function (card) {
            return '<article class="metric-card ' + escapeHtml(card.tone) + '">' +
              '<span class="metric-kicker">' + escapeHtml(card.kicker) + '</span>' +
              '<div class="metric-value">' + escapeHtml(card.value) + '</div>' +
              '<div class="metric-label">' + escapeHtml(card.label) + '</div>' +
              '<div class="metric-meta">' + escapeHtml(card.meta) + '</div>' +
              '<div class="metric-bar"></div>' +
            '</article>';
          }).join('');
        }

        function renderDailyChart(items) {
          if (!items.length) {
            dailyChartShell.innerHTML = '<div class="empty">Ще немає даних для графіка.</div>';
            return;
          }
          const width = 760;
          const height = 260;
          const max = Math.max.apply(null, items.map(function (item) { return Number(item.count || 0); }).concat([1]));
          const stepX = items.length > 1 ? (width - 40) / (items.length - 1) : 0;
          const points = items.map(function (item, index) {
            const x = 20 + (stepX * index);
            const y = height - 20 - ((Number(item.count || 0) / max) * (height - 60));
            return { x: x, y: y, label: item.label };
          });
          const polyline = points.map(function (point) {
            return point.x.toFixed(1) + ',' + point.y.toFixed(1);
          }).join(' ');
          const fillPath = 'M ' + points.map(function (point) {
            return point.x.toFixed(1) + ' ' + point.y.toFixed(1);
          }).join(' L ') + ' L ' + points[points.length - 1].x.toFixed(1) + ' ' + (height - 20) + ' L ' + points[0].x.toFixed(1) + ' ' + (height - 20) + ' Z';
          const circles = points.map(function (point) {
            return '<circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="3.5" fill="#fff" stroke="#3b5bdb" stroke-width="2"></circle>';
          }).join('');
          const gridLines = [0, 0.25, 0.5, 0.75, 1].map(function (ratio) {
            const y = 20 + ((height - 40) * ratio);
            return '<line x1="20" y1="' + y.toFixed(1) + '" x2="' + (width - 20) + '" y2="' + y.toFixed(1) + '" stroke="#ececf2" stroke-width="1"></line>';
          }).join('');

          dailyChartShell.innerHTML =
            '<svg class="line-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Conversations over time">' +
              gridLines +
              '<path d="' + fillPath + '" fill="rgba(59,91,219,.08)"></path>' +
              '<polyline fill="none" stroke="#3b5bdb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="' + polyline + '"></polyline>' +
              circles +
            '</svg>' +
            '<div class="line-chart-labels">' + items.map(function (item) {
              return '<span>' + escapeHtml(item.label) + '</span>';
            }).join('') + '</div>';
        }

        function renderFeedbackDonut(feedback) {
          const total = Number(feedback.total || 0);
          if (!total) {
            feedbackDonutShell.innerHTML = '<div class="empty">Ще немає оцінок від клієнтів.</div>';
            return;
          }
          const luxPercent = Number(feedback.luxPercent || 0);
          const normalPercent = Number(feedback.normalPercent || 0);
          const badPercent = Number(feedback.badPercent || 0);
          const luxEnd = (luxPercent / 100) * 360;
          const normalEnd = luxEnd + ((normalPercent / 100) * 360);
          const gradient = 'conic-gradient(#3b5bdb 0deg ' + luxEnd.toFixed(2) + 'deg, #f59f00 ' + luxEnd.toFixed(2) + 'deg ' + normalEnd.toFixed(2) + 'deg, #e03131 ' + normalEnd.toFixed(2) + 'deg 360deg)';

          feedbackDonutShell.innerHTML =
            '<div class="donut-visual">' +
              '<div class="donut-ring" style="background:' + gradient + ';"></div>' +
              '<div class="donut-center"><strong>' + escapeHtml(formatNumber(total)) + '</strong><span>Total ratings</span></div>' +
            '</div>' +
            '<div class="donut-legend">' +
              '<div class="legend-row"><span class="legend-label"><span class="legend-dot" style="background:#3b5bdb;"></span>Lux</span><span class="legend-value">' + escapeHtml(formatPercent(luxPercent)) + '</span></div>' +
              '<div class="legend-row"><span class="legend-label"><span class="legend-dot" style="background:#f59f00;"></span>Normal</span><span class="legend-value">' + escapeHtml(formatPercent(normalPercent)) + '</span></div>' +
              '<div class="legend-row"><span class="legend-label"><span class="legend-dot" style="background:#e03131;"></span>Bad</span><span class="legend-value">' + escapeHtml(formatPercent(badPercent)) + '</span></div>' +
            '</div>';
        }

        function renderFunnel(items) {
          if (!items.length) {
            funnelList.innerHTML = '<div class="empty">Ще немає даних для funnel.</div>';
            return;
          }
          const max = Math.max.apply(null, items.map(function (item) { return Number(item.value || 0); }).concat([1]));
          funnelList.innerHTML = items.map(function (item) {
            const ratio = (Number(item.value || 0) / max) * 100;
            return '<div class="funnel-item">' +
              '<div class="row"><strong>' + escapeHtml(item.label) + '</strong><span>' + escapeHtml(formatNumber(item.value)) + '</span></div>' +
              '<div class="progress"><span style="width:' + ratio.toFixed(2) + '%"></span></div>' +
            '</div>';
          }).join('');
        }

        function renderTopicsTable(items) {
          intentsCount.textContent = formatNumber(items.length) + ' intents';
          if (!items.length) {
            topicsTableShell.innerHTML = '<div class="card-body"><div class="empty">Немає достатньо visitor повідомлень для keyword-аналізу.</div></div>';
            return;
          }
          const trendMap = {
            up: { className: 'up', label: 'Growing', arrow: '↑' },
            down: { className: 'down', label: 'Falling', arrow: '↓' },
            neutral: { className: 'neutral', label: 'Stable', arrow: '→' }
          };
          topicsTableShell.innerHTML =
            '<table class="data-table">' +
              '<thead><tr><th>#</th><th>Intent</th><th>Count</th><th>Trend</th></tr></thead>' +
              '<tbody>' + items.map(function (item, index) {
                const count = Number(item.count || 0);
                const trend = count >= 5 ? trendMap.up : trendMap.neutral;
                return '<tr>' +
                  '<td><span class="rank' + (index < 3 ? ' top' : '') + '">' + (index + 1) + '</span></td>' +
                  '<td>' + escapeHtml(item.label) + '</td>' +
                  '<td><strong>' + escapeHtml(formatNumber(count)) + '</strong></td>' +
                  '<td><span class="intent-badge ' + escapeHtml(trend.className) + '">' + escapeHtml(trend.arrow + ' ' + trend.label) + '</span></td>' +
                '</tr>';
              }).join('') + '</tbody>' +
            '</table>';
        }

        function renderUploads(items) {
          const total = items.reduce(function (sum, item) {
            return sum + Number(item.count || 0);
          }, 0);
          uploadsCount.textContent = formatNumber(total) + ' files';
          if (!items.length) {
            uploadsGrid.innerHTML = '<div class="empty">Немає завантажень файлів.</div>';
            return;
          }
          const max = Math.max.apply(null, items.map(function (item) { return Number(item.count || 0); }).concat([1]));
          uploadsGrid.innerHTML = items.map(function (item) {
            const ratio = (Number(item.count || 0) / max) * 100;
            return '<div class="upload-item">' +
              '<div class="row"><strong>' + escapeHtml(item.label) + '</strong><span>' + escapeHtml(formatNumber(item.count)) + '</span></div>' +
              '<div class="progress"><span style="width:' + ratio.toFixed(2) + '%"></span></div>' +
            '</div>';
          }).join('');
        }

        function renderPerformance(performance) {
          const summary = performance && performance.summary ? performance.summary : performance || {};
          const rows = performance && Array.isArray(performance.rows) ? performance.rows : [];
          const totals = rows.reduce(function (accumulator, item) {
            accumulator.assigned += Number(item.assignedChatsCount || 0);
            accumulator.replies += Number(item.humanRepliesCount || 0);
            accumulator.messages += Number(item.messagesSentCount || 0);
            return accumulator;
          }, { assigned: 0, replies: 0, messages: 0 });

          performanceGrid.innerHTML =
            '<div class="summary-card"><strong>Avg response</strong><span>' + escapeHtml(formatDuration(summary.averageResponseTimeSeconds)) + '</span></div>' +
            '<div class="summary-card"><strong>Measured replies</strong><span>' + escapeHtml(formatNumber(summary.measuredReplies)) + '</span></div>' +
            '<div class="summary-card"><strong>Active operators</strong><span>' + escapeHtml(formatNumber(rows.length)) + '</span></div>' +
            '<div class="summary-card"><strong>Assigned chats</strong><span>' + escapeHtml(formatNumber(totals.assigned)) + '</span></div>';

          if (!rows.length) {
            operatorTableShell.innerHTML = '<div class="empty">Ще немає достатньо операторських даних.</div>';
            return;
          }

          operatorTableShell.innerHTML =
            '<table class="operator-table">' +
              '<thead><tr><th>Operator</th><th>Assigned</th><th>Replies</th><th>Closed</th><th>Messages</th><th>Avg first response</th></tr></thead>' +
              '<tbody>' + rows.map(function (item) {
                return '<tr>' +
                  '<td><div class="operator-cell"><span class="operator-avatar">' + escapeHtml(getInitials(item.operator)) + '</span><div class="operator-meta"><strong>' + escapeHtml(item.operator || '—') + '</strong><span>operator</span></div></div></td>' +
                  '<td><span class="metric-pill">' + escapeHtml(formatNumber(item.assignedChatsCount)) + '</span></td>' +
                  '<td><span class="metric-pill">' + escapeHtml(formatNumber(item.humanRepliesCount)) + '</span></td>' +
                  '<td><span class="metric-pill">' + escapeHtml(formatNumber(item.closedChatsCount)) + '</span></td>' +
                  '<td><span class="metric-pill">' + escapeHtml(formatNumber(item.messagesSentCount)) + '</span></td>' +
                  '<td><strong>' + escapeHtml(formatDuration(item.averageFirstResponseTimeSeconds)) + '</strong></td>' +
                '</tr>';
              }).join('') + '</tbody>' +
            '</table>';
        }

        async function loadAnalytics() {
          if (state.loading) return;
          state.loading = true;
          renderAnalyticsNav();
          renderLoading();
          try {
            syncControls();
            updateUrlState();
            await ensureSitesLoaded();
            const params = new URLSearchParams();
            params.set('period', state.period);
            if (state.siteId) params.set('siteId', state.siteId);
            const response = await fetch('/api/admin/analytics?' + params.toString());
            const payload = await response.json();
            if (!response.ok || !payload.ok) {
              throw new Error(payload.message || 'Failed to load analytics');
            }
            renderMetrics(payload.metrics || {});
            renderDailyChart(payload.dailyChats || []);
            renderFeedbackDonut(payload.feedback || {});
            renderTopicsTable(payload.topTopics || []);
            renderUploads(payload.fileUploads || []);
            renderFunnel(payload.funnel || []);
            renderPerformance(payload.operatorPerformance || {});
            setPeriodLabel(payload.period && payload.period.label ? payload.period.label : 'Last 30 days');
            updatedAt.textContent = 'Updated: ' + escapeHtml(payload.generatedAt || '');
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load analytics';
            metricsGrid.innerHTML = '<div class="error">Failed to load analytics. ' + escapeHtml(message) + '</div>';
            dailyChartShell.innerHTML = '<div class="error">Failed to load analytics.</div>';
            feedbackDonutShell.innerHTML = '<div class="error">Failed to load analytics.</div>';
            topicsTableShell.innerHTML = '<div class="error">Failed to load analytics.</div>';
            uploadsGrid.innerHTML = '<div class="error">Failed to load analytics.</div>';
            funnelList.innerHTML = '<div class="error">Failed to load analytics.</div>';
            performanceGrid.innerHTML = '<div class="error">Failed to load analytics.</div>';
            operatorTableShell.innerHTML = '<div class="error">Failed to load analytics.</div>';
            updatedAt.textContent = 'Load error';
            intentsCount.textContent = '—';
            uploadsCount.textContent = '—';
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
          loadAnalytics().catch(console.error);
        });

        siteSelect.addEventListener('change', function () {
          state.siteId = String(siteSelect.value || '').trim();
          loadAnalytics().catch(console.error);
        });

        refreshBtn.addEventListener('click', function () {
          loadAnalytics().catch(console.error);
        });

        if (analyticsNav) analyticsNav.addEventListener('click', function (event) {
          const trigger = event.target.closest('[data-analytics-trigger]');
          if (trigger) {
            const sectionKey = String(trigger.getAttribute('data-analytics-trigger') || '').trim();
            if (!sectionKey) return;
            const isOpen = state.navOpen[sectionKey] !== false;
            state.navOpen[sectionKey] = !isOpen;
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
          renderAnalyticsNav();
          pushUrlState();
          loadAnalytics().catch(console.error);
        });

        window.addEventListener('popstate', function () {
          state.navPath = parseAnalyticsPath(window.location.pathname);
          state.period = new URLSearchParams(window.location.search).get('period') || '30d';
          state.siteId = new URLSearchParams(window.location.search).get('siteId') || '';
          renderAnalyticsNav();
          syncControls();
          loadAnalytics().catch(console.error);
        });

        renderAnalyticsNav();
        loadAnalytics();
      })();
    </script>`
  });
}

module.exports = {
  renderAnalyticsPage
};
