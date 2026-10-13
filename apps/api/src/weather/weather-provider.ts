import type { PropertyAddress } from '../property/property.ts';

export interface WeatherReport {
  lat: number;
  long: number;
  current: Record<string, unknown>;
}

export interface WeatherProvider {
  getCurrentWeather(address: PropertyAddress): Promise<WeatherReport>;
}

export class LocationNotFoundError extends Error {
  constructor() {
    super('Location not found');
    this.name = 'LocationNotFoundError';
  }
}

export class WeatherUnavailableError extends Error {
  reason: string;

  constructor(reason: string) {
    super('Weather is unavailable');
    this.name = 'WeatherUnavailableError';
    this.reason = reason;
  }
}
