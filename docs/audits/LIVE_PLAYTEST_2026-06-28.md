# Live Playtest Validation - 2026-06-28

## Scope

Live Devvit validation follow-up after local bootstrap. No gameplay code, contracts, validation rules, scoring, persistence, or route generation were changed.

## Selected Task

Finish live Devvit playtest validation.

Reason: this is the current first real-world task in `docs/roadmaps/CURRENT_STATE_AND_NEXT.md` and must be resolved before platform-dependent feature confidence is meaningful.

Acceptance target:

- Devvit auth works.
- A unique app slug is confirmed.
- `npm run dev -- <small-test-subreddit>` installs/runs the game in a test subreddit.
- Context fields, Redis writes, custom post creation, and expanded-mode sizing are observed against the live platform.

## Commands Run

| Command                         | Result               | Evidence                                                                                                                                          |
| ------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx devvit --version`          | PASS                 | CLI returned `@devvit/cli/0.13.5 darwin-arm64 node-v22.22.2`.                                                                                     |
| `npx devvit whoami`             | BLOCKED              | CLI returned `Error: Not currently logged in. Try \`devvit login\` first`.                                                                        |
| `npm run login -- --copy-paste` | USER ACTION REQUIRED | CLI printed a Reddit OAuth URL and prompted: `Paste the code you got here and press Enter:`. The command was stopped before entering credentials. |

## 2026-06-28 Recheck

The live-platform blocker was rechecked from the repo root after local implementation work:

| Command                         | Result               | Evidence                                                                                                                                          |
| ------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx devvit --version`          | PASS                 | CLI returned `@devvit/cli/0.13.5 darwin-arm64 node-v22.22.2`.                                                                                     |
| `npx devvit whoami`             | BLOCKED              | CLI returned `Error: Not currently logged in. Try \`devvit login\` first`.                                                                        |
| `npm run login -- --copy-paste` | USER ACTION REQUIRED | CLI printed a Reddit OAuth URL and prompted: `Paste the code you got here and press Enter:`. The command was stopped before entering credentials. |

## Current Status

Reddit OAuth, developer account setup, app registration, upload, and default playtest subreddit creation are complete in this local shell. Live playtest is running for `drawn-to-deliver`.

Current verified identity:

```bash
npx devvit whoami
# Logged in as u/scubaxsteven
```

The configured app slug is currently:

```json
"name": "drawn-to-deliver"
```

The user chose `drawn-to-deliver` after `daily-dash` was taken.

## 2026-06-28 OAuth-Unblocked Recheck

| Command                  | Result | Evidence                                                                                                                     |
| ------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `npx devvit whoami`      | PASS   | CLI returned `Logged in as u/scubaxsteven`.                                                                                  |
| `npm run check`          | PASS   | Repository validation, contracts, art manifest, 17 tests, type-check, lint, and prettier all passed.                         |
| `npm run dev -- --help`  | PASS   | `devvit playtest [SUBREDDIT]` accepts an optional small test subreddit; if none is configured it creates `r/[app-name]_dev`. |
| `npx devvit list apps`   | PASS   | CLI fetched successfully and showed no app rows for this account.                                                            |
| `npx devvit apps --help` | N/A    | CLI returned `Command apps not found`; the supported command shape is `devvit list apps`.                                    |

Manual choice needed before initializing/uploading:

```bash
# choose app slug and small test subreddit, then continue with:
npm run check
npm run dev -- <small-test-subreddit>
```

If no subreddit is specified, `devvit playtest` may create a development subreddit using the app slug. Avoid doing this until the app slug is intentionally chosen.

Suggested slug options to choose from:

- `daily-dash-courier`
- `daily-dash-runner`
- `parcel-dash-devvit`

## 2026-06-29 Developer-Account Recheck

| Command             | Result               | Evidence                                                                                                                                                                                                                       |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npx devvit whoami` | PASS                 | CLI returned `Logged in as u/scubaxsteven`.                                                                                                                                                                                    |
| `npm run check`     | PASS                 | Repository validation, contracts, art manifest, 17 tests, type-check, lint, and prettier all passed.                                                                                                                           |
| `npm run dev`       | USER ACTION REQUIRED | Build completed, server/client rebuilds completed, then CLI printed `Please finish setting up your developer account before proceeding:` with `https://developers.reddit.com/create-account?cli=true` and an interactive menu. |

Manual step needed:

1. Open `https://developers.reddit.com/create-account?cli=true`.
2. Finish Reddit developer account setup for `u/scubaxsteven`.
3. Return to the repo and rerun:

```bash
npm run check
npm run dev
```

The playtest session was stopped at the interactive developer-account prompt before creating/installing a live app.

## 2026-06-29 App-Registration Recheck

| Command                       | Result               | Evidence                                                                                                                                                                              |
| ----------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx devvit whoami`           | PASS                 | CLI returned `Logged in as u/scubaxsteven`.                                                                                                                                           |
| `npm run check`               | PASS                 | Repository validation, contracts, art manifest, 17 tests, type-check, lint, and prettier all passed.                                                                                  |
| `npm run build`               | PASS                 | Build produced `dist/client/splash.html`, `dist/client/game.html`, and `dist/server/index.cjs`; Vite still warned about `sourcemapFileNames` and deprecated `inlineDynamicImports`.   |
| `npx devvit init`             | PASS/BLOCKED         | Before `npm run build`, init failed because built entry files were missing. After build, it returned `Your app was already initialized.`                                              |
| `npm run dev`                 | BLOCKED              | Build and rebuilds completed, then CLI returned `Error: Your app doesn't exist yet - you'll need to run 'npx devvit init' before you can playtest your app.`                          |
| `npx devvit upload --verbose` | USER ACTION REQUIRED | Build and verification completed, then CLI printed `Please open Reddit to continue:` with a `developers.reddit.com/new?...` app-registration URL and waited for a localhost callback. |

Manual step needed:

1. Run:

```bash
npx devvit upload --verbose
```

2. Complete the `developers.reddit.com/new?...` app-registration page that the CLI opens.
3. Let the CLI receive the localhost callback and finish upload.
4. Then rerun:

```bash
npm run dev
```

The upload session was stopped after waiting at the app-registration callback prompt. No playtest app was installed.

## 2026-06-29 Upload and Playtest Recheck

| Command                       | Result | Evidence                                                                                                                                                                |
| ----------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx devvit list apps`        | PASS   | CLI listed `drawn-to-deliver` with 0 installs after the browser registration flow.                                                                                      |
| `devvit.json` slug update     | PASS   | Local config changed from `daily-dash` to `drawn-to-deliver`.                                                                                                           |
| `npm run check`               | PASS   | Repository validation, contracts, art manifest, 17 tests, type-check, lint, and prettier all passed with the new slug.                                                  |
| `npx devvit upload --verbose` | PASS   | Uploaded version `0.0.1`, uploaded 16 WebView assets, installed the app to the default playtest subreddit, and created `https://www.reddit.com/r/drawn_to_deliver_dev`. |
| `npm run dev`                 | PASS   | Playtest became ready at `https://www.reddit.com/r/drawn_to_deliver_dev/?playtest=drawn-to-deliver` with version `v0.0.1.2`.                                            |

Live playtest URL:

```text
https://www.reddit.com/r/drawn_to_deliver_dev/?playtest=drawn-to-deliver
```

## Still Unproven

- Direct raw Redis key inspection. The current Devvit CLI exposes `logs`,
  `list installs`, `view`, settings, upload, and playtest commands, but no Redis
  inspection command.

## 2026-06-29 Live Runtime Recheck

| Check                          | Result            | Evidence                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`                  | PASS              | Playtest uploaded 2 changed WebView assets, updated the installed app, and became ready at `https://www.reddit.com/r/drawn_to_deliver_dev/?playtest=drawn-to-deliver` with version `v0.0.1.6`.                                                                                                                                                                           |
| Desktop Chrome playtest page   | PASS              | Reddit loaded `r/drawn_to_deliver_dev` and rendered the custom Devvit post `Daily Dash · 2026-06-29 · Build today, ride forever`.                                                                                                                                                                                                                                        |
| Custom post creation           | PASS              | The subreddit feed contains an app-authored post by `drawn-to-deliver`; the inline splash rendered `Daily Dash`, `3 lanes`, `8 tiles`, `1 safe path guaranteed`, and `Open today’s route`.                                                                                                                                                                               |
| Expanded mode                  | PASS              | Clicking `Open today’s route` opened Reddit's Devvit modal for the post. Chrome prompted for Reddit app/service access; after allowing it, the modal stayed open.                                                                                                                                                                                                        |
| Mobile webview behavior        | PASS              | The Devvit modal defaulted to the `Mobile` viewport and rendered the Phaser game menu inside the webview.                                                                                                                                                                                                                                                                |
| Runtime context fields         | PASS              | The webview URL used versioned host `drawn-to-deliver-...-0-0-1-6-webview.devvit.net/game.html` and its Reddit-issued token included app slug/name `drawn-to-deliver`, version `0.0.1.6`, post id `t3_1uitevw`, subreddit `drawn_to_deliver_dev`, and user `scubaxsteven`. Token body was observed in browser accessibility output and is intentionally not copied here. |
| Devvit CLI connection log      | PASS              | While the modal was open, `npm run dev` printed that the Reddit playtest URL connected.                                                                                                                                                                                                                                                                                  |
| Install state                  | PASS              | `npx devvit list installs drawn_to_deliver_dev` listed `drawn-to-deliver (v0.0.1.6)` and `Devvit Admin Helper App (v0.0.1)`.                                                                                                                                                                                                                                             |
| App ownership/version state    | PASS              | `npx devvit view drawn-to-deliver --json` reported slug/name `drawn-to-deliver`, owner `scubaxsteven`, install count `1`, versions count `7`, and default playtest subreddit id `t5_iplodv`.                                                                                                                                                                             |
| Automated headless Reddit load | BLOCKED BY REDDIT | Playwright with system Chrome received Reddit network-security block text. Desktop Chrome with the user's normal profile succeeded.                                                                                                                                                                                                                                      |

Redis persistence status: indirectly exercised. The live post and webview loaded
through the real Devvit installation, and the app routes that render the menu
call `ensureDailyRoute`/profile bootstrap against `tenantStore`. However, because
the CLI has no raw Redis inspection command, raw key/value proof is still not
available without adding a temporary diagnostic endpoint or relying on further
UI-driven state changes.

## Next Recommended Task

Add a short-lived, moderator-only diagnostics route or debug UI for local
playtest builds if direct Redis key/value proof is required. Otherwise proceed
with gameplay iteration; platform bootstrap is live-proven enough for ordinary
development.
