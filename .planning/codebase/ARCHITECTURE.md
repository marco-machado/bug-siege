# Architecture

**Analysis Date:** 2026-04-15

## Pattern Overview

**Overall:** Layered Scene-Based Architecture with Event-Driven Communication

**Key Characteristics:**
- Phaser 3 scene-based game engine with parallel scenes (GameScene + UIScene overlay)
- Centralized configuration with immutable frozen objects
- Object pooling for performance-critical entities (bugs, bullets)
- Event-driven state synchronization between scenes
- Composite pattern for turrets (wrapping sprites and physics bodies)

## Layers

**Configuration Layer:**
- Purpose: Centralized game balance and tuning constants
- Location: `src/config/GameConfig.js`
- Contains: Frozen objects for GRID, TURRETS, BUGS, WAVES, ECONOMY, GAME, DEBUG, STEERING
- Depends on: None (pure data)
- Used by: All layers (entities, systems, scenes)

**Entity Layer:**
- Purpose: Game object representations with Phaser sprite inheritance
- Location: `src/entities/`
- Contains: Grid (plain class), Turret (composite class), Bug (Phaser.Physics.Arcade.Sprite), Bullet (Phaser.Physics.Arcade.Sprite)
- Depends on: Configuration layer, Phaser
- Used by: Scene layer for instantiation, System layer for operations

**System Layer:**
- Purpose: Game logic managers without Phaser scene dependency
- Location: `src/systems/`
- Contains: WaveManager, EconomyManager, BuildSystem
- Depends on: Configuration layer, Scene layer for context
- Used by: Scene layer for orchestration

**Scene Layer:**
- Purpose: Phaser scene lifecycle and visual orchestration
- Location: `src/scenes/`
- Contains: BootScene, MainMenuScene, GameScene, UIScene, GameOverScene
- Depends on: All layers below
- Used by: `src/main.js` for registration

**Application Layer:**
- Purpose: Entry point and Phaser game configuration
- Location: `src/main.js`
- Contains: Phaser game config and scene registration
- Depends on: Scene layer, Configuration layer
- Used by: Vite build system

## Data Flow

**Wave Progression Flow:**

1. GameScene creates WaveManager in create()
2. WaveManager.startWave() shuffles bug spawn queue
3. WaveManager.spawnNext() pulls from pool via `this.scene.bugs.get()`
4. Bug instances spawn with configuration from GameConfig.js
5. Bugs navigate to core using steering behaviors
6. On death, Bug emits 'bug-killed' event
7. GameScene.onBugKilled() processes reward and cleanup
8. WaveManager.onBugDied() tracks completion

**Event-Driven State Sync:**

GameScene emits events → UIScene listens and updates UI
- 'credits-changed' → EconomyManager spending/earning
- 'wave-changed' → Wave progression updates
- 'hp-changed' → Base health updates
- 'phase-changed' → Build/Wave phase transitions
- 'timer-tick' → Build phase countdown
- 'start-wave-early' → UIScene button triggers early wave start

**State Management:**
- Scene-specific state in scene.init() (phase, baseHp, totalKills, turrets array)
- Economic state in EconomyManager (credits with spend/earn methods)
- Wave state in WaveManager (currentWave, bugsAlive, spawn queue)

## Key Abstractions

**Turret (Composite Pattern):**
- Purpose: Wraps Phaser sprite + optional physics body + visual components
- Examples: `src/entities/Turret.js`
- Pattern: Composite object with `this.sprite` (visual), `this.wallBody` (collision), `this.hpBar*` (UI)

**Object Pooling:**
- Purpose: Reuse entity instances for performance
- Examples: `src/scenes/GameScene.js` lines 37-50
- Pattern: Phaser physics groups with `maxSize` and `classType`, managed via `spawn()`/`despawn()` methods

**Configuration Constants:**
- Purpose: Centralized balance tuning with immutability
- Examples: `src/config/GameConfig.js`
- Pattern: `Object.freeze()` on nested objects, UPPER_CASE exports

## Entry Points

**HTML Entry:**
- Location: `index.html`
- Triggers: Browser loads HTML, executes script
- Responsibilities: Sets up canvas container, loads `src/main.js`

**JavaScript Entry:**
- Location: `src/main.js`
- Triggers: Vite module loader
- Responsibilities: Configures Phaser game, registers scenes, starts BootScene

**Scene Entry:**
- Location: `src/scenes/BootScene.js`
- Triggers: Phaser scene manager
- Responsibilities: Loads assets, generates fallback textures/audio, transitions to MainMenuScene

## Error Handling

**Strategy:** Guard clauses with early returns and fallback generation

**Patterns:**
- Early returns for invalid state: `if (!this.active || !this.corePos) return;`
- Null checks before property access: `if (!target.sprite || !target.sprite.active) return;`
- Boolean returns from mutation methods (e.g., `takeDamage()` returns `true` if died)
- Fallback generation in BootScene for missing assets
- Cleanup on shutdown with scene event listeners

## Cross-Cutting Concerns

**Logging:** `console.error` for invalid configuration, `console.warn` for failed asset loads

**Validation:** Guard clauses in entity methods (e.g., Bug.spawn() validates type)

**Authentication:** Not applicable (single-player game)

**Audio:** GameScene.playSfx() with per-key cooldowns for rate limiting

**Physics:** Phaser Arcade physics with collision groups and overlap/collider setup

---

*Architecture analysis: 2026-04-15*