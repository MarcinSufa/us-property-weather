import type {
  PropertySort as GeneratedPropertySort,
  UsState,
} from '../graphql/generated/resolvers-types.ts';

export type { UsState };
export type PropertySort = GeneratedPropertySort;

export interface PropertyAddress {
  street: string;
  city: string;
  state: UsState;
  zipCode: string;
}

export interface Property extends PropertyAddress {
  id: string;
  lat: number;
  long: number;
  weatherData: Record<string, unknown>;
  createdAt: string;
}

export interface PropertyFilter {
  city?: string | null;
  state?: UsState | null;
  zipCode?: string | null;
}

export interface FieldError {
  field: string;
  message: string;
}

export class InvalidInputError extends Error {
  fieldErrors: FieldError[];

  constructor(fieldErrors: FieldError[]) {
    super('Invalid input');
    this.name = 'InvalidInputError';
    this.fieldErrors = fieldErrors;
  }
}

export class PropertyNotFoundError extends Error {
  id: string;

  constructor(id: string) {
    super(`Property not found: ${id}`);
    this.name = 'PropertyNotFoundError';
    this.id = id;
  }
}
