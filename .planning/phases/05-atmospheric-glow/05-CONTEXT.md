# Phase 5: Atmospheric Glow - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Add WebGL post-processing effects that complete the cosmic atmosphere: a soft per-sprite glow on turrets and the command core, and a subtle camera vignette that frames the play area. Both must degrade gracefully when the runtime falls back to the Canvas renderer. No new gameplay, no new entities — purely a rendering/atmosphere layer.

</domain>

<decisions>
## Implementation Decisions

### Glow Technique (THEME-04)
- **D-01:** Use per-GameObject `sprite.preFX.addGlow(color, outerStrength, innerStrength)` applied individually to each turret sprite and the core sprite. No camera-level bloom, no custom shader. Targeted, predictable, cheapest WebGL FX path; doesn't double-amplify particles or bullets that already encode brightness in their own emitters.
- **D-02:** Glow targets are **turrets and core only** — strict THEME-04 scope. Walls, bugs (including boss), bullets, particles do not receive glow. Maintains "defenders glow, threats don't" visual hierarchy and keeps the per-frame FX cost bounded by `turrets.length + 1`.
- **D-03:** Glow color uses **per-turret tints constrained to the Void Ethereal palette**:
  - Blaster → ghostly white `0xeef2ff` (THEME accent)
  - Zapper → light violet (~`0x9966ff`)
  - Slowfield → deep nebula purple `0x6a4c93`
  - Wall → no glow
  - Core → ghostly white `0xeef2ff` (matches blaster — the core is a defender too)
  Each turret reads recognizable at a glance, but no warm/electric/cool extras leak in — palette stays cohesive with Phase 1 and Phase 4 decisions.
- **D-04:** Upgraded turrets get a **different glow color** (not just brighter). Pattern: base = nebula tint, upgraded = accent white `0xeef2ff`. Consistent with Phase 4 D-03 (slowfield upgrade shifts color, not just brightness). Strong, unmistakable upgrade signal layered on top of the existing Phase 2 alpha pulse and `0xffdd44` upgrade tint.
- **D-05:** Glow is **constant ambient** — set once on turret/core construction, never tweened, never reactive to fire/damage events. Pairs with the existing Phase 2 idle alpha pulse (which already provides "aliveness") and avoids visual noise on top of muzzle flash, damage flash, and Phase 3/4 particle effects. Simplest implementation, lowest perf cost.

### Vignette (THEME-05)
- **D-06:** Use Phaser 3.80+ `camera.postFX.addVignette(x, y, radius, strength)` on the GameScene main camera (and on MainMenu/GameOver per D-14). WebGL only — Canvas falls back to no vignette per D-11.
- **D-07:** Vignette intensity is **subtle (~0.3 strength)** — atmospheric framing only, not a cinematic spotlight. Edges barely noticeable; the play area gets a gentle hint of focus without darkening HUD-adjacent screen real estate or interfering with build-menu popups. Matches THEME-05's "subtle vignette effect" wording.
- **D-08:** Vignette color is **pure black** — Phaser's default addVignette behavior. Clean cinematic frame, maximum contrast against the bright play area, no extra Graphics overlay needed.
- **D-09:** Vignette is **phase-reactive**: tweens stronger during the wave phase, lighter during the build phase. Subtle tension cue that reuses the existing `phase-changed` event. Tween is a single `scene.tweens.add()` on the vignette FX controller's strength property; killed on scene shutdown to respect the Phase 1 tween-safety pattern. Suggested values: build = 0.25, wave = 0.40 (tune during execution to keep it "subtle").

### Renderer Detection & Canvas Fallback
- **D-10:** On Canvas runtime, glow is **skipped entirely**. Log a one-line warning (`console.warn('[postfx] Canvas renderer detected — glow disabled')`) once at scene boot and render plain sprites. Acceptable per THEME-04's "graceful degradation on Canvas" wording. Zero extra code paths, no fallback halo textures.
- **D-11:** On Canvas runtime, vignette is **skipped entirely** as well. Same philosophy as D-10 — Canvas users get a fully playable game without the atmospheric polish. No Graphics-overlay fallback.
- **D-12:** Renderer detection is an **inline check** in each scene's `create()` method: `const isWebGL = this.game.renderer.type === Phaser.WEBGL;`. No new `src/utils/` directory, no registry stash. Matches the existing pattern for simple inline checks (e.g. `DEBUG.enableDebugKeys`). Used in GameScene, MainMenuScene, and GameOverScene per D-14.

### Config & Scope
- **D-13:** Glow + vignette tunables live in a **new top-level `POSTFX` frozen object** in `src/config/GameConfig.js`, alongside `THEME` and `VFX`. Cleanest separation of concerns: THEME = palette, VFX = event/per-entity effects, POSTFX = scene-wide rendering. Suggested shape:
  ```js
  export const POSTFX = Object.freeze({
    GLOW: Object.freeze({
      blaster:        Object.freeze({ base: 0xeef2ff, upgraded: 0xeef2ff, outerStrength: 2, innerStrength: 1 }),
      zapper:         Object.freeze({ base: 0x9966ff, upgraded: 0xeef2ff, outerStrength: 2, innerStrength: 1 }),
      slowfield:      Object.freeze({ base: 0x6a4c93, upgraded: 0xeef2ff, outerStrength: 2, innerStrength: 1 }),
      core:           Object.freeze({ color:    0xeef2ff,                    outerStrength: 3, innerStrength: 1 }),
    }),
    VIGNETTE: Object.freeze({
      x: 0.5, y: 0.5, radius: 0.5,
      buildStrength: 0.25,
      waveStrength: 0.40,
      transitionDuration: 600,
    }),
  });
  ```
  Exact strengths/radii to be tuned during execution.
- **D-14:** Scene scope is **all gameplay-adjacent scenes**: glow + vignette apply on `GameScene`, `MainMenuScene`, and `GameOverScene`. UIScene is exempt — HUD must remain unaffected for readability (matches the SHAKE-04 isolation pattern from Phase 4). MainMenu and GameOver get the static-strength vignette (only GameScene gets the phase-reactive tween from D-09). The cosmic atmosphere reads cohesively from boot to game-over.

### Claude's Discretion
- Exact `outerStrength` / `innerStrength` numerical tuning for glow (start with 2/1, adjust to taste during execution while keeping the 60fps budget)
- Exact vignette `radius` value (start with 0.5, tune for the 7×7 grid framing)
- Easing curve for the build↔wave vignette tween (`Sine.easeInOut` is consistent with existing tweens)
- Whether MainMenu/GameOver vignette uses `buildStrength` or its own constant (default to `buildStrength` for consistency)
- Cleanup pattern for FX controllers on scene shutdown (likely `camera.postFX.clear()` and `sprite.preFX.clear()` in shutdown handlers)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 5 Requirements
- `.planning/REQUIREMENTS.md` — THEME-04 (post-FX glow/bloom on turrets and core, WebGL only with graceful Canvas degradation), THEME-05 (vignette camera effect)
- `.planning/ROADMAP.md` (Phase 5 entry) — success criteria: turrets/core glow softly, screen has cinematic framing

### Codebase integration points
- `src/entities/Turret.js` constructor (lines 22, 30–48) — sprite is created here; `preFX.addGlow(...)` must be applied per turret type with config from POSTFX.GLOW. `upgrade()` (lines 297–331) must swap to the upgraded glow color. `destroy()` (lines 362–388) should clear FX before sprite teardown.
- `src/scenes/GameScene.js` `renderCore()` (lines 111–124) — apply core glow on `this.coreSprite.preFX.addGlow(...)`; apply camera vignette on `this.cameras.main.postFX.addVignette(...)` in `create()`. Hook the phase-reactive vignette tween into the existing `phase-changed` event emitter (lines 156, 184, 201). Vignette FX controller must be cleaned up in the existing shutdown handler (lines 92–99).
- `src/scenes/MainMenuScene.js` and `src/scenes/GameOverScene.js` — apply static-strength vignette in their respective `create()` methods (per D-14).
- `src/scenes/UIScene.js` — explicitly NOT modified (SHAKE-04 isolation pattern from Phase 4 applies — UIScene's separate camera does not get postFX).
- `src/config/GameConfig.js` — add new top-level `POSTFX` frozen export (per D-13).
- `src/main.js` (lines 9–26) — `Phaser.AUTO` is intentional; do not pin to `Phaser.WEBGL`. Renderer detection happens at scene-create time.

### Prior phase context (decisions that carry forward)
- `.planning/phases/01-cosmic-foundation/01-CONTEXT.md` D-01 (Void Ethereal palette), D-03 (`scene.tweens.killTweensOf` cleanup pattern — applies to vignette tween)
- `.planning/phases/04-impactful-effects/04-CONTEXT.md` D-03 (upgraded slowfield uses different color, not just brighter — informs D-04 here), D-10 (UIScene-camera isolation pattern — informs D-14 here)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `THEME` palette in `GameConfig.js:136–140` — `accent: '#eef2ff'`, `nebula: ['#2d1b4e', '#4b2c62', '#6a4c93']`. Glow color choices in D-03 derive directly from these (note: GameConfig stores as `'#...'` strings; `preFX.addGlow` expects `0x...` numeric — POSTFX entries should use the numeric form `0xeef2ff` etc.)
- `Turret.sprite` (Phaser sprite created at `Turret.js:22`) — direct attach point for `preFX.addGlow`. Composite Turret class wraps the sprite, so apply FX to `this.sprite`, not `this`.
- `GameScene.coreSprite` (`GameScene.js:113`) — direct attach point for core glow.
- `GameScene.cameras.main` — direct attach point for vignette postFX.
- Existing `phase-changed` event (emitted at GameScene.js:156, 184, 201) — already wired with payload `{ phase: 'build' | 'wave' }`. Vignette reactivity (D-09) listens here.
- Existing `events.once('shutdown', ...)` cleanup block in GameScene (lines 92–99) — extend with `this._vignetteTween?.destroy()` and `this.cameras.main.postFX.clear()` to honor the Phase 1 tween-safety pattern.

### Established Patterns
- **Frozen configs**: All tuning values use `Object.freeze()` in GameConfig.js — POSTFX must follow this exactly (every nested object frozen).
- **Composite Turret**: Turret is NOT a Phaser sprite — it wraps `this.sprite`. preFX/postFX must target `this.sprite` directly, never `this`.
- **Tween cleanup (Phase 1 D-03)**: any persistent tween must be tracked and destroyed on scene shutdown to prevent leaks across scene restarts. The vignette tween (D-09) needs the same treatment.
- **Inline simple checks**: `DEBUG.enableDebugKeys` (GameConfig.js:118) shows the pattern for one-off runtime conditionals — D-12's renderer check follows this.
- **UIScene isolation (Phase 4 D-10)**: SHAKE-04 was satisfied "for free" by shaking only `GameScene.cameras.main`. Same here for vignette — only GameScene's main camera gets postFX, UIScene's camera is not touched.

### Integration Points
- `Turret` constructor — apply per-turret-type glow via `this.sprite.preFX.addGlow(color, outer, inner)` immediately after `this.sprite = scene.add.sprite(...)`. Skip the call entirely when `!isWebGL`.
- `Turret.upgrade()` — when upgrading, clear and reapply glow with the upgraded color (`this.sprite.preFX.clear(); this.sprite.preFX.addGlow(upgradedColor, ...)`).
- `Turret.destroy()` — call `this.sprite.preFX?.clear()` before `this.sprite.destroy()` to avoid orphaned FX state.
- `GameScene.renderCore()` — apply core glow on `this.coreSprite` after the existing breathing tween is set up.
- `GameScene.create()` — add vignette to `this.cameras.main.postFX.addVignette(...)` and store the controller reference for the phase-reactive tween (D-09).
- `GameScene` `phase-changed` listener (new) — tween vignette `strength` between `POSTFX.VIGNETTE.buildStrength` and `waveStrength` over `transitionDuration` ms.
- `MainMenuScene.create()` and `GameOverScene.create()` — static vignette only (per D-14), no event listener, no tween.

</code_context>

<specifics>
## Specific Ideas

- "Defenders glow, threats don't" — the per-entity glow scope (D-02) creates a clear visual hierarchy that reinforces the gameplay's defensive theme.
- The phase-reactive vignette (D-09) should feel like the room subtly leans in when a wave starts and exhales when the wave ends. The change must be felt, not seen — if the player consciously notices the vignette tween, it's too strong.
- Glow palette stays inside the Void Ethereal cosmic identity — no warm yellows, no electric cyans, no traffic-light tints. Every color in POSTFX.GLOW must be sourced from the existing THEME palette.

</specifics>

<deferred>
## Deferred Ideas

- **HP-reactive vignette** (red flare as core HP drops below 50%) — explicitly rejected for this phase (Q-09 chose phase-reactive only). Could be a v2 POLISH item if the basic phase-reactive feel works well.
- **Glow on boss / spitter bullets** — explicitly rejected (Q-02 chose strict scope). If boss feels visually weak in playtest, consider adding a one-off boss glow in a future polish phase.
- **Glow flares on fire/damage events** — rejected for noise (Q-05 chose constant). Re-evaluate if combat ever feels under-juiced.
- **Custom WebGL shader pipeline** — rejected as overkill (Q-01 option d). Door is open for a future cosmic-shader phase if the project grows beyond the current polish milestone.
- **Phase 7 overlap awareness** — D-14 extends glow + vignette to MainMenu/GameOver, which lightly overlaps Phase 7 (Cohesive Theme: "all UI elements use consistent cosmic color palette"). Phase 7 still owns hardcoded color migration across all 6+ files; Phase 5 just adds the post-FX layer to those scenes. Planner: keep Phase 7's color-migration scope intact — don't pull it into Phase 5.

</deferred>

---

*Phase: 05-atmospheric-glow*
*Context gathered: 2026-04-17*
