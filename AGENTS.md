# Agent Operating Guide — Daily Dash

You are working on a Devvit Web application executed inside Reddit.

## Product truth

Daily Dash lets subreddit communities build constrained three-lane course tiles. The shared validator must certify a zero-damage path from every entrance lane. A deterministic compiler combines certified tiles into finite evergreen routes. The runner moves horizontally automatically; the player changes lanes with Up/Down and may lose three package-integrity pips.

Read in this order:

1. `REPO_PROFILE.json`
2. `contracts/gameplay-rules.md`
3. `docs/project/PROJECT_BRIEF.md`
4. the roadmap for the assigned stream
5. relevant source/tests only

## Runtime stack

- Client: Phaser + Vite in an iframe/webview.
- Server: Devvit Node.js 22 serverless runtime + Hono.
- Persistence: Devvit Redis, scoped per subreddit installation.
- Shared: pure TypeScript under `src/shared`.

## Boundaries

- `src/shared/game/` is the canonical deterministic rule layer. It must not import Phaser, Hono, Devvit, DOM, or Node-only modules.
- The server never trusts client-supplied user, tenant, status, score, metrics, or publication identity.
- The client may provide responsive feedback, but the server reruns tile certification.
- World Tour is optional and disabled. Never simulate global Redis by inventing shared keys.
- Art roles are semantic and replaceable. Gameplay cannot depend on a Kenney filename.
- Do not add free text, uploads, or arbitrary drawing to the Builder without a moderation redesign.

## Devvit rules inherited from the official starter

- Use `requestExpandedMode` for expanded gameplay and `navigateTo` for navigation.
- Keep `splash.html` lightweight; do not import Phaser there.
- Server code lives under `src/server` and accesses context/Redis/Reddit APIs there.
- Client code lives under `src/client` and cannot access server secrets.
- Shared code lives under `src/shared`.
- Do not use legacy Blocks or `@devvit/public-api` patterns in this Devvit Web app.
- Register every internal endpoint in `devvit.json` when the platform requires a menu, trigger, form, or scheduler declaration.

## TypeScript style

- Strict types and named exports.
- Prefer type aliases.
- Avoid type assertions except at validated boundaries.
- Never silence a validator/test to make generated content pass.
- Keep deterministic randomness seed-driven.
- Preserve exact optional-property semantics.

## Required checks

For shared gameplay changes:

```bash
npm run test:logic
npm run type-check
```

For repository or contract changes:

```bash
npm run validate:repo
npm run validate:contracts
```

For art-path changes:

```bash
npm run validate:art
```

Before handoff, run `npm run check` when dependencies and Devvit tooling are available.

## Change evidence

Update:

- `DECISIONS.md` for durable design decisions;
- `CHANGELOG.md` for user/developer-visible changes;
- the appropriate roadmap status/acceptance criteria;
- tests for canonical logic;
- contracts before changing data or gameplay invariants.

## Do not overbuild

Launch priorities are: fair Builder, fun Runner, reliable tenant persistence, visible creator consequence, mobile polish. Jumping, live multiplayer, payments, true infinite mode, and World Tour are not MVP dependencies.
