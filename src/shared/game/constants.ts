export const GAME_VERSION = 1 as const;
export const LANE_COUNT = 3 as const;
export const TILE_WIDTH = 18 as const;
export const ENTRY_BUFFER_COLUMNS = 3 as const;
export const EXIT_BUFFER_COLUMNS = 3 as const;
export const LANE_CHANGE_COOLDOWN_COLUMNS = 1 as const;
export const REACTION_MARGIN_COLUMNS = 2 as const;
export const CAMERA_LOOKAHEAD_COLUMNS = 2 as const;
export const MAX_BUILD_BUDGET = 24 as const;
export const MAX_OBSTACLES = 9 as const;
export const MAX_GAPS = 14 as const;
export const MAX_BOOSTS = 5 as const;
export const MAX_PARCELS = 7 as const;
export const DEFAULT_ROUTE_LENGTH = 8 as const;
export const INTEGRITY_MAX = 3 as const;

export const FEATURE_COST = {
  none: 0,
  obstacle: 2,
  boost: 2,
  parcel: 1,
} as const;

export const TERRAIN_COST = {
  road: 0,
  gap: 1,
} as const;
