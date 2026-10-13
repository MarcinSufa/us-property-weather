import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import type { PropertyQuery } from '../graphql/generated/graphql.ts';
import { server } from '../test/server.ts';
import { renderApp } from '../test/render-app.tsx';

const createdAt = '2026-10-13T17:12:00.000Z';
type PropertyFixture = NonNullable<PropertyQuery['property']> & { __typename: 'Property' };
type WeatherFixture = PropertyFixture['weatherData'] & { __typename: 'WeatherData' };

const weather: WeatherFixture = {
  __typename: 'WeatherData',
  observation_time: '05:12 PM',
  temperature: 24,
  weather_code: 113,
  weather_icons: ['https://example.test/sunny.png'],
  weather_descriptions: ['Sunny'],
  wind_speed: 11,
  wind_degree: 225,
  wind_dir: 'SW',
  pressure: 1012,
  precip: 0,
  humidity: 18,
  cloudcover: 0,
  feelslike: 23,
  uv_index: 6,
  visibility: 16,
  is_day: 'yes',
};
const property: PropertyFixture = {
  __typename: 'Property',
  id: 'property-42',
  street: '15 Saguaro Blvd',
  city: 'Fountain Hills',
  state: 'AZ',
  zipCode: '85268',
  lat: 33.609,
  long: -111.724,
  createdAt,
  weatherData: weather,
};

type PropertyVariables = { id: string };

function propertyHandler(
  resolve: (variables: PropertyVariables) => Response | Promise<Response>,
  record?: (variables: PropertyVariables) => void,
) {
  return http.get('http://localhost/graphql', async ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('operationName') !== 'Property') return HttpResponse.json({});
    const variables = JSON.parse(url.searchParams.get('variables') ?? '{}') as PropertyVariables;
    record?.(variables);
    return resolve(variables);
  });
}

function successResponse(data: PropertyFixture | null = property) {
  return HttpResponse.json({ data: { property: data } });
}

beforeEach(() => {
  server.use(propertyHandler(() => successResponse()));
});

test('AC-DETAIL-1 sends the route id in the Property query', async () => {
  const requests: PropertyVariables[] = [];
  server.use(
    propertyHandler((variables) => {
      requests.push(variables);
      return successResponse();
    }),
  );
  renderApp(['/properties/property-42']);

  expect(
    await screen.findByRole('heading', { level: 1, name: property.street }),
  ).toBeInTheDocument();
  expect(requests).toEqual([{ id: 'property-42' }]);
});

test('AC-WEB-15 shows the property address and coordinates by their terms', async () => {
  renderApp(['/properties/property-42']);
  const card = await screen.findByRole('region', { name: 'Property' });
  const details = within(card);

  expect(details.getByRole('heading', { name: 'Property' })).toBeInTheDocument();
  for (const [term, value] of [
    ['Street', property.street],
    ['City', property.city],
    ['State', 'AZ Arizona'],
    ['Zip code', property.zipCode],
    ['Latitude', String(property.lat)],
    ['Longitude', String(property.long)],
  ] as [string, string][]) {
    const termElement = details.getByText(term);
    expect(termElement.tagName).toBe('DT');
    expect(termElement.nextElementSibling).toHaveTextContent(value);
  }
});

test('AC-WEB-6 shows creation time as a time element with the received ISO value', async () => {
  renderApp(['/properties/property-42']);
  const card = await screen.findByRole('region', { name: 'Property' });
  expect(within(card).getByRole('time')).toHaveAttribute('dateTime', createdAt);
});

test('AC-DETAIL-5 shows the weather at creation and its observation time', async () => {
  renderApp(['/properties/property-42']);
  const card = await screen.findByRole('region', { name: 'Weather at creation' });
  expect(card).toHaveTextContent(
    'Observed 05:12 PM UTC on Oct 13, 2026. Saved once, never refreshed.',
  );
});

test('AC-DETAIL-5 shows all weather values with metric units', async () => {
  renderApp(['/properties/property-42']);
  const card = await screen.findByRole('region', { name: 'Weather at creation' });

  expect(within(card).getByText('24 °C')).toBeInTheDocument();
  expect(within(card).getByText('Sunny · feels like 23 °C')).toBeInTheDocument();
  for (const [term, value] of [
    ['Humidity', '18 %'],
    ['Wind', '11 km/h SW'],
    ['Wind direction', '225°'],
    ['Pressure', '1012 mb'],
    ['Precipitation', '0 mm'],
    ['Cloud cover', '0 %'],
    ['UV index', '6'],
    ['Visibility', '16 km'],
    ['Daytime', 'Yes'],
    ['Weather code', '113'],
  ] as [string, string][]) {
    const termElement = within(card).getByText(term);
    expect(termElement.tagName).toBe('DT');
    expect(termElement.nextElementSibling).toHaveTextContent(value);
  }
});

test('AC-WEB-5 shows Not reported for null humidity and observation time while preserving zero', async () => {
  server.use(
    propertyHandler(() =>
      successResponse({
        ...property,
        weatherData: { ...weather, humidity: null, observation_time: null },
      }),
    ),
  );
  renderApp(['/properties/property-42']);
  const card = await screen.findByRole('region', { name: 'Weather at creation' });

  expect(
    within(card).getByText('Observation time: Not reported. Saved once, never refreshed.'),
  ).toBeInTheDocument();
  expect(within(card).getByText('Humidity').nextElementSibling).toHaveTextContent('Not reported');
  expect(within(card).getByText('Precipitation').nextElementSibling).toHaveTextContent('0 mm');
});

test('AC-WEB-5 renders every null weather field as Not reported', async () => {
  const allNull: WeatherFixture = {
    __typename: 'WeatherData',
    observation_time: null,
    temperature: null,
    weather_code: null,
    weather_icons: null,
    weather_descriptions: null,
    wind_speed: null,
    wind_degree: null,
    wind_dir: null,
    pressure: null,
    precip: null,
    humidity: null,
    cloudcover: null,
    feelslike: null,
    uv_index: null,
    visibility: null,
    is_day: null,
  };
  server.use(
    propertyHandler(() =>
      successResponse({
        ...property,
        weatherData: allNull,
      }),
    ),
  );
  renderApp(['/properties/property-42']);
  const card = await screen.findByRole('region', { name: 'Weather at creation' });

  for (const term of [
    'Humidity',
    'Wind',
    'Wind direction',
    'Pressure',
    'Precipitation',
    'Cloud cover',
    'UV index',
    'Visibility',
    'Daytime',
    'Weather code',
  ]) {
    const row = within(card).getByText(term).parentElement;
    expect(row).toHaveTextContent('Not reported');
  }
  expect(card).toHaveTextContent('Not reported · feels like Not reported');
  expect(card).toHaveTextContent('Observation time: Not reported. Saved once, never refreshed.');
});

test('AC-DETAIL-3 shows loading while the query response is held open', async () => {
  server.use(propertyHandler(() => new Promise(() => {})));
  renderApp(['/properties/property-42']);

  expect(await screen.findByRole('status')).toHaveTextContent('Loading property…');
});

test.each(['network', 'graphql'] as const)(
  'AC-DETAIL-3 shows the load error for a %s failure',
  async (failure) => {
    server.use(
      propertyHandler(() =>
        failure === 'network'
          ? HttpResponse.json({}, { status: 503 })
          : HttpResponse.json({
              errors: [{ message: 'Failed', extensions: { code: 'INTERNAL_SERVER_ERROR' } }],
            }),
      ),
    );
    renderApp(['/properties/property-42']);

    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByRole('heading', { name: 'Could not load this property' }),
    ).toBeInTheDocument();
    expect(alert).toHaveTextContent('The server did not answer. Nothing was changed.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  },
);

test('AC-WEB-7 Try again sends a second request and shows its property', async () => {
  let requests = 0;
  server.use(
    propertyHandler(() => {
      requests += 1;
      return requests === 1
        ? HttpResponse.json({}, { status: 503 })
        : successResponse({ ...property, street: 'Second answer Street' });
    }),
  );
  const { user } = renderApp(['/properties/property-42']);

  await user.click(await screen.findByRole('button', { name: 'Try again' }));

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Second answer Street' }),
  ).toBeInTheDocument();
  expect(requests).toBe(2);
});

test('AC-DETAIL-4 shows not found and a link back to all properties', async () => {
  server.use(propertyHandler(() => successResponse(null)));
  renderApp(['/properties/unknown']);

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Property not found' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to all properties' })).toHaveAttribute('href', '/');
});

test('AC-WEB-2 uses the street and not-found page titles', async () => {
  renderApp(['/properties/property-42']);
  await screen.findByRole('heading', { level: 1, name: property.street });
  await waitFor(() => expect(document.title).toBe(`${property.street} - CoverTree`));

  server.use(propertyHandler(() => successResponse(null)));
  const { unmount } = renderApp(['/properties/unknown']);
  await screen.findByRole('heading', { level: 1, name: 'Property not found' });
  await waitFor(() => expect(document.title).toBe('Property not found - CoverTree'));
  unmount();
});
