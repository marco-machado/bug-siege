# Contract: GameConfig Module

**File**: `src/config/GameConfig.js`
**Purpose**: Single source of truth for all balance data. Constitution Principle III (Data-Driven Configuration).

## Exports

### `GRID`

```javascript
export const GRID = {
  cols: 6,
  rows: 6,
  tileSize: 64,
  offsetX: 208,   // (800 - 384) / 2
  offsetY: 108,   // (600 - 384) / 2
  coreCol: 3,
  coreRow: 2,
  starterTurrets: [
    { col: 0, row: 0, type: 'blaster' },
    { col: 5, row: 0, type: 'blaster' },
    { col: 0, row: 5, type: 'blaster' },
    { col: 5, row: 5, type: 'blaster' },
  ],
};
```

### `TURRETS`

```javascript
export const TURRETS = {
  blaster: {
    cost: 50,
    range: 192,       // 3 tiles
    fireRate: 2.0,     // shots/sec
    damage: 10,
    upgradeCost: 75,
    upgradedDamage: 20,
    hp: null,
  },
  zapper: {
    cost: 100,
    range: 160,        // 2.5 tiles
    fireRate: 0.8,
    damage: 15,
    chainTargets: 2,   // hits primary + 2 additional
    upgradeCost: 150,
    upgradedDamage: 30,
    hp: null,
  },
  slowfield: {
    cost: 75,
    range: 128,        // 2 tiles
    slowFactor: 0.5,   // 50% speed reduction
    upgradeCost: 112,
    upgradedRange: 160, // 2.5 tiles
    hp: null,
  },
  wall: {
    cost: 25,
    hp: 100,
    upgradeCost: 37,
    upgradedHp: 200,
  },
};
```

### `BUGS`

```javascript
export const BUGS = {
  swarmer: {
    speed: 120,
    hp: 30,
    coreDamage: 5,
    wallDamage: 5,
    reward: 10,
    size: 48,
  },
  brute: {
    speed: 40,
    hp: 150,
    coreDamage: 20,
    wallDamage: 20,
    reward: 25,
    size: 80,
  },
  spitter: {
    speed: 70,
    hp: 60,
    coreDamage: 10,
    wallDamage: 15,
    reward: 15,
    size: 56,
    attackRange: 192,  // 3 tiles
    attackRate: 1.0,   // 1 shot/sec
  },
  boss: {
    speed: 30,
    hp: 1500,
    coreDamage: 40,
    wallDamage: 40,
    reward: 100,
    size: 80,
  },
};
```

### `WAVES`

```javascript
export const WAVES = [
  { wave: 1,  swarmers: 6,  brutes: 0, spitters: 0, boss: 0 },
  { wave: 2,  swarmers: 10, brutes: 0, spitters: 0, boss: 0 },
  { wave: 3,  swarmers: 15, brutes: 0, spitters: 0, boss: 0 },
  { wave: 4,  swarmers: 12, brutes: 3, spitters: 0, boss: 0 },
  { wave: 5,  swarmers: 15, brutes: 5, spitters: 0, boss: 0 },
  { wave: 6,  swarmers: 18, brutes: 8, spitters: 0, boss: 0 },
  { wave: 7,  swarmers: 15, brutes: 6, spitters: 4, boss: 0 },
  { wave: 8,  swarmers: 18, brutes: 8, spitters: 6, boss: 0 },
  { wave: 9,  swarmers: 20, brutes: 10, spitters: 8, boss: 0 },
  { wave: 10, swarmers: 15, brutes: 8, spitters: 6, boss: 1 },
];
```

### `ECONOMY`

```javascript
export const ECONOMY = {
  startingCredits: 200,
  waveBonusBase: 50,
  waveBonusPerWave: 10,   // bonus = 50 + (waveNumber * 10)
  sellReturnRate: 0.5,     // 50% refund
  earlyStartBonus: 25,     // bonus credits for starting wave early
};
```

### `GAME`

```javascript
export const GAME = {
  canvasWidth: 800,
  canvasHeight: 600,
  baseHp: 100,
  totalWaves: 10,
  buildPhaseSeconds: 20,
  maxBugsPoolSize: 60,
  maxBulletsPoolSize: 50,
};
```

## Invariants

- All numeric values MUST match the spec Balance Tables.
- Editing this file MUST be sufficient to change any balance value — no logic code changes required.
- All exports MUST be `Object.freeze()`-d to prevent runtime mutation.
