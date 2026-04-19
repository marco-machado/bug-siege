---
phase: 06-cohesive-theme
plan: 03
plan_id: 06-03
subsystem: theme
tags: [theme, scene, refactor]
requires: [06-01]
provides:
  - "BootScene preloader UI consuming THEME.ui palette"
affects:
  - src/scenes/BootScene.js
tech-stack:
  added: []
  patterns:
    - "THEME.ui.<key>.num for graphics.fillStyle() numeric API"
    - "THEME.ui.<key>.hex for Phaser text style color property"
key-files:
  created: []
  modified:
    - src/scenes/BootScene.js
decisions: []
metrics:
  duration: "~2 min"
  completed: "2026-04-18"
  tasks: 1
  files: 1
  commits: 1
---

# Phase 06 Plan 03: Migrate BootScene Preloader to THEME.ui Summary

Migrated the three preloader color literals in `src/scenes/BootScene.js` (progress-box fill, "Loading..." text color, progress-bar fill) to reference `THEME.ui.loadingBarBg.num`, `THEME.ui.accentPrimary.hex`, and `THEME.ui.loadingBar.num`. Procedural texture generators at lines 115-158 left completely untouched per D-01. Preloader now renders the cosmic purple accent instead of the legacy `#00ff88` green.

## What Was Done

### Task 1: Migrate BootScene preloader (3 literals) to THEME.ui.*

Applied three targeted string replacements in `src/scenes/BootScene.js`:

| Line | Before                             | After                                     | API shape                     |
| ---- | ---------------------------------- | ----------------------------------------- | ----------------------------- |
| 19   | `progressBox.fillStyle(0x222222, 0.8)` | `progressBox.fillStyle(THEME.ui.loadingBarBg.num, 0.8)` | `graphics.fillStyle(num, alpha)` — `.num` |
| 27   | `color: '#00ff88'`                 | `color: THEME.ui.accentPrimary.hex`       | text-style CSS string — `.hex` |
| 32   | `progressBar.fillStyle(0x00ff88, 1)` | `progressBar.fillStyle(THEME.ui.loadingBar.num, 1)` | `graphics.fillStyle(num, alpha)` — `.num` |

**Import:** `src/scenes/BootScene.js:2` already destructured `THEME` from `GameConfig.js` (Phase 1 precedent — `THEME.background` and `THEME.nebula` already in use at lines 91 and 99). No import edit required.

**Carve-out preserved:** Lines 115-158 (`generateParticleTextures()` and `generateFallback()`) unchanged. Those literals (`0xffffff` particle fill, `0xff00ff` magenta fallback, `0x1a1a2e` background fallback) are per-pixel texture data for game-entity sprites, not UI chrome — D-01 boundary, 06-PATTERNS.md line 51.

**API-to-form rule applied:**
- Lines 19 and 32 use `Phaser.GameObjects.Graphics.fillStyle(color, alpha)` which takes a numeric color → `.num`
- Line 27 is a Phaser text style `color:` property which takes a CSS hex string → `.hex`

**Visual intent:** The preloader now renders the progress box against a recessed nebula backdrop (`#1a1a2e`), with the progress-bar fill and "Loading..." text in cosmic purple (`#9966ff`). The green `#00ff88` accent is eliminated from the loading screen, aligning it with the palette established in Phase 06-01.

## Verification

```bash
# Preloader block (lines 15-40) — zero literals remaining
$ rg -n '(#[0-9a-fA-F]{6}|0x[0-9a-fA-F]{6})' src/scenes/BootScene.js | awk -F: '$2 <= 40'
(no output — clean)

# Only remaining literals are inside the texture-generator carve-out (lines 115-155)
$ rg -n '(#[0-9a-fA-F]{6}|0x[0-9a-fA-F]{6})' src/scenes/BootScene.js
115:    g.fillStyle(0xffffff, 1);
119:    g.fillStyle(0xffffff, 0.6);
121:    g.fillStyle(0xffffff, 1);
137:    const magenta = 0xff00ff;
155:      g.fillStyle(0x1a1a2e, 1);

# THEME.ui refs — exactly 3, at the expected preloader lines
$ rg -n 'THEME\.ui\.' src/scenes/BootScene.js
19:    progressBox.fillStyle(THEME.ui.loadingBarBg.num, 0.8);
27:      color: THEME.ui.accentPrimary.hex,
32:      progressBar.fillStyle(THEME.ui.loadingBar.num, 1);

# Build
$ npm run build
✓ 20 modules transformed.
✓ built in 2.01s
(exit 0, no errors, no warnings beyond the pre-existing 500kB chunk-size notice)

# Texture generators (lines 115-158) — diff is empty for that region
$ git diff HEAD~1 HEAD -- src/scenes/BootScene.js | grep -E '^[+-].*0x(ffffff|ff00ff|1a1a2e)'
(no output — carve-out preserved)
```

All acceptance criteria pass:

- [x] Preloader literals at lines 19, 27, 32 replaced with `THEME.ui` refs
- [x] Procedural-texture block colors (lines 115-158) preserved byte-for-byte
- [x] `npm run build` exits 0
- [x] Atomic commit `5e31b50` — single file, 3 insertions, 3 deletions
- [x] `rg 'THEME\.ui\.loadingBarBg\.num' src/scenes/BootScene.js` → 1 match
- [x] `rg 'THEME\.ui\.loadingBar\.num' src/scenes/BootScene.js` → 1 match
- [x] `rg 'THEME\.ui\.accentPrimary\.hex' src/scenes/BootScene.js` → 1 match

## Deviations from Plan

None — plan executed exactly as written.

## Commits

- `5e31b50` — `refactor(06-03): migrate BootScene preloader color literals to THEME.ui`

## THEME-03 Progress

2 of 6 consumer files migrated (`MainMenuScene.js` in 06-02, `BootScene.js` preloader in 06-03). Remaining: `UIScene.js`, `GameOverScene.js`, `BuildSystem.js`, `Turret.js`.

## Self-Check: PASSED

- File `src/scenes/BootScene.js` — FOUND (modified, 3 replacements confirmed via diff)
- Commit `5e31b50` — FOUND (`git log --oneline -1` → `5e31b50 refactor(06-03): migrate BootScene preloader color literals to THEME.ui`)
- SUMMARY file — written at `.planning/phases/06-cohesive-theme/06-03-SUMMARY.md`
