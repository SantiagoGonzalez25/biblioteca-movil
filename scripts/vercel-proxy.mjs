#!/usr/bin/env node
/**
 * Proxy local SOLO para desarrollo cuando el despliegue de Vercel tiene
 * Deployment Protection activa (Vercel Authentication).
 *
 * Por qué existe: el token de bypass NUNCA debe ir en la app. Todo lo que
 * empieza con EXPO_PUBLIC_ queda dentro del bundle y cualquiera puede
 * extraerlo. Este proxy se ejecuta en tu PC, añade el header de bypass y
 * reenvía las peticiones a la API; la app solo habla con el proxy.
 *
 * Uso (PowerShell):
 *   $env:VERCEL_BYPASS_TOKEN="tu-token-de-vercel"
 *   npm run proxy:vercel
 *
 * Luego, en `.env`:
 *   EXPO_PUBLIC_API_URL=http://<IP-DE-TU-PC>:8787
 *
 * El teléfono y la PC deben estar en la misma red. Detén el proxy al terminar.
 * No escribas el token en `.env`, en el código ni en Git.
 */
import http from 'node:http';

const TARGET = (
  process.env.VERCEL_API_TARGET ?? 'https://library-api-santiago-project2.vercel.app'
).replace(/\/+$/, '');
const TOKEN = process.env.VERCEL_BYPASS_TOKEN?.trim();
const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '0.0.0.0';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'authorization,content-type,x-vercel-protection-bypass',
};

if (!TOKEN) {
  console.error('[proxy] Falta VERCEL_BYPASS_TOKEN.');
  console.error('[proxy] En PowerShell: $env:VERCEL_BYPASS_TOKEN="tu-token"; npm run proxy:vercel');
  process.exit(1);
}

function copyRequestHeaders(req) {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (['host', 'connection', 'content-length', 'accept-encoding'].includes(key)) continue;
    if (typeof value === 'string') headers[key] = value;
    else if (Array.isArray(value)) headers[key] = value.join(', ');
  }
  headers['x-vercel-protection-bypass'] = TOKEN;
  return headers;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const headers = copyRequestHeaders(req);
    if (body.length > 0) headers['content-length'] = String(body.length);

    const upstream = await fetch(`${TARGET}${req.url ?? '/'}`, {
      method: req.method,
      headers,
      body: body.length > 0 && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
      redirect: 'manual',
    });

    const responseHeaders = {};
    upstream.headers.forEach((value, key) => {
      // fetch ya descomprime: no reenviamos encoding/length originales.
      if (['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(key)) {
        return;
      }
      responseHeaders[key] = value;
    });
    Object.assign(responseHeaders, CORS_HEADERS);

    const responseBody = Buffer.from(await upstream.arrayBuffer());
    responseHeaders['content-length'] = String(responseBody.length);
    res.writeHead(upstream.status, responseHeaders);
    res.end(responseBody);
  } catch (error) {
    console.error('[proxy] Error reenviando la petición:', error?.message ?? error);
    res.writeHead(502, { 'content-type': 'application/json', ...CORS_HEADERS });
    res.end(
      JSON.stringify({
        error: { code: 'PROXY_ERROR', message: 'No se pudo contactar la API de Vercel' },
      }),
    );
  }
});

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`[proxy] El puerto ${PORT} ya está en uso. Cierra el otro proceso o usa PORT=8788.`);
  } else {
    console.error('[proxy] Error del servidor:', error?.message ?? error);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`[proxy] API de Vercel: ${TARGET}`);
  console.log(`[proxy] Escuchando en http://${HOST}:${PORT}`);
  console.log('[proxy] Token cargado (no se muestra). Detén el proxy al terminar.');
});
