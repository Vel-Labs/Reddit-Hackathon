import { reddit } from '@devvit/web/server';
import type { RouteBundle } from '../../shared/game/types';

export const createGamePost = async (route: RouteBundle) =>
  reddit.submitCustomPost({
    title: `Daily Dash · ${route.recipe.dateKey} · Build today, ride forever`,
  });
