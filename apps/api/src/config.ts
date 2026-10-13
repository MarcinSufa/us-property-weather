export interface Config {
  weatherstackApiKey: string;
  weatherstackBaseUrl: string;
  weatherTimeoutMs: number;
  port: number;
  databasePath: string;
  logLevel: string;
}

export function loadConfig(_env: NodeJS.ProcessEnv): Config {
  throw new Error('not implemented');
}
