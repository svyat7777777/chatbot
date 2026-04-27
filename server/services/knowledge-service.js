const crypto = require('crypto');
const { createPrefixedId } = require('../utils/id');
const { DEFAULT_WORKSPACE_ID, DEFAULT_SITE_ID } = require('../db/database');

const MANUAL_PRIORITIES = ['normal', 'high', 'always_use'];
const IMPORT_SOURCE_TYPES = ['website', 'document'];
const IMPORT_FREQUENCIES = ['manual', 'daily', 'weekly', 'monthly'];
const IMPORT_STATUSES = ['pending', 'running', 'completed', 'failed'];

function sanitizeText(value, maxLength = 4000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function nowSql() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function normalizePriority(value) {
  const clean = sanitizeText(value, 40).toLowerCase();
  return MANUAL_PRIORITIES.includes(clean) ? clean : 'normal';
}

function normalizeSourceType(value) {
  const clean = sanitizeText(value, 40).toLowerCase();
  return IMPORT_SOURCE_TYPES.includes(clean) ? clean : 'website';
}

function normalizeFrequency(value) {
  const clean = sanitizeText(value, 40).toLowerCase();
  return IMPORT_FREQUENCIES.includes(clean) ? clean : 'manual';
}

function normalizeStatus(value) {
  const clean = sanitizeText(value, 40).toLowerCase();
  return IMPORT_STATUSES.includes(clean) ? clean : 'pending';
}

function normalizeSiteId(siteId) {
  return sanitizeText(siteId, 120) || DEFAULT_SITE_ID;
}

function normalizeWorkspaceId(workspaceId) {
  return sanitizeText(workspaceId, 120) || DEFAULT_WORKSPACE_ID;
}

function normalizeUrl(value) {
  const clean = sanitizeText(value, 2000);
  if (!clean) return '';
  try {
    const parsed = new URL(clean);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    parsed.hash = '';
    return parsed.toString();
  } catch (error) {
    return '';
  }
}

function stripHtmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50000);
}

function extractHtmlTitle(html, fallbackUrl = '') {
  const titleMatch = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = sanitizeText(titleMatch && titleMatch[1], 240);
  if (title) return title;
  if (!fallbackUrl) return '';
  try {
    const url = new URL(fallbackUrl);
    return sanitizeText(url.hostname + url.pathname, 240);
  } catch (error) {
    return sanitizeText(fallbackUrl, 240);
  }
}

function extractInternalLinks(html, currentUrl, maxCount = 50) {
  const links = [];
  const seen = new Set();
  const current = (() => {
    try {
      return new URL(currentUrl);
    } catch (error) {
      return null;
    }
  })();
  if (!current) return links;
  const pattern = /<a[^>]+href=["']([^"']+)["']/gi;
  let match;
  while ((match = pattern.exec(String(html || ''))) && links.length < maxCount) {
    const rawHref = sanitizeText(match[1], 2000);
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) continue;
    let resolved;
    try {
      resolved = new URL(rawHref, current.toString());
    } catch (error) {
      continue;
    }
    if (!['http:', 'https:'].includes(resolved.protocol)) continue;
    if (resolved.origin !== current.origin) continue;
    resolved.hash = '';
    const normalized = resolved.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    links.push(normalized);
  }
  return links;
}

function computeContentHash(text) {
  return crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex');
}

class KnowledgeService {
  constructor(options = {}) {
    this.db = options.db;
    this.workspaceService = options.workspaceService;
    this.statements = {
      listManualEntries: this.db.prepare(`
        SELECT id, workspace_id, site_id, title, category, content, priority, is_enabled, created_at, updated_at
        FROM knowledge_manual
        WHERE workspace_id = @workspace_id
          AND site_id = @site_id
          AND (
            @query = ''
            OR lower(title) LIKE '%' || @query || '%'
            OR lower(category) LIKE '%' || @query || '%'
            OR lower(content) LIKE '%' || @query || '%'
          )
          AND (
            @category = ''
            OR lower(category) = @category
          )
        ORDER BY
          CASE priority
            WHEN 'always_use' THEN 1
            WHEN 'high' THEN 2
            ELSE 3
          END,
          is_enabled DESC,
          datetime(updated_at) DESC,
          title COLLATE NOCASE ASC
      `),
      getManualEntryById: this.db.prepare(`
        SELECT id, workspace_id, site_id, title, category, content, priority, is_enabled, created_at, updated_at
        FROM knowledge_manual
        WHERE id = ? AND workspace_id = ? AND site_id = ?
        LIMIT 1
      `),
      insertManualEntry: this.db.prepare(`
        INSERT INTO knowledge_manual (
          id, workspace_id, site_id, title, category, content, priority, is_enabled, created_at, updated_at
        ) VALUES (
          @id, @workspace_id, @site_id, @title, @category, @content, @priority, @is_enabled, @created_at, @updated_at
        )
      `),
      updateManualEntry: this.db.prepare(`
        UPDATE knowledge_manual
        SET title = @title,
            category = @category,
            content = @content,
            priority = @priority,
            is_enabled = @is_enabled,
            updated_at = @updated_at
        WHERE id = @id AND workspace_id = @workspace_id AND site_id = @site_id
      `),
      deleteManualEntry: this.db.prepare(`
        DELETE FROM knowledge_manual
        WHERE id = ? AND workspace_id = ? AND site_id = ?
      `),
      listImportSources: this.db.prepare(`
        SELECT s.id, s.workspace_id, s.site_id, s.name, s.source_type, s.starting_url, s.frequency,
               s.max_pages, s.crawl_depth, s.status, s.last_run_at, s.last_error, s.created_at, s.updated_at,
               COUNT(i.id) AS imported_page_count
        FROM knowledge_import_sources s
        LEFT JOIN knowledge_import_items i ON i.source_id = s.id
        WHERE s.workspace_id = @workspace_id
          AND s.site_id = @site_id
        GROUP BY s.id
        ORDER BY datetime(s.updated_at) DESC, s.name COLLATE NOCASE ASC
      `),
      getImportSourceById: this.db.prepare(`
        SELECT id, workspace_id, site_id, name, source_type, starting_url, frequency,
               max_pages, crawl_depth, status, last_run_at, last_error, created_at, updated_at
        FROM knowledge_import_sources
        WHERE id = ? AND workspace_id = ? AND site_id = ?
        LIMIT 1
      `),
      insertImportSource: this.db.prepare(`
        INSERT INTO knowledge_import_sources (
          id, workspace_id, site_id, name, source_type, starting_url, frequency,
          max_pages, crawl_depth, status, last_run_at, last_error, created_at, updated_at
        ) VALUES (
          @id, @workspace_id, @site_id, @name, @source_type, @starting_url, @frequency,
          @max_pages, @crawl_depth, @status, @last_run_at, @last_error, @created_at, @updated_at
        )
      `),
      updateImportSource: this.db.prepare(`
        UPDATE knowledge_import_sources
        SET name = @name,
            source_type = @source_type,
            starting_url = @starting_url,
            frequency = @frequency,
            max_pages = @max_pages,
            crawl_depth = @crawl_depth,
            status = @status,
            last_run_at = @last_run_at,
            last_error = @last_error,
            updated_at = @updated_at
        WHERE id = @id AND workspace_id = @workspace_id AND site_id = @site_id
      `),
      deleteImportSource: this.db.prepare(`
        DELETE FROM knowledge_import_sources
        WHERE id = ? AND workspace_id = ? AND site_id = ?
      `),
      clearImportItemsBySource: this.db.prepare(`
        DELETE FROM knowledge_import_items
        WHERE source_id = ? AND workspace_id = ? AND site_id = ?
      `),
      insertImportItem: this.db.prepare(`
        INSERT INTO knowledge_import_items (
          id, source_id, workspace_id, site_id, title, url, content, content_hash, imported_at
        ) VALUES (
          @id, @source_id, @workspace_id, @site_id, @title, @url, @content, @content_hash, @imported_at
        )
      `),
      listImportItemsBySource: this.db.prepare(`
        SELECT id, source_id, workspace_id, site_id, title, url, content, content_hash, imported_at
        FROM knowledge_import_items
        WHERE source_id = ? AND workspace_id = ? AND site_id = ?
        ORDER BY datetime(imported_at) DESC, title COLLATE NOCASE ASC
      `)
    };
  }

  ensureSiteScope(workspaceId, siteId) {
    const cleanWorkspaceId = normalizeWorkspaceId(workspaceId);
    const cleanSiteId = normalizeSiteId(siteId);
    const site = this.workspaceService.getSiteByIdWithinWorkspace(cleanSiteId, cleanWorkspaceId);
    if (!site) return null;
    return { workspaceId: cleanWorkspaceId, siteId: cleanSiteId, site };
  }

  normalizeManualEntry(row) {
    if (!row) return null;
    return {
      id: sanitizeText(row.id, 120),
      workspaceId: normalizeWorkspaceId(row.workspace_id),
      siteId: normalizeSiteId(row.site_id),
      title: sanitizeText(row.title, 240),
      category: sanitizeText(row.category, 120),
      content: sanitizeText(row.content, 50000),
      priority: normalizePriority(row.priority),
      isEnabled: Number(row.is_enabled) === 1,
      createdAt: sanitizeText(row.created_at, 40),
      updatedAt: sanitizeText(row.updated_at, 40)
    };
  }

  normalizeImportSource(row) {
    if (!row) return null;
    return {
      id: sanitizeText(row.id, 120),
      workspaceId: normalizeWorkspaceId(row.workspace_id),
      siteId: normalizeSiteId(row.site_id),
      name: sanitizeText(row.name, 240),
      sourceType: normalizeSourceType(row.source_type),
      startingUrl: sanitizeText(row.starting_url, 2000),
      frequency: normalizeFrequency(row.frequency),
      maxPages: Math.max(1, Number(row.max_pages) || 10),
      crawlDepth: Math.max(0, Number(row.crawl_depth) || 1),
      status: normalizeStatus(row.status),
      lastRunAt: sanitizeText(row.last_run_at, 40),
      lastError: sanitizeText(row.last_error, 2000),
      importedPageCount: Number(row.imported_page_count || 0),
      createdAt: sanitizeText(row.created_at, 40),
      updatedAt: sanitizeText(row.updated_at, 40)
    };
  }

  normalizeImportItem(row) {
    if (!row) return null;
    return {
      id: sanitizeText(row.id, 120),
      sourceId: sanitizeText(row.source_id, 120),
      workspaceId: normalizeWorkspaceId(row.workspace_id),
      siteId: normalizeSiteId(row.site_id),
      title: sanitizeText(row.title, 240),
      url: sanitizeText(row.url, 2000),
      content: sanitizeText(row.content, 50000),
      contentHash: sanitizeText(row.content_hash, 128),
      importedAt: sanitizeText(row.imported_at, 40)
    };
  }

  listManualEntries(options = {}) {
    const scope = this.ensureSiteScope(options.workspaceId, options.siteId);
    if (!scope) return [];
    return this.statements.listManualEntries.all({
      workspace_id: scope.workspaceId,
      site_id: scope.siteId,
      query: sanitizeText(options.query, 200).toLowerCase(),
      category: sanitizeText(options.category, 120).toLowerCase()
    }).map((row) => this.normalizeManualEntry(row));
  }

  createManualEntry(workspaceId, siteId, input = {}) {
    const scope = this.ensureSiteScope(workspaceId, siteId);
    if (!scope) return null;
    const title = sanitizeText(input.title, 240);
    const content = sanitizeText(input.content, 50000);
    if (!title || !content) {
      const error = new Error('INVALID_MANUAL_ENTRY');
      error.code = 'INVALID_MANUAL_ENTRY';
      throw error;
    }
    const now = nowSql();
    const row = {
      id: createPrefixedId('knowledge'),
      workspace_id: scope.workspaceId,
      site_id: scope.siteId,
      title,
      category: sanitizeText(input.category, 120),
      content,
      priority: normalizePriority(input.priority),
      is_enabled: input.isEnabled === false ? 0 : 1,
      created_at: now,
      updated_at: now
    };
    this.statements.insertManualEntry.run(row);
    return this.normalizeManualEntry(row);
  }

  updateManualEntry(workspaceId, siteId, entryId, input = {}) {
    const scope = this.ensureSiteScope(workspaceId, siteId);
    if (!scope) return null;
    const existing = this.statements.getManualEntryById.get(sanitizeText(entryId, 120), scope.workspaceId, scope.siteId);
    if (!existing) return null;
    const next = {
      id: sanitizeText(entryId, 120),
      workspace_id: scope.workspaceId,
      site_id: scope.siteId,
      title: sanitizeText(input.title != null ? input.title : existing.title, 240),
      category: sanitizeText(input.category != null ? input.category : existing.category, 120),
      content: sanitizeText(input.content != null ? input.content : existing.content, 50000),
      priority: normalizePriority(input.priority != null ? input.priority : existing.priority),
      is_enabled: input.isEnabled === undefined ? Number(existing.is_enabled) : (input.isEnabled === false ? 0 : 1),
      updated_at: nowSql()
    };
    if (!next.title || !next.content) {
      const error = new Error('INVALID_MANUAL_ENTRY');
      error.code = 'INVALID_MANUAL_ENTRY';
      throw error;
    }
    this.statements.updateManualEntry.run(next);
    return this.normalizeManualEntry(Object.assign({}, existing, next));
  }

  deleteManualEntry(workspaceId, siteId, entryId) {
    const scope = this.ensureSiteScope(workspaceId, siteId);
    if (!scope) return false;
    const result = this.statements.deleteManualEntry.run(sanitizeText(entryId, 120), scope.workspaceId, scope.siteId);
    return result.changes > 0;
  }

  listImportSources(workspaceId, siteId) {
    const scope = this.ensureSiteScope(workspaceId, siteId);
    if (!scope) return [];
    return this.statements.listImportSources.all({
      workspace_id: scope.workspaceId,
      site_id: scope.siteId
    }).map((row) => this.normalizeImportSource(row));
  }

  listImportItems(workspaceId, siteId, sourceId) {
    const scope = this.ensureSiteScope(workspaceId, siteId);
    if (!scope) return [];
    return this.statements.listImportItemsBySource
      .all(sanitizeText(sourceId, 120), scope.workspaceId, scope.siteId)
      .map((row) => this.normalizeImportItem(row));
  }

  createImportSource(workspaceId, siteId, input = {}) {
    const scope = this.ensureSiteScope(workspaceId, siteId);
    if (!scope) return null;
    const name = sanitizeText(input.name, 240);
    const sourceType = normalizeSourceType(input.sourceType);
    const startingUrl = normalizeUrl(input.startingUrl);
    if (!name || !startingUrl) {
      const error = new Error('INVALID_IMPORT_SOURCE');
      error.code = 'INVALID_IMPORT_SOURCE';
      throw error;
    }
    const now = nowSql();
    const row = {
      id: createPrefixedId('ksource'),
      workspace_id: scope.workspaceId,
      site_id: scope.siteId,
      name,
      source_type: sourceType,
      starting_url: startingUrl,
      frequency: normalizeFrequency(input.frequency),
      max_pages: Math.min(100, Math.max(1, Number(input.maxPages) || 10)),
      crawl_depth: Math.min(4, Math.max(0, Number(input.crawlDepth) || 1)),
      status: 'pending',
      last_run_at: null,
      last_error: '',
      created_at: now,
      updated_at: now
    };
    this.statements.insertImportSource.run(row);
    return this.normalizeImportSource(Object.assign({}, row, { imported_page_count: 0 }));
  }

  deleteImportSource(workspaceId, siteId, sourceId) {
    const scope = this.ensureSiteScope(workspaceId, siteId);
    if (!scope) return false;
    const result = this.statements.deleteImportSource.run(sanitizeText(sourceId, 120), scope.workspaceId, scope.siteId);
    return result.changes > 0;
  }

  updateImportSourceStatus(workspaceId, siteId, sourceId, status, extra = {}) {
    const scope = this.ensureSiteScope(workspaceId, siteId);
    if (!scope) return null;
    const existing = this.statements.getImportSourceById.get(sanitizeText(sourceId, 120), scope.workspaceId, scope.siteId);
    if (!existing) return null;
    const next = {
      id: sanitizeText(sourceId, 120),
      workspace_id: scope.workspaceId,
      site_id: scope.siteId,
      name: sanitizeText(extra.name != null ? extra.name : existing.name, 240),
      source_type: normalizeSourceType(extra.sourceType != null ? extra.sourceType : existing.source_type),
      starting_url: normalizeUrl(extra.startingUrl != null ? extra.startingUrl : existing.starting_url),
      frequency: normalizeFrequency(extra.frequency != null ? extra.frequency : existing.frequency),
      max_pages: Math.min(100, Math.max(1, Number(extra.maxPages != null ? extra.maxPages : existing.max_pages) || 10)),
      crawl_depth: Math.min(4, Math.max(0, Number(extra.crawlDepth != null ? extra.crawlDepth : existing.crawl_depth) || 1)),
      status: normalizeStatus(status != null ? status : existing.status),
      last_run_at: extra.lastRunAt === undefined ? existing.last_run_at : (sanitizeText(extra.lastRunAt, 40) || null),
      last_error: sanitizeText(extra.lastError === undefined ? existing.last_error : extra.lastError, 2000),
      updated_at: nowSql()
    };
    this.statements.updateImportSource.run(next);
    return this.normalizeImportSource(Object.assign({}, existing, next, {
      imported_page_count: this.listImportItems(scope.workspaceId, scope.siteId, sourceId).length
    }));
  }

  async fetchImportPage(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'VerbbotKnowledgeBot/1.0 (+https://verbbot.com)'
        }
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const contentType = sanitizeText(response.headers.get('content-type'), 160).toLowerCase();
      const body = await response.text();
      return { contentType, body };
    } finally {
      clearTimeout(timeout);
    }
  }

  async importWebsiteSource(source) {
    const startUrl = normalizeUrl(source.startingUrl);
    if (!startUrl) {
      throw new Error('Starting URL is invalid.');
    }
    const queue = [{ url: startUrl, depth: 0 }];
    const visited = new Set();
    const items = [];

    while (queue.length && items.length < source.maxPages) {
      const current = queue.shift();
      if (!current || visited.has(current.url)) continue;
      visited.add(current.url);

      const page = await this.fetchImportPage(current.url);
      const isHtml = page.contentType.includes('text/html');
      const isTextLike = isHtml || page.contentType.includes('text/plain') || page.contentType.includes('application/json') || page.contentType.includes('application/xml') || page.contentType.includes('text/xml');
      if (!isTextLike) {
        if (items.length === 0) {
          throw new Error(`Unsupported content type for import: ${page.contentType || 'unknown'}`);
        }
        continue;
      }

      const content = isHtml ? stripHtmlToText(page.body) : sanitizeText(page.body, 50000);
      if (!content) continue;
      items.push({
        title: isHtml ? extractHtmlTitle(page.body, current.url) : current.url,
        url: current.url,
        content,
        contentHash: computeContentHash(content)
      });

      if (!isHtml || current.depth >= source.crawlDepth || items.length >= source.maxPages) {
        continue;
      }

      extractInternalLinks(page.body, current.url).forEach((nextUrl) => {
        if (visited.has(nextUrl)) return;
        if (queue.some((entry) => entry.url === nextUrl)) return;
        if (queue.length + items.length >= source.maxPages * 3) return;
        queue.push({ url: nextUrl, depth: current.depth + 1 });
      });
    }

    if (!items.length) {
      throw new Error('No importable pages were found from this source.');
    }

    return items;
  }

  async runImportSource(workspaceId, siteId, sourceId) {
    const scope = this.ensureSiteScope(workspaceId, siteId);
    if (!scope) return null;
    const source = this.normalizeImportSource(
      this.statements.getImportSourceById.get(sanitizeText(sourceId, 120), scope.workspaceId, scope.siteId)
    );
    if (!source) return null;

    this.updateImportSourceStatus(scope.workspaceId, scope.siteId, source.id, 'running', {
      lastError: ''
    });

    try {
      let items = [];
      if (source.sourceType === 'website') {
        items = await this.importWebsiteSource(source);
      } else {
        throw new Error('Document import is not implemented yet. Source was created, but runs are currently supported only for website imports.');
      }

      const importedAt = nowSql();
      const transaction = this.db.transaction(() => {
        this.statements.clearImportItemsBySource.run(source.id, scope.workspaceId, scope.siteId);
        items.forEach((item) => {
          this.statements.insertImportItem.run({
            id: createPrefixedId('kitem'),
            source_id: source.id,
            workspace_id: scope.workspaceId,
            site_id: scope.siteId,
            title: sanitizeText(item.title, 240),
            url: normalizeUrl(item.url),
            content: sanitizeText(item.content, 50000),
            content_hash: sanitizeText(item.contentHash, 128),
            imported_at: importedAt
          });
        });
      });
      transaction();
      this.updateImportSourceStatus(scope.workspaceId, scope.siteId, source.id, 'completed', {
        lastRunAt: importedAt,
        lastError: ''
      });
      return this.listImportSources(scope.workspaceId, scope.siteId).find((entry) => entry.id === source.id) || null;
    } catch (error) {
      this.updateImportSourceStatus(scope.workspaceId, scope.siteId, source.id, 'failed', {
        lastRunAt: nowSql(),
        lastError: error.message || 'Import failed.'
      });
      throw error;
    }
  }

  getKnowledgeContext(workspaceId, siteId, options = {}) {
    const manualEntries = this.listManualEntries({
      workspaceId,
      siteId,
      query: options.query || '',
      category: options.category || ''
    }).filter((entry) => entry.isEnabled);
    const importSources = this.listImportSources(workspaceId, siteId)
      .filter((source) => source.status === 'completed');
    const importedEntries = importSources.flatMap((source) => this.listImportItems(workspaceId, siteId, source.id).map((item) => ({
      sourceId: source.id,
      sourceName: source.name,
      title: item.title,
      url: item.url,
      content: item.content,
      importedAt: item.importedAt
    })));
    return {
      manual: manualEntries,
      imported: importedEntries
    };
  }
}

module.exports = {
  KnowledgeService,
  MANUAL_PRIORITIES,
  IMPORT_SOURCE_TYPES,
  IMPORT_FREQUENCIES,
  IMPORT_STATUSES
};
