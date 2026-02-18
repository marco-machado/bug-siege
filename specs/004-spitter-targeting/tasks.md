# Tasks: Spitter Targeting All Turrets

**Input**: Design documents from `/specs/004-spitter-targeting/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: No test framework configured. Verification is manual playtesting per quickstart.md.

**Organization**: Tasks grouped by user story. Both stories are satisfied by a single code change — the existing `findAttackTarget()` already uses nearest-first selection; it just filters to walls only.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 - Spitter Attacks Any Turret in Range (Priority: P1) MVP

**Goal**: Remove the wall-only restriction so Spitters fire at blaster, zapper, slowfield, and wall turrets within their 192px attack range.

**Independent Test**: Place a blaster turret within Spitter attack range with no walls nearby. The Spitter should stop and fire at the blaster. Use debug key `3` (with `VITE_DEBUG_KEYS=true`) to spawn Spitters during wave phase.

### Implementation for User Story 1

- [x] T001 [US1] Remove the `if (turret.type !== 'wall') continue;` type filter on line 104 of `findAttackTarget()` in `src/entities/Bug.js`

**Checkpoint**: Spitters now target all turret types. Nearest-first selection (US2) is already the algorithm — no additional code change required.

---

## Phase 2: User Story 2 - Spitter Prioritizes Nearest Turret (Priority: P2)

**Goal**: Confirm that Spitters target the nearest turret regardless of type.

**Independent Test**: Place two turrets at different distances within Spitter range. The Spitter should fire at the closer one.

### Implementation for User Story 2

No code changes required. The existing `findAttackTarget()` algorithm already iterates all turrets and tracks the nearest one within `attackRange` via `minDist` comparison. Removing the wall-only filter in T001 is sufficient.

- [ ] T002 [US2] Verify nearest-first targeting across mixed turret types per acceptance scenarios in `specs/004-spitter-targeting/spec.md` — manual playtest with debug keys (MANUAL)

**Checkpoint**: Both user stories verified. Spitters target nearest turret of any type.

---

## Phase 3: Polish & Cross-Cutting Concerns

- [ ] T003 Run full manual playtest per `specs/004-spitter-targeting/quickstart.md` — verify all 5 acceptance scenarios for US1, all 3 for US2, and all 3 edge cases (MANUAL)
- [ ] T004 Verify no regression: Spitters with no turrets in range still steer toward core; existing wall targeting unchanged; core melee behavior unchanged (MANUAL)

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (Phase 1)**: No dependencies — can start immediately
- **US2 (Phase 2)**: Depends on T001 — verification only, no code change
- **Polish (Phase 3)**: Depends on T001 completion

### User Story Dependencies

- **User Story 1 (P1)**: Independent — single line removal in `src/entities/Bug.js`
- **User Story 2 (P2)**: Satisfied by US1's change — verification task only

### Parallel Opportunities

None applicable — this is a single-line change in a single file. All tasks are sequential.

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete T001: Remove wall-only filter
2. **STOP and VALIDATE**: Test with debug keys — spawn Spitter near a blaster
3. If working, proceed to verification tasks

### Full Delivery

1. T001 → Core behavioral change
2. T002 → Nearest-first verification
3. T003, T004 → Full playtest + regression check

---

## Notes

- Total code change: 1 line removed from 1 file
- No config changes, no new files, no new dependencies
- The collision system (`wallBodies` group + `onSpitterBulletHitWall` callback) already handles all turret types — research.md documents why
- `wallDamage` property name retained despite now applying to all turrets (cosmetic rename out of scope)
