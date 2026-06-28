import { randomUUID } from 'node:crypto';
import { scoreRun } from '../../shared/game/scoring';
import type { RunResult, RunStart, RunSubmission } from '../../shared/game/types';
import { tenantStore } from '../repositories/tenantStore';

type StoredRunToken = {
  token: string;
  routeId: string;
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
    userId,
    username,
    issuedAtMs: now,
    expiresAtMs: now + 15 * 60 * 1000,
  };
  await tenantStore.saveRunToken(token, JSON.stringify(stored), 15 * 60);
  return {
    token,
    routeId,
    issuedAt: new Date(stored.issuedAtMs).toISOString(),
    expiresAt: new Date(stored.expiresAtMs).toISOString(),
  };
};

export const finishRun = async (submission: RunSubmission): Promise<RunResult> => {
  const raw = await tenantStore.consumeRunToken(submission.token);
  if (!raw) throw new Error('Run token is missing, expired, or already used.');
  const stored = JSON.parse(raw) as StoredRunToken;
  if (stored.routeId !== submission.routeId)
    throw new Error('Run token does not match this route.');
  if (Date.now() > stored.expiresAtMs) throw new Error('Run token expired.');

  const serverElapsed = Date.now() - stored.issuedAtMs;
  const elapsedDelta = Math.abs(serverElapsed - submission.elapsedMs);
  if (submission.elapsedMs < 1_000 || elapsedDelta > 20_000) {
    throw new Error('Run timing failed validation.');
  }
  if (submission.damageTaken < 0 || submission.damageTaken > 3)
    throw new Error('Invalid damage count.');
  if (submission.parcelsCollected < 0 || submission.parcelsCollected > 200)
    throw new Error('Invalid parcel count.');
  if (submission.boostsTriggered < 0 || submission.boostsTriggered > 200)
    throw new Error('Invalid boost count.');

  const completedAt = new Date().toISOString();
  return {
    ...submission,
    userId: stored.userId,
    username: stored.username,
    score: scoreRun(submission),
    completedAt,
  };
};
