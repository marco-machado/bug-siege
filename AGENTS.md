# AGENTS.md

Guidelines for AI coding agents working in the Bug Siege codebase.

## Build & Run Commands

```bash
npm run dev                        # Vite dev server at localhost:5173
npm run build                      # Production build to dist/
npm run preview                    # Serve production build
VITE_DEBUG_KEYS=true npm run dev   # Debug mode (keys 1-4 spawn bugs, live stats overlay)
```

No test framework or linter is configured. Validate changes with `npm run build` (zero warnings expected).

## Project Overview

Top-down tower defense game: Phaser 3 + Vite, pure JavaScript (ES modules), fixed 1920x1080 canvas, Arcade physics. Ten-wave session, ~10-minute playtime. All source lives in `src/` (~1,700 lines across 12 files).

### Scene Flow

`BootScene` -> `MainMenuScene` -> `GameScene` + `UIScene` (parallel overlay) -> `GameOverScene`

### Source Layout

```
src/
  main.js                    # Phaser config + scene registration
  config/GameConfig.js       # ALL tuning constants (grid, turrets, bugs, waves, economy)
  entities/
    Grid.js                  # 7x7 tile grid (plain class)
    Turret.js                # Composite class wrapping a sprite + optional physics body
    Bug.js                   # Phaser.Physics.Arcade.Sprite -- steering, damage, type behaviors
    Bullet.js                # Phaser.Physics.Arcade.Sprite -- pooled projectiles
  systems/
    WaveManager.js           # Wave progression, spawn queue, completion detection
    EconomyManager.js        # Credits: spend/earn/canAfford, emits 'credits-changed'
    BuildSystem.js           # Grid click handling, build/upgrade/sell menus, placement
  scenes/
    BootScene.js             # Asset loading + fallback texture/audio generation
    MainMenuScene.js         # Title screen
    GameScene.js             # Gameplay loop: build phase -> wave phase -> repeat
    UIScene.js               # HUD overlay, listens to GameScene events
    GameOverScene.js         # Victory/defeat results screen
```

## Architecture Rules

- **Turret is composite, NOT a Sprite.** It wraps `this.sprite` (a Phaser sprite) and `this.wallBody` (static physics body). Tween `turret.sprite`, never the Turret instance itself.
- **Object pooling.** Bugs (pool of 60) and bullets (pool of 50 turret + 20 spitter) use Phaser physics groups with `maxSize` and `classType`. Entities manage activation via `spawn()`/`despawn()` methods.
- **All balance/config is centralized** in `GameConfig.js`. Change values there, not in entity classes. Config objects are `Object.freeze()`-ed and never mutated at runtime.
- **Event-driven state sync.** GameScene emits events; UIScene and others listen. Event names are kebab-case strings: `'bug-killed'`, `'credits-changed'`, `'wave-changed'`, `'hp-changed'`, `'phase-changed'`, `'timer-tick'`, `'start-wave-early'`.
- **Cross-scene communication** uses `this.scene.get('Game').events`.

## Code Style

### Modules & Imports

- ES modules exclusively (`"type": "module"` in package.json).
- **Always use explicit `.js` extensions** in import paths.
- **Named exports only** -- no default exports (except Phaser itself which is imported as default).
- Import order: (1) external libraries, (2) config constants, (3) internal entities/systems.

```javascript
import Phaser from 'phaser';
import { GRID, GAME, ECONOMY } from '../config/GameConfig.js';
import { Grid } from '../entities/Grid.js';
import { Turret } from '../entities/Turret.js';
```

### Naming

- **Classes**: PascalCase -- `GameScene`, `BuildSystem`, `WaveManager`
- **Methods/variables**: camelCase -- `gridToWorld`, `findNearestBug`, `takeDamage`
- **Config constants**: UPPER_CASE frozen objects -- `GRID`, `TURRETS`, `BUGS`, `WAVES`, `ECONOMY`, `GAME`, `STEERING`, `DEBUG`
- **Event names**: kebab-case strings -- `'credits-changed'`, `'wave-changed'`
- **Scene keys**: PascalCase strings matching the class -- `'Boot'`, `'MainMenu'`, `'Game'`, `'UIScene'`, `'GameOver'`

### Formatting

- 2-space indentation.
- Single quotes for strings.
- Semicolons after every statement.
- K&R braces (opening brace on same line).
- Arrow functions for callbacks.
- Trailing commas on multi-line arrays/objects.

### Class Patterns

- Physics entities extend `Phaser.Physics.Arcade.Sprite` and implement `preUpdate(time, delta)` calling `super.preUpdate()`.
- Scenes extend `Phaser.Scene`, constructor calls `super('SceneKey')`.
- Everything else is a plain class (Grid, Turret, EconomyManager, WaveManager, BuildSystem).
- Scene lifecycle: `constructor()` -> `init(data)` -> `preload()` -> `create()` -> `update(time, delta)`.

### Error Handling

- **Guard clauses with early returns** for invalid state:
  ```javascript
  if (!this.active || !this.corePos) {
    this.setVelocity(0, 0);
    return;
  }
  ```
- **Null checks** before accessing nested properties: `if (!target.sprite || !target.sprite.active) return;`
- **Boolean returns** from mutation methods (e.g., `takeDamage()` returns `true` if entity died).
- **`console.error`** for invalid configuration, **`console.warn`** for failed asset loads.
- **Fallback generation** in BootScene: creates placeholder textures and silent audio if assets fail to load.
- **Cleanup on shutdown**: scenes register `'shutdown'` handlers to unsubscribe events and stop audio.

### Comments

- Minimal comments. Code should be self-documenting through clear naming.
- Do not add comments unless the logic is genuinely complex.
- Never remove existing comments.
- No JSDoc or type annotations.

### UI

- All UI uses absolute pixel coordinates (not responsive) for the fixed 1920x1080 canvas.
- Text uses `monospace` font family.
- Color palette: `#00ff88` (green accent), `#ffdd00` (credits/gold), `#ff3333` (danger), `#88ccff` (info), `#ffffff` (default).
- Interactive elements: `setInteractive({ useHandCursor: true })` with pointerover/pointerout/pointerdown handlers.

## Key Patterns to Follow

- **Phaser collision callbacks** receive arguments in unpredictable order. Reassign parameters at the top:
  ```javascript
  onBulletHitBug(_bullet, _bug) {
    const bullet = _bullet;
    const bug = _bug;
    if (!bullet.active || !bug.active) return;
  }
  ```
- **SFX rate-limiting**: GameScene throttles audio via `playSfx()` with per-key cooldowns.
- **Tweens self-destroy**: visual effect tweens include `onComplete: () => target.destroy()`.
- **Menu construction**: menus are Phaser containers built dynamically, clamped to canvas bounds, destroyed on close (container set to `null`).
- **Overlap** for bullet-bug collisions (both destroyed); **Collider** for bug-wall blocking.

## Git Conventions

Commit messages use conventional format: `feat:`, `fix:`, `docs:` prefixes. Examples:
- `feat: add complete audio system with SFX and background music`
- `fix: allow Spitters to target all turret types`

## Environment

- Node.js with npm. No `.nvmrc` -- any recent LTS should work.
- Phaser 3.80+ as the sole runtime dependency; Vite 5.4+ as the sole dev dependency.
- Phaser is split into its own chunk via `manualChunks` in `vite.config.js`.
- Debug env var: `VITE_DEBUG_KEYS` (accessed via `import.meta.env.VITE_DEBUG_KEYS`).
- Assets in `assets/` (audio, bugs, environment, turrets). BootScene handles loading with fallback generation.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Bug Siege**

Top-down tower defense game built with Phaser 3 and Vite. Players defend a central command core from 10 waves of alien bugs by placing and upgrading turrets on a 7x7 grid. The game is functionally complete — all core mechanics work (build/wave loop, 4 turret types, 4 bug types, economy, win/lose). This milestone focuses on finishing GDD gaps and transforming the visual/audio identity from utilitarian sci-fi to a cosmic nebula aesthetic with full juice and atmosphere.

**Core Value:** A satisfying, juicy tower defense that feels as good to watch as it is to play — every hit, kill, and wave clear delivers visual and audio impact within a cohesive cosmic atmosphere.

### Constraints

- **Tech stack**: Phaser 3.80+ / Vite 5.4+ / JavaScript ES modules — no TypeScript, no framework changes
- **Canvas**: Fixed 1920x1080 — no responsive layout needed
- **Asset format**: All assets must have CC0 or equivalent license for audio, PNG for sprites
- **Code style**: Must follow AGENTS.md conventions (2-space indent, single quotes, semicolons, K&R braces, named exports, .js extensions)
- **Performance**: Must maintain 60fps with 60 bugs + 50 bullets + 20 spitter bullets on screen
- **No new bug/turret types**: This milestone is about completing and polishing, not expanding gameplay
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript ES6+ (ES Modules) - All source code in `src/`
- None - Pure JavaScript codebase
## Runtime
- Browser runtime via Vite dev server
- No Node.js runtime dependencies beyond build tooling
- npm (Node Package Manager)
- Lockfile: `package-lock.json` present
## Frameworks
- Phaser 3.80.0 - HTML5 game framework with Arcade physics
- Used for all game rendering, physics, audio, and scene management
- None configured (per AGENTS.md)
- Vite 5.4.0 - Frontend build tool and dev server
- Config: `vite.config.js` with Phaser manual chunking
## Key Dependencies
- Phaser 3.80.0 - Game engine powering all gameplay logic
- Vite 5.4.0 - Development server and production bundler
- None - No additional infrastructure packages
## Configuration
- Single environment variable: `VITE_DEBUG_KEYS`
- Accessed via `import.meta.env.VITE_DEBUG_KEYS` in `src/config/GameConfig.js`
- Enables debug features (keys 1-4 spawn bugs, live stats overlay)
- `vite.config.js` - Configures base path and manual chunks
- `package.json` - Defines npm scripts and ES module type
## Platform Requirements
- Node.js (any recent LTS)
- npm for package management
- Modern browser for testing
- Static file hosting (any web server)
- No server-side requirements
- Browser with WebGL support for Phaser
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- All source files use `.js` extension
- File names match class names: `GameScene.js`, `Bug.js`, `EconomyManager.js`
- Directories indicate purpose: `scenes/`, `entities/`, `systems/`, `config/`
- PascalCase: `GameScene`, `BuildSystem`, `WaveManager`, `Bug`, `Turret`
- Scene constructors call `super('SceneKey')` where key matches class name
- camelCase: `gridToWorld`, `findNearestBug`, `takeDamage`, `activeTurrets`
- Private methods/variables use underscore prefix: `_sfxCooldowns`, `renderGrid()`
- UPPER_CASE frozen objects: `GRID`, `TURRETS`, `BUGS`, `WAVES`, `ECONOMY`, `GAME`, `STEERING`, `DEBUG`
- Defined in `src/config/GameConfig.js` with `Object.freeze()`
- kebab-case strings: `'bug-killed'`, `'credits-changed'`, `'wave-changed'`, `'hp-changed'`, `'phase-changed'`, `'timer-tick'`, `'start-wave-early'`
- PascalCase strings matching class names: `'Boot'`, `'MainMenu'`, `'Game'`, `'UIScene'`, `'GameOver'`
## Code Style
- 2-space indentation (no tabs)
- Single quotes for strings (no double quotes except in template literals)
- Semicolons after every statement
- K&R braces (opening brace on same line)
- Arrow functions for callbacks and short functions
- Trailing commas on multi-line arrays/objects
- ES modules exclusively (`"type": "module"` in package.json)
- **Always use explicit `.js` extensions** in import paths
- **Named exports only** (no default exports except Phaser itself)
- Import order: (1) external libraries, (2) config constants, (3) internal entities/systems
## Import Organization
- No path aliases configured
- All imports use relative paths with explicit `.js` extensions
## Error Handling
- `takeDamage()` returns `true` if entity died
- `spend()` returns `true` if successful, `false` if insufficient credits
- `console.error` for invalid configuration
- `console.warn` for failed asset loads
- No console.log in production code
- BootScene creates placeholder textures and silent audio if assets fail to load
- Error handling in `src/scenes/BootScene.js:42-45`:
- Scenes register `'shutdown'` handlers to unsubscribe events and stop audio
- Example from `src/scenes/GameScene.js:93-99`:
## Logging
- Asset loading failures logged with `console.warn`
- Invalid configuration logged with `console.error`
- No debug logging in gameplay code
- Debug mode controlled by `VITE_DEBUG_KEYS` environment variable
## Comments
- Minimal comments; code should be self-documenting through clear naming
- Only add comments when logic is genuinely complex
- Never remove existing comments
- No JSDoc or type annotations
- Very few comments in codebase (adheres to minimal comment philosophy)
- Occasional inline comments for complex calculations
## Function Design
- Used extensively for callbacks and event handlers
- Example from `src/systems/BuildSystem.js:131-133`:
## Module Design
- Physics entities extend `Phaser.Physics.Arcade.Sprite`
- Scenes extend `Phaser.Scene`
- Everything else is a plain class (`Grid`, `Turret`, `EconomyManager`, etc.)
- Scene lifecycle: `constructor()` -> `init(data)` -> `preload()` -> `create()` -> `update(time, delta)`
## Phaser-Specific Patterns
- Bugs (pool of 60) and bullets (pool of 50 turret + 20 spitter) use Phaser physics groups
- Entities manage activation via `spawn()`/`despawn()` methods
- Wraps `this.sprite` (a Phaser sprite) and `this.wallBody` (static physics body)
- Tween `turret.sprite`, never the Turret instance itself
## UI Conventions
- `#00ff88` (green accent)
- `#ffdd00` (credits/gold)
- `#ff3333` (danger)
- `#88ccff` (info)
- `#ffffff` (default)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Phaser 3 scene-based game engine with parallel scenes (GameScene + UIScene overlay)
- Centralized configuration with immutable frozen objects
- Object pooling for performance-critical entities (bugs, bullets)
- Event-driven state synchronization between scenes
- Composite pattern for turrets (wrapping sprites and physics bodies)
## Layers
- Purpose: Centralized game balance and tuning constants
- Location: `src/config/GameConfig.js`
- Contains: Frozen objects for GRID, TURRETS, BUGS, WAVES, ECONOMY, GAME, DEBUG, STEERING
- Depends on: None (pure data)
- Used by: All layers (entities, systems, scenes)
- Purpose: Game object representations with Phaser sprite inheritance
- Location: `src/entities/`
- Contains: Grid (plain class), Turret (composite class), Bug (Phaser.Physics.Arcade.Sprite), Bullet (Phaser.Physics.Arcade.Sprite)
- Depends on: Configuration layer, Phaser
- Used by: Scene layer for instantiation, System layer for operations
- Purpose: Game logic managers without Phaser scene dependency
- Location: `src/systems/`
- Contains: WaveManager, EconomyManager, BuildSystem
- Depends on: Configuration layer, Scene layer for context
- Used by: Scene layer for orchestration
- Purpose: Phaser scene lifecycle and visual orchestration
- Location: `src/scenes/`
- Contains: BootScene, MainMenuScene, GameScene, UIScene, GameOverScene
- Depends on: All layers below
- Used by: `src/main.js` for registration
- Purpose: Entry point and Phaser game configuration
- Location: `src/main.js`
- Contains: Phaser game config and scene registration
- Depends on: Scene layer, Configuration layer
- Used by: Vite build system
## Data Flow
- 'credits-changed' → EconomyManager spending/earning
- 'wave-changed' → Wave progression updates
- 'hp-changed' → Base health updates
- 'phase-changed' → Build/Wave phase transitions
- 'timer-tick' → Build phase countdown
- 'start-wave-early' → UIScene button triggers early wave start
- Scene-specific state in scene.init() (phase, baseHp, totalKills, turrets array)
- Economic state in EconomyManager (credits with spend/earn methods)
- Wave state in WaveManager (currentWave, bugsAlive, spawn queue)
## Key Abstractions
- Purpose: Wraps Phaser sprite + optional physics body + visual components
- Examples: `src/entities/Turret.js`
- Pattern: Composite object with `this.sprite` (visual), `this.wallBody` (collision), `this.hpBar*` (UI)
- Purpose: Reuse entity instances for performance
- Examples: `src/scenes/GameScene.js` lines 37-50
- Pattern: Phaser physics groups with `maxSize` and `classType`, managed via `spawn()`/`despawn()` methods
- Purpose: Centralized balance tuning with immutability
- Examples: `src/config/GameConfig.js`
- Pattern: `Object.freeze()` on nested objects, UPPER_CASE exports
## Entry Points
- Location: `index.html`
- Triggers: Browser loads HTML, executes script
- Responsibilities: Sets up canvas container, loads `src/main.js`
- Location: `src/main.js`
- Triggers: Vite module loader
- Responsibilities: Configures Phaser game, registers scenes, starts BootScene
- Location: `src/scenes/BootScene.js`
- Triggers: Phaser scene manager
- Responsibilities: Loads assets, generates fallback textures/audio, transitions to MainMenuScene
## Error Handling
- Early returns for invalid state: `if (!this.active || !this.corePos) return;`
- Null checks before property access: `if (!target.sprite || !target.sprite.active) return;`
- Boolean returns from mutation methods (e.g., `takeDamage()` returns `true` if died)
- Fallback generation in BootScene for missing assets
- Cleanup on shutdown with scene event listeners
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
