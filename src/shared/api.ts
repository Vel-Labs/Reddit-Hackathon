import type {
  AchievementDefinition,
  CourseTile,
  LeaderboardEntry,
  PlayerProfile,
  RouteBundle,
  RunResult,
  RunStart,
  RunSubmission,
  TenantIdentity,
  TileReport,
  TileReportReason,
  TileValidationResult,
} from './game/types';

export type ApiError = {
  status: 'error';
  code: string;
  message: string;
};

export type BootstrapResponse = {
  status: 'ok';
  tenant: TenantIdentity;
  username: string;
  authenticated: boolean;
  dailyRoute: RouteBundle;
  profile: PlayerProfile | null;
  achievements: AchievementDefinition[];
  worldTourEnabled: boolean;
};

export type ValidateTileRequest = {
  tile: CourseTile;
};

export type ValidateTileResponse = {
  status: 'ok';
  validation: TileValidationResult;
};

export type SubmitTileRequest = {
  tile: CourseTile;
};

export type SubmitTileResponse = {
  status: 'ok';
  tile: CourseTile;
  validation: TileValidationResult;
};

export type RouteResponse = {
  status: 'ok';
  route: RouteBundle;
};

export type RoutesResponse = {
  status: 'ok';
  routes: RouteBundle[];
};

export type StartRunRequest = {
  routeId: string;
};

export type StartRunResponse = {
  status: 'ok';
  run: RunStart;
};

export type CompleteRunRequest = RunSubmission;

export type CompleteRunResponse = {
  status: 'ok';
  result: RunResult;
  profile: PlayerProfile;
};

export type CreatorOutcomeTile = {
  tileId: string;
  routeId: string;
  dateKey: string;
  routeRevision: number;
  tileIndex: number;
  crossings: number;
  cleanCrossings: number;
  pathChoices: {
    top: number;
    middle: number;
    bottom: number;
  };
};

export type CreatorOutcomeResponse = {
  status: 'ok';
  profile: PlayerProfile;
  featuredTiles: number;
  totalCrossings: number;
  tiles: CreatorOutcomeTile[];
};

export type ReportTileRequest = {
  routeId: string;
  routeRevision: number;
  tileId: string;
  reason: TileReportReason;
};

export type ReportTileResponse = {
  status: 'ok';
  report: TileReport;
};

export type RemoveTileRequest = {
  routeId: string;
  routeRevision: number;
  reportId?: string;
};

export type RemoveTileResponse = {
  status: 'ok';
  removedTileId: string;
  repairedRoutes: number;
};

export type ProfileResponse = {
  status: 'ok';
  profile: PlayerProfile;
};

export type LeaderboardResponse = {
  status: 'ok';
  routeRevision: number;
  entries: LeaderboardEntry[];
};
