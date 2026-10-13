import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'urql';
import { App } from './App.tsx';
import { createGraphqlClient } from './graphql/client.ts';
import './styles/tokens.css';
import './styles/base.css';

const client = createGraphqlClient('/graphql');

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider value={client}>
      <App />
    </Provider>
  </StrictMode>,
);
