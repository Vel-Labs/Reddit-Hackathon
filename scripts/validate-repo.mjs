import { access, readFile } from 'node:fs/promises';

const required = [
  'README.md',
  'AGENTS.md',
  'devvit.json',
  'src/client/game.ts',
  'src/server/index.ts',
  'src/shared/game/validator.ts',
  'contracts/gameplay-rules.md',
  'docs/roadmaps/README.md',
  'docs/roadmaps/GAMEPLAY_LOOP_A_BUILDER.md',
  'docs/roadmaps/GAMEPLAY_LOOP_B_EVERGREEN.md',
  'docs/roadmaps/UI_UX_AND_KENNEY_ART.md',
  'docs/roadmaps/ACHIEVEMENTS.md',
  'docs/roadmaps/DATA_AND_LEVEL_PIPELINE.md',
  'docs/roadmaps/MULTI_TENANCY_AND_WORLD_TOUR.md',
];

for (const path of required) await access(path);
const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
if (packageJson.name !== 'daily-dash-devvit') throw new Error('Unexpected package name.');
const config = JSON.parse(await readFile('devvit.json', 'utf8'));
if (!config.post?.entrypoints?.game) throw new Error('Expanded game entrypoint is missing.');
console.log(`Repository shape valid (${required.length} required artifacts).`);
