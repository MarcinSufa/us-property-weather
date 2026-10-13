import console from 'node:console';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const UNKNOWN_ZIP_CODE = '00000';
const fixture = (name) =>
  fileURLToPath(new URL(`../apps/api/src/weather/fixtures/${name}`, import.meta.url));
const successFixture = fixture('current-85268.json');
const unknownFixture = fixture('current-unknown.json');

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  if (request.method !== 'GET' || url.pathname !== '/current') {
    response.writeHead(404).end();
    return;
  }

  const query = url.searchParams.get('query');
  const unknown = query === UNKNOWN_ZIP_CODE;
  const status = unknown ? 400 : 200;
  console.log(`${new Date().toISOString()} /current query=${query} -> ${status}`);
  readFile(unknown ? unknownFixture : successFixture, 'utf8').then(
    (body) => {
      response.writeHead(status, { 'content-type': 'application/json' }).end(body);
    },
    () => {
      response.writeHead(500).end();
    },
  );
});

server.listen(Number(process.env.STUB_PORT ?? 4274), '127.0.0.1');
