import { useState } from 'react';
import { useQuery } from 'urql';
import { Link, useNavigate, useParams } from 'react-router';
import { BackToProperties } from '../components/BackToProperties.tsx';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { ErrorAlert } from '../components/ErrorAlert.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { WeatherCard } from '../components/WeatherCard.tsx';
import { PropertyDocument } from '../graphql/operations.ts';
import { formatDate } from '../formatters.ts';
import { US_STATES } from '../us-states.ts';
import './PropertyDetailPage.css';

function LoadingProperty() {
  return (
    <div className="card property-detail__loading" aria-busy="true">
      <p role="status">Loading property…</p>
      <div className="skeleton-bar property-detail__skeleton-title" aria-hidden="true" />
      <div className="skeleton-bar property-detail__skeleton-line" aria-hidden="true" />
      <div className="property-detail__skeleton-row" aria-hidden="true">
        <div className="skeleton-bar" />
        <div className="skeleton-bar" />
      </div>
      <div className="property-detail__skeleton-row" aria-hidden="true">
        <div className="skeleton-bar" />
        <div className="skeleton-bar" />
      </div>
      <div className="property-detail__skeleton-row" aria-hidden="true">
        <div className="skeleton-bar" />
        <div className="skeleton-bar" />
      </div>
      <div className="skeleton-bar property-detail__skeleton-highlight" aria-hidden="true" />
    </div>
  );
}

export function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [{ data, error, fetching }, executeQuery] = useQuery({
    query: PropertyDocument,
    variables: { id: id ?? '' },
  });
  const property = data?.property;

  return (
    <main className="page-frame property-detail">
      {fetching ? (
        <>
          <PageTitle page="Property" />
          <h1 className="page-title">Property details</h1>
          <LoadingProperty />
        </>
      ) : error ? (
        <>
          <PageTitle page="Property" />
          <h1 className="page-title">Property details</h1>
          <section className="card property-detail__load-error">
            <ErrorAlert
              title="Could not load this property"
              body="The server did not answer. Nothing was changed."
            />
            <div className="property-detail__load-actions">
              <button
                className="button button--secondary"
                type="button"
                onClick={() => executeQuery({ requestPolicy: 'network-only' })}
              >
                Try again
              </button>
              <BackToProperties />
            </div>
          </section>
        </>
      ) : property ? (
        <>
          <PageTitle page={property.street} />
          <div className="property-detail__heading">
            <div className="property-detail__heading-copy">
              <BackToProperties />
              <h1 className="page-title">{property.street}</h1>
              <p className="property-detail__address">
                {property.city}, {property.state}{' '}
                <span className="property-detail__zip">{property.zipCode}</span>
              </p>
            </div>
            <button
              className="button button--danger-outline"
              type="button"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete property
            </button>
          </div>
          <ConfirmDialog
            property={confirmingDelete ? { id: property.id, street: property.street } : null}
            onClose={() => setConfirmingDelete(false)}
            onDeleted={() => {
              void navigate('/');
            }}
          />
          <div className="property-detail__grid">
            <section className="card property-detail__card" aria-labelledby="property-card-title">
              <h2 id="property-card-title">Property</h2>
              <dl className="property-detail__fields">
                <dt>Street</dt>
                <dd>{property.street}</dd>
                <dt>City</dt>
                <dd>{property.city}</dd>
                <dt>State</dt>
                <dd>
                  {property.state} {US_STATES[property.state]}
                </dd>
                <dt>Zip code</dt>
                <dd className="property-detail__mono">{property.zipCode}</dd>
                <dt>Latitude</dt>
                <dd className="property-detail__mono">{property.lat}</dd>
                <dt>Longitude</dt>
                <dd className="property-detail__mono">{property.long}</dd>
                <dt>Created</dt>
                <dd>
                  <time dateTime={property.createdAt}>{formatDate(property.createdAt)}</time>
                </dd>
              </dl>
            </section>
            <WeatherCard weather={property.weatherData} createdAt={property.createdAt} />
          </div>
        </>
      ) : (
        <>
          <PageTitle page="Property not found" />
          <section className="card empty-state property-detail__empty">
            <h1>Property not found</h1>
            <p>It may have been deleted, or the link is wrong.</p>
            <Link className="button button--secondary" to="/">
              Back to all properties
            </Link>
          </section>
        </>
      )}
    </main>
  );
}
