# Data Model: Bug Siege

**Feature Branch**: `001-bug-siege-game`
**Date**: 2026-02-08

## Entities

### Grid

The 7x7 tile grid is the authoritative spatial data structure.

| Field | Type | Description |
|-------|------|-------------|
| `cells` | `CellState[][]` | 7x7 2D array |
| `offsetX` | `number` | World X of grid top-left (456) |
| `offsetY` | `number` | World Y of grid top-left (36) |
| `tileSize` | `number` | 144px |
| `cols` | `number` | 7 |
| `rows` | `number` | 7 |

**CellState enum**: `'empty'` | `'core'` | `'turret'` | `'wall'`

**Initial Layout** (7x7, row-major):
```
[ turret, empty, empty, empty, empty, empty, turret ]
[ empty,  empty, empty, empty, empty, empty, empty  ]
[ empty,  empty, empty, empty, empty, empty, empty  ]
[ empty,  empty, empty, core,  empty, empty, empty  ]
[ empty,  empty, empty, empty, empty, empty, empty  ]
[ empty,  empty, empty, empty, empty, empty, empty  ]
[ turret, empty, empty, empty, empty, empty, turret ]
```

Core at row 3, col 3 (exact center of 7x7). Starter Blasters at four corners: (0,0), (6,0), (0,6), (6,6).

### Turret

| Field | Type | Description |
|-------|------|-------------|
| `type` | `TurretType` | `'blaster'` \| `'zapper'` \| `'slowfield'` \| `'wall'` |
| `gridCol` | `number` | Grid column (0-5) |
| `gridRow` | `number` | Grid row (0-5) |
| `upgraded` | `boolean` | Whether upgrade has been applied |
| `sprite` | `Phaser.GameObjects.GameObject` | Visual representation |
| `hp` | `number \| null` | Only for Wall Blocks (100 base, 200 upgraded). null for others. |

**Turret Config** (from config, not stored per-instance):

| Type | Cost | Range | FireRate | Damage | UpgCost | UpgDamage | HP |
|------|------|-------|----------|--------|---------|-----------|----|
| blaster | 50 | 3 tiles (192px) | 2.0/sec | 10 | 75 | 20 | — |
| zapper | 100 | 2.5 tiles (160px) | 0.8/sec | 15 (×3 chain) | 150 | 30 | — |
| slowfield | 75 | 2 tiles (128px) | — | — | 112 | — (+0.5 tile range) | — |
| wall | 25 | — | — | — | 37 | — (HP doubled) | 100 |

### Bug

| Field | Type | Description |
|-------|------|-------------|
| `type` | `BugType` | `'swarmer'` \| `'brute'` \| `'spitter'` \| `'boss'` |
| `hp` | `number` | Current hit points |
| `maxHp` | `number` | Maximum hit points |
| `speed` | `number` | Movement speed (px/sec) |
| `damage` | `number` | Damage dealt to core on contact |
| `wallDamage` | `number` | Damage dealt to walls |
| `reward` | `number` | Credits awarded on kill |
| `sprite` | `Phaser.Physics.Arcade.Sprite` | Physics-enabled sprite |

**Bug Config** (from config):

| Type | Speed | HP | CoreDmg | WallDmg | Reward | Size |
|------|-------|----|---------|---------|--------|------|
| swarmer | 120 | 30 | 5 | 5 | 10 | 48×48 |
| brute | 40 | 150 | 20 | 20 | 25 | 80×80 |
| spitter | 70 | 60 | 10 | 15 | 15 | 56×56 |
| boss | 30 | 1500 | 40 | 40 | 100 | 80×80 |

**Spitter Special Behavior**: Ranged attack (3 tile range, 1 shot/sec) targeting turrets and Wall Blocks. Does not move to melee range with core — fires from range.

### Wave

| Field | Type | Description |
|-------|------|-------------|
| `number` | `number` | Wave index (1-10) |
| `swarmers` | `number` | Count of Swarmers to spawn |
| `brutes` | `number` | Count of Brutes to spawn |
| `spitters` | `number` | Count of Spitters to spawn |
| `boss` | `number` | Count of Boss Brutes (0 or 1) |
| `total` | `number` | Total bugs in wave |

Wave composition is read-only config — see spec Balance Tables.

### GameState

Runtime state managed by the Game scene.

| Field | Type | Description |
|-------|------|-------------|
| `credits` | `number` | Current player credits (starts at 200) |
| `baseHp` | `number` | Current base health (starts at 100) |
| `currentWave` | `number` | Current wave number (1-10) |
| `phase` | `Phase` | `'build'` \| `'wave'` \| `'gameover'` |
| `totalKills` | `number` | Total bugs killed this session |
| `killsByType` | `Record<BugType, number>` | Kills broken down by type |
| `bugsAlive` | `number` | Count of active bugs in current wave |
| `buildTimer` | `number` | Countdown seconds remaining (20 max) |

**Phase enum**: `'build'` | `'wave'` | `'gameover'`

## State Transitions

### Game Phase Flow

```
MainMenu → Game (build phase, wave 1)
  → build phase: player places/upgrades/sells turrets
    → player presses Start Wave (or timer expires)
  → wave phase: bugs spawn and attack
    → all bugs dead → award wave bonus
      → wave < 10 → build phase (next wave)
      → wave == 10 → victory (gameover)
    → base HP <= 0 → defeat (gameover)
  → gameover → GameOver screen → MainMenu or restart
```

### Turret Lifecycle

```
empty tile → click → build menu → select + pay → placed
placed → click → turret menu → upgrade (pay 1.5x) → upgraded
placed → click → turret menu → sell (receive 50%) → empty tile
wall placed → bug attacks → hp decreases → hp <= 0 → destroyed → empty tile
```

### Bug Lifecycle

```
pool (inactive) → wave spawns → setActive(true) at map edge
  → steer toward core, avoid obstacles
  → hit by projectile → take damage → hp <= 0 → die → award credits → return to pool
  → reach core → deal damage to base → return to pool
  → (spitter) in range of turret/wall → fire ranged attack → continue steering
```

## Relationships

```
Grid 1──* Turret       (grid contains turrets by cell reference)
Wave 1──* Bug           (wave defines spawn composition)
Turret *──* Bug         (turrets target bugs in range)
Bug *──1 CommandCore   (bugs target the core)
Spitter *──* Turret    (spitters target turrets/walls with ranged attacks)
GameState 1──1 Grid    (game state owns the grid)
GameState 1──* Wave    (game state tracks wave progression)
```
