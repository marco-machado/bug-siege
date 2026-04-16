---
phase: 4
slug: impactful-effects
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None -- no test framework configured |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + visual inspection in browser
- **Before `/gsd-verify-work`:** Full visual verification of all 6 requirements in browser
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | VFX-04 | — | N/A | manual-only | Visual: place slowfield, observe pulse waves | N/A | ⬜ pending |
| 04-01-02 | 01 | 1 | VFX-06 | — | N/A | manual-only | Visual: place zapper near bugs, observe trail | N/A | ⬜ pending |
| 04-02-01 | 02 | 1 | SHAKE-01 | — | N/A | manual-only | Visual: let bugs reach core, observe shake intensity | N/A | ⬜ pending |
| 04-02-02 | 02 | 1 | SHAKE-02 | — | N/A | manual-only | Visual: let spitter destroy a wall, observe shake | N/A | ⬜ pending |
| 04-02-03 | 02 | 1 | SHAKE-03 | — | N/A | manual-only | Visual: spawn boss, fire at it, observe micro-shake | N/A | ⬜ pending |
| 04-02-04 | 02 | 1 | SHAKE-04 | — | N/A | manual-only | Visual: during any shake, verify HUD stable | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test infrastructure to create — validation is build-check + visual inspection.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slowfield particle aura with pulse waves | VFX-04 | Visual VFX -- requires human observation | Place 2-3 slowfield turrets. Observe purple pulse waves expanding outward from center rhythmically. Upgrade one and verify larger radius + brighter tint. |
| Zapper glow trail particles | VFX-06 | Visual VFX -- requires human observation | Place a zapper near bug spawn. Observe wider glowing line + lingering trail particles on chain. |
| Core damage camera shake | SHAKE-01 | Visual VFX -- requires human observation | Let a swarmer reach core (light shake), then a brute (medium shake -- noticeably stronger). |
| Turret/wall destruction shake | SHAKE-02 | Visual VFX -- requires human observation | Let bugs destroy a wall. Observe medium shake. |
| Boss hit micro-shake | SHAKE-03 | Visual VFX -- requires human observation | Spawn boss (debug key 4). Fire at it. Observe periodic micro-shakes (not every hit -- 500ms cooldown). |
| HUD stability during shake | SHAKE-04 | Visual VFX -- requires human observation | During any shake, verify HUD (wave text, credits, HP bar) remains perfectly stable. |

**Justification for manual-only:** No test framework is configured. Visual effects require human observation. Automated validation is limited to `npm run build` (no compile errors).

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
