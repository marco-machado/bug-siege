---
phase: 05-atmospheric-glow
plan: 04
subsystem: scenes
tags: [phaser, postfx, vignette, static, cosmic-polish]

# Dependency graph
requires:
  - phase: 05-atmospheric-glow
    plan: 01
    provides: POSTFX frozen config (VIGNETTE block) consumed by both boundary scenes
  - phase: 05-atmospheric-glow
    plan: 03
    provides: Established Canvas-guard + POSTFX.VIGNETTE consumer pattern — plan 04 reuses shape sans tween/listener
provides:
  - Static camera vignette on MainMenuScene.cameras.main at POSTFX.VIGNETTE.buildStrength (WebGL only)
  - Static camera vignette on GameOverScene.cameras.main at POSTFX.VIGNETTE.buildStrength (WebGL only)
  - Canvas renderer fallback path logging a single '[postfx]' warning per boundary-scene entry
affects: [phase-06-audio (no coupling), phase-07-cohesive-theme (scene-level color migration — vignette attach pattern already in place)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Static-only (no tween, no listener, no stored handle) vignette attach — camera postFX disposed automatically on scene teardown
    - Identical Canvas-guard warning block reused across boundary scenes (copy-paste symmetry preserved)
    - Inline Phaser.WEBGL renderer check (no util module) per D-12

key-files:
  created: []
  modified:
    - src/scenes/MainMenuScene.js
    - src/scenes/GameOverScene.js

key-decisions:
  - "MainMenu + GameOver use POSTFX.VIGNETTE.buildStrength (0.25) — matches GameScene build-phase strength per D-14 Claude's Discretion default, avoids introducing a gameOverStrength field ahead of playtest feedback"
  - "No FX handle stored on either scene — there is no tween to kill and no shutdown hook exists; Phaser camera teardown disposes the postFX controller automatically (PATTERNS.md 'scene teardown disposes the camera and its postFX controllers automatically')"
  - "Warning string '[postfx] Canvas renderer detected — vignette disabled' uses em-dash U+2014 (not hyphen) — matches D-10/D-11 grep-matchable contract (note: uses 'vignette disabled' not 'glow disabled' per RESEARCH Example 6)"
  - "Vignette attach placed IMMEDIATELY after 'const { canvasWidth: W, canvasHeight: H } = GAME;' — top-of-create() location chosen so the camera postFX is registered before any display-list content renders, consistent with GameScene plan 03's attach ordering"

patterns-established:
  - "Static boundary-scene vignette: create()-only attach, no lifecycle tracking — distinct from GameScene's phase-reactive pattern but uses the same POSTFX.VIGNETTE config surface"
  - "Boundary-scene Canvas guard warning with 'vignette' (not 'glow') — disambiguates per-scene responsibility when scanning console output during manual QA"

requirements-completed: [THEME-05]

# Metrics
duration: 1min
completed: 2026-04-18
---

# Phase 5 Plan 4: Static Vignette on Boundary Scenes Summary

**Static POSTFX.VIGNETTE.buildStrength vignette attached to MainMenuScene and GameOverScene main cameras (WebGL only) — closing THEME-05 scene coverage from boot to game-over without introducing tweens, listeners, or stored FX handles on either scene.**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-18T00:16:04Z
- **Completed:** 2026-04-18T00:17:08Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `POSTFX` added to the existing named import in both `src/scenes/MainMenuScene.js` and `src/scenes/GameOverScene.js`
- `MainMenuScene.create()` now attaches a static vignette at `POSTFX.VIGNETTE.buildStrength` on WebGL, logs a single `[postfx] Canvas renderer detected — vignette disabled` warning on Canvas
- `GameOverScene.create()` now attaches the same static vignette with the identical Canvas warning
- Neither scene registers a `phase-changed` listener, creates a tween, or stores an FX handle — static-only per D-14
- Neither scene introduces a new `events.once('shutdown', ...)` handler — camera postFX is disposed automatically by Phaser scene teardown
- UIScene.js remains untouched (D-14 isolation preserved across the full phase)
- `npm run build` exits 0 on both tasks (Vite chunk-size advisory pre-existing, unrelated)

## Task Commits

1. **Task 1: Attach static vignette to MainMenuScene.create()** — `eaed292` (feat)
2. **Task 2: Attach static vignette to GameOverScene.create()** — `1f5aa8f` (feat)

## Files Created/Modified

- `src/scenes/MainMenuScene.js` — +9 / −1:
  - Line 2: `POSTFX` added to named import from `../config/GameConfig.js`
  - Lines 11–17: inline `isWebGL` guard + vignette attach block inserted directly after the `const { canvasWidth: W, canvasHeight: H } = GAME;` line, before `this.createStarfield(W, H);`
- `src/scenes/GameOverScene.js` — +9 / −1:
  - Line 2: `POSTFX` added to named import from `../config/GameConfig.js`
  - Lines 15–21: identical inline `isWebGL` guard + vignette attach block inserted directly after the `const { canvasWidth: W, canvasHeight: H } = GAME;` line, before `const title = won ? 'VICTORY!' : 'DEFEAT';`

## Decisions Made

- **Static-only vignette with no stored handle:** Per D-14 only GameScene gets the phase-reactive tween; MainMenu and GameOver just attach and forget. Because there is no tween to destroy and no shutdown handler exists on either scene today, there was no need to introduce lifecycle tracking — Phaser's scene teardown disposes the camera and its postFX controllers automatically (PATTERNS.md boundary-scene section).
- **`buildStrength` chosen for both boundary scenes:** D-14 Claude's Discretion explicitly defaults to `buildStrength` for consistency with GameScene build phase. RESEARCH Open Question 2 notes that a `POSTFX.VIGNETTE.gameOverStrength` field could be added post-playtest if the defeat screen feels flat — not introduced here to avoid premature config surface growth.
- **Warning string uses "vignette" not "glow":** Per RESEARCH Example 6 and the phase-scope distinction — MainMenu/GameOver only host a vignette (no turrets/core = no glow), so "glow disabled" would mislead a future reader scanning the logs about which FX the scene actually skipped.
- **Attach at top of `create()` rather than end:** Placed immediately after the `W`/`H` destructure so the camera postFX is registered before any display-list content renders — consistent with GameScene plan 03's ordering (`create()` attach happens before `startBuildPhase()`).

## Deviations from Plan

None — plan executed exactly as written. All 7 Task 1 and 7 Task 2 acceptance grep checks pass; `npm run build` exits 0 after each task; UIScene.js confirmed free of `postFX` references (cross-plan D-14 contract).

## Issues Encountered

None. Both tasks were purely additive and symmetric; the only friction was a harmless PreToolUse read-before-edit reminder fired on each file (the edits themselves succeeded and the tool returned "file state is current in your context").

## User Setup Required

None — WebGL is the default for Phaser.AUTO in `main.js:10`; the Canvas fallback is exercised only during manual QA (deferred to phase verification). No env vars, no external services, no dashboard configuration.

## Next Phase Readiness

- Phase 5 (atmospheric-glow) code-complete across all four plans:
  - Plan 01 — POSTFX config surface
  - Plan 02 — per-turret glow (base + upgrade swap + destroy teardown)
  - Plan 03 — GameScene core glow + camera vignette + phase-reactive tween + shutdown cleanup
  - Plan 04 — static vignette on MainMenu + GameOver (this plan)
- THEME-04 fully satisfied (turrets + core). THEME-05 fully satisfied (GameScene phase-reactive + MainMenu/GameOver static).
- Manual visual QA deferred to phase-end: on WebGL expect subtle edge darkening on both boundary scenes matching GameScene's build-phase vignette feel. On Canvas (via one-off `Phaser.CANVAS` flip in main.js) expect exactly one `[postfx]` warning per scene-entry with no runtime errors.
- Phase 6 (audio-atmosphere) has no coupling to vignette/glow and can proceed independently. Phase 7 (cohesive-theme) will extend the same scenes for color-palette migration; the vignette attach pattern is now established and stable.

## Self-Check: PASSED

- FOUND: `src/scenes/MainMenuScene.js` (modified — POSTFX import at line 2; vignette block at lines 12–18)
- FOUND: `src/scenes/GameOverScene.js` (modified — POSTFX import at line 2; vignette block at lines 17–23)
- FOUND: commit `eaed292` in git log (`feat(05-04): attach static vignette to MainMenuScene.create()`)
- FOUND: commit `1f5aa8f` in git log (`feat(05-04): attach static vignette to GameOverScene.create()`)
- FOUND: `.planning/phases/05-atmospheric-glow/05-04-SUMMARY.md` (this file)
- All 7 Task 1 acceptance grep checks passed (POSTFX import, isWebGL check, addVignette call, warn string, no phase-changed, no new events.once('shutdown'), build)
- All 7 Task 2 acceptance grep checks passed (same shape as Task 1 for GameOverScene.js)
- UIScene.js still contains zero `postFX` references (D-14 isolation preserved across all of Phase 5)
- `npm run build` exits 0

---
*Phase: 05-atmospheric-glow*
*Completed: 2026-04-18*
