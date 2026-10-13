import type { PropertyQuery } from '../graphql/generated/graphql.ts';
import { formatDate, formatReportedValue, formatTemperature } from '../formatters.ts';

type WeatherData = NonNullable<PropertyQuery['property']>['weatherData'];
type WeatherCardProps = {
  weather: WeatherData;
  createdAt: string;
};

function formatObservation(weather: WeatherData, createdAt: string): string {
  const date = formatDate(createdAt, {
    dateOnly: true,
    timeZone: 'UTC',
    locale: 'en-US',
  });
  const observed = formatReportedValue(
    weather.observation_time,
    (value) => `Observed ${value} UTC on ${date}`,
    'Observation time: Not reported',
  );
  return `${observed}. Saved once, never refreshed.`;
}

export function WeatherCard({ weather, createdAt }: WeatherCardProps) {
  const description = weather.weather_descriptions?.[0]?.trim() || null;
  const temperature = formatTemperature(weather.temperature);
  const feelsLike = formatTemperature(weather.feelslike);
  const wind =
    weather.wind_speed === null && weather.wind_dir === null
      ? formatReportedValue(null, String)
      : `${formatReportedValue(weather.wind_speed, (value) => `${value} km/h`)} ${formatReportedValue(weather.wind_dir, (value) => value)}`;
  const daytime = formatReportedValue(weather.is_day, (value) =>
    value === 'yes' ? 'Yes' : value === 'no' ? 'No' : value,
  );
  const fields = [
    ['Humidity', formatReportedValue(weather.humidity, (value) => `${value} %`)],
    ['Wind', wind],
    ['Wind direction', formatReportedValue(weather.wind_degree, (value) => `${value}°`)],
    ['Pressure', formatReportedValue(weather.pressure, (value) => `${value} mb`)],
    ['Precipitation', formatReportedValue(weather.precip, (value) => `${value} mm`)],
    ['Cloud cover', formatReportedValue(weather.cloudcover, (value) => `${value} %`)],
    ['UV index', formatReportedValue(weather.uv_index, String)],
    ['Visibility', formatReportedValue(weather.visibility, (value) => `${value} km`)],
    ['Daytime', daytime],
    ['Weather code', formatReportedValue(weather.weather_code, String)],
  ];

  return (
    <section className="card weather-card" aria-labelledby="weather-card-title">
      <div className="weather-card__heading">
        <h2 id="weather-card-title">Weather at creation</h2>
        <p>{formatObservation(weather, createdAt)}</p>
      </div>
      <div className="weather-card__highlight">
        <svg
          aria-hidden="true"
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8m9.8 9.8 1.8 1.8M5.3 18.7l1.8-1.8m11.6-11.6-1.8 1.8" />
        </svg>
        <div className="weather-card__summary">
          <span className="weather-card__temperature">{temperature}</span>
          <span className="weather-card__description">
            {formatReportedValue(description, String)} · feels like {feelsLike}
          </span>
        </div>
      </div>
      <dl className="weather-card__fields">
        {fields.map(([label, value]) => (
          <div className="weather-card__field" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
