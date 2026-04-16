---
phase: 04-impactful-effects
plan: 02
subsystem: entities
tags: [phaser, particles, vfx, turret, slowfield, zapper, emitter]

requires:
  - phase: 04-impactful-effects
    provides: VFX.SLOWFIELD and VFX.ZAPPER_TRAIL frozen config, particle-glow 8x8 texture
provides:
  - Particle-based slowfield aura with periodic pulse waves in cosmic purple
  - Upgraded slowfield visual distinction (brighter tints, faster particles for 160px range)
  - Dual-stroke glow lightning chain for zapper (wide purple outer + narrow white inner)
  - Trail particles along zapper chain path using particle-glow texture
  - Proper emitter and timer cleanup in Turret.destroy()
affects: []

tech-stack:
  added: []
  patterns: [persistent emitter with timer-driven explode() bursts, destroy+recreate emitter on upgrade, interpolated emitParticleAt() along dynamic path, delayedCall cleanup for manually-emitted particles]

key-files:
  created: []
  modified:
    - src/entities/Turret.js

key-decisions:
  - "Used destroy+recreate pattern for slowfield upgrade instead of setParticleSpeed/setParticleTint which may not exist in Phaser 3.90"
  - "Trail particle cleanup uses delayedCall(lifespan+50) not emitter.on('complete') per RESEARCH.md Pitfall 6"

patterns-established:
  - "Persistent emitter lifecycle: emitting:false + timer-driven explode() + cleanup in destroy()"
  - "Upgrade via destroy+recreate: safer than mutating emitter properties across Phaser versions"
  - "Trail particles via emitParticleAt(): interpolate positions along dynamic path, cleanup via delayedCall"

requirements-completed: [VFX-04, VFX-06]

duration: 3min
completed: 2026-04-16
---

# Phase 4 Plan 2: Slowfield Particle Aura and Zapper Trail Summary

**Particle pulse emitter replacing static slowfield circle plus dual-stroke glow lightning chain with lingering trail particles for zapper**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-16T17:55:56Z
- **Completed:** 2026-04-16T17:59:13Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Replaced static Graphics circle slowfield aura with persistent particle emitter that fires periodic pulse bursts in cosmic purple (sonar-ping expanding rings)
- Upgraded slowfield gets recreated emitter with brighter tints and faster speed tuned for 160px range
- Replaced single 2px zapper lightning line with dual-stroke glow (6px purple outer + 2px white inner)
- Added trail particles along zapper chain path using particle-glow texture with interpolated positions
- All emitters and timers properly cleaned up in Turret.destroy() to prevent resource leaks

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace slowfield Graphics aura with persistent particle pulse emitter** - `6e93588` (feat)
2. **Task 2: Enhance zapper lightning chain with glow line and trail particles** - `c3d7e3e` (feat)

## Files Created/Modified
- `src/entities/Turret.js` - Replaced auraGraphics with auraEmitter+pulseTimer, removed drawAura(), updated showRange() color to 0x9966ff, upgraded path uses destroy+recreate, replaced drawLightningChain() with dual-stroke glow, added spawnTrailParticles()

## Decisions Made
- Used destroy+recreate pattern for slowfield upgrade emitter instead of trying setParticleSpeed/setParticleTint methods that may not exist on Phaser 3.90 ParticleEmitter. Safer across Phaser versions.
- Trail particle cleanup uses delayedCall(lifespan+50ms) instead of emitter.on('complete') because manually-emitted particles (emitParticleAt) may not trigger the complete event.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used destroy+recreate for upgrade instead of setParticleSpeed/setParticleTint**
- **Found during:** Task 1 (slowfield upgrade path)
- **Issue:** Plan suggested setParticleSpeed() and setParticleTint() with a fallback note that these may not exist in Phaser 3.90
- **Fix:** Went directly with destroy+recreate pattern as endorsed by plan's own NOTE
- **Files modified:** src/entities/Turret.js
- **Verification:** npm run build passes, upgrade block creates new emitter with upgraded config
- **Committed in:** 6e93588 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug prevention)
**Impact on plan:** Minor implementation detail change within plan's own fallback guidance. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Slowfield and zapper turret VFX complete
- Plan 03 (camera shake system) can proceed independently -- touches GameScene.js and Bug.js, not Turret.js particle code
- No blockers

---
*Phase: 04-impactful-effects*
*Completed: 2026-04-16*
