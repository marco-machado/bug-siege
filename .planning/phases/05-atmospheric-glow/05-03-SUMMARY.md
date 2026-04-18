---
phase: 05-atmospheric-glow
plan: 03
subsystem: scenes
tags: [phaser, postfx, preFX, postFX, vignette, core-glow, phase-reactive, cosmic-polish]

# Dependency graph
requires:
  - phase: 05-atmospheric-glow
    plan: 01
    provides: POSTFX frozen config (GLOW.core + VIGNETTE) consumed by GameScene
  - phase: 02-living-entities
    provides: this.coreSprite with breathing scale tween in renderCore() — glow coexists with scale transforms
provides:
  - Core preFX.addGlow lifecycle on GameScene.coreSprite (WebGL only)
  - Camera vignette postFX on cameras.main at POSTFX.VIGNETTE.buildStrength
  - Phase-reactive vignette strength tween on phase-changed ('build' ↔ 'wave')
  - Extended GameScene shutdown handler (tween destroy + phase-changed listener removal + postFX clear)
  - Canvas renderer fallback path with single '[postfx]' warning
affects: [05-04-menu-vignette, phase-06-audio (no coupling)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Named-handler phase-changed listener stored on scene field for symmetric off()
    - Tween destroy-on-replace guard to prevent overlapping vignette strength tweens
    - Idempotent cameras.main.postFX.clear() in shutdown (guards against torn-down camera)
    - Inline Phaser.WEBGL renderer check (no util module) per D-12

key-files:
  created: []
  modified:
    - src/scenes/GameScene.js

key-decisions:
  - "Handler-specific events.off('phase-changed', this._onPhaseChangedVignette) used in shutdown — naked events.off('phase-changed') would remove UIScene's cross-scene listener (UIScene.js:110)"
  - "Handler stored as this._onPhaseChangedVignette (underscore prefix) — matches the _sfxCooldowns convention and signals private-to-scene usage"
  - "Vignette tween target is the FX controller itself (targets: this._vignetteFX, strength: ...) — Phaser's Vignette exposes strength as a public mutable number"
  - "Listener registration order: vignette attach + on('phase-changed') BEFORE startBuildPhase() — the first phase-changed emission triggers a redundant buildStrength→buildStrength tween (no-op visually, no leak); destroy-on-replace guard handles the next transition cleanly"
  - "Core glow handle stored on this._coreGlowFX (never read elsewhere) — no explicit clear in shutdown because sprite preFX is disposed with the sprite; cameras.main.postFX.clear() only affects camera postFX"
  - "Canvas warning string uses em-dash U+2014 not a hyphen — matches the grep-matchable contract from D-10"

patterns-established:
  - "Scene-level postFX + preFX pipeline: attach in create()/render*(), destroy tween + clear camera postFX in shutdown"
  - "Phase-reactive visual tween via named handler — reusable for future cross-phase visual transitions (e.g., screen tint during boss waves)"
  - "Renderer-guard + warn-once pattern for WebGL-only FX on entry to the scene"

requirements-completed: [THEME-04, THEME-05]

# Metrics
duration: 3min
completed: 2026-04-18
---

# Phase 5 Plan 3: GameScene Core Glow + Camera Vignette Summary

**Wired GameScene's scene-scoped post-processing: per-sprite preFX glow on `this.coreSprite` and a camera-level vignette that tweens strength on every `phase-changed` event between `buildStrength` and `waveStrength` over 600ms Sine.easeInOut — with a shutdown handler that destroys the tween, removes the named phase-changed listener, and clears main-camera postFX idempotently.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-18T00:10:12Z
- **Completed:** 2026-04-18T00:13:03Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- `POSTFX` added to the existing named import in `src/scenes/GameScene.js`
- `renderCore()` attaches a ghostly-white preFX glow (`POSTFX.GLOW.core`) to `this.coreSprite` on WebGL, coexisting with the existing breathing scale tween
- `create()` attaches `this.cameras.main.postFX.addVignette(...)` on WebGL at `buildStrength` and logs a single `[postfx] Canvas renderer detected — glow disabled` warning on Canvas
- `this._onPhaseChangedVignette` listener registered on the scene's event bus; tweens the Vignette FX controller's `strength` between build/wave targets with `POSTFX.VIGNETTE.transitionDuration` / `transitionEase`
- Destroy-on-replace guard (`if (this._vignetteTween) this._vignetteTween.destroy()`) prevents overlapping strength tweens mid-transition
- Shutdown handler extended with symmetric cleanup: specific-handler `events.off('phase-changed', this._onPhaseChangedVignette)` + tween destroy + `cameras.main.postFX.clear()`
- UIScene.js remains unchanged — critical D-14 isolation preserved (UIScene subscribes to GameScene's `phase-changed` on its own handler at UIScene.js:110)
- `npm run build` exits 0 on both tasks — no type errors, no runtime warnings beyond the pre-existing Vite chunk-size advisory

## Task Commits

1. **Task 1: Attach core glow in renderCore() + wire renderer-detection logging** — `f66fa09` (feat)
2. **Task 2: Attach camera vignette + phase-reactive tween + extend shutdown cleanup** — `06582e5` (feat)

## Files Created/Modified

- `src/scenes/GameScene.js` — +36 / −1:
  - Line 2: `POSTFX` added to named import
  - Lines 81–102: vignette attach (WebGL-gated) + phase-changed listener block inserted between `scene.launch('UIScene')` and `startBuildPhase()`
  - Lines 122–126: shutdown extensions (phase-changed off, tween destroy, postFX.clear)
  - Lines 153–158: core glow attach at end of `renderCore()` after the breathing tween

## Decisions Made

- **Named-handler pattern for phase-changed listener:** Stored as `this._onPhaseChangedVignette` instead of an anonymous arrow so shutdown can use the handler-specific `events.off(event, handler)` form. Critical because UIScene's own phase-changed subscription lives on the same GameScene event bus (UIScene.js:110) — a naked `events.off('phase-changed')` would have removed UIScene's listener, breaking the HUD phase banner.
- **Vignette tween tracking field:** `this._vignetteTween` is nulled after destroy so the shutdown guard (`if (this._vignetteTween) {...}`) stays truthful across scene restarts — mirrors the Turret.js destroy-pattern convention.
- **No explicit core glow teardown in shutdown:** Sprite preFX is GC'd with the sprite when Phaser tears down the scene's display list. `cameras.main.postFX.clear()` only affects camera-level postFX; it does not touch sprite preFX pipelines.
- **First phase-changed emission is a no-op tween:** Listener registration precedes `startBuildPhase()`, so the initial `phase-changed { phase: 'build' }` triggers a `buildStrength → buildStrength` tween. No visible effect, no leak, and the destroy-on-replace guard handles the next transition cleanly. Intentional ordering — attaching the listener first ensures no race window where a phase emission could arrive before the listener exists.
- **Inline renderer check (no util module):** Per D-12, the WebGL detection is inlined at each attach site (`const isWebGL = this.game.renderer.type === Phaser.WEBGL;`) rather than extracted to a helper — keeps the fallback branch visually co-located with the attach.

## Deviations from Plan

None — plan executed exactly as written. All 7 Task 1 and 15 Task 2 acceptance grep checks pass; `npm run build` exits 0 on both tasks; UIScene.js confirmed free of `postFX` references.

## Issues Encountered

None.

## User Setup Required

None — WebGL is the default for Phaser.AUTO in `main.js:10`; the Canvas fallback is only exercised manually via a one-off `Phaser.CANVAS` flip (deferred to phase verification).

## Next Phase Readiness

- Plan 05-04 (static vignette on MainMenuScene + GameOverScene) can reuse the same `POSTFX.VIGNETTE` shape but wires only the static attach + shutdown clear — no phase-reactive tween needed there.
- THEME-04 now fully satisfied (turrets done in 05-02 + core done here). THEME-05 fully satisfied (vignette + phase reactivity present).
- Manual visual verification deferred to phase-end: on WebGL expect a ghostly-white halo around the core, subtle edge darkening, and a visible tightening/loosening on build→wave→build transitions over ~600ms.
- FX leak smoke check deferred: `game.scene.getScene('Game').cameras.main.postFX.list.length` should stay `1` across Game→GameOver→MainMenu→Game cycles (destroy-on-replace + postFX.clear in shutdown both guard this).

## Self-Check: PASSED

- FOUND: `src/scenes/GameScene.js` (modified — POSTFX import at line 2; vignette block at lines 81–102; shutdown extensions at lines 122–126; core glow at lines 153–158)
- FOUND: commit `f66fa09` in git log (`feat(05-03): attach core glow preFX in renderCore()`)
- FOUND: commit `06582e5` in git log (`feat(05-03): attach camera vignette + phase-reactive tween + shutdown cleanup`)
- FOUND: `.planning/phases/05-atmospheric-glow/05-03-SUMMARY.md` (this file)
- All 7 Task 1 + 15 Task 2 acceptance grep checks passed
- UIScene.js still contains zero `postFX` references (D-14 isolation preserved)
- `npm run build` exits 0

---
*Phase: 05-atmospheric-glow*
*Completed: 2026-04-18*
