import type { Property, PropertySort } from './property.ts';
import type { PropertyRepository } from './property-repository.ts';
import type { WeatherProvider } from '../weather/weather-provider.ts';

export interface PropertyServiceDependencies {
  repository: PropertyRepository;
  weatherProvider: WeatherProvider;
}

export class PropertyService {
  constructor(_dependencies: PropertyServiceDependencies) {}

  create(_input: unknown): Promise<Property> {
    return Promise.reject(new Error('not implemented'));
  }

  list(_filter: unknown, _sort: PropertySort): Property[] {
    throw new Error('not implemented');
  }

  get(_id: string): Property | null {
    throw new Error('not implemented');
  }

  delete(_id: string): Property {
    throw new Error('not implemented');
  }
}
