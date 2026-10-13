import { z } from 'zod';

export interface Config {
  weatherstackApiKey: string;
  weatherstackBaseUrl: string;
  weatherTimeoutMs: number;
  port: number;
  databasePath: string;
  logLevel: string;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

const apiKeySchema = z.string().min(1);
const baseUrlSchema = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
});
const timeoutSchema = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1));
const portSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(65535));
const databasePathSchema = z.string().min(1);
const logLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);

function optionalValue(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key];
  const trimmedValue = value?.trim();
  return trimmedValue === undefined || trimmedValue === '' ? undefined : trimmedValue;
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const errors: string[] = [];
  const rawApiKey = optionalValue(env, 'WEATHERSTACK_API_KEY');
  const apiKey = apiKeySchema.safeParse(rawApiKey);
  if (!apiKey.success) {
    errors.push('WEATHERSTACK_API_KEY is required');
  }

  const baseUrlValue =
    optionalValue(env, 'WEATHERSTACK_BASE_URL') ?? 'https://api.weatherstack.com';
  const baseUrl = baseUrlSchema.safeParse(baseUrlValue);
  if (!baseUrl.success) {
    errors.push('WEATHERSTACK_BASE_URL must be an absolute HTTP or HTTPS URL');
  }

  const timeoutValue = optionalValue(env, 'WEATHER_TIMEOUT_MS') ?? '5000';
  const timeout = timeoutSchema.safeParse(timeoutValue);
  if (!timeout.success) {
    errors.push('WEATHER_TIMEOUT_MS must be a positive integer');
  }

  const portValue = optionalValue(env, 'PORT') ?? '4000';
  const port = portSchema.safeParse(portValue);
  if (!port.success) {
    errors.push('PORT must be an integer from 1 to 65535');
  }

  const databasePathValue = optionalValue(env, 'DATABASE_PATH') ?? './data/properties.db';
  const databasePath = databasePathSchema.safeParse(databasePathValue);
  if (!databasePath.success) {
    errors.push('DATABASE_PATH must be a non-blank string');
  }

  const logLevelValue = optionalValue(env, 'LOG_LEVEL') ?? 'info';
  const logLevel = logLevelSchema.safeParse(logLevelValue);
  if (!logLevel.success) {
    errors.push('LOG_LEVEL must be one of fatal, error, warn, info, debug, trace or silent');
  }

  if (
    errors.length > 0 ||
    !apiKey.success ||
    !baseUrl.success ||
    !timeout.success ||
    !port.success ||
    !databasePath.success ||
    !logLevel.success
  ) {
    throw new ConfigError(errors.join('; '));
  }

  return {
    weatherstackApiKey: apiKey.data,
    weatherstackBaseUrl: baseUrl.data,
    weatherTimeoutMs: timeout.data,
    port: port.data,
    databasePath: databasePath.data,
    logLevel: logLevel.data,
  };
}
