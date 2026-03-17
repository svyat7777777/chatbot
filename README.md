# PrintForge Chat Platform

Standalone embeddable chat platform that runs independently from the main website.

Main flow stays:

`widget -> backend -> database -> inbox`

Telegram, Instagram Direct, and Facebook Messenger can be connected into the same inbox through a channel adapter layer. Web chat stays the primary built-in channel and is not replaced.

## Structure

- `widget/widget.js` - embeddable runtime loaded by external script tag
- `widget/widget.css` - widget styles
- `server/app.js` - standalone API/static server
- `server/config/sites.js` - per-site config by `siteId`
- `server/services/chat-service.js` - conversations, messages, uploads, inbox, Telegram notifications
- `server/services/channels/dispatcher.js` - outbound routing by channel
- `server/services/channels/telegram.js` - Telegram inbound/outbound adapter
- `server/services/channels/instagram.js` - Instagram Direct inbound/outbound adapter
- `server/services/channels/facebook.js` - Facebook Messenger inbound/outbound adapter
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
CHAT_PLATFORM_KIMI_API_KEY=
CHAT_PLATFORM_KIMI_BASE_URL=https://api.moonshot.cn/v1
```

Optional Telegram transport:

```bash
CHAT_TELEGRAM_BOT_TOKEN=
CHAT_TELEGRAM_OPERATOR_CHAT_IDS=
CHAT_TELEGRAM_WEBHOOK_SECRET=
```

Optional omnichannel transport:

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_OPERATOR_CHAT_IDS=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_DEFAULT_SITE_ID=printforge-main

META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=
META_PAGE_ACCESS_TOKEN=
META_GRAPH_VERSION=v22.0
INSTAGRAM_BUSINESS_ACCOUNT_ID=
FACEBOOK_PAGE_ID=
INSTAGRAM_DEFAULT_SITE_ID=printforge-main
FACEBOOK_DEFAULT_SITE_ID=printforge-main
```

Optional AI Operator Assistant:

```bash
CHAT_PLATFORM_OPENAI_API_KEY=sk-...
# fallback also supported
OPENAI_API_KEY=sk-...
# optional Kimi provider
CHAT_PLATFORM_KIMI_API_KEY=sk-...
KIMI_API_KEY=sk-...
CHAT_PLATFORM_KIMI_BASE_URL=https://api.moonshot.cn/v1
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
  - provider (`openai` or `kimi`) / model / temperature / max tokens
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

## Omnichannel architecture

All channels are normalized into the same internal conversation/message flow:

- `web` -> existing widget flow
- `telegram` -> Telegram webhook -> normalized inbound -> shared inbox conversation
- `instagram` -> Meta webhook -> normalized inbound -> shared inbox conversation
- `facebook` -> Meta webhook -> normalized inbound -> shared inbox conversation

Shared conversation fields now include:

- `channel`
- `external_chat_id`
- `external_user_id`
- `assigned_operator`
- `last_operator`
- `handoff_at`
- `human_replied_at`
- `closed_at`

Shared message fields now include:

- `channel`
- `external_message_id`
- `raw_payload`

Outbound replies from `/inbox` are dispatched automatically by conversation channel:

- `web` -> existing widget/SSE flow
- `telegram` -> Telegram Bot API
- `instagram` -> Meta Send API
- `facebook` -> Messenger Send API

## Webhook setup

Telegram:

- webhook URL: `POST /api/telegram/webhook`
- optional header secret: `X-Telegram-Bot-Api-Secret-Token: TELEGRAM_WEBHOOK_SECRET`
- inbound customer messages are created as `channel=telegram` conversations
- operator replies from inbox go back to the same Telegram chat automatically

Meta:

- verify URL: `GET /api/meta/webhook`
- delivery URL: `POST /api/meta/webhook`
- alias URLs also exist:
  - `/api/instagram/webhook`
  - `/api/facebook/webhook`
- set `META_VERIFY_TOKEN` to the same verify token you configure in Meta
- use `META_PAGE_ACCESS_TOKEN` for outbound replies

## What is working now

- web chat remains unchanged
- Telegram inbound customer text messages -> shared inbox
- Telegram outbound operator replies from inbox -> Telegram
- channel-aware conversation/message persistence in SQLite
- channel badges in inbox list/header
- unified outbound dispatcher
- Meta webhook verification and normalized Instagram/Facebook inbound plumbing
- Meta outbound adapter structure for inbox replies

## What still depends on real credentials / app approval

- Telegram requires a real bot token and webhook registration
- Instagram Direct requires:
  - Meta app
  - Page access token
  - Instagram business account connection
  - webhook subscription approval
- Facebook Messenger requires:
  - Facebook page
  - page access token
  - webhook subscription approval

## Testing

Telegram:

1. Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_DEFAULT_SITE_ID`.
2. Register webhook:
   `https://api.telegram.org/bot<token>/setWebhook?url=https://your-host/api/telegram/webhook&secret_token=<secret>`
3. Send a message to the bot from a non-operator Telegram account.
4. Verify the conversation appears in `/inbox` with `Telegram` badge.
5. Reply from inbox and confirm the message arrives back in Telegram.

Instagram / Facebook:

1. Set `META_VERIFY_TOKEN` and `META_PAGE_ACCESS_TOKEN`.
2. Point Meta webhook verification/subscription to `GET/POST /api/meta/webhook`.
3. Subscribe message events for the relevant surface.
4. Send a real direct/message event from Meta.
5. Verify the conversation appears in `/inbox` with `Instagram` or `Facebook` badge.

If Meta credentials are not valid yet, webhook verification and the adapter layer are still in place, but end-to-end delivery will remain blocked by Meta platform setup.

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
