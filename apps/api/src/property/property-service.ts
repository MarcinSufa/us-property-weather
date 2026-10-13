import { PropertyNotFoundError, type Property, type PropertySort } from './property.ts';
import type { PropertyRepository } from './property-repository.ts';
import type { WeatherProvider } from '../weather/weather-provider.ts';
import { parseCreatePropertyInput, parsePropertyFilter } from './property-input.ts';

export interface PropertyServiceDependencies {
  repository: PropertyRepository;
  weatherProvider: WeatherProvider;
}

export class PropertyService {
  private readonly repository: PropertyRepository;
  private readonly weatherProvider: WeatherProvider;

  constructor(dependencies: PropertyServiceDependencies) {
    this.repository = dependencies.repository;
    this.weatherProvider = dependencies.weatherProvider;
  }

  async create(input: unknown): Promise<Property> {
    const address = parseCreatePropertyInput(input);
    const weather = await this.weatherProvider.getCurrentWeather(address);
    return this.repository.insert({
      ...address,
      lat: weather.lat,
      long: weather.long,
      weatherData: weather.current,
    });
  }

  list(filter: unknown, sort: PropertySort): Property[] {
    return this.repository.list(parsePropertyFilter(filter), sort);
  }

  get(id: string): Property | null {
    return this.repository.findById(id);
  }

  delete(id: string): Property {
    const property = this.repository.deleteById(id);
    if (property === null) {
      throw new PropertyNotFoundError(id);
    }
    return property;
  }
}
