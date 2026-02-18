# Data Model: Spitter Targeting All Turrets

**Feature**: `004-spitter-targeting` | **Date**: 2026-02-17

## Entity Impact Analysis

### Bug (entity: `src/entities/Bug.js`)

**No structural changes.** Existing fields used:

| Field | Type | Usage in This Feature |
|---|---|---|
| `bugType` | string | Checked for `'spitter'` to trigger `updateSpitter()` |
| `wallDamage` | number | Passed as damage to `fireSpitterBullet()` — now applies to all turret types |
| `attackTimer` | number | Cooldown between shots (unchanged) |

**Method changes:**

| Method | Change |
|---|---|
| `findAttackTarget()` | Remove `if (turret.type !== 'wall') continue;` filter (line 104) |
| `fireSpitterBullet()` | No change — already type-agnostic |
| `updateSpitter()` | No change — already type-agnostic |

### Turret (entity: `src/entities/Turret.js`)

**No changes.** All turret types already support:
- `wallBody` with `turretRef` back-pointer (lines 22-25)
- `takeDamage(amount)` method (lines 251-259)
- `flashDamage()` visual feedback (lines 238-249)
- `destroy()` cleanup (lines 261-272)

### GameConfig (config: `src/config/GameConfig.js`)

**No changes.** Existing values reused as-is:
- `BUGS.spitter.attackRange`: 192
- `BUGS.spitter.attackRate`: 1.0
- `BUGS.spitter.wallDamage`: 20

### GameScene (scene: `src/scenes/GameScene.js`)

**No changes.** The overlap detection and callback already handle all turret types:
- `this.physics.add.overlap(this.spitterBullets, this.wallBodies, ...)` (line 59)
- `onSpitterBulletHitWall()` uses `turretRef` (lines 220-230)

## State Transitions

No new states. Existing Spitter behavior loop unchanged:

```
Steering → [turret in range?] → Attacking (stop + fire) → [target destroyed/out of range?] → Steering
```

The only difference: "turret in range?" now considers all turret types, not just walls.
