# Daily Dash Roadmaps

These roadmaps divide one product into independently reviewable delivery streams. They are ordered by dependency, not by perceived glamour.

## Product sentence

**Communities build fair three-lane course tiles; the game certifies and composes those tiles into permanent delivery routes that anyone can replay.**

## Canonical roadmap order

1. [Core Roadmap](CORE_ROADMAP.md)
2. [Gameplay Loop A — Builder](GAMEPLAY_LOOP_A_BUILDER.md)
3. [Gameplay Loop B — Evergreen Runner](GAMEPLAY_LOOP_B_EVERGREEN.md)
4. [Data and Level Pipeline](DATA_AND_LEVEL_PIPELINE.md)
5. [UI/UX and Kenney Art](UI_UX_AND_KENNEY_ART.md)
6. [Achievements and Retention](ACHIEVEMENTS.md)
7. [Multi-Tenancy and World Tour](MULTI_TENANCY_AND_WORLD_TOUR.md)
8. [QA and Fairness](QA_AND_FAIRNESS.md)
9. [Moderation and Safety](MODERATION_AND_SAFETY.md)
10. [Hackathon Delivery](HACKATHON_DELIVERY.md)

## Definition of the MVP

The MVP is complete when an authenticated player can build, certify, test, and publish one tile; a scheduled compiler can place certified tiles into a completable daily route; another player can finish that route with up/down controls; and the result persists as an evergreen Roadbook route with a leaderboard and creator impact.

World Tour, elaborate cosmetics, jumping, real-time collaboration, and an actual infinite runner are explicitly outside the launch dependency chain.

## Truth hierarchy

1. `contracts/` defines gameplay and storage invariants.
2. `src/shared/game/` implements deterministic rules used by client, server, and tests.
3. This folder plans delivery and UX around those rules.
4. Mockups, issue descriptions, and comments are non-authoritative when they conflict with the contracts.
