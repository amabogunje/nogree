import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function localRegistrationApi() {
  return {
    name: 'local-registration-api',
    configureServer(server) {
      const routes = {
        '/register': 'api/register.js',
        '/products': 'api/products.js',
        '/shipping-quote': 'api/shipping-quote.js',
        '/checkout': 'api/checkout.js',
        '/admin/catalog': 'api/admin/catalog.js',
        '/printful/webhook': 'api/printful/webhook.js',
      };

      server.middlewares.use('/api', async (req, res, next) => {
        const requestUrl = new URL(req.url || '/', 'http://localhost');
        const modulePath = routes[requestUrl.pathname];

        if (!modulePath) {
          next();
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const payload = body ? JSON.parse(body) : {};
            const handlerUrl = pathToFileURL(path.resolve(server.config.root, modulePath)).href;
            const { default: handler } = await import(handlerUrl);

            await handler(
              {
                method: req.method,
                body: payload,
                headers: req.headers,
                query: Object.fromEntries(requestUrl.searchParams),
              },
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
          } catch (error) {
            console.error('Local API error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message || 'Could not process the request.' }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  for (const key of ['CATALOG_ADMIN_PASSWORD', 'DATABASE_URL', 'PRINTFUL_API_TOKEN', 'PRINTFUL_WEBHOOK_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY', 'EMAIL_FROM', 'EMAIL_REPLY_TO']) {
    process.env[key] ||= env[key];
  }

  return {
    plugins: [react(), localRegistrationApi()],
  };
});
