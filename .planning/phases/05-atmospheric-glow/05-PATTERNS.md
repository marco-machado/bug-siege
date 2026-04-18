# Phase 5: Atmospheric Glow - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 5 modified / 0 new
**Analogs found:** 5 / 5 (all modifications are of analog files themselves)

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/config/GameConfig.js` | config | static-export | self (existing `THEME`, `VFX`) — `src/config/GameConfig.js:136-200` | self / exact pattern |
| `src/entities/Turret.js` | entity (composite) | construct/update/destroy | self (existing slowfield aura `auraTween`/`auraRing`) — `src/entities/Turret.js:30-48, 297-331, 362-388` | self / exact lifecycle |
| `src/scenes/GameScene.js` | scene | event-driven + shutdown-cleanup | self (existing `shakeCamera`, `coreSprite`, `phase-changed` emits, shutdown handler) — `src/scenes/GameScene.js:92-99, 111-124, 156/184/201, 329-334` | self / exact |
| `src/scenes/MainMenuScene.js` | scene | static-create | self (plain `create()` with no event wiring) — `src/scenes/MainMenuScene.js:9-57` | self / exact |
| `src/scenes/GameOverScene.js` | scene | static-create | self (plain `create()` with no event wiring) — `src/scenes/GameOverScene.js:13-62` | self / exact |

**NOT MODIFIED (isolation):**
- `src/scenes/UIScene.js` — explicitly excluded per D-14 (SHAKE-04 pattern from Phase 4).
- `src/main.js` — `Phaser.AUTO` stays; renderer detection happens per-scene.

---

## Pattern Assignments

### `src/config/GameConfig.js` (config, static-export)

**Analog:** self — existing `THEME` (lines 136-140) and `VFX` (lines 142-200) exports.

**Frozen config export pattern** (`src/config/GameConfig.js:136-200`, condensed):

```javascript
export const THEME = Object.freeze({
  background: '#0a0a12',
  nebula: Object.freeze(['#2d1b4e', '#4b2c62', '#6a4c93']),
  accent: '#eef2ff',
});

export const VFX = Object.freeze({
  DEATH: Object.freeze({
    swarmer: Object.freeze({ tint: 0x44ff44, count: 10, speed: Object.freeze({ min: 80, max: 150 }), lifespan: 350, scale: Object.freeze({ start: 0.8, end: 0.3 }) }),
    // ...
  }),
  SHAKE: Object.freeze({
    light:  Object.freeze({ intensity: 0.001, duration: 60 }),
    medium: Object.freeze({ intensity: 0.003, duration: 100 }),
    heavy:  Object.freeze({ intensity: 0.008, duration: 150 }),
    bossMicroCooldown: 500,
  }),
});
```

**Rules to copy:**
- `export const <NAME> = Object.freeze({ ... })` at top level. UPPER_CASE identifier.
- **Every** nested object wrapped in its own `Object.freeze(...)` — recursive freeze is enforced by convention (see `VFX.DEATH.swarmer.speed` three-level-deep freeze).
- Arrays inside frozen objects are also frozen (see `THEME.nebula` and `VFX.DEATH.boss.color`).
- Numeric hex (`0x44ff44`) for tints used by Phaser APIs; CSS strings (`'#eef2ff'`) only for text/graphics color. POSTFX.GLOW MUST use numeric hex — this is the convention VFX already uses for every tint field.
- Sibling-level grouping by concern: `THEME` = palette, `VFX` = per-event effects. `POSTFX` joins as a new sibling, NOT nested under VFX.

**New addition for Phase 5:**

Add after the `VFX` block (after `src/config/GameConfig.js:200`):

```javascript
export const POSTFX = Object.freeze({
  GLOW: Object.freeze({
    blaster:   Object.freeze({ base: 0xeef2ff, upgraded: 0xeef2ff, outerStrength: 2, innerStrength: 1, padding: 10 }),
    zapper:    Object.freeze({ base: 0x9966ff, upgraded: 0xeef2ff, outerStrength: 2, innerStrength: 1, padding: 10 }),
    slowfield: Object.freeze({ base: 0x6a4c93, upgraded: 0xeef2ff, outerStrength: 2, innerStrength: 1, padding: 10 }),
    core:      Object.freeze({ color: 0xeef2ff,                    outerStrength: 3, innerStrength: 1, padding: 12 }),
  }),
  VIGNETTE: Object.freeze({
    x: 0.5,
    y: 0.5,
    radius: 0.5,
    buildStrength: 0.25,
    waveStrength: 0.40,
    transitionDuration: 600,
    transitionEase: 'Sine.easeInOut',
  }),
});
```

---

### `src/entities/Turret.js` (entity, construct/update/destroy)

**Analog:** self — the existing slowfield aura setup is the closest in-file parallel for "attach-a-per-sprite-FX-at-construction, mutate-or-reset-on-upgrade, teardown-on-destroy."

#### 1. Imports pattern (`src/entities/Turret.js:1-2`)

```javascript
import Phaser from 'phaser';
import { GRID, TURRETS, ECONOMY, VFX } from '../config/GameConfig.js';
```

**Rule to copy:** Named imports from `../config/GameConfig.js` with explicit `.js` extension. `POSTFX` must be added to this destructured import list — not a separate import line.

#### 2. Composite Turret — FX attaches to `this.sprite`, never `this` (`src/entities/Turret.js:22-48`)

```javascript
this.sprite = scene.add.sprite(worldX, worldY, `turret-${type}`).setDisplaySize(GRID.tileSize, GRID.tileSize);

this.wallBody = scene.physics.add.staticImage(worldX, worldY, `turret-${type}`);
// ...
this.wallBody.turretRef = this;

if (type === 'slowfield') {
  const cfg = VFX.SLOWFIELD;
  this._auraColor = cfg.color;
  this._auraAlphaMax = cfg.alphaMax;
  this.auraRing = scene.add.graphics();
  this.auraTween = scene.tweens.add({
    targets: { progress: 0 },
    progress: 1,
    duration: cfg.pulseDuration,
    repeat: -1,
    onUpdate: (_tween, target) => {
      this.auraRing.clear();
      // ...
    },
  });
}
```

**Rules to copy:**
- `this.sprite = scene.add.sprite(...)` is the attach point. Line 22 is where `this.sprite` is created; glow attach goes IMMEDIATELY after this line (before wallBody/aura setup).
- Branch on `type` to gate type-specific work (see `if (type === 'slowfield')`). POSTFX must similarly branch: `if (type !== 'wall')` — walls receive no glow (D-02).
- Read config via `const cfg = VFX.SLOWFIELD;` local alias. POSTFX attach should do `const cfg = POSTFX.GLOW[type];`.
- Store FX handle on `this._xxxFx` / `this.xxxFX` (see `this._auraColor`, `this.auraTween`). Convention: public handle if destroy/upgrade reads it elsewhere; underscore-prefixed if internal. `this.glowFX` is fine per research Example 2.

**New attach code (for Turret constructor, after line 22):**

```javascript
const isWebGL = scene.game.renderer.type === Phaser.WEBGL;
if (isWebGL && type !== 'wall') {
  const cfg = POSTFX.GLOW[type];
  this.sprite.preFX.setPadding(cfg.padding);
  this.glowFX = this.sprite.preFX.addGlow(cfg.base, cfg.outerStrength, cfg.innerStrength);
}
```

#### 3. Upgrade path — mutate or clear+re-add (`src/entities/Turret.js:297-331`)

```javascript
upgrade() {
  if (this.upgraded) return false;
  this.upgraded = true;

  const conf = TURRETS[this.type];
  if (conf.upgradedDamage) {
    this.damage = conf.upgradedDamage;
  }
  if (this.type === 'slowfield' && conf.upgradedRange) {
    this.range = conf.upgradedRange;
    const cfg = VFX.SLOWFIELD;
    this._auraColor = cfg.upgradedColor;
    this._auraAlphaMax = cfg.upgradedAlphaMax;
  }
  // ...
  if (this.idleTween) {
    this.idleTween.destroy();
    this.idleTween = this.scene.tweens.add({ /* new tween */ });
  }
  this.sprite.setTint(0xffdd44);

  return true;
}
```

**Rules to copy:**
- Early-return guard `if (this.upgraded) return false;` — upgrade is idempotent.
- Type-conditional swap: slowfield reads `cfg.upgradedColor` to mutate `this._auraColor` (line 308). POSTFX glow upgrade follows same pattern: read `POSTFX.GLOW[this.type].upgraded` and mutate `this.glowFX.color`.
- Tween replacement pattern (lines 317-327): `.destroy()` the old tween, then recreate. The glow controller does NOT need clear+re-add — it exposes public mutable `color` per RESEARCH Pattern 2. Prefer `this.glowFX.color = POSTFX.GLOW[this.type].upgraded;` over `preFX.clear() + addGlow()`.
- Upgrade path must also be guarded by `this.glowFX` existence (handles Canvas and wall cases where glowFX was never created).

**New upgrade code (add inside `upgrade()`, before `return true;`):**

```javascript
if (this.glowFX) {
  this.glowFX.color = POSTFX.GLOW[this.type].upgraded;
}
```

#### 4. Destroy cleanup (`src/entities/Turret.js:362-388`)

```javascript
destroy() {
  if (this.idleTween) {
    this.idleTween.destroy();
    this.idleTween = null;
  }
  if (this.hpTween) {
    this.hpTween.destroy();
    this.hpTween = null;
  }
  this.sprite.destroy();
  if (this.wallBody) {
    this.wallBody.destroy();
  }
  if (this.auraTween) {
    this.auraTween.destroy();
    this.auraTween = null;
  }
  if (this.auraRing) {
    this.auraRing.destroy();
    this.auraRing = null;
  }
  if (this.hpBarBg) this.hpBarBg.destroy();
  if (this.hpBarFill) this.hpBarFill.destroy();
  // ...
}
```

**Rules to copy:**
- Existence guard then `.destroy()` then null-out: `if (this.xxx) { this.xxx.destroy(); this.xxx = null; }` (see `idleTween`, `hpTween`, `auraTween`, `auraRing`).
- **Order matters:** tween/fx cleanup happens BEFORE `this.sprite.destroy()` (see lines 363-371: tweens destroyed before sprite at line 371). POSTFX glow teardown must follow this order: `this.sprite.preFX?.clear()` BEFORE `this.sprite.destroy()`.
- No null-out needed for the FX handle if the sprite is being destroyed — but optional chaining `this.sprite.preFX?.clear()` is defensive against Canvas (where preFX is null).

**New destroy code (before `this.sprite.destroy()` at line 371):**

```javascript
if (this.sprite && this.sprite.preFX) {
  this.sprite.preFX.clear();
}
```

---

### `src/scenes/GameScene.js` (scene, event-driven + shutdown-cleanup)

**Analog:** self — GameScene owns all the integration points (core sprite, camera, phase-changed emits, shutdown handler).

#### 1. Imports pattern (`src/scenes/GameScene.js:1-9`)

```javascript
import Phaser from 'phaser';
import { GRID, GAME, ECONOMY, DEBUG, VFX } from '../config/GameConfig.js';
// ...
```

**Rule to copy:** Add `POSTFX` to the existing destructured import: `import { GRID, GAME, ECONOMY, DEBUG, VFX, POSTFX } from '../config/GameConfig.js';`

#### 2. Renderer detection (inline, matching `DEBUG.enableDebugKeys` pattern) — `src/scenes/GameScene.js:77` + `src/config/GameConfig.js:117-119`

Existing inline-check reference (`src/scenes/GameScene.js:77`):

```javascript
if (DEBUG.enableDebugKeys) this.setupDebugKeys();
```

**Rule to copy:** Simple single-line `if` gate for renderer-specific work. Compute `const isWebGL = this.game.renderer.type === Phaser.WEBGL;` at the top of `create()`. No util module (per D-12).

#### 3. Core glow attach — `renderCore()` (`src/scenes/GameScene.js:111-124`)

```javascript
renderCore() {
  const pos = this.grid.getCoreWorldPos();
  this.coreSprite = this.add.sprite(pos.x, pos.y, 'core').setDisplaySize(GRID.tileSize, GRID.tileSize);
  const baseScale = this.coreSprite.scaleX;
  this.tweens.add({
    targets: this.coreSprite,
    scaleX: { from: baseScale, to: baseScale * 1.06 },
    scaleY: { from: baseScale, to: baseScale * 1.06 },
    duration: 1800,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
  });
}
```

**Rules to copy:**
- `this.coreSprite` is created at line 113 — attach point is IMMEDIATELY after this line (before the breathing tween per UI-SPEC "after the existing breathing tween is set up" — both orders are fine; research Example 5 shows after-tween which is also fine since tween targets sprite, not FX).
- Store the FX handle on `this._coreGlowFX` (underscore-prefixed, internal — matches `_sfxCooldowns` convention at GameScene.js:26).

**New attach code (add at the end of `renderCore()`):**

```javascript
const isWebGL = this.game.renderer.type === Phaser.WEBGL;
if (isWebGL) {
  const cfg = POSTFX.GLOW.core;
  this.coreSprite.preFX.setPadding(cfg.padding);
  this._coreGlowFX = this.coreSprite.preFX.addGlow(cfg.color, cfg.outerStrength, cfg.innerStrength);
}
```

#### 4. Vignette attach + phase-reactive tween — `create()` (`src/scenes/GameScene.js:25-100`)

Existing `phase-changed` emit sites (three):

```javascript
// line 156, startBuildPhase():
this.events.emit('phase-changed', { phase: 'build' });

// line 184, startWavePhase():
this.events.emit('phase-changed', { phase: 'wave' });

// line 201, onWaveComplete():
this.events.emit('phase-changed', { phase: 'build' });
```

Existing event-listen pattern (`src/scenes/GameScene.js:73-74`):

```javascript
this.events.on('bug-killed', this.onBugKilled, this);
this.events.on('start-wave-early', this.onStartWaveEarly, this);
```

Existing camera usage — `shakeCamera()` (`src/scenes/GameScene.js:329-334`):

```javascript
shakeCamera(tier) {
  if (this.phase === 'gameover') return;
  const cfg = VFX.SHAKE[tier];
  if (!cfg) return;
  this.cameras.main.shake(cfg.duration, cfg.intensity, true);
}
```

**Rules to copy:**
- `this.cameras.main` is the canonical camera reference (SHAKE-04 isolation — UIScene's camera is NEVER touched). Vignette attaches here.
- Event listen via `this.events.on('phase-changed', handler)`. Payload is `{ phase: 'build' | 'wave' }` — destructure `payload.phase`.
- Tween target property directly (research Pattern 3) — `targets: this._vignetteFX, strength: <value>` — the Vignette FX controller exposes mutable `strength`.

**New attach + listener code (add inside `create()`, after line 79 `this.scene.launch('UIScene');` but before `startBuildPhase()` at line 81):**

```javascript
const isWebGL = this.game.renderer.type === Phaser.WEBGL;
if (!isWebGL) {
  console.warn('[postfx] Canvas renderer detected — glow disabled');
} else {
  const v = POSTFX.VIGNETTE;
  this._vignetteFX = this.cameras.main.postFX.addVignette(v.x, v.y, v.radius, v.buildStrength);
}

this.events.on('phase-changed', (payload) => {
  if (!this._vignetteFX) return;
  if (this._vignetteTween) this._vignetteTween.destroy();
  const target = payload.phase === 'wave'
    ? POSTFX.VIGNETTE.waveStrength
    : POSTFX.VIGNETTE.buildStrength;
  this._vignetteTween = this.tweens.add({
    targets: this._vignetteFX,
    strength: target,
    duration: POSTFX.VIGNETTE.transitionDuration,
    ease: POSTFX.VIGNETTE.transitionEase,
  });
});
```

#### 5. Shutdown handler extension (`src/scenes/GameScene.js:92-99`)

```javascript
this.events.once('shutdown', () => {
  this.sound.stopByKey('bgm_wave');
  this.sound.stopByKey('sfx_victory');
  this.sound.stopByKey('sfx_core_destroyed');
  this.events.off('bug-killed', this.onBugKilled, this);
  this.events.off('start-wave-early', this.onStartWaveEarly, this);
  if (this.input.keyboard) this.input.keyboard.removeAllListeners();
});
```

**Rules to copy:**
- Single `this.events.once('shutdown', ...)` block registered at end of `create()`. Every scene-lifetime resource that isn't auto-destroyed gets cleaned up here.
- `this.events.off('phase-changed', ...)` MUST be added for the new listener (symmetry with lines 96-97).
- Tween cleanup: `this._vignetteTween?.destroy()` with optional-chaining guard (matches Turret.destroy() existence-check pattern). The existing shutdown handler has no tweens to clean up yet, so the new tween gets its own explicit destroy.
- Camera postFX clear: `this.cameras.main?.postFX?.clear()` — defensive chaining against camera teardown race.

**Extended shutdown code:**

```javascript
this.events.once('shutdown', () => {
  this.sound.stopByKey('bgm_wave');
  this.sound.stopByKey('sfx_victory');
  this.sound.stopByKey('sfx_core_destroyed');
  this.events.off('bug-killed', this.onBugKilled, this);
  this.events.off('start-wave-early', this.onStartWaveEarly, this);
  this.events.off('phase-changed');
  if (this.input.keyboard) this.input.keyboard.removeAllListeners();
  if (this._vignetteTween) { this._vignetteTween.destroy(); this._vignetteTween = null; }
  if (this.cameras.main && this.cameras.main.postFX) {
    this.cameras.main.postFX.clear();
  }
});
```

---

### `src/scenes/MainMenuScene.js` (scene, static-create)

**Analog:** self — existing `create()` is a single top-to-bottom procedural builder with no event wiring or shutdown handler.

#### Existing pattern (`src/scenes/MainMenuScene.js:1-57`)

```javascript
import Phaser from 'phaser';
import { GAME } from '../config/GameConfig.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const { canvasWidth: W, canvasHeight: H } = GAME;

    this.createStarfield(W, H);
    // ...
  }
}
```

**Rules to copy:**
- Named imports from `../config/GameConfig.js`. Add `POSTFX` to the destructure: `import { GAME, POSTFX } from '../config/GameConfig.js';`.
- No shutdown handler — scene teardown disposes the camera and its postFX controllers automatically (per UI-SPEC "Cleanup Patterns" table). Do NOT introduce one.
- No phase-changed listener — per D-14, only GameScene gets the reactive tween. This is a **static** vignette.

**New vignette attach code (add at the top of `create()`, right after the `const { canvasWidth: W, canvasHeight: H } = GAME;` line):**

```javascript
const isWebGL = this.game.renderer.type === Phaser.WEBGL;
if (!isWebGL) {
  console.warn('[postfx] Canvas renderer detected — vignette disabled');
} else {
  const v = POSTFX.VIGNETTE;
  this.cameras.main.postFX.addVignette(v.x, v.y, v.radius, v.buildStrength);
}
```

Note: no handle stored, no tween, no listener — consistent with static-create flow. `buildStrength` used per CONTEXT Claude's Discretion default.

---

### `src/scenes/GameOverScene.js` (scene, static-create)

**Analog:** self — existing `create()` mirrors MainMenuScene structure (no event wiring, no shutdown handler, no dynamic state).

#### Existing pattern (`src/scenes/GameOverScene.js:1-62`)

```javascript
import Phaser from 'phaser';
import { GAME } from '../config/GameConfig.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.result = data;
  }

  create() {
    const { won, wave, totalKills, credits, baseHp } = this.result;
    const { canvasWidth: W, canvasHeight: H } = GAME;

    const title = won ? 'VICTORY!' : 'DEFEAT';
    // ...
  }
}
```

**Rules to copy:** Identical to MainMenuScene — add `POSTFX` to the import, attach static vignette at the top of `create()` (after the existing `W`/`H` destructure).

**New vignette attach code (same as MainMenuScene, placed immediately after the `const { canvasWidth: W, canvasHeight: H } = GAME;` line):**

```javascript
const isWebGL = this.game.renderer.type === Phaser.WEBGL;
if (!isWebGL) {
  console.warn('[postfx] Canvas renderer detected — vignette disabled');
} else {
  const v = POSTFX.VIGNETTE;
  this.cameras.main.postFX.addVignette(v.x, v.y, v.radius, v.buildStrength);
}
```

---

## Shared Patterns

### Pattern A: Renderer-guard inline check

**Source:** `src/scenes/GameScene.js:77` (`if (DEBUG.enableDebugKeys) this.setupDebugKeys();`) + `src/config/GameConfig.js:117-119`
**Apply to:** All three scenes' `create()` AND `Turret` constructor/upgrade/destroy.

```javascript
const isWebGL = this.game.renderer.type === Phaser.WEBGL;
// Turret constructor uses: const isWebGL = scene.game.renderer.type === Phaser.WEBGL;
```

All six attach sites must branch on the SAME condition. No util module (per D-12). `console.warn('[postfx] Canvas renderer detected — ... disabled')` logged exactly once per scene-boot on Canvas (per D-10/D-11).

---

### Pattern B: Frozen config with numeric-hex colors

**Source:** `src/config/GameConfig.js:142-200` (entire VFX block — every color is a numeric `0x...` literal)
**Apply to:** New `POSTFX` export.

```javascript
// Correct (matches VFX convention):
blaster: Object.freeze({ base: 0xeef2ff, upgraded: 0xeef2ff, ... }),

// Wrong (THEME uses CSS strings — that's for text/Phaser.Graphics color strings only):
blaster: Object.freeze({ base: '#eef2ff', ... }),  // would need runtime conversion
```

Every nested object and array MUST be wrapped in its own `Object.freeze(...)`. Pattern is recursive throughout VFX.

---

### Pattern C: FX attaches to `this.sprite`, never to `this` (composite Turret)

**Source:** `src/entities/Turret.js:22` (sprite creation), `:35` (aura graphics attached to `scene.add.graphics()`, not `this`)
**Apply to:** All turret glow attach/mutate/clear calls.

```javascript
// Correct:
this.sprite.preFX.addGlow(...)
this.sprite.preFX.setPadding(n)
this.sprite.preFX?.clear()
this.glowFX.color = <new>

// Wrong (Turret is not a Phaser.GameObject):
this.preFX.addGlow(...)  // TypeError
```

Turret is a plain composite class (see absence of `extends Phaser.*` at `src/entities/Turret.js:4`). Only `this.sprite` and `this.wallBody` are Phaser GameObjects; everything else on `this` is plain data.

---

### Pattern D: Tween-safety (Phase 1 D-03) — destroy-on-shutdown and destroy-on-replace

**Source:** `src/entities/Turret.js:317-319` (upgrade replaces `idleTween` — destroy old before creating new); `src/entities/Turret.js:409` (`updateHpBar` replaces `hpTween`); `src/scenes/GameScene.js:92-99` (shutdown handler off's events)
**Apply to:** GameScene `_vignetteTween` lifecycle.

```javascript
// Replace pattern (inside phase-changed handler):
if (this._vignetteTween) this._vignetteTween.destroy();
this._vignetteTween = this.tweens.add({ /* new */ });

// Shutdown pattern (inside events.once('shutdown', ...)):
if (this._vignetteTween) { this._vignetteTween.destroy(); this._vignetteTween = null; }
```

Every persistent tween stored on `this._xxx` gets both a replace-guard (before creating a new one) and an explicit destroy on shutdown. Matches the `idleTween` / `auraTween` / `hpTween` / `hpTween` (HP bar) treatment in Turret.js.

---

### Pattern E: Event listener registration + symmetric cleanup

**Source:** `src/scenes/GameScene.js:73-74` (register in create) paired with `:96-97` (off in shutdown)
**Apply to:** New `phase-changed` vignette listener.

```javascript
// create():
this.events.on('phase-changed', handler);

// events.once('shutdown', ...):
this.events.off('phase-changed');
```

Every `this.events.on(...)` added must have a matching `.off(...)` inside the existing shutdown handler. Restart safety (Pitfall 4) depends on this.

---

### Pattern F: UIScene isolation (SHAKE-04 / Phase 4 D-10)

**Source:** `src/scenes/GameScene.js:333` (shake targets `this.cameras.main` — GameScene's camera, not UIScene's) — UIScene has its own camera via `this.scene.launch('UIScene')` at `:79`
**Apply to:** ALL vignette attach points — `this.cameras.main` only, never a reference into UIScene.

UIScene is NEVER modified in this phase. Plan verification step should grep the UIScene.js diff for zero lines changed.

---

## No Analog Found

None. Every file modified in this phase already exists and serves as its own analog (Phase 5 is purely additive/local patches — no novel file types introduced, no cross-cutting helper needed per D-12).

---

## Metadata

**Analog search scope:** `src/config/`, `src/entities/`, `src/scenes/`
**Files scanned:** 7 (`src/config/GameConfig.js`, `src/entities/Turret.js`, `src/scenes/GameScene.js`, `src/scenes/MainMenuScene.js`, `src/scenes/GameOverScene.js`, plus `src/scenes/BootScene.js` and `src/scenes/UIScene.js` listed for scope — not read since not modified)
**Pattern extraction date:** 2026-04-17
**Phaser version:** 3.90.0 (installed) — all preFX/postFX APIs referenced are available since 3.60.0.
