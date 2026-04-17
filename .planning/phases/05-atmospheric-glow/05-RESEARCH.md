# Phase 5: Atmospheric Glow - Research

**Researched:** 2026-04-17
**Domain:** Phaser 3 WebGL post-processing (preFX.addGlow, postFX.addVignette) with Canvas graceful degradation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Glow Technique (THEME-04)**
- **D-01:** Use per-GameObject `sprite.preFX.addGlow(color, outerStrength, innerStrength)` applied individually to each turret sprite and the core sprite. No camera-level bloom, no custom shader.
- **D-02:** Glow targets are **turrets and core only** — strict THEME-04 scope. Walls, bugs (including boss), bullets, particles do not receive glow.
- **D-03:** Glow color uses per-turret tints constrained to the Void Ethereal palette:
  - Blaster → ghostly white `0xeef2ff`
  - Zapper → light violet `0x9966ff`
  - Slowfield → deep nebula purple `0x6a4c93`
  - Wall → no glow
  - Core → ghostly white `0xeef2ff`
- **D-04:** Upgraded turrets get a different glow color. Base = nebula tint, upgraded = accent white `0xeef2ff`.
- **D-05:** Glow is constant ambient — set once on turret/core construction, never tweened, never reactive to fire/damage events.

**Vignette (THEME-05)**
- **D-06:** Use Phaser 3.80+ `camera.postFX.addVignette(x, y, radius, strength)` on GameScene main camera (and on MainMenu/GameOver per D-14). WebGL only.
- **D-07:** Vignette intensity is subtle (~0.3 strength).
- **D-08:** Vignette color is pure black (Phaser default).
- **D-09:** Vignette is phase-reactive: tweens stronger during wave phase, lighter during build phase. Build = 0.25, wave = 0.40. Killed on scene shutdown.

**Renderer Detection & Canvas Fallback**
- **D-10:** On Canvas runtime, glow is skipped entirely. Log `console.warn('[postfx] Canvas renderer detected — glow disabled')` once at scene boot.
- **D-11:** On Canvas runtime, vignette is skipped entirely as well.
- **D-12:** Renderer detection is an inline check in each scene's `create()`: `const isWebGL = this.game.renderer.type === Phaser.WEBGL;`.

**Config & Scope**
- **D-13:** Glow + vignette tunables live in a new top-level `POSTFX` frozen object in `src/config/GameConfig.js`. Shape given in CONTEXT.md — transition ease `Sine.easeInOut`, transitionDuration 600ms.
- **D-14:** Scene scope is GameScene, MainMenuScene, GameOverScene. UIScene is exempt.

### Claude's Discretion
- Exact `outerStrength` / `innerStrength` numerical tuning for glow (start 2/1, adjust while keeping 60fps budget)
- Exact vignette `radius` value (start 0.5, tune for 7×7 grid framing)
- Easing curve for build↔wave vignette tween (`Sine.easeInOut` is consistent)
- Whether MainMenu/GameOver vignette uses `buildStrength` or its own constant (default to `buildStrength`)
- Cleanup pattern for FX controllers on scene shutdown

### Deferred Ideas (OUT OF SCOPE)
- HP-reactive vignette (red flare at low HP) — rejected for Phase 5; possible v2 POLISH
- Glow on boss / spitter bullets — rejected; strict scope
- Glow flares on fire/damage events — rejected for noise
- Custom WebGL shader pipeline — rejected as overkill
- Phase 7 color migration — stays in Phase 7, NOT pulled into Phase 5
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| THEME-04 | Add post-FX glow/bloom on turrets and core (WebGL only, graceful degradation on Canvas) | §Standard Stack (Phaser 3.90 FX), §Code Examples (Turret/Core glow), §Common Pitfalls (preFX padding), §Validation (Canvas path check) |
| THEME-05 | Add vignette camera effect for atmospheric framing | §Standard Stack (Camera.postFX.addVignette), §Code Examples (Vignette + tween), §Validation (FX cleanup across restarts) |
</phase_requirements>

## Summary

Phase 5 adds two WebGL post-processing effects to an existing Phaser 3 tower-defense game:

1. **Per-sprite glow** on turrets (blaster/zapper/slowfield) and the command core via the Pre FX pipeline (`sprite.preFX.addGlow`).
2. **Cinematic vignette** on the main camera of GameScene, MainMenuScene, and GameOverScene via the Post FX pipeline (`camera.postFX.addVignette`), with a phase-reactive strength tween on GameScene only.

Both must be skipped on the Canvas renderer. The Phaser FX component, supported properties, and required `setPadding()` behavior on small sprites are all verified from the official Phaser 3.90 API documentation. The installed Phaser version (3.90.0) comfortably satisfies the 3.60+ requirement for the FX pipeline APIs. No architectural risk — the entire phase is additive, localized to six files, and respects the existing composite-Turret/scene-camera/event patterns.

**Primary recommendation:** Follow the locked CONTEXT.md decisions verbatim. The only non-obvious implementation detail is `sprite.preFX.setPadding(n)` — REQUIRED on the 64px turret/core sprites or the glow halo will render clipped to the texture bounds. Use Phaser's mutable FX controller properties (`Glow.color`, `Vignette.strength`) for the upgrade color-swap and vignette tween instead of clear/re-add cycles.

## Architectural Responsibility Map

Phaser 3 is a single-tier (Browser/Client) runtime; there is no server or API in scope. Capabilities split by in-engine subsystem ownership:

| Capability | Primary Subsystem | Secondary Subsystem | Rationale |
|------------|-------------------|---------------------|-----------|
| Per-sprite glow halo | Phaser FX (PreFX pipeline on Sprite) | — | PreFX renders before the sprite's frame is composited; correct for per-entity halos tied to sprite lifecycle. |
| Camera vignette frame | Phaser FX (PostFX pipeline on Camera) | — | Camera PostFX applies to the rendered scene output — correct for scene-wide atmospheric framing. |
| Phase-reactive vignette strength | Phaser Tween Manager (scene.tweens) | GameScene event bus (phase-changed) | Tween drives controller's mutable `strength`; scene events already broadcast phase transitions. |
| Renderer detection | Phaser Game (`this.game.renderer.type`) | — | Authoritative, set at Phaser.Game boot; `Phaser.AUTO` chooses WebGL vs Canvas. |
| FX lifecycle cleanup | Scene shutdown event + GameObject.destroy | — | Matches existing Phase 1 D-03 tween-safety and Phase 3/4 emitter cleanup patterns. |
| Glow exempt from UIScene | Scene isolation (UIScene has its own camera) | — | Matches SHAKE-04 Phase 4 D-10 free isolation — only GameScene main camera receives post-FX. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| phaser | ^3.80.0 (installed: 3.90.0) | FX pipelines (preFX.addGlow, postFX.addVignette) | Built-in WebGL FX components since Phaser 3.60; no third-party shader library needed. `[VERIFIED: node_modules/phaser/package.json → 3.90.0]` |

No new dependencies. Phase uses only APIs already exposed by the installed Phaser version.

**Verified version:** `npm view phaser version` not required — `[VERIFIED: /Users/machado/Projects/bug-siege/node_modules/phaser/package.json]` confirms 3.90.0 "Tsugumi" is installed.

### Supporting
None. No helpers, no shader plugins.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `sprite.preFX.addGlow` | Camera-level `postFX.addBloom` | Would amplify ALL rendered pixels (particles, bullets already bright) — double-amplification risk, violates "defenders glow, threats don't" hierarchy. Rejected by D-01. |
| Built-in FX pipeline | Custom `WebGLPipeline` subclass with hand-written GLSL | 10-20× complexity, no gameplay benefit. Rejected by D-01 / Q-01. |
| `sprite.postFX.addGlow` | `sprite.preFX.addGlow` | PostFX uses a separate framebuffer and is more expensive; PreFX is rendered into the sprite's own render target and is cheaper per instance. PreFX is the standard choice for per-entity auras. `[CITED: https://docs.phaser.io/api-documentation/class/fx-glow]` |

**Installation:** None. `phaser@^3.80.0` is already installed (actual: 3.90.0).

## Architecture Patterns

### System Architecture Diagram

```
                          ┌───────────────────────────────────────┐
                          │ Phaser.Game (main.js, Phaser.AUTO)    │
                          │  ├─ renderer.type = WEBGL or CANVAS   │──┐
                          └───────────────────────────────────────┘  │ used for branching
                                                                     │
      ┌──────────────────────────────────────────────────────────────┘
      ▼
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│ MainMenuScene.create()  │   │ GameScene.create()      │   │ GameOverScene.create()  │
│                         │   │                         │   │                         │
│ if (isWebGL)            │   │ if (isWebGL) {          │   │ if (isWebGL)            │
│   cameras.main.postFX   │   │   cameras.main.postFX   │   │   cameras.main.postFX   │
│    .addVignette(...)    │   │    .addVignette(...) ───┼─▶ storeRef───┐               │    .addVignette(...) │
│ else                    │   │   // glow on turrets/core│  │  │               │ else                    │
│   warn('Canvas')        │   │ }                       │  │  │               │   warn('Canvas')        │
│ [static strength 0.25]  │   │ [starts at build 0.25]  │  │  │               │ [static strength 0.25]  │
└─────────────────────────┘   └──────────┬──────────────┘  │  │               └─────────────────────────┘
                                         │                 │  │
                                         ▼                 │  │
                     ┌───────────────────────────────────┐ │  │
                     │ Turret constructor                │ │  │
                     │  if (isWebGL && type !== 'wall')  │ │  │
                     │    sprite.preFX.setPadding(N)     │ │  │
                     │    sprite.preFX.addGlow(          │ │  │
                     │      POSTFX.GLOW[type].base, ...) │ │  │
                     │                                   │ │  │
                     │ Turret.upgrade()                  │ │  │
                     │  glowFX.color = upgraded (mutate) │ │  │
                     │                                   │ │  │
                     │ Turret.destroy()                  │ │  │
                     │  sprite.preFX?.clear()            │ │  │
                     └───────────────────────────────────┘ │  │
                                                           │  │
                     ┌───────────────────────────────────┐ │  │
                     │ GameScene.renderCore()            │◀┘  │
                     │  if (isWebGL)                     │    │
                     │    coreSprite.preFX.setPadding(N) │    │
                     │    coreSprite.preFX.addGlow(      │    │
                     │      POSTFX.GLOW.core.color, ...) │    │
                     └───────────────────────────────────┘    │
                                                              │
                     ┌───────────────────────────────────┐    │
                     │ phase-changed listener (new)      │    │
                     │  tween vignetteFX.strength        │◀───┘
                     │    build: 0.25 | wave: 0.40       │    triggered by
                     │    ease Sine.easeInOut, 600ms     │    existing event
                     │  track as this._vignetteTween     │
                     └───────────────────────────────────┘
                                        │
                                        ▼
                     ┌───────────────────────────────────┐
                     │ shutdown handler (extend existing)│
                     │  this._vignetteTween?.destroy()   │
                     │  cameras.main.postFX.clear()      │
                     └───────────────────────────────────┘

UIScene: NOT modified — separate camera, exempt from all postFX.
```

Data flow: `Phaser.AUTO` boots the renderer, each scene branches on `renderer.type` in `create()`. On WebGL, glow is attached to the turret/core sprite render targets (PreFX pipeline) and the vignette is attached to each scene's main camera (PostFX pipeline). A single GameScene listener subscribes to the existing `phase-changed` event and tweens the vignette controller's mutable `strength` property. On scene shutdown, the tween is destroyed and the camera's postFX controllers are cleared.

### Component Responsibilities

| File | Responsibility in Phase 5 |
|------|---------------------------|
| `src/config/GameConfig.js` | Add frozen `POSTFX` export (GLOW per turret type + VIGNETTE) |
| `src/entities/Turret.js` | Constructor: attach glow (skip wall, skip Canvas); `upgrade()`: mutate glow color to upgraded; `destroy()`: `preFX.clear()` before `sprite.destroy()` |
| `src/scenes/GameScene.js` | `create()`: attach camera vignette + log Canvas warning; `renderCore()`: attach core glow; new `phase-changed` listener: tween `vignetteFX.strength`; shutdown: destroy tween + clear camera postFX |
| `src/scenes/MainMenuScene.js` | `create()`: attach static-strength vignette (WebGL only, warn on Canvas) |
| `src/scenes/GameOverScene.js` | `create()`: attach static-strength vignette (WebGL only, warn on Canvas) |
| `src/scenes/UIScene.js` | **NOT MODIFIED** — isolation per D-14 |
| `src/main.js` | **NOT MODIFIED** — `Phaser.AUTO` stays (do not pin to WEBGL); renderer detection happens at scene create |

### Recommended Project Structure

No directory changes. All work lands in existing files. No new `src/utils/` module (per D-12 — inline check preferred).

### Pattern 1: Glow attach with mandatory padding

**What:** When attaching `preFX.addGlow` to a small sprite, call `setPadding(n)` first so the glow halo has room to render outside the texture bounds.
**When to use:** Every turret sprite (64×64 px) and the core sprite (64×64 px). Padding required whenever `outerStrength > 0`.

```javascript
// Source: https://docs.phaser.io/api-documentation/class/gameobjects-components-fx#setPadding
// Phaser 3.60+: preFX renders into the sprite's render target, which is sized
// to the texture. outerStrength > 0 without padding = clipped square-edged halo.
if (isWebGL && turret.type !== 'wall') {
  const cfg = POSTFX.GLOW[turret.type];
  turret.sprite.preFX.setPadding(10);              // 10px is safe for outerStrength=2
  turret.glowFX = turret.sprite.preFX.addGlow(
    cfg.base,
    cfg.outerStrength,
    cfg.innerStrength
  );
}
```

### Pattern 2: Upgrade color swap via property mutation (preferred over clear+re-add)

**What:** The Phaser `Glow` FX controller exposes `color`, `outerStrength`, `innerStrength` as public mutable properties. Simple assignment swaps the color without reallocating the controller.
**When to use:** `Turret.upgrade()` color change per D-04.

```javascript
// Source: https://docs.phaser.io/api-documentation/class/fx-glow (Public Members section)
// Verified: Glow.color, Glow.outerStrength, Glow.innerStrength are public mutable fields since 3.60.
upgrade() {
  // ...existing upgrade logic...
  if (this.glowFX) {
    this.glowFX.color = POSTFX.GLOW[this.type].upgraded;
  }
}
```

UI-SPEC.md suggests `preFX.clear(); preFX.addGlow(upgradedColor, ...)` as an alternative. Both work; the mutation pattern is simpler (no allocation, no re-register), preserves the stored handle, and is the recommended pattern for Phaser FX controllers. Either is acceptable — planner's call.

### Pattern 3: Vignette tween on controller's mutable `strength`

**What:** `Vignette` FX controller's `strength` is a public mutable float. Tween it directly — no need for a proxy object or custom update callback.
**When to use:** `phase-changed` listener in GameScene.

```javascript
// Source: https://docs.phaser.io/api-documentation/class/renderer-webgl-pipelines-fx-vignettefxpipeline
// Verified: Vignette public members include `strength` (since 3.60).
if (this._vignetteFX) {
  if (this._vignetteTween) this._vignetteTween.destroy();
  this._vignetteTween = this.tweens.add({
    targets: this._vignetteFX,
    strength: payload.phase === 'wave'
      ? POSTFX.VIGNETTE.waveStrength
      : POSTFX.VIGNETTE.buildStrength,
    duration: POSTFX.VIGNETTE.transitionDuration,
    ease: POSTFX.VIGNETTE.transitionEase,
  });
}
```

### Pattern 4: Inline renderer branch (matches existing `DEBUG.enableDebugKeys` pattern)

**What:** Per D-12, `const isWebGL = this.game.renderer.type === Phaser.WEBGL;` at the top of each FX-enabled scene's `create()`. No utility module.
**When to use:** GameScene.create(), MainMenuScene.create(), GameOverScene.create(). Turret constructor receives the isWebGL flag from the scene it's constructed in (either read from `scene.game.renderer.type` at construction or stash on scene at create time).

```javascript
create() {
  const isWebGL = this.game.renderer.type === Phaser.WEBGL;
  if (!isWebGL) {
    console.warn('[postfx] Canvas renderer detected — glow disabled');
  }
  // ...rest of create()...
}
```

### Anti-Patterns to Avoid
- **Attaching glow without setPadding on 64px sprites:** halo will clip to texture bounds and render as a square.
- **Pinning `Phaser.WEBGL` in main.js:** eliminates the Canvas fallback path entirely, violating THEME-04's "graceful degradation on Canvas" requirement.
- **Applying postFX to UIScene camera:** HUD text becomes vignetted and unreadable; violates D-14 and the SHAKE-04 isolation pattern.
- **Tweening `sprite.alpha` thinking it bypasses the glow:** PreFX renders into the sprite's own render target, so alpha tweens affect the glow too. This is DESIRED here (idle pulse reads as "breathing glow") but don't assume the glow is independent of alpha.
- **Using `setTint`/`setTintFill` expecting glow to follow tint:** glow color is set on the FX controller, not the sprite. The Phase 4 `0xffdd44` upgrade tint and the damage-flash `0xff4444` tint will layer on top of the underlying glow color (this is visually fine, but don't expect flashDamage to flash the glow red — it won't).
- **Calling `addGlow` twice without `clear()`:** stacks two glow controllers on the same sprite. Double cost, unpredictable blend. The upgrade path either mutates existing or clears first.
- **Calling `this.cameras.main.postFX.clear()` in shutdown if camera is already destroyed:** use optional chaining. The existing shutdown handler runs before camera teardown, so this is safe in practice but defensive code is cheap.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sprite halo/bloom | Radial gradient Graphics overlay per entity | `sprite.preFX.addGlow` | Graphics overlays don't z-sort cleanly with sprites, don't update with position, cost more per-frame. PreFX is batched by the WebGL pipeline. |
| Screen vignette | Fullscreen alpha-gradient Image over the scene | `camera.postFX.addVignette` | Image overlay would sit in the same layer as UIScene — either covers HUD or is covered by it. PostFX runs after the scene renders and before the camera composite. |
| Canvas fallback halo texture | Generate radial-gradient PNG in BootScene for each glow color | None — skip glow on Canvas per D-10/D-11 | Zero-cost skip is the contract. Fallback textures would add boot time and cannot match the per-sprite-position halo quality. |
| Glow-color interpolation during upgrade | Manual per-frame RGB lerp in update() | Not needed — D-05 says constant ambient | The upgrade is instant (D-04 mentions palette swap), no interpolation required. Phase 4's existing particle and tint effects already signal the transition. |
| Phase-reactive intensity curve | Custom easing function | Phaser built-in `Sine.easeInOut` | Consistent with Phase 2/3 tweens; already verified. |

**Key insight:** The Phaser FX pipeline is the entire toolkit for this phase. There is no custom rendering logic to write.

## Runtime State Inventory

Not applicable — Phase 5 is a greenfield additive visual phase. No renames, no string migrations, no refactors, no existing data to migrate.

- **Stored data:** None — no persistent state touched.
- **Live service config:** None — no external services.
- **OS-registered state:** None.
- **Secrets/env vars:** None — `VITE_DEBUG_KEYS` is unrelated.
- **Build artifacts:** None — new code is additive; Vite rebuild handles everything.

## Common Pitfalls

### Pitfall 1: PreFX halo clipping on small sprites (CRITICAL)
**What goes wrong:** `sprite.preFX.addGlow(color, 2, 1)` on a 64×64 turret sprite renders a glow that is clipped to the 64×64 texture bounds — you get a square-edged halo instead of a soft round one.
**Why it happens:** PreFX renders into the sprite's own render target, which is sized to the texture. `outerStrength > 0` requires pixels outside the texture bounds, but the render target doesn't include them unless you call `setPadding(n)` first. `[CITED: https://docs.phaser.io/api-documentation/class/gameobjects-components-fx#setPadding]`
**How to avoid:** Call `sprite.preFX.setPadding(10)` (or `8`) immediately before `preFX.addGlow(...)`. Padding should be roughly `outerStrength * 4` in pixels — for `outerStrength=2` start at `8–10`, for `outerStrength=3` (core) start at `12–14`. This is WebGL-only, so gate it by the same `isWebGL` check.
**Warning signs:** Glow looks rectangular, has visible hard edges at the sprite's corners, or appears to "fit inside" the sprite rather than extending beyond it.

### Pitfall 2: Turret is not a Sprite — don't apply FX to `this`
**What goes wrong:** `turret.preFX.addGlow(...)` throws `TypeError: Cannot read properties of undefined (reading 'addGlow')` — the composite `Turret` class has no `preFX` property.
**Why it happens:** Turret wraps a sprite. FX attach points are on `this.sprite.preFX`, not `this.preFX`.
**How to avoid:** Always `this.sprite.preFX.addGlow(...)` in Turret methods.
**Warning signs:** Runtime error on first turret placement.

### Pitfall 3: Canvas path silent leak (forgot to guard one attach site)
**What goes wrong:** Canvas runtime crashes with `TypeError: Cannot read properties of null (reading 'setPadding')` — one attach site was missing the `isWebGL` guard.
**Why it happens:** Phaser sets `sprite.preFX = null` on Canvas rendering (FX is WebGL-only per `[CITED: https://docs.phaser.io/api-documentation/namespace/gameobjects-components-postpipeline]`). Six attach sites × three scenes × forgot one = broken.
**How to avoid:** Centralize the guard pattern. Every scene's `create()` computes `isWebGL` at the top; Turret constructor reads `scene.game.renderer.type === Phaser.WEBGL` at attach time; all six attach points branch on the same condition. Consider a small helper inside Turret.js (local function, not a util module) to encapsulate "attach-if-webgl-and-not-wall" to DRY it.
**Warning signs:** Phaser boot completes, first scene renders, first turret placement throws.

### Pitfall 4: Vignette tween leaks across scene restarts
**What goes wrong:** After playing Game → GameOver → Restart a few times, the GameScene camera has accumulated multiple vignette controllers, or a dead tween targets a destroyed controller.
**Why it happens:** Tweens registered on the scene's tween manager are garbage-collected with the scene, BUT a tween referencing an FX controller that was torn down elsewhere may still tick for one frame before realizing. Camera postFX controllers are owned by the camera — scene restart creates a new camera so they don't leak per se, but accumulated controllers on reused cameras do.
**How to avoid:** Follow the Phase 1 D-03 tween-safety pattern — explicitly `this._vignetteTween?.destroy()` in the shutdown handler, and `this.cameras.main.postFX.clear()` to guarantee idempotency on restart.
**Warning signs:** Inspect `this.cameras.main.postFX.list.length` in devtools after several Game→GameOver cycles. Should be 1 consistently. If it grows, clear isn't running.

### Pitfall 5: Idle alpha pulse + glow interaction misread as a bug
**What goes wrong:** Planner or verifier sees the glow visibly breathe and flags it as violating D-05 ("glow is constant ambient, never tweened").
**Why it happens:** PreFX renders into the sprite's render target, which is then alpha-blended during composite. The existing Phase 2 idle tween animates `sprite.alpha` between 0.75 and 1.0 (Turret.js:59-66). Glow brightness visibly tracks the alpha — this is correct behavior and aesthetically desirable (reinforces "aliveness") but looks like a contradiction to D-05.
**How to avoid:** D-05 constrains the glow CONFIG (outerStrength/innerStrength never animated via tween). The sprite alpha modulation of the rendered halo is a separate concern and is expected. Document this in the PLAN's acceptance criteria so the verifier doesn't flag it.
**Warning signs:** Verifier raises "glow animates, should be constant."

### Pitfall 6: Core glow not visible under the breathing scale tween
**What goes wrong:** The core's breathing scale (Phase 2) scales the sprite by 1.06 — the glow scales with it, looking slightly weaker at max scale because padding doesn't scale.
**Why it happens:** Padding is pre-render; scale is applied during render transform. The padded render target is fixed-size but the final quad is drawn scaled, so the halo density per visible pixel decreases slightly at max scale.
**How to avoid:** Set core padding slightly higher than turret padding (12–14 for outerStrength=3) to give extra headroom. Tuned during execution (discretion).
**Warning signs:** Core glow appears to pulsate in visual weight with the breathing tween (minor; may be desirable).

### Pitfall 7: Accidental postFX on UIScene
**What goes wrong:** A well-intentioned "apply vignette to all scenes" refactor adds vignette to UIScene.create(), vignetting the HUD text and making credits/HP labels harder to read.
**Why it happens:** D-14 allows glow/vignette in GameScene/MainMenuScene/GameOverScene but explicitly EXCLUDES UIScene. Easy to miss.
**How to avoid:** UIScene is NEVER modified in this phase. Plan-check should verify the UIScene.js diff is empty.
**Warning signs:** HUD edges visibly darken during wave phase; credits/HP text becomes hard to read at extreme screen edges.

## Code Examples

### Example 1: Turret glow attach (constructor)

```javascript
// Source: https://docs.phaser.io/api-documentation/class/fx-glow
// In Turret constructor, after `this.sprite = scene.add.sprite(...)`
const isWebGL = scene.game.renderer.type === Phaser.WEBGL;

if (isWebGL && type !== 'wall') {
  const cfg = POSTFX.GLOW[type];
  this.sprite.preFX.setPadding(10);                       // prevent halo clipping
  this.glowFX = this.sprite.preFX.addGlow(
    cfg.base,
    cfg.outerStrength,
    cfg.innerStrength,
  );
}
```

### Example 2: Turret upgrade color swap

```javascript
// Source: https://docs.phaser.io/api-documentation/class/fx-glow (Public Members)
// Phaser 3.60+: Glow.color is a public mutable number property.
upgrade() {
  // ...existing upgrade logic...
  if (this.glowFX) {
    this.glowFX.color = POSTFX.GLOW[this.type].upgraded;
  }
}
```

### Example 3: Turret destroy cleanup

```javascript
// Source: https://docs.phaser.io/api-documentation/class/gameobjects-components-fx
// preFX.clear() destroys and removes all PreFX controllers and disables the component.
destroy() {
  if (this.sprite && this.sprite.preFX) {
    this.sprite.preFX.clear();
  }
  // ...existing destroy logic (this.sprite.destroy(), etc.)...
}
```

### Example 4: GameScene vignette attach + phase-reactive tween

```javascript
// Source: https://docs.phaser.io/api-documentation/class/gameobjects-components-fx#addVignette
// In GameScene.create(), after `this.scene.launch('UIScene')`:
const isWebGL = this.game.renderer.type === Phaser.WEBGL;
if (!isWebGL) {
  console.warn('[postfx] Canvas renderer detected — glow disabled');
} else {
  const v = POSTFX.VIGNETTE;
  this._vignetteFX = this.cameras.main.postFX.addVignette(v.x, v.y, v.radius, v.buildStrength);
}

// Register phase listener (after existing event listeners)
this.events.on('phase-changed', (payload) => {
  if (!this._vignetteFX) return;
  if (this._vignetteTween) this._vignetteTween.destroy();
  const target = payload.phase === 'wave'
    ? POSTFX.VIGNETTE.waveStrength
    : POSTFX.VIGNETTE.buildStrength;
  this._vignetteTween = this.tweens.add({
    targets: this._vignetteFX,
    strength: target,
    duration: POSTFX.VIGNETTE.transitionDuration,
    ease: POSTFX.VIGNETTE.transitionEase,
  });
});

// Extend existing shutdown handler (lines 92–99):
this.events.once('shutdown', () => {
  // ...existing shutdown cleanup...
  if (this._vignetteTween) { this._vignetteTween.destroy(); this._vignetteTween = null; }
  if (this.cameras.main && this.cameras.main.postFX) {
    this.cameras.main.postFX.clear();
  }
});
```

### Example 5: Core glow attach (renderCore)

```javascript
// Source: same as Example 1
// In GameScene.renderCore(), after the existing breathing tween setup:
const isWebGL = this.game.renderer.type === Phaser.WEBGL;
if (isWebGL) {
  const cfg = POSTFX.GLOW.core;
  this.coreSprite.preFX.setPadding(12);                   // core is slightly larger glow
  this._coreGlowFX = this.coreSprite.preFX.addGlow(
    cfg.color,
    cfg.outerStrength,
    cfg.innerStrength,
  );
}
```

### Example 6: Static vignette in MainMenu / GameOver

```javascript
// Source: same as Example 4
// In MainMenuScene.create() / GameOverScene.create():
const isWebGL = this.game.renderer.type === Phaser.WEBGL;
if (!isWebGL) {
  console.warn('[postfx] Canvas renderer detected — vignette disabled');
} else {
  const v = POSTFX.VIGNETTE;
  this.cameras.main.postFX.addVignette(v.x, v.y, v.radius, v.buildStrength);
}
// No tween, no listener, no handle stored — scene teardown disposes the camera.
```

### Example 7: POSTFX config shape (GameConfig.js addition)

```javascript
// Add alongside THEME and VFX. Numeric hex (0x...) per preFX.addGlow signature.
export const POSTFX = Object.freeze({
  GLOW: Object.freeze({
    blaster:   Object.freeze({ base: 0xeef2ff, upgraded: 0xeef2ff, outerStrength: 2, innerStrength: 1, padding: 10 }),
    zapper:    Object.freeze({ base: 0x9966ff, upgraded: 0xeef2ff, outerStrength: 2, innerStrength: 1, padding: 10 }),
    slowfield: Object.freeze({ base: 0x6a4c93, upgraded: 0xeef2ff, outerStrength: 2, innerStrength: 1, padding: 10 }),
    core:      Object.freeze({ color: 0xeef2ff,                    outerStrength: 3, innerStrength: 1, padding: 12 }),
  }),
  VIGNETTE: Object.freeze({
    x: 0.5,
    y: 0.5,
    radius: 0.5,
    buildStrength: 0.25,
    waveStrength: 0.40,
    transitionDuration: 600,
    transitionEase: 'Sine.easeInOut',
  }),
});
```

Note: D-13's config shape is augmented here with `padding` per turret/core to keep all tuning in one place. Planner may fold padding into GLOW entries as shown, or keep it inlined at the attach site — both are consistent with project conventions (e.g. VFX.SHAKE mixes per-tier values).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phaser 3 custom pipelines (WebGLPipeline subclass with GLSL shader) | Built-in `preFX`/`postFX` component with 9 built-in effects (Glow, Bloom, Vignette, Bokeh, Blur, etc.) | Phaser 3.60.0 (2023) | No shader authoring required; one-line attach via `sprite.preFX.addGlow(...)`. `[CITED: https://docs.phaser.io/api-documentation/class/fx-glow]` "Since: 3.60.0" |
| Graphics/Image radial-gradient halos composited over sprites | `sprite.preFX.addGlow` with `setPadding` | 3.60.0 | Zero per-frame Graphics.redraw cost; scales with the sprite naturally. |
| PostFX-only effect pipeline | PreFX pipeline added (renders before composite) | 3.60.0 | PreFX is cheaper and scoped per-Sprite; PostFX reserved for camera-wide effects. `[CITED: PostPipeline Component Overview — preFX added 3.60.0]` |

**Deprecated/outdated:**
- Nothing relevant to this phase. The FX pipeline is stable in 3.60–3.90.

## Project Constraints (from CLAUDE.md)

CLAUDE.md is present at `/Users/machado/Projects/bug-siege/CLAUDE.md`. Directives relevant to Phase 5:

- **ES modules with explicit `.js` extensions in all imports** — any new import in GameConfig/Turret/scenes must include `.js`.
- **Config constants are UPPER_CASE objects** — `POSTFX` matches this (per D-13).
- **Frozen configs** — every nested object in POSTFX must be `Object.freeze()`-wrapped (shown in Example 7).
- **Classes: PascalCase, Methods: camelCase** — not directly relevant (no new classes).
- **Entities that need physics extend `Phaser.Physics.Arcade.Sprite`; everything else is a plain class** — not relevant (Turret is already composite; FX does not change class topology).
- **UI positioned with absolute pixel coordinates (not responsive)** — vignette uses normalized `x/y/radius` (0–1), consistent with Phaser's FX API; no responsive work needed.
- **No test framework or linter configured** — validation is manual + `npm run build` (matches the Validation Architecture below).
- **Cross-scene communication uses Phaser's event system** — phase-changed event already exists, listener is added in GameScene.
- **Event-driven state sync** — vignette tween reuses the existing `phase-changed` event; no new events introduced.

CLAUDE.md additionally mentions "No comments" (global user instructions). Any code written in the plan should skip explanatory comments unless logic is genuinely complex.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite dev/build | ✓ | v24.14.1 | — |
| npm | Phaser install | ✓ | 11.11.0 | — |
| phaser | FX pipelines (addGlow/addVignette) | ✓ | 3.90.0 (installed; ^3.80.0 declared) | — |
| vite | Build/bundle | ✓ | ^5.4.0 | — |
| WebGL-capable browser | Actual FX rendering at runtime | n/a (user browser) | — | Phaser automatically falls back to Canvas via `Phaser.AUTO`; Phase 5 contract handles this (D-10/D-11). |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** Canvas-renderer runtime — intentional per D-10/D-11; the phase is specifically designed to skip FX on Canvas.

`[VERIFIED: command -v node && node --version → v24.14.1, npm --version → 11.11.0, node_modules/phaser/package.json → 3.90.0]`

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed. Project is manual-QA per AGENTS.md / CLAUDE.md ("No test framework or linter is configured yet"). |
| Config file | none |
| Quick run command | `npm run build` (type/syntax smoke — fails on import errors, bad config) |
| Full suite command | `npm run build && npm run preview` (preview lets tester click-through the game) |
| Phase gate | `npm run build` green + manual QA checklist below |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| THEME-04 | Turrets + core glow softly on WebGL | visual-manual | `npm run build` smoke only | n/a |
| THEME-04 | Glow skipped + warning on Canvas renderer | smoke-manual (force Canvas in main.js locally, verify console.warn) | `npm run build` | n/a |
| THEME-04 | Upgraded turret glow color swap | visual-manual | n/a | n/a |
| THEME-04 | No glow on walls/bugs/bullets/particles | visual-manual | n/a | n/a |
| THEME-05 | Vignette visible on GameScene/MainMenu/GameOver | visual-manual | n/a | n/a |
| THEME-05 | Vignette strength tweens on phase-changed (GameScene only) | visual-manual + devtools | n/a | n/a |
| THEME-05 | UIScene unaffected (HUD readable, no vignette) | visual-manual | n/a | n/a |
| — | 60fps with wave 10 (25 turrets + 60 bugs + boss) | perf-manual (browser perf panel) | n/a | n/a |
| — | No FX leak across Game→GameOver→Restart cycles | smoke-manual (devtools inspection) | n/a | n/a |

Since the project has no test framework, validation is observational. Spell out the manual gates:

**Automated gates (runnable):**
1. `npm run build` — must complete with 0 errors. Catches import/config syntax bugs, frozen-object mutation attempts, and typos in the POSTFX shape.

**Grepable log lines (observable):**
- `[postfx] Canvas renderer detected — glow disabled` — emitted once per postFX-enabled scene on Canvas. On WebGL, zero occurrences.

**Manual visual QA checklist:**
- [ ] **SC-1 WebGL glow:** Load game on Chrome/Firefox (WebGL default). Each of 3 turret types (blaster, zapper, slowfield) placed on the grid shows a soft halo in the configured color (white / violet / deep purple). Walls show NO halo. Core shows a white halo. No bugs, bullets, or particles show a halo.
- [ ] **SC-1 upgrade swap:** Upgrade a zapper or slowfield turret (buy upgrade in menu). Halo color shifts from nebula tint to accent white. No other visual disruption (upgrade tint `0xffdd44` still layers on top — expected).
- [ ] **SC-1 Canvas fallback:** Temporarily change `main.js` line 10 from `Phaser.AUTO` to `Phaser.CANVAS`, reload. Console shows exactly one `[postfx]` warning per scene entered (3 scenes × 1 boot each = 3 warnings per full Game→GameOver→MainMenu cycle). Game is playable. No glow halos visible. No errors. Revert `main.js` after test.
- [ ] **SC-2 vignette framing:** Main menu, wave phase, build phase, and game-over screen all show a subtle darkening at the screen edges. Corners are visibly dimmer than center. Effect is "felt not seen" — if it's obviously noticeable, reduce strength.
- [ ] **SC-2 phase tween:** Watch a full build→wave→build cycle in GameScene. At each transition, the vignette strength shifts smoothly (600ms Sine.easeInOut). Wave phase should feel slightly more framed than build phase.
- [ ] **SC-2 UIScene unaffected:** During wave phase, HUD text (credits, HP bar, wave number in top corners and bottom center) is sharp and unvignetted. No darkening around the HUD text itself.
- [ ] **Performance:** Start wave 10 in Chrome. Open Performance tab. Record 10 seconds with all bugs active including boss. Frame rate stays ≥55fps (target 60fps). No dropped frames from FX.

**Devtools lifecycle inspection (FX leak check):**
In a dev session, open console and run:
```js
// In GameScene active: should be 1 after create, stable across phases
game.scene.getScene('Game').cameras.main.postFX.list.length
// After Game→GameOver→MainMenu→Game cycle (repeat 3x), the fresh GameScene should still show 1
```
If `.list.length` grows with each cycle, the shutdown cleanup isn't running — investigate shutdown handler. `[VERIFIED: https://docs.phaser.io/api-documentation/class/gameobjects-components-fx — "list: Array.<Phaser.FX.Controller>" is a public property of the FX component]`

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build` + manual visual QA checklist items for the specific requirement(s) affected
- **Phase gate:** Full manual QA checklist + performance smoke + Canvas fallback smoke + FX leak inspection

### Wave 0 Gaps
None — no test framework to bootstrap, and CLAUDE.md explicitly disclaims automated testing. `npm run build` is the existing automated gate.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Padding value `10` for turret sprites with `outerStrength=2` is sufficient to avoid halo clipping | Code Examples, Pattern 1 | Glow halos appear slightly clipped at corners; easy fix by bumping padding to 12–16. Tune during execution — no re-plan needed. |
| A2 | Padding value `12` for core sprite with `outerStrength=3` and breathing-scale tween is sufficient | Code Example 5 | Same as A1; tune during execution. |
| A3 | `Sine.easeInOut` is the right easing for the phase-reactive vignette tween (matches existing Phase 2/3/4 tweens) | Pattern 3 | User can retune — easing is in POSTFX.VIGNETTE.transitionEase so swapping is a one-line config change. |
| A4 | MainMenu/GameOver static vignette uses `POSTFX.VIGNETTE.buildStrength` (0.25) | Pattern 4, Example 6 | D-14 / CONTEXT Claude's Discretion explicitly allows "default to buildStrength for consistency." If aesthetic prefers a different constant, trivial config addition. |
| A5 | Tweening `vignetteFX.strength` directly via `scene.tweens.add({ targets: vignetteFX, strength: ... })` works | Pattern 3, Example 4 | If Phaser's tween engine rejects the FX controller as a target (e.g. wraps it in a Proxy that breaks tween property access), fall back to a `{ val }` proxy object with `onUpdate: (_, t) => vignetteFX.strength = t.val`. `Vignette.strength` is confirmed a plain public number property in docs [CITED], so this is very likely to work. |
| A6 | `cameras.main.postFX.list.length` is readable in devtools for leak inspection | Validation | `list` is documented as a public array on the FX component `[VERIFIED via ctx7]` but was verified for GameObject FX components; the Camera's FX component inherits from the same PostPipeline mixin so the property should exist. If it doesn't, fall back to counting `cameras.main.postPipelines.length`. |
| A7 | `this.game.renderer.type === Phaser.WEBGL` works at `create()` time in all three scenes | Pattern 4 | Phaser.AUTO resolves the renderer at Game boot, well before any Scene.create(). This is an authoritative check. Extremely low risk. |
| A8 | `preFX` is `null` (not undefined) on Canvas renderer for Sprites | Pitfall 3 | Docs state "All FX are WebGL only with no Canvas counterparts." Exact null/undefined behavior isn't explicitly documented but both cases are handled by optional chaining + the `isWebGL` guard, so the distinction doesn't matter for correctness. |

## Open Questions

1. **Exact tuning values for `outerStrength`, `innerStrength`, and `radius`**
   - What we know: Starting values are committed (2/1 for turrets, 3/1 for core, radius 0.5) and CONTEXT explicitly flags them for execution-time tuning.
   - What's unclear: The aesthetic sweet spot between "subtle polish" and "obvious effect" without crossing the line to "distracting" — only visible on a real render.
   - Recommendation: Plan a ~15-minute visual tuning micro-task at the end of the execution sequence, NOT before implementation. Numbers can be iterated on without re-planning. Keep them in `POSTFX` so tuning is a one-line edit.

2. **Should the MainMenu/GameOver vignette use a static strength different from `buildStrength`?**
   - What we know: CONTEXT's Claude's Discretion lists this as a choice (`buildStrength` recommended for consistency).
   - What's unclear: Whether game-over specifically would benefit from a heavier (cinematic-defeat) vignette.
   - Recommendation: Ship with `buildStrength` for both — consistent, simple, lowest-noise. If playtest reveals game-over feels flat, add a `POSTFX.VIGNETTE.gameOverStrength` later (one line).

## Sources

### Primary (HIGH confidence)
- `/websites/phaser_io_api-documentation` via Context7 CLI (ctx7)
  - `preFX.addGlow` / `postFX.addGlow` signature — `[VERIFIED: https://docs.phaser.io/api-documentation/class/gameobjects-components-fx]` and `[VERIFIED: https://docs.phaser.io/api-documentation/class/fx-glow]`
  - `Glow` controller public members (`color`, `outerStrength`, `innerStrength`, `knockout`) — `[VERIFIED: https://docs.phaser.io/api-documentation/class/fx-glow#public-members]`
  - `postFX.addVignette(x, y, radius, strength)` signature — `[VERIFIED: https://docs.phaser.io/api-documentation/class/gameobjects-components-fx#addVignette]`
  - `VignetteFXPipeline` public members (`x`, `y`, `radius`, `strength`) — `[VERIFIED: https://docs.phaser.io/api-documentation/class/renderer-webgl-pipelines-fx-vignettefxpipeline]`
  - `setPadding([padding])` requirement and WebGL-only note — `[VERIFIED: https://docs.phaser.io/api-documentation/class/gameobjects-components-fx#setPadding]`
  - `preFX` / `postFX` WebGL-only + supported GameObjects (Image, Sprite, TileSprite, Text, RenderTexture, Video) — `[VERIFIED: https://docs.phaser.io/api-documentation/namespace/gameobjects-components-postpipeline]`
  - `Camera` inherits PostPipeline mixin (postFX + preFX properties) — `[VERIFIED: https://docs.phaser.io/api-documentation/class/cameras-scene2d-camera]`
  - `Phaser.AUTO` / `Phaser.WEBGL` / `Phaser.CANVAS` renderer constants — `[VERIFIED: https://docs.phaser.io/api-documentation/constant/phaser]`
  - `this.game.renderer` is either `WebGLRenderer` or `CanvasRenderer` (reference property on Scene) — `[VERIFIED: https://docs.phaser.io/api-documentation/class/scene]`
- Installed Phaser version — `[VERIFIED: /Users/machado/Projects/bug-siege/node_modules/phaser/package.json → 3.90.0]`
- Existing codebase integration points — `[VERIFIED: grepped — no prior preFX/postFX usage anywhere in src/]`

### Secondary (MEDIUM confidence)
None needed — Phaser official API docs cover all questions definitively.

### Tertiary (LOW confidence)
None. No WebSearch was required for this phase.

## Metadata

**Confidence breakdown:**
- Standard stack (Phaser 3.90 FX APIs): HIGH — verified via Context7 against Phaser 3.90 official docs; installed version confirmed.
- Architecture (integration points): HIGH — all attach sites identified by line number in code, no ambiguity.
- Pitfalls (especially padding): HIGH — padding behavior explicitly documented in Phaser docs; other pitfalls logically derived from the composite Turret class and existing phase patterns.
- Validation: MEDIUM — necessarily manual because no test framework; automation limited to `npm run build`. Approach is honest about this.

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (30 days — Phaser 3.x is stable; fast-moving parts are only version numbers which are already locked to installed 3.90.0)
