---
phase: 03-juicy-combat
status: needs_fixes
files_reviewed: 4
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
reviewed_at: 2026-04-16
---

## Code Review — Phase 03: juicy-combat

**Depth:** standard
**Files reviewed:** src/config/GameConfig.js, src/entities/Turret.js, src/scenes/BootScene.js, src/scenes/GameScene.js

---

## Warnings

### WR-01: `onBugHitCore` does not reward the player when a bug reaches the core

**File:** `src/scenes/GameScene.js:300-306`

When a bug reaches the core, `waveManager.onBugDied()` is called (incrementing the kill counter) but `economy.earn()` is never called. Bugs that reach the core grant no reward credit. The asymmetry with `onBugKilled` means the player is economically punished twice (HP loss + no reward).

**Fix:**
```js
onBugHitCore(_bug, _core) {
  const bug = _bug;
  if (!bug.active || this.phase === 'gameover') return;
  this.economy.earn(bug.reward);  // add this line
  const gameEnded = this.damageCore(bug.coreDamage);
  this.waveManager.onBugDied();
  bug.despawn();
}
```

---

### WR-02: `startBuildPhase` and `onWaveComplete` duplicate the build timer logic

**File:** `src/scenes/GameScene.js:153-170` and `197-213`

The build timer creation block is copy-pasted verbatim in both methods. If one is updated the other is not, they will diverge silently.

**Fix:** Call `startBuildPhase()` from `onWaveComplete()` instead of duplicating:
```js
onWaveComplete() {
  if (this.phase === 'gameover') return;
  const waveNum = this.waveManager.getCurrentWave();
  this.economy.awardWaveBonus(waveNum);
  if (waveNum >= GAME.totalWaves) { this.gameOver(true); return; }
  this.startBuildPhase();
}
```

---

### WR-03: `Turret.update` boundary condition inconsistency — bug at exactly `range` oscillates

**File:** `src/entities/Turret.js:65-73`

The stale-target range check uses `dist >= this.range` (exclusive at boundary) while `findNearestBug` uses `dist < minDist` where `minDist` starts at `this.range` (also exclusive). A bug at exactly range distance gets dropped by the staleness check but is not re-acquired, causing per-frame oscillation.

**Fix:** Use exclusive boundary in both checks:
```js
if (dist > this.range) target = null;
```

---

### WR-04: `getPredictedPosition` accesses `target.body` without null-guard

**File:** `src/entities/Turret.js:117-127`

`target.body.velocity.x/y` is accessed without checking `target.body` is non-null. Physics bodies can be null if the object was deactivated between the `active` check and this call.

**Fix:**
```js
const vx = target.body?.velocity.x ?? 0;
const vy = target.body?.velocity.y ?? 0;
```

---

### WR-05: `updateSlowfieldAura` relies on fragile implicit coupling with `GameScene.update`

**File:** `src/entities/Turret.js:196-206`

The `bug.slowed` reset happens in `GameScene.update()` before turrets run. This is correct currently, but is fragile implicit coupling — if `updateSlowfieldAura` is ever called outside this lifecycle, bugs can remain permanently slowed.

**Fix (low urgency):** Document the coupling with a comment so it's not accidentally broken.

---

## Info

### IN-01: All turret types unconditionally create a `wallBody` static physics image

**File:** `src/entities/Turret.js:24-28`

Non-wall turrets (blaster, zapper, slowfield) all get an invisible static body that participates in spitter bullet collisions. This may be intentional but `wallBody`/`wallBodies` naming is misleading.

**Suggestion:** Rename to `turretBody`/`turretBodies`, or add a guard to skip creating the body for non-wall types.

---

### IN-02: Magic number `chainRange = 96` in `fireZapper`

**File:** `src/entities/Turret.js:149`

Hardcoded value cannot be tuned from `GameConfig.js`.

**Suggestion:** Add `chainRange: 96` to `TURRETS.zapper` in `GameConfig.js` and reference as `TURRETS.zapper.chainRange`.

---

### IN-03: `generateNebula` hex opacity padding — confirmed safe

**File:** `src/scenes/BootScene.js:103`

`Math.floor(opacity * 255).toString(16).padStart(2, '0')` correctly handles single-digit hex values. No bug.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Warning  | 5 |
| Info     | 3 |
| **Total**| **8** |

Most actionable: **WR-01** (missing `economy.earn()` in `onBugHitCore`) and **WR-04** (`target.body` null crash risk).
