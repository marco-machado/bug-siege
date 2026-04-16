# Bug Siege — Cosmic Polish & Atmosphere Roadmap

**Milestone:** Cosmic polish & atmosphere  
**Core Value:** A satisfying, juicy tower defense that feels as good to watch as it is to play — every hit, kill, and wave clear delivers visual and audio impact within a cohesive cosmic atmosphere.

**Granularity:** Standard (7 phases)  
**Coverage:** 25/25 v1 requirements mapped

## Phases

- [x] **Phase 1: Cosmic Foundation** - Theme config, nebula background, tween safety net (completed 2026-04-15)
- [ ] **Phase 2: Living Entities** - Bug animation, core breathing, turret idle glow
- [ ] **Phase 3: Juicy Combat** - Death bursts, muzzle flashes, build sparkle, core shockwave
- [ ] **Phase 4: Impactful Effects** - Slowfield aura, zapper trails, screen shake system
- [ ] **Phase 5: Atmospheric Glow** - Post-FX glow/bloom on turrets, vignette framing
- [ ] **Phase 6: Ethereal Audio** - Ambient layer, SFX variation, BGM crossfade
- [ ] **Phase 7: Cohesive Theme** - Color migration across all UI elements

## Phase Details

**Plans:** 3 plans
Plans:
- [x] 01-01-PLAN.md — Theme config and tween safety net
- [x] 01-02-PLAN.md — Procedural nebula background
- [ ] 01-03-PLAN.md — Gap closure: correct THEME palette to match UI-SPEC
**UI hint:** yes

### Phase 2: Living Entities
**Goal:** Bugs animate, core breathes, turrets pulse — everything feels alive
**Depends on:** Phase 1 (tween safety)
**Requirements:** ANIM-01, ANIM-02, ANIM-03, ANIM-04
**Success Criteria** (what must be TRUE):
  1. Bugs wobble and squash/stretch as they move and take damage
  2. Command core pulses with breathing animation (sinusoidal scale)
  3. Turrets have idle glow that pulses slowly at rest
  4. Different bug types have distinct animation signatures (swarmer jittery, brute heavy, spitter pulsing)
**Plans:** TBD

### Phase 3: Juicy Combat
**Goal:** Key combat events trigger satisfying particle effects
**Depends on:** Phase 1, 2 (THEME config, file overlap)
**Requirements:** VFX-01, VFX-02, VFX-03, VFX-05, VFX-07
**Success Criteria** (what must be TRUE):
  1. Bug deaths trigger particle bursts (replacing circle+tween pseudo-particles)
  2. Turret firing shows muzzle flash particles at barrel position
  3. Turret placement shows sparkle particle effect on grid
  4. Core damage creates shockwave/ring particle effect radiating outward
  5. Boss deaths have extra-large, multi-color particle burst
**Plans:** TBD

### Phase 4: Impactful Effects
**Goal:** Slowfield has particles, zapper has trail, screen reacts to impacts
**Depends on:** Phase 3 (VFX foundation)
**Requirements:** VFX-04, VFX-06, SHAKE-01, SHAKE-02, SHAKE-03, SHAKE-04
**Success Criteria** (what must be TRUE):
  1. Slowfield turret has flowing particle aura (visible energy field, not static circle)
  2. Zapper lightning chain leaves glow trail particles along its path
  3. Core damage shakes camera with intensity proportional to damage taken
  4. Turret/wall destruction shakes camera
  5. Boss hit impacts cause micro-shake
  6. UIScene HUD remains stable during GameScene camera shake
**Plans:** TBD

### Phase 5: Atmospheric Glow
**Goal:** Turrets and core glow softly, screen has cinematic framing
**Depends on:** Phase 1 (THEME config), Phase 2 (turret animation foundation)
**Requirements:** THEME-04, THEME-05
**Success Criteria** (what must be TRUE):
  1. Turrets and command core have soft glow/bloom effect (WebGL only, graceful degradation on Canvas)
  2. Screen has subtle vignette effect framing the play area
**Plans:** TBD
**UI hint:** yes

### Phase 6: Ethereal Audio
**Goal:** Audio enhances cosmic atmosphere with ambient layer and phase-aware music
**Depends on:** Phase 1 (THEME.audio config)
**Requirements:** AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04
**Success Criteria** (what must be TRUE):
  1. Cosmic ambient drone layer plays continuously under BGM
  2. SFX have slight pitch variation (random detune) for auditory variety
  3. Concurrent sounds are limited to prevent WebAudio node saturation
  4. BGM crossfades between calm (build phase) and intense (wave phase) tracks
**Plans:** TBD

### Phase 7: Cohesive Theme
**Goal:** All UI elements use consistent cosmic color palette
**Depends on:** 1, 2, 3, 4, 5, 6 (touches many files)
**Requirements:** THEME-03
**Success Criteria** (what must be TRUE):
  1. All hardcoded color values across 6+ files reference THEME config constants
  2. Menus, HUD, and game-over screen have consistent cosmic nebula palette (no mixed colors)
**Plans:** TBD
**UI hint:** yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Cosmic Foundation | 2/3 | Gap closure | 2026-04-15 |
| 2. Living Entities | 0/0 | Not started | - |
| 3. Juicy Combat | 0/0 | Not started | - |
| 4. Impactful Effects | 0/0 | Not started | - |
| 5. Atmospheric Glow | 0/0 | Not started | - |
| 6. Ethereal Audio | 0/0 | Not started | - |
| 7. Cohesive Theme | 0/0 | Not started | - |

## Notes

- **Performance budget:** Must maintain 60fps with 60 bugs + 70 bullets + particles on screen
- **WebGL fallback:** Glow/bloom/vignette effects degrade gracefully on Canvas renderer
- **Asset licensing:** All audio assets must be CC0 or equivalent
- **Code style:** Follows AGENTS.md conventions (2-space indent, single quotes, semicolons, .js extensions)

---
*Roadmap created: 2026-04-15*  
*Last updated: 2026-04-16*
