import { describe, expect, it } from 'vitest';
import { createDraftTile, setTileCell } from '../../src/shared/game/tile';
import { validateCourseTile } from '../../src/shared/game/validator';

const valid = createDraftTile({ id: 'test-valid' });

describe('course tile validator', () => {
  it('accepts a fully connected neutral tile', () => {
    const result = validateCourseTile(valid);
    expect(result.ok).toBe(true);
    expect(result.metrics.entryLaneCoverage).toBe(3);
    expect(result.metrics.minimumDamage).toBe(0);
  });

  it('rejects damage in a protected connector', () => {
    const changed = setTileCell(valid, 1, 0, 'road', 'obstacle');
    const result = validateCourseTile(changed);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'connector-buffer')).toBe(true);
  });

  it('rejects a wall that forces all players to take damage', () => {
    let changed = valid;
    for (const lane of [0, 1, 2] as const)
      changed = setTileCell(changed, lane, 8, 'road', 'obstacle');
    const result = validateCourseTile(changed);
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'no-clean-path')).toBe(true);
  });
});
