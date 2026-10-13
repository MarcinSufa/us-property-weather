import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import { openDatabase } from '../db/database.ts';
import { FakeWeatherProvider } from '../property/fake-weather-provider.ts';
import { PropertyRepository } from '../property/property-repository.ts';
import type { PropertyFilter, PropertySort } from '../property/property.ts';
import { PropertyService } from '../property/property-service.ts';
import { LocationNotFoundError, WeatherUnavailableError } from '../weather/weather-provider.ts';
import { createPropertyYoga } from './yoga.ts';

const validInput = { street: '1 Main St', city: 'Phoenix', state: 'AZ', zipCode: '85001' };
const fullSelection = `id street city state zipCode lat long createdAt weatherData {
  observation_time temperature weather_descriptions
}`;
const createQuery = `mutation Create($input: CreatePropertyInput!) {
  createProperty(input: $input) { ${fullSelection} }
}`;

interface HarnessOptions {
  repository?: PropertyRepository;
  provider?: FakeWeatherProvider;
}

function createHarness(options: HarnessOptions = {}) {
  const database = openDatabase(':memory:');
  const repository = options.repository ?? new PropertyRepository(database);
  const provider = options.provider ?? new FakeWeatherProvider();
  const service = new PropertyService({ repository, weatherProvider: provider });
  const logLines: string[] = [];
  const logger = pino({ level: 'trace' }, { write: (chunk: string) => logLines.push(chunk) });
  const yoga = createPropertyYoga({ propertyService: service, logger });

  return { database, repository, provider, service, logLines, yoga };
}

async function request(
  yoga: ReturnType<typeof createPropertyYoga>,
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ body: string; json: Record<string, unknown> }> {
  const response = await yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.text();
  return { body, json: JSON.parse(body) as Record<string, unknown> };
}

function dataOf<T>(json: Record<string, unknown>): T {
  return json.data as T;
}

function errorsOf(json: Record<string, unknown>): Array<Record<string, unknown>> {
  return json.errors as Array<Record<string, unknown>>;
}

describe('GraphQL Yoga API', () => {
  let harness: ReturnType<typeof createHarness>;

  beforeEach(() => {
    harness = createHarness();
  });

  afterEach(() => {
    harness?.database.close();
    vi.unstubAllEnvs();
  });

  it('AC-CREATE-1 returns stored fields, coordinates, weather data and creation time', async () => {
    const result = await request(harness.yoga, createQuery, { input: validInput });
    const property = dataOf<{ createProperty: Record<string, unknown> }>(
      result.json,
    ).createProperty;

    expect(property).toMatchObject({
      ...validInput,
      lat: harness.provider.report.lat,
      long: harness.provider.report.long,
      weatherData: {
        observation_time: '09:00 AM',
        temperature: 25,
        weather_descriptions: ['Sunny'],
      },
    });
    expect(typeof property.createdAt).toBe('string');
    expect(harness.provider.calls).toHaveLength(1);
  });

  it('AC-CREATE-2 and AC-CREATE-3 returns trimmed street and city', async () => {
    const result = await request(harness.yoga, createQuery, {
      input: { ...validInput, street: '  1 Main St  ', city: '  Phoenix  ' },
    });

    expect(
      dataOf<{ createProperty: { street: string; city: string } }>(result.json).createProperty,
    ).toMatchObject({ street: '1 Main St', city: 'Phoenix' });
  });

  it('AC-CREATE-4, AC-CREATE-5, AC-CREATE-6 and AC-ERROR-1 reports all invalid fields before weather', async () => {
    const result = await request(harness.yoga, createQuery, {
      input: { ...validInput, street: '   ', city: 'x'.repeat(101), zipCode: '1234' },
    });

    expect(errorsOf(result.json)).toHaveLength(1);
    expect(errorsOf(result.json)[0]?.extensions).toEqual({
      code: 'BAD_USER_INPUT',
      fieldErrors: [
        { field: 'street', message: 'Street must be between 1 and 200 characters.' },
        { field: 'city', message: 'City must be between 1 and 100 characters.' },
        { field: 'zipCode', message: 'Zip code must be exactly five digits.' },
      ],
    });
    expect(harness.provider.calls).toHaveLength(0);
    expect(harness.service.list(undefined, 'CREATED_AT_DESC')).toEqual([]);
  });

  it('AC-CREATE-7 rejects invalid states as GraphQL errors before the service runs', async () => {
    const variableResult = await request(harness.yoga, createQuery, {
      input: { ...validInput, state: 'XX' },
    });
    const inlineResult = await request(
      harness.yoga,
      `mutation { createProperty(input: { street: "1 Main St", city: "Phoenix", state: XX, zipCode: "85001" }) { id } }`,
    );

    for (const result of [variableResult, inlineResult]) {
      expect(result.json.errors).toBeDefined();
      expect(
        errorsOf(result.json).some((error) => {
          const extensions = error.extensions as Record<string, unknown> | undefined;
          return extensions?.code === 'INTERNAL_SERVER_ERROR';
        }),
      ).toBe(false);
    }
    expect(harness.provider.calls).toHaveLength(0);
    expect(harness.service.list(undefined, 'CREATED_AT_DESC')).toEqual([]);
  });

  it('AC-CREATE-16 persists the complete current weather object', async () => {
    await request(harness.yoga, createQuery, { input: validInput });
    const property = harness.service.list(undefined, 'CREATED_AT_DESC')[0];

    expect(property?.weatherData).toEqual(harness.provider.report.current);
    expect(property?.weatherData).toHaveProperty('astro');
    expect(property?.weatherData).toHaveProperty('air_quality');
    expect(property?.weatherData).toHaveProperty('air_quality.us-epa-index', '1');
    expect(property?.weatherData).toHaveProperty('provider_only_field');
  });

  it('AC-LIST-1 lists no properties and then both created properties', async () => {
    const empty = await request(harness.yoga, '{ properties { id } }');
    await request(harness.yoga, createQuery, { input: validInput });
    await request(harness.yoga, createQuery, {
      input: { ...validInput, street: '2 Main St', zipCode: '85002' },
    });
    const populated = await request(harness.yoga, '{ properties { id } }');

    expect(dataOf<{ properties: unknown[] }>(empty.json).properties).toEqual([]);
    expect(dataOf<{ properties: unknown[] }>(populated.json).properties).toHaveLength(2);
  });

  it('AC-SORT-1 and AC-SORT-2 uses newest first by default and supports both sort orders', async () => {
    const first = (await request(harness.yoga, createQuery, { input: validInput })).json;
    const firstId = dataOf<{ createProperty: { id: string } }>(first).createProperty.id;
    const second = (
      await request(harness.yoga, createQuery, {
        input: { ...validInput, street: '2 Main St', zipCode: '85002' },
      })
    ).json;
    const secondId = dataOf<{ createProperty: { id: string } }>(second).createProperty.id;
    const defaultResult = await request(harness.yoga, '{ properties { id } }');
    const ascending = await request(harness.yoga, '{ properties(sort: CREATED_AT_ASC) { id } }');
    const descending = await request(harness.yoga, '{ properties(sort: CREATED_AT_DESC) { id } }');
    const ids = (result: { json: Record<string, unknown> }) =>
      dataOf<{ properties: Array<{ id: string }> }>(result.json).properties.map(({ id }) => id);

    expect(ids(defaultResult)).toEqual([secondId, firstId]);
    expect(ids(ascending)).toEqual([firstId, secondId]);
    expect(ids(descending)).toEqual(ids(defaultResult));
  });

  it('AC-FILTER-1 to AC-FILTER-4 filters by city, state, zip and all fields over GraphQL', async () => {
    const phoenix = dataOf<{ createProperty: { id: string } }>(
      (await request(harness.yoga, createQuery, { input: validInput })).json,
    ).createProperty.id;
    const tucson = dataOf<{ createProperty: { id: string } }>(
      (
        await request(harness.yoga, createQuery, {
          input: { street: '3 Oak St', city: 'Tucson', state: 'AZ', zipCode: '85701' },
        })
      ).json,
    ).createProperty.id;
    const mesa = dataOf<{ createProperty: { id: string } }>(
      (
        await request(harness.yoga, createQuery, {
          input: { street: '4 Elm St', city: 'Mesa', state: 'CA', zipCode: '85201' },
        })
      ).json,
    ).createProperty.id;
    const query = (filter: string) =>
      request(harness.yoga, `{ properties(filter: ${filter}, sort: CREATED_AT_ASC) { id } }`);
    const ids = (result: { json: Record<string, unknown> }) =>
      dataOf<{ properties: Array<{ id: string }> }>(result.json).properties.map(({ id }) => id);

    expect(ids(await query('{ city: "  pHoEnIx  " }'))).toEqual([phoenix]);
    expect(ids(await query('{ state: AZ }'))).toEqual([phoenix, tucson]);
    expect(ids(await query('{ zipCode: "85701" }'))).toEqual([tucson]);
    expect(ids(await query('{ city: "Phoenix", state: AZ, zipCode: "85001" }'))).toEqual([phoenix]);
    expect(ids(await query('{ city: "Pho" }'))).toEqual([]);
    expect(mesa).not.toBe(phoenix);
  });

  it('AC-FILTER-5 treats a blank city filter as no restriction', async () => {
    await request(harness.yoga, createQuery, { input: validInput });
    await request(harness.yoga, createQuery, {
      input: { ...validInput, street: '2 Main St', city: 'Tucson', zipCode: '85701' },
    });
    const result = await request(harness.yoga, '{ properties(filter: { city: "" }) { id } }');

    expect(dataOf<{ properties: unknown[] }>(result.json).properties).toHaveLength(2);
  });

  it('AC-FILTER-9 treats a blank zip-code filter as no restriction', async () => {
    await request(harness.yoga, createQuery, { input: validInput });
    await request(harness.yoga, createQuery, {
      input: { ...validInput, street: '2 Main St', city: 'Tucson', zipCode: '85701' },
    });
    const result = await request(harness.yoga, '{ properties(filter: { zipCode: "   " }) { id } }');

    expect(dataOf<{ properties: unknown[] }>(result.json).properties).toHaveLength(2);
  });

  it('AC-FILTER-5 and AC-FILTER-9 treat whole empty filters as unrestricted', async () => {
    await request(harness.yoga, createQuery, { input: validInput });
    await request(harness.yoga, createQuery, {
      input: { ...validInput, street: '2 Main St', city: 'Tucson', zipCode: '85701' },
    });
    const results = await Promise.all([
      request(harness.yoga, '{ properties(filter: {}) { id } }'),
      request(harness.yoga, '{ properties(filter: null) { id } }'),
      request(harness.yoga, '{ properties { id } }'),
    ]);

    for (const result of results) {
      expect(dataOf<{ properties: unknown[] }>(result.json).properties).toHaveLength(2);
    }
  });

  it('AC-FILTER-6 and AC-ERROR-1 maps an invalid zip filter to one field error', async () => {
    const result = await request(
      harness.yoga,
      '{ properties(filter: { zipCode: "1234" }) { id } }',
    );

    expect(errorsOf(result.json)).toHaveLength(1);
    expect(errorsOf(result.json)[0]?.extensions).toEqual({
      code: 'BAD_USER_INPUT',
      fieldErrors: [{ field: 'zipCode', message: 'Zip code filter must be exactly five digits.' }],
    });
  });

  it('AC-FILTER-11 rejects an empty state before the service runs', async () => {
    const list = vi.spyOn(harness.repository, 'list');
    const results = await Promise.all([
      request(harness.yoga, '{ properties(filter: { state: "" }) { id } }'),
      request(
        harness.yoga,
        'query Properties($filter: PropertyFilter) { properties(filter: $filter) { id } }',
        { filter: { state: '' } },
      ),
    ]);

    for (const result of results) {
      expect(result.json.errors).toBeDefined();
      expect(result.json.data).toBeUndefined();
      expect(
        errorsOf(result.json).some((error) => {
          const extensions = error.extensions as Record<string, unknown> | undefined;
          return extensions?.code === 'INTERNAL_SERVER_ERROR';
        }),
      ).toBe(false);
    }
    expect(list).not.toHaveBeenCalled();
  });

  it('AC-DETAIL-1 and AC-DETAIL-2 returns a property with weather and null for an unknown id', async () => {
    const created = await request(harness.yoga, createQuery, { input: validInput });
    const id = dataOf<{ createProperty: { id: string } }>(created.json).createProperty.id;
    const found = await request(
      harness.yoga,
      `query { property(id: "${id}") { ${fullSelection} } }`,
    );
    const missing = await request(harness.yoga, '{ property(id: "missing") { id } }');

    expect(dataOf<{ property: Record<string, unknown> }>(found.json).property).toMatchObject({
      ...validInput,
      weatherData: { observation_time: '09:00 AM', temperature: 25 },
    });
    expect(dataOf<{ property: unknown }>(missing.json).property).toBeNull();
    expect(missing.json.errors).toBeUndefined();
  });

  it('AC-DELETE-1 returns the deleted property and then the detail query returns null', async () => {
    const created = await request(harness.yoga, createQuery, { input: validInput });
    const property = dataOf<{ createProperty: { id: string } }>(created.json).createProperty;
    const deleted = await request(
      harness.yoga,
      `mutation { deleteProperty(id: "${property.id}") { ${fullSelection} } }`,
    );
    const afterDelete = await request(harness.yoga, `{ property(id: "${property.id}") { id } }`);

    expect(dataOf<{ deleteProperty: { id: string } }>(deleted.json).deleteProperty.id).toBe(
      property.id,
    );
    expect(dataOf<{ property: unknown }>(afterDelete.json).property).toBeNull();
  });

  it('AC-DELETE-2 and AC-ERROR-2 maps deleting an unknown id', async () => {
    const result = await request(harness.yoga, 'mutation { deleteProperty(id: "missing") { id } }');

    expect(errorsOf(result.json)).toHaveLength(1);
    expect(errorsOf(result.json)[0]?.extensions).toEqual({ code: 'PROPERTY_NOT_FOUND' });
  });

  it('AC-ERROR-3 and AC-WEATHER-11 maps missing weather locations without storing a row', async () => {
    harness.provider.rejectWith(new LocationNotFoundError());
    const result = await request(harness.yoga, createQuery, { input: validInput });

    expect(errorsOf(result.json)[0]?.extensions).toEqual({ code: 'LOCATION_NOT_FOUND' });
    expect(harness.service.list(undefined, 'CREATED_AT_DESC')).toEqual([]);
    expect(harness.provider.calls).toHaveLength(1);
  });

  it('AC-ERROR-4 and AC-WEATHER-11 logs but does not expose weather failure reasons', async () => {
    const marker = 'marker-reason-do-not-leak';
    harness.provider.rejectWith(new WeatherUnavailableError(marker));
    const result = await request(harness.yoga, createQuery, { input: validInput });
    const logs = harness.logLines.map((line) => JSON.parse(line) as Record<string, unknown>);

    expect(errorsOf(result.json)[0]?.extensions).toEqual({ code: 'WEATHER_UNAVAILABLE' });
    expect(result.body).not.toContain(marker);
    expect(harness.service.list(undefined, 'CREATED_AT_DESC')).toEqual([]);
    expect(harness.provider.calls).toHaveLength(1);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ level: 40, reason: marker });
  });

  it('AC-ERROR-5 masks and logs unexpected repository errors in production mode', async () => {
    await assertInternalErrorIsMaskedAndLogged(false);
  });

  it('AC-ERROR-5 masks and logs unexpected repository errors in development mode', async () => {
    await assertInternalErrorIsMaskedAndLogged(true);
  });

  it('AC-ERROR-5 and AC-WEATHER-11 masks unexpected provider errors and does not store a property', async () => {
    const marker = 'marker-provider-internal-do-not-leak';
    harness.provider.rejectWith(new Error(marker));
    const result = await request(harness.yoga, createQuery, { input: validInput });
    const logs = harness.logLines.map((line) => JSON.parse(line) as Record<string, unknown>);

    expect(errorsOf(result.json)).toHaveLength(1);
    expect(errorsOf(result.json)[0]?.extensions).toEqual({ code: 'INTERNAL_SERVER_ERROR' });
    expect(result.body).not.toContain(marker);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ level: 50 });
    expect(JSON.stringify(logs[0])).toContain(marker);
    expect(harness.provider.calls).toHaveLength(1);
    expect(harness.service.list(undefined, 'CREATED_AT_DESC')).toEqual([]);
  });

  async function assertInternalErrorIsMaskedAndLogged(development: boolean): Promise<void> {
    const marker = 'marker-internal-do-not-leak';
    if (development) {
      vi.stubEnv('NODE_ENV', 'development');
    }
    const database = openDatabase(':memory:');
    class FailingRepository extends PropertyRepository {
      override list(_filter: PropertyFilter, _sort: PropertySort): never {
        throw new Error(marker);
      }
    }
    const repository = new FailingRepository(database);
    const provider = new FakeWeatherProvider();
    const service = new PropertyService({ repository, weatherProvider: provider });
    const logLines: string[] = [];
    const logger = pino({ level: 'trace' }, { write: (chunk: string) => logLines.push(chunk) });
    const yoga = createPropertyYoga({ propertyService: service, logger });
    try {
      const result = await request(yoga, '{ properties { id } }');
      const error = errorsOf(result.json)[0];
      const logs = logLines.map((line) => JSON.parse(line) as Record<string, unknown>);

      expect(errorsOf(result.json)).toHaveLength(1);
      expect(error?.extensions).toEqual({ code: 'INTERNAL_SERVER_ERROR' });
      expect(result.body).not.toContain(marker);
      expect(result.body).not.toContain('stack');
      expect(result.body).not.toContain('covertree-api');
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({ level: 50 });
      expect(logs[0]?.err).toMatchObject({ message: marker });
    } finally {
      database.close();
    }
  }

  describe('AC-WEATHER-9 zero provider calls proof', () => {
    it('AC-WEATHER-9 leaves query and delete provider call count unchanged', async () => {
      const created = await request(harness.yoga, createQuery, { input: validInput });
      const id = dataOf<{ createProperty: { id: string } }>(created.json).createProperty.id;
      expect(harness.provider.calls).toHaveLength(1);

      await request(harness.yoga, '{ properties { id } }');
      await request(
        harness.yoga,
        '{ properties(filter: { city: "Phoenix" }, sort: CREATED_AT_ASC) { id } }',
      );
      await request(harness.yoga, `{ property(id: "${id}") { id } }`);
      await request(harness.yoga, '{ property(id: "unknown") { id } }');
      await request(harness.yoga, `mutation { deleteProperty(id: "${id}") { id } }`);
      await request(harness.yoga, 'mutation { deleteProperty(id: "unknown") { id } }');

      expect(harness.provider.calls).toHaveLength(1);
    });

    it('AC-WEATHER-9 keeps createProperty at exactly one provider call', async () => {
      await request(harness.yoga, createQuery, { input: validInput });

      expect(harness.provider.calls).toHaveLength(1);
    });
  });
});
