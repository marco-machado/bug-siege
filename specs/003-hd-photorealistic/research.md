# Research: Full HD with Photorealistic Assets

**Feature**: 003-hd-photorealistic | **Date**: 2026-02-10

## R1: Scaling Strategy for 800×600 → 1920×1080

**Decision**: No config value scaling. Keep original game-logic values (tileSize=64, original speeds/ranges/sizes). Center the grid on the larger canvas by recalculating offsets. Use `setDisplaySize()` on loaded HD texture sprites to render at game-logic sizes.

**Rationale**: Scaling all pixel values (speeds, ranges, sizes) adds complexity and rounding errors for no gameplay benefit. The simpler approach is:
- Keep tileSize=64 — all game logic, physics, and balance remain identical
- Recalculate grid offsets for centering: offsetX=(1920−448)/2=736, offsetY=(1080−448)/2=316
- Load HD texture assets at their native resolution, display at config sizes via `setDisplaySize()`
- Grid at 64px: 448×448px total. Horizontal margin: 736px, vertical margin: 316px

**Alternatives considered**:
- **2.25× uniform scale (tileSize=144)**: Requires scaling every pixel value in config and hardcoded constants. Produces rounding errors. More changes, more risk.
- **2× uniform scale (tileSize=128)**: Cleaner than 2.25× but still requires scaling all values. Unnecessary complexity when setDisplaySize handles visuals.

## R2: Phaser 3 Scale Manager Configuration

**Decision**: `Phaser.Scale.FIT` mode with `Phaser.Scale.CENTER_BOTH` autoCenter

**Rationale**: Scale.FIT scales the canvas to fit inside the parent while preserving aspect ratio. Combined with CENTER_BOTH, the canvas is centered with letterboxing on mismatched displays. This is the recommended Phaser approach for fixed-resolution games and matches the spec requirement (FR: Scale.FIT).

**Implementation**:
```javascript
const config = {
  type: Phaser.AUTO,
  width: GAME.canvasWidth,   // 1920
  height: GAME.canvasHeight, // 1080
  parent: 'game',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: { ... },
  scene: [ ... ],
};
```

**Alternatives considered**:
- **Scale.NONE**: No scaling — canvas overflows on smaller displays. Rejected: spec requires graceful handling of sub-1080p.
- **Scale.ENVELOP**: Fills parent entirely, may crop edges. Rejected: would clip game elements.
- **Scale.RESIZE**: Resizes canvas to parent, changes internal resolution. Rejected: complicates all positioning code.

## R3: Phaser 3 Asset Preloading with Progress Bar

**Decision**: Use Phaser's built-in Loader in `preload()` method with `progress` and `loaderror` events

**Rationale**: Phaser's Loader Plugin provides `this.load.image(key, path)` for loading individual images during the preload phase. The `progress` event fires with a 0-1 value as files load, enabling a simple progress bar. The `loaderror` event fires per-file on failure.

**Implementation pattern**:
```javascript
// In BootScene:
preload() {
  // Progress bar
  const barW = 400, barH = 30;
  const barX = (GAME.canvasWidth - barW) / 2;
  const barY = GAME.canvasHeight / 2;
  const progressBar = this.add.graphics();
  const progressBox = this.add.graphics();
  progressBox.fillStyle(0x222222, 0.8);
  progressBox.fillRect(barX, barY, barW, barH);

  this.load.on('progress', (value) => {
    progressBar.clear();
    progressBar.fillStyle(0x00ff88, 1);
    progressBar.fillRect(barX + 4, barY + 4, (barW - 8) * value, barH - 8);
  });

  this.load.on('complete', () => {
    progressBar.destroy();
    progressBox.destroy();
  });

  // Error handling
  this.load.on('loaderror', (file) => {
    console.warn(`Failed to load asset: ${file.key} (${file.url})`);
    // Fallback texture generated post-load in create()
  });

  // Load all assets
  this.load.image('turret-blaster', 'assets/turrets/blaster.png');
  // ... etc
}
```

**Alternatives considered**:
- **Custom XHR loader**: Unnecessary complexity; Phaser's loader handles caching, progress, errors natively.
- **Sprite sheet atlas**: Rejected per spec clarification — individual PNG files for easy drop-in replacement.

## R4: Asset Load Failure Fallback Strategy

**Decision**: On `loaderror`, log a console warning. In `create()`, check each texture key — if missing, generate a bright magenta geometric fallback using the same Graphics approach as the current BootScene.

**Rationale**: The game must remain playable even if individual assets fail to load (FR-012). A bright magenta (#ff00ff) fallback is immediately visible and communicates "missing asset" clearly to developers without crashing or showing invisible entities.

**Implementation**:
- Track failed keys in a Set during `loaderror`
- In `create()`, iterate failed keys and generate simple geometric fallbacks (rectangles for turrets/core/tiles, circles for bugs/bullets)
- Proceed to MainMenu normally

**Alternatives considered**:
- **Block on failure**: Show error screen and stop. Rejected: too disruptive; game should degrade gracefully.
- **Retry mechanism**: Attempt reload. Rejected: adds complexity; if the file is missing, retries won't help.
- **Invisible entities**: Do nothing. Rejected: spec explicitly requires visible fallback.

## R5: Bug Speed Scaling Verification

**Decision**: No speed scaling needed. All config values (speeds, ranges, sizes) remain at original values.

**Rationale**: Since tileSize stays at 64 and grid offsets simply reposition the grid on the larger canvas, all pixel-per-second rates and tile-per-second rates are preserved automatically. No values need adjustment for gameplay balance.
