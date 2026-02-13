# Bug Siege — Game Design Document

## Overview

**Genre:** Top-down Tower Defense
**Engine:** Phaser 3
**Theme:** Sci-fi base defense against alien bugs
**Core Fantasy:** Defend your command center from relentless waves of alien creatures by strategically placing turrets on a grid.

---

## Core Loop

1. **Build Phase** — Place or upgrade turrets on an open grid surrounding your base.
2. **Wave Phase** — Bugs spawn from the map edges and swarm toward the base. Turrets fire automatically.
3. **Reward** — Earn credits for each kill and wave completion. Spend them in the next build phase.
4. Repeat until the base is destroyed or all waves are cleared.

---

## The Base

- Centered on screen, occupies a **7×7 tile grid**.
- The **Command Core** sits in one tile (exact center); it is the primary target for bugs.
- Remaining grid tiles are **build slots** for turrets and utility structures.
- The base has a **health bar** (e.g., 100 HP). When it hits 0, game over.
- Four corner slots are pre-built with **Starter Turrets** (basic, low damage).

---

## Building

| Structure      | Cost | Description                                      |
| -------------- | ---- | ------------------------------------------------ |
| **Blaster**    | 50   | Basic turret. Moderate fire rate, single target.  |
| **Zapper**     | 100  | Chain lightning. Hits up to 3 nearby bugs.        |
| **Slowfield**  | 75   | Emits an aura that slows bugs within range.       |
| **Wall Block** | 25   | No attack. Absorbs hits, redirecting bug pathing. |

- Structures can be **sold** for 50% of their cost.
- One **upgrade tier** per turret (doubles damage, costs 1.5× base price).

---

## Enemies — The Bugs

| Bug Type     | Speed  | HP  | Damage | Behavior                          |
| ------------ | ------ | --- | ------ | --------------------------------- |
| **Swarmer**  | Fast   | Low | Low    | Basic melee. Attacks nearest wall or core. |
| **Brute**    | Slow   | High | High  | Tanky. Walks straight to core.    |
| **Spitter**  | Medium | Med | Med    | Ranged attack on turrets.         |

- Bugs spawn from **all four edges** of the map (N, S, E, W).
- Each wave specifies a spawn composition and count.
- Bugs use simple **steering behavior** — move toward the core, avoid obstacles if possible.

---

## Waves

- **10 waves** total for a short session (~10 min).
- Each wave increases bug count and introduces tougher types:
  - Waves 1–3: Swarmers only.
  - Waves 4–6: Mix of Swarmers + Brutes.
  - Waves 7–9: All three types.
  - Wave 10 (Boss): A massive Brute with 10× HP, plus a full swarm.
- Short countdown timer between waves for building.

---

## Economy

- **Starting credits:** 200
- **Kill reward:** Swarmer 10 | Brute 25 | Spitter 15
- **Wave clear bonus:** 50 + (wave number × 10)

---

## Controls

- **Click** a grid tile → open build menu (radial or panel).
- **Click** an existing turret → show upgrade / sell options.
- **Spacebar** or button → start next wave early (bonus credits).

---

## UI Layout

```
┌──────────────────────────────┐
│  Wave: 3/10    Credits: 350  │  ← HUD top bar
│                              │
│         ┌────────┐           │
│   bugs →│ GRID   │← bugs    │
│         │  BASE  │           │
│   bugs →│ CORE   │← bugs    │
│         └────────┘           │
│                              │
│  [ HP ██████████░░ 72/100 ]  │  ← Base health bar
│  [ Start Wave ]              │  ← Action button
└──────────────────────────────┘
```

---

## Game Dimensions

| Property         | Value                              |
| ---------------- | ---------------------------------- |
| Canvas           | 1920 × 1080 px                     |
| Grid tile size   | 64 × 64 px                         |
| Build grid       | 7×7 tiles (896×896 px), centered |
| Command Core     | Occupies 1 tile (center of grid)   |
| Map area outside grid | Bug spawning / movement zone  |

---

## Visual Style

- Pure top-down perspective.
- Alien desert / moon surface background.
- Purple/pink bug sprites. Blue/white mechanical structures.
- Particle effects for projectiles and bug deaths.

---

## Audio (Minimal)

- Turret firing SFX (pew, zap).
- Bug death splat.
- Wave start horn.
- Background ambient drone.

---

## Assets

### Visual Theme

**Cyberpunk / neon circuit board aesthetic.** Bugs are corrupted digital organisms. Turrets are glowing cyber-defense installations. The background is a lit-up PCB / motherboard landscape. Grid tiles resemble circuit board traces. All assets must be visually cohesive within this theme.

### Asset Manifest (13 files)

All entities are PNG, loaded at high resolution and displayed at game-logic size via `setDisplaySize()`. Source images should be **1024×1024** for entities and **1920×1080** for the background to look crisp at full HD. Generated with solid `#00ff00` background via FLUX.2 Pro, then background is removed in post-processing to produce transparency. Style: photorealistic — not pixel art, not retro, not cartoon.

#### Turrets (`assets/turrets/`)

| File | Texture Key | Display Size | Description |
|------|-------------|-------------|-------------|
| `blaster-base.png` | `turret-blaster-base` | 64×64 | Blaster turret base (static). Circular armored platform without barrel. Dark gunmetal plating, battle scorch marks. Does not rotate. Top-down view. |
| `blaster-barrel.png` | `turret-blaster-barrel` | 64×64 | Blaster turret barrel (rotating). Cannon barrel with blue plasma muzzle tip. Rendered as a separate sprite layered above the base, rotates to track targets. Top-down view. |
| `zapper.png` | `turret-zapper` | 64×64 | Cyberpunk chain lightning turret. Purple/violet tesla coil or energy conductor. Arcing electricity visual. Metallic base with glowing purple core. Top-down view. |
| `slowfield.png` | `turret-slowfield` | 64×64 | Cyberpunk slow field emitter. Cyan/teal pulsing aura device. Circular emitter dish with radiating energy rings. Metallic housing. Top-down view. |
| `wall.png` | `turret-wall` | 64×64 | Cyberpunk defensive wall block. Reinforced metal plating, rivets/bolts, glowing seam lines. Heavy armored look. Should tile visually when placed adjacent. Top-down view. |

#### Bugs (`assets/bugs/`)

| File | Texture Key | Display Size | Description |
|------|-------------|-------------|-------------|
| `swarmer.png` | `bug-swarmer` | 48×48 | Corrupted digital swarmer. Small, fast-looking insectoid. Green/lime glitch aesthetic, fragmented digital body, glowing green eyes. Swarm creature — numerous and weak. Top-down view. |
| `brute.png` | `bug-brute` | 80×80 | Corrupted digital brute. Large, armored, tank-like insectoid. Red/dark red with heavy digital plating, glowing orange eyes. Slow but intimidating. Visibly larger/heavier than swarmer. Top-down view. |
| `spitter.png` | `bug-spitter` | 56×56 | Corrupted digital spitter. Medium ranged attacker. Orange/amber with visible ranged attack organ (mouth/cannon). Glowing projectile buildup visible. Top-down view. |
| `boss.png` | `bug-boss` | 100×100 | Corrupted digital boss. Massive, intimidating apex predator. Deep purple with magenta energy, spikes/tendrils, intense glowing eyes. Should look like a final threat — 10× HP of a brute. Largest sprite in the game. Top-down view. |

#### Environment (`assets/environment/`)

| File | Texture Key | Display Size | Description |
|------|-------------|-------------|-------------|
| `core.png` | `core` | 64×64 | Command core / energy reactor. Octagonal metallic chassis with glowing blue-white energy orb at center. Pulsing cyan conduits. The player's base — must look important and worth defending. Top-down view. Note: `assets/sprites/core_spritesheet.png` has an animated version (29 frames, 128×128) used at runtime. |
| `background.jpg` | `background` | 1920×1080 | Full-canvas cyberpunk PCB / motherboard landscape. Dark navy/black base with glowing circuit traces, solder points, chip outlines. Subtle — must not compete with gameplay elements. No bright focal points. Dense and detailed. |
| `tile.png` | `tile` | 64×64 | Circuit board trace grid tile. Subtle trace lines forming a square cell. Must tile seamlessly when repeated in a 7×7 grid. Semi-transparent so background shows through. Glowing trace lines and solder points at intersections. |
| `bullet.png` | `bullet` | 8×8 | Turret projectile. Small glowing energy bolt — yellow/cyan, bright center with soft glow falloff. Must be visible against dark background at small size. |
| `spitter-bullet.png` | `spitter-bullet` | 8×8 | Spitter bug projectile. Small corrupted energy glob — orange/red, organic-looking, slightly irregular shape. Distinct from turret bullet color. |

### Asset Generation Workflow

#### Tool: FLUX.2 Pro (Black Forest Labs)

Generate photorealistic sprites using FLUX.2 Pro. Target **1024×1024 PNG** for all entities, **1920×1080 JPEG** for the background. Solid `#00ff00` green background (FLUX.2 does not output transparency natively — remove background in post-processing). Style: photorealistic — not pixel art, not retro, not cartoon.

#### Prompts

All prompts and the prompting methodology are documented in [`FLUX2.md`](FLUX2.md).

#### Post-Processing

After generation, trim transparent padding and ensure correct dimensions:

```bash
# Trim padding from individual sprites (resizes to 1024×1024)
./scripts/trim-sprite.sh assets/turrets/*.png
./scripts/trim-sprite.sh assets/bugs/*.png
./scripts/trim-sprite.sh assets/environment/core.png assets/environment/tile.png
./scripts/trim-sprite.sh assets/environment/bullet.png assets/environment/spitter-bullet.png
```

> **Note**: `trim-sprite.sh` currently resizes to 64×64. Update the script's target size to **1024×1024** for HD assets before running.

Target output sizes:
- All entity sprites: **1024×1024** PNG with transparency
- Background: **1920×1080** JPEG (no trim needed)

After processing, place assets in their final directories and verify in-game. Phaser's `setDisplaySize()` handles scaling to game-logic sizes at runtime.

### Particles / FX (generated in code)

- Explosion puff (bug death)
- Muzzle flash
- Slow aura circle

### Audio (MP3/OGG — future)

| Asset                | Notes                   |
| -------------------- | ----------------------- |
| `sfx_shoot.mp3`      | Blaster fire            |
| `sfx_zap.mp3`        | Zapper chain            |
| `sfx_splat.mp3`      | Bug death               |
| `sfx_hit.mp3`        | Base takes damage       |
| `sfx_wave_start.mp3` | Wave horn               |
| `sfx_build.mp3`      | Place structure         |
| `bgm_ambient.mp3`    | Looping background music|

### Font

- One bitmap or web font (e.g., `Press Start 2P` or system monospace)

---

## Scope Constraints

- **No pathfinding algorithm needed** — bugs steer toward the core with simple vector movement + obstacle avoidance.
- **No save system** — single-session play.
- **No multiplayer.**
- Aim for **< 2,000 lines of code** total.

---

## Tech Notes (Phaser 3)

- Use **Phaser.Scene** for: `Boot`, `MainMenu`, `Game`, `GameOver`.
- Tilemaps or a simple 2D array for the grid.
- **Arcade Physics** for movement and collision.
- Object pools for bullets and bugs (performance).
- Tween-based health bar animations.

---

## Win / Lose

- **Win:** Survive all 10 waves. Show score (kills, credits remaining, base HP).
- **Lose:** Base HP reaches 0. Show wave reached and kill count. Offer restart.
