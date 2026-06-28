import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';
import { Hono } from 'hono';
import { api } from './routes/api';
import { internal } from './routes/internal';

const app = new Hono();
app.route('/api', api);
app.route('/internal', internal);

app.onError((error, c) => {
  console.error('Daily Dash server error:', error);
  return c.json(
    { status: 'error', code: 'unhandled-server-error', message: 'Unexpected server error.' },
    500
  );
});

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});
