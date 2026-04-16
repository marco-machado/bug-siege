---
phase: 04-impactful-effects
reviewed: 2026-04-16T21:17:56Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/config/GameConfig.js
  - src/entities/Bug.js
  - src/entities/Turret.js
  - src/scenes/BootScene.js
  - src/scenes/GameScene.js
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-04-16T21:17:56Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed five core source files covering game configuration, entity classes (Bug, Turret), the boot scene, and the main game scene. No critical security or crash-level issues found. Two warnings relate to a missing null guard that could throw at runtime and duplicated logic that risks divergence. Four info-level items cover inconsistent deep-freeze patterns, missing phase guards, console logging in production, and unnecessary duck-type dispatch.

## Warnings

### WR-01: Unguarded `this.body` access in Bug.despawn()

**File:** `src/entities/Bug.js:195`
**Issue:** `despawn()` accesses `this.body.enable` without a null guard. The `spawn()` method at line 49 defensively checks `if (this.body)` before touching the body, but `despawn()` does not. If a pooled bug is despawned before a successful spawn completes (or if the body is not yet initialized), this throws a TypeError.
**Fix:**
```javascript
despawn() {
  this.scene.tweens.killTweensOf(this);
  this.setActive(false);
  this.setVisible(false);
  if (this.body) this.body.enable = false;
  this.setVelocity(0, 0);
}
```

### WR-02: Duplicated build timer setup logic

**File:** `src/scenes/GameScene.js:158-170` and `src/scenes/GameScene.js:197-212`
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

### IN-01: Inconsistent freeze depth in VFX config

**File:** `src/config/GameConfig.js:144-192`
**Issue:** Nested value objects like `speed: { min: 80, max: 150 }` and `scale: { start: 0.8, end: 0.3 }` inside VFX config are not frozen, even though the rest of the config (GRID, TURRETS, BUGS, WAVES) freezes at every nesting level. Someone could accidentally mutate `VFX.DEATH.swarmer.speed.min = 0` at runtime.
**Fix:** Wrap nested plain objects in `Object.freeze()`, matching the pattern used elsewhere in the config file.

### IN-02: Missing phase guard in GameScene.update()

**File:** `src/scenes/GameScene.js:425-433`
**Issue:** The `update()` loop runs during the gameover phase. Turrets continue targeting, firing bullets, and invoking `playSfx` (which has no phase check at line 328). While `shakeCamera` has a gameover guard (line 340), `playSfx` does not. This can produce visual and audio artifacts after game over.
**Fix:** Add an early return at the top of `update()`:
```javascript
update(time, delta) {
  if (this.phase === 'gameover') return;
  // ...existing logic
}
```

### IN-03: Console logging in production code

**File:** `src/entities/Bug.js:23` and `src/scenes/BootScene.js:43`
**Issue:** `console.error` in `Bug.spawn()` and `console.warn` in BootScene's load error handler will emit to the browser console in production builds. These are useful during development but should ideally be gated behind the existing `DEBUG.enableDebugKeys` flag or removed for production.
**Fix:** Wrap in `if (DEBUG.enableDebugKeys)` checks or remove.

### IN-04: Unnecessary duck-type dispatch in physics callbacks

**File:** `src/scenes/GameScene.js:297` and `src/scenes/GameScene.js:303`
**Issue:** `typeof obj1.despawn === 'function'` is used to identify which argument is the bullet/bug vs the zone in `onSpitterBulletHitCore` and `onBugHitCore`. Phaser guarantees the callback argument order matches the `physics.add.overlap()` registration order, so the first argument is always the entity from the first group. The duck-typing adds unnecessary indirection.
**Fix:** Use positional arguments directly, consistent with the pattern in `onBulletHitBug` and `onBugHitWall`:
```javascript
onSpitterBulletHitCore(bullet, _zone) {
  if (!bullet.active || this.phase === 'gameover') return;
  this.damageCore(bullet.damage);
  bullet.despawn();
}

onBugHitCore(bug, _zone) {
  if (!bug.active || this.phase === 'gameover') return;
  const gameEnded = this.damageCore(bug.coreDamage);
  this.waveManager.onBugDied();
  bug.despawn();
}
```

---

_Reviewed: 2026-04-16T21:17:56Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
