import { createBrowserRouter, RouterProvider } from 'react-router';
import { PropertyListPage } from './pages/PropertyListPage.tsx';
import { NewPropertyPage } from './pages/NewPropertyPage.tsx';
import { PropertyDetailPage } from './pages/PropertyDetailPage.tsx';

export const routes = [
  { path: '/', element: <PropertyListPage /> },
  { path: '/properties/new', element: <NewPropertyPage /> },
  { path: '/properties/:id', element: <PropertyDetailPage /> },
];

const router = createBrowserRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}
