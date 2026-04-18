# Phase 6: Ethereal Audio - Context

**Gathered:** 2026-04-18 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Audio enhances cosmic atmosphere with an ambient layer and phase-aware music. Scope:

- **AUDIO-01:** Continuous cosmic ambient drone layer playing under all BGM
- **AUDIO-02:** SFX pitch variation (slight random detune) for auditory variety on repetitive sounds
- **AUDIO-03:** Concurrent sound limit to prevent WebAudio node saturation under heavy load
- **AUDIO-04:** BGM crossfade between calm (build phase) and intense (wave phase) tracks

New gameplay sounds, voice acting, accessibility audio toggles, and dynamic audio mixing per scene are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Asset Sourcing (AUDIO-01, AUDIO-04)
- **D-01:** Source new audio as **CC0 OGG files from OpenGameArt and/or Free Music Archive**, mirroring the existing pattern (all current SFX + `bgm_wave.ogg` are CC0 OGG). Two new files needed: a calm/build BGM track (`bgm_build.ogg`) and a cosmic ambient drone (`ambient_drone.ogg`). Both must loop seamlessly. Web Audio synthesis is a documented fallback if no suitable CC0 drone can be sourced — but assets are preferred for tonal control and consistency.
- **D-02:** Asset placement: `assets/audio/bgm_build.ogg` and `assets/audio/ambient_drone.ogg`. BootScene loads them via `this.load.audio(key, path)` — same pattern as the existing 11 audio files. Existing BootScene fallback (silent stubs on load failure) covers the missing-asset case automatically; no new fallback code required.

### AUDIO Config Object (Phase 1 Dependency Resolution)
- **D-03:** Create a **new top-level `AUDIO` frozen object** in `src/config/GameConfig.js`, sibling to `THEME` / `VFX` / `POSTFX`. ROADMAP.md lists Phase 6 as depending on "Phase 1 (THEME.audio config)" but Phase 1 never added audio config — this phase resolves the gap by creating the config block here, not by retrofitting Phase 1. Establishes the same separation of concerns the codebase already uses (THEME = palette, VFX = event/per-entity FX, POSTFX = scene-rendering FX, AUDIO = sound).
- **D-04:** AUDIO config shape (suggested, planner can refine):
  ```js
  AUDIO: Object.freeze({
    BGM: Object.freeze({
      buildKey: 'bgm_build',
      waveKey: 'bgm_wave',
      buildVolume: 0.5,
      waveVolume: 0.5,
      crossfadeDuration: 1500,
      crossfadeEase: 'Sine.easeInOut',
    }),
    AMBIENT: Object.freeze({
      key: 'ambient_drone',
      volume: 0.15,
    }),
    SFX: Object.freeze({
      detuneCents: 50,
      detunedKeys: Object.freeze(['sfx_shoot', 'sfx_zap', 'sfx_splat', 'sfx_hit', 'sfx_build', 'sfx_sell', 'sfx_select']),
      perKeyConcurrentCap: 4,
    }),
  })
  ```

### SFX Pitch Variation (AUDIO-02)
- **D-05:** **Random detune of ±50 cents** (Phaser uses cents; ±100 = ±1 semitone) applied **only to repetitive SFX**: `sfx_shoot`, `sfx_zap`, `sfx_splat`, `sfx_hit`, `sfx_build`, `sfx_sell`, `sfx_select`. One-shots that need a recognizable signature stay untouched: `sfx_wave_start`, `sfx_victory`, `sfx_core_destroyed`. ±50 is enough to break the "machine gun monotone" feel without making each shot sound musically distinct.
- **D-06:** Implementation lives in **the existing `playSfx()` method** in `src/scenes/GameScene.js` (line 343), not a new module. Add detune merge to the config arg: `if (AUDIO.SFX.detunedKeys.includes(key)) config = { ...config, detune: random(-cents, cents) }`. Per-key cooldown stays as-is — detune is independent.

### Concurrent Sound Limit (AUDIO-03)
- **D-07:** Use a **per-key concurrent cap of 4**, layered on top of the existing per-key cooldown. Cooldown throttles *rate* (e.g., shoot can't fire faster than every 80ms); the cap throttles *simultaneity* (e.g., even if 6 turrets fire on the same frame, only 4 instances of `sfx_shoot` actually play). Prevents WebAudio node saturation during 60-bug boss waves where many turrets coincide.
- **D-08:** Cap-tracking lives **in `playSfx()`** alongside the cooldown map: count active sound instances per key via `this.sound.getAllPlaying(key).length` (Phaser API), drop the new play if length ≥ cap. Zero new module; mirrors the cooldown pattern already in the same method.

### BGM Crossfade (AUDIO-04)
- **D-09:** Crossfade strategy: **both BGM tracks loop continuously** for the full GameScene lifetime; only their volumes tween on `phase-changed`. Build phase: build BGM at full volume, wave BGM at 0. Wave phase: wave BGM at full volume, build BGM at 0. Avoids restart pops, keeps positions in-sync, simpler than start/stop coordination.
- **D-10:** Crossfade duration: **1500ms with `Sine.easeInOut`**. Long enough to feel atmospheric, short enough that the player perceives the phase change before the wave is half over. Reuses the established Phaser tween pattern from Phase 5's vignette (D-09): `scene.tweens.add({ targets: bgmInstance, volume: target, duration, ease })`.
- **D-11:** **Stop both BGM tracks on scene shutdown** (extends the existing `events.once('shutdown', …)` handler in GameScene that already calls `this.sound.stopByKey('bgm_wave')`). Kill the volume tweens too, mirroring Phase 5's tween-safety pattern (D-09 vignette tween cleanup).
- **D-12:** Phase-changed listener stored as a **named handler on the scene** (`this._onPhaseChangedBgm = (payload) => {…}`), removed via the symmetric `events.off('phase-changed', this._onPhaseChangedBgm)` in shutdown. Identical pattern to Phase 5 D-12's vignette listener — naked `events.off('phase-changed')` would clobber UIScene's HUD-phase listener that shares the same event bus.

### Ambient Drone Layer (AUDIO-01)
- **D-13:** Drone is a **separate looping sound at ~0.15 volume**, started in GameScene on `create()` after the audio context is unlocked (same gating pattern the existing `bgm_wave` start uses for `this.sound.locked`). Continues uninterrupted across build↔wave transitions — independent of the BGM crossfade. "Felt, not heard" — adds atmospheric depth without competing with BGM or SFX for headroom.
- **D-14:** Drone is **GameScene-only** (not MainMenuScene / GameOverScene) per the established Phase 5 D-14 pattern of restricting persistent scene FX to GameScene. Keeps boundary scenes simple, avoids needing per-scene audio teardown coordination, and the menu/game-over screens already get atmospheric framing via the static vignette (Phase 5).
- **D-15:** Drone is **stopped on scene shutdown** alongside the BGM tracks (extend the same shutdown handler).

### Renderer / Runtime Considerations
- **D-16:** No Canvas/WebGL gating needed — Web Audio works in both renderers. Phaser's existing `sound.locked` autoplay-policy handling is the only runtime concern, and the existing `bgm_wave` startup pattern (`if (this.sound.locked) sound.once('unlocked', startBgm); else startBgm();`) is reused for the drone and the build BGM.

### Claude's Discretion
- Exact crossfade curve tuning beyond the 1500ms / Sine.easeInOut starting point — playtest to taste.
- Drone volume fine-tuning (0.15 starting point, may need to drop to 0.10 if BGM is dense).
- Detune range fine-tuning (50 cents starting point — may pull back to 30 if it sounds too pitch-bent on slower SFX).
- Whether the drone fades in over the first 1-2 seconds vs hard-starts on unlock.
- Exact CC0 track selections — sourcing is a planner/executor task; the contract is "calm cosmic for build, intense cosmic for wave, low ambient drone for atmosphere."

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` §"Phase 6: Ethereal Audio" — Goal, dependencies, success criteria
- `.planning/REQUIREMENTS.md` — AUDIO-01 through AUDIO-04 acceptance language

### Prior phase decisions reused here
- `.planning/phases/01-cosmic-foundation/01-CONTEXT.md` — D-01 Void Ethereal palette (informs "cosmic" tonal direction for asset sourcing); D-03 tween-safety pattern (reused for crossfade tween cleanup)
- `.planning/phases/04-impactful-effects/04-CONTEXT.md` — D-06/D-07/D-08 shake throttling/replace pattern (analogous philosophy for SFX cap/cooldown layering)
- `.planning/phases/05-atmospheric-glow/05-CONTEXT.md` — D-09 phase-reactive vignette tween + D-12 named listener for `phase-changed` (BGM crossfade mirrors this pattern); D-13 POSTFX top-level config sibling pattern (AUDIO follows the same shape)

### Existing audio integration code
- `src/scenes/GameScene.js:343` — `playSfx()` method (cooldown lives here; detune + cap will too)
- `src/scenes/GameScene.js:105-110` — Existing `bgm_wave` startup with `sound.locked` gating (reused for drone + build BGM)
- `src/scenes/GameScene.js:115-118` — Existing shutdown handler (extends to stop drone + both BGM tracks + kill tweens)
- `src/scenes/BootScene.js:61-71` — Audio asset loading pattern (extends to load `bgm_build` and `ambient_drone`)
- `src/scenes/BootScene.js:128-129` — Existing fallback for missing audio (silent stubs — automatically covers new assets)

### Project conventions
- `CLAUDE.md` — ES modules, frozen config objects (`UPPER_CASE`), event-driven architecture, no test framework

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`GameScene.playSfx(key, config)`** — already throttles per-key with cooldown map. Detune (D-06) and per-key concurrent cap (D-08) plug into the same method. No new module.
- **`this.sound.locked` + `sound.once('unlocked', …)` pattern** — autoplay-policy gating already in place for `bgm_wave`. Reused verbatim for drone and build BGM startup.
- **`this.sound.getAllPlaying(key)`** — Phaser HTML5/WebAudio API used directly for the per-key concurrent count (no manual tracking required).
- **Frozen config sibling pattern** — `THEME`, `VFX`, `POSTFX` already established in `GameConfig.js`. Adding `AUDIO` follows the exact same shape (Object.freeze nested blocks).
- **Named-handler `phase-changed` listener pattern** — established in Phase 5 (D-12 vignette listener `this._onPhaseChangedVignette`). BGM crossfade adds a sibling `this._onPhaseChangedBgm`.

### Established Patterns
- **Per-key cooldown for repetitive SFX** — already in `playSfx`. Detune and concurrent cap layer cleanly on top.
- **Tween cleanup on shutdown** — Phase 1 D-03 (Bug.despawn killTweensOf), Phase 5 D-09 (vignette strength tween destroy on phase change + on shutdown). BGM crossfade tweens follow the same destroy-on-replace + kill-on-shutdown discipline.
- **GameScene-only persistent effects** — Phase 5 D-14 established this for vignette tween. Drone follows: GameScene-only, started after unlock, stopped on shutdown.
- **CC0 asset sourcing via OpenGameArt** — all 11 existing audio files. New files (`bgm_build`, `ambient_drone`) follow the same path/naming.
- **BootScene silent-stub fallback for failed audio loads** — already covers new assets without code changes.

### Integration Points
- **`src/config/GameConfig.js`** — add `AUDIO` frozen object after `POSTFX`.
- **`src/scenes/BootScene.js`** lines 61-71 — add two `this.load.audio(...)` calls.
- **`src/scenes/GameScene.js`** — extend `playSfx` (detune + cap), `create` (start build BGM + drone, register phase-changed listener), `events.once('shutdown', …)` (stop new tracks + kill crossfade tween + remove listener).
- **`src/scenes/GameScene.js`** — `phase-changed` event already emitted at all transition points; no new event needed.

</code_context>

<specifics>
## Specific Ideas

- "Felt, not heard" — explicit framing for the ambient drone (volume 0.15 starting point). Same atmospheric philosophy as Phase 5's "subtle vignette."
- Crossfade behavior should mirror the way the vignette tweens on phase-changed — same duration order of magnitude, same easing family, same cleanup discipline. The audio shift should land at roughly the same perceptual moment as the vignette darkening.
- Per-key concurrent cap of 4 chosen specifically because boss waves can have 6-8 turrets co-firing on the same frame — 4 simultaneous shots is enough to feel dense without clipping the WebAudio mix.

</specifics>

<deferred>
## Deferred Ideas

- **Voice acting / narration** — out of scope for this milestone.
- **Per-scene audio profiles** (different ambient drone in MainMenu vs GameOver) — boundary scenes intentionally stay simple per Phase 5 D-14 pattern. Add to backlog if playtest reveals the menu feels too quiet.
- **Accessibility audio toggles** ("reduce effects", subtitle mode) — flagged in Phase 5 deferred ideas; remains an explicit out-of-scope item per PROJECT.md ("Accessibility features — important but separate milestone").
- **Dynamic mixing** (duck BGM under heavy SFX, sidechain on boss damage) — would be a separate phase.
- **Spatial audio / panning by turret position** — out of scope; the fixed 1920×1080 canvas and top-down view don't gain meaningfully from stereo panning.

</deferred>

---

*Phase: 06-ethereal-audio*
*Context gathered: 2026-04-18 (auto mode)*
