import { Link } from 'react-router';
import { PageTitle } from '../components/PageTitle.tsx';

export function NotFoundPage() {
  return (
    <main className="page-frame">
      <PageTitle page="Page not found" />
      <section className="card empty-state">
        <h1 className="page-title">Page not found</h1>
        <p className="text-muted">The page you are looking for could not be found.</p>
        <Link className="button button--secondary" to="/">
          All properties
        </Link>
      </section>
    </main>
  );
}
