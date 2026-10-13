import type { CombinedError } from '@urql/core';
import type { PropertyFilter } from './generated/graphql.ts';

export type PropertyFilterField = keyof PropertyFilter;

export type PropertyFieldError = {
  field: PropertyFilterField;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPropertyFilterField(value: unknown): value is PropertyFilterField {
  return value === 'city' || value === 'state' || value === 'zipCode';
}

export function getFirstGraphqlErrorCode(error: CombinedError | undefined): string | undefined {
  const extensions = error?.graphQLErrors[0]?.extensions;
  return isRecord(extensions) && typeof extensions.code === 'string' ? extensions.code : undefined;
}

export function getFieldErrors(error: CombinedError | undefined): PropertyFieldError[] {
  const extensions = error?.graphQLErrors[0]?.extensions;
  if (!isRecord(extensions) || !Array.isArray(extensions.fieldErrors)) return [];

  return extensions.fieldErrors.flatMap((fieldError): PropertyFieldError[] => {
    if (!isRecord(fieldError) || !isPropertyFilterField(fieldError.field)) return [];
    if (typeof fieldError.message !== 'string') return [];
    return [{ field: fieldError.field, message: fieldError.message }];
  });
}
