---
phase: 5
slug: atmospheric-glow
status: smoke-green-uat-pending
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-17
audited: 2026-04-17
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **Note:** Bug Siege has no automated test framework (per `CLAUDE.md`). The automated gate for this phase is `npm run build`; all behavioral validation is visual/manual. This document declares that honestly and lays out the manual gates.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None. Project is manual-QA per `CLAUDE.md` ("No test framework or linter is configured yet"). |
| **Config file** | none |
| **Quick run command** | `npm run build` (Vite build — fails on import errors, bad config, frozen-object mutation) |
| **Full suite command** | `npm run build && npm run preview` (preview lets the QA tester click-through the game) |
| **Estimated runtime** | ~5 seconds for `npm run build` |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + manual visual QA checklist items for the specific requirement(s) affected
- **Before `/gsd-verify-work`:** `npm run build` green + full manual QA checklist + Canvas fallback smoke + FX leak inspection
- **Max feedback latency:** ~5 seconds for automated; manual checks add ~3–5 minutes for the full phase checklist

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | THEME-04 | — | POSTFX config exported frozen, immutable | smoke | `npm run build` | n/a | ✅ smoke-green · behavior→manual |
| 5-02-01 | 02 | 1 | THEME-04 | — | Turret glow applied on WebGL, skipped on Canvas | smoke + visual-manual | `npm run build` | n/a | ✅ smoke-green · behavior→manual #1, #3 |
| 5-02-02 | 02 | 1 | THEME-04 | — | Turret upgrade swaps glow color | smoke + visual-manual | `npm run build` | n/a | ✅ smoke-green · behavior→manual #2 |
| 5-02-03 | 02 | 1 | THEME-04 | — | Turret destroy clears preFX before sprite teardown | smoke + devtools | `npm run build` | n/a | ✅ smoke-green · behavior→manual #8 |
| 5-03-01 | 03 | 2 | THEME-04 | — | Core glow applied on WebGL in GameScene.renderCore | smoke + visual-manual | `npm run build` | n/a | ✅ smoke-green · behavior→manual #1 |
| 5-03-02 | 03 | 2 | THEME-05 | — | Main-camera vignette added + phase-reactive tween on GameScene | smoke + visual-manual | `npm run build` | n/a | ✅ smoke-green · behavior→manual #4, #5 |
| 5-03-03 | 03 | 2 | THEME-05 | — | Vignette tween killed + postFX cleared on scene shutdown | smoke + devtools-manual | `npm run build` | n/a | ✅ smoke-green · behavior→manual #8 |
| 5-04-01 | 04 | 2 | THEME-05 | — | Static vignette on MainMenuScene (WebGL) | smoke + visual-manual | `npm run build` | n/a | ✅ smoke-green · behavior→manual #4 |
| 5-04-02 | 04 | 2 | THEME-05 | — | Static vignette on GameOverScene (WebGL) | smoke + visual-manual | `npm run build` | n/a | ✅ smoke-green · behavior→manual #4 |
| 5-04-03 | 04 | 2 | THEME-04/05 | — | Canvas-runtime warnings emitted once per scene, no errors | smoke + manual (Phaser.CANVAS flag) | `npm run build` | n/a | ✅ smoke-green · behavior→manual #3 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · "smoke-green · behavior→manual #N" = automated build gate green; behavioral verification deferred to Manual-Only test #N below.*

*Task IDs are projected; actual IDs are assigned by the planner.*

---

## Wave 0 Requirements

None — no test framework to bootstrap. `CLAUDE.md` explicitly disclaims automated testing for Bug Siege; `npm run build` is the existing automated gate and no new infrastructure is introduced by this phase.

*Wave 0 (test-infrastructure bootstrap) is not required for this phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Turrets + core glow softly on WebGL | THEME-04 | Visual rendering — no test framework | Load game on Chrome/Firefox (default WebGL). Place one of each turret type (blaster, zapper, slowfield, wall) and observe the command core. Expect: blaster/core show ghostly white halo; zapper shows violet halo; slowfield shows deep nebula purple halo; wall shows NO halo. Bugs, bullets, and particles show NO halo. |
| Upgrade swap changes glow color | THEME-04 | Visual rendering | Buy an upgrade on any glowing turret type. Halo color should shift from base to accent white `0xeef2ff`. Existing `0xffdd44` tint and alpha pulse should still work. |
| Canvas-runtime graceful degradation | THEME-04 / THEME-05 | Requires local renderer flip | Temporarily change `src/main.js` from `Phaser.AUTO` to `Phaser.CANVAS`, reload. Expect: exactly one `[postfx] Canvas renderer detected — glow disabled` warning emitted per scene (or equivalent per D-10/D-11 wording). Game remains fully playable. No glow halos, no vignette, no errors. Revert `main.js`. |
| Vignette subtly frames all non-UI scenes | THEME-05 | Visual rendering | Traverse MainMenu → GameScene (build + wave) → GameOver. Each shows a subtle darkening at screen edges. Corners are visibly dimmer than center. Effect should be "felt, not seen." |
| Phase-reactive vignette tween | THEME-05 | Visual rendering | Watch a full build→wave→build cycle in GameScene. At each transition, vignette strength tweens smoothly (~600ms Sine.easeInOut). Wave phase frames slightly stronger than build phase. |
| UIScene unaffected | THEME-05 | Visual rendering | During wave phase, HUD text (credits, HP bar, wave number in corners and bottom center) remains sharp and unvignetted. No darkening around HUD text. |
| 60fps under load | THEME-04 + THEME-05 | Requires browser perf panel | Start wave 10 in Chrome. Open DevTools Performance tab, record 10 seconds with all bugs active including boss. Target: sustained ≥55fps (ideal 60). No dropped frames attributable to FX. |
| No FX leak across scene restarts | — (hygiene) | Requires devtools inspection | In console during a GameScene run: `game.scene.getScene('Game').cameras.main.postFX.list.length` should read `1`. Cycle Game→GameOver→MainMenu→Game three times; the fresh GameScene's `.list.length` should still be `1`. If it grows per cycle, the shutdown cleanup is broken. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify = `npm run build` (or Wave 0 dependency — N/A here)
- [ ] Sampling continuity: no 3 consecutive tasks without the `npm run build` smoke gate
- [ ] Wave 0 covers all MISSING references — N/A, no Wave 0 required
- [ ] No watch-mode flags (project convention from user's global CLAUDE.md — `npx vitest run` not `npx vitest`)
- [ ] Feedback latency < 10s (build is ~5s)
- [ ] Manual QA checklist fully executed before phase sign-off
- [ ] FX leak inspection performed across ≥3 scene cycles
- [ ] Canvas fallback smoke performed once
- [ ] `nyquist_compliant: true` set in frontmatter only after all of the above

**Approval:** pending

---

## Validation Audit 2026-04-17

| Metric | Count |
|--------|-------|
| Tasks audited | 10 |
| Smoke-gate green (`npm run build`) | 10 |
| Behavioral gaps found | 10 |
| Resolved (auto-filled) | 0 |
| Escalated to Manual-Only | 10 (already captured pre-audit) |

**Audit notes:**

- Project has no test framework (`CLAUDE.md` line: "No test framework or linter is configured yet"). Bootstrapping one was rejected as out-of-phase scope per /gsd:validate-phase user gate.
- All 10 tasks pass the only available automated gate: `vite build` (3.03s, 20 modules, no errors).
- All 10 task behaviors are WebGL visual-rendering concerns (preFX glow color, postFX vignette strength, phase-reactive tween timing, Canvas-fallback warning emission). These cannot be meaningfully asserted without a real GPU and were intentionally captured in the Manual-Only table when this VALIDATION.md was authored.
- The Manual-Only table (8 tests) is mirrored in `05-HUMAN-UAT.md` (status: partial, 8 pending) and `05-VERIFICATION.md` (status: human_needed).
- `nyquist_compliant` remains `false` and will flip to `true` only after `05-HUMAN-UAT.md` reaches `status: passed` with all 8 manual tests green and FX-leak inspection performed across ≥3 scene cycles.
