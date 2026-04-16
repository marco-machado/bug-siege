---
phase: 2
slug: living-entities
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
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
| 2-01-01 | 01 | 1 | ANIM-01, ANIM-04 | — | N/A | manual | `npm run build` | ✅ | ⬜ pending |
| 2-02-01 | 02 | 1 | ANIM-02 | — | N/A | manual | `npm run build` | ✅ | ⬜ pending |
| 2-03-01 | 03 | 1 | ANIM-03 | — | N/A | manual | `npm run build` | ✅ | ⬜ pending |

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

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
