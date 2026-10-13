import { PageTitle } from '../components/PageTitle.tsx';
import { PropertyForm } from '../components/PropertyForm.tsx';
import { BackToProperties } from '../components/BackToProperties.tsx';
import './NewPropertyPage.css';

export function NewPropertyPage() {
  return (
    <main className="page-frame page-frame--form new-property">
      <PageTitle page="Add property" />
      <div className="new-property__heading">
        <BackToProperties />
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
