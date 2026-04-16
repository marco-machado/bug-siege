# Phase 1 -- UI Review

**Audited:** 2026-04-16
**Baseline:** 01-UI-SPEC.md design contract
**Screenshots:** not captured (no dev server running for this project)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | CTA matches spec but empty state, error state, and sell confirmation are missing |
| 2. Visuals | 3/4 | Clear visual hierarchy through size and color; procedural nebula delivers atmosphere |
| 3. Color | 1/4 | THEME values diverge from spec; accent color defined but never applied; 20+ hardcoded colors |
| 4. Typography | 1/4 | Spec declares 4 sizes; codebase uses 14 distinct sizes across scenes |
| 5. Spacing | 2/4 | Consistent multiples-of-4 in some areas but no centralized spacing scale; arbitrary pixel values |
| 6. Experience Design | 3/4 | Loading state, HP feedback, phase transitions, and affordance denial all present |

**Overall: 12/24**

---

## Top 3 Priority Fixes

1. **THEME config values do not match UI-SPEC color contract** -- Players see `#05050a` background instead of spec's `#0a0a12`; accent `#e0e0ff` is defined but never rendered anywhere in the UI -- Replace THEME values with spec values (`#0a0a12`, `#2d1b4e`, `#eef2ff`) and apply accent to HUD text elements (wave label, credits label, start-wave button) per spec's "HUD accents" designation
2. **14 font sizes used vs. 4 declared in spec** -- Visual noise and inconsistent hierarchy across menus, HUD, and scenes -- Consolidate to the 4 spec sizes (18px Body, 24px Label, 32px Heading, 36px Display) and define them as constants in GameConfig.js
3. **Missing empty state, error state, and sell confirmation copy** -- Player gets no guidance when grid is empty, no clear message on insufficient credits, and can accidentally sell turrets -- Implement "NO TURRETS PLACED" + body copy for empty grid, "Insufficient Credits" flash message, and sell confirmation dialog per copywriting contract

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

**Contract compliance (partial):**

The primary CTA matches the spec exactly:
- `src/scenes/UIScene.js:51` -- `'[ START WAVE ] (Space)'` matches spec's `[ START WAVE ] (Space)`

**Missing contract items:**

- **Empty state heading** -- Spec requires `"NO TURRETS PLACED"` as a visible game state. Only a lowercase debug-mode string exists at `src/scenes/UIScene.js:137` (`'No turrets placed'`), which is gated behind `DEBUG.enableDebugKeys` and invisible in production.
- **Empty state body** -- Spec requires `"Place turrets on the grid to defend the core."` -- not implemented anywhere.
- **Error state** -- Spec requires `"Insufficient Credits: Earn more by killing bugs."` -- The current implementation at `src/systems/BuildSystem.js:135-136` only flashes the label red for 300ms via `flashDenied()` with no text feedback.
- **Destructive confirmation** -- Spec requires `"Sell Turret: Are you sure? You will receive 50% refund."` -- Sell action at `src/systems/BuildSystem.js:280` fires immediately on click with no confirmation.

**Other copy:**
- Button labels use clear bracket notation: `[ START GAME ]`, `[ RESTART ]`, `[ MAIN MENU ]` -- consistent and thematic.
- Build menu labels are descriptive: `"Blaster ($50)"`, `"Single target, 2 shots/sec"` -- good.

### Pillar 2: Visuals (3/4)

**Strengths:**
- Clear focal point: Game title at 112px dominates the main menu (`src/scenes/MainMenuScene.js:20`).
- Visual hierarchy through size differentiation: title (112px) > subtitle (36px) > CTA (48px) > hint (24px).
- Procedural nebula background (`src/scenes/BootScene.js:84-109`) creates atmospheric depth with overlapping radial gradients.
- HP bars use color-coded feedback: green > yellow > red thresholds (`src/entities/Turret.js:321-323`, `src/scenes/UIScene.js:82`).
- Interactive affordances: pointer cursor on buttons, hover color change to `#00ff88`.
- Wave announcement uses animated text with fade-in/out (`src/scenes/GameScene.js:355-373`).

**Issues:**
- No tooltips or aria-labels exist for any interactive elements -- this is a canvas game so accessibility is inherently limited, but hover tooltips for turret types would aid discoverability.
- Menu panels (`src/systems/BuildSystem.js:100-102`) use `0x111122` background -- visually functional but not tied to the spec's Secondary color `#2d1b4e`.

### Pillar 3: Color (1/4)

**Spec contract violation -- THEME values diverge:**

| Role | Spec Value | THEME Value | Match? |
|------|-----------|-------------|--------|
| Dominant | `#0a0a12` | `#05050a` | No |
| Secondary | `#2d1b4e` | `#2a1b3d` | No |
| Accent | `#eef2ff` | `#e0e0ff` | No |

The THEME config was introduced in Phase 1 (`src/config/GameConfig.js:132-136`) with values that are close to but do not match the spec. This is a direct Phase 1 implementation gap.

**Accent color unused:**
- `THEME.accent` (`#e0e0ff`) is defined at `src/config/GameConfig.js:135` but is never referenced by any rendering code. Zero usage across all scenes and systems.
- The spec reserves accent for "HUD accents, critical UI highlights, high-energy cosmic effects" -- none of these use it.

**Hardcoded color proliferation (20+ unique colors):**
- HUD green: `#00ff88` (6 occurrences across BootScene, UIScene, MainMenuScene, GameOverScene, BuildSystem)
- Credits yellow: `#ffdd00` (UIScene:25, BuildSystem:108, BuildSystem:316)
- Wave orange: `#ff8844` (GameScene:359)
- Phase blue: `#88ccff` (UIScene:48)
- Subtitle gray: `#668899` (MainMenuScene:29)
- Menu background: `0x111122` (BuildSystem:100, BuildSystem:308)
- Menu border: `0x4488aa` (BuildSystem:102, BuildSystem:310)
- Phaser config fallback: `#1a1a2e` (main.js:14) -- does not match spec dominant or THEME background
- Damage red: `#ff3333` / `0xff4444` (multiple files)
- HP bar greens: `0x00ff44`, `0x00ff00` (UIScene:34, Turret.js:40)

None of these colors reference the THEME config or the spec palette. The 60/30/10 split is not enforced.

### Pillar 4: Typography (1/4)

**Spec declares 4 sizes:**
| Role | Size |
|------|------|
| Body | 18px |
| Label | 24px |
| Heading | 32px |
| Display | 36px |

**Actual sizes in use (14 distinct):**

| Size | Location | Spec Role? |
|------|----------|-----------|
| 112px | `MainMenuScene.js:20` (title) | Not in spec |
| 96px | `GameOverScene.js:21` (victory/defeat) | Not in spec |
| 72px | `GameScene.js:357` (wave announcement) | Not in spec |
| 48px | `MainMenuScene.js:34` (start button) | Not in spec |
| 44px | `GameOverScene.js:44,54` (restart/menu btns) | Not in spec |
| 40px | `GameOverScene.js:36` (stats) | Not in spec |
| 36px | `UIScene.js:17,23`, `MainMenuScene.js:27` | Display -- matches |
| 32px | `UIScene.js:46`, `BootScene.js:25` | Heading -- matches |
| 28px | `UIScene.js:52` (start wave btn) | Not in spec |
| 26px | `BuildSystem.js:119,293,323` (menu items) | Not in spec |
| 24px | `UIScene.js:37`, `MainMenuScene.js:53` | Label -- matches |
| 22px | `BuildSystem.js:106,314` (credits header) | Not in spec |
| 20px | `BuildSystem.js:125,297,330` (descriptions) | Not in spec |
| 18px | `UIScene.js:115` (debug text) | Body -- matches |

Only 4 of 14 sizes match the spec. 10 sizes are undeclared.

**Font weights:** Spec declares only "Regular" weight. Two instances use bold: `GameScene.js:360` and `MainMenuScene.js:23` via `fontStyle: 'bold'`.

**Font family:** Consistently `monospace` everywhere -- matches spec.

### Pillar 5: Spacing (2/4)

The spec declares a spacing scale (4, 8, 16, 24, 32, 48, 64px) but no centralized spacing constants exist in the codebase.

**Pixel positions are hardcoded throughout:**
- `UIScene.js:16-17` -- `(32, 32)` for wave text (32 = xl, on-scale)
- `UIScene.js:22-23` -- `(32, 78)` for credits text (78 is off-scale; 32+46 gap instead of 48)
- `UIScene.js:29-30` -- HP bar at `(W - 400, 36)` (36 is off-scale)
- `UIScene.js:36` -- HP label `barY + barH + 8` (8 = sm, on-scale)
- `BuildSystem.js:93-94` -- lineHeight `72` (off-scale)
- `BuildSystem.js:71-72` -- `80px` offset for menu placement (off-scale)
- `BuildSystem.js:117-124` -- `16px` internal padding (md, on-scale)

**Assessment:** Many spacing values happen to align with multiples of 4, which is good. However, there are off-scale values (36, 46, 72, 78, 80) and no constants enforce the declared scale. Spacing is ad-hoc but mostly reasonable.

### Pillar 6: Experience Design (3/4)

**Strengths:**
- **Loading state:** BootScene has a progress bar with loading text (`src/scenes/BootScene.js:11-40`).
- **Error handling for assets:** Failed asset loads trigger fallback texture generation (`src/scenes/BootScene.js:42-44, 112-146`).
- **Phase transitions:** Build/wave phases communicated via text and button visibility (`src/scenes/UIScene.js:93-101`).
- **Timer feedback:** Build countdown shown in real-time (`src/scenes/UIScene.js:103-105`).
- **HP feedback:** Color-coded HP bar with animated transitions (`src/scenes/UIScene.js:79-91`).
- **Affordance denial:** Cannot-afford items visually grayed (`#555555`) and flash red on click (`src/systems/BuildSystem.js:347-353`).
- **Hover highlights:** Grid cells show green (empty) or blue (occupied) on hover during build phase (`src/systems/BuildSystem.js:355-390`).
- **Tween safety:** Phase 1 added tween cleanup in Bug.despawn() preventing visual corruption (`src/entities/Bug.js:169`).

**Gaps:**
- **No sell confirmation:** Destructive action (selling turrets) executes immediately with no undo or confirmation, violating the spec's copywriting contract.
- **No empty state guidance:** New players get no visual cue about what to do when no turrets are placed (outside debug mode).
- **No error boundary:** Asset load failure is handled, but runtime errors in scene logic have no user-facing recovery.

---

## Files Audited

- `src/config/GameConfig.js` -- THEME palette definition (Phase 1 change)
- `src/entities/Bug.js` -- Tween safety in despawn (Phase 1 change)
- `src/scenes/BootScene.js` -- Nebula generation, loading state (Phase 1 change)
- `src/scenes/GameScene.js` -- Nebula background usage, wave announcement (Phase 1 change)
- `src/scenes/UIScene.js` -- HUD elements, phase display, HP bar
- `src/scenes/MainMenuScene.js` -- Title screen, start button
- `src/scenes/GameOverScene.js` -- Victory/defeat screen, stats
- `src/systems/BuildSystem.js` -- Build and turret menus, sell action
- `src/entities/Turret.js` -- HP bars, range display, visual feedback
- `src/main.js` -- Phaser config, background color
