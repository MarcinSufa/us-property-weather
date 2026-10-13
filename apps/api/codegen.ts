import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    'src/graphql/generated/resolvers-types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        enumsAsTypes: true,
        useTypeImports: true,
        useIndexSignature: true,
        mapperTypeSuffix: 'Model',
        mappers: {
          Property: '../../property/property.ts#Property',
        },
      },
    },
  },
};

export default config;
