import type { GraphQLError } from 'graphql';

export function toGraphQLError(_error: unknown): GraphQLError {
  throw new Error('not implemented');
}
