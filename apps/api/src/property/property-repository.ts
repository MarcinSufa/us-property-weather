import type { DatabaseSync } from 'node:sqlite';
import type { Property, PropertyAddress, PropertyFilter, PropertySort } from './property.ts';

export interface NewProperty extends PropertyAddress {
  lat: number;
  long: number;
  weatherData: Record<string, unknown>;
}

export class PropertyRepository {
  constructor(_database: DatabaseSync) {}

  insert(_row: NewProperty): Property {
    throw new Error('not implemented');
  }

  findById(_id: string): Property | null {
    throw new Error('not implemented');
  }

  list(_filter: PropertyFilter, _sort: PropertySort): Property[] {
    throw new Error('not implemented');
  }

  deleteById(_id: string): Property | null {
    throw new Error('not implemented');
  }
}
