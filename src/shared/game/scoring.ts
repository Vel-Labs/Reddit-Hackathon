import type { RunSubmission } from './types';

export const scoreRun = (run: Omit<RunSubmission, 'token'>): number => {
  if (!run.completed) return 0;
  const completion = 7_500;
  const timeBonus = Math.max(0, 5_000 - Math.floor(run.elapsedMs / 20));
  const parcelBonus = run.parcelsCollected * 350;
  const boostBonus = Math.min(run.boostsTriggered, 20) * 75;
  const damagePenalty = run.damageTaken * 1_250;
  return Math.max(0, completion + timeBonus + parcelBonus + boostBonus - damagePenalty);
};

export const medalForScore = (score: number): 'none' | 'bronze' | 'silver' | 'gold' => {
  if (score >= 12_500) return 'gold';
  if (score >= 10_000) return 'silver';
  if (score >= 7_500) return 'bronze';
  return 'none';
};
