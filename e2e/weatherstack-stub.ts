import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const STUB_PORT = 4174;
export const UNKNOWN_ZIP_CODE = '00000';

let calls = 0;
const successFixture = fileURLToPath(
  new URL('../apps/api/src/weather/fixtures/current-85268.json', import.meta.url),
);
const unknownFixture = fileURLToPath(
  new URL('../apps/api/src/weather/fixtures/current-unknown.json', import.meta.url),
);

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
  if (request.method === 'GET' && url.pathname === '/__calls') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ calls }));
    return;
  }

  if (request.method === 'GET' && url.pathname === '/current') {
    calls += 1;
    const unknown = url.searchParams.get('query') === UNKNOWN_ZIP_CODE;
    const fixture = await readFile(unknown ? unknownFixture : successFixture, 'utf8');
    response.writeHead(unknown ? 400 : 200, { 'content-type': 'application/json' });
    response.end(fixture);
    return;
  }

  response.writeHead(404);
  response.end();
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.E2E_WEATHERSTACK_STUB_PORT ?? STUB_PORT);
  server.listen(port, '127.0.0.1');
}
