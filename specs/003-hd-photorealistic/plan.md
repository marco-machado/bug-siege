# Implementation Plan: Full HD with Photorealistic Assets

**Branch**: `003-hd-photorealistic` | **Date**: 2026-02-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-hd-photorealistic/spec.md`

## Summary

Upgrade Bug Siege from 800×600 to 1920×1080 resolution and replace all runtime-generated geometric textures with preloaded photorealistic PNG assets. All game-logic config values (tileSize, speeds, ranges, sizes) stay at their original values — only grid offsets change to center the grid on the larger canvas. HD textures are displayed at game-logic sizes via `setDisplaySize()`. Phaser's Scale Manager (FIT mode) handles sub-1080p viewports. BootScene is converted from texture generation to asset preloading with a progress bar and error fallback.

## Technical Context

**Language/Version**: JavaScript (ES modules), no transpilation
**Primary Dependencies**: Phaser 3 (Arcade Physics), Vite
**Storage**: Local PNG/JPEG files in `assets/` directory tree
**Testing**: Manual — no test framework configured
**Target Platform**: Desktop web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Single
**Performance Goals**: 60 FPS sustained at 1920×1080 during wave 10 peak; <5s asset load on broadband
**Constraints**: Arcade Physics only; no external libraries; all config in GameConfig.js
**Scale/Scope**: 13 assets to create (12 PNG + 1 JPEG), ~12 source files to modify, 0 new source files to add

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Phaser 3 Native | **PASS** | Scale Manager, Loader, all APIs are Phaser-native. No third-party libraries added. |
| II. Grid-Authoritative | **PASS** | Grid is 7×7 with core at exact center (3,3). All world positions still derive from grid coordinates via `gridToWorld()`. Only the tileSize/offset config values change. |
| III. Data-Driven Configuration | **PASS** | All scaled pixel values (ranges, sizes, speeds) remain in GameConfig.js. No values inlined in logic. |
| IV. Object Pooling | **PASS** | Pool sizes unchanged (60 bugs, 50 bullets, 20 spitter bullets). Only visual representation changes. |
| V. Scope Lock | **VIOLATION — JUSTIFIED** | Feature spec explicitly amends resolution (800×600→1920×1080) and asset pipeline (geometric→loaded PNGs). Tile size stays at 64. These are authorized GDD amendments per the feature request. |

**Technical Constraints amended by this feature:**

| Constraint | Old Value | New Value | Justification |
|------------|-----------|-----------|---------------|
| Canvas | 800×600 px, fixed | 1920×1080 px, fixed (Scale.FIT for smaller displays) | FR-001 |
| Tile size | 64×64 px | 64×64 px (unchanged) | Game logic unchanged; visual sizing via setDisplaySize |
| Grid offsets | offsetX=208, offsetY=108 | offsetX=736, offsetY=316 | Center 7×7 grid on 1920×1080 canvas |
| Asset Pipeline | Runtime geometric shapes | Preloaded PNG files per entity | FR-003 through FR-008, FR-011 |

## Scaling Strategy

**No config value scaling.** All game-logic values (tileSize, speeds, ranges, sizes) remain at their original values.

The canvas upgrades from 800×600 to 1920×1080. The 7×7 grid of 64px tiles (448×448px) is centered on the larger canvas by recalculating offsets:
- offsetX = (1920 − 448) / 2 = 736
- offsetY = (1080 − 448) / 2 = 316
- Horizontal margins: 736px each side — suitable for HUD expansion
- Vertical margins: 316px each side

HD texture assets are loaded at their native resolution and displayed at game-logic sizes via `setDisplaySize()`. This preserves all gameplay balance without touching any speed, range, or size values.

### Config Changes Table

| Location | Property | Old | New | Notes |
|----------|----------|-----|-----|-------|
| **GameConfig GAME** | canvasWidth | 800 | 1920 | |
| | canvasHeight | 600 | 1080 | |
| **GameConfig GRID** | offsetX | 208 | 736 | Center 448px grid on 1920px |
| | offsetY | 108 | 316 | Center 448px grid on 1080px |

All other config values (tileSize, turret ranges, bug speeds/sizes, bullet speeds, hardcoded pixel values) remain unchanged.

### Asset Dimensions Table

| Texture Key | Category | Dimensions (px) | Format | File Path |
|-------------|----------|-----------------|--------|-----------|
| turret-blaster | turrets | any square (e.g. 256×256) | PNG (transparent) | assets/turrets/blaster.png |
| turret-zapper | turrets | any square | PNG (transparent) | assets/turrets/zapper.png |
| turret-slowfield | turrets | any square | PNG (transparent) | assets/turrets/slowfield.png |
| turret-wall | turrets | any square | PNG (transparent) | assets/turrets/wall.png |
| bug-swarmer | bugs | any square | PNG (transparent) | assets/bugs/swarmer.png |
| bug-brute | bugs | any square | PNG (transparent) | assets/bugs/brute.png |
| bug-spitter | bugs | any square | PNG (transparent) | assets/bugs/spitter.png |
| bug-boss | bugs | any square | PNG (transparent) | assets/bugs/boss.png |
| core | environment | any square | PNG (transparent) | assets/environment/core.png |
| background | environment | 1920×1080 | JPEG or PNG | assets/environment/background.jpg |
| tile | environment | any square | PNG (transparent) | assets/environment/tile.png |
| bullet | environment | any square | PNG (transparent) | assets/environment/bullet.png |
| spitter-bullet | environment | any square | PNG (transparent) | assets/environment/spitter-bullet.png |

**Total: 13 files (4 turrets + 4 bugs + 1 core + 1 background + 1 tile + 2 projectiles)**

## Project Structure

### Documentation (this feature)

```text
specs/003-hd-photorealistic/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Phase 1 asset/config model
└── quickstart.md        # Phase 1 implementation guide
```

### Source Code (repository root)

```text
assets/                          # NEW — all game art assets
├── turrets/
│   ├── blaster.png              # cyberpunk blaster turret
│   ├── zapper.png               # cyberpunk zapper turret
│   ├── slowfield.png            # cyberpunk slowfield turret
│   └── wall.png                 # cyberpunk wall block
├── bugs/
│   ├── swarmer.png              # corrupted digital swarmer
│   ├── brute.png                # corrupted digital brute
│   ├── spitter.png              # corrupted digital spitter
│   └── boss.png                 # corrupted digital boss
└── environment/
    ├── core.png                 # command core
    ├── background.jpg           # 1920×1080, cyberpunk PCB landscape
    ├── tile.png                 # circuit board trace tile
    ├── bullet.png               # turret projectile
    └── spitter-bullet.png       # spitter projectile

src/                             # EXISTING — files to modify
├── main.js                      # Add Scale Manager config
├── config/GameConfig.js         # Scale all pixel values
├── scenes/
│   ├── BootScene.js             # Replace texture gen with asset preloading + progress bar
│   ├── MainMenuScene.js         # Reposition UI for 1920×1080
│   ├── GameScene.js             # Scale VFX values, update wave announcement
│   ├── UIScene.js               # Reposition HUD elements for 1920×1080
│   └── GameOverScene.js         # Reposition elements for 1920×1080
├── entities/
│   ├── Turret.js                # Scale chainRange, muzzle flash, lightning width
│   ├── Bug.js                   # Scale spitter bullet speed
│   └── Bullet.js                # Scale default speed, out-of-bounds margin
└── systems/
    ├── WaveManager.js           # Scale spawn margin
    └── BuildSystem.js           # Scale menu dimensions and offsets
```

**Structure Decision**: Existing `src/` layout is preserved as-is. Only a new `assets/` directory tree is added at the repository root. No new source files are created — all changes are modifications to existing files.

## Implementation Sequence

### Phase A — Foundation (US1: Full HD Canvas)

**Goal**: Game runs at 1920×1080 with correctly scaled grid and physics. All textures still runtime-generated but at new sizes.

1. **GameConfig.js** — Update canvas dimensions (800→1920, 600→1080) and grid offsets (offsetX→736, offsetY→316). All other values unchanged.
2. **main.js** — Add `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }` to Phaser config; update width/height to use new GAME values
3. **GameScene.js** — Add `setDisplaySize(GRID.tileSize, GRID.tileSize)` to tile and core sprite creation
4. **Bullet.js** — Derive bullet display size from `GRID.tileSize / 8`, add `setDisplaySize()` and `body.setCircle()` in fire()
5. **Bug.js** — Use `this.width / 2` for physics body circle instead of `conf.size / 2`
6. **All UI scenes** — Reposition for 1920×1080 (MainMenuScene, UIScene, GameOverScene)
7. **BuildSystem.js** — Scale menu offsets and dimensions

**Verification**: Launch game, verify 1920×1080 canvas, play through wave 1-2 with geometric textures, confirm grid/physics/UI work correctly.

### Phase B — Asset Integration (US2, US3: Photorealistic Entities + Environment)

**Goal**: All runtime textures replaced with loaded PNG assets.

1. **Create asset directory structure** — `assets/turrets/`, `assets/bugs/`, `assets/environment/`
2. **Generate placeholder PNG assets** — Using AI image tools (manual step outside of code), cyberpunk theme, correct dimensions per asset table
3. **BootScene.js overhaul** — Replace `create()` texture generation with `preload()` asset loading using `this.load.image()` for each asset; add loading progress bar in `create()` of a dedicated preload state; add `this.load.on('loaderror', ...)` handler
4. **Fallback handling** — On `loaderror`, generate a bright magenta geometric fallback texture (same shape logic as current BootScene) and log console warning

**Verification**: Launch game, verify all assets load with progress bar, all entities show PNG sprites, no geometric shapes visible during gameplay.

### Phase C — UI Polish (US4: HD Screens)

**Goal**: All screens look polished at 1920×1080.

1. **MainMenuScene** — Scale title/subtitle/button positions and font sizes for HD; update background grid line spacing; increase starfield count for larger canvas
2. **UIScene** — Scale and reposition HUD (wave text, credits text, HP bar, phase text, start wave button); increase font sizes
3. **GameOverScene** — Scale title/stats/buttons positions and font sizes for HD
4. **BuildSystem** — Scale menu background sizes, text sizes, line heights, and position offsets
5. **GameScene** — Scale wave announcement font size

**Verification**: Navigate all screens (menu → gameplay with HUD → build menu → upgrade menu → game over), verify all text readable, all buttons clickable, all elements properly positioned.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Canvas 800×600 → 1920×1080 | Feature explicitly requires Full HD | Keeping 800×600 contradicts the user request |
| Geometric → loaded PNGs | Feature explicitly requires photorealistic assets | Runtime-generated shapes cannot achieve photorealistic quality |
| Grid offsets changed | Center grid on larger canvas | Original offsets position grid incorrectly on 1920×1080 |

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Asset file sizes cause slow loading | SC-005 fails (>5s load) | Target <200KB per entity PNG, <500KB for background JPEG; use image compression |
| Scaled integer rounding breaks physics | Turrets miss, bugs clip | All rounding is ≤0.75px error; verify in wave 10 playtest |
| Build menus appear off-screen at grid edges | UI unusable for edge tiles | Add boundary clamping: if menu would overflow canvas, flip to opposite side |
| Scale.FIT produces letterboxing on non-16:9 displays | Black bars visible | Expected behavior per spec (FR: Scale.FIT preserves aspect ratio) |
