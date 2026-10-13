import { Layout } from './components/Layout.tsx';
import { PropertyListPage } from './pages/PropertyListPage.tsx';
import { NewPropertyPage } from './pages/NewPropertyPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { PropertyDetailPage } from './pages/PropertyDetailPage.tsx';

export const routes = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <PropertyListPage /> },
      { path: 'properties/new', element: <NewPropertyPage /> },
      { path: 'properties/:id', element: <PropertyDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
