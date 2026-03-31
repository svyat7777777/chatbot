const { DEFAULT_WORKSPACE_ID } = require('../db/database');

const ROLE_LEVEL = {
  operator: 1,
  admin: 2,
  owner: 3
};

function isApiRequest(req) {
  return String(req.path || req.originalUrl || '').startsWith('/api/');
}

function wantsHtml(req) {
  const accept = String(req.headers.accept || '').toLowerCase();
  return accept.includes('text/html');
}

function redirectToLogin(req, res) {
  const nextPath = String(req.originalUrl || '/inbox');
  return res.redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}

function respondUnauthorized(req, res, message = 'Authentication required.') {
  if (isApiRequest(req) || !wantsHtml(req)) {
    return res.status(401).json({ ok: false, message });
  }
  return redirectToLogin(req, res);
}

function respondForbidden(req, res, message = 'You do not have access to this workspace.') {
  if (isApiRequest(req) || !wantsHtml(req)) {
    return res.status(403).json({ ok: false, message });
  }
  return res.status(403).type('html').send(`<h1>403</h1><p>${message}</p>`);
}

function normalizeLegacyPrincipal(workspaceService) {
  const workspace = workspaceService.getDefaultWorkspace();
  return {
    isAuthenticated: true,
    isLegacyFallback: true,
    user: {
      id: 'legacy_basic_auth',
      email: '',
      name: 'Legacy Admin'
    },
    memberships: [{
      id: 'legacy_workspace_default',
      workspaceId: workspace?.id || DEFAULT_WORKSPACE_ID,
      userId: 'legacy_basic_auth',
      role: 'owner',
      createdAt: '',
      workspace
    }],
    activeWorkspaceId: workspace?.id || DEFAULT_WORKSPACE_ID,
    currentMembership: {
      id: 'legacy_workspace_default',
      workspaceId: workspace?.id || DEFAULT_WORKSPACE_ID,
      userId: 'legacy_basic_auth',
      role: 'owner',
      createdAt: '',
      workspace
    },
    currentWorkspace: workspace,
    role: 'owner'
  };
}

function resolveAuthenticatedUser(authService, workspaceService, options = {}) {
  const allowLegacyBasicAuth = options.allowLegacyBasicAuth === true;
  const parseLegacyBasicAuth = typeof options.parseLegacyBasicAuth === 'function'
    ? options.parseLegacyBasicAuth
    : (() => false);

  return function authMiddleware(req, res, next) {
    req.auth = {
      isAuthenticated: false,
      isLegacyFallback: false,
      user: null,
      memberships: [],
      activeWorkspaceId: '',
      currentMembership: null,
      currentWorkspace: null,
      role: null
    };

    const sessionUserId = String(req.session?.userId || '').trim();
    if (sessionUserId) {
      const user = authService.getUserById(sessionUserId);
      if (user) {
        const memberships = authService.listUserWorkspaces(user.id);
        const activeMembership = authService.getCurrentWorkspaceForUser(user.id, req.session?.activeWorkspaceId || '');
        req.auth = {
          isAuthenticated: true,
          isLegacyFallback: false,
          user,
          memberships,
          activeWorkspaceId: activeMembership?.workspaceId || '',
          currentMembership: activeMembership,
          currentWorkspace: activeMembership?.workspace || null,
          role: activeMembership?.role || null
        };
        res.locals.auth = req.auth;
        return next();
      }
      if (req.session) {
        req.session.userId = null;
        req.session.activeWorkspaceId = null;
      }
    }

    if (allowLegacyBasicAuth && parseLegacyBasicAuth(req)) {
      req.auth = normalizeLegacyPrincipal(workspaceService);
    }

    res.locals.auth = req.auth;
    return next();
  };
}

function requireAuth(options = {}) {
  const message = options.message || 'Authentication required.';
  return function requireAuthMiddleware(req, res, next) {
    if (req.auth?.isAuthenticated) {
      return next();
    }
    return respondUnauthorized(req, res, message);
  };
}

function requireWorkspaceMember(options = {}) {
  const requireAuthMiddleware = requireAuth(options);
  return function requireWorkspaceMemberMiddleware(req, res, next) {
    requireAuthMiddleware(req, res, (error) => {
      if (error) return next(error);
      if (req.auth?.isLegacyFallback) return next();
      if (req.auth?.currentMembership) return next();
      return respondForbidden(req, res, options.message || 'Workspace membership is required.');
    });
  };
}

function requireWorkspaceRole(allowedRoles = [], options = {}) {
  const requireMembershipMiddleware = requireWorkspaceMember(options);
  const allowed = new Set(Array.isArray(allowedRoles) ? allowedRoles : []);

  return function requireWorkspaceRoleMiddleware(req, res, next) {
    requireMembershipMiddleware(req, res, (error) => {
      if (error) return next(error);
      if (req.auth?.isLegacyFallback) return next();
      const currentRole = String(req.auth?.currentMembership?.role || '').trim();
      if (allowed.has(currentRole)) {
        return next();
      }

      const maxAllowedLevel = Math.max(...Array.from(allowed).map((role) => ROLE_LEVEL[role] || 0), 0);
      const currentLevel = ROLE_LEVEL[currentRole] || 0;
      if (currentLevel >= maxAllowedLevel && maxAllowedLevel > 0) {
        return next();
      }

      return respondForbidden(req, res, options.message || 'You do not have permission to perform this action.');
    });
  };
}

module.exports = {
  isApiRequest,
  respondUnauthorized,
  respondForbidden,
  resolveAuthenticatedUser,
  requireAuth,
  requireWorkspaceMember,
  requireWorkspaceRole
};
