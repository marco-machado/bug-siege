# Tasks: Full HD with Photorealistic Assets

**Input**: Design documents from `/specs/003-hd-photorealistic/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No test framework configured — manual verification only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Create asset directory structure for photorealistic PNG/JPEG files.

- [x] T001 Create asset directory structure: `assets/turrets/`, `assets/bugs/`, `assets/environment/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Scale core game configuration to 1920×1080. MUST be complete before any user story work — every source file depends on these values.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Update canvas dimensions and grid offsets in `src/config/GameConfig.js`: GAME (canvasWidth 800→1920, canvasHeight 600→1080), GRID (offsetX 208→736, offsetY 108→316). All other values (tileSize, turret ranges, bug speeds/sizes, economy) remain unchanged — visual sizing handled by `setDisplaySize()` on loaded textures.
- [x] T003 Add Phaser Scale Manager configuration to `src/main.js`: add `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }` to the Phaser game config object; update width/height to reference `GAME.canvasWidth` and `GAME.canvasHeight` if not already.

**Checkpoint**: Game config is at HD resolution — source file modifications can now begin.

---

## Phase 3: User Story 1 — Full HD Game Canvas (Priority: P1) 🎯 MVP

**Goal**: Game runs at 1920×1080 with correctly centered grid and geometric textures. All game systems function identically to 800×600 — no config value changes, only canvas size and grid offsets updated.

**Independent Test**: Launch the game, verify 1920×1080 canvas, play through waves 1–2 with geometric textures, confirm grid is centered (736px side margins, 316px top/bottom), turrets fire at correct ranges, bugs path to core, build menu appears at correct cell positions, and Scale.FIT works on smaller windows.

### Implementation for User Story 1

- [x] T004 [P] [US1] No hardcoded value changes needed in `src/entities/Turret.js` — original values preserved
- [x] T005 [P] [US1] Update `src/entities/Bug.js`: use `this.width / 2` for physics body circle instead of `conf.size / 2`
- [x] T006 [P] [US1] Update `src/entities/Bullet.js`: derive `BULLET_SIZE` from `GRID.tileSize / 8`, add `setDisplaySize()` and `body.setCircle()` in `fire()`
- [x] T007 [P] [US1] No hardcoded value changes needed in `src/systems/WaveManager.js` — original values preserved
- [x] T008 [P] [US1] Add `setDisplaySize(GRID.tileSize, GRID.tileSize)` to tile and core sprites in `src/scenes/GameScene.js`
- [x] T009 [US1] Update geometric texture fallback generation in `src/scenes/BootScene.js` to use config sizes from GameConfig

**Checkpoint**: Game is fully playable at 1920×1080 with geometric textures. Physics, VFX, and spawning all correct.

---

## Phase 4: User Story 2 — Photorealistic Game Entities (Priority: P2)

**Goal**: All runtime-generated entity textures replaced with preloaded photorealistic PNG sprites. Loading shows a progress bar. Failed loads produce visible magenta fallbacks.

**Depends on**: US1 (BootScene texture sizes must be correct for fallback generation)

**Independent Test**: Play through all 10 waves, verify every entity type (4 turrets, 4 bugs, 2 projectiles, 1 core) displays its photorealistic sprite at the correct size. No geometric shapes visible during normal gameplay. Intentionally rename one asset file and verify magenta fallback appears with console warning.

### Implementation for User Story 2

- [x] T010 [P] [US2] Create 4 placeholder turret PNG assets with cyberpunk neon defense theme (transparent backgrounds, top-down perspective): `assets/turrets/blaster.png`, `assets/turrets/zapper.png`, `assets/turrets/slowfield.png`, `assets/turrets/wall.png` (any square dimensions — displayed at tileSize via setDisplaySize)
- [x] T011 [P] [US2] Create 4 placeholder bug PNG assets with corrupted digital organism theme (transparent backgrounds, top-down perspective): `assets/bugs/swarmer.png`, `assets/bugs/brute.png`, `assets/bugs/spitter.png`, `assets/bugs/boss.png` (any square dimensions — displayed at config sizes via setDisplaySize)
- [x] T012 [P] [US2] Create 3 placeholder PNG assets for projectiles and core: `assets/environment/bullet.png`, `assets/environment/spitter-bullet.png`, `assets/environment/core.png` (any square dimensions — displayed at config sizes via setDisplaySize)
- [x] T013 [US2] Rewrite `src/scenes/BootScene.js` from geometric texture generation to asset preloading: add `preload()` method with `this.load.image()` calls for all 13 assets (4 turrets, 4 bugs, bullet, spitter-bullet, core, background, tile); add loading progress bar (centered on canvas); add `loaderror` event handler that tracks failed keys in a Set and logs console warnings; in `create()`, generate bright magenta (#ff00ff) geometric fallback textures for any failed keys (rectangles for turrets/core/tiles, circles for bugs/bullets), then transition to MainMenu. Reference texture keys from data-model.md.

**Checkpoint**: All entity sprites are photorealistic. BootScene loads assets with progress bar. Fallback handling works for missing files.

---

## Phase 5: User Story 3 — Photorealistic Environment and Background (Priority: P3)

**Goal**: Game has a visually rich cyberpunk environment — themed background fills the canvas, grid tiles have a textured circuit-board appearance.

**Depends on**: US2 (BootScene must already be loading assets; T013 includes load calls for background and tile)

**Independent Test**: Launch the game, verify background image fills the canvas behind the grid, grid cells display textured tiles (not flat colored rectangles), and the scene looks cohesive with entity sprites.

### Implementation for User Story 3

- [x] T014 [P] [US3] Create 2 placeholder environment assets with cyberpunk PCB/circuit board theme: `assets/environment/background.jpg` (1920×1080, cyberpunk motherboard landscape), `assets/environment/tile.png` (any square, circuit board trace pattern, transparent or semi-transparent — displayed at tileSize via setDisplaySize)
- [x] T015 [US3] Add background image and textured grid tiles in `src/scenes/GameScene.js`: render `background` texture as a full-canvas image behind the grid (at canvas center), update `renderGrid()` to use `tile` texture for each grid cell instead of drawing filled rectangles

**Checkpoint**: Environment is visually complete — background and tiles match the cyberpunk theme.

---

## Phase 6: User Story 4 — Updated UI Screens (Priority: P4)

**Goal**: All screens have polished, HD-resolution UI. Text is crisp and appropriately sized for 1920×1080. Buttons and interactive elements are comfortably clickable.

**Depends on**: US1 (canvas must be at 1920×1080)

**Independent Test**: Navigate through all game screens (main menu → gameplay with HUD → build menu → upgrade menu → game over, both victory and defeat) and verify all text is readable, buttons are correctly positioned, interactive elements respond to clicks, and no elements are clipped or off-screen.

### Implementation for User Story 4

- [x] T016 [P] [US4] Reposition and scale MainMenuScene for 1920×1080 in `src/scenes/MainMenuScene.js`: center title at `canvasWidth/2`, scale font sizes proportionally (~2×), reposition subtitle/start button/footer using proportional Y offsets, update background grid line spacing for larger canvas, increase starfield particle count for 1920×1080 coverage
- [x] T017 [P] [US4] Reposition and scale UIScene HUD for 1920×1080 in `src/scenes/UIScene.js`: scale all font sizes proportionally (~2×), widen HP bar for HD, reposition wave text/credits/HP bar/phase text/start-wave button using `canvasWidth` and `canvasHeight` references
- [x] T018 [P] [US4] Reposition and scale GameOverScene for 1920×1080 in `src/scenes/GameOverScene.js`: center all elements using `canvasWidth/2`, scale font sizes proportionally (~2×), reposition title/stats/buttons with proportional Y spacing
- [x] T019 [US4] Scale BuildSystem menus for 1920×1080 in `src/systems/BuildSystem.js`: scale menu background widths (~1.5–2×), font sizes, line heights, position offsets relative to grid cells; add boundary clamping so menus at grid edges don't overflow the canvas (flip menu to opposite side if it would extend beyond canvas bounds)
- [x] T020 [US4] Scale wave announcement text in `src/scenes/GameScene.js`: increase font size for HD readability, ensure centered positioning uses `canvasWidth/2` and `canvasHeight/2`

**Checkpoint**: All screens polished for HD — text readable, buttons clickable, elements properly positioned.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Full verification across all user stories.

- [x] T021 Run quickstart.md verification checklist — full 10-wave playthrough at 1920×1080: verify all 13 entity textures show photorealistic sprites, background and tiles render correctly, all menus work, 60 FPS maintained during wave 10 peak
- [x] T022 Verify Phaser Scale.FIT behavior — resize browser window below 1920×1080, confirm canvas scales down proportionally with letterboxing, no scrollbars, no element clipping
- [x] T023 Verify asset load error handling — temporarily rename one asset file, confirm magenta fallback appears and console warning is logged, game remains playable

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2)
- **US2 (Phase 4)**: Depends on US1 (BootScene texture sizes needed for fallback generation)
- **US3 (Phase 5)**: Depends on US2 (BootScene asset loader must include background/tile load calls)
- **US4 (Phase 6)**: Depends on US1 (canvas must be 1920×1080). Can run in parallel with US2/US3.
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational)
                       ↓
                   Phase 3 (US1)
                    ↓         ↘
              Phase 4 (US2)   Phase 6 (US4) ← can run in parallel with US2/US3
                    ↓
              Phase 5 (US3)
                    ↓
              Phase 7 (Polish) ← waits for all
```

### Shared File Tracking

Some files are modified across multiple user stories. Tasks within the same file should be executed sequentially:

| File | Stories | Tasks |
|------|---------|-------|
| `src/scenes/BootScene.js` | US1 (T009), US2 (T013) | T013 supersedes T009 — full rewrite |
| `src/scenes/GameScene.js` | US1 (T008), US3 (T015), US4 (T020) | Sequential: T008 → T015 → T020 |
| `src/scenes/MainMenuScene.js` | US4 (T016) | Single story |
| `src/scenes/UIScene.js` | US4 (T017) | Single story |
| `src/scenes/GameOverScene.js` | US4 (T018) | Single story |
| `src/systems/BuildSystem.js` | US4 (T019) | Single story |

### Parallel Opportunities

**Within US1** (T004–T008 all modify different files):
```
T004 (Turret.js) ‖ T005 (Bug.js) ‖ T006 (Bullet.js) ‖ T007 (WaveManager.js) ‖ T008 (GameScene.js)
→ then T009 (BootScene.js)
```

**Within US2** (T010–T012 create different asset sets):
```
T010 (turret PNGs) ‖ T011 (bug PNGs) ‖ T012 (projectile/core PNGs)
→ then T013 (BootScene.js rewrite)
```

**Within US4** (T016–T018 modify different scene files):
```
T016 (MainMenuScene) ‖ T017 (UIScene) ‖ T018 (GameOverScene)
→ then T019 (BuildSystem.js) ‖ T020 (GameScene.js)
```

**Cross-story parallelism**:
```
US4 (T016–T020) can run in parallel with US2 (T010–T013) and US3 (T014–T015)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T003)
3. Complete Phase 3: US1 (T004–T009)
4. **STOP and VALIDATE**: Game runs at 1920×1080 with geometric textures, all physics correct
5. This alone delivers a fully playable HD game

### Incremental Delivery

1. Setup + Foundational → Config ready
2. Add US1 → HD game with geometric textures (MVP!)
3. Add US2 → Photorealistic entities
4. Add US3 → Photorealistic environment
5. Add US4 → Polished HD UI
6. Polish → Full verification
7. Each story adds visual quality without breaking previous work

### Suggested MVP Scope

**US1 alone** (T001–T009, 9 tasks) delivers a complete, playable Full HD game. All subsequent stories add visual polish on top of a working foundation.
