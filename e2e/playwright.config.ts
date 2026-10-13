import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
import { STUB_PORT } from './weatherstack-stub.ts';

const databaseDirectoryKey = 'COVERTREE_E2E_DATABASE_DIRECTORY';
let databaseDirectory = process.env[databaseDirectoryKey];

if (!databaseDirectory) {
  databaseDirectory = mkdtempSync(join(tmpdir(), 'covertree-e2e-'));
  process.env[databaseDirectoryKey] = databaseDirectory;
  const temporaryDatabaseDirectory = databaseDirectory;
  process.once('exit', () => {
    rmSync(temporaryDatabaseDirectory, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    });
  });
}

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiDirectory = resolve(projectDirectory, 'apps/api');
const webDirectory = resolve(projectDirectory, 'apps/web');
const e2eDirectory = dirname(fileURLToPath(import.meta.url));
const webRequire = createRequire(join(webDirectory, 'package.json'));
const vitePackagePath = webRequire.resolve('vite/package.json');
const viteBinPath = join(dirname(vitePackagePath), 'bin/vite.js');
const databasePath = join(databaseDirectory, 'properties.db');
const stubUrl = `http://127.0.0.1:${STUB_PORT}`;

export default defineConfig({
  testDir: '.',
  testMatch: 'stories.spec.ts',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node weatherstack-stub.ts',
      cwd: e2eDirectory,
      url: `${stubUrl}/__calls`,
      reuseExistingServer: false,
      env: { E2E_WEATHERSTACK_STUB_PORT: String(STUB_PORT) },
    },
    {
      command: 'node src/main.ts',
      cwd: apiDirectory,
      url: 'http://localhost:4000/graphql?query=%7B__typename%7D',
      reuseExistingServer: false,
      env: {
        WEATHERSTACK_BASE_URL: stubUrl,
        WEATHERSTACK_API_KEY: 'e2e-stub-key',
        DATABASE_PATH: databasePath,
        PORT: '4000',
        LOG_LEVEL: 'silent',
      },
    },
    {
      command: `node "${viteBinPath}"`,
      cwd: webDirectory,
      url: 'http://localhost:5173',
      reuseExistingServer: false,
    },
  ],
});
