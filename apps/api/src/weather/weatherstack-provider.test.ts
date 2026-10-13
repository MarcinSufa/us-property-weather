import { readFileSync } from 'node:fs';
import { Writable } from 'node:stream';
import { inspect } from 'node:util';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import type { PropertyAddress } from '../property/property.ts';
import { LocationNotFoundError, WeatherUnavailableError } from './weather-provider.ts';
import { WeatherstackProvider } from './weatherstack-provider.ts';

const markerKey = 'MARKER_KEY_7f3a';
const knownFixture = JSON.parse(
  readFileSync(new URL('./fixtures/current-85268.json', import.meta.url), 'utf8'),
) as {
  location: { lat: string; lon: string };
  current: Record<string, unknown>;
};
const unknownFixture = JSON.parse(
  readFileSync(new URL('./fixtures/current-unknown.json', import.meta.url), 'utf8'),
) as { success: false; error: { code: number; type: string; info: string } };

interface FetchCall {
  input: RequestInfo | URL;
  init: RequestInit | undefined;
}

interface Harness {
  provider: WeatherstackProvider;
  calls: FetchCall[];
  logs: string[];
}

type FailureKind = 'location_not_found' | 'unavailable';

interface FailureCase {
  criterion: string;
  label: string;
  expectedKind: FailureKind;
  expectedReason: string;
  status?: number;
  body?: unknown;
  bodyText?: string;
  fetchError?: (url: string) => Error;
  bodyReadError?: (url: string) => Error;
}

const failureCases: FailureCase[] = [
  {
    criterion: 'AC-WEATHER-3',
    label: 'HTTP 200 success false',
    expectedKind: 'unavailable',
    expectedReason: 'code_101',
    status: 200,
    body: { success: false, error: { code: 101, type: 'invalid_access_key' } },
  },
  {
    criterion: 'AC-WEATHER-4',
    label: 'code 615 HTTP 400 fixture',
    expectedKind: 'location_not_found',
    expectedReason: 'code_615',
    status: 400,
    body: unknownFixture,
  },
  {
    criterion: 'AC-WEATHER-4',
    label: 'code 615 HTTP 200',
    expectedKind: 'location_not_found',
    expectedReason: 'code_615',
    status: 200,
    body: unknownFixture,
  },
  ...[101, 104, 105, 106, 999].map((code): FailureCase => ({
    criterion: 'AC-WEATHER-5',
    label: `Weatherstack error code ${code}`,
    expectedKind: 'unavailable',
    expectedReason: `code_${code}`,
    status: code === 106 ? 429 : 200,
    body: { success: false, error: { code, type: 'request_failed' } },
  })),
  {
    criterion: 'AC-WEATHER-6',
    label: 'HTTP 500 with a non-JSON body',
    expectedKind: 'unavailable',
    expectedReason: 'http_500',
    status: 500,
    bodyText: 'not json',
  },
  {
    criterion: 'AC-WEATHER-6',
    label: 'rejected fetch is a network failure',
    expectedKind: 'unavailable',
    expectedReason: 'network',
    fetchError: (url) => hostileError(url, 'Fetch failed', 'TypeError'),
  },
  {
    criterion: 'AC-WEATHER-6',
    label: 'aborted fetch is a timeout',
    expectedKind: 'unavailable',
    expectedReason: 'timeout',
    fetchError: (url) =>
      hostileError(url, 'The operation was aborted due to timeout', 'TimeoutError'),
  },
  {
    criterion: 'AC-WEATHER-6',
    label: 'unreadable body is unreadable_body on HTTP 200',
    expectedKind: 'unavailable',
    expectedReason: 'unreadable_body',
    status: 200,
    bodyText: 'not json',
  },
  {
    criterion: 'AC-WEATHER-6',
    label: 'body read timeout is a timeout',
    expectedKind: 'unavailable',
    expectedReason: 'timeout',
    status: 200,
    bodyReadError: (url) => hostileError(url, 'Body read timed out', 'TimeoutError'),
  },
  {
    criterion: 'AC-WEATHER-6',
    label: 'body read network failure is network',
    expectedKind: 'unavailable',
    expectedReason: 'network',
    status: 200,
    bodyReadError: (url) => hostileError(url, 'Body read failed', 'TypeError'),
  },
  {
    criterion: 'AC-WEATHER-6',
    label: 'missing location is unexpected_shape',
    expectedKind: 'unavailable',
    expectedReason: 'unexpected_shape',
    status: 200,
    body: { current: {} },
  },
  ...[
    ['number latitude', 33.609, '-111.724'],
    ['missing latitude', undefined, '-111.724'],
    ['empty latitude', '', '-111.724'],
    ['blank latitude', '   ', '-111.724'],
    ['nonnumeric latitude', 'abc', '-111.724'],
    ['hex latitude', '0x10', '-111.724'],
    ['exponent latitude', '1e3', '-111.724'],
    ['plus sign latitude', '+33.6', '-111.724'],
    ['trailing dot latitude', '33.', '-111.724'],
    ['leading dot latitude', '.5', '-111.724'],
    ['leading space latitude', ' 33.609', '-111.724'],
    ['out-of-range latitude', '90.001', '-111.724'],
    ['NaN latitude', 'NaN', '-111.724'],
    ['infinite latitude', 'Infinity', '-111.724'],
    ['number longitude', '33.609', -111.724],
    ['missing longitude', '33.609', undefined],
    ['empty longitude', '33.609', ''],
    ['blank longitude', '33.609', '  '],
    ['nonnumeric longitude', '33.609', 'abc'],
    ['hex longitude', '33.609', '0x10'],
    ['exponent longitude', '33.609', '1e3'],
    ['plus sign longitude', '33.609', '+33.6'],
    ['trailing dot longitude', '33.609', '33.'],
    ['leading dot longitude', '33.609', '.5'],
    ['leading space longitude', '33.609', ' 33.609'],
    ['out-of-range longitude', '33.609', '-180.001'],
    ['NaN longitude', '33.609', 'NaN'],
    ['infinite longitude', '33.609', 'Infinity'],
  ].map(([label, lat, lon]): FailureCase => ({
    criterion: 'AC-WEATHER-6',
    label: `${String(label)} is unexpected_shape`,
    expectedKind: 'unavailable',
    expectedReason: 'unexpected_shape',
    status: 200,
    body: { location: { lat, lon }, current: {} },
  })),
  {
    criterion: 'AC-WEATHER-6',
    label: 'current missing is unexpected_shape',
    expectedKind: 'unavailable',
    expectedReason: 'unexpected_shape',
    status: 200,
    body: { location: { lat: '1', lon: '2' } },
  },
  {
    criterion: 'AC-WEATHER-6',
    label: 'current array is unexpected_shape',
    expectedKind: 'unavailable',
    expectedReason: 'unexpected_shape',
    status: 200,
    body: { location: { lat: '1', lon: '2' }, current: [] },
  },
  {
    criterion: 'AC-WEATHER-6',
    label: 'null current is unexpected_shape',
    expectedKind: 'unavailable',
    expectedReason: 'unexpected_shape',
    status: 200,
    body: { location: { lat: '1', lon: '2' }, current: null },
  },
  {
    criterion: 'AC-WEATHER-6',
    label: 'non-JSON success response is unreadable_body',
    expectedKind: 'unavailable',
    expectedReason: 'unreadable_body',
    status: 200,
    bodyText: '{broken',
  },
  {
    criterion: 'AC-WEATHER-6',
    label: 'non-2xx JSON with an unexpected shape is http_500',
    expectedKind: 'unavailable',
    expectedReason: 'http_500',
    status: 500,
    body: { message: 'server error' },
  },
];

function hostileError(url: string, message: string, name: string): Error {
  const error = new Error(`${message}: ${url}`, { cause: new Error(`cause: ${url}`) });
  error.name = name;
  return error;
}

function address(zipCode = '85268'): PropertyAddress {
  return { street: '1 Main St', city: 'Fountain Hills', state: 'AZ', zipCode };
}

function createHarness(
  reply: (url: string, init: RequestInit | undefined) => Promise<Response>,
  apiKey = markerKey,
): Harness {
  const calls: FetchCall[] = [];
  const logs: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer | string, _encoding, callback) {
      logs.push(String(chunk));
      callback();
    },
  });
  const logger = pino({ level: 'trace' }, stream);
  const fetchStub: typeof fetch = (input, init) => {
    calls.push({ input, init });
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return reply(url, init);
  };
  return {
    provider: new WeatherstackProvider({
      fetch: fetchStub,
      baseUrl: 'https://weather.example.test/v1',
      apiKey,
      timeoutMs: 1234,
      logger,
    }),
    calls,
    logs,
  };
}

function responseFor(failure: FailureCase, url: string): Promise<Response> {
  if (failure.fetchError) return Promise.reject(failure.fetchError(url));

  const status = failure.status ?? 200;
  const body = failure.bodyText ?? JSON.stringify(failure.body ?? {});
  const response = new Response(body, { status });
  if (failure.bodyReadError) {
    const readError = failure.bodyReadError(url);
    Object.defineProperty(response, 'text', {
      value: () => Promise.reject(readError),
    });
  }
  return Promise.resolve(response);
}

function errorTextDeep(value: unknown, seen = new Set<object>()): string {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) {
    return String(value);
  }
  const objectValue = value;
  if (seen.has(objectValue)) return '[Circular]';
  seen.add(objectValue);
  const members = Reflect.ownKeys(objectValue).flatMap((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(objectValue, key);
    if (!descriptor) return [];
    const memberValue =
      'value' in descriptor ? errorTextDeep(descriptor.value, seen) : '[Accessor]';
    return [`${String(key)}=${memberValue}`];
  });
  return [inspect(value, { depth: Infinity, showHidden: true }), ...members].join('\n');
}

function logFields(lines: string[]): Array<Record<string, unknown>> {
  return lines.map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe('WeatherstackProvider', () => {
  it('AC-WEATHER-1 makes one GET request to the injected base URL with zip and timeout signal', async () => {
    const harness = createHarness(() =>
      Promise.resolve(new Response(JSON.stringify(knownFixture), { status: 200 })),
    );

    await harness.provider.getCurrentWeather(address());

    expect(harness.calls).toHaveLength(1);
    const call = harness.calls[0];
    if (!call) throw new Error('Expected one recorded fetch call');
    const input = call.input;
    const requestUrl = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    );
    expect(requestUrl.origin).toBe('https://weather.example.test');
    expect(requestUrl.pathname).toBe('/v1/current');
    expect(requestUrl.searchParams.get('query')).toBe('85268');
    expect(requestUrl.searchParams.get('access_key')).toBe(markerKey);
    expect(call?.init?.method).toBe('GET');
    expect(call?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('AC-WEATHER-2 parses the fixture string coordinates to finite numbers', async () => {
    const harness = createHarness(() =>
      Promise.resolve(new Response(JSON.stringify(knownFixture), { status: 200 })),
    );

    const weather = await harness.provider.getCurrentWeather(address());

    expect(weather.lat).toBe(Number(knownFixture.location.lat));
    expect(weather.long).toBe(Number(knownFixture.location.lon));
    expect(Number.isFinite(weather.lat)).toBe(true);
    expect(Number.isFinite(weather.long)).toBe(true);
  });

  it('AC-WEATHER-2 accepts the inclusive coordinate bounds', async () => {
    const fixture = {
      ...knownFixture,
      location: { ...knownFixture.location, lat: '-90', lon: '180' },
    };
    const harness = createHarness(() =>
      Promise.resolve(new Response(JSON.stringify(fixture), { status: 200 })),
    );

    const weather = await harness.provider.getCurrentWeather(address());

    expect(weather.lat).toBe(-90);
    expect(weather.long).toBe(180);
  });

  it('AC-WEATHER-8 keeps current whole, including nested and unknown keys', async () => {
    const current = { ...knownFixture.current, adapter_future_field: { preserved: true } };
    const fixture = { ...knownFixture, current };
    const harness = createHarness(() =>
      Promise.resolve(new Response(JSON.stringify(fixture), { status: 200 })),
    );

    const weather = await harness.provider.getCurrentWeather(address());

    expect(weather.current).toEqual(current);
    expect(weather.current.astro).toEqual(knownFixture.current.astro);
    expect(weather.current.air_quality).toEqual(knownFixture.current.air_quality);
    expect(weather.current.adapter_future_field).toEqual({ preserved: true });
  });

  it.each(failureCases)(
    '$criterion $label rejects with the mapped weather error',
    async (failure) => {
      const harness = createHarness((url) => responseFor(failure, url));

      const result = harness.provider.getCurrentWeather(address());

      if (failure.expectedKind === 'location_not_found') {
        await expect(result).rejects.toBeInstanceOf(LocationNotFoundError);
      } else {
        await expect(result).rejects.toBeInstanceOf(WeatherUnavailableError);
        await expect(result).rejects.toMatchObject({ reason: failure.expectedReason });
      }
      expect(harness.calls).toHaveLength(1);
    },
  );

  it.each(failureCases)(
    'AC-WEATHER-13 logs one $label outcome with failure fields',
    async (failure) => {
      const harness = createHarness((url) => responseFor(failure, url));

      await harness.provider.getCurrentWeather(address()).catch(() => undefined);

      expect(harness.logs).toHaveLength(1);
      expect(logFields(harness.logs)[0]).toMatchObject({
        outcome: failure.expectedKind,
        reason: failure.expectedReason,
      });
      expect(logFields(harness.logs)[0]?.durationMs).toEqual(expect.any(Number));
      expect(logFields(harness.logs)[0]?.durationMs).toBeGreaterThanOrEqual(0);
      expect(harness.calls).toHaveLength(1);
    },
  );

  it('AC-WEATHER-13 logs one success line with outcome and duration', async () => {
    const harness = createHarness(() =>
      Promise.resolve(new Response(JSON.stringify(knownFixture), { status: 200 })),
    );

    await harness.provider.getCurrentWeather(address());

    expect(harness.logs).toHaveLength(1);
    expect(logFields(harness.logs)[0]).toMatchObject({ outcome: 'ok' });
    expect(logFields(harness.logs)[0]?.durationMs).toEqual(expect.any(Number));
    expect(logFields(harness.logs)[0]?.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('AC-WEATHER-6 propagates a success logger error without logging again', async () => {
    const logs: string[] = [];
    const stream = new Writable({
      write(chunk: Buffer | string, _encoding, callback) {
        logs.push(String(chunk));
        callback();
      },
    });
    const logger = pino({ level: 'trace' }, stream);
    const originalError = new Error('logger failed');
    logger.info = () => {
      throw originalError;
    };
    const fetchStub: typeof fetch = () =>
      Promise.resolve(new Response(JSON.stringify(knownFixture), { status: 200 }));
    const provider = new WeatherstackProvider({
      fetch: fetchStub,
      baseUrl: 'https://weather.example.test/v1',
      apiKey: markerKey,
      timeoutMs: 1234,
      logger,
    });
    const result = provider.getCurrentWeather(address());

    await expect(result).rejects.toBe(originalError);
    const rejection = await result.catch((error: unknown) => error);
    expect(rejection).not.toBeInstanceOf(WeatherUnavailableError);
    expect(logs).toHaveLength(0);
  });

  const reasonCases = [
    'timeout',
    'network',
    'http_500',
    'code_106',
    'unreadable_body',
    'unexpected_shape',
  ].map((reason) => {
    const failure = failureCases.find((candidate) => candidate.expectedReason === reason);
    if (!failure) throw new Error(`Missing failure case for reason ${reason}`);
    return { reason, failure };
  });

  it.each(reasonCases)(
    'AC-WEATHER-15 reports $reason on the thrown weather error',
    async ({ reason, failure }) => {
      const harness = createHarness((url) => responseFor(failure, url));

      const result = harness.provider.getCurrentWeather(address());
      await expect(result).rejects.toBeInstanceOf(WeatherUnavailableError);
      await expect(result).rejects.toMatchObject({ reason });
    },
  );

  it('AC-WEATHER-7 leak inspection detects a marker in a deliberately unsafe error', () => {
    expect(errorTextDeep(new Error(`unsafe ${markerKey}`))).toContain(markerKey);
  });

  it.each(failureCases)('AC-WEATHER-7 does not leak the key for $label', async (failure) => {
    const harness = createHarness((url) => responseFor(failure, url));
    let caught: unknown;
    try {
      await harness.provider.getCurrentWeather(address());
    } catch (error) {
      caught = error;
    }

    const combined = `${harness.logs.join('')}\n${errorTextDeep(caught)}`;
    expect(caught).toBeDefined();
    expect(combined).not.toContain(markerKey);
    expect(combined).not.toContain('access_key');
    expect(harness.calls).toHaveLength(1);
  });

  it('AC-WEATHER-7 does not leak the key on success', async () => {
    const harness = createHarness(() =>
      Promise.resolve(new Response(JSON.stringify(knownFixture), { status: 200 })),
    );

    await harness.provider.getCurrentWeather(address());

    expect(harness.logs.join('')).not.toContain(markerKey);
    expect(harness.logs.join('')).not.toContain('access_key');
  });

  it('AC-WEATHER-14 reads the body before applying the HTTP status mapping', async () => {
    const code106 = { success: false, error: { code: 106, type: 'rate_limit_reached' } };
    const rateLimit = createHarness(() =>
      Promise.resolve(new Response(JSON.stringify(code106), { status: 429 })),
    );
    const unknownLocation = createHarness(() =>
      Promise.resolve(new Response(JSON.stringify(unknownFixture), { status: 400 })),
    );

    await expect(rateLimit.provider.getCurrentWeather(address())).rejects.toMatchObject({
      reason: 'code_106',
    });
    await expect(
      unknownLocation.provider.getCurrentWeather(address('00000')),
    ).rejects.toBeInstanceOf(LocationNotFoundError);
  });
});
