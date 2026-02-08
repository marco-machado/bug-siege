# Contract: Entity Behaviors

**Purpose**: Defines the behavioral contracts for turrets, bugs, and the build system.

## Turret Behaviors

### Blaster

- **Targeting**: Nearest bug within 192px (3 tiles) range.
- **Firing**: 2 shots/sec. Fires a `Bullet` projectile toward the target's current position.
- **Projectile**: Travels at 400px/sec. Deals 10 damage (20 upgraded) on overlap with bug. Despawns on hit or out-of-bounds.
- **Visual**: Rectangle with barrel line rotating toward target.

### Zapper

- **Targeting**: Nearest bug within 160px (2.5 tiles) range.
- **Firing**: 0.8 shots/sec. Chain lightning effect.
- **Chain Logic**: On fire, deals damage to primary target. Then finds up to 2 additional bugs within 96px (1.5 tiles) of the last hit bug. Each chain target takes the same damage.
- **Projectile**: No physical projectile. Instantaneous damage + Graphics line drawn between chain targets (brief flash, ~200ms).
- **Visual**: Distinct shape from Blaster. Lightning arc drawn with Graphics.

### Slowfield

- **Targeting**: No targeting. Continuous aura effect.
- **Effect**: All bugs within 128px (2 tiles, 160px upgraded) have their speed multiplied by 0.5.
- **Implementation**: On each frame, check all active bugs. If within range, apply slow flag. If bug leaves range, remove slow flag. Multiple Slowfields do NOT stack — a bug is either slowed or not.
- **Visual**: Semi-transparent circle overlay showing aura radius.

### Wall Block

- **Targeting**: None. Passive structure.
- **HP**: 100 (200 upgraded). Takes damage from bugs that collide with it or from Spitter ranged attacks.
- **On Destroy**: Tile becomes empty. Grid state updated. Wall sprite removed.
- **Physics**: Static body. Bugs collide with it (Arcade Physics collider).
- **Visual**: Solid rectangle, distinct from turrets.

## Bug Behaviors

### Swarmer

- **Movement**: Seek Command Core at 120px/sec. Avoid obstacles (walls).
- **On Core Contact**: Deal 5 damage to base. Despawn (return to pool).
- **On Wall Contact**: Deal 5 damage to wall per hit. Continue attacking wall until destroyed, then resume path to core.

### Brute

- **Movement**: Seek Command Core at 40px/sec. Avoid obstacles.
- **On Core Contact**: Deal 20 damage to base. Despawn.
- **On Wall Contact**: Deal 20 damage to wall per hit.

### Spitter

- **Movement**: Seek Command Core at 70px/sec. Avoid obstacles.
- **Ranged Attack**: When a turret or Wall Block is within 192px (3 tiles), stop advancing and fire a projectile at it every 1 sec. Deals 15 damage to target.
- **Target Priority**: Nearest turret or Wall Block. Turrets (Blaster, Zapper, Slowfield) are indestructible — Spitter attacks land but deal no damage. Only Wall Blocks take damage.
- **On Core Contact**: Deal 10 damage to base. Despawn.
- **Projectile**: `SpitterBullet` travels at 200px/sec. Pooled.

### Boss Brute

- **Movement**: Same as Brute but at 30px/sec.
- **HP**: 1500. Same behavior as Brute but tankier.
- **On Core Contact**: Deal 40 damage to base. Despawn.

## Build System

### Place Structure

1. Player clicks empty grid tile.
2. Build menu appears showing available structures with costs.
3. Structures with cost > current credits are visually dimmed/disabled.
4. Player clicks a structure option.
5. If `credits >= cost`: place structure, deduct credits, update grid state, emit `credits-changed`.
6. If `credits < cost`: deny with visual feedback (flash red).

### Upgrade Turret

1. Player clicks existing turret.
2. Turret menu appears showing upgrade option (cost, effect) and sell option.
3. If already upgraded: upgrade option is hidden/disabled.
4. If `credits >= upgradeCost`: apply upgrade, deduct credits, update turret stats, emit `credits-changed`.

### Sell Structure

1. Player clicks existing turret → turret menu → sell.
2. Refund `cost * 0.5` credits (base cost, not including upgrade cost).
3. Remove turret sprite. Update grid state to `'empty'`. Emit `credits-changed`.

### Close Menu

- Clicking outside any menu closes it.
- Starting a wave closes any open menu.

## Wave System

### Spawn Sequence

1. Build phase ends (timer or manual start).
2. Read wave config for current wave number.
3. Spawn bugs in staggered intervals (0.5-1.0 sec between spawns).
4. Each bug spawns from a random edge (N/S/E/W) at a random position along that edge.
5. Bug is retrieved from pool (`group.get()`), positioned at edge, activated.

### Wave Completion

1. `bugsAlive` counter tracks active bugs.
2. When `bugsAlive === 0` and all bugs for the wave have been spawned:
   - Award wave bonus: `50 + (waveNumber * 10)` credits.
   - If `waveNumber < 10`: transition to build phase.
   - If `waveNumber === 10`: trigger victory.

### Early Start Bonus

- During build phase countdown, player can press Spacebar or click "Start Wave".
- Remaining seconds × `earlyStartBonus` modifier (flat 25 credits per early start).
