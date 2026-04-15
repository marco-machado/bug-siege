# Bug Siege

## What This Is

Top-down tower defense game built with Phaser 3 and Vite. Players defend a central command core from 10 waves of alien bugs by placing and upgrading turrets on a 7x7 grid. The game is functionally complete — all core mechanics work (build/wave loop, 4 turret types, 4 bug types, economy, win/lose). This milestone focuses on finishing GDD gaps and transforming the visual/audio identity from utilitarian sci-fi to a cosmic nebula aesthetic with full juice and atmosphere.

## Core Value

A satisfying, juicy tower defense that feels as good to watch as it is to play — every hit, kill, and wave clear delivers visual and audio impact within a cohesive cosmic atmosphere.

## Requirements

### Validated

- ✓ Build/wave gameplay loop — existing
- ✓ 4 turret types (Blaster, Zapper, Slowfield, Wall) with upgrades — existing
- ✓ 4 bug types (Swarmer, Brute, Spitter, Boss) with distinct behaviors — existing
- ✓ 10-wave progression with escalating difficulty — existing
- ✓ Economy system (credits, kill rewards, wave bonuses, sell, repair) — existing
- ✓ Build menu with place/upgrade/sell/repair — existing
- ✓ Object pooling for bugs and bullets — existing
- ✓ Game over (victory/defeat) with stats — existing
- ✓ Starter turrets at grid corners — existing
- ✓ Steering behavior and collision system — existing

### Active

- [ ] Procedural bug animation (squash/stretch, pulsing, wobble on current static sprites)
- [ ] Slowfield particle aura (visible energy field, not just a static circle)
- [ ] Screen shake on impacts (core damage, turret destruction, boss hits)
- [ ] Enhanced particle effects (bug death bursts, muzzle flashes, build sparkle)
- [ ] Cosmic nebula visual theme (deep purples/blues, nebula background, crystalline structures, soft glow)
- [ ] Ethereal audio atmosphere (cosmic ambient BGM, softer/crystalline SFX)
- [ ] Visual theme overhaul for all UI elements (menus, HUD, game over) to match cosmic palette

### Out of Scope

- Animated spritesheet walk cycles — using procedural animation on static sprites instead
- New turret or bug types beyond the GDD — scope is polish, not new gameplay
- Save/load system — explicitly out of scope in GDD
- Multiplayer — explicitly out of scope in GDD
- Accessibility features — important but separate milestone
- Pathfinding algorithm — GDD specifies simple steering, no change needed

## Context

- Brownfield project: ~1,700 lines across 12 source files, Phaser 3 + Vite, pure JavaScript ES modules
- Fixed 1920x1080 canvas with Arcade physics
- All game balance centralized in GameConfig.js as frozen objects
- Event-driven architecture (GameScene emits, UIScene listens)
- Turret is a composite class (not a Sprite), Bug and Bullet extend Phaser.Physics.Arcade.Sprite with pooling
- Current visual style: utilitarian sci-fi with purple/pink bugs and blue/white structures on dark background
- Current audio: functional SFX + looping BGM, all CC0 assets from OpenGameArt
- BootScene generates magenta fallback textures and silent audio when assets fail to load
- QA.md has open items: better game over screens, round turrets, target-locking fix, bugs-damage-core persistence

## Constraints

- **Tech stack**: Phaser 3.80+ / Vite 5.4+ / JavaScript ES modules — no TypeScript, no framework changes
- **Canvas**: Fixed 1920x1080 — no responsive layout needed
- **Asset format**: All assets must have CC0 or equivalent license for audio, PNG for sprites
- **Code style**: Must follow AGENTS.md conventions (2-space indent, single quotes, semicolons, K&R braces, named exports, .js extensions)
- **Performance**: Must maintain 60fps with 60 bugs + 50 bullets + 20 spitter bullets on screen
- **No new bug/turret types**: This milestone is about completing and polishing, not expanding gameplay

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Procedural animation over spritesheets | Avoids creating multi-frame assets; code-driven effects are more flexible and maintainable | — Pending |
| Cosmic nebula theme | User wants ethereal feel; deep purples/blues with glow effects create cohesive atmosphere | — Pending |
| Full atmosphere (visual + audio) | Theme shift should be holistic — visuals and audio together create immersion | — Pending |
| Both screen shake and particle effects | Maximum juice — the game should feel impactful on every hit | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-15 after initialization*