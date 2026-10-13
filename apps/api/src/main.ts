import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createSchema, createYoga } from 'graphql-yoga';
import pino from 'pino';
import type { DatabaseSync } from 'node:sqlite';
import { PropertyRepository } from './property/property-repository.ts';
import { PropertyService } from './property/property-service.ts';
import type { GraphQLContext } from './graphql/resolvers.ts';
import { resolvers } from './graphql/resolvers.ts';
import { WeatherstackProvider } from './weather/weatherstack-provider.ts';

const logger = pino();
// The api slice of wave 1 replaces this placeholder repository and empty provider configuration.
const repository = new PropertyRepository(undefined as unknown as DatabaseSync);
const weatherProvider = new WeatherstackProvider({
  fetch,
  baseUrl: '',
  apiKey: '',
  timeoutMs: 0,
  logger,
});
const propertyService = new PropertyService({ repository, weatherProvider });
const typeDefs = readFileSync(new URL('../schema.graphql', import.meta.url), 'utf8');
const schema = createSchema<GraphQLContext>({ typeDefs, resolvers });
const yoga = createYoga<GraphQLContext>({ schema, context: () => ({ propertyService }) });
const server = createServer((request, response) => {
  void yoga(request, response);
});
const port = Number(process.env.PORT ?? 4000);

server.listen(port, () => {
  const address = server.address();
  logger.info({ address }, 'GraphQL server listening');
});

const close = () => {
  server.close();
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
