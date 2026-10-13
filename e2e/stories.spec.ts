import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { STUB_PORT, UNKNOWN_ZIP_CODE } from './weatherstack-stub.ts';

type Address = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

const properties: Address[] = [
  { street: '15 Saguaro Blvd', city: 'Fountain Hills', state: 'AZ', zipCode: '85268' },
  { street: '220 Palm Street', city: 'Scottsdale', state: 'AZ', zipCode: '85268' },
  { street: '300 Pine Avenue', city: 'Austin', state: 'TX', zipCode: '78701' },
];

let expectedWeatherCalls = 0;

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ context }) => {
  await context.route('**/*', async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') await route.continue();
    else await route.abort();
  });
});

async function weatherCalls(request: APIRequestContext) {
  const response = await request.get(`http://127.0.0.1:${STUB_PORT}/__calls`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as { calls: number };
}

async function expectWeatherCalls(request: APIRequestContext, expected = expectedWeatherCalls) {
  expect(await weatherCalls(request)).toEqual({ calls: expected });
}

async function fillAddress(page: Page, address: Address) {
  await page.getByRole('textbox', { name: 'Street', exact: true }).fill(address.street);
  await page.getByRole('textbox', { name: 'City', exact: true }).fill(address.city);
  await page.getByRole('combobox', { name: 'State', exact: true }).selectOption(address.state);
  await page.getByRole('textbox', { name: 'Zip code', exact: true }).fill(address.zipCode);
}

async function createProperty(page: Page, request: APIRequestContext, address: Address) {
  await page.goto('/properties/new');
  await fillAddress(page, address);
  expectedWeatherCalls += 1;
  await page.getByRole('button', { name: 'Add property', exact: true }).click();
  await expect(page.getByRole('heading', { name: address.street, exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/properties\/[^/]+$/);
  await expect(
    page.getByRole('region', { name: 'Weather at creation', exact: true }),
  ).toBeVisible();
  await expectWeatherCalls(request);
}

function propertyRows(page: Page) {
  return page
    .getByRole('region', { name: 'Property list', exact: true })
    .getByRole('table')
    .getByRole('row')
    .filter({
      has: page.getByRole('link'),
    });
}

test('AC-CREATE-10 create stores the weather snapshot and opens the new property', async ({
  page,
  request,
}) => {
  await expectWeatherCalls(request, 0);
  await createProperty(page, request, properties[0]!);

  const weather = page.getByRole('region', { name: 'Weather at creation', exact: true });
  await expect(weather).toContainText('19 °C');
  await expect(weather).toContainText('Patchy rain nearby');
  await expectWeatherCalls(request);
});

test('AC-CREATE-15 AC-WEB-14 unknown location keeps the typed address and saves nothing', async ({
  page,
  request,
}) => {
  const unknownAddress = {
    street: '9 Nowhere Road',
    city: 'Unknown City',
    state: 'AZ',
    zipCode: UNKNOWN_ZIP_CODE,
  };
  await page.goto('/properties/new');
  await fillAddress(page, unknownAddress);
  expectedWeatherCalls += 1;
  await page.getByRole('button', { name: 'Add property', exact: true }).click();

  const alert = page.getByRole('alert');
  await expect(
    alert.getByRole('heading', {
      name: 'The weather service does not know this location',
      exact: true,
    }),
  ).toBeVisible();
  await expect(alert).toContainText('Check the zip code and try again. Nothing was saved.');
  await expect(page).toHaveURL(/\/properties\/new$/);
  await expect(page.getByRole('textbox', { name: 'Street', exact: true })).toHaveValue(
    unknownAddress.street,
  );
  await expect(page.getByRole('textbox', { name: 'City', exact: true })).toHaveValue(
    unknownAddress.city,
  );
  await expect(page.getByRole('combobox', { name: 'State', exact: true })).toHaveValue(
    unknownAddress.state,
  );
  await expect(page.getByRole('textbox', { name: 'Zip code', exact: true })).toHaveValue(
    unknownAddress.zipCode,
  );
  await expectWeatherCalls(request);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Properties', exact: true })).toBeVisible();
  const rows = propertyRows(page);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(properties[0]!.street);
  await expect(page.getByText('1 property', { exact: true })).toBeVisible();
  await expectWeatherCalls(request);
  await expect(page.getByRole('link', { name: unknownAddress.street, exact: true })).toHaveCount(0);
});

test('AC-CREATE-9 AC-CREATE-13 server validation describes and focuses the street field', async ({
  page,
  request,
}) => {
  await page.goto('/properties/new');
  await fillAddress(page, { ...properties[0]!, street: '   ' });
  await page.getByRole('button', { name: 'Add property', exact: true }).click();

  const street = page.getByRole('textbox', { name: 'Street', exact: true });
  await expect(street).toHaveAttribute('aria-invalid', 'true');
  await expect(street).toHaveAccessibleDescription('Street must be between 1 and 200 characters.');
  await expect(street).toBeFocused();
  await expect(page).toHaveURL(/\/properties\/new$/);
  await expectWeatherCalls(request);
});

test('AC-CREATE-10 create the other list properties through the form', async ({
  page,
  request,
}) => {
  await expectWeatherCalls(request);
  await createProperty(page, request, properties[1]!);
  await createProperty(page, request, properties[2]!);
  await expectWeatherCalls(request);
});

test('AC-LIST-2 list rows show address fields and the fixture weather summary', async ({
  page,
  request,
}) => {
  await expectWeatherCalls(request);
  await page.goto('/');
  await expect(page.getByText('3 properties', { exact: true })).toBeVisible();
  const rows = propertyRows(page);
  await expect(rows).toHaveCount(3);
  for (const address of properties) {
    const row = rows.filter({
      has: page.getByRole('link', { name: address.street, exact: true }),
    });
    await expect(row).toContainText(address.street);
    await expect(row).toContainText(address.city);
    await expect(row).toContainText(address.state);
    await expect(row).toContainText(address.zipCode);
    await expect(row).toContainText('19 °C · Patchy rain nearby');
  }
  await expectWeatherCalls(request);
});

test('AC-FILTER-7 filters by city, state and zip and reloads the same view', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const rows = propertyRows(page);
  await expect(rows).toHaveCount(3);
  await expectWeatherCalls(request);

  await page.getByRole('textbox', { name: 'City', exact: true }).fill('fOuNtAiN hIlLs');
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect(page).toHaveURL(/[?&]city=fOuNtAiN\+hIlLs(?:&|$)/);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(properties[0]!.street);
  await expect(page.getByRole('link', { name: properties[1]!.street, exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: properties[2]!.street, exact: true })).toHaveCount(0);
  await expectWeatherCalls(request);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'City', exact: true })).toHaveValue(
    'fOuNtAiN hIlLs',
  );
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(properties[0]!.street);
  await expect(page.getByRole('link', { name: properties[1]!.street, exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: properties[2]!.street, exact: true })).toHaveCount(0);
  await expectWeatherCalls(request);

  await page.getByRole('textbox', { name: 'City', exact: true }).fill('');
  await page.getByRole('combobox', { name: 'State', exact: true }).selectOption('AZ');
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect(page).toHaveURL(/state=AZ/);
  await expect(rows).toHaveCount(2);
  await expect(page.getByRole('link', { name: properties[0]!.street, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: properties[1]!.street, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: properties[2]!.street, exact: true })).toHaveCount(0);
  await expectWeatherCalls(request);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'State', exact: true })).toHaveValue('AZ');
  await expect(rows).toHaveCount(2);
  await expect(page.getByRole('link', { name: properties[0]!.street, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: properties[1]!.street, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: properties[2]!.street, exact: true })).toHaveCount(0);
  await expectWeatherCalls(request);

  await page.getByRole('combobox', { name: 'State', exact: true }).selectOption('');
  await page.getByRole('textbox', { name: 'Zip code', exact: true }).fill('78701');
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect(page).toHaveURL(/zip=78701/);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(properties[2]!.street);
  await expect(page.getByRole('link', { name: properties[0]!.street, exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: properties[1]!.street, exact: true })).toHaveCount(0);
  await expectWeatherCalls(request);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Zip code', exact: true })).toHaveValue('78701');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(properties[2]!.street);
  await expect(page.getByRole('link', { name: properties[0]!.street, exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: properties[1]!.street, exact: true })).toHaveCount(0);
  await expectWeatherCalls(request);
});

test('AC-SORT-4 sort newest first by default and keep oldest first in the URL', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const rows = propertyRows(page);
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText(properties[2]!.street);
  await expect(rows.nth(1)).toContainText(properties[1]!.street);
  await expect(rows.nth(2)).toContainText(properties[0]!.street);
  await expectWeatherCalls(request);

  await page.getByRole('combobox', { name: 'Sort by created', exact: true }).selectOption('oldest');
  await expect(page).toHaveURL(/sort=oldest/);
  await expect(rows.nth(0)).toContainText(properties[0]!.street);
  await expect(rows.nth(2)).toContainText(properties[2]!.street);
  await expectWeatherCalls(request);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Sort by created', exact: true })).toHaveValue(
    'oldest',
  );
  await expect(rows.nth(0)).toContainText(properties[0]!.street);
  await expect(rows.nth(1)).toContainText(properties[1]!.street);
  await expect(rows.nth(2)).toContainText(properties[2]!.street);
  await expectWeatherCalls(request);
});

test('AC-DETAIL-5 open a list property and show coordinates and stored weather', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const rows = propertyRows(page);
  await expect(rows).toHaveCount(3);
  await expect(page.getByRole('link', { name: properties[2]!.street, exact: true })).toBeVisible();
  await expectWeatherCalls(request);
  await page.getByRole('link', { name: properties[2]!.street, exact: true }).click();
  await expect(page).toHaveURL(/\/properties\/[^/]+$/);
  await expect(
    page.getByRole('heading', { name: properties[2]!.street, exact: true }),
  ).toBeVisible();
  await expect(page.getByText('33.609', { exact: true })).toBeVisible();
  await expect(page.getByText('-111.724', { exact: true })).toBeVisible();
  await expectWeatherCalls(request);
  const weather = page.getByRole('region', { name: 'Weather at creation', exact: true });
  await expect(weather).toContainText('19 °C');
  await expectWeatherCalls(request);
});

test('AC-DELETE-3 AC-WEB-16 confirm in the modal dialog, restore focus and show the missing detail', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const rows = propertyRows(page);
  await expect(rows).toHaveCount(3);
  await expect(page.getByRole('link', { name: properties[2]!.street, exact: true })).toBeVisible();
  await expectWeatherCalls(request);
  const deletedStreet = properties[2]!.street;
  const deleteButton = page.getByRole('button', {
    name: `Delete ${deletedStreet}`,
    exact: true,
  });
  const detailHref = await page
    .getByRole('link', { name: deletedStreet, exact: true })
    .getAttribute('href');
  expect(detailHref).not.toBeNull();
  await deleteButton.click();

  const dialog = page.getByRole('dialog', { name: `Delete ${deletedStreet}?`, exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await expect(dialog).toContainText(deletedStreet);
  const addPropertyLink = page
    .getByRole('navigation', { name: 'Main navigation', exact: true })
    .getByRole('link', { name: 'Add property', exact: true });
  await expect(addPropertyLink).toBeVisible();
  expect(
    await addPropertyLink.evaluate((link) => {
      const bounds = link.getBoundingClientRect();
      const target = document.elementFromPoint(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
      );
      return link.isConnected && target !== link && !link.contains(target);
    }),
  ).toBe(true);
  await expect(page).toHaveURL('/');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('link', { name: deletedStreet, exact: true })).toBeVisible();
  await expect(deleteButton).toBeFocused();

  await deleteButton.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('link', { name: deletedStreet, exact: true })).toBeVisible();
  await expect(deleteButton).toBeFocused();

  await deleteButton.click();
  await expect(dialog).toBeVisible();
  await expectWeatherCalls(request);
  await dialog.getByRole('button', { name: 'Delete property', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('2 properties', { exact: true })).toBeVisible();
  await expect(rows).toHaveCount(2);
  await expect(page.getByRole('link', { name: deletedStreet, exact: true })).toHaveCount(0);
  await expectWeatherCalls(request);

  await page.goto(detailHref!);
  await expect(
    page.getByRole('heading', { name: 'Property not found', exact: true }),
  ).toBeVisible();
  await expectWeatherCalls(request);
});

test('AC-WEATHER-9 list, filter, sort, detail and delete do not make weather requests', async ({
  request,
}) => {
  await expectWeatherCalls(request);
});
