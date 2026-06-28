# Kenney Runtime Assets

The repository intentionally ships without third-party binary art. The Phaser prototype renders a complete vector fallback, so the game works before art import.

Copy selected, license-verified Kenney assets here using the layout in `docs/art/KENNEY_IMPORT_GUIDE.md`, then update `assets/kenney-manifest.json`. Do not copy the entire All-in-1 bundle into the client build. The target is 30–60 runtime sprites plus compressed audio, not thousands of unused files.
