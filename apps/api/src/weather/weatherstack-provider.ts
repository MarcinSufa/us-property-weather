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

    try {
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
        throw this.unavailable(isTimeout(error) ? 'timeout' : 'network');
      }

      let bodyText: string;
      try {
        bodyText = await response.text();
      } catch (error) {
        throw this.unavailable(isTimeout(error) ? 'timeout' : 'network');
      }

      let body: unknown;
      let isJson = true;
      try {
        body = JSON.parse(bodyText) as unknown;
      } catch {
        isJson = false;
      }

      const failure = WeatherstackFailureResponseSchema.safeParse(body);
      if (failure.success) {
        if (failure.data.error.code === 615) throw new LocationNotFoundError();
        throw this.unavailable(`code_${failure.data.error.code}`);
      }

      if (!response.ok) throw this.unavailable(`http_${response.status}`);
      if (!isJson) throw this.unavailable('unreadable_body');

      const parsed = WeatherstackSuccessResponseSchema.safeParse(body);
      if (!parsed.success) throw this.unavailable('unexpected_shape');

      this.options.logger.info(
        { outcome: 'ok', durationMs: Date.now() - startedAt },
        'Weather lookup completed',
      );
      return {
        lat: parsed.data.location.lat,
        long: parsed.data.location.lon,
        current: parsed.data.current,
      };
    } catch (error) {
      const locationNotFound = error instanceof LocationNotFoundError;
      const reason = locationNotFound
        ? 'code_615'
        : error instanceof WeatherUnavailableError
          ? error.reason
          : 'unexpected_error';
      this.options.logger.warn(
        {
          outcome: locationNotFound ? 'location_not_found' : 'unavailable',
          reason,
          durationMs: Date.now() - startedAt,
        },
        'Weather lookup failed',
      );
      throw error instanceof WeatherUnavailableError || locationNotFound
        ? error
        : this.unavailable('unexpected_error');
    }
  }

  private unavailable(reason: string): WeatherUnavailableError {
    return new WeatherUnavailableError(reason);
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
