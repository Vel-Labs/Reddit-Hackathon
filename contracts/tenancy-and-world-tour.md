# Tenancy and World Tour Contract

## Tenant boundary

A Devvit installation in one subreddit is a tenant. Its Redis data, moderation decisions, routes, profiles, and leaderboards are local to that installation. The local route is always the default experience.

## World Tour boundary

World Tour is optional and disabled by default. Enabling it requires:

- a shared HTTPS service approved in Devvit configuration;
- an explicit moderator opt-in per source tenant;
- a publishable route snapshot stripped to the minimum required game data;
- source community identity and revision attached to every route;
- removal propagation when a source tile or route is deleted;
- abuse reporting that routes back to both the source installation and shared service;
- privacy policy, retention policy, rate limits, and operational ownership.

The local server uses a `WorldCatalog` adapter. The shipped adapter is a no-op. The rest of the game must continue to work when it is disabled or unavailable.
