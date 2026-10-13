import type { Resolvers } from './generated/resolvers-types.ts';
import type { PropertyService } from '../property/property-service.ts';

export interface GraphQLContext {
  propertyService: PropertyService;
}

export const resolvers: Resolvers<GraphQLContext> = {
  Query: {
    properties: (_parent, args, context) => context.propertyService.list(args.filter, args.sort),
    property: (_parent, args, context) => context.propertyService.get(args.id),
  },
  Mutation: {
    createProperty: (_parent, args, context) => context.propertyService.create(args.input),
    deleteProperty: (_parent, args, context) => context.propertyService.delete(args.id),
  },
};
