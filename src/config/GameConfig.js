export const GRID = Object.freeze({
  cols: 7,
  rows: 7,
  tileSize: 64,
  offsetX: 736,
  offsetY: 316,
  coreCol: 3,
  coreRow: 3,
  starterTurrets: Object.freeze([
    Object.freeze({ col: 0, row: 0, type: 'blaster' }),
    Object.freeze({ col: 6, row: 0, type: 'blaster' }),
    Object.freeze({ col: 0, row: 6, type: 'blaster' }),
    Object.freeze({ col: 6, row: 6, type: 'blaster' }),
  ]),
});

export const TURRETS = Object.freeze({
  rotationSpeed: 10,
  bulletSpeed: 400,
  blaster: Object.freeze({
    cost: 50,
    range: 224,
    fireRate: 2.0,
    damage: 10,
    upgradeCost: 75,
    upgradedDamage: 20,
    hp: 150,
  }),
  zapper: Object.freeze({
    cost: 100,
    range: 160,
    fireRate: 0.8,
    damage: 15,
    chainTargets: 2,
    upgradeCost: 150,
    upgradedDamage: 30,
    hp: 150,
  }),
  slowfield: Object.freeze({
    cost: 75,
    range: 128,
    slowFactor: 0.5,
    upgradeCost: 112,
    upgradedRange: 160,
    hp: 100,
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
    wallDamage: 10,
    reward: 10,
    size: 48,
    anim: Object.freeze({ frequency: 0.012, amplitude: 0.12 }),
  }),
  brute: Object.freeze({
    speed: 30,
    hp: 150,
    coreDamage: 20,
    wallDamage: 40,
    reward: 25,
    size: 80,
    anim: Object.freeze({ frequency: 0.004, amplitude: 0.06 }),
  }),
  spitter: Object.freeze({
    speed: 35,
    hp: 60,
    damage: 20,
    reward: 15,
    size: 56,
    attackRange: 192,
    attackRate: 1.0,
    anim: Object.freeze({ frequency: 0.007, amplitude: 0.09 }),
  }),
  boss: Object.freeze({
    speed: 15,
    hp: 1500,
    coreDamage: 40,
    wallDamage: 50,
    reward: 100,
    size: 96,
    anim: Object.freeze({ frequency: 0.002, amplitude: 0.04 }),
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
  repairCostMarkup: 1.3,
  earlyStartBonus: 25,
});

export const DEBUG = Object.freeze({
  enableDebugKeys: import.meta.env.VITE_DEBUG_KEYS === 'true',
});

export const STEERING = Object.freeze({
  avoidanceRadius: 120,
  repulsionStrength: 3.0,
});

export const GAME = Object.freeze({
  canvasWidth: 1920,
  canvasHeight: 1080,
  baseHp: 200,
  totalWaves: 10,
  buildPhaseSeconds: 20,
  maxBugsPoolSize: 60,
  maxBulletsPoolSize: 50,
});

export const THEME = Object.freeze({
  background: '#0a0a12',
  nebula: Object.freeze(['#2d1b4e', '#4b2c62', '#6a4c93']),
  accent: '#eef2ff',
  ui: Object.freeze({
    textPrimary:     Object.freeze({ hex: '#eef2ff', num: 0xeef2ff }),
    textMuted:       Object.freeze({ hex: '#a89fcc', num: 0xa89fcc }),
    textDisabled:    Object.freeze({ hex: '#6a6a80', num: 0x6a6a80 }),
    accentPrimary:   Object.freeze({ hex: '#9966ff', num: 0x9966ff }),
    accentSecondary: Object.freeze({ hex: '#88aacc', num: 0x88aacc }),
    warning:         Object.freeze({ hex: '#ffaa44', num: 0xffaa44 }),
    danger:          Object.freeze({ hex: '#ff3333', num: 0xff3333 }),
    success:         Object.freeze({ hex: '#66dd99', num: 0x66dd99 }),
    surface:         Object.freeze({ hex: '#2d1b4e', num: 0x2d1b4e }),
    surfaceBorder:   Object.freeze({ hex: '#4b2c62', num: 0x4b2c62 }),
    hpBarBg:         Object.freeze({ hex: '#1a1a2e', num: 0x1a1a2e }),
    gridLine:        Object.freeze({ hex: '#334455', num: 0x334455 }),
    loadingBar:      Object.freeze({ hex: '#9966ff', num: 0x9966ff }),
    loadingBarBg:    Object.freeze({ hex: '#1a1a2e', num: 0x1a1a2e }),
  }),
});

export const VFX = Object.freeze({
  DEATH: Object.freeze({
    swarmer: Object.freeze({ tint: 0x44ff44, count: 10, speed: Object.freeze({ min: 80, max: 150 }), lifespan: 350, scale: Object.freeze({ start: 0.8, end: 0.3 }) }),
    brute:   Object.freeze({ tint: 0xff4444, count: 10, speed: Object.freeze({ min: 80, max: 150 }), lifespan: 350, scale: Object.freeze({ start: 0.8, end: 0.3 }) }),
    spitter: Object.freeze({ tint: 0xff8844, count: 10, speed: Object.freeze({ min: 80, max: 150 }), lifespan: 350, scale: Object.freeze({ start: 0.8, end: 0.3 }) }),
    boss:    Object.freeze({ color: Object.freeze([0x44ff44, 0xff4444, 0xff8844, 0x9900ff]), count: 30, speed: Object.freeze({ min: 100, max: 200 }), lifespan: 600, scale: Object.freeze({ start: 2.0, end: 0.5 }) }),
  }),
  MUZZLE: Object.freeze({
    count: 5,
    lifespan: 80,
    scale: Object.freeze({ start: 1.0, end: 0.3 }),
    tint: 0xffffaa,
    speed: Object.freeze({ min: 60, max: 120 }),
    angleSpread: 30,
  }),
  BUILD: Object.freeze({
    count: 12,
    lifespan: 400,
    tints: Object.freeze([0x9966ff, 0xeef2ff]),
    speed: Object.freeze({ min: 20, max: 60 }),
    scale: Object.freeze({ start: 0.8, end: 0.1 }),
    gravityY: -40,
  }),
  SHOCKWAVE: Object.freeze({
    startRadius: 30,
    endRadius: 120,
    duration: 400,
    color: 0x9966ff,
    lineWidth: 3,
  }),
  SLOWFIELD: Object.freeze({
    pulseDuration: 1200,
    lineWidth: 2,
    color: 0x9966ff,
    alphaMax: 0.6,
    upgradedColor: 0xcc99ff,
    upgradedAlphaMax: 0.8,
  }),
  ZAPPER_TRAIL: Object.freeze({
    outerLineWidth: 6,
    outerColor: 0x9966ff,
    outerAlpha: 0.4,
    innerLineWidth: 2,
    innerColor: 0xeef2ff,
    innerAlpha: 1,
    lineDuration: 200,
    trailTint: 0xeef2ff,
    trailLifespan: 300,
    particlesPerSegment: 4,
    trailScale: Object.freeze({ start: 0.5, end: 0.1 }),
    trailAlpha: Object.freeze({ start: 0.8, end: 0 }),
  }),
  SHAKE: Object.freeze({
    light:  Object.freeze({ intensity: 0.001, duration: 60 }),
    medium: Object.freeze({ intensity: 0.003, duration: 100 }),
    heavy:  Object.freeze({ intensity: 0.008, duration: 150 }),
    bossMicroCooldown: 500,
  }),
});

export const POSTFX = Object.freeze({
  VIGNETTE: Object.freeze({
    x: 0.5,
    y: 0.5,
    radius: 0.5,
    buildStrength: 0.25,
    waveStrength: 0.30,
    transitionDuration: 600,
    transitionEase: 'Sine.easeInOut',
  }),
});
