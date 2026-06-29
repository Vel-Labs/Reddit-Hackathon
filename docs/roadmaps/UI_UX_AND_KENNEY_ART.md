# UI/UX and Kenney Art Roadmap

## Art thesis

Daily Dash should look like a **handmade parcel-postcard arcade game**, not an untouched asset pack. Community-authored logic is rustic and grid-based; Kenney assets provide readable props and production value; a shared paper, ink, stamp, and cutout treatment makes them one identity.

The repository began in vector-fallback mode. A small CC0 Kenney Platformer Pack Redux meadow subset is now imported and preloaded behind semantic roles. Art replacement must never change collision, fairness, or tile serialization.

## Recommended Kenney source packs

Use only the subset that supports one coherent biome. Candidate roles:

- **Platformer Pack Redux / New Platformer Pack:** ground edges, bridges, crates, signs, vegetation, background pieces.
- **Racing Pack:** road props, barriers, cones, vehicle components where stylistically compatible.
- **UI Pack: Adventure:** panels, buttons, icons, progress frames.
- **Toon Characters 1:** optional courier base if it matches scale; otherwise make one custom courier from simple shapes.

Every imported pack must retain its included license information in an internal `THIRD_PARTY_ASSETS.md`. Do not use the Kenney logo as Daily Dash branding. Do not ship the All-in-1 archive or thousands of unused files.

## Visual language

### Materials

- Warm paper background.
- Dark blue-gray “ink” outlines.
- Soft cut-paper drop shadows.
- Slight texture overlay at low opacity.
- Stamped parcel and achievement marks.
- Road surfaces look assembled, not photorealistic.

### Core palette

| Token            | Use                    |
| ---------------- | ---------------------- |
| Ink `#243642`    | outlines, primary text |
| Paper `#FFF7DF`  | panels, cards          |
| Sky `#AEDFD8`    | main backdrop          |
| Road `#8F5B3A`   | traversable surface    |
| Orange `#EF8C4B` | primary action/courier |
| Green `#72BF9B`  | boost/certified/safe   |
| Red `#E05D4F`    | obstacle/damage        |
| Gold `#F2BF56`   | parcels/achievement    |

Biome palettes may remap scenery but must preserve hazard semantics.

## Asset-role manifest

Runtime code should request semantic roles, not raw filenames:

```json
{
  "courier-body": "characters/courier_orange.png",
  "parcel": "items/parcel_gold.png",
  "road-surface": "terrain/road_dirt_mid.png",
  "obstacle-crate": "props/crate_red.png",
  "boost-marker": "effects/boost_green.png",
  "collectible-stamp": "items/stamp_gold.png",
  "background-far": "backgrounds/meadow_far.png",
  "background-near": "backgrounds/meadow_near.png",
  "ui-panel": "ui/panel_paper.png",
  "ui-button": "ui/button_orange.png"
}
```

`assets/kenney-manifest.json` is the canonical mapping. Missing mappings fall back to vector graphics. The manifest validator prevents silent broken paths.

Current imported roles:

- `road-surface`
- `obstacle-crate`
- `boost-marker`
- `collectible-stamp`
- `background-far`
- `background-near`

Courier, parcel, and UI roles still use vector fallback until a matching source family is selected.

## Runtime asset budget

Target for the demo:

- 30–60 sprite files.
- One atlas per category when practical.
- One or two fonts; system fallback available.
- Six to ten short sound effects.
- One lightweight music loop at most.
- Compressed initial inline view below the expanded game dependency graph.

The splash entrypoint must not import Phaser or the full art atlas. It should load a tiny CSS illustration and request expanded mode on tap.

## Screen architecture

### Inline feed card

Purpose: explain the hook before expansion.

Content hierarchy:

1. Daily Dash logo.
2. “Build today. Ride forever.”
3. Today’s route status and community-authored percentage.
4. Primary button: Ride route.
5. Secondary cue: Build one tile.

No scrolling, hover dependency, tiny text, or complex gesture.

### Main menu

Left: title, tenant identity, daily status, buttons.
Right: animated miniature three-lane diorama showing obstacle, boost, parcel, and courier.

Primary actions:

- Ride today’s route.
- Build a course tile.
- Roadbook/Shuffle.
- Achievements.

World Tour is hidden when adapter disabled, not shown as a broken promise.

### Builder

- Top: title, concise rule sentence, budget.
- Center: full 3×18 tile; connector zones visibly bound.
- Bottom: five large tool buttons, undo/redo, certify, test, publish.
- Validation message adjacent to grid, not in a blocking modal.
- Safe path rendered as green road-stamp dots or a translucent ribbon.
- Error cells pulse once and retain an icon until fixed.

### Runner

- Courier left of center for reaction lookahead.
- HUD top: route, progress, package pips, parcels.
- Touch control zones at right, but visual indicators fade after first successful switches.
- Tile author sign at seam.
- Boost uses particles and audio, not excessive camera zoom.
- Damage produces one brief shake unless reduced-motion is active.

### Result postcard

- Completion/failure headline.
- Medal stamp animation.
- Score breakdown.
- Community-authored fraction.
- Best next action: replay, improve medal, or return to Builder.
- Newly unlocked achievement appears here, not as an unrelated dashboard interruption.

### Roadbook

- Weekly postcard chapters rather than an infinite undifferentiated list.
- Each route card: date, biome, medal, best score, author count, revision.
- Filters: unplayed, medal missing, community favorites later.

### Creator outcome

A separate postcard when a submitted tile is selected:

- route preview thumbnail;
- section number;
- crossings;
- clean-clear rate;
- path choice split;
- share/comment prompt that does not fabricate Reddit actions.

The first-pass Creator postcard is available from the main menu and lists featured route sections, crossing count, clean crossing count, and top/middle/bottom lane-choice split. Route thumbnails and share prompts remain polish.

## Motion system

- 120–180 ms for button and tool feedback.
- 210 ms lane change.
- 300–450 ms card transitions.
- 600–900 ms medal or certification stamp.
- Parallax limited to two layers.
- All motion has a reduced setting; gameplay timing never depends on decorative animation.

The signature reveal can animate the logical grid into a dressed route: pencil cells appear, road tiles stamp into place, props rise, and the courier enters. Use it once per new route, then permit skip.

## Audio identity

- Pencil/chalk tick while painting.
- Rubber stamp for certification and achievements.
- Parcel bell at start/finish.
- Soft crate impact.
- Paper tear for package damage.
- Wind/whistle for boost.
- Short route-complete jingle.

Audio must start only after user interaction, expose mute immediately, and never be required for information.

## Responsive rules

Reference canvas: 1280×720, scaled with `FIT`.

- Keep interactive content inside a 1,200×650 safe frame.
- On very narrow mobile, touch zones remain at least 22% of width.
- Builder cells must remain comfortably tappable; if needed, allow horizontal page-free camera pan within the Phaser canvas rather than browser scrolling.
- Respect device safe areas in CSS.
- Never depend on hover.

## Import workflow

1. Choose one pack family and inspect its included license. Completed for Kenney Platformer Pack Redux.
2. Copy only selected source files into a staging folder outside `public/`. Completed for a six-file meadow subset.
3. Rename to semantic snake-case names. Completed.
4. Normalize scale and pivot assumptions. Deferred until sprites replace vector rendering in-scene.
5. Pack sprites or copy optimized PNGs into `public/assets/kenney/`. Completed with plain PNGs.
6. Update `assets/kenney-manifest.json` and set mode to `kenney`. Completed.
7. Run `npm run validate:art`. Passing.
8. Test fallback by temporarily removing a mapping. Still pending.
9. Record pack, source URL, version/date, and license in third-party documentation. Completed in `docs/art/THIRD_PARTY_ASSETS.md`.

## Definition of done

- The game is visually coherent with only 30–60 imported sprites.
- No raw Kenney logo or default sample-screen composition appears.
- Inline view loads without Phaser/art atlas.
- Every hazard remains legible in grayscale and at phone scale.
- Vector fallback can run the complete game.
- Art replacement does not change a single validator or gameplay test.
