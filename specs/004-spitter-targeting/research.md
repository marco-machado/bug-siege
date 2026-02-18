# Research: Spitter Targeting All Turrets

**Feature**: `004-spitter-targeting` | **Date**: 2026-02-17

## Key Finding: Collision System Already Supports All Turret Types

### Decision
No changes needed to the collision/overlap system. Only the target-selection filter in `Bug.findAttackTarget()` needs modification.

### Rationale
Investigation of the current implementation reveals:

1. **Every turret creates a `wallBody`** (`Turret.js:22-25`): All turret types (blaster, zapper, slowfield, wall) create a `scene.physics.add.staticImage()` with a `turretRef` back-pointer to the owning Turret instance.

2. **All wallBodies are added to the static group** (`GameScene.js:111-113`): `placeStarterTurrets()` and the build system both call `this.wallBodies.add(turret.wallBody)` for every placed turret, regardless of type.

3. **Spitter bullet overlap already checks all wallBodies** (`GameScene.js:59`):
   ```js
   this.physics.add.overlap(this.spitterBullets, this.wallBodies, this.onSpitterBulletHitWall, null, this);
   ```

4. **The hit callback uses `turretRef`** (`GameScene.js:220-230`): `onSpitterBulletHitWall` resolves `wall.turretRef` and calls `turret.takeDamage(bullet.damage)` — this works for any turret type since `Turret.takeDamage()` is type-agnostic.

5. **The ONLY restriction is in `Bug.findAttackTarget()`** (`Bug.js:104`):
   ```js
   if (turret.type !== 'wall') continue;
   ```
   Removing this single line enables Spitters to target all turret types.

### Alternatives Considered
- **Separate collision groups per turret type**: Unnecessary — the existing `wallBodies` group already contains all turret types.
- **New damage stat (`turretDamage`)**: Rejected per spec assumption — `wallDamage` is reused for all turret types.
- **Rename `wallDamage` → `turretDamage`**: Out of scope for this behavioral fix. The property name is a pre-existing naming quirk shared by all bug types (swarmer, brute, spitter, boss). Renaming would touch every bug config and multiple call sites for a cosmetic improvement.

## No NEEDS CLARIFICATION Items

All technical questions resolved through codebase investigation. No external research required.
