import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, test } from 'vitest';
import { routes } from './App.tsx';

test.each([
  ['/', 'Properties'],
  ['/properties/new', 'New property'],
  ['/properties/abc-123', 'Property details'],
])('renders the %s route placeholder', async (path, heading) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  render(<RouterProvider router={router} />);

  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
});
