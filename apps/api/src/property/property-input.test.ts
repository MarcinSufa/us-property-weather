import { describe, expect, it } from 'vitest';
import { InvalidInputError } from './property.ts';
import { parseCreatePropertyInput, parsePropertyFilter } from './property-input.ts';

describe('property input parsing', () => {
  it('AC-CREATE-1 returns a valid address unchanged', () => {
    expect(
      parseCreatePropertyInput({
        street: '12 Oak Street',
        city: 'Albany',
        state: 'NY',
        zipCode: '12207',
      }),
    ).toEqual({
      street: '12 Oak Street',
      city: 'Albany',
      state: 'NY',
      zipCode: '12207',
    });
  });

  it('AC-CREATE-2 and AC-CREATE-3 trims street and city', () => {
    expect(
      parseCreatePropertyInput({
        street: '  12 Oak Street  ',
        city: '  Albany  ',
        state: 'NY',
        zipCode: '12207',
      }),
    ).toEqual({
      street: '12 Oak Street',
      city: 'Albany',
      state: 'NY',
      zipCode: '12207',
    });
  });

  it.each(['', '   ', 'x'.repeat(201)])(
    'AC-CREATE-4 rejects a street of invalid trimmed length: %j',
    (street) => {
      try {
        parseCreatePropertyInput({ street, city: 'Albany', state: 'NY', zipCode: '12207' });
        throw new Error('Expected street validation to fail');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect((error as InvalidInputError).fieldErrors.map(({ field }) => field)).toContain(
          'street',
        );
      }
    },
  );

  it('AC-CREATE-4 accepts a 200 character street', () => {
    expect(
      parseCreatePropertyInput({
        street: 'x'.repeat(200),
        city: 'Albany',
        state: 'NY',
        zipCode: '12207',
      }).street,
    ).toHaveLength(200);
  });

  it.each(['', '   ', 'x'.repeat(101)])(
    'AC-CREATE-5 rejects a city of invalid trimmed length: %j',
    (city) => {
      try {
        parseCreatePropertyInput({ street: '12 Oak Street', city, state: 'NY', zipCode: '12207' });
        throw new Error('Expected city validation to fail');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect((error as InvalidInputError).fieldErrors.map(({ field }) => field)).toContain(
          'city',
        );
      }
    },
  );

  it('AC-CREATE-5 accepts a 100 character city', () => {
    expect(
      parseCreatePropertyInput({
        street: '12 Oak Street',
        city: 'x'.repeat(100),
        state: 'NY',
        zipCode: '12207',
      }).city,
    ).toHaveLength(100);
  });

  it.each(['1234', '123456', 'abcde', ' 1234', '12345 ', ''])(
    'AC-CREATE-6 rejects invalid zip code %j',
    (zipCode) => {
      try {
        parseCreatePropertyInput({ street: '12 Oak Street', city: 'Albany', state: 'NY', zipCode });
        throw new Error('Expected zip code validation to fail');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect((error as InvalidInputError).fieldErrors.map(({ field }) => field)).toContain(
          'zipCode',
        );
      }
    },
  );

  it('AC-CREATE-7 rejects a state outside the generated list', () => {
    try {
      parseCreatePropertyInput({
        street: '12 Oak Street',
        city: 'Albany',
        state: 'XX',
        zipCode: '12207',
      });
      throw new Error('Expected state validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidInputError);
      expect((error as InvalidInputError).fieldErrors.map(({ field }) => field)).toContain('state');
    }
  });

  it('AC-ERROR-1 reports one safe error per invalid field in order', () => {
    try {
      parseCreatePropertyInput({
        street: 'secret street'.repeat(20),
        city: 7,
        state: 'secret state',
        zipCode: 'secret zip',
      });
      throw new Error('Expected address validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidInputError);
      const fieldErrors = (error as InvalidInputError).fieldErrors;
      expect(fieldErrors.map(({ field }) => field)).toEqual(['street', 'city', 'state', 'zipCode']);
      expect(fieldErrors).toHaveLength(4);
      for (const { message } of fieldErrors) {
        expect(message.trim()).not.toBe('');
        expect(message).not.toMatch(/secret|7/);
      }
    }
  });

  it.each([null, 'not an object', 42])(
    'AC-ERROR-1 reports all fields when the input is not an object: %j',
    (input) => {
      try {
        parseCreatePropertyInput(input);
        throw new Error('Expected input validation to fail');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect((error as InvalidInputError).fieldErrors.map(({ field }) => field)).toEqual([
          'street',
          'city',
          'state',
          'zipCode',
        ]);
      }
    },
  );

  it('AC-FILTER-1 trims city without changing case', () => {
    expect(parsePropertyFilter({ city: '  aLbAnY  ' }).city).toBe('aLbAnY');
  });

  it('AC-FILTER-3 returns a valid state unchanged', () => {
    expect(parsePropertyFilter({ state: 'NY' }).state).toBe('NY');
  });

  it('AC-FILTER-4 returns a valid zip unchanged and trims surrounding whitespace', () => {
    expect(parsePropertyFilter({ zipCode: '12207' }).zipCode).toBe('12207');
    expect(parsePropertyFilter({ zipCode: ' 12207 ' }).zipCode).toBe('12207');
  });

  it.each([null, undefined, {}])('AC-FILTER-5 treats whole filter %j as unrestricted', (filter) => {
    expect(parsePropertyFilter(filter)).toEqual({ city: null, state: null, zipCode: null });
  });

  it.each(['city', 'zipCode'] as const)(
    'AC-FILTER-5 treats absent, null, empty and blank %s as unrestricted',
    (field) => {
      for (const filter of [{}, { [field]: null }, { [field]: '' }, { [field]: '   ' }]) {
        expect(parsePropertyFilter(filter)[field]).toBeNull();
      }
    },
  );

  it('AC-FILTER-5 treats absent and null state as unrestricted', () => {
    expect(parsePropertyFilter({}).state).toBeNull();
    expect(parsePropertyFilter({ state: null }).state).toBeNull();
  });

  it.each(['1234', '123456', 'abcde'])('AC-FILTER-6 rejects zip filter %j', (zipCode) => {
    try {
      parsePropertyFilter({ zipCode });
      throw new Error('Expected zip filter validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidInputError);
      expect((error as InvalidInputError).fieldErrors).toEqual([
        expect.objectContaining({ field: 'zipCode' }),
      ]);
    }
  });
});
