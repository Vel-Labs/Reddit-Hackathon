# Multi-Tenancy and World Tour Roadmap

## Default: subreddit installation is the tenant

Each Devvit installation receives its own Redis namespace. Daily Dash treats that boundary as a feature:

- local tile pool;
- local daily route;
- local Roadbook;
- local leaderboards;
- local moderator control;
- local creator recognition.

The tenant ID comes from Devvit context and is rewritten server-side. The client never selects which tenant owns a submission.

## Why World Tour is separate

A random route across all subreddits cannot be produced by scanning tenant Redis. It needs a shared service that receives publishable route snapshots from opted-in installations.

The repository therefore defines a `WorldCatalog` interface and ships a disabled adapter. `/api/routes/random` always works using the local Roadbook and may later prefer a world route when available.

## Proposed World Catalog architecture

```text
Subreddit installation A ─┐
Subreddit installation B ─┼─ HTTPS publish/remove API → Shared route catalog
Subreddit installation C ─┘                              ↓
                                              random/query API
                                                      ↓
                                       Daily Dash World Tour client
```

### Suggested services

- Vercel/Cloudflare/serverless API or other owned HTTPS service.
- Durable database containing only publishable route snapshots and deletion tombstones.
- Signed app-to-service requests.
- Rate limiting, validation, moderation queue, and audit logs.

## Publication envelope

A world route should include:

- global ID;
- source tenant ID and display name;
- local route ID and revision;
- publish timestamp;
- biome and difficulty;
- compiler/game version;
- ordered sanitized tile geometry;
- public creator display names only if policy and consent permit;
- removal/report endpoint identifiers.

Do not publish user IDs, run histories, profile data, raw Redis keys, or private community metadata.

## Opt-in model

World publication is disabled by default. Enable only when:

1. App operator configures an approved service URL and secret.
2. Moderator enables “Share certified routes with World Tour.”
3. A clear settings screen explains content, attribution, removal, and reporting.
4. Existing routes are not backfilled without explicit action.
5. The installation can revoke opt-in and issue removal requests.

Players should be told when their tile may appear outside the source community before publication.

## World Tour gameplay

World Tour is a discovery mode, not the canonical daily competition.

A route card shows:

- source community;
- date and biome;
- difficulty;
- creator count;
- revision;
- report action;
- “Visit source community” only through permitted navigation.

Leaderboards should remain source-local at first. A global leaderboard introduces identity, abuse, and fairness complexity with little MVP value.

## Randomization policy

Avoid a naive uniform random route, which overexposes tenants with many published levels.

Candidate policy:

1. Select source tenant with capped/weighted fairness.
2. Exclude current tenant when the player requests “Travel.”
3. Filter removed, quarantined, incompatible, or stale compiler versions.
4. Prefer unplayed routes for authenticated users when privacy-safe.
5. Apply content and difficulty preferences.
6. Fall back to local Roadbook on timeout or empty catalog.

## Removal propagation

Source deletion must propagate:

- local route revision is updated;
- source installation calls shared `DELETE /routes/{globalId}` or publishes tombstone;
- catalog stops serving it immediately;
- cached clients honor short TTL/version checks;
- reports remain auditable without retaining deleted user content.

## Failure behavior

World Tour must never prevent core play.

- Adapter timeout: use local random route.
- Shared service unavailable: hide/disable travel badge for session.
- Invalid world route: reject through local shared validator and log.
- Incompatible version: skip route.
- Source removed: local fallback.

## Delivery gates

World Tour work starts only after:

- local Daily and Roadbook are polished;
- deletion/reporting works;
- privacy policy exists;
- HTTP Fetch configuration and domain approval are understood;
- shared service has an operator and incident plan;
- judges can experience the core product without it.

## Acceptance criteria

- No code assumes Redis data crosses installations.
- A local tenant is fully functional with the adapter disabled.
- World routes are validated again by the consumer.
- Moderator opt-out removes future discovery and propagates deletion.
- Source community is visible and never spoofed by client input.
