# Repository Boundaries

| Area            | May import                            | Must not import                            |
| --------------- | ------------------------------------- | ------------------------------------------ |
| `src/shared`    | other shared modules                  | Phaser, DOM, Hono, Devvit, Node-only APIs  |
| `src/client`    | shared, Phaser, Devvit web client     | server modules, Redis, secrets             |
| `src/server`    | shared, Hono, Devvit web server, Node | Phaser scenes, browser DOM                 |
| `contracts`     | none                                  | implementation-specific hidden assumptions |
| `tests/shared`  | shared                                | live Reddit/Redis                          |
| `public/assets` | runtime static files                  | source archives, credentials               |

Cross-boundary types belong in `src/shared/api.ts` or `src/shared/game/types.ts`.
