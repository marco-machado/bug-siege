# Quickstart: Full HD with Photorealistic Assets

**Feature**: 003-hd-photorealistic | **Date**: 2026-02-10

## Prerequisites

- Node.js installed (for Vite dev server)
- `npm install` already run (Phaser 3 and Vite in node_modules)
- AI image generation tool available (ChatGPT, Midjourney, or similar) for creating placeholder assets

## Implementation Order

### Step 1: Scale GameConfig.js

Update all pixel-unit values in `src/config/GameConfig.js`. Reference the complete scaling table in [plan.md](./plan.md#complete-scaling-table).

Key changes:
- `GAME.canvasWidth`: 800 → 1920
- `GAME.canvasHeight`: 600 → 1080
- `GRID.offsetX`: 208 → 736 (centers 448px grid on 1920px)
- `GRID.offsetY`: 108 → 316 (centers 448px grid on 1080px)
- All other values (tileSize, ranges, speeds, sizes) unchanged

### Step 2: Add Scale Manager to main.js

Add the `scale` property to the Phaser game config:

```javascript
const config = {
  type: Phaser.AUTO,
  width: GAME.canvasWidth,
  height: GAME.canvasHeight,
  parent: 'game',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BootScene, MainMenuScene, GameScene, UIScene, GameOverScene],
};
```

### Step 3: Add setDisplaySize to Sprite Creation

Add `setDisplaySize()` calls where sprites are created to ensure HD textures render at game-logic sizes:
- **GameScene.js**: `setDisplaySize(GRID.tileSize, GRID.tileSize)` on tile and core sprites
- **Bullet.js**: Derive `BULLET_SIZE = GRID.tileSize / 8`, apply via `setDisplaySize()` and `body.setCircle()`
- **Bug.js**: Use `this.width / 2` for physics body circle

### Step 4: Reposition UI Elements

Recalculate all absolute pixel positions in:
- **MainMenuScene.js**: Title at `W/2, H*0.3`, subtitle below, start button at `W/2, H*0.55`, footer at `W/2, H-50`
- **UIScene.js**: Scale font sizes (~2×), reposition HP bar to top-right with wider bar, move phase text/button to bottom center
- **GameOverScene.js**: Center title/stats/buttons using `GAME.canvasWidth/2` and proportional Y values
- **BuildSystem.js**: Scale menu widths (~1.5-2×), font sizes, line heights; add boundary clamping for edge tiles
- **GameScene.js**: Scale wave announcement font size

### Step 5: Verify Phase A (HD Canvas with Geometric Textures)

Run `npm run dev` and verify:
- [ ] Canvas renders at 1920×1080
- [ ] Grid is centered with 736px side margins, 316px top/bottom margins
- [ ] Turrets can be placed on all 7×7 grid cells
- [ ] Bugs spawn from edges and path to core correctly
- [ ] Turret firing ranges feel correct (not too short/long)
- [ ] Build menu appears at correct position next to clicked tile
- [ ] HUD elements are readable and properly positioned
- [ ] Phase text and start wave button work
- [ ] Canvas scales down correctly on smaller browser windows

### Step 6: Create Asset Directory and Generate Placeholder Art

```bash
mkdir -p assets/turrets assets/bugs assets/environment
```

Generate 15 PNG/JPEG files using AI image tools with cyberpunk/neon circuit board theme. See [asset dimensions table](./plan.md#asset-dimensions-table) for exact sizes per file.

Art direction keywords: cyberpunk, neon, circuit board, PCB, digital, glowing, corrupted data, top-down perspective, transparent background (for entities).

### Step 7: Convert BootScene to Asset Loader

Replace all `generateXxxTexture()` methods in BootScene with:
1. A `preload()` method containing `this.load.image()` calls for each asset
2. A loading progress bar rendered during preload
3. A `loaderror` handler that tracks failed keys
4. In `create()`: generate magenta fallback textures for any failed keys, then transition to MainMenu

### Step 8: Add Background Image to GameScene

In `GameScene.create()`, before `renderGrid()`:
```javascript
this.add.image(GAME.canvasWidth / 2, GAME.canvasHeight / 2, 'background');
```

### Step 9: Verify Phase B (Photorealistic Assets)

Run `npm run dev` and verify:
- [ ] Loading progress bar appears and fills during boot
- [ ] All turret types show photorealistic sprites
- [ ] All bug types show photorealistic sprites at correct sizes
- [ ] Core displays photorealistic sprite
- [ ] Background fills the canvas
- [ ] Grid tiles show textured appearance
- [ ] Bullets show photorealistic sprites
- [ ] No geometric placeholder shapes visible during normal gameplay

### Step 10: Final Polish and Full Playthrough

- [ ] Play through all 10 waves
- [ ] Verify 60 FPS during wave 10 with maximum entities
- [ ] Check all menus: build, upgrade, sell
- [ ] Verify game over screen (both victory and defeat)
- [ ] Test window resize / Scale.FIT behavior
- [ ] Check console for any warnings or errors

## File Change Summary

| File | Change Type | Scope |
|------|------------|-------|
| `src/config/GameConfig.js` | Modify | All pixel values scaled |
| `src/main.js` | Modify | Add Scale Manager config |
| `src/scenes/BootScene.js` | Rewrite | Texture gen → asset loading + progress bar |
| `src/scenes/MainMenuScene.js` | Modify | Reposition UI |
| `src/scenes/GameScene.js` | Modify | Scale VFX, add background |
| `src/scenes/UIScene.js` | Modify | Reposition HUD |
| `src/scenes/GameOverScene.js` | Modify | Reposition UI |
| `src/entities/Turret.js` | Modify | Scale 3 hardcoded values |
| `src/entities/Bug.js` | Modify | Scale 1 hardcoded value |
| `src/entities/Bullet.js` | Modify | Scale 2 hardcoded values |
| `src/systems/WaveManager.js` | Modify | Scale 1 hardcoded value |
| `src/systems/BuildSystem.js` | Modify | Scale menu dimensions |
| `assets/**/*.png` | Create | 12 new PNG files |
| `assets/**/*.jpg` | Create | 1 new JPEG file |
