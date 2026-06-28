import { DEFAULT_ROUTE_LENGTH, GAME_VERSION } from './constants';
import { FOUNDING_TILES } from './foundingTiles';
import { createPrng, hashString, pickDeterministic } from './seed';
import { flattenRouteColumns } from './tile';
import type { CourseTile, RouteBundle, RouteRecipe, TenantIdentity } from './types';
import { solveColumns, validateCourseTile } from './validator';

export type GenerateRouteOptions = {
  tenant: TenantIdentity;
  dateKey: string;
  communityTiles: CourseTile[];
  length?: number;
  biomeId?: string;
  seedSalt?: string;
};

const difficultyCurve = (length: number): number[] => {
  const base = [1, 2, 2, 3, 2, 4, 3, 4, 3, 5, 3, 4];
  return Array.from({ length }, (_, index) => base[index % base.length] ?? 3);
};

const prepareTiles = (tiles: CourseTile[]): CourseTile[] => {
  const prepared: CourseTile[] = [];
  for (const tile of tiles) {
    if (tile.status === 'removed') continue;
    const validation = validateCourseTile(tile);
    if (!validation.ok) continue;
    prepared.push({ ...tile, status: 'certified', metrics: validation.metrics });
  }
  return prepared;
};

const candidateScore = (
  tile: CourseTile,
  targetDifficulty: number,
  previousAuthorId: string | undefined,
  usedTileIds: Set<string>
): number => {
  const difficulty = tile.metrics?.difficulty ?? 3;
  let score = Math.abs(difficulty - targetDifficulty) * 10;
  if (previousAuthorId && tile.authorId === previousAuthorId) score += 20;
  if (usedTileIds.has(tile.id)) score += 30;
  if (tile.authorId === 'daily-dash-founders') score += 4;
  return score;
};

export const generateRoute = (options: GenerateRouteOptions): RouteBundle => {
  const length = options.length ?? DEFAULT_ROUTE_LENGTH;
  const seed = hashString(
    `${options.tenant.id}:${options.dateKey}:${options.seedSalt ?? 'tenant-route-v1'}`
  );
  const random = createPrng(seed);
  const community = prepareTiles(options.communityTiles);
  const pool = [...community, ...FOUNDING_TILES];
  const curve = difficultyCurve(length);
  const selected: CourseTile[] = [];
  const fallbackTileIds: string[] = [];
  const usedTileIds = new Set<string>();

  for (let index = 0; index < length; index += 1) {
    const target = curve[index] ?? 3;
    const previousAuthorId = selected.at(-1)?.authorId;
    const ranked = [...pool].sort(
      (left, right) =>
        candidateScore(left, target, previousAuthorId, usedTileIds) -
        candidateScore(right, target, previousAuthorId, usedTileIds)
    );
    const shortlist = ranked.slice(0, Math.min(4, ranked.length));
    const chosen =
      pickDeterministic(shortlist, random) ?? FOUNDING_TILES[index % FOUNDING_TILES.length];
    if (!chosen) throw new Error('No route tiles are available.');
    selected.push(chosen);
    usedTileIds.add(chosen.id);
    const fallback = FOUNDING_TILES[index % FOUNDING_TILES.length];
    fallbackTileIds.push(fallback?.id ?? FOUNDING_TILES[0]?.id ?? 'missing-fallback');
  }

  const solve = solveColumns(flattenRouteColumns(selected));
  if (solve.cleanPathCount === 0 || solve.entryLaneCoverage < 3 || solve.minimumDamage > 0) {
    throw new Error('Generated route failed whole-route certification.');
  }

  const createdAt = new Date().toISOString();
  const recipe: RouteRecipe = {
    version: GAME_VERSION,
    id: `route-${options.tenant.id}-${options.dateKey}`,
    tenantId: options.tenant.id,
    tenantName: options.tenant.name,
    dateKey: options.dateKey,
    createdAt,
    tileIds: selected.map((tile) => tile.id),
    fallbackTileIds,
    visualSeed: seed,
    biomeId: options.biomeId ?? 'meadow-postcard',
    compilerVersion: 1,
    revision: 1,
    scope: 'tenant',
  };

  return { recipe, tiles: selected };
};

export const countRouteParcels = (bundle: RouteBundle): number =>
  bundle.tiles.reduce(
    (total, tile) =>
      total +
      tile.lanes.reduce(
        (laneTotal, lane) => laneTotal + lane.filter((cell) => cell.feature === 'parcel').length,
        0
      ),
    0
  );
