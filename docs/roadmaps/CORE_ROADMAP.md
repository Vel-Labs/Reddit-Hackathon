# Core Roadmap

## Outcome

Ship a polished Devvit Web game whose content supply grows through community-authored course tiles and whose existing content remains playable without requiring another player online.

## Product pillars

### Make

A build session lasts under two minutes. The player paints a small three-lane tile from a fixed vocabulary, receives immediate validation feedback, and must clear their own tile before publishing.

### Ride

A run lasts roughly 45–75 seconds. Horizontal movement is automatic; the player changes lanes, manages three package-integrity pips, and chooses between safe and rewarding routes.

### Return

The player returns because their tile may have been selected, other players crossed it, a new route exists, their weekly medal board changed, and a short achievement is within reach.

### Accumulate

Every published daily route enters the Roadbook. Community contributions therefore grow a permanent game rather than disappearing after a single daily prompt.

## Dependency map

```text
Tile contract + validator
        ├── Builder editor and certification
        ├── Founding tile library
        └── Route compiler
                 ├── Daily scheduler
                 ├── Runner route rendering
                 ├── Roadbook archive
                 └── creator impact statistics

Runner simulation
        ├── scoring and medals
        ├── leaderboards
        ├── achievements
        └── anti-cheat hardening

Tenant store
        ├── profiles
        ├── deletion and recompilation
        ├── scheduled posts
        └── optional World Catalog adapter
```

## Milestones

### M0 — Repository and contract baseline

- Official Devvit Phaser client/server/shared structure.
- Governance scaffold adapted to this product.
- Canonical tile, route, run, profile, and achievement types.
- JSON schemas, Redis keyspace, rules, tests, and agent routing.
- Vector fallback so binary art is not required to begin.

**Exit:** shared logic type-checks; founding tiles pass the validator; repo validation passes.

### M1 — Playable vertical slice

- Paint a 3×18 tile.
- Certify with a visible safe-path result.
- Test the tile using the actual runner.
- Compose it between founding tiles.
- Finish or fail with three integrity pips.
- Show result and medal.

**Exit:** a first-time mobile player can build and ride without reading a separate manual.

### M2 — Durable tenant game

- Redis-backed tile, route, profile, run, and leaderboard storage.
- One certified submission per player per day.
- Daily route compilation and post creation.
- Tile removal and route revision.
- Local Roadbook random route.

**Exit:** redeploying or reopening does not destroy progression or route history.

### M3 — Retention and creator consequence

- Achievement evaluation.
- Streak handling.
- Featured-tile attribution.
- Tile crossing counts.
- Daily and weekly leaderboard presentation.
- “Your tile was featured” return reveal.

**Exit:** returning on a second and seventh day yields materially different information.

### M4 — Art and launch polish

- Curated Kenney asset import.
- Responsive viewport and touch controls.
- Audio, reduced motion, loading states, failure recovery.
- Tutorial embedded in first interaction.
- Moderation/reporting UI.
- Public demo post seeded with founding routes.

**Exit:** judges understand the product from the post and first 30 seconds of play.

### M5 — Optional World Tour research

- External shared catalog contract.
- Moderator opt-in and removal propagation.
- Cross-community source labels and reporting.
- Random route adapter with local fallback.

**Exit:** only after the local product is complete and compliance requirements are satisfied.

## Non-goals for the hackathon

- Freeform Line Rider physics.
- Jumping or airborne lane changes.
- Live multiplayer.
- Arbitrary image/text uploads.
- Cross-subreddit Redis assumptions.
- Full economy, cosmetics shop, or payments.
- Infinite content that cannot be deterministically certified.
- More than one polished biome before the core loop is proven.
