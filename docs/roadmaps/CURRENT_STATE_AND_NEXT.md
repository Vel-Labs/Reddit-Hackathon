# Current State and Next

## Implemented scaffold

- Runnable Devvit/Phaser repository shape.
- Complete vector-fallback Builder and Runner vertical slice.
- Shared tile validator, route generator, founding tiles, scoring, achievements.
- Tenant-local Redis/server architecture.
- Scheduled route/post endpoints.
- Roadbook shuffle endpoint and menu action with local fallback.
- Deletion/recompile path.
- Detailed product roadmaps and governance.
- Passing local test/type/lint/build gates.
- Environment bootstrap reverified on 2026-06-28: `npm run check` passes, Devvit MCP is registered in Codex, and `npm run dev` reaches Reddit OAuth after successful server/client rebuilds.

## First real-world task

Choose a unique Devvit app name, complete Reddit OAuth, and run the game in a playtest subreddit. Validate context fields, Redis writes, custom post creation, and expanded-mode sizing against the live platform.

## Highest-value implementation backlog

1. Add Builder undo/redo and safe-path overlay.
2. Implement reaction-margin fairness, not only graph reachability.
3. Replace per-frame transient labels with pooled renderer objects.
4. Add Roadbook route-list scene and leaderboard panel.
5. Namespace leaderboards by route revision.
6. Add report/moderator removal UI.
7. Submit lane-input event replay for server-authoritative run validation.
8. Import one curated Kenney biome.
9. Add creator outcome card and path-choice analytics.
10. Keep World Tour disabled until local launch quality is achieved.
