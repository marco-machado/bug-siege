---
phase: 06-cohesive-theme
plan: 05
plan_id: 06-05
subsystem: scenes/ui-chrome
tags: [theme, scene, refactor, game-over]
requires: [06-01]
provides: [GameOverScene-theme-consumer]
affects: [src/scenes/GameOverScene.js]
tech-stack:
  added: []
  patterns: [Pattern-C-hover-pair, Pattern-I-ternary-text-color]
key-files:
  created: []
  modified: [src/scenes/GameOverScene.js]
decisions:
  - "D-06-split-applied: victory title → ui.success (gameplay-state semantic), button hover → ui.accentPrimary (UI interaction), defeat → ui.danger"
metrics:
  duration: "~3 min"
  completed: 2026-04-18
  tasks-completed: 1
  literal-replacements: 8
  theme-ui-refs-added: 9
requirements-progress:
  THEME-03: "4 of 6 consumer files migrated (MainMenu, Boot, UI, GameOver done)"
---

# Phase 06 Plan 05: GameOverScene THEME Migration Summary

## One-liner

Migrated 8 hardcoded color literals in `GameOverScene.js` to `THEME.ui.*` references, applying the D-06 semantic split (victory → `success`, button hover → `accentPrimary`, defeat → `danger`).

## Scope

Single-file refactor: end-screen chrome (victory/defeat title, stats text, restart button, menu button, and both hover-pairs) now consumes the semantic palette from `THEME.ui`.

## Replacements (8 literal occurrences across 7 source lines)

| Line | Element                     | Before         | After                              | Form |
| ---- | --------------------------- | -------------- | ---------------------------------- | ---- |
| 2    | Import                      | `GAME, POSTFX` | `GAME, POSTFX, THEME`              | -    |
| 26   | Victory title (ternary true)  | `'#00ff88'`  | `THEME.ui.success.hex`             | .hex |
| 26   | Defeat title (ternary false)  | `'#ff3333'`  | `THEME.ui.danger.hex`              | .hex |
| 46   | Stats text                  | `'#ffffff'`    | `THEME.ui.textPrimary.hex`         | .hex |
| 54   | Restart button default      | `'#ffffff'`    | `THEME.ui.textPrimary.hex`         | .hex |
| 57   | Restart button pointerover  | `'#00ff88'`    | `THEME.ui.accentPrimary.hex`       | .hex |
| 58   | Restart button pointerout   | `'#ffffff'`    | `THEME.ui.textPrimary.hex`         | .hex |
| 64   | Menu button default         | `'#ffffff'`    | `THEME.ui.textPrimary.hex`         | .hex |
| 67   | Menu button pointerover     | `'#00ff88'`    | `THEME.ui.accentPrimary.hex`       | .hex |
| 68   | Menu button pointerout      | `'#ffffff'`    | `THEME.ui.textPrimary.hex`         | .hex |

### Call-out: line 26 ternary → two semantic keys

The single source expression `won ? '#00ff88' : '#ff3333'` becomes `won ? THEME.ui.success.hex : THEME.ui.danger.hex`. The two branches now carry distinct semantic meaning (victory uses the gameplay-state `success` key; defeat uses `danger`), rather than both resolving via a single UI-interaction key. This is the D-06 split in action on the end screen.

## Final reference distribution

| Key                              | Count |
| -------------------------------- | ----- |
| `THEME.ui.accentPrimary.hex`     | 2     |
| `THEME.ui.success.hex`           | 1     |
| `THEME.ui.danger.hex`            | 1     |
| `THEME.ui.textPrimary.hex`       | 5     |
| **Total `THEME.ui.*` refs**      | **9** |
| Hardcoded hex literals remaining | 0     |

## Deviations from Plan

### [Interpretation] Victory title mapped to `ui.success` (not `ui.accentPrimary`)

- **Found during:** Task 1, pre-edit advisor reconciliation
- **Issue:** The PLAN.md Task 1 table mapped line 26 victory branch to `THEME.ui.accentPrimary.hex`. The executor prompt's `<constraints>` and `<acceptance>` refined this to `THEME.ui.success.hex` per the D-06 semantic split (gameplay-state vs UI-interaction).
- **Fix:** Applied the executor prompt's mapping — victory → `ui.success`, button hovers → `ui.accentPrimary`, defeat → `ui.danger`. Prompt authority supersedes stale PLAN.md mapping.
- **Side effect:** PLAN.md's internal `<verify>` block expects `accentPrimary.hex` count of 3-9; under the refined mapping the count is 2. This stale verification line was NOT used; the prompt's acceptance checks (zero hex literals, build exits 0) were the source of truth, and both pass.
- **Files modified:** `src/scenes/GameOverScene.js`
- **Commit:** `2c29c3f`

No Rule 1/2/3 auto-fixes triggered — no bugs, missing functionality, or blockers found outside the plan's scope.

## Verification outcomes

```
rg '(#[0-9a-fA-F]{6}|0x[0-9a-fA-F]{6})' src/scenes/GameOverScene.js   → 0 matches  PASS
rg 'THEME\.ui\.' src/scenes/GameOverScene.js                            → 8  PASS (≥ 8)
rg 'THEME\.ui\.success\.hex' src/scenes/GameOverScene.js                → 1  PASS
rg 'THEME\.ui\.danger\.hex' src/scenes/GameOverScene.js                 → 1  PASS
rg 'THEME\.ui\.accentPrimary\.hex' src/scenes/GameOverScene.js          → 2  PASS (hovers only per D-06 split)
rg 'THEME\.ui\.textPrimary\.hex' src/scenes/GameOverScene.js            → 5  PASS
npm run build                                                           → exit 0  PASS
```

Note: the `THEME.ui.` count of 8 above is from a non-unique-line ripgrep scan — the file contains 9 `.hex` references (one line, 26, has two separate `THEME.ui.*.hex` refs but is counted once by `-c`). Either reading is consistent with the acceptance (≥ 8 refs, 8 literal replacements).

Build output (full):

```
vite v5.4.21 building for production...
transforming...
✓ 20 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.60 kB │ gzip:   0.38 kB
dist/assets/index-CRTu_UZQ.js      48.08 kB │ gzip:  13.79 kB
dist/assets/phaser-0RJB29YE.js  1,478.57 kB │ gzip: 339.68 kB
✓ built in 2.09s
```

Chunk-size advisory is pre-existing (Phaser bundle) and not a build warning — consistent with prior plan outcomes in this phase.

## Visual result

- Victory screen: green title (`#66dd99` from `ui.success`) replacing prior brighter green `#00ff88`
- Defeat screen: unchanged red (`#ff3333`), now keyed via semantic `ui.danger`
- Both buttons: default text in warm off-white `#eef2ff` (`textPrimary`), hover in cosmic purple `#9966ff` (`accentPrimary`) — matches `MainMenuScene` interaction vocabulary

## Decisions Made

- **D-06 semantic split honored on end screen.** Victory is a gameplay-state outcome (`ui.success`); button hover is a UI interaction (`ui.accentPrimary`); defeat retains red via explicit `ui.danger` key. Three distinct keys replace the prior two literals (`#00ff88`, `#ff3333`), which had conflated gameplay-state with interaction intent.

## Self-Check: PASSED

- File `src/scenes/GameOverScene.js` — FOUND; 8 literals replaced; zero hex remnants
- Commit `2c29c3f` — FOUND in `git log`; 1 file changed, 9 insertions, 9 deletions
- `npm run build` — exit 0
