import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../db/database.ts';
import type { DatabaseSync } from 'node:sqlite';
import type { PropertyAddress, PropertyFilter } from './property.ts';
import { PropertyRepository } from './property-repository.ts';

const weatherData = {
  observation_time: '09:00 AM',
  temperature: 21,
  weather_descriptions: ['Partly cloudy'],
  astro: { sunrise: '06:00 AM' },
  air_quality: { co: '201.9' },
  extra_provider_field: { nested: ['kept', 7] },
};

const addresses: PropertyAddress[] = [
  { street: '1 Main St', city: 'Springfield', state: 'IL', zipCode: '62701' },
  { street: '2 Main St', city: 'Springfield', state: 'MO', zipCode: '65801' },
  { street: '3 Oak Ave', city: 'sAnTa Fe', state: 'NM', zipCode: '87501' },
  { street: '4 Pine Rd', city: 'Phoenix', state: 'AZ', zipCode: '85001' },
  { street: '5 Elm St', city: 'Portland', state: 'OR', zipCode: '97201' },
];

describe('PropertyRepository', () => {
  let database: DatabaseSync | undefined;
  let repository: PropertyRepository;

  beforeEach(() => {
    database = openDatabase(':memory:');
    repository = new PropertyRepository(database);
  });

  afterEach(() => database?.close());

  function insert(address: PropertyAddress = addresses[0]!) {
    return repository.insert({
      ...address,
      lat: 33.5,
      long: -112.2,
      weatherData,
    });
  }

  it('AC-CREATE-1 returns address, coordinates and unique UUID identifiers', () => {
    const first = insert();
    const second = insert();

    expect(first).toMatchObject({
      ...addresses[0],
      lat: 33.5,
      long: -112.2,
    });
    expect(first.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(first.id).not.toBe(second.id);
    expect(first.createdAt).toBeTruthy();
  });

  it('AC-CREATE-16 stores and reads back the whole weather object', () => {
    const stored = insert();

    expect(repository.findById(stored.id)?.weatherData).toEqual(weatherData);
  });

  it('AC-CREATE-17 uses a database timestamp with milliseconds near the current time', () => {
    const before = Date.now();
    const stored = insert();
    const after = Date.now();

    expect(stored.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Date.parse(stored.createdAt)).toBeGreaterThanOrEqual(before - 3000);
    expect(Date.parse(stored.createdAt)).toBeLessThanOrEqual(after + 3000);
  });

  it('AC-DETAIL-1 returns a stored property and AC-DETAIL-2 returns null for an unknown id', () => {
    const stored = insert();

    expect(repository.findById(stored.id)).toEqual(stored);
    expect(repository.findById('missing')).toBeNull();
  });

  it('AC-DELETE-1 returns the deleted property and null for an unknown id', () => {
    const stored = insert();

    expect(repository.deleteById(stored.id)).toEqual(stored);
    expect(repository.findById(stored.id)).toBeNull();
    expect(repository.deleteById('missing')).toBeNull();
    expect(repository.list({}, 'CREATED_AT_ASC')).toEqual([]);
  });

  it('AC-FILTER-1 to AC-FILTER-4 applies every combination of exact filters', () => {
    const properties = addresses.map((address) => insert(address));
    const combinations: Array<{
      filter: PropertyFilter;
      matches: number[];
    }> = [
      { filter: {}, matches: [0, 1, 2, 3, 4] },
      { filter: { city: 'Springfield' }, matches: [0, 1] },
      { filter: { state: 'NM' }, matches: [2] },
      { filter: { zipCode: '85001' }, matches: [3] },
      { filter: { city: 'Springfield', state: 'MO' }, matches: [1] },
      { filter: { city: 'Springfield', zipCode: '62701' }, matches: [0] },
      { filter: { state: 'NM', zipCode: '87501' }, matches: [2] },
      {
        filter: { city: 'Springfield', state: 'IL', zipCode: '65801' },
        matches: [],
      },
    ];

    for (const { filter, matches } of combinations) {
      expect(repository.list(filter, 'CREATED_AT_ASC').map((property) => property.id)).toEqual(
        matches.map((index) => properties[index]!.id),
      );
    }
    expect(
      repository.list({ city: 'SANTA FE' }, 'CREATED_AT_ASC').map((property) => property.id),
    ).toEqual([properties[2]!.id]);
    expect(repository.list({ city: 'anta' }, 'CREATED_AT_ASC')).toEqual([]);
    expect(repository.list({ state: 'nm' as 'NM' }, 'CREATED_AT_ASC')).toEqual([]);
    expect(repository.list({ zipCode: '8751' }, 'CREATED_AT_ASC')).toEqual([]);
  });

  it('AC-SORT-1 and AC-SORT-2 return insertion order ascending and reverse descending', () => {
    const properties = addresses.map((address) => insert(address));

    expect(repository.list({}, 'CREATED_AT_ASC').map((property) => property.id)).toEqual(
      properties.map((property) => property.id),
    );
    expect(repository.list({}, 'CREATED_AT_DESC').map((property) => property.id)).toEqual(
      properties.map((property) => property.id).reverse(),
    );
  });

  it('AC-SORT-3 preserves insertion order across matching creation milliseconds', () => {
    const properties = Array.from({ length: 200 }, (_, index) =>
      repository.insert({
        street: `${index} Main St`,
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        lat: 33.5,
        long: -112.2,
        weatherData,
      }),
    );
    const times = properties.map((property) => property.createdAt);

    expect(new Set(times).size).toBeLessThan(properties.length);
    expect(repository.list({}, 'CREATED_AT_ASC').map((property) => property.id)).toEqual(
      properties.map((property) => property.id),
    );
    expect(repository.list({}, 'CREATED_AT_DESC').map((property) => property.id)).toEqual(
      properties.map((property) => property.id).reverse(),
    );
  });

  it('AC-FILTER-1 treats SQL metacharacters as a bound filter value', () => {
    const properties = addresses.map((address) => insert(address));

    expect(repository.list({ city: "x' OR '1'='1" }, 'CREATED_AT_ASC')).toEqual([]);
    expect(repository.list({}, 'CREATED_AT_ASC')).toHaveLength(properties.length);
  });
});
