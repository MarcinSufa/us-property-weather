import { http, HttpResponse } from 'msw';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { server } from '../test/server.ts';
import { renderApp } from '../test/render-app.tsx';

type CreateInput = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

type CreateVariables = { input: CreateInput };

type GraphqlRequest = {
  operationName?: string;
  variables?: CreateVariables;
};

const address: CreateInput = {
  street: '15 Saguaro Blvd',
  city: 'Fountain Hills',
  state: 'AZ',
  zipCode: '85268',
};

function createHandler(
  resolve: (variables: CreateVariables) => Response | Promise<Response>,
  record?: (variables: CreateVariables) => void,
) {
  return http.post('http://localhost/graphql', async ({ request }) => {
    const body = (await request.json()) as GraphqlRequest;
    if (body.operationName !== 'CreateProperty' || !body.variables) return HttpResponse.json({});
    record?.(body.variables);
    return resolve(body.variables);
  });
}

async function fillAddress(user: ReturnType<typeof renderApp>['user']) {
  await user.type(screen.getByRole('textbox', { name: 'Street' }), address.street);
  await user.type(screen.getByRole('textbox', { name: 'City' }), address.city);
  await user.selectOptions(screen.getByRole('combobox', { name: 'State' }), address.state);
  await user.type(screen.getByRole('textbox', { name: 'Zip code' }), address.zipCode);
}

function successResponse(id = 'created-id') {
  return HttpResponse.json({ data: { createProperty: { __typename: 'Property', id } } });
}

test('AC-CREATE-11 the four address controls are found by their labels', async () => {
  renderApp(['/properties/new']);

  expect(await screen.findByRole('textbox', { name: 'Street' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'City' })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'State' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Zip code' })).toBeInTheDocument();
});

test('AC-CREATE-8 native constraints and the state list match the form contract', async () => {
  renderApp(['/properties/new']);

  const street = await screen.findByRole('textbox', { name: 'Street' });
  const city = screen.getByRole('textbox', { name: 'City' });
  const state = screen.getByRole('combobox', { name: 'State' });
  const zip = screen.getByRole('textbox', { name: 'Zip code' });
  expect(street).toBeRequired();
  expect(street).toHaveAttribute('maxlength', '200');
  expect(city).toBeRequired();
  expect(city).toHaveAttribute('maxlength', '100');
  expect(state).toBeRequired();
  expect(state.querySelector('option')).toHaveValue('');
  expect(state.querySelector('option')).toHaveTextContent('Select a state');
  expect(state.querySelectorAll('option')).toHaveLength(52);
  expect(zip).toBeRequired();
  expect(zip).toHaveAttribute('pattern', '\\d{5}');
  expect(zip).toHaveAttribute('maxlength', '5');
  expect(zip).toHaveAttribute('inputmode', 'numeric');
  expect(zip).toHaveAccessibleDescription('5 digits. The weather lookup uses it.');
});

test('AC-CREATE-8 an empty form sends no request and keeps the route', async () => {
  let requests = 0;
  server.use(
    createHandler(
      () => successResponse(),
      () => (requests += 1),
    ),
  );
  const { router, user } = renderApp(['/properties/new']);

  await user.click(await screen.findByRole('button', { name: 'Add property' }));

  expect(requests).toBe(0);
  expect(router.state.location.pathname).toBe('/properties/new');
});

test('AC-CREATE-10 a valid form sends typed values and navigates to the returned property', async () => {
  const requests: CreateVariables[] = [];
  server.use(
    createHandler(
      () => successResponse('new-property'),
      (variables) => requests.push(variables),
    ),
  );
  const { router, user } = renderApp(['/properties/new']);
  await fillAddress(user);

  await user.click(screen.getByRole('button', { name: 'Add property' }));

  await waitFor(() => expect(router.state.location.pathname).toBe('/properties/new-property'));
  expect(requests).toEqual([{ input: address }]);
});

test('AC-CREATE-14 AC-WEB-13 a pending request disables the button and makes the fields read-only', async () => {
  let resolveResponse: ((response: Response) => void) | undefined;
  let requests = 0;
  server.use(
    createHandler(
      () => new Promise((resolve) => (resolveResponse = resolve)),
      () => (requests += 1),
    ),
  );
  const { user } = renderApp(['/properties/new']);
  await fillAddress(user);
  await user.click(screen.getByRole('button', { name: 'Add property' }));

  const button = await screen.findByRole('button', { name: 'Saving…' });
  expect(button).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('Looking up the weather…');
  expect(screen.getByRole('textbox', { name: 'Street' })).toHaveAttribute('readonly');
  expect(screen.getByRole('textbox', { name: 'City' })).toHaveAttribute('readonly');
  expect(screen.getByRole('textbox', { name: 'Zip code' })).toHaveAttribute('readonly');
  expect(screen.getByRole('combobox', { name: 'State' })).toBeDisabled();
  const form = screen.getByRole('form', { name: 'Add property' });
  expect(form).toHaveAttribute('aria-busy', 'true');
  fireEvent.submit(form);
  expect(requests).toBe(1);

  resolveResponse?.(successResponse());
});

test('AC-CREATE-9 AC-CREATE-12 field errors are described, invalid, and inside aria-live', async () => {
  server.use(
    createHandler(() =>
      HttpResponse.json({
        errors: [
          {
            message: 'Invalid address',
            extensions: {
              code: 'BAD_USER_INPUT',
              fieldErrors: [
                { field: 'street', message: 'Enter a street address.' },
                { field: 'zipCode', message: 'Zip code must be exactly 5 digits.' },
              ],
            },
          },
        ],
      }),
    ),
  );
  const { user } = renderApp(['/properties/new']);
  await fillAddress(user);
  await user.click(screen.getByRole('button', { name: 'Add property' }));

  const form = await screen.findByRole('form');
  const street = within(form).getByRole('textbox', { name: 'Street' });
  const zip = within(form).getByRole('textbox', { name: 'Zip code' });
  const streetError = within(form).getByText('Enter a street address.');
  const zipError = within(form).getByText('Zip code must be exactly 5 digits.');
  expect(form).toHaveAttribute('aria-live', 'polite');
  expect(street).toHaveAttribute('aria-invalid', 'true');
  expect(street).toHaveAttribute('aria-describedby', streetError.closest('p')?.id);
  expect(zip).toHaveAttribute('aria-invalid', 'true');
  expect(zip).toHaveAttribute('aria-describedby', `${zip.id}-hint ${zipError.closest('p')?.id}`);
});

test.each([
  ['street', 'street', 'Street', 'Enter a street address.'],
  ['zip code', 'zipCode', 'Zip code', 'Zip code must be exactly 5 digits.'],
])('AC-CREATE-13 %s-only field error receives focus', async (_, field, label, message) => {
  server.use(
    createHandler(() =>
      HttpResponse.json({
        errors: [
          {
            message: 'Invalid address',
            extensions: {
              code: 'BAD_USER_INPUT',
              fieldErrors: [{ field, message }],
            },
          },
        ],
      }),
    ),
  );
  const { user } = renderApp(['/properties/new']);
  await fillAddress(user);
  await user.click(screen.getByRole('button', { name: 'Add property' }));

  expect(await screen.findByText(message)).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: label })).toHaveFocus();
});

test('AC-CREATE-13 state-only field error receives focus', async () => {
  server.use(
    createHandler(() =>
      HttpResponse.json({
        errors: [
          {
            message: 'Invalid address',
            extensions: {
              code: 'BAD_USER_INPUT',
              fieldErrors: [{ field: 'state', message: 'Choose a state.' }],
            },
          },
        ],
      }),
    ),
  );
  const { user } = renderApp(['/properties/new']);
  await fillAddress(user);
  await user.click(screen.getByRole('button', { name: 'Add property' }));

  expect(await screen.findByText('Choose a state.')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'State' })).toHaveFocus();
});

test.each([
  [
    'LOCATION_NOT_FOUND',
    'The weather service does not know this location',
    'Check the zip code and try again. Nothing was saved.',
  ],
  [
    'WEATHER_UNAVAILABLE',
    'The weather service is not answering',
    'Nothing was saved. Try again in a moment.',
  ],
  ['INTERNAL_SERVER_ERROR', 'Something went wrong', 'Nothing was saved.'],
  ['network', 'Something went wrong', 'Nothing was saved.'],
])('AC-CREATE-15 %s create failure has one alert with its message', async (code, title, body) => {
  server.use(
    createHandler(() =>
      code === 'network'
        ? HttpResponse.json({}, { status: 503 })
        : HttpResponse.json({
            errors: [{ message: 'Create failed', extensions: { code } }],
          }),
    ),
  );
  const { user } = renderApp(['/properties/new']);
  await fillAddress(user);
  await user.click(screen.getByRole('button', { name: 'Add property' }));

  const alert = await screen.findByRole('alert');
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  expect(within(alert).getByRole('heading', { name: title })).toBeInTheDocument();
  expect(alert).toHaveTextContent(body);
});

test.each([
  [
    'WEATHER_UNAVAILABLE',
    {
      errors: [{ message: 'Unavailable', extensions: { code: 'WEATHER_UNAVAILABLE' } }],
    },
  ],
  [
    'BAD_USER_INPUT',
    {
      errors: [
        {
          message: 'Invalid input',
          extensions: {
            code: 'BAD_USER_INPUT',
            fieldErrors: [{ field: 'city', message: 'Enter a city.' }],
          },
        },
      ],
    },
  ],
])('AC-WEB-14 %s keeps typed values and re-enables the form', async (_, response) => {
  server.use(createHandler(() => HttpResponse.json(response)));
  const { user } = renderApp(['/properties/new']);
  await fillAddress(user);
  await user.click(screen.getByRole('button', { name: 'Add property' }));

  expect(await screen.findByRole('button', { name: 'Add property' })).toBeEnabled();
  expect(screen.getByRole('textbox', { name: 'Street' })).toHaveValue(address.street);
  expect(screen.getByRole('textbox', { name: 'City' })).toHaveValue(address.city);
  expect(screen.getByRole('combobox', { name: 'State' })).toHaveValue(address.state);
  expect(screen.getByRole('textbox', { name: 'Zip code' })).toHaveValue(address.zipCode);
});

test('AC-LIST-5 creating from an empty list refreshes the list without reloading the app', async () => {
  let created = false;
  const newProperty = {
    __typename: 'Property',
    id: 'new-list-property',
    ...address,
    createdAt: '2026-10-13T08:12:00.000Z',
    weatherData: {
      __typename: 'WeatherData',
      temperature: 24,
      weather_descriptions: ['Sunny'],
    },
  };
  server.use(
    http.get('http://localhost/graphql', ({ request }) => {
      const operationName = new URL(request.url).searchParams.get('operationName');
      if (operationName === 'Properties') {
        return HttpResponse.json({ data: { properties: created ? [newProperty] : [] } });
      }
      if (operationName === 'Property') {
        return HttpResponse.json({
          data: {
            property: {
              __typename: 'Property',
              id: 'new-list-property',
              ...address,
              lat: 33.609,
              long: -111.724,
              createdAt: '2026-10-13T08:12:00.000Z',
              weatherData: {
                __typename: 'WeatherData',
                observation_time: null,
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
    createHandler(() => {
      created = true;
      return successResponse('new-list-property');
    }),
  );
  const { user } = renderApp(['/']);

  expect(await screen.findByRole('heading', { name: 'No properties yet' })).toBeInTheDocument();
  await user.click(within(screen.getByRole('main')).getByRole('link', { name: 'Add property' }));
  await fillAddress(user);
  await user.click(screen.getByRole('button', { name: 'Add property' }));
  expect(await screen.findByRole('heading', { name: address.street })).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Properties' }));

  expect(await screen.findByRole('link', { name: address.street })).toHaveAttribute(
    'href',
    '/properties/new-list-property',
  );
});
