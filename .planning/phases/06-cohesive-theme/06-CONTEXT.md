# Phase 6: Cohesive Theme - Context

**Gathered:** 2026-04-18 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate every hardcoded color literal in the UI-rendering code (menus, HUD, build/upgrade menus, game-over screen, HP bars, preload screen) to reference new semantic THEME config constants, so the whole game renders from one cosmic nebula palette. No new gameplay, no shader/glow changes (those were Phase 5), no audio. Gameplay-critical runtime tints that encode game state (bug type tints, turret type colors in VFX, flash/damage tints) stay as-is in VFX config — this phase is about UI chrome color consistency, not recoloring the play field.

</domain>

<decisions>
## Implementation Decisions

### Scope of Migration
- **D-01:** In scope — all hardcoded color literals in UI-rendering code: `MainMenuScene.js`, `BootScene.js` preloader bar, `UIScene.js`, `GameOverScene.js`, `BuildSystem.js` menus, and the Turret HP-bar fills in `Turret.js` (lines 53, 55, 405–407). Out of scope — gameplay VFX colors already centralized in `VFX`/`POSTFX` (those are phase-3/4/5 domain), procedural texture colors inside BootScene.js texture generators (bug/turret sprite tints), bug type death colors (`VFX.DEATH.*.tint`). Boundary heuristic: if a color describes UI chrome, migrate; if it describes a game-entity identity or effect, leave.

### THEME Config Expansion
- **D-02:** Expand the existing `THEME` frozen export in `GameConfig.js` (lines 136–140) into a full semantic palette. Preserve existing keys (`background`, `nebula`, `accent`) for backwards compatibility with phases 1–5, and add a new `ui` sub-object grouping UI-chrome semantics:
  - `ui.textPrimary` — default UI text (replaces `#ffffff`)
  - `ui.textMuted` — secondary labels, dim text (replaces `#668899`, `#aaaaaa`, `#445566`)
  - `ui.textDisabled` — can't-afford / disabled states (replaces `#555555`, `#444444`)
  - `ui.accentPrimary` — primary cosmic accent, hover/active state, highlights (replaces `#00ff88`, `#88ff88`)
  - `ui.accentSecondary` — informational highlights, labels (replaces `#88ccff`, `#88aacc`)
  - `ui.warning` — warning/caution (replaces `#ffdd00`, `#ffaa00`, `#ffdd44`)
  - `ui.danger` — destructive/critical (replaces `#ff3333`, `#ff4444`)
  - `ui.success` — healthy HP bar fill (replaces `#00ff44`, `#00ff00`)
  - `ui.surface` — menu panel fills (replaces `0x111122`)
  - `ui.surfaceBorder` — menu panel borders (replaces `0x4488aa`)
  - `ui.hpBarBg` — HP bar background (replaces `0x333333`)
  - `ui.gridLine` — grid overlay line (replaces `0x334455`)
  - `ui.loadingBar` — preload progress bar fill (replaces `0x00ff88`)
  - `ui.loadingBarBg` — preload box background (replaces `0x222222`)

### Palette Source of Truth
- **D-03:** The cosmic nebula palette from `01-UI-SPEC.md` is the authoritative color source:
  - Dominant `#0a0a12` → already THEME.background, keep
  - Secondary `#2d1b4e` → surface chrome (menu fills remap from `#111122` to `#2d1b4e`)
  - Accent `#eef2ff` → UI text primary, active/hover highlights
  - Destructive `#ff3333` → warnings/errors
  Map the new `ui.*` keys against this palette with cosmic derivations for states not covered (muted text = a low-alpha tint of accent; success HP = a nebula-adjacent green; warning = a warm cosmic accent that still reads as caution without clashing). Shade derivations stay inside the nebula family (purples/blues with accent highlights), no primary-color greens/yellows that break the aesthetic.

### Hex vs Numeric Notation
- **D-04:** Keep two parallel notations per entry where both are used. Phaser text styles take CSS-hex strings (`'#eef2ff'`); Graphics/Rectangle APIs take numeric (`0xeef2ff`). For each semantic role that appears in both contexts (e.g., `textPrimary` shows up in text styles and in `setColor()` calls), store the CSS-hex string as the canonical form and derive the numeric form via a small helper (`themeNum('ui.textPrimary')` → `0xeef2ff`) or store both explicitly as a `{ hex, num }` pair. **Chosen:** store both explicitly as `{ hex: '#eef2ff', num: 0xeef2ff }` to avoid per-call conversion; planner may adjust if the helper pattern reads cleaner.

### Migration Strategy (file order)
- **D-05:** Migrate in dependency order so each file can be manually verified before the next:
  1. `GameConfig.js` — expand `THEME` with new `ui` object
  2. `MainMenuScene.js` — menu title, buttons, grid overlay
  3. `BootScene.js` — preloader text + progress bar (keep runtime-texture colors untouched)
  4. `UIScene.js` — HUD text, HP bar, wave/credits labels, notification popups
  5. `GameOverScene.js` — win/lose color, button hover states, stats text
  6. `BuildSystem.js` — build menu, upgrade menu, tile highlights, error text
  7. `Turret.js` — HP bar fill thresholds (lines 53, 55, 405–407)
  Each file migration is one atomic commit; run `npm run build` after each to catch typos early.

### Semantic Reuse Policy
- **D-06:** Collapse similar hardcoded colors to the same semantic key. Examples: `#00ff88` (main menu start button, game-over restart/menu buttons, build system hover), `#88ff88` (notification popup), `#00ff44` (HP bar healthy) all currently express "positive/active/highlight" but with drift. Migrate the first two to `ui.accentPrimary` and keep `#00ff44` as `ui.success` only because HP-bar-healthy is a distinct semantic from "button hover." Rule: collapse when the intent is identical; split when there's a gameplay-state meaning (HP tiers, warnings, errors). No more than 14 semantic `ui.*` keys total to prevent palette sprawl.

### Verification Gate
- **D-07:** Completion requires: (a) grep the migrated files — zero `#[0-9a-fA-F]{3,6}` literals outside `THEME` definitions, zero `0x[0-9a-fA-F]{6}` literals outside `THEME`/`VFX`/`POSTFX` definitions; (b) visual smoke-test via `npm run dev` — menu, game, game-over screens all render without the old green/yellow/cyan accent colors; (c) success criteria #1 from ROADMAP.md is satisfied — "All hardcoded color values across 6+ files reference THEME config constants." Grep scan is the falsifiable checkpoint.

### Claude's Discretion
- Exact numeric values for derived cosmic variants (muted text, success green, warning, HP-bar gradient tiers) — planner picks within the nebula/accent family; verifier checks against UI-SPEC palette cohesion
- Whether to introduce a `themeHex()` / `themeNum()` helper or inline both forms in the config object (D-04 picks inline-both; planner may swap)
- Whether to export a flat alias map (`THEME.ui.textPrimary`) vs nested structure (`THEME.ui.text.primary`) — picks flat for brevity

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — THEME-03 defines the exact scope for this phase (one requirement, one phase)
- `.planning/ROADMAP.md` lines 89–97 — phase success criteria (hardcoded colors migrated across 6+ files, consistent cosmic palette)

### Palette Authority
- `.planning/phases/01-cosmic-foundation/01-UI-SPEC.md` lines 57–66 — canonical cosmic nebula palette (`#0a0a12`, `#2d1b4e`, `#eef2ff`, `#ff3333`); derive UI semantic keys from this spec
- `.planning/phases/01-cosmic-foundation/01-CONTEXT.md` — prior phase decisions on THEME config pattern and frozen-object convention

### Codebase (migration targets)
- `src/config/GameConfig.js` lines 136–140 — existing `THEME` export to expand
- `src/scenes/MainMenuScene.js` lines 23, 30, 37, 44, 47–48, 63, 74 — menu chrome colors
- `src/scenes/BootScene.js` lines 19, 27, 32 — preloader bar (lines 115–155 are runtime texture generation, out of scope)
- `src/scenes/UIScene.js` lines 19, 25, 33–34, 39, 48, 54, 82, 117 — HUD chrome
- `src/scenes/GameOverScene.js` lines 26, 46, 54, 57–58, 64, 67–68 — game-over chrome
- `src/systems/BuildSystem.js` lines 100, 102, 108, 115, 127, 131–132, 187, 209, 235, 258, 277, 308, 310, 316, 332, 337, 349, 376 — build/upgrade menus (19 hardcoded colors)
- `src/entities/Turret.js` lines 53, 55, 405–407 — HP bar background and tier-based fill colors
- `src/main.js` line 14 — Phaser config `backgroundColor: '#0a0a12'` already matches palette; leave as-is or reference `THEME.background`

### Out-of-scope reference (do NOT migrate)
- `src/config/GameConfig.js` lines 142–213 — `VFX.*` and `POSTFX.*` color values stay as-is (gameplay-effect semantics, already centralized)
- `src/scenes/BootScene.js` lines 115–155 — procedural texture generators for bugs/turrets/core; tints describe game entities, not UI chrome

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `THEME` frozen config (GameConfig.js:136) — already the central palette anchor; expansion target
- `01-UI-SPEC.md` cosmic palette — authoritative source for every new semantic key
- Per-phase `THEME.nebula` array — already migrated to nebula-background generator in Phase 1; pattern established for THEME-driven rendering
- Existing `setColor()` / `fillStyle()` / `setFillStyle()` / `setStrokeStyle()` call sites — straightforward literal replacements once THEME expands

### Established Patterns
- **Frozen configs with nested freezes**: `VFX` and `POSTFX` both use deep `Object.freeze()` on nested sub-objects. The new `THEME.ui` sub-object follows the same pattern (`THEME = Object.freeze({ ui: Object.freeze({ ... }) })`)
- **Hex string for text styles, numeric for Graphics**: Phaser text style config takes `color: '#eef2ff'`; `Graphics.fillStyle()` takes `0xeef2ff`. Existing codebase splits these consistently — new config entries must provide both forms
- **Per-scene setColor on hover**: `MainMenuScene.js:47`, `GameOverScene.js:57`, `BuildSystem.js:131` all use the same `pointerover`/`pointerout` pattern — migrate the color literals in-place, no structural change
- **Atomic commit per file**: Phase 1 and Phase 3 both split their plans by file/concern. This phase's 7-step migration plan maps naturally to 7 atomic commits

### Integration Points
- `GameConfig.js` export of `THEME` — expand, not replace; existing imports (`import { THEME } from ...`) continue to work after expansion
- Scene `create()` methods — all affected scenes already import from `GameConfig.js` for other configs; import path already established
- `npm run build` — only validation gate; no test framework is configured (per AGENTS.md), so build success + visual smoke-test are the acceptance criteria
- No changes needed to `main.js` beyond optionally replacing the literal `'#0a0a12'` with `THEME.background`

</code_context>

<specifics>
## Specific Ideas

- Palette source of truth is `01-UI-SPEC.md` — not arbitrary "cosmic feels right" color picks. Every new semantic key must trace back to or sit in the nebula/accent family defined there.
- Green `#00ff88` and yellow `#ffdd00` are the biggest palette leaks today — they're scattered across 4 files and break the cosmic aesthetic the hardest. Migrating these two alone covers most of the visible theming inconsistency.
- The Turret HP-bar tier gradient (green→yellow→red at 50%/25% thresholds, Turret.js:405) is gameplay-state communication, not pure UI chrome — preserve the three-tier signal, just swap the literal hex values for `ui.success` / `ui.warning` / `ui.danger`
- Semantic naming beats literal preservation: don't create `ui.green00ff88` keys; create `ui.accentPrimary`, which lets planner pick the right cosmic-nebula-compatible shade
- Grep-based completion check is the acceptance gate — if `rg "#[0-9a-fA-F]{6}|0x[0-9a-fA-F]{6}" src/` returns hits outside of `GameConfig.js`, the phase is not done

</specifics>

<deferred>
## Deferred Ideas

- Dark/light mode toggle — out of scope; single cosmic theme only for v1
- Per-wave palette shifts (intensifying nebula during boss wave) — polish idea, future milestone
- Refactoring VFX particle tints through THEME — gameplay-effect layer, different semantic, separate migration if ever needed
- Typography token consolidation — UI-SPEC defines sizes/weights but they're still inline; separate phase if pursued
- Theming the procedural bug/turret textures — would require reworking BootScene texture generators; out of scope (procedural sprites are game entities, not UI chrome)

</deferred>

---

*Phase: 06-cohesive-theme*
*Context gathered: 2026-04-18 (auto mode)*
