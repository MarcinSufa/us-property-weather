import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { server } from '../test/server.ts';
import { renderApp } from '../test/render-app.tsx';

const properties = [
  {
    __typename: 'Property',
    id: 'one',
    street: '15 Saguaro Blvd',
    city: 'Fountain Hills',
    state: 'AZ',
    zipCode: '85268',
    createdAt: '2026-10-13T08:12:00.000Z',
    weatherData: {
      __typename: 'WeatherData',
      temperature: 24,
      weather_descriptions: ['Sunny'],
    },
  },
  {
    __typename: 'Property',
    id: 'two',
    street: '200 Pine St',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    createdAt: '2026-10-12T14:40:00.000Z',
    weatherData: {
      __typename: 'WeatherData',
      temperature: null,
      weather_descriptions: ['Light rain'],
    },
  },
  {
    __typename: 'Property',
    id: 'three',
    street: '100 Congress Ave',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    createdAt: '2026-10-11T07:05:00.000Z',
    weatherData: {
      __typename: 'WeatherData',
      temperature: 27,
      weather_descriptions: null,
    },
  },
];

type ListVariables = {
  filter?: { city?: string; state?: string; zipCode?: string };
  sort: 'CREATED_AT_ASC' | 'CREATED_AT_DESC';
};

function propertiesHandler(resolve: (variables: ListVariables) => Response | Promise<Response>) {
  return http.get('http://localhost/graphql', ({ request }) => {
    const url = new URL(request.url);
    const body = {
      operationName: url.searchParams.get('operationName'),
      variables: JSON.parse(url.searchParams.get('variables') ?? '{}') as ListVariables,
    };
    if (body.operationName !== 'Properties') return HttpResponse.json({});
    return resolve(body.variables);
  });
}

function handleProperties(
  answer: typeof properties = properties,
  record?: (variables: ListVariables) => void,
) {
  server.use(
    propertiesHandler((variables) => {
      record?.(variables);
      return HttpResponse.json({ data: { properties: answer } });
    }),
  );
}

test('AC-LIST-2 rows show each property field and the street links to its detail', async () => {
  handleProperties();
  renderApp(['/']);

  expect(await screen.findByRole('link', { name: '15 Saguaro Blvd' })).toHaveAttribute(
    'href',
    '/properties/one',
  );
  expect(screen.getByRole('link', { name: '200 Pine St' })).toHaveAttribute(
    'href',
    '/properties/two',
  );
  expect(screen.getByRole('link', { name: '100 Congress Ave' })).toHaveAttribute(
    'href',
    '/properties/three',
  );
  expect(screen.getByText('Fountain Hills')).toBeInTheDocument();
  expect(screen.getByText('Seattle')).toBeInTheDocument();
  expect(screen.getByText('Austin')).toBeInTheDocument();
  expect(screen.getByText('AZ')).toBeInTheDocument();
  expect(screen.getByText('WA')).toBeInTheDocument();
  expect(screen.getByText('TX')).toBeInTheDocument();
  expect(screen.getByText('85268')).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Property list' })).toHaveAttribute('tabindex', '0');
  expect(screen.getByText('24 °C · Sunny')).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: 'Not reported · Light rain' })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: '27 °C · Not reported' })).toBeInTheDocument();
  expect(screen.getAllByRole('columnheader')).toHaveLength(6);
  for (const name of ['Street', 'City', 'State', 'Zip code', 'Created', 'Weather at creation']) {
    expect(screen.getByRole('columnheader', { name })).toHaveAttribute('scope', 'col');
  }
});

test('AC-WEB-6 creation time is a time element with the received ISO value', async () => {
  handleProperties();
  renderApp(['/']);

  expect(await screen.findByRole('link', { name: '15 Saguaro Blvd' })).toBeInTheDocument();
  const time = document.querySelector('time');
  expect(time).toHaveAttribute('datetime', properties[0]!.createdAt);
});

test('AC-WEB-5 missing weather values read Not reported once per missing value group', async () => {
  handleProperties();
  renderApp(['/']);

  expect(await screen.findByRole('link', { name: '200 Pine St' })).toBeInTheDocument();
  const rows = screen.getAllByRole('row');
  expect(
    within(rows[2]!).getByRole('cell', { name: 'Not reported · Light rain' }),
  ).toBeInTheDocument();
  expect(within(rows[3]!).getByRole('cell', { name: '27 °C · Not reported' })).toBeInTheDocument();
});

test.each([
  [properties, '3 properties'],
  [[properties[0]!], '1 property'],
])('AC-WEB-4 loaded list count reflects the rows shown', async (answer, count) => {
  handleProperties(answer);
  renderApp(['/']);

  expect(await screen.findByText(count)).toBeInTheDocument();
});

test('AC-LIST-4 pending list request shows a loading status', async () => {
  let resolveResponse: ((response: Response) => void) | undefined;
  server.use(
    propertiesHandler(
      () =>
        new Promise((resolve) => {
          resolveResponse = resolve;
        }),
    ),
  );
  renderApp(['/']);

  expect(await screen.findByText('Loading properties…')).toHaveAttribute('role', 'status');
  resolveResponse?.(HttpResponse.json({ data: { properties: [] } }));
  expect(await screen.findByRole('heading', { name: 'No properties yet' })).toBeInTheDocument();
});

test.each(['network', 'graphql'] as const)(
  'AC-LIST-4 %s list failure offers a retry',
  async (failure) => {
    server.use(
      propertiesHandler(() =>
        failure === 'network'
          ? HttpResponse.json({}, { status: 503 })
          : HttpResponse.json({
              errors: [
                { message: 'Unexpected failure', extensions: { code: 'INTERNAL_SERVER_ERROR' } },
              ],
            }),
      ),
    );
    renderApp(['/']);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load properties');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The server did not answer. Nothing was changed.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  },
);

test('AC-WEB-7 Try again resends the list query to the network', async () => {
  let requests = 0;
  server.use(
    propertiesHandler(() => {
      requests += 1;
      return requests === 1
        ? HttpResponse.json({}, { status: 503 })
        : HttpResponse.json({ data: { properties: [properties[0]!] } });
    }),
  );
  const { user } = renderApp(['/']);

  await user.click(await screen.findByRole('button', { name: 'Try again' }));

  expect(await screen.findByRole('link', { name: '15 Saguaro Blvd' })).toBeInTheDocument();
  expect(requests).toBe(2);
});

test('AC-LIST-3 empty unfiltered answer shows the initial empty state', async () => {
  handleProperties([]);
  renderApp(['/']);

  const main = await screen.findByRole('main');
  await within(main).findByRole('heading', { name: 'No properties yet' });
  expect(within(main).getByText('0 properties')).toBeInTheDocument();
  expect(within(main).getByRole('heading', { name: 'No properties yet' })).toBeInTheDocument();
  expect(within(main).getByRole('link', { name: 'Add property' })).toHaveAttribute(
    'href',
    '/properties/new',
  );
});

test('AC-FILTER-8 empty filtered answer can clear filters from the URL', async () => {
  const requests: ListVariables[] = [];
  handleProperties([], (variables) => requests.push(variables));
  const { router, user } = renderApp(['/?city=Austin']);

  expect(
    await screen.findByRole('heading', { name: 'No properties match these filters' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'No properties yet' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Clear filters' }));

  await screen.findByRole('heading', { name: 'No properties yet' });
  expect(router.state.location.search).toBe('');
  expect(requests.at(-1)).toEqual({ sort: 'CREATED_AT_DESC' });
});

test('AC-FILTER-7 applying trimmed filters updates the URL and query variables', async () => {
  const requests: ListVariables[] = [];
  handleProperties(properties, (variables) => requests.push(variables));
  const { router, user } = renderApp(['/']);

  await user.type(screen.getByRole('textbox', { name: 'City' }), '  Austin  ');
  await user.selectOptions(screen.getByRole('combobox', { name: 'State' }), 'TX');
  await user.type(screen.getByRole('textbox', { name: 'Zip code' }), '78701');
  await user.click(screen.getByRole('button', { name: 'Apply filters' }));

  expect(router.state.location.search).toBe('?city=Austin&state=TX&zip=78701');
  expect(requests.at(-1)).toEqual({
    filter: { city: 'Austin', state: 'TX', zipCode: '78701' },
    sort: 'CREATED_AT_DESC',
  });
});

test('AC-FILTER-7 navigating back restores the earlier URL, rows, and filter controls', async () => {
  handleProperties(properties);
  const { router, user } = renderApp(['/']);

  await user.type(screen.getByRole('textbox', { name: 'City' }), 'Seattle');
  await user.click(screen.getByRole('button', { name: 'Apply filters' }));
  await screen.findByText('3 properties');
  await router.navigate(-1);

  expect(router.state.location.search).toBe('');
  expect(await screen.findByRole('link', { name: '15 Saguaro Blvd' })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'City' })).toHaveValue(''));
});

test('AC-WEB-8 URL filters and oldest sort initialize fields and query variables', async () => {
  const requests: ListVariables[] = [];
  handleProperties(properties, (variables) => requests.push(variables));
  renderApp(['/?city=Austin&state=TX&zip=78701&sort=oldest']);

  expect(await screen.findByRole('link', { name: '15 Saguaro Blvd' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'City' })).toHaveValue('Austin');
  expect(screen.getByRole('combobox', { name: 'State' })).toHaveValue('TX');
  expect(screen.getByRole('textbox', { name: 'Zip code' })).toHaveValue('78701');
  expect(screen.getByRole('combobox', { name: 'Sort by created' })).toHaveValue('oldest');
  expect(requests.at(-1)).toEqual({
    filter: { city: 'Austin', state: 'TX', zipCode: '78701' },
    sort: 'CREATED_AT_ASC',
  });
});

test('AC-WEB-8 unknown URL state is omitted and the state control shows Any', async () => {
  const requests: ListVariables[] = [];
  handleProperties(properties, (variables) => requests.push(variables));
  renderApp(['/?state=XX']);

  expect(await screen.findByRole('link', { name: '15 Saguaro Blvd' })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'State' })).toHaveValue('');
  expect(requests.at(-1)).toEqual({ sort: 'CREATED_AT_DESC' });
});

test('AC-WEB-9 blank filter inputs are omitted from URL and query variables', async () => {
  const requests: ListVariables[] = [];
  handleProperties(properties, (variables) => requests.push(variables));
  const { router, user } = renderApp(['/']);

  await user.type(screen.getByRole('textbox', { name: 'City' }), '   ');
  await user.click(screen.getByRole('button', { name: 'Apply filters' }));

  expect(router.state.location.search).toBe('');
  expect(requests.at(-1)).toEqual({ sort: 'CREATED_AT_DESC' });
});

test('AC-WEB-10 Clear keeps oldest sort and removes all filter variables', async () => {
  const requests: ListVariables[] = [];
  handleProperties(properties, (variables) => requests.push(variables));
  const { router, user } = renderApp(['/?city=Austin&sort=oldest']);

  await screen.findByRole('link', { name: '15 Saguaro Blvd' });
  await user.click(screen.getByRole('button', { name: 'Clear' }));

  expect(router.state.location.search).toBe('?sort=oldest');
  expect(requests.at(-1)).toEqual({ sort: 'CREATED_AT_ASC' });
});

test('AC-SORT-4 sort changes keep filters and back restores the selected sort', async () => {
  const requests: ListVariables[] = [];
  handleProperties(properties, (variables) => requests.push(variables));
  const { router, user } = renderApp(['/?city=Austin']);

  await screen.findByRole('link', { name: '15 Saguaro Blvd' });
  const sort = screen.getByRole('combobox', { name: 'Sort by created' });
  await user.selectOptions(sort, 'oldest');
  expect(router.state.location.search).toBe('?city=Austin&sort=oldest');
  await waitFor(() =>
    expect(requests.at(-1)).toEqual({ filter: { city: 'Austin' }, sort: 'CREATED_AT_ASC' }),
  );
  await user.selectOptions(sort, 'newest');
  expect(router.state.location.search).toBe('?city=Austin');
  await router.navigate(-1);
  expect(router.state.location.search).toBe('?city=Austin&sort=oldest');
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Sort by created' })).toHaveValue('oldest'),
  );
});

test('AC-SORT-4 choosing newest removes the URL sort and queries descending', async () => {
  const requests: ListVariables[] = [];
  handleProperties(properties, (variables) => requests.push(variables));
  const { router, user } = renderApp(['/?city=Austin&sort=oldest']);

  await screen.findByRole('link', { name: '15 Saguaro Blvd' });
  await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by created' }), 'newest');

  expect(router.state.location.search).toBe('?city=Austin');
  await waitFor(() =>
    expect(requests.at(-1)).toEqual({ filter: { city: 'Austin' }, sort: 'CREATED_AT_DESC' }),
  );
});

test('AC-WEB-11 BAD_USER_INPUT field errors describe and invalidate their filter control', async () => {
  server.use(
    propertiesHandler(() =>
      HttpResponse.json({
        errors: [
          {
            message: 'Invalid zip',
            extensions: {
              code: 'BAD_USER_INPUT',
              fieldErrors: [{ field: 'zipCode', message: 'Zip code must be exactly 5 digits.' }],
            },
          },
        ],
      }),
    ),
  );
  renderApp(['/?zip=12']);

  const zip = screen.getByRole('textbox', { name: 'Zip code' });
  const error = await screen.findByText('Zip code must be exactly 5 digits.');
  expect(zip).toHaveAttribute('aria-invalid', 'true');
  expect(zip).toHaveAttribute('aria-describedby', error.id);
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('alert', { name: /Could not load properties/ }),
  ).not.toBeInTheDocument();
});

test('AC-WEB-12 every filter has a label and the zip field has the five digit pattern', async () => {
  handleProperties();
  renderApp(['/']);

  expect(await screen.findByRole('textbox', { name: 'City' })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'State' }).querySelectorAll('option')).toHaveLength(
    52,
  );
  expect(screen.getByRole('textbox', { name: 'Zip code' })).toHaveAttribute('pattern', '\\d{5}');
  expect(screen.getByRole('textbox', { name: 'Zip code' })).toHaveAttribute('inputmode', 'numeric');
  expect(screen.getByRole('combobox', { name: 'Sort by created' })).toBeInTheDocument();
});

test('AC-LIST-4 changing the URL hides old rows while its request is pending', async () => {
  let resolveResponse: ((response: Response) => void) | undefined;
  server.use(
    propertiesHandler((variables) => {
      if (variables.filter) {
        return new Promise((resolve) => {
          resolveResponse = resolve;
        });
      }
      return HttpResponse.json({ data: { properties: [properties[0]!] } });
    }),
  );
  const { user } = renderApp(['/']);
  expect(await screen.findByRole('link', { name: '15 Saguaro Blvd' })).toBeInTheDocument();

  await user.type(screen.getByRole('textbox', { name: 'City' }), 'Austin');
  await user.click(screen.getByRole('button', { name: 'Apply filters' }));

  expect(await screen.findByText('Loading properties…')).toHaveAttribute('role', 'status');
  expect(screen.queryByRole('link', { name: '15 Saguaro Blvd' })).not.toBeInTheDocument();
  resolveResponse?.(HttpResponse.json({ data: { properties: [] } }));
  expect(
    await screen.findByRole('heading', { name: 'No properties match these filters' }),
  ).toBeInTheDocument();
});
