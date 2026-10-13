import { cacheExchange, createClient, fetchExchange } from 'urql';

export function createGraphqlClient(url: string) {
  return createClient({ url, exchanges: [cacheExchange, fetchExchange] });
}
