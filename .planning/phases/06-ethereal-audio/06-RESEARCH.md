# Phase 6: Ethereal Audio - Research

**Researched:** 2026-04-17
**Domain:** Phaser 3 Web Audio (sound playback, detune, concurrent caps, BGM crossfade, ambient drone)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Asset Sourcing (AUDIO-01, AUDIO-04)**
- **D-01:** Source new audio as **CC0 OGG files from OpenGameArt and/or Free Music Archive**, mirroring the existing pattern. Two new files needed: a calm/build BGM track (`bgm_build.ogg`) and a cosmic ambient drone (`ambient_drone.ogg`). Both must loop seamlessly. Web Audio synthesis is a documented fallback if no suitable CC0 drone can be sourced — but assets are preferred.
- **D-02:** Asset placement: `assets/audio/bgm_build.ogg` and `assets/audio/ambient_drone.ogg`. BootScene loads them via `this.load.audio(key, path)` — same pattern as the existing 11 audio files. Existing BootScene fallback (silent stubs on load failure) covers the missing-asset case automatically.

**AUDIO Config Object (Phase 1 Dependency Resolution)**
- **D-03:** Create a **new top-level `AUDIO` frozen object** in `src/config/GameConfig.js`, sibling to `THEME` / `VFX` / `POSTFX`. ROADMAP.md lists Phase 6 as depending on "Phase 1 (THEME.audio config)" but Phase 1 never added it — this phase resolves the gap by creating the config block here.
- **D-04:** AUDIO config shape (planner can refine):
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

**SFX Pitch Variation (AUDIO-02)**
- **D-05:** **Random detune of ±50 cents** applied **only to repetitive SFX**: `sfx_shoot`, `sfx_zap`, `sfx_splat`, `sfx_hit`, `sfx_build`, `sfx_sell`, `sfx_select`. One-shots stay untouched: `sfx_wave_start`, `sfx_victory`, `sfx_core_destroyed`.
- **D-06:** Implementation lives in **the existing `playSfx()` method** in `src/scenes/GameScene.js` (line 346 in current source, line 343 in CONTEXT.md), not a new module. Add detune merge to the config arg.

**Concurrent Sound Limit (AUDIO-03)**
- **D-07:** Use a **per-key concurrent cap of 4**, layered on top of the existing per-key cooldown.
- **D-08:** Cap-tracking lives **in `playSfx()`** alongside the cooldown map. Per CONTEXT.md the count comes from `this.sound.getAllPlaying(key).length` — **see API Correction below: that signature does not exist**; planner must use the corrected idiom.

**BGM Crossfade (AUDIO-04)**
- **D-09:** **Both BGM tracks loop continuously** for the full GameScene lifetime; only their volumes tween on `phase-changed`. Build phase: build BGM at full volume, wave BGM at 0. Wave phase: inverse.
- **D-10:** Crossfade duration: **1500ms with `Sine.easeInOut`**. Reuses Phase 5's vignette tween pattern (D-09): `scene.tweens.add({ targets: bgmInstance, volume: target, duration, ease })`.
- **D-11:** **Stop both BGM tracks on scene shutdown** (extends the existing `events.once('shutdown', …)` handler). Kill the volume tweens too.
- **D-12:** Phase-changed listener stored as a **named handler** (`this._onPhaseChangedBgm = (payload) => {…}`), removed via the symmetric `events.off('phase-changed', this._onPhaseChangedBgm)`. Identical pattern to Phase 5 D-12's vignette listener.

**Ambient Drone Layer (AUDIO-01)**
- **D-13:** Drone is a **separate looping sound at ~0.15 volume**, started in GameScene on `create()` after the audio context is unlocked.
- **D-14:** Drone is **GameScene-only** (not MainMenuScene / GameOverScene) per the Phase 5 D-14 pattern.
- **D-15:** Drone is **stopped on scene shutdown** alongside the BGM tracks.

**Renderer / Runtime Considerations**
- **D-16:** No Canvas/WebGL gating needed — Web Audio works in both renderers. Phaser's existing `sound.locked` autoplay-policy handling is the only runtime concern.

### Claude's Discretion
- Exact crossfade curve tuning beyond the 1500ms / Sine.easeInOut starting point — playtest to taste.
- Drone volume fine-tuning (0.15 starting point, may need to drop to 0.10 if BGM is dense).
- Detune range fine-tuning (50 cents starting point — may pull back to 30 if it sounds too pitch-bent on slower SFX).
- Whether the drone fades in over the first 1-2 seconds vs hard-starts on unlock.
- Exact CC0 track selections — sourcing is a planner/executor task; the contract is "calm cosmic for build, intense cosmic for wave, low ambient drone for atmosphere."

### Deferred Ideas (OUT OF SCOPE)
- **Voice acting / narration** — out of scope for this milestone.
- **Per-scene audio profiles** (different ambient drone in MainMenu vs GameOver) — boundary scenes intentionally stay simple per Phase 5 D-14 pattern.
- **Accessibility audio toggles** ("reduce effects", subtitle mode) — flagged as a separate accessibility milestone in PROJECT.md.
- **Dynamic mixing** (duck BGM under heavy SFX, sidechain on boss damage) — would be a separate phase.
- **Spatial audio / panning by turret position** — out of scope; the fixed 1920×1080 canvas and top-down view don't gain meaningfully from stereo panning.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIO-01 | Add cosmic ambient drone audio layer (loops continuously under BGM) | Asset sourcing (Standard Stack), `sound.add` + `play({loop:true, volume:0.15})` (Code Examples), unlock-gating pattern reused from existing `bgm_wave` (Pattern 1) |
| AUDIO-02 | SFX pitch variation (slight random detune per play for variety) | `SoundConfig.detune` field verified in Phaser docs (Pattern 2); existing `playSfx()` extension (Code Examples) |
| AUDIO-03 | Concurrent sound limit to prevent WebAudio node saturation | **API Correction below** — `getAllPlaying()` is no-arg in Phaser ≥ 3.60.0; correct idiom (Pattern 3, Code Examples) |
| AUDIO-04 | BGM crossfade between calm (build phase) and intense (wave phase) tracks | `sound.add()` + tween-on-instance pattern (Pattern 4); reuses Phase 5 vignette tween-on-FX-controller precedent at `GameScene.js:89-101` |
</phase_requirements>

## Summary

Phase 6 is a small, self-contained audio polish phase built on existing Phaser 3.80+ Web Audio APIs. Every required behavior — detune, concurrent caps, BGM crossfade, ambient drone — is supported natively by Phaser's sound system; no new libraries needed. The phase touches three files: `GameConfig.js` (new `AUDIO` frozen export), `BootScene.js` (two `load.audio` lines), and `GameScene.js` (extend `playSfx`, add BGM/drone setup in `create`, extend shutdown handler). All decisions are locked in CONTEXT.md and align with established project patterns (Phase 5 vignette tween, Phase 1 tween-safety, named-handler event listeners).

Two CONTEXT.md decisions need API corrections that the planner must respect: (1) `getAllPlaying()` does not accept a key argument — the per-key concurrent count must use `getAll(key).filter(s => s.isPlaying).length` or `getAllPlaying().filter(s => s.key === key).length`; and (2) the BGM crossfade requires `sound.add()` to obtain a Sound instance, since `sound.play()` returns a boolean and cannot be tweened. This forces a small invisible refactor: the existing `this.sound.play('bgm_wave', …)` at `GameScene.js:105` must move to the `add + play` pattern so both BGM tracks share the same crossfade machinery.

**Primary recommendation:** Implement in this order — (1) add `AUDIO` config, (2) load two new assets, (3) refactor existing `bgm_wave` to `add + play`, (4) add `bgm_build` add-and-play with phase-reactive crossfade, (5) add ambient drone, (6) extend `playSfx()` with detune + concurrent cap, (7) extend shutdown handler. Sequence avoids leaving `bgm_wave` orphaned mid-implementation.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Audio asset loading | BootScene (preload) | — | Existing pattern: all 11 SFX/BGM files load here via `this.load.audio()`. Failed loads fall back to silent stubs in `BootScene.create` (lines 127-134). |
| Audio config (volumes, durations, key lists) | GameConfig (frozen export) | — | Established sibling pattern: `THEME` / `VFX` / `POSTFX` already live here as frozen top-level exports. `AUDIO` slots in alongside. |
| SFX dispatch (detune, cooldown, cap) | GameScene.playSfx (method) | — | Existing throttling already lives here; detune and cap layer on top with no new module. Mirror Phase 4's "extend existing method, don't add new system" philosophy. |
| BGM lifecycle (start, crossfade, stop) | GameScene (create + shutdown) | TweensManager | GameScene-only per CONTEXT.md D-09/D-14. Tweens managed by Phaser's TweenManager; no external lib. |
| Ambient drone lifecycle | GameScene (create + shutdown) | — | GameScene-only per CONTEXT.md D-14. Lifecycle parallel to BGM but independent of crossfade. |
| Phase-change reactivity | GameScene event bus (`phase-changed` event) | UIScene (existing HUD listener — must NOT be clobbered) | Event already emitted at lines 184, 212, 229. New named listener `_onPhaseChangedBgm` symmetric to Phase 5's `_onPhaseChangedVignette`. |
| Audio-context unlock | Phaser Sound Manager (`sound.locked` + `sound.once('unlocked', …)`) | — | Existing pattern at `GameScene.js:106-110` covers all browser autoplay policies for `bgm_wave`. Reused verbatim for new tracks. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `phaser` | `^3.80.0` (verified in package.json) | Sound playback, detune, concurrent enumeration, tween-on-property | Already the engine; `WebAudioSoundManager` covers every requirement natively, no extra deps. [VERIFIED: package.json] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | Phase introduces zero new dependencies. |

### Asset Candidates (CC0 OpenGameArt — executor picks)

**Ambient drone (`ambient_drone.ogg`)** — calm cosmic, loopable, ~30-90s:
- "Sci-Fi Drone Loop" — sine-wave-based, explicitly seamless, low cosmic hum, exactly matches "felt not heard" framing [CITED: https://opengameart.org/content/sci-fi-drone-loop]
- "CC0 Background Ambience" — collection includes ambient pads suitable for layering [CITED: https://opengameart.org/content/cc0-background-ambience]
- "Scifi City - Ambient Loop" — built from CC0 samples, OGG + MP3, seamless [CITED: https://opengameart.org/content/scifi-city-ambient-loop]

**Build-phase BGM (`bgm_build.ogg`)** — calm cosmic, loopable, ~1-3 min:
- "Our expanse" — described as "upbeat melancholic jam for a space level" with "calm vibes finish with a cosmic build", OGG available at higher bitrate [CITED: https://opengameart.org/content/our-expanse]
- "CC0 Space Music" collection — multi-track collection of calm/semi-calm space music [CITED: https://opengameart.org/content/cc0-space-music]
- "CC0 - Calm / Relaxing Music" collection — public-domain ambient/relaxing tracks [CITED: https://opengameart.org/content/cc0-calm-relaxing-music]

**Wave-phase BGM (`bgm_wave.ogg`)** — already exists at `assets/audio/bgm_wave.ogg`. No replacement needed. [VERIFIED: file present]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CC0 file from OpenGameArt | Web Audio synthesis (oscillator + lowpass + LFO) | Synthesis offers tonal control and zero asset weight, but produces a less organic / more "test-tone" character. CONTEXT.md D-01 marks this as fallback only — see Synthesis Fallback section below. [ASSUMED] |
| Phaser `tweens.add` on `Sound.volume` | Manual `requestAnimationFrame` + `setVolume()` loop | Manual loop would re-implement what Phaser already does correctly and bypass Phase 1's tween-safety contract. Don't hand-roll. |

**Installation:**
No new packages — phase introduces zero dependencies.

**Version verification:**
```bash
npm view phaser version
# Returns 3.90.0 as of April 2026; project pins ^3.80.0 which floats up.
```
Verified: `package.json` declares `"phaser": "^3.80.0"`. The `getAllPlaying()` no-arg signature requires Phaser ≥ 3.60.0 — satisfied. The `isPlaying(key)` shortcut requires ≥ 3.85.0 — **may or may not** be available depending on installed minor; the recommended idiom (`getAll(key).filter(s => s.isPlaying)`) is safe across the entire 3.60+ range.

## Architecture Patterns

### System Architecture Diagram

```
                     ┌─────────────────┐
                     │   BootScene     │
                     │   preload()     │
                     │                 │
                     │  load.audio(    │
                     │   bgm_build,    │
                     │   ambient_drone)│
                     └────────┬────────┘
                              │ scene.start
                              ▼
                     ┌─────────────────┐         ┌──────────────────┐
                     │   GameScene     │ events  │    UIScene       │
                     │   create()      │────────►│  (HUD listener   │
                     │                 │ phase-  │   on same        │
                     │  ┌───────────┐  │ changed │   bus — DO NOT   │
                     │  │ AUDIO cfg │  │         │   clobber)       │
                     │  └─────┬─────┘  │         └──────────────────┘
                     │        │        │
                     │  ┌─────▼──────┐ │
                     │  │ if locked: │ │
                     │  │  once(     │ │
                     │  │  'unlocked'│ │
                     │  │  startAll) │ │
                     │  │ else: now  │ │
                     │  └─────┬──────┘ │
                     │        │        │
                     │        ▼        │
                     │  ┌──────────────┴───────────────┐
                     │  │  sound.add(bgm_build) + play │  loop forever
                     │  │  sound.add(bgm_wave)  + play │  loop forever
                     │  │  sound.add(drone)     + play │  loop forever (vol 0.15)
                     │  └──────────────┬───────────────┘
                     │                 │
                     │  ┌──────────────▼───────────────┐
                     │  │ on('phase-changed', _onBgm): │
                     │  │   tween build vol 1↔0        │
                     │  │   tween wave  vol 0↔1        │
                     │  │   1500ms Sine.easeInOut      │
                     │  └──────────────┬───────────────┘
                     │                 │
                     │  ┌──────────────▼───────────────┐
                     │  │ playSfx(key, cfg):           │
                     │  │   1. cooldown gate           │
                     │  │   2. concurrent-cap gate     │
                     │  │   3. detune merge (if in     │
                     │  │      detunedKeys)            │
                     │  │   4. sound.play(key, cfg)    │
                     │  └──────────────────────────────┘
                     │                                  │
                     │  ┌──────────────────────────────┐
                     │  │ once('shutdown'):            │
                     │  │   stop all 3 long-lived      │
                     │  │   destroy crossfade tween    │
                     │  │   off('phase-changed', _onBgm)│
                     │  └──────────────────────────────┘
                     └──────────────────────────────────┘
```

### Recommended Project Structure

No new files. All changes go into:
```
src/
├── config/
│   └── GameConfig.js     # ADD: top-level AUDIO frozen export
├── scenes/
│   ├── BootScene.js      # ADD: 2 load.audio() lines
│   └── GameScene.js      # MODIFY: imports, create(), playSfx(), shutdown handler
```

### Component Responsibilities

| File | Responsibility |
|------|----------------|
| `src/config/GameConfig.js` | Single source of truth for audio tunables (volumes, durations, key lists, cap value, detune cents). Exports new `AUDIO` frozen object alongside existing `THEME` / `VFX` / `POSTFX`. |
| `src/scenes/BootScene.js` | Loads `bgm_build` and `ambient_drone` audio assets. Existing failed-asset fallback in `generateFallback()` (lines 127-134) automatically produces silent stubs for the new keys if files are missing. |
| `src/scenes/GameScene.js` | Owns BGM lifecycle (add both at create, crossfade on phase-changed, stop on shutdown), drone lifecycle (add at create, stop on shutdown), SFX dispatch (extended `playSfx`). |

### Pattern 1: Unlock-Gated Playback (existing — reused verbatim)

**What:** Browser autoplay policies block audio until first user gesture. Phaser surfaces this via `sound.locked` and dispatches `unlocked` once the gesture happens.

**When to use:** Any sound started during scene `create()` that the user has not explicitly triggered.

**Example:**
```js
// Source: src/scenes/GameScene.js:105-110 (existing pattern, verified in current source)
const startBgm = () => this.sound.play('bgm_wave', { loop: true, volume: 0.5 });
if (this.sound.locked) {
  this.sound.once('unlocked', startBgm);
} else {
  startBgm();
}
```

**Phase 6 application:** Wrap all three long-lived sound starts (build BGM, wave BGM, drone) in a single `startAllAudio` function, gated by the same `locked`/`once('unlocked', …)` check. One unlock listener serves all three.

### Pattern 2: Per-Play Detune via SoundConfig

**What:** Phaser's `SoundConfig` accepts a `detune` field measured in cents (range -1200 to +1200; project uses ±50 per CONTEXT.md D-05).

**When to use:** Repetitive SFX where slight pitch variance breaks the "machine gun monotone" feel.

**Example:**
```js
// Source: https://docs.phaser.io/api-documentation/class/sound-webaudiosound (detune property)
// SoundConfig.detune is documented in Types.Sound.SoundConfig (since 3.0.0)
const cents = AUDIO.SFX.detuneCents;          // 50
const detune = Phaser.Math.Between(-cents, cents);
this.sound.play('sfx_shoot', { detune });
```

**Confidence:** HIGH — verified in Phaser ctx7 docs. `WebAudioSound.detune` is a public mutable number; the same field on `SoundConfig` is honored at `play()` time.

### Pattern 3: Per-Key Concurrent Count (CORRECTED)

**What:** Count active sound instances for a specific key to enforce a simultaneity cap.

**Correction to CONTEXT.md D-08:** The signature `getAllPlaying(key)` **does not exist** in Phaser. There are two related methods:

| Method | Signature | Behavior | Since |
|--------|-----------|----------|-------|
| `BaseSoundManager.getAllPlaying()` | no args | returns ALL playing sounds (all keys) | 3.60.0 |
| `BaseSoundManager.getAll([key])` | optional key | returns ALL sounds matching key (playing or not) | 3.23.0 |
| `BaseSoundManager.isPlaying(key)` | required key | boolean — at least one matching sound playing | 3.85.0 |

**When to use:** Inside `playSfx()` after the cooldown gate, drop the new play if `count ≥ AUDIO.SFX.perKeyConcurrentCap`.

**Example (project-correct, safe across Phaser ≥3.60):**
```js
// Two equivalent idioms — pick one:
const activeCount = this.sound.getAll(key).filter(s => s.isPlaying).length;
// or
const activeCount = this.sound.getAllPlaying().filter(s => s.key === key).length;

if (activeCount >= AUDIO.SFX.perKeyConcurrentCap) return;
```

**Confidence:** HIGH — verified by Phaser ctx7 docs lookup at https://docs.phaser.io/api-documentation/class/sound-basesoundmanager.

### Pattern 4: Tween Volume on a Sound Instance (the BGM crossfade)

**What:** Obtain a long-lived `Phaser.Sound.WebAudioSound` instance, then tween its `.volume` property like any other tweenable target.

**When to use:** Crossfade between two looping tracks where both must remain alive throughout the transition.

**CRITICAL refactor implication:** `this.sound.play(key, config)` returns a **boolean** (or `false` on failure) — you cannot tween it. The existing `bgm_wave` startup at `GameScene.js:105` uses this fire-and-forget form and must be migrated to `sound.add()` + `.play()` so the crossfade has a tween target.

**Example:**
```js
// Source: combination of Phaser API docs (sound.add, tweens.add) + project precedent
//         at GameScene.js:95-100 (vignette tween-on-FX-controller, Phase 5 D-09)

// In create():
const startAll = () => {
  this._bgmBuild = this.sound.add(AUDIO.BGM.buildKey, {
    loop: true, volume: AUDIO.BGM.buildVolume,  // build phase active at start
  });
  this._bgmWave = this.sound.add(AUDIO.BGM.waveKey, {
    loop: true, volume: 0,                       // wave silent until first phase change
  });
  this._drone = this.sound.add(AUDIO.AMBIENT.key, {
    loop: true, volume: AUDIO.AMBIENT.volume,
  });
  this._bgmBuild.play();
  this._bgmWave.play();
  this._drone.play();
};
if (this.sound.locked) this.sound.once('unlocked', startAll); else startAll();

// Phase-changed handler (named, removable):
this._onPhaseChangedBgm = (payload) => {
  if (this._crossfadeBuild) this._crossfadeBuild.destroy();
  if (this._crossfadeWave)  this._crossfadeWave.destroy();
  const buildTarget = payload.phase === 'build' ? AUDIO.BGM.buildVolume : 0;
  const waveTarget  = payload.phase === 'wave'  ? AUDIO.BGM.waveVolume  : 0;
  this._crossfadeBuild = this.tweens.add({
    targets: this._bgmBuild, volume: buildTarget,
    duration: AUDIO.BGM.crossfadeDuration, ease: AUDIO.BGM.crossfadeEase,
  });
  this._crossfadeWave = this.tweens.add({
    targets: this._bgmWave, volume: waveTarget,
    duration: AUDIO.BGM.crossfadeDuration, ease: AUDIO.BGM.crossfadeEase,
  });
};
this.events.on('phase-changed', this._onPhaseChangedBgm);
```

**Confidence:** MEDIUM — `volume` is a documented public mutable property with a `VOLUME` event (verified via ctx7); Phaser tween targets accept any object with public non-underscored numeric properties. The exact `tweens.add({ targets: soundInstance, volume })` form was not surfaced in a single ctx7 example, but it is the direct analog of the verified Phase 5 vignette tween pattern at `GameScene.js:95-100` (`targets: this._vignetteFX, strength`). Test in browser as part of validation; if it fails, fall back to a manual `tween.add` on a proxy `{ v: 1 }` object with `onUpdate: t => sound.setVolume(t.getValue())`.

### Anti-Patterns to Avoid

- **Manual `requestAnimationFrame` crossfade loop** — re-implements TweenManager poorly and bypasses Phase 1 D-03 tween-safety. Use Phaser tweens.
- **Calling `sound.stop()` then `sound.play()` on phase change** — produces audible pop/click and loses position sync. Locked decision D-09 is "both loop continuously, only volumes tween."
- **Using a single shared `unlocked` listener registered N times** — Phaser's `once` is one-shot; registering the same listener N times causes redundant calls. Wrap all three starts in one function, register once.
- **Naked `events.off('phase-changed')` in shutdown** — would clobber UIScene's existing HUD-phase listener on the same event bus. Use the symmetric `events.off('phase-changed', this._onPhaseChangedBgm)` form (Phase 5 D-12 precedent).
- **Hand-rolling a per-key concurrent counter** — `BaseSoundManager.getAll(key)` already enumerates by key; don't track manually.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-key concurrent count | Manual `Map<key, Set<instance>>` with manual cleanup on `complete` events | `this.sound.getAll(key).filter(s => s.isPlaying).length` | Phaser already tracks all live instances; manual tracking risks leaks if cleanup misses an event. |
| Volume crossfade | Manual `setInterval` + `setVolume(curr - step)` loop | `this.tweens.add({ targets: sound, volume: target, duration, ease })` | TweenManager handles frame timing, easing curves, and shutdown cleanup. Manual loop must replicate all three. |
| Pitch variation | Pre-record N variants of each SFX | `SoundConfig.detune` per-play | One file + one number is dramatically cheaper than N variants and gives continuous variation. |
| Autoplay-policy gating | DIY user-gesture detector | Phaser's `sound.locked` + `sound.once('unlocked', …)` | Phaser already abstracts the per-browser quirks; project pattern is established at `GameScene.js:106-110`. |
| Audio asset format conversion | WAV everywhere "for compatibility" | OGG (matches existing 11 files) | OGG is universally supported in modern browsers and is dramatically smaller than WAV for music tracks. |

**Key insight:** Phaser's `WebAudioSoundManager` already provides every primitive Phase 6 needs. The phase is genuinely a small composition layer on top of existing Phaser APIs and existing project patterns. There should be zero new "system" or "manager" classes added.

## API Corrections to CONTEXT.md

CONTEXT.md was authored before API verification; these corrections must propagate into PLAN.md. They do not change any decision, only the implementation idiom.

| CONTEXT.md ref | What it says | What's correct | Source |
|----------------|--------------|----------------|--------|
| D-08 | `this.sound.getAllPlaying(key).length` | `this.sound.getAll(key).filter(s => s.isPlaying).length` (or `getAllPlaying().filter(s => s.key === key).length`) | https://docs.phaser.io/api-documentation/class/sound-basesoundmanager — `getAllPlaying()` is no-arg since 3.60.0; `getAll([key])` is the key-filtering method since 3.23.0 |
| D-09 / D-10 (implicit) | Implies you can tween the BGM tracks | Must use `this.sound.add(key, cfg)` to obtain a Sound instance — `sound.play()` returns a boolean and cannot be tweened. Existing `bgm_wave` startup at `GameScene.js:105` must be refactored to the `add` + `play` form for crossfade symmetry. | Phaser API: `BaseSoundManager.add()` returns `Phaser.Sound.WebAudioSound`; `play()` returns boolean (verified ctx7 docs) |
| D-15 (existing) | Shutdown calls `this.sound.stopByKey('bgm_wave')` | Still correct — `stopByKey` works regardless of how the sound was started. But if the planner stores the instance handles, `this._bgmBuild.stop()` is more explicit and parallel to the tween cleanup. | Existing line at `GameScene.js:116`; Phaser API confirms `stopByKey(key)` |

## Common Pitfalls

### Pitfall 1: Tweening a `play()` return value

**What goes wrong:** `this.tweens.add({ targets: this.sound.play('bgm_build', …), volume: 0, … })` silently does nothing because `targets` is `true` / `false`.

**Why it happens:** `BaseSoundManager.play()` returns boolean (success/fail). Only `BaseSoundManager.add()` returns a Sound instance.

**How to avoid:** Always `add` first, store the handle, then `play()`. See Pattern 4.

**Warning signs:** Volume doesn't change on phase transition; no console error.

### Pitfall 2: Naked `events.off('phase-changed')` removes UIScene's HUD listener

**What goes wrong:** If GameScene's shutdown handler does `this.events.off('phase-changed')` (no second arg), it removes ALL listeners on that event — including UIScene's existing HUD-phase listener that shares the same event bus.

**Why it happens:** Phaser's `EventEmitter.off(event)` without a handler removes every listener for that event.

**How to avoid:** Store the handler as a named property (`this._onPhaseChangedBgm`) and pass it to `off`: `this.events.off('phase-changed', this._onPhaseChangedBgm)`. Identical to Phase 5 D-12 precedent at `GameScene.js:122`.

**Warning signs:** HUD's phase indicator stops updating after a GameScene restart (boot → menu → game → game-over → menu → game).

### Pitfall 3: Crossfade tween still alive on phase rapid-fire

**What goes wrong:** If the player triggers `start-wave-early` mid-crossfade, two crossfade tweens stack on the same Sound instance, fighting over `volume` and producing audible warble.

**Why it happens:** No tween-replacement discipline.

**How to avoid:** At the top of the `_onPhaseChangedBgm` handler, destroy any existing crossfade tween before creating the new one. Mirrors Phase 5 D-09 vignette pattern at `GameScene.js:91`.

**Warning signs:** Volume oscillates audibly during phase transitions; tween timeline visibly accelerates/stalls.

### Pitfall 4: Drone audible mid-load (race with unlock)

**What goes wrong:** If the unlock callback fires before the drone audio file finishes decoding, `drone.play()` returns false and the drone never starts.

**Why it happens:** `BootScene` completes decoding before `GameScene.create()` runs in the normal path, but if the asset fails to load, the silent-stub fallback (`generateFallback`, `BootScene.js:127`) substitutes a 1-sample buffer — drone "plays" but is inaudible. This is the desired graceful-degradation behavior, but should be expected, not surprising.

**How to avoid:** Trust the existing fallback. If the drone is silent in dev, check `BootScene.failedKeys` for `ambient_drone` — that's the signal that the file is missing/corrupt, not a code bug.

**Warning signs:** No drone heard, but no console error from playSfx.

### Pitfall 5: Detune ±50 cents on cooldown-throttled SFX still sounds repetitive

**What goes wrong:** Per-key cooldown can suppress 80% of `sfx_shoot` calls, so the surviving 20% are still mostly the same pitch sequence. Detune may be too subtle.

**Why it happens:** Cooldown filters before detune, so the rate at which the player hears unique pitches is `actual fire rate / detune cents space`.

**How to avoid:** Detune ±50 is the documented Phaser-recommended max for "subtle"; CONTEXT.md D-05 picks this. If it still sounds machine-gun in playtest, Claude's Discretion permits dropping to ±30 (less variance) or extending to a wider range — but never beyond ±100 (one semitone) without re-evaluating the SFX list.

**Warning signs:** Player feedback "the shoot sound still feels samey."

## Code Examples

### Example 1: Refactor existing `bgm_wave` startup + add `bgm_build` + drone (single unlock gate)

```js
// Source: composed from project precedent (GameScene.js:105-110) + Phaser API docs (sound.add)

create() {
  // …existing scene setup…

  const startAllAudio = () => {
    this._bgmBuild = this.sound.add(AUDIO.BGM.buildKey, {
      loop: true,
      volume: AUDIO.BGM.buildVolume,    // build is the starting phase
    });
    this._bgmWave = this.sound.add(AUDIO.BGM.waveKey, {
      loop: true,
      volume: 0,                         // wave silent at start
    });
    this._drone = this.sound.add(AUDIO.AMBIENT.key, {
      loop: true,
      volume: AUDIO.AMBIENT.volume,
    });
    this._bgmBuild.play();
    this._bgmWave.play();
    this._drone.play();
  };
  if (this.sound.locked) {
    this.sound.once('unlocked', startAllAudio);
  } else {
    startAllAudio();
  }
}
```

### Example 2: Phase-reactive BGM crossfade (named handler, tween-safety)

```js
// Source: composed from CONTEXT.md D-09/D-10/D-12 + Phase 5 vignette precedent (GameScene.js:89-101)

create() {
  // …after startAllAudio is registered…

  this._onPhaseChangedBgm = (payload) => {
    // Tween-safety: replace any in-flight crossfade
    if (this._crossfadeBuildTween) this._crossfadeBuildTween.destroy();
    if (this._crossfadeWaveTween)  this._crossfadeWaveTween.destroy();

    const buildTarget = payload.phase === 'build' ? AUDIO.BGM.buildVolume : 0;
    const waveTarget  = payload.phase === 'wave'  ? AUDIO.BGM.waveVolume  : 0;

    this._crossfadeBuildTween = this.tweens.add({
      targets: this._bgmBuild,
      volume: buildTarget,
      duration: AUDIO.BGM.crossfadeDuration,
      ease: AUDIO.BGM.crossfadeEase,
    });
    this._crossfadeWaveTween = this.tweens.add({
      targets: this._bgmWave,
      volume: waveTarget,
      duration: AUDIO.BGM.crossfadeDuration,
      ease: AUDIO.BGM.crossfadeEase,
    });
  };
  this.events.on('phase-changed', this._onPhaseChangedBgm);
}
```

### Example 3: Extended `playSfx()` with detune + concurrent cap (CORRECTED API)

```js
// Source: composed from CONTEXT.md D-05/D-06/D-07/D-08 + ctx7-verified Phaser SoundManager API

playSfx(key, config) {
  const now = this.time.now;

  // 1) Existing per-key cooldown (unchanged)
  const cooldown = { sfx_shoot: 80, sfx_splat: 50, sfx_hit: 100, sfx_zap: 100 }[key] || 0;
  if (cooldown > 0) {
    const last = this._sfxCooldowns[key] || 0;
    if (now - last < cooldown) return;
    this._sfxCooldowns[key] = now;
  }

  // 2) Per-key concurrent cap (CORRECTED — getAll(key) + filter, NOT getAllPlaying(key))
  const cap = AUDIO.SFX.perKeyConcurrentCap;
  if (cap > 0) {
    const active = this.sound.getAll(key).filter(s => s.isPlaying).length;
    if (active >= cap) return;
  }

  // 3) Detune (only for keys in detunedKeys)
  let finalConfig = config;
  if (AUDIO.SFX.detunedKeys.includes(key)) {
    const cents = AUDIO.SFX.detuneCents;
    finalConfig = { ...(config || {}), detune: Phaser.Math.Between(-cents, cents) };
  }

  this.sound.play(key, finalConfig);
}
```

### Example 4: Extended shutdown handler (stop + tween destroy + symmetric off)

```js
// Source: composed from CONTEXT.md D-11/D-12/D-15 + Phase 5 shutdown precedent (GameScene.js:115-127)

this.events.once('shutdown', () => {
  // Existing teardown…
  this.sound.stopByKey('bgm_wave');
  this.sound.stopByKey('sfx_victory');
  this.sound.stopByKey('sfx_core_destroyed');
  // New Phase 6 teardown
  if (this._bgmBuild) this._bgmBuild.stop();
  if (this._bgmWave)  this._bgmWave.stop();    // also covers the earlier stopByKey, but symmetric & explicit
  if (this._drone)    this._drone.stop();
  if (this._crossfadeBuildTween) { this._crossfadeBuildTween.destroy(); this._crossfadeBuildTween = null; }
  if (this._crossfadeWaveTween)  { this._crossfadeWaveTween.destroy();  this._crossfadeWaveTween  = null; }
  this.events.off('phase-changed', this._onPhaseChangedBgm);
  // …existing vignette + listener cleanup…
});
```

### Example 5: BootScene additions

```js
// Source: existing pattern in BootScene.js:61-71

// Inside preload(), after the existing audio loads:
this.load.audio('bgm_build', 'assets/audio/bgm_build.ogg');
this.load.audio('ambient_drone', 'assets/audio/ambient_drone.ogg');
```

No `generateFallback` change needed — the existing branch at `BootScene.js:128-129` (`if (key.startsWith('sfx_') || key.startsWith('bgm_'))`) already produces a silent stub for `bgm_build`. The drone key `ambient_drone` does NOT match that prefix check — **planner action item:** extend the failed-asset prefix check to include `ambient_` (or equivalent) so a missing drone gracefully falls back to a silent stub instead of breaking `sound.add('ambient_drone')`.

## Synthesis Fallback (if no CC0 drone is sourced)

If the executor cannot find an acceptable CC0 ambient drone, the contract permits Web Audio synthesis (CONTEXT.md D-01). The minimal recipe:

```js
// Source: standard Web Audio synthesis pattern — [ASSUMED] working idiom, not project-tested
// Run this instead of sound.add('ambient_drone') in startAllAudio.

const ctx = this.sound.context;             // Phaser exposes the AudioContext
const osc = ctx.createOscillator();
osc.type = 'sine';
osc.frequency.value = 55;                   // very low A1; "felt not heard"

const lowpass = ctx.createBiquadFilter();
lowpass.type = 'lowpass';
lowpass.frequency.value = 200;              // remove harshness, keep sub-bass

const lfo = ctx.createOscillator();
lfo.type = 'sine';
lfo.frequency.value = 1 / 8;                // 8-second period gain wobble
const lfoGain = ctx.createGain();
lfoGain.gain.value = 0.05;                  // subtle ±5% gain modulation

const masterGain = ctx.createGain();
masterGain.gain.value = AUDIO.AMBIENT.volume;  // 0.15

lfo.connect(lfoGain);
lfoGain.connect(masterGain.gain);
osc.connect(lowpass).connect(masterGain).connect(ctx.destination);
osc.start();
lfo.start();

// Store nodes for shutdown:
this._droneNodes = { osc, lfo, masterGain };
```

Shutdown (replace `this._drone.stop()`):
```js
if (this._droneNodes) {
  this._droneNodes.osc.stop();
  this._droneNodes.lfo.stop();
  this._droneNodes = null;
}
```

**Confidence:** ASSUMED — standard Web Audio nodes (`OscillatorNode`, `BiquadFilterNode`, `GainNode`) are universally supported in browsers that support Phaser's Web Audio backend. The exact node graph above is a textbook drone synthesizer pattern, but has not been tested in this project. Use only as fallback; prefer a sourced asset.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `sound.play()` for everything | `sound.add()` + handle for long-lived loops; `sound.play()` only for fire-and-forget SFX | Phaser 3.0+ established this; project's existing `bgm_wave` predates the discipline and needs migration in this phase | Required for crossfade — covered in Pattern 4 |
| Manual concurrent tracking via `complete` events | `BaseSoundManager.getAll(key)` / `getAllPlaying()` enumeration | Phaser 3.23.0 (getAll), 3.60.0 (getAllPlaying) | Saves a per-key Set + cleanup discipline |
| Pre-recorded SFX variants for variety | `SoundConfig.detune` per-play | Phaser 3.0+ (Web Audio backend) | Eliminates need for N-variant assets |

**Deprecated/outdated:**
- None in this phase — all reused APIs are current as of Phaser 3.80+/3.90.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Web Audio synthesis fallback recipe (oscillator + biquad + LFO + master gain) works as written in Phaser's `this.sound.context` | Synthesis Fallback | If a node is misconfigured, the fallback is silent; no game break, just no atmospheric drone. Easy to debug in browser. |
| A2 | OGG-format BGM/drone files load and decode in all target browsers (Chromium, Firefox, Safari) without per-browser fallback | Standard Stack (Asset Candidates) | If a target browser rejects OGG, drone/build BGM goes silent (existing fallback covers it). All current 11 files are OGG/WAV mix and ship without issue, so risk is low — but Safari's OGG support has historically lagged. Could need MP3 fallback per-browser if QA hits this. |
| A3 | Phaser tweens.add accepts a Sound instance as `targets` and animates `volume` correctly | Pattern 4, Code Example 2 | If this fails (e.g., Phaser internally rejects the target), the crossfade silently does nothing. Verifiable by browser test in the validation step. Workaround: tween a proxy `{ v: 1 }` object with `onUpdate: t => sound.setVolume(t.getValue())`. |
| A4 | The existing `BootScene.generateFallback` prefix check (`sfx_` || `bgm_`) does NOT match `ambient_drone` and must be extended | Code Example 5 (BootScene additions) | If not extended, a missing drone file produces no fallback stub and `this.sound.add('ambient_drone')` may throw on a missing cache entry. Verifiable by deleting the file and running the build. Mitigation: extend the prefix check to include `ambient_`. |

## Open Questions

1. **Does `tweens.add({ targets: soundInstance, volume })` work directly?**
   - What we know: `volume` is a public mutable number on `WebAudioSound` with a `VOLUME` event. Phase 5 vignette tween targets a similar FX-controller `strength` property successfully.
   - What's unclear: Whether Phaser's tween engine has special-case handling for Sound instances vs. plain objects.
   - Recommendation: Implement the direct form. If validation reveals it doesn't tween, fall back to the proxy `{ v: 1 }` + `onUpdate: t => sound.setVolume(t.getValue())` form. Either way the AUDIO config remains unchanged.

2. **Should the drone fade in over 1-2s or hard-start on unlock?**
   - What we know: Claude's Discretion item. CONTEXT.md leaves to executor.
   - Recommendation: Hard-start. The drone is `volume: 0.15` — perceptually soft enough that a hard start is not jarring. A fade-in adds complexity (another tween to clean up) for no clear gain.

3. **What about Safari OGG support?**
   - What we know: All 11 existing audio files load fine on the project's current target browsers (per absence of any compat issue in STATE.md / open questions). Safari historically lagged on OGG but has supported it natively since iOS 17.5+ / macOS 14.5+.
   - Recommendation: Ship OGG only. If Safari QA reveals issues, MP3 dual-loading is a one-line per-asset change (`this.load.audio(key, ['path.ogg', 'path.mp3'])`) — defer until proven necessary.

## Environment Availability

> Phase 6 is purely code/config + new asset files. No external runtime dependencies introduced.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Phaser 3 (already installed) | All audio behavior | ✓ | ^3.80.0 in package.json | — |
| Vite (already installed) | Build pipeline | ✓ | ^5.4.0 in package.json | — |
| Web Audio API in target browsers | All audio behavior | ✓ | Browser-native (Chromium, Firefox, Safari ≥ 14.5) | Phaser's HTML5AudioSoundManager auto-fallback (transparent) |
| OGG decoder in target browsers | New BGM + drone | ✓ | Browser-native | MP3 dual-load if Safari QA fails (see Open Question 3) |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — all behavior verified against current installed stack.

**Asset acquisition (executor task, not infrastructure):** Two CC0 OGG files must be sourced and placed at `assets/audio/bgm_build.ogg` and `assets/audio/ambient_drone.ogg`. If sourcing fails, either: (a) use the synthesis fallback for the drone, or (b) ship without `bgm_build` — the silent-stub fallback in BootScene means the build phase will simply have no music, which is degraded but not broken.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — project has no test framework per CLAUDE.md and REQUIREMENTS.md "Out of Scope" row |
| Config file | none |
| Quick run command | `npm run build` (catches import/syntax errors only) |
| Full suite command | manual browser QA via `npm run dev` |
| Phase gate | Manual QA checklist below all green + `npm run build` succeeds |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIO-01 | Cosmic ambient drone audio layer plays continuously under BGM throughout GameScene | manual-only | `npm run build` (sanity) + browser QA | no test file (n/a — no framework) |
| AUDIO-02 | SFX have slight pitch variation (random detune) for auditory variety | manual-only | `npm run build` + browser QA: fire 10 turret shots, listen for pitch variance | no test file |
| AUDIO-03 | Concurrent sound limit prevents WebAudio node saturation | manual-only | `npm run build` + browser QA: trigger 8 simultaneous turret fires, confirm no audio crackle and ≤ 4 instances audible | no test file |
| AUDIO-04 | BGM crossfades between calm (build) and intense (wave) tracks | manual-only | `npm run build` + browser QA: observe build→wave transition, confirm overlap ~1.5s with ease-in-out | no test file |

### Manual QA Checklist (each step ≤ 30s)

**Pre-flight:**
- [ ] `npm run build` succeeds with zero errors and zero new warnings.
- [ ] `assets/audio/bgm_build.ogg` exists and decodes (or executor accepted silent-stub fallback).
- [ ] `assets/audio/ambient_drone.ogg` exists and decodes (or synthesis fallback wired).

**AUDIO-01 (drone layer):**
- [ ] Start `npm run dev`, click MainMenu start, enter GameScene.
- [ ] Within 1 second of unlock, drone is audible at low volume under BGM (test by toggling system volume — drone should be present even when BGM is mid-crossfade).
- [ ] Drone continues uninterrupted through at least one full build→wave→build cycle.
- [ ] Restart from GameOver back to GameScene; drone restarts cleanly with no double-instance / phase artifacts.

**AUDIO-02 (SFX detune):**
- [ ] In GameScene with starter turrets present, wait for wave phase, let bugs spawn.
- [ ] Listen to 10+ consecutive `sfx_shoot` events from a single turret. Pitch should vary subtly between plays (clearly different from the perfectly identical pitch heard in Phase 5 baseline).
- [ ] One-shot SFX `sfx_wave_start`, `sfx_victory`, `sfx_core_destroyed` should NOT vary in pitch (verify by triggering each at least twice and comparing).

**AUDIO-03 (concurrent cap):**
- [ ] Use Wave 10 (boss + many bugs) or debug-key spam to trigger 6+ simultaneous turret fires on the same frame.
- [ ] Confirm no audio crackle/clipping (Web Audio node saturation symptom).
- [ ] Open browser DevTools → Console; instrument `playSfx` temporarily (or add a one-line `console.log` of `getAll(key).filter(s => s.isPlaying).length`) and verify the count never exceeds the cap (4).

**AUDIO-04 (BGM crossfade):**
- [ ] Start GameScene, build phase active. `bgm_build` audible at full volume; `bgm_wave` silent.
- [ ] Wait for build timer to expire (or hit `start-wave-early`). Observe: over ~1.5s, `bgm_build` fades down while `bgm_wave` fades up.
- [ ] After wave completes, observe inverse crossfade.
- [ ] Trigger rapid phase changes (use debug keys to artificially complete waves quickly): no audible warble or volume oscillation. Crossfade tweens replace cleanly.
- [ ] On GameOver: `sfx_victory` or `sfx_core_destroyed` plays; both BGM tracks stop. On scene restart: BGM re-initializes correctly.
- [ ] In DevTools → Application → Storage / Memory tab, restart GameScene 10 times. Verify Sound instance count does not grow unboundedly (shutdown handler is removing instances).

### Sampling Rate

- **Per task commit:** `npm run build` (≤10s — catches import/syntax breaks).
- **Per wave merge:** Manual QA checklist above (~5 min).
- **Phase gate:** Full manual QA + `npm run build` clean before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] **Asset acquisition:** sourcing `bgm_build.ogg` and `ambient_drone.ogg` from OpenGameArt CC0 collections. Two candidate URLs each documented in Standard Stack > Asset Candidates. Executor selects and downloads.
- [ ] **BootScene fallback prefix extension:** the existing `generateFallback` check at `BootScene.js:128` matches `sfx_` || `bgm_` only. Either rename `ambient_drone` to `bgm_ambient_drone` (cheap) or extend the check to include `ambient_` (also cheap). Either way, must be done before relying on graceful degradation for the drone.
- [ ] **No new test file framework needed** — phase relies on manual QA per the project's "no test framework" stance. If the project later adopts one, the manual checklist above translates 1:1 into integration-style assertions.

## Sources

### Primary (HIGH confidence)
- Phaser API documentation — `Phaser.Sound.BaseSoundManager` class https://docs.phaser.io/api-documentation/class/sound-basesoundmanager (verified `getAll`, `getAllPlaying`, `isPlaying`, `add`, `locked`, `unlocked` event signatures)
- Phaser API documentation — `Phaser.Sound.WebAudioSound` class https://docs.phaser.io/api-documentation/class/sound-webaudiosound (verified `volume`, `detune`, `loop`, `setVolume`, `setDetune`, `play`, `stop` properties/methods)
- Phaser API documentation — `Phaser.Types.Sound.SoundConfig` https://docs.phaser.io/api-documentation/namespace/types-sound (verified `detune`, `volume`, `loop` fields)
- Phaser API documentation — TweenManager `add()` https://docs.phaser.io/api-documentation/class/tweens-tweenmanager (verified `targets` accepts arbitrary objects)
- Project source: `src/scenes/GameScene.js`, `src/scenes/BootScene.js`, `src/config/GameConfig.js` (verified existing patterns: unlock-gating at line 105-110, shutdown handler 115-127, frozen-config exports, named-listener Phase 5 D-12 precedent)
- Project source: `package.json` (verified `phaser: ^3.80.0`, `vite: ^5.4.0`)

### Secondary (MEDIUM confidence)
- OpenGameArt CC0 ambient drone catalog https://opengameart.org/content/sci-fi-drone-loop and https://opengameart.org/content/cc0-background-ambience (asset candidates — actual quality/loop-seamlessness must be confirmed by executor on download)
- OpenGameArt CC0 calm space music collection https://opengameart.org/content/cc0-space-music and https://opengameart.org/content/our-expanse and https://opengameart.org/content/cc0-calm-relaxing-music (build BGM candidates)
- Tween-on-Sound-instance pattern (Pattern 4) — high confidence Phaser exposes the necessary public property; medium confidence on the exact `tweens.add` form working without proxy. Mitigation documented (proxy + onUpdate) if direct form fails.

### Tertiary (LOW confidence)
- Web Audio synthesis fallback (Synthesis Fallback section) — textbook drone-synthesizer recipe but ASSUMED for this project; not project-tested.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; Phaser APIs all verified via ctx7 docs.
- Architecture: HIGH — every pattern has a direct project-local precedent (Phase 5 vignette tween, named listeners, unlock gating, frozen config siblings).
- Pitfalls: HIGH — pitfalls 1-3 are direct API/event-bus mechanics; pitfalls 4-5 are ergonomic warnings with documented escape hatches.
- API corrections: HIGH — both corrections verified against Phaser docs ctx7 lookup.
- Asset sourcing: MEDIUM — concrete CC0 candidates documented but final selection requires executor to listen and confirm loop-seamlessness.
- Synthesis fallback: LOW (ASSUMED) — standard Web Audio recipe, not project-tested. Marked clearly in Assumptions Log.

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (30 days — Phaser API surface is stable at 3.80+; only asset-availability churn could invalidate the asset candidate links)
