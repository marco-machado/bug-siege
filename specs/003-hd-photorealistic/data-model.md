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
| cols | number | 6 | 7 |
| rows | number | 6 | 7 |
| tileSize | number | 64 | 64 (unchanged) |
| offsetX | number | 208 | 736 |
| offsetY | number | 108 | 316 |
| coreCol | number | 3 | 3 (unchanged) |
| coreRow | number | 2 | 3 |

### TURRETS Object

No value changes. All ranges, costs, fire rates, damage, and other fields remain at their original values. Visual sizing is handled by `setDisplaySize()` on sprites.

### BUGS Object

No value changes. All speeds, sizes, HP, damage, and reward values remain at their original values. Visual sizing is handled by `setDisplaySize()` on sprites, with physics body circles derived from `this.width / 2`.

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

Values embedded directly in source files (not in GameConfig.js). These remain at their original values — no scaling applied. Visual sizing is handled via `setDisplaySize()` on loaded texture sprites.

| File | Line | Value | Context |
|------|------|-------|---------|
| Turret.js | ~86 | `chainRange = 96` | Zapper chain jump distance |
| Turret.js | ~119 | `lineStyle(2, ...)` | Lightning chain visual width |
| Turret.js | ~153 | `circle(..., 8, ...)` | Muzzle flash radius |
| Bullet.js | ~7 | `this.speed = 400` | Default bullet speed |
| Bullet.js | ~40-44 | `- 50` / `+ 50` | Out-of-bounds despawn margin |
| Bug.js | ~119 | `200` (6th arg) | Spitter bullet speed |
| GameScene.js | ~252 | `circle(x, y, 3, ...)` | Death particle size |
| GameScene.js | ~255 | `* 30` | Death particle spread radius |
| WaveManager.js | ~62 | `margin = 20` | Off-screen spawn margin |

### Runtime Visual Sizing

Sprites loaded from HD PNG assets are displayed at game-logic sizes using `setDisplaySize()`:
- Tiles and core: `setDisplaySize(GRID.tileSize, GRID.tileSize)`
- Bullets: `setDisplaySize(GRID.tileSize / 8, GRID.tileSize / 8)`
- Bugs: physics body via `body.setCircle(this.width / 2)`
