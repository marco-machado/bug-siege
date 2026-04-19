---
phase: 06-cohesive-theme
plan: 01
plan_id: 06-01
subsystem: config
tags: [theme, config, refactor]
requirements: [THEME-03]
dependency-graph:
  requires: []
  provides:
    - "THEME.ui semantic palette (14 keys x {hex, num})"
  affects:
    - "src/config/GameConfig.js"
tech-stack:
  added: []
  patterns:
    - "Nested Object.freeze on THEME.ui (matches VFX/POSTFX precedent)"
    - "Dual-format color tokens ({ hex: '#rrggbb', num: 0xrrggbb }) to match Phaser's split API"
key-files:
  created: []
  modified:
    - "src/config/GameConfig.js"
decisions:
  - "Preserve THEME.background, THEME.nebula, THEME.accent unchanged for backwards compat with phases 1-5"
  - "Inline both { hex, num } per entry (no runtime conversion helper) per D-04"
  - "Cap palette at 14 semantic ui.* keys per D-06 (no palette sprawl)"
  - "Cosmic-family shade derivations only (no primary-color greens/yellows) per D-03"
metrics:
  duration: "~4 minutes"
  completed: "2026-04-18"
  tasks: "1/1"
  files_modified: 1
  commits: 1
---

# Phase 6 Plan 01: Expand THEME with ui.* Semantic Palette Summary

**One-liner:** Added 14 frozen `{ hex, num }` semantic color tokens under `THEME.ui` in `GameConfig.js` as the single source of truth for UI chrome colors consumed by Plans 02-08.

## What Was Built

Expanded the existing `THEME` export at `src/config/GameConfig.js:136-140` in place, adding a `ui` sub-object with exactly 14 semantic keys. Each key stores both a CSS-hex string (`hex`) and a numeric literal (`num`) to match Phaser's split API — text styles read `.hex`, Graphics/Rectangle APIs read `.num`. No runtime conversion required at call sites.

### Keys Added (with final values)

| Key               | hex       | num        | Replaces                                    |
| ----------------- | --------- | ---------- | ------------------------------------------- |
| `textPrimary`     | `#eef2ff` | `0xeef2ff` | `#ffffff` (UI-SPEC accent, unchanged)       |
| `textMuted`       | `#a89fcc` | `0xa89fcc` | `#668899`, `#aaaaaa`, `#445566`             |
| `textDisabled`    | `#6a6a80` | `0x6a6a80` | `#555555`, `#444444`                        |
| `accentPrimary`   | `#9966ff` | `0x9966ff` | `#00ff88`, `#88ff88` (cosmic purple)        |
| `accentSecondary` | `#88aacc` | `0x88aacc` | `#88ccff` (cool cosmic blue)                |
| `warning`         | `#ffaa44` | `0xffaa44` | `#ffdd00`, `#ffaa00`, `#ffdd44`             |
| `danger`          | `#ff3333` | `0xff3333` | `#ff3333`, `#ff4444` (UI-SPEC destructive)  |
| `success`         | `#66dd99` | `0x66dd99` | `#00ff44`, `#00ff00` (cosmic-family green)  |
| `surface`         | `#2d1b4e` | `0x2d1b4e` | `#111122` (UI-SPEC secondary)               |
| `surfaceBorder`   | `#4b2c62` | `0x4b2c62` | `#4488aa` (THEME.nebula[1])                 |
| `hpBarBg`         | `#1a1a2e` | `0x1a1a2e` | `#333333` (recessed track)                  |
| `gridLine`        | `#334455` | `0x334455` | `#334455` (current main-menu grid)          |
| `loadingBar`      | `#9966ff` | `0x9966ff` | `#00ff88` (matches accentPrimary)           |
| `loadingBarBg`    | `#1a1a2e` | `0x1a1a2e` | `#222222` (matches hpBarBg)                 |

## What Was Preserved

- `THEME.background = '#0a0a12'` — unchanged (line 137). Consumed as a CSS string by `BootScene.js:91` `ctx.fillStyle = THEME.background`. Converting to `{hex, num}` would break that contract (D-01 boundary).
- `THEME.nebula = ['#2d1b4e', '#4b2c62', '#6a4c93']` — unchanged (line 138). Frozen array of three nebula shades consumed by Phase 1 nebula-background generator.
- `THEME.accent = '#eef2ff'` — unchanged (line 139).
- `VFX` (lines 142-200) — completely untouched. Gameplay-effect color semantics stay in their own domain (D-01).
- `POSTFX` (lines 202-212) — completely untouched.

## Verification Results

| Gate                             | Expected                | Actual      | Status |
| -------------------------------- | ----------------------- | ----------- | ------ |
| Build (Gate B)                   | exit 0, no warnings     | exit 0      | PASS   |
| ui.* key count (Gate D)          | 14                      | 14          | PASS   |
| `{hex, num}` regex match (Gate E)| 14                      | 14          | PASS   |
| `THEME.background` preserved     | `'#0a0a12'` at line 137 | confirmed   | PASS   |
| `THEME.nebula` preserved         | frozen 3-shade array    | confirmed   | PASS   |
| `THEME.accent` preserved         | `'#eef2ff'` at line 139 | confirmed   | PASS   |

### Build Log

```
> bug-siege@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
 20 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.60 kB  gzip:   0.38 kB
dist/assets/index-BiZ1SoLf.js      47.76 kB  gzip:  13.73 kB
dist/assets/phaser-0RJB29YE.js  1,478.57 kB  gzip: 339.68 kB
 built in 2.10s
```

The "Some chunks are larger than 500 kB" notice is a pre-existing informational note about the Phaser bundle size — unrelated to this change and present before Phase 6.

## Commits

| Hash      | Message                                                                   |
| --------- | ------------------------------------------------------------------------- |
| `7bea5b6` | `refactor(06-01): expand THEME with ui.* semantic palette (14 keys)`     |

## Deviations from Plan

None — plan executed exactly as written. The exact 14 keys and hex values specified in the `<action>` block were emitted verbatim; no auto-fixes or auto-additions were required.

## Impact on Downstream Plans

- **Plans 02-08** (consumer migrations) can now import the expanded `THEME` and replace their hardcoded color literals with references like `THEME.ui.textPrimary.hex` / `THEME.ui.accentPrimary.num`. The single-source palette is ready.
- **Plan 09** (grep verification) can run Gate D (`rg '^\s+\w+:\s*Object\.freeze\(\{ hex:' src/config/GameConfig.js | wc -l` → expect 14) and Gate E (full `{hex, num}` regex → expect 14) without modification.
- THEME-03 progress: config layer complete; consumer migration pending Plans 02-08.

## Self-Check: PASSED

- FOUND: `src/config/GameConfig.js` (modified, 16 insertions)
- FOUND: `.planning/phases/06-cohesive-theme/06-01-SUMMARY.md` (this file)
- FOUND: commit `7bea5b6`
- FOUND: `npm run build` clean exit
- FOUND: 14 `{ hex, num }` entries matching Gate D and Gate E regexes
- FOUND: `THEME.background`, `THEME.nebula`, `THEME.accent` preserved at lines 137-139
