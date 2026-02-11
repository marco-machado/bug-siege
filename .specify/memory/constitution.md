<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0 (003-hd-photorealistic amendment)
Modified sections:
  - Technical Constraints — Canvas 800×600→1920×1080, Tile 64→128, Grid 384→896, Scene flow added UIScene
  - Asset Pipeline — Geometric placeholders → preloaded PNG/JPEG files with fallback handling, scaled sprite dimensions
Removed sections: N/A
Templates requiring updates: None (generic, compatible)
Follow-up TODOs: None
-->

# Bug Siege Constitution

## Core Principles

### I. Phaser 3 Native

All game systems MUST use Phaser 3 APIs and patterns. Scenes MUST
follow the documented lifecycle: `Boot`, `MainMenu`, `Game`,
`GameOver`. Physics MUST use Arcade Physics. Rendering, input,
audio, and tweens MUST go through Phaser's built-in managers.
Third-party libraries are prohibited unless Phaser lacks the
capability entirely and the GDD explicitly requires it.

**Rationale**: A single-engine approach eliminates integration
complexity and keeps the codebase under the 2,000 LOC target.

### II. Grid-Authoritative

The 7x7 tile grid (128px cells) is the single source of truth for
placement, targeting range calculations, and spatial queries.
World-pixel positions MUST derive from grid coordinates, never the
reverse. Build slots, the Command Core location, and obstacle data
MUST be stored in a grid data structure (2D array or Tilemap).

**Rationale**: A grid-authoritative model prevents floating-point
drift, simplifies collision logic, and matches the GDD's tile-based
build system.

### III. Data-Driven Configuration

Turret stats (cost, damage, fire rate, range, upgrade multipliers),
bug stats (speed, HP, damage, reward), wave compositions (spawn
counts, types, timing), and economy values (starting credits, kill
rewards, wave bonuses) MUST be defined in declarative configuration
objects, not inlined in game logic. Balancing changes MUST require
editing only config data, never logic code.

**Rationale**: The GDD defines all values in tables. Keeping them
in config preserves that structure, enables rapid balancing
iteration, and prevents logic regressions during tuning.

### IV. Object Pooling

Bullets, bug sprites, and particle effects MUST use Phaser's
`Group` pooling (or equivalent pool pattern). Creation of new
game objects during active wave gameplay MUST be avoided; pooled
instances MUST be recycled via `setActive(false)` /
`setActive(true)` patterns.

**Rationale**: The GDD explicitly mandates object pools for
performance. A full swarm wave can spawn 50+ bugs with concurrent
projectiles; pooling prevents GC stalls and frame drops.

### V. Scope Lock

Features not described in the GDD MUST NOT be implemented without
an explicit GDD amendment. Specifically prohibited: pathfinding
algorithms (bugs use vector steering + obstacle avoidance), save/
load systems, multiplayer networking, and procedural wave
generation. The total codebase MUST target fewer than 2,000 lines.

**Rationale**: The GDD's scope constraints exist to keep the game
shippable in a short development cycle. Scope creep is the primary
risk for a solo/small-team game project.

## Technical Constraints

- **Canvas**: 1920×1080 px, fixed resolution (Scale.FIT for smaller viewports)
- **Tile size**: 128×128 px (2× scale factor)
- **Build grid**: 7×7 tiles (896×896 px), centered on canvas
- **Scene flow**: Boot → MainMenu → Game + UI (parallel) → GameOver
- **Physics**: Arcade Physics only (no Matter.js, no P2)
- **Waves**: Exactly 10, compositions per GDD wave table
- **Bug movement**: Vector steering toward Command Core with
  simple obstacle avoidance; no A* or navmesh
- **Turret targeting**: Projectile turrets use predictive aiming
  (lead targeting based on bug velocity and bullet travel time);
  instant-damage turrets (Zapper) target current position
- **Audio**: MP3/OGG format, loaded in Boot scene
- **Font**: Single bitmap or web font (e.g., Press Start 2P)

## Asset Pipeline

Visual assets are individual PNG files (transparent) or JPEG
(backgrounds), organized by category in `assets/` subdirectories
(`turrets/`, `bugs/`, `environment/`). Assets are preloaded in
BootScene via `this.load.image()` with a progress bar. If any
asset fails to load, a bright magenta geometric fallback is
generated at runtime and a console warning is logged. Final art
MUST be swappable via texture key replacement without code
changes. Sprite dimensions MUST match the scaled asset table
(144×144 turrets/core/tile, 108×108 Swarmer, 180×180 Brute,
126×126 Spitter, 225×225 Boss, 18×18 projectiles).

## Governance

This constitution is the authoritative design and engineering
reference for Bug Siege. All implementation decisions MUST comply
with these principles. When a conflict arises between this
constitution and ad-hoc implementation preferences, the
constitution prevails.

**Amendments**: Any principle change MUST be documented with
rationale, approved by the project owner, and reflected in a
version bump. GDD changes that affect constitution principles
MUST trigger a constitution amendment before implementation.

**Versioning**: MAJOR for principle removals or redefinitions,
MINOR for new principles or material expansions, PATCH for
wording clarifications.

**Compliance**: Each feature spec and implementation plan MUST
include a constitution check verifying adherence to all five
core principles.

**Version**: 1.1.0 | **Ratified**: 2026-02-08 | **Last Amended**: 2026-02-10
