import { GAME_VERSION, TILE_WIDTH } from './constants';
import { createDraftTile, setTileCell } from './tile';
import type { CourseTile, Feature, Lane, Terrain } from './types';
import { validateCourseTile } from './validator';

const foundingBase = (id: string, name: string, seed: number): CourseTile =>
  createDraftTile({
    version: GAME_VERSION,
    id,
    tenantId: 'system',
    authorId: 'daily-dash-founders',
    authorName: name,
    createdAt: '2026-06-25T00:00:00.000Z',
    updatedAt: '2026-06-25T00:00:00.000Z',
    width: TILE_WIDTH,
    visualSeed: seed,
    status: 'certified',
  });

const paint = (
  tile: CourseTile,
  lane: Lane,
  column: number,
  terrain: Terrain,
  feature: Feature = 'none'
): CourseTile => setTileCell(tile, lane, column, terrain, feature);

const finalize = (tile: CourseTile): CourseTile => {
  const validation = validateCourseTile(tile);
  if (!validation.ok) {
    throw new Error(
      `Founding tile ${tile.id} is invalid: ${validation.issues
        .map((issue) =>
          issue.lane === undefined || issue.column === undefined
            ? issue.code
            : `${issue.code}@${issue.lane}:${issue.column}`
        )
        .join(', ')}`
    );
  }
  return { ...tile, status: 'certified', metrics: validation.metrics };
};

const meadowWarmup = (): CourseTile => {
  let tile = foundingBase('founding-meadow-warmup', 'Founding Couriers', 1101);
  tile = paint(tile, 0, 7, 'road', 'obstacle');
  tile = paint(tile, 1, 10, 'road', 'obstacle');
  tile = paint(tile, 2, 6, 'road', 'boost');
  tile = paint(tile, 0, 12, 'road', 'parcel');
  return finalize(tile);
};

const bridgeWeave = (): CourseTile => {
  let tile = foundingBase('founding-bridge-weave', 'Founding Couriers', 1102);
  tile = paint(tile, 0, 6, 'road', 'obstacle');
  tile = paint(tile, 1, 10, 'road', 'obstacle');
  tile = paint(tile, 0, 14, 'road', 'obstacle');
  tile = paint(tile, 2, 5, 'road', 'boost');
  tile = paint(tile, 0, 9, 'road', 'boost');
  tile = paint(tile, 2, 13, 'road', 'parcel');
  return finalize(tile);
};

const parcelFork = (): CourseTile => {
  let tile = foundingBase('founding-parcel-fork', 'Founding Couriers', 1103);
  for (let column = 6; column <= 8; column += 1) tile = paint(tile, 1, column, 'gap');
  tile = paint(tile, 2, 6, 'road', 'boost');
  tile = paint(tile, 2, 8, 'road', 'parcel');
  tile = paint(tile, 0, 11, 'road', 'parcel');
  tile = paint(tile, 1, 13, 'road', 'obstacle');
  return finalize(tile);
};

const puddleRun = (): CourseTile => {
  let tile = foundingBase('founding-puddle-run', 'Founding Couriers', 1104);
  tile = paint(tile, 2, 5, 'road', 'obstacle');
  tile = paint(tile, 2, 6, 'road', 'obstacle');
  tile = paint(tile, 1, 9, 'road', 'obstacle');
  tile = paint(tile, 1, 5, 'road', 'boost');
  tile = paint(tile, 2, 11, 'road', 'parcel');
  return finalize(tile);
};

const brokenBoardwalk = (): CourseTile => {
  let tile = foundingBase('founding-broken-boardwalk', 'Founding Couriers', 1105);
  for (let column = 5; column <= 7; column += 1) tile = paint(tile, 2, column, 'gap');
  tile = paint(tile, 1, 7, 'road', 'obstacle');
  tile = paint(tile, 1, 10, 'road', 'boost');
  tile = paint(tile, 2, 13, 'road', 'parcel');
  return finalize(tile);
};

const switchback = (): CourseTile => {
  let tile = foundingBase('founding-switchback', 'Founding Couriers', 1106);
  tile = paint(tile, 0, 5, 'road', 'obstacle');
  tile = paint(tile, 1, 9, 'road', 'obstacle');
  tile = paint(tile, 0, 13, 'road', 'obstacle');
  tile = paint(tile, 2, 4, 'road', 'boost');
  tile = paint(tile, 0, 8, 'road', 'parcel');
  tile = paint(tile, 2, 12, 'road', 'boost');
  return finalize(tile);
};

const marketStreet = (): CourseTile => {
  let tile = foundingBase('founding-market-street', 'Founding Couriers', 1107);
  tile = paint(tile, 0, 5, 'road', 'parcel');
  tile = paint(tile, 1, 6, 'road', 'obstacle');
  tile = paint(tile, 2, 7, 'road', 'boost');
  tile = paint(tile, 1, 11, 'road', 'parcel');
  tile = paint(tile, 0, 14, 'road', 'boost');
  return finalize(tile);
};

const ravineChoice = (): CourseTile => {
  let tile = foundingBase('founding-ravine-choice', 'Founding Couriers', 1108);
  for (let column = 6; column <= 9; column += 1) tile = paint(tile, 1, column, 'gap');
  tile = paint(tile, 0, 8, 'road', 'parcel');
  tile = paint(tile, 2, 7, 'road', 'boost');
  tile = paint(tile, 2, 9, 'road', 'parcel');
  return finalize(tile);
};

export const FOUNDING_TILES: CourseTile[] = [
  meadowWarmup(),
  bridgeWeave(),
  parcelFork(),
  puddleRun(),
  brokenBoardwalk(),
  switchback(),
  marketStreet(),
  ravineChoice(),
];

export const getFoundingTile = (id: string): CourseTile | undefined =>
  FOUNDING_TILES.find((tile) => tile.id === id);
