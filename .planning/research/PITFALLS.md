# Pitfalls Research

**Domain:** Phaser 3 tower defense game polish — particles, screen shake, procedural animation, cosmic theme overhaul, ethereal audio
**Researched:** 2026-04-15
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Tweening the Turret Composite Instead of Turret.sprite

**What goes wrong:**
Turret is a plain class that wraps `this.sprite` (a Phaser Sprite) and `this.wallBody` (a static physics body). It does NOT extend Phaser.GameObjects.Sprite. Passing the Turret instance as a tween target (`scene.tweens.add({ targets: turret, scaleX: 1.2 })`) silently does nothing — the tween runs but modifies non-existent properties on the plain class, not on the displayed sprite. The visual effect never appears and there is no error thrown.

**Why it happens:**
Phaser tweens modify properties directly on the target object. When the target is the Turret composite, `turret.scaleX` is set (a new property created on the plain object) but `turret.sprite.scaleX` — the property actually read by the renderer — is untouched. The game appears to ignore the tween entirely with zero feedback about why.

**How to avoid:**
Always tween `turret.sprite`, never the Turret instance. Wrap a helper if needed: `turret.tweenScale(to, duration)` that internally does `scene.tweens.add({ targets: this.sprite, scaleX: to, ... })`. Add a codebase audit step: grep for `targets: turret` (without `.sprite`) in all tween calls. Document this rule prominently in AGENTS.md alongside the existing "Tween `turret.sprite`, never the Turret instance itself" warning.

**Warning signs:**
- Procedural animation code runs but visual bug/turret never changes shape
- No console errors despite tween not working
- New tween code references `this` inside Turret methods without `.sprite`

**Phase to address:**
Procedural Bug Animation phase — this is the first phase that adds tweens to Turret objects for scale/rotation effects on upgrades or firing recoil.

---

### Pitfall 2: Fake Particles (Circle+Tween) Destroy Performance at Scale

**What goes wrong:**
The current `showBugDeathEffect` in GameScene.js (line 325-343) creates 6-12 individual `this.add.circle()` game objects, each with its own tween, then destroys them after 300ms. This pattern is fine for occasional deaths but becomes a performance disaster when scaled: 10 bugs dying in the same frame = 60-120 game objects created + 60-120 tweens created + 60-120 tweens destroyed within 300ms. This causes GC pressure, display list churn, and frame drops during intense wave moments.

**Why it happens:**
Developers reach for `add.circle` + tween because it's the simplest API. It works in isolation during development when testing one death at a time. The performance cliff only appears in gameplay with simultaneous kills — exactly the moments where juice matters most.

**How to avoid:**
Replace ALL circle+twen pseudo-particle effects with Phaser 3.60+ `this.add.particles(x, y, texture, config)` and use `emitter.explode(count, x, y)`. Create a small set of reusable emitter configs (one per effect type: death burst, muzzle flash, build sparkle) and store them on the scene. Each emitter is created once with `frequency: -1` (manual/explode mode) and reused. Move the emitter position before each `explode()` call. This eliminates per-death game object creation entirely.

The codebase needs a single small particle texture. Generate it in BootScene via `graphics.generateTexture` (a 4x4 white circle at 8x8 pixels works for all effects — tint/scale config creates visual variety).

**Warning signs:**
- Frame drops during wave 7-10 when many bugs die simultaneously
- Growing `displayList.length` during intense moments (check in debug overlay)
- Increased JS heap size spikes every 300ms during combat

**Phase to address:**
Particle Effects phase — must replace the existing `showBugDeathEffect` and `showMuzzleFlash` and `showBuildFlash` implementations, not just add new particle effects alongside them.

---

### Pitfall 3: Screen Shake Misalignment Between GameScene and UIScene

**What goes wrong:**
GameScene and UIScene run as parallel scenes with separate cameras (`this.scene.launch('UIScene')` in GameScene.js line 80). Calling `this.cameras.main.shake(duration, intensity)` on GameScene shakes only the game world. The HUD in UIScene stays perfectly still. This creates a visual disconnect: the game world jolts but health bars, credits, and the start-wave button remain frozen. Players perceive this as a bug, not a feature — the shake "doesn't work" on half the screen.

**Why it happens:**
Phaser's camera shake only affects the camera of the scene it's called on. Parallel scenes have independent cameras. Developers test shake, see it working, and ship without noticing the HUD mismatch because they focus on the game world during testing.

**How to avoid:**
Decide the intended behavior explicitly: **HUD should NOT shake** (it's an overlay, like a HUD in any FPS). This is the standard pattern and what players expect. To achieve this, do nothing to UIScene's camera — the shake on GameScene is correct as-is. However, there's a second problem: any temporary visual effects (wave announcement text, damage numbers) added to GameScene WILL shake because they're on GameScene's camera. Effects that should appear stable (like floating damage numbers) must be added to UIScene instead. Document the rule: "Stable overlay effects → UIScene. World-space effects → GameScene."

If you DO want a subtle full-screen shake feel without UIScene camera shake, add a very brief camera flash (`this.cameras.main.flash(50, ...)`) on UIScene for high-impact events — this gives a screen-wide response without the disconnect of partial shaking.

**Warning signs:**
- Playtesters say "the shake is broken" or "why doesn't the HP bar shake"
- Visual effects (damage numbers, text popups) jittering with shake when they shouldn't
- Two different shake rhythms visible simultaneously (world shakes, HUD doesn't)

**Phase to address:**
Screen Shake phase — must establish the GameScene/UIScene camera shake convention before implementing any shake effects.

---

### Pitfall 4: Orphaned Tweens on Pooled Bug Objects

**What goes wrong:**
Bug objects use Phaser's object pooling (maxSize: 60). When a bug dies, `despawn()` sets `active=false`, `visible=false`, `body.enable=false`. But if a procedural animation tween (e.g., a pulse or wobble loop) was running on that bug sprite, the tween continues running against the despawned sprite. When the bug is respawned via `bug.spawn(...)`, the old tween is still modifying the sprite's properties, fighting with the new spawn state or with new tweens. This causes bugs to spawn with wrong scale, alpha, or rotation, and tweens to pile up over the object's lifetime.

**Why it happens:**
Phaser tweens don't auto-destroy when their target is deactivated. `setVisible(false)` and `setActive(false)` don't stop tweens — they're managed by the TweenManager, not the display list. Developers assume despawn = cleanup, but it's not.

**How to avoid:**
In `Bug.despawn()`, add explicit tween cleanup: `this.scene.tweens.killTweensOf(this)`. This kills all tweens targeting the Bug instance. For tweens on `this` (the Arcade Sprite itself), this works directly. Add this as the first line of `despawn()`:

```javascript
despawn() {
  this.scene.tweens.killTweensOf(this);
  this.setActive(false);
  this.setVisible(false);
  this.body.enable = false;
  this.setVelocity(0, 0);
  this.setScale(1);
  this.setAlpha(1);
}
```

Also reset visual properties (scale, alpha, rotation) in both `despawn()` and `spawn()` to guard against stale state from killed-but-not-reset tweens.

**Warning signs:**
- Bugs spawning with tiny scale or partial transparency
- Scale/alpha flickering on respawned bugs
- Growing tween count in `scene.tweens.getAll().length` (check in debug overlay)
- Bugs appearing to "pulse" with the rhythm of a previous bug's animation

**Phase to address:**
Procedural Bug Animation phase — must add tween cleanup to `despawn()` before any procedural tweens are added to bugs. This is a prerequisite, not a follow-up.

---

### Pitfall 5: Incremental Theme Overhaul Creates Visual Incoherence

**What goes wrong:**
The cosmic nebula theme requires changing colors across GameScene, UIScene, BuildSystem, Turret, Bug, GameOverScene, and BootScene. If colors are changed file-by-file over multiple sessions, the game will pass through extended states where some UI uses the new purple/blue palette and some still uses the old green/cyan/white palette. The mixed state looks worse than either palette alone — it reads as "broken" rather than "in progress."

**Why it happens:**
Colors are hardcoded throughout the codebase (CONCERNS.md identifies this). There are ~40+ color values across 6+ files. Changing them incrementally is the natural approach (one file per commit), but each intermediate state is visually broken. There's no central color config to change in one place.

**How to avoid:**
**Step 1: Create a `THEME` config object in GameConfig.js** before changing any colors. Define the full cosmic palette there:

```javascript
export const THEME = Object.freeze({
  bg: 0x0a0a1e,
  accent: 0x8844ff,
  // ... all colors
});
```

**Step 2: Replace all hardcoded colors with `THEME` references in one atomic commit.** Don't test each file individually — do all replacements, then verify the build. The intermediate state will look wrong, but it's one commit, not a prolonged broken state.

**Step 3: Only then change `THEME` values** to the cosmic palette. This is a single-file change that shifts the entire game's look at once.

This two-step approach means the "mixed palette" state exists only in an uncommitted working tree, never in a playable build.

**Warning signs:**
- Menu borders are purple but menu text is still green
- HUD health bar uses new colors but turret HP bars use old colors
- Background is deep nebula but grid tiles still have old alpha/color
- Any "some things updated, some not" visual state visible during development

**Phase to address:**
Cosmic Nebula Visual Theme phase — must create the THEME config first, then do the color swap atomically. This is the foundation of the entire theme phase.

---

### Pitfall 6: Particle Emitters Created Per-Event Instead of Reused

**What goes wrong:**
Calling `this.add.particles(x, y, texture, config)` creates a new ParticleEmitter game object each time. If you create a new emitter inside `onBugKilled()` for every death, you're creating and adding a game object to the display list on every kill. These emitters need to be cleaned up (destroyed) after their particles die. Forgetting to destroy them leaks game objects. Destroying them at the wrong time kills still-rendering particles. With 10+ simultaneous deaths, this creates 10+ emitter objects that all need lifecycle management.

**Why it happens:**
The Phaser docs show `this.add.particles()` examples that create emitters on-demand. It works for one-off effects. Developers copy this pattern without realizing that for frequently-occurring effects in a game loop, you need a pool/reuse strategy.

**How to avoid:**
Create a small number of persistent emitters in `GameScene.create()` with `frequency: -1` (manual mode) and reuse them:

```javascript
this.deathEmitter = this.add.particles(0, 0, 'particle', {
  lifespan: 400,
  speed: { min: 40, max: 120 },
  scale: { start: 0.5, end: 0 },
  alpha: { start: 1, end: 0 },
  blendMode: 'ADD',
  emitting: false,
});
```

Then on each death: `this.deathEmitter.emitParticleAt(x, y, count)`. The emitter position is set by `emitParticleAt`, and no new game objects are created. Create one emitter per effect type (death, muzzle, build, slowfield-aura), not per event.

**Warning signs:**
- `this.add.particles()` called inside event handlers or update loops
- Growing display list length during gameplay
- Particle emitters not being destroyed after their effects complete
- Memory growing linearly over a 10-wave play session

**Phase to address:**
Particle Effects phase — must establish the persistent-emitter pattern before implementing any particle effects.

---

### Pitfall 7: WebAudio Node Saturation from Layered Audio

**What goes wrong:**
Browsers limit simultaneous WebAudio source nodes (typically ~16-32 depending on browser). The current game already has ~7 SFX keys + 1 BGM. Adding cosmic ambient audio (layered pads, environmental sounds) plus more varied SFX could saturate the audio node limit. When this happens, new sounds silently fail to play, or existing sounds get cut off mid-playback. The game's juice degrades at exactly the moments when it should peak.

**Why it happens:**
Each `this.sound.play()` creates a new WebAudio source node (unless using HTML5 Audio mode). The existing `playSfx` cooldown system (GameScene.js line 314-323) limits per-key frequency but doesn't limit total simultaneous sounds. Adding ambient audio layers (2-3 looping pads) consumes nodes constantly, reducing the budget available for impact SFX.

**How to avoid:**
1. **Audio sprite for ambient layers.** Use `this.load.audioSprite()` to pack ambient sounds into a single audio buffer with markers. This uses one node for multiple ambient sounds instead of separate nodes per layer.
2. **Global simultaneous sound limit.** Enhance `playSfx()` with a total active sound count check: `if (this.sound.getAllPlaying().length > MAX_CONCURRENT) return;` where MAX_CONCURRENT ≈ 16.
3. **Priority system.** Ambient audio is lowest priority, impact SFX highest. When approaching the limit, skip ambient replays, not kill sounds.
4. **Pre-render ambient into BGM.** Instead of layering 3 ambient tracks + 1 BGM, pre-render a single BGM that already includes the ambient textures. This uses 1 node instead of 4.

**Warning signs:**
- SFX randomly not playing during intense combat
- Ambient audio cutting out when many turrets fire simultaneously
- Sound "popping" or glitching during wave 8-10
- `this.sound.getAllPlaying().length` exceeding 12+ during normal gameplay

**Phase to address:**
Ethereal Audio Atmosphere phase — must establish the audio budget and priority system before adding ambient audio layers.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `add.circle()` + tween for death particles | Quick to implement, no particle texture needed | GC pressure, display list churn at scale, frame drops during intense combat | Never — replace with `add.particles()` + `explode()` before shipping |
| Hardcoded color values per scene | Fast to write, no cross-file dependency | Theme changes require hunting 40+ values across 6+ files, mixed-palette states during development | Only in initial prototype — must extract to THEME config before theme work |
| Creating particle emitters per event | Matches Phaser doc examples, works for one-off effects | Leaks game objects if not destroyed, creates lifecycle management burden for frequent events | Only for truly one-off effects (e.g., game over) — never for per-kill or per-shot effects |
| Adding procedural tweens in `spawn()` without cleanup in `despawn()` | Immediate visual result | Tweens persist across pool cycles, bugs spawn with stale visual state, tween count grows unbounded | Never — always pair tween creation with `killTweensOf()` in despawn |
| Layering 3+ ambient audio tracks separately | Rich, dynamic atmosphere | Saturates WebAudio nodes, competes with impact SFX, browser-specific failure modes | Only if pre-rendered into a single BGM track |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Camera shake + parallel UIScene | Shaking only GameScene camera and expecting full-screen effect, or shaking both cameras and getting dizzy HUD | Shake only GameScene; HUD stays stable (standard FPS pattern). Add camera flash on UIScene for high-impact events if full-screen acknowledgment needed |
| Particle emitters + object pooling | Creating emitters per pool event (per kill, per shot), destroying after particles die | Create persistent emitters with `emitting: false`, call `emitParticleAt()` per event, never destroy/recreate |
| Tweens + Turret composite class | `scene.tweens.add({ targets: turret, ... })` instead of `targets: turret.sprite` | Always tween `turret.sprite`. Add helper methods on Turret that internally tween `this.sprite` |
| Procedural animation + Bug pool | Adding tweens in `spawn()`, not cleaning in `despawn()` | `despawn()` must call `this.scene.tweens.killTweensOf(this)` and reset visual properties to defaults |
| Cosmic theme + BootScene fallback textures | Updating game colors but forgetting the magenta fallback textures in `generateFallback()` | Update `generateFallback()` to use THEME colors. Fallback textures should match the new palette |
| Slowfield aura + particle emitter | Creating a flowing particle emitter but not cleaning it when turret is destroyed/sold | Emitter must be destroyed in `Turret.destroy()`. Add to the existing cleanup block alongside auraGraphics |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Circle+twen pseudo-particles at scale | Frame drops, GC spikes, growing display list | Use Phaser particle emitters with `explode()` mode | 5+ simultaneous bug deaths (wave 5+) |
| Unbounded tween count | Growing `scene.tweens.getAll().length`, stale visual state on respawned pool objects | `killTweensOf()` in despawn, reset visual defaults in spawn | After 2-3 waves of procedural animation without cleanup |
| Per-event emitter creation | Memory growth, display list bloat, emitters not destroyed | Persistent emitters with `emitting: false`, reuse via `emitParticleAt()` | 10+ events per second (late waves with many turrets) |
| Too many simultaneous particle emitters alive | Frame rate drops during combat with particles from multiple sources | Limit total alive particles across emitters, use `maxAliveParticles` config | 3+ emitters with 50+ alive particles each |
| WebAudio node saturation | SFX not playing, ambient cutting out, audio glitching | Global concurrent sound limit (~16), audio sprites for ambient, pre-rendered BGM | 12+ concurrent sounds (late waves with ambient + combat SFX) |
| Camera shake on every minor event | Players get motion fatigue, shake loses impact, no visual hierarchy | Reserve shake for high-impact events only (core damage, boss hits, turret destruction). Use lesser effects (flash, tint) for minor impacts | When shake fires on every bullet hit instead of significant events |

## Security Mistakes

Not applicable — this is a client-side game with no server communication or user-generated content. The only security-adjacent concern is CC0 license compliance for new assets, which is a legal constraint not a security issue.

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Over-shaking the camera | Motion sickness, reduced readability, players learn to ignore shake | Reserve shake for 3-4 high-impact event types (core damage, boss death, turret destruction). Use hierarchy: shake > flash > tint > alpha blink |
| Particle effects obscuring gameplay | Can't see bugs or turrets through thick particle clouds, mis-click grid cells | Keep particles short-lived (<400ms), small, and semi-transparent. Use `blendMode: 'ADD'` for glow effects that don't obscure |
| Cosmic theme reducing readability | Deep purple/blue palette makes text and UI elements hard to read against dark backgrounds | Use high-contrast accent colors (#00ff88 type brightness) for interactive elements and critical info. Never use low-contrast purple-on-dark-blue for text |
| Ambient audio too loud relative to SFX | Can't hear kill/shoot sounds that provide gameplay feedback, atmospheric intent backfires | BGM/ambient at 0.15-0.25 volume, impact SFX at 0.5-0.8. Mix so that a turret shot is always clearly audible over ambient |
| Procedural animation too extreme | Bugs pulsing/wobbling so much they look glitchy, not organic | Keep squash/stretch subtle (1.0 ± 0.15 scale), wobble small (±5° rotation). Real organic motion is understated |

## "Looks Done But Isn't" Checklist

- [ ] **Screen shake:** Often implemented without the GameScene/UIScene camera boundary decision — verify HUD stays stable during shake
- [ ] **Particle effects:** Often replacing the visible effect but not cleaning up the old `showBugDeathEffect` circle+twen code — verify old effect code is removed, not just hidden
- [ ] **Procedural bug animation:** Often added to `spawn()` without tween cleanup in `despawn()` — verify pool objects reset to default visual state across spawn/despawn cycles
- [ ] **Theme overhaul:** Often changing game colors but missing BootScene `generateFallback()` fallback textures — verify fallbacks use new palette (currently magenta)
- [ ] **Theme overhaul:** Often changing game colors but missing GameOverScene colors — verify game over screen uses cosmic palette
- [ ] **Audio atmosphere:** Often adding ambient without checking concurrent sound limits — verify SFX still plays during intense combat with ambient running
- [ ] **Slowfield particle aura:** Often creating emitter but not destroying in `Turret.destroy()` — verify selling a slowfield cleans up its particle emitter
- [ ] **Turret composite tween:** Often tweening `turret` instead of `turret.sprite` — verify all tween targets reference `.sprite`

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Tweens targeting Turret instead of Turret.sprite | LOW | Search-replace `targets: turret` → `targets: turret.sprite` in all tween calls. Add `.sprite` to any missing references |
| Circle+twen pseudo-particles | MEDIUM | Create particle texture in BootScene, replace all `showBugDeathEffect`/`showMuzzleFlash`/`showBuildFlash` with emitter.explode() calls. Remove old methods |
| Orphaned tweens on pooled bugs | LOW | Add `this.scene.tweens.killTweensOf(this)` + property resets to `despawn()`. Add property resets to `spawn()` as safety net |
| Mixed-palette theme state | MEDIUM | Extract all colors to THEME config in GameConfig.js in one pass. Then change THEME values. Two commits, not six |
| Per-event emitter creation | MEDIUM | Refactor to persistent emitters created in `create()`. Replace all `this.add.particles()` calls in event handlers with `emitParticleAt()` |
| WebAudio saturation | LOW | Add concurrent sound limit to `playSfx()`. Pre-render ambient into single BGM track. Reduce ambient volume |
| Camera shake / UIScene mismatch | LOW | Explicitly decide HUD doesn't shake (standard). Remove any UIScene camera shake if accidentally added. Add camera flash on UIScene for boss/core events |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Tweening Turret composite instead of .sprite | Procedural Bug Animation | Grep for `targets: turret` without `.sprite` — all must reference `.sprite` or use helper methods |
| Circle+twen pseudo-particles at scale | Particle Effects | Profile with 10 simultaneous bug deaths — no frame drops, no circle objects in display list |
| Orphaned tweens on pooled bugs | Procedural Bug Animation | Kill 30 bugs in debug mode, respawn them, verify scale/alpha/rotation reset to 1 |
| Per-event emitter creation | Particle Effects | Check `scene.displayList.length` during wave 8-10 combat — should stay stable, not grow per kill |
| Screen shake + UIScene camera boundary | Screen Shake | Playtest with shake active — HUD must not jitter, damage numbers (if on GameScene) will shake (acceptable for world-space) |
| Incremental theme creates mixed palette | Cosmic Nebula Theme | Verify all 40+ color values use THEME references before changing any THEME values |
| WebAudio node saturation | Ethereal Audio | Play wave 10 with all turrets firing + ambient audio — all SFX must be audible, check `sound.getAllPlaying().length` stays under 16 |
| Slowfield emitter not cleaned up | Particle Effects | Sell a slowfield turret — no orphaned emitter rendering at its former position |
| BootScene fallbacks wrong palette | Cosmic Nebula Theme | Delete asset files temporarily, verify fallback textures use cosmic colors not magenta |
| GameOverScene wrong palette | Cosmic Nebula Theme | Win and lose the game, verify both screens use cosmic colors |

## Sources

- Phaser 3 official API documentation (docs.phaser.io) — ParticleEmitter, Camera shake, TweenManager, SoundManager
- Phaser 3 v3.60 migration notes — ParticleEmitterManager removed, `this.add.particles()` returns emitter directly
- Codebase analysis: GameScene.js (showBugDeathEffect line 325), Bug.js (despawn line 168), Turret.js (composite pattern), BuildSystem.js (hardcoded UI colors)
- CONCERNS.md — hardcoded colors, potential memory leaks, O(n²) targeting, fixed pool sizes
- AGENTS.md — "Turret is composite, NOT a Sprite. Tween `turret.sprite`, never the Turret instance itself."
- Phaser community patterns: persistent emitters vs per-event creation, scrollFactor for HUD overlays, WebAudio node limits in Chrome/Firefox

---
*Pitfalls research for: Phaser 3 tower defense polish & cosmic aesthetic*
*Researched: 2026-04-15*
