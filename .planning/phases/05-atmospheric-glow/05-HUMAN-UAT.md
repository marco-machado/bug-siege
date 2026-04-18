---
status: partial
phase: 05-atmospheric-glow
source: [05-VERIFICATION.md]
started: 2026-04-17T00:00:00Z
updated: 2026-04-17T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Turrets + core glow softly on WebGL
expected: Blaster/core show ghostly white halo (0xeef2ff); zapper shows light violet halo (0x9966ff); slowfield shows deep nebula purple halo (0x6a4c93); wall shows NO halo. Bugs, bullets, particles show NO halo.
result: [pending]

### 2. Upgrade swap changes glow color
expected: Halo color shifts from base to accent white (0xeef2ff) after purchasing an upgrade on any glowing turret. Existing 0xffdd44 tint + alpha pulse still works.
result: [pending]

### 3. Canvas-runtime graceful degradation
expected: After flipping src/main.js from Phaser.AUTO to Phaser.CANVAS and reloading — exactly one '[postfx] Canvas renderer detected — glow disabled' warning from GameScene and '[postfx] Canvas renderer detected — vignette disabled' from each boundary scene. Game remains fully playable. No glow halos, no vignette, no errors. Revert main.js after.
result: [pending]

### 4. Vignette subtly frames all non-UI scenes
expected: MainMenu, GameScene (build + wave), and GameOver each show a subtle darkening at screen edges. Corners are visibly dimmer than center. Effect should feel atmospheric, not heavy.
result: [pending]

### 5. Phase-reactive vignette tween (GameScene only)
expected: Watching a full build→wave→build cycle — vignette strength tweens smoothly over ~600ms with Sine.easeInOut. Wave phase frames slightly stronger (0.40) than build phase (0.25).
result: [pending]

### 6. UIScene unaffected (D-14 isolation)
expected: During wave phase, HUD text (credits, HP bar, wave number) remains sharp and unvignetted. No darkening around HUD text.
result: [pending]

### 7. 60fps under load
expected: Wave 10 with all bugs active including boss sustains ≥55fps (ideal 60). No dropped frames attributable to FX. Measured via Chrome DevTools Performance tab recording for 10 seconds.
result: [pending]

### 8. No FX leak across scene restarts
expected: In console during a GameScene run, `game.scene.getScene('Game').cameras.main.postFX.list.length` reads 1. After cycling Game→GameOver→MainMenu→Game three times, the fresh GameScene's `.list.length` remains 1 (not growing per cycle).
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
