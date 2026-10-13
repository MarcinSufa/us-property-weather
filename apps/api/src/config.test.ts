import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from './config.ts';

describe('configuration loading', () => {
  it('AC-CONFIG-1 applies defaults when only the key is set', () => {
    expect(loadConfig({ WEATHERSTACK_API_KEY: ' marker-key ' })).toEqual({
      weatherstackApiKey: 'marker-key',
      weatherstackBaseUrl: 'https://api.weatherstack.com',
      weatherTimeoutMs: 5000,
      port: 4000,
      databasePath: './data/properties.db',
      logLevel: 'info',
    });
  });

  it('AC-CONFIG-1 returns all configured values with numeric values parsed', () => {
    expect(
      loadConfig({
        WEATHERSTACK_API_KEY: 'marker-key',
        WEATHERSTACK_BASE_URL: 'http://localhost:8080/weather',
        WEATHER_TIMEOUT_MS: '2500',
        PORT: '5173',
        DATABASE_PATH: 'data/custom.db',
        LOG_LEVEL: 'debug',
      }),
    ).toEqual({
      weatherstackApiKey: 'marker-key',
      weatherstackBaseUrl: 'http://localhost:8080/weather',
      weatherTimeoutMs: 2500,
      port: 5173,
      databasePath: 'data/custom.db',
      logLevel: 'debug',
    });
  });

  it.each([
    ['unset key', { WEATHERSTACK_API_KEY: undefined }, 'WEATHERSTACK_API_KEY'],
    ['empty key', { WEATHERSTACK_API_KEY: '' }, 'WEATHERSTACK_API_KEY'],
    ['blank key', { WEATHERSTACK_API_KEY: '   ' }, 'WEATHERSTACK_API_KEY'],
    [
      'invalid URL',
      { WEATHERSTACK_API_KEY: 'marker-key', WEATHERSTACK_BASE_URL: 'not a url' },
      'WEATHERSTACK_BASE_URL',
    ],
    [
      'unsupported URL scheme',
      { WEATHERSTACK_API_KEY: 'marker-key', WEATHERSTACK_BASE_URL: 'ftp://example.test' },
      'WEATHERSTACK_BASE_URL',
    ],
    [
      'non-numeric timeout',
      { WEATHERSTACK_API_KEY: 'marker-key', WEATHER_TIMEOUT_MS: 'abc' },
      'WEATHER_TIMEOUT_MS',
    ],
    [
      'zero timeout',
      { WEATHERSTACK_API_KEY: 'marker-key', WEATHER_TIMEOUT_MS: '0' },
      'WEATHER_TIMEOUT_MS',
    ],
    [
      'negative timeout',
      { WEATHERSTACK_API_KEY: 'marker-key', WEATHER_TIMEOUT_MS: '-5' },
      'WEATHER_TIMEOUT_MS',
    ],
    [
      'fractional timeout',
      { WEATHERSTACK_API_KEY: 'marker-key', WEATHER_TIMEOUT_MS: '1.5' },
      'WEATHER_TIMEOUT_MS',
    ],
    ['non-numeric port', { WEATHERSTACK_API_KEY: 'marker-key', PORT: 'abc' }, 'PORT'],
    ['zero port', { WEATHERSTACK_API_KEY: 'marker-key', PORT: '0' }, 'PORT'],
    ['large port', { WEATHERSTACK_API_KEY: 'marker-key', PORT: '70000' }, 'PORT'],
    ['fractional port', { WEATHERSTACK_API_KEY: 'marker-key', PORT: '40.5' }, 'PORT'],
    ['unknown log level', { WEATHERSTACK_API_KEY: 'marker-key', LOG_LEVEL: 'loud' }, 'LOG_LEVEL'],
  ] as const)('AC-CONFIG-2 names the invalid variable for %s', (_scenario, env, variable) => {
    try {
      loadConfig(env);
      throw new Error('Expected configuration validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      expect((error as Error).message).toContain(variable);
    }
  });

  it('AC-CONFIG-2 reports every broken variable in one ConfigError', () => {
    try {
      loadConfig({
        WEATHERSTACK_API_KEY: '',
        WEATHERSTACK_BASE_URL: 'ftp://example.test',
        WEATHER_TIMEOUT_MS: 'abc',
        PORT: '70000',
        LOG_LEVEL: 'loud',
      });
      throw new Error('Expected configuration validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      const message = (error as Error).message;
      for (const variable of [
        'WEATHERSTACK_API_KEY',
        'WEATHERSTACK_BASE_URL',
        'WEATHER_TIMEOUT_MS',
        'PORT',
        'LOG_LEVEL',
      ]) {
        expect(message).toContain(variable);
      }
    }
  });

  it('AC-CONFIG-3 never exposes secret or malformed values in error output', () => {
    const secretMarker = 'marker-key-do-not-leak';
    const malformedMarker = 'marker-invalid-port-do-not-leak';
    try {
      loadConfig({ WEATHERSTACK_API_KEY: secretMarker, PORT: malformedMarker });
      throw new Error('Expected configuration validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      const configError = error as ConfigError;
      for (const rendered of [
        configError.message,
        String(configError),
        configError.stack ?? '',
        JSON.stringify(configError, Object.getOwnPropertyNames(configError)),
      ]) {
        expect(rendered).not.toContain(secretMarker);
        expect(rendered).not.toContain(malformedMarker);
      }
    }
  });

  it('AC-CONFIG-3 treats blank optional variables as unset', () => {
    expect(
      loadConfig({
        WEATHERSTACK_API_KEY: 'marker-key',
        WEATHERSTACK_BASE_URL: '   ',
        WEATHER_TIMEOUT_MS: '',
        PORT: ' ',
        DATABASE_PATH: '  ',
        LOG_LEVEL: '',
      }),
    ).toEqual({
      weatherstackApiKey: 'marker-key',
      weatherstackBaseUrl: 'https://api.weatherstack.com',
      weatherTimeoutMs: 5000,
      port: 4000,
      databasePath: './data/properties.db',
      logLevel: 'info',
    });
  });
});
