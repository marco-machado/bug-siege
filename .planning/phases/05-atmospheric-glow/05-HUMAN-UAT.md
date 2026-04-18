---
status: complete
phase: 05-atmospheric-glow
source: [05-VERIFICATION.md]
started: 2026-04-17T00:00:00Z
updated: 2026-04-17T23:12:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Turrets + core glow softly on WebGL
expected: Blaster/core show ghostly white halo (0xeef2ff); zapper shows light violet halo (0x9966ff); slowfield shows deep nebula purple halo (0x6a4c93); wall shows NO halo. Bugs, bullets, particles show NO halo.
result: issue
reported: "all halos work but they SUCK! I want them gone!"
severity: major

### 2. Upgrade swap changes glow color
expected: Halo color shifts from base to accent white (0xeef2ff) after purchasing an upgrade on any glowing turret. Existing 0xffdd44 tint + alpha pulse still works.
result: skipped
reason: User skipped — feature cascades from Test 1 rejection (halos slated for removal).

### 3. Canvas-runtime graceful degradation
expected: After flipping src/main.js from Phaser.AUTO to Phaser.CANVAS and reloading — exactly one '[postfx] Canvas renderer detected — glow disabled' warning from GameScene and '[postfx] Canvas renderer detected — vignette disabled' from each boundary scene. Game remains fully playable. No glow halos, no vignette, no errors. Revert main.js after.
result: pass

### 4. Vignette subtly frames all non-UI scenes
expected: MainMenu, GameScene (build + wave), and GameOver each show a subtle darkening at screen edges. Corners are visibly dimmer than center. Effect should feel atmospheric, not heavy.
result: pass

### 5. Phase-reactive vignette tween (GameScene only)
expected: Watching a full build→wave→build cycle — vignette strength tweens smoothly over ~600ms with Sine.easeInOut. Wave phase frames slightly stronger (0.40) than build phase (0.25).
result: issue
reported: "0.40 is too strong, change to 0.30"
severity: cosmetic
fix_applied: "src/config/GameConfig.js — POSTFX.VIGNETTE.waveStrength: 0.40 → 0.30 (HMR will reload)"

### 6. UIScene unaffected (D-14 isolation)
expected: During wave phase, HUD text (credits, HP bar, wave number) remains sharp and unvignetted. No darkening around HUD text.
result: pass

### 7. 60fps under load
expected: Wave 10 with all bugs active including boss sustains ≥55fps (ideal 60). No dropped frames attributable to FX. Measured via Chrome DevTools Performance tab recording for 10 seconds.
result: pass

### 8. No FX leak across scene restarts
expected: In console during a GameScene run, `game.scene.getScene('Game').cameras.main.postFX.list.length` reads 1. After cycling Game→GameOver→MainMenu→Game three times, the fresh GameScene's `.list.length` remains 1 (not growing per cycle).
result: pass

## Summary

total: 8
passed: 5
issues: 2
pending: 0
skipped: 1
blocked: 0

## Gaps

- truth: "Turrets + core glow softly on WebGL with THEME palette halos"
  status: failed
  reason: "User reported: all halos work but they SUCK! I want them gone!"
  severity: major
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Wave-phase vignette strength of 0.40 frames the play area at the right intensity"
  status: failed
  reason: "User reported: 0.40 is too strong, change to 0.30"
  severity: cosmetic
  test: 5
  root_cause: "Tuning value preference — POSTFX.VIGNETTE.waveStrength was set too high"
  artifacts:
    - path: "src/config/GameConfig.js"
      issue: "POSTFX.VIGNETTE.waveStrength was 0.40, user prefers 0.30"
  missing: []
  debug_session: ""
  fix_applied: "Inline edit during UAT — POSTFX.VIGNETTE.waveStrength: 0.40 → 0.30"
