---
phase: 01-cosmic-foundation
reviewed: 2026-04-16T12:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/config/GameConfig.js
  - src/entities/Bug.js
  - src/main.js
  - src/scenes/BootScene.js
  - src/scenes/GameScene.js
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-16T12:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the five core source files of the Bug Siege tower defense game: game configuration, Bug entity, main entry point, BootScene, and GameScene. The codebase is well-structured with clear separation of concerns. Configuration is properly centralized and frozen. No security issues were found (expected for a client-side game with no network I/O). Five warnings were identified relating to potential bugs in game logic, and three informational items noted.

## Warnings

### WR-01: Build timer only starts on wave 0 -- subsequent build phases have no auto-start

**File:** `src/scenes/GameScene.js:148-163`
**Issue:** `startBuildPhase()` only creates the countdown timer when `this.waveManager.getCurrentWave() === 0`. This method is called from `create()` to begin the first build phase. However, after wave 1+ completes, `onWaveComplete()` handles the build phase timer directly (lines 190-206) and never calls `startBuildPhase()`. This means `startBuildPhase()` is only used once, and the `if (this.waveManager.getCurrentWave() === 0)` guard is effectively dead conditional logic that makes the method misleading. If `startBuildPhase()` were ever called for subsequent phases, it would silently skip the timer and the player would be stuck in a build phase with no countdown.
**Fix:** Either remove the wave-0 guard so `startBuildPhase()` is reusable, or rename/document it as `startInitialBuildPhase()` to clarify it is single-use:
```javascript
startBuildPhase() {
  this.phase = 'build';
  this.buildSystem.closeMenus();
  this.events.emit('phase-changed', { phase: 'build' });

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

### WR-02: onBugHitCore does not count kills toward totalKills when bug reaches core

**File:** `src/scenes/GameScene.js:288-295`
**Issue:** When a bug reaches the core, `bug.despawn()` is called directly (not `bug.die()`), and `waveManager.onBugDied()` is called only if `damageCore` did not trigger game over. This means bugs that reach the core and do NOT end the game are correctly tracked for wave completion, but bugs that reach the core and DO end the game are not decremented from `bugsAlive`. More importantly, bugs reaching the core are never counted in `totalKills`, which means the end-of-game stats undercount. This may be intentional (kills vs. bugs-reached-core), but if the core damage kills the base, `waveManager.onBugDied()` is skipped, leaving `bugsAlive` in a stale state if the game were ever to continue.
**Fix:** If the intent is that bugs reaching core should not count as "kills," this is fine. If they should, call `this.totalKills++` alongside `waveManager.onBugDied()`. Either way, consider always calling `waveManager.onBugDied()` for bookkeeping:
```javascript
onBugHitCore(_core, _bug) {
  const bug = _bug;
  if (!bug.active || this.phase === 'gameover') return;
  const gameEnded = this.damageCore(bug.coreDamage);
  this.waveManager.onBugDied();
  bug.despawn();
}
```

### WR-03: onSpitterBulletHitCore parameter order may be swapped by Phaser overlap callback

**File:** `src/scenes/GameScene.js:281-286`
**Issue:** The overlap between `this.bugs` (or `this.spitterBullets`) and `this.coreZone` is set up at line 72 as `this.physics.add.overlap(this.spitterBullets, this.coreZone, this.onSpitterBulletHitCore, null, this)`. In Phaser's overlap callback, the first argument corresponds to the first group/object and the second to the second. So the callback receives `(spitterBullet, coreZone)`. However, the callback signature is `onSpitterBulletHitCore(_core, _bullet)` -- the parameters are named in reverse order. The code then does `const bullet = _bullet` which would actually be the coreZone, not the bullet. This is a bug: `bullet.active`, `bullet.damage`, and `bullet.despawn()` would all operate on the coreZone object.

The same issue applies to `onBugHitCore` at line 288: the overlap is `(this.bugs, this.coreZone, this.onBugHitCore)` so callback receives `(bug, coreZone)`, but the signature is `onBugHitCore(_core, _bug)` -- again reversed.
**Fix:** Swap the parameter names to match Phaser's callback order:
```javascript
onSpitterBulletHitCore(_bullet, _core) {
  const bullet = _bullet;
  if (!bullet.active || this.phase === 'gameover') return;
  this.damageCore(bullet.damage);
  bullet.despawn();
}

onBugHitCore(_bug, _core) {
  const bug = _bug;
  if (!bug.active || this.phase === 'gameover') return;
  if (!this.damageCore(bug.coreDamage)) {
    this.waveManager.onBugDied();
  }
  bug.despawn();
}
```

### WR-04: Bug.spawn does not guard against null body

**File:** `src/entities/Bug.js:44-46`
**Issue:** `Bug.spawn()` accesses `this.body.enable` and `this.body.setCircle()` directly at lines 44-45. When a Bug is retrieved from a Phaser physics group pool via `.get()`, the body should normally exist. However, if the sprite has been previously removed from the scene or if pool recycling has an edge case, `this.body` could be null, causing a crash. The defensive check pattern used elsewhere in the codebase (e.g., Turret checking `this.sprite.active`) suggests this should be guarded.
**Fix:** Add a null guard:
```javascript
if (this.body) {
  this.body.enable = true;
  this.body.setCircle(this.width / 2);
}
```

### WR-05: Duplicate collision handlers on bugs vs. wallBodies (collider + overlap)

**File:** `src/scenes/GameScene.js:61-62`
**Issue:** Both a `collider` and an `overlap` are registered between `this.bugs` and `this.wallBodies`, both pointing to the same handler `this.onBugHitWall`. This means when a bug touches a wall, the handler fires twice per physics step -- once from the collider and once from the overlap. The `wallAttackCooldown` prevents damage from stacking within the 1-second window, so it does not cause a double-damage bug. However, it does cause unnecessary double invocations every frame during contact, and on the first contact frame, there is a subtle timing issue: the collider resolves first (separating the bodies), then the overlap check runs on the same step. If both fire before the cooldown is set, the wall could take damage twice on the initial hit.
**Fix:** Remove one of the two registrations. If you want bugs to be physically blocked by walls, keep the collider. If you want pass-through damage, keep the overlap. Having both is likely unintentional:
```javascript
// Keep the collider for physical blocking + damage:
this.physics.add.collider(this.bugs, this.wallBodies, this.onBugHitWall, null, this);
// Remove the duplicate overlap:
// this.physics.add.overlap(this.bugs, this.wallBodies, this.onBugHitWall, null, this);
```

## Info

### IN-01: console.error in Bug.spawn

**File:** `src/entities/Bug.js:23`
**Issue:** `console.error` call for unknown bug type. This is useful for development but could be wrapped in a debug guard for cleanliness in production builds.
**Fix:** Consider guarding with `if (DEBUG.enableDebugKeys)` or relying on the Vite build to tree-shake it.

### IN-02: console.warn in BootScene load error handler

**File:** `src/scenes/BootScene.js:43`
**Issue:** `console.warn` on asset load failure. Useful for development but will appear in production console.
**Fix:** Low priority -- the fallback texture generation handles the failure gracefully. Could guard with a debug flag if console cleanliness matters.

### IN-03: Magic number 20 for spitter bullet pool size

**File:** `src/scenes/GameScene.js:52`
**Issue:** The spitter bullet pool `maxSize: 20` is a magic number, while the turret bullet pool uses `GAME.maxBulletsPoolSize` from config. This is inconsistent with the project's convention of centralizing tuning constants in GameConfig.js.
**Fix:** Add a constant to GameConfig.js:
```javascript
// In GAME config:
maxSpitterBulletsPoolSize: 20,
```

---

_Reviewed: 2026-04-16T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
