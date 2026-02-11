# Research: Bug Siege — Tower Defense Game

**Feature Branch**: `001-bug-siege-game`
**Date**: 2026-02-08

## 1. Project Structure & Build Tooling

**Decision**: Vite + ES modules with scene-based folder structure.

**Rationale**: Vite is the modern standard for Phaser 3 projects (2025-2026). Lightning-fast HMR dev server, zero-config for simple projects, optimized production builds. Scene-based folder structure keeps the project organized under the 2,000 LOC target.

**Alternatives Considered**:
- Webpack: More configuration overhead, slower dev server. No benefit for a project this size.
- Vanilla script tags: No modules, no HMR, no tree-shaking. Only suitable for throwaway prototypes.

**Key Config**:
```javascript
// vite.config.js
import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } }
    }
  }
});
```

## 2. Grid System Approach

**Decision**: Manual 2D array + pixel math (no Phaser Tilemap).

**Rationale**: A 7x7 grid with simple empty/occupied/core states doesn't justify Tilemap overhead. Manual `gridToWorld()` / `worldToGrid()` conversion is trivial (multiply/divide by tileSize). The 2D array is the single source of truth per Constitution Principle II (Grid-Authoritative).

**Alternatives Considered**:
- Phaser Tilemap: Overkill for a 49-cell grid. Adds complexity (layer management, tileset loading) with no benefit.
- Tilemap with JSON: Same issue — configuration overhead not warranted.

**Key Pattern**:
```javascript
worldToGrid(wx, wy) {
  return { col: Math.floor((wx - gridOffsetX) / 64), row: Math.floor((wy - gridOffsetY) / 64) };
}
gridToWorld(col, row) {
  return { x: gridOffsetX + col * 64 + 32, y: gridOffsetY + row * 64 + 32 };
}
```

## 3. Physics & Collision Strategy

**Decision**: Arcade Physics with `physics.add.overlap()` for projectile-enemy hits, Physics Groups for pooling.

**Rationale**: Arcade Physics is mandated by the Constitution (Principle I). Overlap detection is the standard pattern for bullets hitting enemies — detects intersection without physical separation. Group-to-group overlap scales well with Arcade's built-in quad-tree.

**Alternatives Considered**:
- Matter.js / P2: Explicitly prohibited by Constitution (Arcade Physics only).
- Manual distance checks in update loop: Works but loses Arcade's spatial optimization.

## 4. Bug Steering (No Pathfinding)

**Decision**: Vector-based seek toward Command Core with distance-based obstacle avoidance.

**Rationale**: Constitution Principle V (Scope Lock) explicitly prohibits pathfinding algorithms. Bugs calculate a desired velocity vector pointing at the core, then add avoidance forces when obstacles (walls) are detected ahead. This produces organic-looking swarm movement.

**Alternatives Considered**:
- A*/NavMesh: Explicitly prohibited by Constitution and GDD.
- Flow fields: Overkill and out of scope.
- Pure physics collider (bounce off walls): Too janky — bugs would bounce randomly rather than navigate.

**Key Pattern**:
```javascript
// Seek: desired = normalize(core - position) * maxSpeed
// Steer: steer = desired - currentVelocity, limit to maxForce
// Avoid: if obstacle ahead, add perpendicular force away from obstacle
```

## 5. Object Pooling

**Decision**: `Phaser.Physics.Arcade.Group` with `get()`, `setActive(false).setVisible(false)`, and `body.enable = false` for recycling.

**Rationale**: Constitution Principle IV mandates object pooling. Phaser Groups have built-in pool behavior — `get()` returns an inactive member or creates a new one. Must explicitly disable physics bodies on despawn to prevent ghost collisions.

**Key Pattern**:
- Bullets: `maxSize: 50`, recycle on hit or out-of-bounds
- Bugs: `maxSize: 60`, recycle on death (wave 10 has 30 bugs + concurrent spawns)
- Particles: Phaser's built-in particle emitter handles its own pooling

## 6. Scene Architecture

**Decision**: 5 scenes — Boot, MainMenu, Game, UIScene (parallel), GameOver.

**Rationale**: Boot loads assets, MainMenu provides entry point, Game runs gameplay, UIScene overlays HUD in parallel (launched via `scene.launch()`), GameOver shows results. The parallel UIScene pattern keeps HUD rendering independent from game logic and provides clean input separation.

**Alternatives Considered**:
- HUD within Game scene: Works but mixes concerns. Separate UIScene is cleaner and matches Phaser best practices.
- 4 scenes (no separate UI): Viable for smaller games, but Bug Siege has enough HUD elements (wave counter, credits, health bar, start wave button) to justify separation.

**Data Flow**:
- MainMenu → Game: `scene.start('Game')`
- Game → UIScene: `scene.launch('UIScene')` (parallel)
- Game → UIScene updates: `game.events.emit('credits-changed', value)`
- Game → GameOver: `scene.start('GameOver', { kills, credits, wave, hp, won })`
- GameOver → MainMenu: `scene.start('MainMenu')`

## 7. Configuration Architecture

**Decision**: Single `GameConfig` module exporting frozen objects for turret stats, bug stats, wave compositions, and economy values.

**Rationale**: Constitution Principle III (Data-Driven Configuration) mandates all balance values in declarative config objects, not inlined in logic. A single module with named exports keeps everything discoverable and prevents circular dependencies.

**Structure**:
```javascript
// src/config/GameConfig.js
export const TURRETS = { ... };
export const BUGS = { ... };
export const WAVES = [ ... ];
export const ECONOMY = { ... };
export const GRID = { ... };
```

## 8. Asset Strategy

**Decision**: Phaser Graphics API for all placeholder visuals. No external image files for initial implementation.

**Rationale**: Constitution Asset Pipeline requires geometric placeholders with correct dimensions and hit areas. Using Phaser's Graphics API (rectangles, circles, lines) means zero asset loading complexity and instant iteration. Final art can be swapped in later by replacing Graphics draws with sprite keys.

**Key Approach**:
- Turrets: Colored rectangles (64x64) with barrel line
- Bugs: Colored circles (48/80/56 diameter per type)
- Projectiles: Small colored circles (16x16)
- Grid tiles: Stroked rectangles
- Core: Distinct colored rectangle with pulsing effect
- Health bar: Graphics rectangles (fill + background)

## 9. Audio Strategy

**Decision**: Defer audio to a polish phase. Game is fully playable without sound (per spec assumptions).

**Rationale**: Audio is explicitly optional per the spec. Implementing gameplay mechanics first, then adding audio as a final polish step, prevents audio from blocking core development. Phaser's `this.sound.play()` API is trivial to add later.
