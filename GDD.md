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
- The base has a **health bar** (e.g., 200 HP). When it hits 0, game over.
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
- Structures can be **repaired** during build phase when damaged. Cost scales with damage taken (30% markup over proportional build cost).
- One **upgrade tier** per turret (doubles damage, costs 1.5× base price).
- Turrets **lock onto a target** until it dies or leaves range before acquiring a new one.

---

## Enemies — The Bugs

| Bug Type     | Speed  | HP  | Damage | Behavior                          |
| ------------ | ------ | --- | ------ | --------------------------------- |
| **Swarmer**  | Fast   | Low | Low    | Basic melee. Attacks nearest wall or core. |
| **Brute**    | Slow   | High | High  | Tanky. Walks straight to core.    |
| **Spitter**  | Medium | Med | Med    | Ranged attack on turrets.         |
| **Boss**     | V.Slow | V.High | V.High | Massive bug. Spawns in wave 10. |

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
  - Wave 10 (Boss): A Boss bug plus a full swarm.
- Short countdown timer between waves for building.

---

## Economy

- **Starting credits:** 200
- **Kill reward:** Swarmer 10 | Brute 25 | Spitter 15 | Boss 100
- **Wave clear bonus:** 50 + (wave number × 10)
- **Repair cost:** proportional to damage × 1.3 markup (e.g., Blaster at 50% HP costs 33 credits)

---

## Controls

- **Click** a grid tile → open build menu (radial or panel).
- **Click** an existing turret → show upgrade / sell / repair options.
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
│  [ HP ██████████░░ 144/200 ] │  ← Base health bar
│  [ Start Wave ]              │  ← Action button
└──────────────────────────────┘
```

---

## Game Dimensions

| Property         | Value                              |
| ---------------- | ---------------------------------- |
| Canvas           | 1920 × 1080 px                     |
| Grid tile size   | 64 × 64 px                         |
| Build grid       | 7×7 tiles (448×448 px), centered |
| Command Core     | Occupies 1 tile (center of grid)   |
| Map area outside grid | Bug spawning / movement zone  |

---

## Visual Style

- Top-down perspective.
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
| `bug_boss.png`       | 96×96   | Boss bug sprite, 4 frames                  |
| `bullet.png`         | 16×16   | Blaster projectile                         |
| `lightning.png`      | variable| Zapper beam (or draw with Phaser graphics) |
| `spit.png`           | 16×16   | Spitter projectile                         |
| `background.png`     | 1920×1080 | Desert/moon terrain                        |

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
| `sfx_shoot.ogg`      | Blaster fire            |
| `sfx_zap.ogg`        | Zapper chain            |
| `sfx_splat.wav`      | Bug death               |
| `sfx_hit.ogg`        | Base/turret/wall takes damage |
| `sfx_wave_start.wav` | Wave horn               |
| `sfx_build.ogg`      | Place structure         |
| `sfx_select.ogg`     | Menu selection (upgrade/repair) |
| `sfx_sell.ogg`       | Sell structure                  |
| `sfx_core_destroyed.ogg` | Core destruction explosion             |
| `sfx_victory.ogg`        | Victory jingle (all waves cleared)     |
| `bgm_wave.ogg`       | Looping background music (all phases)          |

### Audio Resources (CC0 — no attribution required)

| Asset Needed | Source |
| --- | --- |
| `sfx_shoot` | [63 Digital Sound Effects — Kenney (lasers, phasers, zaps)](https://opengameart.org/content/63-digital-sound-effects-lasers-phasers-space-etc) |
| `sfx_shoot` | [50 CC0 Retro/Synth SFX (shoot, laser, explosion)](https://opengameart.org/content/50-cc0-retro-synth-sfx) |
| `sfx_shoot` | [Freesound: Retro Lasers — bubaproducer](https://freesound.org/people/bubaproducer/packs/9318/) |
| `sfx_zap` | [63 Digital Sound Effects — Kenney (6 zap sounds)](https://opengameart.org/content/63-digital-sound-effects-lasers-phasers-space-etc) |
| `sfx_zap` | [60 CC0 Sci-Fi SFX](https://opengameart.org/content/60-cc0-sci-fi-sfx) |
| `sfx_splat` | [Fly Swatter Squish Sound (squish/splat combo)](https://opengameart.org/content/fly-swatter-squish-sound) |
| `sfx_splat` | [2 Wooden Squish Splatter Sequences](https://opengameart.org/content/2-wooden-squish-splatter-sequences) |
| `sfx_hit` | [50 CC0 Retro/Synth SFX (explosion/impact)](https://opengameart.org/content/50-cc0-retro-synth-sfx) |
| `sfx_hit` | [Space Sound Effects (6 explosions)](https://opengameart.org/content/space-sound-effects) |
| `sfx_wave_start` | [Sirens and Alarm Noise](https://opengameart.org/content/sirens-and-alarm-noise) |
| `sfx_wave_start` | [30 CC0 SFX Loops (3 alarm sounds)](https://opengameart.org/content/30-cc0-sfx-loops) |
| `sfx_build` | [Interface Sounds — Kenney (100 OGG files)](https://opengameart.org/content/interface-sounds) |
| `sfx_build` | [51 UI Sound Effects (buttons, switches, clicks)](https://opengameart.org/content/51-ui-sound-effects-buttons-switches-and-clicks) |
| `bgm_wave` | [Scifi City — Ambient Loop (seamless)](https://opengameart.org/content/scifi-city-ambient-loop) |
| `bgm_wave` | [Ominous Sci-Fi Menu — Looping](https://opengameart.org/content/ominous-sci-fi-menu-looping) |
| `bgm_wave` | [Ambience Pack 1 — Sci Fi Horror (5 loopable tracks)](https://opengameart.org/content/ambience-pack-1-sci-fi-horror) |

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
- Debug mode (`VITE_DEBUG_KEYS=true`): spawns bugs via number keys, shows live turret stats overlay (type, position, HP, damage, upgrade status).

---

## Win / Lose

- **Win:** Survive all 10 waves. Show score (kills, credits remaining, base HP).
- **Lose:** Base HP reaches 0. Show wave reached and kill count. Offer restart.
