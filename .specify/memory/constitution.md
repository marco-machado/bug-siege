<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0 (initial ratification)
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (5 principles)
  - Technical Constraints
  - Asset Pipeline
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md — no update needed (generic, compatible)
  - .specify/templates/spec-template.md — no update needed (generic, compatible)
  - .specify/templates/tasks-template.md — no update needed (generic, compatible)
  - .specify/templates/checklist-template.md — no update needed (generic, compatible)
  - .specify/templates/agent-file-template.md — no update needed (generic, compatible)
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

The 6x6 tile grid (64px cells) is the single source of truth for
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

- **Canvas**: 800x600 px, fixed resolution
- **Tile size**: 64x64 px
- **Build grid**: 6x6 tiles (384x384 px), centered on canvas
- **Scene flow**: Boot → MainMenu → Game → GameOver
- **Physics**: Arcade Physics only (no Matter.js, no P2)
- **Waves**: Exactly 10, compositions per GDD wave table
- **Bug movement**: Vector steering toward Command Core with
  simple obstacle avoidance; no A* or navmesh
- **Audio**: MP3/OGG format, loaded in Boot scene
- **Font**: Single bitmap or web font (e.g., Press Start 2P)

## Asset Pipeline

All visual assets MUST start as simple geometric placeholders
(colored rectangles, circles, basic shapes drawn with Phaser
Graphics or minimal PNGs). Placeholder assets MUST be
functionally complete (correct dimensions, hit areas, anchor
points) so gameplay can be tested before final art exists.
Final art MUST be swappable via asset key replacement without
code changes. Sprite dimensions MUST match the GDD asset table
(64x64 standard, 48x48 Swarmer, 80x80 Brute, 56x56 Spitter,
16x16 projectiles).

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

**Version**: 1.0.0 | **Ratified**: 2026-02-08 | **Last Amended**: 2026-02-08
