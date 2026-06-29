# Moderation and Safety Roadmap

## Reduced-risk UGC model

Builders can only place predefined terrain and feature tokens in a 3×18 grid. There is no text, image upload, arbitrary color, URL, chat, or freehand raster. This materially reduces abuse but does not remove the need for deletion, reporting, attribution, and moderator control.

## Required controls

### Player

- Remove my tile.
- Report route/tile with structured reason codes.
- See source community and route revision in Roadbook.
- Understand whether a tile may enter World Tour.

### Moderator

- Remove or quarantine tile.
- Exclude author from Builder submissions if necessary.
- Recompile affected routes.
- Disable World Tour publication.
- Review recent featured tiles and reports.

### Operator

- Remove shared catalog route.
- propagate source deletion;
- audit publication/removal requests;
- rate-limit abusive installations;
- keep no more user-linked data than required.

## Content lifecycle

A user deletion marks content removed and prevents future render. Route recipes are rebuilt with system fallback. Do not preserve the original geometry inside an immutable baked image or external archive after deletion.

## Cheating and abuse

- Server rewrites identity/tenant/status.
- Server reruns tile validation.
- One daily active submission.
- Run tokens are single-use and expiring.
- Leaderboard stores best run per user.
- Future server replay derives outcomes rather than trusting client counters.

## Safety UX

Reports should be accessible from route info rather than during high-speed play. Confirmation explains what will happen and avoids public accusation. Creator attribution can be hidden on removed/quarantined content.

## Current scaffold status

- Roadbook exposes a tile review panel with source, route revision, fixed report reason choices, report submission, and a removal action.
- Reports are stored as structured Redis records; there is still no free text, upload, custom drawing, URL, or chat surface.
- Tile removal marks content removed, actions open reports for that tile, and triggers route repair.
- Moderator authorization uses Devvit moderator lookup when available and fails closed until live OAuth/playtest verifies the platform permission behavior.

## Launch gate

Do not enable cross-community World Tour until source removal and report propagation have been exercised end to end.
