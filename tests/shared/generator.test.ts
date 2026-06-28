import { describe, expect, it } from 'vitest';
import { generateRoute } from '../../src/shared/game/generator';
import { flattenRouteColumns } from '../../src/shared/game/tile';
import { solveColumns } from '../../src/shared/game/validator';

describe('route generator', () => {
  it('is deterministic for a tenant and date', () => {
    const input = {
      tenant: { id: 'tenant-a', name: 'A' },
      dateKey: '2026-06-25',
      communityTiles: [],
    };
    const left = generateRoute(input);
    const right = generateRoute(input);
    expect(left.recipe.tileIds).toEqual(right.recipe.tileIds);
    expect(left.recipe.visualSeed).toBe(right.recipe.visualSeed);
  });

  it('always produces a clean whole-route path from founding tiles', () => {
    const route = generateRoute({
      tenant: { id: 'tenant-b', name: 'B' },
      dateKey: '2026-06-26',
      communityTiles: [],
    });
    const result = solveColumns(flattenRouteColumns(route.tiles));
    expect(result.minimumDamage).toBe(0);
    expect(result.entryLaneCoverage).toBe(3);
    expect(result.cleanPathCount).toBeGreaterThan(0);
  });
});
