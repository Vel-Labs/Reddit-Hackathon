---
name: devvit-phaser
description: Make a scoped change to the Daily Dash Devvit Web and Phaser application without crossing client/server/shared boundaries.
license: BSD-3-Clause
---

1. Read `AGENTS.md`, `REPO_PROFILE.json`, and the relevant contract.
2. Put deterministic rules in `src/shared`; rendering in `src/client`; identity/storage in `src/server`.
3. Keep the inline entrypoint lightweight.
4. Update tests and roadmaps with behavior.
5. Run `npm run check` or document which unavailable external step blocked it.
