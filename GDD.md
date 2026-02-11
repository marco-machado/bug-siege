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
| Canvas           | 800 × 600 px                       |
| Grid tile size   | 64 × 64 px                         |
| Build grid       | 7×7 tiles (896×896 px), centered |
| Command Core     | Occupies 1 tile (center of grid)   |
| Map area outside grid | Bug spawning / movement zone  |

---

## Visual Style

- Top-down isometric-ish perspective (or pure top-down for simplicity).
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

### Sprites (PNG, 64×64 unless noted)

| Asset                | Size    | Notes                                      |
| -------------------- | ------- | ------------------------------------------ |
| `tile_empty.png`     | 64×64   | Empty buildable grid slot                  |
| `tile_blocked.png`   | 64×64   | Non-buildable tile                         |
| `core.png`           | 64×64   | Command Core structure                     |
| `turret_blaster.png` | 64×64   | Base + barrel (rotate barrel toward predicted target position)|
| `turret_zapper.png`  | 64×64   | Chain lightning turret                     |
| `turret_slowfield.png`| 64×64  | Aura emitter                               |
| `wall_block.png`     | 64×64   | Defensive wall                             |
| `bug_swarmer.png`    | 48×48   | Spritesheet, 4 frames walk cycle           |
| `bug_brute.png`      | 80×80   | Larger sprite, 4 frames                    |
| `bug_spitter.png`    | 56×56   | 4 frames + spit animation                 |
| `bullet.png`         | 16×16   | Blaster projectile                         |
| `lightning.png`      | variable| Zapper beam (or draw with Phaser graphics) |
| `spit.png`           | 16×16   | Spitter projectile                         |
| `background.png`     | 800×600 | Desert/moon terrain                        |

### UI (PNG)

| Asset               | Notes                        |
| -------------------- | ---------------------------- |
| `healthbar_bg.png`   | Health bar background        |
| `healthbar_fill.png` | Green fill, scaled by HP     |
| `btn_start_wave.png` | Start wave button            |
| `icon_blaster.png`   | 32×32, build menu icon       |
| `icon_zapper.png`    | 32×32                        |
| `icon_slowfield.png` | 32×32                        |
| `icon_wall.png`      | 32×32                        |
| `icon_sell.png`      | 32×32                        |
| `icon_upgrade.png`   | 32×32                        |

### Particles / FX (can be generated in code)

- Explosion puff (bug death)
- Muzzle flash
- Slow aura circle

### Audio (MP3/OGG)

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

**Total unique image assets: ~20.** Most can be simple geometric placeholders initially, then swapped for polished art later.

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
