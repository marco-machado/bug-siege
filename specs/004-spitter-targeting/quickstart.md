# Quickstart: Spitter Targeting All Turrets

**Feature**: `004-spitter-targeting` | **Date**: 2026-02-17

## What To Change

**One file, one line.**

### `src/entities/Bug.js` — `findAttackTarget()` method

Remove line 104:
```js
if (turret.type !== 'wall') continue;
```

The method iterates `this.scene.turrets`, calculates distance, and returns the nearest within `attackRange`. Removing the type filter makes it consider all turret types (blaster, zapper, slowfield, wall).

## Why Nothing Else Changes

1. **Collision system**: `GameScene` already adds every turret's `wallBody` to the `wallBodies` static group — spitter bullets already overlap-check against all turret types.

2. **Damage callback**: `onSpitterBulletHitWall()` resolves `turretRef` and calls `takeDamage()` — this is type-agnostic.

3. **Turret HP**: All turret types already have an `hp` field in `GameConfig.js` and a `takeDamage()` method in `Turret.js`.

4. **Config values**: `wallDamage: 20`, `attackRange: 192`, `attackRate: 1.0` — all unchanged.

## Manual Testing

1. `npm run dev`
2. Start a game, reach wave 7+ (when Spitters spawn)
3. Place a blaster turret within 192px of a Spitter's path with no walls nearby
4. Verify: Spitter stops and fires at the blaster
5. Place two turrets at different distances — verify Spitter targets the nearer one
6. Verify: existing wall targeting still works
7. Verify: Spitters with no turrets in range still steer toward the core

## Debug Shortcut

With `VITE_DEBUG_KEYS=true`:
- Press `3` during wave phase to spawn a Spitter at a random edge position
