# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

No test framework or linter is configured yet.

## Architecture

**Bug Siege** is a top-down tower defense game built with Phaser 3 and Vite. Fixed 800x600 canvas, Arcade physics, 10-wave session (~10 min). All textures are generated at runtime in BootScene (no external image assets).

### Scene Flow

`BootScene` → `MainMenuScene` → `GameScene` + `UIScene` (parallel) → `GameOverScene`

- **GameScene** owns the gameplay loop: build phase (20s timer) → wave phase → repeat
- **UIScene** runs as an overlay, listening to GameScene events for HUD updates
- Cross-scene communication uses Phaser's event system (`scene.get('Game').events`)

### Source Layout

```
src/
├── main.js                  # Phaser game config + scene registration
├── config/GameConfig.js     # All tuning constants (GRID, TURRETS, BUGS, WAVES, ECONOMY, GAME)
├── entities/
│   ├── Grid.js              # 6×6 tile grid — placement validation, coord conversion
│   ├── Turret.js            # Composite class (NOT a Phaser Sprite) — holds sprite + optional physics body
│   ├── Bug.js               # Extends Phaser.Physics.Arcade.Sprite — steering, damage, type behaviors
│   └── Bullet.js            # Extends Phaser.Physics.Arcade.Sprite — pooled projectiles
└── systems/
    ├── WaveManager.js       # Wave progression, bug spawn queue, completion detection
    ├── EconomyManager.js    # Credits: spend/earn/canAfford, emits 'credits-changed'
    └── BuildSystem.js       # Grid click handling, build/turret menus, placement logic
```

### Key Design Decisions

- **Turret is composite, not a Sprite**: It wraps a Phaser sprite and optionally a static physics body (walls). You can't tween a Turret directly — tween its `.sprite` instead.
- **Object pooling**: Bugs (pool of 60) and bullets (pool of 50 turret + 20 spitter) use Phaser physics groups with `maxSize`.
- **All config is centralized** in `GameConfig.js` — grid dimensions, turret stats, bug stats, wave compositions, economy values. Change game balance there, not in entity classes.
- **Events drive state sync**: GameScene emits `bug-killed`, `credits-changed`, `wave-changed`, `hp-changed`, `phase-changed`, `timer-tick`, `start-wave-early`. UIScene and other consumers listen.

## Code Conventions

- ES modules with explicit `.js` extensions in all imports
- Config constants are UPPER_CASE objects (`GRID`, `TURRETS`, `BUGS`, `WAVES`, `ECONOMY`, `GAME`)
- Classes: PascalCase. Methods: camelCase
- Entities that need physics extend `Phaser.Physics.Arcade.Sprite`; everything else is a plain class
- UI is positioned with absolute pixel coordinates (not responsive)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

## Active Technologies
- JavaScript (ES modules), no transpilation + Phaser 3 (Arcade Physics), Vite (003-hd-photorealistic)
- Local PNG/JPEG files in `assets/` directory tree (003-hd-photorealistic)

## Recent Changes
- 003-hd-photorealistic: Added JavaScript (ES modules), no transpilation + Phaser 3 (Arcade Physics), Vite
