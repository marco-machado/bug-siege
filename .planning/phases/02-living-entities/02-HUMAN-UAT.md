---
status: partial
phase: 02-living-entities
source: [02-VERIFICATION.md]
started: 2026-04-16T00:00:00Z
updated: 2026-04-16T00:00:00Z
---

## Current Test

[awaiting human testing — run `npm run dev` and open http://localhost:5173]

## Tests

### 1. Core breathing
expected: slow sinusoidal scale pulse visible on command core sprite at rest
result: [pending]

### 2. Turret base glow
expected: alpha fading 0.75→1.0 in 1.2s cycle on non-wall turrets (cannon, laser, zapper, spitter)
result: [pending]

### 3. Upgraded turret glow
expected: visually more energized pulse (0.65→1.0, 0.9s cycle) after upgrade compared to base
result: [pending]

### 4. Bug animation variety
expected: swarmer jittery (fast), brute heavy (slow), spitter rhythmic (medium), boss slow — not in lockstep
result: [pending]

### 5. Bug pool reuse
expected: no stale scale artifacts on second-wave bugs (pool reuse resets scale correctly)
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
