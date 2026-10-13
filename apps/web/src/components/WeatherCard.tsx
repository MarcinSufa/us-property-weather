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
  const description =
    weather.weather_descriptions
      ?.map((entry) => entry.trim())
      .filter(Boolean)
      .join(', ') || null;
  const icon = weather.weather_icons?.[0] || null;
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
        {icon && (
          <img
            src={icon}
            alt=""
            width="44"
            height="44"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
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
