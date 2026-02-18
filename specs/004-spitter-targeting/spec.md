# Feature Specification: Spitter Targeting All Turrets

**Feature Branch**: `004-spitter-targeting`
**Created**: 2026-02-17
**Status**: Draft
**Input**: User description: "Spitter targeting — only shoots walls, not all turrets as GDD implies"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Spitter Attacks Any Turret in Range (Priority: P1)

As a player, I expect Spitter bugs to fire at any turret type (blaster, zapper, slowfield, wall) within their attack range, not only walls. This matches the GDD description of "Ranged attack on turrets" and creates meaningful threat to offensive placements.

**Why this priority**: This is the core behavioral fix. Without it, Spitters pose no threat to offensive turrets, undermining their intended role as a counter to turret-heavy strategies.

**Independent Test**: Place a blaster turret within Spitter attack range with no walls nearby. The Spitter should stop and fire at the blaster.

**Acceptance Scenarios**:

1. **Given** a Spitter is within 192px of a blaster turret and no wall is closer, **When** the Spitter evaluates targets, **Then** it fires at the blaster turret.
2. **Given** a Spitter is within range of a zapper, **When** the Spitter evaluates targets, **Then** it fires at the zapper.
3. **Given** a Spitter is within range of a slowfield, **When** the Spitter evaluates targets, **Then** it fires at the slowfield.
4. **Given** a Spitter is within range of a wall, **When** the Spitter evaluates targets, **Then** it fires at the wall (existing behavior preserved).
5. **Given** no turrets are within 192px, **When** the Spitter evaluates targets, **Then** it steers toward the core as normal.

---

### User Story 2 - Spitter Prioritizes Nearest Turret (Priority: P2)

As a player, I expect the Spitter to target the nearest turret within range regardless of type, so its behavior is predictable and I can plan defenses accordingly.

**Why this priority**: Target selection logic determines how the player reads and counters Spitter behavior. Nearest-first is the simplest and most intuitive rule.

**Independent Test**: Place two turrets at different distances within Spitter range. The Spitter should fire at the closer one.

**Acceptance Scenarios**:

1. **Given** a wall at 100px and a blaster at 150px from the Spitter, **When** the Spitter picks a target, **Then** it targets the wall (nearest).
2. **Given** a blaster at 100px and a wall at 150px, **When** the Spitter picks a target, **Then** it targets the blaster (nearest).
3. **Given** the nearest turret is destroyed, **When** the Spitter re-evaluates targets, **Then** it switches to the next nearest turret in range.

---

### Edge Cases

- What happens when a Spitter is equidistant from two turrets? It picks whichever is found first in the turret list — no tie-breaking needed.
- What happens when the targeted turret is destroyed mid-attack? The Spitter re-evaluates targets on its next attack cycle and either picks a new target or resumes steering toward the core.
- Can Spitters damage the core directly if they reach it? Yes — existing melee behavior at the core is unchanged by this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Spitter bugs MUST consider all turret types (blaster, zapper, slowfield, wall) as valid attack targets.
- **FR-002**: Spitter bugs MUST select the nearest turret within their configured attack range as their target.
- **FR-003**: Spitter bullets MUST deal the Spitter's configured damage to any turret type they hit.
- **FR-004**: When no turrets are within range, Spitter bugs MUST continue steering toward the core.
- **FR-005**: Spitter attack range, attack rate, and damage values MUST remain unchanged from current configuration.

### Key Entities

- **Spitter Bug**: A ranged bug type that stops and fires projectiles at the nearest turret within its attack range. Currently restricted to walls; this feature removes that restriction.
- **Turret (all types)**: Any player-placed defensive structure (blaster, zapper, slowfield, wall) that can be targeted and damaged by Spitter projectiles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Spitter bugs engage and fire at all four turret types (blaster, zapper, slowfield, wall) when within range.
- **SC-002**: Target selection consistently picks the nearest turret regardless of type.
- **SC-003**: Existing Spitter behaviors (steering, core damage, despawn on kill) remain unchanged.
- **SC-004**: Game balance impact is observable — Spitters now threaten offensive turrets, creating a reason for players to position walls as shields for their offense.

## Assumptions

- The Spitter's existing `wallDamage` stat applies to all turret types, not just walls. No new damage stat is introduced.
- No target priority weighting by turret type is needed — nearest-first is sufficient.
- The Spitter bullet visual and speed remain the same regardless of target type.
