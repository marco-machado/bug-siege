# Requirements: Bug Siege — Cosmic Polish & Atmosphere

**Defined:** 2026-04-15
**Core Value:** A satisfying, juicy tower defense that feels as good to watch as it is to play — every hit, kill, and wave clear delivers visual and audio impact within a cohesive cosmic atmosphere.

## v1 Requirements

### Theme & Visual Foundation

- [ ] **THEME-01**: Add frozen THEME config object to GameConfig.js with cosmic nebula color palette (deep purples, blues, accent colors for bugs/turrets/UI)
- [ ] **THEME-02**: Generate procedural nebula background texture in BootScene (replacing background.jpg) using Graphics gradients and noise
- [ ] **THEME-03**: Migrate all hardcoded color values across 6+ files to reference THEME config constants
- [ ] **THEME-04**: Add post-FX glow/bloom on turrets and core (WebGL only, graceful degradation on Canvas)
- [ ] **THEME-05**: Add vignette camera effect for atmospheric framing

### Procedural Animation

- [ ] **ANIM-01**: Add wobble and squash-stretch movement animation to all bug types in Bug.preUpdate()
- [ ] **ANIM-02**: Add breathing/pulse animation to command core sprite
- [ ] **ANIM-03**: Add idle glow pulse on turrets, with brighter pulse for upgraded turrets
- [ ] **ANIM-04**: Add bug type-specific animation signatures (swarmer jittery, brute heavy, spitter pulsing)
- [ ] **ANIM-05**: Kill all orphaned tweens in Bug.despawn() to prevent visual corruption on pooled entity reuse

### Particles & VFX

- [ ] **VFX-01**: Replace circle+tween pseudo-particles with Phaser ParticleEmitter for bug death burst
- [ ] **VFX-02**: Replace circle+tween muzzle flash with particle-based muzzle flash emitter
- [ ] **VFX-03**: Replace rectangle flash build effect with particle sparkle on turret placement
- [ ] **VFX-04**: Replace static Graphics circle slowfield aura with particle emitter aura that follows turret position
- [ ] **VFX-05**: Add shockwave/ring particle effect on core damage
- [ ] **VFX-06**: Add glow trail effect on zapper lightning chain
- [ ] **VFX-07**: Add extra-large death burst particle effect for boss bug

### Screen Shake

- [ ] **SHAKE-01**: Add camera shake on core damage (intensity proportional to damage)
- [ ] **SHAKE-02**: Add camera shake on turret/wall destruction
- [ ] **SHAKE-03**: Add micro-shake on boss hit impacts
- [ ] **SHAKE-04**: Ensure UIScene HUD does not shake (GameScene camera only)

### Audio Atmosphere

- [ ] **AUDIO-01**: Add cosmic ambient drone audio layer (loops continuously under BGM)
- [ ] **AUDIO-02**: Add SFX pitch variation (slight random detune per play for variety)
- [ ] **AUDIO-03**: Add concurrent sound limit to prevent WebAudio node saturation
- [ ] **AUDIO-04**: Implement BGM crossfade between build phase (calm) and wave phase (intense)

## v2 Requirements

### Extended Polish

- **POLISH-01**: Spatial audio — bugs closer to camera center produce louder sounds
- **POLISH-02**: Wave complete celebratory screen shake
- **POLISH-03**: Improved Game Over screens (per QA.md)
- **POLISH-04**: Round turret sprites (per QA.md)
- **POLISH-05**: Turret target-locking fix — must not change targets unless current target leaves range (per QA.md)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Animated spritesheet walk cycles | Using procedural animation on static sprites instead |
| New turret or bug types | This milestone is polish, not new gameplay |
| Save/load system | Explicitly out of scope in GDD |
| Multiplayer | Explicitly out of scope in GDD |
| Accessibility features | Important but separate milestone |
| Pathfinding algorithm | GDD specifies simple steering, no change |
| New test framework | No tests configured per AGENTS.md — validate with `npm run build` |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| THEME-01 | Phase 1: Cosmic Foundation | Pending |
| THEME-02 | Phase 1: Cosmic Foundation | Pending |
| ANIM-05 | Phase 1: Cosmic Foundation | Pending |
| ANIM-01 | Phase 2: Living Entities | Pending |
| ANIM-02 | Phase 2: Living Entities | Pending |
| ANIM-03 | Phase 2: Living Entities | Pending |
| ANIM-04 | Phase 2: Living Entities | Pending |
| VFX-01 | Phase 3: Juicy Combat | Pending |
| VFX-02 | Phase 3: Juicy Combat | Pending |
| VFX-03 | Phase 3: Juicy Combat | Pending |
| VFX-05 | Phase 3: Juicy Combat | Pending |
| VFX-07 | Phase 3: Juicy Combat | Pending |
| VFX-04 | Phase 4: Impactful Effects | Pending |
| VFX-06 | Phase 4: Impactful Effects | Pending |
| SHAKE-01 | Phase 4: Impactful Effects | Pending |
| SHAKE-02 | Phase 4: Impactful Effects | Pending |
| SHAKE-03 | Phase 4: Impactful Effects | Pending |
| SHAKE-04 | Phase 4: Impactful Effects | Pending |
| THEME-04 | Phase 5: Atmospheric Glow | Pending |
| THEME-05 | Phase 5: Atmospheric Glow | Pending |
| AUDIO-01 | Phase 6: Ethereal Audio | Pending |
| AUDIO-02 | Phase 6: Ethereal Audio | Pending |
| AUDIO-03 | Phase 6: Ethereal Audio | Pending |
| AUDIO-04 | Phase 6: Ethereal Audio | Pending |
| THEME-03 | Phase 7: Cohesive Theme | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-15 after roadmap creation*