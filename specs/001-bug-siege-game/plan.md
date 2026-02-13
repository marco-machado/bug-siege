# Implementation Plan: Bug Siege — Tower Defense Game

**Branch**: `001-bug-siege-game` | **Date**: 2026-02-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-bug-siege-game/spec.md`

## Summary

Build a complete top-down tower defense game using Phaser 3 where players defend a Command Core from 10 waves of alien bugs by placing turrets on a 7x7 grid. The game uses Arcade Physics, object pooling, data-driven configuration, and vector steering (no pathfinding). Built with Vite + ES modules, targeting under 2,000 LOC with placeholder geometric art.

## Technical Context

**Language/Version**: JavaScript (ES2022+), Node.js 18+ for tooling
**Primary Dependencies**: Phaser 3 (game engine), Vite (build tool)
**Storage**: N/A (single-session, no persistence)
**Testing**: Manual playtesting (no automated test framework — game is visual/interactive)
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Single project (client-side Phaser game)
**Performance Goals**: 60 fps with 50+ bugs on screen simultaneously (SC-007)
**Constraints**: 800x600 fixed canvas, <2,000 LOC total, Arcade Physics only, no pathfinding
**Scale/Scope**: Single-player, 10 waves, ~10 minute sessions, 5 scenes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Phaser 3 Native** | PASS | All systems use Phaser 3 APIs: Arcade Physics, Scenes (Boot/MainMenu/Game/UIScene/GameOver), Groups for pooling, Graphics for rendering. No third-party libraries. |
| **II. Grid-Authoritative** | PASS | 7x7 grid (144px tiles) is the single source of truth. World positions derive from grid coords via `gridToWorld()`. Build slots, core location, and obstacle data stored in 2D array. |
| **III. Data-Driven Configuration** | PASS | All turret stats, bug stats, wave compositions, and economy values in `GameConfig.js`. Balance changes require editing only config data. |
| **IV. Object Pooling** | PASS | Bugs and bullets use Phaser Physics Group pooling. `maxSize` caps pool. `setActive(false)/setVisible(false)` + `body.enable = false` for recycling. No runtime object creation during waves. |
| **V. Scope Lock** | PASS | No pathfinding (vector steering), no save system, no multiplayer, no procedural waves. All features come from GDD. Target <2,000 LOC. |

### Post-Design Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Phaser 3 Native** | PASS | UIScene uses `scene.launch()` for parallel HUD. All visuals via Phaser Graphics API. Events via Phaser event system. |
| **II. Grid-Authoritative** | PASS | Grid entity manages all placement validation. Turret range checks use grid-derived pixel distances. Bug spawns use map-edge positions relative to grid. |
| **III. Data-Driven Configuration** | PASS | `GameConfig.js` defines 6 export objects covering all numeric values. Contracts document exact structure. `Object.freeze()` prevents mutation. |
| **IV. Object Pooling** | PASS | Pool sizes defined in config: 60 bugs, 50 bullets. SpitterBullet pooled separately. Particle effects use Phaser's built-in particle emitter pooling. |
| **V. Scope Lock** | PASS | 5 scenes, 3 entity types, 3 system managers. No features beyond GDD. Estimated ~1,200-1,500 LOC. |

## Project Structure

### Documentation (this feature)

```text
specs/001-bug-siege-game/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions and rationale
├── data-model.md        # Phase 1: Entity definitions and relationships
├── quickstart.md        # Phase 1: Setup and run instructions
├── contracts/           # Phase 1: Behavioral and configuration contracts
│   ├── game-config-contract.md
│   ├── scene-flow-contract.md
│   └── entity-behaviors-contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── main.js                    # Phaser game config + initialization
├── config/
│   └── GameConfig.js          # All balance data (turrets, bugs, waves, economy, grid)
├── scenes/
│   ├── BootScene.js           # Placeholder asset generation via Graphics API
│   ├── MainMenuScene.js       # Title screen with Start Game button
│   ├── GameScene.js           # Core gameplay loop (grid, physics, phases)
│   ├── UIScene.js             # HUD overlay (wave, credits, HP, start wave button)
│   └── GameOverScene.js       # Win/loss screen with stats and restart
├── entities/
│   ├── Grid.js                # 7x7 grid data structure + coordinate conversion
│   ├── Turret.js              # Turret class (targeting, firing, upgrade state)
│   ├── Bug.js                 # Bug class (steering, damage, type behavior)
│   └── Bullet.js              # Projectile class (pooled, despawn logic)
└── systems/
    ├── WaveManager.js         # Wave spawning, progression, completion detection
    ├── BuildSystem.js         # Build/upgrade/sell menus and validation
    └── EconomyManager.js      # Credits tracking and transaction validation

index.html                     # Entry point (loads src/main.js as ES module)
vite.config.js                 # Vite build config
package.json                   # Dependencies (phaser, vite)
```

**Structure Decision**: Single project structure. This is a client-side Phaser 3 game with no backend, no separate frontend framework, and no tests directory (testing is manual/visual). The `src/` directory is organized by architectural role: `config/` for data, `scenes/` for Phaser scenes, `entities/` for game object classes, `systems/` for gameplay managers.

## Complexity Tracking

> No violations detected. All design decisions comply with the five constitution principles.
