# Tasks: Bug Siege — Tower Defense Game

**Input**: Design documents from `/specs/001-bug-siege-game/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No automated tests — testing is manual/visual per plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root (no `tests/` — manual testing only)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, build tooling, and entry points

- [x] T001 Initialize project with `package.json` (phaser, vite dependencies) and `vite.config.js` per research.md config in `package.json` and `vite.config.js`
- [x] T002 Create HTML entry point in `index.html` that loads `src/main.js` as ES module
- [x] T003 Create Phaser game initialization with Arcade Physics config in `src/main.js` (800x600 canvas, register all 5 scenes)
- [x] T004 Create `GameConfig.js` with all frozen config exports (GRID, TURRETS, BUGS, WAVES, ECONOMY, GAME) per game-config-contract.md in `src/config/GameConfig.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entities and systems that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Implement Grid entity with 6x6 cell array, `gridToWorld()`/`worldToGrid()` coordinate conversion, initial layout (core + 4 starter positions), and placement validation in `src/entities/Grid.js`
- [x] T006 [P] Implement BootScene that generates all placeholder textures via Phaser Graphics API (turret rectangles with barrels, bug circles per type/size, bullet circles, core rectangle, grid tile outlines, wall block rectangle) in `src/scenes/BootScene.js`
- [x] T007 [P] Implement EconomyManager with credits tracking, spend/earn/canAfford methods, sell refund calculation (50%), wave bonus calculation (50 + wave×10), and event emission in `src/systems/EconomyManager.js`
- [x] T008 Implement Bullet entity class extending Phaser.Physics.Arcade.Sprite with pooled lifecycle (activate at position with velocity, despawn on hit or out-of-bounds, disable physics body on despawn) in `src/entities/Bullet.js`

**Checkpoint**: Foundation ready — Grid, config, economy, projectiles, and placeholder assets all available

---

## Phase 3: User Story 1 — Core Game Loop: Place Turrets and Defend (Priority: P1) 🎯 MVP

**Goal**: Player can place a turret on the grid, start a wave, and watch turrets auto-fire at bugs moving toward the core. Bugs damage the core on contact. Killing bugs awards credits.

**Independent Test**: Place a Blaster on the grid, start wave 1, verify turret fires at Swarmers, Swarmers move toward core, core takes damage on contact, killing a Swarmer awards 10 credits.

### Implementation for User Story 1

- [x] T009 [US1] Implement Turret entity class with targeting (nearest bug in range), fire rate timer, rotation toward target, and fire method that spawns a Bullet from pool in `src/entities/Turret.js`
- [x] T010 [US1] Implement Bug entity class with vector steering toward Command Core position, obstacle avoidance, damage-on-contact with core (deal damage + despawn to pool), and HP/damage tracking in `src/entities/Bug.js`
- [x] T011 [US1] Implement WaveManager with wave config reading, staggered bug spawning from random map edges (N/S/E/W), `bugsAlive` counter, wave completion detection, and wave bonus awarding in `src/systems/WaveManager.js`
- [x] T012 [US1] Implement BuildSystem with click-on-empty-tile to open build menu, structure selection, credit validation via EconomyManager, turret placement on grid, and menu close behavior in `src/systems/BuildSystem.js`
- [x] T013 [US1] Implement GameScene with grid rendering, physics groups (bugs pool maxSize:60, bullets pool maxSize:50), overlap detection (bullets↔bugs), collider (bugs↔core), phase management (build/wave), starter turret placement, and game loop (turret targeting + bug steering in update) in `src/scenes/GameScene.js`

**Checkpoint**: Core game loop functional — place Blasters, start wave 1, turrets fire, bugs attack, credits earned

---

## Phase 4: User Story 2 — Building System: Turret Variety, Upgrades, and Selling (Priority: P2)

**Goal**: Player can choose between 4 structure types (Blaster, Zapper, Slowfield, Wall Block), upgrade turrets for enhanced stats, and sell structures for 50% refund.

**Independent Test**: Place each of the 4 structure types and verify unique behaviors. Upgrade a Blaster and verify doubled damage. Sell a turret and verify 50% credit refund and tile becomes empty.

### Implementation for User Story 2

- [x] T014 [US2] Add Zapper firing behavior to Turret entity — chain lightning that hits primary target + up to 2 additional bugs within 96px, instantaneous damage with Graphics line flash (~200ms) in `src/entities/Turret.js`
- [x] T015 [US2] Add Slowfield aura behavior to Turret entity — continuous range check on all active bugs, apply/remove 0.5x speed multiplier, no stacking from multiple Slowfields in `src/entities/Turret.js`
- [x] T016 [US2] Add Wall Block behavior — static physics body, HP tracking (100 base / 200 upgraded), destruction on HP depletion (remove sprite, update grid to empty), bug-wall collision damage in `src/entities/Turret.js` and `src/scenes/GameScene.js`
- [x] T017 [US2] Add upgrade flow to BuildSystem — click existing turret opens turret menu with upgrade option (cost 1.5x base, doubles damage or enhances effect per type) and sell option (50% base cost refund), hide upgrade if already upgraded in `src/systems/BuildSystem.js`
- [x] T018 [US2] Update build menu in BuildSystem to show all 4 structure types with costs and descriptions, dim/disable structures the player cannot afford in `src/systems/BuildSystem.js`

**Checkpoint**: All 4 turret types functional with unique behaviors, upgrade and sell working

---

## Phase 5: User Story 3 — Wave Progression: Escalating Challenge (Priority: P3)

**Goal**: 10 waves with escalating difficulty — Swarmers only (1-3), add Brutes (4-6), add Spitters (7-9), boss wave (10). Build phase countdown between waves.

**Independent Test**: Advance through waves 1-3 and verify only Swarmers spawn. Start wave 4 and verify Brutes appear. Start wave 7 and verify Spitters appear. Reach wave 10 and verify boss Brute spawns.

### Implementation for User Story 3

- [x] T019 [US3] Add Brute bug type behavior to Bug entity — slow speed (40px/sec), high HP (150), high damage (20 to core, 20 to walls), larger size (80px) in `src/entities/Bug.js`
- [x] T020 [US3] Add Spitter bug type behavior to Bug entity — ranged attack on turrets/walls within 192px (stop advancing, fire SpitterBullet at 1 shot/sec dealing 15 damage, only Wall Blocks take actual damage), SpitterBullet pooling in `src/entities/Bug.js` and `src/scenes/GameScene.js`
- [x] T021 [US3] Add Boss Brute variant — 1500 HP, 30px/sec speed, 40 damage, 100 reward, same behavior as Brute in `src/entities/Bug.js`
- [x] T022 [US3] Implement build phase countdown (20 seconds) with timer display, early wave start via Spacebar/"Start Wave" button granting 25 bonus credits, and auto-start when timer expires in `src/systems/WaveManager.js` and `src/scenes/GameScene.js`
- [x] T023 [US3] Wire full 10-wave progression in WaveManager — read WAVES config for each wave number, spawn correct bug type mix, increment wave counter on completion in `src/systems/WaveManager.js`

**Checkpoint**: Full 10-wave progression with all bug types and build phase countdown

---

## Phase 6: User Story 4 — Economy: Credits and Rewards (Priority: P4)

**Goal**: Starting credits (200), kill rewards by bug type (10/25/15/100), wave clear bonus (50 + wave×10), credit management for build/upgrade/sell decisions.

**Independent Test**: Kill bugs of each type and verify correct credit amounts. Clear a wave and verify wave bonus. Attempt to build with insufficient credits and verify denial.

### Implementation for User Story 4

- [x] T024 [US4] Wire kill rewards in GameScene — on bug death, call EconomyManager.earn() with reward amount from bug type config, emit `credits-changed` event in `src/scenes/GameScene.js`
- [x] T025 [US4] Wire wave clear bonus in WaveManager — on wave completion, calculate 50 + (waveNumber × 10), call EconomyManager.earn(), emit `credits-changed` event in `src/systems/WaveManager.js`
- [x] T026 [US4] Add insufficient credits feedback in BuildSystem — flash red on denied build/upgrade attempts, show cost vs current credits in menu in `src/systems/BuildSystem.js`

**Checkpoint**: Full economy loop — earn from kills and wave clears, spend on builds/upgrades, sell for refunds

---

## Phase 7: User Story 5 — UI and Feedback: HUD, Health Bar, and Game Flow (Priority: P5)

**Goal**: HUD showing wave counter, credit balance, and health bar. Visual feedback for turret firing, bug deaths, and wave starts.

**Independent Test**: Verify HUD elements display and update correctly. Health bar decreases when base takes damage. Credits update on earn/spend.

### Implementation for User Story 5

- [x] T027 [US5] Implement UIScene with HUD elements — wave counter ("Wave X/10"), credit balance display, base health bar (fill + background rectangles), and "Start Wave" button. Bind to Game scene events (`credits-changed`, `wave-changed`, `hp-changed`, `phase-changed`, `timer-tick`) per scene-flow-contract.md in `src/scenes/UIScene.js`
- [x] T028 [US5] Add visual feedback effects in GameScene — muzzle flash on turret fire, particle burst on bug death, build placement confirmation flash, wave start announcement text in `src/scenes/GameScene.js`

**Checkpoint**: Full HUD overlay with real-time updates and visual feedback

---

## Phase 8: User Story 6 — Win and Lose Conditions (Priority: P6)

**Goal**: Game ends in defeat when base HP reaches 0 (show wave reached + kill count). Game ends in victory when all 10 waves cleared (show kills, credits, HP). Both screens offer restart.

**Independent Test**: Let base HP reach 0 and verify defeat screen with stats. Complete all 10 waves and verify victory screen with stats. Click restart and verify game resets.

### Implementation for User Story 6

- [x] T029 [US6] Implement GameOverScene with win/loss display — receive `{ won, wave, totalKills, credits, baseHp }` data from Game scene, show victory or defeat message, display stats, provide "Restart" and "Main Menu" buttons per scene-flow-contract.md in `src/scenes/GameOverScene.js`
- [x] T030 [US6] Add defeat trigger in GameScene — when `baseHp <= 0`, transition to GameOver with `won: false` and current stats. Add victory trigger — when wave 10 completed, transition to GameOver with `won: true` in `src/scenes/GameScene.js`
- [x] T031 [US6] Wire GameOverScene transitions — "Restart" calls `scene.start('Game')`, "Main Menu" calls `scene.start('MainMenu')`. Ensure UIScene is stopped on game over in `src/scenes/GameOverScene.js`

**Checkpoint**: Complete win/lose flow with stats display and restart capability

---

## Phase 9: User Story 7 — Game Navigation: Menu and Scene Flow (Priority: P7)

**Goal**: Main menu with "Start Game" option. Full scene flow: Boot → MainMenu → Game → GameOver → MainMenu/Restart.

**Independent Test**: Launch game, see main menu, click Start Game, play through to game over, navigate back to menu or restart.

### Implementation for User Story 7

- [ ] T032 [US7] Implement MainMenuScene with game title ("Bug Siege"), "Start Game" button that calls `scene.start('Game')`, and styled background in `src/scenes/MainMenuScene.js`
- [ ] T033 [US7] Wire complete scene flow in BootScene — after texture generation, call `scene.start('MainMenu')`. Verify full cycle: Boot → MainMenu → Game (+UIScene) → GameOver → MainMenu in `src/scenes/BootScene.js`

**Checkpoint**: Full game navigation from boot to menu to game to game-over and back

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, performance, and final quality pass

- [ ] T034 [P] Add edge case handling — deny build on core tile, deny build on occupied tile, handle all-tiles-filled state (menu opens but all placements invalid) in `src/systems/BuildSystem.js` and `src/entities/Grid.js`
- [ ] T035 [P] Add bug-wall interaction — bugs attack nearest wall when path is blocked, deal wallDamage per hit, resume path to core when wall destroyed in `src/entities/Bug.js` and `src/scenes/GameScene.js`
- [ ] T036 [P] Performance validation — verify 60fps with 50+ bugs on screen (wave 9 has 38 bugs), ensure object pools recycle correctly, verify no physics body leaks on bug/bullet despawn in `src/scenes/GameScene.js`
- [ ] T037 Run quickstart.md validation — `npm install`, `npm run dev`, verify game loads and is playable through at least wave 3

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 — first playable increment
- **User Story 2 (Phase 4)**: Depends on Phase 3 (extends Turret and BuildSystem)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (extends Bug and WaveManager)
- **User Story 4 (Phase 6)**: Depends on Phase 3 (wires economy into existing systems)
- **User Story 5 (Phase 7)**: Depends on Phase 3 (needs game events to display)
- **User Story 6 (Phase 8)**: Depends on Phase 3 (needs game state to trigger end conditions)
- **User Story 7 (Phase 9)**: Depends on Phase 2 (only needs BootScene + scene registration)
- **Polish (Phase 10)**: Depends on Phases 3-9 being complete

### User Story Dependencies

- **US1 (Core Loop)**: Depends on Foundational only — MVP baseline
- **US2 (Building)**: Depends on US1 (extends turret types and build menu)
- **US3 (Waves)**: Depends on US1 (extends bug types and wave system)
- **US4 (Economy)**: Depends on US1 (wires reward events into existing kill/wave logic)
- **US5 (UI/HUD)**: Can start after US1 (needs game events); independent of US2-US4
- **US6 (Win/Lose)**: Can start after US1 (needs game state); independent of US2-US5
- **US7 (Navigation)**: Can start after Foundational (Phase 2); independent of all other stories

### Parallel Opportunities After US1

```
US1 complete
├── US2 (Building) ──────────┐
├── US3 (Waves) ─────────────┤
├── US4 (Economy) ───────────┤── Can run in parallel
├── US5 (UI/HUD) ────────────┤
├── US6 (Win/Lose) ──────────┘
└── US7 (Navigation) ── Can start even earlier (after Phase 2)
```

### Within Each User Story

- Entities/models before systems/services
- Core behavior before integration with GameScene
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T001+T002 sequential → T003+T004 parallel
- **Phase 2**: T005 first → T006+T007+T008 in parallel
- **Phase 3**: T009+T010 parallel → T011+T012 parallel → T013 (integrates all)
- **Phase 4**: T014+T015+T016 parallel → T017+T018 parallel
- **Phase 5**: T019+T020+T021 parallel → T022+T023 parallel
- **Phase 10**: T034+T035+T036 all parallel → T037 last

---

## Parallel Example: User Story 1

```bash
# Launch entity implementations in parallel (different files):
Task: "Implement Turret entity in src/entities/Turret.js"
Task: "Implement Bug entity in src/entities/Bug.js"

# Then launch systems in parallel (different files):
Task: "Implement WaveManager in src/systems/WaveManager.js"
Task: "Implement BuildSystem in src/systems/BuildSystem.js"

# Finally integrate in GameScene (depends on all above):
Task: "Implement GameScene in src/scenes/GameScene.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T008)
3. Complete Phase 3: User Story 1 (T009-T013)
4. **STOP and VALIDATE**: Place Blasters, start wave, verify turrets fire at bugs, bugs damage core
5. Playable game with one turret type and one bug type

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Core Loop) → First playable! (MVP)
3. Add US2 (Building) → Strategic depth with 4 turret types
4. Add US3 (Waves) → Full 10-wave progression with 3 bug types + boss
5. Add US4 (Economy) → Complete reward/spend loop
6. Add US5 (UI/HUD) → Polished information display
7. Add US6 (Win/Lose) → Complete game flow
8. Add US7 (Navigation) → Menu and restart flow
9. Polish → Edge cases and performance validation

### Suggested MVP Scope

**Phase 1 + Phase 2 + Phase 3 (Tasks T001-T013)**: A playable game where the player places Blasters on a grid, starts a wave of Swarmers, and watches turrets defend the Command Core. This delivers the core interactive experience with ~13 tasks.

---

## Notes

- No automated tests — all testing is manual/visual per plan.md
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Audio is deferred — game is fully playable without sound per research.md
- All placeholder art uses Phaser Graphics API — no external asset files
