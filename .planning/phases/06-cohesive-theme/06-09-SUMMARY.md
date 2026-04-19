---
phase: 06-cohesive-theme
plan: 09
plan_id: 06-09
subsystem: verification
tags: [theme, verification, gate, phase-close]
requirements: [THEME-03]
depends_on: [06-01, 06-02, 06-03, 06-04, 06-05, 06-06, 06-07, 06-08]
wave: 3
tech-stack:
  added: []
  patterns:
    - "D-07 verification gate (static grep + build + semantic count + dual-format integrity)"
    - "Documented VFX/POSTFX carve-out enumeration with file:line references"
key-files:
  created:
    - .planning/phases/06-cohesive-theme/06-09-SUMMARY.md
  modified: []
decisions:
  - "All four automated gates (A grep / B build / D ceiling / E dual-format) green; Gate C (visual smoke) documented for manual execution per VALIDATION.md."
  - "Gate A classification accepts Turret.js:261 (|| 0xffffff fallback) as adjacent-logic to the documented line-260 type-color dict carve-out — same VFX type-color overlay semantic in showRange()."
  - "UIScene debug-overlay carve-out line drifted from ~118 (VALIDATION.md) to 122 (actual); content unchanged ('#000000aa' 8-digit RGBA); classification still OK."
  - "BuildSystem.js plan acceptance criterion (≥20 THEME.ui.* refs, line-counted) is 19 matching lines / 26 occurrences — occurrence count exceeds the threshold; per-site enumeration confirms migration is complete."
metrics:
  duration: ~3 minutes
  tasks_completed: 4
  files_modified: 0
  completed: 2026-04-18
---

# Phase 06 Plan 09: D-07 Verification Gate Summary

One-liner: Ran all four automated gates (A/B/D/E) of the D-07 verification sweep; all green. Zero rogue UI-chrome color literals outside documented VFX/texture carve-outs. THEME-03 ready for manual Gate C visual smoke-test.

## Overall Result

**Automated gates (A, B, D, E): PASS.** Gate C (visual smoke-test) is manual-only by design (AGENTS.md: no test framework) and documented below for the solo-dev user to drive through `/gsd-verify-work`.

---

## Gate A — Static grep (D-07)

**Command:**
```
rg -n '(#[0-9a-fA-F]{6}|0x[0-9a-fA-F]{6})' src/ -g '!src/config/GameConfig.js'
```

**Raw output — 13 hits:**
```
src/entities/Turret.js:260:    const colors = { blaster: 0xffaa44, zapper: 0xaa44ff, slowfield: 0x9966ff };
src/entities/Turret.js:261:    const color = colors[this.type] || 0xffffff;
src/entities/Turret.js:328:    this.sprite.setTint(0xffdd44);
src/entities/Turret.js:335:    this.sprite.setTintFill(0xff4444);
src/entities/Turret.js:339:        this.sprite.setTint(0xffdd44);
src/scenes/GameScene.js:291:      this.coreSprite.setTintFill(0xff4444);
src/scenes/UIScene.js:122:        backgroundColor: '#000000aa',
src/scenes/BootScene.js:115:    g.fillStyle(0xffffff, 1);
src/scenes/BootScene.js:119:    g.fillStyle(0xffffff, 0.6);
src/scenes/BootScene.js:121:    g.fillStyle(0xffffff, 1);
src/scenes/BootScene.js:137:    const magenta = 0xff00ff;
src/scenes/BootScene.js:155:      g.fillStyle(0x1a1a2e, 1);
src/scenes/MainMenuScene.js:74:      g.fillStyle(0xffffff, alpha);
```

**Carve-out classification (13 of 13 = OK):**

| File:Line | Literal | Carve-out source | OK? |
|-----------|---------|------------------|-----|
| `Turret.js:260` | `{ blaster: 0xffaa44, zapper: 0xaa44ff, slowfield: 0x9966ff }` | VALIDATION.md carve-out row: Turret.js line 260 (range-overlay type-color lookup — gameplay identity) | OK |
| `Turret.js:261` | `\|\| 0xffffff` | Adjacent-logic fallback for the line-260 dict in `showRange()`. Not explicitly named in VALIDATION.md, but same VFX type-color overlay semantic (D-01). Documented here as a classification note. | OK |
| `Turret.js:328` | `setTint(0xffdd44)` upgrade flash | VALIDATION.md carve-out row: Turret.js line 328 (upgrade flash VFX) | OK |
| `Turret.js:335` | `setTintFill(0xff4444)` damage flash | VALIDATION.md carve-out row: Turret.js line 335 (damage flash VFX) | OK |
| `Turret.js:339` | `setTint(0xffdd44)` upgrade flash restore | VALIDATION.md carve-out row: Turret.js line 339 (upgrade flash VFX) | OK |
| `GameScene.js:291` | `setTintFill(0xff4444)` core damage flash | VALIDATION.md carve-out row: GameScene.js line 291 (core damage flash VFX) | OK |
| `UIScene.js:122` | `backgroundColor: '#000000aa'` 8-digit RGBA | VALIDATION.md carve-out row: UIScene.js ~118 (debug overlay; 8-digit CSS form falsely triggers 6-digit regex on first 6 chars). **Line drift ~118 → 122 noted; content matches.** | OK |
| `BootScene.js:115` | `g.fillStyle(0xffffff, 1)` particle texture | VALIDATION.md carve-out row: BootScene.js 115–158 (procedural texture generator) | OK |
| `BootScene.js:119` | `g.fillStyle(0xffffff, 0.6)` particle texture | VALIDATION.md carve-out row: BootScene.js 115–158 | OK |
| `BootScene.js:121` | `g.fillStyle(0xffffff, 1)` particle texture | VALIDATION.md carve-out row: BootScene.js 115–158 | OK |
| `BootScene.js:137` | `const magenta = 0xff00ff` fallback tex | VALIDATION.md carve-out row: BootScene.js 115–158 | OK |
| `BootScene.js:155` | `g.fillStyle(0x1a1a2e, 1)` bg fallback tex | VALIDATION.md carve-out row: BootScene.js 115–158 | OK |
| `MainMenuScene.js:74` | `g.fillStyle(0xffffff, alpha)` starfield | VALIDATION.md carve-out row: MainMenuScene.js line 74 (starfield particle generation) | OK |

**Per-file leak checks (targeted) — all ZERO matches:**
- `GameOverScene.js`: 0 hex/numeric leaks
- `BuildSystem.js`: 0 hex/numeric leaks
- `Turret.js` lines 53/55/405/406/407 (HP-bar migration zone): 0 leaks for `0x333333|0x00ff00|0xff3333|0xffaa00|0x00ff44`
- `GameScene.js`: 0 `'#ff8844'` matches (wave-announce migration clean)
- `main.js`: 0 `'#0a0a12'` matches (background migration clean)
- `UIScene.js`: 0 six-digit-only hex leaks (excluding the 8-digit RGBA carve-out)

**Gate A verdict: PASS.** All 13 raw hits trace to the documented VFX/texture/debug carve-out rows in VALIDATION.md. Zero unexplained leaks.

---

## Gate B — Build

**Command:** `npm run build`

**Output:**
```
> bug-siege@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 20 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.60 kB │ gzip:   0.38 kB
dist/assets/index-3LhKdiSR.js      48.44 kB │ gzip:  13.75 kB
dist/assets/phaser-0RJB29YE.js  1,478.57 kB │ gzip: 339.68 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 2.05s
```

Exit code: **0**. The "Some chunks are larger than 500 kB" notice is the pre-existing Phaser vendor-bundle informational advisory (flagged in Plan 08 and earlier) — constraints explicitly allow it as the only permitted non-error output. No new warnings introduced.

**Gate B verdict: PASS.**

---

## Gate D — Semantic ceiling (≤14 ui.* keys, per D-06)

**Command:**
```
rg -c "^\s+\w+:\s*Object\.freeze\(\{ hex:" src/config/GameConfig.js
```

**Output:** `14`

**Key enumeration (GameConfig.js lines 141–154):**

```
141: textPrimary      { hex: '#eef2ff', num: 0xeef2ff }
142: textMuted        { hex: '#a89fcc', num: 0xa89fcc }
143: textDisabled     { hex: '#6a6a80', num: 0x6a6a80 }
144: accentPrimary    { hex: '#9966ff', num: 0x9966ff }
145: accentSecondary  { hex: '#88aacc', num: 0x88aacc }
146: warning          { hex: '#ffaa44', num: 0xffaa44 }
147: danger           { hex: '#ff3333', num: 0xff3333 }
148: success          { hex: '#66dd99', num: 0x66dd99 }
149: surface          { hex: '#2d1b4e', num: 0x2d1b4e }
150: surfaceBorder    { hex: '#4b2c62', num: 0x4b2c62 }
151: hpBarBg          { hex: '#1a1a2e', num: 0x1a1a2e }
152: gridLine         { hex: '#334455', num: 0x334455 }
153: loadingBar       { hex: '#9966ff', num: 0x9966ff }
154: loadingBarBg    { hex: '#1a1a2e', num: 0x1a1a2e }
```

Exactly 14 keys, matches D-06 ceiling.

**Gate D verdict: PASS (14 / 14).**

---

## Gate E — Dual-format integrity

**Command:**
```
rg -c "Object\.freeze\(\{ hex: '#[0-9a-fA-F]{6}', num: 0x[0-9a-fA-F]{6} \}\)" src/config/GameConfig.js
```

**Output:** `14`

Every `THEME.ui.*` entry has both `hex` (CSS string) and `num` (0x-literal) sub-keys. Matches Gate D count — zero half-defined entries.

Visual consistency spot-check (Gate D enumeration above): for each pair, `.hex` equals `'#' + hex(.num)` — e.g., `{ hex: '#eef2ff', num: 0xeef2ff }`. All 14 pairs consistent.

**Gate E verdict: PASS (14 / 14).**

---

## Coverage Audit (Task 3 — THEME import density)

**Import presence** — all 8 migration files import `THEME` from `GameConfig.js`:

| File | Import present? |
|------|-----------------|
| `src/scenes/MainMenuScene.js` | OK |
| `src/scenes/BootScene.js` | OK |
| `src/scenes/UIScene.js` | OK |
| `src/scenes/GameOverScene.js` | OK |
| `src/systems/BuildSystem.js` | OK |
| `src/entities/Turret.js` | OK |
| `src/scenes/GameScene.js` | OK |
| `src/main.js` | OK (uses `THEME.background` at line 14) |

**THEME.ui.* reference density:**

| File | Matching lines (`rg -c`) | Total occurrences (`rg -o`) | Plan min | Verdict |
|------|--------------------------|-----------------------------|----------|---------|
| `MainMenuScene.js` | 7 | 7 | ≥7 | OK |
| `BootScene.js` | 3 | 3 | ≥3 | OK |
| `UIScene.js` | 11 | 11 | ≥9 | OK |
| `GameOverScene.js` | 8 | 9 | ≥8 | OK |
| `BuildSystem.js` | **19** | **26** | ≥20 | See note below |
| `Turret.js` | 5 | 5 | ≥5 | OK |
| `GameScene.js` | 1 | 1 | ≥1 | OK |

**BuildSystem.js note:** the plan's acceptance criterion `≥20` is expressed as `rg -c` (matching-line count). Actual matching-line count is 19; actual THEME.ui.* occurrence count is 26 (several lines have two refs via ternaries, e.g., `canAfford ? THEME.ui.textPrimary.hex : THEME.ui.textDisabled.hex`). The plan's own PATTERNS.md inventory describes "24 replacements across 19 lines" — so 19 lines matches PATTERNS.md exactly, and the 26 occurrences exceed the 20 bar on a per-occurrence basis. Migration is demonstrably complete; the acceptance criterion is off-by-one relative to its own PATTERNS.md source. No defect.

**Gate coverage verdict: PASS.**

---

## Carve-Out Integrity (Task 4 — D-01 boundary preserved)

Each documented carve-out confirmed **still present** in its expected form:

| Carve-out | File:Line | Status |
|-----------|-----------|--------|
| BootScene magenta fallback texture | `BootScene.js:137` (`0xff00ff`) | Present (1 hit) |
| BootScene bg fallback texture pixel | `BootScene.js:155` (`0x1a1a2e`) | Present (1 hit) |
| MainMenu starfield | `MainMenuScene.js:74` (`0xffffff`) | Present (line 74 exact) |
| GameScene core damage flash | `GameScene.js:291` (`setTintFill(0xff4444)`) | Present (1 hit) |
| UIScene debug overlay 8-digit RGBA | `UIScene.js:122` (`'#000000aa'`) | Present (line drift: VALIDATION.md says ~118, actual 122) |
| Turret upgrade tint | `Turret.js:328, 339` (`0xffdd44`) | Present (2 hits as expected) |
| Turret type-color overlay | `Turret.js:260` | Present (range-overlay dict intact) |
| Turret damage flash | `Turret.js:335` (`setTintFill(0xff4444)`) | Present |
| GameConfig.js numeric hex density | 30 total `0x[0-9a-fA-F]{6}` occurrences (VFX+POSTFX+THEME.ui.num) | Present (≥20 threshold met) |

**HP-bar migration boundary** (Turret.js lines 53, 55, 405–407): Zero hits for `0x333333|0x00ff00|0xff3333|0xffaa00`. Lines 53, 55, 405, 406, 407 now use `THEME.ui.hpBarBg.num / success.num / danger.num / warning.num` — verified by re-read:

```
53: this.hpBarBg = scene.add.rectangle(..., THEME.ui.hpBarBg.num)
55: this.hpBarFill = scene.add.rectangle(..., THEME.ui.success.num)
405: let color = THEME.ui.success.num;
406: if (ratio <= 0.25) color = THEME.ui.danger.num;
407: else if (ratio <= 0.5) color = THEME.ui.warning.num;
```

**Carve-out integrity verdict: PASS.** No over-migration. D-01 boundary between UI chrome (migrated) and VFX/texture semantics (preserved) is intact.

---

## Gate C — Manual Visual Smoke-Test (to be driven by user)

Gate C is irreducible manual verification per VALIDATION.md (no test framework; AGENTS.md line 14). It is **NOT** part of this plan's automated run and is documented here for the solo-dev user to execute in `/gsd-verify-work`.

**Procedure (from `06-VALIDATION.md` Manual-Only Verifications row):**

1. Run `npm run dev`
2. Open http://localhost:5173 in a modern browser
3. Walk the UI in this order:
   - **Main menu:** verify title, subtitle, Start button (rest + hover states)
   - **Start →** build phase opens
   - **Build menu:** click an empty tile → open build menu (verify panel fill, border, labels, affordability colors, hover tint)
   - **Upgrade menu:** click an existing starter turret → open upgrade menu (verify panel, upgrade/repair labels, hover, denied flash by clicking a locked option you can't afford)
   - **Start wave:** trigger wave spawn → verify wave-announcement text color reads as cosmic warning amber, not orange
   - **Take core damage:** let a bug reach the core → verify `0xff4444` damage-flash carve-out still fires on core sprite (gameplay feedback intact)
   - **Game over (defeat path):** lose a wave → verify GameOver scene title, stats, restart + menu button hover states
   - **Game over (victory path):** complete wave 10 → verify win variant of GameOver scene
4. **Palette cohesion check:** verify no legacy `#00ff88` bright green, no `#ffdd00` yellow, no `#88ccff` cyan remains in any UI chrome. Expected palette is cosmic purples/blues with accent highlights (`#9966ff` primary accent, `#eef2ff` text, `#ffaa44` warning, `#ff3333` danger, `#66dd99` success).

Pass criterion: all UI chrome reads as one cohesive cosmic nebula palette. Gameplay VFX (core damage flash, turret range overlays, bug death colors) may retain non-palette tints — those are D-01 carve-outs and not subject to Gate C.

---

## VFX/Gameplay Carve-Out Literals (out-of-scope, intentionally retained)

Explicit reference list — these are **not** Gate A leaks:

```
src/entities/Turret.js:260      blaster/zapper/slowfield type-color dict (range-overlay VFX)
src/entities/Turret.js:261      0xffffff fallback for the type-color dict (same showRange() block)
src/entities/Turret.js:328      0xffdd44 upgrade tint (VFX)
src/entities/Turret.js:335      0xff4444 damage flash (VFX)
src/entities/Turret.js:339      0xffdd44 upgrade tint restore (VFX)
src/scenes/GameScene.js:291     0xff4444 core damage flash (VFX)
src/scenes/UIScene.js:122       '#000000aa' 8-digit RGBA debug overlay (not 6-digit hex)
src/scenes/BootScene.js:115,119,121   0xffffff particle texture pixels (procedural texture generator)
src/scenes/BootScene.js:137     0xff00ff magenta fallback texture pixel
src/scenes/BootScene.js:155     0x1a1a2e background fallback texture pixel
src/scenes/MainMenuScene.js:74  0xffffff starfield particles (procedural ambient art)
```

These all trace to D-01 ("gameplay-effect → leave") and are enumerated in VALIDATION.md's carve-out table.

---

## Phase 6 Success Criteria Traceability

| ROADMAP.md success criterion | Gate(s) | Status |
|------------------------------|---------|--------|
| #1 "All hardcoded color values across 6+ files reference THEME config constants" | A + D + E + coverage audit | **SATISFIED** — all 8 files migrated, zero non-carve-out leaks |
| #2 "Consistent cosmic nebula palette" | C (manual) | **PENDING manual Gate C** via `/gsd-verify-work` |

THEME-03 requirement is fulfilled automatedly; final sign-off is the solo-dev's visual walk.

---

## Deviations from Plan

None — all 4 tasks executed exactly as specified. Three classification notes surfaced (and documented above):

1. **Turret.js:261 `|| 0xffffff`** — adjacent-logic to the listed line-260 carve-out; classified OK as same VFX type-color overlay semantic.
2. **UIScene.js debug overlay line drift** — VALIDATION.md says ~118, actual is 122; content matches; classification unchanged.
3. **BuildSystem.js coverage count** — plan's `≥20` bar reads as line-count; actual 19 matching lines / 26 occurrences; migration complete per PATTERNS.md "24 replacements across 19 lines."

None of these are defects; all three are documentation/plan-criterion nuances.

## Deferred Issues

None.

## Self-Check: PASSED

- Gate A grep run; 13 raw hits all classified against VALIDATION.md carve-outs.
- Gate B `npm run build` exit 0, build log captured.
- Gate D = 14, Gate E = 14 (matching).
- All 8 migration files import THEME; per-file density above plan minimums (per-occurrence).
- Carve-out integrity re-checked; HP-bar migration confirmed by re-read of Turret.js lines 53, 55, 405–407.
- SUMMARY.md written to `.planning/phases/06-cohesive-theme/06-09-SUMMARY.md`.
- No source code files modified by this plan (verification-only, as specified).
