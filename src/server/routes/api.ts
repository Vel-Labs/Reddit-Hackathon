import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { ACHIEVEMENTS } from '../../shared/game/achievements';
import { GAME_VERSION, TILE_WIDTH } from '../../shared/game/constants';
import { dateKeyUtc } from '../../shared/game/seed';
import { cloneLanes } from '../../shared/game/tile';
import type {
  BootstrapResponse,
  CompleteRunRequest,
  CompleteRunResponse,
  CreatorOutcomeResponse,
  CreatorOutcomeTile,
  LeaderboardResponse,
  RemoveTileRequest,
  RemoveTileResponse,
  ReportTileRequest,
  ReportTileResponse,
  RouteResponse,
  RoutesResponse,
  StartRunRequest,
  StartRunResponse,
  SubmitTileRequest,
  SubmitTileResponse,
  ValidateTileRequest,
  ValidateTileResponse,
} from '../../shared/api';
import type { ApiError } from '../../shared/api';
import type { CourseTile, LeaderboardEntry, TileReportReason } from '../../shared/game/types';
import { laneAtColumn } from '../../shared/game/replay';
import { validateCourseTile } from '../../shared/game/validator';
import { getCurrentPlayer, getTenantIdentity, isCurrentPlayerModerator } from '../core/identity';
import { tenantStore } from '../repositories/tenantStore';
import {
  getOrCreateProfile,
  recordCertifiedTile,
  recordCompletedRun,
} from '../services/profileService';
import {
  ensureDailyRoute,
  randomLocalRoute,
  repairRoutesAfterTileRemoval,
} from '../services/routeService';
import { createRun, finishRun } from '../services/runService';
import { disabledWorldCatalog } from '../services/worldCatalog';

export const api = new Hono();

const error = (code: string, message: string): ApiError => ({ status: 'error', code, message });
const REPORT_REASONS = new Set<TileReportReason>([
  'unfair-layout',
  'broken-route',
  'unsafe-content',
  'wrong-attribution',
]);
const parseRevision = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};
const isReportReason = (value: unknown): value is TileReportReason =>
  typeof value === 'string' && REPORT_REASONS.has(value as TileReportReason);

api.get('/bootstrap', async (c) => {
  try {
    const tenant = getTenantIdentity();
    const player = await getCurrentPlayer();
    const dailyRoute = await ensureDailyRoute(tenant);
    const profile = player.authenticated
      ? await getOrCreateProfile(player.userId, player.username, tenant.id)
      : null;
    if (profile) await tenantStore.saveProfile(profile);
    const response: BootstrapResponse = {
      status: 'ok',
      tenant,
      username: player.username,
      authenticated: player.authenticated,
      dailyRoute,
      profile,
      achievements: ACHIEVEMENTS,
      worldTourEnabled: disabledWorldCatalog.enabled,
    };
    return c.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Bootstrap failed.';
    return c.json(error('bootstrap-failed', message), 500);
  }
});

api.post('/tiles/validate', async (c) => {
  const body = await c.req.json<ValidateTileRequest>();
  const response: ValidateTileResponse = {
    status: 'ok',
    validation: validateCourseTile(body.tile),
  };
  return c.json(response);
});

api.post('/tiles', async (c) => {
  try {
    const tenant = getTenantIdentity();
    const player = await getCurrentPlayer();
    if (!player.authenticated)
      return c.json(error('authentication-required', 'Sign in to publish a tile.'), 401);
    const body = await c.req.json<SubmitTileRequest>();
    const dateKey = dateKeyUtc();
    const existingId = await tenantStore.getSubmissionForDate(dateKey, player.userId);
    const now = new Date().toISOString();
    const tile: CourseTile = {
      version: GAME_VERSION,
      id: existingId ?? `tile-${dateKey}-${randomUUID()}`,
      tenantId: tenant.id,
      authorId: player.userId,
      authorName: player.username,
      createdAt: body.tile.createdAt || now,
      updatedAt: now,
      width: TILE_WIDTH,
      lanes: cloneLanes(body.tile.lanes),
      visualSeed: body.tile.visualSeed,
      status: 'draft',
    };
    const validation = validateCourseTile(tile);
    if (!validation.ok) {
      return c.json(
        error(
          'tile-not-certified',
          validation.issues.find((entry) => entry.severity === 'error')?.message ??
            'Tile failed validation.'
        ),
        400
      );
    }
    const certified: CourseTile = { ...tile, status: 'certified', metrics: validation.metrics };
    await tenantStore.saveTile(certified);
    await tenantStore.saveSubmissionForDate(dateKey, player.userId, certified.id);
    if (!existingId) await recordCertifiedTile(player.userId, player.username, tenant.id);
    const response: SubmitTileResponse = { status: 'ok', tile: certified, validation };
    return c.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Tile submission failed.';
    return c.json(error('tile-submit-failed', message), 500);
  }
});

api.delete('/tiles/:tileId', async (c) => {
  try {
    const tenant = getTenantIdentity();
    const player = await getCurrentPlayer();
    if (!player.authenticated)
      return c.json(error('authentication-required', 'Sign in to remove a tile.'), 401);
    const tileId = c.req.param('tileId');
    const tile = await tenantStore.getTile(tileId);
    if (!tile) return c.json(error('not-found', 'Tile not found.'), 404);
    if (tile.authorId !== player.userId)
      return c.json(error('forbidden', 'Only the tile author can remove it.'), 403);
    await tenantStore.removeTile(tileId);
    const repairedRoutes = await repairRoutesAfterTileRemoval(tenant, tileId);
    await tenantStore.actionReportsForTile(tileId, new Date().toISOString(), player.userId);
    const response: RemoveTileResponse = { status: 'ok', removedTileId: tileId, repairedRoutes };
    return c.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Tile removal failed.';
    return c.json(error('tile-remove-failed', message), 500);
  }
});

api.post('/reports', async (c) => {
  try {
    const tenant = getTenantIdentity();
    const player = await getCurrentPlayer();
    if (!player.authenticated)
      return c.json(error('authentication-required', 'Sign in to report a tile.'), 401);
    const body = await c.req.json<ReportTileRequest>();
    if (!isReportReason(body.reason))
      return c.json(error('invalid-report-reason', 'Choose a supported report reason.'), 400);
    const route = await tenantStore.getRoute(body.routeId);
    if (!route) return c.json(error('route-not-found', 'Route not found.'), 404);
    if (route.recipe.revision !== body.routeRevision)
      return c.json(
        error('stale-route-revision', 'Reload Roadbook before reporting this tile.'),
        409
      );
    const tile = route.tiles.find((entry) => entry.id === body.tileId);
    if (!tile) return c.json(error('tile-not-in-route', 'Tile is not part of this route.'), 404);
    const now = new Date().toISOString();
    const report = {
      id: `report-${randomUUID()}`,
      tenantId: tenant.id,
      routeId: route.recipe.id,
      routeRevision: route.recipe.revision,
      tileId: tile.id,
      tileAuthorId: tile.authorId,
      tileAuthorName: tile.authorName,
      reporterId: player.userId,
      reporterName: player.username,
      reason: body.reason,
      status: 'open' as const,
      createdAt: now,
    };
    await tenantStore.saveReport(report);
    const response: ReportTileResponse = { status: 'ok', report };
    return c.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Tile report failed.';
    return c.json(error('tile-report-failed', message), 500);
  }
});

api.post('/moderation/tiles/:tileId/remove', async (c) => {
  try {
    const tenant = getTenantIdentity();
    const player = await getCurrentPlayer();
    if (!player.authenticated)
      return c.json(error('authentication-required', 'Sign in to remove a tile.'), 401);
    const tileId = c.req.param('tileId');
    const body = await c.req.json<RemoveTileRequest>();
    const route = await tenantStore.getRoute(body.routeId);
    if (!route) return c.json(error('route-not-found', 'Route not found.'), 404);
    if (route.recipe.revision !== body.routeRevision)
      return c.json(
        error('stale-route-revision', 'Reload Roadbook before removing this tile.'),
        409
      );
    if (!route.tiles.some((entry) => entry.id === tileId))
      return c.json(error('tile-not-in-route', 'Tile is not part of this route.'), 404);
    const tile = await tenantStore.getTile(tileId);
    if (!tile) return c.json(error('tile-not-found', 'Tile not found.'), 404);
    if (tile.authorId === 'daily-dash-founders')
      return c.json(error('system-tile', 'System fallback tiles cannot be removed here.'), 400);
    const moderator = await isCurrentPlayerModerator(player.username);
    if (tile.authorId !== player.userId && !moderator)
      return c.json(
        error('forbidden', 'Only the tile author or a community moderator can remove it.'),
        403
      );
    await tenantStore.removeTile(tileId);
    const repairedRoutes = await repairRoutesAfterTileRemoval(tenant, tileId);
    await tenantStore.actionReportsForTile(tileId, new Date().toISOString(), player.userId);
    const response: RemoveTileResponse = { status: 'ok', removedTileId: tileId, repairedRoutes };
    return c.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Moderation removal failed.';
    return c.json(error('moderation-remove-failed', message), 500);
  }
});

api.get('/routes/daily', async (c) => {
  try {
    const route = await ensureDailyRoute(getTenantIdentity());
    const response: RouteResponse = { status: 'ok', route };
    return c.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Daily route failed.';
    return c.json(error('route-failed', message), 500);
  }
});

api.get('/routes', async (c) => {
  try {
    const tenant = getTenantIdentity();
    await ensureDailyRoute(tenant);
    const routes = (await tenantStore.listRoutes()).sort(
      (left, right) => Date.parse(right.recipe.createdAt) - Date.parse(left.recipe.createdAt)
    );
    const response: RoutesResponse = { status: 'ok', routes };
    return c.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Routes failed.';
    return c.json(error('routes-failed', message), 500);
  }
});

api.get('/routes/random', async (c) => {
  try {
    const tenant = getTenantIdentity();
    const worldRoute = disabledWorldCatalog.enabled
      ? await disabledWorldCatalog.random(tenant.id)
      : undefined;
    const route = worldRoute
      ? { recipe: worldRoute.recipe, tiles: worldRoute.tiles }
      : await randomLocalRoute(tenant);
    const response: RouteResponse = { status: 'ok', route };
    return c.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Random route failed.';
    return c.json(error('random-route-failed', message), 500);
  }
});

api.post('/runs/start', async (c) => {
  try {
    const player = await getCurrentPlayer();
    if (!player.authenticated)
      return c.json(error('authentication-required', 'Sign in to submit ranked runs.'), 401);
    const body = await c.req.json<StartRunRequest>();
    const run = await createRun(body.routeId, player.userId, player.username);
    const response: StartRunResponse = { status: 'ok', run };
    return c.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Could not start run.';
    return c.json(error('run-start-failed', message), 400);
  }
});

api.post('/runs/complete', async (c) => {
  try {
    const tenant = getTenantIdentity();
    const body = await c.req.json<CompleteRunRequest>();
    const route = await tenantStore.getRoute(body.routeId);
    if (!route)
      return c.json(
        error('route-not-found', 'The route was removed before this run completed.'),
        404
      );
    if (typeof body.routeRevision === 'number' && route.recipe.revision !== body.routeRevision) {
      return c.json(
        error('stale-route-revision', 'The route changed before this run completed.'),
        409
      );
    }
    const result = await finishRun(body, route);
    await tenantStore.saveBestRun(
      result.routeId,
      result.routeRevision ?? route.recipe.revision,
      result
    );
    const profile = await recordCompletedRun(result, route, tenant.id);
    const response: CompleteRunResponse = { status: 'ok', result, profile };
    return c.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Could not complete run.';
    return c.json(error('run-complete-failed', message), 400);
  }
});

api.get('/leaderboards/:routeId', async (c) => {
  const routeId = c.req.param('routeId');
  const route = await tenantStore.getRoute(routeId);
  const routeRevision = parseRevision(c.req.query('revision')) ?? route?.recipe.revision ?? 1;
  const runs = (await tenantStore.listBestRuns(routeId, routeRevision))
    .sort((left, right) => right.score - left.score || left.elapsedMs - right.elapsedMs)
    .slice(0, 25);
  const entries: LeaderboardEntry[] = runs.map((run, index) => ({
    rank: index + 1,
    userId: run.userId,
    username: run.username,
    score: run.score,
  }));
  const response: LeaderboardResponse = { status: 'ok', routeRevision, entries };
  return c.json(response);
});

api.get('/creator/outcome', async (c) => {
  try {
    const tenant = getTenantIdentity();
    const player = await getCurrentPlayer();
    if (!player.authenticated)
      return c.json(error('authentication-required', 'Sign in to view creator outcomes.'), 401);
    const profile = await getOrCreateProfile(player.userId, player.username, tenant.id);
    const tiles: CreatorOutcomeTile[] = [];
    const routes = await tenantStore.listRoutes();

    for (const route of routes) {
      const runs = (await tenantStore.listBestRuns(route.recipe.id, route.recipe.revision)).filter(
        (run) => run.completed && run.userId !== player.userId
      );
      route.tiles.forEach((tile, tileIndex) => {
        if (tile.authorId !== player.userId) return;
        const startColumn = tileIndex * tile.width;
        const sampleColumn = startColumn + Math.floor(tile.width / 2);
        const pathChoices = { top: 0, middle: 0, bottom: 0 };
        for (const run of runs) {
          const lane = laneAtColumn(run.laneEvents ?? [], sampleColumn);
          if (lane === 0) pathChoices.top += 1;
          else if (lane === 1) pathChoices.middle += 1;
          else pathChoices.bottom += 1;
        }
        tiles.push({
          tileId: tile.id,
          routeId: route.recipe.id,
          dateKey: route.recipe.dateKey,
          routeRevision: route.recipe.revision,
          tileIndex,
          crossings: runs.length,
          cleanCrossings: runs.filter((run) => run.damageTaken === 0).length,
          pathChoices,
        });
      });
    }

    tiles.sort(
      (left, right) => right.crossings - left.crossings || right.dateKey.localeCompare(left.dateKey)
    );
    const response: CreatorOutcomeResponse = {
      status: 'ok',
      profile,
      featuredTiles: profile.stats.tilesFeatured,
      totalCrossings: profile.stats.totalTileCrossings,
      tiles,
    };
    return c.json(response);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Creator outcome failed.';
    return c.json(error('creator-outcome-failed', message), 500);
  }
});

api.get('/profile', async (c) => {
  const tenant = getTenantIdentity();
  const player = await getCurrentPlayer();
  if (!player.authenticated)
    return c.json(error('authentication-required', 'Sign in to load a profile.'), 401);
  const profile = await getOrCreateProfile(player.userId, player.username, tenant.id);
  await tenantStore.saveProfile(profile);
  return c.json({ status: 'ok', profile });
});
