---
phase: 04-impactful-effects
reviewed: 2026-04-16T22:45:00Z
depth: deep
files_reviewed: 5
files_reviewed_list:
  - src/config/GameConfig.js
  - src/entities/Bug.js
  - src/entities/Turret.js
  - src/scenes/BootScene.js
  - src/scenes/GameScene.js
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-04-16T22:45:00Z
**Depth:** deep
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Deep review of five files covering the "impactful effects" phase: VFX configuration, bug/turret entity animations, particle texture generation, and camera shake/shockwave effects in the game scene. Cross-file analysis traced call chains through Bug -> GameScene.shakeCamera, Turret -> GameScene.playSfx/shakeCamera, and GameScene -> VFX config lookups. No critical issues found. Three warnings identify a missing defensive guard, an orphaned tween reference on destroy, and duplicated timer logic. Three info items cover an unused import, inconsistent freeze depth in config, and post-gameover update behavior.

Positive note: the diff correctly removes a duplicate `physics.add.overlap(bugs, wallBodies, onBugHitWall)` that was firing the wall-damage callback twice per frame, and the `typeof obj1.despawn === 'function'` pattern in core-hit callbacks safely handles Phaser's nondeterministic callback argument ordering.

## Warnings

### WR-01: Unguarded shakeCamera call in Bug.takeDamage

**File:** `src/entities/Bug.js:170`
**Issue:** The boss damage-shake calls `this.scene.shakeCamera('light')` without checking that the method exists. In the same diff, `Turret.js:352-354` guards the identical call with `if (this.scene && this.scene.shakeCamera)`. The inconsistency means if Bug is ever used in a scene without `shakeCamera` (e.g., during testing or scene transitions), it will throw a TypeError. Cross-file trace: `shakeCamera` is defined only on `GameScene` (line 339), not on the Phaser.Scene base class.
**Fix:**
```javascript
if (this.bugType === 'boss') {
  const now = this.scene.time.now;
  if (now - this._lastBossShake >= VFX.SHAKE.bossMicroCooldown) {
    this._lastBossShake = now;
    if (this.scene.shakeCamera) {
      this.scene.shakeCamera('light');
    }
  }
}
```

### WR-02: hpTween not cleaned up in Turret.destroy()

**File:** `src/entities/Turret.js:362-384`
**Issue:** The `destroy()` method was updated in this diff to clean up `idleTween` (line 363-366) and `auraTween` (line 372-375), but `hpTween` (created at line 406 in `updateHpBar`) is not destroyed. If a turret is killed while the HP bar tween is mid-animation, the tween holds a reference to the destroyed `hpBarFill` game object. Phaser's tween manager may log warnings or produce subtle visual glitches when it tries to update a destroyed target.
**Fix:** Add `hpTween` cleanup in `destroy()`, matching the pattern used for the other tweens:
```javascript
destroy() {
  if (this.idleTween) {
    this.idleTween.destroy();
    this.idleTween = null;
  }
  if (this.hpTween) {
    this.hpTween.destroy();
    this.hpTween = null;
  }
  this.sprite.destroy();
  // ...rest unchanged
}
```

### WR-03: Duplicated build timer setup logic

**File:** `src/scenes/GameScene.js:153-170` and `src/scenes/GameScene.js:197-212`
**Issue:** The build-phase timer creation is copy-pasted between `startBuildPhase()` and `onWaveComplete()`. Both create identical `time.addEvent` with the same callback, countdown initialization, and event emission. Any future change to timer behavior must be synchronized in two places, risking divergence.
**Fix:** Extract to a private method:
```javascript
_startBuildTimer() {
  this.buildCountdown = GAME.buildPhaseSeconds;
  this.events.emit('timer-tick', { seconds: this.buildCountdown });
  this.buildTimer = this.time.addEvent({
    delay: 1000,
    repeat: GAME.buildPhaseSeconds - 1,
    callback: () => {
      this.buildCountdown--;
      this.events.emit('timer-tick', { seconds: this.buildCountdown });
      if (this.buildCountdown <= 0) {
        this.startWavePhase();
      }
    },
  });
}
```
Then call `this._startBuildTimer()` from both `startBuildPhase()` and `onWaveComplete()`.

## Info

### IN-01: Unused GRID import in Bug.js

**File:** `src/entities/Bug.js:2`
**Issue:** The diff added `GRID` to the import destructuring, but it is never referenced anywhere in the file. Dead import.
**Fix:** Remove `GRID` from the import:
```javascript
import { BUGS, STEERING, TURRETS, VFX } from '../config/GameConfig.js';
```

### IN-02: Inconsistent freeze depth in VFX config

**File:** `src/config/GameConfig.js:142-200`
**Issue:** The codebase convention (established in GRID, TURRETS, BUGS, WAVES) is to `Object.freeze()` at every nesting level. The new VFX config freezes top-level and category-level objects, but nested value objects like `speed: { min, max }`, `scale: { start, end }`, `trailScale`, `trailAlpha`, `tints`, and `color` arrays are left mutable. For example, `VFX.MUZZLE.speed.min = 0` would silently succeed at runtime despite VFX.MUZZLE itself being frozen. Affected locations: DEATH entries (lines 144-147), MUZZLE (lines 152-153), BUILD (lines 160-162), ZAPPER_TRAIL (lines 191-192).
**Fix:** Wrap nested plain objects and arrays in `Object.freeze()`, e.g.:
```javascript
speed: Object.freeze({ min: 80, max: 150 }),
scale: Object.freeze({ start: 0.8, end: 0.3 }),
tints: Object.freeze([0x9966ff, 0xeef2ff]),
```

### IN-03: Game loop continues after gameover

**File:** `src/scenes/GameScene.js:425-433`
**Issue:** The `update()` loop has no phase guard, so turrets continue targeting, firing bullets, and producing sound effects after the game ends. While `shakeCamera` (line 340) correctly guards against gameover, `playSfx` (line 328) does not. Cross-file trace: `Turret.update()` -> `fire()` -> `scene.playSfx('sfx_shoot')` still runs because `update()` calls `turret.update()` unconditionally.
**Fix:** Add an early return at the top of `update()`:
```javascript
update(time, delta) {
  if (this.phase === 'gameover') return;
  // ...existing logic
}
```

---

_Reviewed: 2026-04-16T22:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
