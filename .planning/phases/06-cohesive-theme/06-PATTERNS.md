# Phase 6: Cohesive Theme - Pattern Map

**Mapped:** 2026-04-18
**Files analyzed:** 7 (1 config + 6 consumers)
**Analogs found:** 7 / 7 (all in-repo; zero "no analog" entries)

## File Classification

Each row is a migration target. "Role" describes the file's architectural layer. "Data Flow" describes the direction of THEME consumption (one-way read from `THEME.ui.*` into Phaser render APIs). "API Mix" identifies which Phaser color APIs the file uses — this decides whether each call site reads `.hex` or `.num`.

| File | Role | Data Flow | API Mix | Closest Analog | Match Quality |
|------|------|-----------|---------|----------------|---------------|
| `src/config/GameConfig.js` (expand `THEME`) | config (frozen palette) | source-of-truth, read-only once frozen | — (defines both forms) | `VFX` + `POSTFX` nested-freeze blocks in the same file (lines 142–212) | exact (same file, same pattern) |
| `src/scenes/MainMenuScene.js` | scene lifecycle owner (menu UI) | consumer of `THEME.ui.*` | text styles (`color:`), `setColor()`, `graphics.lineStyle()` | `src/scenes/BootScene.js` (already imports `THEME`, reads `THEME.background` + `THEME.nebula`) | role-match (same kind of scene, existing THEME import precedent) |
| `src/scenes/BootScene.js` (preloader lines 19, 27, 32 only) | scene lifecycle owner (preload + texture gen) | consumer of `THEME.ui.loadingBar*` | text style (`color:`), `graphics.fillStyle()` | itself — already imports `THEME`; expand usage to preloader | exact (self-analog: same file already demonstrates `import { ..., THEME }` from `GameConfig.js`) |
| `src/scenes/UIScene.js` | scene lifecycle owner (HUD overlay) | consumer of `THEME.ui.*` | text styles, `Rectangle` constructor color arg, `setFillStyle()` | `src/scenes/BootScene.js` import shape; `src/entities/Turret.js:53–55` for `Rectangle + setFillStyle` pair | role-match (HUD reuses text + Rectangle combo also present in Turret.js HP-bar) |
| `src/scenes/GameOverScene.js` | scene lifecycle owner (end screen) | consumer of `THEME.ui.*` | text styles, `setColor()` pointer-hover pattern | `src/scenes/MainMenuScene.js:41–48` (same button hover pair) | exact (identical hover structure) |
| `src/systems/BuildSystem.js` | system (menu builder) | consumer of `THEME.ui.*` | text styles, `setColor()`, `Rectangle` constructor + `setStrokeStyle()`, `setFillStyle()` | `src/scenes/MainMenuScene.js` for hover pair; `src/entities/Turret.js:53` for `Rectangle + setStrokeStyle` shape; `UIScene.js:82` for conditional `setFillStyle` | role-match (largest migration — 19 literals; composes all patterns) |
| `src/entities/Turret.js` (lines 53, 55, 405–407 only) | entity (gameplay object with HP-bar chrome) | consumer of `THEME.ui.hpBarBg`, `THEME.ui.success/warning/danger` | `Rectangle` constructor, `setFillStyle()` conditional | `src/scenes/UIScene.js:33, 34, 82` (identical HP-bar pattern: Rectangle(bg) + Rectangle(fill) + conditional setFillStyle by pct) | exact (UIScene HP-bar is the mirror pattern; migrate both the same way) |

## Call-Site Inventory

Every hardcoded color literal in scope, classified by file, line, current value, target semantic key, and which `{ hex, num }` form the call site must read. This is the authoritative migration checklist for the planner — one row per replacement.

### `src/config/GameConfig.js` (not a call site — definition target)

Expand lines 136–140 by adding a `ui: Object.freeze({ ... })` sub-object with exactly 14 keys, each shaped as `Object.freeze({ hex: '#rrggbb', num: 0xrrggbb })`. Existing keys (`background`, `nebula`, `accent`) stay as-is. See "Shared Patterns → Pattern A" below for the full shape.

### `src/scenes/MainMenuScene.js` (7 literals)

| Line | API | Current literal | Semantic key | Form |
|------|-----|-----------------|--------------|------|
| 23 | `gridG.lineStyle(1, 0x334455, 0.15)` | `0x334455` | `ui.gridLine` | `.num` |
| 30 | text style `color: '#00ff88'` (title) | `'#00ff88'` | `ui.accentPrimary` | `.hex` |
| 37 | text style `color: '#668899'` (subtitle) | `'#668899'` | `ui.textMuted` | `.hex` |
| 44 | text style `color: '#ffffff'` (start button default) | `'#ffffff'` | `ui.textPrimary` | `.hex` |
| 47 | `startBtn.setColor('#00ff88')` (pointerover) | `'#00ff88'` | `ui.accentPrimary` | `.hex` |
| 48 | `startBtn.setColor('#ffffff')` (pointerout) | `'#ffffff'` | `ui.textPrimary` | `.hex` |
| 63 | text style `color: '#445566'` (footer) | `'#445566'` | `ui.textMuted` | `.hex` |

Out-of-scope literal in same file: line 74 `g.fillStyle(0xffffff, alpha)` inside `createStarfield()` — starfield is procedural game-world art, not UI chrome. Leave as-is (D-01 boundary).

### `src/scenes/BootScene.js` preloader only (3 literals)

| Line | API | Current literal | Semantic key | Form |
|------|-----|-----------------|--------------|------|
| 19 | `progressBox.fillStyle(0x222222, 0.8)` | `0x222222` | `ui.loadingBarBg` | `.num` |
| 27 | text style `color: '#00ff88'` ("Loading...") | `'#00ff88'` | `ui.accentPrimary` | `.hex` |
| 32 | `progressBar.fillStyle(0x00ff88, 1)` | `0x00ff88` | `ui.loadingBar` | `.num` |

Out-of-scope in same file: lines 115–158 (`generateParticleTextures`, `generateFallback`). These generate textures — `0xffffff` particle fill, `0xff00ff` magenta fallback sprite, `0x1a1a2e` background fallback are texture-pixel data, not UI chrome. Leave as-is (D-01 boundary; canonical_refs explicitly excludes lines 115–155).

Note on line 91 (`ctx.fillStyle = THEME.background`) and lines 99, 103 (`THEME.nebula[...]`): already migrated in Phase 1. Confirms the import pattern works.

### `src/scenes/UIScene.js` (9 literals)

| Line | API | Current literal | Semantic key | Form |
|------|-----|-----------------|--------------|------|
| 19 | text style `color: '#ffffff'` (wave text) | `'#ffffff'` | `ui.textPrimary` | `.hex` |
| 25 | text style `color: '#ffdd00'` (credits text) | `'#ffdd00'` | `ui.warning` | `.hex` |
| 33 | `Rectangle(..., 0x333333)` (hpBarBg) | `0x333333` | `ui.hpBarBg` | `.num` |
| 34 | `Rectangle(..., 0x00ff44)` (hpBarFill initial) | `0x00ff44` | `ui.success` | `.num` |
| 39 | text style `color: '#aaaaaa'` (hp label) | `'#aaaaaa'` | `ui.textMuted` | `.hex` |
| 48 | text style `color: '#88ccff'` (phase text) | `'#88ccff'` | `ui.accentSecondary` | `.hex` |
| 54 | text style `color: '#00ff88'` (start wave btn) | `'#00ff88'` | `ui.accentPrimary` | `.hex` |
| 82 | `setFillStyle(pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff3333)` (HP tier ternary) | three literals | `ui.success` / `ui.warning` / `ui.danger` | `.num` (all three) |
| 117 | text style `color: '#88ff88'` (debug text) | `'#88ff88'` | `ui.accentPrimary` | `.hex` |

Note on line 118: `backgroundColor: '#000000aa'` is an 8-digit CSS RGBA string used by the `.css` text `backgroundColor` property. This is out of scope for the 6-digit grep regex per D-07 ("Use anchored 6-digit form `#[0-9a-fA-F]{6}`") and it's a semi-transparent debug-only overlay. Recommend leaving as-is; planner may document as an intentional carve-out.

### `src/scenes/GameOverScene.js` (7 literals)

| Line | API | Current literal | Semantic key | Form |
|------|-----|-----------------|--------------|------|
| 26 | `won ? '#00ff88' : '#ff3333'` (title color ternary) | two literals | `ui.accentPrimary` / `ui.danger` | `.hex` (both) |
| 46 | text style `color: '#ffffff'` (stats) | `'#ffffff'` | `ui.textPrimary` | `.hex` |
| 54 | text style `color: '#ffffff'` (restart btn default) | `'#ffffff'` | `ui.textPrimary` | `.hex` |
| 57 | `restartBtn.setColor('#00ff88')` (pointerover) | `'#00ff88'` | `ui.accentPrimary` | `.hex` |
| 58 | `restartBtn.setColor('#ffffff')` (pointerout) | `'#ffffff'` | `ui.textPrimary` | `.hex` |
| 64 | text style `color: '#ffffff'` (menu btn default) | `'#ffffff'` | `ui.textPrimary` | `.hex` |
| 67 | `menuBtn.setColor('#00ff88')` (pointerover) | `'#00ff88'` | `ui.accentPrimary` | `.hex` |
| 68 | `menuBtn.setColor('#ffffff')` (pointerout) | `'#ffffff'` | `ui.textPrimary` | `.hex` |

(Eight entries; D-01 description called it "7 literals" — line 26's ternary counts as two distinct literals but is one expression. Both counts are consistent; planner should migrate all 8 occurrences.)

### `src/systems/BuildSystem.js` (19 literals — largest migration)

| Line | API | Current literal | Semantic key | Form |
|------|-----|-----------------|--------------|------|
| 100 | `Rectangle(..., 0x111122, 0.95)` (build menu bg) | `0x111122` | `ui.surface` | `.num` |
| 102 | `setStrokeStyle(2, 0x4488aa)` (build menu border) | `0x4488aa` | `ui.surfaceBorder` | `.num` |
| 108 | text style `color: '#ffdd00'` (credits header) | `'#ffdd00'` | `ui.warning` | `.hex` |
| 115 | `color = canAfford ? '#ffffff' : '#555555'` (label color ternary) | two literals | `ui.textPrimary` / `ui.textDisabled` | `.hex` (both) |
| 127 | text style `color: canAfford ? '#88aacc' : '#444444'` (desc ternary) | two literals | `ui.accentSecondary` / `ui.textDisabled` | `.hex` (both) |
| 131 | `label.setColor('#00ff88')` (pointerover) | `'#00ff88'` | `ui.accentPrimary` | `.hex` |
| 132 | `label.setColor('#ffffff')` (pointerout) | `'#ffffff'` | `ui.textPrimary` | `.hex` |
| 187 | `color: canUpgrade ? '#ffffff' : '#555555'` (upgrade item) | two literals | `ui.textPrimary` / `ui.textDisabled` | `.hex` (both) |
| 209 | `color: canRepair ? '#ffffff' : '#555555'` (repair item) | two literals | `ui.textPrimary` / `ui.textDisabled` | `.hex` (both) |
| 235 | `color: canRepairType ? '#ffffff' : '#555555'` (repair-all-type) | two literals | `ui.textPrimary` / `ui.textDisabled` | `.hex` (both) |
| 258 | `color: canRepairAll ? '#ffffff' : '#555555'` (repair-all) | two literals | `ui.textPrimary` / `ui.textDisabled` | `.hex` (both) |
| 277 | `color: '#ffaa00'` (Sell item — warning tone) | `'#ffaa00'` | `ui.warning` | `.hex` |
| 308 | `Rectangle(..., 0x111122, 0.95)` (turret menu bg) | `0x111122` | `ui.surface` | `.num` |
| 310 | `setStrokeStyle(2, 0x4488aa)` (turret menu border) | `0x4488aa` | `ui.surfaceBorder` | `.num` |
| 316 | text style `color: '#ffdd00'` (turret menu credits) | `'#ffdd00'` | `ui.warning` | `.hex` |
| 332 | text style `color: '#88aacc'` (item desc) | `'#88aacc'` | `ui.accentSecondary` | `.hex` |
| 337 | `text.setColor('#00ff88')` (pointerover) | `'#00ff88'` | `ui.accentPrimary` | `.hex` |
| 338 | `text.setColor(item.color)` — restores from stored string | no literal | no change (reads `item.color`, which is already `THEME.ui.*.hex` after 187/209/235/258 migration) | — |
| 349 | `textObj.setColor('#ff3333')` (flashDenied) | `'#ff3333'` | `ui.danger` | `.hex` |
| 376 | `color = cell === 'empty' ? 0x00ff88 : 0x4488aa` (hover highlight) | two literals | `ui.accentPrimary` / `ui.surfaceBorder` | `.num` (both) |

Literal count tally for this file: 100, 102, 108, 115 (×2), 127 (×2), 131, 132, 187 (×2), 209 (×2), 235 (×2), 258 (×2), 277, 308, 310, 316, 332, 337, 349, 376 (×2) = **24 distinct literal replacements across 19 source lines** (matches CONTEXT.md's "19 color literals" which counts source lines, not replacements).

Critical: line 338 (`text.setColor(item.color)`) and line 351 (`textObj.setColor(origColor)`) **are not literals** — they restore a stored string. After migration those stored strings will be `THEME.ui.*.hex` values, which is exactly the contract `setColor()` expects. No change needed at those lines.

### `src/entities/Turret.js` (5 literals, lines 53, 55, 405–407)

| Line | API | Current literal | Semantic key | Form |
|------|-----|-----------------|--------------|------|
| 53 | `Rectangle(..., 0x333333)` (hpBarBg) | `0x333333` | `ui.hpBarBg` | `.num` |
| 55 | `Rectangle(..., 0x00ff00)` (hpBarFill initial — note `0x00ff00`, not `0x00ff44`) | `0x00ff00` | `ui.success` | `.num` |
| 405 | `let color = 0x00ff00` (healthy) | `0x00ff00` | `ui.success` | `.num` |
| 406 | `if (ratio <= 0.25) color = 0xff3333` (critical) | `0xff3333` | `ui.danger` | `.num` |
| 407 | `else if (ratio <= 0.5) color = 0xffaa00` (warning) | `0xffaa00` | `ui.warning` | `.num` |

Research pitfall #5 applies here: `0x00ff00` and `0x00ff44` are **both** migrated to `ui.success`, unifying the two drift-green HP bars (UIScene line 34/82 uses `0x00ff44`; Turret.js lines 55/405 use `0x00ff00`) into one semantic. This is an intentional unification per D-06 ("collapse when intent is identical").

## Pattern Assignments

Concrete before/after excerpts, one per distinct migration shape.

### `src/config/GameConfig.js` — expand `THEME` (config role, source-of-truth)

**Analog:** `src/config/GameConfig.js:142–212` (`VFX` and `POSTFX` frozen-nested blocks in the same file).

**Nested-freeze analog pattern** (lines 157–164, `VFX.BUILD`):

```javascript
BUILD: Object.freeze({
  count: 12,
  lifespan: 400,
  tints: Object.freeze([0x9966ff, 0xeef2ff]),
  speed: Object.freeze({ min: 20, max: 60 }),
  scale: Object.freeze({ start: 0.8, end: 0.1 }),
  gravityY: -40,
}),
```

Precedent established: the outer `Object.freeze({...})` wraps a sub-object; inner mutable-looking fields are also wrapped in `Object.freeze({...})`. New `THEME.ui` entries follow the same triple-freeze depth (outer THEME, inner `ui`, innermost per-entry `{ hex, num }`).

**Before** (GameConfig.js:136–140):

```javascript
export const THEME = Object.freeze({
  background: '#0a0a12',
  nebula: Object.freeze(['#2d1b4e', '#4b2c62', '#6a4c93']),
  accent: '#eef2ff',
});
```

**After** (shape — exact hex values for derived keys are Claude's discretion per D-03/D-06; research recommends `textMuted: '#a89fcc'`, `textDisabled: '#6a6a80'`, `accentSecondary: '#9966ff'`, `warning: '#ffaa44'`, `success: '#66dd99'`):

```javascript
export const THEME = Object.freeze({
  background: '#0a0a12',
  nebula: Object.freeze(['#2d1b4e', '#4b2c62', '#6a4c93']),
  accent: '#eef2ff',
  ui: Object.freeze({
    textPrimary:     Object.freeze({ hex: '#eef2ff', num: 0xeef2ff }),
    textMuted:       Object.freeze({ hex: '#a89fcc', num: 0xa89fcc }),
    textDisabled:    Object.freeze({ hex: '#6a6a80', num: 0x6a6a80 }),
    accentPrimary:   Object.freeze({ hex: '#9966ff', num: 0x9966ff }),
    accentSecondary: Object.freeze({ hex: '#88aacc', num: 0x88aacc }),
    warning:         Object.freeze({ hex: '#ffaa44', num: 0xffaa44 }),
    danger:          Object.freeze({ hex: '#ff3333', num: 0xff3333 }),
    success:         Object.freeze({ hex: '#66dd99', num: 0x66dd99 }),
    surface:         Object.freeze({ hex: '#2d1b4e', num: 0x2d1b4e }),
    surfaceBorder:   Object.freeze({ hex: '#4b2c62', num: 0x4b2c62 }),
    hpBarBg:         Object.freeze({ hex: '#1a1a2e', num: 0x1a1a2e }),
    gridLine:        Object.freeze({ hex: '#334455', num: 0x334455 }),
    loadingBar:      Object.freeze({ hex: '#9966ff', num: 0x9966ff }),
    loadingBarBg:    Object.freeze({ hex: '#1a1a2e', num: 0x1a1a2e }),
  }),
});
```

Exactly 14 `ui.*` keys (ceiling per D-06). Each is `{ hex, num }` (D-04 inline-both). Order follows the research's Pattern 1 starter palette.

---

### Pattern B — Text-style site (scene and system consumers)

**Analog:** `src/scenes/BootScene.js:24–28` (existing Phaser text block in same codebase that sits next to migrated `THEME` usage).

**Before** (MainMenuScene.js:27–32, title):

```javascript
this.add.text(W / 2, H * 0.28, 'BUG SIEGE', {
  fontSize: '112px',
  fontFamily: 'monospace',
  color: '#00ff88',
  fontStyle: 'bold',
}).setOrigin(0.5);
```

**After:**

```javascript
this.add.text(W / 2, H * 0.28, 'BUG SIEGE', {
  fontSize: '112px',
  fontFamily: 'monospace',
  color: THEME.ui.accentPrimary.hex,
  fontStyle: 'bold',
}).setOrigin(0.5);
```

Requires: `import { GAME, POSTFX, THEME } from '../config/GameConfig.js';` — add `THEME` to the existing import destructuring (don't create a new import line; follow existing pattern).

---

### Pattern C — Pointer hover pair (MainMenu, GameOver, BuildSystem)

**Analog:** `src/scenes/MainMenuScene.js:47–48` — two-line pointerover/pointerout that toggles between accent and base text color. The `GameOverScene.js:57–58` and `67–68` use this exact structure, as does `BuildSystem.js:131–132` and `337–338`.

**Before** (GameOverScene.js:57–58):

```javascript
restartBtn.on('pointerover', () => restartBtn.setColor('#00ff88'));
restartBtn.on('pointerout', () => restartBtn.setColor('#ffffff'));
```

**After:**

```javascript
restartBtn.on('pointerover', () => restartBtn.setColor(THEME.ui.accentPrimary.hex));
restartBtn.on('pointerout', () => restartBtn.setColor(THEME.ui.textPrimary.hex));
```

**Variant** (BuildSystem.js:337–338): `pointerout` restores `item.color` (a stored string, not a literal). Since `item.color` holds `THEME.ui.textPrimary.hex` / `THEME.ui.textDisabled.hex` (post-migration) or `THEME.ui.warning.hex` (line 277 Sell), the restore line stays structurally unchanged:

```javascript
text.on('pointerover', () => text.setColor(THEME.ui.accentPrimary.hex));
text.on('pointerout', () => text.setColor(item.color)); // unchanged
```

---

### Pattern D — Rectangle constructor with optional stroke (BuildSystem menu bg, UIScene HP bar, Turret HP bar)

**Analog:** `src/systems/BuildSystem.js:100–102` — Rectangle constructor followed by `setStrokeStyle()`. The same pair repeats at lines 308–310. `UIScene.js:33–34` is the same shape without `setStrokeStyle` (no border on HP bar). `Turret.js:53–54` is similarly Rectangle-only.

**Before** (BuildSystem.js:100–102):

```javascript
const bg = this.scene.add.rectangle(0, 0, menuWidth, menuHeight, 0x111122, 0.95)
  .setOrigin(0, 0)
  .setStrokeStyle(2, 0x4488aa);
```

**After:**

```javascript
const bg = this.scene.add.rectangle(0, 0, menuWidth, menuHeight, THEME.ui.surface.num, 0.95)
  .setOrigin(0, 0)
  .setStrokeStyle(2, THEME.ui.surfaceBorder.num);
```

Both reads are `.num`. The fourth arg to `add.rectangle(x, y, w, h, fillColor, alpha)` and the second arg to `setStrokeStyle(lineWidth, color, alpha?)` are numeric per the Phaser API [RESEARCH Pattern 3].

---

### Pattern E — Conditional `setFillStyle()` tier ternary (UIScene HP bar, Turret HP bar)

**Analog:** `src/scenes/UIScene.js:82` — ternary on HP percentage selecting one of three tier colors.

**Before** (UIScene.js:82):

```javascript
this.hpBarFill.setFillStyle(pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff3333);
```

**After:**

```javascript
this.hpBarFill.setFillStyle(
  pct > 0.5 ? THEME.ui.success.num
  : pct > 0.25 ? THEME.ui.warning.num
  : THEME.ui.danger.num,
);
```

**Mirror variant** (Turret.js:405–408, structurally equivalent but phrased as a reassignment instead of nested ternary):

**Before:**

```javascript
let color = 0x00ff00;
if (ratio <= 0.25) color = 0xff3333;
else if (ratio <= 0.5) color = 0xffaa00;
this.hpBarFill.setFillStyle(color);
```

**After:**

```javascript
let color = THEME.ui.success.num;
if (ratio <= 0.25) color = THEME.ui.danger.num;
else if (ratio <= 0.5) color = THEME.ui.warning.num;
this.hpBarFill.setFillStyle(color);
```

---

### Pattern F — `graphics.fillStyle()` / `graphics.lineStyle()` (BootScene preloader, MainMenu grid)

**Analog:** `src/scenes/BootScene.js:19` (`progressBox.fillStyle(0x222222, 0.8)`) + `src/scenes/MainMenuScene.js:23` (`gridG.lineStyle(1, 0x334455, 0.15)`).

**Before** (BootScene.js:19, 32):

```javascript
progressBox.fillStyle(0x222222, 0.8);
// ...
progressBar.fillStyle(0x00ff88, 1);
```

**After:**

```javascript
progressBox.fillStyle(THEME.ui.loadingBarBg.num, 0.8);
// ...
progressBar.fillStyle(THEME.ui.loadingBar.num, 1);
```

**Variant** (MainMenuScene.js:23):

```javascript
// Before
gridG.lineStyle(1, 0x334455, 0.15);
// After
gridG.lineStyle(1, THEME.ui.gridLine.num, 0.15);
```

Both `fillStyle(color, alpha)` and `lineStyle(lineWidth, color, alpha)` are numeric color args [RESEARCH Pattern 3; verified context7 v3.90].

---

### Pattern G — Literal-color conditional with `setFillStyle(color, alpha)` (BuildSystem hover highlight)

**Analog:** `src/systems/BuildSystem.js:376–384` — reads a local `color` var from a ternary, passes it to both the Rectangle constructor (new path) and `setFillStyle(color, alpha)` (update path). This is the same shape as Pattern E but with two ternary branches instead of three.

**Before:**

```javascript
const color = cell === 'empty' ? 0x00ff88 : 0x4488aa;
// ...
if (!this.hoverHighlight) {
  this.hoverHighlight = this.scene.add.rectangle(world.x, world.y, tileSize, tileSize, color, 0.3);
} else {
  this.hoverHighlight.setFillStyle(color, 0.3);
  // ...
}
```

**After:**

```javascript
const color = cell === 'empty' ? THEME.ui.accentPrimary.num : THEME.ui.surfaceBorder.num;
// ...
if (!this.hoverHighlight) {
  this.hoverHighlight = this.scene.add.rectangle(world.x, world.y, tileSize, tileSize, color, 0.3);
} else {
  this.hoverHighlight.setFillStyle(color, 0.3);
  // ...
}
```

No structural change beyond the two literals in the ternary. Both reads are `.num`.

---

### Pattern H — `flashDenied` temporary color swap (BuildSystem)

**Analog:** `src/systems/BuildSystem.js:347–353` — saves the current color string, sets a flash color, restores after a delay.

**Before:**

```javascript
flashDenied(textObj) {
  const origColor = textObj.style.color;
  textObj.setColor('#ff3333');
  this.scene.time.delayedCall(300, () => {
    if (textObj.active) textObj.setColor(origColor);
  });
}
```

**After** (only the flash color literal changes; `origColor` is already a stored string — it transits `THEME.ui.*.hex` values transparently):

```javascript
flashDenied(textObj) {
  const origColor = textObj.style.color;
  textObj.setColor(THEME.ui.danger.hex);
  this.scene.time.delayedCall(300, () => {
    if (textObj.active) textObj.setColor(origColor);
  });
}
```

---

### Pattern I — Ternary text color (GameOverScene title, BuildSystem button states)

**Analog:** `src/scenes/GameOverScene.js:26` — inline ternary picking between two hex strings assigned to a local, then used in text style.

**Before** (GameOverScene.js:25–32):

```javascript
const title = won ? 'VICTORY!' : 'DEFEAT';
const color = won ? '#00ff88' : '#ff3333';

this.add.text(W / 2, H * 0.2, title, {
  fontSize: '96px',
  fontFamily: 'monospace',
  color,
}).setOrigin(0.5);
```

**After:**

```javascript
const title = won ? 'VICTORY!' : 'DEFEAT';
const color = won ? THEME.ui.accentPrimary.hex : THEME.ui.danger.hex;

this.add.text(W / 2, H * 0.2, title, {
  fontSize: '96px',
  fontFamily: 'monospace',
  color,
}).setOrigin(0.5);
```

**Variant** (BuildSystem.js:115): `const color = canAfford ? '#ffffff' : '#555555';` → `const color = canAfford ? THEME.ui.textPrimary.hex : THEME.ui.textDisabled.hex;` — same shape, different keys. Applies identically to lines 187, 209, 235, 258.

## Shared Patterns

### Import augmentation (apply to every consumer file)

**Source:** `src/scenes/BootScene.js:2` — existing import that already includes `THEME` from `GameConfig.js`.

```javascript
// src/scenes/BootScene.js:2 (existing — reference pattern)
import { BUGS, GRID, GAME, THEME } from '../config/GameConfig.js';
```

**Apply to:** every file in Pattern Assignments that doesn't already import `THEME`.

- `MainMenuScene.js:2` — change `import { GAME, POSTFX }` → `import { GAME, POSTFX, THEME }`
- `BootScene.js:2` — **no change** (already imports `THEME`)
- `UIScene.js:2` — change `import { GAME, DEBUG }` → `import { GAME, DEBUG, THEME }`
- `GameOverScene.js:2` — change `import { GAME, POSTFX }` → `import { GAME, POSTFX, THEME }`
- `BuildSystem.js:1` — change `import { TURRETS, GAME }` → `import { TURRETS, GAME, THEME }`
- `Turret.js:2` — change `import { GRID, TURRETS, ECONOMY, VFX }` → `import { GRID, TURRETS, ECONOMY, VFX, THEME }`

Project convention (CLAUDE.md): ES modules with explicit `.js` extension, named exports, alphabetical-ish destructure order is not enforced — match existing order and append `THEME` at the end as shown.

### API-to-form rule (apply to every call site across every file)

**Source:** RESEARCH.md Pattern 2 + Pattern 3 verification (context7 Phaser v3.90 signatures).

| Phaser API | Argument type | Read form |
|------------|---------------|-----------|
| Text style `color:` property | CSS string | `.hex` |
| `setColor(...)` / `setFill(...)` on Text | CSS string | `.hex` |
| `Rectangle(x, y, w, h, color, alpha?)` constructor | number | `.num` |
| `setFillStyle(color, alpha?)` on Shape | number | `.num` |
| `setStrokeStyle(lineWidth, color, alpha?)` on Shape | number | `.num` |
| `graphics.fillStyle(color, alpha?)` | number | `.num` |
| `graphics.lineStyle(lineWidth, color, alpha?)` | number | `.num` |

**Apply to:** every call site in every migration target. This is the single rule that decides `.hex` vs `.num` at every replacement.

**Anti-patterns (never do these):**
- `setFillStyle('#ff3333')` — string to numeric API → renders black/invisible
- `{ color: 0xeef2ff }` in text style — number to string API → renders default white
- `setColor(THEME.ui.accentPrimary)` — passes frozen object → Phaser coerces to `'[object Object]'`

### Atomic commit per file (apply to phase workflow)

**Source:** CONTEXT.md D-05 + CLAUDE.md "Atomic commits" convention.

Seven commits in order:
1. `refactor: expand THEME with ui semantic palette in GameConfig`
2. `refactor: migrate MainMenuScene color literals to THEME.ui`
3. `refactor: migrate BootScene preloader color literals to THEME.ui`
4. `refactor: migrate UIScene color literals to THEME.ui`
5. `refactor: migrate GameOverScene color literals to THEME.ui`
6. `refactor: migrate BuildSystem color literals to THEME.ui`
7. `refactor: migrate Turret HP bar color literals to THEME.ui`

After each: `npm run build` (must exit 0, no warnings). No test framework — build + visual smoke-test at the end is the gate.

## No Analog Found

None. Every migration target has a direct in-repo analog (either itself as self-analog, another scene that already imports `THEME`, or the `VFX`/`POSTFX` nested-freeze block in `GameConfig.js`). The planner does not need to fall back to RESEARCH.md patterns for any file — every pattern is grounded in existing codebase shape.

## Open Questions from Research (planner resolves)

These were surfaced by RESEARCH.md and remain outside PATTERNS.md's pattern-mapping mandate, but the planner must resolve them before declaring completion:

1. **`GameScene.js:427` `#ff8844` wave-announcement text** — CONTEXT.md's file list omits it; D-07 grep gate will flag it. Planner picks: (a) migrate to a new `ui.waveAnnouncement` key (pushes ceiling to 15, breaks D-06), (b) migrate to `ui.accentSecondary.hex` and document, or (c) carve out explicitly in grep filter as VFX-adjacent.
2. **`main.js:14` `backgroundColor: '#0a0a12'`** — research recommends migrating to `THEME.background` for consistency; listed as optional polish task.
3. **`GameScene.js:291` `setTintFill(0xff4444)` core damage flash** — research confirms out-of-scope (game VFX, not UI chrome). Planner documents as intentional retention.
4. **Exact cosmic-family hex values for derived keys** — `textMuted`, `textDisabled`, `accentSecondary`, `warning`, `success`, `loadingBar` are planner's discretion within nebula/accent family constraint. Research suggests `#a89fcc`, `#6a6a80`, `#9966ff`, `#ffaa44`, `#66dd99`, `#9966ff` respectively. Verifier checks against UI-SPEC.

## Metadata

**Analog search scope:** `/Users/machado/Projects/bug-siege/src/{config,scenes,systems,entities}/**/*.js`
**Files scanned:** 7 (all in scope), plus `GameConfig.js` for analog pattern extraction
**Files directly read this pass:** 7 (GameConfig.js full, MainMenuScene.js full, BootScene.js full, UIScene.js full, GameOverScene.js full, BuildSystem.js full, Turret.js lines 1–80 + 390–420)
**Pattern extraction date:** 2026-04-18
