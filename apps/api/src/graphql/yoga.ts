import { readFileSync } from 'node:fs';
import { createSchema, createYoga } from 'graphql-yoga';
import type { Logger } from 'pino';
import type { PropertyService } from '../property/property-service.ts';
import type { GraphQLContext } from './resolvers.ts';
import { createResolvers } from './resolvers.ts';

export interface PropertyYogaOptions {
  propertyService: PropertyService;
  logger: Logger;
}

export function createPropertyYoga(options: PropertyYogaOptions) {
  const typeDefs = readFileSync(new URL('../../schema.graphql', import.meta.url), 'utf8');
  const schema = createSchema<GraphQLContext>({
    typeDefs,
    resolvers: createResolvers(options.logger),
  });

  return createYoga<GraphQLContext>({
    schema,
    context: () => ({ propertyService: options.propertyService }),
    logging: false,
  });
}
