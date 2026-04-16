# Architecture Research

**Domain:** Phaser 3 tower defense — polish/atmosphere systems integration
**Researched:** 2026-04-15
**Confidence:** HIGH

## Recommended Architecture

### System Overview

The polish/atmosphere milestone adds a new **Effects Layer** between the existing Entity Layer and Scene Layer. This layer owns all transient visual feedback (particles, screen shake, procedural animation coordination) and the cosmic theme provides a cross-cutting config that every layer references.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Scene Layer                               │
│  BootScene  MainMenuScene  GameScene  UIScene  GameOverScene    │
│       │          │             │          │          │            │
│       ▼          ▼             ▼          ▼          ▼            │
├─────────────────────────────────────────────────────────────────┤
│                      Effects Layer  ← NEW                        │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │ VFXManager   │  │ AnimationMixin   │  │ AudioAtmosphere  │    │
│  │ (particles,  │  │ (procedural bug/ │  │ (ambient layers, │    │
│  │  shake,      │  │  turret, core    │  │  crossfade,      │    │
│  │  flashes)    │  │  animation)     │  │  SFX config)     │    │
│  └──────┬───────┘  └───────┬────────┘  └───────┬──────────┘    │
│         │                  │                    │               │
├─────────┴──────────────────┴────────────────────┴───────────────┤
│                      Configuration Layer                         │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ GameConfig   │  │ THEME config  │  │ VFX/PARTICLE configs  │   │
│  │ (existing)  │  │  ← NEW        │  │      ← NEW            │   │
│  └────────────┘  └──────────────┘  └────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Entity Layer (existing)                     │
│  ┌──────┐  ┌────────┐  ┌────────┐  ┌───────┐                    │
│  │ Grid │  │ Turret  │  │  Bug   │  │ Bullet│                    │
│  └──────┘  └────────┘  └────────┘  └───────┘                    │
├─────────────────────────────────────────────────────────────────┤
│                      System Layer (existing)                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐                 │
│  │ WaveMgr  │  │ EconomyMgr   │  │ BuildSys   │                 │
│  └──────────┘  └──────────────┘  └────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Owns | Talks To |
|-----------|---------------|------|----------|
| **VFXManager** | Creates/destroys particle emitters, triggers camera shake, manages effect lifecycle | Particle emitter instances, shake state | GameScene (called from event handlers), GameConfig.THEME (reads presets) |
| **THEME config** | Cosmic color palette, particle presets, shake presets, animation timing | Frozen config objects | All layers (read-only) |
| **Procedural Animation** | Per-frame squash/stretch/wobble on bugs, idle turret pulse, core breathing | Tween instances, animation state on entities | Bug.preUpdate(), Turret sprite, Core sprite; reads GameConfig.THEME |
| **AudioAtmosphere** | Ambient sound layers, BGM crossfade, SFX volume/rate config | Sound instances, ambient state | GameScene.playSfx() (enhanced), reads GameConfig.THEME |
| **BootScene (enhanced)** | Generates particle textures, nebula fallback textures | Generated textures | All scenes (texture keys) |

### Data Flow

```
Game Events
    │
    ├── 'bug-killed' ──────→ VFXManager.deathBurst(x, y, type)
    │                           ├── emitter.explode(count, x, y)  → Particle system
    │                           └── cameras.main.shake(duration, intensity) → Camera
    │
    ├── 'hp-changed' ──────→ VFXManager.coreImpactShake()
    │                           └── cameras.main.shake(200, 0.03)
    │
    ├── Bug.takeDamage() ──→ Bug squash/stretch tween (entity-level)
    │
    ├── Bug.preUpdate() ───→ Procedural wobble + pulse (entity-level, per-frame)
    │
    ├── Turret.fire() ─────→ VFXManager.muzzleFlash(x, y)
    │
    ├── Turret (idle) ─────→ Procedural glow pulse (tween on sprite alpha/postFX)
    │
    └── phase-changed' ────→ AudioAtmosphere.crossfade(phase)
                                ├── fade out current BGM
                                └── fade in phase BGM
```

**Key principle:** Game events flow into VFXManager for effects; procedural animations are entity-local (no manager needed). THEME config is read-only everywhere — no runtime mutation.

## Component Details

### 1. VFXManager (New System)

**Pattern:** Scene plugin / plain class (matches existing WaveManager, EconomyManager pattern)

**Why a manager instead of inline effects:**
- Current code scatters effect creation across GameScene (showBugDeathEffect, showBuildFlash) and Turret (showMuzzleFlash, drawLightningChain)
- A central manager enables: consistent config lookups, performance budgeting, easy disable for low-end, cleanup on shutdown
- Replaces the manual circle+tween particle pattern with Phaser's real particle system

**API sketch:**
```javascript
export class VFXManager {
  constructor(scene) {
    this.scene = scene;
  }

  // Burst effects — one-shot explosions
  deathBurst(x, y, bugType) { ... }
  muzzleFlash(x, y) { ... }
  buildSparkle(x, y) { ... }
  coreHitFlash() { ... }

  // Continuous effects — follow targets
  slowfieldAura(turret) { ... }

  // Camera effects
  shake(type) { ... }  // type: 'core-hit' | 'turret-death' | 'boss-hit'

  // Lifecycle
  shutdown() { ... }
}
```

**Implementation notes:**
- `this.add.particles(x, y, texture, config)` returns a ParticleEmitter directly (Phaser 3.60+). No ParticleEmitterManager needed. HIGH confidence — verified via Context7.
- `emitter.explode(count, x, y)` for burst effects — sets frequency to -1, emits count particles at once. Fire-and-forget: emitter auto-destroys when `duration` or `stopAfter` limits hit.
- `emitter.startFollow(target)` for slowfield aura — emitter follows turret sprite position. Must call `emitter.stopFollow()` + `emitter.stop()` when turret destroyed.
- For burst emitters with `stopAfter`, listen to `'complete'` event to destroy the emitter GameObject and free memory.

### 2. THEME Config (New in GameConfig.js)

**Pattern:** Frozen config objects matching existing GameConfig conventions (UPPER_CASE, Object.freeze)

```javascript
export const THEME = Object.freeze({
  // Cosmic nebula palette
  colors: Object.freeze({
    bg: 0x0a0a1e,
    primary: 0x7744ff,       // Deep purple
    secondary: 0x44aaff,     // Cosmic blue
    accent: 0x00ffaa,        // Ethereal green
    danger: 0xff4466,        // Soft red
    gold: 0xffcc44,          // Warm credits
    info: 0x88ccff,          // Cool blue
    text: 0xeeeeff,          // Slightly warm white
    muted: 0x555577,         // Dim purple-gray
    glow: 0xaa88ff,          // Soft purple glow
    nebula1: 0x220044,       // Dark nebula
    nebula2: 0x110033,       // Deeper nebula
  }),

  // Hex string versions for Phaser Text objects
  hex: Object.freeze({
    primary: '#7744ff',
    secondary: '#44aaff',
    accent: '#00ffaa',
    danger: '#ff4466',
    gold: '#ffcc44',
    info: '#88ccff',
    text: '#eeeeff',
    muted: '#555577',
  }),

  // Particle effect presets (fed to this.add.particles config)
  particles: Object.freeze({
    deathBurst: Object.freeze({
      lifespan: { min: 200, max: 400 },
      speed: { min: 40, max: 120 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
    }),
    muzzleFlash: Object.freeze({
      lifespan: 100,
      speed: { min: 20, max: 60 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
    }),
    slowfieldAura: Object.freeze({
      lifespan: 600,
      speed: { min: 5, max: 15 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.4, end: 0 },
      frequency: 80,
      blendMode: 'ADD',
    }),
    buildSparkle: Object.freeze({
      lifespan: { min: 300, max: 600 },
      speed: { min: 20, max: 60 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      blendMode: 'ADD',
    }),
  }),

  // Screen shake presets
  shake: Object.freeze({
    coreHit: Object.freeze({ duration: 200, intensity: 0.03 }),
    turretDeath: Object.freeze({ duration: 150, intensity: 0.02 }),
    bossHit: Object.freeze({ duration: 300, intensity: 0.05 }),
  }),

  // Procedural animation timings
  animation: Object.freeze({
    bugWobbleSpeed: 0.005,       // Sinusoidal wobble rate
    bugWobbleAmount: 0.05,       // Scale oscillation range
    bugSquashDuration: 120,      // Squash on damage ms
    bugSquashScaleX: 1.3,        // Stretch horizontal
    bugSquashScaleY: 0.7,        // Compress vertical
    corePulseSpeed: 0.003,       // Core breathing rate
    corePulseAmount: 0.08,       // Core scale oscillation
    turretGlowPulseSpeed: 0.002, // Turret idle glow rate
  }),

  // Audio atmosphere
  audio: Object.freeze({
    ambientVolume: 0.15,
    bgmBuildVolume: 0.3,
    bgmWaveVolume: 0.5,
    crossfadeDuration: 1500,
  }),
});
```

**Why frozen objects with hex + numeric colors:** Phaser Text objects need string hex (`'#7744ff'`), while Graphics and particle tints need numeric hex (`0x7744ff`). Having both in one config eliminates the scatter of hardcoded color values across 6+ files.

### 3. Procedural Animation (Entity Enhancements)

**Pattern:** Direct entity modification, no new class. Animation logic lives where the entity lives.

**Bug animation — added to Bug class:**

```javascript
// In Bug.spawn():
this.wobblePhase = Math.random() * Math.PI * 2;
this.squashTween = null;

// In Bug.preUpdate(), after movement:
// Idle wobble — sinusoidal scale oscillation
const wobble = Math.sin(time * THEME.animation.bugWobbleSpeed + this.wobblePhase);
const scaleAmount = 1 + wobble * THEME.animation.bugWobbleAmount;
this.setScale(scaleAmount, 2 - scaleAmount); // squash/stretch complement

// In Bug.takeDamage(), replace alpha flash:
if (this.squashTween) this.squashTween.stop();
this.squashTween = this.scene.tweens.add({
  targets: this,
  scaleX: THEME.animation.bugSquashScaleX,
  scaleY: THEME.animation.bugSquashScaleY,
  duration: THEME.animation.bugSquashDuration / 2,
  ease: 'Quad.easeOut',
  yoyo: true,
});
```

**Turret idle animation — added to Turret class:**
- Use `sprite.postFX.addGlow()` for idle glow pulse (WebGL pipeline FX, HIGH confidence from Context7)
- Tween the `outerStrength` property of the glow effect for breathing animation
- Only apply to blaster/zapper/slowfield (not wall — wall has no visual animation)

**Core breathing — added in GameScene:**
- Sinusoidal scale on coreSprite in GameScene.update()
- Combined with existing tint flash on damage

**Why no AnimationManager:** Each animation is entity-local. A manager adds indirection without value — tweens are fire-and-forget, and per-frame animations need direct access to `this` in preUpdate. The config centralizes timing; the entity applies it.

### 4. Audio Atmosphere (GameScene Enhancement)

**Pattern:** Enhance existing `playSfx()` and BGM handling. Not a new class — GameScene already owns audio.

**Key additions:**
- **Dual BGM tracks:** Build phase ambient (`bgm_build`) and wave phase (`bgm_wave`). Crossfade on phase transition using tween on volume.
- **Ambient layer:** A low-volume looping sound (`bgm_ambient`) running under both BGMs for constant cosmic atmosphere.
- **SFX volume/rate from config:** Replace hardcoded cooldowns with THEME.audio values.
- **SFX rate variation:** Use Phaser's `sound.play(key, { rate: 0.9 + Math.random() * 0.2 })` for slight pitch randomization on repetitive sounds (shooting, zapping). Makes same SFX sound less mechanical.

```javascript
// Enhanced playSfx with pitch variation:
playSfx(key, config) {
  const now = this.time.now;
  const cooldown = THEME.audio.sfxCooldowns?.[key] ?? 0;
  if (cooldown > 0) {
    const last = this._sfxCooldowns[key] || 0;
    if (now - last < cooldown) return;
    this._sfxCooldowns[key] = now;
  }
  const rateVar = THEME.audio.sfxRateVariation?.[key] ?? 0;
  this.sound.play(key, {
    ...config,
    volume: THEME.audio.sfxVolume?.[key] ?? 1,
    rate: 1 + (Math.random() - 0.5) * rateVar,
  });
}
```

### 5. BootScene Texture Generation (Enhanced)

**New particle textures to generate:**

```javascript
// Soft glow circle (for particles) — different sizes
generateGlowTexture(key, radius, color) {
  const g = this.add.graphics();
  // Radial gradient approximation via concentric circles
  for (let i = radius; i > 0; i--) {
    const alpha = (1 - i / radius) * 0.8;
    g.fillStyle(color, alpha);
    g.fillCircle(radius, radius, i);
  }
  g.generateTexture(key, radius * 2, radius * 2);
  g.destroy();
}
```

**Textures needed:**
- `'particle-soft'` — small soft glow (8x8), white base, tinted at runtime
- `'particle-dot'` — tiny hard dot (4x4), for sparks
- `'particle-ring'` — ring shape, for slowfield aura
- `'particle-large'` — larger soft glow (16x16), for boss death

**Why generate textures instead of image assets:**
- Fallback generation already exists in BootScene
- Particle textures are simple geometric shapes — code generation is cleaner than managing tiny PNG files
- Consistent with project's existing pattern (BootScene.generateFallback)
- Enables tinting at runtime via emitter `tint` or `color` array config

### 6. UI Theme Migration (Cross-Cutting)

**Pattern:** Replace all hardcoded color values with THEME.colors / THEME.hex references.

**Files affected:**
| File | Current Hardcoded Colors | Migration |
|------|--------------------------|-----------|
| UIScene.js | `0x333333`, `0x00ff44`, `'#ffffff'`, `'#ffdd00'`, `'#88ccff'`, `'#00ff88'` | → THEME.colors / THEME.hex |
| BuildSystem.js | `0x111122`, `0x4488aa`, `'#ffdd00'`, `'#ffffff'`, `'#00ff88'`, `'#88aacc'`, `'#555555'`, `'#ff3333'` | → THEME.colors / THEME.hex |
| GameOverScene.js | `'#00ff88'`, `'#ff3333'`, `'#ffffff'` | → THEME.hex |
| GameScene.js | `0xff4444` (core tint), `0x44ff44` / `0xff4444` / `0xff8844` / `0x9900ff` (death colors) | → THEME.colors |
| BootScene.js | `0xff00ff` (fallback), `0x1a1a2e` (background), `0x00ff88` (progress) | → THEME.colors |
| Turret.js | `0xaa44ff` (lightning), `0x44ddff` (aura), `0xffffaa` (flash), `0xffdd44` (upgrade tint), `0xff4444` (damage) | → THEME.colors |

**Approach:** Single pass through each file, replacing hardcoded values with THEME references. No structural changes needed.

## Architectural Patterns

### Pattern 1: Config-Driven Effects

**What:** All visual effect parameters (colors, durations, intensities, particle configs) live in THEME config. Code reads them, never hardcodes.

**When to use:** Always. This is the core pattern for the entire milestone.

**Trade-offs:**
- Pro: Single place to tune the entire aesthetic. Changing the palette is a config change, not a 12-file hunt.
- Pro: Makes it possible to add theme switching later without refactoring.
- Con: Slightly more verbose code (`THEME.colors.primary` vs `0x7744ff`). Worth it.

**Example:**
```javascript
// Bad — scattered magic numbers
this.add.circle(x, y, 3, 0x44ff44, 1);

// Good — config-driven
this.add.circle(x, y, 3, THEME.colors.accent, 1);
```

### Pattern 2: Burst Emitters for One-Shot Effects

**What:** Use `emitter.explode(count, x, y)` for death bursts, muzzle flashes, build sparkles. Set `stopAfter` and `duration` in config so the emitter auto-stops and dispatches `'complete'` for cleanup.

**When to use:** Any effect that fires once at a point and fades. Never for continuous effects.

**Trade-offs:**
- Pro: Phaser manages particle lifecycle. No manual cleanup of circle GameObjects.
- Pro: Blend modes (`ADD`), color interpolation, and per-particle physics are free.
- Con: Requires a texture (even a small generated one). The current circle+tween approach doesn't.
- Con: Emitters are heavier than a single circle. For 1-2 particles, circle+tween is fine. Use emitters when count > 3 or when blend modes/color interpolation add value.

**Example:**
```javascript
deathBurst(x, y, bugType) {
  const colors = {
    swarmer: [THEME.colors.accent, THEME.colors.secondary],
    brute: [THEME.colors.danger, THEME.colors.gold],
    spitter: [THEME.colors.danger, THEME.colors.primary],
    boss: [THEME.colors.primary, THEME.colors.glow],
  };
  const emitter = this.scene.add.particles(x, y, 'particle-soft', {
    ...THEME.particles.deathBurst,
    color: colors[bugType] || [THEME.colors.accent],
    stopAfter: bugType === 'boss' ? 20 : 8,
  });
  emitter.explode(bugType === 'boss' ? 20 : 8);
  emitter.on('complete', () => emitter.destroy());
}
```

### Pattern 3: Entity-Local Continuous Animation

**What:** Ongoing animations (bug wobble, core breathing, turret glow pulse) live in the entity's preUpdate or as persistent tweens. No central animation manager.

**When to use:** Continuous/per-frame effects tied to a specific entity instance.

**Trade-offs:**
- Pro: Entity has direct access to its own sprite state. No indirection.
- Pro: Animation naturally stops when entity is despawned/destroyed.
- Con: Each entity type has its own animation code. No reuse across very different entities.
- Mitigation: Config values are centralized. The animation logic is trivial (1-3 lines in preUpdate).

**Example:**
```javascript
// Bug wobble in preUpdate — 2 lines
const wobble = Math.sin(time * THEME.animation.bugWobbleSpeed + this.wobblePhase);
this.setScale(1 + wobble * THEME.animation.bugWobbleAmount,
              1 - wobble * THEME.animation.bugWobbleAmount);
```

### Pattern 4: Camera Shake as Effect Response

**What:** Call `this.cameras.main.shake(duration, intensity)` from VFXManager in response to game events (core damage, turret destruction, boss hits).

**When to use:** High-impact moments that should feel visceral. Never for routine hits.

**Trade-offs:**
- Pro: Built into Phaser, zero implementation cost.
- Pro: Purely visual — doesn't move physics bodies, so no gameplay side effects.
- Con: Overuse numbs the player. Reserve for significant events.
- Con: Only affects the camera viewport. If multiple cameras exist, must call on the right one. Bug Siege uses one camera, so this is not an issue.

**Example:**
```javascript
shake(type) {
  const preset = THEME.shake[type];
  if (!preset) return;
  this.scene.cameras.main.shake(preset.duration, preset.intensity);
}
```

## Data Flow

### Effect Trigger Flow

```
Game Event (damage, kill, build, phase change)
    ↓
GameScene event handler
    ↓
    ├──→ VFXManager method (particles, shake, flash)
    │         ├── this.scene.add.particles(...) → ParticleEmitter → auto-cleanup
    │         └── this.scene.cameras.main.shake(...) → Camera effect → auto-complete
    │
    ├──→ Entity animation (squash, wobble, glow)
    │         ├── scene.tweens.add(...) → Tween → auto-destroy
    │         └── this.setScale(...) in preUpdate → per-frame
    │
    └──→ AudioAtmosphere method (crossfade, ambient)
              ├── scene.tweens.add({ targets: sound, volume }) → fade
              └── sound.play(key, config) → SFX instance
```

### Theme Data Flow

```
THEME config (frozen, read-only)
    ↓ (imported by)
    ├── VFXManager — reads THEME.particles.*, THEME.shake.*, THEME.colors.*
    ├── Bug — reads THEME.animation.bug*
    ├── Turret — reads THEME.animation.turret*, THEME.colors.*
    ├── GameScene — reads THEME.colors.* (core tint, death colors)
    ├── UIScene — reads THEME.hex.* (text colors, bar colors)
    ├── BuildSystem — reads THEME.hex.*, THEME.colors.* (menu styling)
    ├── BootScene — reads THEME.colors.* (texture generation, loading bar)
    └── GameOverScene — reads THEME.hex.* (result colors)
```

### Key Data Flows

1. **Bug death → effects:** Bug.die() emits 'bug-killed' → GameScene.onBugKilled() calls VFXManager.deathBurst() + VFXManager.shake() for bosses + playSfx()
2. **Core damage → shake:** GameScene.damageCore() calls VFXManager.shake('core-hit') in addition to existing tint flash
3. **Turret fire → muzzle flash:** Turret.fire() calls VFXManager.muzzleFlash() instead of inline circle tween
4. **Phase change → audio crossfade:** GameScene.startBuildPhase/startWavePhase triggers AudioAtmosphere crossfade between BGM tracks
5. **Slowfield placement → aura:** Turret constructor (type slowfield) calls VFXManager.slowfieldAura() which creates a follow-emitter. Turret.destroy() stops and destroys the emitter.

## Anti-Patterns

### Anti-Pattern 1: Particle Emitter Manager

**What people do:** Create a ParticleEmitterManager to hold multiple emitters (Phaser 3.55 pattern).
**Why it's wrong:** ParticleEmitterManager was removed in Phaser 3.60. Emitters are now standalone GameObjects. Using the old pattern will crash.
**Do this instead:** Call `this.add.particles(x, y, texture, config)` directly. Each emitter is its own GameObject.

### Anti-Pattern 2: Tweening the Turret Instance

**What people do:** Tween the Turret class instance (e.g., `tween({ targets: turret, alpha: 0 })`).
**Why it's wrong:** Turret is a composite class, not a Sprite. It wraps `turret.sprite`. Tweening the Turret instance tweens the wrapper object's properties, not the visible sprite.
**Do this instead:** Always tween `turret.sprite` or `turret.sprite.postFX` properties. This is already documented in AGENTS.md but worth reinforcing because procedural animation adds new tweens on turrets.

### Anti-Pattern 3: Creating Emitters Every Frame

**What people do:** Call `this.add.particles()` inside update() or preUpdate() for continuous effects.
**Why it's wrong:** Each call creates a new GameObject. At 60fps this floods the display list and kills performance within seconds.
**Do this instead:** For continuous effects (slowfield aura), create the emitter once in setup with `frequency` config. Use `emitter.startFollow(target)` for position tracking. For one-shot effects, create emitters on events (not every frame) and destroy them in the `'complete'` callback.

### Anti-Pattern 4: Shake on Every Hit

**What people do:** Call `cameras.main.shake()` for every bullet-bug collision.
**Why it's wrong:** With 50 bullets and 60 bugs, that's potentially dozens of shakes per second. The camera will vibrate constantly, making the game unplayable and causing player fatigue.
**Do this instead:** Reserve shake for high-impact events only: core damage, turret destruction, boss hits. Use the shake presets in THEME config to keep intensities appropriate.

### Anti-Pattern 5: Hardcoded Colors During Theme Migration

**What people do:** Change colors in some files but leave others hardcoded.
**Why it's wrong:** Partial migration means the game looks inconsistent — some elements are cosmic purple, others are still old green. Hard to track which files were updated.
**Do this instead:** Migrate all files in one pass. Use THEME.colors for numeric and THEME.hex for string colors. No exceptions. If a color doesn't fit the palette, add it to THEME rather than hardcoding.

## Integration Points

### Existing System Integration

| Boundary | Communication | Notes |
|----------|---------------|-------|
| VFXManager ↔ GameScene | Direct method calls | GameScene owns VFXManager instance, calls methods from event handlers |
| VFXManager ↔ Turret | VFXManager.slowfieldAura(turret) | Turret passes itself; VFXManager reads turret.sprite for position |
| VFXManager ↔ Camera | cameras.main.shake() | Direct Phaser API, no custom wiring |
| AudioAtmosphere ↔ GameScene | Enhanced playSfx(), BGM crossfade | Extends existing GameScene audio code, not a separate class |
| THEME config ↔ Everything | Import + read | Frozen objects, read-only. No events needed. |
| Procedural Animation ↔ Bug | Bug.preUpdate() + takeDamage() | Self-contained within entity, reads THEME.animation |
| Procedural Animation ↔ Turret | Turret sprite tweens | Self-contained, reads THEME.animation |
| BootScene ↔ All Scenes | Texture keys | Generated particle textures available to all scenes via Phaser texture cache |

### New Event Names

The effects layer does NOT introduce new game events. Effects are triggered from existing event handlers in GameScene. This keeps the event architecture unchanged and avoids coupling effects into the gameplay event bus.

## Scaling Considerations

| Concern | Current (60 bugs) | At Limit | Approach |
|---------|-------------------|----------|----------|
| Active particle emitters | 0 (manual circles) | Up to ~20 burst emitters per wave | `'complete'` event destroys burst emitters; follow emitters limited to slowfield count (max ~5-6) |
| Active particles on screen | N/A | ~200 particles peak | Phaser particle system handles pooling internally; `reserve` in config pre-allocates |
| Tween count | ~10 (HP bars, UI) | +30-40 (squash, wobble, glow) | Fire-and-forget tweens auto-destroy; persistent wobble is per-frame in preUpdate, not a tween |
| Screen shake | N/A | 1 shake at a time | Camera handles queuing; multiple shakes merge (last intensity wins) |
| Audio instances | 1 BGM + SFX | +1 ambient layer | Phaser WebAudio handles mixing; total of 3 concurrent loops is trivial |

### Performance Budget

The game must maintain 60fps with:
- 60 bugs + 50 bullets + 20 spitter bullets (existing)
- ~10 active particle emitters (burst + follow)
- ~200 total particles on screen
- ~40 active tweens
- 3 concurrent audio loops

This is well within Phaser 3's capabilities. The particle system uses a single draw call per emitter (batched), and tweens are lightweight math operations. The main risk is **overdraw from ADD blend mode particles** — keep particle counts per emitter conservative (8-12 for bursts, not 50+).

## Recommended Build Order

Dependencies determine the sequence. Items at the same level can be built in parallel.

```
1. THEME config (no dependencies, everything else reads it)
   ↓
2. Particle texture generation in BootScene (needs THEME colors)
   ↓
3a. VFXManager (needs THEME + textures)     3b. Procedural animation in Bug (needs THEME)
   ↓                                            ↓
4a. Integrate VFXManager into GameScene      4b. Procedural animation in Turret/Core
   ↓                                            ↓
5. Audio atmosphere enhancement (needs THEME, independent of visual systems)
   ↓
6. UI theme migration (needs THEME, touches UIScene/BuildSystem/GameOverScene/BootScene)
   ↓
7. Final integration testing + balance pass
```

**Rationale:**
- THEME config is the foundation — every other component reads from it.
- Particle textures must exist before any emitter can be created.
- VFXManager and procedural animation are independent of each other — can be built in parallel.
- Audio atmosphere is independent of visual effects — can be built in parallel with VFXManager.
- UI theme migration is safest last because it touches the most files but has no structural dependencies. It's a search-and-replace of color values, not architecture work.

## Sources

- Phaser 3 ParticleEmitter API — Context7 `/websites/phaser_io_api-documentation`, verified 2026-04-15
- Phaser 3.60+ particle system changes (ParticleEmitterManager removal) — Context7 `/websites/phaser_io`, verified 2026-04-15
- Phaser 3 Camera Shake API — Context7 `/websites/phaser_io_api-documentation`, class `Cameras.Scene2D.Effects.Shake`, verified 2026-04-15
- Phaser 3 TweenManager — Context7 `/websites/phaser_io`, concepts/tweens, verified 2026-04-15
- Phaser 3 Post-FX Glow pipeline — Context7 `/websites/phaser_io`, concepts/fx, verified 2026-04-15
- Phaser 3 Sound Manager — Context7 `/websites/phaser_io_api-documentation`, class `Sound.WebAudioSoundManager`, verified 2026-04-15
- Phaser 3 Graphics.generateTexture — Context7 `/websites/phaser_io`, concepts/gameobjects/graphics, verified 2026-04-15
- Existing codebase analysis — `src/` all files read directly, 2026-04-15
- Existing architecture — `.planning/codebase/ARCHITECTURE.md`, 2026-04-15

---
*Architecture research for: Phaser 3 tower defense polish/atmosphere*
*Researched: 2026-04-15*
