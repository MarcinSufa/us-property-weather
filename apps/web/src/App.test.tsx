import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { server } from './test/server.ts';
import { renderApp } from './test/render-app.tsx';

beforeEach(() => {
  server.use(
    http.get('http://localhost/graphql', ({ request }) => {
      const operationName = new URL(request.url).searchParams.get('operationName');
      if (operationName === 'Properties') return HttpResponse.json({ data: { properties: [] } });
      if (operationName === 'Property') {
        return HttpResponse.json({
          data: {
            property: {
              __typename: 'Property',
              id: 'abc-123',
              street: '15 Saguaro Blvd',
              city: 'Fountain Hills',
              state: 'AZ',
              zipCode: '85268',
              lat: 33.609,
              long: -111.724,
              createdAt: '2026-10-13T17:12:00.000Z',
              weatherData: {
                __typename: 'WeatherData',
                observation_time: '05:12 PM',
                temperature: 24,
                weather_code: 113,
                weather_icons: [],
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
              },
            },
          },
        });
      }
      return HttpResponse.json({});
    }),
  );
});

test.each([
  ['/', 'Properties', 'Properties - CoverTree'],
  ['/properties/new', 'Add property', 'Add property - CoverTree'],
  ['/properties/abc-123', '15 Saguaro Blvd', '15 Saguaro Blvd - CoverTree'],
])('AC-WEB-2 %s has its page title and one heading', async (path, heading, title) => {
  renderApp([path]);

  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(document.title).toBe(title);
});

test('AC-WEB-1 unknown paths show a link back to the list', async () => {
  renderApp(['/no/such/path']);

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'All properties' })).toHaveAttribute('href', '/');
  expect(document.title).toBe('Page not found - CoverTree');
});

test.each([
  ['/', true],
  ['/properties/new', false],
  ['/properties/abc-123', true],
])('AC-WEB-3 header navigation on %s', async (path, showAdd) => {
  renderApp([path]);
  const banner = await screen.findByRole('banner');
  const links = within(banner);

  expect(links.getByRole('link', { name: 'Properties' })).toHaveAttribute('href', '/');
  if (showAdd) {
    expect(links.getByRole('link', { name: 'Add property' })).toHaveAttribute(
      'href',
      '/properties/new',
    );
  } else {
    expect(links.queryByRole('link', { name: 'Add property' })).not.toBeInTheDocument();
  }
});

test('AC-WEB-3 clicking Add property navigates to the form', async () => {
  const { router, user } = renderApp(['/']);

  await user.click(await screen.findByRole('link', { name: 'Add property' }));

  expect(router.state.location.pathname).toBe('/properties/new');
});
