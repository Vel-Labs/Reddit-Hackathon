import { redis } from '@devvit/web/server';
import { KEYS } from '../core/keys';
import type { CourseTile, PlayerProfile, RouteBundle, RunResult } from '../../shared/game/types';

const parse = <T>(value: string | undefined): T | undefined => {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

const parseRecord = <T>(record: Record<string, string> | undefined): T[] =>
  Object.values(record ?? {}).flatMap((value) => {
    const parsed = parse<T>(value);
    return parsed ? [parsed] : [];
  });

export const tenantStore = {
  async getTile(id: string): Promise<CourseTile | undefined> {
    return parse<CourseTile>(await redis.hGet(KEYS.tiles, id));
  },

  async listTiles(): Promise<CourseTile[]> {
    return parseRecord<CourseTile>(await redis.hGetAll(KEYS.tiles));
  },

  async saveTile(tile: CourseTile): Promise<void> {
    await redis.hSet(KEYS.tiles, { [tile.id]: JSON.stringify(tile) });
  },

  async removeTile(id: string): Promise<void> {
    const tile = await this.getTile(id);
    if (!tile) return;
    await this.saveTile({ ...tile, status: 'removed', updatedAt: new Date().toISOString() });
  },

  async getRoute(id: string): Promise<RouteBundle | undefined> {
    return parse<RouteBundle>(await redis.hGet(KEYS.routes, id));
  },

  async listRoutes(): Promise<RouteBundle[]> {
    return parseRecord<RouteBundle>(await redis.hGetAll(KEYS.routes));
  },

  async saveRoute(route: RouteBundle): Promise<void> {
    await redis.hSet(KEYS.routes, { [route.recipe.id]: JSON.stringify(route) });
    await redis.zAdd(KEYS.routeIndex, {
      member: route.recipe.id,
      score: Date.parse(route.recipe.createdAt),
    });
    await redis.hSet(KEYS.dailyRoutes, { [route.recipe.dateKey]: route.recipe.id });
  },

  async getDailyRouteId(dateKey: string): Promise<string | undefined> {
    return await redis.hGet(KEYS.dailyRoutes, dateKey);
  },

  async getProfile(userId: string): Promise<PlayerProfile | undefined> {
    return parse<PlayerProfile>(await redis.hGet(KEYS.profiles, userId));
  },

  async saveProfile(profile: PlayerProfile): Promise<void> {
    await redis.hSet(KEYS.profiles, { [profile.userId]: JSON.stringify(profile) });
  },

  async listProfiles(): Promise<PlayerProfile[]> {
    return parseRecord<PlayerProfile>(await redis.hGetAll(KEYS.profiles));
  },

  async getSubmissionForDate(dateKey: string, userId: string): Promise<string | undefined> {
    return await redis.hGet(KEYS.submissionsForDate(dateKey), userId);
  },

  async saveSubmissionForDate(dateKey: string, userId: string, tileId: string): Promise<void> {
    await redis.hSet(KEYS.submissionsForDate(dateKey), { [userId]: tileId });
  },

  async saveRunToken(token: string, payload: string, ttlSeconds = 900): Promise<void> {
    const key = KEYS.runToken(token);
    await redis.set(key, payload);
    await redis.expire(key, ttlSeconds);
  },

  async consumeRunToken(token: string): Promise<string | undefined> {
    const key = KEYS.runToken(token);
    const value = await redis.get(key);
    if (value) await redis.del(key);
    return value;
  },

  async saveBestRun(routeId: string, run: RunResult): Promise<void> {
    const existingRaw = await redis.hGet(KEYS.bestRuns(routeId), run.userId);
    const existing = parse<RunResult>(existingRaw);
    if (!existing || run.score > existing.score) {
      await redis.hSet(KEYS.bestRuns(routeId), { [run.userId]: JSON.stringify(run) });
      await redis.zAdd(KEYS.leaderboard(routeId), { member: run.userId, score: run.score });
    }
  },

  async listBestRuns(routeId: string): Promise<RunResult[]> {
    return parseRecord<RunResult>(await redis.hGetAll(KEYS.bestRuns(routeId)));
  },

  async incrementFeatured(tileId: string): Promise<number> {
    return await redis.hIncrBy(KEYS.featuredCounts, tileId, 1);
  },

  async getSetting(name: string): Promise<string | undefined> {
    return await redis.hGet(KEYS.settings, name);
  },

  async setSetting(name: string, value: string): Promise<void> {
    await redis.hSet(KEYS.settings, { [name]: value });
  },
};
