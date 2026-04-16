---
phase: 03-juicy-combat
plan: 02
subsystem: ui
tags: [phaser3, particles, vfx, gamescene]

requires:
  - 03-01 (VFX config and particle texture)
provides:
  - showBugDeathEffect with Phaser particle emitters (per-type colors)
  - showBuildFlash with Phaser particle emitters (nebula tints)
  - showCoreShockwave expanding ring effect
affects:
  - GameScene.js (modified methods and damageCore wiring)

tech-stack:
  added: []
  patterns:
    - "Phaser add.particles with explode() for fire-and-forget burst effects"
    - "emitter.on('complete', destroy) pattern for memory-safe particle lifecycle"
    - "Graphics strokeCircle + scale tween for expanding ring shockwave"

key-files:
  created: []
  modified:
    - src/scenes/GameScene.js

key-decisions:
  - "Keep showBuildFlash name (callers reference it) but replace body with particle emitter"
  - "Ring count based on damageAmount >= 20 threshold (boss/brute hits produce 2 rings)"
  - "coreSprite position fallback to canvas center if sprite not available"

duration: 8min
completed: 2026-04-16
---

# Phase 3 Plan 02: GameScene VFX — Particle Emitters and Core Shockwave Summary

**Replaced pseudo-particle circle/rectangle tweens with Phaser particle emitters; added showCoreShockwave() Graphics ring effect wired to damageCore()**

## Performance

- **Duration:** ~8 min
- **Completed:** 2026-04-16
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Replaced `showBugDeathEffect` circle-loop with Phaser `add.particles` emitter using per-type VFX.DEATH config; boss type uses color array for multi-color burst
- Replaced `showBuildFlash` rectangle tween with Phaser `add.particles` emitter using VFX.BUILD nebula tints and upward float
- Added `showCoreShockwave(x, y, damageAmount)` — Graphics ring that tweens outward from 30px to 120px radius with fade; 2 rings for damage >= 20
- Wired `showCoreShockwave` into `damageCore()` before early-return guard so lethal hits also trigger the effect
- All emitters and rings have destroy-on-complete callbacks (no memory leaks)
- Build passes with zero errors

## Task Commits

1. **Task 1: Replace showBugDeathEffect and showBuildFlash** - `0c261d4` (feat)
2. **Task 2: Add showCoreShockwave and wire to damageCore** - `c795b60` (feat)

## Files Created/Modified

- `src/scenes/GameScene.js` — VFX import added; showBugDeathEffect, showBuildFlash replaced; showCoreShockwave added; damageCore updated

## Decisions Made

- Kept `showBuildFlash` method name unchanged (callers throughout codebase reference it), replaced body only
- Ring count threshold `damageAmount >= 20` covers boss (20) and brute (10 wall + higher core) hits
- Fallback to `GAME.canvasWidth/2, GAME.canvasHeight/2` if `coreSprite` not yet initialized

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `src/scenes/GameScene.js` exists and contains all required implementations
- Commits `0c261d4` and `c795b60` verified in git log
- `emitter.on('complete'` appears 2 times (Task 1 requirement)
- `showCoreShockwave` appears as definition (line 372) and call site (line 284)
- `strokeCircle` present (line 383)
- Build passed: `✓ built in 2.22s`
