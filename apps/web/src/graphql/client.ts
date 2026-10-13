import { cacheExchange, createClient, fetchExchange } from 'urql';

export const client = createClient({
  url: '/graphql',
  exchanges: [cacheExchange, fetchExchange],
});
