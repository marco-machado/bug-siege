# Research: Full HD with Photorealistic Assets

**Feature**: 003-hd-photorealistic | **Date**: 2026-02-10

## R1: Optimal Scale Factor for 800×600 → 1920×1080

**Decision**: Uniform 2.25× scale factor (tileSize: 64 → 144)

**Rationale**: The aspect ratio changes from 4:3 to 16:9, so width and height cannot share a single scale factor. The 7×7 square grid is the gameplay anchor. Scaling uniformly by the grid preserves gameplay balance. tileSize=144 was chosen because:
- 144/64 = 2.25 — clean factor
- 144 has many divisors (2,3,4,6,8,9,12,16,18,24,36,48,72) enabling clean sub-pixel math
- Grid at 144px: 1008×1008px total. Vertical margin: (1080-1008)/2 = 36px
- Horizontal margin: (1920-1008)/2 = 456px — suitable for side HUD expansion
- Most scaled values produce clean integers or near-integers (max rounding error: 0.75px)

**Alternatives considered**:
- **2.0× (tileSize=128)**: Grid 768×768, margins 576×156. Clean but small tiles for "HD photorealistic" art. Underutilizes the resolution bump.
- **2.5× (tileSize=160)**: Grid 960×960, margins 480×60. Tight vertical margins (60px) leave almost no room for HUD above/below the grid.
- **1.8× (tileSize=115)**: Matches exact height ratio (1080/600). Awkward tile size, poor divisibility, produces many fractional values.

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

**Decision**: Bug speeds (pixels/second) MUST scale by 2.25× along with all other pixel values.

**Rationale**: Bug speed is measured in pixels per second. If the grid is 2.25× larger but speed stays the same, bugs take 2.25× longer to reach the core — a major gameplay balance change. Scaling speed by 2.25× preserves the exact same "tiles per second" rate and identical game feel.

- swarmer: 60 → 135 px/s (still ~0.94 tiles/sec)
- brute: 30 → 68 px/s (still ~0.47 tiles/sec)
- spitter: 35 → 79 px/s (still ~0.55 tiles/sec)
- boss: 15 → 34 px/s (still ~0.24 tiles/sec)

Same logic applies to bullet speeds (400→900, 200→450).

**Alternatives considered**:
- **Keep original speeds**: Would slow the entire game by 2.25×. Rejected: spec says "No gameplay balance changes."
