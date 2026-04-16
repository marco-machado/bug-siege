# Phase 3: Juicy Combat - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 03-juicy-combat
**Mode:** auto
**Areas discussed:** Particle API, Texture strategy, Emitter lifecycle, Config location, Bug death bursts, Muzzle flash, Boss death, Build sparkle, Core shockwave

---

## Particle API

| Option | Description | Selected |
|--------|-------------|----------|
| Modern API (`this.add.particles(x, y, key, config)`) | Phaser 3.60+ API, supported on Phaser 3.80+ | ✓ |
| Legacy API (`createEmitter()`) | Deprecated in Phaser 3.60, removed in future versions | |

**User's choice:** [auto] Modern API — Phaser 3.80 in use, legacy API deprecated
**Notes:** Use `explode(count, x, y)` for fire-and-forget burst events

---

## Texture Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Add particle textures in BootScene | 4px runtime-generated circles, consistent with existing pattern | ✓ |
| Use existing textures (bug, bullet sprites) | Reuse but suboptimal particle appearance | |
| External PNG particle sheet | Violates all-runtime-generated constraint | |

**User's choice:** [auto] Add in BootScene — consistent with Phase 1 precedent

---

## Emitter Lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Fire-and-forget one-shot (`explode()` + `maxParticles`) | Auto-destroys after particles expire — correct for burst events | ✓ |
| Persistent emitters, manually stopped | Requires lifecycle management, risk of leaks | |

**User's choice:** [auto] Fire-and-forget — no persistent state needed for these effects

---

## Config Location

| Option | Description | Selected |
|--------|-------------|----------|
| Add `VFX` frozen object to `GameConfig.js` | Consistent with centralized config pattern | ✓ |
| Inline constants in effect methods | Breaks established pattern, harder to tune | |

**User's choice:** [auto] GameConfig.js VFX object — follows frozen config pattern

---

## Bug Death Bursts (VFX-01)

**User's choice:** [auto] 10 particles per death, per-type colors retained, spread 40px, lifespan 350ms
**Notes:** Colors kept from existing: swarmer green, brute red, spitter orange, boss purple

---

## Muzzle Flash (VFX-02)

**User's choice:** [auto] 5 particles, narrow forward cone ±30°, lifespan 80ms, color 0xffffaa
**Notes:** Directional, not omnidirectional — keeps visual clarity during combat

---

## Boss Death Burst (VFX-07)

**User's choice:** [auto] 30 particles, all 4 bug-type colors mixed, spread 80px, lifespan 600ms
**Notes:** 3× count vs regular death, distinctive multi-color treatment

---

## Build Sparkle (VFX-03)

**User's choice:** [auto] 12 particles, THEME nebula accent tints, lifespan 400ms with slight upward float
**Notes:** Replaces plain rectangle flash with thematically appropriate sparkle

---

## Core Shockwave (VFX-05)

**User's choice:** [auto] Expanding ring via Graphics (not particles) — ring 30px→120px, alpha fade, 400ms
**Notes:** A ring reads as "shockwave" better than scattered particles; scales with damage (1–2 rings)

---

## Claude's Discretion

- Exact easing curves for particle movement
- Whether to add particle rotation
- Performance fallback strategy if frame budget exceeded

## Deferred Ideas

None — analysis stayed within phase scope
