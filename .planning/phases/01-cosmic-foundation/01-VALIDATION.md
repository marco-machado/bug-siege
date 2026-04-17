---
phase: 01
slug: cosmic-foundation
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-16
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (structural grep + Vite build) |
| **Config file** | package.json (build script) |
| **Quick run command** | `grep` per-task verify (see map below) |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~3 s |

Unit test framework (vitest/jest) is not installed in this project. Phase 01 is a
config + static-asset-generation phase whose requirements are content-equality
checks (palette values, frozen-object invariant, method presence, canvas
registration). Structural grep + a passing production build are the appropriate
automated-verify primitives for these requirements and were declared as such in
each plan's `<verify>` block.

---

## Sampling Rate

- **After every task commit:** Run the task's grep verify command (<1 s)
- **After every plan wave:** Run `npm run build` (~2 s)
- **Before `/gsd-verify-work`:** Build must be green
- **Max feedback latency:** ~3 s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | VOID_ETHEREAL_PALETTE | T-01-03-01 | THEME frozen, no mutation possible | structural | `grep "export const THEME = Object.freeze" src/config/GameConfig.js` | ✅ | ✅ green |
| 01-01-02 | 01 | 1 | BUG_TWEEN_SAFETY | T-01-01 | Tweens killed before pool-release; no tween leak | structural | `grep "killTweensOf(this)" src/entities/Bug.js` | ✅ | ✅ green |
| 01-02-01 | 02 | 1 | THEME-02 (nebula gen) | T-02-01 | Single canvas registered once at boot | structural | `grep "this.textures.addCanvas('nebula'" src/scenes/BootScene.js` | ✅ | ✅ green |
| 01-02-02 | 02 | 1 | THEME-02 (nebula render) | — | Nebula drawn at canvas center in GameScene | structural | `grep "this.add.image(GAME.canvasWidth / 2, GAME.canvasHeight / 2, 'nebula')" src/scenes/GameScene.js` | ✅ | ✅ green |
| 01-03-01 | 03 | 1 | CORRECTED_THEME_PALETTE | T-01-03-01 | Hex values match UI-SPEC contract; build clean | structural + build | `grep "'#0a0a12'" src/config/GameConfig.js && grep "'#2d1b4e'" src/config/GameConfig.js && grep "'#eef2ff'" src/config/GameConfig.js && grep "'#0a0a12'" src/main.js && npm run build` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework needs
to be installed for Phase 01 — all requirements are structural/content checks
verifiable with grep + Vite build, which are already part of the project.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Nebula visual quality (soft gaseous clouds, purple-violet, no hard edges) | THEME-02 | Subjective aesthetic judgement; no headless image-diff infrastructure in project | `npm run dev` → start game → inspect background (verified PASS in 01-HUMAN-UAT.md 2026-04-16) |
| Palette cohesion across UI + gameplay scenes | VOID_ETHEREAL_PALETTE / CORRECTED_THEME_PALETTE | Cohesion is holistic, not per-value | Manual scene walkthrough via `npm run dev` (verified PASS in 01-UAT.md) |
| Bug pool stability across 2+ waves (no frozen tweens, ghost sprites) | BUG_TWEEN_SAFETY | Requires runtime behavior over multiple spawns/despawns; no Phaser headless harness | Play 2 waves in browser (verified PASS in 01-UAT.md) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (all 5 have grep verify)
- [x] Wave 0 covers all MISSING references (no missing references)
- [x] No watch-mode flags (Vite build is one-shot)
- [x] Feedback latency < 5 s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-16

---

## Validation Audit 2026-04-16 — Initial audit (State B reconstruction)

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 5 tasks' PLAN-declared `<automated>` verify commands executed and passed:

- `grep "export const THEME = Object.freeze" src/config/GameConfig.js` → 1 match
- `grep "killTweensOf(this)" src/entities/Bug.js` → 1 match
- `grep "this.textures.addCanvas('nebula'" src/scenes/BootScene.js` → 1 match
- `grep "this.add.image(GAME.canvasWidth / 2, GAME.canvasHeight / 2, 'nebula')" src/scenes/GameScene.js` → 1 match
- Plan 03 multi-grep: all 4 hex-value patterns matched; `npm run build` exited 0.

Behavioral requirements (visual aesthetics, pool runtime stability) are documented
in Manual-Only and were verified via `01-UAT.md` and `01-HUMAN-UAT.md` (both
complete / passed on 2026-04-16).
