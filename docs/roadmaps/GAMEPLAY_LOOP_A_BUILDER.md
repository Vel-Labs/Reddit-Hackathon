# Gameplay Loop A — Builder

## Promise

**Make a six-second piece of a future level, prove that it is fair, and publish it in under two minutes.**

The Builder is a constrained creation game, not a professional level editor. Its pleasure comes from making an interesting choice with a small budget and receiving immediate, legible feedback.

## Session flow

```text
Open Builder
  → receive blank 3×18 tile with locked connectors
  → select road/gap/obstacle/boost/parcel tool
  → drag or tap to paint cells
  → watch budget and warnings update
  → certify
  → inspect safe-path overlay and metrics
  → test ride using Evergreen runner
  → revise or publish
  → return later for feature/crossing outcome
```

## Tile anatomy

- Three horizontal lanes: top, middle, bottom.
- Eighteen logical columns representing time/progress.
- Columns 0–2 and 15–17 are protected neutral connectors.
- Columns 3–14 are editable.
- All visual rendering must map back to this canonical grid.

The connector zones guarantee that independently created tiles remain composable. They are visually framed and cannot be painted.

## Tool palette

### Road

Restores ordinary passable terrain and removes any feature. It is the reset/erase-to-safe tool.

### Gap

Removes road. Crossing it costs one package-integrity pip and triggers a recovery delay. It costs one build-budget point.

### Obstacle

Places a collision hazard on road. It costs two budget points and one integrity pip when hit.

### Boost

Places an optional speed advantage. It costs two budget points and may never be necessary for completion.

### Parcel stamp

Places an optional score collectible. It costs one point and should usually tempt a riskier line rather than sit on the only safe path.

## Builder economy

The budget should make “fill every lane with hazards” impossible and make revision understandable.

| Object   | Cost | Cap |
| -------- | ---: | --: |
| Gap cell |    1 |  14 |
| Obstacle |    2 |   9 |
| Boost    |    2 |   5 |
| Parcel   |    1 |   7 |
| Total    |    — |  24 |

The UI shows remaining budget as physical “road stamps” or drafting tokens, not an abstract developer number.

## Certification contract

Publishing requires both deterministic and experiential certification.

### Deterministic certification

- Exact shape: 3×18.
- Protected connectors unchanged.
- Features cannot occupy gaps.
- Object and budget caps respected.
- At least one zero-damage path exists.
- A zero-damage path is reachable from each entrance lane.
- No boost is necessary.
- Whole tile uses the canonical lane-change cooldown.

### Builder clear

The author must complete one test ride. This is not sufficient security by itself, but it gives the creator immediate empathy for the runner.

### Human-fair hardening

The initial solver proves reachability. A reaction-margin pass now rejects mandatory switches without sufficient visible lead time. Target tuning:

- one-lane forced switch: at least two columns of warning (implemented);
- two-lane migration: at least four columns (implemented);
- no consecutive forced switches during lane transition;
- safe route remains visible within the camera lookahead (implemented);
- boost state resets before the connector zone.

## Feedback hierarchy

The validator must explain the next useful action, not only return “invalid.”

1. Hard blocking error at the exact lane/column. Reaction-margin issues now carry lane/column evidence.
2. Highlighted cells implicated in the failure. Builder certification failures now draw a warning highlight on the implicated cell when validator evidence is available.
3. Green safe-path overlay when certified. Implemented overlay paths come from shared deterministic movement logic, not client-only heuristics.
4. Gold high-reward path overlay as a non-authoritative suggestion.
5. Summary: clean path count, entry coverage, difficulty, budget, risk score.

Example messages:

- “Middle entrance cannot reach a clean path. Clear one of the highlighted cells.”
- “Connector zones must remain ordinary road.”
- “Certified, but both rewards sit on the safest path. Consider making a meaningful fork.”
- “No hazards: playable, but unlikely to be featured.”

## Selection incentives

Do not rank creators by failure rate. The compiler should prefer tiles with:

- valid clean completion;
- meaningful route forks;
- adequate reaction margin;
- distinct shape from recently selected tiles;
- reasonable difficulty for its route position;
- author freshness;
- balanced future path usage.

Selection occurs from a quality pool using a seeded weighted choice. This prevents a tiny group of experts from owning every route.

## Creator consequence

A published tile has a lifecycle:

```text
Draft → Certified → Candidate → Featured → Evergreen usage → Removed/replaced
```

The return screen should show:

- whether the tile was featured;
- route and section where it appeared;
- number of crossings;
- clean-clear rate;
- route choice distribution;
- fastest crossing;
- whether players took the boosted path;
- achievement progress.

Only crossing count exists in the first code slice; route-choice analytics are a later event stream.

## Mobile interaction

- Tap tool, then drag through cells.
- A cell changes only once per continuous drag to avoid oscillation.
- Long press is not required.
- Locked connectors visibly reject paint.
- Undo, redo, certified safe-path overlay, one-lane reaction margin, two-lane migration timing, camera-lookahead destination checks, reaction-margin lane/column issue evidence, and Builder issue-cell highlighting are implemented.
- The editor must fit without page scrolling in expanded view.
- Haptic feedback is optional and must not be assumed available.

## Abuse and moderation

The grid contains no text, uploads, custom colors, or arbitrary freehand image. Attribution, report, and author deletion remain required. A deleted featured tile causes route recompilation with a system fallback and increments route revision.

## Delivery phases

### A1 — editor foundation

Grid, tools, budget, clear connectors, local draft.

### A2 — certification

Shared validator, issue overlays, metrics, founding-tile tests.

### A3 — actual test ride

Open the same runner with the candidate tile between neutral/founding flanks.

### A4 — persistence

Server rewrites identity and metadata, validates again, enforces one daily active submission, saves certified tile.

### A5 — creator analytics

Feature notification, crossing counter, path-choice events, balanced-design achievement.

## Acceptance criteria

- A new player creates and publishes a valid tile in under two minutes.
- No client can publish an invalid tile by bypassing the UI.
- Every published tile is cleanly reachable from all three entry lanes.
- A tile is recognizable when rendered inside a generated route.
- Removing a tile removes it from future use and repairs existing route recipes.
