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
  LeaderboardResponse,
  RouteResponse,
  StartRunRequest,
  StartRunResponse,
  SubmitTileRequest,
  SubmitTileResponse,
  ValidateTileRequest,
  ValidateTileResponse,
} from '../../shared/api';
import type { ApiError } from '../../shared/api';
import type { CourseTile, LeaderboardEntry } from '../../shared/game/types';
import { validateCourseTile } from '../../shared/game/validator';
import { getCurrentPlayer, getTenantIdentity } from '../core/identity';
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
    return c.json({ status: 'ok', removedTileId: tileId, repairedRoutes });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Tile removal failed.';
    return c.json(error('tile-remove-failed', message), 500);
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
    const result = await finishRun(body);
    const route = await tenantStore.getRoute(result.routeId);
    if (!route)
      return c.json(
        error('route-not-found', 'The route was removed before this run completed.'),
        404
      );
    await tenantStore.saveBestRun(result.routeId, result);
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
  const runs = (await tenantStore.listBestRuns(routeId))
    .sort((left, right) => right.score - left.score || left.elapsedMs - right.elapsedMs)
    .slice(0, 25);
  const entries: LeaderboardEntry[] = runs.map((run, index) => ({
    rank: index + 1,
    userId: run.userId,
    username: run.username,
    score: run.score,
  }));
  const response: LeaderboardResponse = { status: 'ok', entries };
  return c.json(response);
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
