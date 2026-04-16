# Stack Research

**Domain:** Phaser 3 tower defense — visual polish, procedural animation, particle effects, screen shake, cosmic nebula aesthetic, ethereal audio atmosphere
**Researched:** 2026-04-15
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Phaser 3 | 3.90.0 (already installed via `^3.80.0`) | Game engine — all visual effects, particles, tweens, audio | Phaser 3.60+ introduced the FX Pipeline system with 14 built-in post-processing effects (Bloom, Glow, Vignette, Blur, ColorMatrix, Gradient, Shadow, Shine, Circle, Displacement, Wipe, Pixelate, Barrel, Bokeh). 3.80+ added stable particle emitter improvements. 3.85+ added `ParticleEmitter.updateConfig()` for dynamic runtime reconfiguration of particle effects. 3.90 includes bug fixes for particle color arrays and tween persistence. No external libraries needed — everything is built in. |
| Vite | 5.4.21 (already installed via `^5.4.0`) | Build tooling and dev server | Already configured with Phaser manual chunk splitting. No changes needed for this milestone. |
| JavaScript ES Modules | — | Language | Project constraint: no TypeScript conversion. ES modules with `.js` extensions required by AGENTS.md. |

### Built-In Phaser Systems (No New Dependencies)

These are the specific Phaser 3 subsystems that power each polish feature. **No npm installs required.**

| Phaser System | Feature It Powers | Key API | Notes |
|---------------|-------------------|---------|-------|
| **FX Pipeline** (WebGL only) | Cosmic glow, bloom, vignette on cameras and game objects | `sprite.postFX.addGlow()`, `sprite.postFX.addBloom()`, `camera.postFX.addVignette()`, `sprite.preFX.addBloom()` | WebGL-only. `Phaser.AUTO` renderer (current config) will use WebGL on 99%+ browsers. Must guard for Canvas fallback — effects silently skip. Use `preFX` for sprite-level effects (bloom/glow on individual turrets/bugs), `postFX` for camera-level effects (vignette/bloom on entire view). |
| **Particle Emitter** | Bug death bursts, muzzle flashes, slowfield aura, build sparkle, nebula dust | `this.add.particles()`, `emitter.explode(count, x, y)`, `emitter.flow(freq, count)`, `emitter.setParticleTint()`, `emitter.setParticleScale()` | Use `explode()` for one-shot effects (death bursts, muzzle flashes, build sparkle). Use `flow()` for continuous effects (slowfield aura, nebula dust). 3.85+ `updateConfig()` allows runtime reconfiguration. Particles support per-particle tint, alpha, scale, gravity, acceleration, lifespan. |
| **Camera Shake** | Impact feedback on core damage, turret destruction, boss hits | `this.cameras.main.shake(duration, intensity)` | Trivially built in. Duration in ms, intensity 0–1. Callback receives progress 0→1 each frame. Only moves viewport, not game objects — positions remain unchanged. |
| **Tween System** | Procedural squash/stretch, pulsing, wobble on static sprites | `this.tweens.add()`, `this.tweens.chain()`, yoyo, easing functions | Use `scaleX`/`scaleY` tweens for squash-stretch on bugs. Use `alpha` tweens for pulsing. Use `chain()` for multi-step sequences. Ease functions: `Elastic`, `Bounce`, `Back`, `Sine`, `Cubic` for organic feel. Tween the `sprite` property on Turret composites (per AGENTS.md: "Tween `turret.sprite`, never the Turret instance"). |
| **Blend Modes** | Additive glow on particles, nebula light layers | `sprite.setBlendMode(Phaser.BlendModes.ADD)`, `Phaser.BlendModes.SCREEN` | ADD blend mode creates additive light accumulation — essential for glow/nebula effects. SCREEN blend creates soft light overlap. Causes WebGL batch flush on mode change — minimize distinct blend mode groups. |
| **Graphics Object** | Procedural nebula background generation, gradient fills, glow circles | `graphics.fillGradientStyle()`, `graphics.fillCircle()`, `graphics.generateTexture()` | Use `fillGradientStyle()` for 4-corner gradients (WebGL only). Generate procedural textures via `generateTexture()` for reuse as sprites. Better performance than redrawing Graphics every frame. Bake once, use as texture. |
| **TileSprite** | Scrolling/moving nebula background layer | `this.add.tileSprite()`, `tileSprite.tilePositionX/Y` | For parallax or slow-scrolling nebula texture. Auto-wraps. Never create larger than canvas (1920x1080) — use `tilePosition` for scrolling. |
| **RenderTexture** | Compositing multiple nebula layers into single background | `this.add.renderTexture()`, `rt.draw()`, `rt.erase()` | Draw multiple particle/Graphics layers onto a single RenderTexture, then use as background. Reduces draw calls for complex procedural backgrounds. |
| **WebAudio System** | Ethereal BGM with detune, ambient layering, spatial positioning | `this.sound.play()`, `sound.setDetune()`, `sound.setRate()`, `sound.setVolume()`, `this.sound.setListenerPosition()` | Detune shifts pitch (±1200 cents) — use for ethereal/cosmic audio shifts. Rate changes playback speed. Loop for ambient layers. Spatial audio via `setListenerPosition()` if needed. |

### Supporting Libraries (Dev-Only, Not Runtime)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **jsfxr** | (web tool, no install) | Procedural SFX generation — cosmic/crystalline sound effects | Use https://jsfxr.me or the `sfxr` npm package to generate replacement SFX that match the cosmic theme. Generate `.wav`/`.ogg` files, add to `assets/audio/`. This is an asset creation tool, not a runtime dependency. |
| **Audacity** | (desktop app) | Editing/layering ambient BGM | If custom ambient audio needs editing beyond simple looping. Not a dependency — just a recommended tool for audio asset creation. |
| **GIMP / Aseprite** | (desktop app) | Creating nebula tile textures, crystalline turret sprites | For static asset art that can't be procedurally generated. Not a dependency — asset creation tools only. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `VITE_DEBUG_KEYS=true npm run dev` | Debug mode with key shortcuts | Already configured. Essential for testing particle effects and screen shake in isolation. |
| `npm run build` | Verify zero warnings | Already configured. Use to validate changes don't break production build. |
| `Phaser Inspector` (browser DevTools) | Runtime state inspection | Optional. Not a dependency — Chrome DevTools + Phaser's built-in `console.log` on game objects is sufficient. |

## Installation

```bash
# No new runtime packages needed!
# Phaser 3.90.0 and Vite 5.4.21 are already installed.

# If starting fresh (not applicable here — project exists):
# npm install phaser@^3.90.0
# npm install -D vite@^5.4.0
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Phaser built-in FX Pipeline | Custom WebGL shaders via `PipelineManager.add()` | Only if you need effects not covered by the 14 built-in FX (Barrel, Bloom, Blur, Bokeh, Circle, ColorMatrix, Displacement, Glow, Gradient, Pixelate, Shadow, Shine, Vignette, Wipe). Custom shaders add significant complexity and maintenance burden. |
| Phaser built-in Particle Emitter | Third-party particle library (e.g., Nebula.js) | Never for this project. Phaser's particle system is fully capable and integrated with the renderer. External particle libraries would fight Phaser's batching and render pipeline. |
| Phaser built-in Tween System | GSAP (GreenSock Animation Platform) | Only if you need GSAP's timeline scrubbing, MotionPathHelper, or complex SVG animation. For game tweens (scale, position, alpha, rotation), Phaser's tween system is more appropriate — zero overhead, integrated with the game loop, no foreign API surface. |
| Phaser built-in WebAudio | Howler.js | Only if you need cross-origin audio without CORS headers or advanced audio sprites. Phaser's WebAudio already provides detune, rate, pan, volume, spatial positioning, looping, markers, and global sound management. Adding Howler would duplicate functionality and create audio context conflicts. |
| `Phaser.AUTO` renderer | `Phaser.WEBGL` (forced) | Use `Phaser.WEBGL` only if you want to guarantee FX Pipeline availability and are willing to break on devices without WebGL. `Phaser.AUTO` is safer — WebGL on 99%+ of browsers, Canvas fallback still plays the game (just without glow/bloom/vignette). The game is already functional without FX; graceful degradation is the right call. |
| Procedural textures (Graphics + `generateTexture()`) | Pre-rendered PNG assets | Use PNGs if procedural generation is too expensive at load time or if the visual result needs precise artistic control. Procedural textures are flexible and zero-download, but they add complexity to BootScene and may look less polished than hand-drawn art for complex shapes. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Phaser 4 | Breaking API changes; different module system; migration required; project explicitly on Phaser 3.80+ | Phaser 3.90.0 — latest stable 3.x with all needed features |
| PixiJS alongside Phaser | Redundant renderer; Phaser already uses its own WebGL pipeline; two renderers would fight for the canvas context | Phaser's built-in rendering pipeline |
| Spritesheet walk animations | Explicitly out of scope per PROJECT.md — procedural animation approach chosen to avoid multi-frame asset creation | Tween-driven scale/alpha/rotation on static sprites |
| Custom fragment shaders for simple glow/bloom | Reinventing what FX Pipeline already provides; harder to maintain; must handle batching yourself | `sprite.postFX.addGlow()`, `sprite.postFX.addBloom()` |
| Canvas2D-only effects | FX Pipeline is WebGL-only; Canvas fallback silently skips effects; don't design effects that break the game without WebGL | Design effects as progressive enhancement — game works without FX, looks stunning with them |
| Heavy particle counts (>500 active particles) | Performance constraint: must maintain 60fps with 60 bugs + 70 bullets on screen. Too many particles will tank frame rate | Keep particle emitters to <100 active particles per emitter, <300 total. Use short lifespans and small counts for burst effects. |
| Real-time Graphics redraw every frame | `Graphics` objects are expensive to re-render under WebGL (decomposed into polygons every frame). Redrawing a full 1920x1080 nebula every frame will kill performance | Bake Graphics to texture via `generateTexture()` once, use as Sprite. For animated nebula, use TileSprite scrolling or particle overlay. |

## Stack Patterns by Variant

**If WebGL is unavailable (Canvas fallback):**
- Game still plays — FX effects silently skip
- Particles still work in Canvas mode (different rendering path but functional)
- Camera shake still works in Canvas mode
- Tweens still work identically
- Audio still works identically
- Only glow/bloom/vignette/blur effects are lost

**If performance drops below 60fps:**
- Reduce active particle count first (most expensive visual feature)
- Remove camera-level postFX (vignette, bloom) — these process every pixel
- Keep sprite-level preFX (they only process that sprite's pixels)
- Reduce particle emitter counts and lifespans
- Simplify blend mode usage (each mode change = batch flush)

**If asset creation bandwidth is limited:**
- Prioritize procedural generation (Graphics → generateTexture) over hand-drawn assets
- Use jsfxr for all SFX — generates cosmic sounds in minutes
- For BGM, use CC0 ambient tracks with Phaser's `setDetune()` and `setRate()` to create ethereal variations from a single source track
- Layer 2–3 loop points at different detune/rate values for a rich ambient soundscape without composing new music

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| phaser@3.90.0 | vite@5.4.21 | Already working in this project. No issues. |
| phaser@3.90.0 FX Pipeline | WebGL renderer only | Must use `Phaser.AUTO` or `Phaser.WEBGL`. Canvas fallback skips FX. |
| phaser@3.85+ ParticleEmitter.updateConfig() | phaser@3.85+ | New API for dynamic particle reconfiguration. Available in installed 3.90.0. |
| phaser@3.60+ FX Pipeline | phaser@3.60+ | 14 built-in FX effects available since 3.60. All present in 3.90.0. |
| phaser@3.90.0 Tween chains | phaser@3.85+ | 3.90 fixes tween persistence bug after `stop()`. Use chains confidently. |
| vite@5.4.x manualChunks | phaser@3.90.0 | Current `vite.config.js` splits Phaser into its own chunk. No changes needed. |

## Sources

- Context7 `/websites/phaser_io` — Phaser particle emitter system, FX pipeline, camera shake, tween system, audio system, blend modes, Graphics, TileSprite (HIGH confidence)
- Context7 `/websites/phaser_io_api-documentation` — API docs for ParticleEmitter, Shake effect, PipelineManager, FX Controller, WebAudioSound (HIGH confidence)
- GitHub `phaserjs/phaser` CHANGELOG.md — Version history, 3.85 and 3.90 changelogs verified (HIGH confidence)
- npm registry — Phaser versions 3.80.0–3.90.0 verified, Vite 5.4.21 latest 5.x (HIGH confidence)
- Project source code — `main.js`, `BootScene.js`, `vite.config.js`, `package.json` inspected for current config (HIGH confidence)

---
*Stack research for: Phaser 3 tower defense polish & cosmic aesthetic*
*Researched: 2026-04-15*
