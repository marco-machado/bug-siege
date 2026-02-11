# Data Model: Full HD with Photorealistic Assets

**Feature**: 003-hd-photorealistic | **Date**: 2026-02-10

This feature does not introduce new runtime entities or data structures. It modifies existing configuration values and replaces the asset pipeline. This document describes the configuration changes and asset manifest.

## Configuration Changes (GameConfig.js)

### GAME Object

| Field | Type | Old Value | New Value |
|-------|------|-----------|-----------|
| canvasWidth | number | 800 | 1920 |
| canvasHeight | number | 600 | 1080 |
| baseHp | number | 100 | 100 (unchanged) |
| totalWaves | number | 10 | 10 (unchanged) |
| buildPhaseSeconds | number | 20 | 20 (unchanged) |
| maxBugsPoolSize | number | 60 | 60 (unchanged) |
| maxBulletsPoolSize | number | 50 | 50 (unchanged) |

### GRID Object

| Field | Type | Old Value | New Value |
|-------|------|-----------|-----------|
| cols | number | 6 | 6 (unchanged) |
| rows | number | 6 | 6 (unchanged) |
| tileSize | number | 64 | 144 |
| offsetX | number | 208 | 528 |
| offsetY | number | 108 | 108 (unchanged) |
| coreCol | number | 3 | 3 (unchanged) |
| coreRow | number | 2 | 2 (unchanged) |

### TURRETS Object (pixel fields only)

| Field | Type | Old Value | New Value |
|-------|------|-----------|-----------|
| blaster.range | number | 192 | 432 |
| zapper.range | number | 160 | 360 |
| slowfield.range | number | 128 | 288 |
| slowfield.upgradedRange | number | 160 | 360 |

All other turret fields (cost, fireRate, damage, hp, upgradeCost, upgradedDamage, chainTargets, slowFactor, upgradedHp) are unchanged.

### BUGS Object (pixel fields only)

| Bug Type | Field | Old Value | New Value |
|----------|-------|-----------|-----------|
| swarmer | speed | 60 | 135 |
| swarmer | size | 48 | 108 |
| brute | speed | 30 | 68 |
| brute | size | 80 | 180 |
| spitter | speed | 35 | 79 |
| spitter | size | 56 | 126 |
| spitter | attackRange | 192 | 432 |
| boss | speed | 15 | 34 |
| boss | size | 100 | 225 |

All other bug fields (hp, coreDamage, wallDamage, reward, attackRate) are unchanged.

### WAVES and ECONOMY Objects

No changes. These contain non-pixel values only.

## Asset Manifest

### Texture Key Registry

Every asset is loaded with a stable texture key that matches the existing code references. No code changes needed for texture lookups — only the source changes from `generateTexture()` to `this.load.image()`.

| Texture Key | Used By | Load Call |
|-------------|---------|----------|
| `turret-blaster` | Turret.js (sprite), BootScene | `this.load.image('turret-blaster', 'assets/turrets/blaster.png')` |
| `turret-zapper` | Turret.js (sprite), BootScene | `this.load.image('turret-zapper', 'assets/turrets/zapper.png')` |
| `turret-slowfield` | Turret.js (sprite), BootScene | `this.load.image('turret-slowfield', 'assets/turrets/slowfield.png')` |
| `turret-wall` | Turret.js (sprite + wallBody), BootScene | `this.load.image('turret-wall', 'assets/turrets/wall.png')` |
| `bug-swarmer` | Bug.js (setTexture), BootScene | `this.load.image('bug-swarmer', 'assets/bugs/swarmer.png')` |
| `bug-brute` | Bug.js (setTexture), BootScene | `this.load.image('bug-brute', 'assets/bugs/brute.png')` |
| `bug-spitter` | Bug.js (setTexture), BootScene | `this.load.image('bug-spitter', 'assets/bugs/spitter.png')` |
| `bug-boss` | Bug.js (setTexture), BootScene | `this.load.image('bug-boss', 'assets/bugs/boss.png')` |
| `core` | GameScene.js (renderCore) | `this.load.image('core', 'assets/environment/core.png')` |
| `background` | GameScene.js (new) | `this.load.image('background', 'assets/environment/background.jpg')` |
| `tile` | GameScene.js (renderGrid) | `this.load.image('tile', 'assets/environment/tile.png')` |
| `bullet` | Bullet.js (default texture) | `this.load.image('bullet', 'assets/environment/bullet.png')` |
| `spitter-bullet` | Bug.js (fireSpitterBullet) | `this.load.image('spitter-bullet', 'assets/environment/spitter-bullet.png')` |

### New Texture Key

| Texture Key | Purpose | Notes |
|-------------|---------|-------|
| `background` | Full-canvas background image | New — not present in current codebase. Rendered behind grid in GameScene. |

## Hardcoded Values Inventory

Values embedded directly in source files (not in GameConfig.js) that require scaling:

| File | Line | Current Value | New Value | Context |
|------|------|---------------|-----------|---------|
| Turret.js | 86 | `chainRange = 96` | `216` | Zapper chain jump distance |
| Turret.js | 119 | `lineStyle(2, ...)` | `lineStyle(4, ...)` | Lightning chain visual width |
| Turret.js | 153 | `circle(..., 8, ...)` | `circle(..., 18, ...)` | Muzzle flash radius |
| Bullet.js | 7 | `this.speed = 400` | `900` | Default bullet speed |
| Bullet.js | 40-44 | `- 50` / `+ 50` | `- 113` / `+ 113` | Out-of-bounds despawn margin |
| Bug.js | 119 | `200` (6th arg) | `450` | Spitter bullet speed |
| GameScene.js | 252 | `circle(x, y, 3, ...)` | `circle(x, y, 7, ...)` | Death particle size |
| GameScene.js | 255 | `* 30` | `* 68` | Death particle spread radius |
| WaveManager.js | 62 | `margin = 20` | `45` | Off-screen spawn margin |
