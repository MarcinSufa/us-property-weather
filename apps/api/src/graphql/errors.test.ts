import { describe, expect, it } from 'vitest';
import { InvalidInputError, PropertyNotFoundError } from '../property/property.ts';
import { LocationNotFoundError, WeatherUnavailableError } from '../weather/weather-provider.ts';
import { toGraphQLError } from './errors.ts';

describe('toGraphQLError', () => {
  it('AC-ERROR-1 maps invalid input with its field errors', () => {
    const result = toGraphQLError(
      new InvalidInputError([
        { field: 'zipCode', message: 'Zip code must be exactly five digits.' },
      ]),
    );

    expect(result.name).toBe('GraphQLError');
    expect(result.message).toBe('Invalid input.');
    expect(result.extensions).toEqual({
      code: 'BAD_USER_INPUT',
      fieldErrors: [{ field: 'zipCode', message: 'Zip code must be exactly five digits.' }],
    });
    expect(result.originalError).toBeUndefined();
  });

  it('AC-ERROR-2 maps missing properties', () => {
    const result = toGraphQLError(new PropertyNotFoundError('secret-id'));

    expect(result.message).toBe('Property not found.');
    expect(result.extensions).toEqual({ code: 'PROPERTY_NOT_FOUND' });
    expect(result.originalError).toBeUndefined();
  });

  it('AC-ERROR-3 maps missing locations', () => {
    const result = toGraphQLError(new LocationNotFoundError());

    expect(result.message).toBe('Location not found.');
    expect(result.extensions).toEqual({ code: 'LOCATION_NOT_FOUND' });
    expect(result.originalError).toBeUndefined();
  });

  it('AC-ERROR-4 keeps the weather failure reason out of the result', () => {
    const result = toGraphQLError(new WeatherUnavailableError('marker-weather-reason'));

    expect(result.message).toBe('Weather is unavailable.');
    expect(result.extensions).toEqual({ code: 'WEATHER_UNAVAILABLE' });
    expect(JSON.stringify(result.toJSON())).not.toContain('marker-weather-reason');
    expect(result.originalError).toBeUndefined();
  });

  it('AC-ERROR-5 masks error messages and thrown strings without preserving originals', () => {
    const fromError = toGraphQLError(new Error('marker-internal-message'));
    const fromString = toGraphQLError('marker-thrown-string');

    for (const result of [fromError, fromString]) {
      expect(result.message).toBe('Unexpected error.');
      expect(result.extensions).toEqual({ code: 'INTERNAL_SERVER_ERROR' });
      expect(result.originalError).toBeUndefined();
      expect(JSON.stringify(result.toJSON())).not.toContain('marker-');
    }
  });
});
