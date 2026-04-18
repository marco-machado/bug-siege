# Phase 6: Ethereal Audio - Discussion Log (Auto Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 06-ethereal-audio
**Mode:** discuss --auto (single-pass, recommended-default selection)
**Areas analyzed:** Asset Sourcing, AUDIO Config, SFX Pitch Variation, Concurrent Sound Limit, BGM Crossfade, Ambient Drone Layering, Phase-1 Dependency Resolution

---

## Asset Sourcing (AUDIO-01, AUDIO-04)

| Option | Description | Selected |
|--------|-------------|----------|
| CC0 OGG from OpenGameArt / Free Music Archive | Mirrors existing pattern (all 11 current audio files are CC0 OGG); two new files needed (`bgm_build`, `ambient_drone`); seamless loops required | ✓ |
| Web Audio synthesis (no asset files) | Generate drone procedurally via OscillatorNodes; zero asset weight; harder tonal control | |
| Mix: synth drone + sourced BGM | Hybrid approach; more code surface than single-strategy | |

**User's choice:** CC0 OGG — recommended default per --auto.
**Notes:** Web Audio synthesis listed as documented fallback in D-01 if no suitable CC0 drone is sourced.

---

## AUDIO Config Object Location

| Option | Description | Selected |
|--------|-------------|----------|
| New top-level `AUDIO` frozen object in `GameConfig.js` | Sibling of THEME / VFX / POSTFX; matches established separation-of-concerns pattern | ✓ |
| Nest under THEME (THEME.audio) | Matches the literal ROADMAP wording but conflicts with established sibling pattern | |
| Per-feature inline constants (no central config) | Minimal but fragments tunables; breaks frozen-config convention | |

**User's choice:** New top-level AUDIO — recommended default per --auto.
**Notes:** Resolves the Phase 1 dependency mismatch (Phase 1 never added THEME.audio — Phase 6 creates the config block here).

---

## SFX Pitch Variation Scope (AUDIO-02)

| Option | Description | Selected |
|--------|-------------|----------|
| ±50 cents on repetitive SFX only (shoot/zap/splat/hit/build/sell/select) | Breaks "machine gun monotone" feel; preserves recognizable signature on one-shots (wave_start/victory/core_destroyed) | ✓ |
| ±100 cents (full semitone) on all SFX | More obvious variation but musically distinct shots and altered one-shot signatures | |
| ±25 cents on all SFX | Subtler, but one-shot signatures still slightly drift each play | |

**User's choice:** ±50 cents on repetitive SFX only — recommended default per --auto.
**Notes:** Implementation lives in existing `playSfx()` method (D-06), no new module.

---

## Concurrent Sound Limit Strategy (AUDIO-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Per-key concurrent cap of 4, layered with existing cooldown | Cooldown throttles rate; cap throttles simultaneity (boss waves with 6-8 co-firing turrets); reuses Phaser `sound.getAllPlaying(key)` | ✓ |
| Global concurrent cap (e.g., 16 total sounds) | Simpler tracking but doesn't prevent same-key flooding | |
| Per-key cap of 2 | Stricter but may swallow important shots in dense combat | |

**User's choice:** Per-key cap of 4 — recommended default per --auto.
**Notes:** Cap-tracking lives in `playSfx()` alongside cooldown map (D-08).

---

## BGM Crossfade Implementation (AUDIO-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Both tracks loop continuously, only volumes tween | No restart pops; positions stay in-sync; simplest coordination | ✓ |
| Stop one track / start the other on phase-changed | Saves CPU on the silent track but introduces position-restart artifacts | |
| Single dynamic-mix track | Eliminates crossfade entirely but requires custom asset authoring | |

**User's choice:** Both tracks always playing, volume-only tween — recommended default per --auto.
**Notes:** 1500ms / Sine.easeInOut (D-10), mirrors Phase 5 D-09 vignette tween pattern.

---

## Ambient Drone Layering (AUDIO-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Separate continuous loop at ~0.15 volume | "Felt not heard"; constant atmosphere across phases; independent of BGM crossfade | ✓ |
| Bake drone into both BGM tracks | One fewer Howl/AudioBuffer instance but couples drone tonality to BGM source files | |
| Phase-reactive drone (intensity tweens with phase) | More dynamic but doubles tween coordination cost | |

**User's choice:** Separate continuous loop, ~0.15 volume — recommended default per --auto.
**Notes:** GameScene-only per Phase 5 D-14 pattern — boundary scenes stay simple.

---

## Phase-1 Dependency Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Resolve in Phase 6 by creating AUDIO config block | No Phase 1 retrofit; cleanest forward motion | ✓ |
| Retroactively add THEME.audio to Phase 1 | Honors the ROADMAP wording literally but introduces phase-boundary churn for already-shipped Phase 1 | |
| Skip the dependency (treat as ROADMAP error) | Loses the rationale for centralized audio config | |

**User's choice:** Resolve in Phase 6 — recommended default per --auto.
**Notes:** Dependency mismatch documented in CONTEXT.md D-03; the AUDIO config object IS the deliverable that satisfies the upstream dependency.

---

## Auto-Resolved Items

All gray areas auto-selected and auto-resolved with the recommended default option per `--auto` flag. No questions surfaced to the user during this single-pass run.

## External Research

None performed. Codebase analysis (existing `playSfx`, BootScene loading pattern, prior CONTEXT.md decisions) provided sufficient evidence for all decisions. Asset sourcing for the two new tracks (`bgm_build`, `ambient_drone`) is a planner/executor task; the contract is "calm cosmic for build, intense cosmic for wave, low-volume drone for atmosphere."

## Claude's Discretion (carried forward to planning)

- Exact crossfade curve fine-tuning beyond 1500ms / Sine.easeInOut
- Drone volume fine-tuning around 0.15 starting point
- Detune range fine-tuning around ±50 cents
- Drone fade-in vs hard-start on audio context unlock
- CC0 track selection (specific URLs)
