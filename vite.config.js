import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function localRegistrationApi() {
  return {
    name: 'local-registration-api',
    configureServer(server) {
      server.middlewares.use('/api/register', async (req, res) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const { default: register } = await import('./api/register.js');

            await register(
              { method: req.method, body: payload },
              {
                status(code) {
                  res.statusCode = code;
                  return this;
                },
                json(result) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                },
              },
            );
          } catch {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Could not save registration.' }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.DATABASE_URL ||= env.DATABASE_URL;

  return {
    plugins: [react(), localRegistrationApi()],
  };
});
