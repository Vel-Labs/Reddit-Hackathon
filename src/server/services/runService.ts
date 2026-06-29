import { randomUUID } from 'node:crypto';
import { replayRun } from '../../shared/game/replay';
import { scoreRun } from '../../shared/game/scoring';
import { flattenRouteColumns } from '../../shared/game/tile';
import type { RouteBundle, RunResult, RunStart, RunSubmission } from '../../shared/game/types';
import { tenantStore } from '../repositories/tenantStore';

type StoredRunToken = {
  token: string;
  routeId: string;
  routeRevision: number;
  userId: string;
  username: string;
  issuedAtMs: number;
  expiresAtMs: number;
};

export const createRun = async (
  routeId: string,
  userId: string,
  username: string
): Promise<RunStart> => {
  const route = await tenantStore.getRoute(routeId);
  if (!route) throw new Error('Route not found.');
  const now = Date.now();
  const token = randomUUID();
  const stored: StoredRunToken = {
    token,
    routeId,
    routeRevision: route.recipe.revision,
    userId,
    username,
    issuedAtMs: now,
    expiresAtMs: now + 15 * 60 * 1000,
  };
  await tenantStore.saveRunToken(token, JSON.stringify(stored), 15 * 60);
  return {
    token,
    routeId,
    routeRevision: stored.routeRevision,
    issuedAt: new Date(stored.issuedAtMs).toISOString(),
    expiresAt: new Date(stored.expiresAtMs).toISOString(),
  };
};

export const finishRun = async (
  submission: RunSubmission,
  route: RouteBundle
): Promise<RunResult> => {
  const raw = await tenantStore.consumeRunToken(submission.token);
  if (!raw) throw new Error('Run token is missing, expired, or already used.');
  const stored = JSON.parse(raw) as StoredRunToken;
  if (stored.routeId !== submission.routeId)
    throw new Error('Run token does not match this route.');
  if (
    typeof submission.routeRevision === 'number' &&
    stored.routeRevision !== submission.routeRevision
  ) {
    throw new Error('Run token does not match this route revision.');
  }
  if (Date.now() > stored.expiresAtMs) throw new Error('Run token expired.');

  const serverElapsed = Date.now() - stored.issuedAtMs;
  const elapsedDelta = Math.abs(serverElapsed - submission.elapsedMs);
  if (submission.elapsedMs < 1_000 || elapsedDelta > 20_000) {
    throw new Error('Run timing failed validation.');
  }
  const replay = replayRun(flattenRouteColumns(route.tiles), submission.laneEvents ?? []);
  if (!replay.ok) throw new Error(replay.message);

  const authoritative: RunSubmission = {
    ...submission,
    routeRevision: stored.routeRevision,
    damageTaken: replay.damageTaken,
    parcelsCollected: replay.parcelsCollected,
    boostsTriggered: replay.boostsTriggered,
    completed: replay.completed,
  };

  const completedAt = new Date().toISOString();
  return {
    ...authoritative,
    routeRevision: stored.routeRevision,
    userId: stored.userId,
    username: stored.username,
    score: scoreRun(authoritative),
    completedAt,
  };
};
