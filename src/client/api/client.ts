import type {
  ApiError,
  BootstrapResponse,
  CompleteRunRequest,
  CompleteRunResponse,
  LeaderboardResponse,
  RouteResponse,
  StartRunResponse,
  SubmitTileRequest,
  SubmitTileResponse,
} from '../../shared/api';
import type { CourseTile } from '../../shared/game/types';

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const body = (await response.json()) as T | ApiError;
  if (
    !response.ok ||
    (typeof body === 'object' && body !== null && 'status' in body && body.status === 'error')
  ) {
    const error = body as ApiError;
    throw new Error(error.message ?? `Request failed with ${response.status}.`);
  }
  return body as T;
};

export const apiClient = {
  bootstrap: (): Promise<BootstrapResponse> => requestJson('/api/bootstrap'),
  dailyRoute: (): Promise<RouteResponse> => requestJson('/api/routes/daily'),
  randomRoute: (): Promise<RouteResponse> => requestJson('/api/routes/random'),
  submitTile: (tile: CourseTile): Promise<SubmitTileResponse> =>
    requestJson('/api/tiles', {
      method: 'POST',
      body: JSON.stringify({ tile } satisfies SubmitTileRequest),
    }),
  startRun: (routeId: string): Promise<StartRunResponse> =>
    requestJson('/api/runs/start', {
      method: 'POST',
      body: JSON.stringify({ routeId }),
    }),
  completeRun: (run: CompleteRunRequest): Promise<CompleteRunResponse> =>
    requestJson('/api/runs/complete', {
      method: 'POST',
      body: JSON.stringify(run),
    }),
  leaderboard: (routeId: string): Promise<LeaderboardResponse> =>
    requestJson(`/api/leaderboards/${encodeURIComponent(routeId)}`),
};
