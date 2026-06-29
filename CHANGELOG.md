# Changelog

## Unreleased

### Added

- Builder undo and redo controls with bounded local edit history.
- Builder certification now overlays shared-validator clean paths for every covered entrance lane.
- Shared tile validation now rejects clean paths that require forced lane switches without two columns of reaction margin.
- Shared tile validation now requires four columns of lead space before a same-direction two-lane migration.
- Shared tile validation now rejects forced switches into lanes that were hidden by hazards during the camera-lookahead window.
- Reaction-margin validation issues now include lane and column evidence for Builder highlighting.
- Builder certification failures now highlight the implicated grid cell when validator evidence is available.
- Builder drafts now show publish-blocker counts and a `NEXT ISSUE` repair loop that cycles through validator errors one at a time.
- Founding weave/switchback fallback tiles were softened to satisfy the same reaction-margin rule as community tiles.
- Founding parcel-fork and ravine-choice fallback tiles were softened to satisfy the two-lane migration rule.
- Founding meadow-warmup, puddle-run, broken-boardwalk, market-street, and ravine-choice fallback tiles were softened to satisfy camera-lookahead fairness.
- Runner feedback and tile seam labels now reuse pooled text objects instead of creating transient labels during rendering.
- Roadbook scene lists tenant routes, shows route details, loads the selected route leaderboard, and preserves shuffle/play actions.
- Ranked run tokens and Roadbook leaderboards are now scoped to the route revision active when the run started.
- Roadbook tile review now supports fixed-reason reports and guarded tile removal that triggers route repair.
- Ranked run completion now submits compact lane-change events and derives damage, parcels, boosts, completion, and score through shared server replay.
- Imported a small CC0 Kenney Platformer Pack Redux meadow subset and preloads mapped semantic art roles while preserving vector fallback.
- Added a Creator postcard that shows featured tile crossings and top/middle/bottom path-choice splits from server-derived route/run data.
- Runner first-run clarity now includes larger package-integrity pips, persistent lane/touch controls, swipe support, and clearer damage/reward feedback.
- Builder publish success now shows `Test My Tile`, `Ride Today`, `Try Yesterday`, and `Roadbook` continuation actions; test-tile rides stay practice-only.
- Builder repair flow now includes an `ERASE FIX` action for the currently highlighted validator issue.
- Runner route rendering now uses semantic Kenney road, crate, boost, and collectible textures when available, with vector fallback preserved.
- Runner route HUD now shows route date, revision, difficulty, and community-authored percentage.
- Creator postcard entries now label featured status and clean-clear rate.

## 0.1.0 — 2026-06-25

### Added

- Devvit Web + Phaser repository baseline.
- Three-lane Builder with constrained tools and build budget.
- Shared deterministic tile validator and route generator.
- Founding tile library and cold-start route generation.
- Evergreen courier runner, score, medals, result, and achievements scenes.
- Tenant-local Redis repositories and Hono APIs.
- Daily scheduler/post routes, leaderboards, profiles, deletion, and route repair.
- Disabled World Tour adapter and tenancy contract.
- Vector fallback UI and Kenney art import plan.
- Full product/architecture/governance/roadmap documentation.
