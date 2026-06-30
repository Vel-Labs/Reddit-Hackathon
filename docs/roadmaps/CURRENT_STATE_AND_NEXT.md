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
- Runner first-run UI now shows clearer lane controls, large package-integrity pips, event-specific damage/reward feedback, and a compact object legend.
- Runner accepts playfield-wide vertical swipe and tap-a-lane input for lane changes; the previous right-side movement rail was removed after mobile dogfooding.
- Bounded routes show remaining distance and an in-course finish marker so Daily/Roadbook runs do not read as endless generation.
- Builder post-publish flow now offers `Test My Tile`, `Ride Today`, `Try Yesterday`, and `Roadbook`; `Test My Tile` uses preview mode and stays practice-only.
- Builder repair flow now includes `ERASE FIX` for the currently highlighted validator issue.
- Runner route rendering now uses semantic Kenney textures for road, crate, boost, and collectible roles when available, with vector fallback preserved.
- Runner HUD now shows route date, revision, average difficulty, and community-authored percentage.
- Creator postcard entries now label featured status and clean-clear rate.
- Scoring calibration local sweep on 2026-06-29 left thresholds unchanged: clean no-reward founding-route runs land at Bronze, partial rewards at Silver, and full rewards can reach Gold.
- Detailed product roadmaps and governance.
- Passing local test/type/lint/build gates.
- Environment bootstrap reverified on 2026-06-29: `npm run check` passes, Devvit MCP is registered in Codex, Devvit CLI auth works as `u/scubaxsteven`, `npx devvit upload --verbose` uploaded `drawn-to-deliver` v0.0.1, and `npm run dev` started playtest version `v0.0.1.6`.
- Live Reddit proof on 2026-06-29 confirmed the app-installed subreddit, app-authored custom post, inline splash, expanded Devvit modal, mobile webview rendering, and runtime context fields for app/post/subreddit/user.

## First real-world task

Direct Redis key/value inspection remains the only unproven platform detail. Devvit CLI does not expose raw Redis inspection; live app bootstrap and route/profile paths were exercised indirectly through the installed webview.

Current live URL: `https://www.reddit.com/r/drawn_to_deliver_dev/?playtest=drawn-to-deliver`.

## Highest-value implementation backlog

1. **Live persistence proof through behavior.** Prove Redis persistence through user-visible flows rather than a raw diagnostics panel: publish a tile, reload, see it in Creator/Roadbook or tomorrow’s route candidate pool. Only add diagnostics if behavior proof becomes insufficient. Current status: live/manual QA pending.
2. **Moderation/reporting QA.** Exercise report/remove flows in the live subreddit with moderator account context. Confirm system fallback, route repair, and revision behavior are legible. Current status: live/moderator QA pending.
3. **Device matrix.** Test desktop Chrome, Devvit mobile viewport, and real mobile Reddit if available. Check text fit, canvas framing, expanded-mode sizing, and overlapping controls. Current status: local build passes; real mobile dogfood found and removed the inaccessible side movement rail, but fresh live-device QA is still needed after redeploy.
4. **Free Drive concept.** Consider a deliberately generative unranked practice mode only after bounded Daily/Roadbook route completion reads clearly. Do not mix Free Drive with ranked route revisions or leaderboards.
5. **Submission packaging.** Update Devpost-ready materials: tagline, description, rules compliance, public post link, app listing link, README proof, and optional short demo script/video. Current status: blocked until live persistence/moderation/device proof is refreshed after this gameplay pass.
6. **World Tour remains disabled.** Keep World Tour as documented adapter/future scope until local launch quality is solid.
