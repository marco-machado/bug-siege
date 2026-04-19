---
phase: 06-cohesive-theme
plan: 08
plan_id: 06-08
subsystem: theme-integration
tags: [theme, integration, refactor]
requirements: [THEME-03]
depends_on: [06-01]
wave: 2
tech-stack:
  added: []
  patterns:
    - "Phaser game config consuming THEME.background (CSS string, not {hex,num})"
    - "Text style color sourced from THEME.ui.warning.hex"
key-files:
  created:
    - .planning/phases/06-cohesive-theme/06-08-SUMMARY.md
  modified:
    - src/main.js
    - src/scenes/GameScene.js
decisions:
  - "Routed wave announcement '#ff8844' to THEME.ui.warning (#ffaa44) rather than adding a 15th palette key — preserves D-06 ceiling and matches caution semantics."
  - "Preserved GameScene.js:291 setTintFill(0xff4444) as VFX carve-out per D-01; core damage flash is gameplay feedback, not UI chrome."
  - "Kept THEME.background as a plain CSS string (not {hex,num}); Phaser backgroundColor accepts CSS string directly, and BootScene nebula compositing still depends on the string form."
metrics:
  duration: ~2 minutes
  tasks_completed: 2
  files_modified: 2
  completed: 2026-04-18
---

# Phase 06 Plan 08: Integration (main.js + GameScene wave announcement) Summary

One-liner: Closed the two remaining non-CONTEXT color literals — `main.js` canvas backdrop and `GameScene.js` wave-start banner now consume `THEME`, while the core damage-flash VFX stays intact.

## What Changed

### src/main.js
- Line 7 import extended: `import { GAME, THEME } from './config/GameConfig.js';`
- Line 14: `backgroundColor: '#0a0a12'` → `backgroundColor: THEME.background`
- No other lines touched; Phaser config shape unchanged.

### src/scenes/GameScene.js
- Line 2 import extended: `THEME` appended to the existing destructure from `../config/GameConfig.js`.
- Line 427 (inside `showWaveAnnouncement`): `color: '#ff8844'` → `color: THEME.ui.warning.hex` (resolves to `#ffaa44` cosmic amber).
- Line 291 `setTintFill(0xff4444)` preserved byte-for-byte — documented D-01 VFX carve-out (core damage flash is gameplay feedback, not UI chrome).
- No VFX, POSTFX, or non-color numeric literal was modified.

## Verification

```
rg "'#0a0a12'" src/main.js                             → 0 matches
rg 'backgroundColor: THEME\.background' src/main.js    → 1 match
rg "'#ff8844'" src/scenes/GameScene.js                 → 0 matches
rg 'THEME\.ui\.warning\.hex' src/scenes/GameScene.js   → 1 match
rg 'setTintFill\(0xff4444\)' src/scenes/GameScene.js   → 1 match (carve-out preserved)
npm run build                                          → exit 0, 2.07s, 20 modules
```

Build emits a pre-existing informational "chunks larger than 500 kB" notice tied to the vendored Phaser bundle — not introduced by this plan and not an error.

## Rationale Notes

- **`ui.warning` vs. a new key:** `#ff8844` and `#ffaa44` are both warm caution amber. Wave start is a "heads up, combat incoming" cue — semantically warning, not an informational accent. Adopting `ui.warning` keeps the D-06 14-key ceiling intact.
- **Why not wrap `THEME.background` in `{hex, num}`:** Plan 01 deliberately preserved the plain CSS string form because (a) Phaser's `backgroundColor` config accepts a CSS string, and (b) `BootScene.js:91` uses `ctx.fillStyle = THEME.background` during nebula compositing, which also expects a string. A `{hex, num}` upgrade would break the canvas 2D call chain and require a second migration pass.
- **Why preserve `setTintFill(0xff4444)`:** The D-01 boundary rules that "colors describing a game-entity identity or effect stay as literals." Core HP damage flash is gameplay feedback — it visually encodes "the base just took a hit." Plan 09's grep gate carves out `setTintFill` explicitly so this literal remains compliant.

## Deviations from Plan

None — both tasks executed exactly as specified.

## Self-Check: PASSED

- `src/main.js` edits confirmed via re-read (lines 7, 14).
- `src/scenes/GameScene.js` edits confirmed via re-read (lines 2, 427); line 291 verified unchanged.
- `npm run build` exits 0.
- SUMMARY.md written to `.planning/phases/06-cohesive-theme/06-08-SUMMARY.md`.
- Atomic commit to be recorded below.
