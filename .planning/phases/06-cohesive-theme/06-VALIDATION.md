---
phase: 6
slug: 06-cohesive-theme
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-18
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Extracted from 06-RESEARCH.md §"Validation Architecture" to satisfy Nyquist gate.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (per AGENTS.md: "No test framework or linter is configured") |
| **Config file** | — |
| **Quick run command** | `npm run build` (production build, expect exit 0 with no warnings) |
| **Full suite command** | `npm run build` + manual `npm run dev` visual smoke-test |
| **Estimated runtime** | ~8s build + ~60s manual smoke-test |

No test framework is provisioned by design (AGENTS.md line 14; REQUIREMENTS.md out-of-scope: "New test framework"). Verification is static analysis (grep) + build + visual inspection.

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (D-05 mandates commit-per-file; build catches typos immediately)
- **After every plan wave:** Same — file-by-file sequential per D-05 means per-plan build is also per-wave build
- **Before `/gsd-verify-work`:** All 5 gates (A + B + C + D + E) green
- **Max feedback latency:** ~8s per incremental Vite build; ~60s for full manual smoke-test at phase close
- **Gate C (manual visual):** Irreducible — no test framework can substitute; scoped to one smoke walk at phase close

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Gate | Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------|----------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | THEME-03 | D, E | `THEME.ui` has exactly 14 `{ hex, num }` entries | smoke (grep) | `rg -c "Object\.freeze\(\{ hex: '#[0-9a-fA-F]{6}', num: 0x[0-9a-fA-F]{6} \}\)" src/config/GameConfig.js` → expect 14 | ✅ | ⬜ pending |
| 06-01-01 | 01 | 1 | THEME-03 | B | Build passes after config expansion | smoke (build) | `npm run build` → exit 0 | ✅ | ⬜ pending |
| 06-02-01 | 02 | 2 | THEME-03 | A, B | MainMenuScene has zero hex literals outside THEME refs | smoke (grep+build) | `rg '(#[0-9a-fA-F]{6}\|0x[0-9a-fA-F]{6})' src/scenes/MainMenuScene.js` → only starfield carve-out on line 74 permitted; `npm run build` → exit 0 | ✅ | ⬜ pending |
| 06-03-01 | 03 | 2 | THEME-03 | A, B | BootScene preloader (lines 19, 27, 32) migrated | smoke (grep+build) | `rg '(#[0-9a-fA-F]{6}\|0x[0-9a-fA-F]{6})' src/scenes/BootScene.js` → matches only in procedural-texture block (lines 115–158); `npm run build` → exit 0 | ✅ | ⬜ pending |
| 06-04-01 | 04 | 2 | THEME-03 | A, B | UIScene HUD (9 literals) migrated; HP tier ternary uses `success/warning/danger` | smoke (grep+build) | `rg '(#[0-9a-fA-F]{6}\|0x[0-9a-fA-F]{6})' src/scenes/UIScene.js` → only 8-digit RGBA carve-out on line ~118; `npm run build` → exit 0 | ✅ | ⬜ pending |
| 06-05-01 | 05 | 2 | THEME-03 | A, B | GameOverScene (8 occurrences) migrated | smoke (grep+build) | `rg '(#[0-9a-fA-F]{6}\|0x[0-9a-fA-F]{6})' src/scenes/GameOverScene.js` → zero matches; `npm run build` → exit 0 | ✅ | ⬜ pending |
| 06-06-01 | 06 | 2 | THEME-03 | A, B | BuildSystem.js (24 replacements across 19 lines) migrated | smoke (grep+build) | `rg '(#[0-9a-fA-F]{6}\|0x[0-9a-fA-F]{6})' src/systems/BuildSystem.js` → zero matches; `npm run build` → exit 0 | ✅ | ⬜ pending |
| 06-07-01 | 07 | 2 | THEME-03 | A, B | Turret HP bar (5 literals: lines 53, 55, 405–407) migrated; type-color overlay, upgrade tint, damage-flash carve-outs preserved | smoke (grep+build) | `rg '(#[0-9a-fA-F]{6}\|0x[0-9a-fA-F]{6})' src/entities/Turret.js` → only documented VFX carve-outs remain; `npm run build` → exit 0 | ✅ | ⬜ pending |
| 06-08-01 | 08 | 2 | THEME-03 | A, B | main.js:14 uses `THEME.background` | smoke (grep+build) | `rg "'#0a0a12'" src/main.js` → zero matches; `rg "THEME.background" src/main.js` → 1 match; `npm run build` → exit 0 | ✅ | ⬜ pending |
| 06-08-02 | 08 | 2 | THEME-03 | A, B | GameScene.js:427 wave announcement uses `THEME.ui.warning.hex`; line 291 `setTintFill(0xff4444)` preserved as documented VFX carve-out | smoke (grep+build) | `rg "'#ff8844'" src/scenes/GameScene.js` → zero matches; `rg "THEME.ui.warning" src/scenes/GameScene.js` → 1+ matches; `npm run build` → exit 0 | ✅ | ⬜ pending |
| 06-09-01 | 09 | 3 | THEME-03 | A | Global grep gate: no hex/numeric color literals outside documented carve-outs | smoke (grep) | `rg '(#[0-9a-fA-F]{6}\|0x[0-9a-fA-F]{6})' src/ --glob '!src/config/GameConfig.js'` minus documented carve-outs → zero unexplained matches | ✅ | ⬜ pending |
| 06-09-02 | 09 | 3 | THEME-03 | B | Full build green | smoke (build) | `npm run build` → exit 0, no warnings | ✅ | ⬜ pending |
| 06-09-03 | 09 | 3 | THEME-03 | C | Visual smoke test: menu → game → game-over all render cosmic palette; no green/yellow/cyan chrome | manual (visual) | `npm run dev`; open localhost:5173; walk: Main menu → Start → Build phase (open build menu, open upgrade menu, trigger denied flash) → Start wave → Take damage → Game over (win + lose paths); verify palette cohesion | ✅ | ⬜ pending |
| 06-09-04 | 09 | 3 | THEME-03 | D, E | Semantic ceiling (≤14 ui.* keys) and dual-format integrity | smoke (grep) | See 06-01-01 gates D and E commands | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Gate Definitions

| Gate | Purpose | Command |
|------|---------|---------|
| **A — Static grep** | Zero hex/numeric color literals outside THEME/VFX/POSTFX and documented carve-outs | `rg '(#[0-9a-fA-F]{6}\|0x[0-9a-fA-F]{6})' src/ --glob '!src/config/GameConfig.js' \| rg -v 'VFX\|POSTFX'` |
| **B — Build** | Production build succeeds with no warnings | `npm run build` |
| **C — Visual smoke** | UI renders cosmic palette; no green/yellow/cyan chrome | `npm run dev` + manual walk (~60s) |
| **D — Semantic ceiling** | `THEME.ui` has ≤14 keys (per D-06) | `rg -c "^\s+\w+:\s*Object\.freeze\(\{ hex:" src/config/GameConfig.js` → expect ≤14 |
| **E — Dual-format integrity** | Every `ui.*` entry has both `hex` string and `num` numeric | `rg -c "Object\.freeze\(\{ hex: '#[0-9a-fA-F]{6}', num: 0x[0-9a-fA-F]{6} \}\)" src/config/GameConfig.js` → expect = number of ui.* keys (14) |

---

## Documented Carve-Outs (gate A exclusions)

Colors that remain as literals by design per D-01 VFX/gameplay boundary:

| File | Lines | Literal(s) | Reason |
|------|-------|-----------|--------|
| `src/config/GameConfig.js` | 142–213 (VFX/POSTFX blocks) | Various | Gameplay-effect tints, already centralized in separate frozen configs |
| `src/scenes/BootScene.js` | 115–158 | Various `0x......` | Procedural texture generation for bug/turret/core sprites (game entities, not UI chrome) |
| `src/scenes/MainMenuScene.js` | 74 | `0xffffff` with alpha loop | Starfield particle generation (cosmetic ambient, not UI chrome) |
| `src/scenes/UIScene.js` | ~118 | 8-digit RGBA literal | Notification popup alpha composition (CSS 8-digit form, not 6-digit hex) |
| `src/scenes/GameScene.js` | 291 | `setTintFill(0xff4444)` | Core-damage visual flash (VFX/gameplay feedback, not UI chrome) |
| `src/entities/Turret.js` | 260 | `{ blaster: 0xffaa44, zapper: 0xaa44ff, slowfield: 0x9966ff }` | Range-overlay type-color lookup (gameplay identity, not UI chrome) |
| `src/entities/Turret.js` | 328, 335, 339 | `0xffdd44`, `0xff4444` | Upgrade flash, damage flash tints (VFX/gameplay feedback) |

All other color literals in the migration-target files must be replaced with `THEME.*` references by phase close.

---

## Wave 0 Requirements

None — existing infrastructure (which is "none") covers all phase requirements by design. No test framework to stand up, no fixtures to create. Verification is grep + build + eyeball, all immediately available.

*Future migration paths (out of scope):*
- Phaser headless snapshot tests of each scene's `create()` output
- `pixelmatch` comparison against golden PNGs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cosmic palette cohesion across all UI chrome | THEME-03 success criterion #2 | No test framework; visual perception is the acceptance check per ROADMAP "consistent cosmic nebula palette (no mixed colors)" | `npm run dev` → localhost:5173 → Main menu (verify title, start button hover, subtitle) → Start → Build phase (open build menu on empty tile; open upgrade menu on starter turret; trigger denied flash by clicking locked tile) → Start wave → Take core damage → Game over via defeat OR complete wave 10 for victory; verify: no `#00ff88` green, no `#ffdd00` yellow, no `#88ccff` cyan remain in any UI chrome |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (grep + build) OR documented manual-only verification (gate C)
- [x] Sampling continuity: `npm run build` runs after every plan — no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — existing infra sufficient)
- [x] No watch-mode flags (build is one-shot)
- [x] Feedback latency < 60s (gate A grep ~1s; gate B build ~8s; gate C manual scoped to one walk at phase close)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (awaiting plan-checker re-verification)
