---
phase: 02-living-entities
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/config/GameConfig.js
  - src/entities/Bug.js
  - src/entities/Turret.js
  - src/scenes/GameScene.js
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-16
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the core game entities and scene for the 02-living-entities phase. No security vulnerabilities found. Five logic/reliability warnings were found: a crash-prone null dereference in `Bug.despawn()`, an incorrect physics circle radius calculation, a missing kill credit when bugs reach the core, a stale-slow-state timing issue from the `preUpdate`/`update` ordering, and a semantic mismatch in spitter bullet damage routing. Three info-level items cover code quality.

---

## Warnings

### WR-01: `Bug.despawn()` accesses `body.enable` without null guard

**File:** `src/entities/Bug.js:178`
**Issue:** `despawn()` sets `this.body.enable = false` unconditionally. The physics body can be null if the Bug sprite was never added to the physics world (e.g., during pool pre-allocation before `spawn()` is called). `spawn()` correctly guards with `if (this.body)` on line 48, but `despawn()` does not, so any call to `despawn()` on an unspawned bug crashes with `Cannot set properties of null`.
**Fix:**
```js
despawn() {
  this.scene.tweens.killTweensOf(this);
  this.setActive(false);
  this.setVisible(false);
  if (this.body) this.body.enable = false;
  this.setVelocity(0, 0);
}
```

---

### WR-02: Physics circle radius uses raw texture width, not display size

**File:** `src/entities/Bug.js:50`
**Issue:** `this.body.setCircle(this.width / 2)` runs after `setDisplaySize(conf.size, conf.size)`. `this.width` returns the texture's original pixel width, not the display (scaled) width. Bug textures are generated at runtime in BootScene — if those textures are not exactly `conf.size` pixels wide, the hitbox radius will be wrong, producing either phantom collisions or missed hits. The correct value is `conf.size / 2`.
**Fix:**
```js
if (this.body) {
  this.body.enable = true;
  this.body.setCircle(conf.size / 2);
}
```

---

### WR-03: Bugs that reach the core grant no reward and are not counted as kills

**File:** `src/scenes/GameScene.js:295-301`
**Issue:** `onBugHitCore` calls `bug.despawn()` directly, bypassing `bug.die()`. `die()` emits the `bug-killed` event which triggers `onBugKilled` — that's where `economy.earn(reward)` and `totalKills++` happen. As a result, bugs that successfully reach the core neither reward credits nor count toward the kill total shown on the Game Over screen. `waveManager.onBugDied()` is called (so wave completion works), but economy and stats are silent.

This may be intentional design (penalty for letting bugs through), but if so the `reward` field on every bug config is misleading and `totalKills` is mislabeled (it counts only bugs killed by turrets). If it is a bug, the fix is:
```js
onBugHitCore(_bug, _core) {
  const bug = _bug;
  if (!bug.active || this.phase === 'gameover') return;
  this.damageCore(bug.coreDamage);
  bug.die(); // emits bug-killed, handles reward + waveManager.onBugDied + despawn
}
```
If intentional, rename `totalKills` to `turretKills` for clarity.

---

### WR-04: Slow state read by `preUpdate` is one frame stale

**File:** `src/scenes/GameScene.js:382-388`
**Issue:** `GameScene.update` first resets `bug.slowed = false` for all bugs, then calls `turret.update()` which re-applies slow via `updateSlowfieldAura`. However, `runChildUpdate: true` on the bugs group causes `bug.preUpdate` to run inside Phaser's internal update loop — which fires **before** `GameScene.update`. This means every frame, bug steering logic reads the `slowed` value set by the **previous** frame's turret update, and the reset + re-apply happens afterward. The bug will steer at the wrong speed for one frame whenever a bug enters or leaves the slow aura. In practice this is a single-frame lag (~16ms) and unlikely to be perceptible, but it is a structural ordering issue.

If correctness matters, move the slowfield reset and re-apply into a dedicated system update that runs before `preUpdate`, or use Phaser's `update` lifecycle on bugs instead of `preUpdate`.

---

### WR-05: Spitter bullet damage is routed through `wallDamage`, which is undefined for spitters

**File:** `src/entities/Bug.js:208` and `src/config/GameConfig.js:74-83`
**Issue:** `fireSpitterBulletAt` passes `this.wallDamage` as the bullet's damage value. `this.wallDamage` is assigned in `spawn()` as `conf.wallDamage ?? conf.damage ?? 0`. The `spitter` config has no `wallDamage` property, so it falls back to `conf.damage` (20). This works but is semantically misleading — spitter bullets deal `damage` stat damage, but the variable is called `wallDamage`. More importantly, if a spitter fires at the core (`fireSpitterBulletAt(this.corePos.x, this.corePos.y)` on line 238), the bullet hits `onSpitterBulletHitCore`, which uses `bullet.damage` — still the fallback `damage` value. Core damage and wall damage for spitters are conflated.

No immediate wrong value, but if a designer adds a `wallDamage` to the spitter config expecting wall-specific damage, spitter bullets to the core would silently deal wall damage instead of core damage.

**Fix:** Use `this.damage` (or a dedicated `spitterDamage` property) in `fireSpitterBulletAt`, and track core vs. wall damage intent explicitly.

---

## Info

### IN-01: Build timer logic is duplicated between `startBuildPhase` and `onWaveComplete`

**File:** `src/scenes/GameScene.js:153-171` and `198-213`
**Issue:** The `time.addEvent` timer setup — countdown, `timer-tick` emit, and `startWavePhase` trigger — is copy-pasted identically in both methods. Any change to build timer behavior must be made in two places.
**Fix:** Extract into a private method, e.g. `_startBuildTimer()`, called from both `startBuildPhase` and `onWaveComplete`.

---

### IN-02: All turret types get a `wallBody` static physics image, including non-walls

**File:** `src/entities/Turret.js:24-28`
**Issue:** Every turret (blaster, zapper, slowfield, wall) creates a `wallBody` static image with a physics body. Spitter bugs and melee collision use `wallBodies` for all turret types, meaning non-wall turrets are structurally treated as walls. This is consistent with the game design intent (all turrets can be attacked), but the name `wallBody` / `wallBodies` is confusing for non-wall types. Consider renaming to `physicsBody` / `turretBodies` for clarity.

---

### IN-03: Magic number `chainRange = 96` in `fireZapper`

**File:** `src/entities/Turret.js:149`
**Issue:** The zapper chain range `96` is a magic number inlined in the method. Other tuning constants live in `GameConfig.js`. If a designer wants to tune chain range, they must know to look inside `Turret.js`.
**Fix:** Add `chainRange: 96` to `TURRETS.zapper` in `GameConfig.js` and reference it here.

---

_Reviewed: 2026-04-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
