# Verification Record — 2026-06-25

## Environment

- Node.js: 22.16.0
- npm: 10.9.2
- Devvit CLI: 0.13.5
- Dependencies installed from `package-lock.json` generation.

## Passed

```text
npm run validate:repo       PASS
npm run validate:contracts  PASS (3 schemas)
npm run validate:art        PASS (vector-fallback mode)
npm run test                PASS (4 files, 9 tests)
npm run type-check          PASS
npm run lint                PASS
npm run prettier:check      PASS
npm run build               PASS
```

The Vite build emitted upstream/dependency warnings about `sourcemapFileNames` and deprecated `inlineDynamicImports`, but completed successfully.

## Logic exercised

- neutral tile acceptance;
- connector corruption rejection;
- forced-damage wall rejection;
- deterministic tenant/date generation;
- whole-route clean completion from founding tiles;
- scoring and medal thresholds;
- clean-run advantage;
- achievement unlock idempotence.

## Devvit playtest smoke result

`devvit playtest` successfully started its build watcher and completed both server and client rebuilds. It then opened the expected Reddit OAuth authorization flow; the process was stopped because this environment cannot complete the user-controlled browser login.

## Not proven in this environment

- completed Devvit authentication and app initialization;
- live `devvit playtest` inside a Reddit post;
- Redis behavior against a real installation;
- scheduler delivery and custom-post creation;
- mobile Reddit app/webview rendering;
- Kenney binary asset integration;
- shared World Catalog, which is intentionally disabled.

These external checks are listed in `docs/testing/LOCAL_VERIFICATION.md` and the hackathon roadmap.
