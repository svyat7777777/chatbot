const { requireAuth, respondForbidden } = require('./auth');

function parseSuperAdminEmails() {
  return String(process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isSuperAdminPrincipal(req) {
  const user = req.user || req.auth?.user || {};
  const email = String(user.email || '').trim().toLowerCase();
  return Boolean(
    req.auth?.isSuperAdmin ||
    user.isSuperAdmin ||
    user.is_super_admin ||
    (email && parseSuperAdminEmails().includes(email))
  );
}

function requireSuperAdmin(options = {}) {
  const requireAuthMiddleware = requireAuth(options);
  return function requireSuperAdminMiddleware(req, res, next) {
    requireAuthMiddleware(req, res, (error) => {
      if (error) return next(error);
      if (isSuperAdminPrincipal(req)) return next();
      return respondForbidden(req, res, options.message || 'Super admin access is required.');
    });
  };
}

module.exports = {
  isSuperAdminPrincipal,
  requireSuperAdmin
};
