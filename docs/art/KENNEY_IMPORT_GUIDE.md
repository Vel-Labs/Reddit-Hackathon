# Kenney Import Guide

## Intent

Use a small curated selection from the user’s licensed/CC0 Kenney collection to replace semantic vector roles. The game should still look like Daily Dash: parcel-postcard paper, ink outlines, one palette, and community-built roads.

## Suggested source shortlist

Start by reviewing:

- Platformer Pack Redux or New Platformer Pack for terrain, vegetation, bridges, crates, signs, and backgrounds.
- UI Pack: Adventure for panels/buttons/icons.
- Racing Pack only for compatible barriers, road props, or vehicle parts.
- Toon Characters 1 only if a courier character fits the scale and art direction.

Choose one primary visual family. Mixing several packs without treatment will look like an asset compilation.

## Folder layout

```text
public/assets/kenney/
  atlases/
    meadow.png
    meadow.json
    ui.png
    ui.json
  audio/
    certify.ogg
    impact.ogg
    boost.ogg
    finish.ogg
  textures/
    paper-noise.png
```

## Semantic mapping

Edit `assets/kenney-manifest.json`:

```json
{
  "version": 1,
  "mode": "kenney",
  "packs": [
    {
      "name": "Platformer Pack Redux",
      "license": "CC0",
      "licenseFile": "docs/art/licenses/platformer-redux.txt"
    }
  ],
  "requiredRoles": ["courier-body", "parcel"],
  "mappings": {
    "courier-body": "atlases/meadow.json#courier_orange",
    "parcel": "atlases/meadow.json#parcel_gold"
  }
}
```

The current validator checks path mappings for plain files; atlas-frame validation should be added when the loader is implemented.

## Processing rules

- Preserve source pixels/aspect ratio.
- Normalize outline weight with a shader/tint or pre-processing pass only where licensing permits.
- Add cut-paper shadow consistently in runtime, not per sprite.
- Keep hazards recognizable by silhouette.
- Remove unused transparent padding.
- Prefer WebP/optimized PNG where compatible.
- Keep source archives outside the shipped repo.

## Attribution/license record

Even when attribution is not required, record source pack, source page, download date, and included license file. Do not use the Kenney logo as the game’s logo.
