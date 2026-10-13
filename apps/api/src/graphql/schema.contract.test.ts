import { readFileSync } from 'node:fs';
import { buildSchema, isEnumType } from 'graphql';
import { valueFromASTUntyped } from 'graphql/utilities';
import { expect, test } from 'vitest';

const schema = buildSchema(readFileSync(new URL('../../schema.graphql', import.meta.url), 'utf8'));

test('the GraphQL schema exposes the exact property operation contract', () => {
  const query = schema.getQueryType();
  const mutation = schema.getMutationType();

  expect(Object.keys(query?.getFields() ?? {}).sort()).toEqual(['properties', 'property']);
  expect(Object.keys(mutation?.getFields() ?? {}).sort()).toEqual([
    'createProperty',
    'deleteProperty',
  ]);

  const operationFields = [
    [
      query?.getFields().properties,
      [
        ['filter', 'PropertyFilter'],
        ['sort', 'PropertySort!'],
      ],
      '[Property!]!',
    ],
    [query?.getFields().property, [['id', 'ID!']], 'Property'],
    [mutation?.getFields().createProperty, [['input', 'CreatePropertyInput!']], 'Property!'],
    [mutation?.getFields().deleteProperty, [['id', 'ID!']], 'Property!'],
  ] as const;

  for (const [field, expectedArguments, expectedReturnType] of operationFields) {
    expect(field).toBeDefined();
    expect(field?.args.map(({ name, type }) => [name, String(type)])).toEqual(expectedArguments);
    expect(String(field?.type)).toBe(expectedReturnType);
  }

  const propertiesField = query?.getFields().properties;
  if (!propertiesField) {
    throw new Error('Expected the properties query field');
  }
  const sortArgument = propertiesField.args[1];
  if (!sortArgument) {
    throw new Error('Expected the sort argument');
  }
  const sortDefault = sortArgument.default;
  expect(sortDefault).toBeDefined();
  if (sortDefault?.literal === undefined) {
    throw new Error('Expected the sort default to be a GraphQL literal');
  }
  expect(valueFromASTUntyped(sortDefault.literal)).toBe('CREATED_AT_DESC');
});

test('the schema includes all state values and only the supported property sorts', () => {
  const states = schema.getType('UsState');
  const sorts = schema.getType('PropertySort');

  expect(isEnumType(states)).toBe(true);
  expect(isEnumType(sorts)).toBe(true);

  if (!isEnumType(states) || !isEnumType(sorts)) {
    throw new Error('Expected state and sort enums');
  }

  expect(states.getValues()).toHaveLength(51);
  expect(states.getValues().map(({ name }) => name)).toContain('DC');
  expect(
    sorts
      .getValues()
      .map(({ name }) => name)
      .sort(),
  ).toEqual(['CREATED_AT_ASC', 'CREATED_AT_DESC']);
});
