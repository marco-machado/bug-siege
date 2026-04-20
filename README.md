# Bug Siege

A top-down tower defense game built with [Phaser 3](https://phaser.io/) and [Vite](https://vitejs.dev/). Defend your command core from 10 waves of alien bugs by strategically placing turrets on a 7×7 grid.

## Gameplay

- **Build Phase** (20s) — Place and upgrade turrets around your base
- **Wave Phase** — Bugs swarm from all four edges; turrets fire automatically
- **10 waves** (~10 min session) culminating in a boss encounter

### Structures

| Structure   | Cost | Role                                        |
| ----------- | ---- | ------------------------------------------- |
| Blaster     | 50   | Single-target turret, moderate fire rate    |
| Zapper      | 100  | Chain lightning, hits up to 3 bugs          |
| Slowfield   | 75   | Aura that slows bugs within range           |
| Wall Block  | 25   | Absorbs hits and redirects bug pathing      |

### Bug Types

Swarmer (fast/weak) · Brute (slow/tanky) · Spitter (ranged) · Boss (wave 10)

## Getting Started

```bash
npm install
npm run dev       # Vite dev server at localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

## Architecture

Fixed 1920×1080 canvas, Arcade physics, all textures generated at runtime — no external image assets required.

```
src/
├── main.js                  # Phaser config + scene registration
├── config/GameConfig.js     # All tuning constants (GRID, TURRETS, BUGS, WAVES, ECONOMY)
├── entities/
│   ├── Grid.js              # 7×7 tile grid, placement validation
│   ├── Turret.js            # Composite class (sprite + optional physics body)
│   ├── Bug.js               # Physics sprite with steering + type behaviors
│   └── Bullet.js            # Pooled projectiles
└── systems/
    ├── WaveManager.js       # Wave progression and spawn queue
    ├── EconomyManager.js    # Credits and transactions
    └── BuildSystem.js       # Grid clicks, build/turret menus
```

**Scene flow:** `BootScene` → `MainMenuScene` → `GameScene` + `UIScene` (overlay) → `GameOverScene`

Cross-scene state sync uses Phaser's event system. See [`CLAUDE.md`](./CLAUDE.md) for detailed conventions and [`GDD.md`](./GDD.md) for the full design document.

## Tech Stack

- **Phaser 3** (Arcade Physics) — game engine
- **Vite** — dev server and build tooling
- **Vanilla JavaScript** (ES modules) — no transpilation

## License

See repository for license details.
