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

export type ProfileResponse = {
  status: 'ok';
  profile: PlayerProfile;
};

export type LeaderboardResponse = {
  status: 'ok';
  entries: LeaderboardEntry[];
};
