import type { Logger } from 'pino';
import type { PropertyAddress } from '../property/property.ts';
import type { WeatherProvider, WeatherReport } from './weather-provider.ts';

export interface WeatherstackProviderOptions {
  fetch: typeof fetch;
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  logger: Logger;
}

export class WeatherstackProvider implements WeatherProvider {
  private readonly options: WeatherstackProviderOptions;

  constructor(options: WeatherstackProviderOptions) {
    this.options = options;
  }

  getCurrentWeather(_address: PropertyAddress): Promise<WeatherReport> {
    return Promise.reject(new Error('not implemented'));
  }
}
