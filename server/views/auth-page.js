function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAuthPage(options = {}) {
  const mode = String(options.mode || 'login').trim() === 'signup' ? 'signup' : 'login';
  const title = mode === 'signup' ? 'Create account' : 'Sign in';
  const subtitle = mode === 'signup'
    ? 'Create your workspace and owner account.'
    : 'Sign in to your PrintForge workspace.';
  const error = String(options.error || '').trim();
  const next = String(options.next || '/inbox').trim() || '/inbox';
  const values = options.values && typeof options.values === 'object' ? options.values : {};

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f5f7fb;
        color: #101828;
      }
      .card {
        width: 100%;
        max-width: 420px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 12px 40px rgba(16,24,40,0.08);
      }
      h1 {
        margin: 0 0 8px;
        font-size: 28px;
      }
      p {
        margin: 0 0 20px;
        color: #667085;
      }
      .error {
        margin-bottom: 16px;
        padding: 12px 14px;
        border-radius: 10px;
        background: #fef3f2;
        border: 1px solid #fecdca;
        color: #b42318;
        font-size: 14px;
      }
      form {
        display: grid;
        gap: 12px;
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 14px;
        font-weight: 600;
      }
      input {
        width: 100%;
        border: 1px solid #d0d5dd;
        border-radius: 10px;
        padding: 10px 12px;
        font: inherit;
      }
      button {
        border: 0;
        border-radius: 10px;
        padding: 11px 14px;
        font: inherit;
        font-weight: 600;
        background: #1d4ed8;
        color: white;
        cursor: pointer;
      }
      .alt {
        margin-top: 16px;
        font-size: 14px;
      }
      .alt a {
        color: #1d4ed8;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <section class="card">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
      <form method="post" action="${mode === 'signup' ? '/signup' : '/login'}">
        <input type="hidden" name="next" value="${escapeHtml(next)}" />
        ${mode === 'signup' ? `
          <label>
            Name
            <input name="name" type="text" autocomplete="name" required value="${escapeHtml(values.name || '')}" />
          </label>
          <label>
            Workspace Name
            <input name="workspaceName" type="text" autocomplete="organization" value="${escapeHtml(values.workspaceName || '')}" />
          </label>
        ` : ''}
        <label>
          Email
          <input name="email" type="email" autocomplete="email" required value="${escapeHtml(values.email || '')}" />
        </label>
        <label>
          Password
          <input name="password" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" required />
        </label>
        <button type="submit">${mode === 'signup' ? 'Create account' : 'Sign in'}</button>
      </form>
      <div class="alt">
        ${mode === 'signup'
          ? `Already have an account? <a href="/login?next=${encodeURIComponent(next)}">Sign in</a>`
          : `Need an account? <a href="/signup?next=${encodeURIComponent(next)}">Create one</a>`}
      </div>
    </section>
  </body>
</html>`;
}

module.exports = {
  renderAuthPage
};
