const PREFIX = 'dd:v1';

export const KEYS = {
  tiles: `${PREFIX}:tiles`,
  routes: `${PREFIX}:routes`,
  dailyRoutes: `${PREFIX}:daily-routes`,
  profiles: `${PREFIX}:profiles`,
  routeIndex: `${PREFIX}:route-index`,
  reportIndex: `${PREFIX}:report-index`,
  reports: `${PREFIX}:reports`,
  featuredCounts: `${PREFIX}:featured-counts`,
  settings: `${PREFIX}:settings`,
  submissionsForDate: (dateKey: string): string => `${PREFIX}:submissions:${dateKey}`,
  leaderboard: (routeId: string, revision: number): string =>
    `${PREFIX}:leaderboard:${routeId}:rev:${revision}`,
  bestRuns: (routeId: string, revision: number): string =>
    `${PREFIX}:best-runs:${routeId}:rev:${revision}`,
  runToken: (token: string): string => `${PREFIX}:run-token:${token}`,
} as const;
