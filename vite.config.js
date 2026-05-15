import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function localRegistrationLog() {
  return {
    name: 'local-registration-log',
    configureServer(server) {
      server.middlewares.use('/api/register', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const email = String(payload.email || '').trim().toLowerCase();

            if (!emailPattern.test(email)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Enter a valid email address.' }));
              return;
            }

            const logDir = path.resolve(server.config.root, 'data');
            const logFile = path.join(logDir, 'registered-emails.log');
            const entry = `${new Date().toISOString()}\t${email}\n`;

            await fs.mkdir(logDir, { recursive: true });
            await fs.appendFile(logFile, entry, 'utf8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
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

export default defineConfig({
  plugins: [react(), localRegistrationLog()],
});
