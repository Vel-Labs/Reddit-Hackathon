import type { GAME_VERSION } from './constants';

export type Lane = 0 | 1 | 2;
export type Terrain = 'road' | 'gap';
export type Feature = 'none' | 'obstacle' | 'boost' | 'parcel';
export type TileStatus = 'draft' | 'certified' | 'featured' | 'removed';
export type RouteScope = 'tenant' | 'world';

export type Cell = {
  terrain: Terrain;
  feature: Feature;
};

export type TileMetrics = {
  cleanPathCount: number;
  entryLaneCoverage: number;
  reachableExitLanes: Lane[];
  minimumDamage: number;
  buildBudgetUsed: number;
  hazardCount: number;
  boostCount: number;
  parcelCount: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  riskScore: number;
};

export type CourseTile = {
  version: typeof GAME_VERSION;
  id: string;
  tenantId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  width: number;
  lanes: Cell[][];
  visualSeed: number;
  status: TileStatus;
  metrics?: TileMetrics;
};

export type RouteRecipe = {
  version: typeof GAME_VERSION;
  id: string;
  tenantId: string;
  tenantName: string;
  dateKey: string;
  createdAt: string;
  tileIds: string[];
  fallbackTileIds: string[];
  visualSeed: number;
  biomeId: string;
  compilerVersion: number;
  revision: number;
  scope: RouteScope;
};

export type RouteBundle = {
  recipe: RouteRecipe;
  tiles: CourseTile[];
};

export type RunStart = {
  token: string;
  routeId: string;
  issuedAt: string;
  expiresAt: string;
};

export type RunSubmission = {
  token: string;
  routeId: string;
  elapsedMs: number;
  damageTaken: number;
  parcelsCollected: number;
  boostsTriggered: number;
  completed: boolean;
};

export type RunResult = RunSubmission & {
  userId: string;
  username: string;
  score: number;
  completedAt: string;
};

export type AchievementId =
  | 'first-certified-tile'
  | 'featured-builder'
  | 'clean-delivery'
  | 'roadbook-regular'
  | 'seven-day-route'
  | 'well-travelled'
  | 'balanced-designer'
  | 'world-tourist';

export type AchievementDefinition = {
  id: AchievementId;
  name: string;
  description: string;
  category: 'builder' | 'runner' | 'community' | 'exploration';
  target: number;
  stat: keyof PlayerStats;
};

export type AchievementUnlock = {
  id: AchievementId;
  unlockedAt: string;
};

export type PlayerStats = {
  tilesSubmitted: number;
  tilesCertified: number;
  tilesFeatured: number;
  runsCompleted: number;
  cleanRuns: number;
  uniqueRoutesCompleted: number;
  currentStreak: number;
  bestStreak: number;
  totalTileCrossings: number;
  balancedTiles: number;
  worldTourCommunities: number;
};

export type PlayerProfile = {
  userId: string;
  username: string;
  tenantId: string;
  stats: PlayerStats;
  unlocked: AchievementUnlock[];
  completedRouteIds: string[];
  lastPlayedDateKey?: string;
};

export type ValidationIssue = {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  lane?: Lane;
  column?: number;
};

export type TileValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
  metrics: TileMetrics;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  score: number;
};

export type TenantIdentity = {
  id: string;
  name: string;
};

export type WorldCatalogRoute = {
  globalId: string;
  sourceTenantId: string;
  sourceTenantName: string;
  routeId: string;
  publishedAt: string;
  biomeId: string;
  difficulty: number;
  recipe: RouteRecipe;
  tiles: CourseTile[];
};
