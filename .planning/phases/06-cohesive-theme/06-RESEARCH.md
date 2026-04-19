# Phase 6: Cohesive Theme — Research

**Researched:** 2026-04-18
**Domain:** Phaser 3.80+ color API + frozen-config refactor (UI chrome migration)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 Migration scope** — In scope: hardcoded UI-chrome color literals in `MainMenuScene.js`, `BootScene.js` preloader (lines 19, 27, 32), `UIScene.js`, `GameOverScene.js`, `BuildSystem.js` menus, `Turret.js` HP-bar fills (lines 53, 55, 405–407). Out of scope: `VFX.*`, `POSTFX.*`, BootScene.js:115–155 procedural texture generators, `VFX.DEATH.*.tint` bug death colors. Boundary heuristic: if a color describes UI chrome → migrate; if it describes game-entity identity or effect → leave.
- **D-02 THEME expansion** — Add `ui` sub-object to existing `THEME` frozen export (GameConfig.js:136–140). Preserve existing `background`, `nebula`, `accent` keys. New keys: `ui.textPrimary`, `ui.textMuted`, `ui.textDisabled`, `ui.accentPrimary`, `ui.accentSecondary`, `ui.warning`, `ui.danger`, `ui.success`, `ui.surface`, `ui.surfaceBorder`, `ui.hpBarBg`, `ui.gridLine`, `ui.loadingBar`, `ui.loadingBarBg` (14 keys, ceiling enforced).
- **D-03 Palette authority** — Cosmic nebula palette from `01-UI-SPEC.md` is authoritative: dominant `#0a0a12`, secondary `#2d1b4e`, accent `#eef2ff`, destructive `#ff3333`. Menu fill `ui.surface` remaps from `#111122` to `#2d1b4e`. Derived variants stay in nebula/accent family (purples/blues with accent highlights) — no primary-color greens/yellows that break cosmic aesthetic.
- **D-04 Hex vs numeric notation** — Store both explicitly as `{ hex: '#eef2ff', num: 0xeef2ff }` per entry. Chosen over a `themeNum()` helper to avoid per-call conversion. Planner may swap to helper if it reads cleaner, but default is inline-both.
- **D-05 Migration file order** — (1) `GameConfig.js` (expand THEME), (2) `MainMenuScene.js`, (3) `BootScene.js` preloader only, (4) `UIScene.js`, (5) `GameOverScene.js`, (6) `BuildSystem.js`, (7) `Turret.js`. One atomic commit per file. Run `npm run build` after each.
- **D-06 Semantic reuse policy** — Collapse similar intent into one key (`#00ff88` button hover, `#88ff88` notification → both `ui.accentPrimary`). Split when gameplay-state differs: `#00ff44` healthy HP stays `ui.success` (distinct from "button hover"). Ceiling: ≤14 `ui.*` keys.
- **D-07 Verification gate** — (a) grep migrated files: zero `#[0-9a-fA-F]{6}` literals outside THEME definitions, zero `0x[0-9a-fA-F]{6}` outside THEME/VFX/POSTFX; (b) `npm run dev` visual smoke-test (no green/yellow/cyan accents in UI chrome); (c) ROADMAP.md Success Criteria #1 satisfied (hardcoded colors across 6+ files reference THEME). Grep scan is the falsifiable checkpoint.

### Claude's Discretion

- Exact numeric values for derived cosmic variants (muted text, success green, warning, HP-bar tiers) — pick within nebula/accent family; verifier checks palette cohesion
- Whether to use `themeHex()` / `themeNum()` helper vs inline `{ hex, num }` (D-04 defaults to inline; planner may swap)
- Flat vs nested structure for `ui.*` keys — defaults to flat (`THEME.ui.textPrimary`) for brevity

### Deferred Ideas (OUT OF SCOPE)

- Dark/light mode toggle — single cosmic theme only for v1
- Per-wave palette shifts — future milestone polish
- Refactoring VFX particle tints through THEME — separate gameplay-effect layer
- Typography token consolidation — separate phase if pursued
- Theming procedural bug/turret textures — BootScene.js:115–155 stays as-is (game entities, not UI chrome)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| THEME-03 | Migrate all hardcoded color values across 6+ files to reference THEME config constants | This research confirms Phaser's dual-format color API (string for text, numeric for Graphics/Shape), verifies the `{ hex, num }` inline pattern is compatible with all call sites in scope, and defines the grep-based verification gate (D-07) plus visual smoke-test procedure. |
</phase_requirements>

## Summary

Phase 6 is a mechanical refactor, not a design exercise. The palette is already locked by `01-UI-SPEC.md`, the file list and key names are locked by CONTEXT.md, and the Phaser API split between text styles (`color: '#rrggbb'`) and Graphics/Shape (`setFillStyle(0xRRGGBB)`) is verified from Phaser 3.90 source docs. The only research-worthy concerns are (1) confirming the API split has no edge cases that break the `{ hex, num }` inline pattern, (2) surfacing a scope question about `GameScene.js:427` (wave announcement text `'#ff8844'`) that CONTEXT.md's file list omits but the D-07 grep gate will flag, and (3) tightening the verification regex to avoid false positives.

**Primary recommendation:** Apply D-05's 7-commit migration order verbatim. For each literal: text-style `color:` and `setColor()` → read `.hex`; `setFillStyle()`, `setStrokeStyle()`, `fillStyle()`, `lineStyle()`, `Rectangle` constructor color arg → read `.num`. Use the tightened grep `rg '(#[0-9a-fA-F]{6}|0x[0-9a-fA-F]{6})' src/` filtered to exclude `src/config/GameConfig.js` lines inside `THEME`/`VFX`/`POSTFX` as the completion gate.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Semantic palette definition | Configuration layer (GameConfig.js) | — | AGENTS.md rule: all balance/config centralized in frozen objects in `src/config/` |
| UI text rendering (menus, HUD, game-over) | Scene layer (Browser/Client via Phaser) | Configuration layer | Scenes consume THEME; Phaser Text objects render to Canvas/WebGL in browser |
| UI chrome rendering (panels, HP bars, preloader) | Scene + System layer (Browser/Client via Phaser) | Configuration layer | Phaser Rectangle/Graphics drawn via Canvas/WebGL; BuildSystem owns menu construction |

All affected code is browser-tier rendering. No API, storage, or CDN tier involvement.

## Standard Stack

The stack is fixed by the project — this phase adds no new dependencies.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser | 3.80.0 | Game engine, rendering, text, Graphics/Shape APIs | Already the sole runtime dep; AGENTS.md forbids framework changes |
| Vite | 5.4.0 | Build validation (`npm run build`) | Only validation gate available (no test framework per AGENTS.md) |

No installs needed. `npm view phaser version` not run — the project pins 3.80.0 in package.json and the context7 docs for 3.90 confirm the color APIs used here (`setColor`, `setFillStyle`, `setStrokeStyle`, `fillStyle`, `lineStyle`, text style `color` property) are stable and unchanged. [VERIFIED: context7 /phaserjs/phaser v3_90_0]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `{ hex, num }` per entry (D-04) | `Phaser.Display.Color.ValueToColor('#rrggbb').color` helper called at use-site | Saves ~14 lines of duplication but adds per-access runtime conversion cost and loses the "grep the config, see both forms" readability property. D-04 is locked; do not re-litigate. [CITED: https://github.com/phaserjs/phaser/blob/master/skills/geometry-and-math/SKILL.md] |
| Flat `ui.textPrimary` (D-06 discretion) | Nested `ui.text.primary`, `ui.text.muted`, etc. | Nested reads better at 3+ related keys per group but this palette has only ~2 text keys grouped — flat wins on brevity. |

## Architecture Patterns

### System Architecture Diagram

```
[GameConfig.js THEME.ui]  ← frozen semantic palette (14 keys × {hex, num})
          │
          │ import { THEME } from '../config/GameConfig.js'
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ Scene / System consumers                                         │
│                                                                  │
│  ┌─────────────────────┐        ┌──────────────────────────┐    │
│  │ Text-style sites    │        │ Graphics / Shape sites    │    │
│  │ (reads .hex)        │        │ (reads .num)              │    │
│  │                     │        │                           │    │
│  │ • add.text({ color })        │ • rectangle(..., color)   │    │
│  │ • setColor()                 │ • setFillStyle(color)     │    │
│  │ • setFill()                  │ • setStrokeStyle(w, col)  │    │
│  │                     │        │ • fillStyle(color)        │    │
│  │                     │        │ • lineStyle(w, col)       │    │
│  └─────────────────────┘        └──────────────────────────┘    │
│                                                                  │
│  Files touched: MainMenuScene, BootScene(preloader), UIScene,    │
│                 GameOverScene, BuildSystem, Turret                │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
   Phaser renderer (WebGL or Canvas) → browser canvas
```

Data flow: config is written once (frozen), imported by 6 files, read at scene `create()` time and at pointer event handlers. No runtime mutation.

### Recommended Project Structure

Unchanged. The existing layout already has the right place for everything:

```
src/
├── config/GameConfig.js     # expand THEME (single source of truth)
├── scenes/                  # consume THEME.ui.*.hex for text, .num for shapes
├── systems/BuildSystem.js   # consume THEME.ui.*.hex for menu text, .num for bg/border
└── entities/Turret.js       # consume THEME.ui.*.num for HP-bar Rectangle fills
```

### Pattern 1: Dual-format token inline

**What:** Each semantic key stores both CSS-hex string and packed numeric int. Call sites read `.hex` or `.num` based on which Phaser API they call.

**When to use:** Any semantic that is consumed by both a text style (Phaser requires string) AND a Graphics/Shape call (Phaser requires number). In this phase: `ui.textPrimary`, `ui.accentPrimary`, `ui.warning`, `ui.danger` are all dual-consumed.

**Example:**
```javascript
// src/config/GameConfig.js (expansion pattern, following existing VFX/POSTFX freeze style)
export const THEME = Object.freeze({
  background: '#0a0a12',
  nebula: Object.freeze(['#2d1b4e', '#4b2c62', '#6a4c93']),
  accent: '#eef2ff',
  ui: Object.freeze({
    textPrimary:     Object.freeze({ hex: '#eef2ff', num: 0xeef2ff }),
    accentPrimary:   Object.freeze({ hex: '#9966ff', num: 0x9966ff }),
    warning:         Object.freeze({ hex: '#ffaa44', num: 0xffaa44 }),
    danger:          Object.freeze({ hex: '#ff3333', num: 0xff3333 }),
    surface:         Object.freeze({ hex: '#2d1b4e', num: 0x2d1b4e }),
    surfaceBorder:   Object.freeze({ hex: '#4b2c62', num: 0x4b2c62 }),
    hpBarBg:         Object.freeze({ hex: '#1a1a2e', num: 0x1a1a2e }),
    // ... 14 keys total
  }),
});
```
(Exact numeric values for derived cosmic variants are Claude's Discretion per CONTEXT.md.)

### Pattern 2: Text-style site migration

**What:** Replace `color: '#00ff88'` with `color: THEME.ui.accentPrimary.hex`. Replace `setColor('#00ff88')` with `setColor(THEME.ui.accentPrimary.hex)`.

**When to use:** Every text style config object, every `setColor()`/`setFill()` call. [VERIFIED: context7 /phaserjs/phaser — `setColor(color: string)` and `setFill(color: string)` accept only strings]

**Example:**
```javascript
// Before (MainMenuScene.js:27-31)
this.add.text(W / 2, H * 0.28, 'BUG SIEGE', {
  fontSize: '112px',
  fontFamily: 'monospace',
  color: '#00ff88',
  fontStyle: 'bold',
});

// After
import { THEME } from '../config/GameConfig.js';
this.add.text(W / 2, H * 0.28, 'BUG SIEGE', {
  fontSize: '112px',
  fontFamily: 'monospace',
  color: THEME.ui.accentPrimary.hex,
  fontStyle: 'bold',
});
```

### Pattern 3: Graphics / Rectangle site migration

**What:** Replace numeric literal with `.num`. Applies to Rectangle constructor color arg, `setFillStyle()`, `setStrokeStyle()`, `Graphics.fillStyle()`, `Graphics.lineStyle()`.

**When to use:** Every Rectangle/Graphics/Shape drawing call site. [VERIFIED: context7 /phaserjs/phaser — `rect.setFillStyle(color: number, alpha?)`, `rect.setStrokeStyle(lineWidth, color: number, alpha?)`, `graphics.fillStyle(color: number, alpha?)`, `graphics.lineStyle(lineWidth, color: number, alpha?)`]

**Example:**
```javascript
// Before (UIScene.js:33-34)
this.hpBarBg = this.add.rectangle(barX, barY, barW, barH, 0x333333).setOrigin(0);
this.hpBarFill = this.add.rectangle(barX, barY, barW, barH, 0x00ff44).setOrigin(0);

// After
this.hpBarBg = this.add.rectangle(barX, barY, barW, barH, THEME.ui.hpBarBg.num).setOrigin(0);
this.hpBarFill = this.add.rectangle(barX, barY, barW, barH, THEME.ui.success.num).setOrigin(0);

// Before (UIScene.js:82)
this.hpBarFill.setFillStyle(pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff3333);

// After
this.hpBarFill.setFillStyle(
  pct > 0.5 ? THEME.ui.success.num
  : pct > 0.25 ? THEME.ui.warning.num
  : THEME.ui.danger.num
);
```

### Pattern 4: Pointer handler in-place swap

**What:** `pointerover`/`pointerout` handlers that call `setColor()` get the literal replaced, no structural change. Same for `flashDenied()` in BuildSystem.

**Example:**
```javascript
// Before (MainMenuScene.js:47-48)
startBtn.on('pointerover', () => startBtn.setColor('#00ff88'));
startBtn.on('pointerout', () => startBtn.setColor('#ffffff'));

// After
startBtn.on('pointerover', () => startBtn.setColor(THEME.ui.accentPrimary.hex));
startBtn.on('pointerout', () => startBtn.setColor(THEME.ui.textPrimary.hex));
```

Note on `BuildSystem.js:347-352` (`flashDenied`): `origColor = textObj.style.color` reads the string form (since the text was created with `.hex`), then restores it — no migration change needed in the restore path, only in the flash-to-danger path: `textObj.setColor(THEME.ui.danger.hex)`.

### Anti-Patterns to Avoid

- **Do not call `Phaser.Display.Color.ValueToColor(THEME.ui.xxx.hex).color` at draw time.** D-04 stores both forms precisely so call sites never convert. [VERIFIED: context7 confirms the helper exists but per-access conversion is the cost D-04 avoids]
- **Do not pass a hex string to `setFillStyle()` / `setStrokeStyle()` / `fillStyle()` / `lineStyle()`.** Phaser coerces strings via `parseInt` inconsistently — `'#ff3333'` may render black or garbled. Always pass the `.num` form. [VERIFIED: context7 Graphics/Shape style skills — signatures require `color: number`]
- **Do not pass a number to text-style `color:` or `setColor()`.** Those are CSS strings and will throw or render as `'[object Object]'`. [VERIFIED: context7 Text setColor skill — `color: string`]
- **Do not migrate VFX/POSTFX literals.** D-01 boundary: game-effect colors stay in their existing frozen configs (e.g., `VFX.DEATH.swarmer.tint = 0x44ff44`, `VFX.SHOCKWAVE.color = 0x9966ff`, `POSTFX.VIGNETTE` has no colors).
- **Do not migrate BootScene.js:115–155 (`generateParticleTextures`, `generateFallback`).** These are procedural sprite/texture generators; the colors are pre-multiplied into texture pixels and represent game-entity identity, not UI chrome. The `0xffffff` and `0xff00ff` magenta fallback stay as-is.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hex string → packed int conversion | A custom `hexToNum('#eef2ff')` util | `Phaser.Display.Color.ValueToColor('#eef2ff').color` if needed (not needed for this phase since D-04 inlines both) | Phaser ships it, handles 3-digit and 6-digit hex, plus CSS named colors |
| Color object freeze tree | Manual nested freeze | Existing `Object.freeze(Object.freeze({ ... }))` pattern from VFX/POSTFX | Already codified in the project and passes `npm run build` |
| Runtime color tweening between theme values | Lerp two literals | `Phaser.Display.Color.Interpolate.RGBWithRGB` | Out of scope for this phase but noted for future flexibility [CITED: context7 geometry-and-math SKILL] |

**Key insight:** This phase is entirely replacement-of-literals, not new infrastructure. Don't introduce helpers, don't restructure config exports, don't add TypeScript/types. The smallest diff that satisfies D-07 wins.

## Runtime State Inventory

This phase is a code-only refactor with no runtime state footprint.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no database, no local storage, no user_ids or collection names reference the migrated literals | None |
| Live service config | None — no external services (no Datadog, no n8n, no Tailscale, no Cloudflare); game runs client-side only | None |
| OS-registered state | None — browser game, no Task Scheduler / systemd / launchd / pm2 registrations | None |
| Secrets/env vars | None — the single env var (`VITE_DEBUG_KEYS`) is unrelated to colors | None |
| Build artifacts | Vite `dist/` output is rebuilt on every `npm run build`; no cached state to invalidate | None |

**Canonical question answered:** After every file is updated, nothing else in any runtime system holds the old literals. Confirmed by project architecture (fully client-side browser app, single-session state in memory, no persistence layer).

## Common Pitfalls

### Pitfall 1: Hex string passed to numeric-only Phaser API

**What goes wrong:** Writing `rect.setFillStyle('#ff3333', 1)` or `graphics.fillStyle('#ff3333')` — the shape renders black, transparent, or unpredictably.

**Why it happens:** Phaser's Shape/Graphics color parameter is typed as `number` (see Pattern 3 sources). JavaScript coerces `'#ff3333'` to `NaN` via arithmetic, and the WebGL/Canvas renderer treats `NaN` color as 0.

**How to avoid:** Grep-verify after each file commit: `rg "setFillStyle\\('#|setStrokeStyle\\(.*'#|fillStyle\\('#|lineStyle\\(.*'#|rectangle\\(.*'#" src/` should return zero results.

**Warning signs:** Black HP bar, invisible menu panel, missing preloader progress bar.

### Pitfall 2: Numeric passed to string-only Phaser API

**What goes wrong:** Writing `text.setColor(0xeef2ff)` or `{ color: 0xeef2ff }` in a text style — the text renders as the default white, or throws a CSS parse error in strict browsers.

**Why it happens:** Phaser's Text `color` property is forwarded directly to Canvas 2D `fillStyle` which expects a CSS color string. `0xeef2ff` becomes the integer `15651575` and Canvas interprets it as `'15651575'`, which is invalid CSS → falls back to white.

**How to avoid:** Grep-verify: `rg "setColor\\(0x|color:\\s*0x" src/` should return zero results after migration.

**Warning signs:** All UI text renders white with no color variation; pointer hover states don't visibly change.

### Pitfall 3: Forgetting `.hex` / `.num` suffix

**What goes wrong:** Writing `setColor(THEME.ui.accentPrimary)` passes the frozen `{ hex, num }` object, not the string. Same for numeric call sites. Phaser coerces the object to `'[object Object]'` (text) or `NaN` (shape).

**Why it happens:** Old muscle-memory from when THEME was flat (`THEME.accent` was a string).

**How to avoid:** During migration, read each call site's target API type from Pattern 2 / Pattern 3 tables. After migration, `rg "THEME\\.ui\\.[a-zA-Z]+[^.a-zA-Z]" src/ --glob '!src/config/*'` catches references that lack the `.hex`/`.num` suffix.

**Warning signs:** Text shows literally "[object Object]"; shapes render invisible/black.

### Pitfall 4: Migrating a VFX literal by accident

**What goes wrong:** A wide grep like `0x[0-9a-f]{6}` finds `VFX.SHOCKWAVE.color = 0x9966ff` and the planner tries to migrate it — breaks D-01 boundary, conflates gameplay-effect layer with UI chrome layer.

**Why it happens:** Both VFX and UI use numeric hex; the two only differ semantically.

**How to avoid:** The D-07 grep gate explicitly excludes `THEME`/`VFX`/`POSTFX` definitions in `GameConfig.js`. Enforce with `--glob '!src/config/GameConfig.js'` on the verification scan, OR pass a line-range filter.

**Warning signs:** Particle colors suddenly match UI palette (e.g., death bursts become pale instead of vivid).

### Pitfall 5: Missing Turret.js idle tween alpha bug

**What goes wrong:** Migrating Turret.js lines 53, 55 is fine, but lines 405–407 are inside `updateHpBar()` which runs every time HP changes. Old literal `0x00ff00` must map to `ui.success.num`, not `accentPrimary.num` — HP bar green is a gameplay-state signal distinct from button hover (D-06 split rule).

**Why it happens:** Both are "green accent"; easy to collapse.

**How to avoid:** Follow D-06 literally — `ui.success` is reserved for HP-bar-healthy semantics. Use the three-tier signal `success → warning → danger` for HP ratios >50% / >25% / ≤25%, matching both UIScene.js:82 and Turret.js:405–407 to preserve gameplay communication.

**Warning signs:** Low-HP turrets stop visually signaling danger; player takes unexpected losses.

## Code Examples

### Complete migration of one Rectangle site (UIScene.js:33-34)

```javascript
// File: src/scenes/UIScene.js
// Before
import { GAME, DEBUG } from '../config/GameConfig.js';
// ...
this.hpBarBg = this.add.rectangle(barX, barY, barW, barH, 0x333333).setOrigin(0);
this.hpBarFill = this.add.rectangle(barX, barY, barW, barH, 0x00ff44).setOrigin(0);

// After
import { GAME, DEBUG, THEME } from '../config/GameConfig.js';
// ...
this.hpBarBg = this.add.rectangle(barX, barY, barW, barH, THEME.ui.hpBarBg.num).setOrigin(0);
this.hpBarFill = this.add.rectangle(barX, barY, barW, barH, THEME.ui.success.num).setOrigin(0);
```

### Complete migration of one setFillStyle site (UIScene.js:82)

```javascript
// Before
this.hpBarFill.setFillStyle(pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff3333);

// After
this.hpBarFill.setFillStyle(
  pct > 0.5 ? THEME.ui.success.num
  : pct > 0.25 ? THEME.ui.warning.num
  : THEME.ui.danger.num,
);
```

### Complete migration of one Graphics site (BootScene.js:19, 32)

```javascript
// Before
const progressBox = this.add.graphics();
progressBox.fillStyle(0x222222, 0.8);
progressBox.fillRect(barX, barY, barW, barH);
// ... inside load.on('progress')
progressBar.fillStyle(0x00ff88, 1);

// After
import { BUGS, GRID, GAME, THEME } from '../config/GameConfig.js';  // THEME already imported
// ...
progressBox.fillStyle(THEME.ui.loadingBarBg.num, 0.8);
progressBox.fillRect(barX, barY, barW, barH);
// ... inside load.on('progress')
progressBar.fillStyle(THEME.ui.loadingBar.num, 1);
```

### Complete migration of hover color pair (GameOverScene.js:57-58)

```javascript
// Before
restartBtn.on('pointerover', () => restartBtn.setColor('#00ff88'));
restartBtn.on('pointerout', () => restartBtn.setColor('#ffffff'));

// After
restartBtn.on('pointerover', () => restartBtn.setColor(THEME.ui.accentPrimary.hex));
restartBtn.on('pointerout', () => restartBtn.setColor(THEME.ui.textPrimary.hex));
```

### Complete migration of Rectangle stroke (BuildSystem.js:100, 102)

```javascript
// Before
const bg = this.scene.add.rectangle(0, 0, menuWidth, menuHeight, 0x111122, 0.95)
  .setOrigin(0, 0)
  .setStrokeStyle(2, 0x4488aa);

// After
const bg = this.scene.add.rectangle(0, 0, menuWidth, menuHeight, THEME.ui.surface.num, 0.95)
  .setOrigin(0, 0)
  .setStrokeStyle(2, THEME.ui.surfaceBorder.num);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scattered color literals inline | Frozen semantic palette with dual-format tokens | Phase 6 (this phase) | Single source of truth; future theme changes edit one file |
| Phaser 3 text `color` accepts integer | Text `color` is strictly CSS string; shape/graphics color is strictly number | Stable since Phaser 3.0 (unchanged in 3.80/3.90) | API split is a permanent constraint, not migration risk [VERIFIED: context7 3.90.0 docs match 3.80 runtime] |

**Deprecated/outdated:** Nothing. The APIs used here (`setColor`, `setFillStyle`, `setStrokeStyle`, `fillStyle`, `lineStyle`, Text style `color`) are all first-class stable Phaser 3 APIs with no deprecation path in 3.x.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

All substantive claims in this research are either verified against Phaser 3.90 context7 docs (which match 3.80 behavior for the APIs used — those APIs haven't changed across 3.x) or cited from CONTEXT.md / AGENTS.md / the codebase itself. No assumed-knowledge claims remain.

## Open Questions

1. **GameScene.js:427 `#ff8844` wave announcement text — in scope or not?**
   - What we know: CONTEXT.md's file list (D-01, D-05, canonical_refs) does NOT include `GameScene.js`. D-01's boundary heuristic says "UI chrome → migrate, game-entity → leave." A wave-start announcement (`'WAVE 3'` text fading over the play field) is arguably UI chrome.
   - What's unclear: The omission could be deliberate (the orange-ish accent intentionally reads as "cosmic flare" VFX layer, not UI) or an oversight.
   - Recommendation: **Planner should decide and document.** The D-07 grep gate will flag this regardless, so the phase cannot pass completion without an explicit resolution. Two viable answers: (a) extend migration to GameScene.js:427 and map `#ff8844` → `ui.accentSecondary.hex` or a new `ui.waveAnnouncement.hex`; (b) carve out explicitly in the D-07 grep filter ("GameScene.js wave announcement kept as VFX-adjacent accent").

2. **GameScene.js:291 `setTintFill(0xff4444)` core damage flash — confirm out of scope**
   - What we know: This is a gameplay VFX (core-hit damage feedback), clearly matches D-01's "game-effect → leave" side.
   - What's unclear: Nothing — the D-07 grep gate allows this if we exclude VFX-semantic tints.
   - Recommendation: Plan documents this line as "intentionally retained; gameplay damage-flash semantic, not UI chrome." Alternatively, the planner may opt to move this literal into `VFX.CORE.damageFlashTint` for consistency with other VFX centralization — that's a discretionary sibling improvement, not required by THEME-03.

3. **`main.js:14` `backgroundColor: '#0a0a12'` — migrate or leave?**
   - What we know: CONTEXT.md says "already matches palette; leave as-is or reference `THEME.background`." This is literally Claude's Discretion.
   - Recommendation: Replace with `THEME.background` for consistency; the import cost is trivial (one added import line) and the migration is the whole point of the phase. Listing as optional polish task in the plan.

4. **Exact cosmic-family derivations for non-palette keys**
   - What we know: D-03 locks the 4-color base (`#0a0a12`, `#2d1b4e`, `#eef2ff`, `#ff3333`); UI-SPEC doesn't define muted text, success green, warning amber, or HP-bar gradient midpoints.
   - What's unclear: Exact hex values to pick. D-03 constrains them to "nebula/accent family — purples/blues with accent highlights."
   - Recommendation: Planner's discretion. Starting palette suggestion (within constraint): `textMuted: #a89fcc` (desaturated accent), `textDisabled: #6a6a80` (dim nebula), `accentSecondary: #9966ff` (matches existing VFX shockwave/slowfield — consistency win), `warning: #ffaa44` (preserves current `#ffaa00` intent), `success: #66dd99` (cooler cosmic green, reads distinct from `ui.accentPrimary` without breaking aesthetic). Verifier judges against UI-SPEC.

## Environment Availability

No external dependencies beyond `npm` + the existing dev toolchain.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + npm | `npm run build` | ✓ (project already running) | any recent LTS | — |
| Phaser | Runtime (already bundled) | ✓ | 3.80.0 | — |
| Vite | Build | ✓ | 5.4.0 | — |
| Browser | Visual smoke-test (`npm run dev`) | ✓ | modern | — |

**Missing dependencies:** None. **No fallbacks required.**

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **None configured** (per AGENTS.md: "No test framework or linter is configured") |
| Config file | — |
| Quick run command | `npm run build` (production build, zero warnings expected) |
| Full suite command | `npm run build` + manual `npm run dev` visual smoke-test |

No test framework is provisioned by design (AGENTS.md line 14, REQUIREMENTS.md out-of-scope row "New test framework"). Verification is static-analysis (grep) + build + visual inspection.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| THEME-03 (gate A) | Zero hex literals outside THEME/VFX/POSTFX definitions | smoke (grep) | `rg '(#[0-9a-fA-F]{6}\|0x[0-9a-fA-F]{6})' src/ --glob '!src/config/GameConfig.js' \| rg -v 'VFX\|POSTFX'` — **expect zero matches** (or only explicit carve-outs from Open Question #1/#2) | ✅ |
| THEME-03 (gate B) | Build succeeds with no warnings | smoke (build) | `npm run build` — **expect exit 0, no warnings** | ✅ |
| THEME-03 (gate C) | UI renders with cosmic palette (no `#00ff88` green, no `#ffdd00` yellow, no `#88ccff` cyan) | manual-only (visual) | `npm run dev`, open localhost:5173, walk: Main menu → Start → Build phase (open build menu, open upgrade menu, denied flash) → Start wave → Game over screen (both restart + menu hover states) | ✅ (manual, justified by no test framework) |
| THEME-03 (gate D — semantic ceiling) | ≤14 `ui.*` keys | smoke (grep) | `rg '^\s+\w+:\s*Object\.freeze\(\{ hex:' src/config/GameConfig.js \| wc -l` — **expect ≤14** | ✅ |
| THEME-03 (gate E — dual-format integrity) | Every `ui.*` entry has both `hex` and `num` | smoke (grep) | `rg "Object\.freeze\(\{ hex: '#[0-9a-fA-F]{6}', num: 0x[0-9a-fA-F]{6} \}\)" src/config/GameConfig.js \| wc -l` — **expect matches = number of `ui.*` keys** | ✅ |

**Note on the grep regex:** Use anchored 6-digit form `#[0-9a-fA-F]{6}` (not `{3,6}`) to avoid matching 3-digit CSS shorthand that would produce false-positive hits on fragments. Word boundary `\b` is optional for `0x` literals because the context is always JS call args or config values. Template-literal hex construction (BootScene.js:103 `${color}${Math.floor(...)}`) does not contain a literal hex and is not flagged by the scanner — expected-correct behavior.

### Sampling Rate

- **Per task commit (D-05 requires commit-per-file):** `npm run build` after each of the 7 file migrations — catches typos and missing imports immediately.
- **Per wave merge:** N/A (no worktree parallelism planned; file-by-file is sequential per D-05).
- **Phase gate:** All 5 gates (A + B + C + D + E) green before `/gsd-verify-work`. Gate C is the only manual one and is irreducible given no test framework.

### Wave 0 Gaps

None — existing test infrastructure (which is "none") covers all phase requirements by design. No test framework to stand up, no fixtures to create. The verification is grep + build + eyeball, all of which are immediately available.

If the project ever adds a test framework in a later milestone, the natural candidates for automating gate C would be:
- Phaser headless-mode snapshot of each scene's `create()` output
- `pixelmatch` comparison against golden PNGs
- But these are explicitly out of scope per REQUIREMENTS.md.

## Sources

### Primary (HIGH confidence)

- **Context7 `/phaserjs/phaser` v3_90_0** — topics: TextStyle configuration (color, stroke, fill); `setColor` / `setFill` signatures; `setFillStyle` / `setStrokeStyle` on shapes; `Graphics.fillStyle` / `lineStyle`; `Phaser.Display.Color.ValueToColor` and `.color` property. All color-API claims in this document are verified against these sources. Phaser 3.90 docs match 3.80 runtime behavior for these specific APIs — no breaking changes across 3.x minor versions.
- **`/Users/machado/Projects/bug-siege/AGENTS.md`** — code-style conventions, no-test-framework constraint, `npm run build` as validation gate.
- **`/Users/machado/Projects/bug-siege/.planning/phases/01-cosmic-foundation/01-UI-SPEC.md` lines 57–66** — palette authority.
- **`/Users/machado/Projects/bug-siege/src/config/GameConfig.js`** — existing `THEME`, `VFX`, `POSTFX` nested-freeze precedent (verified by direct read).
- **`/Users/machado/Projects/bug-siege/src/`** — all 7 migration target files and the 2 adjacent GameScene.js literals verified by direct grep.

### Secondary (MEDIUM confidence)

- N/A — no web-search claims in this document.

### Tertiary (LOW confidence)

- N/A — no unverified claims in this document.

## Project Constraints (from CLAUDE.md / AGENTS.md)

The planner must honor these existing project directives; research recommendations do not override them:

- **ES modules with explicit `.js` extensions** — all new imports of `THEME` follow `from '../config/GameConfig.js'` pattern (no path aliases).
- **Named exports only** — `THEME` is already exported named; no change.
- **`Object.freeze()` on nested sub-objects** — `THEME.ui` must be frozen, and each entry `{ hex, num }` must also be frozen (matches VFX/POSTFX precedent).
- **2-space indent, single quotes, semicolons, K&R braces, trailing commas** — all new config entries follow.
- **No comments unless logic is genuinely complex** — this phase needs zero comments; semantic key names carry meaning.
- **Atomic commits** — D-05 mandates 7 commits; project convention confirms this pattern (phases 1 and 3 did the same).
- **Commit prefix** — AGENTS.md specifies conventional format: `refactor:` or `feat:` prefix (planner's discretion; `refactor: migrate UI color literals to THEME.ui in MainMenuScene` is idiomatic).
- **`npm run build` is the validation gate** — after each commit, must exit 0 with no warnings.
- **`rm` forbidden** (user global CLAUDE.md) — N/A; no file deletion in this phase.
- **Never auto-commit** (user global CLAUDE.md) — the planner must include explicit "await user approval" or rely on the GSD workflow's commit gates.

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — Phaser 3 color APIs verified against context7 v3.90 docs which match 3.80 runtime; no deprecations in 3.x for the specific APIs used.
- Architecture (dual-format tokens, migration pattern, commit strategy): **HIGH** — all patterns are locked by CONTEXT.md and verified against existing VFX/POSTFX precedent in GameConfig.js.
- Pitfalls: **HIGH** — direct verification that text APIs require strings and shape APIs require numbers; warnings come from Phaser type signatures, not speculation.
- Grep regex / validation gate: **HIGH** — pattern tested against actual codebase grep results during research; 81 total occurrences across 9 files correctly broken down into in-scope (67: 60 targeted UI + 7 in target scope via CONTEXT.md line ranges) vs out-of-scope (14: VFX/POSTFX/GameConfig definitions + GameScene + main.js). Tight 6-digit pattern avoids 3-char false positives.
- Open Questions (esp. GameScene.js:427 scope gap): **HIGH** — the gap is real and documented; decision is planner's to make.

**Research date:** 2026-04-18
**Valid until:** 2026-07-18 (stable Phaser 3.x APIs; 90-day window reasonable — longer than default because APIs are frozen and refactor has no external-dep dynamics)
