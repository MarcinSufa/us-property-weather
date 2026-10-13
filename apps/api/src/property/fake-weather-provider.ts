import type { PropertyAddress } from './property.ts';
import type { WeatherProvider, WeatherReport } from '../weather/weather-provider.ts';

export class FakeWeatherProvider implements WeatherProvider {
  readonly calls: PropertyAddress[] = [];
  readonly report: WeatherReport;

  private rejection: Error | null = null;

  constructor(
    report: WeatherReport = {
      lat: 33.4484,
      long: -112.074,
      current: {
        observation_time: '09:00 AM',
        temperature: 25,
        weather_descriptions: ['Sunny'],
        astro: { sunrise: '06:00 AM', sunset: '06:30 PM' },
        air_quality: { co: '201.9', no2: '10.2' },
        provider_only_field: { source: 'fixture' },
      },
    },
  ) {
    this.report = report;
  }

  rejectWith(error?: Error): void {
    this.rejection = error ?? null;
  }

  getCurrentWeather(address: PropertyAddress): Promise<WeatherReport> {
    this.calls.push(address);
    if (this.rejection !== null) {
      return Promise.reject(this.rejection);
    }
    return Promise.resolve(this.report);
  }
}
