# External Integrations

**Analysis Date:** 2026-04-15

## APIs & External Services

**None detected:**
- Game is entirely client-side with no external API calls
- No analytics, tracking, or telemetry services
- No third-party SDKs or libraries beyond Phaser

## Data Storage

**Databases:**
- None - No database connectivity
- No persistence layer (scores not saved between sessions)

**File Storage:**
- Local filesystem only (assets loaded from `assets/` directory)
- All game assets bundled with application

**Caching:**
- Browser cache via standard Vite/HTTP caching
- No explicit application-level caching

## Authentication & Identity

**Auth Provider:**
- None - Game is single-player with no user accounts
- No authentication or authorization required

## Monitoring & Observability

**Error Tracking:**
- None - No error tracking service (Sentry, etc.)
- Console logging only for development

**Logs:**
- `console.log`, `console.warn`, `console.error` statements
- BootScene generates fallback assets and logs warnings on load failures

## CI/CD & Deployment

**Hosting:**
- Static hosting target (not specified)
- Built with `npm run build` outputs to `dist/` directory

**CI Pipeline:**
- None configured
- No test suite or linting pipeline

## Environment Configuration

**Required env vars:**
- Optional: `VITE_DEBUG_KEYS=true` enables debug features

**Secrets location:**
- No secrets required (game has no backend)

## Webhooks & Callbacks

**Incoming:**
- None - No webhook endpoints

**Outgoing:**
- None - No external API calls

---

*Integration audit: 2026-04-15*