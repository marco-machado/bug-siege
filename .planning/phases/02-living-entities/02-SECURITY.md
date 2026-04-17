---
phase: 2
slug: living-entities
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-17
---

# Phase 2 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

No trust boundaries crossed. Phase 2 contains only client-side game animation logic (sin-wave scale wobble on bugs, alpha pulse tweens on turrets, scale breathing on core) executing in a trusted browser context. No auth, user input validation, data persistence, or network communication.

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| (none)   | N/A — client-side animation only | N/A |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-01 | Denial of Service | Bug.preUpdate sin-wave math | accept | `Math.sin` is O(1); ~60 active bugs × 60fps = negligible CPU cost. No mitigation required. | closed |
| T-02-02 | Denial of Service | Turret `idleTween` lifecycle (repeat: -1) | mitigate | `idleTween.destroy()` called in `Turret.destroy()` (src/entities/Turret.js:315) and during upgrade (src/entities/Turret.js:272) before new tween is created — prevents orphaned infinite tweens from accumulating. | closed |

*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

ASVS V2–V6 (authentication, session, access control, validation, cryptography, error handling) not applicable to client-side game animation logic.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-02-01 | T-02-01 | O(1) trigonometric math per bug per frame; measured negligible impact at 60 active bugs × 60fps. | GSD auto-classification | 2026-04-17 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-17 | 2 | 2 | 0 | /gsd-secure-phase (State B, from artifacts) |

Evidence:
- T-02-01: accepted risk documented in 02-01-PLAN.md threat register; no code path required.
- T-02-02: verified `idleTween.destroy()` at src/entities/Turret.js:272 (upgrade) and :315 (destroy); 8 `idleTween` occurrences ≥ 6 required per 02-02-SUMMARY.md self-check.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-17
