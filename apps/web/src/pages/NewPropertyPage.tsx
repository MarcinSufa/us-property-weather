import { Link } from 'react-router';
import { PageTitle } from '../components/PageTitle.tsx';
import { PropertyForm } from '../components/PropertyForm.tsx';
import './NewPropertyPage.css';

export function NewPropertyPage() {
  return (
    <main className="page-frame page-frame--form new-property">
      <PageTitle page="Add property" />
      <div className="new-property__heading">
        <Link className="new-property__back" to="/">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 5-7 7 7 7" />
          </svg>
          <span>All properties</span>
        </Link>
        <h1 className="page-title">Add property</h1>
        <p className="text-muted">
          The weather at this address is looked up once, when you save, and stored with the
          property.
        </p>
      </div>
      <PropertyForm />
    </main>
  );
}
