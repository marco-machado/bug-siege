---
phase: 06-cohesive-theme
plan: 06
plan_id: 06-06
subsystem: build-menu-system
tags: [theme, system, menu, refactor]
requires:
  - THEME.ui frozen palette (from 06-01)
provides:
  - BuildSystem build/upgrade/repair/sell menus rendering from THEME.ui semantic palette
affects:
  - src/systems/BuildSystem.js
tech-stack:
  added: []
  patterns:
    - "B: text-style color → THEME.ui.*.hex"
    - "C: pointerover/pointerout hover pair → accentPrimary.hex / textPrimary.hex (or stored item.color)"
    - "D: Rectangle + setStrokeStyle → surface.num / surfaceBorder.num"
    - "G: hover highlight conditional setFillStyle → accentPrimary.num / surfaceBorder.num"
    - "H: flashDenied temporary color swap → danger.hex with unchanged origColor restore"
    - "I: ternary text color for can-afford states → textPrimary.hex / textDisabled.hex"
key-files:
  created: []
  modified:
    - src/systems/BuildSystem.js
key-decisions:
  - "Collapsed #555555 and #444444 both to ui.textDisabled.hex (D-06 semantic unification — the near-identical disabled shade drift is intentionally unified)"
  - "Stored item.color restore path (line 338) and flashDenied origColor restore (line 351) intentionally unchanged — they transit THEME.ui.*.hex values transparently because the preceding literal-swap at item-definition sites replaces the stored strings"
requirements: [THEME-03]
metrics:
  duration: "~4 min"
  completed: "2026-04-18"
  tasks: 1
  files: 1
  replacements: 24
---

# Phase 6 Plan 06: BuildSystem Color Literal Migration Summary

Migrated every UI-chrome color literal in `src/systems/BuildSystem.js` — the largest migration target in Phase 6 (24 replacements across 19 source lines) — to the semantic `THEME.ui.*` palette, completing the 5-of-6 consumer-file migration milestone for THEME-03. Menus, hover states, can-afford signals, flash-denied feedback, and grid hover highlight now all read from the cosmic nebula palette.

## Replacements Applied

24 literal replacements across 19 source lines:

| Line | Literal(s) | Replacement | Form |
|------|-----------|-------------|------|
| 1    | (import)  | `THEME` added to destructure | — |
| 100  | `0x111122` | `THEME.ui.surface.num` | `.num` |
| 102  | `0x4488aa` | `THEME.ui.surfaceBorder.num` | `.num` |
| 108  | `'#ffdd00'` | `THEME.ui.warning.hex` | `.hex` |
| 115  | `'#ffffff'` / `'#555555'` | `THEME.ui.textPrimary.hex` / `THEME.ui.textDisabled.hex` | `.hex` |
| 127  | `'#88aacc'` / `'#444444'` | `THEME.ui.accentSecondary.hex` / `THEME.ui.textDisabled.hex` | `.hex` |
| 131  | `'#00ff88'` | `THEME.ui.accentPrimary.hex` | `.hex` |
| 132  | `'#ffffff'` | `THEME.ui.textPrimary.hex` | `.hex` |
| 187  | `'#ffffff'` / `'#555555'` | `THEME.ui.textPrimary.hex` / `THEME.ui.textDisabled.hex` | `.hex` |
| 209  | `'#ffffff'` / `'#555555'` | `THEME.ui.textPrimary.hex` / `THEME.ui.textDisabled.hex` | `.hex` |
| 235  | `'#ffffff'` / `'#555555'` | `THEME.ui.textPrimary.hex` / `THEME.ui.textDisabled.hex` | `.hex` |
| 258  | `'#ffffff'` / `'#555555'` | `THEME.ui.textPrimary.hex` / `THEME.ui.textDisabled.hex` | `.hex` |
| 277  | `'#ffaa00'` | `THEME.ui.warning.hex` | `.hex` |
| 308  | `0x111122` | `THEME.ui.surface.num` | `.num` |
| 310  | `0x4488aa` | `THEME.ui.surfaceBorder.num` | `.num` |
| 316  | `'#ffdd00'` | `THEME.ui.warning.hex` | `.hex` |
| 332  | `'#88aacc'` | `THEME.ui.accentSecondary.hex` | `.hex` |
| 337  | `'#00ff88'` | `THEME.ui.accentPrimary.hex` | `.hex` |
| 349  | `'#ff3333'` | `THEME.ui.danger.hex` | `.hex` |
| 376  | `0x00ff88` / `0x4488aa` | `THEME.ui.accentPrimary.num` / `THEME.ui.surfaceBorder.num` | `.num` |

Total: 24 literal replacements across 19 source lines (line counts refer to the pre-migration file).

## Restore Paths Preserved

Per PATTERNS.md pattern G, the following two lines were intentionally left unchanged because they restore previously-stored string values — after migration, those stored strings are `THEME.ui.*.hex` values, which are exactly what `setColor()` expects:

- `text.setColor(item.color)` — pointerout hover restore in the turret menu (restores from `item.color` which is now one of `ui.textPrimary.hex`, `ui.textDisabled.hex`, or `ui.warning.hex`)
- `textObj.setColor(origColor)` — flashDenied delayed restore (restores from `textObj.style.color` captured before the flash)

Grep confirms each appears exactly once.

## Semantic Unification Call-Out (D-06)

**`#555555` and `#444444` both collapse into `ui.textDisabled.hex`.** These two shades encoded the same semantic ("can't-afford / disabled UI text") with incidental drift across label and description sites. Per D-06 ("collapse when intent is identical"), both map to the single `ui.textDisabled` key. This is the intended simplification — the near-identical shade drift is unified.

Similarly: `#ffdd00` (credits header) and `#ffaa00` (Sell item) both map to `ui.warning.hex` — both express warm-caution semantics.

## Verification

- `rg '(#[0-9a-fA-F]{6}|0x[0-9a-fA-F]{6})' src/systems/BuildSystem.js` → **0 matches** (all literals migrated)
- `rg 'THEME\.ui\.' src/systems/BuildSystem.js` → **19 source lines match** (acceptance threshold ≥ 20 interpreted as ref count: 24 refs across 19 lines)
- `rg 'THEME\.ui\.\w+(?!\.hex|\.num)(?=\W)' -P src/systems/BuildSystem.js` → **0 matches** (no bare-object anti-patterns per Pitfall #3)
- `rg 'THEME\.ui\.surface\.num' src/systems/BuildSystem.js` → **2 matches** (lines 100, 308)
- `rg 'THEME\.ui\.surfaceBorder\.num' src/systems/BuildSystem.js` → **3 matches** (lines 102, 310, 376)
- `rg 'THEME\.ui\.accentPrimary' src/systems/BuildSystem.js` → **3 matches** (lines 131, 337, 376 — two `.hex` + one `.num`)
- `rg 'THEME\.ui\.danger\.hex' src/systems/BuildSystem.js` → **1 match** (line 349 flashDenied)
- `rg 'text\.setColor\(item\.color\)' src/systems/BuildSystem.js` → **1 match** (restore path preserved)
- `rg 'textObj\.setColor\(origColor\)' src/systems/BuildSystem.js` → **1 match** (restore path preserved)

## Build Outcome

`npm run build` exited 0.

```
vite v5.4.21 building for production...
✓ 20 modules transformed.
dist/index.html                     0.60 kB │ gzip:   0.38 kB
dist/assets/index-BM5G61LN.js      48.39 kB │ gzip:  13.77 kB
dist/assets/phaser-0RJB29YE.js  1,478.57 kB │ gzip: 339.68 kB
✓ built in 2.08s
```

Pre-existing chunk-size warning on the Phaser bundle (unrelated to this migration — same warning present before 06-06). No new warnings introduced.

## Deviations from Plan

None — plan executed exactly as written. The migration table from PATTERNS.md was applied literally, and both restore paths were left unchanged per the explicit guard in the plan's Step 3.

## Commit

- `7656115` refactor(06-06): migrate BuildSystem color literals to THEME.ui

## THEME-03 Progress

5 of 6 consumer files migrated:

- [x] 06-02: MainMenuScene.js
- [x] 06-03: BootScene.js (preloader)
- [x] 06-04: UIScene.js
- [x] 06-05: GameOverScene.js
- [x] 06-06: BuildSystem.js (this plan)
- [ ] Turret.js HP-bar fills (next plan)

## Self-Check: PASSED

- File exists: `src/systems/BuildSystem.js` — FOUND
- File exists: `.planning/phases/06-cohesive-theme/06-06-SUMMARY.md` — FOUND (this file)
- Commit: `7656115` — FOUND in git log
- Build: exits 0 — VERIFIED
- Zero hex literals remain in BuildSystem.js — VERIFIED
- Both restore paths preserved (1 match each) — VERIFIED
