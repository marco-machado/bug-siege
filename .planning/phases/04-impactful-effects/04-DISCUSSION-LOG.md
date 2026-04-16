# Phase 4: Impactful Effects - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 04-impactful-effects
**Mode:** power (file-based Q&A)
**Areas discussed:** Slowfield Particle Aura, Zapper Lightning Trail, Screen Shake System

---

## Slowfield Particle Aura

### Q-01: Aura visual style

| Option | Description | Selected |
|--------|-------------|----------|
| Orbiting particles | Small particles orbit the turret in a circle at the aura radius. 8-12 particles per slowfield. | |
| Radial pulse waves | Periodic bursts of particles that expand outward from turret center to the edge of the range, like sonar pings. | ✓ |
| Floating drift field | Particles spawn randomly within the aura radius and drift slowly inward/outward with gentle turbulence. | |

**User's choice:** Radial pulse waves
**Notes:** None

### Q-02: Aura color

| Option | Description | Selected |
|--------|-------------|----------|
| Keep cyan (0x44ddff) | Maintains distinct slowfield identity — cyan reads as 'ice/slow' and contrasts well with purple nebula. | |
| Cosmic purple-blue tints | Use THEME nebula colors (0x6a4c93, 0x9966ff) to match the cosmic palette immediately. | ✓ |

**User's choice:** Cosmic purple-blue tints
**Notes:** None

### Q-03: Upgraded slowfield aura change

| Option | Description | Selected |
|--------|-------------|----------|
| Bigger radius only | Particles simply cover the expanded range. No other visual change. | |
| Bigger radius + denser particles | More particles (1.5x count) in the expanded radius. | |
| Bigger radius + brighter/different tint | Expanded radius plus a brighter accent color to visually distinguish upgraded from base. | ✓ |

**User's choice:** Bigger radius + brighter/different tint
**Notes:** None

---

## Zapper Lightning Trail

### Q-04: Trail visual approach

| Option | Description | Selected |
|--------|-------------|----------|
| Particle trail along path | Spawn 3-5 particles at intervals along each chain segment. Particles fade out over ~300ms. | |
| Wider glowing line with fade | Replace 2px line with thicker (4-6px) semi-transparent line that fades over 400ms. | |
| Both: thick line + particle trail | Wider/brighter line AND spawn particles along the path that linger after the line fades. | ✓ |

**User's choice:** Both: thick line + particle trail
**Notes:** None

### Q-05: Trail color treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Same purple, lower alpha | Trail uses 0xaa44ff at reduced opacity (0.4-0.6), fading to 0. | |
| Lighter/whiter glow | Trail particles use accent white (0xeef2ff) or light purple. Hot center fading to cool edges. | ✓ |

**User's choice:** Lighter/whiter glow
**Notes:** None

---

## Screen Shake System

### Q-06: Core damage shake intensity

| Option | Description | Selected |
|--------|-------------|----------|
| Linear scaling with cap | Map damage linearly to intensity with a hard cap at 0.05. | |
| Tiered levels (light/medium/heavy) | Three fixed shake levels: light (0.005), medium (0.015), heavy (0.04). | ✓ |

**User's choice:** Tiered levels (light/medium/heavy)
**Notes:** None

### Q-07: Shake duration

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed short duration (100-150ms) | All shakes are brief punchy jolts. Consistent feel. | |
| Duration scales with intensity | Light: 80ms, medium: 150ms, heavy: 250ms. | ✓ |

**User's choice:** Duration scales with intensity
**Notes:** None

### Q-08: Shake stacking behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Replace (latest wins) | Each new shake interrupts the current one. Prevents sustained vibration. | ✓ |
| Additive with cap | Shakes accumulate intensity but cap at a maximum. | |
| Cooldown-based | Skip shake if one is already playing. | |

**User's choice:** Replace (latest wins)
**Notes:** None

### Q-09: Boss micro-shake trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Every hit, very subtle (0.002, 50ms) | Trigger micro-shake on every boss takeDamage(). Extremely subtle. | |
| HP threshold milestones | Shake only when boss crosses 75%/50%/25% HP thresholds. | |
| Cooldown-throttled (every 500ms max) | Micro-shake on hits but no more than once every 500ms. | ✓ |

**User's choice:** Cooldown-throttled (every 500ms max)
**Notes:** None

---

## Claude's Discretion

- Exact particle count and lifespan for slowfield pulse waves
- Exact thickness of the enhanced zapper line (4-6px range)
- Number of trail particles per chain segment (3-5 range)
- Easing curves for shake decay
- Whether turret destruction shake uses medium or heavy tier

## Deferred Ideas

None
