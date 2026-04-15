# Research Summary: Bug Siege — Cosmic Polish & Atmosphere

**Synthesized:** 2026-04-15
**Status:** Complete (FEATURES.md missing — features reconstructed from PROJECT.md + ARCHITECTURE.md)

## Executive Summary

Bug Siege is a functionally complete Phaser 3 tower defense game that needs a comprehensive visual and audio polish pass to transform its utilitarian sci-fi look into a cosmic nebula aesthetic. The good news: Phaser 3.90.0 already installed in this project provides every system needed — FX Pipeline (bloom/glow/vignette), particle emitters, camera shake, tween chains, blend modes, and WebAudio with detune — with zero new dependencies. The entire polish milestone can be built entirely from Phaser's built-in capabilities.

The recommended approach is config-driven: create a frozen `THEME` object in GameConfig.js holding all colors, particle presets, shake presets, and animation timings, then build a `VFXManager` system that replaces the existing circle+tween pseudo-particles with real Phaser particle emitters. Procedural animations (bug wobble/squash, turret glow pulse, core breathing) are entity-local — no animation manager needed. Audio atmosphere enhances the existing `playSfx()` system with BGM crossfade and pitch variation rather than introducing a new class. The theme overhaul replaces 40+ hardcoded color values across 6+ files with THEME references in one atomic pass to avoid the "mixed palette" trap.

The key risks are all about integration with existing patterns: tweening the Turret composite instead of `turret.sprite` silently fails, orphaned tweens on pooled Bug objects cause visual corruption on respawn, per-event emitter creation leaks memory, and the GameScene/UIScene parallel-camera split means screen shake only affects the game world (by design — HUD stays stable). Each of these has a clear prevention strategy documented in the pitfalls research.

## Key Findings

### Stack

1. **Phaser 3.90.0 (already installed)** — provides all 14 FX Pipeline effects, particle emitters with `explode()`/`flow()`, camera shake, tween chains, ADD blend mode, and WebAudio with detune/rate control. No npm installs needed.
2. **FX Pipeline is WebGL-only** — `Phaser.AUTO` renderer uses WebGL on 99%+ browsers; Canvas fallback silently skips glow/bloom/vignette but game still plays. Design effects as progressive enhancement.
3. **Particle emitters are standalone GameObjects since Phaser 3.60** — no ParticleEmitterManager needed. Call `this.add.particles(x, y, texture, config)` directly. Use `explode()` for bursts, `flow()` for continuous.
4. **Performance budget: <300 total particles, <100 per emitter** — with 60 bugs + 70 bullets already on screen, particle counts must stay conservative. Short lifespans (<400ms), small burst counts (8-12), ADD blend mode for glow that doesn't obscure gameplay.
5. **Procedural textures via `graphics.generateTexture()`** — generate small particle textures (4x4 to 16x16 soft circles) in BootScene instead of shipping PNG files. Consistent with existing fallback generation pattern.

### Table Stakes

These features must exist or players immediately notice the absence:

- **Procedural bug animation** — bugs are currently static sprites; squash/stretch on damage and subtle wobble during movement make them feel alive
- **Particle death bursts** — replacing the current circle+tween pseudo-particles with real emitter-based bursts for bug kills
- **Screen shake on core damage** — the most visceral feedback moment; players expect the screen to react when their core takes a hit
- **Cosmic nebula color palette** — the entire visual identity shift from utilitarian sci-fi to deep purples/blues with soft glow
- **UI theme consistency** — menus, HUD, and game-over screen must all use the cosmic palette; mixed palettes look broken

### Differentiators

These features create the "wow" factor:

- **Slowfield particle aura** — a visible energy field of flowing particles instead of a static circle; most visually distinctive turret effect
- **Boss death mega-burst** — larger, multi-color particle explosion for boss kills with stronger camera shake
- **BGM crossfade between build/wave phases** — ethereal ambient during building, intensifying during waves; creates emotional arc
- **Turret idle glow pulse** — `sprite.postFX.addGlow()` with tweened `outerStrength` gives turrets a living, breathing presence
- **Core breathing animation** — sinusoidal scale pulse on the central command core makes it feel alive even when idle

### Watch Out For

1. **Tweening Turret composite instead of `turret.sprite`** — silently does nothing with no error. Always tween `turret.sprite`. Grep for `targets: turret` without `.sprite` as verification.
2. **Orphaned tweens on pooled Bug objects** — tweens survive despawn and corrupt respawned bugs. Must add `this.scene.tweens.killTweensOf(this)` + property resets in `despawn()` before adding any procedural tweens.
3. **Circle+tween pseudo-particles don't scale** — current `showBugDeathEffect` creates 6-12 GameObjects per death. At 10 simultaneous deaths = 60-120 objects created/destroyed in 300ms. Replace with persistent emitters using `emitParticleAt()`.
4. **Incremental theme migration creates visual incoherence** — 40+ color values across 6+ files. Changing them file-by-file produces extended "mixed palette" states that look worse than either palette alone. Create THEME config first, replace all references atomically, then change THEME values.
5. **Per-event emitter creation leaks memory** — `this.add.particles()` inside event handlers creates new GameObjects per kill. Use persistent emitters with `emitting: false` and `emitParticleAt()` instead.

## Implications for Roadmap

### Suggested Phase Structure

**Phase 1: Foundation — THEME Config + Tween Safety**
- Rationale: THEME config is the dependency for everything else. Tween cleanup in `despawn()` is a prerequisite before any procedural animation work. Both are zero-visual-change groundwork.
- Delivers: Frozen THEME object in GameConfig.js, `killTweensOf()` + property resets in Bug.despawn(), particle texture generation in BootScene
- Features: THEME config, tween safety net
- Pitfalls avoided: #1 (turret composite), #4 (orphaned tweens), #5 (incremental theme)

**Phase 2: Procedural Bug & Core Animation**
- Rationale: Bug animation is the most impactful per-frame visual change and depends on Phase 1's tween safety. Core breathing is a small addition in the same pass.
- Delivers: Bug wobble in preUpdate, squash/stretch on damage, core breathing pulse
- Features: Procedural bug animation, core breathing
- Pitfalls avoided: #4 (orphaned tweens — already fixed in Phase 1)

**Phase 3: VFXManager + Particle Effects**
- Rationale: VFXManager replaces existing circle+tween effects with real particles. Depends on THEME config (Phase 1) and BootScene textures (Phase 1). Can run parallel to Phase 2.
- Delivers: VFXManager class, death bursts, muzzle flashes, build sparkle, slowfield aura, camera shake with GameScene/UIScene convention
- Features: Particle effects, screen shake, slowfield aura
- Pitfalls avoided: #2 (circle+tween perf), #3 (camera shake boundary), #6 (per-event emitter creation)

**Phase 4: Turret Glow + Idle Animation**
- Rationale: Post-FX glow on turrets depends on THEME config and the VFXManager being in place for muzzle flash coordination. Small phase, high visual impact.
- Delivers: `sprite.postFX.addGlow()` with pulse tween on active turrets
- Features: Turret idle glow pulse
- Pitfalls avoided: #1 (turret composite tweening — reinforced)

**Phase 5: Audio Atmosphere**
- Rationale: Independent of visual systems, but should come after VFXManager so the audio-visual pairing can be tuned together. Depends on THEME.audio config from Phase 1.
- Delivers: Dual BGM crossfade (build/wave), ambient layer, enhanced playSfx with pitch variation, concurrent sound limit
- Features: Ethereal audio atmosphere
- Pitfalls avoided: #7 (WebAudio node saturation)

**Phase 6: Cosmic Nebula Theme Migration**
- Rationale: Touches the most files (6+) but is mechanically a search-and-replace of color values. Safest last because it has no structural dependencies — it's styling, not architecture. THEME config from Phase 1 makes this a one-pass replacement.
- Delivers: All hardcoded colors → THEME references, BootScene fallback update, GameOverScene update
- Features: Visual theme overhaul for all UI elements
- Pitfalls avoided: #5 (incremental theme incoherence)

**Phase 7: Integration + Balance Pass**
- Rationale: All systems are in place. Final pass to tune effect intensities, shake thresholds, particle counts, and audio levels. Verify performance at 60fps under full load.
- Delivers: Tuned, balanced, performant cosmic game
- Features: None new — polish and validation
- Pitfalls avoided: All — final verification against the "Looks Done But Isn't" checklist

### Research Flags

**Needs `/gsd-research-phase` during planning:**
- Phase 5 (Audio Atmosphere) — BGM asset sourcing (CC0 cosmic ambient tracks) and audio sprite configuration need specific asset decisions
- Phase 6 (Cosmic Nebula Theme) — nebula background generation approach (procedural vs. static asset) needs visual prototyping to decide

**Standard patterns (skip research):**
- Phase 1 (THEME config) — well-documented Phaser config pattern, no unknowns
- Phase 2 (Procedural animation) — straightforward tween + preUpdate math, all APIs verified
- Phase 3 (VFXManager + particles) — Phaser particle API thoroughly documented, patterns clear
- Phase 4 (Turret glow) — single `postFX.addGlow()` call + tween, trivial

## Research Quality

| Dimension | Confidence | Notes |
|-----------|-----------|-------|
| Stack | HIGH | All APIs verified via Context7 Phaser docs, npm registry, and project source code. Zero guesswork — every Phaser subsystem (FX Pipeline, particles, shake, tweens, audio) confirmed available in installed 3.90.0. |
| Features | MEDIUM | FEATURES.md was missing; features reconstructed from PROJECT.md Active Requirements and cross-referenced with architecture/pitfalls research. Scope is clear but prioritization within features needs user input. |
| Architecture | HIGH | Architecture research includes API-verified component designs, data flow diagrams, and code sketches. Pattern matches existing codebase conventions (plain classes, frozen configs, event-driven). Build order derived from real dependencies. |
| Pitfalls | HIGH | 7 critical pitfalls identified from codebase analysis (GameScene.js, Bug.js, Turret.js, BuildSystem.js) and Phaser version-specific gotchas (3.60 ParticleEmitterManager removal, tween lifecycle vs. pool lifecycle). Each has concrete prevention strategy and verification step. |

## Open Questions

1. **Nebula background approach** — Procedural generation (Graphics → generateTexture) vs. static PNG asset vs. TileSprite scrolling. Procedural is most flexible but may look less polished than hand-drawn. Needs visual prototyping.
2. **BGM asset sourcing** — Need CC0 cosmic/ethereal ambient tracks. Current BGM is functional but not cosmic. Options: find CC0 tracks + apply Phaser `setDetune()` for ethereal shift, or generate via tooling. Decision blocks Phase 5.
3. **SFX replacement scope** — Current SFX are sci-fi themed. Full replacement with cosmic/crystalline sounds (via jsfxr) vs. keeping some existing sounds with pitch/detune modification? Affects Phase 5 scope significantly.
4. **Camera flash on UIScene** — Should high-impact events (core damage, boss death) trigger a brief camera flash on UIScene in addition to GameScene shake? Adds full-screen feel without shaking HUD. Needs playtest decision.
5. **Accessibility of FX effects** — Should there be a "reduce effects" toggle for players sensitive to screen shake or particle density? Out of scope per PROJECT.md but worth noting for future milestone.

## Sources

- Context7 `/websites/phaser_io` — Phaser particle emitter system, FX pipeline, camera shake, tween system, audio system, blend modes, Graphics, TileSprite
- Context7 `/websites/phaser_io_api-documentation` — API docs for ParticleEmitter, Shake effect, PipelineManager, FX Controller, WebAudioSound
- GitHub `phaserjs/phaser` CHANGELOG.md — Version history, 3.85 and 3.90 changelogs
- npm registry — Phaser versions 3.80.0–3.90.0, Vite 5.4.21
- Project source code — `main.js`, `BootScene.js`, `GameScene.js`, `Bug.js`, `Turret.js`, `BuildSystem.js`, `vite.config.js`, `package.json`
- `.planning/codebase/CONCERNS.md` — Hardcoded colors, memory leaks, performance bottlenecks
- `.planning/PROJECT.md` — Feature scope, requirements, constraints, key decisions

---
*Synthesized: 2026-04-15*
