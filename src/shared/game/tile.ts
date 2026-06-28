import {
  ENTRY_BUFFER_COLUMNS,
  EXIT_BUFFER_COLUMNS,
  FEATURE_COST,
  GAME_VERSION,
  LANE_COUNT,
  TERRAIN_COST,
  TILE_WIDTH,
} from './constants';
import type { Cell, CourseTile, Feature, Lane, Terrain } from './types';

export const createCell = (terrain: Terrain = 'road', feature: Feature = 'none'): Cell => ({
  terrain,
  feature: terrain === 'gap' ? 'none' : feature,
});

export const createBlankLanes = (width: number = TILE_WIDTH): Cell[][] =>
  Array.from({ length: LANE_COUNT }, () =>
    Array.from({ length: width }, () => createCell('road', 'none'))
  );

export const createDraftTile = (input?: Partial<CourseTile>): CourseTile => {
  const now = new Date().toISOString();
  const tile: CourseTile = {
    version: GAME_VERSION,
    id: input?.id ?? `draft-${Date.now()}`,
    tenantId: input?.tenantId ?? 'local-demo',
    authorId: input?.authorId ?? 'local-player',
    authorName: input?.authorName ?? 'Local Player',
    createdAt: input?.createdAt ?? now,
    updatedAt: input?.updatedAt ?? now,
    width: input?.width ?? TILE_WIDTH,
    lanes: input?.lanes ? cloneLanes(input.lanes) : createBlankLanes(input?.width ?? TILE_WIDTH),
    visualSeed: input?.visualSeed ?? Date.now() % 2_147_483_647,
    status: input?.status ?? 'draft',
  };
  if (input?.metrics) tile.metrics = input.metrics;
  return tile;
};

export const cloneLanes = (lanes: Cell[][]): Cell[][] =>
  lanes.map((lane) => lane.map((cell) => ({ ...cell })));

export const cloneTile = (tile: CourseTile): CourseTile => {
  const next: CourseTile = { ...tile, lanes: cloneLanes(tile.lanes) };
  if (tile.metrics) {
    next.metrics = { ...tile.metrics, reachableExitLanes: [...tile.metrics.reachableExitLanes] };
  } else {
    delete next.metrics;
  }
  return next;
};

export const setTileCell = (
  tile: CourseTile,
  lane: Lane,
  column: number,
  terrain: Terrain,
  feature: Feature = 'none'
): CourseTile => {
  const next = cloneTile(tile);
  const row = next.lanes[lane];
  if (!row || column < 0 || column >= next.width) {
    return next;
  }
  row[column] = createCell(terrain, feature);
  next.updatedAt = new Date().toISOString();
  delete next.metrics;
  return next;
};

export const isBufferColumn = (column: number, width: number = TILE_WIDTH): boolean =>
  column < ENTRY_BUFFER_COLUMNS || column >= width - EXIT_BUFFER_COLUMNS;

export const isCleanCell = (cell: Cell): boolean =>
  cell.terrain === 'road' && cell.feature !== 'obstacle';

export const cellDamage = (cell: Cell): number =>
  cell.terrain === 'gap' || cell.feature === 'obstacle' ? 1 : 0;

export const calculateBuildBudget = (tile: CourseTile): number =>
  tile.lanes.reduce(
    (total, lane) =>
      total +
      lane.reduce(
        (laneTotal, cell) => laneTotal + TERRAIN_COST[cell.terrain] + FEATURE_COST[cell.feature],
        0
      ),
    0
  );

export const countFeature = (tile: CourseTile, feature: Feature): number =>
  tile.lanes.reduce(
    (total, lane) => total + lane.filter((cell) => cell.feature === feature).length,
    0
  );

export const countTerrain = (tile: CourseTile, terrain: Terrain): number =>
  tile.lanes.reduce(
    (total, lane) => total + lane.filter((cell) => cell.terrain === terrain).length,
    0
  );

export const flattenRouteColumns = (tiles: CourseTile[]): Cell[][] => {
  const columns: Cell[][] = [];
  for (const tile of tiles) {
    for (let column = 0; column < tile.width; column += 1) {
      const cells = tile.lanes.map((lane) => lane[column] ?? createCell('gap', 'none'));
      columns.push(cells);
    }
  }
  return columns;
};
