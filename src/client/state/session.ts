import type { BootstrapResponse } from '../../shared/api';
import type { PlayerProfile, RouteBundle } from '../../shared/game/types';

export type ClientSession = {
  bootstrap?: BootstrapResponse;
  lastRoute?: RouteBundle;
  profile?: PlayerProfile;
};

export const session: ClientSession = {};
