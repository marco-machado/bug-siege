---
phase: 2
slug: living-entities
status: validated-partial
nyquist_compliant: false
wave_0_complete: false
automated_count: 0
manual_only_count: 4
created: 2026-04-16
updated: 2026-04-17
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (per CLAUDE.md) |
| **Config file** | none — no test framework installed |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + `npm run preview` (visual check)
- **Before `/gsd-verify-work`:** Build must pass + manual UAT against success criteria
- **Max feedback latency:** ~5 seconds (build) + visual inspection

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | ANIM-01, ANIM-04 | — | N/A | manual | `npm run build` (build only) | ✅ | ✅ verified via UAT |
| 2-02-01 | 02 | 1 | ANIM-02 | — | N/A | manual | `npm run build` (build only) | ✅ | ✅ verified via UAT |
| 2-03-01 | 03 | 1 | ANIM-03 | — | N/A | manual | `npm run build` (build only) | ✅ | ✅ verified via UAT |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test framework setup needed. Existing build pipeline (`npm run build`) is the automation gate. All behavioral requirements are perceptual/visual and require a running game.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bugs wobble and squash/stretch while moving | ANIM-01 | Visual/perceptual — no test framework | Run `npm run preview`, start game, observe bugs during wave: they should oscillate scaleX/scaleY |
| Command core pulses with sinusoidal breathing | ANIM-02 | Visual/perceptual — no test framework | Run `npm run preview`, observe core sprite slowly expanding/contracting |
| Turrets have idle alpha pulse, brighter on upgrade | ANIM-03 | Visual/perceptual — no test framework | Build a turret, observe alpha oscillation; upgrade it, confirm faster/deeper pulse |
| Bug types have distinct animation signatures | ANIM-04 | Visual/perceptual — no test framework | Compare swarmer (jittery), brute (heavy), spitter (pulsing) movement animations in-game |

---

## Validation Audit 2026-04-17

| Metric | Count |
|--------|-------|
| Gaps found | 4 (ANIM-01, ANIM-02, ANIM-03, ANIM-04) |
| Resolved (automated) | 0 |
| Escalated to manual-only | 4 |

Rationale: project has no test framework (per CLAUDE.md). All Phase 2 requirements are perceptual/visual animation behaviors. Manual verification performed via `/gsd-verify-work 2` — 5/5 UAT tests passed (commit `dc7139c`).

`nyquist_compliant` remains `false` — phase relies entirely on human UAT for behavioral verification. This is accepted for this project until a test framework is added.

---

## Validation Sign-Off

- [x] All tasks have documented verification path (manual-only with UAT instructions)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify — N/A, no automated tests exist
- [x] Wave 0 covers all MISSING references — N/A, none planned
- [x] No watch-mode flags
- [x] Feedback latency < 10s (build only; UAT latency is human-bound)
- [ ] `nyquist_compliant: true` set in frontmatter — blocked until test framework exists

**Approval:** validated-partial 2026-04-17 (manual-only, UAT verified)
