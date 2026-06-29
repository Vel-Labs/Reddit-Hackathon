import {
  CAMERA_LOOKAHEAD_COLUMNS,
  ENTRY_BUFFER_COLUMNS,
  EXIT_BUFFER_COLUMNS,
  LANE_CHANGE_COOLDOWN_COLUMNS,
  LANE_COUNT,
  MAX_BOOSTS,
  MAX_BUILD_BUDGET,
  MAX_GAPS,
  MAX_OBSTACLES,
  MAX_PARCELS,
  REACTION_MARGIN_COLUMNS,
  TILE_WIDTH,
} from './constants';
import {
  calculateBuildBudget,
  cellDamage,
  countFeature,
  countTerrain,
  isBufferColumn,
  isCleanCell,
} from './tile';
import type {
  Cell,
  CourseTile,
  Lane,
  SafePath,
  SafePathPoint,
  TileMetrics,
  TileValidationResult,
  ValidationIssue,
} from './types';

type SolverState = {
  lane: Lane;
  cooldown: number;
};

type MoveDirection = -1 | 1;

type FairPathEntry = {
  state: SolverState;
  points: SafePathPoint[];
  lastMoveDirection?: MoveDirection;
  migrationStartColumn?: number;
};

type FairPathFailure = {
  lane: Lane;
  column: number;
};

type FairPathResult = {
  paths: SafePath[];
  firstFailure?: FairPathFailure;
};

type GridSolveResult = {
  cleanPathCount: number;
  entryLaneCoverage: number;
  reachableExitLanes: Lane[];
  minimumDamage: number;
};

const stateKey = (state: SolverState): string => `${state.lane}:${state.cooldown}`;

const fairPathKey = (entry: FairPathEntry): string =>
  [stateKey(entry.state), entry.lastMoveDirection ?? 0, entry.migrationStartColumn ?? -1].join(':');

const laneFromNumber = (value: number): Lane =>
  Math.max(0, Math.min(LANE_COUNT - 1, value)) as Lane;

const nextStates = (state: SolverState): SolverState[] => {
  const cooldownAfterStay = Math.max(0, state.cooldown - 1);
  const states: SolverState[] = [{ lane: state.lane, cooldown: cooldownAfterStay }];
  if (state.cooldown === 0) {
    if (state.lane > 0) {
      states.push({ lane: laneFromNumber(state.lane - 1), cooldown: LANE_CHANGE_COOLDOWN_COLUMNS });
    }
    if (state.lane < LANE_COUNT - 1) {
      states.push({ lane: laneFromNumber(state.lane + 1), cooldown: LANE_CHANGE_COOLDOWN_COLUMNS });
    }
  }
  return states;
};

const findReactionMarginFailure = (
  columns: Cell[][],
  fromLane: Lane,
  transitionColumn: number
): FairPathFailure | undefined => {
  for (
    let column = transitionColumn;
    column < transitionColumn + REACTION_MARGIN_COLUMNS;
    column += 1
  ) {
    const cell = columns[column]?.[fromLane];
    if (!cell) continue;
    if (!isCleanCell(cell)) return { lane: fromLane, column };
  }
  return undefined;
};

const findCameraLookaheadFailure = (
  columns: Cell[][],
  toLane: Lane,
  transitionColumn: number
): FairPathFailure | undefined => {
  for (
    let column = transitionColumn - CAMERA_LOOKAHEAD_COLUMNS;
    column < transitionColumn;
    column += 1
  ) {
    if (column < ENTRY_BUFFER_COLUMNS) continue;
    const cell = columns[column]?.[toLane];
    if (!cell) continue;
    if (!isCleanCell(cell)) return { lane: toLane, column };
  }
  return undefined;
};

const hasMigrationMargin = (
  entry: FairPathEntry,
  direction: MoveDirection,
  column: number
): boolean =>
  entry.lastMoveDirection !== direction ||
  entry.migrationStartColumn === undefined ||
  column - entry.migrationStartColumn >= REACTION_MARGIN_COLUMNS * 2;

const migrationMarginFailure = (
  entry: FairPathEntry,
  column: number,
  width: number
): FairPathFailure | undefined =>
  entry.migrationStartColumn === undefined || column >= width - EXIT_BUFFER_COLUMNS
    ? undefined
    : { lane: entry.state.lane, column };

const laterFailure = (
  current: FairPathFailure | undefined,
  candidate: FairPathFailure | undefined
): FairPathFailure | undefined => {
  if (!candidate) return current;
  if (!current || candidate.column > current.column) return candidate;
  return current;
};

export const solveColumns = (columns: Cell[][]): GridSolveResult => {
  if (columns.length === 0) {
    return {
      cleanPathCount: 0,
      entryLaneCoverage: 0,
      reachableExitLanes: [],
      minimumDamage: Number.POSITIVE_INFINITY,
    };
  }

  let totalCleanPaths = 0;
  let coveredEntries = 0;
  let minimumDamage = Number.POSITIVE_INFINITY;
  const exitLaneSet = new Set<Lane>();

  for (let startLane = 0; startLane < LANE_COUNT; startLane += 1) {
    const initialCell = columns[0]?.[startLane];
    if (!initialCell) continue;

    let clean = new Map<string, { state: SolverState; paths: number }>();
    if (isCleanCell(initialCell)) {
      const initialState: SolverState = { lane: startLane as Lane, cooldown: 0 };
      clean.set(stateKey(initialState), { state: initialState, paths: 1 });
    }

    let damage = new Map<string, { state: SolverState; damage: number }>();
    const initialState: SolverState = { lane: startLane as Lane, cooldown: 0 };
    damage.set(stateKey(initialState), { state: initialState, damage: cellDamage(initialCell) });

    for (let column = 1; column < columns.length; column += 1) {
      const nextClean = new Map<string, { state: SolverState; paths: number }>();
      for (const entry of clean.values()) {
        for (const candidate of nextStates(entry.state)) {
          const cell = columns[column]?.[candidate.lane];
          if (!cell || !isCleanCell(cell)) continue;
          const key = stateKey(candidate);
          const existing = nextClean.get(key);
          const paths = Math.min(1_000_000, (existing?.paths ?? 0) + entry.paths);
          nextClean.set(key, { state: candidate, paths });
        }
      }
      clean = nextClean;

      const nextDamage = new Map<string, { state: SolverState; damage: number }>();
      for (const entry of damage.values()) {
        for (const candidate of nextStates(entry.state)) {
          const cell = columns[column]?.[candidate.lane];
          if (!cell) continue;
          const candidateDamage = entry.damage + cellDamage(cell);
          const key = stateKey(candidate);
          const existing = nextDamage.get(key);
          if (!existing || candidateDamage < existing.damage) {
            nextDamage.set(key, { state: candidate, damage: candidateDamage });
          }
        }
      }
      damage = nextDamage;
    }

    const cleanEntries = [...clean.values()];
    if (cleanEntries.length > 0) {
      coveredEntries += 1;
      for (const entry of cleanEntries) {
        totalCleanPaths = Math.min(1_000_000, totalCleanPaths + entry.paths);
        exitLaneSet.add(entry.state.lane);
      }
    }

    for (const entry of damage.values()) {
      minimumDamage = Math.min(minimumDamage, entry.damage);
    }
  }

  return {
    cleanPathCount: totalCleanPaths,
    entryLaneCoverage: coveredEntries,
    reachableExitLanes: [...exitLaneSet].sort((a, b) => a - b),
    minimumDamage,
  };
};

const tileColumns = (tile: CourseTile): Cell[][] =>
  Array.from({ length: tile.width }, (_, column) =>
    Array.from(
      { length: LANE_COUNT },
      (_, lane) => tile.lanes[lane]?.[column] ?? { terrain: 'gap', feature: 'none' }
    )
  );

export const findCleanPathsByEntrance = (tile: CourseTile): SafePath[] => {
  const columns = tileColumns(tile);
  const paths: SafePath[] = [];

  for (let startLane = 0; startLane < LANE_COUNT; startLane += 1) {
    const initialCell = columns[0]?.[startLane];
    if (!initialCell || !isCleanCell(initialCell)) continue;

    const initialState: SolverState = { lane: startLane as Lane, cooldown: 0 };
    let clean = new Map<string, { state: SolverState; points: SafePathPoint[] }>();
    clean.set(stateKey(initialState), {
      state: initialState,
      points: [{ lane: initialState.lane, column: 0 }],
    });

    for (let column = 1; column < columns.length; column += 1) {
      const nextClean = new Map<string, { state: SolverState; points: SafePathPoint[] }>();
      for (const entry of clean.values()) {
        for (const candidate of nextStates(entry.state)) {
          const cell = columns[column]?.[candidate.lane];
          if (!cell || !isCleanCell(cell)) continue;
          const key = stateKey(candidate);
          if (nextClean.has(key)) continue;
          nextClean.set(key, {
            state: candidate,
            points: [...entry.points, { lane: candidate.lane, column }],
          });
        }
      }
      clean = nextClean;
      if (clean.size === 0) break;
    }

    const firstPath = clean.values().next().value;
    if (firstPath) {
      paths.push({
        entranceLane: startLane as Lane,
        points: firstPath.points,
      });
    }
  }

  return paths;
};

const solveFairCleanPathsByEntrance = (tile: CourseTile): FairPathResult => {
  const columns = tileColumns(tile);
  const paths: SafePath[] = [];
  let firstFailure: FairPathFailure | undefined;

  for (let startLane = 0; startLane < LANE_COUNT; startLane += 1) {
    const initialCell = columns[0]?.[startLane];
    if (!initialCell || !isCleanCell(initialCell)) continue;

    const initialState: SolverState = { lane: startLane as Lane, cooldown: 0 };
    let clean = new Map<string, FairPathEntry>();
    const initialEntry: FairPathEntry = {
      state: initialState,
      points: [{ lane: initialState.lane, column: 0 }],
    };
    clean.set(fairPathKey(initialEntry), initialEntry);

    for (let column = 1; column < columns.length; column += 1) {
      const nextClean = new Map<string, FairPathEntry>();
      for (const entry of clean.values()) {
        for (const candidate of nextStates(entry.state)) {
          const cell = columns[column]?.[candidate.lane];
          if (!cell || !isCleanCell(cell)) continue;
          let lastMoveDirection = entry.lastMoveDirection;
          let migrationStartColumn = entry.migrationStartColumn;
          if (candidate.lane !== entry.state.lane) {
            const direction: MoveDirection = candidate.lane > entry.state.lane ? 1 : -1;
            const reactionFailure = findReactionMarginFailure(columns, entry.state.lane, column);
            if (reactionFailure) {
              firstFailure = laterFailure(firstFailure, reactionFailure);
              continue;
            }
            const lookaheadFailure = findCameraLookaheadFailure(columns, candidate.lane, column);
            if (lookaheadFailure) {
              firstFailure = laterFailure(firstFailure, lookaheadFailure);
              continue;
            }
            if (!hasMigrationMargin(entry, direction, column)) {
              firstFailure = laterFailure(
                firstFailure,
                migrationMarginFailure(entry, column, columns.length)
              );
              continue;
            }
            lastMoveDirection = direction;
            migrationStartColumn =
              entry.lastMoveDirection === direction ? entry.migrationStartColumn : column;
          }
          const nextEntry: FairPathEntry = {
            state: candidate,
            points: [...entry.points, { lane: candidate.lane, column }],
          };
          if (lastMoveDirection !== undefined) {
            nextEntry.lastMoveDirection = lastMoveDirection;
          }
          if (migrationStartColumn !== undefined) {
            nextEntry.migrationStartColumn = migrationStartColumn;
          }
          const key = fairPathKey(nextEntry);
          if (nextClean.has(key)) continue;
          nextClean.set(key, nextEntry);
        }
      }
      clean = nextClean;
      if (clean.size === 0) break;
    }

    const firstPath = clean.values().next().value;
    if (firstPath) {
      paths.push({
        entranceLane: startLane as Lane,
        points: firstPath.points,
      });
    }
  }

  if (firstFailure) {
    return { paths, firstFailure };
  }
  return { paths };
};

export const findFairCleanPathsByEntrance = (tile: CourseTile): SafePath[] =>
  solveFairCleanPathsByEntrance(tile).paths;

const findCleanPathFairnessFailure = (tile: CourseTile): FairPathFailure | undefined => {
  const columns = tileColumns(tile);
  let failure: FairPathFailure | undefined;
  for (const path of findCleanPathsByEntrance(tile)) {
    let lastMoveDirection: MoveDirection | undefined;
    let migrationStartColumn: number | undefined;
    for (let index = 1; index < path.points.length; index += 1) {
      const previous = path.points[index - 1];
      const current = path.points[index];
      if (!previous || !current || previous.lane === current.lane) continue;

      const direction: MoveDirection = current.lane > previous.lane ? 1 : -1;
      const reactionFailure = findReactionMarginFailure(columns, previous.lane, current.column);
      failure = laterFailure(failure, reactionFailure);
      if (reactionFailure) continue;

      const lookaheadFailure = findCameraLookaheadFailure(columns, current.lane, current.column);
      failure = laterFailure(failure, lookaheadFailure);
      if (lookaheadFailure) continue;

      if (
        lastMoveDirection === direction &&
        migrationStartColumn !== undefined &&
        current.column - migrationStartColumn < REACTION_MARGIN_COLUMNS * 2
      ) {
        failure = laterFailure(failure, { lane: previous.lane, column: current.column });
        continue;
      }

      const sameDirection = lastMoveDirection === direction;
      migrationStartColumn = sameDirection
        ? (migrationStartColumn ?? current.column)
        : current.column;
      lastMoveDirection = direction;
    }
  }
  return failure;
};

const countHazards = (tile: CourseTile): number =>
  tile.lanes.reduce(
    (total, lane) =>
      total + lane.filter((cell) => cell.terrain === 'gap' || cell.feature === 'obstacle').length,
    0
  );

const calculateDifficulty = (
  hazardCount: number,
  cleanPathCount: number,
  boostCount: number,
  parcelCount: number
): 1 | 2 | 3 | 4 | 5 => {
  let value = 1;
  value += Math.min(2, Math.floor(hazardCount / 7));
  if (cleanPathCount < 20) value += 1;
  if (boostCount + parcelCount >= 6) value += 1;
  return Math.max(1, Math.min(5, value)) as 1 | 2 | 3 | 4 | 5;
};

const checkShape = (tile: CourseTile, issues: ValidationIssue[]): void => {
  if (tile.width !== TILE_WIDTH) {
    issues.push({
      severity: 'error',
      code: 'tile-width',
      message: `Tiles must be exactly ${TILE_WIDTH} columns wide.`,
    });
  }
  if (tile.lanes.length !== LANE_COUNT) {
    issues.push({
      severity: 'error',
      code: 'lane-count',
      message: `Tiles must contain exactly ${LANE_COUNT} lanes.`,
    });
  }
  tile.lanes.forEach((lane, laneIndex) => {
    if (lane.length !== tile.width) {
      issues.push({
        severity: 'error',
        code: 'lane-width',
        message: `Lane ${laneIndex + 1} does not match the tile width.`,
        lane: laneIndex as Lane,
      });
    }
  });
};

const checkBuffers = (tile: CourseTile, issues: ValidationIssue[]): void => {
  for (let laneIndex = 0; laneIndex < LANE_COUNT; laneIndex += 1) {
    for (let column = 0; column < tile.width; column += 1) {
      if (!isBufferColumn(column, tile.width)) continue;
      const cell = tile.lanes[laneIndex]?.[column];
      if (!cell || cell.terrain !== 'road' || cell.feature !== 'none') {
        issues.push({
          severity: 'error',
          code: 'connector-buffer',
          message: `Entry and exit connector zones must stay clear (${ENTRY_BUFFER_COLUMNS} entry and ${EXIT_BUFFER_COLUMNS} exit columns).`,
          lane: laneIndex as Lane,
          column,
        });
      }
    }
  }
};

const checkObjects = (tile: CourseTile, issues: ValidationIssue[]): void => {
  tile.lanes.forEach((lane, laneIndex) => {
    lane.forEach((cell, column) => {
      if (cell.terrain === 'gap' && cell.feature !== 'none') {
        issues.push({
          severity: 'error',
          code: 'feature-on-gap',
          message: 'Gaps cannot also contain an obstacle, boost, or parcel.',
          lane: laneIndex as Lane,
          column,
        });
      }
    });
  });
};

const checkCounts = (tile: CourseTile, issues: ValidationIssue[]): void => {
  const obstacles = countFeature(tile, 'obstacle');
  const gaps = countTerrain(tile, 'gap');
  const boosts = countFeature(tile, 'boost');
  const parcels = countFeature(tile, 'parcel');
  const budget = calculateBuildBudget(tile);

  const checks: Array<[boolean, string, string]> = [
    [budget > MAX_BUILD_BUDGET, 'build-budget', `Build budget exceeds ${MAX_BUILD_BUDGET}.`],
    [obstacles > MAX_OBSTACLES, 'obstacle-limit', `Use at most ${MAX_OBSTACLES} obstacles.`],
    [gaps > MAX_GAPS, 'gap-limit', `Use at most ${MAX_GAPS} gap cells.`],
    [boosts > MAX_BOOSTS, 'boost-limit', `Use at most ${MAX_BOOSTS} boosts.`],
    [parcels > MAX_PARCELS, 'parcel-limit', `Use at most ${MAX_PARCELS} parcels.`],
  ];

  for (const [failed, code, message] of checks) {
    if (failed) issues.push({ severity: 'error', code, message });
  }

  if (obstacles + gaps === 0) {
    issues.push({
      severity: 'warning',
      code: 'no-hazards',
      message: 'This tile is certified but may be too flat to be interesting.',
    });
  }
  if (boosts === 0 && parcels === 0) {
    issues.push({
      severity: 'warning',
      code: 'no-reward-path',
      message: 'Consider adding a boost or parcel to make the risk route meaningful.',
    });
  }
};

export const validateCourseTile = (tile: CourseTile): TileValidationResult => {
  const issues: ValidationIssue[] = [];
  checkShape(tile, issues);
  checkBuffers(tile, issues);
  checkObjects(tile, issues);
  checkCounts(tile, issues);

  const solution = solveColumns(tileColumns(tile));
  if (solution.cleanPathCount === 0) {
    issues.push({
      severity: 'error',
      code: 'no-clean-path',
      message: 'The tile must contain at least one zero-damage path to the exit.',
    });
  }
  if (solution.entryLaneCoverage < LANE_COUNT) {
    issues.push({
      severity: 'error',
      code: 'entry-coverage',
      message: 'A clean route must be reachable from every entrance lane.',
    });
  }
  if (solution.minimumDamage > 0 && Number.isFinite(solution.minimumDamage)) {
    issues.push({
      severity: 'error',
      code: 'forced-damage',
      message: 'The best route still takes damage. Certified tiles must be cleanly completable.',
    });
  }
  const fairResult = solveFairCleanPathsByEntrance(tile);
  if (fairResult.paths.length < LANE_COUNT) {
    const failure = findCleanPathFairnessFailure(tile) ?? fairResult.firstFailure;
    const issue: ValidationIssue = {
      severity: 'error',
      code: 'reaction-margin',
      message: `Forced lane switches need at least ${REACTION_MARGIN_COLUMNS} clean columns of warning.`,
    };
    if (failure) {
      issue.lane = failure.lane;
      issue.column = failure.column;
    }
    issues.push(issue);
  }

  const hazardCount = countHazards(tile);
  const boostCount = countFeature(tile, 'boost');
  const parcelCount = countFeature(tile, 'parcel');
  const buildBudgetUsed = calculateBuildBudget(tile);
  const difficulty = calculateDifficulty(
    hazardCount,
    solution.cleanPathCount,
    boostCount,
    parcelCount
  );
  const metrics: TileMetrics = {
    cleanPathCount: solution.cleanPathCount,
    entryLaneCoverage: solution.entryLaneCoverage,
    reachableExitLanes: solution.reachableExitLanes,
    minimumDamage: Number.isFinite(solution.minimumDamage) ? solution.minimumDamage : 99,
    buildBudgetUsed,
    hazardCount,
    boostCount,
    parcelCount,
    difficulty,
    riskScore: Number(((hazardCount * 2 + boostCount + parcelCount) / tile.width).toFixed(2)),
  };

  return {
    ok: issues.every((issue) => issue.severity !== 'error'),
    issues,
    metrics,
  };
};
