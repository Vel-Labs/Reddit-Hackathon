# Architecture

## System view

```text
Reddit inline post (splash.html)
        │ requestExpandedMode
        ▼
Phaser expanded app (game.html)
        │ JSON /api
        ▼
Hono Devvit server
        ├── Devvit context / Reddit API
        ├── installation-scoped Redis
        └── optional WorldCatalog adapter (disabled)

Client and server both import pure deterministic rules from src/shared/game.
```

## Client

Scenes:

- `BootScene` — minimal startup.
- `MenuScene` — bootstrap, tenant identity, loop selection.
- `BuilderScene` — paint/certify/test/publish tile.
- `RunnerScene` — finite auto-forward route.
- `ResultScene` — score/medal and next action.
- `AchievementsScene` — app-local progress.

The splash entrypoint does not import Phaser. The expanded game uses a fixed 1280×720 design canvas with fit scaling.

## Shared rule layer

- `types.ts` — canonical data shape.
- `constants.ts` — budgets, dimensions, integrity.
- `tile.ts` — immutable tile helpers and route flattening.
- `validator.ts` — dynamic lane-state solver.
- `foundingTiles.ts` — validated fallback corpus.
- `generator.ts` — seeded route assembly and whole-route check.
- `scoring.ts` — pure score/medal functions.
- `achievements.ts` — pure catalog and unlock evaluation.

This layer is platform-independent so tests and future server replay use exactly the same rules.

## Server

- `routes/api.ts` — player JSON API.
- `routes/internal.ts` — menu, install trigger, scheduler.
- `repositories/tenantStore.ts` — Redis collections.
- `services/routeService.ts` — compile, random local route, repair.
- `services/runService.ts` — one-use tokens and result sanity checks.
- `services/profileService.ts` — stats, streaks, unlocks, crossings.
- `services/worldCatalog.ts` — disabled optional boundary.

## Trust model

Trusted:

- Devvit context tenant/user identity;
- server validator and generator;
- server timestamps and token storage;
- Redis-owned records.

Untrusted:

- client tile identity, author, status, metrics;
- client score/counters;
- world catalog route until revalidated;
- asset filenames not present in verified manifest.

## Evolution

A production scale revision would separate route recipes from tile snapshots, introduce an in-memory repository test adapter, replay lane inputs server-side, namespace leaderboards by revision, and add compressed storage/migrations only when measurement justifies it.
