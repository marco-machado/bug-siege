# Bug Siege

## What This Is

Top-down tower defense game built with Phaser 3 and Vite. Players defend a central command core from 10 waves of alien bugs by placing and upgrading turrets on a 7x7 grid. Fully playable, fully themed — v1.0 shipped 2026-04-20 with a complete cosmic nebula visual identity, procedural animation on all entities, particle-based combat VFX, tiered screen shake, atmospheric vignette, and a cohesive color palette across every UI surface.

## Core Value

A satisfying, juicy tower defense that feels as good to watch as it is to play — every hit, kill, and wave clear delivers visual impact within a cohesive cosmic atmosphere.

*Note: v1.0 deliberately narrowed the core value from "visual and audio impact" to visual-only when AUDIO-0x was dropped at close. The audio layer remains functional (CC0 SFX + looping BGM) but ambient/pitch/crossfade enhancements are not part of the identity.*

## Current State

**Shipped:** v1.0 Cosmic Polish & Atmosphere (2026-04-20)

- 6 phases, 21 plans, ~2,555 LOC JavaScript ES modules
- Procedural nebula background, "Void Ethereal" palette, 14-key semantic `THEME.ui` dual-format entries
- Per-bug-type squash/stretch animation, core breathing tween, turret alpha idle pulse
- Particle-based combat VFX (death bursts, muzzle flash, build sparkle, core shockwave, slowfield aura, zapper glow trail)
- Tiered camera shake system; UIScene HUD isolated on separate camera
- Atmospheric vignette on GameScene (phase-reactive) + static vignette on boundary scenes
- Every hardcoded color literal migrated to `THEME.*` references across 8 source files

**Note:** Turret/core preFX glow halos were built in Phase 5 and then **removed post-playtest** (commit `ed293a9`). Vignette and theme migration retained.

## Next Milestone Goals

Not yet planned. Candidates carried forward to v2 (from REQUIREMENTS.md archive):

- POLISH-01: Spatial audio — bugs closer to camera center produce louder sounds
- POLISH-02: Wave complete celebratory screen shake
- POLISH-03: Improved Game Over screens (per QA.md)
- POLISH-04: Round turret sprites (per QA.md)
- POLISH-05: Turret target-locking fix — must not change targets unless current target leaves range (per QA.md)

Run `/gsd-new-milestone` to define fresh requirements for the next cycle.

## Requirements

### Validated

- ✓ Build/wave gameplay loop — pre-v1.0
- ✓ 4 turret types (Blaster, Zapper, Slowfield, Wall) with upgrades — pre-v1.0
- ✓ 4 bug types (Swarmer, Brute, Spitter, Boss) with distinct behaviors — pre-v1.0
- ✓ 10-wave progression with escalating difficulty — pre-v1.0
- ✓ Economy system (credits, kill rewards, wave bonuses, sell, repair) — pre-v1.0
- ✓ Build menu with place/upgrade/sell/repair — pre-v1.0
- ✓ Object pooling for bugs and bullets — pre-v1.0
- ✓ Game over (victory/defeat) with stats — pre-v1.0
- ✓ Starter turrets at grid corners — pre-v1.0
- ✓ Steering behavior and collision system — pre-v1.0
- ✓ "Void Ethereal" THEME palette in frozen GameConfig — v1.0 (THEME-01)
- ✓ Procedural nebula background texture — v1.0 (THEME-02)
- ✓ All UI colors reference THEME constants — v1.0 (THEME-03)
- ✓ Vignette atmospheric framing — v1.0 (THEME-05)
- ✓ Bug squash/stretch + type-specific animation signatures — v1.0 (ANIM-01, ANIM-04)
- ✓ Command core breathing tween — v1.0 (ANIM-02)
- ✓ Turret idle alpha pulse — v1.0 (ANIM-03)
- ✓ Tween cleanup on pooled Bug despawn — v1.0 (ANIM-05)
- ✓ Particle-based bug death burst, muzzle flash, build sparkle, core shockwave, boss extra-burst — v1.0 (VFX-01/02/03/05/07)
- ✓ Particle slowfield aura and zapper glow trail — v1.0 (VFX-04, VFX-06)
- ✓ Tiered camera shake (core damage / turret destruction / boss micro-shake) with UIScene isolation — v1.0 (SHAKE-01/02/03/04)

### Reversed

- ⊖ Post-FX glow/bloom on turrets and core — v1.0 (THEME-04); built in Phase 5 then removed in commit `ed293a9` after playtest. Vignette retained.

### Active

None yet — next milestone not defined. Run `/gsd-new-milestone`.

### Out of Scope

- Animated spritesheet walk cycles — procedural animation proved sufficient in v1.0
- New turret or bug types beyond the GDD — still polish-only scope
- Save/load system — explicitly out of scope in GDD
- Multiplayer — explicitly out of scope in GDD
- Accessibility features — important but separate milestone
- Pathfinding algorithm — GDD specifies simple steering, no change needed
- **Ambient/ethereal audio overhaul** — AUDIO-01..04 dropped at v1.0 close; audio stays as-is (CC0 SFX + looping BGM)
- Automated visual regression testing — no framework configured (per AGENTS.md); manual smoke-walk is the verification gate

## Context

- Shipped v1.0: ~2,555 LOC across `src/` (Phaser 3.80+, Vite 5.4+, JavaScript ES modules)
- Fixed 1920x1080 canvas with Arcade physics
- All game balance centralized in GameConfig.js as frozen objects; dual-format `{ hex, num }` THEME.ui entries are now the single source of truth for UI chrome colors
- Event-driven architecture (GameScene emits, UIScene listens)
- Turret is a composite class (not a Sprite), Bug and Bullet extend Phaser.Physics.Arcade.Sprite with pooling (bugs: 60, bullets: 50 turret + 20 spitter)
- Current visual style: cosmic nebula (deep purples/blues/accent white) — fully theme-migrated
- Audio: functional CC0 SFX + looping BGM from OpenGameArt; ambient/pitch/crossfade layer **not** implemented
- BootScene generates magenta fallback textures and silent audio when assets fail to load
- Performance metrics (fps, entity counts, particle count, memory) never empirically measured during v1.0 — flagged as tech debt
- QA.md backlog: round turret sprites, target-locking fix, improved Game Over screens

## Constraints

- **Tech stack**: Phaser 3.80+ / Vite 5.4+ / JavaScript ES modules — no TypeScript, no framework changes
- **Canvas**: Fixed 1920x1080 — no responsive layout needed
- **Asset format**: All assets must have CC0 or equivalent license for audio, PNG for sprites
- **Code style**: Must follow AGENTS.md conventions (2-space indent, single quotes, semicolons, K&R braces, named exports, .js extensions)
- **Performance target**: Must maintain 60fps with 60 bugs + 50 bullets + 20 spitter bullets + particles on screen (not empirically verified in v1.0)
- **No new bug/turret types** without re-scoping — core identity is polish, not expansion
- **THEME.ui semantic ceiling**: ≤14 keys (per D-06 from Phase 6) to prevent palette drift

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Procedural animation over spritesheets | Avoids multi-frame assets; code-driven, flexible, maintainable | ✓ Good — sin-wave squash/stretch, breathing, alpha pulse all shipped without asset work |
| Cosmic nebula theme | Ethereal feel; deep purples/blues with glow effects create cohesive atmosphere | ✓ Good — "Void Ethereal" palette is now single source of truth |
| Full atmosphere (visual + audio) | Theme shift should be holistic | ⊖ Partial — audio half dropped at close; visual/atmospheric half fully delivered |
| Both screen shake and particle effects | Maximum juice — every hit feels impactful | ✓ Good — tiered shake + particles across all combat events |
| Dual-format `{ hex, num }` THEME.ui | Phaser mixes numeric and string color APIs | ✓ Good — zero color conversion logic needed in consumer files |
| Semantic ceiling of 14 UI keys | Constrain palette to prevent drift | ✓ Good — gate E enforces this, migration held tight |
| Glow via preFX, vignette via camera postFX | Right Phaser tool for each scope | ⚠️ Revisit — glow was removed post-playtest; vignette approach validated |
| Upgrade glow swap via property mutation | Zero allocation, preserves FX handle | ⊖ Moot after glow removal (code pattern still valid for future effects) |
| Phase 6 re-scope from Audio → Theme | Theme migration was higher leverage than ambient audio given limited time | ✓ Good — shipped cohesive identity; audio deferred then dropped |
| Drop AUDIO-0x entirely at close | Audio layer was never implemented; not committing to future work | ✓ Good — clean scope, no carry-forward debt |

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
*Last updated: 2026-04-20 after v1.0 milestone*