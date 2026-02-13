# Feature Specification: Bug Siege — Tower Defense Game

**Feature Branch**: `001-bug-siege-game`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "GDD.md — Full game implementation of Bug Siege, a top-down tower defense game where players defend a command center from waves of alien bugs by placing turrets on a grid."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Game Loop: Place Turrets and Defend (Priority: P1)

A player loads the game and enters the main game screen. They see a grid-based base at the center of the screen with a Command Core and four pre-placed starter turrets at the corners. The player clicks empty grid tiles to open a build menu, selects a turret type, and places it. When ready, they start a wave. Bugs spawn from the edges of the map and move toward the Command Core. Turrets fire automatically at nearby bugs. The player watches the action and prepares for the next build phase once the wave is cleared.

**Why this priority**: This is the fundamental gameplay experience. Without the core loop of building and defending, there is no game. Every other feature depends on this working.

**Independent Test**: Can be tested by placing a single turret type on the grid, spawning one bug type, and verifying the turret fires at the bug and the bug moves toward the core. Delivers the core interactive experience.

**Acceptance Scenarios**:

1. **Given** the game has started and the grid is visible, **When** the player clicks an empty grid tile, **Then** a build menu appears showing available structures with their costs.
2. **Given** the build menu is open and the player has enough credits, **When** the player selects a turret, **Then** the turret is placed on the selected tile and credits are deducted.
3. **Given** turrets are placed and a wave is active, **When** bugs enter a turret's range, **Then** the turret automatically fires at the nearest bug.
4. **Given** bugs are moving on the map, **When** a bug reaches the Command Core, **Then** the base takes damage equal to the bug's damage value.
5. **Given** a bug's health reaches zero, **When** it dies, **Then** the player earns credits based on the bug type.

---

### User Story 2 - Building System: Turret Variety, Upgrades, and Selling (Priority: P2)

A player strategically chooses between four structure types to build a defense: Blasters for single-target damage, Zappers for chain damage hitting multiple bugs, Slowfields to slow approaching enemies, and Wall Blocks to redirect bug movement. The player upgrades high-performing turrets for double damage, and sells underperforming ones to recoup 50% of their cost and free up space.

**Why this priority**: Meaningful strategic choice is what differentiates a tower defense game from a passive experience. Multiple turret types and the ability to upgrade/sell create the depth players need to stay engaged.

**Independent Test**: Can be tested by placing each of the four structure types and verifying their unique behaviors (single-target fire, chain hit, slow aura, path blocking). Upgrade and sell flows can each be tested independently.

**Acceptance Scenarios**:

1. **Given** the player opens the build menu, **When** they view available structures, **Then** they see Blaster (50 credits), Zapper (100 credits), Slowfield (75 credits), and Wall Block (25 credits) with descriptions.
2. **Given** a Zapper turret fires at a bug, **When** it hits, **Then** the lightning chains to up to 2 additional nearby bugs.
3. **Given** a Slowfield is placed, **When** bugs enter its range, **Then** they move at reduced speed while within the aura.
4. **Given** a Wall Block is placed, **When** bugs approach it, **Then** they attempt to navigate around it rather than through it.
5. **Given** the player clicks an existing turret, **When** the turret menu appears, **Then** they see upgrade (costs 1.5x base price, doubles damage) and sell (returns 50% of cost) options.
6. **Given** the player has insufficient credits for a structure, **When** they try to place it, **Then** the action is denied and the player is informed they lack credits.

---

### User Story 3 - Wave Progression: Escalating Challenge (Priority: P3)

A player faces 10 increasingly difficult waves. Early waves introduce only Swarmers (fast, weak), middle waves add Brutes (slow, tanky), and later waves mix in Spitters (ranged attackers that target turrets). Wave 10 features a boss — a massive Brute with 10x health — accompanied by a full swarm. Between waves, a countdown timer gives the player time to build and prepare.

**Why this priority**: Progression and escalating difficulty keep the player engaged across the full session. Without wave variety, the game would feel repetitive and flat.

**Independent Test**: Can be tested by advancing through waves 1-3 (Swarmers only), verifying new enemy types appear in waves 4-6, confirming all three types in waves 7-9, and checking the boss spawns in wave 10.

**Acceptance Scenarios**:

1. **Given** the game starts, **When** the player triggers wave 1, **Then** only Swarmer-type bugs spawn.
2. **Given** waves 1-3 are cleared, **When** wave 4 begins, **Then** Brute-type bugs appear alongside Swarmers.
3. **Given** waves 1-6 are cleared, **When** wave 7 begins, **Then** Spitter-type bugs appear alongside Swarmers and Brutes.
4. **Given** waves 1-9 are cleared, **When** wave 10 begins, **Then** a boss Brute with 10x normal health spawns along with a full swarm of all bug types.
5. **Given** a wave is cleared, **When** the next wave is queued, **Then** a countdown timer is shown, giving the player time to build before the next wave starts.
6. **Given** the countdown timer is active, **When** the player presses the start wave button (or spacebar) early, **Then** the next wave starts immediately and the player receives bonus credits.

---

### User Story 4 - Economy: Credits and Rewards (Priority: P4)

A player starts with 200 credits and earns more by killing bugs and clearing waves. Kill rewards vary by bug type (Swarmer: 10, Brute: 25, Spitter: 15). Clearing a wave grants a bonus of 50 + (wave number x 10). The player must manage credits wisely between building new turrets, upgrading existing ones, and saving for later waves.

**Why this priority**: The economy creates resource tension — the core strategic decision-making that makes tower defense games compelling. It must be balanced to allow meaningful choices without making the game trivially easy or impossibly hard.

**Independent Test**: Can be tested by killing bugs of each type and verifying correct credit amounts are awarded, clearing a wave and verifying the wave bonus, and attempting purchases at various credit levels.

**Acceptance Scenarios**:

1. **Given** the game starts, **When** the player enters the first build phase, **Then** they have 200 credits available.
2. **Given** the player kills a Swarmer, **When** credits update, **Then** 10 credits are added.
3. **Given** the player kills a Brute, **When** credits update, **Then** 25 credits are added.
4. **Given** the player kills a Spitter, **When** credits update, **Then** 15 credits are added.
5. **Given** the player clears wave N, **When** the wave bonus is awarded, **Then** the player receives 50 + (N x 10) credits.

---

### User Story 5 - UI and Feedback: HUD, Health Bar, and Game Flow (Priority: P5)

A player sees a clear heads-up display showing the current wave number (out of 10), their credit balance, and a health bar for the base (starting at 100 HP). Visual and audio feedback reinforce actions: turret shots have muzzle effects and sound, bug deaths show particle effects and a splat sound, and wave starts are announced with a horn sound.

**Why this priority**: Clear information display and satisfying feedback make the game feel responsive and polished. Without a readable HUD, players cannot make informed strategic decisions.

**Independent Test**: Can be tested by verifying all HUD elements display correctly, health bar updates when the base takes damage, and credit/wave counters update accurately.

**Acceptance Scenarios**:

1. **Given** the game is running, **When** the player looks at the top of the screen, **Then** they see the current wave number and credit balance.
2. **Given** the base takes damage, **When** the health bar updates, **Then** it visually reflects the current HP out of 100.
3. **Given** a turret fires, **When** the projectile launches, **Then** a visual effect and firing sound play.
4. **Given** a bug dies, **When** the death occurs, **Then** a particle effect and death sound play.

---

### User Story 6 - Win and Lose Conditions (Priority: P6)

A player wins by surviving all 10 waves. Upon winning, a victory screen shows their score including total kills, remaining credits, and remaining base HP. If the base HP reaches 0 at any point, the game ends with a defeat screen showing the wave reached and total kill count. Both screens offer a restart option.

**Why this priority**: Clear end states provide closure and motivation. The score display encourages replayability by giving players goals to improve upon.

**Independent Test**: Can be tested by triggering a game over (letting base HP reach 0) and verifying the defeat screen, and by completing all 10 waves and verifying the victory screen.

**Acceptance Scenarios**:

1. **Given** the base HP reaches 0, **When** the game ends, **Then** a defeat screen displays showing the wave reached and total kill count.
2. **Given** all 10 waves are cleared, **When** the victory condition triggers, **Then** a victory screen displays showing total kills, remaining credits, and remaining base HP.
3. **Given** a win or loss screen is displayed, **When** the player clicks restart, **Then** the game resets to the initial state with 200 credits and full base HP.

---

### User Story 7 - Game Navigation: Menu and Scene Flow (Priority: P7)

A player launches the game and sees a main menu with an option to start the game. From the main menu, they enter the game. Upon winning or losing, they can return to the main menu or restart directly.

**Why this priority**: Scene flow is necessary for a complete experience but is less critical than gameplay mechanics. A minimal menu is sufficient.

**Independent Test**: Can be tested by navigating from the main menu to the game, completing or losing the game, and navigating back to the menu.

**Acceptance Scenarios**:

1. **Given** the game loads, **When** the main menu appears, **Then** the player sees a "Start Game" option.
2. **Given** the player is on the main menu, **When** they click "Start Game", **Then** the game scene loads with the grid, base, and starter turrets.
3. **Given** the game is over (win or lose), **When** the end screen appears, **Then** the player can restart or return to the main menu.

---

### Edge Cases

- What happens when the player tries to build on the Command Core tile? — Build action is denied; the tile is not a valid build slot.
- What happens when the player tries to build on a tile already occupied by a turret? — Build action is denied; the player must sell the existing structure first.
- What happens when all grid tiles are filled? — No more building is possible; the build menu still opens but all placements are invalid. The player can only upgrade or sell.
- What happens when bugs cannot path around walls to reach the core? — Bugs use simple steering toward the core with obstacle avoidance. If fully blocked, they attack the nearest wall to break through.
- What happens if the player never builds any turrets? — Only the four starter turrets defend the base. The game proceeds normally but the player will likely lose quickly.
- What happens when multiple turrets target the same bug? — Each turret independently selects the nearest bug in range. Multiple turrets may fire at the same bug, which is intended behavior.
- What happens when a wave starts but the player has 0 credits? — The wave proceeds normally. The player relies on existing turrets and earns credits from kills.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a grid-based play area with a centered 7x7 build grid containing a Command Core at the exact center and four pre-placed Blaster turrets at the corners (standard Blaster stats, upgradeable and sellable).
- **FR-002**: System MUST allow the player to place structures (Blaster, Zapper, Slowfield, Wall Block) on empty grid tiles by clicking and selecting from a build menu.
- **FR-003**: System MUST prevent placement on occupied tiles, the Command Core tile, and tiles outside the build grid.
- **FR-004**: System MUST deduct the correct credit cost when a structure is placed and prevent placement when the player has insufficient credits.
- **FR-005**: System MUST allow the player to upgrade a turret (doubling its damage at 1.5x base cost) or sell it (returning 50% of its cost) by clicking on it.
- **FR-006**: System MUST support one upgrade tier per turret.
- **FR-007**: Turrets MUST automatically acquire the nearest bug within their range. Projectile-firing turrets (Blaster) MUST use predictive aiming — firing toward the bug's predicted future position based on distance, bullet travel time, and the bug's current velocity.
- **FR-008**: Blaster turrets MUST fire single-target projectiles at 2 shots/sec with 10 damage per shot (20 when upgraded).
- **FR-009**: Zapper turrets MUST fire chain lightning that hits the primary target and up to 2 additional nearby bugs.
- **FR-010**: Slowfield structures MUST emit an aura (2 tile radius, 2.5 when upgraded) that reduces the movement speed of all bugs within range by 50%.
- **FR-011**: Wall Blocks MUST have no attack capability but MUST absorb damage from bugs and influence their movement paths.
- **FR-012**: System MUST spawn bugs from all four edges of the map (north, south, east, west).
- **FR-013**: Bugs MUST move toward the Command Core using steering behavior with obstacle avoidance.
- **FR-014**: When a bug reaches the Command Core, the base MUST take damage equal to the bug's damage value.
- **FR-015**: System MUST track and display base health starting at 100 HP.
- **FR-016**: System MUST support three bug types: Swarmer (fast, low HP, low damage), Brute (slow, high HP, high damage), and Spitter (medium speed, medium HP, ranged attack on turrets).
- **FR-017**: System MUST run 10 waves with escalating difficulty: waves 1-3 (Swarmers only), waves 4-6 (Swarmers + Brutes), waves 7-9 (all types), wave 10 (boss Brute with 10x HP + full swarm).
- **FR-018**: System MUST provide a 20-second build phase countdown between waves, allowing the player to start the next wave early for bonus credits.
- **FR-019**: System MUST award kill credits per bug type: Swarmer 10, Brute 25, Spitter 15.
- **FR-020**: System MUST award a wave clear bonus of 50 + (wave number x 10) credits.
- **FR-021**: System MUST start the player with 200 credits.
- **FR-022**: System MUST display a HUD showing current wave number (out of 10), credit balance, and base health bar.
- **FR-023**: System MUST provide a "Start Wave" button and spacebar shortcut to begin the next wave.
- **FR-024**: System MUST end the game in defeat when base HP reaches 0, displaying wave reached and kill count.
- **FR-025**: System MUST end the game in victory when all 10 waves are cleared, displaying total kills, remaining credits, and remaining base HP.
- **FR-026**: System MUST provide a restart option from both win and lose screens.
- **FR-027**: System MUST provide a main menu with a "Start Game" option.
- **FR-028**: System MUST provide visual feedback for turret firing, bug deaths, wave starts, and building placement. System SHOULD provide audio feedback for these events when audio is implemented.
- **FR-029**: Spitter bugs MUST use ranged attacks that target turrets and Wall Blocks rather than moving to melee range with the core. Turrets (Blaster, Zapper, Slowfield) are indestructible; only Wall Blocks can be destroyed by bug attacks.
- **FR-030**: Wall Blocks MUST have a finite HP pool. When a Wall Block's HP reaches 0, it is destroyed and the tile becomes empty.

### Key Entities

- **Command Core**: The central structure the player must protect. Has 100 HP. Primary target for all bugs. Occupies one tile in the center of the build grid.
- **Turret**: Player-built defensive structure placed on grid tiles. Has a type (Blaster, Zapper, Slowfield, Wall Block), a cost, a range, fire rate, damage, and one available upgrade tier. Blasters, Zappers, and Slowfields are indestructible once placed. Wall Blocks have finite HP and can be destroyed by bugs.
- **Bug**: Enemy unit that spawns from map edges and moves toward the Command Core. Has a type (Swarmer, Brute, Spitter), speed, HP, damage value, and kill reward.
- **Wave**: A timed enemy spawn event defining which bug types and quantities appear. 10 waves total with escalating composition.
- **Credits**: The player's currency used to build and upgrade structures. Earned from kills and wave bonuses.
- **Build Grid**: A 7x7 tile grid centered on screen. Contains the Command Core at the exact center, four starter turrets at the corners, and empty slots for player construction.

### Balance Tables

#### Structure Stats

| Structure | Cost | Range (tiles) | Fire Rate (shots/sec) | Damage | Upgrade Cost | Upgraded Damage | HP |
|-----------|------|---------------|----------------------|--------|-------------|----------------|-----|
| Blaster | 50 | 3 | 2.0 | 10 | 75 | 20 | — |
| Zapper | 100 | 2.5 | 0.8 | 15 (per chain target, up to 3) | 150 | 30 | — |
| Slowfield | 75 | 2 | — (continuous aura, 50% slow) | — | 112 | — (range +0.5 tiles) | — |
| Wall Block | 25 | — | — | — | 37 | — (HP doubled) | 100 |

#### Bug Stats

| Bug Type | Speed (px/sec) | HP | Damage to Core | Damage to Walls | Kill Reward |
|----------|---------------|-----|---------------|----------------|-------------|
| Swarmer | 60 | 30 | 5 | 5 | 10 |
| Brute | 30 | 150 | 20 | 20 | 25 |
| Spitter | 35 | 60 | 10 | 15 (ranged, 3 tile range, 1 shot/sec) | 15 |
| Boss Brute | 15 | 1500 | 40 | 40 | 100 |

#### Wave Composition

| Wave | Swarmers | Brutes | Spitters | Boss | Total Bugs |
|------|----------|--------|----------|------|------------|
| 1 | 6 | — | — | — | 6 |
| 2 | 10 | — | — | — | 10 |
| 3 | 15 | — | — | — | 15 |
| 4 | 12 | 3 | — | — | 15 |
| 5 | 15 | 5 | — | — | 20 |
| 6 | 18 | 8 | — | — | 26 |
| 7 | 15 | 6 | 4 | — | 25 |
| 8 | 18 | 8 | 6 | — | 32 |
| 9 | 20 | 10 | 8 | — | 38 |
| 10 | 15 | 8 | 6 | 1 | 30 |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can complete a full 10-wave session in 8 to 12 minutes.
- **SC-002**: A player can place, upgrade, and sell structures within 2 seconds per action (no perceptible delay).
- **SC-003**: All four turret types exhibit visually distinct behaviors that the player can differentiate at a glance.
- **SC-004**: A player who builds no additional turrets (relying only on the four starters) loses before wave 5, confirming the game requires active strategy.
- **SC-005**: A player using all available turret types and upgrades can survive all 10 waves, confirming the game is winnable with good play.
- **SC-006**: The player always knows the current game state: wave number, credits, and base health are visible at all times during gameplay.
- **SC-007**: The game runs at a smooth, consistent frame rate with up to 50 bugs on screen simultaneously.
- **SC-008**: A new player can understand the build menu and place their first turret without external instructions within 30 seconds.

## Clarifications

### Session 2026-02-08

- Q: Grid size discrepancy — GDD says 4x4, spec says 6x6. Which is correct? → A: 7x7 grid (44 open build slots for strategic depth, core at exact center).
- Q: Can Spitters destroy turrets? Do all structures have HP? → A: Only Wall Blocks are destructible; turrets are indestructible.
- Q: Concrete numeric balance values for turrets and bugs? → A: Derive reasonable defaults (balance table added to spec).
- Q: What type are the four pre-placed starter turrets? → A: Starters are Blasters (same stats as player-built Blasters, upgradeable and sellable).
- Q: How long is the build phase countdown between waves? → A: 20 seconds.

## Assumptions

- The game is single-player only with no save system — each session is a standalone experience.
- The canvas size is fixed at 800x600 pixels; no responsive or mobile layout is required.
- Bugs use simple vector-based steering toward the core with basic obstacle avoidance, not full pathfinding algorithms.
- Wall Blocks can be destroyed by bugs if they are attacked, serving as temporary barriers rather than permanent walls.
- Only one upgrade tier exists per turret — there is no further upgrade path beyond the first upgrade.
- The game uses keyboard (spacebar) and mouse (click) controls only — no gamepad or touch support required.
- Audio is optional for gameplay (the game is fully playable without sound).
- Placeholder art (geometric shapes) is acceptable for the initial implementation; polished sprites can be swapped in later.
- The game is built with **Phaser 3** using Arcade Physics, with scenes for Boot, MainMenu, Game, and GameOver (per GDD).
- Target: under 2,000 lines of code total (per GDD scope constraint).
- Grid tile size is 64x64 pixels. Build grid is 384x384 px centered on the 800x600 canvas.
