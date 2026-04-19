# Phase 6: Cohesive Theme - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 06-cohesive-theme
**Mode:** --auto (Claude auto-selected recommended defaults for all gray areas)
**Areas discussed:** Scope of Migration, THEME Config Shape, Palette Derivation, Hex/Numeric Notation, Migration Order, Semantic Reuse Policy, Verification Gate

---

## Scope of Migration

| Option | Description | Selected |
|--------|-------------|----------|
| UI chrome only (menus, HUD, preload, HP bars) | Migrate UI-rendering literals; leave VFX/procedural textures as-is | ✓ |
| UI chrome + procedural texture generators | Also theme bug/turret sprite generation in BootScene | |
| Full sweep including VFX tints | Collapse everything into THEME, including gameplay colors | |

**[auto] Selected:** UI chrome only
**Rationale:** VFX colors already live in `VFX`/`POSTFX` frozen configs (Phase 3/4/5 domain) and encode gameplay state; procedural texture colors describe game entities, not UI chrome. THEME-03's intent is palette consistency across 6+ UI files, not global color refactor.

---

## THEME Config Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Expand THEME with nested `ui` sub-object | Preserve existing keys (`background`, `nebula`, `accent`); add `THEME.ui.*` namespace | ✓ |
| Replace THEME with flat new schema | Cleaner but breaks existing phase 1-5 imports | |
| Create new `UI_THEME` export, leave THEME alone | Two palettes, two imports, risk of drift | |

**[auto] Selected:** Expand THEME with nested `ui` sub-object
**Rationale:** Backwards-compatible with phases 1–5; single source of truth; nested freeze follows VFX/POSTFX pattern.

---

## Palette Derivation

| Option | Description | Selected |
|--------|-------------|----------|
| Source from 01-UI-SPEC.md authoritative palette | Cosmic nebula palette is the canonical source; derive all UI semantics from it | ✓ |
| Pick new cosmic colors independently | Free-hand palette crafting | |
| Generate via tool (e.g., Huemint) | Algorithmic palette |  |

**[auto] Selected:** Source from 01-UI-SPEC.md
**Rationale:** UI-SPEC is the project's locked palette contract; any independent selection risks palette drift. Derivations stay inside nebula/accent family.

---

## Hex vs Numeric Notation

| Option | Description | Selected |
|--------|-------------|----------|
| Store both explicitly as `{ hex, num }` pair | Zero per-call conversion, slightly chunkier config | ✓ |
| Store hex-only, derive numeric via helper | Smaller config, adds helper call overhead |  |
| Two parallel flat keys (`textPrimaryHex`, `textPrimaryNum`) | Explicit but verbose |  |

**[auto] Selected:** Store both as `{ hex, num }` pair per entry
**Rationale:** Phaser text styles want hex strings; Graphics/Rectangle want numeric. Pair-storage avoids per-call-site conversion and keeps call sites clean. Planner may swap for helper pattern if call-site readability improves.

---

## Migration Order

| Option | Description | Selected |
|--------|-------------|----------|
| Config first, then files in UI-dependency order | GameConfig → MainMenu → Boot → UIScene → GameOver → BuildSystem → Turret | ✓ |
| Single sweeping refactor commit | One commit, fast but risky |  |
| File-by-file random order | Easier parallelization, harder to verify |  |

**[auto] Selected:** Config first, 7 sequential atomic commits in dependency order
**Rationale:** Atomic-commit pattern from phases 1/3; each commit builds and visually verifies in isolation; matches existing phase-plan granularity.

---

## Semantic Reuse Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Collapse identical-intent literals, split gameplay-state | Max ~14 semantic keys, grouped by UI role | ✓ |
| One key per original literal | 1:1 mapping, larger palette |  |
| Minimal 4-token palette (text/bg/accent/danger) | Very tight, forces cohesion |  |

**[auto] Selected:** Collapse identical-intent, split for gameplay state (≤14 keys)
**Rationale:** Avoids palette sprawl while preserving signal-bearing distinctions (HP tiers, warnings vs errors). Matches the 4-token spirit of UI-SPEC but extends for Phaser-rendered chrome needs.

---

## Verification Gate

| Option | Description | Selected |
|--------|-------------|----------|
| Grep-based zero-literal check + build + visual smoke | Falsifiable grep pass; smoke test catches visual regressions | ✓ |
| Build-only | Fast but misses migration gaps |  |
| Full visual regression screenshot diff |  Requires new tooling, not aligned with "no test framework" constraint |  |

**[auto] Selected:** Grep + build + visual smoke-test
**Rationale:** Grep makes the acceptance criterion falsifiable; build confirms no typos; smoke-test catches cosmetic regressions. Stays within AGENTS.md "no test framework" constraint.

---

## Auto-Resolved Notes

All decisions above were auto-selected based on:
- Existing codebase patterns (frozen configs, atomic per-file commits, hex/numeric split)
- UI-SPEC authority (01-UI-SPEC.md cosmic nebula palette is canonical)
- ROADMAP.md success criteria (explicit "6+ files", explicit "cohesive cosmic palette")
- Constraint from AGENTS.md (no test framework → grep + build + smoke-test as acceptance gate)

## Claude's Discretion (deferred to planning)

- Exact numeric values for derived cosmic variants (muted text, success green, warning, HP tiers)
- `{hex, num}` inline pair vs `themeHex()`/`themeNum()` helper (planner picks on readability)
- Flat vs nested `ui.*` key layout

## Deferred Ideas

- Dark/light mode toggle
- Per-wave palette shifts
- VFX/POSTFX color migration through THEME
- Typography token consolidation
- Theming of procedural bug/turret textures
