---
phase: 02-living-entities
verified: 2026-04-16T00:00:00Z
status: passed
signed_off: 2026-04-20
score: 4/4
overrides_applied: 0
human_verification:
  - test: "Run npm run dev and open http://localhost:5173. Watch the command core (center of grid) for a slow in-and-out scale pulse (~6%, ~1.8s cycle, calm breathing feel)."
    expected: "Core sprite gently scales up and returns in a sinusoidal loop."
    why_human: "Visual scale animation cannot be verified programmatically."
  - test: "Place any non-wall turret (blaster, zapper, slowfield, spitter). Observe sprite alpha."
    expected: "Sprite fades between ~75% and 100% alpha in a 1.2-second cycle continuously."
    why_human: "Alpha tween is runtime behavior; cannot be asserted from source alone."
  - test: "Upgrade a turret. Compare its glow to a non-upgraded turret."
    expected: "Upgraded turret pulse reaches slightly lower opacity (~65%) and completes its cycle faster (~0.9s), feeling more energized."
    why_human: "Relative visual difference between base and upgraded pulse requires human judgment."
  - test: "Start a wave. Observe swarmer bugs moving — note squash-stretch jitter. Observe brute bugs — expect slower, smaller wobble. Observe spitter bugs — expect medium-speed rhythmic pulse."
    expected: "Each bug type has a visually distinct animation signature. Bugs do not pulse in lockstep."
    why_human: "Per-type visual distinction and phase randomness require human observation."
  - test: "Let a wave complete and start a second wave. Check that reused bugs from the pool appear normally scaled."
    expected: "No bugs display stretched, compressed, or obviously wrong scale at spawn."
    why_human: "Object pool reuse artifact (stale scale) is only observable at runtime."
---

# Phase 2: Living Entities — Verification Report

**Phase Goal:** Bugs animate, core breathes, turrets pulse — everything feels alive
**Verified:** 2026-04-16
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Bugs wobble and squash/stretch as they move | VERIFIED | `_baseScale`, `_animPhase`, `Math.sin` squash-stretch block in Bug.preUpdate() lines 252-255; `scaleY = this._baseScale / wobble` confirmed |
| 2 | Command core pulses with breathing animation (sinusoidal scale) | VERIFIED | `baseScale = this.coreSprite.scaleX` + infinite yoyo tween (duration 1800, repeat -1) in GameScene.renderCore() lines 114-122 |
| 3 | Turrets have idle glow that pulses slowly at rest | VERIFIED | `idleTween` initialized null, created for `type !== 'wall'` (alpha 0.75→1.0, 1200ms, repeat -1) in Turret constructor lines 42-52 |
| 4 | Different bug types have distinct animation signatures | VERIFIED | All 4 BUGS entries have distinct `anim: Object.freeze({ frequency, amplitude })` — swarmer 0.012/0.12, brute 0.004/0.06, spitter 0.007/0.09, boss 0.002/0.04 |

**Score:** 4/4 truths verified (automated). Visual confirmation pending.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/config/GameConfig.js` | anim sub-object on all 4 BUGS entries | VERIFIED | 4 occurrences of `anim: Object.freeze` at lines 63, 72, 82, 91 |
| `src/entities/Bug.js` | sin-wave squash-stretch in preUpdate, base scale reset in spawn | VERIFIED | `_baseScale` and `_animPhase` set in spawn() lines 41-44; wobble block in preUpdate() lines 252-255 |
| `src/scenes/GameScene.js` | Core breathing tween started in renderCore() | VERIFIED | `repeat: -1` tween at lines 115-123; `baseScale = this.coreSprite.scaleX` at line 114 |
| `src/entities/Turret.js` | idleTween lifecycle (create/replace/destroy) | VERIFIED | 8 occurrences of `idleTween`; null-init, wall guard, create, upgrade-replace, destroy all present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/config/GameConfig.js BUGS[type].anim` | `src/entities/Bug.js preUpdate` | `BUGS[this.bugType].anim` read each frame | WIRED | Line 252: `const anim = BUGS[this.bugType].anim;` confirmed |
| `src/entities/Turret.js constructor` | `this.sprite alpha tween` | `scene.tweens.add targeting this.sprite` | WIRED | Line 44: `this.idleTween = scene.tweens.add({...})` confirmed |
| `src/entities/Turret.js destroy()` | `this.idleTween.destroy()` | null-check before destroy, before this.sprite.destroy() | WIRED | Lines 314-316: null-check and destroy before sprite.destroy() confirmed |

### Data-Flow Trace (Level 4)

Not applicable — this phase implements procedural animation driven by time/delta. No external data source or store; animation parameters flow from GameConfig constants directly into game object transform properties each frame.

### Behavioral Spot-Checks

Step 7b: SKIPPED — animation behavior requires a running browser context with a live Phaser canvas. Cannot assert visual output from static analysis or CLI.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ANIM-01 | 02-01-PLAN.md | Wobble and squash-stretch on all bug types in Bug.preUpdate() | SATISFIED | sin-wave block in preUpdate; all 4 bug types covered via BUGS[type].anim |
| ANIM-02 | 02-02-PLAN.md | Breathing/pulse animation on command core sprite | SATISFIED | Infinite yoyo scale tween in GameScene.renderCore() |
| ANIM-03 | 02-02-PLAN.md | Idle glow pulse on turrets, brighter on upgraded | SATISFIED | idleTween lifecycle in Turret: base 0.75→1.0/1200ms, upgraded 0.65→1.0/900ms |
| ANIM-04 | 02-01-PLAN.md | Bug type-specific animation signatures | SATISFIED | Distinct frequency/amplitude per type in BUGS config; read in preUpdate each frame |

All 4 phase requirement IDs (ANIM-01, ANIM-02, ANIM-03, ANIM-04) are covered. REQUIREMENTS.md traceability table marks all four Complete. No orphaned requirements.

Note: ANIM-05 (kill orphaned tweens in Bug.despawn()) is listed in REQUIREMENTS.md as Phase 1 / Complete — it is not in scope for Phase 2 and requires no action here.

### Anti-Patterns Found

No blockers or stubs found in modified files. All implementations contain real math/tween logic, no TODO/placeholder patterns, no hardcoded empty returns.

### Human Verification Required

All automated code checks pass. The following require browser-based visual confirmation because animation quality and correctness cannot be asserted from source analysis alone.

#### 1. Core Breathing Animation (ANIM-02)

**Test:** Run `npm run dev`, open http://localhost:5173, watch the command core at the center of the grid.
**Expected:** Core sprite pulses slowly in and out — scale increases ~6% and returns over ~1.8 seconds. Should feel like calm breathing, not jarring.
**Why human:** Visual scale animation with perceptual quality judgment.

#### 2. Turret Base Idle Glow (ANIM-03)

**Test:** Place any non-wall turret (blaster, zapper, slowfield, spitter). Observe sprite alpha.
**Expected:** Sprite fades smoothly between ~75% and 100% alpha in a continuous 1.2-second cycle.
**Why human:** Alpha tween is runtime behavior.

#### 3. Upgraded Turret Glow Distinction (ANIM-03)

**Test:** Upgrade a placed turret, then compare its pulse visually to a non-upgraded turret.
**Expected:** Upgraded turret reaches lower opacity (~65%) and completes cycles faster (~0.9s) — more energized feel.
**Why human:** Relative visual comparison requires human judgment.

#### 4. Bug Animation Variety (ANIM-01, ANIM-04)

**Test:** Start a wave. Observe swarmers (jittery), brutes (slow heavy), and spitters (rhythmic) in motion.
**Expected:** Each type has visually distinct wobble speed and amplitude. Bugs in the same wave should not all pulse at exactly the same phase.
**Why human:** Per-type visual distinction and stochastic phase spread require observation.

#### 5. Bug Pool Reuse — No Stale Scale (ANIM-01)

**Test:** Let a wave fully complete, then start a second wave.
**Expected:** Newly spawned bugs from the pool appear with correct, un-stretched scale — no visual artifacts from a prior life.
**Why human:** Pool reuse artifact is only observable at runtime across wave boundaries.

### Gaps Summary

No automated gaps. All 4 truths verified, all 4 requirements satisfied, all key links wired. The only outstanding items are visual/runtime checks that require human observation in a browser. Status is `human_needed` because the plan itself (02-02-PLAN Task 3) specified a blocking human visual checkpoint, and the SUMMARY marked it "auto-approved" without documented human sign-off.

---

_Verified: 2026-04-16T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
