---
phase: 06-cohesive-theme
plan: 07
plan_id: 06-07
subsystem: entities
tags: [theme, entity, hp-bar, refactor]
requirements: [THEME-03]
dependency_graph:
  requires:
    - 06-01  # THEME.ui palette defined in GameConfig.js
  provides:
    - turret-hp-bar-uses-theme-ui
  affects:
    - src/entities/Turret.js
tech-stack:
  added: []
  patterns:
    - pattern-d-rectangle-constructor-num
    - pattern-e-mirror-hp-tier-reassignment
key-files:
  created: []
  modified:
    - src/entities/Turret.js
decisions:
  - "0x00ff00 (Turret healthy green) and 0x00ff44 (UIScene healthy green) collapsed into THEME.ui.success per D-06 unification"
  - "Three-tier gameplay signal (success/warning/danger) preserved — kept as distinct semantic keys, not collapsed"
  - "VFX tints (type-color overlay line 260, upgrade tint lines 328/339, damage-flash line 335) left untouched per D-01 boundary"
metrics:
  duration: "~3 min"
  completed: "2026-04-18"
commits:
  - hash: 2086b92
    message: "refactor(06-07): migrate Turret HP bar color literals to THEME.ui"
---

# Phase 6 Plan 7: Turret HP Bar THEME Migration Summary

Migrated the 5 HP-bar color literals in `src/entities/Turret.js` (lines 53, 55, 405–407) to `THEME.ui.*` constants — the last of the 6 primary consumer files in the THEME-03 scope.

## What Changed

### Import

`src/entities/Turret.js:2`

**Before:**
```javascript
import { GRID, TURRETS, ECONOMY, VFX } from '../config/GameConfig.js';
```

**After:**
```javascript
import { GRID, TURRETS, ECONOMY, VFX, THEME } from '../config/GameConfig.js';
```

### Literal Replacements (5 sites, Pattern D + Pattern E)

| Line | Before                          | After                          | Semantic   |
| ---- | ------------------------------- | ------------------------------ | ---------- |
| 53   | `0x333333` (hpBarBg fill)       | `THEME.ui.hpBarBg.num`         | hpBarBg    |
| 55   | `0x00ff00` (hpBarFill initial)  | `THEME.ui.success.num`         | success    |
| 405  | `let color = 0x00ff00`          | `let color = THEME.ui.success.num` | success    |
| 406  | `color = 0xff3333` (≤25% HP)    | `color = THEME.ui.danger.num`  | danger     |
| 407  | `color = 0xffaa00` (≤50% HP)    | `color = THEME.ui.warning.num` | warning    |

All 5 sites use the `.num` form (Rectangle constructor and `setFillStyle(color)` both take numeric color arguments per Phaser v3.90).

### D-06 Unification Call-out

Turret's `0x00ff00` and UIScene's `0x00ff44` (migrated in Plan 06-04) were two drift-green literals expressing the same "healthy HP bar fill" semantic. Both now resolve to `THEME.ui.success.num` (`0x66dd99`, cosmic-family nebula green from Plan 06-01). The resulting green is a single unified cosmic shade across all HP bars (turrets and core). No `ui.successTurret` second-key was introduced — per D-06 "collapse when intent is identical."

## VFX Carve-outs (Preserved per D-01)

The following literals in `Turret.js` describe gameplay-entity identity, not UI chrome — they were **intentionally not migrated**:

| Line | Literal(s)                                                 | Purpose                                    |
| ---- | ---------------------------------------------------------- | ------------------------------------------ |
| 260  | `{ blaster: 0xffaa44, zapper: 0xaa44ff, slowfield: 0x9966ff }` | `showRange()` per-turret-type overlay color |
| 328  | `0xffdd44`                                                 | Upgrade tint (applied on upgrade)          |
| 335  | `0xff4444`                                                 | Damage flash (`flashDamage()` setTintFill) |
| 339  | `0xffdd44`                                                 | Upgrade tint re-apply after damage flash   |

Grep-verified all four lines byte-for-byte unchanged.

## Deviations from Plan

None — plan executed exactly as written. Five literal swaps + one import extension, scope limited to lines 2, 53, 55, 405, 406, 407.

## Verification

```bash
# Original HP-bar literals gone
$ rg '(0x333333|0x00ff00|0xff3333|0xffaa00)' src/entities/Turret.js
(no matches)

# Semantic keys present with correct counts
$ rg 'THEME\.ui\.hpBarBg\.num' src/entities/Turret.js      # 1 match (line 53)
$ rg 'THEME\.ui\.success\.num' src/entities/Turret.js      # 2 matches (lines 55, 405)
$ rg 'THEME\.ui\.warning\.num' src/entities/Turret.js      # 1 match (line 407)
$ rg 'THEME\.ui\.danger\.num' src/entities/Turret.js       # 1 match (line 406)

# Import
$ rg "import.*THEME.*from '\.\./config/GameConfig\.js'" src/entities/Turret.js   # 1 match (line 2)

# VFX carve-outs preserved (sanity)
$ rg '0xffaa44|0xaa44ff|0x9966ff|0xffdd44|0xff4444' src/entities/Turret.js
260:    const colors = { blaster: 0xffaa44, zapper: 0xaa44ff, slowfield: 0x9966ff };
328:    this.sprite.setTint(0xffdd44);
335:    this.sprite.setTintFill(0xff4444);
339:        this.sprite.setTint(0xffdd44);

# Build
$ npm run build   # exits 0, no warnings (the pre-existing Phaser chunk-size note is informational, not a warning)
```

## Build Log Outcome

`npm run build` exited 0. Vite transformed 20 modules and produced:
- `dist/index.html` 0.60 kB
- `dist/assets/index-D30ZNo_Y.js` 48.43 kB
- `dist/assets/phaser-0RJB29YE.js` 1,478.57 kB (pre-existing Phaser bundle — unchanged by this plan)

Built in 2.03s. No errors, no warnings attributable to this change.

## THEME-03 Progress

6 of 6 primary consumer files migrated (MainMenu, Boot preloader, UIScene, GameOver, BuildSystem, Turret). THEME-03 primary scope is now complete; follow-up plans (06-08, 06-09) cover the residual open questions from research (GameScene wave-announcement text, main.js Phaser backgroundColor).

## Self-Check: PASSED

- `src/entities/Turret.js:2` — THEME import present: FOUND
- `src/entities/Turret.js:53` — `THEME.ui.hpBarBg.num` present: FOUND
- `src/entities/Turret.js:55` — `THEME.ui.success.num` present: FOUND
- `src/entities/Turret.js:405` — `THEME.ui.success.num` present: FOUND
- `src/entities/Turret.js:406` — `THEME.ui.danger.num` present: FOUND
- `src/entities/Turret.js:407` — `THEME.ui.warning.num` present: FOUND
- Commit `2086b92`: FOUND (`git log --oneline | grep 2086b92`)
- VFX carve-outs at lines 260, 328, 335, 339: all four FOUND byte-for-byte unchanged
- `npm run build` exit code: 0
