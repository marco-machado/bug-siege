---
phase: 03
slug: 03-juicy-combat
audited: 2026-04-16
baseline: 03-UI-SPEC.md (retrospec — written after implementation shipped)
screenshots_captured: false
screenshots_rationale: "Phaser canvas VFX are frame-transient; static screenshots cannot evaluate particle timing, lifespan, or juice. Audit performed via code comparison (UI-SPEC values vs GameConfig.js, GameScene.js, Turret.js)."
---

# Phase 3 — UI Review: Juicy Combat

**Audited:** 2026-04-16
**Baseline:** `03-UI-SPEC.md` (retroactive spec — see Drift Taxonomy below)
**Screenshots:** not captured (temporal VFX unsuitable for static capture; audit is code-first)

---

## Drift Taxonomy

This phase's audit has two drift classes. They are scored differently.

| Class | Meaning | Who caused it |
|-------|---------|---------------|
| **A — Retrospec drift** | UI-SPEC was authored AFTER Phase 3 shipped. Values in the spec don't match GameConfig.js on purpose; the spec represents the intended upgrade target, not the shipped state. Expected and acknowledged. | Process — spec order |
| **B — Plan-vs-shipped deviations** | The executor did NOT follow what `03-02-PLAN.md` / `03-03-PLAN.md` actually specified. These are real implementation gaps independent of the later spec. | Executor |

Findings flag each drift by class. Pillar scores weight Class B heavily; Class A drift is documented but deducted only when it represents an explicit spec contract (e.g., the "MUST PRESERVE" accent clause in UI-SPEC §Color).

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Inherited from Phase 1; phase introduces zero new copy |
| 2. Visuals | 2/4 | Missing `explode()` call and `emitting: false` on all 3 emitters (Class B); no `blendMode: 'ADD'`; 1 particle texture vs 4 spec'd; boss is 1-emitter not 2-emitter staged; shockwave has ring-only, no sparks |
| 3. Color | 2/4 | Accent contract violated on 3 of 5 declared events (muzzle, placement sparkle 50% of the time, shockwave); VFX palette drift from spec values (Class A, but `THEME.accent` violation is a MUST) |
| 4. Typography | 4/4 | Inherited from Phase 1; phase introduces no text |
| 5. Spacing | 4/4 | Inherited from Phase 1; phase introduces no layout |
| 6. Experience Design (VFX feedback quality) | 2/4 | All 5 events do fire — feedback exists. But the missing `explode()` means particles trickle over the lifespan rather than bursting instantly, which is the central juice defect. Missing ADD blend mode flattens visual impact against the dark nebula background. |

**Overall: 18/24**

---

## Top 3 Priority Fixes

1. **Add `emitting: false` + `emitter.explode(cfg.count, x, y)` to all three emitters** (Class B plan deviation) — `showBugDeathEffect` (`src/scenes/GameScene.js:336-352`), `showBuildFlash` (`src/scenes/GameScene.js:354-366`), and `showMuzzleFlash` (`src/entities/Turret.js:241-255`). The plans (03-02 Task 1 acceptance criteria line; 03-03 Task 1 acceptance criteria line) explicitly required both. Without them the emitter auto-starts and emits at the default `frequency` (one particle per frame), so a bug death "burst" actually dribbles 10 particles across ~350ms instead of bursting in frame 1. This is the single largest juice defect in the shipped implementation and is a one-line fix per emitter.

2. **Add `blendMode: 'ADD'` to all three emitter configs** (Class A spec deviation, large visual payoff) — UI-SPEC §VFX Contract specifies `blendMode: ADD` on every particle event. The shipped code uses Phaser's default (NORMAL). Against the `#0a0a12` dark nebula background, ADD blend produces the bright "lens bloom" feel the spec targets; NORMAL produces flat opaque dots that read as dark blobs in the most colorful moments. Fix: add one key per emitter config object — same fix site as #1.

3. **Fix the `THEME.accent` contract violations on muzzle flash and placement sparkle** (Class A drift, but breaks an explicit "MUST PRESERVE" clause in UI-SPEC §Color) — `VFX.MUZZLE.tint` is `0xffffaa` (yellow cream) at `src/config/GameConfig.js:153` but the spec requires `THEME.accent` = `0xeef2ff` (lavender-white) at line 139. `VFX.BUILD.tints` mixes `0x9966ff` and `0xeef2ff` 50/50 at line 160; spec requires accent only. Both violations were called out explicitly in UI-SPEC §Color "MUST PRESERVE" block. Fix: change muzzle `tint` to `0xeef2ff`, change build `tints` to `[0xeef2ff]` (single-element array) or swap to plain `tint: 0xeef2ff`.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

UI-SPEC inherits all copy from Phase 1. Phase 3 introduces zero text, zero CTA labels, zero empty states, zero error states. Grep across modified files confirms no string literals beyond existing `'particle'` texture key. Nothing to audit, nothing to fix.

**Evidence:** UI-SPEC §Inherited from Phase 1 table declares Copywriting delta: none. Files modified in this phase (GameConfig.js:142-172, BootScene.js:113-119, GameScene.js:336-393, Turret.js:241-255) contain no user-facing strings.

### Pillar 2: Visuals (2/4)

Four distinct visual defects, spanning both drift classes.

**Defect V-1 (Class B, critical) — Missing `explode()` and `emitting: false` on all three emitters.**
- `src/scenes/GameScene.js:336-352` `showBugDeathEffect` — no `emitting: false`, no `explode()` call.
- `src/scenes/GameScene.js:354-366` `showBuildFlash` — same.
- `src/entities/Turret.js:241-255` `showMuzzleFlash` — same.

Phaser's default emitter starts emitting on creation at the default `frequency` (0 = one per frame, continuous). The shipped code only sets `maxParticles`, which caps the total — it does NOT make the emission instant. Result: the 10-particle bug death burst actually trickles ~10 particles over ~10 frames (~167ms at 60fps) rather than exploding as a single-frame burst. The plan explicitly required `emitting: false` + `emitter.explode(cfg.count, x, y)` (03-02-PLAN.md Task 1 action block, lines 86-127; 03-03-PLAN.md Task 1 action block lines 80-96). The self-check in 03-02-SUMMARY.md reports these as passing, but grep for `explode(` and `emitting:` across src/ returns zero matches — the self-check was on the wrong grep pattern.

**Defect V-2 (Class A) — `blendMode: 'ADD'` absent on all emitters.**
UI-SPEC specifies ADD blend mode in every single VFX event table (lines 100, 119, 139, 161, 184). GameScene.js and Turret.js emitter configs set no `blendMode` key. Phaser defaults to NORMAL. Visual consequence: particles composite opaquely over the dark nebula and read as dim grey/colored blobs rather than as glowing sparks.

**Defect V-3 (Class A) — Single particle texture vs four spec'd.**
UI-SPEC §Texture Registry declares `particle-soft` (16×16), `particle-spark` (16×16 sparkle star), `particle-ring` (64×64 stroked), `particle-glow` (20×20 brighter dot). Shipped code has one texture, `particle` (4×4 white dot, BootScene.js:113-119). Consequences: placement sparkle lacks the star shape (currently a round dot, not a twinkle), shockwave uses a Graphics object instead of a ring sprite (works, but differs from contract), boss inner emitter can't use the brighter glow variant. All five events share the same 4×4 dot with only tint/scale varying.

**Defect V-4 (Class A) — Boss death uses 1 emitter not 2 staged emitters.**
UI-SPEC Event 5 mandates a 2-emitter boss burst: outer (36 particles, immediate) + inner (24 particles, delayed 300ms) with a 3-color ramp `#ff4a6e → #c084fc → #eef2ff` over lifetime. Shipped code (GameScene.js:336-352) treats boss as a single case with `color: [0x44ff44, 0xff4444, 0xff8844, 0x9900ff]` — a static palette-sample array, not a temporal ramp, and from a different color set (green/red/orange/violet, not rose/violet/white). 30 particles total vs the spec's 60. No 300ms delayed second emitter.

**Defect V-5 (Class A) — Core shockwave ring-only, no radial sparks.**
UI-SPEC Event 4 mandates "two parts: a ring sprite + a radial spark burst" (line 144) with 12 spark particles at `#eef2ff`, 400ms lifespan, speed 100-260 px/s. Shipped code (`showCoreShockwave` GameScene.js:368-393) only creates the expanding ring — the 12-particle radial burst accompanying it is entirely absent. The ring itself works correctly.

### Pillar 3: Color (2/4)

Color has both Class A palette drift and Class A contract violations. The contract violations are weighted heavier because UI-SPEC §Color has an explicit "MUST PRESERVE" block.

**Defect C-1 (Class A, contract violation) — Muzzle flash tint violates `THEME.accent` MUST.**
- UI-SPEC Event 2 line 115: `tint: THEME.accent (#eef2ff)`.
- UI-SPEC §Accent Drift Note line 62: "All new VFX (placement sparkle, muzzle flash, boss white-flash frame) MUST read from THEME.accent resolving to #eef2ff."
- Shipped: `VFX.MUZZLE.tint = 0xffffaa` at `src/config/GameConfig.js:153` (yellow cream, NOT the accent).
- This is a direct breach of a MUST-level contract in the spec.

**Defect C-2 (Class A, contract violation) — Placement sparkle tint violates `THEME.accent` MUST.**
- UI-SPEC Event 3 line 134: `tint: THEME.accent (#eef2ff)`.
- Shipped: `VFX.BUILD.tints = [0x9966ff, 0xeef2ff]` at `src/config/GameConfig.js:160`, and `showBuildFlash` (GameScene.js:356) picks one at random per burst — so ~50% of placement sparkles use `0x9966ff` (nebula violet) instead of the accent.
- Same MUST-level clause as C-1. Half-compliant is not compliant.

**Defect C-3 (Class A, palette drift) — Regular bug death tints don't match spec.**
| Bug type | Spec value | Shipped value |
|----------|------------|----------------|
| swarmer | `#00ff88` (mint, per spec line 52) | `0x44ff44` (grass green) |
| brute | `#ff4a6e` (rose) | `0xff4444` (pure red) |
| spitter | `#ffa34d` (warm orange) | `0xff8844` (darker orange) |

Both palettes are internally coherent — neither ships broken — but the spec's saturated/web-safe palette is not what shipped.

**Defect C-4 (Class A, palette drift) — Shockwave color violates accent.**
- UI-SPEC Event 4 line 158: `tint: #eef2ff` on both the ring and the sparks.
- Shipped: `VFX.SHOCKWAVE.color = 0x9966ff` at `src/config/GameConfig.js:169` (nebula violet).
- The shockwave is declared as an `accent-aligned` event in UI-SPEC Color table row 6.

**Defect C-5 (Class A, palette drift) — Boss death palette mismatch (documented under V-4).**
Spec wants rose/violet/white temporal ramp; shipped has green/red/orange/violet static sample. Both scored under V-4 for the emitter structure; noted here for completeness.

**Color audit summary.** 3 of 5 declared VFX events violate the `THEME.accent` MUST contract in whole or in part (muzzle, half of placement, shockwave). 2 of 5 use divergent palette (bug death, boss). `THEME.accent` itself is correctly set to `#eef2ff` at GameConfig.js:139. Out-of-scope `#00ff88` mint usage in unrelated UI (MainMenuScene, UIScene, GameOverScene, BuildSystem) is acknowledged in the spec as Phase 7 reconciliation; NOT flagged here.

### Pillar 4: Typography (4/4)

UI-SPEC inherits from Phase 1. Phase 3 introduces no text nodes. The only font-related code in files modified this phase is the pre-existing loading-bar text in `src/scenes/BootScene.js:24-28`, unchanged by Phase 3. No audit finding.

### Pillar 5: Spacing (4/4)

UI-SPEC inherits from Phase 1. Phase 3 introduces no layout or spacing changes. Particle emission zones use `GRID.tileSize` (64px) consistent with the grid scale for the placement sparkle emit zone, matching UI-SPEC Event 3 line 135. No audit finding.

### Pillar 6: Experience Design — VFX Feedback Quality (2/4)

This pillar scores the felt-quality of the shipped VFX as interaction feedback for player actions. All 5 declared events fire, so feedback exists at a functional level — a score of 1/4 would be unjust. However, three systemic defects keep it from passing.

**E-1 (highest impact) — Missing `explode()` collapses the burst feel.** Cross-reference V-1. A bug death emitter with `maxParticles: 10` and no `explode()` call behaves as a slow drip: roughly one particle per frame for the emitter's lifetime, not a single-frame shockwave. Juicy combat VFX rely on the player's brain registering "instant explosion → debris flies → fades" in that order; the shipped ordering is "explosion fades in → debris fades out simultaneously," which reads as a soft wipe, not a kill. Worst on muzzle flash (80ms lifespan): the 5 muzzle particles are spread over ~5 frames so the peak brightness is 1/5 of intended.

**E-2 — Missing ADD blend mode flattens impact against dark nebula.** Cross-reference V-2. On the `#0a0a12` background, NORMAL-blended `#44ff44` particles read at approximately 40% of the perceived brightness of ADD-blended ones, because ADD saturates RGB channels toward white/1.0 over dark pixels. The UI-SPEC calls ADD blend "juicier" and targets it for WebGL+Canvas parity.

**E-3 — Event wiring shortcut instead of the declared pub/sub architecture.** UI-SPEC §Event Wiring Summary declares three new events: `turret-fired`, `turret-placed`, `core-damaged`. None exist in the shipped code (grep returns zero matches). Instead, Phase 3 uses direct method calls:
- `Turret.fire()` calls `this.showMuzzleFlash()` directly (`src/entities/Turret.js:145`).
- `BuildSystem` calls `this.scene.showBuildFlash(...)` directly (`src/systems/BuildSystem.js:168`).
- `GameScene.damageCore()` calls `this.showCoreShockwave(...)` directly (`src/scenes/GameScene.js:284`).

The direct-call pattern works but breaks the project convention documented in CLAUDE.md ("Events drive state sync") and in UI-SPEC §Event Wiring Summary ("New events MUST follow the existing event-driven architecture convention"). This is a Class A architecture deviation — not a visible juice defect, but a maintenance liability for Phase 4 which needs to stack camera-shake listeners on the same events.

**What works well.** The shockwave ring itself is correct: start/end radius (30→120px), Power2 ease, 400ms duration, ring.destroy() on tween complete (GameScene.js:368-393). Ring-count threshold (`damageAmount >= 20 ? 2 : 1`) is an undocumented improvement over the spec. Memory hygiene is consistently good — every emitter/ring has a destroy callback.

---

## Class A Drift Table (for Phase 7 reconciliation)

Summary of all shipped-vs-spec value deltas, for the later reconciliation pass. Not all of these need Phase 3 rework; some are simply inventory.

| Category | Spec (UI-SPEC) | Shipped (GameConfig.js) | Class | Fix priority |
|----------|----------------|--------------------------|-------|-------------|
| Bug-death particle count | 18 | 10 | A | low |
| Bug-death lifespan | 600ms | 350ms | A | low |
| Bug-death scale range | 0.6 → 0.0 | 0.8 → 0.3 | A | low |
| Muzzle particle count | 8 | 5 | A | low |
| Muzzle lifespan | 150ms | 80ms | A | medium |
| Muzzle scale range | 0.5 → 0.15 | 1.0 → 0.3 | A | medium |
| Muzzle cone spread | ±25° | ±30° | A | low |
| Muzzle tint | `#eef2ff` (accent MUST) | `0xffffaa` | A (MUST) | **high** |
| Placement sparkle count | 20 | 12 | A | low |
| Placement sparkle lifespan | 700ms | 400ms | A | low |
| Placement sparkle texture | `particle-spark` (star) | `particle` (dot) | A | medium |
| Placement sparkle tint | `#eef2ff` (accent MUST) | `[0x9966ff, 0xeef2ff]` random | A (MUST) | **high** |
| Placement sparkle emit zone | 64×64 rectangle | point | A | low |
| Placement sparkle spin | 0 → 180°/s random | none | A | low |
| Shockwave texture | `particle-ring` sprite | Graphics strokeCircle | A | low (functional) |
| Shockwave radial sparks | 12 at `#eef2ff` | absent | A | medium |
| Shockwave ring tint | `#eef2ff` | `0x9966ff` | A | medium |
| Shockwave duration | 700ms | 400ms | A | low |
| Boss emitter count | 2 (outer + inner delayed 300ms) | 1 | A | medium |
| Boss total particles | 60 | 30 | A | medium |
| Boss color scheme | 3-color temporal ramp (rose→violet→white) | static 4-color sample (green/red/orange/violet) | A | medium |
| Boss lifespan | 1200ms (outer) / 900ms (inner) | 600ms | A | medium |
| Blend mode (all events) | `ADD` | default NORMAL | A | **high** |
| Texture count | 4 (soft/spark/ring/glow) | 1 (particle) | A | medium |
| Event wiring | 3 new events (pub/sub) | 0 new events (direct calls) | A | medium |

## Class B Deviation Table (plan-vs-shipped defects)

Summary of where executor did not match the plan they were given, separate from retrospec drift.

| File | Plan clause | Shipped | Impact |
|------|-------------|---------|--------|
| `src/scenes/GameScene.js:336-352` (showBugDeathEffect) | 03-02-PLAN.md Task 1 requires `emitting: false` in config and `emitter.explode(cfg.count, x, y)` after creation | Both absent | Particles trickle over lifespan instead of instant burst |
| `src/scenes/GameScene.js:354-366` (showBuildFlash) | Same plan clause | Both absent | Same |
| `src/entities/Turret.js:241-255` (showMuzzleFlash) | 03-03-PLAN.md Task 1 requires `emitting: false` + `emitter.explode(cfg.count, tip.x, tip.y)` | Both absent | Muzzle flash is 5 particles over 5 frames instead of 5 in frame 1 |
| `src/scenes/GameScene.js:336-352` self-check (03-02-SUMMARY.md line 84) | Self-check claims `emitter.on('complete'` appears 2 times — this is TRUE but not the plan's actual acceptance criterion | Self-check passed on partial criterion | Verification gap — plan acceptance listed both `emitter.on('complete'` AND `emitter.explode(cfg.count, x, y)` |

---

## Registry Safety

shadcn not applicable — game project uses first-party Phaser 3 ParticleEmitter API only. UI-SPEC §Registry Safety declares no third-party registries. Registry audit skipped per `<registry_audit>` gate.

---

## Files Audited

Upstream / contract:
- `/Users/machado/Projects/bug-siege/.planning/phases/03-juicy-combat/03-UI-SPEC.md` (baseline)
- `/Users/machado/Projects/bug-siege/.planning/phases/03-juicy-combat/03-CONTEXT.md` (decisions)
- `/Users/machado/Projects/bug-siege/.planning/phases/03-juicy-combat/03-01-PLAN.md`, `03-02-PLAN.md`, `03-03-PLAN.md`
- `/Users/machado/Projects/bug-siege/.planning/phases/03-juicy-combat/03-01-SUMMARY.md`, `03-02-SUMMARY.md`, `03-03-SUMMARY.md`

Shipped implementation (inspected line-by-line):
- `/Users/machado/Projects/bug-siege/src/config/GameConfig.js` (VFX config: lines 142-172; THEME: 136-140)
- `/Users/machado/Projects/bug-siege/src/scenes/BootScene.js` (`generateParticleTextures` lines 113-119)
- `/Users/machado/Projects/bug-siege/src/scenes/GameScene.js` (`showBugDeathEffect` 336-352; `showBuildFlash` 354-366; `showCoreShockwave` 368-393; `damageCore` wire-in 265-291)
- `/Users/machado/Projects/bug-siege/src/entities/Bug.js` (`die` and `bug-killed` emit: 164-172)
- `/Users/machado/Projects/bug-siege/src/entities/Turret.js` (`showMuzzleFlash` 241-255; fire wire-in 138-146; fireZapper wire-in 148-179)

Cross-reference grep targets (zero matches each — confirming Class B defects):
- `emitting:` across `src/` — confirms `emitting: false` never set
- `explode\(` across `src/` — confirms `emitter.explode(...)` never called
- `blendMode|'ADD'` across `src/` — confirms no ADD blend on any emitter
- `turret-fired|turret-placed|core-damaged` across `src/` — confirms declared events were never introduced
- `particle-soft|particle-spark|particle-ring|particle-glow` across `src/` — confirms only `particle` texture exists
