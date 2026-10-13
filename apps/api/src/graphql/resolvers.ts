import type { Resolvers } from './generated/resolvers-types.ts';
import type { PropertyService } from '../property/property-service.ts';
import type { Logger } from 'pino';
import { InvalidInputError, PropertyNotFoundError } from '../property/property.ts';
import { toGraphQLError } from './errors.ts';
import { LocationNotFoundError, WeatherUnavailableError } from '../weather/weather-provider.ts';

export interface GraphQLContext {
  propertyService: PropertyService;
}

const passThroughResolvers = {
  Query: {
    properties: (_parent, args, context) => context.propertyService.list(args.filter, args.sort),
    property: (_parent, args, context) => context.propertyService.get(args.id),
  },
  Mutation: {
    createProperty: (_parent, args, context) => context.propertyService.create(args.input),
    deleteProperty: (_parent, args, context) => context.propertyService.delete(args.id),
  },
} satisfies Resolvers<GraphQLContext>;

export const resolvers: Resolvers<GraphQLContext> = passThroughResolvers;

type ResolverArguments = [unknown, unknown, GraphQLContext, ...unknown[]];

function withErrorTranslation<Arguments extends ResolverArguments, Result>(
  resolver: (...args: Arguments) => Result,
  logger: Logger,
): (...args: Arguments) => Result | Promise<Result> {
  return async (...args) => {
    try {
      return await resolver(...args);
    } catch (error) {
      if (error instanceof WeatherUnavailableError) {
        logger.warn({ reason: error.reason }, 'Weather is unavailable');
      } else if (
        !(error instanceof InvalidInputError) &&
        !(error instanceof PropertyNotFoundError) &&
        !(error instanceof LocationNotFoundError)
      ) {
        logger.error({ err: error }, 'Unexpected resolver error');
      }

      throw toGraphQLError(error);
    }
  };
}

export function createResolvers(logger: Logger): Resolvers<GraphQLContext> {
  return {
    Query: {
      properties: withErrorTranslation(passThroughResolvers.Query.properties, logger),
      property: withErrorTranslation(passThroughResolvers.Query.property, logger),
    },
    Mutation: {
      createProperty: withErrorTranslation(passThroughResolvers.Mutation.createProperty, logger),
      deleteProperty: withErrorTranslation(passThroughResolvers.Mutation.deleteProperty, logger),
    },
  };
}
