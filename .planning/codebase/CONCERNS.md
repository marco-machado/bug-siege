# Codebase Concerns

**Analysis Date:** 2025-04-15

## Tech Debt

**BuildSystem.js UI Complexity:**
- Issue: `src/systems/BuildSystem.js` (412 lines) contains extensive hardcoded UI logic with magic numbers for positioning, colors, and dimensions
- Files: `src/systems/BuildSystem.js`
- Impact: Makes UI modifications difficult, violates DRY principle with duplicated menu construction logic
- Fix approach: Extract UI constants to `GameConfig.js`, create reusable menu components

**Hardcoded Color Values:**
- Issue: Colors are hardcoded as hex values (`0x111122`, `#00ff88`, etc.) throughout the codebase without centralization
- Files: `src/systems/BuildSystem.js`, `src/scenes/UIScene.js`, `src/entities/Turret.js`
- Impact: Difficult to maintain consistent color scheme, theme changes require hunting through files
- Fix approach: Create color palette constants in `GameConfig.js` and import consistently

**Magic Numbers in Game Logic:**
- Issue: Many magic numbers for timing, positioning, and game mechanics (e.g., `delay: 1000`, `cooldown: 300`, `radius: 120`)
- Files: `src/entities/Bug.js`, `src/entities/Turret.js`, `src/scenes/GameScene.js`
- Impact: Difficult to tune game balance, values not documented
- Fix approach: Move all magic numbers to `GameConfig.js` with descriptive names

## Known Bugs

**Potential Memory Leaks in Event Listeners:**
- Issue: Some event listeners in scenes may not be properly cleaned up on scene shutdown
- Files: `src/systems/BuildSystem.js` (line 30, 36), `src/scenes/UIScene.js` (line 59, 63)
- Symptoms: Memory growth over multiple game sessions, event listeners firing after scene destruction
- Workaround: Currently scenes have shutdown handlers but some input listeners may not be removed

**Collision Callback Parameter Order Issue:**
- Issue: Phaser collision callbacks receive arguments in unpredictable order, requiring parameter reassignment
- Files: `src/scenes/GameScene.js` (lines 59-72)
- Trigger: Collision events may have swapped parameters causing incorrect entity references
- Workaround: Code reassigns parameters, but pattern not consistently applied

## Security Considerations

**No Input Validation for Build Menu:**
- Risk: BuildSystem could attempt to place turrets on invalid grid positions
- Files: `src/systems/BuildSystem.js` (lines 41-66)
- Current mitigation: Grid bounds checking in `handleClick()` method
- Recommendations: Add validation for all user inputs, especially in wave phase interactions

**No Content Security Policy:**
- Risk: Potential XSS if game assets were compromised
- Files: `vite.config.js`
- Current mitigation: None - static game with no user-generated content
- Recommendations: Add CSP headers in production build configuration

## Performance Bottlenecks

**O(n²) Turret Targeting Algorithm:**
- Problem: Each turret scans all bugs every update to find targets
- Files: `src/entities/Turret.js` (line 44), `src/scenes/GameScene.js` (line 381)
- Cause: `turrets.findNearestBug()` method called for each turret each frame
- Improvement path: Implement spatial partitioning (quadtree), cache results, or reduce check frequency

**Unoptimized Physics Groups:**
- Problem: Physics groups for bullets and bugs may cause frame drops with many entities
- Files: `src/scenes/GameScene.js` (lines 37-53)
- Current capacity: 60 bugs + 50 bullets + 20 spitter bullets = 130 physics bodies
- Scaling path: Implement object pooling beyond Phaser's built-in groups, reduce collision checks

## Fragile Areas

**BuildSystem Menu Construction:**
- Files: `src/systems/BuildSystem.js` (lines 87-345)
- Why fragile: Complex manual UI construction with hardcoded coordinates, no error handling for missing assets
- Safe modification: Refactor to use Phaser containers with layout managers
- Test coverage: No automated tests for UI functionality

**Cross-Scene Event Communication:**
- Files: `src/scenes/UIScene.js` (lines 107-128), `src/scenes/GameScene.js` (lines 74-99)
- Why fragile: String-based event names, no type safety, potential for missing event handlers
- Safe modification: Create event constants file, add validation for event emission
- Test coverage: No integration tests for scene communication

## Scaling Limits

**Fixed Pool Sizes:**
- Resource: Object pools for bugs and bullets
- Current capacity: 60 bugs, 50 bullets, 20 spitter bullets
- Limit: Wave 10 could potentially exceed these counts causing entity creation failures
- Scaling path: Dynamic pool resizing, implement LRU eviction for inactive entities

**Fixed 7x7 Grid:**
- Resource: Game grid size
- Current capacity: 49 tiles
- Limit: Cannot expand gameplay area without rewriting grid logic
- Scaling path: Make grid dimensions configurable in `GameConfig.js`

## Dependencies at Risk

**Phaser 3.80.0:**
- Risk: No version pinning in package.json, could break on major updates
- Impact: Game mechanics could break with Phaser API changes
- Migration plan: Pin to specific version, regularly test with newer versions

**No Test Framework:**
- Risk: Changes cannot be validated automatically
- Impact: Regression bugs likely, manual testing required for all changes
- Migration plan: Add Vitest or Jest with unit tests for core systems

## Missing Critical Features

**No Save/Load System:**
- Problem: Player progress cannot be saved between sessions
- Blocks: Players cannot resume game, no persistent high scores
- Priority: Medium - affects user experience but not core gameplay

**No Accessibility Features:**
- Problem: No keyboard navigation, screen reader support, or colorblind modes
- Blocks: Players with disabilities may not be able to play
- Priority: High - important for inclusive design

## Test Coverage Gaps

**Entire Codebase Untested:**
- What's not tested: All game logic, physics, UI, audio, scene transitions
- Files: All `src/` files
- Risk: Regression bugs, broken gameplay mechanics, visual glitches
- Priority: High - foundational for maintainability

**No Integration Tests for Scene Flow:**
- What's not tested: Scene transitions, event communication, state persistence
- Files: `src/scenes/` directory
- Risk: Broken game flow, state corruption between scenes
- Priority: Medium - affects user experience

**No Performance Testing:**
- What's not tested: Frame rate stability, memory usage, load times
- Files: All game files
- Risk: Poor performance on lower-end devices, memory leaks
- Priority: Medium - affects player retention

---

*Concerns audit: 2025-04-15*