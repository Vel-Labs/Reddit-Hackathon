# Data and Level Pipeline Roadmap

## Goal

Transform small, replaceable user-authored tiles into deterministic, validated, versioned, evergreen routes without storing rendered images or trusting the client.

## Domain objects

### CourseTile

Canonical 3×18 logical grid plus author, tenant, seed, status, and validator metrics. It contains no arbitrary text or uploaded binary data.

### RouteRecipe

Ordered tile IDs, fallback IDs, biome, seed, compiler version, revision, tenant, and date. It is the permanent identity of a route.

### RouteBundle

Recipe plus tile snapshots used by the client. Stored as JSON in the scaffold for simple retrieval. At scale, recipe and tiles can be read separately or compressed.

### Run token/result

A one-use server envelope binds user and route to a short validity window. Result stores score and run summary. A later replay event stream should become authoritative.

### PlayerProfile

Stats, unlocks, route completion IDs, and streak dates.

## Tile lifecycle

```text
Client draft
  → server identity rewrite
  → server schema/logic validation
  → certified tile hash
  → candidate pool
  → deterministic route selection
  → featured status and creator stat
  → crossings and analytics
  → optional author removal
```

The server ignores client-supplied tenant, author, status, metrics, and IDs where appropriate.

## Route compiler

Inputs:

- tenant identity;
- date key;
- desired length;
- certified non-removed community tiles;
- founding fallback library;
- biome/seed.

Algorithm:

1. Revalidate every candidate using current compiler rules.
2. Assign target difficulty by route position.
3. Penalize mismatch, repeated author, repeated tile, and founding tile when community options exist.
4. Select from a short ranked pool using seeded randomness.
5. Attach a valid founding fallback for each position.
6. Concatenate logical columns.
7. Run whole-route clean-path validation.
8. Save recipe and bundle; mark human tiles featured.
9. Increment creator metrics exactly once per route revision policy.

The seed is derived from tenant + date + compiler salt, so generation is reproducible.

## Cold start

Founding tiles obey the exact public contract and are tested at startup/build time. A route can be 100% founding on day one, then progressively use more community tiles. UI displays community-authored fraction honestly.

## Deletion and revision

A route is evergreen; a user contribution is removable.

When a tile is removed:

1. Mark tile `removed`; do not hard-delete immediately if moderation/audit policy requires a tombstone without content.
2. Find routes from the known route collection.
3. Recompile affected routes without the tile.
4. Preserve route ID and original creation date.
5. Increment revision.
6. Replace tile sequence/fallbacks.
7. Reset or version leaderboards if geometry changed.

The scaffold recompiles and increments revision but does not yet clear old leaderboards. That is a launch hardening item.

## Redis layout

See `contracts/redis-keyspace.md`. The design uses stable hashes and sorted sets because installation Redis does not support a global key scan.

### Storage estimates

A tile is 54 cells plus metadata and should remain a few kilobytes in ordinary JSON. An eight-tile route bundle can be tens of kilobytes. At higher adoption:

- store recipes separately from tiles;
- return referenced tile records in a batched read;
- use compressed Redis for route snapshots only after a migration plan;
- cap best runs and route index;
- expire daily submission hashes after their dispute/analytics window.

## Scheduled work

### Daily compile (`00:05 UTC` scaffold)

- compile or retrieve today’s route;
- create one post idempotently;
- record post ID in settings.

### Weekly maintenance

The shipped endpoint is a bounded placeholder. Implement:

- expire submission hashes older than 35 days;
- cap leaderboards to display/storage limit;
- repair route references to removed tiles;
- migrate old compiler versions in batches;
- aggregate creator analytics;
- save cursor and reschedule if work exceeds safe request budget.

## API surface

| Endpoint                         | Purpose                                                   |
| -------------------------------- | --------------------------------------------------------- |
| `GET /api/bootstrap`             | tenant, player, daily route, profile, achievement catalog |
| `POST /api/tiles/validate`       | optional server validation preview                        |
| `POST /api/tiles`                | rewrite, certify, and save daily tile                     |
| `DELETE /api/tiles/:id`          | owner removal and route repair                            |
| `GET /api/routes/daily`          | today’s tenant route                                      |
| `GET /api/routes/random`         | local Roadbook or optional world adapter                  |
| `POST /api/runs/start`           | one-use token                                             |
| `POST /api/runs/complete`        | validate summary, score, profile, leaderboard             |
| `GET /api/leaderboards/:routeId` | top best runs                                             |
| `GET /api/profile`               | authenticated profile                                     |

## Integrity hardening backlog

- JSON schema validation at request boundary.
- Payload byte and nesting limits.
- Server-side replay from input events.
- Transaction for one-submission-per-day race.
- Idempotency key for route feature stat updates.
- Route leaderboard namespace includes revision.
- Bounded profile `completedRouteIds` or a compact per-user index.
- Moderator removal endpoint and report records.
- Metrics privacy review before external catalog publication.

## Acceptance criteria

- Identical tenant/date/compiler inputs reproduce tile order.
- Every published route passes whole-route clean validation.
- No route depends on a missing community tile; every position has a fallback.
- A tile cannot be attributed to another user by client payload.
- The game works with zero community tiles.
- World Tour is not implemented by pretending installation Redis is shared.
