import { describe, expect, it } from 'vitest';
import { createEmptyStats, evaluateAchievementUnlocks } from '../../src/shared/game/achievements';

describe('achievements', () => {
  it('unlocks milestones once without duplicating them', () => {
    const stats = createEmptyStats();
    stats.tilesCertified = 1;
    const first = evaluateAchievementUnlocks(stats, [], '2026-06-25T00:00:00.000Z');
    const second = evaluateAchievementUnlocks(stats, first, '2026-06-26T00:00:00.000Z');
    expect(first.some((unlock) => unlock.id === 'first-certified-tile')).toBe(true);
    expect(second.filter((unlock) => unlock.id === 'first-certified-tile')).toHaveLength(1);
  });
});
