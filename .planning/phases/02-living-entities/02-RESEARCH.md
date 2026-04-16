# Phase 2: Living Entities - Research

**Researched:** 2026-04-16
**Domain:** Phaser 3 procedural animation — tweens, preUpdate math, sprite scale, tint interaction
**Confidence:** HIGH

## Summary

Phase 2 adds procedural animation to bugs, the command core, and turrets so the entire game world feels alive. All animation must be purely code-driven (no spritesheet frames) because the project uses static runtime-generated textures. The key design choice is to split animation responsibility between two mechanisms: looping tweens for static/persistent objects (core, turrets) and sin-wave math in `preUpdate` for pooled bugs.

The Phaser tween system fully supports infinite yoyo/repeat cycles (`repeat: -1, yoyo: true`) and is safe for single-instance objects. For pooled entities (60-bug pool), per-bug tweens at scale create unnecessary overhead; `Math.sin(time * freq)` computed in the existing `preUpdate(time, delta)` hook is near-free and eliminates lifecycle complexity. Phase 1 already established `scene.tweens.killTweensOf(this)` in `Bug.despawn()`, which is the safety net that makes any tween approach safe for pool reuse — but the sin-wave approach avoids needing it entirely for movement animation.

The critical interaction to manage is `setDisplaySize` vs `scaleX/scaleY`: Phaser's `setDisplaySize` internally adjusts the scale properties. Bug.spawn already calls `setDisplaySize(conf.size, conf.size)` which sets a base scale. Any sin-wave wobble must be applied as a multiplier on top of that base scale, and `spawn()` must reset those multipliers to 1.0 to prevent stale scale on pool reuse.

**Primary recommendation:** Use sin-wave math in `preUpdate` for all bug animations; use infinite looping tweens for core and turret idle animations. Add ANIM config block to GameConfig.js for all animation parameters.

## Project Constraints (from CLAUDE.md)

- ES modules with explicit `.js` extensions in all imports
- No comments unless requested or logic is too complex
- Classes PascalCase, methods camelCase
- `Object.freeze()` on all config objects in GameConfig.js
- UPPER_CASE constants: `GRID`, `TURRETS`, `BUGS`, `WAVES`, `ECONOMY`, `GAME`
- Turret is a composite class — tween `turret.sprite`, never the `Turret` instance directly
- Entities needing physics extend `Phaser.Physics.Arcade.Sprite`; plain objects otherwise
- No test framework configured — validation is `npm run build` + visual inspection
- Must maintain 60fps with 60 bugs + 70 bullets on screen
- Config changes go in GameConfig.js only

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Bug wobble/squash-stretch (ANIM-01) | Entity (Bug.js) | Config (GameConfig.js) | Runs per-frame in preUpdate; parameters in centralized config |
| Bug type animation signatures (ANIM-04) | Entity (Bug.js) | Config (GameConfig.js) | Same sin-wave system, different per-type freq/amplitude from BUGS config |
| Core breathing (ANIM-02) | Scene (GameScene.js) | — | Single persistent sprite; tween started in create(), targets this.coreSprite |
| Turret idle glow pulse (ANIM-03) | Entity (Turret.js) | — | Tween started in Turret constructor, targets this.sprite, must be killed in Turret.destroy() |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANIM-01 | Add wobble and squash-stretch movement animation to all bug types in Bug.preUpdate() | Sin-wave math in preUpdate(time, delta); scaleX/scaleY as squash axis; reset in spawn() |
| ANIM-02 | Add breathing/pulse animation to command core sprite | Infinite yoyo tween on this.coreSprite.scaleX/scaleY; started in GameScene.create() after renderCore() |
| ANIM-03 | Add idle glow pulse on turrets, brighter pulse for upgraded turrets | Infinite tween on this.sprite.alpha; amplitude changes on upgrade(); tint must NOT be used (conflicts with upgrade tint 0xffdd44) |
| ANIM-04 | Add bug type-specific animation signatures (swarmer jittery, brute heavy, spitter pulsing) | Same sin-wave system as ANIM-01; per-type freq/amplitude values in BUGS config or separate ANIM config |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 (already installed) | 3.x | `scene.tweens.add()`, `sprite.scaleX/scaleY`, `Math.sin(time)` | Project's entire rendering and game loop stack |
| JavaScript Math | native | `Math.sin()`, `Math.cos()` for oscillation | Zero-cost, no deps, deterministic |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| GameConfig.js ANIM constants | project file | Central animation parameters (freq, amplitude per bug type) | All animation params must live here per project convention |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sin-wave in preUpdate for bugs | Per-bug tweens | Tweens are cleaner to write but 60 infinite tweens vs 0 tweens + math; sin-wave is better at scale |
| Alpha pulse for turret glow | Tint overlay / Graphics circle | Tint collides with upgrade state (0xffdd44); Graphics overlay adds draw calls. Alpha pulse on sprite is safe and cheap |
| Single ANIM config block | Extending BUGS per-type | Both work; extending BUGS is more cohesive since animation is type-specific behavior |

**Installation:** No new packages needed. All animation is Phaser-native.

## Architecture Patterns

### System Architecture Diagram

```
GameConfig.js BUGS[type].anim
        │ freq, amplitude, phaseOffset
        ▼
Bug.preUpdate(time, delta)
    ├── scaleX = baseScaleX * (1 + amplitude * sin(time * freq))
    └── scaleY = baseScaleX / scaleX  [squash-stretch: volume conserved]
        │
        └── Bug.spawn()  ←── resets scaleX, scaleY to baseScale

GameScene.create() ── renderCore() ── this.coreSprite
        │
        └── tweens.add({ targets: coreSprite, scaleX/scaleY, yoyo, repeat:-1 })

Turret constructor
        └── this.idleTween = scene.tweens.add({ targets: this.sprite, alpha, yoyo, repeat:-1 })
                    │
                    ├── Turret.upgrade() ── this.idleTween amplitude change (pause/restart)
                    └── Turret.destroy() ── this.idleTween.destroy()
```

### Recommended Project Structure

No new files needed. Changes are localized to:

```
src/
├── config/GameConfig.js     # Add ANIM config block (or extend BUGS per-type)
├── entities/Bug.js          # Add sin-wave math to preUpdate(); reset in spawn()
├── entities/Turret.js       # Start/stop idle tween in constructor/destroy()
└── scenes/GameScene.js      # Start core breathing tween after renderCore()
```

### Pattern 1: Sin-Wave Squash-Stretch in preUpdate

**What:** Apply oscillating scale to bug sprites using game time as input. Squash-stretch conserves apparent volume by inverting one axis.
**When to use:** Any pooled entity needing continuous procedural animation; preUpdate already has time.

```javascript
// Source: Phaser docs — preUpdate(time, delta), sprite.scaleX/scaleY
// In Bug.preUpdate(time, delta):
preUpdate(time, delta) {
  super.preUpdate(time, delta);
  if (!this.active) return;

  // Wobble: oscillate scaleX, squash scaleY inversely
  const conf = BUGS[this.bugType];
  const anim = conf.anim;
  const wobble = 1 + anim.amplitude * Math.sin(time * anim.frequency + this._animPhase);
  this.scaleX = this._baseScale * wobble;
  this.scaleY = this._baseScale / wobble;

  // ... existing steering code ...
}
```

**Critical:** `spawn()` must set `this._baseScale` and reset `this.scaleX = this._baseScale; this.scaleY = this._baseScale`.

`_animPhase` is a per-bug random phase offset set in `spawn()` so bugs don't all pulse in sync: `this._animPhase = Math.random() * Math.PI * 2`.

### Pattern 2: Infinite Looping Tween for Core Breathing

**What:** A single `repeat: -1, yoyo: true` tween on `coreSprite.scaleX`/`scaleY` for a breathing sinusoidal effect.
**When to use:** Single non-pooled persistent sprite.

```javascript
// Source: Phaser docs — tweens.add with repeat:-1 yoyo [VERIFIED: docs.phaser.io/phaser/concepts/tweens]
// In GameScene.create(), after this.renderCore():
this.tweens.add({
  targets: this.coreSprite,
  scaleX: 1.06,
  scaleY: 1.06,
  duration: 1800,
  ease: 'Sine.easeInOut',
  yoyo: true,
  repeat: -1,
});
```

Note: `coreSprite` starts at `setDisplaySize(GRID.tileSize, GRID.tileSize)` which sets scaleX/scaleY to values relative to the texture. The tween operates on the current scale as baseline, so `scaleX: 1.06` means 106% of the texture's natural scale — this is wrong if the display size differs from the texture size. Use relative values:

```javascript
// After renderCore() sets displaySize, capture base:
const baseScale = this.coreSprite.scaleX;
this.tweens.add({
  targets: this.coreSprite,
  scaleX: { from: baseScale, to: baseScale * 1.06 },
  scaleY: { from: baseScale, to: baseScale * 1.06 },
  duration: 1800,
  ease: 'Sine.easeInOut',
  yoyo: true,
  repeat: -1,
});
```

**Damage tint interaction:** `damageCore()` calls `this.coreSprite.setTintFill(0xff4444)` then `clearTint()`. This does not interfere with the scale tween. Safe.

### Pattern 3: Alpha Pulse Tween for Turret Idle Glow

**What:** Infinite `alpha` tween on `turret.sprite`. Alpha is the only safe property — tint cannot be used (upgrade state claims tint 0xffdd44).
**When to use:** All non-wall turrets. Walls have no idle animation.

```javascript
// Source: Phaser docs — tweens.add [VERIFIED: docs.phaser.io]
// In Turret constructor, after creating this.sprite:
if (type !== 'wall') {
  this.idleTween = scene.tweens.add({
    targets: this.sprite,
    alpha: { from: 0.75, to: 1.0 },
    duration: 1200,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
  });
}
```

For upgraded turrets (brighter pulse):

```javascript
// In Turret.upgrade():
if (this.idleTween) {
  this.idleTween.stop();
  this.idleTween = this.scene.tweens.add({
    targets: this.sprite,
    alpha: { from: 0.65, to: 1.0 },
    duration: 900,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
  });
}
```

In `Turret.destroy()` — add before `this.sprite.destroy()`:

```javascript
if (this.idleTween) {
  this.idleTween.destroy();
  this.idleTween = null;
}
```

### Pattern 4: Per-Type Animation Config in BUGS

**What:** Each bug type gets an `anim` sub-object in the BUGS config with frequency, amplitude, and squash factor.
**When to use:** Defines ANIM-04 type signatures — swarmer jittery, brute heavy, spitter pulsing.

```javascript
// In GameConfig.js — extending each BUGS entry:
export const BUGS = Object.freeze({
  swarmer: Object.freeze({
    // ... existing props ...
    anim: Object.freeze({ frequency: 0.012, amplitude: 0.12, squashFactor: 1.0 }),
  }),
  brute: Object.freeze({
    // ... existing props ...
    anim: Object.freeze({ frequency: 0.004, amplitude: 0.06, squashFactor: 1.0 }),
  }),
  spitter: Object.freeze({
    // ... existing props ...
    anim: Object.freeze({ frequency: 0.007, amplitude: 0.09, squashFactor: 1.0 }),
  }),
  boss: Object.freeze({
    // ... existing props ...
    anim: Object.freeze({ frequency: 0.002, amplitude: 0.04, squashFactor: 1.0 }),
  }),
});
```

Frequency is in `time * freq` where time is the raw Phaser time in ms. Values above produce:
- swarmer: jittery (high freq, medium amplitude)
- brute: heavy lumbering (low freq, low amplitude)
- spitter: rhythmic pulsing (medium freq, medium amplitude)
- boss: slow imposing throb (very low freq, minimal amplitude)

### Anti-Patterns to Avoid

- **One tween per bug per spawn:** Creates 60+ active tweens simultaneously; use sin-wave math instead.
- **Tint-based glow pulse on turrets:** Conflicts with upgrade state (0xffdd44 tint). Use alpha.
- **Not resetting scale in spawn():** Pooled bugs carry stale scaleX/scaleY into next reuse; always reset in spawn().
- **Using `setDisplaySize` after setting scaleX/scaleY:** `setDisplaySize` internally recalculates scale from width/height, overwriting any manual scale. Set displaySize once in spawn(), then manipulate scaleX/scaleY directly.
- **Applying wobble when bug is inactive:** Guard `if (!this.active) return;` before all preUpdate math (already present in codebase).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sinusoidal easing | Custom oscillator class | `Math.sin(time * freq)` | Already available; zero overhead |
| Infinite animation loop | Manual tween restart in onComplete | `repeat: -1` tween flag | Built-in Phaser; onComplete restart has 1-frame gaps |
| Tween lifecycle on pool entities | Tracking arrays of tweens per bug | Sin-wave in preUpdate | No tween to create, kill, or track |

**Key insight:** For any entity that pools (bugs), math-driven animation beats tween-driven animation on every metric: performance, simplicity, pool safety.

## Common Pitfalls

### Pitfall 1: setDisplaySize Overwrites scaleX/scaleY
**What goes wrong:** `spawn()` calls `this.setDisplaySize(conf.size, conf.size)` which internally sets `scaleX = conf.size / texture.width`. If preUpdate has already set `this.scaleX` to a wobble value, the next call to `setDisplaySize` on pool reuse resets it correctly — but if spawn() is called after a partial frame where preUpdate ran, the ordering matters.
**Why it happens:** `setDisplaySize` adjusts scale as a side effect. Setting `scaleX` directly afterwards is the correct approach.
**How to avoid:** In `spawn()`, after `setDisplaySize`, immediately store `this._baseScale = this.scaleX` and reset `this.scaleX = this._baseScale; this.scaleY = this._baseScale`. Then preUpdate multiplies from this base.
**Warning signs:** Bugs appear at inconsistent sizes after multiple spawns.

### Pitfall 2: Core Tween Scale Relative to displaySize
**What goes wrong:** `this.coreSprite.setDisplaySize(GRID.tileSize, GRID.tileSize)` sets scale relative to the texture size. If the tween targets absolute `scaleX: 1.06` and the texture is not 1:1 with tileSize, the pulse amount is wrong.
**Why it happens:** Tween target values are absolute, not relative by default.
**How to avoid:** Read `this.coreSprite.scaleX` after `setDisplaySize`, store as `baseScale`, tween `from: baseScale, to: baseScale * 1.06`.
**Warning signs:** Core appears to grow larger than expected or barely moves.

### Pitfall 3: Idle Tween Leaks on Turret Destroy
**What goes wrong:** When a turret is destroyed by bugs, `Turret.destroy()` cleans up sprite/body but the idle tween may continue targeting the destroyed sprite, causing Phaser console errors.
**Why it happens:** `repeat: -1` tweens run indefinitely unless explicitly stopped.
**How to avoid:** Call `this.idleTween.destroy()` in `Turret.destroy()` before `this.sprite.destroy()`.
**Warning signs:** Console errors about setting properties on destroyed game objects.

### Pitfall 4: Phase Offset Sync (all bugs pulse in unison)
**What goes wrong:** Without a random phase offset, all 60 bugs pulse identically in sync, looking mechanical rather than alive.
**Why it happens:** `Math.sin(time * freq)` uses the same time for all bugs.
**How to avoid:** Assign `this._animPhase = Math.random() * Math.PI * 2` in `spawn()`, add to the sin argument.
**Warning signs:** All bugs visually pulse in perfect lockstep.

### Pitfall 5: Tween Upgraded Amplitude Conflict
**What goes wrong:** If the idle tween is recreated in `upgrade()`, the old tween is not stopped first, resulting in two simultaneous tweens on the same sprite.
**Why it happens:** `tweens.add()` creates a new tween without automatically stopping existing ones on the same target.
**How to avoid:** Call `this.idleTween.stop()` before recreating; or use `scene.tweens.killTweensOf(this.sprite)` as a safety net.
**Warning signs:** Turret sprite alpha flickers erratically after upgrade.

## Code Examples

Verified patterns from official sources:

### Infinite Yoyo Tween
```javascript
// Source: [VERIFIED: docs.phaser.io/phaser/concepts/tweens]
scene.tweens.add({
  targets: sprite,
  alpha: { from: 0.75, to: 1.0 },
  duration: 1200,
  ease: 'Sine.easeInOut',
  yoyo: true,
  repeat: -1,
});
```

### Per-Property Tween Values (from/to)
```javascript
// Source: [VERIFIED: github.com/rexrainbow/phaser3-rex-notes/blob/master/docs/docs/tween.md]
scene.tweens.add({
  targets: sprite,
  scaleX: { from: baseScale, to: baseScale * 1.06 },
  scaleY: { from: baseScale, to: baseScale * 1.06 },
  duration: 1800,
  ease: 'Sine.easeInOut',
  yoyo: true,
  repeat: -1,
});
```

### killTweensOf for Cleanup
```javascript
// Source: [VERIFIED: docs.phaser.io/api-documentation/class/tweens-tweenmanager]
scene.tweens.killTweensOf(target);
// Also: tween.destroy() for a specific tween reference
```

### setDisplaySize Adjusts Scale
```javascript
// Source: [VERIFIED: docs.phaser.io/api-documentation/namespace/gameobjects-components-computedsize]
// setDisplaySize(width, height) internally adjusts scaleX, scaleY
sprite.setDisplaySize(64, 64);
const baseScale = sprite.scaleX; // read back computed scale
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Spritesheet walk cycles | Procedural tween/math on static sprites | Project inception | No asset pipeline needed |
| Per-entity tween for all objects | Sin-wave for pooled, tween for singletons | This phase establishes | Better perf at scale |

**Deprecated/outdated:**
- `anims.create()` with frameNumbers: Not applicable — no spritesheet assets exist.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Swarmer freq=0.012, brute freq=0.004 feel correct for "jittery" vs "heavy" at 60fps | Standard Stack / Config | Wrong feel; tuning fix is 1 line per value in GameConfig.js |
| A2 | Core breathing at 1800ms duration with 6% scale variance reads as "breathing" | Pattern 2 | Too subtle or too dramatic; tuning fix is changing duration/scale values |
| A3 | Alpha pulse from 0.75→1.0 reads as "idle glow" on turret sprites | Pattern 3 | May be too subtle on the procedural turret textures; could adjust range |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **ANIM frequency values need visual tuning**
   - What we know: sin-wave math is correct; parameters are starting estimates
   - What's unclear: exact values that feel right without running the game
   - Recommendation: implement with config values; planner should note these as tuning knobs

2. **Spitter animation during attack stop**
   - What we know: spitter stops moving when in attack range (updateSpitter sets velocity to 0)
   - What's unclear: should wobble continue while stationary, or should it use a different "aiming" pulse?
   - Recommendation: keep wobble running regardless of velocity; simplest and visually acceptable

## Environment Availability

Step 2.6: SKIPPED — Phase is pure code changes with no external tool dependencies. Phaser 3 and Vite are already installed and operational (Phase 1 UAT passed).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (per CLAUDE.md and REQUIREMENTS.md) |
| Config file | none |
| Quick run command | `npm run build` |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANIM-01 | Bugs wobble/squash-stretch while moving | manual-only | `npm run build` (smoke) | N/A |
| ANIM-02 | Core sprite pulses with breathing animation | manual-only | `npm run build` (smoke) | N/A |
| ANIM-03 | Turrets have idle alpha pulse, brighter on upgrade | manual-only | `npm run build` (smoke) | N/A |
| ANIM-04 | Bug types have distinct animation signatures | manual-only | `npm run build` (smoke) | N/A |

Manual-only justification: No test framework exists; all visual/animation requirements are perceptual and require a running game to verify. Per project constraints, no test framework will be added for this phase.

### Sampling Rate
- **Per task commit:** `npm run build` — confirms no JS syntax errors or import failures
- **Per wave merge:** `npm run build` + manual `npm run preview` visual check
- **Phase gate:** Build passes + manual UAT against success criteria before `/gsd-verify-work`

### Wave 0 Gaps
None — no test framework setup needed. Existing build pipeline is the only gate.

## Security Domain

Not applicable. This phase contains no authentication, user input processing, data persistence, or network communication — only client-side game animation logic. ASVS categories V2-V6 do not apply.

## Sources

### Primary (HIGH confidence)
- `/websites/phaser_io` (Context7) — `tweens.add`, `yoyo`, `repeat:-1`, `setDisplaySize`, `scaleX/scaleY`, `killTweensOf`
- `/rexrainbow/phaser3-rex-notes` (Context7) — full tween lifecycle config, per-property `from/to`, ease equations
- `src/entities/Bug.js` (codebase) — existing `preUpdate`, `spawn`, `despawn` patterns
- `src/entities/Turret.js` (codebase) — composite pattern, upgrade/destroy lifecycle
- `src/scenes/GameScene.js` (codebase) — `this.coreSprite` usage, tint interaction in `damageCore()`
- `src/config/GameConfig.js` (codebase) — BUGS structure, Object.freeze convention

### Secondary (MEDIUM confidence)
- Animation frequency/amplitude starting values — derived from common game-feel heuristics for bug archetypes

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Phaser tween API verified via Context7 docs
- Architecture: HIGH — based on direct codebase inspection of all affected files
- Pitfalls: HIGH — setDisplaySize/scale interaction verified via official docs; tween lifecycle from codebase
- Animation parameters: MEDIUM — starting estimates, require in-game tuning

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (Phaser tween API is stable)
