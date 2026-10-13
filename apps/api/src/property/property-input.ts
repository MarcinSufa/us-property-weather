import { z } from 'zod';
import type { PropertyAddress, PropertyFilter, UsState } from './property.ts';
import { InvalidInputError } from './property.ts';

export const US_STATES = [
  'AK',
  'AL',
  'AR',
  'AZ',
  'CA',
  'CO',
  'CT',
  'DC',
  'DE',
  'FL',
  'GA',
  'HI',
  'IA',
  'ID',
  'IL',
  'IN',
  'KS',
  'KY',
  'LA',
  'MA',
  'MD',
  'ME',
  'MI',
  'MN',
  'MO',
  'MS',
  'MT',
  'NC',
  'ND',
  'NE',
  'NH',
  'NJ',
  'NM',
  'NV',
  'NY',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VA',
  'VT',
  'WA',
  'WI',
  'WV',
  'WY',
] as const satisfies readonly UsState[];

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;
type Assert<Value extends true> = Value;
export type UsStateListMatchesGeneratedType = Assert<Equal<(typeof US_STATES)[number], UsState>>;

const stateSchema = z.enum(US_STATES);
const streetSchema = z.string().trim().min(1).max(200);
const citySchema = z.string().trim().min(1).max(100);
const zipCodeSchema = z.string().regex(/^\d{5}$/);

function isInputRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export function parseCreatePropertyInput(input: unknown): PropertyAddress {
  const record = isInputRecord(input) ? input : {};
  const errors = [];

  const street = streetSchema.safeParse(record.street);
  if (!street.success) {
    errors.push({ field: 'street', message: 'Street must be between 1 and 200 characters.' });
  }

  const city = citySchema.safeParse(record.city);
  if (!city.success) {
    errors.push({ field: 'city', message: 'City must be between 1 and 100 characters.' });
  }

  const state = stateSchema.safeParse(record.state);
  if (!state.success) {
    errors.push({ field: 'state', message: 'State must be a valid US state.' });
  }

  const zipCode = zipCodeSchema.safeParse(record.zipCode);
  if (!zipCode.success) {
    errors.push({ field: 'zipCode', message: 'Zip code must be exactly five digits.' });
  }

  if (!street.success || !city.success || !state.success || !zipCode.success) {
    throw new InvalidInputError(errors);
  }

  return {
    street: street.data,
    city: city.data,
    state: state.data,
    zipCode: zipCode.data,
  };
}

const filterCitySchema = z.string().transform((value) => value.trim());
const filterZipCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/);

export function parsePropertyFilter(filter: unknown): PropertyFilter {
  const record = filter === null || filter === undefined ? {} : isInputRecord(filter) ? filter : {};
  const errors = [];
  let city: string | null = null;
  let state: UsState | null = null;
  let zipCode: string | null = null;

  if (filter !== null && filter !== undefined && !isInputRecord(filter)) {
    errors.push(
      { field: 'city', message: 'City filter must be a string.' },
      { field: 'state', message: 'State filter must be a valid US state.' },
      { field: 'zipCode', message: 'Zip code filter must be exactly five digits.' },
    );
  } else {
    if (record.city !== undefined && record.city !== null) {
      const result = filterCitySchema.safeParse(record.city);
      if (!result.success) {
        errors.push({ field: 'city', message: 'City filter must be a string.' });
      } else if (result.data !== '') {
        city = result.data;
      }
    }

    if (record.state !== undefined && record.state !== null) {
      const result = stateSchema.safeParse(record.state);
      if (!result.success) {
        errors.push({ field: 'state', message: 'State filter must be a valid US state.' });
      } else {
        state = result.data;
      }
    }

    if (record.zipCode !== undefined && record.zipCode !== null) {
      const isBlank = typeof record.zipCode === 'string' && record.zipCode.trim() === '';
      const result = isBlank ? null : filterZipCodeSchema.safeParse(record.zipCode);
      if (result !== null && !result.success) {
        errors.push({ field: 'zipCode', message: 'Zip code filter must be exactly five digits.' });
      } else if (result !== null) {
        zipCode = result.data;
      }
    }
  }

  if (errors.length > 0) {
    throw new InvalidInputError(errors);
  }

  return { city, state, zipCode };
}
