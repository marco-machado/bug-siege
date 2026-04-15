# Technology Stack

**Analysis Date:** 2026-04-15

## Languages

**Primary:**
- JavaScript ES6+ (ES Modules) - All source code in `src/`

**Secondary:**
- None - Pure JavaScript codebase

## Runtime

**Environment:**
- Browser runtime via Vite dev server
- No Node.js runtime dependencies beyond build tooling

**Package Manager:**
- npm (Node Package Manager)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Phaser 3.80.0 - HTML5 game framework with Arcade physics
- Used for all game rendering, physics, audio, and scene management

**Testing:**
- None configured (per AGENTS.md)

**Build/Dev:**
- Vite 5.4.0 - Frontend build tool and dev server
- Config: `vite.config.js` with Phaser manual chunking

## Key Dependencies

**Critical:**
- Phaser 3.80.0 - Game engine powering all gameplay logic
- Vite 5.4.0 - Development server and production bundler

**Infrastructure:**
- None - No additional infrastructure packages

## Configuration

**Environment:**
- Single environment variable: `VITE_DEBUG_KEYS`
- Accessed via `import.meta.env.VITE_DEBUG_KEYS` in `src/config/GameConfig.js`
- Enables debug features (keys 1-4 spawn bugs, live stats overlay)

**Build:**
- `vite.config.js` - Configures base path and manual chunks
- `package.json` - Defines npm scripts and ES module type

## Platform Requirements

**Development:**
- Node.js (any recent LTS)
- npm for package management
- Modern browser for testing

**Production:**
- Static file hosting (any web server)
- No server-side requirements
- Browser with WebGL support for Phaser

---

*Stack analysis: 2026-04-15*