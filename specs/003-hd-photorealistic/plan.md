# Implementation Plan: Full HD with Photorealistic Assets

**Branch**: `003-hd-photorealistic` | **Date**: 2026-02-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-hd-photorealistic/spec.md`

## Summary

Upgrade Bug Siege from 800×600 to 1920×1080 resolution and replace all runtime-generated geometric textures with preloaded photorealistic PNG assets. A uniform 2.25× scale factor (tileSize 64→144) applied to all pixel-unit values preserves gameplay balance exactly. Phaser's Scale Manager (FIT mode) handles sub-1080p viewports. BootScene is converted from texture generation to asset preloading with a progress bar and error fallback.

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
| II. Grid-Authoritative | **PASS** | Grid remains 6×6. All world positions still derive from grid coordinates via `gridToWorld()`. Only the tileSize/offset config values change. |
| III. Data-Driven Configuration | **PASS** | All scaled pixel values (ranges, sizes, speeds) remain in GameConfig.js. No values inlined in logic. |
| IV. Object Pooling | **PASS** | Pool sizes unchanged (60 bugs, 50 bullets, 20 spitter bullets). Only visual representation changes. |
| V. Scope Lock | **VIOLATION — JUSTIFIED** | Feature spec explicitly amends resolution (800×600→1920×1080), tile size (64→144), and asset pipeline (geometric→loaded PNGs). These are authorized GDD amendments per the feature request. |

**Technical Constraints amended by this feature:**

| Constraint | Old Value | New Value | Justification |
|------------|-----------|-----------|---------------|
| Canvas | 800×600 px, fixed | 1920×1080 px, fixed (Scale.FIT for smaller displays) | FR-001 |
| Tile size | 64×64 px | 144×144 px (2.25× scale) | FR-002 |
| Asset Pipeline | Runtime geometric shapes | Preloaded PNG files per entity | FR-003 through FR-008, FR-011 |
| Sprite dimensions | GDD asset table (64/48/80/56/16 px) | Scaled 2.25× (144/108/180/126/18 px) | FR-002, FR-009 |

## Scaling Strategy

**Uniform scale factor: 2.25×** (derived from tileSize: 64 → 144)

The canvas changes aspect ratio (4:3 → 16:9), so width and height scale differently (2.4× and 1.8×). However, the 6×6 square grid is the gameplay anchor. We scale uniformly by 2.25× (producing 144px tiles that divide cleanly), which:
- Keeps the grid square (864×864 px)
- Preserves identical top/bottom margins (108px — same as current!)
- Creates wide side margins (528px) for future UI expansion
- Produces clean integer values for most scaled quantities

**All pixel-unit values** in config and hardcoded constants get multiplied by 2.25×. Non-pixel values (HP, damage, costs, fire rates, wave compositions) remain unchanged.

### Complete Scaling Table

| Location | Property | Old | New (×2.25) | Notes |
|----------|----------|-----|-------------|-------|
| **GameConfig GAME** | canvasWidth | 800 | 1920 | Fixed |
| | canvasHeight | 600 | 1080 | Fixed |
| **GameConfig GRID** | tileSize | 64 | 144 | |
| | offsetX | 208 | 528 | (1920−864)/2 |
| | offsetY | 108 | 108 | (1080−864)/2 — unchanged! |
| **GameConfig TURRETS** | blaster.range | 192 | 432 | |
| | zapper.range | 160 | 360 | |
| | slowfield.range | 128 | 288 | |
| | slowfield.upgradedRange | 160 | 360 | |
| **GameConfig BUGS** | swarmer.speed | 60 | 135 | Preserves tiles/sec |
| | swarmer.size | 48 | 108 | |
| | brute.speed | 30 | 68 | Rounded from 67.5 |
| | brute.size | 80 | 180 | |
| | spitter.speed | 35 | 79 | Rounded from 78.75 |
| | spitter.size | 56 | 126 | |
| | spitter.attackRange | 192 | 432 | |
| | boss.speed | 15 | 34 | Rounded from 33.75 |
| | boss.size | 100 | 225 | |
| **Bullet.js** | default speed | 400 | 900 | |
| **Bug.js** | spitter bullet speed | 200 | 450 | Line 119 |
| **BootScene.js** | bullet diameter | 8 | 18 | |
| **Turret.js** | chainRange | 96 | 216 | Line 86 |
| | muzzle flash radius | 8 | 18 | Line 153 |
| | lightning lineWidth | 2 | 4 | Line 119 |
| **GameScene.js** | death particle radius | 3 | 7 | Line 252 |
| | death particle spread | 30 | 68 | Line 255 |
| **WaveManager.js** | spawn margin | 20 | 45 | Line 62 |
| **Bullet.js** | out-of-bounds margin | 50 | 113 | Lines 40-44 |

### Asset Dimensions Table

| Texture Key | Category | Dimensions (px) | Format | File Path |
|-------------|----------|-----------------|--------|-----------|
| turret-blaster | turrets | 144×144 | PNG (transparent) | assets/turrets/blaster.png |
| turret-zapper | turrets | 144×144 | PNG (transparent) | assets/turrets/zapper.png |
| turret-slowfield | turrets | 144×144 | PNG (transparent) | assets/turrets/slowfield.png |
| turret-wall | turrets | 144×144 | PNG (transparent) | assets/turrets/wall.png |
| bug-swarmer | bugs | 108×108 | PNG (transparent) | assets/bugs/swarmer.png |
| bug-brute | bugs | 180×180 | PNG (transparent) | assets/bugs/brute.png |
| bug-spitter | bugs | 126×126 | PNG (transparent) | assets/bugs/spitter.png |
| bug-boss | bugs | 225×225 | PNG (transparent) | assets/bugs/boss.png |
| core | environment | 144×144 | PNG (transparent) | assets/environment/core.png |
| background | environment | 1920×1080 | JPEG or PNG | assets/environment/background.jpg |
| tile | environment | 144×144 | PNG (transparent) | assets/environment/tile.png |
| bullet | environment | 18×18 | PNG (transparent) | assets/environment/bullet.png |
| spitter-bullet | environment | 18×18 | PNG (transparent) | assets/environment/spitter-bullet.png |

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
│   ├── blaster.png              # 144×144, cyberpunk blaster turret
│   ├── zapper.png               # 144×144, cyberpunk zapper turret
│   ├── slowfield.png            # 144×144, cyberpunk slowfield turret
│   └── wall.png                 # 144×144, cyberpunk wall block
├── bugs/
│   ├── swarmer.png              # 108×108, corrupted digital swarmer
│   ├── brute.png                # 180×180, corrupted digital brute
│   ├── spitter.png              # 126×126, corrupted digital spitter
│   └── boss.png                 # 225×225, corrupted digital boss
└── environment/
    ├── core.png                 # 144×144, command core
    ├── background.jpg           # 1920×1080, cyberpunk PCB landscape
    ├── tile.png                 # 144×144, circuit board trace tile
    ├── bullet.png               # 18×18, turret projectile
    └── spitter-bullet.png       # 18×18, spitter projectile

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

1. **GameConfig.js** — Update all pixel-unit values per scaling table
2. **main.js** — Add `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }` to Phaser config; update width/height to use new GAME values
3. **BootScene.js** — Texture generation now uses new sizes from config (still generates geometric shapes); update bullet diameters from 8→18
4. **WaveManager.js** — Update spawn margin 20→45
5. **Turret.js** — Update hardcoded chainRange 96→216, muzzle flash 8→18, lightning lineWidth 2→4
6. **Bug.js** — Update spitter bullet speed 200→450
7. **Bullet.js** — Update default speed 400→900, out-of-bounds margin 50→113
8. **GameScene.js** — Update death particle radius 3→7, spread 30→68; wave announcement font sizes
9. **All UI scenes** — Reposition for 1920×1080 (MainMenuScene, UIScene, GameOverScene)
10. **BuildSystem.js** — Scale menu offsets and dimensions

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
| Tile size 64→144 | Proportional scaling for HD grid | Keeping 64px tiles on 1920×1080 would leave >70% of canvas empty |
| Geometric → loaded PNGs | Feature explicitly requires photorealistic assets | Runtime-generated shapes cannot achieve photorealistic quality |
| GDD sprite dimensions changed | All sizes scale uniformly with resolution | Mixing old and new sizes would break visual consistency |

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Asset file sizes cause slow loading | SC-005 fails (>5s load) | Target <200KB per entity PNG, <500KB for background JPEG; use image compression |
| Scaled integer rounding breaks physics | Turrets miss, bugs clip | All rounding is ≤0.75px error; verify in wave 10 playtest |
| Build menus appear off-screen at grid edges | UI unusable for edge tiles | Add boundary clamping: if menu would overflow canvas, flip to opposite side |
| Scale.FIT produces letterboxing on non-16:9 displays | Black bars visible | Expected behavior per spec (FR: Scale.FIT preserves aspect ratio) |
