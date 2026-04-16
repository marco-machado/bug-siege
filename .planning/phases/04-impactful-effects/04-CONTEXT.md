# Phase 4: Impactful Effects - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Add particle-based slowfield aura, glow trail on zapper lightning chain, and a screen shake system triggered by core damage, turret/wall destruction, and boss hits. The goal is maximum juice — every impact should feel weighty and visible.

</domain>

<decisions>
## Implementation Decisions

### Slowfield Particle Aura
- **D-01:** Use radial pulse waves — periodic bursts of particles that expand outward from the turret center to the edge of the range, like sonar pings. Rhythmic, with lower sustained particle count than a persistent orbiting emitter. This is the first persistent/repeating emitter in the codebase (Phase 3 was all one-shot bursts).
- **D-02:** Use cosmic purple-blue tints (THEME nebula colors: 0x6a4c93, 0x9966ff) instead of the current cyan 0x44ddff. Matches the Void Ethereal palette immediately rather than deferring to Phase 7.
- **D-03:** Upgraded slowfield gets bigger radius (128→160px, already implemented) PLUS a brighter/different tint to visually distinguish upgraded from base. Clear visual feedback that the upgrade was worth the credits.

### Zapper Lightning Trail
- **D-04:** Use both a thick glowing line AND particle trail along the chain path. Replace the current 2px line (Turret.js:181) with a wider/brighter line, and spawn particles along the path that linger after the line fades. Maximum visual impact.
- **D-05:** Trail particles use lighter/whiter glow — accent white (0xeef2ff) or light purple. Creates a "hot center fading to cool edges" effect where the trail reads as residual energy/heat dissipating from the strike path.

### Screen Shake
- **D-06:** Use tiered intensity levels — three fixed shake tiers: light (swarmer hit, 0.005), medium (brute/spitter, 0.015), heavy (boss hit on core, 0.04). More controlled than linear scaling — each tier can be tuned independently.
- **D-07:** Duration scales with intensity — light shakes: 80ms, medium: 150ms, heavy: 250ms. Heavier hits feel more impactful with longer rumble.
- **D-08:** Shake stacking uses replace (latest wins) — each new shake interrupts the current one. Prevents disorienting sustained vibration during swarmer rushes. Simple implementation via `camera.shake()` on each trigger.
- **D-09:** Boss micro-shake (SHAKE-03) uses cooldown throttling — micro-shake triggers on boss `takeDamage()` but no more than once every 500ms. Balances felt impact with not being annoying during rapid-fire blaster streams. Check `this.bugType === 'boss'` in `Bug.takeDamage()`.
- **D-10:** UIScene HUD stability (SHAKE-04) is automatic — UIScene runs as a separate Phaser scene with its own camera. Shaking only `GameScene.cameras.main` satisfies this requirement with no additional work.

### Claude's Discretion
- Exact particle count and lifespan for slowfield pulse waves (tune for 60fps with 3-4 simultaneous slowfields)
- Exact thickness of the enhanced zapper line (4-6px range)
- Number of trail particles per chain segment (3-5 range)
- Easing curves for shake decay
- Whether turret destruction shake (SHAKE-02) uses medium or heavy tier

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — VFX-04, VFX-06, SHAKE-01, SHAKE-02, SHAKE-03, SHAKE-04 define exact scope

### Codebase (integration points)
- `src/entities/Turret.js` lines 181-194 — `drawLightningChain()` to be enhanced with glow + particles
- `src/entities/Turret.js` lines 196-206 — `updateSlowfieldAura()` slow logic (keep), `drawAura()` at 232-239 to be replaced with particle emitter
- `src/entities/Turret.js` lines 304-315 — `takeDamage()`/`destroy()` hook for SHAKE-02
- `src/entities/Bug.js` line 150 — `takeDamage()` hook for boss micro-shake (SHAKE-03)
- `src/scenes/GameScene.js` line 265 — `damageCore()` hook for SHAKE-01
- `src/config/GameConfig.js` lines 142-172 — existing `VFX` config to extend with SLOWFIELD, ZAPPER_TRAIL, SHAKE sections

### Prior phase context
- `.planning/phases/03-juicy-combat/03-CONTEXT.md` — Phase 3 particle API decisions (D-01 through D-04) that carry forward

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `'particle'` texture (4px solid circle) generated in BootScene — reuse for slowfield pulses and zapper trail
- `'particle-glow'` texture (4px soft-glow circle) generated in BootScene — potential use for zapper trail glow
- `VFX` frozen config object in `GameConfig.js` — extend with SLOWFIELD, ZAPPER_TRAIL, SHAKE sections
- `THEME` config with nebula colors (0x2d1b4e, 0x4b2c62, 0x6a4c93, accent 0xeef2ff) — use for slowfield and trail tinting

### Established Patterns
- **Frozen configs**: All VFX tuning values in `GameConfig.js` as `Object.freeze()` — new shake/aura/trail configs must follow
- **One-shot emitters**: Phase 3 established `this.add.particles(x, y, 'particle', config)` + `emitter.on('complete', () => emitter.destroy())` pattern for burst effects
- **Tween cleanup**: `scene.tweens.killTweensOf(target)` pattern from Phase 1 — apply to any persistent aura tweens
- **SFX cooldown**: `GameScene.playSfx()` with per-key cooldowns — similar throttle pattern applicable to boss micro-shake
- **Graphics lifecycle**: `drawLightningChain()` creates Graphics, destroys via `time.delayedCall(200ms)` — enhance but keep the cleanup pattern

### Integration Points
- `Turret.drawAura()` — replace Graphics fill/stroke with particle emitter; must update on upgrade (line 265)
- `Turret.drawLightningChain(targets)` — enhance with wider line + trail particles; targets array provides chain positions
- `GameScene.damageCore(amount)` — add `this.cameras.main.shake()` call after shockwave
- `Turret.destroy()` — add shake trigger for SHAKE-02
- `Bug.takeDamage(amount)` — add boss type check + cooldown-throttled shake for SHAKE-03

</code_context>

<specifics>
## Specific Ideas

- Slowfield pulse waves should feel like sonar pings — rhythmic, expanding outward, fading at the edge
- Zapper trail should read as "residual heat" — bright white core fading to purple edges
- Screen shake should never disrupt gameplay — replace stacking prevents swarmer-rush nausea

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-impactful-effects*
*Context gathered: 2026-04-16*
