# Testing Patterns

**Analysis Date:** 2026-04-15

## Test Framework

**Runner:** No test framework configured

**Assertion Library:** None

**Run Commands:**
```bash
npm run build                      # Production build validation (zero warnings expected)
npm run dev                        # Manual testing via dev server at localhost:5173
VITE_DEBUG_KEYS=true npm run dev   # Debug mode with additional testing features
```

**Status:** No automated test suite exists. According to `AGENTS.md:14`: "No test framework or linter is configured. Validate changes with `npm run build` (zero warnings expected)."

## Test File Organization

**Location:** No test files present in codebase

**Naming:** N/A

**Structure:** N/A

## Test Structure

**Suite Organization:** N/A

**Patterns:** N/A

## Mocking

**Framework:** None

**Patterns:** N/A

**What to Mock:** N/A

**What NOT to Mock:** N/A

## Fixtures and Factories

**Test Data:** N/A

**Location:** N/A

## Coverage

**Requirements:** No coverage requirements or tooling

**View Coverage:** N/A

## Test Types

**Unit Tests:** None configured

**Integration Tests:** None configured

**E2E Tests:** None configured

## Validation Approach

**Build Validation:**
- Use `npm run build` to validate changes produce zero warnings
- Production build must complete successfully

**Manual Testing:**
- Development server: `npm run dev` → `http://localhost:5173`
- Debug mode: `VITE_DEBUG_KEYS=true npm run dev` enables:
  - Keys 1-4 spawn bugs for testing
  - Live stats overlay

**Functional Testing Areas:**
1. **Scene Flow:** `BootScene` → `MainMenuScene` → `GameScene` + `UIScene` → `GameOverScene`
2. **Game Systems:**
   - Wave progression (`WaveManager`)
   - Economy (`EconomyManager`)
   - Build system (`BuildSystem`)
3. **Entity Behaviors:**
   - Bug steering and combat
   - Turret targeting and firing
   - Bullet collision detection
4. **UI Integration:**
   - Event-driven state sync between `GameScene` and `UIScene`
   - Real-time HUD updates

## Codebase Testability Considerations

**Architectural Patterns Supporting Testability:**
- **Centralized Configuration:** All game balance in `src/config/GameConfig.js` with `Object.freeze()` makes values predictable
- **Event-Driven Communication:** Cross-scene events allow isolated testing of components
- **Object Pooling:** Phaser groups with `maxSize` and `classType` create predictable resource limits
- **Pure Classes:** Systems like `EconomyManager`, `WaveManager`, `BuildSystem` are plain classes with minimal Phaser dependencies

**Dependencies on Phaser Runtime:**
- Physics entities extend `Phaser.Physics.Arcade.Sprite`
- Scenes extend `Phaser.Scene`
- Heavy use of Phaser's time, input, and audio systems
- This creates significant mocking requirements for unit testing

**Potential Test Entry Points:**
1. **Pure Logic Systems:** `EconomyManager.js`, `WaveManager.js` logic could be unit tested
2. **Entity Behaviors:** `Bug.js` steering algorithms, `Turret.js` targeting logic
3. **Configuration Validation:** `GameConfig.js` structure and value consistency

## Adding Test Infrastructure

**If implementing tests:**
1. **Framework Selection:** Vitest (aligned with Vite) or Jest
2. **Mocking Strategy:** Mock Phaser runtime extensively
3. **Test Location:** Co-located test files (`*.test.js`) or separate `__tests__` directories
4. **Test Data:** Use frozen config objects from `GameConfig.js`

**Example Test Structure (hypothetical):**
```javascript
// src/systems/EconomyManager.test.js
import { EconomyManager } from './EconomyManager.js';
import { ECONOMY } from '../config/GameConfig.js';

describe('EconomyManager', () => {
  let mockScene;
  let economy;

  beforeEach(() => {
    mockScene = { events: { emit: jest.fn() } };
    economy = new EconomyManager(mockScene);
  });

  test('starts with correct credits', () => {
    expect(economy.getCredits()).toBe(ECONOMY.startingCredits);
  });

  test('canAfford returns true when sufficient credits', () => {
    expect(economy.canAfford(50)).toBe(true);
  });

  test('spend reduces credits and emits event', () => {
    const result = economy.spend(50);
    expect(result).toBe(true);
    expect(economy.getCredits()).toBe(ECONOMY.startingCredits - 50);
    expect(mockScene.events.emit).toHaveBeenCalledWith(
      'credits-changed',
      { credits: ECONOMY.startingCredits - 50 }
    );
  });
});
```

## Current Testing Limitations

**Manual Testing Required For:**
- Visual rendering and animations
- Physics collisions and interactions
- Audio playback and timing
- Input handling and UI responsiveness
- Full game session flow

**Risk Areas Without Tests:**
- Edge cases in wave spawning and progression
- Complex bug steering interactions
- Turret targeting edge cases
- Economy calculation errors
- Event handler memory leaks

## Recommended Testing Strategy

**Immediate (Low Hanging Fruit):**
1. Add configuration validation script
2. Add build-time type checking (JSDoc or TypeScript)
3. Create smoke test that verifies scene initialization

**Short-term:**
1. Unit tests for pure logic systems (`EconomyManager`, `WaveManager`)
2. Integration tests for entity interactions
3. Visual regression tests for critical UI states

**Long-term:**
1. E2E test for complete game session
2. Performance benchmarks
3. Cross-browser compatibility tests

---

*Testing analysis: 2026-04-15*