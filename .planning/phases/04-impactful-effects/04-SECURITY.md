---
phase: 4
slug: impactful-effects
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-17
---

# Phase 4 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

No trust boundaries crossed. Phase 4 contains only client-side VFX logic (particle emitters, aura ring tweens, camera shake) executing in a trusted browser context. No auth, user input validation, data persistence, or network communication.

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| (none)   | N/A — client-side VFX only | N/A |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-04-01 | Denial of Service | Particle emitters (global) | accept | Particle budget capped by frozen `VFX` config (SLOWFIELD, ZAPPER_TRAIL, SHAKE). No user-controlled input to particle counts. 60fps performance validated in UAT. | closed |
| T-04-02 | Denial of Service | Slowfield aura lifecycle | mitigate | Implementation pivoted to `auraTween` + `auraRing` (Graphics-based pulsing ring, not a persistent emitter). Both destroyed and nulled in `Turret.destroy()` at src/entities/Turret.js:375-382 — prevents orphaned infinite tweens and graphics objects on turret removal. | closed |
| T-04-03 | Denial of Service | Zapper trail emitter per fire | mitigate | `spawnTrailParticles` schedules `scene.time.delayedCall(cfg.trailLifespan + 50, () => emitter.destroy())` at src/entities/Turret.js:242 — bounded emitter lifetime prevents accumulation over successive fires. | closed |
| T-04-04 | Denial of Service | Camera shake stacking | accept | Phaser `camera.shake(duration, intensity, force=true)` replaces any in-progress shake rather than compounding. No amplification vector. | closed |
| T-04-05 | Information Disclosure | Camera shake | accept | Client-side game with no sensitive data rendered. Camera shake reveals no hidden information — nothing to disclose. | closed |

*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

ASVS V2–V6 (authentication, session, access control, validation, cryptography, error handling) not applicable to client-side VFX logic.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-04-01 | T-04-01 | Particle counts are frozen compile-time constants (`Object.freeze(VFX)`) with no user-controlled input. 60fps confirmed via UAT with 60 bugs + 70 bullets + active VFX. | GSD auto-classification | 2026-04-17 |
| R-04-02 | T-04-04 | Phaser `force:true` flag on camera shake is the framework-sanctioned mechanism for non-stacking shakes; no additional control required. | GSD auto-classification | 2026-04-17 |
| R-04-03 | T-04-05 | Client-side single-user game renders no sensitive data. Information Disclosure is a null-risk category here. | GSD auto-classification | 2026-04-17 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-17 | 5 | 5 | 0 | /gsd-secure-phase (State B, from artifacts) |

Evidence:
- T-04-01: accepted risk documented in 04-01-PLAN.md threat register; particle budget enforced via frozen `VFX` config.
- T-04-02: verified `auraTween.destroy() + auraTween = null` and `auraRing.destroy() + auraRing = null` at src/entities/Turret.js:375-382.
- T-04-03: verified `scene.time.delayedCall(cfg.trailLifespan + 50, () => emitter.destroy())` at src/entities/Turret.js:242.
- T-04-04: accepted risk; mitigation is framework-native (`force: true`).
- T-04-05: accepted risk; null category for single-user client-side game.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-17
