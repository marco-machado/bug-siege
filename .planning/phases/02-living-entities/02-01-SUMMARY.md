---
phase: 02-living-entities
plan: 01
subsystem: animation
tags: [bugs, animation, squash-stretch, config]
dependency_graph:
  requires: []
  provides: [bug-squash-stretch-animation]
  affects: [src/entities/Bug.js, src/config/GameConfig.js]
tech_stack:
  added: []
  patterns: [sin-wave squash-stretch, per-type animation config, object pooling safe scale reset]
key_files:
  created: []
  modified:
    - src/config/GameConfig.js
    - src/entities/Bug.js
decisions:
  - "Read scaleX back after setDisplaySize to derive correct base scale (texture-relative)"
  - "Random _animPhase per spawn prevents lockstep pulsing across 60-bug pool"
  - "Divide scaleY by wobble (not multiply inverse) to conserve apparent area"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-16"
  tasks_completed: 2
  files_modified: 2
---

# Phase 2 Plan 01: Bug Squash-Stretch Animation Summary

**One-liner:** Per-type sin-wave squash-stretch on all bug classes via BUGS[type].anim config with pool-safe base scale reset.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add anim sub-objects to BUGS config | b5aaf8c | src/config/GameConfig.js |
| 2 | Sin-wave squash-stretch in Bug.preUpdate and spawn reset | 767ac40 | src/entities/Bug.js |

## What Was Built

Added per-type animation configuration (`frequency`, `amplitude`) as frozen sub-objects to all 4 BUGS entries in GameConfig.js. Implemented sin-wave squash-stretch in Bug.preUpdate() that reads these values each frame to oscillate scaleX and scaleY inversely, making bugs feel alive as they move. spawn() now resets `_baseScale` from scaleX after setDisplaySize and assigns a random `_animPhase` to prevent pool-reuse artifacts and lockstep pulsing.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `grep -c 'anim: Object.freeze' src/config/GameConfig.js` → 4
- All 4 frequency values present (0.012, 0.004, 0.007, 0.002)
- `_baseScale` and `_animPhase` in both spawn() and preUpdate()
- `scaleY = this._baseScale / wobble` present in preUpdate()
- `npm run build` exits 0

## Known Stubs

None.

## Threat Flags

None — client-side animation math only, no trust boundaries crossed.

## Self-Check: PASSED

- src/config/GameConfig.js: modified with 4 anim sub-objects
- src/entities/Bug.js: modified with spawn reset and preUpdate sin-wave block
- Commit b5aaf8c: confirmed in git log
- Commit 767ac40: confirmed in git log
