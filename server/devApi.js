import handler, { MAX_BODY_BYTES } from '../api/ai.js';
export function localApiPlugin() {
  return {
    name: 'nutrisa-local-api',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
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
