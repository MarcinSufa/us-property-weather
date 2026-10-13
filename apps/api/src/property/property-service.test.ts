import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../db/database.ts';
import { LocationNotFoundError, WeatherUnavailableError } from '../weather/weather-provider.ts';
import { InvalidInputError, PropertyNotFoundError } from './property.ts';
import type { DatabaseSync } from 'node:sqlite';
import { PropertyRepository } from './property-repository.ts';
import { PropertyService } from './property-service.ts';
import { FakeWeatherProvider } from './fake-weather-provider.ts';

const validInput = {
  street: '  1 Main St  ',
  city: '  Phoenix  ',
  state: 'AZ',
  zipCode: '85001',
};

describe('PropertyService', () => {
  let database: DatabaseSync | undefined;
  let repository: PropertyRepository;
  let weatherProvider: FakeWeatherProvider;
  let service: PropertyService;

  beforeEach(() => {
    database = openDatabase(':memory:');
    repository = new PropertyRepository(database);
    weatherProvider = new FakeWeatherProvider();
    service = new PropertyService({ repository, weatherProvider });
  });

  afterEach(() => database?.close());

  it('AC-CREATE-1 and AC-WEATHER-1 calls once with the validated address and persists the report', async () => {
    const property = await service.create(validInput);

    expect(weatherProvider.calls).toEqual([
      { street: '1 Main St', city: 'Phoenix', state: 'AZ', zipCode: '85001' },
    ]);
    expect(property).toMatchObject({
      street: '1 Main St',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      lat: weatherProvider.report.lat,
      long: weatherProvider.report.long,
      weatherData: weatherProvider.report.current,
    });
    expect(repository.findById(property.id)?.weatherData).toEqual(weatherProvider.report.current);
  });

  it('AC-CREATE-2 and AC-CREATE-3 stores trimmed street and city values', async () => {
    const property = await service.create(validInput);

    expect(property.street).toBe('1 Main St');
    expect(property.city).toBe('Phoenix');
  });

  it('AC-CREATE-4, AC-CREATE-5 and AC-CREATE-6 rejects invalid input before weather or storage', async () => {
    const invalidInputs: unknown[] = [
      { ...validInput, street: '   ' },
      { ...validInput, city: 'x'.repeat(101) },
      { ...validInput, zipCode: '1234' },
    ];

    for (const input of invalidInputs) {
      await expect(service.create(input)).rejects.toBeInstanceOf(InvalidInputError);
    }
    expect(weatherProvider.calls).toEqual([]);
    expect(service.list(undefined, 'CREATED_AT_ASC')).toEqual([]);
  });

  it('AC-WEATHER-10 and AC-WEATHER-11 propagates weather errors without retry or storage', async () => {
    for (const error of [new LocationNotFoundError(), new WeatherUnavailableError('rate limit')]) {
      weatherProvider.rejectWith(error);
      const callsBefore = weatherProvider.calls.length;

      await expect(service.create(validInput)).rejects.toBe(error);
      expect(weatherProvider.calls).toHaveLength(callsBefore + 1);
      expect(service.list(undefined, 'CREATED_AT_ASC')).toEqual([]);
      weatherProvider.rejectWith();
    }
  });

  it('AC-WEATHER-9 list, get and delete do not call the provider', async () => {
    const property = await service.create(validInput);
    const callsAfterCreate = weatherProvider.calls.length;

    service.list(undefined, 'CREATED_AT_ASC');
    service.get(property.id);
    service.delete(property.id);

    expect(callsAfterCreate).toBe(1);
    expect(weatherProvider.calls).toHaveLength(1);
  });

  it('AC-LIST-1 and AC-SORT-1 lists all properties newest first by default sort request', async () => {
    const first = await service.create({ ...validInput, street: '1 Main St' });
    const second = await service.create({ ...validInput, street: '2 Main St' });

    expect(service.list(undefined, 'CREATED_AT_DESC').map((property) => property.id)).toEqual([
      second.id,
      first.id,
    ]);
  });

  it('AC-FILTER-1 and AC-FILTER-5 trims city and treats blank values as no restriction', async () => {
    const first = await service.create(validInput);
    const second = await service.create({ ...validInput, city: 'Tucson', zipCode: '85701' });

    expect(
      service.list({ city: '  pHoEnIx  ' }, 'CREATED_AT_ASC').map((property) => property.id),
    ).toEqual([first.id]);
    expect(
      service.list({ city: '  ', zipCode: '' }, 'CREATED_AT_ASC').map((property) => property.id),
    ).toEqual([first.id, second.id]);
  });

  it('AC-FILTER-6 rejects a four digit zip filter with a zipCode field error', () => {
    try {
      service.list({ zipCode: '1234' }, 'CREATED_AT_ASC');
      expect.fail('Expected invalid filter to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidInputError);
      expect((error as InvalidInputError).fieldErrors).toContainEqual(
        expect.objectContaining({ field: 'zipCode' }),
      );
    }
  });

  it('AC-DETAIL-2 returns null for an unknown id', () => {
    expect(service.get('missing')).toBeNull();
  });

  it('AC-DELETE-1 and AC-DELETE-2 returns deleted property and carries an unknown id', async () => {
    const property = await service.create(validInput);

    expect(service.delete(property.id)).toEqual(property);
    try {
      service.delete('missing');
      expect.fail('Expected missing property to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(PropertyNotFoundError);
      expect((error as PropertyNotFoundError).id).toBe('missing');
    }
  });
});
