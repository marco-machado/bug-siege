---
phase: 06-cohesive-theme
plan: 04
plan_id: 06-04
subsystem: scenes/ui
tags: [theme, scene, hud, refactor]
requirements: [THEME-03]
dependency_graph:
  requires:
    - THEME.ui palette from 06-01 (GameConfig.js)
  provides:
    - HUD overlay rendering from THEME.ui.* semantic palette
  affects:
    - src/scenes/UIScene.js
tech_stack:
  added: []
  patterns:
    - "Pattern B — text-style color .hex"
    - "Pattern D — Rectangle constructor .num"
    - "Pattern E — HP tier ternary (success/warning/danger) .num"
key_files:
  created: []
  modified:
    - src/scenes/UIScene.js
key_decisions:
  - "D-06 split preserved: HP tier ternary uses success/warning/danger distinct semantics — gameplay-state signal, not UI chrome"
  - "D-06 collapse applied: '#00ff88' start-wave + '#88ff88' debug text both → ui.accentPrimary (identical active/positive intent)"
  - "D-07 carve-out: debug overlay backgroundColor '#000000aa' (8-digit RGBA) retained — outside 6-digit grep anchor"
metrics:
  completed: 2026-04-18
  tasks: 1
  files_modified: 1
  commit: 8bd6fc8
---

# Phase 6 Plan 4: Migrate UIScene Color Literals to THEME.ui Summary

Migrated 9 UI-chrome color literals in `src/scenes/UIScene.js` (HUD overlay) to semantic `THEME.ui.*` references, preserving the HP-bar three-tier gameplay-state signal (success → warning → danger at 50% / 25% HP ratios) per D-06 semantic-split rule. Third of six consumer files complete for THEME-03.

## What Was Built

The HUD overlay (wave counter, credits, HP bar + label, build-phase text, start-wave button, debug overlay) now reads colors from the cosmic palette in `GameConfig.THEME.ui` instead of scattered hex literals. The HP bar's healthy/warning/critical tiers still render distinct colors — just sourced from semantic keys (`success`/`warning`/`danger`) rather than `0x00ff44`/`0xffaa00`/`0xff3333`.

## Migration Table

| Line (pre-edit) | API context                          | Before                | After                            | Form |
| --------------- | ------------------------------------ | --------------------- | -------------------------------- | ---- |
| 2               | `import { GAME, DEBUG }`             | no THEME              | `{ GAME, DEBUG, THEME }`         | —    |
| 19              | wave text style `color:`             | `'#ffffff'`           | `THEME.ui.textPrimary.hex`       | .hex |
| 25              | credits text style `color:`          | `'#ffdd00'`           | `THEME.ui.warning.hex`           | .hex |
| 33              | `rectangle(..., fill)` hpBarBg       | `0x333333`            | `THEME.ui.hpBarBg.num`           | .num |
| 34              | `rectangle(..., fill)` hpBarFill     | `0x00ff44`            | `THEME.ui.success.num`           | .num |
| 39              | hp label text style `color:`         | `'#aaaaaa'`           | `THEME.ui.textMuted.hex`         | .hex |
| 48              | phase text style `color:`            | `'#88ccff'`           | `THEME.ui.accentSecondary.hex`   | .hex |
| 54              | start-wave btn text style `color:`   | `'#00ff88'`           | `THEME.ui.accentPrimary.hex`     | .hex |
| 82 (branch 1)   | `setFillStyle(...)` HP tier > 0.5    | `0x00ff44`            | `THEME.ui.success.num`           | .num |
| 82 (branch 2)   | `setFillStyle(...)` HP tier > 0.25   | `0xffaa00`            | `THEME.ui.warning.num`           | .num |
| 82 (branch 3)   | `setFillStyle(...)` HP tier <= 0.25  | `0xff3333`            | `THEME.ui.danger.num`            | .num |
| 117             | debug overlay text style `color:`    | `'#88ff88'`           | `THEME.ui.accentPrimary.hex`     | .hex |

Count: **9 source lines** / **11 literal replacements** (line 82 ternary expanded to three branches, plus the import line).

## HP Tier Ternary — D-06 Semantic Split Preserved

Line 82 was a nested ternary with three distinct gameplay-state meanings. Per D-06 ("split when there's a gameplay-state meaning — HP tiers"), these remain three separate semantic keys rather than collapsing:

```javascript
this.hpBarFill.setFillStyle(
  pct > 0.5 ? THEME.ui.success.num
    : pct > 0.25 ? THEME.ui.warning.num
      : THEME.ui.danger.num,
);
```

This mirrors the pattern that Plan 07 will apply to `Turret.js:405–407` (which will unify `0x00ff00` → `ui.success.num`, collapsing the drift-green between the two HP-bar consumers).

## Carve-Out: Debug Overlay 8-digit RGBA

Line 122 (post-edit) retains `backgroundColor: '#000000aa'` — an 8-digit CSS RGBA string (6 hex + 2 alpha) used by Phaser's text `backgroundColor` property for the debug overlay's semi-transparent backdrop. This is intentionally NOT migrated because:

1. D-07 completion grep anchors on 6-digit form `#[0-9a-fA-F]{6}`; the trailing alpha bytes extend this literal past the anchor.
2. It is debug-only (guarded by `DEBUG.enableDebugKeys`), not a player-facing UI-chrome color.
3. Per 06-PATTERNS.md lines 69–70, planner recommendation was to leave as intentional carve-out.

## Semantic Collapse Applied

- `#00ff88` (start-wave button, line 54) and `#88ff88` (debug text, line 117) both expressed "active/positive accent" with drift. Both now map to `ui.accentPrimary`. Debug text shifts slightly from neon-green toward the cosmic purple family — intentional per D-06 ("collapse when intent is identical").
- `#ffdd00` (credits, line 25) → `ui.warning`: "keep-an-eye-on-spending" caution semantic, distinct from `ui.success` (healthy HP).
- `#aaaaaa` (HP label, line 39) → `ui.textMuted`: supporting label.

## Deviations from Plan

None — plan executed exactly as written. All 9 literal sites replaced with the exact semantic keys specified in 06-PATTERNS.md Call-Site Inventory lines 57–67. The HP tier ternary was formatted slightly (nested ternary on three indented lines instead of plan's two-space hanging indent) for readability within a `setFillStyle(...)` call; no semantic difference.

## Verification

```text
$ npm run build
vite v5.4.21 building for production...
✓ 20 modules transformed.
dist/index.html                     0.60 kB │ gzip:   0.38 kB
dist/assets/index-tW__6byi.js      47.99 kB │ gzip:  13.78 kB
dist/assets/phaser-0RJB29YE.js  1,478.57 kB │ gzip: 339.68 kB
✓ built in 2.06s
→ exit 0, no errors

$ rg '#[0-9a-fA-F]{6}[^a-fA-F0-9]' src/scenes/UIScene.js
→ no matches (8-digit '#000000aa' correctly excluded by the anchor)

$ rg '0x[0-9a-fA-F]{6}' src/scenes/UIScene.js
→ no matches

$ rg 'THEME\.ui\.' src/scenes/UIScene.js | wc -l
→ 11 (≥ 9 required)

$ rg "backgroundColor: '#000000aa'" src/scenes/UIScene.js
→ 1 match (carve-out preserved)

$ rg 'THEME\.ui\.success\.num' src/scenes/UIScene.js  →  2 matches (line 34 initial + line 82 branch)
$ rg 'THEME\.ui\.warning\.num' src/scenes/UIScene.js  →  1 match  (line 82 middle branch)
$ rg 'THEME\.ui\.danger\.num'  src/scenes/UIScene.js  →  1 match  (line 82 last branch)
```

All acceptance criteria from the plan satisfied.

## Commit

- `8bd6fc8` — refactor(06-04): migrate UIScene HUD color literals to THEME.ui

## THEME-03 Progress

3 of 6 consumer files migrated (06-02 MainMenuScene, 06-03 BootScene preloader, 06-04 UIScene). Remaining: GameOverScene (06-05), BuildSystem (06-06), Turret (06-07).

## Self-Check: PASSED

- [x] `src/scenes/UIScene.js` modified — verified via git diff
- [x] Commit `8bd6fc8` exists — verified via `git log --oneline -1`
- [x] `npm run build` exits 0 — verified in verification block
- [x] HP tier ternary uses three distinct semantic keys — verified via grep
- [x] 8-digit RGBA carve-out preserved — verified via grep
- [x] Zero 6-digit hex / `0x......` literals in file — verified via grep
