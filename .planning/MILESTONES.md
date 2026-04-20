# Milestones — Bug Siege

Historical record of shipped versions.

---

## v1.0 — Cosmic Polish & Atmosphere

**Shipped:** 2026-04-20
**Phases:** 6 (1-6)
**Plans:** 21
**Timeline:** 5 days (2026-04-15 → 2026-04-20)
**LOC:** ~2,555 across `src/` (JavaScript ES modules)

### Delivered

Transformed Bug Siege's visual identity from utilitarian sci-fi to a cosmic nebula aesthetic with full juice and atmosphere — procedural nebula background, per-bug-type squash/stretch animation, core breathing, particle-based combat VFX, tiered screen shake, atmospheric vignette, and a fully cohesive cosmic palette across every UI surface.

### Key Accomplishments

1. **"Void Ethereal" THEME palette** locked as the single source of truth for cosmic colors across all scenes
2. **Procedural nebula background** generated via HTML5 Canvas in BootScene — no external image assets
3. **Procedural animation layer** — sin-wave squash/stretch on bugs (jittery/heavy/pulsing signatures), breathing core, alpha-pulse turret idle
4. **Particle-based combat VFX** replaced all circle+tween pseudo-particles — death bursts, muzzle flashes, build sparkle, core shockwave, slowfield aura, zapper glow trail
5. **Tiered camera shake system** — subtle/heavy/micro tuned per hit type; UIScene HUD isolated on separate camera
6. **Full theme migration** — every hardcoded color literal across 8 source files migrated to 14 semantic dual-format `{ hex, num }` THEME.ui entries
7. **Atmospheric vignette** on GameScene (phase-reactive tween) + static vignette on MainMenu and GameOver; graceful Canvas-renderer fallback

### Key Decisions

- Procedural animation over spritesheets — avoided multi-frame asset creation
- Glow via per-sprite preFX + vignette via camera postFX
- Upgrade glow swap via direct `Glow.color` property mutation (zero allocation)
- Semantic ceiling of 14 UI palette keys to prevent drift
- Dual-format `{ hex, num }` THEME.ui entries to match Phaser's mixed color API
- Phase 6 re-scoped from "Ethereal Audio" to "Cohesive Theme" mid-milestone
- Turret/core glow halos removed post-playtest (commit `ed293a9`); vignette and theme retained

### Known Gaps (Dropped at Close)

- **AUDIO-01..04** (ambient drone, SFX pitch variation, concurrent sound limits, BGM crossfade) — **dropped entirely**, not carried forward
- **Performance metrics never empirically measured** — frame rate, entity counts, particle count, memory all still "Unknown" in STATE.md

### Artifacts

- `.planning/milestones/v1.0-ROADMAP.md` — full phase details
- `.planning/milestones/v1.0-REQUIREMENTS.md` — requirements final state and traceability
- Git tag: `v1.0`
