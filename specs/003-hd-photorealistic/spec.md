# Feature Specification: Full HD with Photorealistic Assets

**Feature Branch**: `003-hd-photorealistic`
**Created**: 2026-02-10
**Status**: Draft
**Input**: User description: "Make this game full HD with photorealistic assets"

## Clarifications

### Session 2026-02-10

- Q: Is creating/sourcing the actual PNG image files part of this feature's implementation scope? → A: Hybrid — implementation generates AI-created placeholder assets with correct dimensions and theme, final production art is swapped in later.
- Q: Should assets be loaded as individual PNG files or packed into sprite sheet atlases? → A: Individual PNG files — one file per entity/texture, loaded separately.
- Q: How should the game handle displays smaller than 1920×1080? → A: Use Phaser's built-in Scale Manager (Scale.FIT mode) to scale down to fit the viewport while preserving aspect ratio.
- Q: What tool/method should be used to generate placeholder assets? → A: Manual AI tool — generate assets manually using ChatGPT / Midjourney / similar, save PNG files to an assets folder.
- Q: How should asset files be organized in the project? → A: By category — subdirectories like `assets/turrets/`, `assets/bugs/`, `assets/environment/`, `assets/ui/`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Full HD Game Canvas (Priority: P1)

A player launches Bug Siege and sees the game rendered at 1920×1080 resolution. The entire game board, UI, and all visual elements are scaled and repositioned to fill the full HD canvas without distortion. The gameplay grid, turret placement zones, and bug paths all function correctly at the new resolution.

**Why this priority**: The resolution upgrade is the foundation — all other visual improvements (assets, UI) depend on the canvas being correctly sized and all game systems properly scaled to 1920×1080.

**Independent Test**: Can be tested by launching the game and verifying the canvas is 1920×1080, the grid is centered and proportionally scaled, turrets can be placed on all grid cells, bugs path correctly to the core, and bullets travel the correct ranges.

**Acceptance Scenarios**:

1. **Given** the game is launched, **When** the canvas renders, **Then** it displays at 1920×1080 resolution with all game elements visible and proportionally scaled.
2. **Given** a turret is placed on any grid cell, **When** bugs approach, **Then** the turret fires within its scaled range and bullets hit bugs correctly (physics interactions work at the new scale).
3. **Given** the build phase begins, **When** the player clicks a grid cell, **Then** the build menu appears at the correct position relative to the clicked cell (UI coordinates are accurate).

---

### User Story 2 - Photorealistic Game Entities (Priority: P2)

A player sees detailed, photorealistic-style sprites for all game entities: turrets (blaster, zapper, slowfield, wall), bugs (swarmer, brute, spitter, boss), the core, and projectiles. Each entity type is visually distinct, immediately recognizable, and consistent in art style. The new sprites replace all runtime-generated geometric textures.

**Why this priority**: Replacing placeholder shapes with polished artwork is the primary visual upgrade the user requested and the most impactful change for perceived game quality.

**Independent Test**: Can be tested by playing through all 10 waves and verifying every entity type displays its photorealistic sprite, sprites are correctly sized for the new resolution, and no runtime-generated geometric fallbacks appear.

**Acceptance Scenarios**:

1. **Given** the game loads, **When** any turret type is placed, **Then** it displays its unique photorealistic sprite at the correct grid-cell size.
2. **Given** wave 10 is reached, **When** the boss spawns, **Then** it displays a distinct photorealistic boss sprite that is visually larger and more intimidating than regular bugs.
3. **Given** a spitter bug fires, **When** the projectile travels, **Then** it displays a photorealistic projectile sprite (not a plain colored circle).

---

### User Story 3 - Photorealistic Environment and Background (Priority: P3)

A player sees a visually rich game environment: the background is a themed scene (e.g., a circuit board, server room, or digital landscape), the grid tiles have a textured appearance, and the overall aesthetic is cohesive with the entity sprites.

**Why this priority**: Background and environment art completes the visual overhaul but is lower priority since it doesn't affect gameplay recognition or entity identification.

**Independent Test**: Can be tested by launching the game and verifying the background image loads, grid tiles display textures, and the overall scene looks cohesive (no plain colored rectangles remain).

**Acceptance Scenarios**:

1. **Given** the game starts, **When** the game board is displayed, **Then** a themed background fills the canvas behind the grid area.
2. **Given** the grid is visible, **When** the player inspects grid cells, **Then** each cell has a textured tile appearance consistent with the background theme.

---

### User Story 4 - Updated UI Screens (Priority: P4)

A player sees polished, HD-resolution UI across all screens: main menu, HUD overlay, build/upgrade menus, and game over screen. Text is crisp and appropriately sized for 1920×1080. Buttons and interactive elements are large enough to click comfortably.

**Why this priority**: UI polish completes the HD experience but can be iterated on after core gameplay visuals are in place.

**Independent Test**: Can be tested by navigating through all game screens (main menu → gameplay with HUD → build menu → upgrade menu → game over) and verifying all text is readable, buttons are correctly positioned, and interactive elements respond to clicks.

**Acceptance Scenarios**:

1. **Given** the main menu screen loads, **When** the player views it, **Then** the title, buttons, and any decorative elements are sharp and properly positioned for 1920×1080.
2. **Given** a turret is clicked during build phase, **When** the upgrade/sell menu appears, **Then** it is correctly positioned near the turret and all text/buttons are readable at HD resolution.
3. **Given** the game ends (win or loss), **When** the game over screen appears, **Then** it fills the HD canvas appropriately with readable stats and a clearly clickable restart button.

---

### Edge Cases

- What happens when a player's display is smaller than 1920×1080? The game canvas renders internally at 1920×1080 but uses Phaser's Scale Manager (Scale.FIT mode) to scale down to fit the viewport while preserving aspect ratio. No scrollbars.
- What happens if an asset file fails to load? The game should display a visible placeholder (e.g., a brightly colored fallback shape) rather than an invisible or broken entity, and log a console warning.
- What happens to the existing runtime-generated textures? They are fully replaced by loaded image assets. The BootScene texture generation code is removed or replaced with asset loading.
- How do larger sprite sizes affect object pooling limits? Pool sizes (60 bugs, 50 bullets) remain the same; only the visual representation changes, not the pool capacity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game canvas MUST render at 1920×1080 resolution.
- **FR-002**: The gameplay grid MUST scale proportionally from the current 6×6 layout to fill an appropriate area of the 1920×1080 canvas, with larger tile sizes.
- **FR-003**: All turret types (blaster, zapper, slowfield, wall) MUST display unique photorealistic sprite images instead of runtime-generated geometric shapes.
- **FR-004**: All bug types (swarmer, brute, spitter, boss) MUST display unique photorealistic sprite images instead of runtime-generated colored circles.
- **FR-005**: The core MUST display a photorealistic sprite image instead of a runtime-generated colored rectangle.
- **FR-006**: All projectile types (turret bullet, spitter bullet) MUST display photorealistic sprite images.
- **FR-007**: The game background MUST display a themed image or tileable texture instead of a flat color.
- **FR-008**: Grid tiles MUST display textured visuals consistent with the background theme.
- **FR-009**: All physics interactions (turret ranges, bullet collisions, bug pathfinding, wall collisions) MUST function correctly at the new resolution with appropriately scaled values.
- **FR-010**: All UI elements (main menu, HUD, build menus, game over screen) MUST be repositioned and resized appropriately for 1920×1080.
- **FR-011**: The game MUST preload all image assets during BootScene with a visible loading indicator before transitioning to the main menu.
- **FR-012**: If any asset fails to load, the game MUST display a visible fallback placeholder and log a console warning, rather than crashing or showing invisible entities.
- **FR-013**: The game's visual theme MUST follow a cyberpunk / neon circuit board aesthetic — bugs appear as corrupted digital organisms, turrets are glowing cyber-defense installations, the background is a lit-up PCB or motherboard landscape, and grid tiles resemble circuit board traces. All assets MUST be visually cohesive within this theme.

### Key Entities

- **Sprite Asset**: An individual PNG file representing a game entity, organized by category: `assets/turrets/` (blaster, zapper, slowfield, wall), `assets/bugs/` (swarmer, brute, spitter, boss), `assets/environment/` (core, background, tile, bullet textures). Key attributes: texture key, dimensions, intended entity type, resolution-appropriate size.
- **Tile Texture**: A repeatable PNG image used for grid cells and background, stored in `assets/environment/`. Key attributes: tile dimensions, visual theme, seamless tileability.
- **Scaled Config Values**: Updated game configuration values (tile size, grid offsets, turret ranges, entity sizes, UI positions) recalculated for 1920×1080 proportional scaling.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The game renders at 1920×1080 resolution with no visual elements clipped or positioned off-screen.
- **SC-002**: All 12 previously runtime-generated textures (4 turrets, 4 bugs, 2 bullets, 1 core, 1 tile) are replaced with loaded image assets.
- **SC-003**: A player can complete all 10 waves with no visual glitches — sprites display correctly and no geometric placeholder shapes appear during normal gameplay.
- **SC-004**: All interactive elements (grid cells, build menu buttons, upgrade/sell buttons, main menu buttons, game over buttons) respond correctly to player clicks at the new resolution.
- **SC-005**: The game loads all assets and reaches the main menu within 5 seconds on a standard broadband connection.
- **SC-006**: Game maintains smooth performance (consistent 60 FPS) during wave 10 with maximum on-screen entities at the new resolution.

## Assumptions

- **Asset source**: Placeholder assets will be generated manually using AI image generation tools (e.g., ChatGPT, Midjourney) with correct dimensions and cyberpunk theme, then saved to an `assets/` folder. These serve as functional placeholders; final production art can be swapped in later without code changes. Asset files use stable texture keys so replacements are drop-in. Asset generation is a manual step outside of code — the implementation plan covers integration, not the generation prompts.
- **Art style**: "Photorealistic" means detailed, high-fidelity 2D sprites with lighting, shading, and texture — not 3D-rendered models. Think stylized realism suitable for a top-down tower defense game.
- **No animation frames initially**: Static sprites per entity are sufficient for this feature. Animated sprite sheets (walk cycles, attack animations) are out of scope but could be added later.
- **Fixed resolution**: The game canvas renders at a fixed 1920×1080 internally. Phaser's Scale Manager (Scale.FIT) handles fitting the canvas to smaller viewports while preserving aspect ratio. Full responsive/adaptive layout redesign is out of scope.
- **Grid remains 6×6**: The grid layout (number of rows/columns) does not change — only the visual size of each tile increases proportionally.
- **Asset format**: Individual PNG files with transparency for entities, JPEG or PNG for backgrounds. No sprite sheet atlases — each entity has its own file for easy drop-in replacement.
- **No gameplay balance changes**: Turret stats, bug stats, wave compositions, and economy values remain the same (only pixel-unit values like ranges, positions, and sizes scale proportionally with the resolution increase).
