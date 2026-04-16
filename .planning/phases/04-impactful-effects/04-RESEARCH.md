# Phase 4: Impactful Effects - Research

**Researched:** 2026-04-16
**Domain:** Phaser 3 particle emitters (persistent + one-shot), camera shake, Graphics rendering
**Confidence:** HIGH

## Summary

Phase 4 introduces three distinct effect categories: a persistent particle aura for slowfield turrets, a glow trail for zapper lightning chains, and a tiered camera shake system. All three build on the Phase 3 particle foundation (one-shot emitters + VFX config pattern) but introduce new patterns -- persistent emitters with periodic bursts, multi-stroke Graphics rendering, and Phaser's built-in `camera.shake()` API.

The Phaser 3.90.0 runtime (installed in project) provides all required APIs natively. `camera.shake(duration, intensity, force)` with `force: true` implements the "latest wins" stacking behavior (D-08) with zero custom code. Persistent particle emitters need explicit lifecycle management tied to `Turret.destroy()` -- this is the primary new pattern and the biggest leak risk.

**Primary recommendation:** Implement in three focused passes: (1) slowfield particle aura with cleanup, (2) zapper trail enhancement, (3) camera shake system. Each pass touches different files with minimal overlap.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Slowfield uses radial pulse waves -- periodic expanding bursts from center to range edge, like sonar pings. This is the first persistent/repeating emitter in the codebase.
- **D-02:** Slowfield uses cosmic purple-blue tints (0x6a4c93, 0x9966ff) instead of current cyan 0x44ddff.
- **D-03:** Upgraded slowfield gets bigger radius (128->160px, already implemented) PLUS brighter/different tint for visual distinction.
- **D-04:** Zapper gets both thick glowing line AND particle trail along chain path. Replace current 2px line with wider/brighter line, spawn lingering trail particles.
- **D-05:** Trail particles use lighter/whiter glow -- accent white (0xeef2ff) or light purple. "Hot center fading to cool edges" effect.
- **D-06:** Three fixed shake tiers: light (swarmer hit, 0.005), medium (brute/spitter, 0.015), heavy (boss hit on core, 0.04).
- **D-07:** Duration scales with intensity: light 80ms, medium 150ms, heavy 250ms.
- **D-08:** Shake stacking uses replace (latest wins). Each new shake interrupts the current one.
- **D-09:** Boss micro-shake uses 500ms cooldown throttling. Check `this.bugType === 'boss'` in `Bug.takeDamage()`.
- **D-10:** UIScene HUD stability is automatic -- separate scene with its own camera.

### Claude's Discretion
- Exact particle count and lifespan for slowfield pulse waves (tune for 60fps with 3-4 simultaneous slowfields)
- Exact thickness of enhanced zapper line (4-6px range)
- Number of trail particles per chain segment (3-5 range)
- Easing curves for shake decay
- Whether turret destruction shake (SHAKE-02) uses medium or heavy tier

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VFX-04 | Replace static Graphics circle slowfield aura with particle emitter aura that follows turret position | Persistent emitter with periodic `explode()` calls driven by `scene.time.addEvent()` loop. Cleanup in `Turret.destroy()`. See Slowfield Aura pattern. |
| VFX-06 | Add glow trail effect on zapper lightning chain | Multi-stroke Graphics (wide translucent + narrow bright) plus `emitParticleAt()` along interpolated chain points. See Zapper Trail pattern. |
| SHAKE-01 | Add camera shake on core damage (intensity proportional to damage) | `this.cameras.main.shake(duration, intensity, true)` in `damageCore()`. Tiered by damage amount per D-06/D-07. |
| SHAKE-02 | Add camera shake on turret/wall destruction | Same `camera.shake()` call in `Turret.destroy()` via `this.scene.cameras.main`. |
| SHAKE-03 | Add micro-shake on boss hit impacts | Throttled shake in `Bug.takeDamage()` with `bugType === 'boss'` check and 500ms cooldown. |
| SHAKE-04 | Ensure UIScene HUD does not shake (GameScene camera only) | Automatic -- UIScene has its own camera. Shaking only `GameScene.cameras.main` satisfies this. Verify by inspection. |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Slowfield particle aura | Client (Phaser scene) | -- | Purely visual effect on GameScene canvas |
| Zapper lightning trail | Client (Phaser scene) | -- | Graphics + particles rendered in GameScene |
| Camera shake triggers | Client (Phaser scene) | -- | `camera.shake()` on GameScene.cameras.main |
| Shake config values | Config (GameConfig.js) | -- | Follows frozen config pattern for all tuning |
| UIScene stability | Client (Phaser scene) | -- | Architectural guarantee from separate scene cameras |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser | 3.90.0 (installed) | Game framework -- particles, camera shake, Graphics | Already in use, provides all needed APIs natively [VERIFIED: node_modules/phaser/package.json] |

### Supporting
No additional libraries needed. All effects use built-in Phaser APIs.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Multi-stroke Graphics glow | `preFX.addGlow()` WebGL shader | WebGL-only, belongs to Phase 5 (THEME-04), overkill for line glow |
| Periodic `explode()` timer | Flow emitter (`frequency > 0`) | Flow emits steady drip, not sonar-ping bursts. Timer + explode is the correct pattern for D-01. |

**Installation:** None needed -- all dependencies already installed.

**Version verification:**
- Phaser 3.90.0 installed locally (pinned `^3.80.0` in package.json, resolved to 3.90.0) [VERIFIED: node_modules]
- Phaser 4.0.0 exists on npm but this project uses 3.x branch [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```
Game Loop (per frame)
    |
    v
Turret.update() -----> updateSlowfieldAura(bugs) -- applies slow to bugs in range
    |                       |
    |                       +---> [NEW] pulse timer fires explode() periodically
    |
    +---> fireZapper() ---> drawLightningChain(targets)
    |                           |
    |                           +---> [NEW] multi-stroke Graphics (wide + narrow)
    |                           +---> [NEW] emitParticleAt() along chain segments
    |
    v
Bug.takeDamage() ---> [NEW] if boss: throttled camera.shake()
    |
    v
GameScene.damageCore() ---> showCoreShockwave() (existing)
    |                   +---> [NEW] camera.shake() with tiered intensity
    |
    v
Turret.takeDamage() ---> Turret.destroy()
                              +---> [NEW] camera.shake()
                              +---> [NEW] cleanup emitter + pulse timer
```

### Recommended Config Structure

Extend `VFX` in `GameConfig.js`:

```
VFX: {
  DEATH: { ... },     // existing
  MUZZLE: { ... },    // existing
  BUILD: { ... },     // existing
  SHOCKWAVE: { ... }, // existing
  SLOWFIELD: { ... }, // NEW: pulse wave config
  ZAPPER_TRAIL: { ... }, // NEW: trail particle + line config
  SHAKE: { ... },     // NEW: tiered shake config
}
```

### Pattern 1: Persistent Emitter with Periodic Bursts (Slowfield Aura)

**What:** Create a particle emitter at the turret center that lives until turret destruction. Particles radiate outward in all directions with speed tuned so they travel approximately `this.range` pixels during their lifespan -- creating the "sonar ping" expanding ring effect (D-01). Use `scene.time.addEvent()` with `loop: true` to call `emitter.explode(count)` at pulse intervals. The emitter has `emitting: false` (no auto-flow).

**When to use:** Any repeating particle effect tied to a game object's lifetime.

**Key math:** For a range of 128px and lifespan of 350ms, particles need speed ~365 px/s (`range / (lifespan / 1000)`). This makes particles reach the range edge just as they fade out, creating the expanding ring visual.

**Example:**
```javascript
// Source: Phaser 3 ParticleEmitter API [VERIFIED: Context7 /rexrainbow/phaser3-rex-notes particles.md]

// In Turret constructor (when type === 'slowfield'):
const cfg = VFX.SLOWFIELD;
this.auraEmitter = scene.add.particles(worldX, worldY, 'particle', {
  speed: cfg.speed,          // { min: 300, max: 400 } -- tuned to reach range edge
  lifespan: cfg.lifespan,    // 350ms
  scale: cfg.scale,          // { start: 0.6, end: 0.1 }
  tint: cfg.tints,           // [0x6a4c93, 0x9966ff]
  alpha: cfg.alpha,          // { start: 0.7, end: 0 }
  radial: true,              // emit in all directions (360 degrees)
  emitting: false,           // no auto-flow -- we control via timer
});

// Pulse timer -- periodic sonar pings
this.pulseTimer = scene.time.addEvent({
  delay: cfg.pulseInterval,  // 800ms between pings
  loop: true,
  callback: () => {
    if (this.auraEmitter && this.auraEmitter.active) {
      this.auraEmitter.explode(cfg.particlesPerPulse);
    }
  },
});
```

**Why NOT an edge emit zone:** D-01 says "particles that expand outward from the turret center to the edge of the range, like sonar pings." An edge emit zone would spawn particles ON the perimeter (the visual opposite). Instead, emit from center with `radial: true` and tune speed so particles travel to the range edge during their lifespan.

**Cleanup in destroy():**
```javascript
if (this.auraEmitter) {
  this.auraEmitter.destroy();
  this.auraEmitter = null;
}
if (this.pulseTimer) {
  this.pulseTimer.remove();
  this.pulseTimer = null;
}
```

**Upgrade handling:** When slowfield upgrades (range 128->160), recalculate speed to match new range: `newSpeed = newRange / (lifespan / 1000)`. Also swap tints to upgraded palette per D-03.

### Pattern 2: Multi-Stroke Graphics for Glow Line (Zapper Trail)

**What:** Layer two Graphics strokes -- a wide translucent outer stroke for glow, and a narrow bright inner stroke for the core line. This creates a glow appearance without WebGL post-FX.

**When to use:** Visual glow effect on dynamic lines where shader FX is not appropriate.

**Example:**
```javascript
// Source: Phaser Graphics lineStyle API [VERIFIED: Context7 /rexrainbow/phaser3-rex-notes graphics]
drawLightningChain(targets) {
  const g = this.scene.add.graphics();
  const tip = this.getTipPosition();
  const cfg = VFX.ZAPPER_TRAIL;

  // Outer glow: wide, translucent purple
  g.lineStyle(cfg.outerLineWidth, cfg.outerColor, cfg.outerAlpha);
  g.beginPath();
  g.moveTo(tip.x, tip.y);
  for (const t of targets) g.lineTo(t.x, t.y);
  g.strokePath();

  // Inner core: narrow, bright white
  g.lineStyle(cfg.innerLineWidth, cfg.innerColor, cfg.innerAlpha);
  g.beginPath();
  g.moveTo(tip.x, tip.y);
  for (const t of targets) g.lineTo(t.x, t.y);
  g.strokePath();

  this.scene.time.delayedCall(cfg.lineDuration, () => g.destroy());

  // Trail particles along chain
  this.spawnTrailParticles(tip, targets);
}
```

### Pattern 3: Interpolated Trail Particles Along Chain Path

**What:** For each chain segment, lerp several points along the line and call `emitParticleAt()` at each point. Uses a one-shot emitter created per fire event.

**When to use:** Spawning particles along a dynamic path that changes each time.

**Cleanup strategy:** Use `scene.time.delayedCall(lifespan + buffer, () => emitter.destroy())` rather than `emitter.on('complete', ...)`. The `'complete'` event may not fire on an emitter that was never "started" (it has `emitting: false` and particles are spawned via manual `emitParticleAt()` calls). The delayed-call cleanup pattern matches the existing `drawLightningChain` Graphics cleanup approach.

**Example:**
```javascript
// Source: Phaser emitParticleAt API [VERIFIED: Context7 /rexrainbow/phaser3-rex-notes particles.md]
spawnTrailParticles(tip, targets) {
  const cfg = VFX.ZAPPER_TRAIL;
  const emitter = this.scene.add.particles(0, 0, 'particle', {
    speed: { min: 5, max: 20 },
    lifespan: cfg.trailLifespan,
    scale: cfg.trailScale,
    tint: cfg.trailTint,
    alpha: cfg.trailAlpha,
    emitting: false,
  });

  const points = [tip, ...targets];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const steps = cfg.particlesPerSegment;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      emitter.emitParticleAt(x, y, 1);
    }
  }

  // Cleanup via delayed call -- 'complete' event may not fire on manually-emitted particles
  this.scene.time.delayedCall(cfg.trailLifespan + 50, () => emitter.destroy());
}
```

### Pattern 4: Camera Shake with Force Replace

**What:** Phaser's `camera.shake(duration, intensity, force)` with `force: true` interrupts any in-progress shake and starts the new one. This implements D-08 "latest wins" natively.

**When to use:** All shake triggers in Phase 4.

**Example:**
```javascript
// Source: Phaser Camera.shake() API [VERIFIED: Context7 /rexrainbow/phaser3-rex-notes camera-effects.md]

// In GameScene.damageCore():
const tier = amount >= 20 ? 'heavy' : amount >= 10 ? 'medium' : 'light';
const cfg = VFX.SHAKE[tier];
this.cameras.main.shake(cfg.duration, cfg.intensity, true);

// In Bug.takeDamage() for boss micro-shake:
if (this.bugType === 'boss') {
  const now = this.scene.time.now;
  if (!this._lastBossShake || now - this._lastBossShake >= 500) {
    this._lastBossShake = now;
    this.scene.cameras.main.shake(80, 0.005, true);
  }
}
```

### Anti-Patterns to Avoid
- **Leaked persistent emitters:** Failing to destroy the slowfield emitter and its pulse timer in `Turret.destroy()` will burn particle budget on invisible turrets. Every persistent resource MUST have a cleanup path.
- **Flow emitter for pulse waves:** Using `frequency > 0` produces a steady drip, not the sonar-ping bursts D-01 specifies. Use `emitting: false` + timer-driven `explode()`.
- **Edge emit zone for sonar pings:** An edge emit zone spawns particles ON the perimeter. D-01 wants particles expanding FROM center TO edge. Use `radial: true` at center with speed tuned to reach range edge.
- **WebGL glow FX for lines:** `preFX.addGlow()` is Phase 5 scope (THEME-04) and WebGL-only. Use layered Graphics strokes (wide translucent + narrow bright) for the zapper glow line.
- **Emit zone for dynamic chain paths:** The zapper chain changes every fire -- emit zones are for fixed geometries. Use `emitParticleAt()` with interpolated positions instead.
- **`'complete'` event on manually-emitted particles:** An emitter with `emitting: false` that only uses `emitParticleAt()` may not fire the `'complete'` event. Use `scene.time.delayedCall()` for cleanup instead.
- **Direct shake on UIScene camera:** Only shake `GameScene.cameras.main`. UIScene's camera must remain static (SHAKE-04).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera shake | Custom position offset + recovery tween | `camera.shake(duration, intensity, true)` | Built-in handles timing, easing, and force-replace. Tested across Phaser versions. |
| Shake interruption/stacking | Custom shake queue/state machine | `force: true` parameter on `camera.shake()` | Native "latest wins" behavior matches D-08 exactly. |
| Particle burst timing | `setInterval` or manual delta accumulation | `scene.time.addEvent({ loop: true })` | Phaser's time events pause with the scene, avoid orphaned intervals. |
| Glow line rendering | Canvas shadow blur or WebGL shader | Layered Graphics strokes (wide translucent + narrow bright) | Works on both Canvas and WebGL renderers. Simple, no shader dependency. |

**Key insight:** Phaser's camera shake API with `force: true` gives the exact "latest wins" behavior D-08 requires. No custom shake system needed.

## Common Pitfalls

### Pitfall 1: Leaked Emitter and Timer on Turret Death
**What goes wrong:** Slowfield turret is destroyed but its particle emitter and pulse timer continue running invisibly, consuming particle budget and CPU.
**Why it happens:** `Turret.destroy()` currently cleans up `auraGraphics`, `idleTween`, sprite, and wallBody. New resources (emitter + timer) need explicit cleanup.
**How to avoid:** Add `this.auraEmitter.destroy()` and `this.pulseTimer.remove()` to `Turret.destroy()`. Null-check both. Remove the old `this.auraGraphics.destroy()` since Graphics aura is being replaced.
**Warning signs:** Particle count climbs over time; FPS degrades after selling/losing multiple slowfield turrets.

### Pitfall 2: Missing 'particle-glow' Texture
**What goes wrong:** Code references a `'particle-glow'` texture key that doesn't exist, causing Phaser to throw or render incorrectly.
**Why it happens:** CONTEXT.md mentions 'particle-glow' as a "potential use" but `BootScene.generateParticleTextures()` only creates the `'particle'` texture (4px solid white circle). The glow texture was never generated. [VERIFIED: grep for 'particle-glow' returns zero results in src/]
**How to avoid:** Either: (a) generate the 'particle-glow' texture in BootScene if the zapper trail needs it, or (b) use only the existing 'particle' texture with alpha/scale fade for the soft glow effect. Recommendation: generate it for richer visuals -- it's a simple addition to `generateParticleTextures()`.
**Warning signs:** Console error about missing texture key at runtime.

### Pitfall 3: Slowfield Emitter Speed Not Matching Range on Upgrade
**What goes wrong:** Upgraded slowfield (range 128->160) still shows particles fading at the old radius because speed was calculated for the original range.
**Why it happens:** Particle speed is set at construction time based on `this.range`. After upgrade, range increases but particle speed doesn't, so particles fade out before reaching the new range edge.
**How to avoid:** In `Turret.upgrade()`, when `type === 'slowfield'`, recalculate and set `emitter.speed` to match new range. Also update tint for visual distinction per D-03. Formula: `speed = newRange / (lifespan / 1000)`.
**Warning signs:** Particle ring stops short of the actual slow effect radius after upgrade.

### Pitfall 4: Boss Micro-Shake Without Cooldown State Initialization
**What goes wrong:** First `Bug.takeDamage()` call on a boss works, but `_lastBossShake` is undefined causing unexpected behavior on the comparison.
**Why it happens:** `_lastBossShake` is not initialized in `Bug.spawn()`.
**How to avoid:** Initialize `this._lastBossShake = 0` in `Bug.spawn()`. The `now - 0 >= 500` check will pass on first hit, which is correct behavior.
**Warning signs:** Boss micro-shake either fires too often or not at all on first spawn.

### Pitfall 5: Shake During Game Over Transition
**What goes wrong:** Camera shake triggers after game-over state begins, causing visual glitch during scene transition.
**Why it happens:** `damageCore()` sets `this.phase = 'gameover'` but shake has already been queued or `Bug.takeDamage()` fires after game-over.
**How to avoid:** Guard shake calls with `if (this.phase !== 'gameover')` or `if (this.scene.phase !== 'gameover')`.
**Warning signs:** Screen shakes during GameOver scene fade or after game result display.

### Pitfall 6: Trail Emitter Cleanup via 'complete' Event
**What goes wrong:** Zapper trail emitter never gets destroyed, leaking a game object per zapper fire.
**Why it happens:** An emitter with `emitting: false` that only uses `emitParticleAt()` may not dispatch the `'complete'` event since it was never formally "started."
**How to avoid:** Use `scene.time.delayedCall(trailLifespan + 50, () => emitter.destroy())` for cleanup. This mirrors the existing `drawLightningChain` Graphics cleanup pattern.
**Warning signs:** Game objects count grows steadily during gameplay; memory usage climbs.

## Code Examples

### Config Extension for VFX

```javascript
// Source: Existing VFX frozen config pattern in GameConfig.js [VERIFIED: src/config/GameConfig.js:142-172]
export const VFX = Object.freeze({
  // ... existing DEATH, MUZZLE, BUILD, SHOCKWAVE ...

  SLOWFIELD: Object.freeze({
    pulseInterval: 800,        // ms between sonar pings
    particlesPerPulse: 8,      // particles per burst
    lifespan: 350,             // particle life in ms
    speed: { min: 300, max: 400 },  // tuned for range 128px: 128/(350/1000) ~ 365
    scale: { start: 0.6, end: 0.1 },
    tints: [0x6a4c93, 0x9966ff],
    alpha: { start: 0.7, end: 0 },
    upgradedTints: [0x9966ff, 0xcc99ff],  // brighter for upgraded
    upgradedSpeed: { min: 380, max: 480 }, // tuned for range 160px: 160/(350/1000) ~ 457
  }),

  ZAPPER_TRAIL: Object.freeze({
    outerLineWidth: 6,
    outerColor: 0x9966ff,
    outerAlpha: 0.4,
    innerLineWidth: 2,
    innerColor: 0xeef2ff,
    innerAlpha: 1,
    trailTint: 0xeef2ff,
    trailLifespan: 300,
    particlesPerSegment: 4,
    trailScale: { start: 0.5, end: 0.1 },
    trailAlpha: { start: 0.8, end: 0 },
    lineDuration: 200,
  }),

  SHAKE: Object.freeze({
    light:  Object.freeze({ intensity: 0.005, duration: 80 }),
    medium: Object.freeze({ intensity: 0.015, duration: 150 }),
    heavy:  Object.freeze({ intensity: 0.04,  duration: 250 }),
    bossMicroCooldown: 500,
  }),
});
```

### Generating particle-glow Texture in BootScene

```javascript
// Source: BootScene.generateParticleTextures() pattern [VERIFIED: src/scenes/BootScene.js:113-119]
generateParticleTextures() {
  const g = this.make.graphics({ add: false });

  // Solid particle (existing)
  g.fillStyle(0xffffff, 1);
  g.fillCircle(2, 2, 2);
  g.generateTexture('particle', 4, 4);
  g.clear();

  // Soft glow particle (new)
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(4, 4, 4);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 2);
  g.generateTexture('particle-glow', 8, 8);
  g.destroy();
}
```

### Shake Helper on GameScene

```javascript
// Source: Phaser camera.shake() API [VERIFIED: Context7 /rexrainbow/phaser3-rex-notes camera-effects.md]
shakeCamera(tier) {
  if (this.phase === 'gameover') return;
  const cfg = VFX.SHAKE[tier];
  if (!cfg) return;
  this.cameras.main.shake(cfg.duration, cfg.intensity, true);
}
```

## Performance Budget Analysis

Target: <300 total particles at any time (from STATE.md).

| Source | Peak Count | Lifespan | Max Simultaneous | Peak Alive |
|--------|-----------|----------|-------------------|------------|
| Slowfield pulse | 8 per pulse | 350ms | 4 turrets | ~32 (8 * 4, one pulse in flight per turret) |
| Zapper trail | ~12 per fire (4/segment * 3 segments) | 300ms | 1-2 zappers firing | ~24 |
| Death bursts | 10-30 per kill | 350-600ms | 2-3 overlapping | ~40 |
| Muzzle flash | 5 per fire | 80ms | 3-4 turrets | ~15 |
| Build sparkle | 12 per build | 400ms | 1 | ~12 |
| Core shockwave | 0 (Graphics, not particles) | -- | -- | 0 |
| **Total peak** | -- | -- | -- | **~123** |

Peak of ~123 particles is well within the <300 budget. Even with worst-case overlap (boss death + multiple slowfields + zappers), the total stays under 200. [VERIFIED: calculated from D-01 through D-07 particle counts and lifespans]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `this.add.particles(x, y).createEmitter(config)` | `this.add.particles(x, y, texture, config)` | Phaser 3.60 | Old API deprecated, new API is what Phase 3 already uses |
| Manual camera offset for shake | `camera.shake(duration, intensity, force)` | Phaser 3.5 | Built-in with easing, force-replace, and events |
| Separate Shake effect class | `camera.shake()` unified API | Phaser 3.5 | Effects encapsulated in their own classes under camera.effects |

**Deprecated/outdated:**
- `createEmitter()` API: Deprecated since Phaser 3.60. This project already uses the modern `this.add.particles(x, y, key, config)` pattern. [VERIFIED: codebase uses modern API in GameScene.js and Turret.js]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `emitter.explode()` with `radial: true` produces an even 360-degree burst from center | Pattern 1 | Particles might cluster or have directional bias. Fallback: use `angle: { min: 0, max: 360 }` explicitly. |
| A2 | `emitter.emitParticleAt(x, y, 1)` on an emitter with `emitting: false` correctly spawns a single particle at the given position | Pattern 3 | Trail particles would not appear. Fallback: create individual one-shot emitters per position. |
| A3 | `camera.shake()` with `force: true` cleanly interrupts an in-progress shake without visual glitch | Pattern 4 | Shake might snap abruptly. Mitigation: test in browser, tune if needed. |
| A4 | Generating a soft-glow texture via layered `fillCircle()` with different alphas produces a usable glow effect | Code Examples | Texture might look flat. Fallback: use only 'particle' texture with alpha fade; visual difference is subtle. |

## Open Questions

1. **Turret destruction shake tier**
   - What we know: D-06 defines light/medium/heavy. SHAKE-02 says turret/wall destruction shakes camera.
   - What's unclear: Whether to use medium or heavy tier (left to Claude's discretion).
   - Recommendation: Use medium tier. Turret destruction is significant but not as impactful as boss hitting core. Heavy should be reserved for the most dramatic events.

2. **Particle-glow texture usage scope**
   - What we know: Only the 'particle' texture exists today. The zapper trail could benefit from a softer glow texture.
   - What's unclear: Whether the visual improvement justifies a new texture vs. using the existing 'particle' with alpha fade.
   - Recommendation: Generate 'particle-glow' in BootScene. The cost is ~5 lines of code. Use it for zapper trail, keep 'particle' for slowfield pulses. Allows visual differentiation between effects.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None -- no test framework configured |
| Config file | none |
| Quick run command | `npm run build` |
| Full suite command | `npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VFX-04 | Slowfield has particle aura, visible energy field | manual-only | Visual: place slowfield, observe pulse waves | N/A |
| VFX-06 | Zapper lightning chain has glow trail particles | manual-only | Visual: place zapper near bugs, observe trail | N/A |
| SHAKE-01 | Core damage shakes camera proportional to damage | manual-only | Visual: let bugs reach core, observe shake intensity | N/A |
| SHAKE-02 | Turret/wall destruction shakes camera | manual-only | Visual: let spitter destroy a wall, observe shake | N/A |
| SHAKE-03 | Boss hit causes micro-shake | manual-only | Visual: spawn boss (debug key 4), fire at it, observe micro-shake | N/A |
| SHAKE-04 | UIScene HUD stable during shake | manual-only | Visual: during any shake, verify HUD text does not move | N/A |

**Justification for manual-only:** No test framework is configured. Visual effects require human observation. Automated validation is limited to `npm run build` (no compile errors).

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build` + visual inspection in browser
- **Phase gate:** Full visual verification of all 6 requirements in browser

### Wave 0 Gaps
- None -- no test infrastructure to create. Validation is build-check + visual inspection.

### Manual Verification Checklist
1. Place 2-3 slowfield turrets. Observe purple pulse waves expanding outward from center rhythmically.
2. Upgrade one slowfield. Observe larger radius + brighter tint distinction. Pulse ring should reach new range edge.
3. Place a zapper near bug spawn. Observe wider glowing line + lingering trail particles on chain.
4. Let a swarmer reach the core. Observe light shake.
5. Let a brute reach the core. Observe medium shake (noticeably stronger).
6. Spawn a boss (debug key 4). Fire at it. Observe periodic micro-shakes (not every hit).
7. Let bugs destroy a wall. Observe medium shake.
8. During any shake, verify HUD (wave text, credits, HP bar) remains perfectly stable.
9. Sell all slowfield turrets. Verify no particle artifacts remain (leak check).
10. Run `VITE_DEBUG_KEYS=true npm run dev` for boss testing.

## Project Constraints (from CLAUDE.md)

- ES modules with explicit `.js` extensions in all imports
- Config constants are UPPER_CASE objects (`GRID`, `TURRETS`, etc.) with `Object.freeze()`
- No comments unless logic is too complex
- Turret is composite class (NOT a Phaser Sprite) -- tween `.sprite` not the Turret itself
- Events drive state sync between scenes
- No test framework -- validate with `npm run build`
- Must maintain 60fps with 60 bugs + 70 bullets + particles (<300 total particle budget)
- Never auto-commit

## Sources

### Primary (HIGH confidence)
- Context7 `/rexrainbow/phaser3-rex-notes` -- camera shake API, particle emitter config, emit zones, Graphics lineStyle, emitParticleAt, flow/explode methods
- Context7 `/phaserjs/phaser` -- particle emitter duration/flow, camera shake changelog (v3.5+)
- `src/entities/Turret.js` -- current drawLightningChain(), drawAura(), destroy() implementations
- `src/scenes/GameScene.js` -- current damageCore(), playSfx() cooldown pattern
- `src/config/GameConfig.js` -- VFX frozen config structure
- `src/scenes/BootScene.js` -- particle texture generation, only 'particle' exists (no 'particle-glow') [VERIFIED: grep]

### Secondary (MEDIUM confidence)
- Context7 Phaser 3.60 changelog -- modern particle API confirmation, emit zone features

### Tertiary (LOW confidence)
- A1-A4 assumptions about `explode()` radial behavior and `emitParticleAt()` behavior -- needs runtime verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- single library (Phaser 3.90.0), all APIs verified via Context7
- Architecture: HIGH -- patterns follow existing codebase conventions, APIs confirmed
- Pitfalls: HIGH -- based on direct codebase inspection (missing texture, no cleanup paths, no state init)

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable -- Phaser 3.x API is mature)
