# Phase 5: Atmospheric Glow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 05-atmospheric-glow
**Mode:** power (file-based bulk Q&A)
**Areas discussed:** Glow / Bloom Technique (THEME-04), Vignette Framing (THEME-05), Renderer Detection & Canvas Fallback, Config & Scope
**Questions:** 14 / 14 answered

---

## Glow / Bloom Technique (THEME-04)

### Q-01 — Glow rendering technique

| Option | Description | Selected |
|--------|-------------|----------|
| a. Per-sprite preFX.addGlow on turrets and core only | Targeted, cheaper per-frame, predictable, doesn't double-glow particles. | ✓ |
| b. Camera-level postFX.addBloom on the GameScene camera | One call blooms everything bright; cinematic but harder to tune; amplifies VFX. | |
| c. Hybrid — per-sprite glow PLUS subtle camera bloom | Two passes; max juice; most expensive. | |
| d. Custom shader pipeline | Most control, most work; overkill for polish. | |

**User's choice:** a — Per-sprite preFX.addGlow on turrets and core only

---

### Q-02 — Which entities receive glow

| Option | Description | Selected |
|--------|-------------|----------|
| a. Turrets and core only — strict scope | Exactly what THEME-04 specifies; cleanest perf; "defenders glow, threats don't." | ✓ |
| b. Turrets, core, and boss bug | Boss as menacing climactic glow. | |
| c. Turrets, core, boss, AND spitter bullets | Reinforces incoming-danger reading; ~20 bullet cost. | |
| d. Turrets and core only, BUT walls glow when upgraded | Subtle upgrade reward signal on walls. | |

**User's choice:** a — Turrets and core only — strict scope

---

### Q-03 — Glow color policy

| Option | Description | Selected |
|--------|-------------|----------|
| a. Uniform THEME accent (ghostly white 0xeef2ff) for all | Cohesive ethereal feel. | |
| b. Per-turret-type accent tints (warm/violet/cool) | Recognizable signature; risks breaking palette. | |
| c. Uniform nebula purple, accent white for core only | Turrets blend, core stands out. | |
| d. Per-turret with strict THEME constraint (only nebula colors) | Differentiation within Void Ethereal palette. | ✓ |

**User's choice:** d — Per-turret with strict THEME constraint (only nebula colors, no warm/cool extras)

---

### Q-04 — Upgraded turret glow variant

| Option | Description | Selected |
|--------|-------------|----------|
| a. Same color, higher outer strength on upgraded | Subtle, consistent with alpha-pulse pattern. | |
| b. Different glow color on upgraded | Color shift makes upgrades unmistakable; consistent with Phase 4 D-03. | ✓ |
| c. Identical glow on base and upgraded | Glow stays purely atmospheric. | |

**User's choice:** b — Different glow color on upgraded (accent white vs base nebula purple)

---

### Q-05 — Glow behavior — static vs reactive

| Option | Description | Selected |
|--------|-------------|----------|
| a. Constant ambient glow — set once, never tweened | Cleanest; pairs with Phase 2 idle pulse; lowest cost. | ✓ |
| b. Glow tied to existing idle pulse | Reuse Phase 2 idleTween; extends "breathing." | |
| c. Glow flares on fire/damage events | Maximum juice; risks noise. | |
| d. Core glow tied to breathing tween, turret glow constant | Spotlight on the core. | |

**User's choice:** a — Constant ambient glow — set once, never tweened

---

## Vignette Framing (THEME-05)

### Q-06 — Vignette implementation technique

| Option | Description | Selected |
|--------|-------------|----------|
| a. Phaser camera postFX.addVignette | Standard 3.80+ FX; WebGL only; tweenable. | ✓ |
| b. Static Graphics overlay | Custom radial gradient; renderer-agnostic. | |
| c. Bake into procedural nebula texture | Zero per-frame cost; locked at startup. | |
| d. Hybrid — bake AND Phaser postFX | Baseline + WebGL polish layer. | |

**User's choice:** a — Phaser camera postFX.addVignette

---

### Q-07 — Vignette intensity

| Option | Description | Selected |
|--------|-------------|----------|
| a. Subtle (~0.3 strength) — atmospheric framing only | Barely noticeable; doesn't compete with HUD/menus. | ✓ |
| b. Moderate (~0.5 strength) — clear framing without drama | Visible but balanced. | |
| c. Cinematic (~0.7 strength) — dramatic spotlight | Strong atmosphere; visually frames HUD darker. | |

**User's choice:** a — Subtle (~0.3 strength)

---

### Q-08 — Vignette color

| Option | Description | Selected |
|--------|-------------|----------|
| a. Pure black — cinematic, clean frame | Standard movie/photo vignette; max contrast. | ✓ |
| b. Deep nebula purple (0x2d1b4e) | "Cosmic mist closing in"; needs Graphics overlay. | |
| c. Black with a hint of purple tint | Bridges cinematic and atmospheric. | |

**User's choice:** a — Pure black

---

### Q-09 — Vignette reactivity

| Option | Description | Selected |
|--------|-------------|----------|
| a. Static — set once, never changes | Pure atmospheric framing; matches THEME-05 wording. | |
| b. Phase-reactive — stronger during wave, lighter during build | Subtle tension cue; reuses phase-changed event. | ✓ |
| c. HP-reactive — intensifies and tints red below 50% HP | Maximum drama; risks death-spiral feel. | |
| d. Both phase- AND HP-reactive | Full dynamic system; most complex. | |

**User's choice:** b — Phase-reactive

---

## Renderer Detection & Canvas Fallback

### Q-10 — Canvas fallback for glow

| Option | Description | Selected |
|--------|-------------|----------|
| a. Skip glow entirely on Canvas — log warning | Simplest "graceful degradation"; zero extra paths. | ✓ |
| b. Stamp pre-baked glow halo texture behind each turret | Visible glow approximation; extra sprite per turret. | |
| c. Fake-glow via sprite alpha pulsing | Reuse Phase 2 idle pulse; weakest visual; zero cost. | |

**User's choice:** a — Skip glow entirely on Canvas

---

### Q-11 — Canvas fallback for vignette

| Option | Description | Selected |
|--------|-------------|----------|
| a. Graphics overlay fallback on Canvas, postFX on WebGL | Both renderers get a vignette; same outcome. | |
| b. Skip vignette entirely on Canvas | Simplest; aligns with D-10 philosophy. | ✓ |
| c. Always Graphics overlay (no Phaser postFX) | Single technique; loses tweenable FX. | |

**User's choice:** b — Skip vignette entirely on Canvas

---

### Q-12 — Where renderer detection lives

| Option | Description | Selected |
|--------|-------------|----------|
| a. Inline check in scene create() | No new files; matches existing inline-check pattern. | ✓ |
| b. New helper in src/utils/renderer.js | Reusable, testable; establishes new utils dir. | |
| c. Stash on registry from BootScene | Single source of truth; pattern shift. | |

**User's choice:** a — Inline `const isWebGL = this.game.renderer.type === Phaser.WEBGL;`

---

## Config & Scope

### Q-13 — Config location for glow + vignette tunables

| Option | Description | Selected |
|--------|-------------|----------|
| a. Extend VFX with VFX.GLOW and VFX.VIGNETTE | Consistent with frozen-config pattern. | |
| b. New top-level POSTFX frozen object alongside VFX and THEME | Cleanest separation: THEME = palette, VFX = events, POSTFX = scene-wide. | ✓ |
| c. Add to THEME object | Tightest coupling to cosmic identity. | |

**User's choice:** b — New top-level POSTFX frozen object

---

### Q-14 — Scene scope — where the effects apply

| Option | Description | Selected |
|--------|-------------|----------|
| a. GameScene only — strict scope | Smallest blast radius; Phase 7 can extend later. | |
| b. GameScene + GameOverScene | Cosmic moment persists into result screen. | |
| c. All gameplay-adjacent scenes (MainMenu, Game, GameOver; UIScene exempt) | Most cohesive; lightly overlaps Phase 7. | ✓ |

**User's choice:** c — All gameplay-adjacent scenes

**Notes:** Slightly overlaps Phase 7 (Cohesive Theme). Phase 7 still owns the hardcoded-color migration; Phase 5 only adds the post-FX layer. Captured under Deferred Ideas in CONTEXT.md as planner awareness.

---

## Claude's Discretion

- Exact glow `outerStrength` / `innerStrength` numerical tuning (start 2/1, adjust during execution within 60fps budget)
- Exact vignette `radius` value (start 0.5)
- Easing curve for build↔wave vignette tween (`Sine.easeInOut` recommended)
- Whether MainMenu/GameOver vignette uses `buildStrength` or its own constant
- Cleanup pattern for FX controllers on scene shutdown

## Deferred Ideas

- HP-reactive vignette (Q-09 option c) — possible v2 POLISH item
- Glow on boss / spitter bullets (Q-02 options b/c) — re-evaluate if boss feels visually weak
- Reactive glow flares on fire/damage (Q-05 option c) — re-evaluate if combat feels under-juiced
- Custom WebGL shader pipeline (Q-01 option d) — out of scope for polish milestone
- Phase 7 scope guard — D-14 extends to MainMenu/GameOver but Phase 7 still owns color migration
