# Daily Dash

**Build today. Ride forever.**

Daily Dash is a Devvit Web + Phaser game prototype for Reddit communities. Players use a constrained three-lane Builder to make short, fair course tiles. A deterministic compiler certifies and combines those contributions into finite delivery routes. Completed routes enter an evergreen Roadbook, so community growth produces new playable levels rather than disposable posts.

## Current prototype

The repository includes:

- a 3×18 Builder with road, gap, obstacle, boost, and parcel tools;
- a shared clean-path validator used by client, server, generator, and tests;
- a three-lane side-scrolling courier with up/down controls and three integrity pips;
- deterministic founding tiles and daily route generation;
- Devvit server routes for tenant-local Redis persistence, profiles, runs, and leaderboards;
- scheduled daily route/post endpoints;
- achievement definitions and progress evaluation;
- tile deletion and route recompilation;
- a disabled World Tour adapter for a future shared cross-community catalog;
- vector fallback art plus a small licensed Kenney meadow subset;
- product, architecture, governance, contracts, and detailed delivery roadmaps.

## Architecture

```text
src/client    Phaser scenes and lightweight inline splash
src/server    Hono endpoints, Devvit context/Redis, daily compiler services
src/shared    Canonical gameplay types, validator, generator, scoring
contracts     Normative rules, schemas, tenancy, Redis keyspace
docs          Architecture, project truth, art guidance, roadmaps
scripts       Repository/contract/art validation
tests         Pure shared-logic tests
```

The official Devvit Phaser template is the runtime foundation: Vite, Phaser, Hono, TypeScript, an inline splash entrypoint, and an expanded game entrypoint. Governance patterns are adapted from `Vel-Labs/project-scaffold`; this is a product repository rather than a copy of the generic scaffold.

## Requirements

- Node.js 22.2 or newer.
- npm.
- Reddit/Devvit developer access.

## Start

```bash
npm install
npm run login
npm run dev
```

The first Devvit run may prompt you to initialize or rename the app. App names are globally unique; update `devvit.json` if `daily-dash` is unavailable.

## Quality gates

```bash
npm run validate:repo
npm run validate:contracts
npm run validate:art
npm run test:logic
npm run type-check
npm run lint
npm run prettier:check
```

`npm run check` runs the complete sequence.

## Kenney Art

A small CC0 Kenney Platformer Pack Redux meadow subset is bundled under `public/assets/kenney/` and mapped through `assets/kenney-manifest.json`. Vector fallback still makes every screen functional when a semantic role is unmapped.

Do not copy an entire All-in-1 archive into the client bundle. See [`docs/art/THIRD_PARTY_ASSETS.md`](docs/art/THIRD_PARTY_ASSETS.md) and [`docs/art/KENNEY_IMPORT_GUIDE.md`](docs/art/KENNEY_IMPORT_GUIDE.md).

## Product roadmaps

Start with [`docs/roadmaps/README.md`](docs/roadmaps/README.md). The key streams are Builder, Evergreen Runner, UI/UX and Kenney art, achievements, data/level generation, multi-tenancy/World Tour, fairness, moderation, and hackathon delivery.

Hackathon submission constraints are tracked in [`docs/hackathon/RULES_COMPLIANCE.md`](docs/hackathon/RULES_COMPLIANCE.md) and [`docs/hackathon/SUBMISSION_CHECKLIST.md`](docs/hackathon/SUBMISSION_CHECKLIST.md). Recheck the live official rules and Devvit Rules before any final submission or public-readiness claim.

## Tenant model

Every subreddit installation is a separate tenant. Local routes, tiles, profiles, and leaderboards live in that installation’s Redis namespace. A cross-subreddit World Tour cannot be built by sharing Redis keys; it is represented as an optional external-service adapter and is disabled in the MVP.

## Important prototype limitations

- The shared tile/route logic has been locally compiled and exercised, but this generated artifact has not been installed into a live Devvit playtest in this environment.
- The runner submits lane-input events and server replay derives ranked score counters; speed/tween calibration still needs live playtest telemetry.
- Live Devvit validation and speed/tween calibration against platform telemetry remain launch tasks.
- Kenney binary import is intentionally small; several semantic roles still use vector fallback.

## License

BSD-3-Clause for repository code derived around the official starter. Third-party assets retain their own included terms; only license-verified assets should be imported.
