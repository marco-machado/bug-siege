# Phase 3: Juicy Combat - Research

**Researched:** 2026-04-16
**Domain:** Phaser 3.90 ParticleEmitter API, VFX integration patterns
**Confidence:** HIGH

## Summary

Phase 3 replaces five pseudo-particle implementations (circle+tween) with real Phaser 3.60+ ParticleEmitter calls. The codebase runs Phaser 3.90.0 which fully supports the modern `this.add.particles(x, y, key, config)` API — the old `createEmitter()` pattern must not be used. All work is confined to three files: `BootScene.js` (add particle texture), `GameConfig.js` (add VFX frozen config object), `GameScene.js` (replace two methods, add one new method), and `Turret.js` (replace one method). The core shockwave uses a Graphics tween rather than particles — a deliberate design decision already locked in CONTEXT.md.

The main planning risk is emitter lifecycle: fire-and-forget emitters must destroy themselves on the 'complete' event or they accumulate as leaked GameObjects. In pooled entity contexts (Turret), `this.scene` must be valid at the moment `showMuzzleFlash()` is called — the existing pattern of accessing `this.scene` is already used in Turret.js for other operations so this is safe.

**Primary recommendation:** Use `emitter.on('complete', () => emitter.destroy())` on every fire-and-forget emitter. Do not rely on `maxParticles` alone to garbage-collect the emitter object.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Use Phaser 3.60+ modern particle API: `this.add.particles(x, y, key, config)` — `createEmitter()` is deprecated. Use `explode(count, x, y)` for one-shot burst events.
- D-02: Add `'particle'` (4px solid circle) and optionally `'particle-glow'` (4px soft-glow) textures in BootScene using runtime Graphics generation. No external image files.
- D-03: Fire-and-forget one-shot emitters: create with `maxParticles`, call `explode()`, auto-destroy on complete. Muzzle flash: `lifespan: 80`, `quantity: 5`.
- D-04: Add `VFX` frozen object to `GameConfig.js` for all tuning constants.
- D-05: Replace `showBugDeathEffect()` (GameScene.js:330). Colors: swarmer 0x44ff44, brute 0xff4444, spitter 0xff8844, boss 0x9900ff. Non-boss: 10 particles, spread 40px, lifespan 350ms.
- D-06: Replace `showMuzzleFlash()` (Turret.js:243). 5 particles, ±30° forward cone, lifespan 80ms, scale 0.3–1.0, color 0xffffaa.
- D-07: Boss death: 30 particles, all four type colors mixed, 80px radius, scale 0.5–2.0, lifespan 600ms.
- D-08: Replace `showBuildFlash()` (GameScene.js:352). 12 particles, tints 0x9966ff and 0xeef2ff, float up, lifespan 400ms.
- D-09: Core shockwave uses Graphics ring (NOT particles). 30px→120px, alpha 1.0→0, 400ms tween. 1 ring normal, 2 rings for boss hit. Destroyed on complete.

### Claude's Discretion
- Exact easing curves for particle movement (linear vs ease-out)
- Whether to add slight rotation to death burst particles
- Performance fallback if particle count causes frame drops (reduce counts proportionally)

### Deferred Ideas (OUT OF SCOPE)
- None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VFX-01 | Replace circle+tween pseudo-particles with Phaser ParticleEmitter for bug death burst | Covered by D-05/D-07 — `this.add.particles` with per-type tint, `explode()`, `complete` → `destroy()` |
| VFX-02 | Replace circle+tween muzzle flash with particle-based muzzle flash emitter | Covered by D-06 — directional angle config, `getTipPosition()` hook, `lifespan: 80` |
| VFX-03 | Replace rectangle flash build effect with particle sparkle on turret placement | Covered by D-08 — 12-particle burst at tile center, THEME colors |
| VFX-05 | Add shockwave/ring particle effect on core damage | Covered by D-09 — Graphics ring tween from `damageCore()`, new `showCoreShockwave()` method |
| VFX-07 | Add extra-large death burst particle effect for boss bug | Covered by D-07 — conditional branch in `showBugDeathEffect()` for type === 'boss' |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Particle texture generation | BootScene (preload/create) | — | All procedural textures live in BootScene per project convention |
| VFX tuning constants | GameConfig.js (config layer) | — | All game balance values live in frozen config objects |
| Bug death / build sparkle effects | GameScene (game logic) | — | These methods already live in GameScene; keep signature, replace body |
| Muzzle flash | Turret.js (entity) | GameScene (scene ref) | Turret owns fire logic; `this.scene` reference already used for tweens |
| Core shockwave | GameScene (game logic) | — | `damageCore()` at line 265 is the trigger point; new helper method same file |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser | 3.90.0 | ParticleEmitter, Graphics, Tweens | Already installed; 3.60+ modern API required [VERIFIED: node_modules] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Phaser.Geom.Circle | built-in | Emit zone for radial burst | For shockwave ring tween |
| Phaser.Math.Angle | built-in | Compute forward-cone angle for muzzle flash | Already used in Turret.js |

No new npm packages are needed for this phase. [VERIFIED: codebase grep]

## Architecture Patterns

### System Architecture Diagram

```
BootScene.create()
  └─ generate 'particle' texture (4px solid circle, Graphics.generateTexture)
  └─ generate 'particle-glow' texture (optional soft variant)
       │
       ▼
GameConfig.js  ──  VFX = Object.freeze({ bugDeath, boss, muzzle, build, shockwave })
       │
       ├── GameScene.showBugDeathEffect(x, y, type)
       │     └─ this.add.particles(x, y, 'particle', { tint, speed, lifespan, scale, ... })
       │          └─ emitter.explode(count)
       │          └─ emitter.on('complete', () => emitter.destroy())
       │
       ├── GameScene.showBuildFlash(x, y)  [optionally renamed showBuildSparkle]
       │     └─ same pattern, THEME nebula tints
       │
       ├── GameScene.showCoreShockwave(x, y, damageAmount)  [NEW]
       │     └─ Graphics ring tween (not a particle emitter)
       │     └─ scene.tweens.add({ targets: ring, scaleX/Y, alpha: 0, ... onComplete: destroy })
       │
       └── Turret.showMuzzleFlash()
             └─ const tip = this.getTipPosition()
             └─ const fireAngle = Phaser.Math.RadToDeg(this.sprite.rotation - Math.PI/2)
             └─ this.scene.add.particles(tip.x, tip.y, 'particle', { angle: { min, max }, ... })
                  └─ emitter.explode(5)
                  └─ emitter.on('complete', () => emitter.destroy())
```

### Recommended Project Structure
No new directories needed — all changes are within existing files:
```
src/
├── config/GameConfig.js     # Add VFX frozen object (after THEME)
├── scenes/
│   ├── BootScene.js         # Add particle texture generation in create()
│   └── GameScene.js         # Replace showBugDeathEffect, showBuildFlash; add showCoreShockwave
└── entities/
    └── Turret.js            # Replace showMuzzleFlash body
```

### Pattern 1: Fire-and-forget burst emitter
**What:** Create emitter, immediately call `explode()`, destroy on 'complete'
**When to use:** All five VFX events in this phase (single-shot bursts, not looping)
**Example:**
```javascript
// Source: https://github.com/phaserjs/phaser/blob/master/changelog/3.60/ParticleEmitter.md
const emitter = this.add.particles(x, y, 'particle', {
  speed: { min: 40, max: 120 },
  lifespan: 350,
  scale: { start: 1, end: 0.2 },
  alpha: { start: 1, end: 0 },
  tint: 0x44ff44,
  blendMode: 'ADD',
  frequency: -1,    // -1 = explode mode, no automatic emission
});
emitter.explode(10);
emitter.on('complete', () => emitter.destroy());
```

**Alternate one-shot pattern using `quantity` in config:**
```javascript
// frequency: -1 puts the emitter in manual explode mode
// maxParticles alone does NOT destroy the emitter GameObject
const emitter = this.add.particles(x, y, 'particle', {
  lifespan: 350,
  speed: { min: 40, max: 120 },
  scale: { start: 1, end: 0 },
  alpha: { start: 1, end: 0 },
  tint: color,
  frequency: -1,
});
emitter.explode(count, x, y);  // x, y optional — override emitter position
emitter.on('complete', () => emitter.destroy());
```

### Pattern 2: Directional muzzle flash (angle cone)
**What:** Narrow ±30° forward burst from barrel tip
**When to use:** `showMuzzleFlash()` in Turret.js
**Example:**
```javascript
// Source: Phaser 3.60+ changelog ParticleEmitter.md
const tip = this.getTipPosition();
const fireAngle = Phaser.Math.RadToDeg(this.sprite.rotation - Math.PI / 2);
const emitter = this.scene.add.particles(tip.x, tip.y, 'particle', {
  angle: { min: fireAngle - 30, max: fireAngle + 30 },
  speed: { min: 60, max: 120 },
  lifespan: 80,
  scale: { start: 0.3, end: 1.0 },
  alpha: { start: 1, end: 0 },
  tint: 0xffffaa,
  frequency: -1,
});
emitter.explode(5);
emitter.on('complete', () => emitter.destroy());
```

### Pattern 3: Runtime particle texture in BootScene
**What:** 4px solid circle rendered to texture atlas via `generateTexture()`
**When to use:** Inside `BootScene.create()`, before `this.scene.start('MainMenu')`
**Example:**
```javascript
// Source: BootScene.js existing pattern (generateFallback)
const g = this.make.graphics({ x: 0, y: 0, add: false });
g.fillStyle(0xffffff, 1);
g.fillCircle(4, 4, 4);
g.generateTexture('particle', 8, 8);
g.destroy();
```
Note: Use `this.make.graphics()` (not `this.add.graphics()`) to avoid adding the Graphics to the display list. Use white (`0xffffff`) so `tint` on the emitter controls final color.

### Pattern 4: Core shockwave ring (Graphics tween)
**What:** Expanding ring that fades out — conveys radial shockwave better than particles
**When to use:** `showCoreShockwave(x, y, damageAmount)` called from `damageCore()`
**Example:**
```javascript
showCoreShockwave(x, y, damageAmount) {
  const ringCount = damageAmount >= 10 ? 2 : 1;  // boss vs normal
  for (let i = 0; i < ringCount; i++) {
    const ring = this.add.graphics();
    ring.lineStyle(3, 0xff4444, 1);
    ring.strokeCircle(0, 0, 30);  // draw at local origin; position via x/y
    ring.x = x;
    ring.y = y;
    this.tweens.add({
      targets: ring,
      scaleX: 4,   // 30 * 4 = 120px final radius
      scaleY: 4,
      alpha: 0,
      duration: 400,
      delay: i * 80,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}
```

### Pattern 5: Multi-color boss burst
**What:** 30 particles mixing all four bug type colors
**When to use:** When `type === 'boss'` in `showBugDeathEffect()`
**Example:**
```javascript
// color array interpolation — Phaser 3.60+
const emitter = this.add.particles(x, y, 'particle', {
  color: [0x44ff44, 0xff4444, 0xff8844, 0x9900ff],
  colorEase: 'linear',
  speed: { min: 60, max: 200 },
  lifespan: 600,
  scale: { start: 0.5, end: 2.0 },  // note: grows outward
  alpha: { start: 1, end: 0 },
  frequency: -1,
});
emitter.explode(30);
emitter.on('complete', () => emitter.destroy());
```
Alternatively, use `tint: [0x44ff44, 0xff4444, 0xff8844, 0x9900ff]` — Phaser will randomly assign one tint per particle (simpler than color interpolation for a burst).

### Anti-Patterns to Avoid
- **Old `createEmitter()` API:** `const manager = this.add.particles('key'); manager.createEmitter({})` — deprecated since 3.60, must not be used. [VERIFIED: Context7]
- **`this.add.graphics()` for particle texture:** Creates a visible GO on the display list. Use `this.make.graphics({ add: false })` instead.
- **Relying on `maxParticles` for cleanup:** `maxParticles` stops new emissions but does not destroy the emitter GO. Always add `emitter.on('complete', () => emitter.destroy())`.
- **`scale: { start: 0.3, end: 1.0 }` for muzzle flash particles that grow:** Scale growing outward is intentional for muzzle flash to simulate bloom — don't invert this.
- **Tweening `Turret` directly:** Turret is composite (not a Sprite). If any future VFX needs to tween the turret visually, tween `turret.sprite` instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Particle burst | Manual circle + tween loop | `this.add.particles` + `explode()` | Current pattern is being replaced; Phaser handles pooling, batching, alpha/scale interpolation |
| Color interpolation across burst | Array of tinted tweens | `color: [...]` or `tint: [...]` in emitter config | Phaser cycles/interpolates per-particle automatically |
| Emitter cleanup timer | `this.time.delayedCall(lifespan, destroy)` | `emitter.on('complete', destroy)` | 'complete' fires after ALL particles die, not after emission stops |
| Forward-cone direction math | Manual sin/cos angle filtering | `angle: { min, max }` in emitter config | Phaser handles angle distribution natively |

## Common Pitfalls

### Pitfall 1: Emitter NOT destroyed after burst — memory leak
**What goes wrong:** Each bug death, muzzle flash, and build event creates an emitter GO. Without explicit destroy, these accumulate in the scene display list indefinitely — 60 bugs per wave × 10 waves = 600 leaked GOs minimum.
**Why it happens:** `maxParticles` stops new emissions but does not call `destroy()` on the emitter itself.
**How to avoid:** Always attach `emitter.on('complete', () => emitter.destroy())` immediately after creating the emitter.
**Warning signs:** Growing memory usage, frame rate degradation after several waves.

### Pitfall 2: `frequency: -1` required for explode mode
**What goes wrong:** Without `frequency: -1` in config, the emitter starts continuous flow mode immediately on creation. Calling `explode()` then has inconsistent behavior.
**Why it happens:** Default `frequency` is positive — emitter auto-starts on creation.
**How to avoid:** Always set `frequency: -1` in the config object for fire-and-forget bursts, then call `explode(count)`.

### Pitfall 3: Particle texture missing — emitter silently skipped
**What goes wrong:** If `'particle'` texture is not registered when `this.add.particles(x, y, 'particle', ...)` is called, Phaser logs a warning and the emitter creates with a placeholder or is skipped — no visible crash.
**Why it happens:** Texture generated in `BootScene.create()` but called with wrong key or before BootScene completes.
**How to avoid:** Generate `'particle'` texture in `BootScene.create()` before `this.scene.start('MainMenu')`. Verify key matches exactly.

### Pitfall 4: `scale: { start: 0.5, end: 2.0 }` on boss burst particles
**What goes wrong:** Scale growing from small to large reads as explosion growing, but combined with `alpha: { start: 1, end: 0 }` the particles expand AND fade — may look like they're absorbed rather than exploding outward.
**Why it happens:** Growing scale + fading alpha together.
**How to avoid:** At Claude's discretion — consider `scale: { start: 2.0, end: 0.2 }` (shrink while fading) for cleaner explosion read. CONTEXT.md specifies 0.5→2.0 as the locked value; only override if it looks wrong during testing.

### Pitfall 5: Muzzle flash angle in degrees vs radians
**What goes wrong:** `this.sprite.rotation` is in radians. `angle` in particle emitter config is in degrees. Mixing units produces wrong particle direction.
**Why it happens:** Phaser uses degrees for `angle` emitter property but radians for sprite rotation.
**How to avoid:** `const fireAngle = Phaser.Math.RadToDeg(this.sprite.rotation - Math.PI / 2);` then use `fireAngle` directly in `angle: { min: fireAngle - 30, max: fireAngle + 30 }`.

### Pitfall 6: `damageCore()` must call `showCoreShockwave()` before early return
**What goes wrong:** `damageCore()` returns early (`return true`) when hp reaches 0 and triggers `gameOver()`. If `showCoreShockwave()` is called after the hp check, it never fires on lethal hits.
**Why it happens:** Early return at line 281 skips subsequent code.
**How to avoid:** Call `showCoreShockwave()` at the top of `damageCore()` before the hp deduction, or immediately after it and before the `<= 0` check.

## Code Examples

### Complete showBugDeathEffect replacement
```javascript
// Source: Phaser 3.60+ changelog + CONTEXT.md D-05/D-07
showBugDeathEffect(x, y, type) {
  const { bugDeath, boss: bossCfg } = VFX;
  const isBoss = type === 'boss';
  const colors = { swarmer: 0x44ff44, brute: 0xff4444, spitter: 0xff8844, boss: 0x9900ff };

  if (isBoss) {
    const emitter = this.add.particles(x, y, 'particle', {
      color: [0x44ff44, 0xff4444, 0xff8844, 0x9900ff],
      colorEase: 'linear',
      speed: { min: bossCfg.speedMin, max: bossCfg.speedMax },
      lifespan: bossCfg.lifespan,
      scale: { start: bossCfg.scaleStart, end: bossCfg.scaleEnd },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      frequency: -1,
    });
    emitter.explode(bossCfg.count);
    emitter.on('complete', () => emitter.destroy());
  } else {
    const emitter = this.add.particles(x, y, 'particle', {
      tint: colors[type] || 0xffffff,
      speed: { min: bugDeath.speedMin, max: bugDeath.speedMax },
      lifespan: bugDeath.lifespan,
      scale: { start: 1, end: 0.2 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      frequency: -1,
    });
    emitter.explode(bugDeath.count);
    emitter.on('complete', () => emitter.destroy());
  }
}
```

### VFX config frozen object for GameConfig.js
```javascript
// Source: CONTEXT.md D-04 + project convention
export const VFX = Object.freeze({
  bugDeath: Object.freeze({
    count: 10,
    speedMin: 40,
    speedMax: 120,
    lifespan: 350,
    spread: 40,
  }),
  boss: Object.freeze({
    count: 30,
    speedMin: 60,
    speedMax: 200,
    lifespan: 600,
    spread: 80,
    scaleStart: 0.5,
    scaleEnd: 2.0,
  }),
  muzzle: Object.freeze({
    count: 5,
    angleSpread: 30,
    speedMin: 60,
    speedMax: 120,
    lifespan: 80,
    scaleStart: 0.3,
    scaleEnd: 1.0,
    tint: 0xffffaa,
  }),
  build: Object.freeze({
    count: 12,
    speedMin: 30,
    speedMax: 80,
    lifespan: 400,
    tints: [0x9966ff, 0xeef2ff],
  }),
  shockwave: Object.freeze({
    radiusStart: 30,
    radiusEnd: 120,
    duration: 400,
    color: 0xff4444,
    lineWidth: 3,
  }),
});
```

### Particle texture generation in BootScene
```javascript
// Source: BootScene.js existing generateFallback pattern
// Add inside BootScene.create(), before this.scene.start('MainMenu')
const g = this.make.graphics({ x: 0, y: 0, add: false });
g.fillStyle(0xffffff, 1);
g.fillCircle(4, 4, 4);
g.generateTexture('particle', 8, 8);
g.destroy();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `this.add.particles(key)` → `manager.createEmitter({})` | `this.add.particles(x, y, key, config)` returns emitter directly | Phaser 3.60 | Old pattern deprecated; not present in codebase but must not be introduced |
| Manual circle+tween loop | `explode()` + `complete` handler | This phase | Replaces all five existing pseudo-particle methods |

**Deprecated/outdated:**
- `ParticleEmitterManager.createEmitter()`: Removed/deprecated in 3.60. All existing code (Phaser 3.90) must use the new factory.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `frequency: -1` enables manual explode mode (no auto-emit on creation) | Pattern 1 code example | Emitter fires continuously before `explode()` is called; use `stopAfter: count` as fallback |
| A2 | `emitter.on('complete', cb)` fires after all particles have died (not when emission stops) | Pitfall 1 | Emitter destroyed too early while particles still visible |
| A3 | `tint: [array]` assigns one random tint per particle in Phaser 3.90 | Multi-color boss pattern | Colors not randomized; use `color: [array]` with `colorEase` instead |

**Note on A1:** The `frequency: -1` idiom appears in Phaser community examples but is not explicitly documented in the Context7 snippets retrieved. The official documented alternative is using `stopAfter` with a defined `frequency` and `quantity`. If `frequency: -1` does not work as expected, the fallback is: create with `{ quantity: count, frequency: 1, stopAfter: count, lifespan: N }` and call `emitter.start()`, then destroy on 'complete'. [ASSUMED for -1 behavior — verify with a quick test in Wave 0]

## Open Questions

1. **`frequency: -1` vs `explode()` method**
   - What we know: `explode(count, x, y)` is documented as a method on ParticleEmitter; `frequency: -1` is community convention
   - What's unclear: Whether `explode()` works without `frequency: -1` in config (may auto-start flow before explode call)
   - Recommendation: Wave 0 task should include a 5-line smoke test: create emitter at test coords, call `explode(5)`, verify particles appear and emitter destroys

2. **`tint` array behavior in Phaser 3.90**
   - What we know: `color` array with `colorEase` interpolates across lifespan; `tint` behavior with arrays is less explicitly documented
   - What's unclear: Whether `tint: [color1, color2]` randomly picks per-particle or cycles
   - Recommendation: Use `color: [array]` for the boss burst (interpolation is documented). For single-color non-boss bursts, `tint: scalar` is safe.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all changes are pure JavaScript within existing Phaser 3.90 installation).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (per REQUIREMENTS.md "No test framework or linter is configured yet") |
| Config file | none |
| Quick run command | `npm run build` |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VFX-01 | Bug death emitter appears and cleans up | visual/smoke | `npm run build` (no crash) | ❌ Wave 0 |
| VFX-02 | Muzzle flash emitter fires at barrel direction | visual/smoke | `npm run build` | ❌ Wave 0 |
| VFX-03 | Build sparkle fires on placement | visual/smoke | `npm run build` | ❌ Wave 0 |
| VFX-05 | Core shockwave ring appears on damage | visual/smoke | `npm run build` | ❌ Wave 0 |
| VFX-07 | Boss death burst is larger/multi-color | visual/smoke | `npm run build` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build` + manual visual check in browser
- **Phase gate:** Build green + visual verification of all 5 effects before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] No test framework exists — validation is build-green + visual review. Each task should include a manual verification step in the browser (`npm run dev`, trigger the effect, confirm particles appear and no console errors).

## Security Domain

This phase makes no network calls, handles no user input, and introduces no authentication or data persistence. ASVS does not apply. Security enforcement: skipped for this phase.

## Sources

### Primary (HIGH confidence)
- `/phaserjs/phaser` via Context7 — ParticleEmitter 3.60 changelog: emitter lifecycle events, `stopAfter`, `color` interpolation, `blendMode`, angle config, `createEmitter` deprecation
- `node_modules/phaser/package.json` — Phaser 3.90.0 confirmed installed [VERIFIED]
- `src/entities/Turret.js` — `getTipPosition()`, `sprite.rotation` pattern confirmed [VERIFIED]
- `src/scenes/BootScene.js` — `generateFallback` pattern with `g.generateTexture(key, w, h)` confirmed [VERIFIED]
- `src/config/GameConfig.js` — `Object.freeze()` pattern, THEME placement at line 136 [VERIFIED]
- `src/scenes/GameScene.js` — `showBugDeathEffect` at line 331, `showBuildFlash` at line 351, `damageCore` at line 265 [VERIFIED]

### Secondary (MEDIUM confidence)
- Phaser 3.60 changelog (via Context7): documents the full new API including `explode` event, `complete` event, `stopAfter`, `color` array

### Tertiary (LOW confidence)
- `frequency: -1` for manual explode mode — community convention, not explicitly in retrieved docs [ASSUMED — A1]
- `tint: [array]` random-per-particle behavior in 3.90 [ASSUMED — A3]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Phaser 3.90 confirmed, no new packages needed
- Architecture: HIGH — all integration points verified in source files
- Pitfalls: HIGH — emitter lifecycle pitfall is a known Phaser 3.60+ issue documented in changelogs
- Particle API specifics: MEDIUM — core API verified, two edge cases (frequency -1, tint array) are assumed

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (Phaser 3.x stable — 30-day window reasonable)
