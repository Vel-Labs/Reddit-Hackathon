# Current State and Next

## Implemented scaffold

- Runnable Devvit/Phaser repository shape.
- Complete vector-fallback Builder and Runner vertical slice.
- Shared tile validator, route generator, founding tiles, scoring, achievements.
- Tenant-local Redis/server architecture.
- Scheduled route/post endpoints.
- Roadbook shuffle endpoint and menu action with local fallback.
- Deletion/recompile path.
- Builder undo/redo controls with bounded local edit history.
- Builder safe-path overlay sourced from shared deterministic movement logic.
- Shared reaction-margin validation rejects one-lane forced switches without two clean columns of warning, same-direction two-lane migrations without four columns of lead space, and forced switches into lanes hidden during the camera-lookahead window; validation issues include lane/column evidence and Builder grid highlighting.
- Builder repair UX shows draft publish-blocker counts and cycles through validator issues one at a time with highlighted cells when evidence is available.
- Runner feedback and tile seam labels reuse pooled text objects instead of allocating transient labels during rendering.
- Roadbook route-list scene with selected-route details, shuffle/play actions, and leaderboard panel.
- Route leaderboard persistence and Roadbook reads are scoped by route revision.
- Roadbook tile review panel supports structured reports and guarded author/moderator removal with route repair.
- Ranked runs submit lane-change events; the server replays route geometry to derive damage, rewards, completion, and score.
- Small CC0 Kenney Platformer Pack Redux meadow subset is imported, licensed, manifest-mapped, and preloaded behind semantic roles.
- Creator postcard shows featured tile crossings and top/middle/bottom path-choice splits derived from current route best-run data.
- Detailed product roadmaps and governance.
- Passing local test/type/lint/build gates.
- Environment bootstrap reverified on 2026-06-29: `npm run check` passes, Devvit MCP is registered in Codex, Devvit CLI auth works as `u/scubaxsteven`, `npx devvit upload --verbose` uploaded `drawn-to-deliver` v0.0.1, and `npm run dev` started playtest version `v0.0.1.6`.
- Live Reddit proof on 2026-06-29 confirmed the app-installed subreddit, app-authored custom post, inline splash, expanded Devvit modal, mobile webview rendering, and runtime context fields for app/post/subreddit/user.

## First real-world task

Direct Redis key/value inspection remains the only unproven platform detail. Devvit CLI does not expose raw Redis inspection; live app bootstrap and route/profile paths were exercised indirectly through the installed webview.

Current live URL: `https://www.reddit.com/r/drawn_to_deliver_dev/?playtest=drawn-to-deliver`.

## Highest-value implementation backlog

1. Decide whether direct Redis diagnostics are worth adding for playtest-only proof.
2. Keep World Tour disabled until local launch quality is achieved.
