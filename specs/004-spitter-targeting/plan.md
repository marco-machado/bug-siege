# Implementation Plan: Spitter Targeting All Turrets

**Branch**: `004-spitter-targeting` | **Date**: 2026-02-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-spitter-targeting/spec.md`

## Summary

Remove the wall-only filter in `Bug.findAttackTarget()` so Spitter bugs target the nearest turret of any type (blaster, zapper, slowfield, wall) within attack range. The collision system already supports this — every turret's `wallBody` is in the `wallBodies` static group with a `turretRef` back-pointer, so spitter bullet overlap detection and damage application work for all turret types without changes.

## Technical Context

**Language/Version**: JavaScript (ES modules), no transpilation
**Primary Dependencies**: Phaser 3 (Arcade Physics), Vite
**Storage**: N/A
**Testing**: No test framework configured; manual playtesting
**Target Platform**: Browser (desktop), 1920×1080 fixed canvas
**Project Type**: Single project (Phaser 3 game)
**Performance Goals**: 60 FPS sustained during wave phase
**Constraints**: <2,000 LOC, Phaser 3 APIs only, Arcade Physics only
**Scale/Scope**: Single-player tower defense, 10 waves, ~10 min session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Justification |
|---|---|---|
| I. Phaser 3 Native | PASS | No new libraries. Uses existing Phaser physics overlap system. |
| II. Grid-Authoritative | PASS | No grid changes. Targeting uses pixel-distance between sprites (existing pattern). |
| III. Data-Driven Configuration | PASS | No config changes. Reuses existing `wallDamage`, `attackRange`, `attackRate` stats. |
| IV. Object Pooling | PASS | Existing spitter bullet pool (maxSize: 20) unchanged. |
| V. Scope Lock | PASS | Aligns with GDD intent: "Ranged attack on turrets" — not a new feature, a bug fix. |

## Project Structure

### Documentation (this feature)

```text
specs/004-spitter-targeting/
├── plan.md              # This file
├── research.md          # Phase 0 output — findings on current implementation
├── data-model.md        # Phase 1 output — entity impact analysis
├── quickstart.md        # Phase 1 output — implementation guide
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (files touched)

```text
src/
└── entities/
    └── Bug.js           # Remove wall-only filter in findAttackTarget()
```

**Structure Decision**: Existing single-project layout. Only one file requires a code change (`src/entities/Bug.js`). No new files, no new directories.

## Complexity Tracking

> No constitution violations. Table omitted.
