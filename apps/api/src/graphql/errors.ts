import type { GraphQLError } from 'graphql';
import { createGraphQLError } from 'graphql-yoga';
import { InvalidInputError, PropertyNotFoundError } from '../property/property.ts';
import { LocationNotFoundError, WeatherUnavailableError } from '../weather/weather-provider.ts';

export function toGraphQLError(error: unknown): GraphQLError {
  if (error instanceof InvalidInputError) {
    return createGraphQLError('Invalid input.', {
      extensions: {
        code: 'BAD_USER_INPUT',
        fieldErrors: error.fieldErrors.map(({ field, message }) => ({ field, message })),
      },
    });
  }

  if (error instanceof PropertyNotFoundError) {
    return createGraphQLError('Property not found.', {
      extensions: { code: 'PROPERTY_NOT_FOUND' },
    });
  }

  if (error instanceof LocationNotFoundError) {
    return createGraphQLError('Location not found.', {
      extensions: { code: 'LOCATION_NOT_FOUND' },
    });
  }

  if (error instanceof WeatherUnavailableError) {
    return createGraphQLError('Weather is unavailable.', {
      extensions: { code: 'WEATHER_UNAVAILABLE' },
    });
  }

  return createGraphQLError('Unexpected error.', {
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  });
}
