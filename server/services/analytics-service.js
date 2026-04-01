function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function parseSqliteDate(value) {
  const clean = String(value || '').trim();
  if (!clean) return null;
  const parsed = new Date(clean.replace(' ', 'T') + 'Z');
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeQuestionMessage(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildTopQuestionAnalytics(messageRows, limit = 10) {
  const rules = [
    { label: 'Скільки коштує друк?', pattern: /(ціна|скільки|кошту|варт|price|cost|прорах|estimate)/i },
    { label: 'Які терміни виготовлення?', pattern: /(термін|час|скільки.*час|how long|lead time|коли буде готово)/i },
    { label: 'Чи є доставка?', pattern: /(доставк|нова пошта|nova poshta|shipping|ship|pickup)/i },
    { label: 'Який матеріал?', pattern: /(матеріал|pla|petg|abs|nylon|resin)/i },
    { label: 'Який розмір можна надрукувати?', pattern: /(розмір|габарит|dimension|size|мм|cm|см)/i },
    { label: 'Який файл потрібен?', pattern: /(stl|obj|3mf|file|файл|модель|upload|attach)/i },
    { label: 'Чи можете змоделювати?', pattern: /(моделюван|дизайн|design|3d model|сконструю)/i },
    { label: 'Чи можна терміново?', pattern: /(терміново|urgent|сьогодні|today|asap)/i },
    { label: 'Чи можна зв’язатись з менеджером?', pattern: /(менеджер|оператор|human|manager|зв.?язат)/i }
  ];

  const grouped = new Map();
  for (const row of messageRows) {
    const conversationId = String(row.conversation_id || '').trim();
    const rawText = String(row.message_text || '').trim();
    if (!conversationId || !rawText) continue;
    const text = normalizeQuestionMessage(rawText);
    if (!text) continue;

    let label = '';
    for (const rule of rules) {
      if (rule.pattern.test(text)) {
        label = rule.label;
        break;
      }
    }

    if (!label) {
      const words = text.split(' ').filter(Boolean).slice(0, 5);
      if (!words.length) continue;
      label = words.join(' ');
      if (!/[?؟]$/.test(label)) label += '?';
      label = label.charAt(0).toUpperCase() + label.slice(1);
    }

    if (!grouped.has(label)) {
      grouped.set(label, { question: label, count: 0, samples: [] });
    }
    const target = grouped.get(label);
    target.count += 1;
    if (target.samples.length < 3 && !target.samples.some((sample) => sample.conversationId === conversationId && sample.text === rawText)) {
      target.samples.push({ text: rawText, conversationId });
    }
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.count - left.count || left.question.localeCompare(right.question))
    .slice(0, Math.max(1, Math.min(Number(limit) || 10, 25)));
}

function parseAnalyticsPeriod(rawPeriod) {
  const normalized = String(rawPeriod || '30d').trim().toLowerCase();
  if (normalized === '24h') {
    return { key: '24h', rangeSql: "datetime('now', '-24 hours')", previousRangeSql: "datetime('now', '-48 hours')", chartDays: 2, chartMode: 'hourly', windowHours: 24, windowDays: 1, label: 'Last 24 hours', subtitle: 'За останні 24 години' };
  }
  if (normalized === '7d') {
    return { key: '7d', rangeSql: "datetime('now', '-7 days')", previousRangeSql: "datetime('now', '-14 days')", chartDays: 7, chartMode: 'daily', windowHours: 7 * 24, windowDays: 7, label: 'Last 7 days', subtitle: 'За останні 7 днів' };
  }
  const customMatch = normalized.match(/^(\d{1,3})d$/);
  if (customMatch) {
    const days = Math.max(1, Math.min(365, Number(customMatch[1]) || 30));
    return { key: `${days}d`, rangeSql: `datetime('now', '-${days} days')`, previousRangeSql: `datetime('now', '-${days * 2} days')`, chartDays: days, chartMode: 'daily', windowHours: days * 24, windowDays: days, label: `Last ${days} days`, subtitle: `За останні ${days} днів` };
  }
  return { key: '30d', rangeSql: "datetime('now', '-30 days')", previousRangeSql: "datetime('now', '-60 days')", chartDays: 30, chartMode: 'daily', windowHours: 30 * 24, windowDays: 30, label: 'Last 30 days', subtitle: 'За останні 30 днів' };
}

function toSqliteTimestamp(date) {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

function buildAnalyticsWindow(period, previous = false) {
  const endAt = new Date();
  const currentStartAt = new Date(endAt.getTime() - (period.windowHours * 60 * 60 * 1000));
  if (!previous) {
    return { startAt: currentStartAt, endAt, startSql: toSqliteTimestamp(currentStartAt), endSql: toSqliteTimestamp(endAt) };
  }
  const previousStartAt = new Date(currentStartAt.getTime() - (period.windowHours * 60 * 60 * 1000));
  return { startAt: previousStartAt, endAt: currentStartAt, startSql: toSqliteTimestamp(previousStartAt), endSql: toSqliteTimestamp(currentStartAt) };
}

function buildConversationWhere(options = {}) {
  const clauses = ['datetime(c.created_at) >= datetime(?)', 'datetime(c.created_at) < datetime(?)'];
  const params = [options.startSql, options.endSql];
  if (options.workspaceId) {
    clauses.push('c.workspace_id = ?');
    params.push(options.workspaceId);
  }
  if (options.siteId) {
    clauses.push('c.site_id = ?');
    params.push(options.siteId);
  }
  if (options.operator) {
    clauses.push('(c.assigned_operator = ? OR c.last_operator = ?)');
    params.push(options.operator, options.operator);
  }
  return { clauses, params };
}

function createAnalyticsService(options = {}) {
  const db = options.db;
  const contactService = options.contactService;
  const cacheTtlMs = Math.max(30000, Math.min(Number(options.cacheTtlMs) || 45000, 60000));
  const datasetCache = new Map();

  function buildDatasetCacheKey(period, datasetOptions, previous) {
    return JSON.stringify({
      period: period.key,
      workspaceId: String(datasetOptions.workspaceId || '').trim(),
      siteId: String(datasetOptions.siteId || '').trim(),
      operator: String(datasetOptions.operator || '').trim(),
      previous: Boolean(previous)
    });
  }

  function clearCache() {
    datasetCache.clear();
  }

  function readCachedDataset(cacheKey) {
    const entry = datasetCache.get(cacheKey);
    if (!entry) return null;
    if ((Date.now() - entry.createdAt) > cacheTtlMs) {
      datasetCache.delete(cacheKey);
      return null;
    }
    return entry.value;
  }

  function writeCachedDataset(cacheKey, dataset) {
    datasetCache.set(cacheKey, { createdAt: Date.now(), value: dataset });
    return dataset;
  }

  function loadAnalyticsDataset(period, options = {}, previous = false) {
    const window = buildAnalyticsWindow(period, previous);
    const workspaceId = String(options.workspaceId || '').trim();
    const siteId = String(options.siteId || '').trim();
    const operator = String(options.operator || '').trim();
    const cacheKey = buildDatasetCacheKey(period, { workspaceId, siteId, operator }, previous);
    const cached = readCachedDataset(cacheKey);
    if (cached) return cached;

    const conversationWhere = buildConversationWhere({ startSql: window.startSql, endSql: window.endSql, workspaceId, siteId, operator });
    const conversations = db.prepare(`
      SELECT c.*,
             (SELECT COUNT(*) FROM messages mm WHERE mm.conversation_id = c.conversation_id) AS message_count,
             (SELECT COUNT(*) FROM messages mm WHERE mm.conversation_id = c.conversation_id AND mm.sender_type = 'visitor') AS visitor_message_count,
             (SELECT COUNT(*) FROM messages mm WHERE mm.conversation_id = c.conversation_id AND mm.sender_type = 'operator') AS operator_message_count,
             (SELECT COUNT(*) FROM messages mm WHERE mm.conversation_id = c.conversation_id AND mm.sender_type IN ('ai', 'system')) AS ai_message_count,
             (SELECT MIN(mm.created_at) FROM messages mm WHERE mm.conversation_id = c.conversation_id AND mm.sender_type = 'visitor') AS first_visitor_message_at,
             (SELECT MIN(mm.created_at) FROM messages mm WHERE mm.conversation_id = c.conversation_id AND mm.sender_type = 'operator') AS first_operator_reply_at,
             (SELECT MIN(mm.created_at) FROM messages mm WHERE mm.conversation_id = c.conversation_id AND mm.sender_type IN ('ai', 'system')) AS first_ai_reply_at,
             (SELECT MAX(mm.created_at) FROM messages mm WHERE mm.conversation_id = c.conversation_id) AS last_message_actual_at
      FROM conversations c
      WHERE ${conversationWhere.clauses.join(' AND ')}
      ORDER BY datetime(c.created_at) DESC, c.id DESC
    `).all(...conversationWhere.params);

    const messageWhereClauses = ['datetime(m.created_at) >= datetime(?)', 'datetime(m.created_at) < datetime(?)'];
    const messageParams = [window.startSql, window.endSql];
    if (workspaceId) {
      messageWhereClauses.push('c.workspace_id = ?');
      messageParams.push(workspaceId);
    }
    if (siteId) {
      messageWhereClauses.push('c.site_id = ?');
      messageParams.push(siteId);
    }
    if (operator) {
      messageWhereClauses.push('(c.assigned_operator = ? OR c.last_operator = ? OR m.sender_name = ?)');
      messageParams.push(operator, operator, operator);
    }

    const messages = db.prepare(`
      SELECT m.*, c.site_id, c.source_page, c.channel AS conversation_channel, c.status AS conversation_status, c.assigned_operator, c.last_operator
      FROM messages m
      JOIN conversations c ON c.conversation_id = m.conversation_id
      WHERE ${messageWhereClauses.join(' AND ')}
      ORDER BY datetime(m.created_at) ASC, m.id ASC
    `).all(...messageParams);

    const events = db.prepare(`
      SELECT e.*, c.site_id, c.channel, c.assigned_operator, c.last_operator
      FROM conversation_events e
      JOIN conversations c ON c.conversation_id = e.conversation_id
      WHERE datetime(e.created_at) >= datetime(?)
        AND datetime(e.created_at) < datetime(?)
        ${workspaceId ? 'AND c.workspace_id = ?' : ''}
        ${siteId ? 'AND c.site_id = ?' : ''}
        ${operator ? 'AND (c.assigned_operator = ? OR c.last_operator = ?)' : ''}
      ORDER BY datetime(e.created_at) ASC, e.id ASC
    `).all(
      window.startSql,
      window.endSql,
      ...(workspaceId ? [workspaceId] : []),
      ...(siteId ? [siteId] : []),
      ...(operator ? [operator, operator] : [])
    ).map((row) => Object.assign({}, row, {
      payload: safeJsonParse(row.payload, {})
    }));

    const feedback = db.prepare(`
      SELECT f.*, c.site_id
      FROM conversation_feedback f
      JOIN conversations c ON c.conversation_id = f.conversation_id
      WHERE datetime(f.created_at) >= datetime(?)
        AND datetime(f.created_at) < datetime(?)
        ${workspaceId ? 'AND c.workspace_id = ?' : ''}
        ${siteId ? 'AND c.site_id = ?' : ''}
        ${operator ? 'AND (c.assigned_operator = ? OR c.last_operator = ?)' : ''}
      ORDER BY datetime(f.created_at) DESC
    `).all(
      window.startSql,
      window.endSql,
      ...(workspaceId ? [workspaceId] : []),
      ...(siteId ? [siteId] : []),
      ...(operator ? [operator, operator] : [])
    );

    const attachments = db.prepare(`
      SELECT a.*, m.conversation_id, m.sender_type, c.site_id, c.source_page
      FROM attachments a
      JOIN messages m ON m.id = a.message_id
      JOIN conversations c ON c.conversation_id = m.conversation_id
      WHERE datetime(a.created_at) >= datetime(?)
        AND datetime(a.created_at) < datetime(?)
        ${workspaceId ? 'AND c.workspace_id = ?' : ''}
        ${siteId ? 'AND c.site_id = ?' : ''}
        ${operator ? 'AND (c.assigned_operator = ? OR c.last_operator = ?)' : ''}
      ORDER BY datetime(a.created_at) DESC
    `).all(
      window.startSql,
      window.endSql,
      ...(workspaceId ? [workspaceId] : []),
      ...(siteId ? [siteId] : []),
      ...(operator ? [operator, operator] : [])
    );

    const contacts = contactService.listContacts({ workspaceId, siteId, limit: 10000 })
      .filter((contact) => {
        const createdAt = parseSqliteDate(contact.createdAt);
        return createdAt && createdAt >= window.startAt && createdAt < window.endAt;
      });

    return writeCachedDataset(cacheKey, {
      period,
      window,
      siteId,
      operator,
      conversations,
      messages,
      events,
      feedback,
      attachments,
      contacts
    });
  }

  return {
    parseAnalyticsPeriod,
    buildTopQuestionAnalytics,
    loadAnalyticsDataset,
    clearCache,
    getCacheTtlMs() {
      return cacheTtlMs;
    }
  };
}

module.exports = {
  createAnalyticsService,
  parseAnalyticsPeriod,
  buildTopQuestionAnalytics,
  parseSqliteDate
};
