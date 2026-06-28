# Gameplay Loop B — Evergreen Runner

## Promise

**Read the course, choose a lane, deliver the parcel, and master routes made by the community.**

The evergreen game is a finite three-lane side-scrolling runner. “Evergreen” means completed routes remain replayable; it does not mean an unvalidated infinite stream.

## Core control model

- Horizontal movement is automatic and normalized.
- Up moves one lane upward.
- Down moves one lane downward.
- Keyboard: arrows plus W/S.
- Mobile: two large vertical touch zones and swipe support after MVP.
- No jump in version 1.

Lane movement is visually eased but logically deterministic. The canonical simulator evaluates one time column at a time and applies a one-column lane-change cooldown.

## Failure contract

The package has three integrity pips.

```text
■ ■ ■ → ■ ■ □ → ■ □ □ → delivery failed
```

Obstacle:

- removes one pip;
- causes a short slowdown;
- grants temporary invulnerability;
- visibly dents the parcel.

Gap:

- removes one pip;
- applies a larger recovery delay;
- respawns in a valid lane;
- is not instant death in version 1.

The third hit ends the run. This is easier to learn and fairer in a user-generated game than mixing one-hit and three-hit hazards.

## Route reading

The player must see enough horizontal lookahead to react. The courier sits left of screen center. Hazards, gaps, boosts, and parcels have distinct silhouettes that remain legible without color.

At tile boundaries, a small roadside sign credits the builder. Attribution should not cover the playfield or interrupt input.

## Risk/reward vocabulary

### Safe path

- wider reaction windows;
- zero required damage;
- fewer rewards;
- no reliance on boosts.

### Fast path

- boost pads;
- tighter switches;
- lower finish time;
- still cleanly completable.

### Score path

- parcels or stamps;
- may diverge from fastest route;
- encourages replay rather than one solved answer.

A good route makes at least two of these paths meaningfully different.

## Scoring

```text
7,500 completion
+ up to 5,000 time bonus
+ 350 per parcel
+ 75 per boost, capped
− 1,250 per damage
= final score
```

Medals:

- Bronze: 7,500.
- Silver: 10,000.
- Gold: 12,500.

These are scaffold thresholds. Before launch, calibrate them against a corpus of founding and community-style routes. Route-specific percentile medals are a future alternative if fixed thresholds become unfair across biomes.

## Modes

### Daily Dash

One deterministic tenant route per day. Its leaderboard is the primary competitive surface and resets naturally with the date.

### Roadbook

Permanent list of previously published tenant routes. Each route tracks medal, personal best, community best, contributor count, revision, and community-authored percentage.

### Shuffle

Randomly selects a route from the local Roadbook. The endpoint can later query World Tour through the adapter, but local fallback is mandatory.

### Weekly Long Haul — stretch

A finite route assembled from selected tiles across the week. It reuses the same compiler and does not introduce infinite generation.

## Route composition pacing

An eight-tile route should approximate:

```text
Easy opening → medium read → medium fork → hard peak
→ recovery → hard choice → medium rhythm → readable finish
```

Never place multiple maximum-difficulty tiles without a recovery section. The compiler chooses by difficulty target, author diversity, recent usage, and deterministic seed.

## Replay value

A route supports:

- personal best;
- clean-clear challenge;
- parcel-completion challenge;
- medal progression;
- leaderboard rank;
- route revision history;
- later ghost replays.

Ghosts are optional for launch. A compact input-event replay is preferable to storing video or frame snapshots.

## Server trust boundary

The server issues one-use run tokens and sanity-checks timing and result ranges. The scaffold does not yet submit a full deterministic input trace, so it is appropriate for a hackathon leaderboard rather than a high-stakes competitive economy.

Hardening path:

1. Store route version and compiler version in token.
2. Submit lane-change input events with timestamps/columns.
3. Replay the logical simulator server-side.
4. Derive damage, parcels, boosts, and completion from replay.
5. Reject impossible speed or lane transitions.

## Accessibility

- Inputs remappable after MVP.
- No mechanic depends only on hue.
- Reduced-motion mode removes shake, parallax, and aggressive boost zoom.
- Sound effects have captions/icons and global mute.
- Touch targets are at least 48 CSS pixels.
- Text remains outside the high-motion playfield.
- Practice mode works while signed out; ranked persistence requires authentication.

## Delivery phases

### B1 — deterministic lane simulator

Auto-forward progress, smooth lane movement, hazards, boost, parcel, finish/fail.

### B2 — route renderer

Render canonical tiles with vector fallback and seeded visual dressing.

### B3 — scoring and persistence

Run tokens, result validation, profile, leaderboard, personal best.

### B4 — Roadbook

Route list, filters, medals, revision labels, random local route.

### B5 — mastery

Ghosts, weekly collection, creator section stats, World Tour adapter.

## Acceptance criteria

- A player understands Up/Down and integrity within one run.
- All certified generated routes can be completed without damage.
- One collision does not produce repeated damage due to overlap.
- A mobile player can operate the game with one thumb.
- A route remains playable if World Tour and server calls fail; practice result still appears locally.
