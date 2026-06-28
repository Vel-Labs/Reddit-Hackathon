# Local Verification

## Without Devvit credentials

```bash
npm install
npm run validate:repo
npm run validate:contracts
npm run validate:art
npm run test:logic
npm run type-check
```

## With Devvit

```bash
npm run login
npm run dev
```

Verify:

1. Inline card expands to game.
2. Anonymous mode can practice but cannot publish/rank.
3. Authenticated Builder publishes once and can replace same-day tile.
4. Reload preserves route/profile.
5. Scheduler/menu creates only one post per date.
6. Another account completes route and crossing count increments.
7. Author deletion repairs the route revision.

## Shared-only smoke test

The pure shared project can be compiled independently:

```bash
npx tsc -p tools/tsconfig.shared.json
```
