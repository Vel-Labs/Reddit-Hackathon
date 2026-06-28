import type { RouteBundle, TenantIdentity, WorldCatalogRoute } from '../../shared/game/types';

export type WorldCatalog = {
  enabled: boolean;
  publish(route: RouteBundle): Promise<void>;
  random(excludingTenantId?: string): Promise<WorldCatalogRoute | undefined>;
};

/**
 * Deliberately disabled in the MVP. Devvit Redis is scoped to a single app installation,
 * so a real World Tour requires an explicitly configured shared HTTP service, moderation
 * policy, privacy documentation, and an allowlisted network domain.
 */
export const disabledWorldCatalog: WorldCatalog = {
  enabled: false,
  async publish(): Promise<void> {},
  async random(): Promise<WorldCatalogRoute | undefined> {
    return undefined;
  },
};

export const worldTourFallback = (
  tenant: TenantIdentity,
  route: RouteBundle
): WorldCatalogRoute => ({
  globalId: `${tenant.id}:${route.recipe.id}`,
  sourceTenantId: tenant.id,
  sourceTenantName: tenant.name,
  routeId: route.recipe.id,
  publishedAt: route.recipe.createdAt,
  biomeId: route.recipe.biomeId,
  difficulty: Math.round(
    route.tiles.reduce((sum, tile) => sum + (tile.metrics?.difficulty ?? 1), 0) /
      Math.max(1, route.tiles.length)
  ),
  recipe: route.recipe,
  tiles: route.tiles,
});
