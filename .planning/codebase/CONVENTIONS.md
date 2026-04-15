# Coding Conventions

**Analysis Date:** 2026-04-15

## Naming Patterns

**Files:**
- All source files use `.js` extension
- File names match class names: `GameScene.js`, `Bug.js`, `EconomyManager.js`
- Directories indicate purpose: `scenes/`, `entities/`, `systems/`, `config/`

**Classes:**
- PascalCase: `GameScene`, `BuildSystem`, `WaveManager`, `Bug`, `Turret`
- Scene constructors call `super('SceneKey')` where key matches class name

**Methods/Variables:**
- camelCase: `gridToWorld`, `findNearestBug`, `takeDamage`, `activeTurrets`
- Private methods/variables use underscore prefix: `_sfxCooldowns`, `renderGrid()`

**Config Constants:**
- UPPER_CASE frozen objects: `GRID`, `TURRETS`, `BUGS`, `WAVES`, `ECONOMY`, `GAME`, `STEERING`, `DEBUG`
- Defined in `src/config/GameConfig.js` with `Object.freeze()`

**Event Names:**
- kebab-case strings: `'bug-killed'`, `'credits-changed'`, `'wave-changed'`, `'hp-changed'`, `'phase-changed'`, `'timer-tick'`, `'start-wave-early'`

**Scene Keys:**
- PascalCase strings matching class names: `'Boot'`, `'MainMenu'`, `'Game'`, `'UIScene'`, `'GameOver'`

## Code Style

**Formatting:**
- 2-space indentation (no tabs)
- Single quotes for strings (no double quotes except in template literals)
- Semicolons after every statement
- K&R braces (opening brace on same line)
- Arrow functions for callbacks and short functions
- Trailing commas on multi-line arrays/objects

**Modules & Imports:**
- ES modules exclusively (`"type": "module"` in package.json)
- **Always use explicit `.js` extensions** in import paths
- **Named exports only** (no default exports except Phaser itself)
- Import order: (1) external libraries, (2) config constants, (3) internal entities/systems

Example from `src/scenes/GameScene.js:1-9`:
```javascript
import Phaser from 'phaser';
import { GRID, GAME, ECONOMY, DEBUG } from '../config/GameConfig.js';
import { Grid } from '../entities/Grid.js';
import { Turret } from '../entities/Turret.js';
import { Bug } from '../entities/Bug.js';
import { Bullet } from '../entities/Bullet.js';
import { WaveManager } from '../systems/WaveManager.js';
import { EconomyManager } from '../systems/EconomyManager.js';
import { BuildSystem } from '../systems/BuildSystem.js';
```

## Import Organization

**Order:**
1. External libraries (`import Phaser from 'phaser';`)
2. Config constants (`import { GRID, GAME } from '../config/GameConfig.js';`)
3. Internal entities (`import { Grid } from '../entities/Grid.js';`)
4. Internal systems (`import { WaveManager } from '../systems/WaveManager.js';`)

**Path Aliases:**
- No path aliases configured
- All imports use relative paths with explicit `.js` extensions

## Error Handling

**Guard Clauses with Early Returns:**
```javascript
// From src/entities/Bug.js:64-67
if (!this.active || !this.corePos) {
  this.setVelocity(0, 0);
  return;
}
```

**Null Checks Before Nested Property Access:**
```javascript
// From AGENTS.md reference
if (!target.sprite || !target.sprite.active) return;
```

**Boolean Returns from Mutation Methods:**
- `takeDamage()` returns `true` if entity died
- `spend()` returns `true` if successful, `false` if insufficient credits

**Console Usage:**
- `console.error` for invalid configuration
- `console.warn` for failed asset loads
- No console.log in production code

**Fallback Generation:**
- BootScene creates placeholder textures and silent audio if assets fail to load
- Error handling in `src/scenes/BootScene.js:42-45`:
```javascript
this.load.on('loaderror', (file) => {
  console.warn(`Failed to load asset: ${file.key} (${file.url})`);
  this.failedKeys.add(file.key);
});
```

**Cleanup on Shutdown:**
- Scenes register `'shutdown'` handlers to unsubscribe events and stop audio
- Example from `src/scenes/GameScene.js:93-99`:
```javascript
this.events.once('shutdown', () => {
  this.sound.stopByKey('bgm_wave');
  this.sound.stopByKey('sfx_victory');
  this.sound.stopByKey('sfx_core_destroyed');
  this.events.off('bug-killed', this.onBugKilled, this);
  this.events.off('start-wave-early', this.onStartWaveEarly, this);
  if (this.input.keyboard) this.input.keyboard.removeAllListeners();
});
```

## Logging

**Framework:** Console only (no dedicated logging framework)

**Patterns:**
- Asset loading failures logged with `console.warn`
- Invalid configuration logged with `console.error`
- No debug logging in gameplay code
- Debug mode controlled by `VITE_DEBUG_KEYS` environment variable

## Comments

**When to Comment:**
- Minimal comments; code should be self-documenting through clear naming
- Only add comments when logic is genuinely complex
- Never remove existing comments
- No JSDoc or type annotations

**Existing Comments:**
- Very few comments in codebase (adheres to minimal comment philosophy)
- Occasional inline comments for complex calculations

## Function Design

**Size:** Functions are generally concise (10-30 lines)
**Parameters:** Limited to 2-3 parameters typically
**Return Values:** Consistent return types (boolean for success/failure, void for side effects)

**Arrow Functions:**
- Used extensively for callbacks and event handlers
- Example from `src/systems/BuildSystem.js:131-133`:
```javascript
label.on('pointerover', () => label.setColor('#00ff88'));
label.on('pointerout', () => label.setColor('#ffffff'));
label.on('pointerdown', () => this.placeTurret(opt.type));
```

## Module Design

**Exports:** Named exports only (no default exports except Phaser)
**Barrel Files:** None used; each file imported individually
**Class Patterns:**
- Physics entities extend `Phaser.Physics.Arcade.Sprite`
- Scenes extend `Phaser.Scene`
- Everything else is a plain class (`Grid`, `Turret`, `EconomyManager`, etc.)
- Scene lifecycle: `constructor()` -> `init(data)` -> `preload()` -> `create()` -> `update(time, delta)`

## Phaser-Specific Patterns

**Collision Callbacks Parameter Reassignment:**
```javascript
// From AGENTS.md reference
onBulletHitBug(_bullet, _bug) {
  const bullet = _bullet;
  const bug = _bug;
  if (!bullet.active || !bug.active) return;
}
```

**Object Pooling:**
- Bugs (pool of 60) and bullets (pool of 50 turret + 20 spitter) use Phaser physics groups
- Entities manage activation via `spawn()`/`despawn()` methods

**Turret is Composite, NOT a Sprite:**
- Wraps `this.sprite` (a Phaser sprite) and `this.wallBody` (static physics body)
- Tween `turret.sprite`, never the Turret instance itself

## UI Conventions

**Coordinates:** Absolute pixel coordinates for fixed 1920x1080 canvas (not responsive)
**Font:** `monospace` font family exclusively
**Color Palette:**
- `#00ff88` (green accent)
- `#ffdd00` (credits/gold)
- `#ff3333` (danger)
- `#88ccff` (info)
- `#ffffff` (default)

**Interactive Elements:**
```javascript
element.setInteractive({ useHandCursor: true });
element.on('pointerover', () => element.setColor('#00ff88'));
element.on('pointerout', () => element.setColor('#ffffff'));
element.on('pointerdown', () => this.handleAction());
```

---

*Convention analysis: 2026-04-15*