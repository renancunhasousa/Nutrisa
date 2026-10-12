import fs from 'node:fs';
import path from 'node:path';
import handler, { MAX_BODY_BYTES } from '../api/ai.js';
import productsHandler from '../api/products.js';

function syncEnvFromDisk() {
  for (const dir of [process.cwd(), path.resolve(process.cwd(), '..')]) {
    const envFile = path.join(dir, '.env');
    if (fs.existsSync(envFile)) {
      try {
        const content = fs.readFileSync(envFile, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eq = trimmed.indexOf('=');
          if (eq > 0) {
            const k = trimmed.slice(0, eq).trim();
            const v = trimmed.slice(eq + 1).trim();
            if (v) process.env[k] = v;
          }
        }
      } catch {}
    }
  }
}

export function localApiPlugin() {
  return {
    name: 'nutrisa-local-api',
    configureServer(server) {
      server.middlewares.use('/api/products', async (req, res) => {
        syncEnvFromDisk();
        res.status = code => { res.statusCode = code; return res; };
        res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
        const parsedUrl = new URL(req.url || '/', 'http://localhost');
        req.query = Object.fromEntries(parsedUrl.searchParams);
        try {
          await productsHandler(req, res);
        } catch {
          if (!res.writableEnded) res.status(500).json({ error: 'Não foi possível consultar o produto.' });
        }
      });
      server.middlewares.use('/api/ai', async (req, res) => {
        syncEnvFromDisk();
        res.status = code => { res.statusCode = code; return res; };
        res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
        try {
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) { res.status(413).json({ error: 'Arquivos muito grandes.' }); return; }
            chunks.push(chunk);
          }
          req.body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
          await handler(req, res);
        } catch {
          if (!res.writableEnded) res.status(400).json({ error: 'Requisição inválida.' });
        }
      });
    },
  };
}
