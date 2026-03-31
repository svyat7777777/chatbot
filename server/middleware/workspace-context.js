const { DEFAULT_WORKSPACE_ID, DEFAULT_SITE_ID } = require('../services/workspace-service');

function parseCookieMap(req) {
  return String(req.headers?.cookie || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((accumulator, item) => {
      const separator = item.indexOf('=');
      if (separator === -1) return accumulator;
      const key = item.slice(0, separator).trim();
      const value = item.slice(separator + 1).trim();
      if (key) {
        accumulator[key] = decodeURIComponent(value);
      }
      return accumulator;
    }, {});
}

function resolveWorkspaceContext(workspaceService) {
  return function workspaceContextMiddleware(req, res, next) {
    const cookies = parseCookieMap(req);
    const authMemberships = Array.isArray(req.auth?.memberships) ? req.auth.memberships : [];
    const authWorkspaceId = String(req.auth?.activeWorkspaceId || '').trim();
    const requestedWorkspaceId = String(
      req.body?.workspaceId ||
      req.query?.workspaceId ||
      req.headers['x-workspace-id'] ||
      req.session?.activeWorkspaceId ||
      authWorkspaceId ||
      cookies.workspace_id ||
      ''
    ).trim();

    let workspaceId = requestedWorkspaceId || authWorkspaceId || DEFAULT_WORKSPACE_ID;
    if (authMemberships.length > 0) {
      const allowedWorkspaceIds = new Set(authMemberships.map((item) => String(item.workspaceId || '').trim()).filter(Boolean));
      if (!allowedWorkspaceIds.has(workspaceId)) {
        workspaceId = authWorkspaceId || authMemberships[0]?.workspaceId || DEFAULT_WORKSPACE_ID;
      }
    }
    workspaceId = workspaceService.resolveWorkspaceId(workspaceId);
    const requestedSiteId = String(
      req.params?.siteId ||
      req.body?.siteId ||
      req.query?.siteId ||
      req.headers['x-site-id'] ||
      req.session?.activeSiteId ||
      cookies.site_id ||
      ''
    ).trim();
    const requestedSite = requestedSiteId ? workspaceService.getSiteById(requestedSiteId) : null;
    if (requestedSite) {
      if (authMemberships.length > 0) {
        const allowedWorkspaceIds = new Set(authMemberships.map((item) => String(item.workspaceId || '').trim()).filter(Boolean));
        if (allowedWorkspaceIds.has(requestedSite.workspaceId)) {
          workspaceId = requestedSite.workspaceId;
        }
      } else {
        workspaceId = requestedSite.workspaceId;
      }
    }
    workspaceId = workspaceService.resolveWorkspaceId(workspaceId);
    const scopedWorkspace = workspaceService.getWorkspaceById(workspaceId) || workspaceService.getDefaultWorkspace();
    const site = workspaceService.resolveSite(requestedSiteId, DEFAULT_SITE_ID, workspaceId);

    if (req.session) {
      req.session.activeWorkspaceId = scopedWorkspace?.id || DEFAULT_WORKSPACE_ID;
      if (site?.id) {
        req.session.activeSiteId = site.id;
      }
    }

    req.workspaceContext = {
      workspaceId: scopedWorkspace?.id || DEFAULT_WORKSPACE_ID,
      workspace: scopedWorkspace,
      siteId: site?.id || requestedSiteId || DEFAULT_SITE_ID,
      site
    };

    res.locals.workspaceContext = req.workspaceContext;
    return next();
  };
}

module.exports = {
  resolveWorkspaceContext
};
