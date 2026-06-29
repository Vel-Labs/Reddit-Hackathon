# Decision Log

## D-001 — Use the official Devvit Phaser structure

**Date:** 2026-06-25
**Status:** Accepted

Use Vite + Phaser client, Hono server, and pure shared TypeScript. Overlay product governance rather than making the governance scaffold the runtime base.

## D-002 — Three-lane logical tiles replace freeform physics lines

**Date:** 2026-06-25
**Status:** Accepted

A 3×18 grid makes user content objectively certifiable, composable, mobile-friendly, and safer to moderate. The visual editor may feel painterly, but serialized truth remains discrete cells.

## D-003 — Finite evergreen routes before infinite mode

**Date:** 2026-06-25
**Status:** Accepted

Finite routes have destinations, reproducible leaderboards, medals, attribution, and deterministic whole-route validation. Long Haul/infinite chaining is a later reuse of certified content.

## D-004 — Neutral connectors on every tile

**Date:** 2026-06-25
**Status:** Accepted

All three lanes are clear for the first/last three columns. This reduces expressive range but makes independent user tiles safely composable and protects players entering from any lane.

## D-005 — Subreddit installation is the default tenant

**Date:** 2026-06-25
**Status:** Accepted

Use installation-scoped Redis for local tiles/routes/profiles. Cross-subreddit discovery requires a separate external catalog and moderator opt-in; it is disabled in MVP.

## D-006 — Kenney assets are a semantic skin

**Date:** 2026-06-25
**Status:** Accepted

The repository ships vector fallback and an asset-role manifest. Selected license-verified Kenney assets can replace semantic roles without changing collision or data.

## D-007 — Package integrity uses three full pips

**Date:** 2026-06-25
**Status:** Accepted

Obstacles and gaps each remove one pip; the third failure ends delivery. Full pips are clearer than half-hearts and align with the courier fiction.

## D-008 — Leaderboards are route-revision scoped

**Date:** 2026-06-28
**Status:** Accepted

Route repair can change playable geometry while preserving route identity. Ranked run tokens bind the revision issued at start, and best-run storage is namespaced by route revision so old scores never compete against repaired route layouts.

## D-009 — Reports use fixed reason codes only

**Date:** 2026-06-28
**Status:** Accepted

Daily Dash keeps moderation input constrained like Builder input. Route/tile reports use predefined reason codes and server-side identity rather than free text, uploads, links, or chat.

## D-010 — Ranked scores derive from lane-event replay

**Date:** 2026-06-28
**Status:** Accepted

Ranked run submissions include bounded column-indexed lane events. The server replays those events against the stored route geometry and derives damage, rewards, completion, and score instead of trusting client summary counters.

## D-011 — Two-lane migrations need four columns

**Date:** 2026-06-28
**Status:** Accepted

The deterministic solver may prove a zero-damage path that crosses from one edge lane to the other quickly, but certification must also protect human reaction time. Same-direction two-lane migrations require at least four columns between the first and second lane change; founding fallback tiles obey the same rule as community submissions.

## D-012 — Destination lanes must be visible before forced switches

**Date:** 2026-06-28
**Status:** Accepted

The fair-path solver rejects forced lane changes into a destination lane that was blocked during the camera-lookahead window immediately before the move. This keeps certified paths readable in the runner, where the courier sits left of center and players must see the safe route before committing to a lane change.

## D-013 — Do not ship raw Redis diagnostics by default

**Date:** 2026-06-29
**Status:** Accepted

Direct Redis proof is useful for platform audits, but a reusable diagnostics panel can become an unnecessary data surface. If diagnostics are needed, expose only aggregate health signals behind authenticated moderator checks: tenant id/name, current app version, daily route id exists, stored route count, certified tile count, profile count, report count, current user's profile exists, and today's post setting exists. Do not expose raw Redis values, arbitrary key lookup, user ids beyond the current user, run tokens, report bodies, or tile JSON.

## D-014 — Post-publish test rides are explicitly practice-only

**Date:** 2026-06-29
**Status:** Accepted

After a certified tile is published, Builder offers `Test My Tile`, `Ride Today`, `Try Yesterday`, and `Roadbook`. `Test My Tile` starts a preview route and never writes ranked leaderboard results; ranked play only starts from stored route id + revision routes issued by the server.

## D-015 — Runner sprites remain semantic and replaceable

**Date:** 2026-06-29
**Status:** Accepted

Runner route objects may render with curated Kenney textures for readability, but gameplay continues to depend only on canonical cells and semantic roles. Missing art falls back to vector drawing, and no rule or collision path may depend on a filename.
