# QA and Fairness Roadmap

## Test pyramid

### Pure unit tests

- cell costs and object caps;
- connector protection;
- zero-damage route solver;
- entry lane coverage;
- deterministic generation;
- scoring and medals;
- streak and achievement idempotence;
- route repair semantics.

### Property/fuzz tests

Generate thousands of random 3×18 grids and assert:

- validator never crashes;
- every certified tile has minimum damage zero;
- every certified tile has all entry lanes covered;
- generator only emits certified whole routes;
- serialization round-trip preserves solution;
- removed/unknown features fail closed.

### Integration tests

Use an in-memory tenant-store adapter to test:

- first bootstrap cold start;
- one daily submission and replacement;
- daily compilation;
- route feature stats once;
- run token consumption;
- leaderboard personal best;
- deletion and route revision.

### Device/playtest matrix

- Reddit web desktop: Chrome, Firefox, Safari.
- Reddit mobile web/app webview on narrow Android and iPhone dimensions.
- Mouse, keyboard, touch.
- Slow network and failed API.
- anonymous practice and authenticated ranked mode.
- reduced motion and mute.

## Fairness metrics

A tile is mathematically valid but may still be unpleasant. Collect:

- clean-clear rate;
- damage by cell/lane;
- lane-choice distribution;
- time from obstacle reveal to input;
- abandonment at tile;
- repeated attempts;
- path balance;
- boost conversion.

Flag rather than automatically delete:

- clean-clear rate below threshold after minimum sample;
- one cell causing disproportionate failures;
- route choice over 95/5 despite advertised fork;
- abnormal run timings;
- author repeatedly producing borderline tiles.

## Playability gates

- Minimum lookahead remains constant at all boosts.
- Lane tween completes before another forced switch.
- No obstacle can damage multiple times during one invulnerability window.
- Gaps always recover to a valid lane.
- Tile seams reset transient state.
- Route result uses the same revision the run began on.

## Performance budgets

- Inline entry excludes Phaser.
- Expanded first interactive target under a few seconds on a typical mobile connection.
- Route render uses pooled or redrawn objects; avoid creating persistent text labels every frame.
- No entire Kenney bundle in build.
- API payloads comfortably below platform request limits.
- Server endpoint work remains bounded; scheduled maintenance batches large work.

## Current scaffold caveats

- Runner rendering is a functional vector prototype, not optimized pooling.
- Result submission trusts summary statistics after timing checks; server-side input replay is still required for hardened competition.
- Route leaderboard is not yet namespaced by revision.
- Reaction-margin analysis is documented but not implemented.

These are explicit launch tasks, not hidden assumptions.
