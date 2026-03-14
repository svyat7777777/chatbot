# PrintForge Chat Platform

Standalone embeddable chat platform that runs independently from the main website.

Main flow stays:

`widget -> backend -> database -> inbox`

Telegram is optional and only works as a secondary notification channel.

## Structure

- `widget/widget.js` - embeddable runtime loaded by external script tag
- `widget/widget.css` - widget styles
- `server/app.js` - standalone API/static server
- `server/config/sites.js` - per-site config by `siteId`
- `server/services/chat-service.js` - conversations, messages, uploads, inbox, Telegram notifications
- `server/db/database.js` - SQLite schema/init
- `ecosystem.config.js` - PM2 production config for VPS deploy

## Required environment

Copy `.env.example` to `.env` and set:

```bash
NODE_ENV=production
PORT=4100
CHAT_PLATFORM_HOST=0.0.0.0
CHAT_PLATFORM_BASE_URL=https://chat.example.com
CHAT_PLATFORM_DB_PATH=./data/chat-platform.db
CHAT_PLATFORM_CONTACTS_PATH=./data/contacts.json
CHAT_PLATFORM_SITE_SETTINGS_PATH=./data/site-settings.json
CHAT_PLATFORM_TEMP_UPLOAD_DIR=./tmp
CHAT_PLATFORM_UPLOADS_ROOT=./uploads
CHAT_PLATFORM_ALLOWED_ORIGINS=https://printforge.com,https://www.printforge.com
INBOX_ADMIN_USERNAME=admin
INBOX_ADMIN_PASSWORD=change-me
CHAT_PLATFORM_OPENAI_API_KEY=
CHAT_PLATFORM_OPENAI_BASE_URL=
```

Optional Telegram transport:

```bash
CHAT_TELEGRAM_BOT_TOKEN=
CHAT_TELEGRAM_OPERATOR_CHAT_IDS=
CHAT_TELEGRAM_WEBHOOK_SECRET=
```

Optional AI Operator Assistant:

```bash
CHAT_PLATFORM_OPENAI_API_KEY=sk-...
# fallback also supported
OPENAI_API_KEY=sk-...
# optional if you use a compatible proxy/provider endpoint
CHAT_PLATFORM_OPENAI_BASE_URL=https://api.openai.com/v1
```

Notes:

- `PORT` is the actual listen port.
- `CHAT_PLATFORM_BASE_URL` must be the public URL where this service is reachable.
- `CHAT_PLATFORM_SITE_SETTINGS_PATH` is the JSON file where editable per-site widget settings are persisted.
- In production, `CHAT_PLATFORM_ALLOWED_ORIGINS` must be an explicit list of allowed website origins. `*` is rejected on startup.
- `/inbox` is protected with HTTP Basic Auth using `INBOX_ADMIN_USERNAME` and `INBOX_ADMIN_PASSWORD`.
- Uploads and DB paths can be absolute paths if you prefer storing data outside the app folder.

## Local run

```bash
cd chat-platform
npm install
cp .env.example .env
npm run dev
```

Default local URLs:

- widget: `http://localhost:4100/widget.js`
- API: `http://localhost:4100/api`
- inbox: `http://localhost:4100/inbox`

## Production install on VPS

1. Copy the whole `chat-platform/` folder to the VPS.
2. Install Node.js 20+.
3. Run `npm install --omit=dev`.
4. Create `.env` from `.env.example`.
5. Create persistent directories for `data/`, `tmp/`, and `uploads/` if you want them outside the project folder.
6. Start the service with PM2.
7. Put Nginx or Caddy in front of it and expose `CHAT_PLATFORM_BASE_URL`.

## Start commands

Plain Node:

```bash
npm start
```

PM2:

```bash
npx pm2 start ecosystem.config.js
npx pm2 save
```

The included [ecosystem.config.js](/Users/sviat/Documents/New%20project/model-catalog-site/chat-platform/ecosystem.config.js) is the simplest practical production option for v1.

## Nginx/Caddy expectations

Your reverse proxy should forward:

- `/widget.js`
- `/widget.css`
- `/api/*`
- `/uploads/*`
- `/inbox`

The Node service already serves widget assets and uploads directly, so the proxy only needs to pass requests through.

## Embed on a website

Add this to the website:

```html
<script>
  window.PFChatConfig = {
    siteId: "printforge-main",
    apiBase: "https://chat.example.com/api",
    widgetBaseUrl: "https://chat.example.com"
  };
</script>
<script src="https://chat.example.com/widget.js" async></script>
```

The widget then loads:

1. `GET /api/widget-config/:siteId`
2. `POST /api/conversations`
3. `GET /api/conversations/:conversationId/messages`
4. `GET /api/conversations/:conversationId/stream`
5. `POST /api/messages`
6. `POST /api/uploads`

## CORS and external embed

For production:

- set `CHAT_PLATFORM_ALLOWED_ORIGINS` to the exact frontend domains that may embed the widget
- do not use `*`
- the widget itself can be loaded cross-origin from `https://chat.example.com/widget.js`
- API requests from the website will work only for origins listed in `CHAT_PLATFORM_ALLOWED_ORIGINS`

Example:

```bash
CHAT_PLATFORM_ALLOWED_ORIGINS=https://printforge.com,https://www.printforge.com,https://shop.example.com
```

## Inbox security

`/inbox` and `/api/inbox/*` are protected with HTTP Basic Auth.

Set strong credentials in `.env`:

```bash
INBOX_ADMIN_USERNAME=ops
INBOX_ADMIN_PASSWORD=replace-with-a-strong-password
```

If these variables are missing, inbox routes are not exposed for use and return `503`.

For extra safety on VPS, you can also restrict `/inbox` at the reverse proxy level by IP or VPN, but that is optional for v1.

## Editable site settings

Open:

- `/settings` for the internal settings UI
- `/inbox` for the operator messenger workspace with the contacts panel
- `/api/admin/sites`
- `/api/admin/sites/:siteId/settings`
- `/api/admin/contacts`
- `/api/admin/contacts/:contactId`

The settings UI lets you edit per-site:

- bot title
- avatar URL
- welcome message
- welcome intro label
- online status text
- primary/header/bubble/text colors
- quick action buttons
- operator quick replies
- AI Assistant settings:
  - enable / disable
  - provider / model / temperature / max tokens
  - company description
  - services
  - FAQ
  - pricing rules
  - lead time rules
  - file requirements
  - delivery info
  - tone / forbidden claims

These settings persist in `CHAT_PLATFORM_SITE_SETTINGS_PATH` and are merged with the base site config for each `siteId`.

Contacts saved from the inbox mini CRM persist in `CHAT_PLATFORM_CONTACTS_PATH`.

## AI Operator Assistant

Inbox includes operator-side AI assistance only. It never auto-sends.

Workflow:

- open a conversation in `/inbox`
- click `AI Draft`, `Shorten`, `More Sales`, `Ask Contact`, or `Ask File`
- the generated text is inserted into the operator textarea
- the operator reviews and sends manually

The assistant uses:

- per-site knowledge base from `/settings`
- the current conversation history
- saved contact info for the linked conversation when available

Backend endpoint:

- `POST /api/inbox/conversations/:conversationId/ai-draft`

## Per-site config

Add or edit sites in `server/config/sites.js`.

Each site can override:

- title
- welcome message
- quick actions
- theme colors
- allowed file types
- upload limit
- launcher text
- flow text overrides
- Telegram notification settings

Each conversation, upload, and message stays linked to `siteId`.

## Production behavior checks

Before going live, verify:

1. `GET https://chat.example.com/widget.js` returns the widget.
2. `GET https://chat.example.com/api/widget-config/printforge-main` returns the right config.
3. The website domain is listed in `CHAT_PLATFORM_ALLOWED_ORIGINS`.
4. New conversations and messages are created from the embedded widget.
5. `/inbox` prompts for auth and opens only with the configured credentials.
6. Uploaded files resolve under `https://chat.example.com/uploads/...`

## Runtime validation

On startup the server now validates:

- port
- base URL
- CORS origin list
- production wildcard CORS misuse

If config is invalid, the service exits early instead of running in a broken state.
