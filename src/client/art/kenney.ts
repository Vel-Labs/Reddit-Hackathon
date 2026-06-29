export type KenneyRole =
  | 'road-surface'
  | 'obstacle-crate'
  | 'boost-marker'
  | 'collectible-stamp'
  | 'background-far'
  | 'background-near';

export const KENNEY_ROLE_PATHS: Record<KenneyRole, string> = {
  'road-surface': 'terrain/grass-mid.png',
  'obstacle-crate': 'props/crate.png',
  'boost-marker': 'effects/spring.png',
  'collectible-stamp': 'items/coin-gold.png',
  'background-far': 'backgrounds/blue-grass.png',
  'background-near': 'terrain/grass-center.png',
};

export const kenneyTextureKey = (role: KenneyRole): string => `kenney:${role}`;

export const kenneyAssetUrl = (role: KenneyRole): string =>
  `/assets/kenney/${KENNEY_ROLE_PATHS[role]}`;
