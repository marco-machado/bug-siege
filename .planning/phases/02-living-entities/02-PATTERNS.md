# Phase 2: Living Entities - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 4 (all modifications, no new files)
**Analogs found:** 4 / 4

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/config/GameConfig.js` | config | transform | Self — existing BUGS entries (lines 55-89) | exact |
| `src/entities/Bug.js` | entity | event-driven | Self — existing `preUpdate` and `spawn` (lines 20-49, 244-257) | exact |
| `src/entities/Turret.js` | entity | event-driven | Self — existing `updateHpBar` tween lifecycle (lines 325-332) | exact |
| `src/scenes/GameScene.js` | scene | event-driven | Self — existing `showBugDeathEffect` and `showWaveAnnouncement` tweens (lines 327-368) | exact |

All four files are self-analogs: the addition slots into existing patterns already established in each file. No external analog is needed.

---

## Pattern Assignments

### `src/config/GameConfig.js` — Add `anim` sub-object to each BUGS entry

**Analog:** Self, lines 55-89

**Existing nested freeze pattern** (`src/config/GameConfig.js:55-89`):
```javascript
export const BUGS = Object.freeze({
  swarmer: Object.freeze({
    speed: 60,
    hp: 30,
    coreDamage: 5,
    wallDamage: 10,
    reward: 10,
    size: 48,
  }),
  brute: Object.freeze({
    // ...
  }),
});
```

**Core pattern to apply** — add `anim` as a frozen sub-object inside each type's `Object.freeze({...})`:
```javascript
swarmer: Object.freeze({
  speed: 60,
  hp: 30,
  coreDamage: 5,
  wallDamage: 10,
  reward: 10,
  size: 48,
  anim: Object.freeze({ frequency: 0.012, amplitude: 0.12 }),
}),
brute: Object.freeze({
  speed: 30,
  hp: 150,
  coreDamage: 20,
  wallDamage: 40,
  reward: 25,
  size: 80,
  anim: Object.freeze({ frequency: 0.004, amplitude: 0.06 }),
}),
spitter: Object.freeze({
  speed: 35,
  hp: 60,
  damage: 20,
  reward: 15,
  size: 56,
  attackRange: 192,
  attackRate: 1.0,
  anim: Object.freeze({ frequency: 0.007, amplitude: 0.09 }),
}),
boss: Object.freeze({
  speed: 15,
  hp: 1500,
  coreDamage: 40,
  wallDamage: 50,
  reward: 100,
  size: 96,
  anim: Object.freeze({ frequency: 0.002, amplitude: 0.04 }),
}),
```

**Convention:** UPPER_CASE constant name, `Object.freeze()` at every nesting level, no comments.

---

### `src/entities/Bug.js` — Add sin-wave squash-stretch in `preUpdate`; reset base scale in `spawn`

**Analog:** Self, existing `spawn` (lines 20-49) and `preUpdate` (lines 244-257)

**Existing `spawn` reset pattern** (`src/entities/Bug.js:39-41`):
```javascript
this.setTexture(`bug-${type}`);
this.setDisplaySize(conf.size, conf.size);
this.setPosition(x, y);
```

**Fields to add after `setDisplaySize` in `spawn`** — store base scale and random phase, then reset:
```javascript
this.setDisplaySize(conf.size, conf.size);
this._baseScale = this.scaleX;
this._animPhase = Math.random() * Math.PI * 2;
this.scaleX = this._baseScale;
this.scaleY = this._baseScale;
```

`_baseScale` must be read **after** `setDisplaySize` because `setDisplaySize` internally recalculates `scaleX`/`scaleY` from texture dimensions. Writing `scaleX` directly afterwards is safe; writing `setDisplaySize` afterwards would overwrite it.

**Existing `preUpdate` guard pattern** (`src/entities/Bug.js:244-246`):
```javascript
preUpdate(time, delta) {
  super.preUpdate(time, delta);
  if (!this.active) return;
```

**Sin-wave block to insert after the guard, before the steering dispatch**:
```javascript
const anim = BUGS[this.bugType].anim;
const wobble = 1 + anim.amplitude * Math.sin(time * anim.frequency + this._animPhase);
this.scaleX = this._baseScale * wobble;
this.scaleY = this._baseScale / wobble;
```

`scaleY = baseScale / wobble` implements squash-stretch: volume is conserved by inverting the perpendicular axis. When `scaleX` grows, `scaleY` shrinks by the same factor.

**Existing guard that confirms sin-wave approach** (`src/entities/Bug.js:171`):
```javascript
despawn() {
  this.scene.tweens.killTweensOf(this);
```
`killTweensOf(this)` in `despawn` is a safety net for any future tweens added to the Bug sprite. The sin-wave approach adds no tweens to bugs, so this cleanup remains correct and sufficient.

**Import to verify** (`src/entities/Bug.js:2`): `BUGS` is already imported from `../config/GameConfig.js` — no import changes needed.

---

### `src/entities/Turret.js` — Start/stop idle alpha tween in constructor and destroy; change amplitude on upgrade

**Analog:** Self, `updateHpBar` tween lifecycle (lines 325-332) and `upgrade` (lines 242-263)

**Existing tween lifecycle pattern** (`src/entities/Turret.js:325-332`):
```javascript
if (this.hpTween) this.hpTween.destroy();
this.hpTween = this.scene.tweens.add({
  targets: this.hpBarFill,
  displayWidth: targetWidth,
  duration: 200,
  ease: 'Power2',
});
```
This is the project's established pattern for: store reference on `this`, destroy old before creating new, use `this.scene.tweens.add()`.

**Idle tween to add in constructor** — insert after `this.hpBarFill = ...` (end of constructor, line 41), before the closing brace:
```javascript
this.idleTween = null;
if (type !== 'wall') {
  this.idleTween = scene.tweens.add({
    targets: this.sprite,
    alpha: { from: 0.75, to: 1.0 },
    duration: 1200,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
  });
}
```

Walls have no idle animation — they have no range indicator or "active" state to pulse.

**Existing `upgrade` pattern** (`src/entities/Turret.js:242-263`):
```javascript
upgrade() {
  if (this.upgraded) return false;
  this.upgraded = true;
  // ...
  this.sprite.setTint(0xffdd44);
  return true;
}
```

**Tween replacement to add in `upgrade()`** — insert before `this.sprite.setTint(0xffdd44)`:
```javascript
if (this.idleTween) {
  this.idleTween.destroy();
  this.idleTween = this.scene.tweens.add({
    targets: this.sprite,
    alpha: { from: 0.65, to: 1.0 },
    duration: 900,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
  });
}
```

`idleTween.destroy()` (not `.stop()`) matches the `hpTween` pattern already in the file. Destroying before recreating prevents two simultaneous tweens on the same sprite.

**Existing `destroy` pattern** (`src/entities/Turret.js:291-304`):
```javascript
destroy() {
  this.sprite.destroy();
  if (this.wallBody) {
    this.wallBody.destroy();
  }
  // ...
}
```

**Tween cleanup to add in `destroy()`** — insert before `this.sprite.destroy()`:
```javascript
if (this.idleTween) {
  this.idleTween.destroy();
  this.idleTween = null;
}
```

Must come before `this.sprite.destroy()` because the tween targets `this.sprite`. Destroying the tween first prevents Phaser from trying to update a destroyed game object on the next frame.

**Non-conflict: `flashDamage` and alpha tween** — `flashDamage` (lines 265-276) uses `setTintFill` / `setTint` / `clearTint`, which are entirely orthogonal to the `alpha` property. The idle tween running continuously on `alpha` does not interfere with tint operations. No coordination needed.

---

### `src/scenes/GameScene.js` — Start core breathing tween after `renderCore()`

**Analog:** Self, existing `showWaveAnnouncement` (lines 351-368) and `showBugDeathEffect` (lines 321-339)

**Existing infinite tween with `yoyo` in codebase** (`src/scenes/GameScene.js:357-368`):
```javascript
this.tweens.add({
  targets: text,
  alpha: 1,
  y: text.y - 20,
  duration: 400,
  ease: 'Power2',
  yoyo: true,
  hold: 600,
  onComplete: () => text.destroy(),
});
```

This confirms `this.tweens.add({ yoyo: true })` is the established pattern. The breathing tween uses `repeat: -1` (infinite) instead of `onComplete`.

**Existing `renderCore()` method** (`src/scenes/GameScene.js:111-114`):
```javascript
renderCore() {
  const pos = this.grid.getCoreWorldPos();
  this.coreSprite = this.add.sprite(pos.x, pos.y, 'core').setDisplaySize(GRID.tileSize, GRID.tileSize);
}
```

**Breathing tween to add immediately after `this.coreSprite = ...` assignment in `renderCore()`**:
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

`baseScale` must be read after `setDisplaySize` because `setDisplaySize` internally sets `scaleX`/`scaleY` relative to the texture's native dimensions. Tweening to absolute `1.06` would be wrong if the texture size differs from `tileSize`. Reading `scaleX` after the call gives the correct computed base.

**Tint interaction — confirmed safe** (`src/scenes/GameScene.js:262-268`): `damageCore` calls `setTintFill(0xff4444)` then `clearTint()` on `coreSprite`. This operates on the `tint` property, which is fully orthogonal to `scaleX`/`scaleY`. The breathing tween is unaffected by damage tint.

---

## Shared Patterns

### Tween Lifecycle (store → destroy old → create new)
**Source:** `src/entities/Turret.js:325-332` (`updateHpBar`)
**Apply to:** `Turret.js` constructor (create), `Turret.upgrade()` (replace), `Turret.destroy()` (cleanup)
```javascript
if (this.hpTween) this.hpTween.destroy();
this.hpTween = this.scene.tweens.add({
  targets: this.hpBarFill,
  displayWidth: targetWidth,
  duration: 200,
  ease: 'Power2',
});
```
Pattern: null-check before destroy, assign result of `tweens.add` to `this.fieldName`.

### Infinite Yoyo Tween Structure
**Source:** `src/scenes/GameScene.js:357-368` (`showWaveAnnouncement`) — only non-infinite example; adds `repeat: -1` for persistent animations
**Apply to:** `GameScene.renderCore()` core breathing, `Turret` constructor idle glow
```javascript
this.tweens.add({
  targets: target,
  property: { from: startVal, to: endVal },
  duration: N,
  ease: 'Sine.easeInOut',
  yoyo: true,
  repeat: -1,
});
```

### Object.freeze Nesting for Config Sub-objects
**Source:** `src/config/GameConfig.js:1-15` (GRID with nested starterTurrets)
**Apply to:** `anim` sub-objects in all BUGS entries
```javascript
export const GRID = Object.freeze({
  // ...
  starterTurrets: Object.freeze([
    Object.freeze({ col: 0, row: 0, type: 'blaster' }),
  ]),
});
```
Pattern: every level of nesting gets its own `Object.freeze()` call.

### preUpdate Guard Pattern
**Source:** `src/entities/Bug.js:244-246`
**Apply to:** Any logic added to `Bug.preUpdate` — sin-wave block must come after this guard
```javascript
preUpdate(time, delta) {
  super.preUpdate(time, delta);
  if (!this.active) return;
  // safe to act on active bug here
```

---

## No Analog Found

None. All four modifications have direct self-analogs in the files being edited.

---

## Metadata

**Analog search scope:** `src/config/`, `src/entities/`, `src/scenes/`
**Files scanned:** 4 source files read in full
**Pattern extraction date:** 2026-04-16
