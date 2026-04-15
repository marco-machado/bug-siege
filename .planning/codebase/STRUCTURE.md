# Codebase Structure

**Analysis Date:** 2026-04-15

## Directory Layout

```
bug-siege/
├── assets/                    # Game assets (images, audio)
│   ├── audio/                 # Sound effects and background music
│   ├── bugs/                  # Bug sprite images
│   ├── environment/           # Background and core images
│   └── turrets/               # Turret sprite images
├── dist/                      # Production build output (generated)
│   └── assets/                # Compiled assets including Phaser chunk
├── src/                       # Source code
│   ├── config/                # Game configuration and balance constants
│   │   └── GameConfig.js      # ALL tuning constants (grid, turrets, bugs, waves, economy)
│   ├── entities/              # Game object representations
│   │   ├── Bug.js             # Phaser.Physics.Arcade.Sprite -- steering, damage, type behaviors
│   │   ├── Bullet.js          # Phaser.Physics.Arcade.Sprite -- pooled projectiles
│   │   ├── Grid.js            # 7x7 tile grid (plain class)
│   │   └── Turret.js          # Composite class wrapping sprite + optional physics body
│   ├── scenes/                # Phaser scenes (game states)
│   │   ├── BootScene.js       # Asset loading + fallback texture/audio generation
│   │   ├── GameOverScene.js   # Victory/defeat results screen
│   │   ├── GameScene.js       # Gameplay loop: build phase -> wave phase -> repeat
│   │   ├── MainMenuScene.js   # Title screen
│   │   └── UIScene.js         # HUD overlay, listens to GameScene events
│   ├── systems/               # Game logic managers
│   │   ├── BuildSystem.js     # Grid click handling, build/upgrade/sell menus, placement
│   │   ├── EconomyManager.js  # Credits: spend/earn/canAfford, emits 'credits-changed'
│   │   └── WaveManager.js     # Wave progression, spawn queue, completion detection
│   └── main.js                # Phaser config + scene registration
├── .planning/codebase/        # Architecture documentation (this file)
├── index.html                 # HTML entry point with canvas container
└── vite.config.js             # Build configuration with Phaser chunk splitting
```

## Directory Purposes

**`src/config/`:**
- Purpose: Centralized game balance and tuning constants
- Contains: Single configuration file with all game parameters
- Key files: `GameConfig.js` (130 lines, all `Object.freeze()` constants)

**`src/entities/`:**
- Purpose: Game object representations with varying inheritance patterns
- Contains: Grid (plain class), Turret (composite), Bug/Bullet (Phaser sprites)
- Key files: `Turret.js` (346 lines, composite pattern), `Bug.js` (255 lines, steering logic)

**`src/scenes/`:**
- Purpose: Phaser scene lifecycle and visual orchestration
- Contains: Scene classes extending `Phaser.Scene` with init/preload/create/update
- Key files: `GameScene.js` (384 lines, main gameplay), `UIScene.js` (149 lines, HUD overlay)

**`src/systems/`:**
- Purpose: Game logic managers without direct Phaser scene dependency
- Contains: Plain JavaScript classes that operate on scene context
- Key files: `BuildSystem.js` (412 lines, UI/menu handling), `WaveManager.js` (95 lines, spawn logic)

**`assets/`:**
- Purpose: Game assets (sprites, audio, backgrounds)
- Contains: Organized by entity type (bugs, turrets, environment, audio)
- Generated: No, manually created art assets
- Committed: Yes, essential for game rendering

## Key File Locations

**Entry Points:**
- `index.html`: HTML entry point with canvas container
- `src/main.js`: Phaser game configuration and scene registration

**Configuration:**
- `src/config/GameConfig.js`: All game balance constants (grid, turrets, bugs, waves, economy)
- `vite.config.js`: Build configuration with Phaser chunk splitting

**Core Logic:**
- `src/scenes/GameScene.js`: Main gameplay loop (384 lines, most complex)
- `src/systems/BuildSystem.js`: Build/upgrade/sell UI logic (412 lines)

**Physics Setup:**
- `src/scenes/GameScene.js`: Lines 37-50 (bug/bullet physics groups)
- `src/scenes/GameScene.js`: Lines 112-142 (collision/overlap setup)

**Event Communication:**
- `src/scenes/GameScene.js`: Lines 74-75 (event listeners)
- `src/scenes/UIScene.js`: Lines 107-111 (event listeners)

**Asset Management:**
- `src/scenes/BootScene.js`: Asset loading with fallback generation

## Naming Conventions

**Files:**
- PascalCase for classes: `GameScene.js`, `EconomyManager.js`
- Lowercase for directories: `config/`, `entities/`, `scenes/`, `systems/`

**Directories:**
- Singular nouns: `config/`, `entity/`, `scene/`, `system/`
- Plural for asset collections: `assets/bugs/`, `assets/turrets/`

**Exports:**
- Named exports only (no default exports except Phaser itself)
- Class names match file names: `export class GameScene` in `GameScene.js`

**Event Names:**
- Kebab-case strings: `'credits-changed'`, `'wave-changed'`, `'hp-changed'`

**Scene Keys:**
- PascalCase strings matching class names: `'Boot'`, `'MainMenu'`, `'Game'`, `'UIScene'`

## Where to Add New Code

**New Turret Type:**
- Configuration: Add to `TURRETS` object in `src/config/GameConfig.js`
- Entity: Extend `src/entities/Turret.js` with type-specific behavior
- Asset: Add sprite to `assets/turrets/` directory
- BootScene: Add to texture loading in `src/scenes/BootScene.js`

**New Bug Type:**
- Configuration: Add to `BUGS` object in `src/config/GameConfig.js`
- Entity: Extend `src/entities/Bug.js` with type-specific behavior
- Asset: Add sprite to `assets/bugs/` directory
- Wave definition: Add to `WAVES` array in `GameConfig.js`

**New Scene:**
- Implementation: Create in `src/scenes/` following existing pattern
- Registration: Add to scene array in `src/main.js` line 25
- Transitions: Handle via `this.scene.start()` in appropriate scene

**New System:**
- Implementation: Create plain class in `src/systems/`
- Integration: Instantiate in appropriate scene's `create()` method

**New UI Element:**
- Implementation: Add to `src/scenes/UIScene.js` for HUD elements
- Or: Add to `src/systems/BuildSystem.js` for interactive menus

## Special Directories

**`dist/`:**
- Purpose: Production build output from Vite
- Generated: Yes, by `npm run build`
- Committed: No (in `.gitignore`)

**`.planning/codebase/`:**
- Purpose: Architecture documentation (this file)
- Generated: By GSD codebase mapper agent
- Committed: Yes, for reference by other GSD commands

**`.opencode/`, `.claude/`, `.specify/`:**
- Purpose: Tooling configurations and agent instructions
- Generated: By development tools
- Committed: Yes, for reproducible environment

---

*Structure analysis: 2026-04-15*