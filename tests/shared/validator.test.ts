import { describe, expect, it } from 'vitest';
import { createDraftTile, setTileCell } from '../../src/shared/game/tile';
import { findCleanPathsByEntrance, validateCourseTile } from '../../src/shared/game/validator';

const valid = createDraftTile({ id: 'test-valid' });
const reactionIssue = (result: ReturnType<typeof validateCourseTile>) =>
  result.issues.find((issue) => issue.code === 'reaction-margin');

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

  it('returns one clean path per covered entrance using canonical lane-change rules', () => {
    let changed = valid;
    changed = setTileCell(changed, 1, 6, 'road', 'obstacle');
    changed = setTileCell(changed, 1, 7, 'road', 'obstacle');

    const paths = findCleanPathsByEntrance(changed);

    expect(paths).toHaveLength(3);
    for (const path of paths) {
      expect(path.points).toHaveLength(changed.width);
      expect(path.points[0]).toEqual({ lane: path.entranceLane, column: 0 });
      expect(path.points.every((point) => point.column >= 0 && point.column < changed.width)).toBe(
        true
      );
      expect(
        path.points.every((point) => {
          const cell = changed.lanes[point.lane]?.[point.column];
          return cell?.terrain === 'road' && cell.feature !== 'obstacle';
        })
      ).toBe(true);
      for (let index = 1; index < path.points.length; index += 1) {
        const previous = path.points[index - 1];
        const current = path.points[index];
        expect(previous).toBeDefined();
        expect(current).toBeDefined();
        if (!previous || !current) continue;
        expect(Math.abs(current.lane - previous.lane)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('rejects a tile that is reachable only through a last-moment forced switch', () => {
    let changed = valid;
    for (const lane of [0, 2] as const) {
      for (const column of [3, 4, 5, 6]) {
        changed = setTileCell(changed, lane, column, 'road', 'obstacle');
      }
    }
    changed = setTileCell(changed, 1, 8, 'road', 'obstacle');

    const result = validateCourseTile(changed);

    expect(result.metrics.minimumDamage).toBe(0);
    expect(reactionIssue(result)).toMatchObject({ lane: 1, column: 8 });
    expect(result.ok).toBe(false);
  });

  it('accepts a forced switch with two columns of visible lead space', () => {
    let changed = valid;
    for (const lane of [0, 2] as const) {
      changed = setTileCell(changed, lane, 3, 'road', 'obstacle');
    }
    changed = setTileCell(changed, 1, 8, 'road', 'obstacle');

    const result = validateCourseTile(changed);

    expect(result.issues.some((issue) => issue.code === 'reaction-margin')).toBe(false);
    expect(result.ok).toBe(true);
  });

  it('rejects a forced switch into a lane hidden from camera lookahead', () => {
    let changed = valid;
    for (const lane of [0, 2] as const) {
      for (const column of [3, 4, 5]) {
        changed = setTileCell(changed, lane, column, 'road', 'obstacle');
      }
    }
    changed = setTileCell(changed, 1, 8, 'road', 'obstacle');

    const result = validateCourseTile(changed);

    expect(result.metrics.minimumDamage).toBe(0);
    expect(reactionIssue(result)).toMatchObject({ code: 'reaction-margin' });
    expect(reactionIssue(result)?.lane).toBeDefined();
    expect(reactionIssue(result)?.column).toBeDefined();
    expect(result.ok).toBe(false);
  });

  it('rejects a two-lane migration without four columns of lead space', () => {
    let changed = valid;
    changed = setTileCell(changed, 1, 5, 'road', 'obstacle');
    changed = setTileCell(changed, 0, 8, 'road', 'obstacle');
    changed = setTileCell(changed, 1, 10, 'road', 'obstacle');

    const result = validateCourseTile(changed);

    expect(result.metrics.minimumDamage).toBe(0);
    expect(reactionIssue(result)).toMatchObject({ lane: 1, column: 10 });
    expect(result.ok).toBe(false);
  });
});
