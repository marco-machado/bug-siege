# Phase 5 — UI Review (Atmospheric Glow)

**Audited:** 2026-04-17
**Baseline:** `05-UI-SPEC.md` (approved) + `05-CONTEXT.md` decisions D-01..D-14 + `05-VERIFICATION.md`
**Screenshots:** not captured — no bug-siege dev server running (ports 3000/5173/8080 are occupied by unrelated projects; per `CLAUDE.md` "Never start local dev server unless explicitly requested"). Audit is code-only; in-browser visual QA is explicitly deferred to the manual checklist in `05-VERIFICATION.md` lines 136–182.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Three `[postfx]` warnings exactly match spec; em-dash U+2014 used per D-10/D-11 contract; no HUD/menu text touched. |
| 2. Visuals | 4/4 | Per-sprite `preFX.addGlow` on defenders + camera `postFX.addVignette` on non-UI scenes; strict D-02 "defenders glow, threats don't" scope upheld — zero glow attach on walls/bugs/bullets/particles. |
| 3. Color | 4/4 | Every glow color sourced from the Void Ethereal palette (`0xeef2ff` / `0x9966ff` / `0x6a4c93`); numeric-hex form matches `preFX.addGlow` signature; no rogue warm/cyan tints introduced by this phase. |
| 4. Typography | 4/4 | N/A — no text surfaces introduced or modified this phase, exactly as UI-SPEC declares. |
| 5. Spacing | 4/4 | N/A for layout. preFX padding (10 / 12 px) correctly set on each glow target per RESEARCH Pitfall 1; vignette radius 0.5 normalized as specified. |
| 6. Experience Design | 4/4 | Complete FX lifecycle: construct → upgrade (mutate) → destroy (clear); WebGL-only gate + Canvas warn-once; phase-reactive tween with destroy-on-replace; symmetric named-handler shutdown; D-14 UIScene isolation preserved (0 `postFX`/`preFX` refs in UIScene). |

**Overall: 24/24**

---

## Top 3 Priority Fixes

None rise to "priority fix" severity — the code-level implementation fully satisfies the UI-SPEC contract, the `05-VERIFICATION.md` report verified all 11 code-level must-haves, and no anti-patterns were found. The three items below are **minor recommendations** to consider as playtest-driven polish (not blockers):

1. **Re-evaluate `POSTFX.VIGNETTE.radius = 0.5` against the 7×7 grid framing once human visual QA runs.** — UI-SPEC and D-13 explicitly flag this as a "tune during execution" value (`.planning/phases/05-atmospheric-glow/05-UI-SPEC.md:167`). If manual check #4 reports the edge darkening is noticeable at HUD corners or build-menu popups, widen to ~0.55–0.6. Non-blocking, no code smell today.
2. **Consider a `POSTFX.VIGNETTE.gameOverStrength` field post-playtest if the defeat screen feels flat.** — Currently both boundary scenes use `buildStrength = 0.25` per D-14 default (`src/scenes/GameOverScene.js:22`, `src/scenes/MainMenuScene.js:17`). RESEARCH Open Question 2 anticipated this; deferring until playtest confirms is correct. Only act if #4 in `05-VERIFICATION.md` returns "defeat screen feels undermatched."
3. **Verify FX-leak smoke (`cameras.main.postFX.list.length === 1` after 3 Game→GameOver→MainMenu→Game cycles).** — Code path looks correct (`events.off` with named handler at `src/scenes/GameScene.js:122`, tween destroy at `:123`, `postFX.clear()` at `:125`), but this requires a DevTools console (#8 in human-verification block). If the list grows, root-cause in the shutdown handler — this is the single most likely source of a silent leak across restarts.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

**Contract comparison** — UI-SPEC `Copywriting Contract` (line 105) declares no new copy in this phase; the only strings introduced are the three `[postfx]` console warnings (D-10/D-11).

Evidence:
- `src/scenes/GameScene.js:83` — `'[postfx] Canvas renderer detected — glow disabled'`
- `src/scenes/MainMenuScene.js:14` — `'[postfx] Canvas renderer detected — vignette disabled'`
- `src/scenes/GameOverScene.js:19` — `'[postfx] Canvas renderer detected — vignette disabled'`

All three match the grep-matchable contract exactly. The em-dash is the U+2014 character, not a hyphen-minus — verified by the VERIFIER's grep (`05-VERIFICATION.md:110`). GameScene uses "glow disabled" (it hosts turret/core glow); boundary scenes use "vignette disabled" (they only attach vignette). The disambiguation is per-scene-responsibility-aware and correct.

HUD/menu text (`credits`, `NO TURRETS PLACED`, `Sell Turret: Are you sure?...`) unchanged — verified by git diff: phase 5 commits `2e88792`, `6fd90b3`, `66316b8`, `f66fa09`, `06582e5`, `eaed292`, `1f5aa8f` touch only `GameConfig.js`, `Turret.js`, `GameScene.js`, `MainMenuScene.js`, `GameOverScene.js`, and none of them edit text content.

### Pillar 2: Visuals (4/4)

**Contract comparison** — UI-SPEC `Glow Target Scope (D-02 — strict)` lines 88–100:

| Class | Expected | Actual | Match |
|-------|----------|--------|-------|
| Turrets (non-wall) | yes | `Turret.js:25` branches `type !== 'wall'` then calls `addGlow` at `:28` | correct |
| Walls | no | `type !== 'wall'` guard skips; no `walls` entry in `POSTFX.GLOW` | correct |
| Core | yes | `GameScene.js:157` on `this.coreSprite.preFX` | correct |
| Bugs / Bullets / Particles | no | `grep addGlow src` returns only turret + core sprites (`src/entities/Turret.js:28`, `src/scenes/GameScene.js:157`) | correct |
| Menu / HUD text | no | UIScene.js has 0 `postFX`/`preFX` references | correct |

Five `addGlow`/`addVignette` call sites total; every one is justified by the spec:
- `Turret.js:28` — per-turret sprite (non-wall, WebGL only)
- `GameScene.js:86` — camera vignette
- `GameScene.js:157` — core sprite glow
- `MainMenuScene.js:17` — static vignette (boundary scene)
- `GameOverScene.js:22` — static vignette (boundary scene)

Visual hierarchy preserved: "defenders glow, threats don't" (D-02 specifics, `05-CONTEXT.md:125`). Per-frame FX cost bounded by `turrets.length + 1` glow pipelines + 1 vignette postFX = matches UI-SPEC `PostFX Contract` performance budget (line 122).

### Pillar 3: Color (4/4)

**Contract comparison** — UI-SPEC `Phase 5 PostFX Color Assignments` lines 79–86:

| Element | Expected base | Expected upgraded | Actual base | Actual upgraded | Match |
|---------|---------------|-------------------|-------------|-----------------|-------|
| Blaster | `0xeef2ff` | `0xeef2ff` (no shift) | `0xeef2ff` | `0xeef2ff` | correct |
| Zapper | `0x9966ff` | `0xeef2ff` | `0x9966ff` | `0xeef2ff` | correct |
| Slowfield | `0x6a4c93` | `0xeef2ff` | `0x6a4c93` | `0xeef2ff` | correct |
| Wall | none | n/a | no entry | no entry | correct |
| Core | `0xeef2ff` | n/a | `0xeef2ff` | n/a | correct |
| Vignette | `0x000000` (Phaser default) | n/a | Phaser default (no color arg passed) | n/a | correct |

Evidence: `src/config/GameConfig.js:204–207`.

Numeric-hex form (`0xeef2ff`, not `'#eef2ff'`) satisfies the `preFX.addGlow` signature requirement called out in UI-SPEC Config Structure line 234. THEME palette strings are still CSS strings (legacy Phase 1); POSTFX correctly duplicates the values in numeric form rather than converting at runtime — matches D-13 guidance.

**Out-of-scope colors observed but not attributable to this phase:**
- `src/entities/Turret.js:267` hardcodes `0xffaa44` (warm yellow-orange) for the blaster range-indicator ring. This is pre-existing Phase 2/4 code, untouched by Phase 5 commits. Phase 7 (cohesive-theme) owns the full hardcoded-color migration (`.planning/phases/05-atmospheric-glow/05-CONTEXT.md:138` deferred item). Not a Phase 5 finding.
- `MainMenuScene.js:30` `#00ff88`, `GameOverScene.js:26` `#00ff88`/`#ff3333` — same story: boundary-scene title colors are Phase 7's migration scope.

No warm yellows, electric cyans, or traffic-light tints introduced by Phase 5. Palette fidelity 100%.

### Pillar 4: Typography (4/4)

UI-SPEC `Typography` section (line 47): "Carried forward from Phase 1 — no changes this phase. No new text surfaces in this phase."

Verified: Phase 5 commits do not touch any `.add.text(...)` call, any `fontSize` / `fontFamily` property, or any font-size-ish constant. The only strings introduced are console warnings, which have no typography surface. N/A pillar — maximum score awarded per the convention that an unchanged dimension is fully compliant.

### Pillar 5: Spacing (4/4)

UI-SPEC `Spacing Scale` line 29: "Carried forward from Phase 1 — no changes this phase. Exceptions: none. Phase 5 is pure rendering/postFX — no layout changes."

Verified: no `.setPosition(...)`, `.setOrigin(...)`, or HUD-coord edits in any Phase 5 commit.

**Spacing-adjacent postFX values observed and validated:**

| Value | Location | Spec source | Validation |
|-------|----------|-------------|------------|
| Glow padding 10px (turret) | `GameConfig.js:204–206` | RESEARCH Pitfall 1 — mandatory for 64px sprites with `outerStrength > 0` | present, correct |
| Glow padding 12px (core) | `GameConfig.js:207` | RESEARCH Pitfall 1 | present, correct |
| Vignette radius 0.5 (normalized) | `GameConfig.js:212` | UI-SPEC line 167 ("tune during execution") | within spec, tunable |
| Vignette center 0.5, 0.5 | `GameConfig.js:210–211` | UI-SPEC lines 165–166 | exact match |
| `setPadding(cfg.padding)` call | `Turret.js:27`, `GameScene.js:156` | RESEARCH Pitfall 1 | present before every `addGlow` |

All padding values are applied before the corresponding `addGlow` call, avoiding the clipped-glow pitfall documented in phase research. The normalized-coordinate convention (`x/y/radius` as floats) matches Phaser 3.80+ addVignette signature.

### Pillar 6: Experience Design (4/4)

**Lifecycle coverage** — every persistent FX handle has a matching teardown:

| Concern | Site | Pattern | Evidence |
|---------|------|---------|----------|
| Per-turret glow construct | `Turret.js:24–29` | WebGL + non-wall guard, `setPadding` + `addGlow`, handle stored as `this.glowFX` | present |
| Per-turret glow upgrade | `Turret.js:337–339` | direct property mutation (`this.glowFX.color = ...`); no alloc, handle preserved | present, correct pattern |
| Per-turret glow destroy | `Turret.js:382–385` | existence-guarded `preFX.clear()` BEFORE `sprite.destroy()` | correct order |
| Core glow construct | `GameScene.js:153–158` | WebGL guard, `setPadding` + `addGlow`, handle stored as `this._coreGlowFX` | present |
| Core glow destroy | implicit via scene teardown | Phaser disposes sprite preFX with the sprite; no explicit clear needed | correct per PATTERNS.md |
| Camera vignette construct | `GameScene.js:81–87` | WebGL guard + Canvas warn; handle stored as `this._vignetteFX` | present |
| Phase-reactive tween | `GameScene.js:89–102` | destroy-on-replace guard (`if (this._vignetteTween) .destroy()`); named-handler `this._onPhaseChangedVignette`; uses `POSTFX.VIGNETTE.transitionDuration`/`transitionEase` | correct |
| Scene shutdown | `GameScene.js:122–126` | specific-handler `events.off('phase-changed', handler)` (NOT naked `off('phase-changed')` — would kill UIScene's listener); tween destroy + null; `cameras.main.postFX.clear()` guarded | excellent symmetry |
| Boundary-scene vignette | `MainMenuScene.js:12–18`, `GameOverScene.js:17–23` | static attach only, no handle, no tween, no listener — relies on Phaser scene teardown | correct per D-14 |
| Canvas fallback | all 3 scenes | exactly-once warn-per-scene-entry, no errors, no crashed code paths | per spec |

**D-14 UIScene isolation** — `grep postFX|preFX src/scenes/UIScene.js` → 0 matches (verified). HUD text remains un-vignetted and un-glowed. Matches SHAKE-04 pattern from Phase 4.

**State coverage** — loading/error/empty states are not Phase 5 concerns (no DOM UI, no data fetches). The equivalent states here are:
- WebGL-present → full effects: covered (all 5 attach sites gated on `isWebGL`)
- Canvas-fallback → effects skipped + warning: covered (all 3 scenes log once)
- Upgrade event → color mutation: covered (`Turret.js:337–339`)
- Phase transition → tween: covered (`GameScene.js:89–102`)
- Scene restart → clean slate: covered (shutdown handler at `GameScene.js:115–127`)
- Entity destroy mid-wave → clean teardown: covered (`Turret.js:382–385`)

No unhandled states.

**Anti-patterns scan** — zero TODO/FIXME/XXX/HACK/PLACEHOLDER, no empty arrow handlers, no hardcoded stub returns across all five Phase 5 files. Per `05-VERIFICATION.md:124–130` anti-patterns table.

---

## Registry Safety

Not applicable. UI-SPEC line 242 declares "No third-party UI registries. Phase is pure Phaser 3 postFX on an existing codebase." `components.json` does not exist. `shadcn_initialized: false` in UI-SPEC frontmatter. Audit skipped per agent instructions.

---

## Visual QA Deferred to Human

Eight items in `05-VERIFICATION.md:136–182` require a running browser + human judgment of rendering quality, timing, and FX-leak inspection. None of these can be verified by code review. They are:

1. Turrets + core glow softly on WebGL (per-type colors correct)
2. Upgrade swap changes glow color (zapper/slowfield → accent white)
3. Canvas-runtime graceful degradation (3 warnings, no errors, playable)
4. Vignette subtly frames all non-UI scenes (felt, not seen)
5. Phase-reactive vignette tween timing (~600ms Sine.easeInOut, build ↔ wave)
6. UIScene unaffected (HUD sharp + un-vignetted)
7. 60fps under load (wave 10 + boss sustained)
8. No FX leak across scene restarts (`list.length === 1` after 3 cycles)

Manual QA is the official verification path for this project per `CLAUDE.md` ("No test framework or linter is configured yet") and `VALIDATION.md` ("all behavioral validation is visual/manual"). A `human_needed` status with `11/11` code-level truths verified is the expected terminal state for this phase.

---

## Files Audited

- `/Users/machado/Projects/bug-siege/src/config/GameConfig.js` (POSTFX export, lines 202–218)
- `/Users/machado/Projects/bug-siege/src/entities/Turret.js` (import L2; constructor L24–29; upgrade L337–339; destroy L382–385)
- `/Users/machado/Projects/bug-siege/src/scenes/GameScene.js` (import L2; vignette + tween + shutdown L81–127; core glow L153–158)
- `/Users/machado/Projects/bug-siege/src/scenes/MainMenuScene.js` (import L2; static vignette L12–18)
- `/Users/machado/Projects/bug-siege/src/scenes/GameOverScene.js` (import L2; static vignette L17–23)
- `/Users/machado/Projects/bug-siege/src/scenes/UIScene.js` (D-14 isolation contract — verified 0 postFX/preFX references)

**Planning artifacts referenced:**
- `/Users/machado/Projects/bug-siege/.planning/phases/05-atmospheric-glow/05-UI-SPEC.md` (approved design contract)
- `/Users/machado/Projects/bug-siege/.planning/phases/05-atmospheric-glow/05-CONTEXT.md` (D-01..D-14)
- `/Users/machado/Projects/bug-siege/.planning/phases/05-atmospheric-glow/05-VERIFICATION.md` (11/11 code-level truths)
- `/Users/machado/Projects/bug-siege/.planning/phases/05-atmospheric-glow/05-01..04-SUMMARY.md` (execution records)
- `/Users/machado/Projects/bug-siege/.planning/phases/05-atmospheric-glow/05-01..04-PLAN.md` (intended scope)
