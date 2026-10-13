import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Provider } from 'urql';
import { routes } from '../App.tsx';
import { createGraphqlClient } from '../graphql/client.ts';

export function renderApp(initialEntries: string[]) {
  const router = createMemoryRouter(routes, { initialEntries });
  const user = userEvent.setup();
  const client = createGraphqlClient('http://localhost/graphql');

  return {
    ...render(
      <Provider value={client}>
        <RouterProvider router={router} />
      </Provider>,
    ),
    router,
    user,
  };
}
