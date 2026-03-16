const { renderAppLayout } = require('./app-layout');

function renderAnalyticsPage() {
  return renderAppLayout({
    title: 'Chat Analytics',
    activeNav: 'analytics',
    styles: `
      :root {
        color-scheme: light;
        --bg: #f4f6fb;
        --panel: #ffffff;
        --panel-soft: #f8faff;
        --panel-muted: #f7f9fc;
        --border: #dbe2f0;
        --text: #1b2437;
        --muted: #67718a;
        --muted-soft: #8b94aa;
        --accent: #1f6fff;
        --accent-soft: #e9f1ff;
        --accent-border: rgba(31, 111, 255, 0.18);
        --success: #1f9d61;
        --warning: #f59e0b;
        --danger: #e25563;
      }
      * { box-sizing: border-box; }
      body {
        font-family: Manrope, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
      }
      .page {
        max-width: 1400px;
        margin: 0 auto;
        padding: 24px;
        display: grid;
        gap: 16px;
      }
      .hero,
      .panel,
      .metric-card {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: 0 10px 30px rgba(26, 35, 57, 0.05);
      }
      .hero {
        padding: 16px;
      }
      .hero-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .hero-copy {
        display: grid;
        gap: 8px;
      }
      .hero-kicker {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        min-height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .hero h1 {
        margin: 0;
        font-size: 30px;
        letter-spacing: -0.03em;
      }
      .hero p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        max-width: 720px;
      }
      .hero-tools {
        display: grid;
        justify-items: end;
        gap: 10px;
      }
      .updated-at {
        color: var(--muted);
        font-size: 12px;
        white-space: nowrap;
      }
      .period-filter {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .period-chip,
      .period-select {
        min-height: 34px;
        padding: 0 12px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: #fff;
        color: var(--muted);
        font: inherit;
        font-size: 13px;
      }
      .period-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .period-chip.active,
      .period-select.active {
        border-color: var(--accent-border);
        background: var(--accent-soft);
        color: var(--accent);
        font-weight: 700;
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .metric-card {
        padding: 16px;
        min-height: 128px;
        display: grid;
        align-content: start;
      }
      .metric-card strong {
        display: block;
        color: var(--muted-soft);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .metric-card span {
        display: block;
        margin-top: 8px;
        font-size: 30px;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
      .metric-card small {
        display: block;
        margin-top: 6px;
        color: var(--muted);
        font-size: 12px;
      }
      .analytics-grid {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
        gap: 16px;
        align-items: start;
      }
      .panel {
        overflow: hidden;
      }
      .panel-head {
        padding: 16px 16px 0;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .panel-title {
        display: grid;
        gap: 4px;
      }
      .panel-head h2 {
        margin: 0;
        font-size: 18px;
        letter-spacing: -0.02em;
      }
      .panel-head p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
      }
      .period-label {
        color: var(--muted-soft);
        font-size: 12px;
        white-space: nowrap;
      }
      .panel-body {
        padding: 16px;
      }
      .chart-shell {
        background: linear-gradient(180deg, #fbfdff 0%, #f6f8fd 100%);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 16px;
        width: 100%;
      }
      .line-chart {
        width: 100%;
        height: 240px;
      }
      .line-chart-labels {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-top: 8px;
        color: var(--muted);
        font-size: 11px;
      }
      .stack {
        display: grid;
        gap: 16px;
      }
      .funnel-list,
      .topic-list,
      .feedback-list {
        display: grid;
        gap: 12px;
      }
      .funnel-item,
      .topic-item {
        display: grid;
        gap: 8px;
      }
      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .row strong {
        font-size: 14px;
      }
      .row span {
        color: var(--muted);
        font-size: 12px;
      }
      .progress {
        height: 10px;
        background: #edf2fa;
        border-radius: 999px;
        overflow: hidden;
      }
      .progress > span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #5b8cff, #86a6ff);
      }
      .topic-item .progress > span {
        background: linear-gradient(90deg, #f78c2f, #ffb86a);
      }
      .mini-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .operator-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }
      .mini-card {
        border: 1px solid var(--border);
        border-radius: 16px;
        background: var(--panel-soft);
        padding: 16px;
        min-height: 104px;
        display: grid;
        align-content: start;
      }
      .mini-card strong {
        display: block;
        color: var(--muted);
        font-size: 12px;
      }
      .mini-card span {
        display: block;
        margin-top: 8px;
        font-size: 24px;
        font-weight: 800;
      }
      .feedback-strip {
        display: flex;
        height: 14px;
        border-radius: 999px;
        overflow: hidden;
        background: #edf2fa;
        margin-bottom: 16px;
      }
      .feedback-strip span {
        display: block;
        height: 100%;
      }
      .feedback-strip .lux {
        background: var(--success);
      }
      .feedback-strip .normal {
        background: var(--warning);
      }
      .feedback-strip .bad {
        background: var(--danger);
      }
      .operator-table {
        width: 100%;
        border-collapse: collapse;
      }
      .operator-table th,
      .operator-table td {
        padding: 12px 10px;
        border-bottom: 1px solid #edf2fa;
        text-align: left;
        vertical-align: middle;
      }
      .operator-table th {
        color: var(--muted-soft);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .operator-table td {
        font-size: 13px;
      }
      .operator-cell {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .operator-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--panel-muted);
        border: 1px solid var(--border);
        color: #42506b;
        font-size: 12px;
        font-weight: 800;
      }
      .operator-meta {
        display: grid;
        gap: 2px;
      }
      .operator-meta strong {
        font-size: 13px;
      }
      .operator-meta span {
        color: var(--muted);
        font-size: 11px;
      }
      .operator-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        background: var(--panel-muted);
        border: 1px solid var(--border);
        color: var(--text);
        font-size: 12px;
        font-weight: 700;
      }
      .empty,
      .error {
        padding: 20px;
        text-align: center;
        color: var(--muted);
        border: 1px dashed var(--border);
        border-radius: 14px;
        background: var(--panel-soft);
      }
      .error {
        color: var(--danger);
      }
      @media (max-width: 1100px) {
        .analytics-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 960px) {
        .hero-head {
          flex-direction: column;
        }
        .hero-tools {
          width: 100%;
          justify-items: start;
        }
      }
    `,
    content: `
    <div class="page">
      <section class="hero">
        <div class="hero-head">
          <div class="hero-copy">
            <span class="hero-kicker">Analytics dashboard</span>
            <h1>Analytics</h1>
            <p>Бізнес-аналітика по чатах, лідах, файлах та роботі операторів.</p>
          </div>
          <div class="hero-tools">
            <div id="updatedAt" class="updated-at">Loading…</div>
            <div class="period-filter" id="periodFilter">
              <button type="button" class="period-chip" data-period="24h">Last 24h</button>
              <button type="button" class="period-chip" data-period="7d">7 days</button>
              <button type="button" class="period-chip active" data-period="30d">30 days</button>
              <select id="customPeriodSelect" class="period-select" aria-label="Custom period">
                <option value="">Custom</option>
                <option value="60d">60 days</option>
                <option value="90d">90 days</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section id="metricsGrid" class="metrics"></section>

      <div class="analytics-grid">
        <section class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h2>Chats per day</h2>
              <p id="dailyChartPeriodLabel">Last 30 days</p>
            </div>
            <span class="period-label" id="dailyChartPeriodMeta">Last 30 days</span>
          </div>
          <div class="panel-body">
            <div id="dailyChartShell" class="chart-shell"></div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h2>Conversation funnel</h2>
              <p id="funnelPeriodLabel">Last 30 days</p>
            </div>
            <span class="period-label" id="funnelPeriodMeta">Last 30 days</span>
          </div>
          <div class="panel-body">
            <div id="funnelList" class="funnel-list"></div>
          </div>
        </section>
      </div>

      <section class="panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Operator performance</h2>
            <p id="operatorPeriodLabel">Last 30 days</p>
          </div>
        </div>
        <div class="panel-body">
          <div id="performanceGrid" class="operator-summary-grid"></div>
          <div id="operatorTableShell"></div>
        </div>
      </section>

      <div class="analytics-grid">
        <div class="stack">
          <section class="panel">
            <div class="panel-head">
              <div class="panel-title">
                <h2>Top conversation topics</h2>
                <p id="topicsPeriodLabel">Last 30 days</p>
              </div>
            </div>
            <div class="panel-body">
              <div id="topicsList" class="topic-list"></div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div class="panel-title">
                <h2>Customer feedback</h2>
                <p id="feedbackPeriodLabel">Last 30 days</p>
              </div>
            </div>
            <div class="panel-body">
              <div id="feedbackBlock" class="feedback-list"></div>
            </div>
          </section>
        </div>

        <section class="panel">
          <div class="panel-head">
            <div class="panel-title">
              <h2>File uploads</h2>
              <p id="uploadsPeriodLabel">Last 30 days</p>
            </div>
          </div>
          <div class="panel-body">
            <div id="uploadsGrid" class="mini-grid"></div>
          </div>
        </section>
      </div>
    </div>

    `,
    scripts: `<script>
      (function () {
        const metricsGrid = document.getElementById('metricsGrid');
        const dailyChartShell = document.getElementById('dailyChartShell');
        const funnelList = document.getElementById('funnelList');
        const topicsList = document.getElementById('topicsList');
        const uploadsGrid = document.getElementById('uploadsGrid');
        const feedbackBlock = document.getElementById('feedbackBlock');
        const performanceGrid = document.getElementById('performanceGrid');
        const operatorTableShell = document.getElementById('operatorTableShell');
        const updatedAt = document.getElementById('updatedAt');
        const periodFilter = document.getElementById('periodFilter');
        const customPeriodSelect = document.getElementById('customPeriodSelect');
        const dailyChartPeriodLabel = document.getElementById('dailyChartPeriodLabel');
        const dailyChartPeriodMeta = document.getElementById('dailyChartPeriodMeta');
        const funnelPeriodLabel = document.getElementById('funnelPeriodLabel');
        const funnelPeriodMeta = document.getElementById('funnelPeriodMeta');
        const operatorPeriodLabel = document.getElementById('operatorPeriodLabel');
        const topicsPeriodLabel = document.getElementById('topicsPeriodLabel');
        const feedbackPeriodLabel = document.getElementById('feedbackPeriodLabel');
        const uploadsPeriodLabel = document.getElementById('uploadsPeriodLabel');
        const state = {
          period: new URLSearchParams(window.location.search).get('period') || '30d',
          loading: false
        };

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

        function syncPeriodControls() {
          Array.from(periodFilter.querySelectorAll('[data-period]')).forEach(function (button) {
            button.classList.toggle('active', button.getAttribute('data-period') === state.period);
          });
          const isCustom = ['24h', '7d', '30d'].indexOf(state.period) === -1;
          customPeriodSelect.classList.toggle('active', isCustom);
          customPeriodSelect.value = isCustom ? state.period : '';
        }

        function updateUrlPeriod() {
          const params = new URLSearchParams(window.location.search);
          params.set('period', state.period);
          window.history.replaceState({}, '', window.location.pathname + '?' + params.toString());
        }

        function renderMetrics(metrics) {
          metricsGrid.innerHTML = [
            { label: 'Visitors today', value: formatNumber(metrics.visitorsToday), hint: 'Унікальні visitorId за сьогодні' },
            { label: 'Chats started', value: formatNumber(metrics.chatsStartedToday), hint: 'Нові діалоги за сьогодні' },
            { label: 'Contacts collected', value: formatNumber(metrics.contactsCollectedToday), hint: 'Нові контакти за сьогодні' },
            { label: 'Conversion rate', value: formatPercent(metrics.conversionRate), hint: 'Contacts / chats started today' }
          ].map(function (item) {
            return '<div class="metric-card"><strong>' + escapeHtml(item.label) + '</strong><span>' + escapeHtml(item.value) + '</span><small>' + escapeHtml(item.hint) + '</small></div>';
          }).join('');
        }

        function renderDailyChart(items) {
          if (!items.length) {
            dailyChartShell.innerHTML = '<div class="empty">Ще немає даних для графіка.</div>';
            return;
          }
          const width = 760;
          const height = 280;
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
          const circles = points.map(function (point) {
            return '<circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="4" fill="#1f6fff"></circle>';
          }).join('');

          dailyChartShell.innerHTML =
            '<svg class="line-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Chats per day">' +
              '<polyline fill="none" stroke="#1f6fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="' + polyline + '"></polyline>' +
              circles +
            '</svg>' +
            '<div class="line-chart-labels">' + items.map(function (item) {
              return '<span>' + escapeHtml(item.label) + '</span>';
            }).join('') + '</div>';
        }

        function renderFunnel(items) {
          const max = Math.max.apply(null, items.map(function (item) { return Number(item.value || 0); }).concat([1]));
          funnelList.innerHTML = items.map(function (item) {
            const ratio = (Number(item.value || 0) / max) * 100;
            return '<div class="funnel-item">' +
              '<div class="row"><strong>' + escapeHtml(item.label) + '</strong><span>' + escapeHtml(formatNumber(item.value)) + '</span></div>' +
              '<div class="progress"><span style="width:' + ratio.toFixed(2) + '%"></span></div>' +
            '</div>';
          }).join('');
        }

        function renderTopics(items) {
          if (!items.length) {
            topicsList.innerHTML = '<div class="empty">Немає достатньо visitor повідомлень для keyword-аналізу.</div>';
            return;
          }
          const max = Math.max.apply(null, items.map(function (item) { return Number(item.count || 0); }).concat([1]));
          topicsList.innerHTML = items.map(function (item) {
            const ratio = (Number(item.count || 0) / max) * 100;
            return '<div class="topic-item">' +
              '<div class="row"><strong>' + escapeHtml(item.label) + '</strong><span>' + escapeHtml(formatNumber(item.count)) + '</span></div>' +
              '<div class="progress"><span style="width:' + ratio.toFixed(2) + '%"></span></div>' +
            '</div>';
          }).join('');
        }

        function renderUploads(items) {
          uploadsGrid.innerHTML = items.map(function (item) {
            return '<div class="mini-card"><strong>' + escapeHtml(item.label) + '</strong><span>' + escapeHtml(formatNumber(item.count)) + '</span></div>';
          }).join('');
        }

        function renderFeedback(feedback) {
          const total = Number(feedback.total || 0);
          if (!total) {
            feedbackBlock.innerHTML = '<div class="empty">Ще немає оцінок від клієнтів.</div>';
            return;
          }
          feedbackBlock.innerHTML =
            '<div class="feedback-strip">' +
              '<span class="lux" style="width:' + feedback.luxPercent.toFixed(2) + '%"></span>' +
              '<span class="normal" style="width:' + feedback.normalPercent.toFixed(2) + '%"></span>' +
              '<span class="bad" style="width:' + feedback.badPercent.toFixed(2) + '%"></span>' +
            '</div>' +
            '<div class="mini-grid">' +
              '<div class="mini-card"><strong>Lux</strong><span>' + escapeHtml(formatPercent(feedback.luxPercent)) + '</span></div>' +
              '<div class="mini-card"><strong>Normal</strong><span>' + escapeHtml(formatPercent(feedback.normalPercent)) + '</span></div>' +
              '<div class="mini-card"><strong>Bad</strong><span>' + escapeHtml(formatPercent(feedback.badPercent)) + '</span></div>' +
              '<div class="mini-card"><strong>Total</strong><span>' + escapeHtml(formatNumber(total)) + '</span></div>' +
            '</div>';
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
            '<div class="mini-card"><strong>Avg response</strong><span>' + escapeHtml(formatDuration(summary.averageResponseTimeSeconds)) + '</span></div>' +
            '<div class="mini-card"><strong>Measured replies</strong><span>' + escapeHtml(formatNumber(summary.measuredReplies)) + '</span></div>' +
            '<div class="mini-card"><strong>Active operators</strong><span>' + escapeHtml(formatNumber(rows.length)) + '</span></div>' +
            '<div class="mini-card"><strong>Assigned chats</strong><span>' + escapeHtml(formatNumber(totals.assigned)) + '</span></div>';

          if (!rows.length) {
            operatorTableShell.innerHTML = '<div class="empty">Ще немає достатньо операторських даних.</div>';
            return;
          }

          operatorTableShell.innerHTML =
            '<table class="operator-table">' +
              '<thead><tr><th>Operator</th><th>Assigned chats</th><th>Human replies</th><th>Closed chats</th><th>Messages sent</th><th>Avg first response</th></tr></thead>' +
              '<tbody>' + rows.map(function (item) {
                return '<tr>' +
                  '<td><div class="operator-cell"><span class="operator-avatar">' + escapeHtml(getInitials(item.operator)) + '</span><div class="operator-meta"><strong>' + escapeHtml(item.operator || '—') + '</strong><span>operator</span></div></div></td>' +
                  '<td><span class="operator-chip">' + escapeHtml(formatNumber(item.assignedChatsCount)) + '</span></td>' +
                  '<td><span class="operator-chip">' + escapeHtml(formatNumber(item.humanRepliesCount)) + '</span></td>' +
                  '<td><span class="operator-chip">' + escapeHtml(formatNumber(item.closedChatsCount)) + '</span></td>' +
                  '<td><span class="operator-chip">' + escapeHtml(formatNumber(item.messagesSentCount)) + '</span></td>' +
                  '<td><strong>' + escapeHtml(formatDuration(item.averageFirstResponseTimeSeconds)) + '</strong></td>' +
                '</tr>';
              }).join('') + '</tbody>' +
            '</table>';
        }

        async function loadAnalytics() {
          if (state.loading) return;
          state.loading = true;
          try {
            syncPeriodControls();
            updateUrlPeriod();
            const response = await fetch('/api/admin/analytics?period=' + encodeURIComponent(state.period));
            const payload = await response.json();
            if (!response.ok || !payload.ok) {
              throw new Error(payload.message || 'Failed to load analytics');
            }
            renderMetrics(payload.metrics || {});
            renderDailyChart(payload.dailyChats || []);
            renderFunnel(payload.funnel || []);
            renderTopics(payload.topTopics || []);
            renderUploads(payload.fileUploads || []);
            renderFeedback(payload.feedback || {});
            renderPerformance(payload.operatorPerformance || {});
            setPeriodLabel(payload.period && payload.period.label ? payload.period.label : 'Last 30 days');
            updatedAt.textContent = 'Updated: ' + escapeHtml(payload.generatedAt || '');
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load analytics';
            metricsGrid.innerHTML = '<div class="error">Failed to load analytics. ' + escapeHtml(message) + '</div>';
            dailyChartShell.innerHTML = '<div class="error">Failed to load analytics.</div>';
            funnelList.innerHTML = '<div class="error">Failed to load analytics.</div>';
            topicsList.innerHTML = '<div class="error">Failed to load analytics.</div>';
            uploadsGrid.innerHTML = '<div class="error">Failed to load analytics.</div>';
            feedbackBlock.innerHTML = '<div class="error">Failed to load analytics.</div>';
            performanceGrid.innerHTML = '<div class="error">Failed to load analytics.</div>';
            operatorTableShell.innerHTML = '<div class="error">Failed to load analytics.</div>';
            updatedAt.textContent = 'Load error';
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

        customPeriodSelect.addEventListener('change', function () {
          const period = String(customPeriodSelect.value || '').trim();
          if (!period || period === state.period) return;
          state.period = period;
          loadAnalytics().catch(console.error);
        });

        loadAnalytics();
      })();
    </script>`
  });
}

module.exports = {
  renderAnalyticsPage
};
