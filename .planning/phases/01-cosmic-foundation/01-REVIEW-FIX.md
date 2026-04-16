---
phase: 01-cosmic-foundation
fixed_at: 2026-04-16T12:15:00Z
review_path: .planning/phases/01-cosmic-foundation/01-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-04-16T12:15:00Z
**Source review:** .planning/phases/01-cosmic-foundation/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### WR-01: Build timer only starts on wave 0 -- subsequent build phases have no auto-start

**Files modified:** `src/scenes/GameScene.js`
**Commit:** 69d3ce0
**Applied fix:** Removed the `if (this.waveManager.getCurrentWave() === 0)` guard from `startBuildPhase()` so the countdown timer is always created, making the method reusable for any build phase.

### WR-02: onBugHitCore does not count kills toward totalKills when bug reaches core

**Files modified:** `src/scenes/GameScene.js`
**Commit:** 65743aa
**Applied fix:** Changed `onBugHitCore` to always call `this.waveManager.onBugDied()` unconditionally instead of only when `damageCore` does not end the game. This ensures `bugsAlive` bookkeeping is correct regardless of whether the core is destroyed.

### WR-03: onSpitterBulletHitCore parameter order may be swapped by Phaser overlap callback

**Files modified:** `src/scenes/GameScene.js`
**Commit:** e55c970
**Applied fix:** Swapped parameter names in both `onSpitterBulletHitCore(_core, _bullet)` to `(_bullet, _core)` and `onBugHitCore(_core, _bug)` to `(_bug, _core)` to match Phaser's overlap callback convention where the first argument corresponds to the first group in the `physics.add.overlap()` call. This was a real bug -- the previous code was calling `.damage`, `.active`, and `.despawn()` on the coreZone object instead of the actual bullet/bug.

### WR-04: Bug.spawn does not guard against null body

**Files modified:** `src/entities/Bug.js`
**Commit:** 9fd3482
**Applied fix:** Wrapped `this.body.enable = true` and `this.body.setCircle(...)` in an `if (this.body)` guard to prevent crashes if the physics body is null during pool recycling edge cases.

### WR-05: Duplicate collision handlers on bugs vs. wallBodies (collider + overlap)

**Files modified:** `src/scenes/GameScene.js`
**Commit:** 3096d6a
**Applied fix:** Removed the duplicate `this.physics.add.overlap(this.bugs, this.wallBodies, this.onBugHitWall, null, this)` line, keeping only the collider registration. The collider provides both physical blocking and the damage callback, so the overlap was redundant and caused double handler invocations per physics step.

---

_Fixed: 2026-04-16T12:15:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
