---
phase: 03-juicy-combat
plan: "03"
subsystem: entities
tags: [vfx, particles, turret, muzzle-flash]
dependency_graph:
  requires: [03-01]
  provides: [VFX-02]
  affects: [src/entities/Turret.js]
tech_stack:
  added: []
  patterns: [phaser-particle-emitter, directional-cone-vfx]
key_files:
  modified:
    - src/entities/Turret.js
decisions:
  - "Used Phaser.Math.RadToDeg(rotation - PI/2) to align sprite-up convention with Phaser emitter-right convention"
  - "emitting: false + explode() pattern ensures particles only fire on demand, not continuously"
metrics:
  duration: "5m"
  completed: "2026-04-16"
  tasks: 1
  files: 1
---

# Phase 03 Plan 03: Turret Muzzle Flash Particle Emitter Summary

**One-liner:** Replaced tween-based circle flash with directional Phaser particle emitter firing 5 particles in ±30° forward cone using VFX.MUZZLE config.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace showMuzzleFlash() with directional particle emitter | f137f71 | src/entities/Turret.js |

## What Was Built

`Turret.showMuzzleFlash()` now uses `this.scene.add.particles()` to spawn a directional burst at the barrel tip:

- 5 particles emitted via `emitter.explode(cfg.count, tip.x, tip.y)`
- Cone angle ±30° derived from `Phaser.Math.RadToDeg(this.sprite.rotation - Math.PI / 2)`
- Lifespan 80ms, scale 1.0→0.3, tint 0xffffaa — all from `VFX.MUZZLE` config
- `emitter.on('complete', () => emitter.destroy())` prevents memory leaks

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/entities/Turret.js: modified (VFX import + new showMuzzleFlash body)
- Commit f137f71: present in git log
- Build: passes with no errors
