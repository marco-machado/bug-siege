# Contract: Scene Flow

**Purpose**: Defines the scene lifecycle, transitions, and data passed between scenes.

## Scenes

| Scene Key | Type | Description |
|-----------|------|-------------|
| `Boot` | Sequential | Generates placeholder assets, loads fonts. Transitions to MainMenu. |
| `MainMenu` | Sequential | Title screen with "Start Game" button. Transitions to Game. |
| `Game` | Sequential | Core gameplay. Launches UIScene in parallel. Transitions to GameOver. |
| `UIScene` | Parallel | HUD overlay (wave counter, credits, health bar, start wave button). Runs alongside Game. |
| `GameOver` | Sequential | Win/loss screen with stats. Transitions to MainMenu or restarts Game. |

## Transition Map

```
Boot ──start──► MainMenu
MainMenu ──start──► Game
Game ──launch──► UIScene (parallel)
Game ──start──► GameOver (stops UIScene)
GameOver ──start──► MainMenu
GameOver ──start──► Game (restart)
```

## Data Contracts

### Game → UIScene (Events)

UIScene listens to events emitted by Game scene via `this.scene.get('Game').events`:

| Event | Payload | When |
|-------|---------|------|
| `credits-changed` | `{ credits: number }` | Credits added or spent |
| `wave-changed` | `{ wave: number, total: number }` | New wave begins |
| `hp-changed` | `{ hp: number, maxHp: number }` | Base takes damage |
| `phase-changed` | `{ phase: 'build' \| 'wave' }` | Phase transition |
| `timer-tick` | `{ seconds: number }` | Build phase countdown tick |

### Game → GameOver (scene.start data)

```javascript
{
  won: boolean,          // true = victory, false = defeat
  wave: number,          // wave reached (1-10)
  totalKills: number,    // total bugs killed
  credits: number,       // remaining credits
  baseHp: number,        // remaining base HP
}
```

### MainMenu → Game

No data. Game initializes fresh state from config.

### Boot → MainMenu

No data. Boot simply starts MainMenu after asset generation.

## Scene Lifecycle Hooks Used

| Scene | init() | preload() | create() | update() |
|-------|--------|-----------|----------|----------|
| Boot | — | — | Generate textures, start MainMenu | — |
| MainMenu | — | — | Render title + button | — |
| Game | Reset game state | — | Create grid, turrets, physics groups, input handlers | Physics updates, turret targeting, bug steering |
| UIScene | Store Game scene ref | — | Create HUD elements, bind events | — (event-driven updates) |
| GameOver | Receive result data | — | Render stats + buttons | — |
