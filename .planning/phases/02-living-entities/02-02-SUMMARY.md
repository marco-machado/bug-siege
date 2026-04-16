---
phase: 02-living-entities
plan: "02"
subsystem: animation
tags: [tween, animation, turret, core, idle]
dependency_graph:
  requires: []
  provides: [ANIM-02, ANIM-03]
  affects: [src/scenes/GameScene.js, src/entities/Turret.js]
tech_stack:
  added: []
  patterns: [Phaser tweens infinite yoyo, tween lifecycle store-reference pattern]
key_files:
  created: []
  modified:
    - src/scenes/GameScene.js
    - src/entities/Turret.js
decisions:
  - "Used baseScale * 1.06 (relative) not absolute 1.06 to keep breathing proportional after setDisplaySize"
  - "Used alpha (not tint) for idle pulse to avoid conflict with upgrade tint (0xffdd44)"
  - "destroy() before sprite.destroy() follows hpTween pattern and prevents orphaned tweens"
metrics:
  duration: ~5min
  completed: "2026-04-16"
  tasks: 2
  files: 2
---

# Phase 2 Plan 02: Core Breathing & Turret Idle Pulse Summary

**One-liner:** Infinite sinusoidal breathing on coreSprite and alpha idle pulse lifecycle (create/replace/destroy) on non-wall turrets using Phaser tweens.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Core breathing tween in GameScene.renderCore() | 53edb2e | src/scenes/GameScene.js |
| 2 | Idle alpha pulse tween lifecycle in Turret | 76d8624 | src/entities/Turret.js |
| 3 | Visual verification checkpoint | auto-approved | — |

## What Was Built

**Task 1 — GameScene.renderCore():** After `this.coreSprite = ...setDisplaySize(...)`, captures `baseScale = this.coreSprite.scaleX` and starts an infinite yoyo scale tween from `baseScale` to `baseScale * 1.06` over 1800ms with Sine.easeInOut. The 6% relative pulse feels like calm breathing without disturbing the damageCore() tint logic.

**Task 2 — Turret idle tween lifecycle:**
- Constructor: initializes `this.idleTween = null`, then for non-wall types creates an alpha tween (0.75 → 1.0, 1200ms, Sine.easeInOut, yoyo, repeat: -1).
- upgrade(): destroys existing idleTween and creates a wider/faster variant (0.65 → 1.0, 900ms) before setting tint.
- destroy(): null-checks and destroys idleTween before sprite.destroy() to prevent orphaned infinite tweens (mitigates T-02-02).

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigation

T-02-02 (DoS via orphaned infinite tweens): mitigated. Turret.destroy() calls idleTween.destroy() before sprite.destroy(). Verified by grep and code review.

## Self-Check: PASSED

- src/scenes/GameScene.js: modified with breathing tween, commit 53edb2e confirmed
- src/entities/Turret.js: modified with idleTween lifecycle, commit 76d8624 confirmed
- `grep -c 'idleTween' src/entities/Turret.js` → 8 (≥6 required)
- `npm run build` → exit 0
