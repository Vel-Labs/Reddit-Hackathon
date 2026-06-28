import { context, reddit } from '@devvit/web/server';
import type { TenantIdentity } from '../../shared/game/types';

export const getTenantIdentity = (): TenantIdentity => {
  const name = context.subredditName ?? 'daily-dash-playtest';
  const id = context.subredditId ?? name.toLowerCase();
  return { id, name };
};

export const getCurrentPlayer = async (): Promise<{
  userId: string;
  username: string;
  authenticated: boolean;
}> => {
  const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
  const userId = context.userId ?? `anonymous:${context.postId ?? 'post'}`;
  return {
    userId,
    username,
    authenticated: Boolean(context.userId && username !== 'anonymous'),
  };
};
