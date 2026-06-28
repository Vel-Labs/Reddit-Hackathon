# Environment Bootstrap - 2026-06-28

## Scope

Environment and platform bootstrap only. No gameplay rules, validator behavior, scoring, route generation, World Tour, payments, uploads, free text, or jumping mechanics were changed.

## Tool Versions

- OS: macOS 26.4, Darwin 25.4.0, arm64
- Node.js: v22.22.2
- npm: 10.9.7
- Git: 2.54.0
- Devvit CLI: `@devvit/cli/0.13.5 darwin-arm64 node-v22.22.2`
- Repo root: `/Users/steven/Workspace/40_Code/hackathons/daily-dash-devvit-hackathon`
- Git branch/status before docs: `main...origin/main`, changed `package-lock.json`

Node satisfies `package.json` engine `>=22.2.0`.

## Dependency Install

| Command                                                           | Result      | Notes                                                                                                                                                    |
| ----------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci --dry-run --ignore-scripts`                               | PASS        | Lockfile present and install plan resolved.                                                                                                              |
| `npm ci`                                                          | INTERRUPTED | Hung while fetching tarballs from lockfile-pinned internal Artifactory URLs.                                                                             |
| `npm ci --foreground-scripts`                                     | INTERRUPTED | Same hang; no project lifecycle failure surfaced.                                                                                                        |
| `npm ci --ignore-scripts --no-audit --no-fund --loglevel=verbose` | INTERRUPTED | Exposed repeated `ETIMEDOUT` fetches from `packages.applied-caas-gateway1.internal.api.openai.org`.                                                      |
| lockfile URL rewrite                                              | APPLIED     | Replaced internal `.../artifactory/api/npm/npm-public/` resolved URL prefix with `https://registry.npmjs.org/`; versions and integrity hashes unchanged. |
| `npm ci`                                                          | PASS        | Added 556 packages in 5s. npm reported 35 audit findings: 2 low, 29 moderate, 4 high. No dependency versions were changed.                               |

## Local Checks

| Command                      | Result | Evidence                                          |
| ---------------------------- | ------ | ------------------------------------------------- |
| `npm run validate:repo`      | PASS   | `Repository shape valid (14 required artifacts).` |
| `npm run validate:contracts` | PASS   | `Contracts valid (3 schemas).`                    |
| `npm run validate:art`       | PASS   | `Art manifest valid in vector-fallback mode.`     |
| `npm run test`               | PASS   | 4 files, 9 tests passed.                          |
| `npm run type-check`         | PASS   | `tsc --build` exited 0.                           |
| `npm run lint`               | PASS   | ESLint exited 0.                                  |
| `npm run prettier:check`     | PASS   | `All matched files use Prettier code style!`      |
| `npm run build`              | PASS   | Build completed in 456ms.                         |
| `npm run check`              | PASS   | Aggregate repo gate passed.                       |

Build warnings:

- Vite/Devvit output warning: invalid `sourcemapFileNames` output option.
- Devvit build warning: `inlineDynamicImports` is deprecated; use `codeSplitting: false` instead.

These warnings match the earlier verification record and did not fail the build.

## MCP Status

Command used:

```bash
codex mcp add devvit -- npx -y @devvit/mcp
codex mcp --help
codex mcp list
codex mcp get devvit
```

Result: PASS.

`codex mcp list` and `codex mcp get devvit` show:

```text
devvit
  enabled: true
  transport: stdio
  command: npx
  args: -y @devvit/mcp
```

The MCP server was added globally through Codex, so no project-local `.codex/config.toml` fallback was needed.

## Devvit CLI Status

| Command                   | Result                  | Notes                                                                                                               |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run login -- --help` | PASS                    | Help displayed for `devvit login`; browser OAuth is required for actual login.                                      |
| `npm run dev -- --help`   | PASS                    | Help displayed for `devvit playtest`; optional `SUBREDDIT` argument documented.                                     |
| `npx devvit --version`    | PASS                    | `@devvit/cli/0.13.5 darwin-arm64 node-v22.22.2`.                                                                    |
| `npm run dev`             | BLOCKED ON MANUAL OAUTH | Build started, server/client rebuilds completed, then CLI prompted for Reddit authorization. Process stopped there. |

`npm run dev` output reached:

```text
Press enter to open Reddit to complete authentication:
https://www.reddit.com/api/v1/authorize?...
Build complete
Server rebuild complete
Client rebuild complete
```

Manual step needed: run `npm run login` or `npm run dev`, press Enter at the Reddit authorization prompt, complete OAuth in the browser, then return to the terminal.

## Devvit App Name

`devvit.json` currently uses:

```json
"name": "daily-dash"
```

This is a generic slug and may not be globally available for Devvit. Do not silently make it the final production identity. Candidate slugs to choose from:

- `daily-dash-steven`
- `daily-dash-builder`
- `daily-dash-delivery`

After choosing a slug, update `devvit.json` deliberately and rerun the local gates plus `npm run dev`.

## Exact Blockers

1. Reddit OAuth has not been completed in this environment.
2. A unique Devvit app slug has not been confirmed by the project owner.
3. A playtest subreddit has not been selected or verified.
4. Live Devvit behavior remains unproven: app initialization, installation, Redis writes, custom post creation, scheduler/menu behavior, expanded-mode rendering, and mobile webview rendering.

## Next Recommended Task

Choose the Devvit app slug and test subreddit, complete `devvit login`, then rerun:

```bash
npm run check
npm run dev -- <small-test-subreddit>
```

Stop at any Devvit prompt for app initialization or slug conflict, record the exact CLI output, and only then update `devvit.json` with the chosen production/test identity.
