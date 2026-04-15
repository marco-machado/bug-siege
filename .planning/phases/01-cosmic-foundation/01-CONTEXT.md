# Phase 01: cosmic-foundation - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the visual and technical foundation for the cosmic nebula theme. This includes defining the global color palette, implementing a procedurally generated nebula background, and ensuring pooled entity stability via a tween safety net.
</domain>

<decisions>
## Implementation Decisions

### Visual Theme
- **D-01:** Use "Void Ethereal" palette: Near-black, soft violets, ghostly white accents. Aim for a minimalist and mysterious atmosphere.

### Background FX
- **D-02:** Implement nebula using Radial Gradient Noise. Use multi-layered radial gradients with simulated noise to achieve a soft, gaseous look that remains high-performance.

### Technical Stability
- **D-03:** Use the Phaser Tween Manager for cleanup. Implement `this.scene.tweens.killTweensOf(this)` in `Bug.despawn()` to reliably prevent tween corruption during entity reuse.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Requirements
- `.planning/REQUIREMENTS.md` — Defines THEME-01, THEME-02, and ANIM-05.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/config/GameConfig.js`: Central location for the new THEME config object.
- `src/scenes/BootScene.js`: Entry point for generating the procedural background texture.
- `src/entities/Bug.js`: Implementation point for `despawn()` tween cleanup.

### Established Patterns
- **Frozen Configs**: All configuration in `GameConfig.js` is frozen using `Object.freeze()`.
- **Object Pooling**: Bugs and bullets are pooled; cleanup in `despawn()` is critical for preventing state leakage.
- **Procedural Generation**: `BootScene` already contains fallback texture generation logic that can be extended for the nebula.
</code_context>

<specifics>
## Specific Ideas

- No specific requirements — open to standard Phaser 3 approaches for gradient noise and tween management.
</specifics>

<deferred>
## Deferred Ideas

- None — analysis stayed within phase scope.
</deferred>

---

*Phase: 01-cosmic-foundation*
*Context gathered: 2026-04-15*
