const session = require('express-session');

function nowSql() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function toSqlDate(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? nowSql() : date.toISOString().replace('T', ' ').slice(0, 19);
}

class SqliteSessionStore extends session.Store {
  constructor(options = {}) {
    super();
    this.db = options.db;
    this.ttlMs = Number(options.ttlMs) || 1000 * 60 * 60 * 24 * 7;
    this.statements = {
      get: this.db.prepare(`
        SELECT sess, expires_at
        FROM auth_sessions
        WHERE sid = ?
        LIMIT 1
      `),
      set: this.db.prepare(`
        INSERT INTO auth_sessions (sid, sess, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(sid) DO UPDATE SET
          sess = excluded.sess,
          expires_at = excluded.expires_at,
          updated_at = excluded.updated_at
      `),
      destroy: this.db.prepare('DELETE FROM auth_sessions WHERE sid = ?'),
      touch: this.db.prepare(`
        UPDATE auth_sessions
        SET expires_at = ?, updated_at = ?
        WHERE sid = ?
      `),
      prune: this.db.prepare(`
        DELETE FROM auth_sessions
        WHERE datetime(expires_at) <= datetime('now')
      `)
    };
  }

  pruneExpiredSessions() {
    try {
      this.statements.prune.run();
    } catch (error) {
      this.emit('disconnect', error);
    }
  }

  get(sid, callback) {
    try {
      this.pruneExpiredSessions();
      const row = this.statements.get.get(String(sid || ''));
      if (!row) {
        return callback(null, null);
      }
      const expiresAt = new Date(String(row.expires_at || ''));
      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        this.statements.destroy.run(String(sid || ''));
        return callback(null, null);
      }
      return callback(null, JSON.parse(String(row.sess || '{}')));
    } catch (error) {
      return callback(error);
    }
  }

  set(sid, sess, callback = () => {}) {
    try {
      this.pruneExpiredSessions();
      const now = nowSql();
      const cookieExpires = sess?.cookie?.expires ? new Date(sess.cookie.expires) : null;
      const expiresAt = cookieExpires && !Number.isNaN(cookieExpires.getTime())
        ? toSqlDate(cookieExpires)
        : toSqlDate(Date.now() + this.ttlMs);
      this.statements.set.run(
        String(sid || ''),
        JSON.stringify(sess || {}),
        expiresAt,
        now,
        now
      );
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  destroy(sid, callback = () => {}) {
    try {
      this.statements.destroy.run(String(sid || ''));
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  touch(sid, sess, callback = () => {}) {
    try {
      const cookieExpires = sess?.cookie?.expires ? new Date(sess.cookie.expires) : null;
      const expiresAt = cookieExpires && !Number.isNaN(cookieExpires.getTime())
        ? toSqlDate(cookieExpires)
        : toSqlDate(Date.now() + this.ttlMs);
      this.statements.touch.run(expiresAt, nowSql(), String(sid || ''));
      callback(null);
    } catch (error) {
      callback(error);
    }
  }
}

module.exports = {
  SqliteSessionStore
};
