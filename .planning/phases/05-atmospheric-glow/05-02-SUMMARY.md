---
phase: 05-atmospheric-glow
plan: 02
subsystem: entities
tags: [phaser, postfx, preFX, glow, turret, cosmic-polish]

# Dependency graph
requires:
  - phase: 05-atmospheric-glow
    plan: 01
    provides: POSTFX.GLOW per-turret-type frozen config (blaster/zapper/slowfield + core)
  - phase: 02-living-entities
    provides: Turret composite class with this.sprite + idle alpha pulse (tween targets this.sprite)
provides:
  - Per-sprite WebGL glow on blaster/zapper/slowfield turrets via preFX.addGlow
  - Upgrade-path glow-color mutation (this.glowFX.color = upgraded)
  - preFX.clear() lifecycle cleanup before sprite.destroy()
affects: [05-03-gamescene-postfx, 05-04-menu-vignette]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Composite-entity preFX attach targets this.sprite, never this
    - Renderer-guarded FX attach via `scene.game.renderer.type === Phaser.WEBGL`
    - Mutable FX controller property swap (Glow.color) preferred over clear+re-add
    - Existence-guard teardown pattern (if (this.sprite && this.sprite.preFX) clear())

key-files:
  created: []
  modified:
    - src/entities/Turret.js

key-decisions:
  - "POSTFX added to existing named-import destructure in Turret.js (not a separate import line) per CLAUDE.md ES-modules convention and the plan's explicit rule"
  - "Glow attached to this.sprite.preFX immediately after sprite creation, before wallBody setup — maintains narrative order of construction"
  - "Upgrade path uses direct property mutation (this.glowFX.color = ...) rather than preFX.clear()+addGlow() — RESEARCH Pattern 2, zero allocation, preserves stored handle"
  - "preFX.clear() call placed inside destroy() BEFORE this.sprite.destroy() with && existence guard that also covers Canvas (preFX null) case"
  - "this.glowFX stored as public (non-underscore) handle because upgrade() reads it outside the constructor — mirrors auraTween/auraRing convention"

patterns-established:
  - "Per-entity WebGL glow lifecycle: constructor attach → upgrade mutate → destroy clear — reusable for the core sprite in plan 03"
  - "isWebGL local-const guard in composite-entity constructors: `const isWebGL = scene.game.renderer.type === Phaser.WEBGL;` (takes scene via ctor arg, not this.scene)"

requirements-completed: [THEME-04]

# Metrics
duration: 1min
completed: 2026-04-18
---

# Phase 5 Plan 2: Turret Glow Lifecycle Summary

**Wired the full WebGL glow lifecycle on Turret.sprite — per-type addGlow on construction, color mutation on upgrade, and preFX.clear() on destroy — all gated by renderer type and `type !== 'wall'` so Canvas and walls remain untouched.**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-18T00:05:36Z
- **Completed:** 2026-04-18T00:06:45Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- `POSTFX` added to the existing named import from `../config/GameConfig.js` in Turret.js
- Constructor attaches `this.glowFX = this.sprite.preFX.addGlow(cfg.base, cfg.outerStrength, cfg.innerStrength)` with mandatory `setPadding(cfg.padding)` — gated by `isWebGL && type !== 'wall'`
- Upgrade path mutates `this.glowFX.color = POSTFX.GLOW[this.type].upgraded` directly (no reallocation) — guarded by `if (this.glowFX)` to cover Canvas and wall cases
- Destroy path calls `this.sprite.preFX.clear()` before `this.sprite.destroy()` — guarded by `if (this.sprite && this.sprite.preFX)` to be safe on Canvas (preFX null)
- `npm run build` passes with zero errors after each task
- Existing behavior (idle alpha pulse, upgrade `0xffdd44` tint, damage flash, slowfield aura) untouched

## Task Commits

1. **Task 1: Attach per-type glow in constructor + clear in destroy()** — `6fd90b3` (feat)
2. **Task 2: Swap glow color on turret upgrade** — `66316b8` (feat)

## Files Created/Modified

- `src/entities/Turret.js` — 15 insertions, 1 deletion across three locations:
  - Line 2: extended named-import destructure with POSTFX
  - Lines 24-29: constructor glow attach block (isWebGL + type guard, setPadding + addGlow, stores this.glowFX)
  - Lines 337-339: upgrade() color mutation (before `return true;`)
  - Lines 378-380: destroy() preFX.clear() guarded block (before `this.sprite.destroy()`)

## Decisions Made

- Followed plan verbatim — no discretionary changes or deviations from the written action steps
- Constructor block placed immediately after `this.sprite = scene.add.sprite(...)` and before the `this.wallBody = ...` line, matching the plan's exact placement rule
- Used `const isWebGL = scene.game.renderer.type === Phaser.WEBGL;` (not `this.scene.game`) inside the constructor because `scene` is already in param scope at that point
- Stored handle as public `this.glowFX` (no underscore) because `upgrade()` reads it — consistent with `auraTween` / `auraRing` / `idleTween` conventions in the same file
- Mutation pattern chosen over clear+re-add pattern per RESEARCH Pattern 2 / Code Example 2 (documented preferred style for Phaser FX controllers); acceptance criteria explicitly verified no `preFX.clear()` or `addGlow(...)` calls exist inside `upgrade()`
- No comments added per CLAUDE.md "No comments unless requested or when logic is too complex"

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — WebGL/Canvas fallback is automatic via `Phaser.AUTO` at runtime; no configuration change needed.

## Next Phase Readiness

- Plan 03 (GameScene core glow + camera vignette + phase-reactive tween) can now reuse the same `isWebGL` branching pattern and `POSTFX.GLOW.core` / `POSTFX.VIGNETTE` config
- Plan 04 (MainMenu + GameOver static vignette) can consume `POSTFX.VIGNETTE` the same way
- THEME-04 is now partially satisfied for the **turret** half; the core half lands in plan 03. REQUIREMENTS.md will move to fully-complete once plan 03 merges.
- No blockers. No new open questions.

## Verification Deferred to Phase Verifier

Per plan 05-02's verification section:
- **Manual visual QA:** `npm run dev`, place one of each turret type, confirm per-type halos render (white/violet/deep-purple); place a wall, confirm no halo; upgrade a zapper or slowfield, confirm color shifts to accent white.
- **Canvas fallback smoke:** temporarily swap `src/main.js` from `Phaser.AUTO` to `Phaser.CANVAS`, reload, confirm no errors on turret placement (preFX is null on Canvas; the `isWebGL` / existence guards handle it).
- **Performance smoke:** wave-10 render with full turret grid should stay at 60fps — PreFX is the cheapest Phaser FX path and the pipeline count is bounded by `turrets.length`.

## Self-Check: PASSED

- FOUND: `src/entities/Turret.js` modified (POSTFX import, constructor glow attach, upgrade color mutation, destroy preFX.clear)
- FOUND: commit `6fd90b3` in git log (`feat(05-02): attach per-type turret glow and clear preFX on destroy`)
- FOUND: commit `66316b8` in git log (`feat(05-02): swap turret glow color on upgrade via property mutation`)
- All Task 1 acceptance criteria (7 grep patterns + build) passed
- All Task 2 acceptance criteria (2 grep patterns + mutation-only rule + build) passed
- `npm run build` exited 0 after each task

---
*Phase: 05-atmospheric-glow*
*Completed: 2026-04-18*
