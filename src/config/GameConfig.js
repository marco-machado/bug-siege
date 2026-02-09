export const GRID = Object.freeze({
  cols: 6,
  rows: 6,
  tileSize: 64,
  offsetX: 208,
  offsetY: 108,
  coreCol: 3,
  coreRow: 2,
  starterTurrets: Object.freeze([
    Object.freeze({ col: 0, row: 0, type: 'blaster' }),
    Object.freeze({ col: 5, row: 0, type: 'blaster' }),
    Object.freeze({ col: 0, row: 5, type: 'blaster' }),
    Object.freeze({ col: 5, row: 5, type: 'blaster' }),
  ]),
});

export const TURRETS = Object.freeze({
  blaster: Object.freeze({
    cost: 50,
    range: 192,
    fireRate: 2.0,
    damage: 10,
    upgradeCost: 75,
    upgradedDamage: 20,
    hp: null,
  }),
  zapper: Object.freeze({
    cost: 100,
    range: 160,
    fireRate: 0.8,
    damage: 15,
    chainTargets: 2,
    upgradeCost: 150,
    upgradedDamage: 30,
    hp: null,
  }),
  slowfield: Object.freeze({
    cost: 75,
    range: 128,
    slowFactor: 0.5,
    upgradeCost: 112,
    upgradedRange: 160,
    hp: null,
  }),
  wall: Object.freeze({
    cost: 25,
    hp: 100,
    upgradeCost: 37,
    upgradedHp: 200,
  }),
});

export const BUGS = Object.freeze({
  swarmer: Object.freeze({
    speed: 60,
    hp: 30,
    coreDamage: 5,
    wallDamage: 5,
    reward: 10,
    size: 48,
  }),
  brute: Object.freeze({
    speed: 30,
    hp: 150,
    coreDamage: 20,
    wallDamage: 20,
    reward: 25,
    size: 80,
  }),
  spitter: Object.freeze({
    speed: 35,
    hp: 60,
    coreDamage: 10,
    wallDamage: 15,
    reward: 15,
    size: 56,
    attackRange: 192,
    attackRate: 1.0,
  }),
  boss: Object.freeze({
    speed: 15,
    hp: 1500,
    coreDamage: 40,
    wallDamage: 40,
    reward: 100,
    size: 100,
  }),
});

export const WAVES = Object.freeze([
  Object.freeze({ wave: 1,  swarmers: 6,  brutes: 0, spitters: 0, boss: 0 }),
  Object.freeze({ wave: 2,  swarmers: 10, brutes: 0, spitters: 0, boss: 0 }),
  Object.freeze({ wave: 3,  swarmers: 15, brutes: 0, spitters: 0, boss: 0 }),
  Object.freeze({ wave: 4,  swarmers: 12, brutes: 3, spitters: 0, boss: 0 }),
  Object.freeze({ wave: 5,  swarmers: 15, brutes: 5, spitters: 0, boss: 0 }),
  Object.freeze({ wave: 6,  swarmers: 18, brutes: 8, spitters: 0, boss: 0 }),
  Object.freeze({ wave: 7,  swarmers: 15, brutes: 6, spitters: 4, boss: 0 }),
  Object.freeze({ wave: 8,  swarmers: 18, brutes: 8, spitters: 6, boss: 0 }),
  Object.freeze({ wave: 9,  swarmers: 20, brutes: 10, spitters: 8, boss: 0 }),
  Object.freeze({ wave: 10, swarmers: 15, brutes: 8, spitters: 6, boss: 1 }),
]);

export const ECONOMY = Object.freeze({
  startingCredits: 200,
  waveBonusBase: 50,
  waveBonusPerWave: 10,
  sellReturnRate: 0.5,
  earlyStartBonus: 25,
});

export const GAME = Object.freeze({
  canvasWidth: 800,
  canvasHeight: 600,
  baseHp: 100,
  totalWaves: 10,
  buildPhaseSeconds: 20,
  maxBugsPoolSize: 60,
  maxBulletsPoolSize: 50,
});
