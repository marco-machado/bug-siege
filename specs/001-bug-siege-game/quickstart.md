# Quickstart: Bug Siege

**Feature Branch**: `001-bug-siege-game`
**Date**: 2026-02-08

## Prerequisites

- Node.js 18+ (LTS)
- npm 9+

## Setup

```bash
cd bug-siege
npm install
```

## Development

```bash
npm run dev
```

Opens at `http://localhost:5173`. Vite HMR reloads on file changes.

## Production Build

```bash
npm run build
```

Output goes to `dist/`. Serve with any static file server.

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```
bug-siege/
├── index.html              # Entry HTML (loads src/main.js as module)
├── vite.config.js          # Vite config (splits Phaser into separate chunk)
├── package.json
├── src/
│   ├── main.js             # Phaser game config + boot
│   ├── config/
│   │   └── GameConfig.js   # All balance data (turrets, bugs, waves, economy)
│   ├── scenes/
│   │   ├── BootScene.js    # Asset generation (placeholder graphics)
│   │   ├── MainMenuScene.js
│   │   ├── GameScene.js    # Core gameplay loop
│   │   ├── UIScene.js      # HUD overlay (parallel scene)
│   │   └── GameOverScene.js
│   ├── entities/
│   │   ├── Grid.js         # 7x7 grid logic + coordinate conversion
│   │   ├── Turret.js       # Turret base class (targeting, firing)
│   │   ├── Bug.js          # Bug base class (steering, damage)
│   │   └── Bullet.js       # Projectile (pooled)
│   └── systems/
│       ├── WaveManager.js  # Wave spawning + progression
│       ├── BuildSystem.js  # Build/upgrade/sell menu logic
│       └── EconomyManager.js # Credits tracking
├── public/                 # Static assets (if any external files needed later)
│   └── assets/
├── specs/                  # Feature specifications
└── GDD.md                  # Game Design Document
```

## Key Files

| File | Responsibility |
|------|---------------|
| `src/config/GameConfig.js` | All balance values — turret stats, bug stats, wave compositions, economy constants. Edit ONLY this file to tune game balance. |
| `src/scenes/GameScene.js` | Core game loop — manages grid, turrets, bugs, physics overlaps, phase transitions. |
| `src/entities/Grid.js` | Grid-authoritative spatial model. All placement validation goes through here. |
| `src/systems/WaveManager.js` | Reads wave config, spawns bugs from pool at map edges, tracks wave completion. |

## Architecture Notes

- **Scenes**: Boot → MainMenu → Game (+UIScene parallel) → GameOver
- **Physics**: Arcade Physics only. Overlap for projectile hits, collider for bug-wall interactions.
- **Pooling**: Bugs and bullets use Phaser Physics Group pooling (`get()` / `setActive(false)`).
- **Grid**: 7x7 tile grid (144px tiles), centered on 1920x1080 canvas at offset (456, 36). Core at exact center (col 3, row 3). All positions derive from grid coordinates.
- **Config-driven**: All numeric values (costs, damage, HP, speeds, rewards) live in `GameConfig.js`. No magic numbers in game logic.
- **No pathfinding**: Bugs use vector steering toward the Command Core with obstacle avoidance.
