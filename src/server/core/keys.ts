const PREFIX = 'dd:v1';

export const KEYS = {
  tiles: `${PREFIX}:tiles`,
  routes: `${PREFIX}:routes`,
  dailyRoutes: `${PREFIX}:daily-routes`,
  profiles: `${PREFIX}:profiles`,
  routeIndex: `${PREFIX}:route-index`,
  featuredCounts: `${PREFIX}:featured-counts`,
  settings: `${PREFIX}:settings`,
  submissionsForDate: (dateKey: string): string => `${PREFIX}:submissions:${dateKey}`,
  leaderboard: (routeId: string): string => `${PREFIX}:leaderboard:${routeId}`,
  bestRuns: (routeId: string): string => `${PREFIX}:best-runs:${routeId}`,
  runToken: (token: string): string => `${PREFIX}:run-token:${token}`,
} as const;
