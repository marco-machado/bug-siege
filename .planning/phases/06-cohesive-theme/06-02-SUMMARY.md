---
phase: 06-cohesive-theme
plan: 02
plan_id: 06-02
subsystem: theme-migration
tags: [theme, scene, refactor]
requires: [06-01]
provides:
  - "Main menu UI chrome consuming THEME.ui palette"
affects:
  - src/scenes/MainMenuScene.js
tech-stack:
  patterns:
    - Pattern B (text-style `color:` -> `.hex`)
    - Pattern C (pointer-hover pair -> `.hex`)
    - Pattern F variant (graphics.lineStyle -> `.num`)
    - Import augmentation (append THEME to existing destructure)
key-files:
  modified:
    - src/scenes/MainMenuScene.js
decisions:
  - "Collapsed subtitle (#668899) and footer (#445566) to ui.textMuted per D-06 (identical semantic: dim supporting text)"
  - "Collapsed title (#00ff88) and button hover (#00ff88) to ui.accentPrimary per D-06 (identical semantic: cosmic accent)"
  - "Collapsed button default (#ffffff) and blur (#ffffff) to ui.textPrimary per D-06"
  - "Preserved starfield 0xffffff at line 74 as documented D-01 carve-out (procedural game-world art, not UI chrome)"
metrics:
  duration: "~5m"
  completed: "2026-04-18"
  tasks: 1
  files_modified: 1
---

# Phase 6 Plan 02: Migrate MainMenuScene color literals to THEME.ui Summary

**One-liner:** Replaced 7 hardcoded UI-chrome color literals in `MainMenuScene.js` with `THEME.ui.*` references (hex for text APIs, num for Graphics APIs), unifying the main menu under the cosmic nebula palette.

## Scope

Single-file refactor migrating literals on lines 23, 30, 37, 44, 47, 48, 63 in `src/scenes/MainMenuScene.js`, plus an import extension on line 2. No structural changes, no API surface changes.

## Replacements

| Line | Before (literal) | After (THEME.ui ref) | API form |
|------|------------------|----------------------|----------|
| 2 | `import { GAME, POSTFX } from '../config/GameConfig.js';` | `import { GAME, POSTFX, THEME } from '../config/GameConfig.js';` | — |
| 23 | `gridG.lineStyle(1, 0x334455, 0.15)` | `gridG.lineStyle(1, THEME.ui.gridLine.num, 0.15)` | `.num` (Pattern F variant) |
| 30 | `color: '#00ff88'` (title) | `color: THEME.ui.accentPrimary.hex` | `.hex` (Pattern B) |
| 37 | `color: '#668899'` (subtitle) | `color: THEME.ui.textMuted.hex` | `.hex` (Pattern B) |
| 44 | `color: '#ffffff'` (start button default) | `color: THEME.ui.textPrimary.hex` | `.hex` (Pattern B) |
| 47 | `startBtn.setColor('#00ff88')` (pointerover) | `startBtn.setColor(THEME.ui.accentPrimary.hex)` | `.hex` (Pattern C) |
| 48 | `startBtn.setColor('#ffffff')` (pointerout) | `startBtn.setColor(THEME.ui.textPrimary.hex)` | `.hex` (Pattern C) |
| 63 | `color: '#445566'` (footer) | `color: THEME.ui.textMuted.hex` | `.hex` (Pattern B) |

## D-01 Carve-out Preserved

Line 74 in `createStarfield()`:

```javascript
g.fillStyle(0xffffff, alpha);
```

Retained as-is per D-01 boundary (procedural game-world art, not UI chrome). Confirmed by the per-line migration table in `06-PATTERNS.md` line 41.

## Verification

### Build

```
> bug-siege@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
[OK] 20 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.60 kB | gzip:   0.38 kB
dist/assets/index-BuZwHIwf.js      47.84 kB | gzip:  13.75 kB
dist/assets/phaser-0RJB29YE.js  1,478.57 kB | gzip: 339.68 kB

(!) Some chunks are larger than 500 kB after minification. [standard Phaser bundle info, pre-existing]
[OK] built in 2.07s
```

Build exits 0. The chunk-size advisory is Vite's standard notice about the Phaser bundle (pre-existing, unrelated to this migration).

### Grep scans

- `rg '(#[0-9a-fA-F]{6}|0x[0-9a-fA-F]{6})' src/scenes/MainMenuScene.js` returns exactly one match — line 74 starfield `0xffffff` (the documented D-01 carve-out). All 7 target literals removed.
- `rg -c 'THEME\.ui\.' src/scenes/MainMenuScene.js` returns `7` (one per migrated literal, matches success criteria).
- `rg "import.*THEME.*from '\.\./config/GameConfig\.js'" src/scenes/MainMenuScene.js` returns 1 match on line 2.

### Acceptance checklist

- [x] All 7 in-scope literals replaced with THEME.ui.* references
- [x] Correct API form per call site (text APIs .hex, Graphics APIs .num)
- [x] Starfield carve-out at line 74 preserved
- [x] `npm run build` exits 0 with no migration-related warnings
- [x] Atomic commit on main branch
- [x] No edits outside the 7 literal lines + import line

## Deviations from Plan

None - plan executed exactly as written.

## Commit

- **Hash:** `7f98410`
- **Subject:** `refactor(06-02): migrate MainMenuScene color literals to THEME.ui`

## Visual Outcome (expected on next smoke test)

- Title "BUG SIEGE" renders in cosmic purple (#9966ff) instead of neon green (#00ff88)
- Subtitle "TOWER DEFENSE" and footer render in muted purple-grey (#a89fcc) instead of drifted steel-blue tones
- Start button hover transitions between cosmic purple accent and primary text white (#eef2ff)
- Grid overlay unchanged chromatically (gridLine still `#334455`; the literal now sourced from THEME)
- Starfield procedural dots unchanged (still `0xffffff` by design)

## Self-Check: PASSED

- File exists: `src/scenes/MainMenuScene.js` [FOUND]
- Commit exists: `7f98410` [FOUND in `git log --oneline`]
- SUMMARY written at: `.planning/phases/06-cohesive-theme/06-02-SUMMARY.md`
