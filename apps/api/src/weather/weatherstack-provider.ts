import type { Logger } from 'pino';
import type { PropertyAddress } from '../property/property.ts';
import {
  LocationNotFoundError,
  WeatherUnavailableError,
  type WeatherProvider,
  type WeatherReport,
} from './weather-provider.ts';
import {
  WeatherstackFailureResponseSchema,
  WeatherstackSuccessResponseSchema,
} from './weatherstack-response.ts';

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

  async getCurrentWeather(address: PropertyAddress): Promise<WeatherReport> {
    const startedAt = Date.now();
    let report: WeatherReport;

    try {
      report = await this.requestWeather(address);
    } catch (error) {
      const locationNotFound = error instanceof LocationNotFoundError;
      if (!locationNotFound && !(error instanceof WeatherUnavailableError)) throw error;
      this.options.logger.warn(
        {
          outcome: locationNotFound ? 'location_not_found' : 'unavailable',
          reason: locationNotFound ? 'code_615' : error.reason,
          durationMs: Date.now() - startedAt,
        },
        'Weather lookup failed',
      );
      throw error;
    }

    this.options.logger.info(
      { outcome: 'ok', durationMs: Date.now() - startedAt },
      'Weather lookup completed',
    );
    return report;
  }

  private async requestWeather(address: PropertyAddress): Promise<WeatherReport> {
    const url = new URL(this.options.baseUrl);
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/current`;
    url.searchParams.set('access_key', this.options.apiKey);
    url.searchParams.set('query', address.zipCode);

    let response: Response;
    try {
      response = await this.options.fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (error) {
      throw new WeatherUnavailableError(isTimeout(error) ? 'timeout' : 'network');
    }

    let bodyText: string;
    try {
      bodyText = await response.text();
    } catch (error) {
      throw new WeatherUnavailableError(isTimeout(error) ? 'timeout' : 'network');
    }

    let body: unknown;
    try {
      body = JSON.parse(bodyText) as unknown;
    } catch {
      if (!response.ok) throw new WeatherUnavailableError(`http_${response.status}`);
      throw new WeatherUnavailableError('unreadable_body');
    }

    const failure = WeatherstackFailureResponseSchema.safeParse(body);
    if (failure.success) {
      if (failure.data.error.code === 615) throw new LocationNotFoundError();
      throw new WeatherUnavailableError(`code_${failure.data.error.code}`);
    }

    if (!response.ok) throw new WeatherUnavailableError(`http_${response.status}`);

    const parsed = WeatherstackSuccessResponseSchema.safeParse(body);
    if (!parsed.success) throw new WeatherUnavailableError('unexpected_shape');

    return {
      lat: parsed.data.location.lat,
      long: parsed.data.location.lon,
      current: parsed.data.current,
    };
  }
}

function isTimeout(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}
