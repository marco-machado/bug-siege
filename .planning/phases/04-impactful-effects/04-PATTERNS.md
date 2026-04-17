# Phase 4: Impactful Effects - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 5 modified files
**Analogs found:** 5 / 5

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/config/GameConfig.js` | config | N/A | Self (VFX block, lines 142-172) | exact |
| `src/scenes/BootScene.js` | config | N/A | Self (`generateParticleTextures()`, lines 113-119) | exact |
| `src/entities/Turret.js` (slowfield aura) | entity | event-driven (persistent emitter + timer) | `src/entities/Turret.js` constructor lines 30-33 + `showMuzzleFlash()` lines 241-255 | role-match |
| `src/entities/Turret.js` (lightning trail) | entity | request-response (one-shot per fire) | `src/entities/Turret.js` `drawLightningChain()` lines 181-194 | exact |
| `src/entities/Turret.js` (destroy cleanup + SHAKE-02) | entity | event-driven | `src/entities/Turret.js` `destroy()` lines 317-334 | exact |
| `src/entities/Turret.js` (upgrade emitter recalc) | entity | event-driven | `src/entities/Turret.js` `upgrade()` lines 257-289 | exact |
| `src/entities/Bug.js` (SHAKE-03 boss micro-shake) | entity | event-driven (throttled) | `src/scenes/GameScene.js` `playSfx()` lines 325-334 | role-match |
| `src/scenes/GameScene.js` (SHAKE-01 core damage + shake helper) | scene | event-driven | `src/scenes/GameScene.js` `showCoreShockwave()` lines 368-393 | exact |

## Pattern Assignments

### `src/config/GameConfig.js` -- VFX config extension (config)

**Analog:** Self -- existing `VFX` frozen object (lines 142-172)

**Frozen config pattern** (lines 142-172):
```javascript
export const VFX = Object.freeze({
  DEATH: Object.freeze({
    swarmer: Object.freeze({ tint: 0x44ff44, count: 10, speed: { min: 80, max: 150 }, lifespan: 350, scale: { start: 0.8, end: 0.3 } }),
    brute:   Object.freeze({ tint: 0xff4444, count: 10, speed: { min: 80, max: 150 }, lifespan: 350, scale: { start: 0.8, end: 0.3 } }),
    spitter: Object.freeze({ tint: 0xff8844, count: 10, speed: { min: 80, max: 150 }, lifespan: 350, scale: { start: 0.8, end: 0.3 } }),
    boss:    Object.freeze({ color: [0x44ff44, 0xff4444, 0xff8844, 0x9900ff], count: 30, speed: { min: 100, max: 200 }, lifespan: 600, scale: { start: 2.0, end: 0.5 } }),
  }),
  MUZZLE: Object.freeze({
    count: 5,
    lifespan: 80,
    scale: { start: 1.0, end: 0.3 },
    tint: 0xffffaa,
    speed: { min: 60, max: 120 },
    angleSpread: 30,
  }),
  BUILD: Object.freeze({
    count: 12,
    lifespan: 400,
    tints: [0x9966ff, 0xeef2ff],
    speed: { min: 20, max: 60 },
    scale: { start: 0.8, end: 0.1 },
    gravityY: -40,
  }),
  SHOCKWAVE: Object.freeze({
    startRadius: 30,
    endRadius: 120,
    duration: 400,
    color: 0x9966ff,
    lineWidth: 3,
  }),
});
```

**What to add:** Three new frozen sub-objects: `SLOWFIELD`, `ZAPPER_TRAIL`, `SHAKE`. Follow identical `Object.freeze()` nesting. See RESEARCH.md "Config Extension for VFX" for exact key/value structure.

---

### `src/scenes/BootScene.js` -- particle-glow texture generation (config)

**Analog:** Self -- `generateParticleTextures()` (lines 113-119)

**Texture generation pattern** (lines 113-119):
```javascript
generateParticleTextures() {
  const g = this.make.graphics({ add: false });
  g.fillStyle(0xffffff, 1);
  g.fillCircle(2, 2, 2);
  g.generateTexture('particle', 4, 4);
  g.destroy();
}
```

**What to add:** Before `g.destroy()`, clear graphics (`g.clear()`), then draw the soft-glow particle (layered circles with different alphas) and call `g.generateTexture('particle-glow', 8, 8)`. The `g.clear()` between textures and `g.destroy()` at end follow the existing pattern exactly.

---

### `src/entities/Turret.js` -- Slowfield Particle Aura (entity, persistent emitter)

**Analog:** Self -- constructor slowfield init (lines 30-33) + `showMuzzleFlash()` (lines 241-255)

**Current slowfield init in constructor** (lines 30-33):
```javascript
if (type === 'slowfield') {
  this.auraGraphics = scene.add.graphics();
  this.drawAura();
}
```

**One-shot emitter pattern from `showMuzzleFlash()`** (lines 241-255):
```javascript
showMuzzleFlash() {
  const tip = this.getTipPosition();
  const cfg = VFX.MUZZLE;
  const angleDeg = Phaser.Math.RadToDeg(this.sprite.rotation - Math.PI / 2);

  const emitter = this.scene.add.particles(tip.x, tip.y, 'particle', {
    speed: cfg.speed,
    lifespan: cfg.lifespan,
    scale: cfg.scale,
    tint: cfg.tint,
    angle: { min: angleDeg - cfg.angleSpread, max: angleDeg + cfg.angleSpread },
    maxParticles: cfg.count,
  });
  emitter.on('complete', () => emitter.destroy());
}
```

**What to change:** Replace `this.auraGraphics` creation with `this.auraEmitter` (persistent particle emitter with `emitting: false`) and `this.pulseTimer` (scene.time.addEvent with `loop: true` calling `emitter.explode()`). The emitter uses `scene.add.particles(worldX, worldY, 'particle', config)` -- same API as `showMuzzleFlash()` but with `emitting: false` and `radial: true` instead of `maxParticles`. Also remove the `drawAura()` method (lines 232-239) since it is fully replaced by the particle emitter.

**Key difference from existing one-shot pattern:** The emitter persists (no `maxParticles`, no `'complete'` event). Cleanup happens in `destroy()`, not via auto-complete.

---

### `src/entities/Turret.js` -- Lightning Trail Enhancement (entity, one-shot per fire)

**Analog:** Self -- `drawLightningChain()` (lines 181-194)

**Current implementation** (lines 181-194):
```javascript
drawLightningChain(targets) {
  const g = this.scene.add.graphics();
  g.lineStyle(2, 0xaa44ff, 1);

  const tip = this.getTipPosition();
  g.beginPath();
  g.moveTo(tip.x, tip.y);
  for (const t of targets) {
    g.lineTo(t.x, t.y);
  }
  g.strokePath();

  this.scene.time.delayedCall(200, () => g.destroy());
}
```

**What to change:** Replace the single `g.lineStyle(2, ...)` + single stroke with two strokes: wide translucent outer glow, then narrow bright inner core. Keep the same `beginPath/moveTo/lineTo/strokePath` loop structure for both strokes. After drawing, call a new `spawnTrailParticles(tip, targets)` method. Keep the `time.delayedCall(duration, () => g.destroy())` cleanup pattern.

**Trail particles pattern:** Create a new emitter with `emitting: false`, loop through interpolated points along each chain segment, call `emitter.emitParticleAt(x, y, 1)` at each point. Cleanup via `scene.time.delayedCall(lifespan + 50, () => emitter.destroy())` -- NOT via `emitter.on('complete', ...)` because the `'complete'` event may not fire on an emitter that was never formally started (only manually emitted particles). This matches the existing Graphics cleanup approach in `drawLightningChain()`.

---

### `src/entities/Turret.js` -- Upgrade Emitter Recalculation (entity, event-driven)

**Analog:** Self -- `upgrade()` (lines 257-289, specifically 265-268)

**Current upgrade slowfield handling** (lines 265-268):
```javascript
if (this.type === 'slowfield' && conf.upgradedRange) {
  this.range = conf.upgradedRange;
  this.drawAura();
}
```

**What to change:** After setting `this.range`, recalculate the emitter's particle speed to match the new range (formula: `newRange / (lifespan / 1000)`). Also swap the emitter's tint array to upgraded tints for visual distinction per D-03. The `this.drawAura()` call is removed (the method no longer exists).

---

### `src/entities/Turret.js` -- Destroy Cleanup + SHAKE-02 (entity, event-driven)

**Analog:** Self -- `destroy()` (lines 317-334)

**Current destroy** (lines 317-334):
```javascript
destroy() {
  if (this.idleTween) {
    this.idleTween.destroy();
    this.idleTween = null;
  }
  this.sprite.destroy();
  if (this.wallBody) {
    this.wallBody.destroy();
  }
  if (this.auraGraphics) {
    this.auraGraphics.destroy();
  }
  if (this.hpBarBg) this.hpBarBg.destroy();
  if (this.hpBarFill) this.hpBarFill.destroy();
  this.scene.grid.setCell(this.gridCol, this.gridRow, 'empty');
  const idx = this.scene.turrets.indexOf(this);
  if (idx !== -1) this.scene.turrets.splice(idx, 1);
}
```

**What to change:** Replace `this.auraGraphics.destroy()` block with emitter + timer cleanup:
- `if (this.auraEmitter) { this.auraEmitter.destroy(); this.auraEmitter = null; }`
- `if (this.pulseTimer) { this.pulseTimer.remove(); this.pulseTimer = null; }`

Add SHAKE-02 trigger before cleanup: `this.scene.shakeCamera('medium')`. Guard with `this.scene.phase !== 'gameover'`.

---

### `src/entities/Bug.js` -- Boss Micro-Shake SHAKE-03 (entity, throttled event)

**Analog:** `src/scenes/GameScene.js` `playSfx()` cooldown pattern (lines 325-334)

**Import change required:** Current import (line 2) is `import { BUGS, STEERING, TURRETS } from '../config/GameConfig.js'`. Must add `VFX` to the import: `import { BUGS, STEERING, TURRETS, VFX } from '../config/GameConfig.js'`.

**Cooldown throttle pattern from `playSfx()`** (lines 325-334):
```javascript
playSfx(key, config) {
  const now = this.time.now;
  const cooldown = { sfx_shoot: 80, sfx_splat: 50, sfx_hit: 100, sfx_zap: 100 }[key] || 0;
  if (cooldown > 0) {
    const last = this._sfxCooldowns[key] || 0;
    if (now - last < cooldown) return;
    this._sfxCooldowns[key] = now;
  }
  this.sound.play(key, config);
}
```

**Current `takeDamage()`** (lines 150-162):
```javascript
takeDamage(amount) {
  this.hp -= amount;
  this.setAlpha(0.6);
  this.scene.time.delayedCall(80, () => {
    if (this.active) this.setAlpha(1);
  });

  if (this.hp <= 0) {
    this.die();
    return true;
  }
  return false;
}
```

**What to add:** After the alpha flash and before the death check, add boss micro-shake using the same `now - last < cooldown` throttle pattern from `playSfx()`. Use `this.scene.shakeCamera('light')` since `this.scene` is GameScene (which owns the helper). This keeps all shake calls going through the same gameover-guarded helper.
```javascript
if (this.bugType === 'boss') {
  const now = this.scene.time.now;
  if (now - this._lastBossShake >= VFX.SHAKE.bossMicroCooldown) {
    this._lastBossShake = now;
    this.scene.shakeCamera('light');
  }
}
```

**Also required:** Initialize `this._lastBossShake = 0` in `Bug.spawn()` (line 20-53 block). This follows the same pattern as `this._sfxCooldowns = {}` initialization in `GameScene.create()` (line 26).

---

### `src/scenes/GameScene.js` -- SHAKE-01 Core Damage + Shake Helper (scene, event-driven)

**Analog:** Self -- `showCoreShockwave()` (lines 368-393) and `damageCore()` (lines 265-291)

**Current `damageCore()` integration point** (lines 265-291):
```javascript
damageCore(amount) {
  this.baseHp -= amount;
  if (this.baseHp < 0) this.baseHp = 0;

  this.events.emit('hp-changed', { hp: this.baseHp, maxHp: GAME.baseHp });
  this.playSfx('sfx_hit');

  if (this.coreSprite && this.coreSprite.active) {
    this.coreSprite.setTintFill(0xff4444);
    this.time.delayedCall(100, () => {
      if (this.coreSprite && this.coreSprite.active) {
        this.coreSprite.clearTint();
      }
    });
  }

  const coreCenter = this.coreSprite
    ? { x: this.coreSprite.x, y: this.coreSprite.y }
    : { x: GAME.canvasWidth / 2, y: GAME.canvasHeight / 2 };
  this.showCoreShockwave(coreCenter.x, coreCenter.y, amount);

  if (this.baseHp <= 0) {
    this.gameOver(false);
    return true;
  }
  return false;
}
```

**What to add:** After `this.showCoreShockwave(...)`, add a shake call using tiered intensity based on damage amount. Add a `shakeCamera(tier)` helper method that guards against gameover state and delegates to `this.cameras.main.shake(cfg.duration, cfg.intensity, true)`. The `force: true` parameter implements D-08 "latest wins" natively.

**Shake helper pattern** (new method on GameScene):
```javascript
shakeCamera(tier) {
  if (this.phase === 'gameover') return;
  const cfg = VFX.SHAKE[tier];
  if (!cfg) return;
  this.cameras.main.shake(cfg.duration, cfg.intensity, true);
}
```

All three shake triggers use this helper:
- **SHAKE-01:** `this.shakeCamera(tier)` in `damageCore()` where tier is selected by damage amount
- **SHAKE-02:** `this.scene.shakeCamera('medium')` in `Turret.destroy()`
- **SHAKE-03:** `this.scene.shakeCamera('light')` in `Bug.takeDamage()` (boss only, throttled)

---

## Shared Patterns

### Frozen Config Structure
**Source:** `src/config/GameConfig.js` lines 142-172
**Apply to:** All new VFX config (SLOWFIELD, ZAPPER_TRAIL, SHAKE)
```javascript
export const VFX = Object.freeze({
  // Each sub-object deeply frozen:
  MUZZLE: Object.freeze({
    count: 5,
    lifespan: 80,
    scale: { start: 1.0, end: 0.3 },
    tint: 0xffffaa,
    speed: { min: 60, max: 120 },
    angleSpread: 30,
  }),
  // ...
});
```

### One-Shot Emitter Lifecycle
**Source:** `src/entities/Turret.js` `showMuzzleFlash()` lines 241-255 and `src/scenes/GameScene.js` `showBugDeathEffect()` lines 336-352
**Apply to:** Zapper trail particles (with modification noted below)
```javascript
const emitter = this.scene.add.particles(x, y, 'particle', {
  speed: cfg.speed,
  lifespan: cfg.lifespan,
  scale: cfg.scale,
  tint: cfg.tint,
  maxParticles: cfg.count,
});
emitter.on('complete', () => emitter.destroy());
```

**IMPORTANT DISTINCTION:** The `emitter.on('complete', ...)` cleanup works for emitters that auto-start with `maxParticles`. It does NOT work for emitters with `emitting: false` that only use manual `emitParticleAt()` calls -- the `'complete'` event may never fire. The zapper trail emitter MUST use `scene.time.delayedCall(lifespan + 50, () => emitter.destroy())` instead. This matches the existing Graphics cleanup in `drawLightningChain()` (line 193).

### Cooldown Throttle
**Source:** `src/scenes/GameScene.js` `playSfx()` lines 325-334
**Apply to:** Boss micro-shake in `Bug.takeDamage()` (SHAKE-03)
```javascript
const now = this.time.now;
const cooldown = { sfx_shoot: 80, sfx_splat: 50, sfx_hit: 100, sfx_zap: 100 }[key] || 0;
if (cooldown > 0) {
  const last = this._sfxCooldowns[key] || 0;
  if (now - last < cooldown) return;
  this._sfxCooldowns[key] = now;
}
```

### Gameover Guard
**Source:** `src/scenes/GameScene.js` lines 189, 294, 296, 309
**Apply to:** All shake triggers (centralized in `shakeCamera()` helper -- all callers are automatically guarded)
```javascript
if (this.phase === 'gameover') return;
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| -- | -- | -- | All modifications have close analogs in the existing codebase |

Every modification site has a direct analog or self-analog within the project. No external patterns needed.

## Metadata

**Analog search scope:** `src/` directory tree
**Files scanned:** 9 source files (all files in src/)
**Pattern extraction date:** 2026-04-16
