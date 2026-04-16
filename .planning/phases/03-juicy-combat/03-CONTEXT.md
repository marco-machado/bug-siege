# Phase 3: Juicy Combat - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all pseudo-particle effects (circle+tween patterns) with Phaser ParticleEmitter for five combat events: bug deaths, muzzle flash, turret placement, core damage shockwave, and boss death burst. The goal is satisfying particle effects that feel juicy without hurting the 60fps performance budget.

</domain>

<decisions>
## Implementation Decisions

### Particle API
- **D-01:** Use the Phaser 3.60+ modern particle API: `this.add.particles(x, y, key, config)` — the codebase is on Phaser 3.80+ and the old `createEmitter()` API is deprecated. Use `explode(count, x, y)` for one-shot burst events.

### Particle Textures
- **D-02:** Add small dedicated particle textures in BootScene alongside existing fallback textures — a 4px solid circle named `'particle'` and optionally a 4px soft-glow circle named `'particle-glow'`. This follows the all-runtime-generated texture pattern established in Phase 1. No external image assets.

### Emitter Lifecycle
- **D-03:** Use fire-and-forget one-shot emitters: create emitter with `maxParticles` set, call `explode()`, emitter auto-destroys when particles expire. No persistent emitters for these burst effects. For muzzle flash (sub-100ms), set `lifespan: 80` with `quantity: 5`.

### Config Location
- **D-04:** Add a `VFX` frozen object to `GameConfig.js` containing particle count, speed, lifespan, and scale values for each effect type. Keep inline constants out of entity methods — consistent with the frozen config pattern used across the codebase.

### Bug Death Bursts
- **D-05:** Replace `showBugDeathEffect()` (GameScene.js:330) with a Phaser emitter. Retain existing per-type colors (`swarmer: 0x44ff44, brute: 0xff4444, spitter: 0xff8844, boss: 0x9900ff`). Non-boss: 10 particles, spread 40px, lifespan 350ms. Boss uses a separate enhanced spec (D-07).

### Muzzle Flash
- **D-06:** Replace `showMuzzleFlash()` (Turret.js:243) with a particle emitter at the barrel tip. 5 particles, radiate outward in a narrow forward cone (±30° from firing angle), lifespan 80ms, scale 0.3–1.0, color `0xffffaa`. Stays visually tight and fast.

### Boss Death Burst
- **D-07:** Boss death gets an extra-large multi-color burst: 30 particles, all four bug-type colors mixed, spread 80px radius, scale 0.5–2.0, lifespan 600ms. Distinctly larger than regular enemy death.

### Build Sparkle
- **D-08:** Replace `showBuildFlash()` (GameScene.js:352) with a sparkle emitter at tile center. 12 particles, tint from THEME nebula accents (`0x9966ff`, `0xeef2ff`), burst outward and float up slightly, lifespan 400ms.

### Core Shockwave (VFX-05)
- **D-09:** Core damage shockwave: add a ring/expanding-circle effect using a Graphics object that scales outward then fades (not a particle emitter — a single animated ring conveys shockwave better than scattered particles). Ring starts at core radius (~30px), expands to ~120px, alpha fades 1.0→0, duration 400ms. One tween, one Graphics object, destroyed on complete. Intensity can scale with damage amount via ring count (1 for normal, 2 stacked for boss hit).

### Claude's Discretion
- Exact easing curves for particle movement (linear vs ease-out)
- Whether to add slight rotation to death burst particles
- Performance fallback if particle count causes frame drops (reduce counts proportionally)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — VFX-01, VFX-02, VFX-03, VFX-05, VFX-07 define the exact scope for this phase

### Codebase
- `src/scenes/GameScene.js` lines 330–360 — existing `showBugDeathEffect()` and `showBuildFlash()` to be replaced
- `src/entities/Turret.js` lines 243–250 — existing `showMuzzleFlash()` to be replaced
- `src/scenes/BootScene.js` — where new particle textures must be added
- `src/config/GameConfig.js` lines 136–140 — THEME config (add VFX config here)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `THEME` config in `GameConfig.js:136` — nebula colors (`0x2d1b4e`, `0x4b2c62`, `0x6a4c93`) and accent `0xeef2ff` for build sparkle tinting
- `BootScene.js` — owns all texture generation; add particle textures here
- `GameScene.damageCore()` at line 265 — hook point for core shockwave trigger
- `Turret.showMuzzleFlash()` at line 243 — replace implementation here

### Established Patterns
- **Frozen configs**: All tuning values live in `GameConfig.js` as `Object.freeze()` objects — VFX config must follow same pattern
- **BootScene texture generation**: All procedural textures use `this.make.graphics()` + `generateTexture()` pattern
- **Tween cleanup**: Phase 1 established `scene.tweens.killTweensOf(target)` pattern for safety — apply to any Graphics-based shockwave rings

### Integration Points
- `GameScene.showBugDeathEffect(x, y, type)` — replace body, keep signature
- `GameScene.showBuildFlash(x, y)` — replace body, keep signature; rename optionally to `showBuildSparkle`
- `Turret.showMuzzleFlash()` — replace body, keep method name
- New method needed: `GameScene.showCoreShockwave(x, y, damageAmount)` — called from `damageCore()`

</code_context>

<specifics>
## Specific Ideas

- Shockwave is a ring (Graphics), not scattered particles — a single expanding ring reads as "impact radiating outward" better than dots
- Boss death should feel distinctly different: more particles, bigger spread, more colors, longer duration
- Muzzle flash stays tight and directional (not an omnidirectional burst) to preserve clarity during fast combat

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-juicy-combat*
*Context gathered: 2026-04-16*
